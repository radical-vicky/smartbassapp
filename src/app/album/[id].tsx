import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
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
import { usePlaylists } from "../../context/PlaylistContext";

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

// ✅ FIXED: safely handles milliseconds from Android media library
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const totalSec = seconds > 36000 ? seconds / 1000 : seconds;
  const minutes = Math.floor(totalSec / 60);
  const remainingSeconds = Math.floor(totalSec % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function AlbumDetailScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const { id } = useLocalSearchParams<{ id: string }>();
  const albumName = decodeURIComponent(id || "Unknown Album");

  const [menuOpen, setMenuOpen] = useState(false);

  const albumTracks = useMemo(() => {
    return music.tracks.filter((t) => t.album === albumName);
  }, [music.tracks, albumName]);

  const artistName = albumTracks[0]?.artist || "Unknown Artist";
  const trackCount = albumTracks.length;

  // FIXED: apply ms → sec conversion to total duration too
  const totalDuration = albumTracks.reduce(
    (acc, t) => {
      const raw = t.duration || 0;
      return acc + (raw > 36000 ? raw / 1000 : raw);
    },
    0
  );
  const totalMins = Math.floor(totalDuration / 60);

  const albumGradient = GRADIENTS[0];

  const playAll = () => {
    if (albumTracks.length === 0) return;
    void music.playTrack(albumTracks[0], albumTracks);
    router.push("/now-playing");
  };

  const shuffleAll = () => {
    if (albumTracks.length === 0) return;
    if (!music.shuffle) void music.toggleShuffle();
    const randomIdx = Math.floor(Math.random() * albumTracks.length);
    void music.playTrack(albumTracks[randomIdx], albumTracks);
    router.push("/now-playing");
  };

  const showTrackMenu = (track: DeviceTrack) => {
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
    Alert.alert(cleanFilename(track.filename), "Choose an action", buttons);
  };

  const renderTargetIcon = (size = 50) => (
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Album</Text>
        <Pressable hitSlop={10} onPress={() => setMenuOpen(true)}>
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
        <View style={styles.albumHeader}>
          <LinearGradient
            colors={albumGradient as [string, string]}
            style={styles.albumArtLarge}
          >
            {renderTargetIcon(80)}
          </LinearGradient>

          <Text style={styles.albumTitle}>{albumName}</Text>
          <Text style={styles.albumArtist}>
            {artistName} · 2024 · {trackCount} tracks · {totalMins} min
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={playAll} style={styles.playAllBtn}>
            <Ionicons name="play" size={18} color="#08090B" />
            <Text style={styles.playAllText}>Play All</Text>
          </Pressable>

          <Pressable onPress={shuffleAll} style={styles.shuffleBtn}>
            <Ionicons name="shuffle" size={18} color={COLORS.text} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>

        <View style={styles.trackList}>
          {albumTracks.map((track, index) => {
            const isActive = music.currentTrack?.id === track.id;

            return (
              <Pressable
                key={track.id}
                style={[styles.trackRow, isActive && styles.trackRowActive]}
                onPress={() => {
                  void music.playTrack(track, albumTracks);
                  router.push("/now-playing");
                }}
              >
                <Text
                  style={[
                    styles.trackNumber,
                    isActive && { color: COLORS.orange },
                  ]}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </Text>

                <View style={styles.trackInfo}>
                  <Text
                    style={[
                      styles.trackTitle,
                      isActive && { color: COLORS.orange },
                    ]}
                    numberOfLines={1}
                  >
                    {cleanFilename(track.filename)}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>

                <Text style={styles.trackDuration}>
                  {formatDuration(track.duration)}
                </Text>

                <Pressable
                  hitSlop={10}
                  style={{ marginLeft: 15 }}
                  onPress={() => showTrackMenu(track)}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color={COLORS.muted}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* MINI PLAYER — Fixed icon & consistent behavior */}
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

      {/* ALBUM MENU MODAL — actual working options */}
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
          <View style={styles.optionsCard}>
            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setMenuOpen(false);
                playAll();
              }}
            >
              <Ionicons name="play" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Play album</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setMenuOpen(false);
                shuffleAll();
              }}
            >
              <Ionicons name="shuffle" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Shuffle album</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setMenuOpen(false);
                if (albumTracks.length > 0) {
                  showTrackMenu(albumTracks[0]);
                }
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Add to playlist</Text>
            </Pressable>

            <Pressable
              style={styles.optionRow}
              onPress={() => {
                setMenuOpen(false);
                router.push(
                  `/artist/${encodeURIComponent(artistName)}`
                );
              }}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.optionText}>Go to artist</Text>
            </Pressable>
          </View>
        </RNPressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600" },

  scrollContent: { paddingHorizontal: 20 },

  albumHeader: { alignItems: "center", marginTop: 10, marginBottom: 24 },
  albumArtLarge: {
    width: 180,
    height: 180,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  albumTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
  },
  albumArtist: { color: COLORS.muted, fontSize: 13 },

  actionRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  playAllBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  playAllText: { color: "#08090B", fontSize: 14, fontWeight: "700" },
  shuffleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  shuffleText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

  trackList: { marginBottom: 30 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    borderRadius: 6,
  },
  trackRowActive: {
    backgroundColor: "#1A1511",
    borderBottomWidth: 0,
  },
  trackNumber: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    width: 30,
  },
  trackInfo: { flex: 1 },
  trackTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  trackArtist: { color: COLORS.muted, fontSize: 12 },
  trackDuration: {
    color: COLORS.muted,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },

  circleIcon: {
    borderWidth: 4,
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