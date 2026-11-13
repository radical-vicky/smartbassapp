import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

type Device = {
  id: string;
  icon: any;
  label: string;
  status: string;
  connected: boolean;
};

const DEFAULT_DEVICES: Device[] = [
  {
    id: "speaker",
    icon: "volume-low-outline",
    label: "Phone speaker",
    status: "Active",
    connected: true,
  },
  {
    id: "wired",
    icon: "headset-outline",
    label: "Wired headphones",
    status: "Not connected",
    connected: false,
  },
  {
    id: "bt-headphones",
    icon: "headset",
    label: "Bluetooth headphones",
    status: "Not connected",
    connected: false,
  },
  {
    id: "bt-speakers",
    icon: "volume-medium-outline",
    label: "Bluetooth speakers",
    status: "Not connected",
    connected: false,
  },
];

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function AudioDeviceScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [devices] = useState<Device[]>(DEFAULT_DEVICES);
  const [selectedId, setSelectedId] = useState("speaker");

  const handleSelect = (device: Device) => {
    if (!device.connected) {
      Alert.alert(
        "Not connected",
        `To use "${device.label}", please connect it via your phone's system settings.`
      );
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(device.id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Audio Device</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>OUTPUT</Text>

        <View style={styles.list}>
          {devices.map((device) => {
            const isSelected = selectedId === device.id;
            const isDisabled = !device.connected;

            return (
              <Pressable
                key={device.id}
                style={[
                  styles.row,
                  isSelected && styles.rowActive,
                  isDisabled && { opacity: 0.4 },
                ]}
                onPress={() => handleSelect(device)}
              >
                <Ionicons
                  name={device.icon}
                  size={22}
                  color={isSelected ? COLORS.orange : COLORS.muted}
                />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text
                    style={[
                      styles.label,
                      isSelected && { color: COLORS.orange, fontWeight: "700" },
                    ]}
                  >
                    {device.label}
                  </Text>
                  <Text style={styles.desc}>{device.status}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={22} color={COLORS.orange} />
                )}
              </Pressable>
            );
          })}
        </View>
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
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  list: { gap: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowActive: { backgroundColor: "#1A1A1E" },
  label: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  desc: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
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