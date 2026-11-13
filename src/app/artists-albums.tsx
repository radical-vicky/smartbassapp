
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppPressable as Pressable } from "../components/AppPressable";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMusic } from "../context/MusicContext";

const COLORS = {
  background: "#08090B",
  surface: "#111316",
  border: "#24282D",
  text: "#F5F5F5",
  muted: "#858B94",
  orange: "#FF8A24",
};

type LibraryView = "ARTISTS" | "ALBUMS";

function cleanFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function deriveCollectionName(filename: string, kind: "artist" | "album") {
  const cleaned = cleanFilename(filename);

  if (!cleaned) {
    return kind === "artist" ? "Local artist" : "Local collection";
  }

  const stripped = cleaned
    .replace(/\b(official|live|radio|mix|edit|acoustic|instrumental|remastered|demo)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const separatorMatch = stripped.match(/^(.+?)\s*[-–—]\s*(.+)$/);

  if (separatorMatch) {
    const value =
      kind === "artist" ? separatorMatch[1] : separatorMatch[2];

    const normalized = value.trim();

    if (
      normalized &&
      !/^(?:\d+|unknown|untitled|local|track)$/i.test(normalized)
    ) {
      return normalized;
    }
  }

  const fromWords = stripped.split(/\s+/).slice(0, 2).join(" ");

  return fromWords || (kind === "artist" ? "Local artist" : "Local collection");
}

export default function ArtistsAlbumsScreen() {
  const router = useRouter();
  const music = useMusic();

  const [view, setView] = useState<LibraryView>("ARTISTS");
  const [search, setSearch] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return music.tracks;

    return music.tracks.filter((track) =>
      cleanFilename(track.filename).toLowerCase().includes(query)
    );
  }, [music.tracks, search]);

  const artistGroups = useMemo(() => {
    const groups = new Map<string, typeof music.tracks>();

    for (const track of music.tracks) {
      const label = deriveCollectionName(track.filename, "artist");
      const current = groups.get(label) ?? [];
      current.push(track);
      groups.set(label, current);
    }

    return Array.from(groups.entries())
      .map(([name, tracks]) => ({ name, tracks }))
      .sort((left, right) => {
        const diff = right.tracks.length - left.tracks.length;
        return diff !== 0 ? diff : left.name.localeCompare(right.name);
      });
  }, [music.tracks]);

  const albumGroups = useMemo(() => {
    const groups = new Map<string, typeof music.tracks>();

    for (const track of music.tracks) {
      const label = deriveCollectionName(track.filename, "album");
      const current = groups.get(label) ?? [];
      current.push(track);
      groups.set(label, current);
    }

    return Array.from(groups.entries())
      .map(([name, tracks]) => ({ name, tracks }))
      .sort((left, right) => {
        const diff = right.tracks.length - left.tracks.length;
        return diff !== 0 ? diff : left.name.localeCompare(right.name);
      });
  }, [music.tracks]);

  const collectionGroups = view === "ARTISTS" ? artistGroups : albumGroups;

  const selectedGroupTracks = useMemo(() => {
    if (!selectedGroupName) {
      return [] as (typeof music.tracks)[number][];
    }

    const group = collectionGroups.find((entry) => entry.name === selectedGroupName);
    return group ? group.tracks : [];
  }, [collectionGroups, selectedGroupName]);

  const playTrack = (track: (typeof music.tracks)[number]) => {
    void music.playTrack(track, music.tracks);
    router.push("/now-playing");
  };

  const playGroup = (tracks: typeof music.tracks) => {
    if (!tracks.length) {
      return;
    }

    void music.playTrack(tracks[0], tracks);
    router.push("/now-playing");
  };

  const shuffleGroup = (tracks: typeof music.tracks) => {
    if (!tracks.length) {
      return;
    }

    const shuffled = [...tracks].sort(() => Math.random() - 0.5);

    void music.playTrack(shuffled[0], shuffled);
    router.push("/now-playing");
  };

  const queueGroup = (tracks: typeof music.tracks) => {
    if (!tracks.length) {
      return;
    }

    music.queueTracks(tracks);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: music.currentTrack ? 175 : 100 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/home")
              }
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={21} color={COLORS.text} />
            </Pressable>

            <View style={styles.headerInfo}>
              <Text style={styles.eyebrow}>YOUR MUSIC COLLECTION</Text>
              <Text style={styles.title}>Artists & Albums</Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="albums-outline"
                size={22}
                color={COLORS.orange}
              />
            </View>
          </View>

          {/* Collection overview */}
          <LinearGradient
            colors={["#291A11", "#18130F", "#111316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <Ionicons
                name="disc-outline"
                size={27}
                color={COLORS.orange}
              />
            </View>

            <Text style={styles.heroTitle}>Explore your sound</Text>
            <Text style={styles.heroDescription}>
              Browse your personal music collection and discover your favorite
              tracks.
            </Text>

            <View style={styles.heroStats}>
              <View>
                <Text style={styles.statNumber}>{music.tracks.length}</Text>
                <Text style={styles.statLabel}>LOCAL TRACKS</Text>
              </View>

              <View style={styles.statDivider} />

              <View>
                <Text style={styles.statNumber}>{artistGroups.length}</Text>
                <Text style={styles.statLabel}>ARTISTS</Text>
              </View>

              <View style={styles.statDivider} />

              <View>
                <Text style={styles.statNumber}>{albumGroups.length}</Text>
                <Text style={styles.statLabel}>ALBUMS</Text>
              </View>
            </View>
          </LinearGradient>

          {/* View selector */}
          <View style={styles.segment}>
            <Pressable
              onPress={() => {
                setSelectedGroupName(null);
                setView("ARTISTS");
              }}
              style={[
                styles.segmentButton,
                view === "ARTISTS" && styles.segmentButtonActive,
              ]}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={view === "ARTISTS" ? COLORS.orange : COLORS.muted}
              />
              <Text
                style={[
                  styles.segmentText,
                  view === "ARTISTS" && styles.segmentTextActive,
                ]}
              >
                Artists
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedGroupName(null);
                setView("ALBUMS");
              }}
              style={[
                styles.segmentButton,
                view === "ALBUMS" && styles.segmentButtonActive,
              ]}
            >
              <Ionicons
                name="albums-outline"
                size={16}
                color={view === "ALBUMS" ? COLORS.orange : COLORS.muted}
              />
              <Text
                style={[
                  styles.segmentText,
                  view === "ALBUMS" && styles.segmentTextActive,
                ]}
              >
                Albums
              </Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color={COLORS.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your local tracks..."
              placeholderTextColor="#686E76"
              style={styles.searchInput}
              returnKeyType="search"
              selectionColor={COLORS.orange}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={10}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.muted}
                />
              </Pressable>
            )}
          </View>

          {/* Metadata notice */}
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={COLORS.orange}
            />
            <Text style={styles.noticeText}>
              Artist and album details require audio metadata extraction.
              Your current scanner has not collected that information yet.
            </Text>
          </View>

          {/* Current view */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {selectedGroupName
                  ? selectedGroupName
                  : view === "ARTISTS"
                    ? "Artist collection"
                    : "Album collection"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {selectedGroupName
                  ? `${selectedGroupTracks.length} ${selectedGroupTracks.length === 1 ? "track" : "tracks"}`
                  : view === "ARTISTS"
                    ? "Organize tracks by artist"
                    : "Organize tracks by album"}
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedGroupName(null)}
              disabled={!selectedGroupName}
              style={[
                styles.metadataBadge,
                !selectedGroupName && styles.metadataBadgeMuted,
              ]}
            >
              <Text style={styles.metadataBadgeText}>
                {selectedGroupName ? "BACK TO GROUPS" : view === "ARTISTS" ? "FALLBACK GROUPING" : "FILE-BASED GROUPS"}
              </Text>
            </Pressable>
          </View>

          {selectedGroupName ? (
            <View style={styles.collectionList}>
              <View style={styles.groupActions}>
                <Pressable
                  onPress={() => playGroup(selectedGroupTracks)}
                  style={styles.playAllButton}
                >
                  <Ionicons name="play" size={14} color={COLORS.text} />
                  <Text style={styles.playAllText}>Play all</Text>
                </Pressable>

                <Pressable
                  onPress={() => queueGroup(selectedGroupTracks)}
                  style={styles.playAllButton}
                >
                  <Ionicons name="add-circle-outline" size={14} color={COLORS.text} />
                  <Text style={styles.playAllText}>Queue</Text>
                </Pressable>

                <Pressable
                  onPress={() => shuffleGroup(selectedGroupTracks)}
                  style={styles.playAllButton}
                >
                  <Ionicons name="shuffle" size={14} color={COLORS.text} />
                  <Text style={styles.playAllText}>Shuffle</Text>
                </Pressable>
              </View>

              {selectedGroupTracks.map((track, index) => {
                const active = music.currentTrack?.id === track.id;

                return (
                  <Pressable
                    key={`${selectedGroupName}-${track.id}`}
                    onPress={() => playTrack(track)}
                    style={({ pressed }) => [
                      styles.trackRow,
                      pressed && styles.trackPressed,
                    ]}
                  >
                    <Text style={styles.trackIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>

                    <View
                      style={[
                        styles.trackArtwork,
                        active && styles.trackArtworkActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          active && music.isPlaying
                            ? "volume-high"
                            : "musical-note"
                        }
                        size={18}
                        color={active ? COLORS.orange : "#A0A5AD"}
                      />
                    </View>

                    <View style={styles.trackInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.trackTitle,
                          active && styles.activeTrackTitle,
                        ]}
                      >
                        {cleanFilename(track.filename)}
                      </Text>
                      <Text style={styles.trackArtist}>Local audio</Text>
                    </View>

                    <Text style={styles.duration}>
                      {formatDuration(track.duration)}
                    </Text>

                    <Ionicons
                      name="play-outline"
                      size={19}
                      color={COLORS.muted}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : collectionGroups.length > 0 ? (
            <View style={styles.collectionList}>
              {collectionGroups.slice(0, 8).map((group) => (
                <View key={group.name} style={styles.collectionRowWrap}>
                  <Pressable
                    onPress={() => setSelectedGroupName(group.name)}
                    style={({ pressed }) => [
                      styles.collectionRow,
                      pressed && styles.trackPressed,
                    ]}
                  >
                    <View style={styles.collectionArtwork}>
                      <Ionicons
                        name={
                          view === "ARTISTS" ? "people-outline" : "disc-outline"
                        }
                        size={18}
                        color={COLORS.orange}
                      />
                    </View>

                    <View style={styles.collectionInfo}>
                      <Text style={styles.collectionTitle}>{group.name}</Text>
                      <Text style={styles.collectionSubtitle}>
                        {group.tracks.length}{" "}
                        {group.tracks.length === 1 ? "track" : "tracks"}
                      </Text>
                    </View>

                    <View style={styles.collectionMeta}>
                      <Text style={styles.collectionCount}>
                        {group.tracks.length}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={COLORS.muted}
                      />
                    </View>
                  </Pressable>

                  <View style={styles.collectionActions}>
                    <Pressable
                      onPress={() => playGroup(group.tracks)}
                      style={styles.collectionPlay}
                      hitSlop={8}
                    >
                      <Ionicons name="play" size={14} color={COLORS.text} />
                    </Pressable>

                    <Pressable
                      onPress={() => queueGroup(group.tracks)}
                      style={styles.collectionPlay}
                      hitSlop={8}
                    >
                      <Ionicons name="add" size={14} color={COLORS.text} />
                    </Pressable>

                    <Pressable
                      onPress={() => shuffleGroup(group.tracks)}
                      style={styles.collectionPlay}
                      hitSlop={8}
                    >
                      <Ionicons name="shuffle" size={14} color={COLORS.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyMetadata}>
              <View style={styles.emptyArtwork}>
                <Ionicons
                  name={view === "ARTISTS" ? "people-outline" : "disc-outline"}
                  size={32}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {view === "ARTISTS"
                  ? "No artist groups yet"
                  : "No album groups yet"}
              </Text>

              <Text style={styles.emptyDescription}>
                Your local library is empty right now. Add some tracks and this
                collection will start organizing itself.
              </Text>
            </View>
          )}

          {/* Available local tracks */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your available tracks</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredTracks.length}{" "}
                {filteredTracks.length === 1 ? "track" : "tracks"}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/library")}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Library</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={COLORS.orange}
              />
            </Pressable>
          </View>

          {filteredTracks.length > 0 ? (
            <View style={styles.trackList}>
              {filteredTracks.slice(0, 30).map((track, index) => {
                const active = music.currentTrack?.id === track.id;

                return (
                  <Pressable
                    key={track.id}
                    onPress={() => playTrack(track)}
                    style={({ pressed }) => [
                      styles.trackRow,
                      pressed && styles.trackPressed,
                    ]}
                  >
                    <Text style={styles.trackIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>

                    <View
                      style={[
                        styles.trackArtwork,
                        active && styles.trackArtworkActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          active && music.isPlaying
                            ? "volume-high"
                            : "musical-note"
                        }
                        size={18}
                        color={active ? COLORS.orange : "#A0A5AD"}
                      />
                    </View>

                    <View style={styles.trackInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.trackTitle,
                          active && styles.activeTrackTitle,
                        ]}
                      >
                        {cleanFilename(track.filename)}
                      </Text>
                      <Text style={styles.trackArtist}>Local audio</Text>
                    </View>

                    <Text style={styles.duration}>
                      {formatDuration(track.duration)}
                    </Text>

                    <Ionicons
                      name="play-outline"
                      size={19}
                      color={COLORS.muted}
                    />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.noTracks}>
              <Ionicons
                name="musical-notes-outline"
                size={27}
                color={COLORS.muted}
              />
              <Text style={styles.noTracksText}>
                {search.trim()
                  ? "No matching tracks found."
                  : "Your local music library is empty."}
              </Text>

              <Pressable onPress={() => router.push("/library")}>
                <Text style={styles.libraryLink}>Open music library</Text>
              </Pressable>
            </View>
          )}

          {filteredTracks.length > 30 && (
            <Pressable
              onPress={() => router.push("/library")}
              style={styles.moreTracks}
            >
              <Text style={styles.moreTracksText}>
                View all {filteredTracks.length} tracks
              </Text>
              <Ionicons
                name="arrow-forward"
                size={15}
                color={COLORS.orange}
              />
            </Pressable>
          )}
        </ScrollView>

        {/* Mini player */}
        {music.currentTrack && (
          <View style={styles.miniPlayer}>
            <Pressable
              onPress={() => router.push("/now-playing")}
              style={styles.miniInfo}
            >
              <View style={styles.miniArtwork}>
                <Ionicons
                  name="musical-notes"
                  size={18}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.miniText}>
                <Text style={styles.miniTitle} numberOfLines={1}>
                  {cleanFilename(music.currentTrack.filename)}
                </Text>
                <Text style={styles.miniSubtitle}>RADEV SONIC PLAYER</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => void music.togglePlayback()}
              style={styles.miniControl}
              hitSlop={8}
            >
              <Ionicons
                name={music.isPlaying ? "pause" : "play"}
                size={23}
                color={COLORS.text}
              />
            </Pressable>

            <Pressable
              onPress={() => void music.playNext()}
              style={styles.miniControl}
              hitSlop={8}
            >
              <Ionicons
                name="play-skip-forward"
                size={21}
                color={COLORS.text}
              />
            </Pressable>
          </View>
        )}

        {/* Bottom navigation */}
        <View style={styles.bottomNav}>
          <NavItem
            icon="home-outline"
            label="Home"
            onPress={() => router.replace("/home")}
          />
          <NavItem
            icon="compass-outline"
            label="Explore"
            onPress={() => router.replace("/explore")}
          />
          <NavItem
            icon="library-outline"
            label="Library"
            onPress={() => router.replace("/library")}
          />
          <NavItem
            icon="options-outline"
            label="Sonic"
            onPress={() => router.replace("/sonic")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <Ionicons name={icon} size={21} color="#737982" />
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 23,
  },
  backButton: {
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.orange,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: "#21170F",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#49301F",
    padding: 18,
    marginBottom: 22,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#382316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
  },
  heroDescription: {
    color: "#A69A91",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 275,
  },
  heroStats: {
    borderTopWidth: 1,
    borderTopColor: "#403027",
    marginTop: 19,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: 29,
    backgroundColor: "#41352D",
  },
  segment: {
    height: 48,
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 17,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  segmentButtonActive: {
    backgroundColor: "#2A1C13",
  },
  segmentText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: COLORS.orange,
  },
  searchBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    paddingVertical: 0,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#19150F",
    borderWidth: 1,
    borderColor: "#44301F",
    borderRadius: 11,
    padding: 12,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    color: "#B8A99C",
    fontSize: 10,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  metadataBadge: {
    backgroundColor: "#1B1D20",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metadataBadgeMuted: {
    opacity: 0.7,
  },
  metadataBadgeText: {
    color: "#9A9FA7",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyMetadata: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 21,
    alignItems: "center",
    marginBottom: 27,
  },
  emptyArtwork: {
    width: 67,
    height: 67,
    borderRadius: 21,
    backgroundColor: "#2B1D13",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 275,
  },
  collectionList: {
    gap: 8,
    marginBottom: 27,
  },
  collectionRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionRow: {
    flex: 1,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  collectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionPlay: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#2A1C13",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A2B18",
  },
  collectionArtwork: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#241B17",
    alignItems: "center",
    justifyContent: "center",
  },
  collectionInfo: {
    flex: 1,
    minWidth: 0,
  },
  collectionTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  collectionSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },
  collectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  collectionCount: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: "800",
  },
  groupActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  playAllButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2A1C13",
    borderWidth: 1,
    borderColor: "#4A2B18",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playAllText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingLeft: 8,
  },
  viewAllText: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: "800",
  },
  trackList: {
    gap: 5,
  },
  trackRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 11,
  },
  trackPressed: {
    backgroundColor: "#17191D",
  },
  trackIndex: {
    width: 20,
    color: "#69717A",
    fontSize: 9,
    fontVariant: ["tabular-nums"],
  },
  trackArtwork: {
    width: 43,
    height: 43,
    borderRadius: 9,
    backgroundColor: "#211B16",
    alignItems: "center",
    justifyContent: "center",
  },
  trackArtworkActive: {
    backgroundColor: "#342015",
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: "#E8E9EB",
    fontSize: 11,
    fontWeight: "700",
  },
  activeTrackTitle: {
    color: COLORS.orange,
  },
  trackArtist: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 5,
  },
  duration: {
    color: COLORS.muted,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  noTracks: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  noTracksText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  libraryLink: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: "800",
  },
  moreTracks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 17,
  },
  moreTracksText: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: "800",
  },
  miniPlayer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 77,
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: "#191B1F",
    borderWidth: 1,
    borderColor: "#34383E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },
  miniInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniArtwork: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#302015",
    alignItems: "center",
    justifyContent: "center",
  },
  miniText: {
    flex: 1,
    minWidth: 0,
  },
  miniTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  miniSubtitle: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 4,
    letterSpacing: 0.7,
  },
  miniControl: {
    width: 35,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 69,
    backgroundColor: "#0D0F12",
    borderTopWidth: 1,
    borderTopColor: "#202328",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 9,
    paddingBottom: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  navLabel: {
    color: "#737982",
    fontSize: 9,
    fontWeight: "600",
  },
});
