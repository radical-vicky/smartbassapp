import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";
import { DeezerTrack, searchDeezerTracks } from "../lib/deezer";

const COLORS = {
  background: "#08090B",
  surfaceLight: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  cyan: "#00D2FF",
  border: "#222222",
};

const GENRES = [
  { label: "Pop", color: "#2F3E46" },
  { label: "Rock", color: "#5C3A21" },
  { label: "Electronic", color: "#2B3A2F" },
  { label: "Hip-hop", color: "#3D3A22" },
];

const MOODS = ["Chill", "Focus", "Workout", "Party"];

const COLLECTIONS = [
  {
    title: "Deep Focus",
    subtitle: "Collection",
    color: ["#2B3A2F", "#142118"],
    searchTerm: "ambient focus",
  },
  {
    title: "Road Trip",
    subtitle: "Collection",
    color: ["#3D3A22", "#242113"],
    searchTerm: "road trip hits",
  },
  {
    title: "Sunday Calm",
    subtitle: "Collection",
    color: ["#2F223D", "#1A1324"],
    searchTerm: "acoustic chill",
  },
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function ExploreScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMood, setActiveMood] = useState("Chill");

  const runSearch = async (term: string) => {
    if (!term.trim()) return;
    setQuery(term);
    setLoading(true);
    const tracks = await searchDeezerTracks(term);
    setResults(tracks);
    setLoading(false);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    void searchDeezerTracks(query).then((tracks) => {
      setResults(tracks);
      setLoading(false);
    });
  };

  const handlePlay = (track: DeezerTrack) => {
    if (!track.previewUrl) {
      Alert.alert(
        "Preview Unavailable",
        "Deezer does not provide a preview for this track."
      );
      return;
    }
    void music.playPreview(track.previewUrl);
  };

  const renderTargetIcon = (size = 40) => (
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

  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore Music</Text>
        <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
          <Pressable hitSlop={10}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search Deezer for songs, artists..."
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={COLORS.orange} />}
        {query.length > 0 && !loading && (
          <Pressable
            onPress={() => {
              setQuery("");
              setResults([]);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isSearching && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
            {results.length === 0 && !loading ? (
              <Text style={styles.emptyText}>
                No results found for "{query}".
              </Text>
            ) : (
              results.map((track) => (
                <Pressable
                  key={track.id}
                  style={styles.trackRow}
                  onPress={() => handlePlay(track)}
                >
                  <View style={styles.albumArt}>
                    <Ionicons
                      name="musical-notes"
                      size={24}
                      color={COLORS.muted}
                    />
                  </View>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.name}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                  {track.previewUrl ? (
                    <Ionicons
                      name="play-circle"
                      size={28}
                      color={COLORS.orange}
                    />
                  ) : (
                    <Ionicons
                      name="lock-closed"
                      size={20}
                      color={COLORS.muted}
                    />
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {!isSearching && (
          <>
            <Pressable style={styles.featuredCard} onPress={() => runSearch("late night drive")}>
              <LinearGradient
                colors={["#5C4A1E", "#2B1B12"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredTop}>
                  <Ionicons name="pulse" size={32} color={COLORS.orange} />
                </View>
                <View style={styles.featuredBottom}>
                  <Text style={styles.featuredTag}>FEATURED</Text>
                  <Text style={styles.featuredTitle}>Late Night Drive</Text>
                  <Text style={styles.featuredSub}>
                    Curated by RADEV SONIC
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text style={styles.sectionTitle}>GENRES</Text>
            <View style={styles.genreGrid}>
              {GENRES.map((g) => (
                <Pressable
                  key={g.label}
                  style={[styles.genreCard, { backgroundColor: g.color }]}
                  onPress={() => runSearch(g.label)}
                >
                  <Text style={styles.genreText}>{g.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>MOODS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
            >
              {MOODS.map((mood) => {
                const isActive = activeMood === mood;
                return (
                  <Pressable
                    key={mood}
                    style={[styles.moodChip, isActive && styles.moodChipActive]}
                    onPress={() => {
                      setActiveMood(mood);
                      runSearch(`${mood} ${mood === "Chill" ? "chill" : "music"}`);
                    }}
                  >
                    <Text
                      style={[
                        styles.moodText,
                        isActive && styles.moodTextActive,
                      ]}
                    >
                      {mood}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTitle}>CURATED COLLECTIONS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionRow}
            >
              {COLLECTIONS.map((c) => (
                <Pressable
                  key={c.title}
                  style={styles.collectionCard}
                  onPress={() => runSearch(c.searchTerm)}
                >
                  <LinearGradient
                    colors={c.color as [string, string]}
                    style={styles.collectionArt}
                  >
                    {renderTargetIcon(40)}
                  </LinearGradient>
                  <Text style={styles.collectionTitle}>{c.title}</Text>
                  <Text style={styles.collectionSub}>{c.subtitle}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      {currentTrack && (
        <Pressable
          style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}
          onPress={() => router.push("/now-playing")}
        >
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.circleIconSmall}>
                <View style={styles.circleInnerSmall} />
              </View>
            </View>
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
  content: { paddingHorizontal: 20 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: { flex: 1 },
  trackTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  trackArtist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },

  featuredCard: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  featuredGradient: { flex: 1, padding: 20, justifyContent: "space-between" },
  featuredTop: { alignItems: "flex-end" },
  featuredBottom: {},
  featuredTag: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  featuredTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  featuredSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },

  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  genreCard: {
    width: "48%",
    paddingVertical: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  genreText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

  moodRow: { gap: 8, marginBottom: 24 },
  moodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  moodText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  moodTextActive: { color: "#08090B", fontWeight: "700" },

  collectionRow: { gap: 12, paddingRight: 20 },
  collectionCard: { width: 110 },
  collectionArt: {
    width: 110,
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  collectionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  collectionSub: { color: COLORS.muted, fontSize: 11 },

  circleIcon: {
    borderWidth: 2,
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

  circleIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInnerSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.orange,
  },
});