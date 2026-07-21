import type { DownloadRequest } from "../../downloader";
import type { HistoryRecord } from "../types";
import { formatWhen } from "../utils/time";

interface HistoryItemProps {
  record: HistoryRecord;
  onDownloadAgain: (request: DownloadRequest) => void;
  onRemove: (id: string) => void;
}

export function HistoryItem({
  record,
  onDownloadAgain,
  onRemove,
}: HistoryItemProps) {
  const { request } = record;

  return (
    <div className="group flex gap-3 rounded-xl border border-line bg-inputbg p-2.5 transition hover:border-line-strong">
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-bg">
        {request.thumbnail ? (
          <img src={request.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[10px] font-semibold text-white">
          {request.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-[13px] font-medium text-ink" title={request.title}>
          {request.title}
        </p>
        <p className="truncate text-[11px] text-dim" title={request.url}>
          {request.url}
        </p>
        <div className="mt-auto flex items-center gap-2">
          <span className="text-[11px] text-dim">
            {formatWhen(record.downloadedAt)}
          </span>
          <button
            type="button"
            onClick={() => onDownloadAgain(request)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand transition hover:bg-brand/10"
            title="Download again"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Again
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(record.id)}
        title="Remove from history"
        className="h-6 w-6 shrink-0 self-start rounded-md text-dim opacity-0 transition hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
