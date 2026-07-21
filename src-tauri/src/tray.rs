use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

const TRAY_ID: &str = "main";

#[derive(Clone, Copy)]
pub enum TrayState {
    Idle,
    Downloading,
    Error,
}

fn state_color(state: TrayState) -> [u8; 3] {
    match state {
        TrayState::Idle => [124, 124, 132],
        TrayState::Downloading => [59, 130, 246],
        TrayState::Error => [239, 68, 68],
    }
}

/// Build a simple filled-circle tray icon in the state's color. Generated at
/// runtime so no per-state icon files need to ship.
fn state_icon(state: TrayState) -> Image<'static> {
    const SIZE: u32 = 32;
    let [r, g, b] = state_color(state);
    let mut rgba = vec![0u8; (SIZE * SIZE * 4) as usize];
    let center = SIZE as f32 / 2.0;
    let radius = 13.0;
    for y in 0..SIZE {
        for x in 0..SIZE {
            let dx = x as f32 + 0.5 - center;
            let dy = y as f32 + 0.5 - center;
            let dist = (dx * dx + dy * dy).sqrt();
            let i = ((y * SIZE + x) * 4) as usize;
            if dist <= radius {
                rgba[i] = r;
                rgba[i + 1] = g;
                rgba[i + 2] = b;
                rgba[i + 3] = 255;
            } else if dist <= radius + 1.0 {
                // Soft edge for anti-aliasing.
                let a = ((radius + 1.0 - dist) * 255.0) as u8;
                rgba[i] = r;
                rgba[i + 1] = g;
                rgba[i + 2] = b;
                rgba[i + 3] = a;
            }
        }
    }
    Image::new_owned(rgba, SIZE, SIZE)
}

/// Bring the main window to the foreground (from hidden or minimized).
fn show_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Create the system tray icon and its context menu.
pub fn build_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
    let downloads =
        MenuItem::with_id(app, "downloads", "Current Downloads", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause_all", "Pause All", true, None::<&str>)?;
    let resume = MenuItem::with_id(app, "resume_all", "Resume All", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let exit = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[&open, &downloads, &pause, &resume, &settings, &sep, &exit],
    )?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(state_icon(TrayState::Idle))
        .tooltip("vda")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "downloads" => {
                show_main(app);
                let _ = app.emit("tray://open-downloads", ());
            }
            "pause_all" => {
                let _ = app.emit("tray://pause-all", ());
            }
            "resume_all" => {
                let _ = app.emit("tray://resume-all", ());
            }
            "settings" => {
                show_main(app);
                let _ = app.emit("tray://settings", ());
            }
            "exit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// Swap the tray icon to reflect the current download activity.
#[tauri::command]
pub fn set_tray_state<R: Runtime>(app: AppHandle<R>, state: String) {
    let tray_state = match state.as_str() {
        "downloading" => TrayState::Downloading,
        "error" => TrayState::Error,
        _ => TrayState::Idle,
    };
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_icon(Some(state_icon(tray_state)));
    }
}
