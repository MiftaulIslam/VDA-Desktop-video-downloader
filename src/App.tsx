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
  DownloadToaster,
  QueuePanel,
  useDownloadQueue,
  type DownloadKind,
  type DownloadRequest,
  type DownloadSource,
  type QualityPreset,
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

  const { status, result } = analyzer;

  function enqueue(request: DownloadRequest) {
    void queue.enqueue(request, settings.settings);
  }

  function download(
    source: DownloadSource,
    format: FormatOption,
    kind: DownloadKind,
  ) {
    enqueue(buildRequest(source, format, kind));
  }

  // Single-video result: bind the source from the analyzed video.
  function onVideoDownload(format: FormatOption, kind: DownloadKind) {
    if (result?.type !== "video") return;
    download(
      { url: analyzer.url, title: result.data.title, thumbnail: result.data.thumbnail },
      format,
      kind,
    );
  }

  // Playlist "Download all": one job per entry at the chosen preset. Bulk
  // downloads always use the destination folder (no per-file prompt).
  function onDownloadAll(preset: QualityPreset) {
    if (result?.type !== "playlist") return;
    const target = {
      destination: settings.settings.destination,
      askEachTime: false,
    };
    for (const entry of result.data.entries) {
      void queue.enqueue(
        {
          url: entry.url,
          title: entry.title,
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

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-7 px-7 pb-12 pt-14">
      <AppHeader onOpenHistory={history.open} onOpenSettings={settings.open} />

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

      <DownloadToaster jobs={queue.jobs} onDismiss={queue.remove} />
      <SettingsDialog settings={settings} />
      <HistoryDrawer history={history} onDownloadAgain={enqueue} />
    </main>
  );
}

export default App;
