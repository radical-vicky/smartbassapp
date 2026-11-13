// src/app/privacy.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your data stays yours</Text>
          <Text style={styles.cardBody}>
            RADEV SONIC does not upload your music library to any server. Your
            songs, playlists, and favourites are stored only on this device.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>WHAT WE ACCESS</Text>

        <View style={styles.row}>
          <Ionicons name="musical-notes" size={20} color={COLORS.orange} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.label}>Music library</Text>
            <Text style={styles.sub}>
              To scan and play your device songs. Nothing leaves the device.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="mic" size={20} color={COLORS.orange} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.label}>Microphone</Text>
            <Text style={styles.sub}>
              Only used for the live visualizer when you enable it. No audio is
              recorded or stored.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="notifications" size={20} color={COLORS.orange} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.label}>Notifications</Text>
            <Text style={styles.sub}>
              Used only for playback controls on the lock screen.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          We never share or sell your data. For full details, see our privacy
          policy at radevsonic.app/privacy.
        </Text>
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
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  cardBody: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  footer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginHorizontal: 20,
    marginTop: 24,
  },
});