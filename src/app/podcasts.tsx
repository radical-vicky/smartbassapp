import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
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

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

// --- MOCK DATA (Replace this with your real API later) ---
type PodcastShow = {
  id: string;
  title: string;
  author: string;
  feedUrl: string;
};

type PodcastEpisode = {
  id: string;
  title: string;
  duration: string;
  pubDate: string;
  audioUrl: string;
};

const MOCK_SHOWS: PodcastShow[] = [
  {
    id: "1",
    title: "The Daily Tech",
    author: "Tech Network",
    feedUrl: "mock-feed-1",
  },
  {
    id: "2",
    title: "Mindful Minutes",
    author: "Zen Studios",
    feedUrl: "mock-feed-2",
  },
  {
    id: "3",
    title: "History Uncovered",
    author: "Past Media",
    feedUrl: "mock-feed-3",
  },
];

const MOCK_EPISODES: Record<string, PodcastEpisode[]> = {
  "mock-feed-1": [
    {
      id: "ep1",
      title: "The Future of AI in Music",
      duration: "45 min",
      pubDate: "Today",
      // Using a sample public audio file so it actually plays
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "ep2",
      title: "New iPhone Leaks",
      duration: "32 min",
      pubDate: "Yesterday",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
  ],
  "mock-feed-2": [
    {
      id: "ep3",
      title: "Morning Meditation",
      duration: "10 min",
      pubDate: "Today",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ],
  "mock-feed-3": [
    {
      id: "ep4",
      title: "The Lost City of Atlantis",
      duration: "55 min",
      pubDate: "3 days ago",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    },
  ],
};

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function PodcastsScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  // Use a local player for podcasts so it doesn't mess up the main music player
  const player = useAudioPlayer(null);

  const [query, setQuery] = useState("");
  const [shows, setShows] = useState<PodcastShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<PodcastShow | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<PodcastEpisode | null>(
    null
  );

  const handleSearch = () => {
    if (!query.trim()) {
      setShows([]);
      return;
    }
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const results = MOCK_SHOWS.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase())
      );
      setShows(results);
      setLoading(false);
    }, 500);
  };

  const handleSelectShow = (show: PodcastShow) => {
    setSelectedShow(show);
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setEpisodes(MOCK_EPISODES[show.feedUrl] || []);
      setLoading(false);
    }, 600);
  };

  const handlePlayEpisode = async (ep: PodcastEpisode) => {
    if (playingEpisode?.id === ep.id) {
      player.pause();
      setPlayingEpisode(null);
    } else {
      try {
        player.replace({ uri: ep.audioUrl });
        player.play();
        setPlayingEpisode(ep);
      } catch (error) {
        Alert.alert("Playback Error", "Could not play this episode.");
      }
    }
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (selectedShow) setSelectedShow(null);
            else router.back();
          }}
          hitSlop={10}
        >
          {/* FIXED: changed menu to chevron-back when no show is selected */}
          <Ionicons
            name={selectedShow ? "chevron-back" : "chevron-back"}
            size={26}
            color={COLORS.text}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedShow ? selectedShow.title : "Podcasts"}
        </Text>
        <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
          <Pressable hitSlop={10} onPress={handleSearch}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search for podcasts..."
          placeholderTextColor={COLORS.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color={COLORS.orange} />}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH RESULTS */}
        {!selectedShow && shows.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>SHOWS</Text>
            {shows.map((show) => (
              <Pressable
                key={show.id}
                style={styles.showRow}
                onPress={() => handleSelectShow(show)}
              >
                <LinearGradient
                  colors={["#3D2A22", "#1A1512"]}
                  style={styles.showArt}
                >
                  {renderTargetIcon(20)}
                </LinearGradient>
                <View style={styles.showInfo}>
                  <Text style={styles.showTitle} numberOfLines={1}>
                    {show.title}
                  </Text>
                  <Text style={styles.showAuthor} numberOfLines={1}>
                    {show.author}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.muted}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* EPISODE LIST */}
        {selectedShow && (
          <View>
            <Text style={styles.sectionTitle}>
              EPISODES ({episodes.length})
            </Text>
            {episodes.length === 0 && !loading && (
              <Text style={styles.emptyText}>
                No episodes found for this show.
              </Text>
            )}
            {episodes.map((ep) => {
              const isPlaying = playingEpisode?.id === ep.id;
              return (
                <Pressable
                  key={ep.id}
                  style={styles.episodeRow}
                  onPress={() => handlePlayEpisode(ep)}
                >
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle} numberOfLines={2}>
                      {ep.title}
                    </Text>
                    <Text style={styles.episodeSub}>
                      {ep.duration} · {ep.pubDate}
                    </Text>
                  </View>
                  <Ionicons
                    name={isPlaying ? "pause-circle" : "play-circle"}
                    size={32}
                    color={COLORS.orange}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* PODCAST MINI PLAYER */}
      {playingEpisode && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.circleIconSmall}>
                <View style={styles.circleInnerSmall} />
              </View>
            </View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {playingEpisode.title}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                Podcast Episode
              </Text>
            </View>
            <View style={styles.miniControls}>
              <Pressable onPress={() => handlePlayEpisode(playingEpisode)}>
                <Ionicons name="pause" size={24} color={COLORS.orange} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}

      {/* MUSIC MINI PLAYER */}
      {music.currentTrack && !playingEpisode && (
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
                {cleanFilename(music.currentTrack.filename)}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {music.currentTrack.artist}
              </Text>
            </View>
            <View style={styles.miniControls}>
              {/* FIXED: Added Sonic Icon shortcut */}
              <Pressable
                onPress={() => router.push("/sonic")}
                style={{ marginRight: 15 }}
                hitSlop={8}
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },

  content: { paddingHorizontal: 20 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },

  showRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  showArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  showInfo: { flex: 1 },
  showTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  showAuthor: { color: COLORS.muted, fontSize: 12 },

  episodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    gap: 12,
  },
  episodeInfo: { flex: 1 },
  episodeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  episodeSub: { color: COLORS.muted, fontSize: 12 },

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