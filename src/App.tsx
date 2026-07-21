import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import {
  PlaylistView,
  ResultCard,
  ResultSkeleton,
  UrlBar,
  useAnalyzer,
  type FormatOption,
} from "./features/analyzer";
import {
  DownloadsDrawer,
  DownloadToaster,
  QueuePanel,
  useDownloadQueue,
  type DownloadKind,
  type DownloadRequest,
  type DownloadSource,
  type QualityPreset,
  type SaveTarget,
} from "./features/downloader";
import { SettingsDialog, useSettings } from "./features/settings";
import { HistoryDrawer, RecentDownloads, useHistory } from "./features/history";
import { useNotifier } from "./features/notifications";
import { setTrayState, useTrayEvents } from "./features/tray";
import { UpdatePrompt, useUpdater } from "./features/updater";
import {
  ClipboardPrompt,
  showClipboardPopup,
  useClipboardMonitor,
} from "./features/clipboard";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

function buildRequest(
  source: DownloadSource,
  format: FormatOption,
  kind: DownloadKind,
): DownloadRequest {
  return {
    url: source.url,
    title: source.title,
    uploader: source.uploader,
    thumbnail: source.thumbnail,
    label: format.label,
    formatId: format.id,
    ext: kind === "video" ? "mp4" : format.ext,
    kind,
    needsMux: kind === "video" && format.needs_mux,
  };
}

