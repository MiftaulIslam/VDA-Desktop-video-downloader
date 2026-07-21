import type { DownloadJob } from "../types";
import { DownloadToast } from "./DownloadToast";

interface DownloadToasterProps {
  jobs: DownloadJob[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
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
}: DownloadToasterProps) {
  const shown = jobs
    .filter(
      (j) =>
        (j.status === "active" || j.status === "done" || j.status === "error") &&
        !dismissedIds.has(j.id),
    )
    .slice(-4);
  if (shown.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[60] flex flex-col gap-2.5">
      {[...shown].reverse().map((job) => (
        <DownloadToast key={job.id} job={job} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
