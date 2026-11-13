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

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function SpatialScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  const currentTrack = music.currentTrack;
  const isSpatialOn = music.spatial > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Spatial Audio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Spatial Audio</Text>
              <Text style={styles.cardSub}>Virtual surround for headphones</Text>
            </View>
            <Pressable
              onPress={() => void music.setSpatial(isSpatialOn ? 0 : 65)}
              style={[styles.toggle, isSpatialOn && styles.toggleOn]}
            >
              <View style={[styles.toggleKnob, isSpatialOn && styles.toggleKnobOn]} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.vizCard, !isSpatialOn && { opacity: 0.3 }]}>
          <View style={styles.arcContainer}>
            <View style={[styles.arc, styles.arcOuter]} />
            <View style={[styles.arc, styles.arcMiddle, { opacity: isSpatialOn ? 1 : 0 }]} />
            <View style={[styles.arc, styles.arcInner, { opacity: isSpatialOn ? 1 : 0 }]} />
            <View style={[styles.centerDot, { opacity: isSpatialOn ? 1 : 0.3 }]} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Surround Width</Text>
            <Text style={styles.cardValue}>{music.spatial}%</Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={music.spatial}
            onValueChange={(v) => void music.setSpatial(v)}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor="#333333"
            thumbTintColor={COLORS.orange}
            disabled={!isSpatialOn}
          />
        </View>

        <View style={{ height: 20 }} />
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
                {music.isPlaying ? "Now playing" : "Paused"}
              </Text>
            </View>
            <View style={styles.miniControls}>
              <Pressable onPress={() => router.push("/sonic")} style={{ marginRight: 15 }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  card: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  cardSub: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  cardValue: { color: COLORS.orange, fontSize: 13, fontWeight: "700" },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#2A2A2A", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: COLORS.orange },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  vizCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, height: 180, marginBottom: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  arcContainer: { width: 220, height: 110, position: "relative", alignItems: "center", justifyContent: "flex-end" },
  arc: { position: "absolute", bottom: 0, borderWidth: 2, borderColor: "transparent", borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomWidth: 0 },
  arcOuter: { width: 220, height: 110, borderColor: "#5C3A21" },
  arcMiddle: { width: 160, height: 80, borderColor: COLORS.cyan },
  arcInner: { width: 100, height: 50, borderColor: COLORS.cyan },
  centerDot: { position: "absolute", bottom: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
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