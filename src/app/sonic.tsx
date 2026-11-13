import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surfaceLight: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function SonicEngineScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  const currentTrack = music.currentTrack;
  const isEnabled = music.sonicEnabled;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.circleIcon}>
              <Ionicons name="pulse" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.headerTitle}>Sonic Engine</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Pressable 
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void music.setSonicEnabled(!isEnabled);
              }} 
              style={[styles.toggle, isEnabled && styles.toggleOn]}
            >
              <View style={[styles.toggleKnob, isEnabled && styles.toggleKnobOn]} />
            </Pressable>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginLeft: 16 }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.mainCard, !isEnabled && { opacity: 0.5 }]}>
          <View style={styles.gridRow}>
            <Pressable style={styles.gridBtn} onPress={() => router.push("/spatial")}>
              <Ionicons name="cube-outline" size={18} color={COLORS.orange} />
              <Text style={styles.gridBtnText}>3D Surround</Text>
            </Pressable>
            <Pressable style={styles.gridBtn} onPress={() => router.push("/equalizer")}>
              <Ionicons name="options-outline" size={18} color={COLORS.orange} />
              <Text style={styles.gridBtnText}>Advanced EQ</Text>
            </Pressable>
          </View>
          <View style={styles.gridRow}>
            <Pressable style={styles.gridBtn} onPress={() => router.push("/3d-speakers")}>
              <Ionicons name="volume-medium-outline" size={18} color={COLORS.orange} />
              <Text style={styles.gridBtnText}>3D Speakers</Text>
            </Pressable>
            <Pressable style={styles.gridBtn} onPress={() => router.push("/bass-boost")}>
              <Ionicons name="volume-high-outline" size={18} color={COLORS.orange} />
              <Text style={styles.gridBtnText}>Bass Detail</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.listContainer, !isEnabled && { opacity: 0.5 }]}>
          <View style={styles.listRow}>
            <View style={styles.listLeft}>
              <View style={styles.smallCircle}><Ionicons name="volume-high" size={16} color={COLORS.orange} /></View>
              <Text style={styles.listLabel}>Bass Boost</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={music.bassBoost}
                onValueChange={(v) => void music.setBassBoost(v)}
                minimumTrackTintColor={COLORS.orange}
                maximumTrackTintColor="#333333"
                thumbTintColor={COLORS.orange}
                disabled={!isEnabled}
              />
              <Text style={styles.sliderValue}>{music.bassBoost}%</Text>
              <Pressable onPress={() => router.push("/bass-boost")} hitSlop={10}>
                <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.listRow} onPress={() => router.push("/clarity")} disabled={!isEnabled}>
            <View style={styles.listLeft}>
              <View style={styles.smallCircle}><Ionicons name="mic" size={16} color={COLORS.orange} /></View>
              <Text style={styles.listLabel}>Clarity</Text>
            </View>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {music.clarity > 0 ? `${music.clarity}%` : "Off"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </View>
          </Pressable>

          <Pressable style={styles.listRow} onPress={() => router.push("/spatial")} disabled={!isEnabled}>
            <View style={styles.listLeft}>
              <View style={styles.smallCircle}><Ionicons name="color-filter" size={16} color={COLORS.orange} /></View>
              <Text style={styles.listLabel}>Spatial</Text>
            </View>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {music.spatial > 0 ? `${music.spatial}%` : "Off"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </View>
          </Pressable>

          <Pressable style={styles.listRow} onPress={() => router.push("/equalizer")} disabled={!isEnabled}>
            <View style={styles.listLeft}>
              <View style={styles.smallCircle}><Ionicons name="options" size={16} color={COLORS.orange} /></View>
              <Text style={styles.listLabel}>Preset</Text>
            </View>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>{music.soundProfile || "AUTO"}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </View>
          </Pressable>

          <View style={styles.listRow}>
            <View style={styles.listLeft}>
              <View style={styles.smallCircle}><Ionicons name="speedometer" size={16} color={COLORS.orange} /></View>
              <Text style={styles.listLabel}>Volume</Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={-12}
                maximumValue={12}
                step={1}
                value={music.preamp ?? 0}
                onValueChange={(v) => void music.setPreamp(v)}
                minimumTrackTintColor={COLORS.orange}
                maximumTrackTintColor="#333333"
                thumbTintColor={COLORS.orange}
                disabled={!isEnabled}
              />
              <Text style={styles.sliderValue}>
                {(music.preamp ?? 0) > 0 ? `+${music.preamp}` : (music.preamp ?? 0)}dB
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.audioDeviceRow} onPress={() => router.push("/audio-device")}>
          <Ionicons name="headset" size={16} color={COLORS.muted} />
          <Text style={styles.audioDeviceText}>Audio Device</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.muted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Text style={styles.footerText}>Applies to RADEV SONIC playback only.</Text>
      </ScrollView>

      {currentTrack && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.mCircleIconSmall}><View style={styles.mCircleInnerSmall} /></View>
            </View>
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTitle} numberOfLines={1}>{cleanFilename(currentTrack.filename)}</Text>
              <Text style={styles.miniArtist} numberOfLines={1}>{music.isPlaying ? "Now playing" : "Paused"}</Text>
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
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2B1B12", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: "#2A2A2A", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: COLORS.orange },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  mainCard: { backgroundColor: COLORS.surfaceLight, borderRadius: 16, marginHorizontal: 20, padding: 16, marginBottom: 20 },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gridBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2A2A2E", paddingVertical: 12, borderRadius: 10, gap: 8 },
  gridBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  listContainer: { paddingHorizontal: 20, gap: 16 },
  listRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listLeft: { flexDirection: "row", alignItems: "center", gap: 12, width: 120 },
  smallCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2B1B12", alignItems: "center", justifyContent: "center" },
  listLabel: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  dropdown: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1E", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  dropdownText: { color: COLORS.muted, fontSize: 13, fontWeight: "500" },
  sliderContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  slider: { flex: 1, height: 40 },
  sliderValue: { color: COLORS.muted, fontSize: 12, fontWeight: "600", width: 40, textAlign: "right" },
  audioDeviceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 24, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  audioDeviceText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  footerText: { color: COLORS.muted, fontSize: 11, marginHorizontal: 20, marginTop: 12 },
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