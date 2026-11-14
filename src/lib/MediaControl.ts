// src/lib/MediaControl.ts
import { requireOptionalNativeModule } from "expo-modules-core";

const Native = requireOptionalNativeModule("ExpoMediaControl");

const FALLBACK = {
  Command: {
    PLAY: "play",
    PAUSE: "pause",
    NEXT_TRACK: "next",
    PREVIOUS_TRACK: "prev",
  } as const,
  PlaybackState: {
    PLAYING: 3,
    PAUSED: 2,
  } as const,
  enableMediaControls: (_opts?: any) => {},
  updateMetadata: (_meta: any) => {},
  updatePlaybackState: (_state?: any, _position?: any) => {},
  addListener: (_cb: any) => ({ remove: () => {} }),
};

const MediaControl = Native
  ? {
      Command: {
        PLAY: "play",
        PAUSE: "pause",
        NEXT_TRACK: "next",
        PREVIOUS_TRACK: "prev",
      } as const,
      PlaybackState: {
        PLAYING: 3,
        PAUSED: 2,
      } as const,
      enableMediaControls: (opts: any) => Native.enableMediaControls(opts),
      updateMetadata: (meta: any) => Native.updateMetadata(meta),
      updatePlaybackState: (state?: any, position?: any) =>
        Native.updatePlaybackState(state, position),
      addListener: (cb: any) => Native.addListener("mediaControl", cb),
    }
  : FALLBACK;

if (!Native) {
  console.warn(
    "[MediaControl] Native module not found. Media notification will be disabled. " +
      "Run `npx expo prebuild --clean && npx expo run:android` to rebuild."
  );
}

export default MediaControl;