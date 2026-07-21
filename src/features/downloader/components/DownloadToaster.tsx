import type { DownloadJob } from "../types";
import { DownloadToast } from "./DownloadToast";

interface DownloadToasterProps {
  jobs: DownloadJob[];
  onDismiss: (id: string) => void;
}

/** Fixed top-right stack of download toasts (most recent on top). */
export function DownloadToaster({ jobs, onDismiss }: DownloadToasterProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[60] flex flex-col gap-2.5">
      {[...jobs].reverse().map((job) => (
        <DownloadToast key={job.id} job={job} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
