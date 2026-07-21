interface ClipboardPromptProps {
  url: string;
  onYes: () => void;
  onNo: () => void;
}

/** Small popup asking whether to download a clipboard-detected YouTube URL. */
export function ClipboardPrompt({ url, onYes, onNo }: ClipboardPromptProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elev p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-ink">Download this video?</p>
          <p className="truncate text-xs text-dim" title={url}>
            {url}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onNo}
            className="rounded-lg border border-line bg-inputbg px-3 py-1.5 text-[13px] font-medium text-ink transition hover:border-brand"
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            className="rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-brand/90"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
