import { invoke } from "@tauri-apps/api/core";
import type { AnalyzeResult, VideoMeta } from "../types";

/**
 * Data-access boundary for the analyzer feature.
 *
 * Isolates the Tauri IPC calls so the rest of the feature depends on these
 * abstractions rather than on `@tauri-apps/api` directly.
 */

/** Analyze any URL — resolves to a single video or a playlist listing. */
export async function analyze(url: string): Promise<AnalyzeResult> {
  return invoke<AnalyzeResult>("analyze", { url });
}

/** Full metadata for one video (used to lazily load a playlist entry). */
export async function fetchMetadata(url: string): Promise<VideoMeta> {
  return invoke<VideoMeta>("fetch_metadata", { url });
}
