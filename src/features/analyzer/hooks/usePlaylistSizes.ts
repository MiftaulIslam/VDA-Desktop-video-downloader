import { useEffect, useState } from "react";
import { fetchPlaylistSizes } from "../api/analyzerApi";
import type { EntrySizes } from "../types";

export interface UsePlaylistSizes {
  /** Resolved sizes keyed by entry url (fills in progressively). */
  sizes: Record<string, EntrySizes>;
  /** True while entries are still being resolved. */
  loading: boolean;
}

/**
 * Resolves accurate download sizes for a playlist's entries in the background,
 * filling in results as each entry lands. Re-runs when the url set changes.
 */
export function usePlaylistSizes(urls: string[]): UsePlaylistSizes {
  const [sizes, setSizes] = useState<Record<string, EntrySizes>>({});
  const [loading, setLoading] = useState(false);
  const key = urls.join("|");

  useEffect(() => {
    if (!urls.length) {
      setSizes({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setSizes({});
    setLoading(true);

    void fetchPlaylistSizes(urls, (event) => {
      if (cancelled) return;
      if (event.type === "item") {
        setSizes((prev) => ({
          ...prev,
          [event.url]: { video: event.video, audio: event.audio },
        }));
      } else if (event.type === "done") {
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { sizes, loading };
}
