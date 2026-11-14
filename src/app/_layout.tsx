import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { MusicProvider } from "../context/MusicContext";
import { PlaylistProvider } from "../context/PlaylistContext";
import { RecentlyPlayedProvider } from "../context/RecentlyPlayedContext";
import { SettingsProvider } from "../context/SettingsContext";
import { supabase } from "../lib/supabase";

// Prevent splash screen from hiding until we know if they are logged in
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [session, setSession] = useState<any>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Check local storage for a saved session on app boot
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingAuth(false);
    });

    // 2. Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isCheckingAuth) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!session && !inAuthGroup) {
      // If no session, force them to login
      router.replace("/login");
    } else if (session && inAuthGroup) {
      // If they have a session and are on login/register, send them home
      router.replace("/home");
    }

    // Hide splash screen once routing is decided
    SplashScreen.hideAsync();
  }, [session, isCheckingAuth, segments]);

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8500" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#08090B",
    alignItems: "center",
    justifyContent: "center",
  },
});