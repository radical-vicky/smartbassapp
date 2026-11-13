import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

type MenuItem = {
  title?: string;
  icon?: string;
  route?: string;
  divider?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { title: "Home", icon: "home", route: "/home" },
  { title: "Music Library", icon: "musical-notes", route: "/library" },
  { title: "Songs", icon: "list", route: "/library?tab=Songs" },
  { title: "Albums", icon: "disc", route: "/library?tab=Albums" },
  { title: "Artists", icon: "people", route: "/library?tab=Artists" },
  { title: "Folders", icon: "folder-open", route: "/library?tab=Folders" },
  { divider: true },
  { title: "Video Library", icon: "videocam", route: "/video-library" },
  { title: "Explore Music", icon: "compass", route: "/explore" },
  { title: "Radio", icon: "radio", route: "/radio" },
  { title: "Podcasts", icon: "mic", route: "/podcasts" },
  { divider: true },
  { title: "Playlists", icon: "list", route: "/library?tab=Playlists" },
  { title: "Favourites", icon: "heart", route: "/favourites" },
  { title: "Downloads", icon: "download", route: "/downloads" },
  { title: "Recently Played", icon: "time", route: "/recently-played" },
  { divider: true },
  { title: "Sonic Engine", icon: "pulse", route: "/sonic" },
  { title: "Audio Device", icon: "headset", route: "/audio-device" },
  { title: "Audio Settings", icon: "options", route: "/settings" },
  { title: "Cloud Music", icon: "cloud", route: "/cloud" },
  { title: "Storage & Folders", icon: "folder", route: "/storage" },
  { title: "App Settings", icon: "settings", route: "/settings" },
  { title: "Profile", icon: "person", route: "/profile" },
  { title: "About RADEV SONIC", icon: "information-circle", route: "/about" },
];

interface SideDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  activeRoute: string;
}

export function SideDrawer({
  isVisible,
  onClose,
  onNavigate,
  activeRoute,
}: SideDrawerProps) {
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState("Loading...");
  const [email, setEmail] = useState("...");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setDisplayName(
            user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "RADEV User"
          );
          setEmail(user.email || "No email");
          setAvatarUrl(user.user_metadata?.avatar_url || null);
        } else {
          setDisplayName("Guest User");
          setEmail("Not signed in");
        }
      } catch (e) {
        console.error("Failed to load user profile:", e);
      }
    })();
  }, [isVisible]);

  const isActive = (route?: string) => {
    if (!route) return false;
    if (activeRoute === route) return true;
    // Treat /library and /library?tab=Songs as separate active items
    return false;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.drawerContainer,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* PROFILE SECTION */}
          <Pressable
            style={styles.profileSection}
            onPress={() => {
              onClose();
              onNavigate("/profile");
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.orange} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.menuScroll}
          >
            {MENU_ITEMS.map((item, index) => {
              if (item.divider) {
                return (
                  <View key={`div-${index}`} style={styles.divider} />
                );
              }
              const active = isActive(item.route);
              return (
                <Pressable
                  key={item.title}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  onPress={() => {
                    if (item.route) onNavigate(item.route);
                    onClose();
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={active ? COLORS.orange : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      active && styles.menuTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => {
              onClose();
              onNavigate("/premium");
            }}
          >
            <LinearGradient
              colors={["#26170F", "#17110E"]}
              style={styles.premiumBanner}
            >
              <Ionicons name="star" size={20} color={COLORS.orange} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.premiumTitle}>RADEV SONIC Premium</Text>
                <Text style={styles.premiumSub}>
                  Full Sonic Engine & offline playback
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.orange}
              />
            </LinearGradient>
          </Pressable>
        </View>
        <Pressable style={styles.dimBackground} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  dimBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  drawerContainer: {
    width: "80%",
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  displayName: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  email: { color: COLORS.muted, fontSize: 12, marginTop: 4 },

  menuScroll: { flex: 1 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 15,
  },
  menuItemActive: {
    backgroundColor: "#1A1511",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
    paddingLeft: 17,
  },
  menuText: { color: COLORS.muted, fontSize: 14, fontWeight: "500" },
  menuTextActive: { color: COLORS.orange, fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
    marginHorizontal: 20,
  },

  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A281E",
  },
  premiumTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  premiumSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
});