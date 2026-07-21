import type { UseSettings } from "../hooks/useSettings";

interface SettingsDialogProps {
  settings: UseSettings;
}

export function SettingsDialog({ settings }: SettingsDialogProps) {
  const {
    settings: value,
    isOpen,
    close,
    changeDestination,
    setAskEachTime,
    setMaxConcurrent,
  } = settings;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-elev shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-sm font-semibold text-ink">Settings</h2>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-lg leading-none text-dim transition hover:bg-white/5 hover:text-ink"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6">
          {/* Download location */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-dim">
              Download location
            </span>
            <button
              type="button"
              onClick={changeDestination}
              title="Click to change"
              className="group flex items-center gap-3 rounded-xl border border-line-strong bg-inputbg px-4 py-3 text-left transition hover:border-brand"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-dim group-hover:text-brand"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              <span className="min-w-0 flex-1 truncate text-sm text-ink" title={value.destination}>
                {value.destination || "Choose a folder…"}
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-lg bg-brand/10 px-2 py-1 text-xs font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Change
              </span>
            </button>
          </div>

          {/* Ask each time */}
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">
                Ask where to save each time
              </span>
              <span className="text-xs text-dim">
                Otherwise files go straight to the folder above.
              </span>
            </span>
            <span className="relative inline-flex shrink-0">
              <input
                type="checkbox"
                checked={value.askEachTime}
                onChange={(e) => setAskEachTime(e.currentTarget.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-inputbg ring-1 ring-line-strong transition peer-checked:bg-brand peer-checked:ring-brand" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
          </label>

          {/* Max simultaneous downloads */}
          <label className="flex items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">
                Max simultaneous downloads
              </span>
              <span className="text-xs text-dim">
                How many downloads run at the same time.
              </span>
            </span>
            <select
              value={value.maxConcurrent}
              onChange={(e) => setMaxConcurrent(Number(e.currentTarget.value))}
              className="shrink-0 rounded-lg border border-line-strong bg-inputbg px-3 py-2 text-sm font-medium text-ink outline-none transition hover:border-brand focus:border-brand"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
