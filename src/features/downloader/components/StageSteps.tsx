import type { DownloadStage, DownloadStatus } from "../types";

interface StageStepsProps {
  stage: DownloadStage | null;
  status: DownloadStatus;
  /** Whether this download has a separate processing phase. */
  showMux: boolean;
}

export function StageSteps({ stage, status, showMux }: StageStepsProps) {
  const steps = showMux ? ["Downloading", "Processing"] : ["Downloading"];
  const activeIndex =
    status === "done"
      ? steps.length
      : stage === "merging"
        ? Math.min(1, steps.length - 1)
        : 0;

  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex && status !== "done";
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition ${
                  done
                    ? "bg-brand text-white"
                    : active
                      ? "bg-brand/20 text-brand ring-2 ring-brand/40"
                      : "bg-inputbg text-dim"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  done || active ? "text-ink" : "text-dim"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={`h-px flex-1 ${done ? "bg-brand" : "bg-line"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
