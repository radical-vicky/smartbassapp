import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
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

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function ArtistDetailScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { playlists, addTrackToPlaylist } = usePlaylists();

  const { id } = useLocalSearchParams<{ id: string }>();
  const artistName = decodeURIComponent(id || "Unknown Artist");

  const artistTracks = useMemo(() => {
    return music.tracks.filter((t) => t.artist === artistName);
  }, [music.tracks, artistName]);

  const artistAlbums = useMemo(() => {
    const map = new Map<string, typeof artistTracks>();
    artistTracks.forEach((track) => {
      const key = track.album || "Unknown Album";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(track);
    });
    return Array.from(map.entries());
  }, [artistTracks]);

  const relatedArtists = useMemo(() => {
    const allArtists = Array.from(new Set(music.tracks.map((t) => t.artist)));
    return allArtists.filter((a) => a !== artistName).slice(0, 4);
  }, [music.tracks, artistName]);

  const topTracks = artistTracks.slice(0, 3);

  const handlePlayArtist = () => {
    if (artistTracks.length > 0) {
      void music.playTrack(artistTracks[0], artistTracks);
      router.push("/now-playing");
    }
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        >
          <LinearGradient
            colors={["#2F3E46", "#151A1C"]}
            style={styles.heroSection}
          >
            <View style={styles.headerTop}>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="chevron-back" size={26} color={COLORS.text} />
              </Pressable>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.iconCircleLarge}>
                <Ionicons
                  name="person-outline"
                  size={64}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artistName}
                  </Text>
                  <Text style={styles.artistStats}>
                    {artistAlbums.length} albums · {artistTracks.length} songs
                  </Text>
                </View>

                <Pressable style={styles.followBtn}>
                  <Ionicons
                    name="heart-outline"
                    size={16}
                    color={COLORS.orange}
                  />
                  <Text style={styles.followBtnText}>Follow</Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.bodyContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOP TRACKS</Text>
            </View>

            <View style={styles.tracksList}>
              {topTracks.map((track, index) => (
                <Pressable
                  key={track.id}
                  style={styles.trackRow}
                  onPress={() => {
                    void music.playTrack(track, artistTracks);
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
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {cleanFilename(track.filename)}
                    </Text>
                    <Text style={styles.trackSub} numberOfLines={1}>
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ALBUMS</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {artistAlbums.map(([album, tracks], index) => (
                <Pressable
                  key={album}
                  style={styles.cardItem}
                  onPress={() =>
                    router.push(`/album/${encodeURIComponent(album)}`)
                  }
                >
                  <LinearGradient
                    colors={
                      GRADIENTS[index % GRADIENTS.length] as [string, string]
                    }
                    style={styles.squareArt}
                  >
                    {renderTargetIcon(32)}
                  </LinearGradient>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {album}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {tracks[0]?.artist}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {relatedArtists.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>RELATED ARTISTS</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {relatedArtists.map((relatedName, index) => (
                    <Pressable
                      key={relatedName}
                      style={styles.cardItem}
                      onPress={() =>
                        router.push(`/artist/${encodeURIComponent(relatedName)}`)
                      }
                    >
                      <LinearGradient
                        colors={
                          GRADIENTS[
                            (index + 2) % GRADIENTS.length
                          ] as [string, string]
                        }
                        style={styles.circleArt}
                      >
                        {renderTargetIcon(28)}
                      </LinearGradient>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {relatedName}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </ScrollView>

        {music.currentTrack && (
          <Pressable
            style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  heroSection: { paddingTop: 10, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { marginBottom: 20 },
  heroContent: { alignItems: "center" },
  iconCircleLarge: { marginBottom: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
  },
  artistName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  artistStats: { color: COLORS.muted, fontSize: 13 },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.orange,
    marginBottom: 4,
  },
  followBtnText: { color: COLORS.orange, fontSize: 12, fontWeight: "600" },
  bodyContent: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tracksList: { gap: 16, marginBottom: 30 },
  trackRow: { flexDirection: "row", alignItems: "center" },
  trackArt: {
    width: 48,
    height: 48,
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
  trackSub: { color: COLORS.muted, fontSize: 12 },
  horizontalScroll: { gap: 16, paddingBottom: 30, paddingRight: 20 },
  cardItem: { width: 100 },
  squareArt: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  circleArt: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardSub: { color: COLORS.muted, fontSize: 11 },
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