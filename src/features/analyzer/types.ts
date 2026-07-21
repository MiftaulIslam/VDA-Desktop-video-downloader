export type FormatKind = "video" | "audio";

export interface FormatOption {
  id: string;
  label: string;
  ext: string;
  filesize: string | null;
  detail: string | null;
  needs_mux: boolean;
}

export interface VideoMeta {
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  view_count: number | null;
  video_formats: FormatOption[];
  audio_formats: FormatOption[];
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
}

export interface PlaylistMeta {
  title: string;
  count: number;
  entries: PlaylistEntry[];
}

/** Mirrors the Rust `analyze` tagged result. */
export type AnalyzeResult =
  | { type: "video"; data: VideoMeta }
  | { type: "playlist"; data: PlaylistMeta };

export type AnalyzeStatus = "idle" | "loading" | "done" | "error";
