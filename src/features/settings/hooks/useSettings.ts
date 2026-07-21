import { useCallback, useEffect, useState } from "react";
import {
  getDefaultDestination,
  loadSettings,
  pickFolder,
  saveSettings,
} from "../api/settingsApi";
import type { Settings } from "../types";

const DEFAULTS: Settings = { destination: "", askEachTime: false };

export interface UseSettings {
  settings: Settings;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  changeDestination: () => Promise<void>;
  setAskEachTime: (value: boolean) => void;
}

/** Loads persisted settings on mount and keeps them in sync with disk. */
export function useSettings(): UseSettings {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      let loaded = await loadSettings();
      if (!loaded.destination) {
        loaded = { ...loaded, destination: await getDefaultDestination() };
        await saveSettings(loaded);
      }
      setSettings(loaded);
    })();
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    void saveSettings(next);
  }, []);

  const changeDestination = useCallback(async () => {
    const picked = await pickFolder(settings.destination);
    if (picked) persist({ ...settings, destination: picked });
  }, [settings, persist]);

  const setAskEachTime = useCallback(
    (value: boolean) => persist({ ...settings, askEachTime: value }),
    [settings, persist],
  );

  return {
    settings,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    changeDestination,
    setAskEachTime,
  };
}
