import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  cyan: "#00D2FF",
};

type Speaker = {
  id: string;
  top: number;
  left: number;
  isOn: boolean;
};

const INITIAL_SPEAKERS: Speaker[] = [
  { id: "TL", top: 15, left: 25, isOn: true },
  { id: "TR", top: 15, left: 75, isOn: true },
  { id: "ML", top: 50, left: 10, isOn: true },
  { id: "MR", top: 50, left: 90, isOn: true },
  { id: "BL", top: 85, left: 25, isOn: true },
  { id: "BR", top: 85, left: 75, isOn: true },
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function Speakers3DScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [speakers, setSpeakers] = useState<Speaker[]>(INITIAL_SPEAKERS);

  const applySpeakerMix = (currentSpeakers: Speaker[]) => {
    const activeCount = currentSpeakers.filter((s) => s.isOn).length;
    const spatialWidth = Math.round((activeCount / 6) * 100);
    
    if (activeCount === 0) {
      music.setSpatial(0);
      music.setPreamp(-12);
      music.setSonicEnabled(false);
    } else {
      music.setSonicEnabled(true);
      music.setSpatial(spatialWidth);
      
      let volumeDb = -12;
      if (activeCount === 1) volumeDb = -10;
      else if (activeCount === 2) volumeDb = -6;
      else if (activeCount === 3) volumeDb = -3;
      else if (activeCount === 4) volumeDb = 0;
      else if (activeCount === 5) volumeDb = 2;
      else if (activeCount === 6) volumeDb = 4;
      
      music.setPreamp(volumeDb);
    }
  };

  const toggleSpeaker = (id: string) => {
    void Haptics.selectionAsync();
    const next = speakers.map((s) =>
      s.id === id ? { ...s, isOn: !s.isOn } : s
    );
    setSpeakers(next);
    applySpeakerMix(next);
  };

  const toggleAll = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allOn = speakers.every((s) => s.isOn);
    const next = speakers.map((s) => ({ ...s, isOn: !allOn }));
    setSpeakers(next);
    applySpeakerMix(next);
  };

  const resetSpeakers = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpeakers(INITIAL_SPEAKERS);
    applySpeakerMix(INITIAL_SPEAKERS);
  };

  const isAnyActive = speakers.some((s) => s.isOn);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>3D Speakers Controls</Text>
        <Text style={styles.headerSub}>Tap on the speaker to turn it off/on</Text>
      </View>

      <View style={styles.speakerGrid}>
        <Pressable style={styles.centerHero} onPress={toggleAll}>
          <View style={[styles.heroGlow, !isAnyActive && { opacity: 0 }]} />
          <Image
            source={require("../../assets/images/3d-speaker.jpg")}
            style={[styles.heroImage, !isAnyActive && { opacity: 0.2, tintColor: "#555" }]}
            resizeMode="contain"
          />
        </Pressable>

        {speakers.map((spk) => (
          <Pressable
            key={spk.id}
            onPress={() => toggleSpeaker(spk.id)}
            style={[styles.speaker, { top: `${spk.top}%`, left: `${spk.left}%` }]}
          >
            <Image
              source={require("../../assets/images/3d-speaker.jpg")}
              style={[
                styles.speakerImage,
                !spk.isOn && { opacity: 0.15, tintColor: "#444" }
              ]}
              resizeMode="contain"
            />
          </Pressable>
        ))}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable onPress={resetSpeakers} hitSlop={10} style={styles.actionBtn}>
          <Text style={styles.resetText}>RESET</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.actionBtn}>
          <Text style={styles.doneText}>DONE</Text>
        </Pressable>
      </View>

      {currentTrack && (
        <Pressable style={styles.miniPlayer} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.circleIconSmall}><View style={styles.circleInnerSmall} /></View>
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
  safe: { flex: 1, backgroundColor: "#0A0F1A" },
  header: { alignItems: "center", paddingTop: 20, paddingBottom: 10, paddingHorizontal: 20 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  headerSub: { color: COLORS.muted, fontSize: 13, marginTop: 8 },
  speakerGrid: { flex: 1, position: "relative", alignItems: "center", justifyContent: "center", marginVertical: 20 },
  centerHero: { position: "absolute", width: 220, height: 220, alignItems: "center", justifyContent: "center", zIndex: 5 },
  heroGlow: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(0, 210, 255, 0.1)", transform: [{ scale: 1.1 }] },
  heroImage: { width: "100%", height: "100%" },
  speaker: { position: "absolute", width: 60, height: 60, marginTop: -30, marginLeft: -30, alignItems: "center", justifyContent: "center", zIndex: 10 },
  speakerImage: { width: 60, height: 60, borderRadius: 30 },
  bottomBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  actionBtn: { paddingVertical: 10 },
  resetText: { color: COLORS.muted, fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  doneText: { color: COLORS.cyan, fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  miniPlayer: { backgroundColor: "#1A1A1A", borderTopWidth: 1, borderTopColor: "#292C32" },
  miniPlayerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10 },
  miniArtwork: { width: 40, height: 40, backgroundColor: "#2B1B12", borderRadius: 4, alignItems: "center", justifyContent: "center", marginRight: 12 },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: "row", alignItems: "center" },
  progressBarBackground: { height: 2, backgroundColor: "#333", width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },
  circleIconSmall: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleInnerSmall: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.orange },
});