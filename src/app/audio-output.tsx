
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
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

type OutputDevice = {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const outputDevices: OutputDevice[] = [
  {
    id: "automatic",
    name: "Automatic",
    description: "Use your Android system audio output",
    icon: "phone-portrait-outline",
  },
  {
    id: "headphones",
    name: "Headphones",
    description: "Wired or wireless headphones",
    icon: "headset-outline",
  },
  {
    id: "speaker",
    name: "Phone Speaker",
    description: "Built-in device speaker",
    icon: "volume-high-outline",
  },
  {
    id: "bluetooth",
    name: "Bluetooth Audio",
    description: "Bluetooth speakers and audio devices",
    icon: "bluetooth-outline",
  },
];

export default function AudioOutputScreen() {
  const router = useRouter();
  const music = useMusic();

  const [selectedOutput, setSelectedOutput] = useState("automatic");
  const [audioFocus, setAudioFocus] = useState(true);
  const [reduceInterruptions, setReduceInterruptions] = useState(false);
  const [monoAudio, setMonoAudio] = useState(false);

  const activeOutput =
    outputDevices.find((device) => device.id === selectedOutput) ??
    outputDevices[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/home")
            }
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={23} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitle}>
            <Text style={styles.eyebrow}>PLAYBACK SETTINGS</Text>
            <Text style={styles.heading}>Audio Output</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="volume-high-outline" size={21} color={ORANGE} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Active output */}
          <LinearGradient
            colors={["#291A10", "#17120F", "#111316"]}
            style={styles.activeCard}
          >
            <View style={styles.activeTop}>
              <View style={styles.activeIcon}>
                <Ionicons
                  name={activeOutput.icon}
                  size={29}
                  color={ORANGE}
                />
              </View>

              <View style={styles.connectedBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.connectedText}>SYSTEM MANAGED</Text>
              </View>
            </View>

            <Text style={styles.activeLabel}>SELECTED OUTPUT</Text>
            <Text style={styles.activeName}>{activeOutput.name}</Text>
            <Text style={styles.activeDescription}>
              {activeOutput.description}
            </Text>

            <View style={styles.activeDivider} />

            <View style={styles.playbackStatus}>
              <View>
                <Text style={styles.statusLabel}>PLAYBACK</Text>
                <Text style={styles.statusValue}>
                  {music.currentTrack
                    ? music.isPlaying
                      ? "Playing audio"
                      : "Playback paused"
                    : "No active track"}
                </Text>
              </View>

              <View style={styles.statusWave}>
                {[13, 23, 17, 29, 15, 24, 11].map((height, index) => (
                  <View
                    key={index}
                    style={[
                      styles.waveBar,
                      {
                        height,
                        opacity: music.isPlaying ? 1 : 0.35,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* Device selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OUTPUT PREFERENCE</Text>
            <Text style={styles.sectionCaption}>SELECT A TYPE</Text>
          </View>

          <View style={styles.deviceList}>
            {outputDevices.map((device) => {
              const selected = selectedOutput === device.id;

              return (
                <Pressable
                  key={device.id}
                  onPress={() => setSelectedOutput(device.id)}
                  style={[
                    styles.deviceCard,
                    selected && styles.deviceCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.deviceIcon,
                      selected && styles.deviceIconActive,
                    ]}
                  >
                    <Ionicons
                      name={device.icon}
                      size={22}
                      color={selected ? ORANGE : "#92969E"}
                    />
                  </View>

                  <View style={styles.deviceInfo}>
                    <Text
                      style={[
                        styles.deviceName,
                        selected && styles.deviceNameActive,
                      ]}
                    >
                      {device.name}
                    </Text>
                    <Text style={styles.deviceDescription}>
                      {device.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      selected && styles.radioOuterActive,
                    ]}
                  >
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={ORANGE}
            />
            <Text style={styles.noticeText}>
              Android controls the actual audio route. Selecting an output
              preference here does not force your phone to switch devices.
              Use Android's Bluetooth or audio settings to change the active
              output.
            </Text>
          </View>

          {/* Playback preferences */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PLAYBACK PREFERENCES</Text>
            <Text style={styles.sectionCaption}>APP SETTINGS</Text>
          </View>

          <View style={styles.settingsCard}>
            <SettingRow
              icon="volume-medium-outline"
              title="Audio focus"
              description="Respect audio interruptions from other apps"
              value={audioFocus}
              onChange={setAudioFocus}
            />

            <View style={styles.settingDivider} />

            <SettingRow
              icon="notifications-off-outline"
              title="Reduce interruptions"
              description="Preference for fewer playback interruptions"
              value={reduceInterruptions}
              onChange={setReduceInterruptions}
            />

            <View style={styles.settingDivider} />

            <SettingRow
              icon="git-merge-outline"
              title="Mono audio"
              description="Preference for combining left and right channels"
              value={monoAudio}
              onChange={setMonoAudio}
            />
          </View>

          <View style={styles.preferenceNotice}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color="#777B82"
            />
            <Text style={styles.preferenceNoticeText}>
              These preferences currently control their screen switches only.
              System audio-focus and mono-channel processing require native
              Android integration.
            </Text>
          </View>

          {/* Sonic tools */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SONIC TOOLS</Text>
            <Text style={styles.sectionCaption}>AUDIO CONTROL</Text>
          </View>

          <Pressable
            style={styles.toolCard}
            onPress={() => router.push("/sonic")}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="pulse-outline" size={23} color={ORANGE} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Sonic Engine</Text>
              <Text style={styles.toolDescription}>
                Explore sound enhancement profiles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={MUTED} />
          </Pressable>

          <Pressable
            style={styles.toolCard}
            onPress={() => router.push("/equalizer")}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="options-outline" size={23} color={ORANGE} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Equalizer</Text>
              <Text style={styles.toolDescription}>
                Customize frequency preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={MUTED} />
          </Pressable>

          <Pressable
            style={styles.toolCard}
            onPress={() => router.push("/sound-profiles")}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="musical-notes-outline" size={23} color={ORANGE} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Sound Profiles</Text>
              <Text style={styles.toolDescription}>
                Choose your preferred listening experience
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={MUTED} />
          </Pressable>

          <View style={{ height: 105 }} />
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
            onPress={() => router.replace("/library")}
          />
          <NavItem
            icon="pulse"
            label="Sonic"
            active
            onPress={() => router.replace("/sonic")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={ORANGE} />
      </View>

      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#34373C", true: "#8A471E" }}
        thumbColor={value ? ORANGE : "#B8BBC0"}
        ios_backgroundColor="#34373C"
      />
    </View>
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
  headerIcon: {
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
  activeCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#493020",
  },
  activeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeIcon: {
    width: 53,
    height: 53,
    borderRadius: 15,
    backgroundColor: "#FF7A181C",
    alignItems: "center",
    justifyContent: "center",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#241B14",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },
  connectedText: {
    color: "#D2AA88",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  activeLabel: {
    color: "#A98A72",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 20,
  },
  activeName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 6,
  },
  activeDescription: {
    color: "#AAA19B",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },
  activeDivider: {
    height: 1,
    backgroundColor: "#493020",
    marginVertical: 18,
  },
  playbackStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: "#8E8177",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  statusValue: {
    color: "#E8D6C8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
  },
  statusWave: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: ORANGE,
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
  deviceList: {
    gap: 9,
  },
  deviceCard: {
    minHeight: 73,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#202328",
    borderRadius: 14,
  },
  deviceCardActive: {
    backgroundColor: "#1B1511",
    borderColor: "#A64D1C",
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1B1E22",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceIconActive: {
    backgroundColor: "#332116",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: "#E5E6E8",
    fontSize: 12,
    fontWeight: "800",
  },
  deviceNameActive: {
    color: ORANGE,
  },
  deviceDescription: {
    color: MUTED,
    fontSize: 10,
    marginTop: 5,
  },
  radioOuter: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#555A62",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: ORANGE,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ORANGE,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 13,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#17130F",
    borderWidth: 1,
    borderColor: "#38291D",
  },
  noticeText: {
    flex: 1,
    color: "#B3A396",
    fontSize: 10,
    lineHeight: 16,
  },
  settingsCard: {
    backgroundColor: CARD,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#25282D",
    paddingHorizontal: 13,
  },
  settingRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  settingIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#FF7A1818",
    justifyContent: "center",
    alignItems: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: "#F0F0F0",
    fontSize: 11,
    fontWeight: "800",
  },
  settingDescription: {
    color: MUTED,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#25282D",
  },
  preferenceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 3,
  },
  preferenceNoticeText: {
    flex: 1,
    color: "#777B82",
    fontSize: 10,
    lineHeight: 16,
  },
  toolCard: {
    minHeight: 69,
    paddingHorizontal: 13,
    marginBottom: 9,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#25282D",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#FF7A1818",
    justifyContent: "center",
    alignItems: "center",
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    color: "#F0F0F0",
    fontSize: 12,
    fontWeight: "800",
  },
  toolDescription: {
    color: MUTED,
    fontSize: 10,
    marginTop: 5,
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
