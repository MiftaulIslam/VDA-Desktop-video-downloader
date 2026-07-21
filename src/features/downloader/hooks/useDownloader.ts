import { useCallback, useRef, useState } from "react";
import {
  openFile,
  resolveOutputPath,
  revealFile,
  startDownload,
} from "../api/downloaderApi";
import { sanitizeFilename } from "../utils/filename";
import type {
  DownloadEvent,
  DownloadRequest,
  DownloadState,
  SaveTarget,
} from "../types";

const IDLE: DownloadState = {
  status: "idle",
  stage: null,
  percent: 0,
  speed: null,
  eta: null,
  filePath: null,
  error: null,
  title: "",
};

export interface UseDownloaderOptions {
  /** Called when a download finishes successfully. */
  onComplete?: (request: DownloadRequest, filePath: string) => void;
}

export interface UseDownloader {
  state: DownloadState;
  isOpen: boolean;
  start: (request: DownloadRequest, target: SaveTarget) => Promise<void>;
  close: () => void;
  open: () => void;
  reveal: () => void;
}

/**
 * Owns the full download lifecycle: resolving a save location, invoking the
 * backend, and reducing the streamed progress events into view state.
 */
export function useDownloader(options?: UseDownloaderOptions): UseDownloader {
  const [state, setState] = useState<DownloadState>(IDLE);
  const [isOpen, setIsOpen] = useState(false);

  // Kept in refs so the event handler always sees the latest values without
  // being re-created (and re-subscribing the channel) on every render.
  const activeRequest = useRef<DownloadRequest | null>(null);
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  const handleEvent = useCallback((event: DownloadEvent) => {
    switch (event.type) {
      case "progress":
        setState((prev) => ({
          ...prev,
          status: "active",
          stage: event.stage,
          percent: event.percent,
          speed: event.speed,
          eta: event.eta,
        }));
        break;
      case "merging":
        setState((prev) => ({ ...prev, status: "active", stage: "merging", eta: null }));
        break;
      case "done":
        setState((prev) => ({
          ...prev,
          status: "done",
          stage: null,
          percent: 100,
          filePath: event.path,
        }));
        if (activeRequest.current) {
          onCompleteRef.current?.(activeRequest.current, event.path);
        }
        break;
      case "error":
        setState((prev) => ({ ...prev, status: "error", error: event.message }));
        break;
    }
  }, []);

  const start = useCallback(
    async (request: DownloadRequest, target: SaveTarget) => {
      const defaultName = sanitizeFilename(request.title);
      const outputPath = await resolveOutputPath(defaultName, request.ext, target);
      if (!outputPath) return; // cancelled

      activeRequest.current = request;
      setState({ ...IDLE, status: "active", title: request.title });
      setIsOpen(true);

      try {
        await startDownload({
          url: request.url,
          formatId: request.formatId,
          kind: request.kind,
          needsMux: request.needsMux,
          outputPath,
          onEvent: handleEvent,
        });
      } catch (e) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: typeof e === "string" ? e : "Download failed.",
        }));
      }
    },
    [handleEvent],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setState(IDLE);
  }, []);

  const open = useCallback(() => {
    if (state.filePath) void openFile(state.filePath);
  }, [state.filePath]);

  const reveal = useCallback(() => {
    if (state.filePath) void revealFile(state.filePath);
  }, [state.filePath]);

  return { state, isOpen, start, close, open, reveal };
}
