import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../../components/AppPressable";
import { DeviceTrack, useMusic } from "../../context/MusicContext";
import {
  PlaylistTrackRow,
  usePlaylists,
} from "../../context/PlaylistContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const GRADIENTS = [
  ["#2F3E46", "#1B262C"],
  ["#5C3A21", "#2B1B12"],
  ["#2B3A2F", "#142118"],
  ["#3D3A22", "#242113"],
  ["#2F223D", "#1A1324"],
  ["#223D3A", "#132421"],
];

// ✅ FIXED: handles milliseconds or seconds automatically
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = seconds > 36000 ? seconds / 1000 : seconds;
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    getPlaylistTracks,
    removeTrackFromPlaylist,
    deletePlaylist,
  } = usePlaylists();
  const music = useMusic();

  const playlist = playlists.find((p) => p.id === id);
  const [rows, setRows] = useState<PlaylistTrackRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getPlaylistTracks(id);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePlay = (shuffle = false) => {
    if (rows.length === 0) return;
    const tracks: DeviceTrack[] = rows.map((r) => ({
      id: r.track_id,
      uri: r.track_uri,
      filename: r.track_filename,
      duration: r.track_duration,
      artist: r.track_artist ?? "Unknown Artist",
      album: r.track_album ?? "Unknown Album",
      folder: "",
    }));

    if (shuffle) {
      if (!music.shuffle) void music.toggleShuffle();
      const randomIdx = Math.floor(Math.random() * tracks.length);
      void music.playTrack(tracks[randomIdx], tracks);
    } else {
      void music.playTrack(tracks[0], tracks);
    }
    router.push("/now-playing");
  };

  const handleRemove = (row: PlaylistTrackRow) => {
    Alert.alert(
      "Remove track",
      `Remove "${cleanFilename(row.track_filename)}" from playlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeTrackFromPlaylist(row.id);
            await load();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!playlist) return;
    setMenuOpen(false);
    Alert.alert("Delete playlist", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePlaylist(playlist.id);
          router.back();
        },
      },
    ]);
  };

  // ✅ FIXED: apply ms → sec to total duration
  const totalDuration = rows.reduce((acc, r) => {
    const raw = r.track_duration || 0;
    return acc + (raw > 36000 ? raw / 1000 : raw);
  }, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.floor((totalDuration % 3600) / 60);
  const durationString =
    totalHours > 0 ? `${totalHours} h ${totalMins} min` : `${totalMins} min`;

  const renderTargetIcon = (size = 30) => (
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Playlist</Text>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + insets.bottom },
        ]}
      >
        <View style={styles.infoRow}>
          {playlist?.cover_url ? (
            <Image
              source={{ uri: playlist.cover_url }}
              style={styles.coverLarge}
            />
          ) : (
            <LinearGradient
              colors={["#5C3A21", "#2B1B12"]}
              style={styles.coverLarge}
            >
              {renderTargetIcon(40)}
            </LinearGradient>
          )}
          <View style={styles.infoText}>
            <Text style={styles.name} numberOfLines={2}>
              {playlist?.name || "Playlist"}
            </Text>
            <Text style={styles.stats}>
              {rows.length} songs · {durationString}
            </Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable style={styles.primaryBtn} onPress={() => handlePlay(false)}>
            <Ionicons name="play" size={16} color="#08090B" />
            <Text style={styles.primaryBtnText}>Play</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => handlePlay(true)}>
            <Ionicons name="shuffle" size={16} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>Shuffle</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push("/library")}
          >
            <Ionicons name="add" size={16} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>Add tracks</Text>
          </Pressable>

          {/* ✅ Reorder now toggles a visual editing mode */}
          <Pressable
            style={[styles.secondaryBtn, reordering && styles.secondaryBtnActive]}
            onPress={() => setReordering((v) => !v)}
          >
            <Ionicons
              name="swap-vertical"
              size={16}
              color={reordering ? "#08090B" : COLORS.text}
            />
            <Text
              style={[
                styles.secondaryBtnText,
                reordering && { color: "#08090B" },
              ]}
            >
              {reordering ? "Done" : "Reorder"}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.orange} style={{ marginTop: 40 }} />
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="musical-notes-outline"
              size={44}
              color={COLORS.muted}
            />
            <Text style={styles.emptyText}>
              No tracks yet. Add songs from your library.
            </Text>
          </View>
        ) : (
          <View style={styles.trackList}>
            {rows.map((row, index) => {
              const isActive = music.currentTrack?.id === row.track_id;

              return (
                <Pressable
                  key={row.id}
                  style={[styles.trackRow, isActive && styles.trackRowActive]}
                  onPress={() => {
                    const tracks: DeviceTrack[] = rows.map((r) => ({
                      id: r.track_id,
                      uri: r.track_uri,
                      filename: r.track_filename,
                      duration: r.track_duration,
                      artist: r.track_artist ?? "",
                      album: r.track_album ?? "",
                      folder: "",
                    }));
                    void music.playTrack(tracks[index], tracks);
                    router.push("/now-playing");
                  }}
                >
                  <LinearGradient
                    colors={
                      GRADIENTS[index % GRADIENTS.length] as [string, string]
                    }
                    style={styles.trackArt}
                  >
                    {renderTargetIcon(18)}
                  </LinearGradient>

                  <View style={styles.trackInfo}>
                    <Text
                      style={[
                        styles.trackTitle,
                        isActive && { color: COLORS.orange },
                      ]}
                      numberOfLines={1}
                    >
                      {cleanFilename(row.track_filename)}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {row.track_artist || "Unknown Artist"}
                    </Text>
                  </View>

                  <View style={styles.trackActions}>
                    {/* ✅ Drag handle only shows in reorder mode */}
                    {reordering && (
                      <Ionicons
                        name="reorder-three"
                        size={22}
                        color={COLORS.orange}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    <Pressable hitSlop={10} onPress={() => handleRemove(row)}>
                      <Ionicons
                        name="close"
                        size={18}
                        color={COLORS.muted}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MINI PLAYER */}
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

      {/* ✅ PLAYLIST MENU MODAL */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <RNPressable
          style={styles.modalOverlay}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                router.push("/edit-playlist");
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={COLORS.text}
              />
              <Text style={styles.menuText}>Edit playlist details</Text>
            </Pressable>

            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                router.push("/library?tab=Playlists");
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
              <Text style={styles.menuText}>Add more songs</Text>
            </Pressable>

            <Pressable style={styles.menuRow} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#F87171" />
              <Text style={[styles.menuText, { color: "#F87171" }]}>
                Delete playlist
              </Text>
            </Pressable>
          </View>
        </RNPressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600" },

  scrollContent: { paddingHorizontal: 20 },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
    gap: 16,
  },
  coverLarge: {
    width: 110,
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  name: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  stats: { color: COLORS.muted, fontSize: 12 },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.orange,
    borderRadius: 10,
    paddingVertical: 14,
    width: "48%",
    gap: 8,
  },
  primaryBtnText: { color: "#08090B", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 14,
    width: "48%",
    gap: 8,
  },
  secondaryBtnActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  secondaryBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

  trackList: { gap: 0 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  trackRowActive: { backgroundColor: "#1A1511", borderBottomWidth: 0 },
  trackArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  trackInfo: { flex: 1, justifyContent: "center" },
  trackTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  trackArtist: { color: COLORS.muted, fontSize: 12 },
  trackActions: { flexDirection: "row", alignItems: "center" },

  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { color: COLORS.muted, fontSize: 12, textAlign: "center" },

  circleIcon: {
    borderWidth: 2,
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
  progressBarBackground: { height: 2, backgroundColor: "#333", width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  menuCard: {
    backgroundColor: "#1A1A1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    paddingBottom: 30,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 14,
  },
  menuText: { color: COLORS.text, fontSize: 14, fontWeight: "500" },
});