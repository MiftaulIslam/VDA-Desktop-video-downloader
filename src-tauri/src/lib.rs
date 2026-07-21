mod binaries;
mod download;
mod metadata;
mod naming;
mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(download::DownloadRegistry::default())
        .invoke_handler(tauri::generate_handler![
            metadata::analyze,
            metadata::fetch_metadata,
            naming::resolve_output_path,
            download::download_format,
            download::pause_download,
            download::cancel_download,
            system::open_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
