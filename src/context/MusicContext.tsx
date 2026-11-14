// src/context/MusicContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  requestNotificationPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSample,
} from "expo-audio";
import * as MediaLibrary from "expo-media-library";
import { AssetField, MediaType, Query } from "expo-media-library";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

import type { SonicAudioCapabilities } from "../../modules/sonic-audio/src";
import SonicAudioModule from "../../modules/sonic-audio/src";
import MediaControl from "../lib/MediaControl";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export type DeviceTrack = {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  artist: string;
  album: string;
  folder: string;
};

export type RepeatMode = "OFF" | "ALL" | "ONE";
export type SoundProfile =
  | "BALANCED"
  | "DEEP BASS"
  | "VOCAL"
  | "STUDIO"
  | "SPATIAL"
  | "CUSTOM"
  | "AUTO"
  | "FLAT"
  | "BASS BOOST"
  | "ACOUSTIC"
  | "CLASSICAL"
  | "DUBSTEP"
  | "ELECTRONIC"
  | "HIP-HOP"
  | "HOUSE"
  | "JAZZ"
  | "MOVIE"
  | "PARTY"
  | "POP"
  | "REGGAE"
  | "ROCK"
  | "TREBLE BOOST";

export type ScanResult = {
  ok: boolean;
  reason?: "denied" | "error" | "busy";
};

const LIBRARY_CACHE_KEY = "logicbass.library.v2";
const EQ_STATE_KEY = "logicbass.eq_state.v1";
const FAVORITES_KEY = "logicbass.favorites.v1";

const SOUND_PROFILE_SETTINGS: Record<
  Exclude<SoundProfile, "CUSTOM">,
  { bass: number; clarity: number; spatial: number; preamp: number; levels?: number[] }
> = {
  BALANCED: { bass: 0, clarity: 0, spatial: 0, preamp: 0 },
  FLAT: { bass: 0, clarity: 0, spatial: 0, preamp: 0, levels: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  AUTO: { bass: 40, clarity: 50, spatial: 0, preamp: 2, levels: [4, 4, 3, 2, 1, 0, 0, 0, 1, 2, 3, 3, 4, 4, 3, 2] },
  "DEEP BASS": { bass: 85, clarity: 45, spatial: 0, preamp: 4 },
  VOCAL: { bass: 20, clarity: 80, spatial: 0, preamp: 0, levels: [3, 2, 0, -1, 1, 2, 3, 3, 2, 1, 2, 3, 4, 4, 3, 2] },
  STUDIO: { bass: 45, clarity: 75, spatial: 0, preamp: 0 },
  SPATIAL: { bass: 55, clarity: 75, spatial: 65, preamp: 0 },
  "BASS BOOST": { bass: 100, clarity: 30, spatial: 0, preamp: 12, levels: [12, 12, 11, 8, 4, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4] },
  ACOUSTIC: { bass: 50, clarity: 65, spatial: 0, preamp: 0, levels: [6, 5, 4, 2, 1, 0, 0, 0, 1, 2, 3, 4, 5, 5, 4, 3] },
  CLASSICAL: { bass: 50, clarity: 65, spatial: 0, preamp: 0, levels: [5, 4, 3, 1, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 3, 2] },
  DUBSTEP: { bass: 90, clarity: 45, spatial: 0, preamp: 4, levels: [12, 12, 12, 10, 8, 4, 0, -1, 0, 2, 4, 6, 8, 10, 11, 12] },
  ELECTRONIC: { bass: 70, clarity: 60, spatial: 0, preamp: 2, levels: [9, 9, 8, 6, 3, 0, 0, 1, 3, 5, 6, 7, 8, 8, 7, 6] },
  "HIP-HOP": { bass: 90, clarity: 45, spatial: 0, preamp: 4, levels: [11, 10, 8, 6, 3, 1, 0, -1, 0, 1, 2, 3, 4, 5, 5, 4] },
  HOUSE: { bass: 90, clarity: 45, spatial: 0, preamp: 4, levels: [10, 9, 7, 5, 2, 0, 0, 1, 2, 3, 5, 6, 7, 7, 6, 5] },
  JAZZ: { bass: 50, clarity: 65, spatial: 0, preamp: 0, levels: [6, 5, 4, 2, 0, -1, -1, 0, 1, 2, 3, 4, 5, 5, 4, 3] },
  MOVIE: { bass: 70, clarity: 60, spatial: 0, preamp: 2, levels: [10, 10, 8, 6, 3, 0, -1, -1, 0, 1, 3, 5, 6, 7, 7, 6] },
  PARTY: { bass: 90, clarity: 45, spatial: 0, preamp: 4, levels: [12, 11, 9, 7, 4, 1, 0, 0, 1, 3, 5, 7, 8, 9, 9, 8] },
  POP: { bass: 70, clarity: 60, spatial: 0, preamp: 2, levels: [7, 6, 5, 3, 0, -1, -1, 0, 1, 3, 4, 5, 6, 6, 5, 4] },
  REGGAE: { bass: 90, clarity: 45, spatial: 0, preamp: 4, levels: [11, 10, 8, 5, 2, 0, 0, 0, 0, 1, 2, 3, 4, 4, 5, 5] },
  ROCK: { bass: 70, clarity: 60, spatial: 0, preamp: 2, levels: [8, 7, 5, 2, -1, -2, -1, 1, 3, 4, 5, 6, 7, 7, 6, 5] },
  "TREBLE BOOST": { bass: 0, clarity: 90, spatial: 0, preamp: 0, levels: [-6, -6, -4, -2, 0, 1, 3, 5, 7, 9, 11, 12, 12, 12, 11, 10] },
};

/* -------------------------------------------------------------------------- */
/*                         FILENAME / URI PARSING                             */
/* -------------------------------------------------------------------------- */

function parseTrackMeta(filename: string, uri: string) {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "").trim();

  let folder = "Unknown Folder";
  try {
    const decodedUri = decodeURIComponent(uri);
    const pathParts = decodedUri.split("/");
    pathParts.pop();
    if (pathParts.length > 0) folder = pathParts[pathParts.length - 1] || "Unknown Folder";
  } catch {}

  let artist = "Unknown Artist";
  let album = folder;

  const dashSplit = nameWithoutExt.split(/\s[-–]\s/);
  if (dashSplit.length === 2) {
    artist = dashSplit[0].trim();
  } else if (dashSplit.length >= 3) {
    artist = dashSplit[0].trim();
    album = dashSplit[1].trim();
  }

  return { artist, album, folder };
}

