export function formatSpeed(bytesPerSec: number | null): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let value = bytesPerSec;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function formatEta(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

export function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatClock(epochMs: number | null): string {
  if (epochMs == null) return "—";
  return new Date(epochMs).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Parent folder of a file path (Windows or POSIX). */
export function folderOf(path: string | null): string {
  if (!path) return "—";
  const idx = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  return idx > 0 ? path.slice(0, idx) : path;
}

export function stageLabel(
  stage: "video" | "audio" | "merging" | null,
): string {
  switch (stage) {
    case "video":
    case "audio":
      return "Downloading";
    case "merging":
      return "Processing";
    default:
      return "Preparing";
  }
}
