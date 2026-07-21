import { Channel, invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { DownloadEvent } from "../types";

/**
 * Data-access boundary for the downloader feature. Every call into the Tauri
 * runtime (IPC command, native dialog, OS opener) lives here.
 */

export interface StartDownloadArgs {
  id: string;
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

export interface ResolveOutputArgs {
  destination: string;
  template: string;
  title: string;
  uploader: string | null;
  ext: string;
  explicit?: string | null;
}

/** Backend-resolved final path (template expansion + auto-rename on collision). */
export async function resolveOutput(args: ResolveOutputArgs): Promise<string> {
  return invoke<string>("resolve_output_path", {
    destination: args.destination,
    template: args.template,
    title: args.title,
    uploader: args.uploader,
    ext: args.ext,
    explicit: args.explicit ?? null,
  });
}

export async function startDownload(args: StartDownloadArgs): Promise<void> {
  const channel = new Channel<DownloadEvent>();
  channel.onmessage = args.onEvent;

  await invoke("download_format", {
    id: args.id,
    url: args.url,
    formatId: args.formatId,
    kind: args.kind,
    needsMux: args.needsMux,
    maxHeight: args.maxHeight ?? null,
    outputPath: args.outputPath,
    onEvent: channel,
  });
}

export async function pauseDownload(id: string): Promise<void> {
  await invoke("pause_download", { id });
}

export async function cancelDownload(id: string): Promise<void> {
  await invoke("cancel_download", { id });
}

export async function openFile(path: string): Promise<void> {
  await invoke("open_file", { path });
}

export async function revealFile(path: string): Promise<void> {
  await revealItemInDir(path);
}
