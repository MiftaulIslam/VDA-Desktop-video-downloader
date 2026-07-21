import type { DownloadRequest } from "../downloader";

export interface HistoryRecord {
  id: string;
  /** Full request payload so the download can be repeated. */
  request: DownloadRequest;
  filePath: string;
  /** Epoch milliseconds. */
  downloadedAt: number;
  /** Hidden from the recent-downloads strip (still shown in the drawer). */
  hiddenFromRecent?: boolean;
}
