interface ProgressBarProps {
  percent: number;
  /** Indeterminate = animated sweep with no fixed value (e.g. merging). */
  indeterminate?: boolean;
}

export function ProgressBar({ percent, indeterminate }: ProgressBarProps) {
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-inputbg">
      {indeterminate ? (
        <div className="absolute inset-y-0 w-1/3 animate-[slide_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand to-[#a06bff]" />
      ) : (
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-[#a06bff] transition-[width] duration-300 ease-out"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
      )}
    </div>
  );
}
