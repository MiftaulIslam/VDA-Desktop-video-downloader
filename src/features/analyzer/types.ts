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
  duration_seconds: number | null;
  uploader: string | null;
}

export interface PlaylistMeta {
  title: string;
  count: number;
  entries: PlaylistEntry[];
}

/** Combined download size (bytes) available at a given resolution. */
export interface HeightSize {
  height: number;
  bytes: number;
}

/** Resolved real sizes for one playlist entry. */
export interface EntrySizes {
  /** Combined (muxed) size per resolution, largest first. */
  video: HeightSize[];
  /** Best audio-only download size. */
  audio: number | null;
}

/** Mirrors the Rust `fetch_playlist_sizes` streamed enum. */
export type PlaylistSizeEvent =
  | { type: "item"; url: string; video: HeightSize[]; audio: number | null }
  | { type: "failed"; url: string }
  | { type: "done" };

/** Mirrors the Rust `analyze` tagged result. */
export type AnalyzeResult =
  | { type: "video"; data: VideoMeta }
  | { type: "playlist"; data: PlaylistMeta };

export type AnalyzeStatus = "idle" | "loading" | "done" | "error";
