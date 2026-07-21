/** Turn a video title into a safe cross-platform file name (no extension). */
export function sanitizeFilename(title: string): string {
  const cleaned = title
    // Strip characters that are illegal in Windows/macOS/Linux file names.
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 120) || "video";
}
