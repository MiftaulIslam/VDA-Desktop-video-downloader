import type {
  DownloadKind,
  DownloadSource,
  QualityPreset,
} from "../../downloader";
import type { FormatOption, PlaylistMeta } from "../types";
import { DownloadAllBar } from "./DownloadAllBar";
import { PlaylistItem } from "./PlaylistItem";

interface PlaylistViewProps {
  playlist: PlaylistMeta;
  onDownload: (source: DownloadSource, format: FormatOption, kind: DownloadKind) => void;
  onDownloadAll: (preset: QualityPreset) => void;
}

export function PlaylistView({
  playlist,
  onDownload,
  onDownloadAll,
}: PlaylistViewProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-elev p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink" title={playlist.title}>
          {playlist.title}
        </h2>
        <p className="text-[13px] text-dim">{playlist.count} videos</p>
      </div>

      <DownloadAllBar count={playlist.count} onSelect={onDownloadAll} />

      <div className="flex flex-col gap-2">
        {playlist.entries.map((entry, i) => (
          <PlaylistItem
            key={entry.id || entry.url}
            entry={entry}
            index={i}
            onDownload={onDownload}
          />
        ))}
      </div>
    </section>
  );
}
