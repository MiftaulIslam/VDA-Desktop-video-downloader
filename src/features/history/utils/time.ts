/** Compact relative time, e.g. "just now", "3h ago", "Yesterday", "12 Jun". */
export function formatWhen(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(epochMs).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
