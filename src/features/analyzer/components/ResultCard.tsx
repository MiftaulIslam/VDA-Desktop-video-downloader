import type { DownloadKind } from "../../downloader";
import type { FormatOption, VideoMeta } from "../types";
import { FormatList } from "./FormatList";
import { VideoHeader } from "./VideoHeader";

interface ResultCardProps {
  meta: VideoMeta;
  onDownload: (format: FormatOption, kind: DownloadKind) => void;
}

export function ResultCard({ meta, onDownload }: ResultCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-elev shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <VideoHeader meta={meta} />

      <div className="flex flex-col gap-5 border-t border-line px-6 py-5">
        <FormatList
          title="Video"
          formats={meta.video_formats}
          kind="video"
          accent
          keyPrefix="v"
          emptyLabel="No video formats found."
          onDownload={onDownload}
        />
        <FormatList
          title="Audio"
          formats={meta.audio_formats}
          kind="audio"
          keyPrefix="a"
          emptyLabel="No audio-only formats found."
          onDownload={onDownload}
        />
      </div>
    </section>
  );
}
