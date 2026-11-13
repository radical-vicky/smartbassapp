import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

const TABS = ["Tracks", "Artists", "Albums"] as const;
type TabType = typeof TABS[number];

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

export default function FavouritesScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [activeTab, setActiveTab] = useState<TabType>("Tracks");

  // Use the global music context for favorites
  const favouriteIds = music.favorites;
  const favouriteTracks = music.tracks.filter((t) => favouriteIds.includes(t.id));

  // Derive unique favourite artists from the tracks
  const favouriteArtists = Array.from(
    new Set(favouriteTracks.map((t) => t.artist))
  ).filter(Boolean);

  // Derive unique favourite albums from the tracks
  const favouriteAlbums = Array.from(
    new Set(favouriteTracks.map((t) => t.album))
  ).filter(Boolean);

  const handlePlayAll = () => {
    if (favouriteTracks.length > 0) {
      void music.playTrack(favouriteTracks[0], favouriteTracks);
      router.push("/now-playing");
    }
  };

  const handleShuffle = () => {
    if (favouriteTracks.length > 0) {
      if (!music.shuffle) void music.toggleShuffle();
      const randomIdx = Math.floor(Math.random() * favouriteTracks.length);
      void music.playTrack(favouriteTracks[randomIdx], favouriteTracks);
      router.push("/now-playing");
    }
  };

  const renderTargetIcon = (size = 20) => (
    <View style={[styles.circleIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.circleInner, { width: size / 4, height: size / 4, borderRadius: size / 8 }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
          <Pressable hitSlop={10}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {TABS.map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        
        {activeTab === "Tracks" && (
          <>
            <View style={styles.actionRow}>
              <Pressable onPress={handlePlayAll} style={styles.playAllBtn}>
                <Ionicons name="play" size={18} color="#08090B" />
                <Text style={styles.playAllText}>Play All</Text>
              </Pressable>
              <Pressable onPress={handleShuffle} style={styles.shuffleBtn}>
                <Ionicons name="shuffle" size={18} color={COLORS.text} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </Pressable>
            </View>

            <View style={styles.trackList}>
              {favouriteTracks.length === 0 ? (
                <Text style={styles.emptyText}>
                  No favourite tracks yet. Tap the heart on any song to add it here.
                </Text>
              ) : (
                favouriteTracks.map((track, index) => (
                  <Pressable
                    key={track.id}
                    style={styles.trackRow}
                    onPress={() => {
                      void music.playTrack(track, favouriteTracks);
                      router.push("/now-playing");
                    }}
                  >
                    <LinearGradient
                      colors={GRADIENTS[index % GRADIENTS.length] as [string, string]}
                      style={styles.trackArt}
                    >
                      {renderTargetIcon(18)}
                    </LinearGradient>
                    
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle} numberOfLines={1}>{cleanFilename(track.filename)}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                    </View>

                    <Pressable hitSlop={10} onPress={() => music.toggleFavorite(track.id)}>
                      <Ionicons name="heart" size={22} color={COLORS.orange} />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}

        {activeTab === "Artists" && (
          <View style={styles.trackList}>
            {favouriteArtists.length === 0 ? (
              <Text style={styles.emptyText}>No favourite artists yet.</Text>
            ) : (
              favouriteArtists.map((artist, index) => (
                <Pressable
                  key={artist}
                  style={styles.trackRow}
                  onPress={() => router.push(`/artist/${encodeURIComponent(artist)}`)}
                >
                  <LinearGradient
                    colors={GRADIENTS[index % GRADIENTS.length] as [string, string]}
                    style={styles.artistAvatar}
                  >
                    {renderTargetIcon(20)}
                  </LinearGradient>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{artist}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {favouriteTracks.filter((t) => t.artist === artist).length} songs
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === "Albums" && (
          <View style={styles.trackList}>
            {favouriteAlbums.length === 0 ? (
              <Text style={styles.emptyText}>No favourite albums yet.</Text>
            ) : (
              favouriteAlbums.map((album, index) => (
                <Pressable
                  key={album}
                  style={styles.trackRow}
                  onPress={() => router.push(`/album/${encodeURIComponent(album)}`)}
                >
                  <LinearGradient
                    colors={GRADIENTS[index % GRADIENTS.length] as [string, string]}
                    style={styles.trackArt}
                  >
                    {renderTargetIcon(18)}
                  </LinearGradient>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{album}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {favouriteTracks.find((t) => t.album === album)?.artist}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* MINI PLAYER */}
      {currentTrack && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.mCircleIconSmall}><View style={styles.mCircleInnerSmall} /></View>
            </View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>{cleanFilename(currentTrack.filename)}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.miniControls}>
              <Pressable onPress={() => router.push("/sonic")} style={{ marginRight: 15 }}>
                <Ionicons name="pulse" size={20} color="#00D2FF" />
              </Pressable>
              <Pressable onPress={() => void music.togglePlayback()}>
                <Ionicons name={music.isPlaying ? "pause" : "play"} size={22} color={COLORS.orange} />
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },

  tabContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 16 },
  tabScrollContent: { paddingHorizontal: 20, gap: 24 },
  tabButton: { paddingVertical: 14, position: "relative" },
  tabText: { color: COLORS.muted, fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: COLORS.orange, fontWeight: "700" },
  tabIndicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: COLORS.orange, borderRadius: 2 },

  content: { paddingHorizontal: 20 },

  actionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  playAllBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 10, gap: 8 },
  playAllText: { color: "#08090B", fontSize: 14, fontWeight: "700" },
  shuffleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, borderRadius: 10, gap: 8 },
  shuffleText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

  trackList: { gap: 0 },
  trackRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  trackArt: { width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 14 },
  artistAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 14 },
  trackInfo: { flex: 1, justifyContent: "center" },
  trackTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: 4 },
  trackArtist: { color: COLORS.muted, fontSize: 12 },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 40 },

  circleIcon: { borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleInner: { backgroundColor: COLORS.orange },

  miniPlayer: { backgroundColor: "#1A1A1A", borderTopWidth: 1, borderTopColor: "#292C32" },
  miniPlayerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10 },
  miniArtwork: { width: 40, height: 40, backgroundColor: "#2B1B12", borderRadius: 4, alignItems: "center", justifyContent: "center", marginRight: 12 },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: "row", alignItems: "center" },
  progressBarBackground: { height: 2, backgroundColor: "#333", width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },

  mCircleIconSmall: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  mCircleInnerSmall: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.orange },
});