import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import { ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AppPressable as Pressable } from "../components/AppPressable";
import { SideDrawer } from "../components/SideDrawer";
import { useMusic } from "../context/MusicContext";
import { usePlaylists } from "../context/PlaylistContext";
import { useRecentlyPlayed } from "../context/RecentlyPlayedContext";
import { supabase } from "../lib/supabase";

const COLORS = {
  background: "#090A0C",
  card: "#171A1E",
  elevated: "#20242A",
  border: "#282C32",
  text: "#F5F5F5",
  muted: "#A1A5AB",
  orange: "#FF8A00",
  cyan: "#22D3EE",
};

const SCREEN_PADDING = 20;
const GAP = 12;
const MINI_PLAYER_HEIGHT = 64;

type Track = ReturnType<typeof useMusic>["tracks"][number];
type IconName = ComponentProps<typeof Ionicons>["name"];

const QUICK_ACCESS: { icon: IconName; label: string; route: Href }[] = [
  { icon: "library", label: "Library", route: "/library" },
  { icon: "heart", label: "Favourites", route: "/favourites" },
  { icon: "people", label: "Artists", route: "/artists" },
  { icon: "pulse", label: "Sonic", route: "/sonic" },
];

function cleanFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function useUserName() {
  const [name, setName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        const raw =
          profile?.full_name || user.email?.split("@")[0] || "Music Lover";
        const first = raw.trim().split(/\s+/)[0];
        if (!cancelled) {
          setName(first.charAt(0).toUpperCase() + first.slice(1));
        }
      } catch (e) {
        console.warn("Failed to load user name:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return name;
}

/* ---------- Small building blocks ---------- */

function Artwork({
  size,
  tint = COLORS.card,
  radius = 8,
}: {
  size?: number;
  tint?: string;
  radius?: number;
}) {
  const ring = size ? Math.round(size * 0.5) : 30;
  return (
    <View
      style={[
        styles.artwork,
        size
          ? { width: size, height: size }
          : { width: "100%", aspectRatio: 1 },
        { backgroundColor: tint, borderRadius: radius },
      ]}
    >
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: ring > 24 ? 2 : 1.5,
          borderColor: COLORS.orange,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: ring * 0.2,
            height: ring * 0.2,
            borderRadius: ring,
            backgroundColor: COLORS.orange,
          }}
        />
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={10}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyBlock({
  text,
  actionLabel,
  onAction,
  loading,
}: {
  text: string;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.emptyBlock}>
      <Text style={styles.emptyText}>{text}</Text>
      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator size="small" color={COLORS.orange} />
          <Text style={styles.emptyAction}>Scanning your device…</Text>
        </View>
      ) : (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.emptyAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function MediaCard({
  width,
  title,
  subtitle,
  tint,
  onPress,
}: {
  width: number;
  title: string;
  subtitle: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={{ width }} onPress={onPress}>
      <Artwork tint={tint} />
      <Text style={styles.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function TrackRow({
  track,
  onPress,
  onMore,
}: {
  track: Track;
  onPress: () => void;
  onMore: () => void;
}) {
  const title = cleanFilename(track.filename);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Artwork size={50} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <Pressable onPress={onMore} style={styles.iconButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.muted} />
      </Pressable>
    </Pressable>
  );
}

/* ---------- Main Screen ---------- */

export default function HomeScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { playlists } = usePlaylists();
  const { recentTracks, recordPlay } = useRecentlyPlayed();
  const userName = useUserName();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (music.isScanning || music.hasScanned) return;
    let cancelled = false;
    (async () => {
      const result = await music.scanDeviceMusic();
      if (!cancelled && !result.ok && result.reason === "denied") {
        setPermissionDenied(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [music.hasScanned, music.isScanning, music.scanDeviceMusic]);

  const cardWidth = Math.floor((width - SCREEN_PADDING * 2 - GAP * 2) / 3);

  const currentTrack = music.currentTrack;
  const recentlyPlayed = recentTracks.slice(0, 3);
  const yourPlaylists = playlists.slice(0, 3);
  const newMusic = music.tracks.slice(0, 6);

  const seenAlbums = new Set<string>();
  const albums = music.tracks
    .filter((t) => {
      if (!t.album || seenAlbums.has(t.album)) return false;
      seenAlbums.add(t.album);
      return true;
    })
    .slice(0, 3);

  const go = (route: Href) => router.push(route);

  const play = (track: Track, queue: Track[] = music.tracks) => {
    void music.playTrack(track, queue);
    void recordPlay(track);
  };

  const shufflePlay = () => {
    if (music.tracks.length === 0) return go("/library");
    play(music.tracks[Math.floor(Math.random() * music.tracks.length)]);
  };

  const openTrackOptions = (_track: Track) => {
    // Future: open track options
  };

  const requestPermissionAndScan = async () => {
    setPermissionDenied(false);
    const result = await music.scanDeviceMusic(true);
    if (!result.ok && result.reason === "denied") {
      setPermissionDenied(true);
    } else if (!result.ok && result.reason === "error") {
      go("/permissions" as Href);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setIsDrawerOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons name="menu" size={28} color={COLORS.text} />
          </Pressable>
          <Pressable onPress={() => go("/search")} style={styles.iconButton}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SCREEN_PADDING,
            paddingBottom:
              insets.bottom + (currentTrack ? MINI_PLAYER_HEIGHT + 40 : 24),
          }}
        >
          <Text style={styles.greeting}>
            {getGreeting()}
            {userName ? `, ${userName}` : ""}
          </Text>

          <View style={styles.hero}>
            <LinearGradient
              colors={[COLORS.orange, "#2A1B12"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Play with Power.</Text>
                <Text style={styles.heroSubtitle}>Feel the Music.</Text>
                <Pressable style={styles.heroButton} onPress={shufflePlay}>
                  <Ionicons
                    name="shuffle"
                    size={16}
                    color={COLORS.background}
                  />
                  <Text style={styles.heroButtonText}>Shuffle play</Text>
                </Pressable>
              </View>
              <View style={styles.heroIcon} pointerEvents="none">
                <Ionicons
                  name="headset"
                  size={80}
                  color="rgba(255,255,255,0.2)"
                />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.quickRow}>
            {QUICK_ACCESS.map((item) => (
              <Pressable
                key={item.label}
                style={styles.quickItem}
                onPress={() => go(item.route)}
              >
                <View style={styles.quickIcon}>
                  <Ionicons name={item.icon} size={24} color={COLORS.orange} />
                </View>
                <Text style={styles.quickText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader
            title="Recently played"
            onSeeAll={() => go("/recently-played")}
          />
          {recentlyPlayed.length === 0 ? (
            music.tracks.length === 0 ? (
              <EmptyBlock
                text="Nothing played yet. Grant access and pick a song to get started."
                actionLabel="Grant permission"
                onAction={requestPermissionAndScan}
                loading={music.isScanning}
              />
            ) : (
              <EmptyBlock
                text="Nothing played yet. Pick a song to get started."
                actionLabel="Open library"
                onAction={() => go("/library")}
              />
            )
          ) : (
            <View style={styles.grid}>
              {recentlyPlayed.map((track) => (
                <MediaCard
                  key={track.id}
                  width={cardWidth}
                  title={cleanFilename(track.filename)}
                  subtitle={track.artist}
                  tint={COLORS.card}
                  onPress={() => play(track)}
                />
              ))}
            </View>
          )}

          <SectionHeader title="Your playlists" />
          {yourPlaylists.length === 0 ? (
            <EmptyBlock
              text="Playlists you create will appear here."
              actionLabel="Create a playlist"
              onAction={() => go("/playlists")}
            />
          ) : (
            <View style={styles.grid}>
              {yourPlaylists.map((p) => (
                <MediaCard
                  key={p.id}
                  width={cardWidth}
                  title={p.name}
                  subtitle="Playlist"
                  tint="#3D3A22"
                  onPress={() => go(`/playlist/${p.id}`)}
                />
              ))}
            </View>
          )}

          <SectionHeader title="New music" />
          {newMusic.length === 0 ? (
            music.isScanning ? (
              <EmptyBlock
                text="Looking for music on your device…"
                actionLabel=""
                onAction={() => {}}
                loading
              />
            ) : permissionDenied ? (
              <EmptyBlock
                text="Music access is off. Grant permission to see your device's songs here."
                actionLabel="Grant permission"
                onAction={requestPermissionAndScan}
              />
            ) : music.hasScanned ? (
              <EmptyBlock
                text="No music found on this device yet. Add some songs, then rescan."
                actionLabel="Rescan device"
                onAction={requestPermissionAndScan}
              />
            ) : (
              <EmptyBlock
                text="Songs on your device will show up here."
                actionLabel="Scan my device"
                onAction={requestPermissionAndScan}
              />
            )
          ) : (
            <View style={styles.list}>
              {newMusic.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPress={() => play(track)}
                  onMore={() => openTrackOptions(track)}
                />
              ))}
            </View>
          )}

          <SectionHeader title="Albums for you" />
          {albums.length === 0 ? (
            music.tracks.length === 0 ? (
              <EmptyBlock
                text="Albums appear once your songs are scanned."
                actionLabel="Grant permission"
                onAction={requestPermissionAndScan}
                loading={music.isScanning}
              />
            ) : (
              <EmptyBlock
                text="Albums appear once your songs have album details."
                actionLabel="Open library"
                onAction={() => go("/library")}
              />
            )
          ) : (
            <View style={styles.grid}>
              {albums.map((track) => (
                <MediaCard
                  key={track.album}
                  width={cardWidth}
                  title={track.album ?? ""}
                  subtitle={track.artist}
                  tint="#3D2222"
                  onPress={() => {
                    const albumTracks = music.tracks.filter(
                      (t) => t.album === track.album
                    );
                    play(albumTracks[0] ?? track, albumTracks);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* MINI PLAYER */}
        {currentTrack && (
          <Pressable
            style={[styles.miniPlayer, { bottom: insets.bottom + 10 }]}
            onPress={() => go("/now-playing")}
          >
            <View style={styles.miniRow}>
              <Artwork size={44} radius={6} />
              <View style={styles.miniInfo}>
                <Text style={styles.miniTitle} numberOfLines={1}>
                  {cleanFilename(currentTrack.filename)}
                </Text>
                <Text style={styles.miniArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
              <Pressable onPress={() => go("/sonic")} style={styles.iconButton}>
                <Ionicons name="pulse" size={22} color={COLORS.cyan} />
              </Pressable>
              <Pressable
                onPress={() => void music.togglePlayback()}
                style={styles.iconButton}
              >
                <Ionicons
                  name={music.isPlaying ? "pause" : "play"}
                  size={26}
                  color={COLORS.orange}
                />
              </Pressable>
            </View>
          </Pressable>
        )}
      </View>

      <SideDrawer
        isVisible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(route: string) => {
          if (route !== "/home") go(route as Href);
        }}
        activeRoute="/home"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SCREEN_PADDING - 8,
    height: 56,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  greeting: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 20,
  },

  hero: { height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  heroGradient: { flex: 1, padding: 20, justifyContent: "center" },
  heroContent: { width: "65%", zIndex: 2 },
  heroTitle: { color: "#FFF", fontSize: 24, lineHeight: 28, fontWeight: "800" },
  heroSubtitle: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFF",
  },
  heroButtonText: { color: COLORS.background, fontSize: 13, fontWeight: "700" },
  heroIcon: { position: "absolute", right: -20, bottom: -20 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickItem: { alignItems: "center", gap: 8 },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { color: COLORS.text, fontSize: 12, fontWeight: "500" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  seeAll: { color: COLORS.orange, fontSize: 13, fontWeight: "600" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  cardSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  list: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 58 },
  rowText: { flex: 1, marginHorizontal: 14 },
  rowTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  rowSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 2 },

  artwork: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyBlock: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  emptyAction: { color: COLORS.orange, fontSize: 13, fontWeight: "600" },

  miniPlayer: {
    position: "absolute",
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: COLORS.elevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  miniRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  miniInfo: { flex: 1, marginHorizontal: 12 },
  miniTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  miniArtist: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});