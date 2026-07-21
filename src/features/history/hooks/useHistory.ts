import { useCallback, useEffect, useState } from "react";
import { loadHistory, saveHistory } from "../api/historyApi";
import type { HistoryRecord } from "../types";
import type { DownloadRequest } from "../../downloader";

export interface UseHistory {
  items: HistoryRecord[];
  /** Most recent records not hidden from the strip (capped). */
  recent: HistoryRecord[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (request: DownloadRequest, filePath: string) => void;
  remove: (id: string) => void;
  hideFromRecent: (id: string) => void;
  clear: () => void;
}

const RECENT_LIMIT = 4;

/** Loads persisted history on mount and keeps disk in sync with changes. */
export function useHistory(): UseHistory {
  const [items, setItems] = useState<HistoryRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    void (async () => setItems(await loadHistory()))();
  }, []);

  const commit = useCallback((next: HistoryRecord[]) => {
    setItems(next);
    void saveHistory(next);
  }, []);

  const add = useCallback(
    (request: DownloadRequest, filePath: string) => {
      const record: HistoryRecord = {
        id:
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        request,
        filePath,
        downloadedAt: Date.now(),
      };
      setItems((prev) => {
        const next = [record, ...prev];
        void saveHistory(next);
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => {
      const next = prev.filter((r) => r.id !== id);
      void saveHistory(next);
      return next;
    }),
    [],
  );

  const hideFromRecent = useCallback(
    (id: string) => setItems((prev) => {
      const next = prev.map((r) =>
        r.id === id ? { ...r, hiddenFromRecent: true } : r,
      );
      void saveHistory(next);
      return next;
    }),
    [],
  );

  const clear = useCallback(() => commit([]), [commit]);

  const recent = items
    .filter((r) => !r.hiddenFromRecent)
    .slice(0, RECENT_LIMIT);

  return {
    items,
    recent,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add,
    remove,
    hideFromRecent,
    clear,
  };
}
