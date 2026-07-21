/// Open a file with the OS default application (e.g. the default video
/// player). Uses `ShellExecute`-style launching under the hood, which is
/// not subject to the opener plugin's path scope.
#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| format!("Could not open file: {e}"))
}
