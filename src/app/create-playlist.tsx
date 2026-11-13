import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { usePlaylists } from "../context/PlaylistContext";

const COLORS = {
  background: "#08090B",
  surface: "#121212",
  text: "#FFFFFF",
  muted: "#A0A0A0",
  orange: "#FF8500",
  border: "#222222",
};

const CLOUDINARY_CLOUD_NAME = "your_cloud_name"; // Replace
const CLOUDINARY_UPLOAD_PRESET = "your_unsigned_preset"; // Replace

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const { createPlaylist } = usePlaylists();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("Road Trip");
  const [description, setDescription] = useState("Songs for long drives");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mocking the songs list as requested by the design
  const [selectedSongs, setSelectedSongs] = useState([
    { id: "1", title: "Midnight Voltage", artist: "Nova Reyes", color: ["#2F3E46", "#1B262C"] },
    { id: "2", title: "Low Tide Signal", artist: "The Harbour Kids", color: ["#5C3A21", "#2B1B12"] },
    { id: "3", title: "Amber Static", artist: "Lena Okafor", color: ["#2B3A2F", "#142118"] },
  ]);

  const removeSong = (id: string) => {
    setSelectedSongs(selectedSongs.filter((s) => s.id !== id));
  };

  /* ---------------- Image picker ---------------- */
  const pickCover = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Allow photo access to choose a playlist cover.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;
      setCoverUri(result.assets[0].uri);
    } catch (err: any) {
      console.error("Image picker failed:", err);
      Alert.alert("Could not open gallery", err?.message ?? "Unknown error");
    }
  };

  /* ---------------- Cloudinary upload ---------------- */
  const uploadCoverToCloudinary = async (): Promise<string | null> => {
    if (!coverUri) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      const response = await fetch(coverUri);
      const blob = await response.blob();

      formData.append("file", blob, `cover_${Date.now()}.jpg`);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadResponse.json();
      if (!uploadResponse.ok || data.error) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }
      return data.secure_url;
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      Alert.alert("Upload failed", err?.message ?? "Could not upload cover.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Save ---------------- */
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your playlist a name.");
      return;
    }

    setSaving(true);
    const url = await uploadCoverToCloudinary();
    const created = await createPlaylist(name, description, url);
    setSaving(false);
    if (created) router.back();
  };

  const isBusy = saving || uploading;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Create playlist</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 40 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* COVER PICKER */}
          <View style={styles.coverWrap}>
            <Pressable onPress={pickCover} style={styles.coverPressable}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color={COLORS.orange} />
                  <Text style={styles.coverHintText}>Add cover</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.coverLoading}>
                  <ActivityIndicator color={COLORS.orange} />
                </View>
              )}
            </Pressable>
          </View>

          {/* INPUTS */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Road Trip"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Songs for long drives"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, styles.multiline]}
            multiline
          />

          {/* SONGS SECTION */}
          <View style={styles.songsHeader}>
            <Text style={styles.label}>SONGS ({selectedSongs.length})</Text>
            <Pressable onPress={() => router.push("/library")}>
              <Text style={styles.addSongsText}>Add songs</Text>
            </Pressable>
          </View>

          <View style={styles.songList}>
            {selectedSongs.map((song) => (
              <View key={song.id} style={styles.songRow}>
                <LinearGradient
                  colors={song.color as [string, string]}
                  style={styles.songArt}
                >
                  <View style={styles.circleIcon}>
                    <View style={styles.circleInner} />
                  </View>
                </LinearGradient>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
                <Pressable hitSlop={10} onPress={() => removeSong(song.id)}>
                  <Text style={styles.removeText}>—</Text>
                </Pressable>
              </View>
            ))}
          </View>

        </ScrollView>

        {/* SAVE BUTTON */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            onPress={handleSave}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.saveBtn,
              (pressed || isBusy) && { opacity: 0.7 },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color="#08090B" />
            ) : (
              <Text style={styles.saveText}>Save playlist</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 15,
  },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  
  content: { paddingHorizontal: 20 },
  
  coverWrap: { alignItems: "center", marginBottom: 24, marginTop: 10 },
  coverPressable: { position: "relative" },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  coverPlaceholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  coverHintText: { color: COLORS.orange, fontSize: 12, fontWeight: "600" },
  coverLoading: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  label: { color: COLORS.muted, fontSize: 11, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },

  songsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  addSongsText: { color: COLORS.orange, fontSize: 12, fontWeight: "700" },
  
  songList: { gap: 12 },
  songRow: { flexDirection: "row", alignItems: "center" },
  songArt: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  songInfo: { flex: 1, justifyContent: "center" },
  songTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  songArtist: { color: COLORS.muted, fontSize: 11 },
  removeText: { color: COLORS.muted, fontSize: 18, fontWeight: "bold" },

  circleIcon: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.orange, alignItems: "center", justifyContent: "center" },
  circleInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.orange },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#08090B", fontSize: 15, fontWeight: "700" },
});