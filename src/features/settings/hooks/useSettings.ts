import { useCallback, useEffect, useState } from "react";
import { setCloseToTray } from "../../tray";
import { applyStartupWindow, setAutostart } from "../../startup";
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
  runOnStartup: false,
  startMinimized: false,
  startHidden: false,
  minimizeToTray: true,
  monitorClipboard: false,
  clipboardMode: "popup",
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
  setRunOnStartup: (value: boolean) => void;
  setStartMinimized: (value: boolean) => void;
  setStartHidden: (value: boolean) => void;
  setMinimizeToTray: (value: boolean) => void;
  setMonitorClipboard: (value: boolean) => void;
  setClipboardMode: (value: "popup" | "auto") => void;
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
      // Apply persisted desktop-integration state once at launch.
      void setCloseToTray(loaded.minimizeToTray);
      void setAutostart(loaded.runOnStartup);
      void applyStartupWindow({
        startHidden: loaded.startHidden,
        startMinimized: loaded.startMinimized,
      });
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

  const setRunOnStartup = useCallback(
    (value: boolean) => {
      persist({ ...settings, runOnStartup: value });
      void setAutostart(value);
    },
    [settings, persist],
  );

  const setStartMinimized = useCallback(
    (value: boolean) => persist({ ...settings, startMinimized: value }),
    [settings, persist],
  );

  const setStartHidden = useCallback(
    (value: boolean) => persist({ ...settings, startHidden: value }),
    [settings, persist],
  );

  const setMinimizeToTray = useCallback(
    (value: boolean) => {
      persist({ ...settings, minimizeToTray: value });
      void setCloseToTray(value);
    },
    [settings, persist],
  );

  const setMonitorClipboard = useCallback(
    (value: boolean) => persist({ ...settings, monitorClipboard: value }),
    [settings, persist],
  );

  const setClipboardMode = useCallback(
    (value: "popup" | "auto") => persist({ ...settings, clipboardMode: value }),
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
    setRunOnStartup,
    setStartMinimized,
    setStartHidden,
    setMinimizeToTray,
    setMonitorClipboard,
    setClipboardMode,
  };
}
