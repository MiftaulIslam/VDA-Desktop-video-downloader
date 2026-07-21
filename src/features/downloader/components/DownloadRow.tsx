import { openFile, revealFile } from "../api/downloaderApi";
import type { UseDownloadQueue } from "../hooks/useDownloadQueue";
import type { DownloadJob, JobStatus } from "../types";
import {
  folderOf,
  formatClock,
  formatEta,
  formatSize,
  formatSpeed,
  stageLabel,
} from "../utils/progress";
import { ProgressBar } from "./ProgressBar";

interface DownloadRowProps {
  job: DownloadJob;
  queue: UseDownloadQueue;
  onDragStart: () => void;
  onDropOn: () => void;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  queued: "bg-white/5 text-dim",
  active: "bg-brand/15 text-brand",
  paused: "bg-amber-500/15 text-amber-400",
  done: "bg-emerald-500/15 text-emerald-400",
  error: "bg-danger/15 text-danger",
  cancelled: "bg-white/5 text-dim",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  queued: "Queued",
  active: "Downloading",
  paused: "Paused",
  done: "Completed",
  error: "Failed",
  cancelled: "Cancelled",
};

function IconAction({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md border border-line text-dim transition hover:border-transparent ${
        danger ? "hover:bg-danger/15 hover:text-danger" : "hover:bg-brand/15 hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

export function DownloadRow({ job, queue, onDragStart, onDropOn }: DownloadRowProps) {
  const { request, status } = job;
  const remaining = job.total > 0 ? Math.max(0, job.total - job.downloaded) : 0;
  const isActive = status === "active";
  const isMerging = job.stage === "merging";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOn}
      className="flex flex-col gap-2.5 rounded-xl border border-line bg-inputbg p-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-bg">
          {request.thumbnail && (
            <img src={request.thumbnail} alt="" className="h-full w-full object-cover" />
          )}
          <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[9px] font-semibold text-white">
            {request.label}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[13px] font-medium text-ink" title={request.title}>
            {request.title}
          </p>
          <span
            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
          >
            {isActive ? stageLabel(job.stage) : STATUS_LABEL[status]}
          </span>
        </div>
        <span className="shrink-0 cursor-grab text-dim" title="Drag to reorder">
          ⠿
        </span>
      </div>

      {/* Progress */}
      {(isActive || status === "paused") && (
        <div className="flex flex-col gap-1">
          <ProgressBar percent={job.percent} indeterminate={isActive && isMerging} />
          <div className="flex justify-between text-[11px] text-dim">
            <span>{isActive && !isMerging ? formatSpeed(job.speed) : ""}</span>
            <span>{Math.round(job.percent)}%</span>
            <span>{isActive && !isMerging ? formatEta(job.eta) : ""}</span>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="break-words text-[11px] text-danger">{job.error}</p>
      )}

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <Detail label="Downloaded" value={formatSize(job.downloaded)} />
        <Detail label="Remaining" value={remaining > 0 ? formatSize(remaining) : "—"} />
        <Detail label="Started" value={formatClock(job.startedAt)} />
        <Detail label="Finished" value={formatClock(job.finishedAt)} />
        <Detail
          label="Folder"
          value={folderOf(job.filePath ?? job.outputPath)}
          full
          title={job.filePath ?? job.outputPath}
        />
      </dl>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
        {isActive && (
          <IconAction title="Pause" onClick={() => queue.pause(job.id)}>
            <PauseIcon />
          </IconAction>
        )}
        {status === "paused" && (
          <IconAction title="Resume" onClick={() => queue.resume(job.id)}>
            <PlayIcon />
          </IconAction>
        )}
        {(status === "error" || status === "cancelled") && (
          <IconAction title="Retry" onClick={() => queue.retry(job.id)}>
            <RetryIcon />
          </IconAction>
        )}
        {(isActive || status === "queued" || status === "paused") && (
          <IconAction title="Cancel" danger onClick={() => queue.cancel(job.id)}>
            <StopIcon />
          </IconAction>
        )}
        {status === "done" && job.filePath && (
          <>
            <IconAction title="Open file" onClick={() => void openFile(job.filePath!)}>
              <PlayIcon />
            </IconAction>
            <IconAction title="Open folder" onClick={() => void revealFile(job.filePath!)}>
              <FolderIcon />
            </IconAction>
          </>
        )}
        <IconAction
          title="Copy URL"
          onClick={() => void navigator.clipboard.writeText(request.url)}
        >
          <CopyIcon />
        </IconAction>
        <IconAction title="Remove" danger onClick={() => queue.remove(job.id)}>
          <TrashIcon />
        </IconAction>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  full,
  title,
}: {
  label: string;
  value: string;
  full?: boolean;
  title?: string;
}) {
  return (
    <div className={`flex gap-1.5 ${full ? "col-span-2" : ""}`}>
      <dt className="shrink-0 text-dim">{label}:</dt>
      <dd className="min-w-0 truncate text-ink" title={title}>
        {value}
      </dd>
    </div>
  );
}

/* Icons (16px) */
const svg = {
  width: 15,
  height: 15,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const PauseIcon = () => (
  <svg {...svg}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);
const PlayIcon = () => (
  <svg {...svg}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);
const StopIcon = () => (
  <svg {...svg}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);
const RetryIcon = () => (
  <svg {...svg}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const FolderIcon = () => (
  <svg {...svg}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);
const CopyIcon = () => (
  <svg {...svg}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const TrashIcon = () => (
  <svg {...svg}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
