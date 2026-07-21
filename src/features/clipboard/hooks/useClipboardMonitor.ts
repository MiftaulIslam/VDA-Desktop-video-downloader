import { useEffect, useRef } from "react";
import { isYoutubeUrl } from "../../analyzer";
import { readClipboardText } from "../api/clipboardApi";

const POLL_MS = 1500;

export interface ClipboardMonitorOptions {
  enabled: boolean;
  /** Called with a newly-copied YouTube URL not seen before. */
  onDetect: (url: string) => void;
  /** URL currently in the input bar, ignored to avoid re-prompting. */
  currentUrl: string;
}

/**
 * Watches the clipboard while enabled and reports newly-copied YouTube URLs.
 * Each distinct URL is reported at most once.
 */
export function useClipboardMonitor(options: ClipboardMonitorOptions): void {
  const onDetectRef = useRef(options.onDetect);
  onDetectRef.current = options.onDetect;
  const currentUrlRef = useRef(options.currentUrl);
  currentUrlRef.current = options.currentUrl;
  const lastSeenRef = useRef<string>("");

  useEffect(() => {
    if (!options.enabled) return;
    let cancelled = false;

    async function check() {
      const text = (await readClipboardText()).trim();
      if (cancelled || !text) return;
      if (text === lastSeenRef.current) return;
      lastSeenRef.current = text;
      if (text === currentUrlRef.current.trim()) return;
      if (!isYoutubeUrl(text)) return;
      onDetectRef.current(text);
    }

    // Seed the baseline so an already-copied URL doesn't fire immediately.
    void readClipboardText().then((t) => {
      lastSeenRef.current = t.trim();
    });

    const timer = setInterval(() => void check(), POLL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [options.enabled]);
}
