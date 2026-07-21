import { downloadDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { load, type Store } from "@tauri-apps/plugin-store";
import type { Settings } from "../types";

/**
 * Data-access boundary for settings. Persists to a local JSON store in the
 * app's data directory (never the network), and wraps the native folder
 * picker and default-path lookup.
 */

const FILE = "settings.json";
let storePromise: Promise<Store> | null = null;

function store(): Promise<Store> {
  if (!storePromise) storePromise = load(FILE, { autoSave: true });
  return storePromise;
}

export async function getDefaultDestination(): Promise<string> {
  try {
    return await downloadDir();
  } catch {
    return "";
  }
}

export async function loadSettings(): Promise<Settings> {
  const s = await store();
  const destination = (await s.get<string>("destination")) ?? "";
  const askEachTime = (await s.get<boolean>("askEachTime")) ?? false;
  return { destination, askEachTime };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const s = await store();
  await s.set("destination", settings.destination);
  await s.set("askEachTime", settings.askEachTime);
  await s.save();
}

/** Native folder picker; returns null if cancelled. */
export async function pickFolder(current?: string): Promise<string | null> {
  const result = await open({
    directory: true,
    multiple: false,
    defaultPath: current || undefined,
  });
  return typeof result === "string" ? result : null;
}
