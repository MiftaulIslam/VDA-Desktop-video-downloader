interface DownloadButtonProps {
  onClick: () => void;
  title?: string;
}

/**
 * Compact download control shown at the end of a format row. Subtle by
 * default; becomes prominent when the surrounding row is hovered (the row
 * applies the `group` class).
 */
export function DownloadButton({ onClick, title = "Download" }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-dim transition group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand hover:!bg-brand hover:!text-white"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>
  );
}
