// src/app/playback-settings.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
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

export default function PlaybackSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const ToggleRow = ({
    label,
    sub,
    value,
    onChange,
  }: {
    label: string;
    sub?: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#333", true: COLORS.orange }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Playback</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <Text style={styles.sectionLabel}>BEHAVIOUR</Text>
        <ToggleRow
          label="Autoplay next track"
          sub="Continue playing when a song ends"
          value={settings.autoplayNext}
          onChange={(v) => updateSettings({ autoplayNext: v })}
        />
        <ToggleRow
          label="Gapless playback"
          sub="No silence between tracks"
          value={settings.gaplessPlayback}
          onChange={(v) => updateSettings({ gaplessPlayback: v })}
        />
        <ToggleRow
          label="Resume on headphones"
          sub="Auto-play when headphones connect"
          value={settings.resumeOnHeadphones}
          onChange={(v) => updateSettings({ resumeOnHeadphones: v })}
        />

        <Text style={styles.sectionLabel}>CROSSFADE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Crossfade duration</Text>
          <Text style={styles.value}>{settings.crossfadeSeconds}s</Text>
        </View>
        <View style={styles.chipRow}>
          {[0, 3, 5, 8, 12].map((v) => (
            <Pressable
              key={v}
              style={[
                styles.chip,
                settings.crossfadeSeconds === v && styles.chipActive,
              ]}
              onPress={() => updateSettings({ crossfadeSeconds: v })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.crossfadeSeconds === v && styles.chipTextActive,
                ]}
              >
                {v === 0 ? "Off" : `${v}s`}
              </Text>
            </Pressable>
          ))}
        </View>
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
  label: { color: COLORS.text, fontSize: 14 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  value: { color: COLORS.orange, fontSize: 13, fontWeight: "700" },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
});