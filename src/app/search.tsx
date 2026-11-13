import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";
import { usePlaylists } from "../context/PlaylistContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const FILTER_TABS = ["All", "Songs", "Artists", "Albums", "Playlists"] as const;
type FilterTab = typeof FILTER_TABS[number];

const GRADIENTS = [
  ["#2F3E46", "#1B262C"],
  ["#5C3A21", "#2B1B12"],
  ["#2B3A2F", "#142118"],
  ["#3D3A22", "#242113"],
  ["#2F223D", "#1A1324"],
  ["#223D3A", "#132421"],
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function SearchScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("All");
  const [showAllSongs, setShowAllSongs] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { songs: [], artists: [], albums: [], playlists: [] };

    const matchedTracks = music.tracks.filter(
      (t) =>
        cleanFilename(t.filename).toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );

    const artistsMap = new Map<string, number>();
    matchedTracks.forEach((t) => {
      const k = t.artist || "Unknown Artist";
      artistsMap.set(k, (artistsMap.get(k) ?? 0) + 1);
    });
    const artists = Array.from(artistsMap.entries()).slice(0, 8);

    const albumsMap = new Map<string, { artist: string; count: number }>();
    matchedTracks.forEach((t) => {
      const k = t.album || "Unknown Album";
      const existing = albumsMap.get(k);
      if (!existing) {
        albumsMap.set(k, { artist: t.artist, count: 1 });
      } else {
        existing.count += 1;
      }
    });
    const albums = Array.from(albumsMap.entries()).slice(0, 8);

    const matchedPlaylists = playlists.filter((p) =>
      p.name.toLowerCase().includes(q)
    );

    return {
      songs: showAllSongs ? matchedTracks : matchedTracks.slice(0, 4),
      artists,
      albums,
      playlists: matchedPlaylists.slice(0, 8),
    };
  }, [query, music.tracks, playlists, showAllSongs]);

  const currentTrack = music.currentTrack;

  const renderTargetIcon = (size = 20) => (
    <View
      style={[
        styles.circleIcon,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.circleInner,
          { width: size / 4, height: size / 4, borderRadius: size / 8 },
        ]}
      />
    </View>
  );

  const showTrackMenu = (track: any) => {
    if (playlists.length === 0) {
      Alert.alert("No playlists yet", "Create a playlist first to add tracks.", [
        { text: "Cancel", style: "cancel" },
        { text: "Create", onPress: () => router.push("/create-playlist") },
      ]);
      return;
    }
    const buttons = playlists.map((p) => ({
      text: `Add to ${p.name}`,
      onPress: async () => {
        await addTrackToPlaylist(p.id, track);
        Alert.alert("Added", `"${cleanFilename(track.filename)}" added.`);
      },
    }));
    buttons.push({ text: "Cancel", style: "cancel" } as any);
    Alert.alert(cleanFilename(track.filename), "Add to playlist", buttons);
  };

  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  const showStartState = query.trim().length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              value={query}
              onChangeText={(v) => {
                setQuery(v);
                setShowAllSongs(false);
              }}
              autoFocus
              placeholder="Search songs, artists, albums"
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
              selectionColor={COLORS.orange}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {FILTER_TABS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.chip, tab === t && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    tab === t && styles.chipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* RESULTS / EMPTY STATE */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.body,
            { paddingBottom: 120 + insets.bottom },
          ]}
        >
          {showStartState && (
            <View style={styles.startState}>
              <Ionicons name="search" size={48} color={COLORS.muted} />
              <Text style={styles.startTitle}>Search your library</Text>
              <Text style={styles.startSub}>
                Find songs, artists, albums and playlists
              </Text>
            </View>
          )}

          {/* SONGS */}
          {(tab === "All" || tab === "Songs") &&
            results.songs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>SONGS</Text>
                  {!showAllSongs &&
                    results.songs.length === 4 &&
                    query.trim().length > 0 && (
                      <Pressable onPress={() => setShowAllSongs(true)}>
                        <Text style={styles.seeAll}>See all</Text>
                      </Pressable>
                    )}
                </View>
                {results.songs.map((track) => (
                  <Pressable
                    key={track.id}
                    style={styles.songRow}
                    onPress={() => void music.playTrack(track, music.tracks)}
                  >
                    <LinearGradient
                      colors={["#2A2A2A", "#1A1A1A"]}
                      style={styles.songArt}
                    >
                      {renderTargetIcon(18)}
                    </LinearGradient>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {cleanFilename(track.filename)}
                      </Text>
                      <Text style={styles.songSub} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    <Pressable hitSlop={10} onPress={() => showTrackMenu(track)}>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}

          {/* ARTISTS */}
          {(tab === "All" || tab === "Artists") &&
            results.artists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ARTISTS</Text>
                </View>
                {results.artists.map(([name, count], index) => (
                  <Pressable
                    key={name}
                    style={styles.artistRow}
                    onPress={() =>
                      router.push(`/artist/${encodeURIComponent(name)}`)
                    }
                  >
                    <LinearGradient
                      colors={
                        GRADIENTS[index % GRADIENTS.length] as [string, string]
                      }
                      style={styles.artistArt}
                    >
                      {renderTargetIcon(18)}
                    </LinearGradient>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>{name}</Text>
                      <Text style={styles.songSub}>{count} tracks</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.muted}
                    />
                  </Pressable>
                ))}
              </View>
            )}

          {/* ALBUMS */}
          {(tab === "All" || tab === "Albums") &&
            results.albums.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ALBUMS</Text>
                </View>
                <View style={styles.albumsGrid}>
                  {results.albums.map(([albumName, info], index) => (
                    <Pressable
                      key={albumName}
                      style={styles.albumCard}
                      onPress={() =>
                        router.push(`/album/${encodeURIComponent(albumName)}`)
                      }
                    >
                      <LinearGradient
                        colors={
                          GRADIENTS[
                            index % GRADIENTS.length
                          ] as [string, string]
                        }
                        style={styles.albumArt}
                      >
                        {renderTargetIcon(32)}
                      </LinearGradient>
                      <Text style={styles.albumTitle} numberOfLines={1}>
                        {albumName}
                      </Text>
                      <Text style={styles.albumSub} numberOfLines={1}>
                        {info.artist}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

          {/* PLAYLISTS */}
          {(tab === "All" || tab === "Playlists") &&
            results.playlists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PLAYLISTS</Text>
                </View>
                {results.playlists.map((pl, index) => (
                  <Pressable
                    key={pl.id}
                    style={styles.artistRow}
                    onPress={() => router.push(`/playlist/${pl.id}`)}
                  >
                    <LinearGradient
                      colors={
                        GRADIENTS[index % GRADIENTS.length] as [string, string]
                      }
                      style={styles.artistArt}
                    >
                      {renderTargetIcon(18)}
                    </LinearGradient>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>{pl.name}</Text>
                      <Text style={styles.songSub}>
                        {pl.track_count ?? 0} tracks
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.muted}
                    />
                  </Pressable>
                ))}
              </View>
            )}

          {/* NO RESULTS */}
          {!showStartState && !hasResults && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.muted} />
              <Text style={styles.emptyText}>
                No results found for "{query}"
              </Text>
            </View>
          )}
        </ScrollView>

        {/* MINI PLAYER */}
        {currentTrack && (
          <Pressable
            style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}
            onPress={() => router.push("/now-playing")}
          >
            <View style={styles.miniPlayerContent}>
              <View style={styles.miniArtwork}>{renderTargetIcon(20)}</View>
              <View style={styles.miniTrackInfo}>
                <Text style={styles.miniTitle} numberOfLines={1}>
                  {cleanFilename(currentTrack.filename)}
                </Text>
                <Text style={styles.miniArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
              <View style={styles.miniControls}>
                <Pressable
                  onPress={() => router.push("/sonic")}
                  style={{ marginRight: 15 }}
                  hitSlop={8}
                >
                  <Ionicons name="pulse" size={20} color="#00D2FF" />
                </Pressable>
                <Pressable onPress={() => void music.togglePlayback()} hitSlop={8}>
                  <Ionicons
                    name={music.isPlaying ? "pause" : "play"}
                    size={22}
                    color={COLORS.orange}
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: "40%" }]} />
            </View>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.orange,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 0 },
  tabsContainer: { paddingBottom: 8 },
  tabRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#08090B", fontWeight: "700" },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  seeAll: { color: COLORS.orange, fontSize: 11, fontWeight: "600" },
  songRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  songArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: { flex: 1, justifyContent: "center" },
  songTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: 2 },
  songSub: { color: COLORS.muted, fontSize: 12 },
  artistRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12 },
  artistArt: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  albumsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  albumCard: { width: "30%" },
  albumArt: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  albumTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  albumSub: { color: COLORS.muted, fontSize: 11 },
  emptyState: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  startState: { alignItems: "center", marginTop: 60, gap: 12 },
  startTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  startSub: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  circleIcon: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: { backgroundColor: COLORS.orange },
  miniPlayer: {
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#292C32",
  },
  miniPlayerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  miniArtwork: {
    width: 40,
    height: 40,
    backgroundColor: "#2B1B12",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: "row", alignItems: "center" },
  progressBarBackground: { height: 2, backgroundColor: "#333", width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },
});