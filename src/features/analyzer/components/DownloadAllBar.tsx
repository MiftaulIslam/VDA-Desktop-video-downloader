import type { QualityPreset } from "../../downloader";

export const PRESETS: QualityPreset[] = [
  { label: "2160p", kind: "video", maxHeight: 2160 },
  { label: "1440p", kind: "video", maxHeight: 1440 },
  { label: "1080p", kind: "video", maxHeight: 1080 },
  { label: "720p", kind: "video", maxHeight: 720 },
  { label: "480p", kind: "video", maxHeight: 480 },
  { label: "Audio", kind: "audio" },
];

function presetKey(preset: QualityPreset): string {
  return `${preset.kind}-${preset.maxHeight ?? "audio"}`;
}

interface DownloadAllBarProps {
  totalCount: number;
  selectedCount: number;
  preset: QualityPreset;
  estimateLabel: string | null;
  onPresetChange: (preset: QualityPreset) => void;
  onDownload: () => void;
}

export function DownloadAllBar({
  totalCount,
  selectedCount,
  preset,
  estimateLabel,
  onPresetChange,
  onDownload,
}: DownloadAllBarProps) {
  const targetCount = selectedCount || totalCount;
  const actionLabel = selectedCount
    ? `Download selected (${selectedCount})`
    : `Download all (${totalCount})`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-strong bg-inputbg px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Quality
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const active = presetKey(p) === presetKey(preset);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onPresetChange(p)}
                className={`rounded-lg border px-2.5 py-1 text-[13px] font-medium transition ${
                  active
                    ? "border-brand bg-brand/15 text-brand"
                    : "border-line bg-elev text-ink hover:border-brand hover:bg-brand/10 hover:text-brand"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-dim">
          {selectedCount
            ? `${selectedCount} of ${totalCount} selected`
            : `All ${totalCount} videos`}
          {estimateLabel && (
            <>
              {" · "}
              <span className="text-ink">~{estimateLabel}</span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={onDownload}
          disabled={targetCount === 0}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
