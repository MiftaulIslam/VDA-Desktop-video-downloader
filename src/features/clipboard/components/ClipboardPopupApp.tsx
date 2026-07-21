import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { closeClipboardPopup, getClipboardUrl } from "../api/clipboardApi";

/**
 * Standalone UI rendered in the small always-on-top popup window. Shows a
 * compact "download this?" prompt for a clipboard-detected YouTube URL and
 * reports the user's choice back to the main window.
 */
export function ClipboardPopupApp() {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    void getClipboardUrl().then((u) => u && setUrl(u));
    const unlistenP = listen<string>("clip://url", (e) => setUrl(e.payload));
    return () => {
      void unlistenP.then((u) => u());
    };
  }, []);

  function accept() {
    void emit("clip://accept", url);
    void closeClipboardPopup();
  }

  function dismiss() {
    void closeClipboardPopup();
  }

  return (
    <div className="flex h-screen w-screen items-center gap-3 overflow-hidden rounded-2xl border border-line bg-elev px-3.5 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-semibold text-ink">
          Download this video?
        </span>
        <span className="truncate text-[11px] text-dim" title={url}>
          {url}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg border border-line bg-inputbg px-2.5 py-1.5 text-[12px] font-medium text-ink transition hover:border-brand"
        >
          No
        </button>
        <button
          type="button"
          onClick={accept}
          className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-brand/90"
        >
          Yes
        </button>
      </div>
    </div>
  );
}
