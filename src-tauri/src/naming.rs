use std::path::Path;

/// Expand a filename template. Supports `%(title)s` and `%(uploader)s`.
/// When the uploader is empty, dangling separators are cleaned up.
fn expand_template(template: &str, title: &str, uploader: &str) -> String {
    let mut out = template
        .replace("%(title)s", title)
        .replace("%(uploader)s", uploader);

    if uploader.is_empty() {
        // Collapse a leading/trailing " - " left by an empty uploader.
        out = out.trim().to_string();
        for sep in [" - ", "- ", " -"] {
            if let Some(stripped) = out.strip_prefix(sep) {
                out = stripped.to_string();
            }
        }
    }
    out.trim().to_string()
}

/// Strip characters that are illegal in file names on Windows/macOS/Linux.
fn sanitize(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .filter(|c| !matches!(c, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'))
        .filter(|c| !c.is_control())
        .collect();
    let cleaned = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");
    let cleaned = cleaned.trim().to_string();
    let truncated: String = cleaned.chars().take(150).collect();
    if truncated.is_empty() {
        "video".to_string()
    } else {
        truncated
    }
}

/// Resolve the final output path for a download.
///
/// When `explicit` is provided (user picked a path via the save dialog) it is
/// returned verbatim. Otherwise the template is expanded, sanitized, joined to
/// the destination, and auto-renamed with a counter if the file already exists.
#[tauri::command]
pub fn resolve_output_path(
    destination: String,
    template: String,
    title: String,
    uploader: Option<String>,
    ext: String,
    explicit: Option<String>,
) -> Result<String, String> {
    if let Some(path) = explicit {
        return Ok(path);
    }

    let name = sanitize(&expand_template(
        &template,
        &title,
        uploader.as_deref().unwrap_or(""),
    ));

    let dir = Path::new(&destination);
    let mut candidate = dir.join(format!("{name}.{ext}"));
    let mut n = 1;
    while candidate.exists() {
        candidate = dir.join(format!("{name} ({n}).{ext}"));
        n += 1;
    }
    Ok(candidate.to_string_lossy().to_string())
}
