import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  liveBlue: "#00D2FF",
  border: "#222222",
};

type Station = {
  id: string;
  name: string;
  genre: string;
  color: string;
  isLive: boolean;
  streamUrl: string;
};

const RECENT_STATIONS: Station[] = [
  {
    id: "1",
    name: "Radio Paradise Electronic",
    genre: "Electronic",
    color: "#2B3A2F",
    isLive: true,
    streamUrl: "https://stream.radioparadise.com/electronic-mp3",
  },
  {
    id: "2",
    name: "Radio Paradise Mellow",
    genre: "Chill",
    color: "#2F3E46",
    isLive: true,
    streamUrl: "https://stream.radioparadise.com/mellow-mp3",
  },
];

const POPULAR_STATIONS: Station[] = [
  {
    id: "3",
    name: "Radio Paradise Rock",
    genre: "Rock",
    color: "#5C3A21",
    isLive: true,
    streamUrl: "https://stream.radioparadise.com/rock-mp3",
  },
  {
    id: "4",
    name: "Radio Paradise Mellow Mix",
    genre: "Jazz",
    color: "#3D3A22",
    isLive: true,
    streamUrl: "https://stream.radioparadise.com/mellow-mp3",
  },
  {
    id: "5",
    name: "Radio Paradise Main Mix",
    genre: "Pop",
    color: "#2F223D",
    isLive: true,
    streamUrl: "https://stream.radioparadise.com/mp3-128",
  },
];

const FILTERS = ["All", "Pop", "Rock", "Jazz", "Electronic"];

export default function RadioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = useAudioPlayer(null);

  const [activeFilter, setActiveFilter] = useState("All");
  const [playingStation, setPlayingStation] = useState<Station | null>(null);
  const [buffering, setBuffering] = useState(false);

  // Clean up stream when leaving screen
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const handlePlay = async (station: Station) => {
    try {
      if (playingStation?.id === station.id) {
        player.pause();
        setPlayingStation(null);
        setBuffering(false);
        return;
      }

      setBuffering(true);
      player.replace({ uri: station.streamUrl });
      player.play();
      setPlayingStation(station);
      setTimeout(() => setBuffering(false), 1200);
    } catch (error) {
      console.error("Radio playback failed:", error);
      setBuffering(false);
      Alert.alert("Playback Error", "Could not connect to the radio stream.");
    }
  };

  const renderTargetIcon = (size = 20) => (
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

  const filteredRecent =
    activeFilter === "All"
      ? RECENT_STATIONS
      : RECENT_STATIONS.filter((s) =>
          s.genre.toLowerCase().includes(activeFilter.toLowerCase())
        );

  const filteredPopular =
    activeFilter === "All"
      ? POPULAR_STATIONS
      : POPULAR_STATIONS.filter((s) =>
          s.genre.toLowerCase().includes(activeFilter.toLowerCase())
        );

  const renderStationRow = (station: Station) => {
    const isPlaying = playingStation?.id === station.id;
    const isLoading = isPlaying && buffering;

    return (
      <Pressable
        key={station.id}
        style={styles.stationRow}
        onPress={() => handlePlay(station)}
      >
        <LinearGradient
          colors={[station.color, "#121212"]}
          style={styles.stationArt}
        >
          {renderTargetIcon(18)}
        </LinearGradient>

        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationGenre}>{station.genre}</Text>
        </View>

        {station.isLive && <Text style={styles.liveBadge}>LIVE</Text>}

        <Pressable
          onPress={() => handlePlay(station)}
          hitSlop={10}
          style={styles.playButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.orange} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={18}
              color={COLORS.orange}
            />
          )}
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Radio</Text>
        <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
          <Pressable hitSlop={10}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
          <Pressable hitSlop={10}>
            <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredRecent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>RECENTLY PLAYED</Text>
            <View style={styles.stationList}>
              {filteredRecent.map(renderStationRow)}
            </View>
          </>
        )}

        {filteredPopular.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>POPULAR STATIONS</Text>
            <View style={styles.stationList}>
              {filteredPopular.map(renderStationRow)}
            </View>
          </>
        )}

        {filteredRecent.length === 0 && filteredPopular.length === 0 && (
          <Text style={styles.emptyText}>
            No stations match "{activeFilter}". Try another filter.
          </Text>
        )}
      </ScrollView>

      {playingStation && (
        <View
          style={[styles.miniPlayer, { paddingBottom: insets.bottom }]}
        >
          <View style={styles.miniPlayerContent}>
            <LinearGradient
              colors={[playingStation.color, "#121212"]}
              style={styles.miniArtwork}
            >
              {renderTargetIcon(16)}
            </LinearGradient>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {playingStation.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
                <Text style={styles.miniArtist} numberOfLines={1}>
                  · {playingStation.genre}
                </Text>
              </View>
            </View>
            <View style={styles.miniControls}>
              <Pressable
                onPress={() => handlePlay(playingStation)}
                hitSlop={10}
              >
                {buffering ? (
                  <ActivityIndicator size="small" color={COLORS.orange} />
                ) : (
                  <Ionicons name="pause" size={24} color={COLORS.orange} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
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

  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },
  filterText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  filterTextActive: { color: "#08090B", fontWeight: "700" },

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
    marginTop: 40,
  },

  stationList: { gap: 16, marginBottom: 24 },
  stationRow: { flexDirection: "row", alignItems: "center" },
  stationArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stationInfo: { flex: 1 },
  stationName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  stationGenre: { color: COLORS.muted, fontSize: 12 },

  liveBadge: {
    color: COLORS.liveBlue,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginRight: 15,
  },
  playButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

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
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  liveText: { color: COLORS.liveBlue, fontSize: 10, fontWeight: "700" },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveBlue,
  },
  miniArtist: { color: COLORS.muted, fontSize: 11 },
  miniControls: { flexDirection: "row", alignItems: "center" },
});