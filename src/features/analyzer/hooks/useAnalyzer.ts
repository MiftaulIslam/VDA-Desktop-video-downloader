import { useCallback, useState } from "react";
import { fetchMetadata } from "../api/analyzerApi";
import { isValidUrl } from "../utils/url";
import type { AnalyzeStatus, VideoMeta } from "../types";

export interface UseAnalyzer {
  url: string;
  status: AnalyzeStatus;
  error: string;
  meta: VideoMeta | null;
  isLoading: boolean;
  setUrl: (value: string) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

/**
 * Owns all analyzer business logic: input state, the analyze lifecycle,
 * validation, and error handling. Components consume this and stay
 * presentational (dependency inversion — UI depends on this contract,
 * not on the transport or validation details).
 */
export function useAnalyzer(): UseAnalyzer {
  const [url, setUrlState] = useState("");
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<VideoMeta | null>(null);

  const setUrl = useCallback((value: string) => {
    setUrlState(value);
    setStatus((prev) => (prev === "error" ? "idle" : prev));
  }, []);

  const reset = useCallback(() => {
    setUrlState("");
    setStatus("idle");
    setError("");
    setMeta(null);
  }, []);

  const analyze = useCallback(async () => {
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setError("Please paste a valid http(s) URL.");
      setStatus("error");
      return;
    }

    setError("");
    setMeta(null);
    setStatus("loading");

    try {
      const result = await fetchMetadata(trimmed);
      setMeta(result);
      setStatus("done");
    } catch (e) {
      setError(typeof e === "string" ? e : "Something went wrong.");
      setStatus("error");
    }
  }, [url]);

  return {
    url,
    status,
    error,
    meta,
    isLoading: status === "loading",
    setUrl,
    analyze,
    reset,
  };
}
