import { Channel, invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { DownloadEvent, SaveTarget } from "../types";

/**
 * Data-access boundary for the downloader feature. Every call into the
 * Tauri runtime (IPC command, native dialog, OS opener) lives here so the
 * hook and components depend on these functions, not on `@tauri-apps/*`.
 */

export interface StartDownloadArgs {
  url: string;
  formatId: string;
  kind: "video" | "audio";
  needsMux: boolean;
  maxHeight?: number;
  outputPath: string;
  onEvent: (event: DownloadEvent) => void;
}

/** Ask the user where to save; returns null if the dialog was cancelled. */
export async function chooseSavePath(
  defaultName: string,
  ext: string,
): Promise<string | null> {
  const path = await save({
    defaultPath: `${defaultName}.${ext}`,
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  return path ?? null;
}

/**
 * Resolve the output path for a download. Prompts with a save dialog when the
 * user opted to be asked each time (or no default destination is set),
 * otherwise writes straight into the configured destination folder.
 * Returns null if the user cancelled.
 */
export async function resolveOutputPath(
  defaultName: string,
  ext: string,
  target: SaveTarget,
): Promise<string | null> {
  if (target.askEachTime || !target.destination) {
    return chooseSavePath(defaultName, ext);
  }
  return join(target.destination, `${defaultName}.${ext}`);
}

export async function startDownload(args: StartDownloadArgs): Promise<void> {
  const channel = new Channel<DownloadEvent>();
  channel.onmessage = args.onEvent;

  await invoke("download_format", {
    url: args.url,
    formatId: args.formatId,
    kind: args.kind,
    needsMux: args.needsMux,
    maxHeight: args.maxHeight ?? null,
    outputPath: args.outputPath,
    onEvent: channel,
  });
}

export async function openFile(path: string): Promise<void> {
  await invoke("open_file", { path });
}

export async function revealFile(path: string): Promise<void> {
  await revealItemInDir(path);
}
