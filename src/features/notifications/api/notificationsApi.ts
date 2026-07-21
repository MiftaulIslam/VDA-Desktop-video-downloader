import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * Data-access boundary for OS desktop notifications. Isolates the Tauri
 * notification plugin so the rest of the app depends on this abstraction.
 */

let permission: boolean | null = null;

/** Ensure notification permission, requesting it once if needed. */
export async function ensurePermission(): Promise<boolean> {
  if (permission != null) return permission;
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    permission = granted;
  } catch {
    permission = false;
  }
  return permission;
}

/** Send a desktop notification (no-op if permission was denied). */
export async function notify(title: string, body: string): Promise<void> {
  if (!(await ensurePermission())) return;
  try {
    sendNotification({ title, body });
  } catch {
    // Ignore — notifications are best-effort.
  }
}
