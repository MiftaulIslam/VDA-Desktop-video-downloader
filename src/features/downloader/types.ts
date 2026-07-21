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
}

/** Where a download should be written, derived from user settings. */
export interface SaveTarget {
  destination: string;
  askEachTime: boolean;
}

export type DownloadStatus = "idle" | "active" | "done" | "error";

export interface DownloadState {
  status: DownloadStatus;
  stage: DownloadStage | null;
  percent: number;
  speed: number | null;
  eta: number | null;
  filePath: string | null;
  error: string | null;
  title: string;
}
