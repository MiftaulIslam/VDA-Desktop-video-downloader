import type { DownloadRequest } from "../downloader";

export interface HistoryRecord {
  id: string;
  /** Full request payload so the download can be repeated. */
  request: DownloadRequest;
  filePath: string;
  /** Epoch milliseconds. */
  downloadedAt: number;
}
