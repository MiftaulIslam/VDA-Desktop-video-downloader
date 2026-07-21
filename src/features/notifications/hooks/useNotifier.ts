import { useEffect, useRef } from "react";
import { ensurePermission, notify } from "../api/notificationsApi";

/** Filename portion of a full path, for concise notification bodies. */
function baseName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

export interface Notifier {
  downloadComplete: (title: string, filePath: string) => void;
  downloadFailed: (title: string, message: string) => void;
  queueFinished: (count: number) => void;
}

/** Desktop notification helpers for download lifecycle events. */
export function useNotifier(enabled: boolean): Notifier {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (enabled) void ensurePermission();
  }, [enabled]);

  function fire(title: string, body: string) {
    if (!enabledRef.current) return;
    void notify(title, body);
  }

  return {
    downloadComplete: (title, filePath) =>
      fire("Download complete", `${title}\n${baseName(filePath)}`),
    downloadFailed: (title, message) =>
      fire("Download failed", `${title}\n${message}`),
    queueFinished: (count) =>
      fire(
        "Queue finished",
        count === 1
          ? "1 download finished."
          : `${count} downloads finished.`,
      ),
  };
}
