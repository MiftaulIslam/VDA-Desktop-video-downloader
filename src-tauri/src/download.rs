use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;
use std::process::{Child, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
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
    Paused,
    Cancelled,
    Done {
        path: String,
    },
    Error {
        message: String,
    },
}

// ---- Process registry (for pause / cancel) ----

#[derive(Clone, Copy, PartialEq)]
enum Intent {
    Running,
    Paused,
    Cancelled,
}

struct JobHandle {
    child: Child,
    intent: Intent,
}

type Jobs = Arc<Mutex<HashMap<String, JobHandle>>>;

/// Tracks running child processes so downloads can be paused/cancelled.
#[derive(Clone, Default)]
pub struct DownloadRegistry {
    jobs: Jobs,
}

fn parse_u64(s: &str) -> u64 {
    s.trim().parse::<u64>().unwrap_or(0)
}

fn parse_f64_opt(s: &str) -> Option<f64> {
    s.trim().parse::<f64>().ok()
}

fn parse_u64_opt(s: &str) -> Option<u64> {
    s.trim().parse::<f64>().ok().map(|v| v.round() as u64)
}

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

/// Build the yt-dlp `-f` selector. Returns `(selector, will_merge)`.
fn build_format_arg(
    format_id: &str,
    kind: &str,
    needs_mux: bool,
    max_height: Option<u32>,
) -> (String, bool) {
    if kind == "audio" {
        if max_height.is_some() || format_id.is_empty() {
            return ("bestaudio[ext=m4a]/bestaudio/best".to_string(), false);
        }
        return (format_id.to_string(), false);
    }

    if let Some(h) = max_height {
        return (
            format!("bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"),
            true,
        );
    }
    if needs_mux {
        return (
            format!("{id}+bestaudio[ext=m4a]/{id}+bestaudio/best", id = format_id),
            true,
        );
    }
    (format_id.to_string(), false)
}

/// Remove a cancelled download's output and intermediate/partial files.
fn cleanup_partials(output_path: &str) {
    let path = Path::new(output_path);
    let _ = std::fs::remove_file(path);
    if let (Some(dir), Some(stem)) = (
        path.parent(),
        path.file_stem().and_then(|s| s.to_str()),
    ) {
        let prefix = format!("{stem}.");
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.starts_with(&prefix) {
                        let _ = std::fs::remove_file(entry.path());
                    }
                }
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn run(
    id: String,
    url: String,
    format_id: String,
    kind: String,
    needs_mux: bool,
    max_height: Option<u32>,
    output_path: String,
    jobs: Jobs,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let (format_arg, will_merge) =
        build_format_arg(&format_id, &kind, needs_mux, max_height);
    let ffmpeg_loc = binaries::ffmpeg_location();

    let mut cmd = binaries::command(binaries::yt_dlp());
    cmd.args(["-f", &format_arg])
        .args(["--no-playlist", "--no-warnings", "--newline", "--continue"])
        .args([
            "--progress-template",
            "download:DLP@@%(progress.downloaded_bytes)s@@%(progress.total_bytes)s@@%(progress.total_bytes_estimate)s@@%(progress.speed)s@@%(progress.eta)s@@%(info.format_id)s",
        ])
        .arg("--ffmpeg-location")
        .arg(&ffmpeg_loc)
        .args(["-o", &output_path]);

    if will_merge {
        cmd.args(["--merge-output-format", "mp4"]);
    }

    cmd.arg(&url).stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start yt-dlp: {e}"))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let stderr = child.stderr.take().ok_or("No stderr")?;

    // Register the running process so it can be paused/cancelled.
    if let Ok(mut map) = jobs.lock() {
        map.insert(
            id.clone(),
            JobHandle {
                child,
                intent: Intent::Running,
            },
        );
    }

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

    // Reclaim the child (readers have hit EOF = process exited or was killed).
    let handle = jobs.lock().ok().and_then(|mut m| m.remove(&id));
    let (mut child, intent) = match handle {
        Some(h) => (h.child, h.intent),
        None => return Ok(()),
    };
    let status = child.wait().map_err(|e| format!("yt-dlp failed: {e}"))?;

    match intent {
        Intent::Paused => {
            let _ = on_event.send(DownloadEvent::Paused);
            Ok(())
        }
        Intent::Cancelled => {
            cleanup_partials(&output_path);
            let _ = on_event.send(DownloadEvent::Cancelled);
            Ok(())
        }
        Intent::Running => {
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
    }
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
pub async fn download_format(
    id: String,
    url: String,
    format_id: String,
    kind: String,
    needs_mux: bool,
    max_height: Option<u32>,
    output_path: String,
    registry: tauri::State<'_, DownloadRegistry>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let jobs = registry.jobs.clone();
    tauri::async_runtime::spawn_blocking(move || {
        run(
            id,
            url,
            format_id,
            kind,
            needs_mux,
            max_height,
            output_path,
            jobs,
            on_event,
        )
    })
    .await
    .map_err(|e| format!("Task failed: {e}"))?
}

#[tauri::command]
pub fn pause_download(id: String, registry: tauri::State<'_, DownloadRegistry>) {
    if let Ok(mut map) = registry.jobs.lock() {
        if let Some(h) = map.get_mut(&id) {
            h.intent = Intent::Paused;
            let _ = h.child.kill();
        }
    }
}

#[tauri::command]
pub fn cancel_download(id: String, registry: tauri::State<'_, DownloadRegistry>) {
    if let Ok(mut map) = registry.jobs.lock() {
        if let Some(h) = map.get_mut(&id) {
            h.intent = Intent::Cancelled;
            let _ = h.child.kill();
        }
    }
}
