
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
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

const ORANGE = "#FF7A18";
const BG = "#08090B";
const CARD = "#121417";
const MUTED = "#858990";

type Playlist = {
  id: string;
  name: string;
  tracks: string[];
  createdAt: number;
};

const artworkColors = ["#422517", "#29203D", "#18312F", "#34251C"];

export default function PlaylistsScreen() {
  const router = useRouter();
  const music = useMusic();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [playlistName, setPlaylistName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [search, setSearch] = useState("");

  const selectedPlaylist = playlists.find(
    (playlist) => playlist.id === selectedPlaylistId
  );

  const selectedTracks = useMemo(() => {
    if (!selectedPlaylist) return [];

    return selectedPlaylist.tracks
      .map((id) => music.tracks.find((track) => track.id === id))
      .filter((track): track is NonNullable<typeof track> => Boolean(track));
  }, [selectedPlaylist, music.tracks]);

  const availableTracks = useMemo(() => {
    if (!selectedPlaylist) return [];

    return music.tracks.filter((track) => {
      const alreadyAdded = selectedPlaylist.tracks.includes(track.id);
      const matchesSearch = track.filename
        .toLowerCase()
        .includes(search.toLowerCase());

      return !alreadyAdded && matchesSearch;
    });
  }, [music.tracks, selectedPlaylist, search]);

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const formatTotalDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) return `${hours} hr ${remainingMinutes} min`;
    return `${minutes} min`;
  };

  const createPlaylist = () => {
    const name = playlistName.trim();

    if (!name) {
      Alert.alert("Playlist name required", "Enter a name for your playlist.");
      return;
    }

    if (
      playlists.some(
        (playlist) => playlist.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      Alert.alert(
        "Playlist already exists",
        "Choose a different playlist name."
      );
      return;
    }

    const newPlaylist: Playlist = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      tracks: [],
      createdAt: Date.now(),
    };

    setPlaylists((current) => [newPlaylist, ...current]);
    setSelectedPlaylistId(newPlaylist.id);
    setPlaylistName("");
    setShowCreate(false);
  };

  const addTrack = (trackId: string) => {
    if (!selectedPlaylistId) return;

    setPlaylists((current) =>
      current.map((playlist) =>
        playlist.id === selectedPlaylistId
          ? {
              ...playlist,
              tracks: [...playlist.tracks, trackId],
            }
          : playlist
      )
    );
  };

  const removeTrack = (trackId: string) => {
    if (!selectedPlaylistId) return;

    setPlaylists((current) =>
      current.map((playlist) =>
        playlist.id === selectedPlaylistId
          ? {
              ...playlist,
              tracks: playlist.tracks.filter((id) => id !== trackId),
            }
          : playlist
      )
    );
  };

  const deletePlaylist = () => {
    if (!selectedPlaylist) return;

    Alert.alert(
      "Delete playlist",
      `Delete "${selectedPlaylist.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPlaylists((current) =>
              current.filter((playlist) => playlist.id !== selectedPlaylist.id)
            );
            setSelectedPlaylistId(null);
            setShowAddTracks(false);
          },
        },
      ]
    );
  };

  const playPlaylist = () => {
    if (!selectedTracks.length) {
      Alert.alert("Playlist is empty", "Add some songs before playing.");
      return;
    }

    void music.playTrack(selectedTracks[0], selectedTracks);
    router.push("/now-playing");
  };

  const playTrack = (track: (typeof music.tracks)[number]) => {
    if (!selectedPlaylist) return;

    void music.playTrack(track, selectedTracks);
    router.push("/now-playing");
  };

  const openPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowAddTracks(false);
    setSearch("");
  };

  const goBack = () => {
    if (showAddTracks) {
      setShowAddTracks(false);
      setSearch("");
      return;
    }

    if (selectedPlaylistId) {
      setSelectedPlaylistId(null);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  const totalDuration = selectedTracks.reduce(
    (total, track) => total + (track.duration || 0),
    0
  );

  const totalPlaylistTracks = playlists.reduce(
    (total, playlist) => total + playlist.tracks.length,
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={23} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitle}>
            <Text style={styles.eyebrow}>YOUR MUSIC COLLECTION</Text>
            <Text style={styles.heading}>
              {showAddTracks
                ? "Add Songs"
                : selectedPlaylist
                  ? selectedPlaylist.name
                  : "Playlists"}
            </Text>
          </View>

          {selectedPlaylist && !showAddTracks ? (
            <Pressable
              style={styles.headerAction}
              onPress={deletePlaylist}
            >
              <Ionicons name="trash-outline" size={19} color="#F07878" />
            </Pressable>
          ) : (
            <Pressable
              style={styles.headerAction}
              onPress={() => {
                setShowCreate(true);
                setSelectedPlaylistId(null);
                setShowAddTracks(false);
              }}
            >
              <Ionicons name="add" size={25} color={ORANGE} />
            </Pressable>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Create playlist form */}
          {showCreate && (
            <View style={styles.createCard}>
              <View style={styles.createHeader}>
                <Text style={styles.createTitle}>Create a playlist</Text>
                <Pressable onPress={() => setShowCreate(false)}>
                  <Ionicons name="close" size={21} color={MUTED} />
                </Pressable>
              </View>

              <TextInput
                value={playlistName}
                onChangeText={setPlaylistName}
                placeholder="Give your playlist a name"
                placeholderTextColor="#656A72"
                style={styles.nameInput}
                maxLength={45}
                returnKeyType="done"
                onSubmitEditing={createPlaylist}
              />

              <Pressable style={styles.createButton} onPress={createPlaylist}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>CREATE PLAYLIST</Text>
              </Pressable>
            </View>
          )}

          {/* Playlist list */}
          {!selectedPlaylist && !showAddTracks && (
            <>
              <LinearGradient
                colors={["#28190F", "#17120F", "#111316"]}
                style={styles.hero}
              >
                <View style={styles.heroTop}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name="albums-outline"
                      size={25}
                      color={ORANGE}
                    />
                  </View>

                  <Text style={styles.heroLabel}>YOUR COLLECTION</Text>
                </View>

                <Text style={styles.heroTitle}>
                  Music, your{"\n"}
                  <Text style={styles.orangeText}>way.</Text>
                </Text>

                <Text style={styles.heroDescription}>
                  Build collections for every mood, moment and sound.
                </Text>

                <View style={styles.heroStats}>
                  <View>
                    <Text style={styles.heroStatValue}>
                      {playlists.length}
                    </Text>
                    <Text style={styles.heroStatLabel}>PLAYLISTS</Text>
                  </View>

                  <View style={styles.heroStatDivider} />

                  <View>
                    <Text style={styles.heroStatValue}>
                      {totalPlaylistTracks}
                    </Text>
                    <Text style={styles.heroStatLabel}>SONGS SAVED</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>YOUR PLAYLISTS</Text>
                <Text style={styles.sectionCaption}>
                  {playlists.length} COLLECTIONS
                </Text>
              </View>

              {playlists.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="musical-notes-outline"
                      size={34}
                      color={ORANGE}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    Your collection starts here
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Create your first playlist and bring your favorite tracks
                    together.
                  </Text>

                  <Pressable
                    style={styles.emptyButton}
                    onPress={() => setShowCreate(true)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.emptyButtonText}>
                      CREATE PLAYLIST
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.playlistGrid}>
                  {playlists.map((playlist, index) => {
                    const firstTrack = music.tracks.find((track) =>
                      playlist.tracks.includes(track.id)
                    );

                    return (
                      <Pressable
                        key={playlist.id}
                        style={styles.playlistCard}
                        onPress={() => openPlaylist(playlist.id)}
                      >
                        <LinearGradient
                          colors={[
                            artworkColors[index % artworkColors.length],
                            "#15171A",
                          ]}
                          style={styles.playlistArtwork}
                        >
                          <Ionicons
                            name="musical-notes"
                            size={34}
                            color="#F4B17C"
                          />

                          <View style={styles.artworkCount}>
                            <Text style={styles.artworkCountText}>
                              {playlist.tracks.length}
                            </Text>
                          </View>
                        </LinearGradient>

                        <View style={styles.playlistDetails}>
                          <Text numberOfLines={1} style={styles.playlistName}>
                            {playlist.name}
                          </Text>

                          <Text style={styles.playlistMeta}>
                            {playlist.tracks.length}{" "}
                            {playlist.tracks.length === 1 ? "song" : "songs"}
                          </Text>

                          {firstTrack && (
                            <Text numberOfLines={1} style={styles.playlistHint}>
                              {firstTrack.filename.replace(/\.[^/.]+$/, "")}
                            </Text>
                          )}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={MUTED}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Playlist detail */}
          {selectedPlaylist && !showAddTracks && (
            <>
              <LinearGradient
                colors={["#382015", "#21160F", "#111316"]}
                style={styles.detailHero}
              >
                <View style={styles.detailArtwork}>
                  <Ionicons
                    name="musical-notes"
                    size={55}
                    color={ORANGE}
                  />
                </View>

                <Text style={styles.detailName}>
                  {selectedPlaylist.name}
                </Text>

                <Text style={styles.detailMeta}>
                  {selectedTracks.length} songs ·{" "}
                  {formatTotalDuration(totalDuration)}
                </Text>

                <View style={styles.detailActions}>
                  <Pressable
                    style={styles.playAllButton}
                    onPress={playPlaylist}
                  >
                    <Ionicons
                      name="play"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.playAllText}>PLAY ALL</Text>
                  </Pressable>

                  <Pressable
                    style={styles.addTrackButton}
                    onPress={() => setShowAddTracks(true)}
                  >
                    <Ionicons name="add" size={23} color={ORANGE} />
                  </Pressable>
                </View>
              </LinearGradient>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TRACKS</Text>
                <Text style={styles.sectionCaption}>
                  {selectedTracks.length} SONGS
                </Text>
              </View>

              {selectedTracks.length === 0 ? (
                <View style={styles.emptyTracks}>
                  <Ionicons
                    name="musical-note-outline"
                    size={30}
                    color={MUTED}
                  />
                  <Text style={styles.emptyTracksTitle}>No songs yet</Text>
                  <Text style={styles.emptyTracksText}>
                    Add music from your device to this playlist.
                  </Text>

                  <Pressable
                    style={styles.addFirstButton}
                    onPress={() => setShowAddTracks(true)}
                  >
                    <Text style={styles.addFirstText}>ADD SONGS</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.trackList}>
                  {selectedTracks.map((track, index) => {
                    const isCurrent = music.currentTrack?.id === track.id;

                    return (
                      <View key={track.id} style={styles.trackRow}>
                        <Pressable
                          style={styles.trackMain}
                          onPress={() => playTrack(track)}
                        >
                          <View
                            style={[
                              styles.trackNumber,
                              isCurrent && styles.trackNumberActive,
                            ]}
                          >
                            {isCurrent && music.isPlaying ? (
                              <Ionicons
                                name="volume-high"
                                size={16}
                                color={ORANGE}
                              />
                            ) : (
                              <Text style={styles.trackNumberText}>
                                {String(index + 1).padStart(2, "0")}
                              </Text>
                            )}
                          </View>

                          <View style={styles.trackInfo}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.trackTitle,
                                isCurrent && styles.trackTitleActive,
                              ]}
                            >
                              {track.filename.replace(/\.[^/.]+$/, "")}
                            </Text>
                            <Text style={styles.trackArtist}>
                              LOCAL AUDIO
                            </Text>
                          </View>

                          <Text style={styles.trackDuration}>
                            {formatDuration(track.duration)}
                          </Text>
                        </Pressable>

                        <Pressable
                          hitSlop={10}
                          style={styles.removeButton}
                          onPress={() => removeTrack(track.id)}
                        >
                          <Ionicons
                            name="close-circle-outline"
                            size={19}
                            color="#777B82"
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Add tracks */}
          {selectedPlaylist && showAddTracks && (
            <>
              <View style={styles.addIntro}>
                <Text style={styles.addIntroTitle}>Add music</Text>
                <Text style={styles.addIntroDescription}>
                  Choose songs from your device for{" "}
                  <Text style={styles.orangeText}>
                    {selectedPlaylist.name}
                  </Text>
                  .
                </Text>
              </View>

              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={MUTED}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search your music..."
                  placeholderTextColor="#656A72"
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={18} color={MUTED} />
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AVAILABLE SONGS</Text>
                <Text style={styles.sectionCaption}>
                  {availableTracks.length} AVAILABLE
                </Text>
              </View>

              {availableTracks.length === 0 ? (
                <View style={styles.emptyTracks}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={30}
                    color={ORANGE}
                  />
                  <Text style={styles.emptyTracksTitle}>
                    No more songs to add
                  </Text>
                  <Text style={styles.emptyTracksText}>
                    Scan your library or try another search.
                  </Text>
                </View>
              ) : (
                <View style={styles.trackList}>
                  {availableTracks.map((track, index) => (
                    <View key={track.id} style={styles.trackRow}>
                      <View style={styles.trackMain}>
                        <View style={styles.trackNumber}>
                          <Text style={styles.trackNumberText}>
                            {String(index + 1).padStart(2, "0")}
                          </Text>
                        </View>

                        <View style={styles.trackInfo}>
                          <Text numberOfLines={1} style={styles.trackTitle}>
                            {track.filename.replace(/\.[^/.]+$/, "")}
                          </Text>
                          <Text style={styles.trackArtist}>
                            LOCAL AUDIO · {formatDuration(track.duration)}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={styles.addSongButton}
                        onPress={() => addTrack(track.id)}
                      >
                        <Ionicons name="add" size={22} color={ORANGE} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 115 }} />
        </ScrollView>

        {/* Mini player */}
        {music.currentTrack && (
          <Pressable
            style={styles.miniPlayer}
            onPress={() => router.push("/now-playing")}
          >
            <View style={styles.miniArtwork}>
              <Ionicons name="musical-note" size={19} color={ORANGE} />
            </View>

            <View style={styles.miniInfo}>
              <Text numberOfLines={1} style={styles.miniTitle}>
                {music.currentTrack.filename.replace(/\.[^/.]+$/, "")}
              </Text>
              <Text style={styles.miniSubtitle}>LOCAL AUDIO</Text>
            </View>

            <Pressable
              hitSlop={12}
              onPress={(event) => {
                event.stopPropagation();
                music.togglePlayback();
              }}
              style={styles.miniPlay}
            >
              <Ionicons
                name={music.isPlaying ? "pause" : "play"}
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </Pressable>
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
            active
            onPress={() => router.replace("/library")}
          />
          <NavItem
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      <Ionicons
        name={icon}
        size={21}
        color={active ? ORANGE : "#777B82"}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#191B1F",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#15171A",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 13,
  },
  eyebrow: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 3,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1B1714",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  createCard: {
    padding: 16,
    backgroundColor: "#17120F",
    borderWidth: 1,
    borderColor: "#493020",
    borderRadius: 16,
    marginBottom: 20,
  },
  createHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  createTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  nameInput: {
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#37302A",
    backgroundColor: "#0D0F11",
    color: "#FFFFFF",
    fontSize: 12,
  },
  createButton: {
    height: 45,
    backgroundColor: ORANGE,
    borderRadius: 10,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  hero: {
    borderRadius: 18,
    padding: 21,
    borderWidth: 1,
    borderColor: "#493020",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FF7A181A",
    justifyContent: "center",
    alignItems: "center",
  },
  heroLabel: {
    color: "#B8A18D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "900",
    marginTop: 20,
  },
  orangeText: {
    color: ORANGE,
  },
  heroDescription: {
    color: "#A5A1A0",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 260,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    marginTop: 23,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#493020",
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "#A98A72",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 5,
  },
  heroStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#493020",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#E7E8EA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sectionCaption: {
    color: "#666B73",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  emptyState: {
    paddingHorizontal: 22,
    paddingVertical: 33,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#25282D",
    alignItems: "center",
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: "#FF7A1818",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 17,
  },
  emptyDescription: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 250,
  },
  emptyButton: {
    height: 43,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 19,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  playlistGrid: {
    gap: 10,
  },
  playlistCard: {
    minHeight: 88,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#25282D",
    backgroundColor: CARD,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playlistArtwork: {
    width: 65,
    height: 65,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  artworkCount: {
    position: "absolute",
    right: 5,
    bottom: 5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#08090B",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  artworkCountText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
  },
  playlistDetails: {
    flex: 1,
  },
  playlistName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  playlistMeta: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 5,
  },
  playlistHint: {
    color: MUTED,
    fontSize: 9,
    marginTop: 5,
  },
  detailHero: {
    alignItems: "center",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#493020",
  },
  detailArtwork: {
    width: 135,
    height: 135,
    borderRadius: 19,
    backgroundColor: "#3B2418",
    borderWidth: 1,
    borderColor: "#75411F",
    justifyContent: "center",
    alignItems: "center",
  },
  detailName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 19,
  },
  detailMeta: {
    color: "#B8A18D",
    fontSize: 10,
    marginTop: 7,
  },
  detailActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 21,
  },
  playAllButton: {
    height: 45,
    paddingHorizontal: 22,
    borderRadius: 11,
    backgroundColor: ORANGE,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playAllText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  addTrackButton: {
    width: 45,
    height: 45,
    borderRadius: 11,
    backgroundColor: "#2A1D14",
    borderWidth: 1,
    borderColor: "#70401F",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTracks: {
    padding: 25,
    borderRadius: 15,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#25282D",
    alignItems: "center",
  },
  emptyTracksTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyTracksText: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
  },
  addFirstButton: {
    marginTop: 15,
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: "#382015",
  },
  addFirstText: {
    color: ORANGE,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  trackList: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#25282D",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  trackRow: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#25282D",
  },
  trackMain: {
    flex: 1,
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  trackNumber: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: "#202328",
    justifyContent: "center",
    alignItems: "center",
  },
  trackNumberActive: {
    backgroundColor: "#332116",
  },
  trackNumberText: {
    color: "#92969E",
    fontSize: 9,
    fontWeight: "800",
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: "#E9EAEC",
    fontSize: 11,
    fontWeight: "800",
  },
  trackTitleActive: {
    color: ORANGE,
  },
  trackArtist: {
    color: MUTED,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 5,
  },
  trackDuration: {
    color: "#A0A4AA",
    fontSize: 9,
    marginRight: 7,
  },
  removeButton: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  addSongButton: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: "#332116",
    justifyContent: "center",
    alignItems: "center",
  },
  addIntro: {
    padding: 17,
    backgroundColor: "#17120F",
    borderWidth: 1,
    borderColor: "#493020",
    borderRadius: 15,
  },
  addIntroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  addIntroDescription: {
    color: "#A5A1A0",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
  searchBox: {
    height: 48,
    paddingHorizontal: 13,
    marginTop: 15,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#292D32",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 0,
  },
  miniPlayer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 75,
    height: 62,
    backgroundColor: "#1A1C20",
    borderWidth: 1,
    borderColor: "#303238",
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  miniArtwork: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#332116",
    justifyContent: "center",
    alignItems: "center",
  },
  miniInfo: {
    flex: 1,
  },
  miniTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  miniSubtitle: {
    color: ORANGE,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  miniPlay: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    height: 67,
    paddingHorizontal: 12,
    backgroundColor: "#0D0F11",
    borderTopWidth: 1,
    borderTopColor: "#202226",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  navLabel: {
    color: "#777B82",
    fontSize: 9,
    fontWeight: "700",
  },
  navLabelActive: {
    color: ORANGE,
  },
});
