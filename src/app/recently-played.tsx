import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { DeviceTrack, useMusic } from "../context/MusicContext";
import { usePlaylists } from "../context/PlaylistContext";
import { useRecentlyPlayed } from "../context/RecentlyPlayedContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

function clean(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = seconds > 36000 ? seconds / 1000 : seconds;
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RecentlyPlayedScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { recentTracks, clearHistory } = useRecentlyPlayed();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const [selected, setSelected] = useState<DeviceTrack | null>(null);

  const currentTrack = music.currentTrack;

  // Build a list of unique albums from the recently played tracks
  const recentAlbums = useMemo(() => {
    const seen = new Set<string>();
    const albums: DeviceTrack[] = [];
    recentTracks.forEach((t) => {
      const key = t.album || "Unknown Album";
      if (!seen.has(key)) {
        seen.add(key);
        albums.push(t);
      }
    });
    return albums.slice(0, 6);
  }, [recentTracks]);

  const todayList = recentTracks.slice(0, 5);
  const yesterdayList = recentTracks.slice(5, 10);

  const renderTargetIcon = (size = 24) => (
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
        Alert.alert("Added", `"${clean(track.filename)}" added.`);
      },
    }));
    buttons.push({ text: "Cancel", style: "cancel" } as any);
    Alert.alert(clean(track.filename), "Choose an action", buttons);
  };

  const handleClearHistory = () => {
    Alert.alert("Clear history", "Remove all recently played tracks?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => void clearHistory(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recently Played</Text>
        <Pressable onPress={handleClearHistory} hitSlop={10}>
          <Ionicons name="trash-outline" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      {recentTracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No recent tracks yet</Text>
          <Text style={styles.emptySub}>
            Play a song and it will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, { paddingBottom: 40 + insets.bottom }]}
        >
          {recentAlbums.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>ALBUMS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                {recentAlbums.map((a, index) => (
                  <Pressable
                    key={a.album}
                    style={styles.albumCard}
                    onPress={() =>
                      router.push(`/album/${encodeURIComponent(a.album)}`)
                    }
                  >
                    <LinearGradient
                      colors={
                        index % 2 === 0
                          ? ["#2A2A2A", "#1A1A1A"]
                          : ["#3D2222", "#1A0F0F"]
                      }
                      style={styles.albumImg}
                    >
                      {renderTargetIcon(30)}
                    </LinearGradient>
                    <Text style={styles.albumTitle} numberOfLines={1}>
                      {a.album || "Unknown Album"}
                    </Text>
                    <Text style={styles.albumSub} numberOfLines={1}>
                      {a.artist}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {todayList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>TODAY</Text>
              {todayList.map((t) => (
                <Pressable
                  key={`today-${t.id}`}
                  style={styles.row}
                  onPress={() => void music.playTrack(t, recentTracks)}
                >
                  <LinearGradient
                    colors={["#2A2A2A", "#1A1A1A"]}
                    style={styles.rowArt}
                  >
                    {renderTargetIcon(18)}
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {clean(t.filename)}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {t.artist}
                    </Text>
                  </View>
                  <Text style={styles.rowDur}>{formatDuration(t.duration)}</Text>
                  <Pressable
                    hitSlop={10}
                    onPress={() => showTrackMenu(t)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color={COLORS.muted}
                    />
                  </Pressable>
                </Pressable>
              ))}
            </>
          )}

          {yesterdayList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>EARLIER</Text>
              {yesterdayList.map((t) => (
                <Pressable
                  key={`yest-${t.id}`}
                  style={styles.row}
                  onPress={() => void music.playTrack(t, recentTracks)}
                >
                  <LinearGradient
                    colors={["#2A2A2A", "#1A1A1A"]}
                    style={styles.rowArt}
                  >
                    {renderTargetIcon(18)}
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {clean(t.filename)}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {t.artist}
                    </Text>
                  </View>
                  <Text style={styles.rowDur}>{formatDuration(t.duration)}</Text>
                  <Pressable
                    hitSlop={10}
                    onPress={() => showTrackMenu(t)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color={COLORS.muted}
                    />
                  </Pressable>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {currentTrack && (
        <Pressable
          style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}
          onPress={() => router.push("/now-playing")}
        >
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>{renderTargetIcon(20)}</View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {clean(currentTrack.filename)}
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
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  body: { paddingHorizontal: 20 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 12,
  },
  albumCard: { width: 110 },
  albumImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  albumTitle: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  albumSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    gap: 12,
  },
  rowArt: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  rowSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  rowDur: { color: COLORS.muted, fontSize: 11, marginRight: 6 },
  circleIcon: {
    borderWidth: 2,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: { backgroundColor: COLORS.orange },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  emptySub: { color: COLORS.muted, fontSize: 13, textAlign: "center" },

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