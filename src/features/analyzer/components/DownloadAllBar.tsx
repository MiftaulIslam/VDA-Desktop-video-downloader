import type { QualityPreset } from "../../downloader";

interface DownloadAllBarProps {
  count: number;
  onSelect: (preset: QualityPreset) => void;
}

const PRESETS: QualityPreset[] = [
  { label: "2160p", kind: "video", maxHeight: 2160 },
  { label: "1440p", kind: "video", maxHeight: 1440 },
  { label: "1080p", kind: "video", maxHeight: 1080 },
  { label: "720p", kind: "video", maxHeight: 720 },
  { label: "480p", kind: "video", maxHeight: 480 },
  { label: "Audio", kind: "audio" },
];

export function DownloadAllBar({ count, onSelect }: DownloadAllBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line-strong bg-inputbg px-4 py-3">
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
        Download all
        <span className="text-xs font-normal text-dim">({count})</span>
      </span>
      <span className="text-xs text-dim">at</span>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset)}
            className="rounded-lg border border-line bg-elev px-2.5 py-1 text-[13px] font-medium text-ink transition hover:border-brand hover:bg-brand/10 hover:text-brand"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
