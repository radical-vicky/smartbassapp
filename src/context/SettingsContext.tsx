// src/context/SettingsContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const SETTINGS_KEY = "logicbass.settings.v1";

export type PlaybackQuality = "Low" | "Normal" | "High" | "Lossless";
export type Appearance = "Dark" | "Light" | "System";
export type Language = "English" | "French" | "Spanish" | "Swahili";

export type AppSettings = {
  // Playback
  autoplayNext: boolean;
  crossfadeSeconds: number; // 0, 3, 5, 8, 12
  gaplessPlayback: boolean;
  resumeOnHeadphones: boolean;

  // Audio quality
  audioQuality: PlaybackQuality;
  downloadQuality: PlaybackQuality;

  // Sleep timer
  sleepTimerMinutes: number | null;

  // Notifications
  lockScreenControls: boolean;
  showNotifications: boolean;

  // Appearance
  appearance: Appearance;

  // Language
  language: Language;

  // Downloads
  downloadOverWifiOnly: boolean;
  autoDownloadFavourites: boolean;

  // Storage
  cacheLimitMb: number;
};

const DEFAULT_SETTINGS: AppSettings = {
  autoplayNext: true,
  crossfadeSeconds: 0,
  gaplessPlayback: true,
  resumeOnHeadphones: true,

  audioQuality: "High",
  downloadQuality: "High",

  sleepTimerMinutes: null,

  lockScreenControls: true,
  showNotifications: true,

  appearance: "Dark",
  language: "English",

  downloadOverWifiOnly: true,
  autoDownloadFavourites: false,

  cacheLimitMb: 1024,
};

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
  ready: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.warn("Settings load failed:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(DEFAULT_SETTINGS)
    ).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings, ready }),
    [settings, updateSettings, resetSettings, ready]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}