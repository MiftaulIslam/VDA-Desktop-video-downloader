use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Prevents a console window from flashing when we spawn a child process.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Common yt-dlp args applied to every call: retries and request throttling to
/// avoid bot detection.
pub fn common_args() -> Vec<String> {
    vec![
        "--retries".into(),
        "5".into(),
        "--fragment-retries".into(),
        "5".into(),
        "--extractor-retries".into(),
        "3".into(),
        "--sleep-requests".into(),
        "1".into(),
        // Querying ios/android alongside `default` guarantees a downloadable
        // format is found and keeps analyze/download consistent.
        "--extractor-args".into(),
        "youtube:player_client=default,ios,android".into(),
    ]
}

/// Directory that holds the bundled binaries.
///
/// In development this is `src-tauri/binaries` (baked in at compile time via
/// `CARGO_MANIFEST_DIR`). In a packaged build that path won't exist on the
/// user's machine, so we fall back to the directory next to the app
/// executable, where Tauri places `externalBin` binaries.
fn binaries_dir() -> PathBuf {
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries");
    if dev.exists() {
        return dev;
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.to_path_buf();
        }
    }
    dev
}

/// Resolve a bundled binary, tolerating both the dev name (target-triple
/// suffixed) and the packaged name (plain).
fn resolve(plain: &str, dev_suffixed: &str) -> PathBuf {
    let dir = binaries_dir();
    let suffixed = dir.join(dev_suffixed);
    if suffixed.exists() {
        return suffixed;
    }
    dir.join(plain)
}

pub fn yt_dlp() -> PathBuf {
    resolve("yt-dlp.exe", "yt-dlp-x86_64-pc-windows-msvc.exe")
}

pub fn ffmpeg() -> PathBuf {
    resolve("ffmpeg.exe", "ffmpeg-x86_64-pc-windows-msvc.exe")
}

/// Directory containing ffmpeg + ffprobe, for yt-dlp's `--ffmpeg-location`.
pub fn ffmpeg_location() -> PathBuf {
    ffmpeg()
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(binaries_dir)
}

/// A `Command` for the given bundled program with the console window hidden.
pub fn command(path: PathBuf) -> Command {
    let mut cmd = Command::new(path);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}
