import type { DownloadJob } from "../types";
import { DownloadToast } from "./DownloadToast";

interface DownloadToasterProps {
  jobs: DownloadJob[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
  onDismissAll: (ids: string[]) => void;
  /** Only toast finished jobs that completed at/after this time (session start),
   * so restored jobs from previous sessions don't flood the screen. */
  since: number;
}

/**
 * Fixed top-right stack of download toasts. Shows only live/finished states
 * (active, done, error) that haven't been dismissed; dismissing hides the
 * popup but keeps the download in the Downloads drawer. Capped so a large
 * queue doesn't flood the corner.
 */
export function DownloadToaster({
  jobs,
  dismissedIds,
  onDismiss,
  onDismissAll,
  since,
}: DownloadToasterProps) {
  const visible = jobs.filter((j) => {
    if (dismissedIds.has(j.id)) return false;
    if (j.status === "active") return true;
    // Only show finished states that happened during this session.
    if (j.status === "done" || j.status === "error") {
      return j.finishedAt != null && j.finishedAt >= since;
    }
    return false;
  });
  const shown = visible.slice(-4);
  if (shown.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-60 flex flex-col items-end gap-2.5">
      {visible.length > 1 && (
        <button
          type="button"
          onClick={() => onDismissAll(visible.map((j) => j.id))}
          className="pointer-events-auto rounded-lg border border-line bg-elev px-2.5 py-1 text-xs font-medium text-dim shadow-lg transition hover:border-brand hover:text-ink"
        >
          Clear all ({visible.length})
        </button>
      )}
      {[...shown].reverse().map((job) => (
        <DownloadToast key={job.id} job={job} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
