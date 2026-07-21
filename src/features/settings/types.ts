export interface Settings {
  /** Default folder downloads are saved to (user's Downloads by default). */
  destination: string;
  /** When true, prompt for a save location on every download. */
  askEachTime: boolean;
  /** Max downloads allowed to run at the same time. */
  maxConcurrent: number;
  /** Filename template, e.g. "%(uploader)s - %(title)s". */
  namingTemplate: string;
}
