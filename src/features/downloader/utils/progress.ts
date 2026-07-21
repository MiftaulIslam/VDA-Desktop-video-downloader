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
