export interface Settings {
  /** Default folder downloads are saved to (user's Downloads by default). */
  destination: string;
  /** When true, prompt for a save location on every download. */
  askEachTime: boolean;
  /** Max downloads allowed to run at the same time. */
  maxConcurrent: number;
  /** Filename template, e.g. "%(uploader)s - %(title)s". */
  namingTemplate: string;
  /** Launch the app automatically when Windows starts. */
  runOnStartup: boolean;
  /** Start the window minimized. */
  startMinimized: boolean;
  /** Start hidden in the system tray (no visible window). */
  startHidden: boolean;
  /** Closing the window hides it to the tray instead of quitting. */
  minimizeToTray: boolean;
  /** Watch the clipboard for copied YouTube URLs. */
  monitorClipboard: boolean;
  /** How a detected URL is handled: confirm popup, or analyze immediately. */
  clipboardMode: "popup" | "auto";
}
