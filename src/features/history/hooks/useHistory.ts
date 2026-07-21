import { useCallback, useEffect, useState } from "react";
import { loadHistory, saveHistory } from "../api/historyApi";
import type { HistoryRecord } from "../types";
import type { DownloadRequest } from "../../downloader";

export interface UseHistory {
  items: HistoryRecord[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (request: DownloadRequest, filePath: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

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

  const clear = useCallback(() => commit([]), [commit]);

  return {
    items,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add,
    remove,
    clear,
  };
}