/* -------------------------------------------------------------------------- */
/*                                  CONTEXT TYPES                             */
/* -------------------------------------------------------------------------- */

type MusicContextType = {
  tracks: DeviceTrack[];
  queue: DeviceTrack[];
  currentTrack: DeviceTrack | null;
  currentIndex: number;

  isScanning: boolean;
  hasScanned: boolean;

  isPlaying: boolean;
  isLoaded: boolean;
  isBuffering: boolean;

  shuffle: boolean;
  repeatMode: RepeatMode;
  soundProfile: SoundProfile;
  sonicEnabled: boolean;
  equalizerLevels: number[];
  bassBoost: number;
  clarity: number;
  spatial: number;
  preamp: number;
  visualizerEnabled: boolean;
  sleepTimerMinutes: number | null;
  audioCapabilities: SonicAudioCapabilities | null;

  favorites: string[];
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;

  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;

  scanDeviceMusic: (forceRefresh?: boolean) => Promise<ScanResult>;
  queueTracks: (tracks: DeviceTrack[]) => void;
  playTrack: (track: DeviceTrack, sourceQueue?: DeviceTrack[]) => void;
  playFromQueue: (trackId: string) => void;
  playPreview: (url: string) => Promise<void>;
  togglePlayback: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  selectSoundProfile: (profile: SoundProfile) => void;
  setSonicEnabled: (enabled: boolean) => void;
  setEqualizerLevels: (levels: number[]) => void;
  setBassBoost: (amount: number) => void;
  setClarity: (amount: number) => void;
  setSpatial: (amount: number) => void;
  setPreamp: (amount: number) => void;
  enableVisualizer: () => Promise<void>;
  disableVisualizer: () => void;
  setSleepTimer: (minutes: number | null) => void;
  seekTo: (seconds: number) => void;
};

type MusicProgress = {
  currentTime: number;
  duration: number;
};

type AudioControllerProps = {
  onPlayerReady: (player: any) => void;
  onStatusChange: (status: any) => void;
  onAudioSample: (sample: AudioSample) => void;
  visualizerEnabled: boolean;
};

/* -------------------------------------------------------------------------- */
/*                              AUDIO CONTROLLER                              */
/* -------------------------------------------------------------------------- */

function AudioController({
  onPlayerReady,
  onStatusChange,
  onAudioSample,
  visualizerEnabled,
}: AudioControllerProps) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let active = true;
    void setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      playsInSilentMode: true,
    })
      .catch((error) => {
        console.error("Unable to enable background audio playback:", error);
      })
      .finally(() => {
        if (active) onPlayerReady(player);
      });

    return () => {
      active = false;
      player.clearLockScreenControls();
    };
  }, [player, onPlayerReady]);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (!visualizerEnabled || !player.isAudioSamplingSupported) return;
    player.setAudioSamplingEnabled(true);
    const subscription = player.addListener("audioSampleUpdate", onAudioSample);
    return () => {
      subscription.remove();
      player.setAudioSamplingEnabled(false);
    };
  }, [player, onAudioSample, visualizerEnabled]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  CONTEXT                                   */
/* -------------------------------------------------------------------------- */

