import { useEffect } from "react";
import { openFile, revealFile } from "../api/downloaderApi";
import type { DownloadJob } from "../types";
import { formatEta, formatSpeed, stageLabel } from "../utils/progress";
import { ProgressBar } from "./ProgressBar";

interface DownloadToastProps {
  job: DownloadJob;
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 5000;

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function DownloadToast({ job, onDismiss }: DownloadToastProps) {
  const isDone = job.status === "done";

  // Success toasts fade away on their own; errors and active jobs persist.
  useEffect(() => {
    if (!isDone) return;
    const t = setTimeout(() => onDismiss(job.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [isDone, job.id, onDismiss]);

  const isMerging = job.stage === "merging";

  return (
    <div className="pointer-events-auto w-80 overflow-hidden rounded-xl border border-line bg-elev shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-start gap-2 px-3.5 pt-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
            job.status === "done"
              ? "bg-emerald-500 text-white"
              : job.status === "error"
                ? "bg-danger/20 text-danger"
                : "bg-brand/20 text-brand"
          }`}
        >
          {job.status === "done" ? "✓" : job.status === "error" ? "!" : "↓"}
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink" title={job.request.title}>
          {job.request.title}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(job.id)}
          className="-mt-0.5 shrink-0 rounded px-1 text-sm leading-none text-dim transition hover:text-ink"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="px-3.5 pb-3.5 pt-2">
        {job.status === "queued" && (
          <p className="text-xs text-dim">Queued…</p>
        )}

        {job.status === "active" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">
                {stageLabel(job.stage)}
              </span>
              {!isMerging && (
                <span className="tabular-nums text-brand">
                  {Math.round(job.percent)}%
                </span>
              )}
            </div>
            <ProgressBar percent={job.percent} indeterminate={isMerging} />
            <div className="flex justify-between text-[11px] text-dim">
              <span>{isMerging ? "Almost done…" : formatSpeed(job.speed)}</span>
              <span>{isMerging ? "" : formatEta(job.eta)}</span>
            </div>
          </div>
        )}

        {job.status === "done" && job.filePath && (
          <div className="flex flex-col gap-2">
            <p className="truncate text-xs text-dim" title={job.filePath}>
              {fileName(job.filePath)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void openFile(job.filePath!)}
                className="flex-1 rounded-lg bg-brand py-1.5 text-xs font-semibold text-white transition hover:bg-brand-hover"
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => void revealFile(job.filePath!)}
                className="flex-1 rounded-lg border border-line-strong bg-inputbg py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Open Folder
              </button>
            </div>
          </div>
        )}

        {job.status === "error" && (
          <p className="break-words text-xs text-danger">{job.error}</p>
        )}
      </div>
    </div>
  );
}
