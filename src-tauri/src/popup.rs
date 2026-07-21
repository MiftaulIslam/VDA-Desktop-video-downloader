use tauri::{
    AppHandle, Emitter, LogicalPosition, Manager, Runtime, WebviewUrl, WebviewWindowBuilder,
};

use crate::AppState;

const POPUP_LABEL: &str = "clip-popup";
const POPUP_W: f64 = 340.0;
const POPUP_H: f64 = 96.0;

/// Show (or create) the small always-on-top "download this?" popup and load it
/// with the given URL. Positioned near the bottom-right of the primary display.
#[tauri::command]
pub async fn show_clipboard_popup<R: Runtime>(
    app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    url: String,
) -> Result<(), String> {
    if let Ok(mut pending) = state.clipboard_url.lock() {
        *pending = Some(url.clone());
    }

    if let Some(win) = app.get_webview_window(POPUP_LABEL) {
        let _ = win.emit("clip://url", &url);
        let _ = win.show();
        let _ = win.set_focus();
        return Ok(());
    }

    let win = WebviewWindowBuilder::new(
        &app,
        POPUP_LABEL,
        WebviewUrl::App("index.html#clip".into()),
    )
    .title("Download?")
    .inner_size(POPUP_W, POPUP_H)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    if let Ok(Some(monitor)) = win.current_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size();
        let mon_w = size.width as f64 / scale;
        let mon_h = size.height as f64 / scale;
        let x = mon_w - POPUP_W - 24.0;
        let y = mon_h - POPUP_H - 72.0;
        let _ = win.set_position(LogicalPosition::new(x, y));
    }

    let _ = win.show();
    Ok(())
}

/// The URL the popup should offer to download (read on popup mount).
#[tauri::command]
pub fn get_clipboard_url(state: tauri::State<'_, AppState>) -> Option<String> {
    state.clipboard_url.lock().ok().and_then(|u| u.clone())
}

/// Hide the clipboard popup window.
#[tauri::command]
pub fn close_clipboard_popup<R: Runtime>(app: AppHandle<R>) {
    if let Some(win) = app.get_webview_window(POPUP_LABEL) {
        let _ = win.hide();
    }
}
