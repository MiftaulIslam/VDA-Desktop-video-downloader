import type { UseUpdater } from "../hooks/useUpdater";

interface UpdatePromptProps {
  updater: UseUpdater;
}

/** Bottom-right card offering to install a newly-released version. */
export function UpdatePrompt({ updater }: UpdatePromptProps) {
  const { version, notes, installing, progress, install, dismiss } = updater;
  if (!version) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-full max-w-sm">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elev p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold text-ink">
              Update available — v{version}
            </span>
            <span className="text-xs text-dim">
              {installing
                ? `Downloading… ${Math.round(progress * 100)}%`
                : "A new version of VDA is ready to install."}
            </span>
            {notes && !installing && (
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-dim">
                {notes}
              </p>
            )}
          </div>
        </div>

        {installing && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-inputbg">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {!installing && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-line bg-inputbg px-3 py-1.5 text-[13px] font-medium text-ink transition hover:border-brand"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => void install()}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-brand/90"
            >
              Update now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
