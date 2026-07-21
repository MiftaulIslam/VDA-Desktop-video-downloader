import { invoke } from "@tauri-apps/api/core";
import { readText } from "@tauri-apps/plugin-clipboard-manager";

/** Read the clipboard's plain text, or "" if empty/unavailable. */
export async function readClipboardText(): Promise<string> {
  try {
    return (await readText()) ?? "";
  } catch {
    return "";
  }
}

/** Show the floating "download this?" popup window for a URL. */
export async function showClipboardPopup(url: string): Promise<void> {
  await invoke("show_clipboard_popup", { url });
}

/** The URL the popup should offer (read on popup mount). */
export async function getClipboardUrl(): Promise<string | null> {
  return invoke<string | null>("get_clipboard_url");
}

/** Hide the floating popup window. */
export async function closeClipboardPopup(): Promise<void> {
  await invoke("close_clipboard_popup");
}
