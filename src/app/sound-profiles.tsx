import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { SonicIcon } from "../components/SonicIcon";
import { SoundProfile, useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surfaceLight: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

type ProfileKey = SoundProfile | "ROCK" | "POP" | "CLASSICAL" | "ELECTRONIC" | "PODCAST";

const PROFILES: {
  key: ProfileKey;
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  desc: string;
}[] = [
  { key: "BALANCED", icon: "options-outline", iconColor: "#00D2FF", iconBg: "#1A2A33", label: "Balanced", desc: "Neutral, true-to-source sound" },
  { key: "DEEP BASS", icon: "volume-high", iconColor: "#FF8500", iconBg: "#331A12", label: "Deep Bass", desc: "Heavy low end for hip-hop and EDM" },
  { key: "VOCAL", icon: "mic", iconColor: "#4ADE80", iconBg: "#1A3321", label: "Vocal Clarity", desc: "Brings voices forward" },
  { key: "ROCK", icon: "musical-notes", iconColor: "#FFD700", iconBg: "#2E2A1A", label: "Rock", desc: "Punchy mids, bright highs" },
  { key: "POP", icon: "heart", iconColor: "#B855FF", iconBg: "#291A33", label: "Pop", desc: "Smooth bass and crisp vocals" },
  { key: "CLASSICAL", icon: "disc-outline", iconColor: "#00D2FF", iconBg: "#1A2A33", label: "Classical", desc: "Wide, natural dynamics" },
  { key: "ELECTRONIC", icon: "pulse", iconColor: "#FF6B6B", iconBg: "#331A1A", label: "Electronic", desc: "Tight bass, sparkling highs" },
  { key: "PODCAST", icon: "mic-outline", iconColor: "#4ADE80", iconBg: "#1A3321", label: "Podcast", desc: "Speech-focused and clear" },
  { key: "CUSTOM", icon: "settings", iconColor: "#858B94", iconBg: "#2A2A2E", label: "Custom", desc: "Your own saved settings" },
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function SoundProfilesScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sound Profiles</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {PROFILES.map((p) => {
          const isActive = music.soundProfile === p.key;
          return (
            <Pressable 
              key={p.label} 
              style={[styles.row, isActive && styles.rowActive]} 
              onPress={() => {
                if (p.key === "CUSTOM") {
                  router.push("/equalizer");
                } else if (["ROCK", "POP", "CLASSICAL", "ELECTRONIC", "PODCAST"].includes(p.key)) {
                  // These are purely UI mockup items for now, so we route to Equalizer
                  router.push("/equalizer");
                } else {
                  void music.selectSoundProfile(p.key as SoundProfile);
                }
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: p.iconBg }]}>
                <Ionicons name={p.icon} size={20} color={p.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, isActive && { color: COLORS.orange, fontWeight: "700" }]}>{p.label}</Text>
                <Text style={[styles.desc, isActive && { color: COLORS.text }]}>{p.desc}</Text>
              </View>
              {isActive && <Ionicons name="checkmark" size={20} color={COLORS.orange} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {currentTrack && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <SonicIcon size={20} color="#00D2FF" />
            </View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>{cleanFilename(currentTrack.filename)}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.miniControls}>
              <Pressable onPress={() => router.push("/sonic")} style={{ marginRight: 15 }}>
                <SonicIcon size={20} color="#00D2FF" />
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
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  rowActive: { backgroundColor: "#1A1A1E" },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  desc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  miniPlayer: { backgroundColor: "#1A1A1A", borderTopWidth: 1, borderTopColor: "#292C32" },
  miniPlayerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10 },
  miniArtwork: { width: 40, height: 40, backgroundColor: "#2B1B12", borderRadius: 4, alignItems: "center", justifyContent: "center", marginRight: 12 },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: "row", alignItems: "center" },
  progressBarBackground: { height: 2, backgroundColor: "#333", width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },
});