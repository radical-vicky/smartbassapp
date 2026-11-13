import { Ionicons } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
  surfaceLight: "#1A1A1E",
  text: "#FFFFFF",
  muted: "#858B94",
  orange: "#FF8500",
  border: "#222222",
};

type CloudTrack = {
  id: string;
  name: string;
  size: number;
  url: string;
  isDownloaded: boolean;
  localUri?: string;
};

function formatSize(bytes: number) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function cleanName(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

const LOCAL_DIR_NAME = "cloud-music";

export default function CloudScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();
  const currentTrack = music.currentTrack;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tracks, setTracks] = useState<CloudTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
      else setLoading(false);
    })();
  }, []);

  const loadCloudTracks = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const localDir = new Directory(Paths.document, LOCAL_DIR_NAME);
      if (!localDir.exists) {
        localDir.create({ intermediates: true });
      }

      const userFolder = userEmail.replace(/[^a-zA-Z0-9._-]/g, "_");
      const { data, error } = await supabase.storage
        .from("music")
        .list(userFolder, { limit: 100 });

      if (error) {
        if (
          error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("does not exist")
        ) {
          setTracks([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const trackList: CloudTrack[] = [];

      for (const file of data || []) {
        if (!file.name.match(/\.(mp3|m4a|wav|ogg|flac)$/i)) continue;

        const { data: urlData } = supabase.storage
          .from("music")
          .getPublicUrl(`${userFolder}/${file.name}`);

        const localFile = new File(localDir, file.name);
        const isDownloaded = localFile.exists;

        trackList.push({
          id: file.id || file.name,
          name: file.name,
          size: file.metadata?.size || 0,
          url: urlData.publicUrl,
          isDownloaded,
          localUri: isDownloaded ? localFile.uri : undefined,
        });
      }

      setTracks(trackList);
    } catch (error) {
      console.error("Cloud load failed:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCloudTracks();
  }, [userEmail]);

  const handlePlay = async (track: CloudTrack) => {
    const uri = track.isDownloaded && track.localUri ? track.localUri : track.url;

    void music.playTrack(
      {
        id: track.id,
        uri,
        filename: track.name,
        duration: 0,
        artist: track.isDownloaded ? "Downloaded" : "Cloud",
        album: "Cloud Storage",
        folder: "cloud",
      },
      [
        {
          id: track.id,
          uri,
          filename: track.name,
          duration: 0,
          artist: track.isDownloaded ? "Downloaded" : "Cloud",
          album: "Cloud Storage",
          folder: "cloud",
        },
      ]
    );
    router.push("/now-playing");
  };

  const handleDownload = async (track: CloudTrack) => {
    if (track.isDownloaded) {
      Alert.alert("Already downloaded", "This file is already on your device.");
      return;
    }
    setDownloadingId(track.id);
    try {
      const localDir = new Directory(Paths.document, LOCAL_DIR_NAME);
      const localFile = new File(localDir, track.name);
      await File.downloadFileAsync(track.url, localFile);
      await loadCloudTracks();
      Alert.alert("Downloaded", `"${cleanName(track.name)}" saved offline.`);
    } catch (error) {
      console.error("Download failed:", error);
      Alert.alert("Download failed", "Could not download this file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteLocal = async (track: CloudTrack) => {
    if (!track.isDownloaded) return;
    Alert.alert("Remove download", "Delete the local copy?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const localDir = new Directory(Paths.document, LOCAL_DIR_NAME);
            const localFile = new File(localDir, track.name);
            if (localFile.exists) localFile.delete();
            await loadCloudTracks();
          } catch (e) {
            console.error("Delete failed:", e);
          }
        },
      },
    ]);
  };

  const renderTargetIcon = (size = 24) => (
    <View
      style={[
        styles.circleIcon,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.circleInner,
          { width: size / 4, height: size / 4, borderRadius: size / 8 },
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Cloud Music</Text>
        <Pressable onPress={loadCloudTracks} hitSlop={10}>
          <Ionicons name="refresh" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#2A1B12", "#14100C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="cloud" size={32} color={COLORS.orange} />
          </View>
          <Text style={styles.heroTitle}>Your Cloud Library</Text>
          <Text style={styles.heroSub}>
            {tracks.length} {tracks.length === 1 ? "file" : "files"} synced
            {userEmail ? ` · ${userEmail}` : ""}
          </Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>FILES</Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={COLORS.orange} />
            <Text style={styles.loaderText}>Loading cloud files...</Text>
          </View>
        ) : tracks.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="cloud-upload-outline"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.emptyTitle}>No cloud files yet</Text>
            <Text style={styles.emptySub}>
              Your uploaded music will appear here.
            </Text>
          </View>
        ) : (
          tracks.map((track) => (
            <Pressable
              key={track.id}
              style={styles.row}
              onPress={() => handlePlay(track)}
            >
              <LinearGradient colors={["#2F3E46", "#1B262C"]} style={styles.art}>
                {renderTargetIcon(18)}
              </LinearGradient>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {cleanName(track.name)}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {track.isDownloaded ? "Downloaded · " : ""}
                  {formatSize(track.size)}
                </Text>
              </View>
              {downloadingId === track.id ? (
                <ActivityIndicator size="small" color={COLORS.orange} />
              ) : track.isDownloaded ? (
                <Pressable
                  hitSlop={10}
                  style={{ padding: 8 }}
                  onPress={() => handleDeleteLocal(track)}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.orange}
                  />
                </Pressable>
              ) : (
                <Pressable
                  hitSlop={10}
                  style={{ padding: 8 }}
                  onPress={() => handleDownload(track)}
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={24}
                    color={COLORS.muted}
                  />
                </Pressable>
              )}
            </Pressable>
          ))
        )}
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
                {cleanName(currentTrack.filename)}
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
  content: { paddingHorizontal: 20 },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginTop: 10,
    marginBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,133,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,133,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  heroSub: { color: COLORS.muted, fontSize: 13, textAlign: "center" },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    gap: 12,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  loader: { alignItems: "center", gap: 10, paddingTop: 40 },
  loaderText: { color: COLORS.muted, fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  emptySub: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    marginHorizontal: 20,
    lineHeight: 18,
  },
  circleIcon: {
    borderWidth: 1.5,
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  circleInner: { backgroundColor: COLORS.orange },
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