import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

function cleanFilename(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const music = useMusic();
  const currentTrack = music.currentTrack;

  const sonicState = music.sonicEnabled ? "On" : "Off";

  const ROWS: { title: string; icon: string; sub?: string; route: string }[] = [
    { title: "Playback", icon: "play-circle-outline", route: "/playback-settings" },
    { title: "Sonic Engine", icon: "pulse", sub: sonicState, route: "/sonic" },
    { title: "Audio Device", icon: "headset-outline", route: "/audio-device" },
    { title: "Audio quality", icon: "musical-notes", sub: "High", route: "/audio-quality" },
    { title: "Sleep Timer", icon: "moon-outline", route: "/sleep-timer" },
    { title: "Downloads", icon: "download-outline", route: "/downloads" },
    { title: "Storage", icon: "folder-outline", route: "/storage" },
    { title: "Notifications", icon: "notifications-outline", route: "/notifications" },
    { title: "Appearance", icon: "color-palette-outline", sub: "Dark", route: "/appearance" },
    { title: "Language", icon: "language-outline", sub: "English", route: "/language" },
    { title: "Privacy", icon: "shield-checkmark-outline", route: "/privacy" },
    { title: "About", icon: "information-circle-outline", route: "/about" },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 30 + insets.bottom + (currentTrack ? 64 : 0),
        }}
        showsVerticalScrollIndicator={false}
      >
        {ROWS.map((r) => (
          <Pressable
            key={r.title}
            style={styles.row}
            onPress={() => router.push(r.route as any)}
          >
            <Ionicons name={r.icon as any} size={20} color={COLORS.orange} />
            <Text style={styles.label}>{r.title}</Text>
            {r.sub ? <Text style={styles.sub}>{r.sub}</Text> : null}
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </Pressable>
        ))}
        <Text style={styles.version}>RADEV SONIC · v1.0.0</Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: { flex: 1, color: COLORS.text, fontSize: 14 },
  sub: { color: COLORS.muted, fontSize: 12, marginRight: 8 },
  version: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 30,
    letterSpacing: 1,
  },
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