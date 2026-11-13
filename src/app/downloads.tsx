// src/app/downloads.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
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

export default function DownloadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Downloads</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.emptyCard}>
          <Ionicons name="cloud-download-outline" size={48} color={COLORS.orange} />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptyText}>
            Downloaded songs will appear here for offline listening.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>PREFERENCES</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Download over Wi-Fi only</Text>
            <Text style={styles.sub}>Saves mobile data</Text>
          </View>
          <Switch
            value={settings.downloadOverWifiOnly}
            onValueChange={(v) => updateSettings({ downloadOverWifiOnly: v })}
            trackColor={{ false: "#333", true: COLORS.orange }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Auto-download favourites</Text>
            <Text style={styles.sub}>Favourited songs download automatically</Text>
          </View>
          <Switch
            value={settings.autoDownloadFavourites}
            onValueChange={(v) => updateSettings({ autoDownloadFavourites: v })}
            trackColor={{ false: "#333", true: COLORS.orange }}
            thumbColor="#FFF"
          />
        </View>

        <Pressable
          style={styles.qualityRow}
          onPress={() => router.push("/audio-quality")}
        >
          <Text style={styles.label}>Download quality</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.value}>{settings.downloadQuality}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </View>
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
  emptyCard: {
    margin: 20,
    padding: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
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
  label: { color: COLORS.text, fontSize: 14 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  value: { color: COLORS.orange, fontSize: 13, fontWeight: "700" },
  qualityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});