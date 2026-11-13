import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";

const COLORS = {
  background: "#08090B",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

const STORAGE_KEY = "@radev_notification_prefs";

type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  defaultOn: boolean;
};

const SETTINGS: NotificationSetting[] = [
  { id: "new_releases", title: "New releases", description: "Music from artists you follow", defaultOn: true },
  { id: "playlist_updates", title: "Playlist updates", description: "Changes to your playlists", defaultOn: true },
  { id: "download_completion", title: "Download completion", description: "When a download finishes", defaultOn: true },
  { id: "account_notifications", title: "Account notifications", description: "Security and billing alerts", defaultOn: true },
  { id: "promotions", title: "Promotions", description: "Offers and news", defaultOn: false },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State for all notification toggles
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setPrefs(JSON.parse(saved));
        } else {
          // First-time default setup
          const initial: Record<string, boolean> = {};
          SETTINGS.forEach((s) => { initial[s.id] = s.defaultOn; });
          setPrefs(initial);
        }
      } catch (e) {
        console.error("Failed to load notification prefs:", e);
      }
    })();
  }, []);

  const handleToggle = async (id: string) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save notification prefs:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {SETTINGS.map((setting) => {
          const isOn = prefs[setting.id] ?? setting.defaultOn;
          return (
            <View key={setting.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{setting.title}</Text>
                <Text style={styles.rowDescription}>{setting.description}</Text>
              </View>
              <Pressable
                onPress={() => handleToggle(setting.id)}
                style={[styles.toggle, isOn && styles.toggleOn]}
              >
                <View style={[styles.toggleKnob, isOn && styles.toggleKnobOn]} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 16,
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 4 },
  rowDescription: { color: COLORS.muted, fontSize: 12 },

  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A2A2A",
    padding: 3,
    justifyContent: "center",
  },
  toggleOn: { backgroundColor: COLORS.orange },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FFF" },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
});
