// src/app/about.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
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

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        <View style={styles.logoCard}>
          <View style={styles.circleBig}>
            <View style={styles.circleInner} />
          </View>
          <Text style={styles.appName}>RADEV SONIC</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Text style={styles.sectionLabel}>LINKS</Text>

        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("https://radevsonic.app")}
        >
          <Ionicons name="globe-outline" size={20} color={COLORS.orange} />
          <Text style={styles.label}>Website</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.muted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("https://radevsonic.app/privacy")}
        >
          <Ionicons name="shield-outline" size={20} color={COLORS.orange} />
          <Text style={styles.label}>Privacy policy</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.muted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL("mailto:hello@radevsonic.app")}
        >
          <Ionicons name="mail-outline" size={20} color={COLORS.orange} />
          <Text style={styles.label}>Contact support</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.muted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>

        <Text style={styles.footer}>
          Built with care for people who love music. Powered by RADEV Sonic
          Engine.
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
  logoCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  circleBig: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  circleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
  },
  appName: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  version: { color: COLORS.muted, fontSize: 12 },
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
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  label: { color: COLORS.text, fontSize: 14 },
  footer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 30,
  },
});