const MusicContext = createContext<MusicContextType | undefined>(undefined);
const MusicProgressContext = createContext<MusicProgress | undefined>(undefined);
const MusicVisualizerContext = createContext<number[] | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*                               MUSIC PROVIDER                               */
/* -------------------------------------------------------------------------- */

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<DeviceTrack[]>([]);
  const [queue, setQueue] = useState<DeviceTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<DeviceTrack | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [progress, setProgress] = useState<MusicProgress>({ currentTime: 0, duration: 0 });
  const progressRef = useRef<MusicProgress>(progress);

  const updateProgress = useCallback((next: MusicProgress) => {
    progressRef.current = next;
    setProgress((previous) =>
      previous.currentTime === next.currentTime && previous.duration === next.duration ? previous : next
    );
  }, []);

  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("OFF");
  const [soundProfile, setSoundProfile] = useState<SoundProfile>("AUTO");
  const [sonicEnabled, setSonicEnabledState] = useState(true);
  const [equalizerLevels, setEqualizerLevelsState] = useState<number[]>(Array(16).fill(0));
  const [bassBoost, setBassBoostState] = useState(0);
  const [clarity, setClarityState] = useState(0);
  const [spatial, setSpatialState] = useState(0);
  const [preamp, setPreampState] = useState(0);
  const [visualizerLevels, setVisualizerLevels] = useState<number[]>(Array(24).fill(0));
  const [visualizerEnabled, setVisualizerEnabled] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [audioCapabilities, setAudioCapabilities] = useState<SonicAudioCapabilities | null>(null);

  const [favorites, setFavorites] = useState<string[]>([]);

  const [clientReady, setClientReady] = useState(false);
  const [eqLoaded, setEqLoaded] = useState(false);

  const playerRef = useRef<any>(null);
  const pendingTrackRef = useRef<DeviceTrack | null>(null);
  const sonicSessionIdRef = useRef(0);
  const attachInFlightRef = useRef(false);
  const attachRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueRef = useRef<DeviceTrack[]>([]);
  const currentTrackRef = useRef<DeviceTrack | null>(null);
  const currentIndexRef = useRef(-1);

  const repeatModeRef = useRef<RepeatMode>("OFF");
  const shuffleRef = useRef(false);

  const isScanningRef = useRef(false);
  const lastFinishedTrackRef = useRef<string | null>(null);
  const notificationPermissionPromiseRef = useRef<Promise<void> | null>(null);

  const playNextRef = useRef<() => void>(() => {});
  const playPreviousRef = useRef<() => void>(() => {});

  const eqRef = useRef({
    sonicEnabled,
    equalizerLevels,
    bassBoost,
    clarity,
    spatial,
    preamp,
    soundProfile,
  });

  useEffect(() => {
    eqRef.current = {
      sonicEnabled,
      equalizerLevels,
      bassBoost,
      clarity,
      spatial,
      preamp,
      soundProfile,
    };
    if (eqLoaded) {
      AsyncStorage.setItem(EQ_STATE_KEY, JSON.stringify(eqRef.current)).catch(() => {});
    }
  }, [sonicEnabled, equalizerLevels, bassBoost, clarity, spatial, preamp, soundProfile, eqLoaded]);

  useEffect(() => {
    setClientReady(true);
  }, []);

  /* ------------------------ Instant cache load on mount ------------------- */

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(LIBRARY_CACHE_KEY);
        if (cached) {
          const parsed: DeviceTrack[] = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTracks(parsed);
            queueRef.current = parsed;
            setQueue(parsed);
            setHasScanned(true);
          }
        }
      } catch (e) {
        console.warn("Library cache load failed:", e);
      }

      try {
        const cachedEq = await AsyncStorage.getItem(EQ_STATE_KEY);
        if (cachedEq) {
          const eq = JSON.parse(cachedEq);
          if (eq.soundProfile) setSoundProfile(eq.soundProfile);
          if (eq.sonicEnabled !== undefined) setSonicEnabledState(eq.sonicEnabled);
          if (eq.equalizerLevels) setEqualizerLevelsState(eq.equalizerLevels);
          if (eq.bassBoost !== undefined) setBassBoostState(eq.bassBoost);
          if (eq.clarity !== undefined) setClarityState(eq.clarity);
          if (eq.spatial !== undefined) setSpatialState(eq.spatial);
          if (eq.preamp !== undefined) setPreampState(eq.preamp);
        }
      } catch (e) {
        console.warn("EQ state load failed:", e);
      } finally {
        setEqLoaded(true);
      }

      try {
        const cachedFavs = await AsyncStorage.getItem(FAVORITES_KEY);
        if (cachedFavs) {
          const parsedFavs: string[] = JSON.parse(cachedFavs);
          if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
        }
      } catch (e) {
        console.warn("Favorites load failed:", e);
      }
    })();
  }, []);

  /* ---------------------- FAVORITES -------------------- */

  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(trackId);
      const next = isFav ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (trackId: string) => favorites.includes(trackId),
    [favorites]
  );

  /* ---------------------- Push the current EQ settings -------------------- */

  const pushAudioSettings = useCallback(() => {
    if (Platform.OS !== "android") return;
    const s = eqRef.current;
    try {
      SonicAudioModule.setEnabled(s.sonicEnabled);
      SonicAudioModule.setEqualizer(s.equalizerLevels);
      SonicAudioModule.setBassBoost(s.bassBoost);
      SonicAudioModule.setClarity(s.clarity);
      SonicAudioModule.setSpatial(s.spatial);
      SonicAudioModule.setPreamp(s.preamp);
      const caps = SonicAudioModule.getCapabilities();
      if (caps) setAudioCapabilities(caps);
    } catch (error) {
      console.error("Unable to apply audio settings:", error);
    }
  }, []);

  useEffect(() => {
    pushAudioSettings();
  }, [sonicEnabled, equalizerLevels, bassBoost, clarity, spatial, preamp, pushAudioSettings]);

  /* ---------------------- Attach to the active audio session -------------- */

  const tryAttach = useCallback(
    async (audioSessionId: number) => {
      if (Platform.OS !== "android") return;
      if (attachInFlightRef.current) return;
      if (
        audioSessionId > 0 &&
        audioSessionId === sonicSessionIdRef.current &&
        audioCapabilities?.attached
      ) {
        return;
      }

      attachInFlightRef.current = true;
      try {
        let caps: SonicAudioCapabilities | null = null;

        if (audioSessionId > 0) caps = SonicAudioModule.attach(audioSessionId);
        if (!caps || !caps.attached) caps = await SonicAudioModule.attachToPlayer();

        if (caps && caps.attached && caps.sessionId > 0) {
          sonicSessionIdRef.current = caps.sessionId;
          setAudioCapabilities(caps);
          pushAudioSettings();
          console.log("✅ Sonic Audio Attached to session:", caps.sessionId);
        } else {
          sonicSessionIdRef.current = 0;
          setAudioCapabilities(caps);
          console.log("❌ Sonic Audio Attach Failed. Caps:", caps);
          
          if (attachRetryRef.current) clearTimeout(attachRetryRef.current);
          attachRetryRef.current = setTimeout(() => {
            attachRetryRef.current = null;
            void tryAttach(0);
          }, 1500);
        }
      } catch (error) {
        console.warn("SonicAudio attach failed:", error);
      } finally {
        attachInFlightRef.current = false;
      }
    },
    [audioCapabilities?.attached, pushAudioSettings]
  );

  /* ------------------------------ Media Controls -------------------------- */

  // Wire the physical/system buttons (lock screen, notification, bluetooth) to our state
  useEffect(() => {
    if (Platform.OS === "web") return;

    const sub = MediaControl.addListener((event: any) => {
      console.log("MediaControl Event:", event.command);
      switch (event.command) {
        case MediaControl.Command.NEXT_TRACK:
        case "nextTrack":
        case "next":
          playNextRef.current();
          break;
        case MediaControl.Command.PREVIOUS_TRACK:
        case "previousTrack":
        case "previous":
          playPreviousRef.current();
          break;
        case MediaControl.Command.PLAY:
        case "play":
          playerRef.current?.play();
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PLAYING);
          setIsPlaying(true);
          break;
        case MediaControl.Command.PAUSE:
        case "pause":
          playerRef.current?.pause();
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PAUSED);
          setIsPlaying(false);
          break;
      }
    });
    return () => sub.remove();
  }, []);

  const enableMediaControls = useCallback(() => {
    if (Platform.OS === "web") return;
    void MediaControl.enableMediaControls({
      capabilities: [
        MediaControl.Command.PLAY,
        MediaControl.Command.PAUSE,
        MediaControl.Command.NEXT_TRACK,
        MediaControl.Command.PREVIOUS_TRACK,
      ],
      compactCapabilities: [
        MediaControl.Command.PREVIOUS_TRACK,
        MediaControl.Command.PLAY,
        MediaControl.Command.NEXT_TRACK,
      ],
    });
  }, []);

  /* ------------------------------ Player helpers -------------------------- */

  const startTrack = useCallback((track: DeviceTrack) => {
    const player = playerRef.current;
    if (!player) {
      pendingTrackRef.current = track;
      return;
    }

    const start = () => {
      try {
        pendingTrackRef.current = null;
        sonicSessionIdRef.current = 0;
        player.replace(track.uri);
        player.play();

        // Update system media notification & lock screen
        enableMediaControls();
        if (Platform.OS !== "web") {
          void MediaControl.updateMetadata({
            title: track.filename.replace(/\.[^/.]+$/, ""),
            artist: track.artist,
            album: track.album,
          });
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PLAYING);
        }

      } catch (error) {
        console.error("Unable to start audio track:", error);
        Alert.alert("Playback error", "This track could not be played.");
      }
    };

    if (Platform.OS === "android") {
      if (!notificationPermissionPromiseRef.current) {
        notificationPermissionPromiseRef.current = requestNotificationPermissionsAsync()
          .then((permission) => {
            if (!permission.granted) {
              Alert.alert(
                "Notifications are disabled",
                "Playback will continue, but Android may hide the lock-screen media controls."
              );
            }
          })
          .catch((error) => {
            console.error("Notification permission request failed:", error);
          });
      }
      void notificationPermissionPromiseRef.current.then(start);
    } else {
      start();
    }
  }, [enableMediaControls]);

  const handlePlayerReady = useCallback(
    (player: any) => {
      playerRef.current = player;
      const pendingTrack = pendingTrackRef.current;
      if (pendingTrack) {
        pendingTrackRef.current = null;
        startTrack(pendingTrack);
      }
    },
    [startTrack]
  );

  const handleAudioSample = useCallback((sample: AudioSample) => {
    const frames = sample.channels[0]?.frames;
    if (!frames?.length) return;

    const bucketSize = Math.max(1, Math.floor(frames.length / 24));
    const levels = Array.from({ length: 24 }, (_, index) => {
      const start = index * bucketSize;
      const end = Math.min(frames.length, start + bucketSize);
      let sum = 0;
      for (let frame = start; frame < end; frame += 1) {
        sum += frames[frame] * frames[frame];
      }
      const rms = Math.sqrt(sum / Math.max(1, end - start));
      return Math.min(1, rms * 3);
    });
    setVisualizerLevels(levels);
  }, []);

  /* ------------------------------ Scan music ------------------------------ */

  const scanDeviceMusic = useCallback(
    async (forceRefresh: boolean = false): Promise<ScanResult> => {
      if (isScanningRef.current) return { ok: false, reason: "busy" };
      if (!forceRefresh && hasScanned) return { ok: true };

      isScanningRef.current = true;
      setIsScanning(true);

      try {
        const permission = await MediaLibrary.requestPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Music permission required",
            "Allow RADEV SONIC to access audio files on your device."
          );
          return { ok: false, reason: "denied" };
        }

        const assets = await new Query()
          .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
          .limit(5000)
          .exe();

        const scannedTracks: DeviceTrack[] = [];
        const needsInfo: { asset: any; index: number }[] = [];

        assets.forEach((asset: any) => {
          const uri: string | undefined = asset?.uri ?? asset?.localUri;
          const filename = asset?.filename || asset?.displayName || "Unknown track";
          const duration = Number(asset?.duration ?? 0);
          const id = String(asset?.id ?? uri ?? filename);

          if (!uri) {
            needsInfo.push({ asset, index: scannedTracks.length });
            scannedTracks.push({
              id,
              uri: "",
              filename,
              duration,
              artist: "Unknown Artist",
              album: "Unknown Album",
              folder: "Unknown Folder",
            });
            return;
          }

          const { artist, album, folder } = parseTrackMeta(filename, uri);
          scannedTracks.push({ id, uri, filename, duration, artist, album, folder });
        });

        for (const { asset, index } of needsInfo) {
          try {
            const info = await asset.getInfo();
            const uri: string = info.uri;
            if (!uri) continue;
            const filename = info.filename || "Unknown track";
            const { artist, album, folder } = parseTrackMeta(filename, uri);
            scannedTracks[index] = {
              id: String(info.id ?? scannedTracks[index].id),
              uri,
              filename,
              duration: Number(info.duration ?? 0),
              artist,
              album,
              folder,
            };
          } catch (err) {
            console.warn("Skipping unreadable asset:", err);
          }
        }

        const finalTracks = scannedTracks.filter((t) => !!t.uri);
        finalTracks.sort((a, b) =>
          a.filename.localeCompare(b.filename, undefined, { sensitivity: "base" })
        );

        setTracks(finalTracks);
        setHasScanned(true);

        try {
          await AsyncStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(finalTracks));
        } catch (e) {
          console.warn("Library cache save failed:", e);
        }

        const availableIds = new Set(finalTracks.map((track) => track.id));
        const validQueue = queueRef.current.filter((track) => availableIds.has(track.id));

        if (validQueue.length === 0) {
          queueRef.current = finalTracks;
          setQueue(finalTracks);

          const activeTrack = currentTrackRef.current;
          if (activeTrack) {
            const matching = finalTracks.find((t) => t.id === activeTrack.id);
            if (!matching) {
              currentTrackRef.current = null;
              currentIndexRef.current = -1;
              setCurrentTrack(null);
              setCurrentIndex(-1);
            }
          }
        } else {
          queueRef.current = validQueue;
          setQueue(validQueue);

          const activeTrack = currentTrackRef.current;
          if (activeTrack) {
            const updatedIndex = validQueue.findIndex((track) => track.id === activeTrack.id);
            if (updatedIndex !== -1) {
              currentIndexRef.current = updatedIndex;
              setCurrentIndex(updatedIndex);
            }
          }
        }

        return { ok: true };
      } catch (error) {
        console.error("Music library scan failed:", error);
        Alert.alert("Scan failed", "Could not scan your music library.");
        return { ok: false, reason: "error" };
      } finally {
        isScanningRef.current = false;
        setIsScanning(false);
      }
    },
    [hasScanned]
  );

  /* ------------------------------ Queue tracks ---------------------------- */

  const queueTracks = useCallback((incoming: DeviceTrack[]) => {
    if (!incoming.length) return;
    const nextTracks = incoming.filter((track) => !!track && !!track.id && !!track.uri);
    if (!nextTracks.length) return;

    setQueue((previous) => {
      const existingIds = new Set(previous.map((track) => track.id));
      const merged = [...previous, ...nextTracks.filter((track) => !existingIds.has(track.id))];
      queueRef.current = merged;
      return merged;
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue((prev) => {
      const next = prev.filter((t) => t.id !== trackId);
      queueRef.current = next;

      const currentIdx = currentIndexRef.current;
      if (currentIdx >= 0) {
        const activeTrack = currentTrackRef.current;
        const newIndex = next.findIndex((t) => t.id === activeTrack?.id);
        if (newIndex !== -1) {
          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);
        }
      }
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    const active = currentTrackRef.current;
    const next = active ? [active] : [];
    setQueue(next);
    queueRef.current = next;
    setCurrentIndex(active ? 0 : -1);
    currentIndexRef.current = active ? 0 : -1;
  }, []);

  /* ------------------------------ Play a track ---------------------------- */

  const playTrack = useCallback(
    (track: DeviceTrack, sourceQueue?: DeviceTrack[]) => {
      if (!track) return;

      let nextQueue = sourceQueue?.length ? [...sourceQueue] : [...queueRef.current];
      if (!nextQueue.some((item) => item.id === track.id)) {
        nextQueue = [...nextQueue, track];
      }

      const nextIndex = nextQueue.findIndex((item) => item.id === track.id);
      if (nextIndex === -1) return;

      queueRef.current = nextQueue;
      currentTrackRef.current = track;
      currentIndexRef.current = nextIndex;

      setQueue(nextQueue);
      setCurrentTrack(track);
      setCurrentIndex(nextIndex);

      updateProgress({ currentTime: 0, duration: track.duration || 0 });
      setIsLoaded(false);
      setIsBuffering(true);

      lastFinishedTrackRef.current = null;

      const player = playerRef.current;
      if (player) player.loop = repeatModeRef.current === "ONE";

      startTrack(track);

      setTimeout(() => {
        void tryAttach(0);
      }, 100);
      setTimeout(() => {
        void tryAttach(0);
      }, 600);
      setTimeout(() => {
        void tryAttach(0);
      }, 1500);
    },
    [startTrack, updateProgress, tryAttach]
  );

  const playFromQueue = useCallback(
    (trackId: string) => {
      const q = queueRef.current;
      const idx = q.findIndex((t) => t.id === trackId);
      if (idx === -1) return;

      const track = q[idx];
      currentTrackRef.current = track;
      currentIndexRef.current = idx;
      setCurrentTrack(track);
      setCurrentIndex(idx);

      updateProgress({ currentTime: 0, duration: track.duration || 0 });
      setIsLoaded(false);
      setIsBuffering(true);
      lastFinishedTrackRef.current = null;

      const player = playerRef.current;
      if (player) {
        try {
          player.pause?.();
        } catch {}
        player.loop = repeatModeRef.current === "ONE";
      }

      startTrack(track);

      setTimeout(() => {
        void tryAttach(0);
      }, 100);
      setTimeout(() => {
        void tryAttach(0);
      }, 600);
      setTimeout(() => {
        void tryAttach(0);
      }, 1500);
    },
    [startTrack, updateProgress, tryAttach]
  );

  /* ------------------------------ Play preview ---------------------------- */

  const playPreview = useCallback(
    async (url: string) => {
      const player = playerRef.current;
      if (!player) return;

      try {
        player.pause();
        player.replace({ uri: url });
        player.play();

        enableMediaControls();
        if (Platform.OS !== "web") {
          void MediaControl.updateMetadata({
            title: "Spotify Preview",
            artist: "Spotify",
          });
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PLAYING);
        }

        setCurrentTrack(null);
        currentTrackRef.current = null;
        currentIndexRef.current = -1;
        setCurrentIndex(-1);
        setIsPlaying(true);
        setIsLoaded(false);
        setIsBuffering(true);
        sonicSessionIdRef.current = 0;

        setTimeout(() => {
          void tryAttach(0);
        }, 600);
      } catch (error) {
        console.error("Preview playback failed:", error);
        Alert.alert("Playback Error", "Could not play this preview.");
      }
    },
    [enableMediaControls, tryAttach]
  );

  /* ------------------------------ Next / Prev ----------------------------- */

  const playNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const activeIndex = currentIndexRef.current;
    if (currentQueue.length === 0) return;

    let nextIndex = activeIndex + 1;

    if (shuffleRef.current && currentQueue.length > 1) {
      const availableIndexes = currentQueue
        .map((_, index) => index)
        .filter((index) => index !== activeIndex);
      nextIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    } else if (nextIndex >= currentQueue.length) {
      if (repeatModeRef.current === "ALL") nextIndex = 0;
      else {
        setIsPlaying(false);
        updateProgress({ ...progressRef.current, currentTime: 0 });
        return;
      }
    }

    const nextTrack = currentQueue[nextIndex];
    if (nextTrack) playTrack(nextTrack, currentQueue);
  }, [playTrack, updateProgress]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrevious = useCallback(() => {
    const player = playerRef.current;
    const currentQueue = queueRef.current;
    const activeIndex = currentIndexRef.current;

    if (!currentTrackRef.current || currentQueue.length === 0) return;

    if (progressRef.current.currentTime > 3 && player) {
      player.seekTo(0);
      updateProgress({ ...progressRef.current, currentTime: 0 });
      return;
    }

    let previousIndex = activeIndex - 1;

    if (previousIndex < 0) {
      if (repeatModeRef.current === "ALL") previousIndex = currentQueue.length - 1;
      else {
        if (player) player.seekTo(0);
        updateProgress({ ...progressRef.current, currentTime: 0 });
        return;
      }
    }

    const previousTrack = currentQueue[previousIndex];
    if (previousTrack) playTrack(previousTrack, currentQueue);
  }, [playTrack, updateProgress]);

  useEffect(() => {
    playPreviousRef.current = playPrevious;
  }, [playPrevious]);

  /* ------------------------------ Play / Pause ---------------------------- */

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player || !currentTrackRef.current) return;

    try {
      if (isPlaying) {
        player.pause();
        if (Platform.OS !== "web") {
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PAUSED);
        }
      } else {
        player.play();
        if (Platform.OS !== "web") {
          void MediaControl.updatePlaybackState(MediaControl.PlaybackState.PLAYING);
        }
      }
    } catch (error) {
      console.error("Playback toggle failed:", error);
    }
  }, [isPlaying]);

  /* ------------------------------ Shuffle / Repeat ------------------------ */

  const toggleShuffle = useCallback(() => {
    setShuffle((previous) => {
      const next = !previous;
      shuffleRef.current = next;
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((previous) => {
      let next: RepeatMode = "OFF";
      if (previous === "OFF") next = "ALL";
      else if (previous === "ALL") next = "ONE";

      repeatModeRef.current = next;
      const player = playerRef.current;
      if (player) player.loop = next === "ONE";
      return next;
    });
  }, []);

  /* ------------------------------ Sound / Sonic --------------------------- */

  const selectSoundProfile = useCallback((profile: SoundProfile) => {
    setSoundProfile(profile);
    if (profile === "CUSTOM") return;

    const settings = SOUND_PROFILE_SETTINGS[profile];
    if (settings) {
      setBassBoostState(settings.bass);
      setClarityState(settings.clarity);
      setSpatialState(settings.spatial);
      setPreampState(settings.preamp);
      if (settings.levels) setEqualizerLevelsState(settings.levels);
      else setEqualizerLevelsState(Array(16).fill(0));
    }
  }, []);

  const updateEqualizerLevels = useCallback((levels: number[]) => {
    if (levels.length !== 16 || levels.some((level) => !Number.isFinite(level))) {
      console.error("Equalizer requires exactly 16 finite band levels.");
      return;
    }
    setEqualizerLevelsState(levels.map((level) => Math.max(-12, Math.min(12, level))));
    setSoundProfile("CUSTOM");
  }, []);

  const updateBassBoost = useCallback((amount: number) => {
    setBassBoostState(Math.max(0, Math.min(100, amount)));
    setSoundProfile("CUSTOM");
  }, []);

  const updateClarity = useCallback((amount: number) => {
    setClarityState(Math.max(0, Math.min(100, amount)));
    setSoundProfile("CUSTOM");
  }, []);

  const updateSpatial = useCallback((amount: number) => {
    setSpatialState(Math.max(0, Math.min(100, amount)));
    setSoundProfile("CUSTOM");
  }, []);

  const updatePreamp = useCallback((amount: number) => {
    setPreampState(Math.max(-12, Math.min(12, amount)));
  }, []);

  const updateSonicEnabled = useCallback((enabled: boolean) => {
    setSonicEnabledState(enabled);
  }, []);

  const enableVisualizer = useCallback(async () => {
    try {
      if (!playerRef.current?.isAudioSamplingSupported) {
        Alert.alert("Visualizer unavailable", "Live playback sampling is not supported on this device.");
        return;
      }
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Android requires microphone permission to read playback levels for the live visualizer."
        );
        return;
      }
      setVisualizerEnabled(true);
    } catch (error) {
      console.error("Unable to enable the live visualizer:", error);
      Alert.alert("Visualizer unavailable", "Could not enable audio visualization.");
    }
  }, []);

  const disableVisualizer = useCallback(() => {
    setVisualizerEnabled(false);
    setVisualizerLevels(Array(24).fill(0));
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (minutes !== null && (!Number.isFinite(minutes) || minutes <= 0)) {
      console.error("Sleep timer duration must be a positive number of minutes.");
      return;
    }
    setSleepTimerMinutes(minutes);
  }, []);

  useEffect(() => {
    if (sleepTimerMinutes === null) return;
    const timer = setTimeout(() => {
      playerRef.current?.pause();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      Alert.alert("Sleep timer", "Playback has stopped.");
    }, sleepTimerMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sleepTimerMinutes]);

  /* --------------------------------- Seek --------------------------------- */

  const seekTo = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player || !Number.isFinite(seconds)) return;

      const safeDuration = Math.max(
        0,
        progressRef.current.duration || currentTrackRef.current?.duration || 0
      );
      const target = Math.max(0, Math.min(seconds, safeDuration || seconds));

      try {
        player.seekTo(target);
        updateProgress({ ...progressRef.current, currentTime: target });
        if (Platform.OS !== "web") {
          void MediaControl.updatePlaybackState(
            isPlaying ? MediaControl.PlaybackState.PLAYING : MediaControl.PlaybackState.PAUSED,
            target
          );
        }
      } catch (error) {
        console.error("Unable to seek audio:", error);
      }
    },
    [updateProgress, isPlaying]
  );

  /* ---------------------------- Player status ----------------------------- */

  const handleStatusChange = useCallback(
    (status: any) => {
      if (!status) return;

      const audioSessionId = Number(status.audioSessionId ?? 0);
      if (Platform.OS === "android" && audioSessionId > 0) {
        void tryAttach(audioSessionId);
      }

      const nextCurrentTime = Number(status.currentTime ?? 0);
      const nextDuration = Number(status.duration ?? currentTrackRef.current?.duration ?? 0);

      updateProgress({
        currentTime: Number.isFinite(nextCurrentTime) ? nextCurrentTime : 0,
        duration: Number.isFinite(nextDuration) ? nextDuration : 0,
      });

      setIsPlaying(Boolean(status.playing ?? status.isPlaying));
      setIsLoaded(Boolean(status.isLoaded));
      setIsBuffering(Boolean(status.isBuffering));

      // Keep system notification progress bar in sync
      if (Platform.OS !== "web") {
        if (status.playing) {
          void MediaControl.updatePlaybackState(
            MediaControl.PlaybackState.PLAYING,
            nextCurrentTime
          );
        } else if (!status.isBuffering) {
          void MediaControl.updatePlaybackState(
            MediaControl.PlaybackState.PAUSED,
            nextCurrentTime
          );
        }
      }

      if (!status.didJustFinish) {
        lastFinishedTrackRef.current = null;
        return;
      }

      const finishedTrack = currentTrackRef.current;
      if (!finishedTrack) return;
      if (lastFinishedTrackRef.current === finishedTrack.id) return;
      lastFinishedTrackRef.current = finishedTrack.id;

      if (repeatModeRef.current === "ALL") {
        playNextRef.current();
      }
    },
    [tryAttach, updateProgress]
  );

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    if (!currentTrack) return;
    if (!isPlaying) return;
    if (!progress.duration || progress.duration <= 0) return;

    if (progress.currentTime > 0 && progress.duration - progress.currentTime < 0.5) {
      if (lastFinishedTrackRef.current === currentTrack.id) return;
      lastFinishedTrackRef.current = currentTrack.id;

      if (repeatModeRef.current === "ONE") {
        seekTo(0);
        setTimeout(() => {
          try {
            playerRef.current?.play?.();
          } catch {}
        }, 50);
      } else {
        playNextRef.current();
      }
    }
  }, [currentTrack, isPlaying, progress.currentTime, progress.duration, seekTo]);

  // Cleanup any scheduled attach retries on unmount
  useEffect(() => {
    return () => {
      if (attachRetryRef.current) {
        clearTimeout(attachRetryRef.current);
        attachRetryRef.current = null;
      }
    };
  }, []);

  /* ---------------------------- Context value ----------------------------- */

  const value = useMemo<MusicContextType>(
    () => ({
      tracks,
      queue,
      currentTrack,
      currentIndex,
      isScanning,
      hasScanned,
      isPlaying,
      isLoaded,
      isBuffering,
      shuffle,
      repeatMode,
      soundProfile,
      sonicEnabled,
      equalizerLevels,
      bassBoost,
      clarity,
      spatial,
      preamp,
      visualizerEnabled,
      sleepTimerMinutes,
      audioCapabilities,

      favorites,
      toggleFavorite,
      isFavorite,

      removeFromQueue,
      clearQueue,

      scanDeviceMusic,
      queueTracks,
      playTrack,
      playFromQueue,
      playPreview,
      togglePlayback,
      playNext,
      playPrevious,
      toggleShuffle,
      cycleRepeat,
      selectSoundProfile,
      setSonicEnabled: updateSonicEnabled,
      setEqualizerLevels: updateEqualizerLevels,
      setBassBoost: updateBassBoost,
      setClarity: updateClarity,
      setSpatial: updateSpatial,
      setPreamp: updatePreamp,
      enableVisualizer,
      disableVisualizer,
      setSleepTimer,
      seekTo,
    }),
    [
      tracks, queue, currentTrack, currentIndex,
      isScanning, hasScanned,
      isPlaying, isLoaded, isBuffering,
      shuffle, repeatMode, soundProfile,
      sonicEnabled, equalizerLevels,
      bassBoost, clarity, spatial, preamp,
      visualizerEnabled, sleepTimerMinutes, audioCapabilities,
      favorites, toggleFavorite, isFavorite,
      removeFromQueue, clearQueue,
      scanDeviceMusic, queueTracks, playTrack, playFromQueue, playPreview,
      togglePlayback, playNext, playPrevious, toggleShuffle, cycleRepeat, selectSoundProfile,
      updateSonicEnabled, updateEqualizerLevels, updateBassBoost, updateClarity, updateSpatial, updatePreamp,
      enableVisualizer, disableVisualizer, setSleepTimer, seekTo,
    ]
  );

  return (
    <MusicContext.Provider value={value}>
      <MusicProgressContext.Provider value={progress}>
        <MusicVisualizerContext.Provider value={visualizerLevels}>
          {clientReady && (
            <AudioController
              onPlayerReady={handlePlayerReady}
              onStatusChange={handleStatusChange}
              onAudioSample={handleAudioSample}
              visualizerEnabled={visualizerEnabled}
            />
          )}
          {children}
        </MusicVisualizerContext.Provider>
      </MusicProgressContext.Provider>
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used inside a MusicProvider.");
  return context;
}

export function useMusicProgress(): MusicProgress {
  const context = useContext(MusicProgressContext);
  if (!context) throw new Error("useMusicProgress must be used inside a MusicProvider.");
  return context;
}

export function useMusicVisualizer(): number[] {
  const context = useContext(MusicVisualizerContext);
  if (!context) throw new Error("useMusicVisualizer must be used within a MusicProvider");
  return context;
}