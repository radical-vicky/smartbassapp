// src/app/language.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { Language, useSettings } from "../context/SettingsContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const LANGS: { key: Language; native: string }[] = [
  { key: "English", native: "English" },
  { key: "French", native: "Français" },
  { key: "Spanish", native: "Español" },
  { key: "Swahili", native: "Kiswahili" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <Text style={styles.sectionLabel}>APP LANGUAGE</Text>
        {LANGS.map((l) => (
          <Pressable
            key={l.key}
            style={styles.row}
            onPress={() => updateSettings({ language: l.key })}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.label,
                  settings.language === l.key && {
                    color: COLORS.orange,
                    fontWeight: "700",
                  },
                ]}
              >
                {l.native}
              </Text>
              <Text style={styles.sub}>{l.key}</Text>
            </View>
            {settings.language === l.key && (
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: { color: COLORS.text, fontSize: 15 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});