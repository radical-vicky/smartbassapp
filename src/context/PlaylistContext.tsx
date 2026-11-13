// src/context/PlaylistContext.tsx

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import type { DeviceTrack } from "./MusicContext";

export type Playlist = {
  id: string;
  name: string;
  description: string | null;
  cover_gradient: string;
  created_at: string;
  track_count?: number;
};

export type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  track_uri: string;
  track_filename: string;
  track_artist: string | null;
  track_album: string | null;
  track_duration: number;
  position: number;
};

interface PlaylistContextType {
  playlists: Playlist[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist | null>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: DeviceTrack) => Promise<void>;
  removeTrackFromPlaylist: (rowId: string) => Promise<void>;
  getPlaylistTracks: (playlistId: string) => Promise<PlaylistTrackRow[]>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setPlaylists([]);
        return;
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, description, cover_gradient, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch track counts for each playlist
      const withCounts: Playlist[] = [];
      for (const p of data ?? []) {
        const { count } = await supabase
          .from("playlist_tracks")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", p.id);
        withCounts.push({ ...p, track_count: count ?? 0 });
      }

      setPlaylists(withCounts);
    } catch (err) {
      console.error("Failed to load playlists:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlaylists();
  }, [fetchPlaylists]);

  const createPlaylist = useCallback(
    async (name: string, description?: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          Alert.alert("Not signed in", "Please sign in to create playlists.");
          return null;
        }

        const gradients = [
          "#3D3A22,#242113",
          "#2F223D,#1A1324",
          "#223D3A,#132421",
          "#3D2222,#241313",
          "#22263D,#131524",
        ];
        const cover = gradients[Math.floor(Math.random() * gradients.length)];

        const { data, error } = await supabase
          .from("playlists")
          .insert({
            user_id: userData.user.id,
            name: name.trim(),
            description: description?.trim() || null,
            cover_gradient: cover,
          })
          .select("id, name, description, cover_gradient, created_at")
          .single();

        if (error) throw error;

        const created: Playlist = { ...data, track_count: 0 };
        setPlaylists((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        console.error("Create playlist failed:", err);
        Alert.alert("Could not create playlist", err?.message ?? "Unknown error");
        return null;
      }
    },
    []
  );

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (error) throw error;
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Delete playlist failed:", err);
      Alert.alert("Could not delete playlist", err?.message ?? "Unknown error");
    }
  }, []);

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setPlaylists((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
      );
    } catch (err: any) {
      console.error("Rename playlist failed:", err);
      Alert.alert("Could not rename playlist", err?.message ?? "Unknown error");
    }
  }, []);

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, track: DeviceTrack) => {
      try {
        // Check for duplicate
        const { data: existing } = await supabase
          .from("playlist_tracks")
          .select("id")
          .eq("playlist_id", playlistId)
          .eq("track_id", track.id)
          .maybeSingle();

        if (existing) {
          Alert.alert("Already added", "This track is already in the playlist.");
          return;
        }

        const { count } = await supabase
          .from("playlist_tracks")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", playlistId);

        const { error } = await supabase.from("playlist_tracks").insert({
          playlist_id: playlistId,
          track_id: track.id,
          track_uri: track.uri,
          track_filename: track.filename,
          track_artist: track.artist,
          track_album: track.album,
          track_duration: Math.round(track.duration || 0),
          position: count ?? 0,
        });

        if (error) throw error;
        await fetchPlaylists();
      } catch (err: any) {
        console.error("Add to playlist failed:", err);
        Alert.alert("Could not add track", err?.message ?? "Unknown error");
      }
    },
    [fetchPlaylists]
  );

  const removeTrackFromPlaylist = useCallback(
    async (rowId: string) => {
      try {
        const { error } = await supabase
          .from("playlist_tracks")
          .delete()
          .eq("id", rowId);
        if (error) throw error;
        await fetchPlaylists();
      } catch (err: any) {
        console.error("Remove track failed:", err);
        Alert.alert("Could not remove track", err?.message ?? "Unknown error");
      }
    },
    [fetchPlaylists]
  );

  const getPlaylistTracks = useCallback(
    async (playlistId: string): Promise<PlaylistTrackRow[]> => {
      const { data, error } = await supabase
        .from("playlist_tracks")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (error) {
        console.error("Fetch playlist tracks failed:", error);
        return [];
      }
      return data ?? [];
    },
    []
  );

  const value = useMemo<PlaylistContextType>(
    () => ({
      playlists,
      isLoading,
      refresh: fetchPlaylists,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getPlaylistTracks,
    }),
    [
      playlists,
      isLoading,
      fetchPlaylists,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getPlaylistTracks,
    ]
  );

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists(): PlaylistContextType {
  const ctx = useContext(PlaylistContext);
  if (!ctx) {
    throw new Error("usePlaylists must be used within a PlaylistProvider.");
  }
  return ctx;
}