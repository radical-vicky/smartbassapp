import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { SideDrawer } from "../components/SideDrawer";
import { DeviceTrack, useMusic } from "../context/MusicContext";
import { usePlaylists } from "../context/PlaylistContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const TABS = ["Artists", "Albums", "Songs", "Folders", "Playlists"] as const;
type TabType = typeof TABS[number];

const GRADIENTS = [
  ["#2F3E46", "#1B262C"],
  ["#5C3A21", "#2B1B12"],
  ["#2B3A2F", "#142118"],
  ["#3D3A22", "#242113"],
  ["#2F223D", "#1A1324"],
  ["#223D3A", "#132421"],
];

const SEARCH_DEBOUNCE_MS = 180;
const SONG_ROW_HEIGHT = 56;

// ✅ FIXED: handles both seconds and milliseconds safely
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

  // If the value looks like milliseconds (larger than 10 hours), convert it
  let totalSec = seconds > 36000 ? seconds / 1000 : seconds;

  const minutes = Math.floor(totalSec / 60);
  const remainingSeconds = Math.floor(totalSec % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function cleanFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderTargetIcon(size = 24) {
  return (
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
}

type SongRowProps = {
  track: DeviceTrack;
  active: boolean;
  playing: boolean;
  onPress: (track: DeviceTrack) => void;
  onOptions: (track: DeviceTrack) => void;
};

const SongRow = memo(
  function SongRow({ track, active, playing, onPress, onOptions }: SongRowProps) {
    return (
      <View style={[styles.songRow, active && { backgroundColor: "#15100B" }]}>
        <Pressable onPress={() => onPress(track)} style={styles.songMainButton}>
          <LinearGradient
            colors={active ? ["#3D2A22", "#1A1512"] : ["#2A2A2A", "#1A1A1A"]}
            style={[styles.songArt, active && styles.songArtActive]}
          >
            {renderTargetIcon(18)}
          </LinearGradient>
          <View style={styles.songInfo}>
            <Text
              style={[styles.songTitle, active && styles.songTitleActive]}
              numberOfLines={1}
            >
              {cleanFilename(track.filename) || "Unknown track"}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
        </Pressable>

        {active && playing ? (
          <Ionicons
            name="volume-high"
            size={16}
            color={COLORS.orange}
            style={{ marginRight: 15 }}
          />
        ) : (
          <Text style={styles.songDuration}>
            {formatDuration(track.duration)}
          </Text>
        )}

        <Pressable
          hitSlop={10}
          style={{ marginLeft: 8, padding: 8 }}
          onPress={() => onOptions(track)}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.muted} />
        </Pressable>
      </View>
    );
  },
  (prev, next) =>
    prev.track.id === next.track.id &&
    prev.active === next.active &&
    prev.playing === next.playing &&
    prev.onPress === next.onPress &&
    prev.onOptions === next.onOptions
);

export default function LibraryScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const params = useLocalSearchParams();
  const initialTab =
    params.tab && TABS.includes(params.tab as TabType)
      ? (params.tab as TabType)
      : "Songs";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DeviceTrack | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (params.tab && TABS.includes(params.tab as TabType)) {
      setActiveTab(params.tab as TabType);
    }
  }, [params.tab]);

  useEffect(() => {
    if (!music.hasScanned && !music.isScanning) {
      void music.scanDeviceMusic();
    }
  }, [music.hasScanned, music.isScanning, music.scanDeviceMusic]);

  const visibleTracks = useMemo(() => {
    let result = music.tracks;
    const query = debouncedSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((track) =>
        cleanFilename(track.filename).toLowerCase().includes(query)
      );
    }
    return result;
  }, [music.tracks, debouncedSearch]);

  const groupedArtists = useMemo(() => {
    const map = new Map<string, DeviceTrack[]>();
    music.tracks.forEach((track) => {
      const key = track.artist || "Unknown Artist";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(track);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [music.tracks]);

  const groupedAlbums = useMemo(() => {
    const map = new Map<string, DeviceTrack[]>();
    music.tracks.forEach((track) => {
      const key = track.album || "Unknown Album";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(track);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [music.tracks]);

  const groupedFolders = useMemo(() => {
    const map = new Map<string, DeviceTrack[]>();
    music.tracks.forEach((track) => {
      const key = track.folder || "Unknown Folder";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(track);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [music.tracks]);

  const currentTrackId = music.currentTrack?.id;
  const isPlaying = music.isPlaying;

  const handleTrackPress = useCallback(
    (track: DeviceTrack) => {
      if (music.currentTrack?.id === track.id) {
        router.push("/now-playing");
        return;
      }
      void music.playTrack(track, music.tracks);
    },
    [music.currentTrack?.id, music.playTrack, music.tracks, router]
  );

  const handleTrackOptions = useCallback((track: DeviceTrack) => {
    setSelectedTrack(track);
  }, []);

  const handleNavigate = useCallback(
    (route: string) => {
      if (route.startsWith("/library?tab=")) {
        const tabName = route.split("=")[1] as TabType;
        if (TABS.includes(tabName)) {
          setActiveTab(tabName);
          return;
        }
      }
      router.push(route);
    },
    [router]
  );

  const handleAddToPlaylist = useCallback(() => {
    if (!selectedTrack) return;

    if (playlists.length === 0) {
      setSelectedTrack(null);
      Alert.alert(
        "No playlists yet",
        "Create a playlist first to add tracks.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create", onPress: () => router.push("/create-playlist") },
        ]
      );
      return;
    }

    const buttons = playlists.map((p) => ({
      text: `Add to ${p.name}`,
      onPress: async () => {
        if (selectedTrack) {
          await addTrackToPlaylist(p.id, selectedTrack);
          Alert.alert(
            "Added",
            `"${cleanFilename(selectedTrack.filename)}" added.`
          );
        }
      },
    }));
    buttons.push({ text: "Cancel", style: "cancel" } as any);

    Alert.alert("Add to playlist", "Choose a playlist", buttons);
  }, [playlists, selectedTrack, addTrackToPlaylist, router]);

  const keyExtractor = useCallback((item: DeviceTrack) => item.id, []);

  const renderSongItem = useCallback(
    ({ item }: { item: DeviceTrack }) => {
      const active = currentTrackId === item.id;
      const playing = active && isPlaying;
      return (
        <SongRow
          track={item}
          active={active}
          playing={playing}
          onPress={handleTrackPress}
          onOptions={handleTrackOptions}
        />
      );
    },
    [currentTrackId, isPlaying, handleTrackPress, handleTrackOptions]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setIsDrawerOpen(true)} hitSlop={10}>
            <Ionicons name="menu" size={28} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Music Library</Text>
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <Pressable onPress={() => router.push("/equalizer")} hitSlop={10}>
              <Ionicons name="options-outline" size={24} color={COLORS.text} />
            </Pressable>
            <Pressable onPress={() => router.push("/search")} hitSlop={10}>
              <Ionicons name="search" size={24} color={COLORS.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {TABS.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.tabButton}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.contentWrapper}>
          {activeTab === "Songs" && (
            music.isScanning && music.tracks.length === 0 ? (
              <ActivityIndicator
                size="large"
                color={COLORS.orange}
                style={{ marginTop: 40 }}
              />
            ) : visibleTracks.length === 0 ? (
              <Text style={styles.emptyText}>No songs found.</Text>
            ) : (
              <FlatList
                data={visibleTracks}
                renderItem={renderSongItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: 120 + insets.bottom },
                ]}
                initialNumToRender={16}
                maxToRenderPerBatch={20}
                windowSize={9}
                removeClippedSubviews={true}
                getItemLayout={(_, index) => ({
                  length: SONG_ROW_HEIGHT,
                  offset: SONG_ROW_HEIGHT * index,
                  index,
                })}
              />
            )
          )}

          {activeTab !== "Songs" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: 120 + insets.bottom },
              ]}
            >
              {activeTab === "Artists" && (
                <>
                  <View style={styles.listHeader}>
                    <Text style={styles.listCount}>
                      {groupedArtists.length} artists
                    </Text>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="filter" size={14} color={COLORS.text} />
                      <Text style={styles.sortText}>Sort: A-Z</Text>
                    </Pressable>
                  </View>

                  <View style={styles.listContainer}>
                    {groupedArtists.map(([artist, tracks], index) => (
                      <Pressable
                        key={artist}
                        style={styles.artistRow}
                        onPress={() =>
                          router.push(`/artist/${encodeURIComponent(artist)}`)
                        }
                      >
                        <LinearGradient
                          colors={
                            GRADIENTS[index % GRADIENTS.length] as [
                              string,
                              string
                            ]
                          }
                          style={styles.artistAvatar}
                        >
                          {renderTargetIcon(20)}
                        </LinearGradient>
                        <View style={styles.artistInfo}>
                          <Text style={styles.artistName} numberOfLines={1}>
                            {artist}
                          </Text>
                          <Text style={styles.artistTracks}>
                            {tracks.length}{" "}
                            {tracks.length === 1 ? "track" : "tracks"}
                          </Text>
                        </View>
                        <Pressable hitSlop={10} style={{ padding: 10 }}>
                          <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color={COLORS.muted}
                          />
                        </Pressable>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {activeTab === "Albums" && (
                <>
                  <View style={styles.listHeader}>
                    <Text style={styles.listCount}>
                      {groupedAlbums.length} albums
                    </Text>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="filter" size={14} color={COLORS.text} />
                      <Text style={styles.sortText}>Sort: A-Z</Text>
                    </Pressable>
                  </View>

                  <View style={styles.grid}>
                    {groupedAlbums.map(([album, tracks], index) => (
                      <Pressable
                        key={album}
                        style={styles.albumCard}
                        onPress={() =>
                          router.push(`/album/${encodeURIComponent(album)}`)
                        }
                      >
                        <LinearGradient
                          colors={
                            GRADIENTS[index % GRADIENTS.length] as [
                              string,
                              string
                            ]
                          }
                          style={styles.albumCover}
                        >
                          {renderTargetIcon(56)}
                        </LinearGradient>
                        <Text style={styles.albumTitle} numberOfLines={1}>
                          {album}
                        </Text>
                        <Text style={styles.albumMeta} numberOfLines={1}>
                          {tracks[0]?.artist || "Unknown Artist"} · 2024
                        </Text>
                        <Text style={styles.albumTracks}>
                          {tracks.length} tracks
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {activeTab === "Folders" && (
                <>
                  <View style={styles.listHeader}>
                    <Text style={styles.listCount}>
                      {groupedFolders.length} folders
                    </Text>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="filter" size={14} color={COLORS.text} />
                      <Text style={styles.sortText}>Sort: A-Z</Text>
                    </Pressable>
                  </View>

                  <View style={styles.folderListContainer}>
                    {groupedFolders.map(([folder, tracks]) => {
                      const parts = folder.split("/");
                      const folderName =
                        parts[parts.length - 1] || "Unknown Folder";
                      const isSdCard =
                        folder.includes("sdcard") ||
                        folder.includes("external");
                      const storageType = isSdCard ? "SD card" : "Internal";

                      return (
                        <Pressable
                          key={folder}
                          style={styles.folderRow}
                          onPress={() =>
                            router.push(
                              `/folder/${encodeURIComponent(folder)}`
                            )
                          }
                        >
                          <View style={styles.folderIconWrap}>
                            <Ionicons
                              name="folder-outline"
                              size={22}
                              color={COLORS.orange}
                            />
                          </View>

                          <View style={styles.folderInfo}>
                            <Text
                              style={styles.folderName}
                              numberOfLines={1}
                            >
                              {folderName}
                            </Text>
                            <Text
                              style={styles.folderPath}
                              numberOfLines={1}
                            >
                              {folder}
                            </Text>
                          </View>

                          <View style={styles.folderMeta}>
                            <Text style={styles.folderCount}>
                              {tracks.length} songs
                            </Text>
                            <Text style={styles.folderStorage}>
                              {storageType}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {activeTab === "Playlists" && (
                <View style={{ gap: 12 }}>
                  <Pressable
                    onPress={() => router.push("/create-playlist")}
                    style={styles.createPlaylistBtn}
                  >
                    <View style={styles.createPlaylistIcon}>
                      <Ionicons name="add" size={22} color={COLORS.orange} />
                    </View>
                    <Text style={styles.createPlaylistText}>
                      Create playlist
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.muted}
                    />
                  </Pressable>

                  {playlists.map((p, index) => (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/playlist/${p.id}`)}
                      style={styles.categoryRow}
                    >
                      {p.cover_url ? (
                        <Image
                          source={{ uri: p.cover_url }}
                          style={styles.categoryAvatar}
                        />
                      ) : (
                        <LinearGradient
                          colors={
                            (p.cover_gradient?.split(",") as [
                              string,
                              string
                            ]) ?? GRADIENTS[index % GRADIENTS.length]
                          }
                          style={styles.categoryAvatar}
                        >
                          {renderTargetIcon(24)}
                        </LinearGradient>
                      )}
                      <View style={styles.categoryInfo}>
                        <Text
                          style={styles.categoryTitle}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                        <Text style={styles.categorySubtitle}>
                          {p.track_count ?? 0}{" "}
                          {(p.track_count ?? 0) === 1 ? "track" : "tracks"}
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
            </ScrollView>
          )}
        </View>

        {music.currentTrack && (
          <Pressable
            style={[styles.miniPlayer, { bottom: insets.bottom + 10 }]}
            onPress={() => router.push("/now-playing")}
          >
            <View style={styles.miniPlayerContent}>
              <View style={styles.miniArtwork}>{renderTargetIcon(20)}</View>
              <View style={styles.miniTrackInfo}>
                <Text style={styles.miniTitle} numberOfLines={1}>
                  {cleanFilename(music.currentTrack.filename)}
                </Text>
                <Text style={styles.miniArtist} numberOfLines={1}>
                  {music.currentTrack.artist}
                </Text>
              </View>
              <View style={styles.miniControls}>
                <Pressable
                  onPress={() => router.push("/sonic")}
                  style={{ marginRight: 15 }}
                >
                  <Ionicons name="pulse" size={20} color="#00D2FF" />
                </Pressable>
                <Pressable onPress={() => void music.togglePlayback()}>
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
      </View>

      <SideDrawer
        isVisible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={handleNavigate}
        activeRoute={
          activeTab === "Playlists" ? "/library?tab=Playlists" : "/library"
        }
      />

      <Modal
        visible={!!selectedTrack}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTrack(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedTrack(null)}
        >
          <View style={styles.optionsCard}>
            <Pressable
              style={styles.optionRow}
              onPress={() => {
                if (selectedTrack) music.toggleFavorite(selectedTrack.id);
                setSelectedTrack(null);
              }}
            >
              <Ionicons
                name={
                  selectedTrack && music.isFavorite(selectedTrack.id)
                    ? "heart"
                    : "heart-outline"
                }
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.optionText}>Add to favourites</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setSelectedTrack(null);
                handleAddToPlaylist();
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Add to playlist</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => setSelectedTrack(null)}
            >
              <Ionicons
                name="play-forward-outline"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.optionText}>Play next</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => setSelectedTrack(null)}
            >
              <Ionicons name="list-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Add to queue</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setSelectedTrack(null);
                router.push("/equalizer");
              }}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.optionText}>Set equalizer for this song</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => setSelectedTrack(null)}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>View artist</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => setSelectedTrack(null)}
            >
              <Ionicons name="disc-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>View album</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => setSelectedTrack(null)}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.optionText}>Track information</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "600" },
  tabContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabScrollContent: { paddingHorizontal: 20, gap: 24 },
  tabButton: { paddingVertical: 14, position: "relative" },
  tabText: { color: COLORS.muted, fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: COLORS.orange, fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },
  contentWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  listCount: { color: COLORS.text, fontSize: 12, fontWeight: "500" },
  sortText: { color: COLORS.text, fontSize: 12, fontWeight: "500" },
  listContainer: { gap: 0 },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    height: SONG_ROW_HEIGHT,
  },
  songMainButton: { flex: 1, flexDirection: "row", alignItems: "center" },
  songArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  songArtActive: {},
  songInfo: { flex: 1, justifyContent: "center" },
  songTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  songTitleActive: { color: COLORS.orange },
  songArtist: { color: COLORS.muted, fontSize: 12 },
  songDuration: { color: COLORS.muted, fontSize: 12, marginRight: 10 },
  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 40 },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  artistInfo: { flex: 1, justifyContent: "center" },
  artistName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  artistTracks: { color: COLORS.muted, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  albumCard: { width: "47%", marginBottom: 16 },
  albumCover: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  albumTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  albumMeta: { color: COLORS.muted, fontSize: 12, marginBottom: 4 },
  albumTracks: { color: COLORS.muted, fontSize: 12 },
  folderListContainer: { gap: 12 },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  folderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1A1A1E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  folderInfo: { flex: 1, justifyContent: "center" },
  folderName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  folderPath: { color: COLORS.muted, fontSize: 11 },
  folderMeta: { alignItems: "flex-end" },
  folderCount: { color: COLORS.text, fontSize: 12, marginBottom: 4 },
  folderStorage: { color: COLORS.muted, fontSize: 11 },
  createPlaylistBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.orange,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 8,
  },
  createPlaylistIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#2B1B12",
    alignItems: "center",
    justifyContent: "center",
  },
  createPlaylistText: {
    flex: 1,
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: "700",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  categoryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  categoryInfo: { flex: 1 },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  categorySubtitle: { color: COLORS.muted, fontSize: 12 },
  circleIcon: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: { backgroundColor: COLORS.orange },
  miniPlayer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    overflow: "hidden",
  },
  miniPlayerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    flex: 1,
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
  progressBarBackground: {
    height: 2,
    backgroundColor: "#333",
    width: "100%",
  },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsCard: {
    width: 260,
    backgroundColor: "#1A1A1E",
    borderRadius: 12,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  optionText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
});