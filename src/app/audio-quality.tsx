// src/app/audio-quality.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { PlaybackQuality, useSettings } from "../context/SettingsContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const QUALITY_OPTIONS: { key: PlaybackQuality; desc: string }[] = [
  { key: "Low", desc: "96 kbps · Saves data" },
  { key: "Normal", desc: "160 kbps · Balanced" },
  { key: "High", desc: "320 kbps · Recommended" },
  { key: "Lossless", desc: "CD quality · Uses more data" },
];

export default function AudioQualityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Audio quality</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <Text style={styles.sectionLabel}>STREAMING</Text>
        {QUALITY_OPTIONS.map((q) => (
          <Pressable
            key={q.key}
            style={styles.row}
            onPress={() => updateSettings({ audioQuality: q.key })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{q.key}</Text>
              <Text style={styles.sub}>{q.desc}</Text>
            </View>
            {settings.audioQuality === q.key && (
              <Ionicons name="checkmark" size={22} color={COLORS.orange} />
            )}
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>DOWNLOADS</Text>
        {QUALITY_OPTIONS.map((q) => (
          <Pressable
            key={`dl-${q.key}`}
            style={styles.row}
            onPress={() => updateSettings({ downloadQuality: q.key })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{q.key}</Text>
              <Text style={styles.sub}>{q.desc}</Text>
            </View>
            {settings.downloadQuality === q.key && (
              <Ionicons name="checkmark" size={22} color={COLORS.orange} />
            )}
          </Pressable>
        ))}
      </ScrollView>
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
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});