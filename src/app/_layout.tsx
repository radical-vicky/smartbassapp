import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { MusicProvider } from "../context/MusicContext";
import { PlaylistProvider } from "../context/PlaylistContext";
import { RecentlyPlayedProvider } from "../context/RecentlyPlayedContext";
import { SettingsProvider } from "../context/SettingsContext"; // <-- NEW

export default function RootLayout() {
  return (
    <View style={styles.root}>
      {/* SettingsProvider must wrap everything so any screen can read preferences */}
      <SettingsProvider>
        <MusicProvider>
          <PlaylistProvider>
            <RecentlyPlayedProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#08090B" },
                  animation: "fade",
                  animationDuration: 200,
                }}
              />
            </RecentlyPlayedProvider>
          </PlaylistProvider>
        </MusicProvider>
      </SettingsProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#08090B" },
});