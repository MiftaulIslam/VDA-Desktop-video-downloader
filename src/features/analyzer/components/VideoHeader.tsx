import type { VideoMeta } from "../types";
import { formatViews } from "../utils/format";

interface VideoHeaderProps {
  meta: VideoMeta;
}

export function VideoHeader({ meta }: VideoHeaderProps) {
  const views = formatViews(meta.view_count);

  return (
    <div className="flex flex-col gap-5 p-6 sm:flex-row">
      <div className="relative shrink-0 overflow-hidden rounded-xl border border-line">
        {meta.thumbnail ? (
          <img
            src={meta.thumbnail}
            alt=""
            className="h-[101px] w-[180px] object-cover"
          />
        ) : (
          <div className="h-[101px] w-[180px] bg-inputbg" />
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-white">
          {meta.duration}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="text-base font-semibold leading-snug text-ink">
          {meta.title}
        </h2>
        {meta.uploader && <p className="text-sm text-dim">{meta.uploader}</p>}
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-dim">
          <span>Duration {meta.duration}</span>
          {views && <span>· {views}</span>}
        </div>
      </div>
    </div>
  );
}
