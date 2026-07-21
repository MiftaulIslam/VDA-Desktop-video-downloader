import { invoke } from "@tauri-apps/api/core";

export type TrayState = "idle" | "downloading" | "error";

/** Update the tray icon to reflect current download activity. */
export async function setTrayState(state: TrayState): Promise<void> {
  await invoke("set_tray_state", { state });
}

/** Choose whether closing the window hides to tray or quits. */
export async function setCloseToTray(enabled: boolean): Promise<void> {
  await invoke("set_close_to_tray", { enabled });
}
