import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#333333",
};

const FEATURES = [
  {
    icon: "pulse",
    title: "Full Sonic Engine",
    desc: "Pro 16-band EQ, 3D surround, bass boost",
  },
  {
    icon: "cloud-download-outline",
    title: "Offline playback",
    desc: "Download and play without internet",
  },
  {
    icon: "musical-notes",
    title: "Lossless audio",
    desc: "Studio-quality, up to 24-bit / 96 kHz",
  },
  {
    icon: "close-circle-outline",
    title: "Ad-free listening",
    desc: "No interruptions, ever",
  },
  {
    icon: "sparkles",
    title: "Exclusive profiles",
    desc: "Curated lists and artist presets",
  },
];

type Plan = "monthly" | "yearly";

export default function PremiumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");

  const handleUpgrade = () => {
    Alert.alert(
      "Upgrade coming soon",
      `You selected the ${
        selectedPlan === "yearly" ? "yearly" : "monthly"
      } plan. In-app purchases will activate in the next release.`,
      [{ text: "OK" }]
    );
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore purchases",
      "If you've purchased premium before, we'll restore it here once billing is enabled.",
      [{ text: "OK" }]
    );
  };

  const handleManage = () => {
    const url =
      "https://play.google.com/store/account/subscriptions?package=com.radevsonic.app";
    Linking.openURL(url).catch(() =>
      Alert.alert("Manage subscription", "Open your app store to manage your subscription.")
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <LinearGradient
          colors={["#3A2510", "#1A1208"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="star" size={44} color={COLORS.orange} />
          </View>
          <Text style={styles.title}>RADEV SONIC Premium</Text>
          <Text style={styles.subtitle}>Unlock the full sound experience</Text>
        </LinearGradient>

        {/* FEATURES */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* PLANS */}
        <View style={styles.planRow}>
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === "monthly" && styles.planCardActive,
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <Text style={styles.planLabel}>Monthly</Text>
            <Text style={styles.planPrice}>$4.99</Text>
            <Text style={styles.planSub}>per month</Text>
          </Pressable>

          <Pressable
            style={[
              styles.planCard,
              selectedPlan === "yearly" && styles.planCardActive,
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>SAVE 40%</Text>
            </View>
            <Text style={styles.planLabel}>Yearly</Text>
            <Text style={styles.planPrice}>$34.99</Text>
            <Text style={styles.planSub}>per year · ~$2.92/mo</Text>
          </Pressable>
        </View>

        {/* TRIAL LINE */}
        <View style={styles.trialLine}>
          <Ionicons name="gift-outline" size={16} color={COLORS.orange} />
          <Text style={styles.trialText}>
            7-day free trial · Cancel anytime
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.upgradeBtn} onPress={handleUpgrade}>
          <Text style={styles.upgradeBtnText}>
            Start 7-day free trial
          </Text>
        </Pressable>

        <View style={styles.footerLinks}>
          <Pressable onPress={handleRestore} hitSlop={10}>
            <Text style={styles.linkText}>Restore</Text>
          </Pressable>
          <Text style={styles.linkDivider}>·</Text>
          <Pressable onPress={handleManage} hitSlop={10}>
            <Text style={styles.linkText}>Manage subscription</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          Payment will be charged to your store account. Subscription
          auto-renews unless canceled at least 24 hours before the end of the
          period.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  content: { paddingHorizontal: 24 },

  hero: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    marginTop: 4,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,133,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,133,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
  },

  features: { gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  featureDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },

  planRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  planCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    position: "relative",
  },
  planCardActive: {
    borderColor: COLORS.orange,
    backgroundColor: "#241810",
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: COLORS.orange,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  saveText: { color: "#08090B", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  planLabel: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
  planPrice: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  planSub: { color: COLORS.muted, fontSize: 11 },

  trialLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  trialText: { color: COLORS.muted, fontSize: 12 },

  footer: { paddingHorizontal: 24, paddingTop: 16, gap: 14 },
  upgradeBtn: {
    backgroundColor: COLORS.orange,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeBtnText: { color: "#08090B", fontSize: 15, fontWeight: "800" },

  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  linkText: { color: COLORS.muted, fontSize: 12, textDecorationLine: "underline" },
  linkDivider: { color: COLORS.muted, fontSize: 12 },

  legal: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});