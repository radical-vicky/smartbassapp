import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { Href, useRouter } from "expo-router";
import { ComponentProps, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic, useMusicProgress } from "../context/MusicContext";
import { usePlaylists } from "../context/PlaylistContext";

const COLORS = {
  background: "#090A0C",
  panel: "#101419",
  tint: "#1B262C",
  text: "#F5F5F5",
  muted: "#A1A5AB",
  track: "#282C32",
  border: "#282C32",
  orange: "#FF8A00",
  cyan: "#22D3EE",
};

type IconName = ComponentProps<typeof Ionicons>["name"];

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function IconButton({
  icon, size = 24, color = COLORS.text, label, onPress, selected, disabled, badge,
}: {
  icon: IconName; size?: number; color?: string; label: string;
  onPress?: () => void; selected?: boolean; disabled?: boolean; badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.iconButton}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

export default function NowPlayingScreen() {
  const router = useRouter();
  const music = useMusic();
  const progress = useMusicProgress();
  const insets = useSafeAreaInsets();

  const track = music.currentTrack;
  const hasTrack = !!track;

  const isLiked = track ? music.isFavorite(track.id) : false;

  const duration = progress.duration || track?.duration || 0;
  const current = progress.currentTime;

  // Fast response — no setTimeout delays
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const shown = scrubValue ?? current;
  const remaining = Math.max(duration - shown, 0);

  const [artSize, setArtSize] = useState(0);
  const onArtLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArtSize(Math.max(0, Math.min(width - 40, height - 16)));
  };

  const { playlists, addTrackToPlaylist } = usePlaylists();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  // SAFEGUARD 1: If the song reaches the very end, automatically play next.
  // This handles cases where the background context misses the didJustFinish event.
  useEffect(() => {
    if (!track || !music.isPlaying) return;
    // If we are within 0.5 seconds of the end, and haven't already triggered it
    if (duration > 0 && current > 0 && duration - current < 0.5) {
       void music.playNext();
    }
  }, [current, duration, track, music]);

  const notify = (message: string) => {
    if (Platform.OS === "android") ToastAndroid.show(message, ToastAndroid.SHORT);
  };

  const toggleFavourite = () => {
    if (!track) return;
    music.toggleFavorite(track.id);
    notify(isLiked ? "Removed from favourites" : "Added to favourites");
  };

  const addToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!track) return;
    setPlaylistOpen(false);
    await addTrackToPlaylist(playlistId, track);
    notify(`Added to ${playlistName}`);
  };

  // SAFEGUARD 2: If the user taps Play/Pause while at the very end of the track,
  // seek to 0 first so it starts fresh.
  const handlePlayPause = () => {
    if (!hasTrack) return;
    
    // If the song has ended (within 1 second of the total duration)
    if (duration > 0 && current >= duration - 1) {
      void music.seekTo(0);
      // Small delay to ensure the seek completes before playing
      setTimeout(() => {
        void music.togglePlayback();
      }, 100);
    } else {
      void music.togglePlayback();
    }
  };

  const MENU_ITEMS: { icon: IconName; label: string; onPress: () => void }[] = [
    {
      icon: isLiked ? "heart" : "heart-outline",
      label: isLiked ? "Remove from favourites" : "Add to favourites",
      onPress: toggleFavourite,
    },
    {
      icon: "add-circle-outline",
      label: "Add to playlist",
      onPress: () => setPlaylistOpen(true),
    },
    {
      icon: "options-outline",
      label: "Set equalizer for this song",
      onPress: () =>
        router.push({
          pathname: "/equalizer",
          params: { trackId: String(track?.id) },
        } as Href),
    },
  ];

  const repeatOn = music.repeatMode !== "OFF";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <IconButton icon="chevron-down" size={26} label="Close player" onPress={() => router.back()} />
        <Text style={styles.headerTitle} accessibilityRole="header">Now playing</Text>
        <IconButton icon="ellipsis-vertical" size={22} label="More options" disabled={!hasTrack} onPress={() => setMenuOpen(true)} />
      </View>

      <View style={styles.artWrap} onLayout={onArtLayout}>
        <View style={[styles.art, { width: artSize, height: artSize }]} accessibilityLabel="Album artwork">
          <View style={styles.circleBig}><View style={styles.circleBigInner} /></View>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {track ? cleanFilename(track.filename) : "Nothing playing"}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {track?.artist || "Unknown artist"}
            </Text>
          </View>
          <IconButton
            icon={isLiked ? "heart" : "heart-outline"}
            color={COLORS.orange}
            label={isLiked ? "Remove from favourites" : "Add to favourites"}
            selected={isLiked}
            disabled={!hasTrack}
            onPress={toggleFavourite}
          />
        </View>

        <View style={styles.scrub}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={shown}
            disabled={!hasTrack}
            onSlidingStart={() => setScrubValue(current)}
            onValueChange={(v) => setScrubValue(v)}
            onSlidingComplete={(v) => {
              setScrubValue(null);
              void music.seekTo(v);
            }}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor={COLORS.track}
            thumbTintColor={COLORS.orange}
            accessibilityLabel="Playback position"
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(shown)}</Text>
            <Text style={styles.time}>-{fmt(remaining)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <IconButton icon="shuffle" size={22} color={music.shuffle ? COLORS.orange : COLORS.muted} label={music.shuffle ? "Shuffle on" : "Shuffle off"} selected={music.shuffle} disabled={!hasTrack} onPress={() => void music.toggleShuffle()} />
          <IconButton icon="play-skip-back" size={28} label="Previous track" disabled={!hasTrack} onPress={() => void music.playPrevious()} />
          
          {/* UPDATED PLAY BUTTON: uses handlePlayPause */}
          <Pressable onPress={handlePlayPause} disabled={!hasTrack} style={[styles.playBtn, !hasTrack && styles.disabled]} accessibilityRole="button" accessibilityLabel={music.isPlaying ? "Pause" : "Play"}>
            <Ionicons name={music.isPlaying ? "pause" : "play"} size={32} color={COLORS.background} />
          </Pressable>
          
          <IconButton icon="play-skip-forward" size={28} label="Next track" disabled={!hasTrack} onPress={() => void music.playNext()} />
          <IconButton
            icon={repeatOn ? "repeat" : "repeat-outline"}
            size={22}
            color={repeatOn ? COLORS.orange : COLORS.muted}
            label={music.repeatMode === "ONE" ? "Repeat one" : music.repeatMode === "ALL" ? "Repeat all" : "Repeat off"}
            selected={repeatOn}
            badge={music.repeatMode === "ONE" ? "1" : undefined}
            disabled={!hasTrack}
            onPress={() => void music.cycleRepeat()}
          />
        </View>

        <View style={styles.bottomActions}>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/sonic")}>
            <Ionicons name="pulse" size={20} color={COLORS.cyan} />
            <Text style={[styles.actionText, { color: COLORS.cyan }]}>Sonic Engine</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => router.push("/queue")}>
            <Ionicons name="list" size={20} color={COLORS.muted} />
            <Text style={[styles.actionText, { color: COLORS.muted }]}>Queue</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 52 }]}>
            {MENU_ITEMS.map((item) => (
              <Pressable key={item.label} style={styles.menuItem} onPress={() => { setMenuOpen(false); item.onPress(); }}>
                <Ionicons name={item.icon} size={20} color={COLORS.muted} />
                <Text style={styles.menuText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={playlistOpen} transparent animationType="slide" onRequestClose={() => setPlaylistOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPlaylistOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Add to playlist</Text>
            {playlists.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Text style={styles.sheetEmptyText}>You don't have any playlists yet.</Text>
                <Pressable onPress={() => { setPlaylistOpen(false); router.push("/playlists"); }}>
                  <Text style={styles.sheetAction}>Create a playlist</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {playlists.map((p) => (
                  <Pressable key={p.id} style={styles.menuItem} onPress={() => void addToPlaylist(p.id, p.name)}>
                    <Ionicons name="musical-notes" size={20} color={COLORS.orange} />
                    <Text style={styles.menuText} numberOfLines={1}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 56 },
  headerTitle: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 14, right: 13, color: COLORS.orange, fontSize: 9, fontWeight: "800" },
  artWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  art: { backgroundColor: COLORS.tint, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  circleBig: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleBigInner: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.orange },
  panel: { backgroundColor: COLORS.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: COLORS.border, paddingHorizontal: 24, paddingTop: 24 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "700", marginBottom: 4 },
  artist: { color: COLORS.muted, fontSize: 14 },
  scrub: { marginBottom: 16 },
  slider: { width: "100%", height: 40 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  time: { color: COLORS.muted, fontSize: 12, fontVariant: ["tabular-nums"] },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  playBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  menu: { position: "absolute", right: 12, width: 272, backgroundColor: "#20242A", borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 48, paddingHorizontal: 16 },
  menuText: { flex: 1, color: COLORS.text, fontSize: 15 },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { backgroundColor: COLORS.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 16 },
  sheetTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700", paddingHorizontal: 16, paddingBottom: 8 },
  sheetEmpty: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  sheetEmptyText: { color: COLORS.muted, fontSize: 14 },
  sheetAction: { color: COLORS.orange, fontSize: 14, fontWeight: "600" },
  bottomActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  actionText: { fontSize: 13, fontWeight: "600" },
});