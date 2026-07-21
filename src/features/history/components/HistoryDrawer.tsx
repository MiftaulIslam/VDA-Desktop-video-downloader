import type { DownloadRequest } from "../../downloader";
import type { UseHistory } from "../hooks/useHistory";
import { HistoryItem } from "./HistoryItem";

interface HistoryDrawerProps {
  history: UseHistory;
  onDownloadAgain: (request: DownloadRequest) => void;
}

export function HistoryDrawer({ history, onDownloadAgain }: HistoryDrawerProps) {
  const { items, isOpen, close, remove, clear } = history;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[90vw] flex-col border-l border-line bg-elev shadow-[-20px_0_60px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Download history</h2>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-dim transition hover:bg-danger/15 hover:text-danger"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1 text-lg leading-none text-dim transition hover:bg-white/5 hover:text-ink"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
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
                  <path d="M3 3v5h5" />
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                  <path d="M12 7v5l4 2" />
                </svg>
              </div>
              <p className="text-sm text-dim">No downloads yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((record) => (
                <HistoryItem
                  key={record.id}
                  record={record}
                  onDownloadAgain={onDownloadAgain}
                  onRemove={remove}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
