import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { AssetField, MediaType, Query } from "expo-media-library";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  Pressable as RNPressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#090A0C",
  card: "#171A1E",
  elevated: "#20242A",
  border: "#282C32",
  text: "#F5F5F5",
  muted: "#A1A5AB",
  faint: "#70757D",
  orange: "#FF8A00",
  cyan: "#22D3EE", // Sonic Engine indicator only
};

const TINTS = ["#2F3E46", "#5C3A21", "#2B3A2F", "#3D3A22", "#2F223D", "#223D3A"];
const ROW_HEIGHT = 88;
const MINI_PLAYER_HEIGHT = 64;
const CHUNK = 25; // how many videos to read info for at once

type IconName = ComponentProps<typeof Ionicons>["name"];
type SortKey = "newest" | "name" | "longest";
type Status = "loading" | "ready" | "denied" | "error";

type VideoItem = {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  creationTime: number;
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "name", label: "Name" },
  { key: "longest", label: "Longest" },
];

/* ---------- helpers ---------- */

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  // Some devices report milliseconds; treat anything over 10 h as ms.
  const total = seconds > 36000 ? seconds / 1000 : seconds;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function cleanName(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function resolutionLabel(w: number, h: number) {
  const side = Math.max(w, h) > 0 ? Math.min(w, h) : 0;
  if (!side) return "";
  if (side >= 2160) return "4K";
  if (side >= 1440) return "2K";
  if (side >= 1080) return "1080p";
  if (side >= 720) return "720p";
  return `${w}×${h}`;
}

function relativeDate(ts: number) {
  if (!ts) return "";
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

function tintFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % 997;
  return TINTS[n % TINTS.length];
}

/* ---------- small building blocks ---------- */

function VideoRow({ item, onPress }: { item: VideoItem; onPress: () => void }) {
  const meta = [resolutionLabel(item.width, item.height), relativeDate(item.creationTime)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Play ${cleanName(item.filename)}, ${formatDuration(item.duration)}`}
    >
      <View style={[styles.thumb, { backgroundColor: tintFor(item.id) }]}>
        <Ionicons name="play" size={22} color="rgba(255,255,255,0.6)" />
        {/* Android can render a frame from a local video URI. If it can't,
            the tinted placeholder underneath stays visible. */}
        <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {cleanName(item.filename)}
        </Text>
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={COLORS.faint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction && (
        <Pressable
          style={styles.emptyButton}
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ---------- screen ---------- */

export default function VideoLibraryScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const scanId = useRef(0);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (playingVideo) {
      player.replace({ uri: playingVideo.uri });
      player.play();
    } else {
      player.pause();
    }
  }, [playingVideo, player]);

  const loadVideos = async () => {
    const id = ++scanId.current; // ignore results from an older scan
    try {
      let perm = await MediaLibrary.getPermissionsAsync();
      if (!perm.granted) perm = await MediaLibrary.requestPermissionsAsync();
      if (id !== scanId.current) return;
      if (!perm.granted) {
        setCanAskAgain(perm.canAskAgain);
        setStatus("denied");
        return;
      }

      const assets = await new Query()
        .eq(AssetField.MEDIA_TYPE, MediaType.VIDEO)
        .limit(2000)
        .exe();

      // Read details in parallel batches and show results as they arrive,
      // instead of waiting for every file one by one.
      const found: VideoItem[] = [];
      for (let i = 0; i < assets.length; i += CHUNK) {
        const batch = assets.slice(i, i + CHUNK);
        const settled = await Promise.allSettled(
          batch.map(async (asset) => ({
            asset,
            info: await (asset as any).getInfo(),
          })),
        );
        if (id !== scanId.current) return;
        for (const r of settled) {
          if (r.status !== "fulfilled") continue; // skip unreadable files
          const { asset, info } = r.value as { asset: any; info: any };
          found.push({
            id: String(info.id ?? asset.id),
            uri: info.uri,
            filename: info.filename || "Video",
            duration: Number(info.duration ?? 0),
            width: Number(info.width ?? 0),
            height: Number(info.height ?? 0),
            creationTime: Number(info.creationTime ?? 0),
          });
        }
        setVideos([...found]);
        setStatus("ready");
      }
      if (assets.length === 0) {
        setVideos([]);
        setStatus("ready");
      }
    } catch (e) {
      console.warn("Video scan failed:", e);
      if (id === scanId.current) setStatus("error");
    }
  };

  useEffect(() => {
    void loadVideos();
    return () => {
      scanId.current++; // cancel any scan still running
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? videos.filter((v) => cleanName(v.filename).toLowerCase().includes(q))
      : [...videos];
    if (sort === "name") {
      list.sort((a, b) => cleanName(a.filename).localeCompare(cleanName(b.filename)));
    } else if (sort === "longest") {
      list.sort((a, b) => b.duration - a.duration);
    } else {
      list.sort((a, b) => b.creationTime - a.creationTime);
    }
    return list;
  }, [videos, search, sort]);

  const openVideo = (item: VideoItem) => {
    // Don't let music and video play over each other.
    if (music.isPlaying) void music.togglePlayback();
    setPlayingVideo(item);
  };

  const listBottom = insets.bottom + (currentTrack ? MINI_PLAYER_HEIGHT + 24 : 24);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Video library
          </Text>
          {status === "ready" && (
            <Text style={styles.headerCount}>
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search videos"
          placeholderTextColor={COLORS.faint}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search videos"
        />
        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch("")}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      {status === "ready" && videos.length > 0 && (
        <View style={styles.sortRow}>
          {SORTS.map((s) => {
            const on = s.key === sort;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSort(s.key)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Sort by ${s.label}`}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {status === "loading" ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.orange} size="large" />
          <Text style={styles.muted}>Looking for videos…</Text>
        </View>
      ) : status === "denied" ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Allow access to your videos"
          body="RADEV SONIC needs permission to read videos on your device. Nothing is uploaded."
          actionLabel={canAskAgain ? "Allow access" : "Open settings"}
          onAction={canAskAgain ? () => void loadVideos() : () => void Linking.openSettings()}
        />
      ) : status === "error" ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load videos"
          body="Something went wrong while scanning your device."
          actionLabel="Try again"
          onAction={() => {
            setStatus("loading");
            void loadVideos();
          }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={videos.length === 0 ? "videocam-outline" : "search-outline"}
          title={videos.length === 0 ? "No videos found" : "No matches"}
          body={
            videos.length === 0
              ? "Videos saved on your phone will show up here."
              : `Nothing matches "${search}".`
          }
          actionLabel={videos.length === 0 ? "Scan again" : "Clear search"}
          onAction={videos.length === 0 ? () => void onRefresh() : () => setSearch("")}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => <VideoRow item={item} onPress={() => openVideo(item)} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: listBottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.orange}
              colors={[COLORS.orange]}
              progressBackgroundColor={COLORS.card}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
            index,
          })}
        />
      )}

      {currentTrack && (
        <Pressable
          style={[styles.mini, { paddingBottom: insets.bottom }]}
          onPress={() => router.push("/now-playing")}
          accessibilityRole="button"
          accessibilityLabel={`Now playing ${cleanName(currentTrack.filename)}. Open player`}
        >
          <View style={styles.miniRow}>
            <View style={styles.miniInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {cleanName(currentTrack.filename)}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/sonic")}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Open Sonic Engine"
            >
              <Ionicons name="pulse" size={22} color={COLORS.cyan} />
            </Pressable>
            <Pressable
              onPress={() => void music.togglePlayback()}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={music.isPlaying ? "Pause" : "Play"}
            >
              <Ionicons
                name={music.isPlaying ? "pause" : "play"}
                size={26}
                color={COLORS.orange}
              />
            </Pressable>
          </View>
        </Pressable>
      )}

      <Modal
        visible={!!playingVideo}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPlayingVideo(null)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <StatusBar hidden />
        <View style={styles.playerContainer}>
          {playingVideo && (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
              contentFit="contain"
            />
          )}
          {/* Title and close sit at the top so they never cover the
              video's own playback controls at the bottom. */}
          <View style={[styles.playerBar, { paddingTop: insets.top + 8 }]}>
            <RNPressable
              style={styles.playerClose}
              onPress={() => setPlayingVideo(null)}
              accessibilityRole="button"
              accessibilityLabel="Close video"
            >
              <Ionicons name="chevron-down" size={28} color="#FFF" />
            </RNPressable>
            {playingVideo && (
              <Text style={styles.playerTitle} numberOfLines={1}>
                {cleanName(playingVideo.filename)}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 56 },
  headerText: { flex: 1, marginLeft: 4 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  headerCount: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 20,
    paddingLeft: 14,
    height: 46,
    borderRadius: 23,
    gap: 10,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },
  clearButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  sortRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  chipTextOn: { color: COLORS.background },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: COLORS.muted, fontSize: 13 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyBody: { color: COLORS.muted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyButton: {
    marginTop: 8,
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: { color: COLORS.background, fontSize: 14, fontWeight: "700" },

  row: { height: ROW_HEIGHT, flexDirection: "row", alignItems: "center", gap: 14 },
  thumb: {
    width: 112,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "600", fontVariant: ["tabular-nums"] },
  rowText: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  rowMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4 },

  mini: {
    backgroundColor: COLORS.elevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  miniRow: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 8, height: MINI_PLAYER_HEIGHT },
  miniInfo: { flex: 1 },
  miniTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  playerContainer: { flex: 1, backgroundColor: "#000" },
  video: { flex: 1, backgroundColor: "#000" },
  playerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  playerClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  playerTitle: { flex: 1, color: "#FFF", fontSize: 16, fontWeight: "600", marginLeft: 4 },
});
