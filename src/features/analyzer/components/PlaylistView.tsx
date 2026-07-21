import { useMemo, useState } from "react";
import type {
  DownloadKind,
  DownloadSource,
  QualityPreset,
} from "../../downloader";
import { usePlaylistSizes } from "../hooks/usePlaylistSizes";
import type { FormatOption, PlaylistMeta } from "../types";
import { bytesForPreset, estimateTotal, humanSize } from "../utils/size";
import { DownloadAllBar, PRESETS } from "./DownloadAllBar";
import { PlaylistItem } from "./PlaylistItem";

interface PlaylistViewProps {
  playlist: PlaylistMeta;
  onDownload: (source: DownloadSource, format: FormatOption, kind: DownloadKind) => void;
  onDownloadSelected: (urls: string[], preset: QualityPreset) => void;
}

export function PlaylistView({
  playlist,
  onDownload,
  onDownloadSelected,
}: PlaylistViewProps) {
  const urls = useMemo(
    () => playlist.entries.map((e) => e.url),
    [playlist.entries],
  );
  const { sizes, loading } = usePlaylistSizes(urls);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<QualityPreset>(
    PRESETS.find((p) => p.maxHeight === 1080) ?? PRESETS[0],
  );

  const targetUrls = selected.size ? urls.filter((u) => selected.has(u)) : urls;
  const estimate = useMemo(
    () => estimateTotal(targetUrls, sizes, preset),
    [targetUrls, sizes, preset],
  );
  const estimateLabel = estimate.known
    ? `${humanSize(estimate.bytes)}${
        loading || estimate.unknown ? "+" : ""
      }`
    : loading
      ? "calculating…"
      : null;

  const allSelected = selected.size === urls.length && urls.length > 0;

  function toggleSelect(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(urls));
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-elev p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink" title={playlist.title}>
          {playlist.title}
        </h2>
        <p className="text-[13px] text-dim">
          {playlist.count} videos
          {estimate.known > 0 && (
            <>
              {" · "}~{humanSize(estimate.bytes)}
              {(loading || estimate.unknown > 0) && "+"} estimated
            </>
          )}
        </p>
      </div>

      <DownloadAllBar
        totalCount={urls.length}
        selectedCount={selected.size}
        preset={preset}
        estimateLabel={estimateLabel}
        onPresetChange={setPreset}
        onDownload={() => onDownloadSelected(targetUrls, preset)}
      />

      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-dim">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 cursor-pointer accent-brand"
        />
        Select all
      </label>

      <div className="flex flex-col gap-2">
        {playlist.entries.map((entry, i) => {
          const b = bytesForPreset(sizes[entry.url], preset);
          return (
            <PlaylistItem
              key={entry.id || entry.url}
              entry={entry}
              index={i}
              selected={selected.has(entry.url)}
              onToggleSelect={toggleSelect}
              sizeLabel={b != null ? humanSize(b) : null}
              onDownload={onDownload}
            />
          );
        })}
      </div>
    </section>
  );
}
