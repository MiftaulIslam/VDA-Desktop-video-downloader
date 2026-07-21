import { DownloadButton, type DownloadKind } from "../../downloader";
import type { FormatOption } from "../types";

interface FormatRowProps {
  format: FormatOption;
  kind: DownloadKind;
  accent?: boolean;
  onDownload: (format: FormatOption, kind: DownloadKind) => void;
}

export function FormatRow({ format, kind, accent, onDownload }: FormatRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-line bg-inputbg px-4 py-2.5 transition hover:border-line-strong">
      <span
        className={`flex h-8 min-w-[52px] items-center justify-center rounded-lg px-2 text-[13px] font-bold ${
          accent ? "bg-brand/15 text-brand" : "bg-white/5 text-ink"
        }`}
      >
        {format.label}
      </span>
      <span className="text-sm font-medium uppercase text-ink">
        {format.ext}
      </span>
      {format.detail && format.detail !== "audio" && (
        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-dim">
          {format.detail}
        </span>
      )}
      <span className="ml-auto text-[13px] text-dim">
        {format.filesize ?? ""}
      </span>
      <DownloadButton
        onClick={() => onDownload(format, kind)}
        title={`Download ${format.label} ${format.ext.toUpperCase()}`}
      />
    </div>
  );
}
