import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface TrayHandlers {
  onOpenDownloads: () => void;
  onSettings: () => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
}

/** Subscribe to menu actions emitted by the native system tray. */
export function useTrayEvents(handlers: TrayHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const unlisten: UnlistenFn[] = [];
    const subs: Array<[string, () => void]> = [
      ["tray://open-downloads", () => ref.current.onOpenDownloads()],
      ["tray://settings", () => ref.current.onSettings()],
      ["tray://pause-all", () => ref.current.onPauseAll()],
      ["tray://resume-all", () => ref.current.onResumeAll()],
    ];
    for (const [event, handler] of subs) {
      void listen(event, handler).then((u) => unlisten.push(u));
    }
    return () => {
      for (const u of unlisten) u();
    };
  }, []);
}
