import { invoke } from "@tauri-apps/api/core";
import type { VideoMeta } from "../types";

/**
 * Data-access boundary for the analyzer feature.
 *
 * Isolates the Tauri IPC call so the rest of the feature depends on this
 * abstraction rather than on `@tauri-apps/api` directly. Swapping the
 * backend (mock, HTTP, different command) only touches this file.
 */
export async function fetchMetadata(url: string): Promise<VideoMeta> {
  return invoke<VideoMeta>("fetch_metadata", { url });
}
