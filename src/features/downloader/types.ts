export type DownloadKind = "video" | "audio";

export type DownloadStage = "video" | "audio" | "merging";

/** Mirrors the tagged enum emitted by the Rust `download_format` command. */
export type DownloadEvent =
  | {
      type: "progress";
      stage: "video" | "audio";
      percent: number;
      downloaded: number;
      total: number;
      speed: number | null;
      eta: number | null;
    }
  | { type: "merging" }
  | { type: "done"; path: string }
  | { type: "error"; message: string };

export interface DownloadRequest {
  url: string;
  title: string;
  thumbnail: string;
  label: string;
  formatId: string;
  ext: string;
  kind: DownloadKind;
  needsMux: boolean;
  /**
   * When set, download the best quality ≤ this height instead of a specific
   * format id (used by playlist "Download all" presets).
   */
  maxHeight?: number;
}

/** Where a download should be written, derived from user settings. */
export interface SaveTarget {
  destination: string;
  askEachTime: boolean;
}

/** The video a format belongs to — enough to build a DownloadRequest. */
export interface DownloadSource {
  url: string;
  title: string;
  thumbnail: string;
}

/** A "Download all" quality preset (best quality ≤ maxHeight, or audio). */
export interface QualityPreset {
  label: string;
  kind: DownloadKind;
  maxHeight?: number;
}

export type JobStatus = "queued" | "active" | "done" | "error";

/** A single download tracked by the queue. */
export interface DownloadJob {
  id: string;
  request: DownloadRequest;
  outputPath: string;
  status: JobStatus;
  stage: DownloadStage | null;
  percent: number;
  speed: number | null;
  eta: number | null;
  filePath: string | null;
  error: string | null;
}
