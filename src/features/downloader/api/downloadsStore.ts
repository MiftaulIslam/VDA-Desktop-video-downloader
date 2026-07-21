import { load, type Store } from "@tauri-apps/plugin-store";
import type { DownloadJob } from "../types";

/**
 * Local persistence for the downloads list. Kept on disk (app data dir) so
 * downloads survive restarts and are only removed when the user deletes them.
 */

const FILE = "downloads.json";
const KEY = "jobs";
let storePromise: Promise<Store> | null = null;

function store(): Promise<Store> {
  if (!storePromise) storePromise = load(FILE, { autoSave: false });
  return storePromise;
}

export async function loadJobs(): Promise<DownloadJob[]> {
  const s = await store();
  const jobs = (await s.get<DownloadJob[]>(KEY)) ?? [];
  // A job that was mid-flight when the app closed can't still be running, so
  // restore it as paused (resumable) rather than a phantom active job.
  return jobs.map((j) =>
    j.status === "active" || j.status === "queued"
      ? { ...j, status: "paused", speed: null, eta: null }
      : j,
  );
}

export async function saveJobs(jobs: DownloadJob[]): Promise<void> {
  const s = await store();
  await s.set(KEY, jobs);
  await s.save();
}
