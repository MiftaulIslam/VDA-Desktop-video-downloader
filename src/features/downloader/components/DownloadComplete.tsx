interface DownloadCompleteProps {
  filePath: string;
  onOpen: () => void;
  onReveal: () => void;
}

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function DownloadComplete({
  filePath,
  onOpen,
  onReveal,
}: DownloadCompleteProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.4)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-ink">Download complete</p>
        <p className="max-w-[320px] truncate text-[13px] text-dim" title={filePath}>
          {fileName(filePath)}
        </p>
      </div>

      <div className="mt-1 flex w-full gap-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:translate-y-px"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Open
        </button>
        <button
          type="button"
          onClick={onReveal}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-inputbg py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </svg>
          Open Folder
        </button>
      </div>
    </div>
  );
}
