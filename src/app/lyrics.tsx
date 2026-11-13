import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic, useMusicProgress } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

// Mock lyrics for the UI
const MOCK_LYRICS = [
  "Streetlights fade along the shore",
  "I hear the engines low",
  "Every wave repeats your name",
  "And I let the current go",
  "Hold the signal, hold me close",
  "Till the morning finds us here",
  "Low tide, low tide",
  "Carry what we cannot say",
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function LyricsScreen() {
  const router = useRouter();
  const music = useMusic();
  const progress = useMusicProgress();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const track = music.currentTrack;
  const isPlaying = music.isPlaying;
  
  const duration = progress.duration || track?.duration || 0;
  const current = progress.currentTime;
  const progressPercent = duration > 0 ? (current / duration) * 100 : 0;

  // Determine the active lyric line based on playback progress
  const activeIndex = Math.floor((current / duration) * MOCK_LYRICS.length) || 0;

  // Auto-scroll to the active lyric (optional, but nice UX)
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: activeIndex * 45, // Approximate line height
        animated: true,
      });
    }
  }, [activeIndex]);

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
          <Ionicons name="chevron-down" size={26} color={COLORS.text} />
        </Pressable>
        
        {/* Track Info Pill */}
        <View style={styles.trackPill}>
          <LinearGradient colors={["#3D2A22", "#1A1512"]} style={styles.trackArt}>
            {renderTargetIcon(18)}
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {track ? cleanFilename(track.filename) : "Unknown Track"}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {track?.artist || "Unknown Artist"}
            </Text>
          </View>
        </View>

        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      {/* LYRICS AREA */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.lyricsContent, { paddingBottom: 40 }]}
      >
        {MOCK_LYRICS.map((line, index) => {
          const isActive = index === activeIndex;
          return (
            <Text
              key={index}
              style={[
                styles.lyricLine,
                isActive && styles.lyricLineActive,
              ]}
            >
              {line}
            </Text>
          );
        })}
      </ScrollView>

      {/* BOTTOM CONTROLS */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
        {/* Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Icons */}
        <View style={styles.controlsRow}>
          <Pressable hitSlop={10} onPress={() => void music.toggleShuffle()}>
            <Ionicons
              name="shuffle"
              size={22}
              color={music.shuffle ? COLORS.orange : COLORS.muted}
            />
          </Pressable>
          
          <Pressable hitSlop={10} onPress={() => void music.playPrevious()}>
            <Ionicons name="play-skip-back" size={24} color={COLORS.text} />
          </Pressable>
          
          <Pressable
            onPress={() => void music.togglePlayback()}
            style={styles.playBtn}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={28}
              color="#08090B"
            />
          </Pressable>
          
          <Pressable hitSlop={10} onPress={() => void music.playNext()}>
            <Ionicons name="play-skip-forward" size={24} color={COLORS.text} />
          </Pressable>
          
          <Pressable hitSlop={10} onPress={() => void music.cycleRepeat()}>
            <Ionicons
              name={music.repeatMode === "ONE" ? "repeat" : "repeat-outline"}
              size={22}
              color={music.repeatMode !== "OFF" ? COLORS.orange : COLORS.muted}
            />
          </Pressable>
        </View>
      </View>
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
  trackPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 10,
    gap: 10,
  },
  trackArt: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  trackTitle: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  trackArtist: { color: COLORS.muted, fontSize: 10, marginTop: 2 },

  lyricsContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  lyricLine: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 36, // Defines the gap between lines
    marginBottom: 12,
  },
  lyricLineActive: {
    color: COLORS.orange,
    fontWeight: "800",
  },

  bottomControls: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: "#333",
    borderRadius: 2,
    marginBottom: 24,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.orange,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },

  circleIcon: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: {
    backgroundColor: COLORS.orange,
  },
});