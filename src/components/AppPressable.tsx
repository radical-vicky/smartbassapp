import React from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
} from "react-native";

export function AppPressable({
  android_ripple,
  style,
  ...props
}: PressableProps) {
  return (
    <Pressable
      {...props}
      android_ripple={
        android_ripple ?? {
          color: "rgba(255, 255, 255, 0.16)",
          foreground: true,
        }
      }
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        state.pressed && styles.pressed,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.78,
  },
});
