import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
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

const GRADIENTS = [
  ["#2F3E46", "#1B262C"],
  ["#5C3A21", "#2B1B12"],
  ["#2B3A2F", "#142118"],
  ["#3D3A22", "#242113"],
  ["#2F223D", "#1A1324"],
  ["#223D3A", "#132421"],
];

function clean(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

export default function QueueScreen() {
  const router = useRouter();
  const music = useMusic();
  const insets = useSafeAreaInsets();

  const currentId = music.currentTrack?.id;
  const upNext = music.queue.filter((t) => t.id !== currentId);

  const renderTargetIcon = (size = 24) => (
    <View style={[styles.circleIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.circleInner, { width: size / 4, height: size / 4, borderRadius: size / 8 }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Queue</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      {/* NOW PLAYING */}
      <Text style={styles.sectionTitle}>NOW PLAYING</Text>
      {music.currentTrack && (
        <Pressable style={styles.nowRow} onPress={() => router.push("/now-playing")}>
          <LinearGradient colors={["#2A1C12", "#1A1210"]} style={styles.nowArt}>
            {renderTargetIcon(20)}
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{clean(music.currentTrack.filename)}</Text>
            <Text style={styles.sub} numberOfLines={1}>{music.currentTrack.artist}</Text>
          </View>
          <Pressable onPress={() => void music.togglePlayback()} hitSlop={8}>
            <Ionicons name={music.isPlaying ? "volume-high" : "volume-mute"} size={20} color={COLORS.orange} />
          </Pressable>
        </Pressable>
      )}

      {/* UP NEXT */}
      <View style={styles.upNextHeader}>
        <Text style={styles.sectionTitle}>UP NEXT</Text>
        {upNext.length > 0 && (
          <Pressable onPress={() => music.clearQueue()} hitSlop={8}>
            <Text style={styles.clearQueue}>Clear queue</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={upNext}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 + insets.bottom }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={40} color={COLORS.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Queue is empty</Text>
          </View>
        }
        renderItem={({ item: t, index }) => (
          <Pressable style={styles.row} onPress={() => music.playFromQueue(t.id)}>
            {/* Drag handle replaced with Play Next action */}
            <Pressable 
              hitSlop={10} 
              style={styles.dragHandle}
              onPress={() => {
                // This visually says "drag" but works as "play now" for accessibility 
                music.playFromQueue(t.id);
              }}
            >
              <Ionicons name="reorder-three" size={20} color="#444" />
            </Pressable>
            
            <LinearGradient colors={GRADIENTS[index % GRADIENTS.length] as [string, string]} style={styles.rowArt}>
              {renderTargetIcon(18)}
            </LinearGradient>
            
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{clean(t.filename)}</Text>
              <Text style={styles.sub} numberOfLines={1}>{t.artist}</Text>
            </View>
            
            <Pressable 
              hitSlop={10} 
              style={{ padding: 8 }}
              onPress={() => music.removeFromQueue(t.id)}
            >
              <Ionicons name="close" size={18} color={COLORS.muted} />
            </Pressable>
          </Pressable>
        )}
      />

      {/* FOOTER CLEAR BUTTON */}
      {upNext.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.clearBtn} onPress={() => music.clearQueue()}>
            <Text style={styles.clearBtnText}>Clear queue</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  sectionTitle: { color: COLORS.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  nowRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, padding: 12, borderRadius: 10, backgroundColor: "#15100B", gap: 12, marginBottom: 10 },
  nowArt: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  upNextHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  clearQueue: { color: COLORS.orange, fontSize: 11, fontWeight: "700", paddingRight: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  dragHandle: { width: 20, alignItems: "center", justifyContent: "center" },
  rowArt: { width: 42, height: 42, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 40 },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: COLORS.background },
  clearBtn: { height: 52, backgroundColor: "#1A1A1E", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  clearBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  circleIcon: { borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleInner: { backgroundColor: COLORS.orange },
});