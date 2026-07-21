import { useEffect, useState } from "react";
import { checkForUpdate, installUpdate, type Update } from "../api/updaterApi";

export interface UseUpdater {
  /** Newer version string when an update is available and not dismissed. */
  version: string | null;
  /** Release notes/body, if provided. */
  notes: string | null;
  installing: boolean;
  /** Download progress 0-1 while installing. */
  progress: number;
  install: () => Promise<void>;
  dismiss: () => void;
}

/** Checks for updates once on mount and drives the update prompt. */
export function useUpdater(): UseUpdater {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    void (async () => {
      const found = await checkForUpdate();
      if (found) setUpdate(found);
    })();
  }, []);

  async function install() {
    if (!update) return;
    setInstalling(true);
    try {
      await installUpdate(update, setProgress);
    } catch {
      // Failed/cancelled — let the user retry or dismiss.
      setInstalling(false);
    }
  }

  const visible = update != null && !dismissed;

  return {
    version: visible ? update.version : null,
    notes: visible ? (update.body ?? null) : null,
    installing,
    progress,
    install,
    dismiss: () => setDismissed(true),
  };
}
