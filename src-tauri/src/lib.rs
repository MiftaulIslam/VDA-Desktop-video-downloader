mod binaries;
mod download;
mod metadata;
mod naming;
mod popup;
mod system;
mod tray;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use tauri::Manager;

/// Shared runtime state configurable from the frontend.
pub struct AppState {
    /// When true, closing the window hides it to the tray instead of exiting.
    pub close_to_tray: AtomicBool,
    /// URL currently offered by the clipboard popup window.
    pub clipboard_url: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            close_to_tray: AtomicBool::new(true),
            clipboard_url: Mutex::new(None),
        }
    }
}

/// Toggle whether closing the window hides to tray or quits the app.
#[tauri::command]
fn set_close_to_tray(state: tauri::State<'_, AppState>, enabled: bool) {
    state.close_to_tray.store(enabled, Ordering::Relaxed);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .manage(download::DownloadRegistry::default())
        .manage(AppState::default())
        .setup(|app| {
            tray::build_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                if state.close_to_tray.load(Ordering::Relaxed) {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            metadata::analyze,
            metadata::fetch_metadata,
            metadata::fetch_playlist_sizes,
            naming::resolve_output_path,
            download::download_format,
            download::pause_download,
            download::cancel_download,
            system::open_file,
            tray::set_tray_state,
            set_close_to_tray,
            popup::show_clipboard_popup,
            popup::get_clipboard_url,
            popup::close_clipboard_popup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
