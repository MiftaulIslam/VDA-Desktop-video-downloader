use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::binaries;

// ---- Raw yt-dlp JSON (partial) ----

#[derive(Deserialize)]
struct YtFormat {
    format_id: Option<String>,
    ext: Option<String>,
    height: Option<u32>,
    fps: Option<f64>,
    vcodec: Option<String>,
    acodec: Option<String>,
    abr: Option<f64>,
    filesize: Option<u64>,
    filesize_approx: Option<u64>,
    tbr: Option<f64>,
}

impl YtFormat {
    fn size(&self) -> Option<u64> {
        self.filesize.or(self.filesize_approx)
    }
    fn has_video(&self) -> bool {
        self.height.is_some() && self.vcodec.as_deref().unwrap_or("none") != "none"
    }
    fn is_audio_only(&self) -> bool {
        self.vcodec.as_deref().unwrap_or("none") == "none"
            && self.acodec.as_deref().unwrap_or("none") != "none"
    }
    fn has_audio(&self) -> bool {
        self.acodec.as_deref().unwrap_or("none") != "none"
    }
}

#[derive(Deserialize)]
struct YtDump {
    title: Option<String>,
    thumbnail: Option<String>,
    duration: Option<f64>,
    duration_string: Option<String>,
    uploader: Option<String>,
    view_count: Option<u64>,
    #[serde(default)]
    formats: Vec<YtFormat>,
}

// ---- Shape returned to the frontend ----

#[derive(Serialize)]
pub struct FormatOption {
    id: String,
    label: String,
    ext: String,
    filesize: Option<String>,
    detail: Option<String>,
    /// Video-only stream that must be muxed with an audio track on download.
    needs_mux: bool,
}

#[derive(Serialize)]
pub struct VideoMeta {
    title: String,
    thumbnail: String,
    duration: String,
    uploader: String,
    view_count: Option<u64>,
    video_formats: Vec<FormatOption>,
    audio_formats: Vec<FormatOption>,
}

fn human_size(bytes: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut size = bytes as f64;
    let mut unit = 0;
    while size >= 1024.0 && unit < UNITS.len() - 1 {
        size /= 1024.0;
        unit += 1;
    }
    if unit == 0 {
        format!("{} {}", bytes, UNITS[unit])
    } else {
        format!("{:.1} {}", size, UNITS[unit])
    }
}

fn format_duration(secs: f64) -> String {
    let total = secs.round() as u64;
    let h = total / 3600;
    let m = (total % 3600) / 60;
    let s = total % 60;
    if h > 0 {
        format!("{}:{:02}:{:02}", h, m, s)
    } else {
        format!("{}:{:02}", m, s)
    }
}

fn build_meta(dump: YtDump) -> VideoMeta {
    // Best video format per resolution (prefer mp4, then higher bitrate).
    let mut best_by_height: HashMap<u32, &YtFormat> = HashMap::new();
    for f in &dump.formats {
        if !f.has_video() {
            continue;
        }
        let h = f.height.unwrap();
        match best_by_height.get(&h) {
            None => {
                best_by_height.insert(h, f);
            }
            Some(cur) => {
                let cur_mp4 = cur.ext.as_deref() == Some("mp4");
                let new_mp4 = f.ext.as_deref() == Some("mp4");
                let better = (new_mp4 && !cur_mp4)
                    || (new_mp4 == cur_mp4 && f.tbr.unwrap_or(0.0) > cur.tbr.unwrap_or(0.0));
                if better {
                    best_by_height.insert(h, f);
                }
            }
        }
    }

    let mut heights: Vec<u32> = best_by_height.keys().copied().collect();
    heights.sort_unstable_by(|a, b| b.cmp(a));

    let video_formats: Vec<FormatOption> = heights
        .iter()
        .map(|h| {
            let f = best_by_height[h];
            let detail = f
                .fps
                .filter(|v| *v >= 50.0)
                .map(|v| format!("{}fps", v.round()));
            FormatOption {
                id: f.format_id.clone().unwrap_or_default(),
                label: format!("{}p", h),
                ext: f.ext.clone().unwrap_or_else(|| "mp4".into()),
                filesize: f.size().map(human_size),
                detail,
                needs_mux: !f.has_audio(),
            }
        })
        .collect();

    // Best audio format per bitrate bucket (prefer larger file at same bitrate).
    let mut best_by_abr: HashMap<u32, &YtFormat> = HashMap::new();
    for f in &dump.formats {
        if !f.is_audio_only() {
            continue;
        }
        let abr = f.abr.unwrap_or(0.0).round() as u32;
        if abr == 0 {
            continue;
        }
        match best_by_abr.get(&abr) {
            None => {
                best_by_abr.insert(abr, f);
            }
            Some(cur) => {
                if f.size().unwrap_or(0) > cur.size().unwrap_or(0) {
                    best_by_abr.insert(abr, f);
                }
            }
        }
    }

    let mut abrs: Vec<u32> = best_by_abr.keys().copied().collect();
    abrs.sort_unstable_by(|a, b| b.cmp(a));

    let audio_formats: Vec<FormatOption> = abrs
        .iter()
        .map(|abr| {
            let f = best_by_abr[abr];
            FormatOption {
                id: f.format_id.clone().unwrap_or_default(),
                label: format!("{}kbps", abr),
                ext: f.ext.clone().unwrap_or_else(|| "m4a".into()),
                filesize: f.size().map(human_size),
                detail: Some("audio".into()),
                needs_mux: false,
            }
        })
        .collect();

    let duration = dump
        .duration_string
        .clone()
        .or_else(|| dump.duration.map(format_duration))
        .unwrap_or_else(|| "—".into());

    VideoMeta {
        title: dump.title.unwrap_or_else(|| "Untitled".into()),
        thumbnail: dump.thumbnail.unwrap_or_default(),
        duration,
        uploader: dump.uploader.unwrap_or_default(),
        view_count: dump.view_count,
        video_formats,
        audio_formats,
    }
}

#[tauri::command]
pub async fn fetch_metadata(url: String) -> Result<VideoMeta, String> {
    let url = url.trim().to_string();
    if url.is_empty() {
        return Err("No URL provided.".into());
    }

    let output = tauri::async_runtime::spawn_blocking(move || {
        binaries::command(binaries::yt_dlp())
            .args([
                "--dump-single-json",
                "--no-playlist",
                "--no-warnings",
                &url,
            ])
            .output()
    })
    .await
    .map_err(|e| format!("Task failed: {e}"))?
    .map_err(|e| format!("Failed to run yt-dlp: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let msg = stderr
            .lines()
            .find(|l| l.contains("ERROR"))
            .unwrap_or("yt-dlp could not process this URL.")
            .to_string();
        return Err(msg);
    }

    let dump: YtDump = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Could not parse video info: {e}"))?;

    Ok(build_meta(dump))
}
