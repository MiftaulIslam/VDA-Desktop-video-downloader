export const DEFAULT_TEMPLATE = "%(uploader)s - %(title)s";

/**
 * Expand a filename template for preview / save-dialog defaults. Mirrors the
 * Rust `expand_template`; the backend remains the source of truth for the
 * actual on-disk name and de-duplication.
 */
export function expandTemplate(
  template: string,
  title: string,
  uploader?: string,
): string {
  const up = uploader ?? "";
  let out = template.replace(/%\(title\)s/g, title).replace(/%\(uploader\)s/g, up);
  if (!up) {
    out = out.trim().replace(/^\s*-\s*/, "");
  }
  return out.replace(/\s+/g, " ").trim() || "video";
}
