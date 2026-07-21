import { useState } from "react";
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
  const queue = useDownloadQueue({
    onComplete: (request, filePath) => history.add(request, filePath),
    getMaxConcurrent: () => settings.settings.maxConcurrent,
  });
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(
    () => new Set(),
  );

  function dismissToast(id: string) {
    setDismissedToasts((prev) => new Set(prev).add(id));
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

  // Playlist "Download all": one job per entry at the chosen preset. Bulk
  // downloads always use the destination folder (no per-file prompt).
  function onDownloadAll(preset: QualityPreset) {
    if (result?.type !== "playlist") return;
    const target: SaveTarget = {
      destination: settings.settings.destination,
      askEachTime: false,
      template: settings.settings.namingTemplate,
    };
    for (const entry of result.data.entries) {
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
        onAnalyze={analyzer.analyze}
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
          onDownloadAll={onDownloadAll}
        />
      )}

      <DownloadToaster
        jobs={queue.jobs}
        dismissedIds={dismissedToasts}
        onDismiss={dismissToast}
      />
      <DownloadsDrawer
        queue={queue}
        isOpen={downloadsOpen}
        onClose={() => setDownloadsOpen(false)}
      />
      <SettingsDialog settings={settings} />
      <HistoryDrawer history={history} onDownloadAgain={enqueue} />
    </main>
  );
}

export default App;
