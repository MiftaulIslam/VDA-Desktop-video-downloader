import type { DownloadJob } from "../types";
import { stageLabel } from "../utils/progress";
import { ProgressBar } from "./ProgressBar";

interface QueuePanelProps {
  jobs: DownloadJob[];
  onRemove: (id: string) => void;
}

/** Compact list of pending/active downloads shown under the URL input. */
export function QueuePanel({ jobs, onRemove }: QueuePanelProps) {
  const pipeline = jobs.filter(
    (j) => j.status === "queued" || j.status === "active",
  );
  if (pipeline.length === 0) return null;

  return (
    <section className="rounded-2xl border border-line bg-elev p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dim">
        Queue
        <span className="rounded-full bg-inputbg px-1.5 py-0.5 text-[10px] text-dim">
          {pipeline.length}
        </span>
      </h3>

      <div className="flex flex-col gap-2">
        {pipeline.map((job) => {
          const active = job.status === "active";
          const isMerging = job.stage === "merging";
          return (
            <div
              key={job.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-inputbg px-3.5 py-2.5"
            >
              <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-md bg-bg">
                {job.request.thumbnail && (
                  <img
                    src={job.request.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[9px] font-semibold text-white">
                  {job.request.label}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-[13px] font-medium text-ink" title={job.request.title}>
                  {job.request.title}
                </p>
                {active ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar percent={job.percent} indeterminate={isMerging} />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-dim">
                      {isMerging ? stageLabel(job.stage) : `${Math.round(job.percent)}%`}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-dim">Queued</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemove(job.id)}
                title={active ? "Remove" : "Cancel"}
                className="shrink-0 rounded-md px-1.5 py-1 text-sm leading-none text-dim transition hover:bg-danger/15 hover:text-danger"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
