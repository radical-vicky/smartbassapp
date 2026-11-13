import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#121212", // Deep dark grey
  surface: "#1E1E1E", // Elevated surface
  surfaceLight: "#2C2C2C",
  text: "#FFFFFF",
  muted: "#888888",
  orange: "#FF4500", // Sharp deep orange
  border: "#333333",
};

const FREQUENCIES_16 = [
  "25", "40", "63", "100", "160", "250", "400", "630",
  "1k", "1.6k", "2.5k", "4k", "6.3k", "10k", "16k", "20k",
];

const FREQUENCIES_8 = ["63", "125", "250", "500", "1k", "2k", "4k", "8k"];

const GRAPH_HEIGHT = 200; 
const MIN_DB = -15; 
const MAX_DB = 15;
const RANGE_DB = MAX_DB - MIN_DB;
const PUSH_INTERVAL_MS = 80;

const BUILT_IN_PRESETS = [
  "AUTO",
  "ACOUSTIC",
  "BASS BOOST",
  "CLASSICAL",
  "DUBSTEP",
  "ELECTRONIC",
  "FLAT",
  "HIP-HOP",
  "HOUSE",
  "JAZZ",
  "MOVIE",
  "PARTY",
  "POP",
  "REGGAE",
  "ROCK",
  "TREBLE BOOST",
  "VOCAL",
];

