import { getCurrentWindow } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

/**
 * Data-access boundary for startup behavior: Windows launch-at-login and the
 * initial window visibility state.
 */

/** Sync the OS "run at startup" registration with the desired state. */
export async function setAutostart(enabled: boolean): Promise<void> {
  try {
    const on = await isEnabled();
    if (enabled && !on) await enable();
    else if (!enabled && on) await disable();
  } catch {
    // Autostart registration is best-effort.
  }
}

export interface StartupWindowOptions {
  startHidden: boolean;
  startMinimized: boolean;
}

/** Apply the configured window state once at launch. */
export async function applyStartupWindow(
  opts: StartupWindowOptions,
): Promise<void> {
  const win = getCurrentWindow();
  try {
    if (opts.startHidden) {
      await win.hide();
    } else {
      await win.show();
      if (opts.startMinimized) await win.minimize();
    }
  } catch {
    // Ignore — fall back to the default visible window.
  }
}
