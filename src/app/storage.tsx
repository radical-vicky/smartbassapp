// src/app/storage.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useSettings } from "../context/SettingsContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const CACHE_OPTIONS_MB = [512, 1024, 2048, 4096];

export default function StorageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Storage</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.usageCard}>
          <Text style={styles.usageLabel}>CACHE</Text>
          <Text style={styles.usageValue}>0 MB used</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "0%" }]} />
          </View>
          <Text style={styles.usageSub}>
            Limit: {settings.cacheLimitMb} MB
          </Text>
        </View>

        <Text style={styles.sectionLabel}>CACHE LIMIT</Text>
        <View style={styles.chipRow}>
          {CACHE_OPTIONS_MB.map((mb) => (
            <Pressable
              key={mb}
              style={[
                styles.chip,
                settings.cacheLimitMb === mb && styles.chipActive,
              ]}
              onPress={() => updateSettings({ cacheLimitMb: mb })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.cacheLimitMb === mb && styles.chipTextActive,
                ]}
              >
                {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.clearBtn}
          onPress={() => router.push("/downloads")}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.orange} />
          <Text style={styles.clearText}>Manage downloads</Text>
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
  usageCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  usageLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  usageValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1A1A1A",
    marginTop: 12,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },
  usageSub: { color: COLORS.muted, fontSize: 12, marginTop: 8 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  chipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#08090B" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearText: { color: COLORS.orange, fontSize: 14, fontWeight: "600" },
});