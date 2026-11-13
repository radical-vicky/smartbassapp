// src/app/sleep-timer.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";
import { useSettings } from "../context/SettingsContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const TIMER_OPTIONS = [5, 10, 15, 30, 45, 60, 90, 120];

export default function SleepTimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const music = useMusic();
  const { settings, updateSettings } = useSettings();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const setTimer = (mins: number | null) => {
    updateSettings({ sleepTimerMinutes: mins });
    music.setSleepTimer(mins);
  };

  // Show remaining time based on music state
  const remainingLabel = (() => {
    if (!settings.sleepTimerMinutes) return "Off";
    if (settings.sleepTimerMinutes <= 0) return "Finished";
    return `${settings.sleepTimerMinutes} min`;
  })();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Sleep timer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.statusCard}>
          <Ionicons name="moon" size={40} color={COLORS.orange} />
          <Text style={styles.statusValue}>{remainingLabel}</Text>
          <Text style={styles.statusSub}>
            Playback will pause after the timer ends.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>SET TIMER</Text>
        <View style={styles.grid}>
          {TIMER_OPTIONS.map((m) => (
            <Pressable
              key={m}
              style={[
                styles.chip,
                settings.sleepTimerMinutes === m && styles.chipActive,
              ]}
              onPress={() => setTimer(m)}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.sleepTimerMinutes === m && styles.chipTextActive,
                ]}
              >
                {m >= 60 ? `${m / 60} hr` : `${m} min`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.cancelBtn, !settings.sleepTimerMinutes && { opacity: 0.4 }]}
          onPress={() => setTimer(null)}
          disabled={!settings.sleepTimerMinutes}
        >
          <Text style={styles.cancelText}>Cancel timer</Text>
        </Pressable>
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
  statusCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 8,
  },
  statusValue: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  statusSub: { color: COLORS.muted, fontSize: 12, textAlign: "center" },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#08090B" },
  cancelBtn: {
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: { color: COLORS.orange, fontSize: 14, fontWeight: "700" },
});