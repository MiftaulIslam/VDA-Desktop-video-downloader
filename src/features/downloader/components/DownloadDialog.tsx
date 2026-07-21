import type { UseDownloader } from "../hooks/useDownloader";
import { formatEta, formatSpeed, stageLabel } from "../utils/progress";
import { DownloadComplete } from "./DownloadComplete";
import { ProgressBar } from "./ProgressBar";
import { StageSteps } from "./StageSteps";

interface DownloadDialogProps {
  downloader: UseDownloader;
  /** True when the active download has a separate processing phase. */
  showMux: boolean;
}

export function DownloadDialog({ downloader, showMux }: DownloadDialogProps) {
  const { state, isOpen, close, open, reveal } = downloader;
  if (!isOpen) return null;

  const isMerging = state.stage === "merging";
  const isError = state.status === "error";
  const isDone = state.status === "done";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isDone || isError ? close : undefined}
      />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-elev shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">
              {isDone ? "Finished" : isError ? "Failed" : "Downloading"}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-ink" title={state.title}>
              {state.title}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-dim transition hover:bg-white/5 hover:text-ink"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {isDone && state.filePath ? (
            <DownloadComplete
              filePath={state.filePath}
              onOpen={open}
              onReveal={reveal}
            />
          ) : isError ? (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-danger)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-ink">
                Download failed
              </p>
              <p className="max-w-[340px] break-words text-[13px] text-dim">
                {state.error}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-1 rounded-xl border border-line-strong bg-inputbg px-6 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <StageSteps
                stage={state.stage}
                status={state.status}
                showMux={showMux}
              />

              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-ink">
                    {stageLabel(state.stage)}
                  </span>
                  {!isMerging && (
                    <span className="text-sm font-semibold tabular-nums text-brand">
                      {Math.round(state.percent)}%
                    </span>
                  )}
                </div>

                <ProgressBar percent={state.percent} indeterminate={isMerging} />

                <div className="flex justify-between text-xs text-dim">
                  <span>{isMerging ? "Almost done…" : formatSpeed(state.speed)}</span>
                  <span>{isMerging ? "" : formatEta(state.eta)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
