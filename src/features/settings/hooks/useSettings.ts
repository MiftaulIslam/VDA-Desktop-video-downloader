import { useCallback, useEffect, useState } from "react";
import {
  getDefaultDestination,
  loadSettings,
  pickFolder,
  saveSettings,
} from "../api/settingsApi";
import type { Settings } from "../types";

const DEFAULTS: Settings = {
  destination: "",
  askEachTime: false,
  maxConcurrent: 3,
  namingTemplate: "%(uploader)s - %(title)s",
};

export interface UseSettings {
  settings: Settings;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  changeDestination: () => Promise<void>;
  setAskEachTime: (value: boolean) => void;
  setMaxConcurrent: (value: number) => void;
  setNamingTemplate: (value: string) => void;
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

  const setMaxConcurrent = useCallback(
    (value: number) => persist({ ...settings, maxConcurrent: value }),
    [settings, persist],
  );

  const setNamingTemplate = useCallback(
    (value: string) => persist({ ...settings, namingTemplate: value }),
    [settings, persist],
  );

  return {
    settings,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    changeDestination,
    setAskEachTime,
    setMaxConcurrent,
    setNamingTemplate,
  };
}
