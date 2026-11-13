import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Added this
import { AppPressable as Pressable } from "../components/AppPressable";

const slides = [
  {
    title: "Premium sound,\nyour way",
    description:
      "High-quality playback with rich, clear audio on every pair of headphones.",
    image: require("../../assets/images/onboarding-headphones.png"),
  },
  {
    title: "All your music,\none place",
    description:
      "Browse your local library by artist, album and folder, and build playlists.",
    image: require("../../assets/images/onboarding-record.png"),
  },
  {
    title: "Shape every\nbeat",
    description:
      "Equalizer, bass and clarity controls for sound that fits you.",
    image: require("../../assets/images/onboarding-equalizer.png"),
  },
];

export default function OnboardingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Get the safe area insets

  const currentSlide = slides[activeSlide];
  const isLastSlide = activeSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.replace("/login");
      return;
    }
    setActiveSlide((current) => current + 1);
  };

  const handleSkip = () => {
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden barStyle="light-content" />

      {/* Header - Skip Button Only */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip} hitSlop={15}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={currentSlide.image}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContent}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>
      </View>

      {/* Footer - Added paddingBottom with insets.bottom */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={["#FF8500", "#FF8500"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? "Get Started" : "Continue"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#08090B",
    paddingHorizontal: 24,
    paddingTop: 40,
    // Removed paddingBottom: 40 from container
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 40,
  },
  skipText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 0.6,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  illustration: {
    width: "80%",
    height: "100%",
  },
  textContent: {
    width: "100%",
    alignItems: "flex-start",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    color: "#A0A0A0",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "90%",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20, // Added padding top for spacing
  },
  pagination: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FF8500",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#333333",
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});