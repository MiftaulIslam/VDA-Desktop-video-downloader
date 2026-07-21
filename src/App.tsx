import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import {
  ResultCard,
  ResultSkeleton,
  UrlBar,
  useAnalyzer,
  type FormatOption,
} from "./features/analyzer";
import {
  DownloadDialog,
  useDownloader,
  type DownloadKind,
  type DownloadRequest,
} from "./features/downloader";
import { SettingsDialog, useSettings } from "./features/settings";
import { HistoryDrawer, useHistory } from "./features/history";
import "./App.css";

function App() {
  const { url, status, error, meta, isLoading, setUrl, analyze, reset } =
    useAnalyzer();
  const settings = useSettings();
  const history = useHistory();
  const downloader = useDownloader({
    onComplete: (request, filePath) => history.add(request, filePath),
  });
  const [muxActive, setMuxActive] = useState(false);

  function runDownload(request: DownloadRequest) {
    setMuxActive(request.kind === "video" && request.needsMux);
    void downloader.start(request, settings.settings);
  }

  function onDownload(format: FormatOption, kind: DownloadKind) {
    if (!meta) return;
    runDownload({
      url,
      title: meta.title,
      thumbnail: meta.thumbnail,
      label: format.label,
      formatId: format.id,
      ext: kind === "video" ? "mp4" : format.ext,
      kind,
      needsMux: kind === "video" && format.needs_mux,
    });
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-7 px-7 pb-12 pt-14">
      <AppHeader
        onOpenHistory={history.open}
        onOpenSettings={settings.open}
      />

      <UrlBar
        value={url}
        status={status}
        isLoading={isLoading}
        error={error}
        onChange={setUrl}
        onAnalyze={analyze}
        onClear={reset}
      />

      {status === "loading" && <ResultSkeleton />}
      {status === "done" && meta && (
        <ResultCard meta={meta} onDownload={onDownload} />
      )}

      <DownloadDialog downloader={downloader} showMux={muxActive} />
      <SettingsDialog settings={settings} />
      <HistoryDrawer history={history} onDownloadAgain={runDownload} />
    </main>
  );
}

export default App;
