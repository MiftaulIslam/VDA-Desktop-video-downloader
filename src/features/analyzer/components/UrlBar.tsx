import type { AnalyzeStatus } from "../types";

interface UrlBarProps {
  value: string;
  status: AnalyzeStatus;
  isLoading: boolean;
  error: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export function UrlBar({
  value,
  status,
  isLoading,
  error,
  onChange,
  onAnalyze,
  onClear,
}: UrlBarProps) {
  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text.trim());
    } catch {
      // Clipboard read can be blocked; user can paste manually.
    }
  }

  const isError = status === "error";

  return (
    <section className="rounded-2xl border border-line bg-elev p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <label
        htmlFor="url-input"
        className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-dim"
      >
        URL
      </label>

      <div
        className={`flex items-center gap-2 rounded-xl border bg-inputbg py-1.5 pl-3 pr-1.5 transition ${
          isError
            ? "border-danger shadow-[0_0_0_3px_rgba(255,91,106,0.15)]"
            : "border-line-strong focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(91,140,255,0.18)]"
        }`}
      >
        <span className="flex shrink-0 text-dim">
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>

        <input
          id="url-input"
          type="text"
          inputMode="url"
          autoFocus
          spellCheck={false}
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) onAnalyze();
          }}
          className="min-w-0 flex-1 border-none bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-[#5b6474]"
        />

        {value ? (
          <button
            type="button"
            title="Clear"
            onClick={onClear}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] text-dim transition hover:bg-white/5 hover:text-ink"
          >
            ✕
          </button>
        ) : (
          <button
            type="button"
            title="Paste from clipboard"
            onClick={pasteFromClipboard}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] text-dim transition hover:bg-white/5 hover:text-ink"
          >
            Paste
          </button>
        )}

        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading || value.trim().length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-[9px] bg-brand px-[18px] py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover active:translate-y-px active:bg-brand-press disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {isLoading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {isError && <p className="mx-0.5 mt-2.5 text-[13px] text-danger">{error}</p>}
    </section>
  );
}
