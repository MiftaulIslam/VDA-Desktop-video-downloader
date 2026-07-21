import { useState } from "react";
import type { DownloadKind, DownloadSource } from "../../downloader";
import { fetchMetadata } from "../api/analyzerApi";
import type { FormatOption, PlaylistEntry, VideoMeta } from "../types";
import { FormatList } from "./FormatList";

interface PlaylistItemProps {
  entry: PlaylistEntry;
  index: number;
  selected: boolean;
  onToggleSelect: (url: string) => void;
  /** Estimated size at the current preset, e.g. "42.1 MB". */
  sizeLabel: string | null;
  onDownload: (source: DownloadSource, format: FormatOption, kind: DownloadKind) => void;
}

export function PlaylistItem({
  entry,
  index,
  selected,
  onToggleSelect,
  sizeLabel,
  onDownload,
}: PlaylistItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !meta && !loading) {
      setLoading(true);
      setError("");
      try {
        setMeta(await fetchMetadata(entry.url));
      } catch (e) {
        setError(typeof e === "string" ? e : "Could not load formats.");
      } finally {
        setLoading(false);
      }
    }
  }

  function handleFormat(format: FormatOption, kind: DownloadKind) {
    const source: DownloadSource = {
      url: entry.url,
      title: entry.title,
      thumbnail: entry.thumbnail,
      uploader: meta?.uploader ?? entry.uploader ?? undefined,
    };
    onDownload(source, format, kind);
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-inputbg transition ${
        selected ? "border-brand" : "border-line"
      }`}
    >
      <div className="flex w-full items-center gap-3 px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(entry.url)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${entry.title}`}
          className="h-4 w-4 shrink-0 cursor-pointer accent-brand"
        />
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="w-5 shrink-0 text-center text-xs font-semibold text-dim">
            {index + 1}
          </span>
          <div className="relative h-11 w-20 shrink-0 overflow-hidden rounded-md bg-bg">
            {entry.thumbnail && (
              <img src={entry.thumbnail} alt="" className="h-full w-full object-cover" />
            )}
            <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1 text-[9px] font-semibold text-white">
              {entry.duration}
            </span>
          </div>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink" title={entry.title}>
            {entry.title}
          </span>
          {sizeLabel && (
            <span className="shrink-0 text-[11px] font-medium text-dim">
              ~{sizeLabel}
            </span>
          )}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-dim transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-line px-3 py-3">
          {loading && (
            <div className="flex flex-col gap-2">
              <div className="h-9 w-full animate-pulse rounded-lg bg-bg" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-bg" />
            </div>
          )}
          {error && <p className="text-[13px] text-danger">{error}</p>}
          {meta && (
            <div className="flex flex-col gap-4">
              <FormatList
                title="Video"
                formats={meta.video_formats}
                kind="video"
                accent
                keyPrefix={`${entry.id}-v`}
                emptyLabel="No video formats found."
                onDownload={handleFormat}
              />
              <FormatList
                title="Audio"
                formats={meta.audio_formats}
                kind="audio"
                keyPrefix={`${entry.id}-a`}
                emptyLabel="No audio-only formats found."
                onDownload={handleFormat}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
