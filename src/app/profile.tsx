import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { useMusic } from "../context/MusicContext";
import { supabase } from "../lib/supabase";

const COLORS = {
  background: "#08090B",
  surface: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY ?? "";
const CLOUDINARY_API_SECRET =
  process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET ?? "";

type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) console.error("Profile fetch error:", error);

      setUser({
        name:
          profile?.full_name || authUser.email?.split("@")[0] || "RADEV User",
        email: authUser.email || "No email",
        avatarUrl: profile?.avatar_url || null,
      });
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const pickAndUploadAvatar = async () => {
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      console.error("⚠️ Missing Cloudinary credentials in .env");
      Alert.alert(
        "Feature Unavailable",
        "Profile picture updates are currently unavailable. Please try again later."
      );
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo access to choose a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "radev_sonic/avatars";

      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        paramsToSign
      );

      const formData = new FormData();
      const blob = await (await fetch(uri)).blob();
      formData.append("file", blob, `avatar_${timestamp}.jpg`);
      formData.append("api_key", CLOUDINARY_API_KEY);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadRes.json();
      if (!uploadRes.ok || data.error) {
        console.error(
          `Cloudinary upload failed: ${uploadRes.status} - ${
            data.error?.message || "Unknown error"
          }`
        );
        throw new Error("upload_failed");
      }

      const secureUrl = data.secure_url as string;

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error("not_authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: secureUrl, updated_at: new Date().toISOString() })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Failed to save avatar to profiles table:", updateError);
        throw new Error("db_update_failed");
      }

      setUser((prev) => (prev ? { ...prev, avatarUrl: secureUrl } : null));
      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      Alert.alert(
        "Update Failed",
        "We couldn't update your profile picture at this time. Please check your internet connection and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  // Correctly compute total hours (handles ms or sec)
  const totalTracks = music.tracks.length;
  const totalSeconds = music.tracks.reduce((acc, t) => {
    const raw = t.duration || 0;
    return acc + (raw > 36000 ? raw / 1000 : raw);
  }, 0);
  const totalHours = Math.floor(totalSeconds / 3600);

  const topArtist = music.tracks.length > 0
    ? music.tracks.reduce((acc, t) => {
        acc[t.artist] = (acc[t.artist] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;
  const topArtistName = topArtist
    ? Object.keys(topArtist).sort((a, b) => topArtist[b] - topArtist[a])[0]
    : "N/A";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <Pressable onPress={pickAndUploadAvatar} style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color={COLORS.orange} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFF" />
              )}
            </View>
          </Pressable>
          {loading ? (
            <ActivityIndicator color={COLORS.orange} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.name}>{user?.name || "RADEV User"}</Text>
              <Text style={styles.email}>{user?.email || "Not signed in"}</Text>
            </>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.orange} />
            <Text style={styles.statValue}>{totalHours}</Text>
            <Text style={styles.statLabel}>Hours listened</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="musical-notes-outline"
              size={20}
              color={COLORS.orange}
            />
            <Text style={styles.statValue}>{totalTracks}</Text>
            <Text style={styles.statLabel}>Songs in library</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person-outline" size={20} color={COLORS.orange} />
            <Text style={styles.statValue} numberOfLines={1}>
              {topArtistName}
            </Text>
            <Text style={styles.statLabel}>Top artist</Text>
          </View>
        </View>

        <View style={styles.subscriptionCard}>
          <View>
            <Text style={styles.subLabel}>Subscription</Text>
            <Text style={styles.subValue}>Free plan</Text>
          </View>
          <Pressable hitSlop={10} onPress={() => router.push("/premium")}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="person-circle-outline" size={22} color={COLORS.orange} />
          <Text style={styles.menuText}>Account settings</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </Pressable>

        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/downloads")}
        >
          <Ionicons name="download-outline" size={22} color={COLORS.orange} />
          <Text style={styles.menuText}>Downloads</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </Pressable>

        <Pressable
          style={styles.menuRow}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.orange} />
          <Text style={styles.menuText}>Preferences</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </Pressable>

        {/* SIGN OUT BUTTON */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#F87171" />
          <Text style={styles.signOutText}>Sign out</Text>
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
  content: { paddingHorizontal: 20 },
  profileHeader: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  name: { color: COLORS.text, fontSize: 22, fontWeight: "800", marginBottom: 4 },
  email: { color: COLORS.muted, fontSize: 13 },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statValue: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  statLabel: { color: COLORS.muted, fontSize: 10, textAlign: "center" },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  subLabel: { color: COLORS.muted, fontSize: 11, marginBottom: 4 },
  subValue: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  upgradeText: { color: COLORS.orange, fontSize: 14, fontWeight: "700" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    gap: 14,
  },
  menuText: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: "500" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#1A0F0F",
    borderWidth: 1,
    borderColor: "#2B1B12",
  },
  signOutText: { color: "#F87171", fontSize: 15, fontWeight: "700" },
});