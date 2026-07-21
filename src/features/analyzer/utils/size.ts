import type { QualityPreset } from "../../downloader";
import type { EntrySizes } from "../types";

/** Human-readable byte size, e.g. "1.2 GB". */
export function humanSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${bytes} B` : `${size.toFixed(1)} ${units[unit]}`;
}

/** Download size for one entry at the given quality preset (null if unknown). */
export function bytesForPreset(
  entry: EntrySizes | undefined,
  preset: QualityPreset,
): number | null {
  if (!entry) return null;
  if (preset.kind === "audio") return entry.audio;
  if (!entry.video.length) return null;
  const max = preset.maxHeight ?? Infinity;
  // Entries are sorted largest-first, so the first at or below the cap wins;
  // if every track is above the cap, fall back to the smallest available.
  const pick =
    entry.video.find((v) => v.height <= max) ??
    entry.video[entry.video.length - 1];
  return pick?.bytes ?? null;
}

export interface SizeEstimate {
  bytes: number;
  /** Entries with a known size. */
  known: number;
  /** Entries whose size could not (yet) be resolved. */
  unknown: number;
}

/** Aggregate estimated size across a set of entry urls at a preset. */
export function estimateTotal(
  urls: string[],
  sizes: Record<string, EntrySizes>,
  preset: QualityPreset,
): SizeEstimate {
  let bytes = 0;
  let known = 0;
  let unknown = 0;
  for (const url of urls) {
    const b = bytesForPreset(sizes[url], preset);
    if (b == null) {
      unknown += 1;
    } else {
      bytes += b;
      known += 1;
    }
  }
  return { bytes, known, unknown };
}
