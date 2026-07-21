export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** True when the URL points at YouTube (video, playlist, or short link). */
export function isYoutubeUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

/**
 * Whether a URL is a playlist (mirrors the Rust `is_playlist_url`). A bare
 * `watch?v=…&list=…` or `/shorts/…` is treated as a single video.
 */
export function isPlaylistUrl(value: string): boolean {
  const url = value.trim();
  const hasList = url.includes("list=");
  const isSingleVideo =
    url.includes("watch?v=") ||
    url.includes("/shorts/") ||
    url.includes("youtu.be/");
  return (url.includes("/playlist") && hasList) || (hasList && !isSingleVideo);
}
