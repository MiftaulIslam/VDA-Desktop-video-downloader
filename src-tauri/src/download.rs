use std::io::{BufRead, BufReader, Read};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

use serde::Serialize;
use tauri::ipc::Channel;

use crate::binaries;

/// Streamed to the frontend over an IPC channel as the download progresses.
#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum DownloadEvent {
    Progress {
        stage: String, // "video" | "audio"
        percent: f64,
        downloaded: u64,
        total: u64,
        speed: Option<f64>,
        eta: Option<u64>,
    },
    Merging,
    Done {
        path: String,
    },
    Error {
        message: String,
    },
}

fn parse_u64(s: &str) -> u64 {
    s.trim().parse::<u64>().unwrap_or(0)
}

fn parse_f64_opt(s: &str) -> Option<f64> {
    s.trim().parse::<f64>().ok()
}

fn parse_u64_opt(s: &str) -> Option<u64> {
    s.trim()
        .parse::<f64>()
        .ok()
        .map(|v| v.round() as u64)
}

/// Parse a single yt-dlp output line and emit the matching event.
///
/// `video_id` is the requested video format id; a progress line whose format
/// id matches it is the video stream. For audio-only downloads `is_audio`
/// forces every line to the "audio" stage.
fn handle_line(
    line: &str,
    on_event: &Channel<DownloadEvent>,
    video_id: &str,
    is_audio: bool,
    merged: &AtomicBool,
) {
    if let Some(rest) = line.strip_prefix("DLP@@") {
        let p: Vec<&str> = rest.split("@@").collect();
        if p.len() >= 6 {
            let downloaded = parse_u64(p[0]);
            let total = {
                let t = parse_u64(p[1]);
                if t > 0 {
                    t
                } else {
                    parse_u64(p[2])
                }
            };
            let percent = if total > 0 {
                (downloaded as f64 / total as f64 * 100.0).min(100.0)
            } else {
                0.0
            };
            let stage = if is_audio {
                "audio"
            } else if p[5].trim() == video_id {
                "video"
            } else {
                "audio"
            };
            let _ = on_event.send(DownloadEvent::Progress {
                stage: stage.to_string(),
                percent,
                downloaded,
                total,
                speed: parse_f64_opt(p[3]),
                eta: parse_u64_opt(p[4]),
            });
        }
    } else if line.contains("Merging formats into") {
        if !merged.swap(true, Ordering::SeqCst) {
            let _ = on_event.send(DownloadEvent::Merging);
        }
    }
}

/// Read a child pipe to EOF, handling each line. Returns the raw text so the
/// caller can extract an error message on failure.
fn drain<R: Read>(
    reader: R,
    on_event: Channel<DownloadEvent>,
    video_id: String,
    is_audio: bool,
    merged: Arc<AtomicBool>,
) -> String {
    let mut collected = String::new();
    let buf = BufReader::new(reader);
    for line in buf.lines().map_while(Result::ok) {
        handle_line(&line, &on_event, &video_id, is_audio, &merged);
        collected.push_str(&line);
        collected.push('\n');
    }
    collected
}

fn build_format_arg(format_id: &str, kind: &str, needs_mux: bool) -> String {
    if kind == "video" && needs_mux {
        // Video-only stream: mux with the best matching audio track.
        format!("{id}+bestaudio[ext=m4a]/{id}+bestaudio/best", id = format_id)
    } else {
        format_id.to_string()
    }
}

fn run(
    url: String,
    format_id: String,
    kind: String,
    needs_mux: bool,
    output_path: String,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let format_arg = build_format_arg(&format_id, &kind, needs_mux);
    let ffmpeg_loc = binaries::ffmpeg_location();

    let mut cmd = binaries::command(binaries::yt_dlp());
    cmd.args(["-f", &format_arg])
        .args(["--no-playlist", "--no-warnings", "--newline"])
        .args([
            "--progress-template",
            "download:DLP@@%(progress.downloaded_bytes)s@@%(progress.total_bytes)s@@%(progress.total_bytes_estimate)s@@%(progress.speed)s@@%(progress.eta)s@@%(info.format_id)s",
        ])
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_loc)
        .args(["-o", &output_path]);

    if kind == "video" && needs_mux {
        cmd.args(["--merge-output-format", "mp4"]);
    }

    cmd.arg(&url).stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start yt-dlp: {e}"))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;

    let merged = Arc::new(AtomicBool::new(false));
    let is_audio = kind == "audio";

    let out_handle = {
        let ev = on_event.clone();
        let vid = format_id.clone();
        let m = merged.clone();
        thread::spawn(move || drain(stdout, ev, vid, is_audio, m))
    };
    let err_handle = {
        let ev = on_event.clone();
        let vid = format_id.clone();
        let m = merged.clone();
        thread::spawn(move || drain(stderr, ev, vid, is_audio, m))
    };

    let out_text = out_handle.join().unwrap_or_default();
    let err_text = err_handle.join().unwrap_or_default();

    let status = child
        .wait()
        .map_err(|e| format!("yt-dlp failed: {e}"))?;

    if status.success() {
        let _ = on_event.send(DownloadEvent::Done {
            path: output_path.clone(),
        });
        Ok(())
    } else {
        let message = err_text
            .lines()
            .chain(out_text.lines())
            .rev()
            .find(|l| l.contains("ERROR"))
            .map(|l| l.trim().to_string())
            .unwrap_or_else(|| "Download failed.".to_string());
        let _ = on_event.send(DownloadEvent::Error {
            message: message.clone(),
        });
        Err(message)
    }
}

#[tauri::command]
pub async fn download_format(
    url: String,
    format_id: String,
    kind: String,
    needs_mux: bool,
    output_path: String,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        run(url, format_id, kind, needs_mux, output_path, on_event)
    })
    .await
    .map_err(|e| format!("Task failed: {e}"))?
}