function App() {
  const analyzer = useAnalyzer();
  const settings = useSettings();
  const history = useHistory();
  const notifier = useNotifier(true);
  const updater = useUpdater();
  const queue = useDownloadQueue({
    onComplete: (request, filePath) => {
      history.add(request, filePath);
      notifier.downloadComplete(request.title, filePath);
    },
    onError: (request, message) =>
      notifier.downloadFailed(request.title, message),
    getMaxConcurrent: () => settings.settings.maxConcurrent,
  });
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const sessionStart = useRef(Date.now());
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(
    () => new Set(),
  );

  function handleAnalyze() {
    void analyzer.analyze();
  }

  function analyzeClipboardUrl(url: string) {
    analyzer.setUrl(url);
    void analyzer.analyze(url);
  }

  useClipboardMonitor({
    enabled: settings.settings.monitorClipboard,
    currentUrl: analyzer.url,
    onDetect: (url) => {
      if (settings.settings.clipboardMode === "auto") {
        analyzeClipboardUrl(url);
        return;
      }
      // Show the floating popup window; fall back to the in-app prompt if the
      // window can't be created.
      void showClipboardPopup(url).catch(() => setClipboardUrl(url));
    },
  });

  // The floating popup asks in its own window; when the user accepts, bring
  // the main window forward and analyze the URL.
  useEffect(() => {
    const unlisten = listen<string>("clip://accept", (e) => {
      void (async () => {
        const win = getCurrentWindow();
        try {
          await win.show();
          await win.unminimize();
          await win.setFocus();
        } catch {
          // Best-effort focus.
        }
        analyzeClipboardUrl(e.payload);
      })();
    });
    return () => {
      void unlisten.then((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissToast(id: string) {
    setDismissedToasts((prev) => new Set(prev).add(id));
  }

  function dismissAllToasts(ids: string[]) {
    setDismissedToasts((prev) => new Set([...prev, ...ids]));
  }

  const { status, result } = analyzer;

  function saveTarget(): SaveTarget {
    return {
      destination: settings.settings.destination,
      askEachTime: settings.settings.askEachTime,
      template: settings.settings.namingTemplate,
    };
  }

  function enqueue(request: DownloadRequest) {
    void queue.enqueue(request, saveTarget());
  }

  function download(
    source: DownloadSource,
    format: FormatOption,
    kind: DownloadKind,
  ) {
    enqueue(buildRequest(source, format, kind));
  }

  function onVideoDownload(format: FormatOption, kind: DownloadKind) {
    if (result?.type !== "video") return;
    download(
      {
        url: analyzer.url,
        title: result.data.title,
        uploader: result.data.uploader || undefined,
        thumbnail: result.data.thumbnail,
      },
      format,
      kind,
    );
  }

  // Playlist bulk download: one job per selected entry at the chosen preset.
  // Bulk downloads always use the destination folder (no per-file prompt).
  function onDownloadSelected(urls: string[], preset: QualityPreset) {
    if (result?.type !== "playlist") return;
    const wanted = new Set(urls);
    const target: SaveTarget = {
      destination: settings.settings.destination,
      askEachTime: false,
      template: settings.settings.namingTemplate,
    };
    for (const entry of result.data.entries) {
      if (!wanted.has(entry.url)) continue;
      void queue.enqueue(
        {
          url: entry.url,
          title: entry.title,
          uploader: entry.uploader ?? undefined,
          thumbnail: entry.thumbnail,
          label: preset.label,
          formatId: "",
          ext: preset.kind === "video" ? "mp4" : "m4a",
          kind: preset.kind,
          needsMux: preset.kind === "video",
          maxHeight: preset.maxHeight,
        },
        target,
      );
    }
  }

  const showRecents = status !== "done" && status !== "loading";
  const activeCount = queue.jobs.filter(
    (j) => j.status === "active" || j.status === "queued",
  ).length;

  // Notify when the queue drains (transitions from having work to idle).
  const prevActiveRef = useRef(0);
  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev > 0 && activeCount === 0) {
      const finished = queue.jobs.filter((j) => j.status === "done").length;
      if (finished > 0) notifier.queueFinished(finished);
    }
    prevActiveRef.current = activeCount;
  }, [activeCount, queue.jobs, notifier]);

  // Keep the tray icon in sync with download activity.
  const hasError = queue.jobs.some((j) => j.status === "error");
  const isDownloading = queue.jobs.some((j) => j.status === "active");
  useEffect(() => {
    const state = hasError
      ? "error"
      : isDownloading
        ? "downloading"
        : "idle";
    void setTrayState(state);
  }, [hasError, isDownloading]);

  useTrayEvents({
    onOpenDownloads: () => setDownloadsOpen(true),
    onSettings: settings.open,
    onPauseAll: queue.pauseAll,
    onResumeAll: queue.resumeAll,
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-7 px-7 pb-12 pt-14">
      <AppHeader
        onOpenDownloads={() => setDownloadsOpen(true)}
        onOpenHistory={history.open}
        onOpenSettings={settings.open}
        activeCount={activeCount}
      />

      <UrlBar
        value={analyzer.url}
        status={analyzer.status}
        isLoading={analyzer.isLoading}
        error={analyzer.error}
        onChange={analyzer.setUrl}
        onAnalyze={handleAnalyze}
        onClear={analyzer.reset}
      />

      <QueuePanel jobs={queue.jobs} onRemove={queue.remove} />

      {showRecents && (
        <RecentDownloads
          records={history.recent}
          onDownloadAgain={enqueue}
          onHide={history.hideFromRecent}
        />
      )}

      {status === "loading" && <ResultSkeleton />}
      {status === "done" && result?.type === "video" && (
        <ResultCard meta={result.data} onDownload={onVideoDownload} />
      )}
      {status === "done" && result?.type === "playlist" && (
        <PlaylistView
          playlist={result.data}
          onDownload={download}
          onDownloadSelected={onDownloadSelected}
        />
      )}

      <DownloadToaster
        jobs={queue.jobs}
        dismissedIds={dismissedToasts}
        onDismiss={dismissToast}
        onDismissAll={dismissAllToasts}
        since={sessionStart.current}
      />
      <DownloadsDrawer
        queue={queue}
        isOpen={downloadsOpen}
        onClose={() => setDownloadsOpen(false)}
      />
      <SettingsDialog settings={settings} />
      <HistoryDrawer history={history} onDownloadAgain={enqueue} />
      <UpdatePrompt updater={updater} />
      {clipboardUrl && (
        <ClipboardPrompt
          url={clipboardUrl}
          onYes={() => {
            analyzeClipboardUrl(clipboardUrl);
            setClipboardUrl(null);
          }}
          onNo={() => setClipboardUrl(null)}
        />
      )}
    </main>
  );
}

export default App;
