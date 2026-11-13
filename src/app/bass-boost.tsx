import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surfaceLight: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  cyan: "#00D2FF",
  border: "#222222",
};

const PRESETS = [
  { key: "Light", value: 30 },
  { key: "Punchy", value: 60 },
  { key: "Deep", value: 80 },
  { key: "Max", value: 100 },
];

const VIZ_PATTERN = [6, 4, 8, 10, 12, 8, 5, 3, 7, 9, 6, 4, 10, 11, 7, 5, 8, 9, 6, 4];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function BassBoostScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const handleToggle = () => {
    void music.setBassBoost(music.bassBoost > 0 ? 0 : 60);
  };

  const renderVizBars = () => {
    const boostFactor = music.bassBoost / 100;

    return VIZ_PATTERN.map((baseHeight, i) => {
      const isLowFreq = i < 10;
      const isCyan = i % 3 === 0 || i % 4 === 0;
      
      const height = isLowFreq 
        ? (baseHeight * 2) + (boostFactor * 40) 
        : baseHeight * 2;

      return (
        <View
          key={i}
          style={[
            styles.vizBar,
            {
              height: Math.min(80, Math.max(10, height)),
              backgroundColor: isCyan ? COLORS.cyan : COLORS.orange,
            },
          ]}
        />
      );
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Bass Enhancement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Bass Boost</Text>
              <Text style={styles.cardSub}>Adds low-frequency weight</Text>
            </View>
            <Pressable onPress={handleToggle} style={[styles.toggle, music.bassBoost > 0 && styles.toggleOn]}>
              <View style={[styles.toggleKnob, music.bassBoost > 0 && styles.toggleKnobOn]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.smallMuted}>Low-frequency response (20–250 Hz)</Text>
          <View style={styles.visualizerWrap}>
            {renderVizBars()}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Bass intensity</Text>
            <Text style={styles.cardValue}>{music.bassBoost}%</Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40, marginTop: 4 }}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={music.bassBoost}
            onValueChange={(v) => void music.setBassBoost(v)}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor="#333333"
            thumbTintColor={COLORS.orange}
          />
        </View>

        <View style={styles.presetsRow}>
          {PRESETS.map((p) => {
            const isActive = music.bassBoost === p.value;
            return (
              <Pressable
                key={p.key}
                style={[styles.presetChip, isActive && styles.presetChipActive]}
                onPress={() => void music.setBassBoost(p.value)}
              >
                <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                  {p.key}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.orange} />
          <Text style={styles.noteText}>
            Keep intensity under 80% to avoid distortion and protect speakers and hearing at higher volumes.
          </Text>
        </View>

      </ScrollView>

      {currentTrack && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.circleIconSmall}><View style={styles.circleInnerSmall} /></View>
            </View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>
                {cleanFilename(currentTrack.filename)}
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                {music.isPlaying ? "Now playing" : "Paused"}
              </Text>
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
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  cardValue: { color: COLORS.orange, fontSize: 13, fontWeight: "700" },
  smallMuted: { color: COLORS.muted, fontSize: 12, fontWeight: "500", marginBottom: 16 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#2A2A2A", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: COLORS.orange },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  visualizerWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80, marginTop: -4 },
  vizBar: { width: 6, borderRadius: 3 },
  presetsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 16 },
  presetChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 20, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border },
  presetChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  presetText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  presetTextActive: { color: "#08090B", fontWeight: "700" },
  note: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 16, backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  noteText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, flex: 1 },
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