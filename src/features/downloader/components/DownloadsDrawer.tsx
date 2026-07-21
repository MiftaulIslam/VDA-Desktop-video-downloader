import { useRef } from "react";
import type { UseDownloadQueue } from "../hooks/useDownloadQueue";
import { DownloadRow } from "./DownloadRow";

interface DownloadsDrawerProps {
  queue: UseDownloadQueue;
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadsDrawer({ queue, isOpen, onClose }: DownloadsDrawerProps) {
  const { jobs } = queue;
  const dragId = useRef<string | null>(null);

  function dropOn(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const ids = jobs.map((j) => j.id).filter((id) => id !== from);
    const at = ids.indexOf(targetId);
    ids.splice(at, 0, from);
    queue.reorder(ids);
  }

  const hasCompleted = jobs.some((j) => j.status === "done");
  const hasFailed = jobs.some(
    (j) => j.status === "error" || j.status === "cancelled",
  );
  const hasActive = jobs.some((j) => j.status === "active");
  const hasPaused = jobs.some((j) => j.status === "paused");

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-[92vw] flex-col border-l border-line bg-elev shadow-[-20px_0_60px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">
            Downloads
            {jobs.length > 0 && (
              <span className="ml-2 rounded-full bg-inputbg px-1.5 py-0.5 text-[10px] text-dim">
                {jobs.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-lg leading-none text-dim transition hover:bg-white/5 hover:text-ink"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Queue-wide toolbar */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
            <ToolbarButton disabled={!hasActive} onClick={queue.pauseAll}>
              Pause all
            </ToolbarButton>
            <ToolbarButton disabled={!hasPaused} onClick={queue.resumeAll}>
              Resume all
            </ToolbarButton>
            <ToolbarButton
              disabled={!hasActive && !hasPaused}
              onClick={queue.cancelAll}
            >
              Cancel all
            </ToolbarButton>
            <ToolbarButton disabled={!hasCompleted} onClick={queue.removeCompleted}>
              Clear completed
            </ToolbarButton>
            <ToolbarButton disabled={!hasFailed} onClick={queue.removeFailed}>
              Clear failed
            </ToolbarButton>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {jobs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-inputbg text-dim">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </div>
              <p className="text-sm text-dim">No downloads</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {jobs.map((job) => (
                <DownloadRow
                  key={job.id}
                  job={job}
                  queue={queue}
                  onDragStart={() => (dragId.current = job.id)}
                  onDropOn={() => dropOn(job.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function ToolbarButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-line-strong bg-inputbg px-2.5 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-ink"
    >
      {children}
    </button>
  );
}