const PRESET_VALUES: Record<string, number[]> = {
  AUTO: [4, 4, 3, 2, 1, 0, 0, 0, 1, 2, 3, 3, 4, 4, 3, 2],
  FLAT: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "BASS BOOST": [12, 12, 11, 8, 4, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4],
  ACOUSTIC: [6, 5, 4, 2, 1, 0, 0, 0, 1, 2, 3, 4, 5, 5, 4, 3],
  CLASSICAL: [5, 4, 3, 1, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 3, 2],
  DUBSTEP: [12, 12, 12, 10, 8, 4, 0, -1, 0, 2, 4, 6, 8, 10, 11, 12],
  ELECTRONIC: [9, 9, 8, 6, 3, 0, 0, 1, 3, 5, 6, 7, 8, 8, 7, 6],
  "HIP-HOP": [11, 10, 8, 6, 3, 1, 0, -1, 0, 1, 2, 3, 4, 5, 5, 4],
  HOUSE: [10, 9, 7, 5, 2, 0, 0, 1, 2, 3, 5, 6, 7, 7, 6, 5],
  JAZZ: [6, 5, 4, 2, 0, -1, -1, 0, 1, 2, 3, 4, 5, 5, 4, 3],
  MOVIE: [10, 10, 8, 6, 3, 0, -1, -1, 0, 1, 3, 5, 6, 7, 7, 6],
  PARTY: [12, 11, 9, 7, 4, 1, 0, 0, 1, 3, 5, 7, 8, 9, 9, 8],
  POP: [7, 6, 5, 3, 0, -1, -1, 0, 1, 3, 4, 5, 6, 6, 5, 4],
  REGGAE: [11, 10, 8, 5, 2, 0, 0, 0, 0, 1, 2, 3, 4, 4, 5, 5],
  ROCK: [8, 7, 5, 2, -1, -2, -1, 1, 3, 4, 5, 6, 7, 7, 6, 5],
  "TREBLE BOOST": [-6, -6, -4, -2, 0, 1, 3, 5, 7, 9, 11, 12, 12, 12, 11, 10],
  VOCAL: [3, 2, 0, -1, 1, 2, 3, 3, 2, 1, 2, 3, 4, 4, 3, 2],
};

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function EqualizerScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  const [graphWidth, setGraphWidth] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewPresetModal, setShowNewPresetModal] = useState(false);
  const [is16Band, setIs16Band] = useState(true);

  const [customPresets, setCustomPresets] = useState<string[]>([
    "Late Night",
    "My Bass",
  ]);

  const [newPresetName, setNewPresetName] = useState("My preset");
  const [startFromCurrent, setStartFromCurrent] = useState(true);
  const [newPresetIs16Band, setNewPresetIs16Band] = useState(true);

  const [localLevels, setLocalLevels] = useState<number[]>(music.equalizerLevels);
  const latestLevels = useRef<number[]>(music.equalizerLevels);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestLevels.current = music.equalizerLevels;
    setLocalLevels(music.equalizerLevels);
  }, [music.equalizerLevels]);

  useEffect(() => {
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, []);

  const freqs = is16Band ? FREQUENCIES_16 : FREQUENCIES_8;
  const bandCount = freqs.length;
  const levels = is16Band ? localLevels : localLevels.filter((_, i) => i % 2 === 0);

  // Auto-retry attach when screen mounts or app resumes
  useEffect(() => {
    const retry = () => {
      if (
        music.currentTrack &&
        music.isPlaying &&
        (!music.audioCapabilities || !music.audioCapabilities.attached)
      ) {
        try {
          const mod = require("../../modules/sonic-audio/src").default;
          void mod.attachToPlayer();
        } catch (e) {}
      }
    };

    const initialTimer = setTimeout(retry, 500);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });

    return () => {
      clearTimeout(initialTimer);
      sub.remove();
    };
  }, [music.currentTrack, music.isPlaying, music.audioCapabilities]);

  const flushLevels = () => {
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
    void music.setEqualizerLevels(latestLevels.current);
  };

  const applyLevels = (next: number[]) => {
    latestLevels.current = next;
    setLocalLevels(next);
    flushLevels();
  };

  const updateBand = (index: number, value: number) => {
    const i = is16Band ? index : index * 2;
    if (i < 0 || i > 15) return;
    if (latestLevels.current[i] === value) return;

    const next = [...latestLevels.current];
    next[i] = value;
    latestLevels.current = next;

    setLocalLevels(next);
    void Haptics.selectionAsync();
    music.setEqualizerLevels(next);

    if (!pushTimer.current) {
      pushTimer.current = setTimeout(() => {
        pushTimer.current = null;
        void music.setEqualizerLevels(latestLevels.current);
      }, PUSH_INTERVAL_MS);
    }
  };

  const handleGraphTouch = (e: any) => {
    if (graphWidth === 0 || !music.sonicEnabled) return;
    const x = e.nativeEvent.locationX;
    const index = Math.min(
      bandCount - 1,
      Math.max(0, Math.floor((x / graphWidth) * bandCount))
    );
    const y = e.nativeEvent.locationY;
    const clampedY = Math.max(0, Math.min(y, GRAPH_HEIGHT));
    const ratio = 1 - clampedY / GRAPH_HEIGHT;
    const dbValue = Math.round(MIN_DB + ratio * RANGE_DB);
    updateBand(index, dbValue);
  };

  const handleReset = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    applyLevels(Array(16).fill(0));
    music.setPreamp(0);
    music.setBassBoost(0);
    music.setClarity(0);
    music.setSpatial(0);
    music.selectSoundProfile("FLAT");
  };

  const applyPreset = (name: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowProfileModal(false);
    music.selectSoundProfile(name as any);
  };

  const toggleActive = (val: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    music.setSonicEnabled(val);
  };

  const handleSaveNewPreset = () => {
    if (!newPresetName.trim()) return;
    if (!startFromCurrent) applyLevels(Array(16).fill(0));

    setCustomPresets([...customPresets, newPresetName.trim()]);
    setIs16Band(newPresetIs16Band);
    setShowNewPresetModal(false);
    setNewPresetName("My preset");
  };

  const renderBand = (index: number) => {
    const val = levels[index] ?? 0;
    const percentFromBottom = ((val - MIN_DB) / RANGE_DB) * 100;

    return (
      <View key={freqs[index]} style={styles.bandColumn}>
        <Text style={styles.bandValue}>
          {val > 0 ? `+${val}` : val}
        </Text>
        <View style={styles.trackLine} />
        {percentFromBottom > 0 && (
          <View style={[styles.activeBar, { height: `${percentFromBottom}%` }]} />
        )}
        <View style={[styles.dotWrapper, { bottom: `${percentFromBottom}%` }]}>
          <View style={styles.dot} />
        </View>
        <Text style={styles.freqLabel}>{freqs[index]}</Text>
      </View>
    );
  };

  const currentTrack = music.currentTrack;
  const preampValue = music.preamp ?? 0;

  const VISUAL_PRESETS = ["Rock", "Pop", "Hip Hop", "Classical", "Dance", "Flat"];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER WITH TOGGLE */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Equalizer</Text>
        <Switch
          value={music.sonicEnabled}
          onValueChange={toggleActive}
          trackColor={{ false: COLORS.border, true: COLORS.orange }}
          thumbColor="#FFF"
          style={{ transform: [{ scaleX: 1 }, { scaleY: 1 }] }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* PRESET CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {VISUAL_PRESETS.map((p) => {
             const engineName = p === "Hip Hop" ? "HIP-HOP" : p.toUpperCase();
             const isActive = music.soundProfile === engineName;
             return (
              <Pressable
                key={p}
                style={[styles.presetChip, isActive && styles.presetChipActive]}
                onPress={() => applyPreset(engineName)}
              >
                <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.presetChip} onPress={() => setShowProfileModal(true)}>
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.text} />
          </Pressable>
        </ScrollView>

        {/* VERTICAL SLIDERS */}
        <View style={[styles.eqSection, !music.sonicEnabled && { opacity: 0.4 }]}>
          <View style={styles.yAxis}>
            <Text style={styles.axisLabel}>+{MAX_DB}db</Text>
            <Text style={styles.axisLabel}>0db</Text>
            <Text style={styles.axisLabel}>{MIN_DB}db</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slidersRow}>
            <View
              style={styles.graphArea}
              onLayout={(e: LayoutChangeEvent) => setGraphWidth(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => music.sonicEnabled}
              onMoveShouldSetResponder={() => music.sonicEnabled}
              onResponderTerminationRequest={() => false}
              onResponderGrant={handleGraphTouch}
              onResponderMove={handleGraphTouch}
              onResponderRelease={flushLevels}
              onResponderTerminate={flushLevels}
            >
              <View style={[styles.gridLine, { top: 0 }]} pointerEvents="none" />
              <View style={[styles.gridLine, { top: GRAPH_HEIGHT / 2 }]} pointerEvents="none" />
              <View style={[styles.gridLine, { bottom: 0 }]} pointerEvents="none" />
              <View style={styles.bandsRow} pointerEvents="none">
                {freqs.map((_, i) => renderBand(i))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* HORIZONTAL SLIDERS */}
        <View style={[styles.bottomSection, !music.sonicEnabled && { opacity: 0.4 }]}>
          <Text style={styles.sectionTitle}>Bass Boost</Text>
          <Slider
            style={styles.horizontalSlider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={music.bassBoost}
            onValueChange={(v) => void music.setBassBoost(v)}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.orange}
            disabled={!music.sonicEnabled}
          />
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeText}>0%</Text>
            <Text style={styles.rangeText}>100%</Text>
          </View>
        </View>

        <View style={[styles.bottomSection, !music.sonicEnabled && { opacity: 0.4 }]}>
          <Text style={styles.sectionTitle}>Surround Sound</Text>
          <Slider
            style={styles.horizontalSlider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={music.spatial}
            onValueChange={(v) => void music.setSpatial(v)}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.orange}
            disabled={!music.sonicEnabled}
          />
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeText}>0%</Text>
            <Text style={styles.rangeText}>100%</Text>
          </View>
        </View>

        <View style={[styles.bottomSection, !music.sonicEnabled && { opacity: 0.4 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Preamp (Volume)</Text>
            <Text style={styles.orangeText}>{preampValue > 0 ? `+${preampValue.toFixed(0)}` : preampValue.toFixed(0)} dB</Text>
          </View>
          <Slider
            style={styles.horizontalSlider}
            minimumValue={MIN_DB}
            maximumValue={MAX_DB}
            step={1}
            value={preampValue}
            onValueChange={(v) => {
              if (v === preampValue) return;
              void Haptics.selectionAsync();
              music.setPreamp(v);
            }}
            minimumTrackTintColor={COLORS.orange}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.orange}
            disabled={!music.sonicEnabled}
          />
        </View>

      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomActionBar}>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={() => setShowNewPresetModal(true)}>
          <Text style={styles.saveBtnText}>Save as preset</Text>
        </Pressable>
      </View>

      {/* MINI PLAYER */}
      {currentTrack && (
        <Pressable style={[styles.miniPlayer, { paddingBottom: insets.bottom }]} onPress={() => router.push("/now-playing")}>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniArtwork}>
              <View style={styles.circleIconSmall}><View style={styles.circleInnerSmall} /></View>
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

      {/* PRESETS MODAL */}
      <Modal 
        visible={showProfileModal} 
        animationType="slide" 
        transparent
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowProfileModal(false)}>
          <Pressable style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Presets</Text>
              <View style={styles.modalHeaderRight}>
                <Pressable style={styles.newPresetBtn} onPress={() => { setShowProfileModal(false); setTimeout(() => setShowNewPresetModal(true), 300); }}>
                  <Ionicons name="add" size={16} color={COLORS.orange} />
                  <Text style={styles.newPresetText}>New preset</Text>
                </Pressable>
                <Pressable onPress={() => setShowProfileModal(false)} hitSlop={12} style={{ marginLeft: 12 }}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>MY PRESETS</Text>
              {customPresets.map((preset) => (
                <Pressable key={preset} style={styles.presetRow} onPress={() => applyPreset(preset)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetName, music.soundProfile === preset && { color: COLORS.orange }]}>{preset}</Text>
                    <Text style={styles.presetSub}>Custom · 16 band</Text>
                  </View>
                  <Pressable hitSlop={10} style={{ padding: 8 }}>
                    <Ionicons name="ellipsis-vertical" size={18} color={COLORS.muted} />
                  </Pressable>
                </Pressable>
              ))}

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>BUILT-IN</Text>
              {BUILT_IN_PRESETS.map((preset) => {
                const isActivePreset = music.soundProfile === preset;
                return (
                  <Pressable key={preset} style={[styles.presetRow, isActivePreset && styles.presetRowActive]} onPress={() => applyPreset(preset)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.presetName, isActivePreset && { color: COLORS.orange, fontWeight: "700" }]}>{preset}</Text>
                      {preset === "AUTO" && <Text style={styles.presetSub}>Smart loudness</Text>}
                      {preset === "FLAT" && <Text style={styles.presetSub}>Studio neutral</Text>}
                    </View>
                    {isActivePreset && <Ionicons name="checkmark" size={22} color={COLORS.orange} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* NEW PRESET MODAL */}
      <Modal 
        visible={showNewPresetModal} 
        animationType="fade" 
        transparent
        onRequestClose={() => setShowNewPresetModal(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.newPresetCard}>
            <Text style={styles.newPresetTitle}>New preset</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.presetNameInput} value={newPresetName} onChangeText={setNewPresetName} placeholder="My preset" placeholderTextColor={COLORS.muted} />
            <Text style={styles.inputLabel}>Start from</Text>
            <View style={styles.segmentedControl}>
              <Pressable style={[styles.segmentBtn, startFromCurrent && styles.segmentBtnActive]} onPress={() => setStartFromCurrent(true)}>
                <Text style={[styles.segmentText, startFromCurrent && styles.segmentTextActive]}>Current settings</Text>
              </Pressable>
              <Pressable style={[styles.segmentBtn, !startFromCurrent && styles.segmentBtnActive]} onPress={() => setStartFromCurrent(false)}>
                <Text style={[styles.segmentText, !startFromCurrent && styles.segmentTextActive]}>Flat</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Bands</Text>
            <View style={styles.segmentedControl}>
              <Pressable style={[styles.segmentBtn, !newPresetIs16Band && styles.segmentBtnActive]} onPress={() => setNewPresetIs16Band(false)}>
                <Text style={[styles.segmentText, !newPresetIs16Band && styles.segmentTextActive]}>8 band</Text>
              </Pressable>
              <Pressable style={[styles.segmentBtn, newPresetIs16Band && styles.segmentBtnActive]} onPress={() => setNewPresetIs16Band(true)}>
                <Text style={[styles.segmentText, newPresetIs16Band && styles.segmentTextActive]}>16 band</Text>
              </Pressable>
            </View>
            <View style={styles.newPresetActions}>
              <Pressable onPress={() => setShowNewPresetModal(false)} hitSlop={10}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={handleSaveNewPreset} hitSlop={10}>
                <Text style={styles.saveBtnTextSmall}>SAVE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: "600", flex: 1, letterSpacing: 0.5 },
  
  content: { paddingBottom: 20 },
  
  // Preset Chips (Square edges)
  presetRow: { paddingHorizontal: 20, gap: 8, marginBottom: 30 },
  presetChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  presetText: { color: COLORS.text, fontSize: 14, fontWeight: "500" },
  presetTextActive: { color: "#FFF", fontWeight: "700" },

  // Graph Section
  eqSection: { flexDirection: "row", height: GRAPH_HEIGHT + 60, paddingHorizontal: 20, marginBottom: 20 },
  yAxis: { justifyContent: "space-between", height: GRAPH_HEIGHT, paddingRight: 15, paddingBottom: 20, paddingTop: 10 },
  axisLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  slidersRow: { flex: 1, minWidth: "100%" },
  graphArea: { flex: 1, minWidth: "100%", height: GRAPH_HEIGHT, position: "relative" },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  
  // Bands
  bandsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: "100%", paddingBottom: 20 },
  bandColumn: { flex: 1, minWidth: 44, height: "100%", alignItems: "center", justifyContent: "flex-end", position: "relative" },
  trackLine: { position: "absolute", top: 20, bottom: 20, width: 2, backgroundColor: COLORS.border },
  activeBar: { position: "absolute", bottom: 20, width: 2, backgroundColor: COLORS.orange },
  dotWrapper: { position: "absolute", alignItems: "center", justifyContent: "center", height: 0, zIndex: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.orange }, // Tiny circle for the handle is okay, or use square
  bandValue: { position: "absolute", top: -24, color: COLORS.orange, fontSize: 11, fontWeight: "700" },
  freqLabel: { position: "absolute", bottom: -20, color: COLORS.muted, fontSize: 11, fontWeight: "600", textAlign: "center" },

  // Horizontal Sliders
  bottomSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 12, letterSpacing: 0.3 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orangeText: { color: COLORS.orange, fontSize: 14, fontWeight: "700" },
  horizontalSlider: { width: "100%", height: 40 },
  rangeLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -10, paddingHorizontal: 0 },
  rangeText: { color: COLORS.muted, fontSize: 12, fontWeight: "500" },

  // Bottom Bar
  bottomActionBar: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
  resetBtn: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, height: 52 },
  resetBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  saveBtn: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.orange, height: 52 },
  saveBtnText: { color: "#08090B", fontSize: 14, fontWeight: "700" },

  // Mini Player
  miniPlayer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  miniPlayerContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12 },
  miniArtwork: { width: 40, height: 40, backgroundColor: "#2B1B12", alignItems: "center", justifyContent: "center", marginRight: 12 },
  miniTrackInfo: { flex: 1, justifyContent: "center" },
  miniTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: "row", alignItems: "center" },
  progressBarBackground: { height: 2, backgroundColor: COLORS.border, width: "100%" },
  progressBarFill: { height: 2, backgroundColor: COLORS.orange },
  circleIconSmall: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleInnerSmall: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.orange },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 20, maxHeight: "85%", borderTopWidth: 1, borderTopColor: COLORS.border },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  modalHeaderRight: { flexDirection: "row", alignItems: "center" },
  newPresetBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.orange },
  newPresetText: { color: COLORS.orange, fontSize: 12, fontWeight: "600" },
  sectionLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  presetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  presetRowActive: { backgroundColor: COLORS.surface, marginHorizontal: -20, paddingHorizontal: 20, borderBottomWidth: 0 },
  presetName: { color: COLORS.text, fontSize: 15 },
  presetSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  centeredModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20 },
  newPresetCard: { width: "100%", backgroundColor: COLORS.surface, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  newPresetTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 20 },
  inputLabel: { color: COLORS.muted, fontSize: 13, marginBottom: 8 },
  presetNameInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.orange, paddingHorizontal: 16, paddingVertical: 14, color: COLORS.text, fontSize: 15, marginBottom: 20 },
  segmentedControl: { flexDirection: "row", backgroundColor: COLORS.background, padding: 2, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  segmentBtnActive: { backgroundColor: COLORS.orange },
  segmentText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  segmentTextActive: { color: "#08090B", fontWeight: "700" },
  newPresetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 24, marginTop: 10 },
  cancelBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
  saveBtnTextSmall: { color: COLORS.orange, fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
});