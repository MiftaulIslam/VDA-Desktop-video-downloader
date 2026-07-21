mod binaries;
mod download;
mod metadata;
mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            metadata::fetch_metadata,
            download::download_format,
            system::open_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
