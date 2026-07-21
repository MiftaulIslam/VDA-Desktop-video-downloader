import type { DownloadKind } from "../../downloader";
import type { FormatOption } from "../types";
import { FormatRow } from "./FormatRow";

interface FormatListProps {
  title: string;
  formats: FormatOption[];
  kind: DownloadKind;
  accent?: boolean;
  emptyLabel: string;
  keyPrefix: string;
  onDownload: (format: FormatOption, kind: DownloadKind) => void;
}

export function FormatList({
  title,
  formats,
  kind,
  accent,
  emptyLabel,
  keyPrefix,
  onDownload,
}: FormatListProps) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-dim">
        {title}
      </h3>
      {formats.length ? (
        <div className="flex flex-col gap-2">
          {formats.map((f) => (
            <FormatRow
              key={`${keyPrefix}-${f.id}`}
              format={f}
              kind={kind}
              accent={accent}
              onDownload={onDownload}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-dim">{emptyLabel}</p>
      )}
    </div>
  );
}
