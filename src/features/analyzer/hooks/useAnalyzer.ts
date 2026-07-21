import { useCallback, useState } from "react";
import { analyze as analyzeUrl } from "../api/analyzerApi";
import { isValidUrl } from "../utils/url";
import type { AnalyzeResult, AnalyzeStatus } from "../types";

export interface UseAnalyzer {
  url: string;
  status: AnalyzeStatus;
  error: string;
  result: AnalyzeResult | null;
  isLoading: boolean;
  setUrl: (value: string) => void;
  analyze: (overrideUrl?: string) => Promise<void>;
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
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const setUrl = useCallback((value: string) => {
    setUrlState(value);
    setStatus((prev) => (prev === "error" ? "idle" : prev));
  }, []);

  const reset = useCallback(() => {
    setUrlState("");
    setStatus("idle");
    setError("");
    setResult(null);
  }, []);

  const analyze = useCallback(
    async (overrideUrl?: string) => {
    const hasOverride = typeof overrideUrl === "string";
    const trimmed = (hasOverride ? overrideUrl : url).trim();
    if (hasOverride) setUrlState(overrideUrl);
    if (!isValidUrl(trimmed)) {
      setError("Please paste a valid http(s) URL.");
      setStatus("error");
      return;
    }

    setError("");
    setResult(null);
    setStatus("loading");

    try {
      const analyzed = await analyzeUrl(trimmed);
      setResult(analyzed);
      setStatus("done");
    } catch (e) {
      setError(typeof e === "string" ? e : "Something went wrong.");
      setStatus("error");
    }
    },
    [url],
  );

  return {
    url,
    status,
    error,
    result,
    isLoading: status === "loading",
    setUrl,
    analyze,
    reset,
  };
}
