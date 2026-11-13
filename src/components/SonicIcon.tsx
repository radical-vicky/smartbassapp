// src/components/SonicIcon.tsx
import { StyleSheet, View } from "react-native";

export const SonicIcon = ({ size = 20, color = "#00D2FF" }) => {
  const barWidth = size * 0.15;
  
  return (
    <View style={[styles.container, { height: size, width: size }]}>
      {/* Left Slider */}
      <View style={[styles.track, { width: barWidth, backgroundColor: color, height: size }]} />
      
      {/* Middle Slider (with handle) */}
      <View style={styles.column}>
        <View style={[styles.trackHalf, { width: barWidth, backgroundColor: color }]} />
        <View style={[styles.handle, { width: barWidth * 2.5, height: barWidth, backgroundColor: color }]} />
        <View style={[styles.trackHalf, { width: barWidth, backgroundColor: color }]} />
      </View>

      {/* Right Slider (with handle) */}
      <View style={styles.column}>
        <View style={[styles.trackHalf, { width: barWidth, backgroundColor: color }]} />
        <View style={[styles.handle, { width: barWidth * 2.5, height: barWidth, backgroundColor: color, marginTop: size * 0.2 }]} />
        <View style={[styles.trackHalf, { width: barWidth, backgroundColor: color, marginTop: size * 0.2 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  column: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    flex: 1,
  },
  track: {
    borderRadius: 2,
  },
  trackHalf: {
    flex: 1,
    borderRadius: 2,
  },
  handle: {
    borderRadius: 2,
    marginVertical: 1,
  }
});