import { requireOptionalNativeModule } from "expo-modules-core";
import type { SonicAudioCapabilities } from "./SonicAudio.types";

const NativeModule = requireOptionalNativeModule("SonicAudio");

/**
 * Placeholder used only when the native module is missing (e.g. on iOS or web,
 * or when the app was not rebuilt after adding the plugin). All methods return
 * `attached: false` so callers can detect the failure and prompt the user.
 *
 * Do NOT return `{}` — that makes every call site treat missing native support
 * as a successful no-op, which is exactly why the Equalizer screen appeared
 * to do nothing.
 */
const MISSING: SonicAudioCapabilities = {
  attached: false,
  sessionId: 0,
  enabled: false,
  equalizerAvailable: false,
  bassBoostAvailable: false,
  bassBoostStrengthSupported: false,
  spatialAvailable: false,
  spatialStrengthSupported: false,
  equalizerBands: 0,
  equalizerMinDb: 0,
  equalizerMaxDb: 0,
  equalizerError: "Native module missing",
  bassBoostError: "Native module missing",
  spatialError: "Native module missing",
  bassBoostFallback: false,
  diagnostics: "Native module missing",
};

if (!NativeModule) {
  console.warn(
    "[SonicAudio] Native module missing. Rebuild the app after adding " +
      "the expo-audio config plugin and the sonic-audio module."
  );
}

const SonicAudio = NativeModule || {
  attach: (_: number) => MISSING,
  attachToPlayer: () => Promise.resolve(MISSING),
  setEnabled: (_: boolean) => MISSING,
  setEqualizer: (_: number[]) => MISSING,
  setBassBoost: (_: number) => MISSING,
  setClarity: (_: number) => MISSING,
  setSpatial: (_: number) => MISSING,
  setPreamp: (_: number) => MISSING,
  getCapabilities: () => MISSING,
  getDiagnostics: () => ({ last: "Native module missing" }),
  release: () => MISSING,
};

export type { SonicAudioCapabilities };

export default {
  attach: (sessionId: number): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.attach(sessionId) : MISSING,
  attachToPlayer: (): Promise<SonicAudioCapabilities> =>
    NativeModule ? SonicAudio.attachToPlayer() : Promise.resolve(MISSING),
  setEnabled: (enabled: boolean): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setEnabled(enabled) : MISSING,
  setEqualizer: (levels: number[]): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setEqualizer(levels) : MISSING,
  setBassBoost: (amount: number): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setBassBoost(amount) : MISSING,
  setClarity: (amount: number): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setClarity(amount) : MISSING,
  setSpatial: (amount: number): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setSpatial(amount) : MISSING,
  setPreamp: (amount: number): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.setPreamp(amount) : MISSING,
  getCapabilities: (): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.getCapabilities() : MISSING,
  getDiagnostics: (): { last: string } =>
    NativeModule ? SonicAudio.getDiagnostics() : { last: "Native module missing" },
  release: (): SonicAudioCapabilities =>
    NativeModule ? SonicAudio.release() : MISSING,
};