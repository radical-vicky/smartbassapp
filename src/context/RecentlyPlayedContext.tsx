// src/context/RecentlyPlayedContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import type { DeviceTrack } from "./MusicContext";

const STORAGE_KEY = "@radev/recently_played";
const MAX_ENTRIES = 50;

interface RecentlyPlayedContextType {
  recentTracks: DeviceTrack[];
  recordPlay: (track: DeviceTrack) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const RecentlyPlayedContext =
  createContext<RecentlyPlayedContextType | undefined>(undefined);

export function RecentlyPlayedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recentTracks, setRecentTracks] = useState<DeviceTrack[]>([]);

  // Load once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRecentTracks(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const persist = async (list: DeviceTrack[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  };

  const recordPlay = useCallback(
    async (track: DeviceTrack) => {
      setRecentTracks((prev) => {
        // Remove if already there, then prepend
        const filtered = prev.filter((t) => t.id !== track.id);
        const next = [track, ...filtered].slice(0, MAX_ENTRIES);
        void persist(next);
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(async () => {
    setRecentTracks([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <RecentlyPlayedContext.Provider
      value={{ recentTracks, recordPlay, clearHistory }}
    >
      {children}
    </RecentlyPlayedContext.Provider>
  );
}

export function useRecentlyPlayed() {
  const ctx = useContext(RecentlyPlayedContext);
  if (!ctx) {
    throw new Error("useRecentlyPlayed must be used within a RecentlyPlayedProvider");
  }
  return ctx;
}