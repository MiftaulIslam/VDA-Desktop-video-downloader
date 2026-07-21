import { load, type Store } from "@tauri-apps/plugin-store";
import type { HistoryRecord } from "../types";

/**
 * Data-access boundary for download history. Persisted to a local JSON store
 * in the app's data directory — it stays on the user's machine, never the
 * network.
 */

const FILE = "history.json";
const KEY = "items";
let storePromise: Promise<Store> | null = null;

function store(): Promise<Store> {
  if (!storePromise) storePromise = load(FILE, { autoSave: true });
  return storePromise;
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  const s = await store();
  return (await s.get<HistoryRecord[]>(KEY)) ?? [];
}

export async function saveHistory(items: HistoryRecord[]): Promise<void> {
  const s = await store();
  await s.set(KEY, items);
  await s.save();
}
