import type { DownloadRequest } from "../../downloader";
import type { HistoryRecord } from "../types";

interface RecentDownloadsProps {
  records: HistoryRecord[];
  onDownloadAgain: (request: DownloadRequest) => void;
  onHide: (id: string) => void;
}

/** Strip of recent-download cards shown under the URL input when idle. */
export function RecentDownloads({
  records,
  onDownloadAgain,
  onHide,
}: RecentDownloadsProps) {
  if (records.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-dim">
        Recent downloads
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {records.map((record) => (
          <RecentCard
            key={record.id}
            record={record}
            onDownloadAgain={onDownloadAgain}
            onHide={onHide}
          />
        ))}
      </div>
    </section>
  );
}

function RecentCard({
  record,
  onDownloadAgain,
  onHide,
}: {
  record: HistoryRecord;
  onDownloadAgain: (request: DownloadRequest) => void;
  onHide: (id: string) => void;
}) {
  const { request } = record;

  return (
    <div className="group relative flex gap-3 overflow-hidden rounded-xl border border-line bg-elev p-2.5 transition hover:border-line-strong">
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-inputbg">
        {request.thumbnail && (
          <img src={request.thumbnail} alt="" className="h-full w-full object-cover" />
        )}
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[10px] font-semibold text-white">
          {request.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink" title={request.title}>
          {request.title}
        </p>
        <button
          type="button"
          onClick={() => onDownloadAgain(request)}
          className="mt-auto flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-brand transition hover:bg-brand/10"
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
          Download again
        </button>
      </div>

      <button
        type="button"
        onClick={() => onHide(record.id)}
        title="Hide"
        className="absolute right-1.5 top-1.5 h-6 w-6 rounded-md text-dim opacity-0 transition hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
