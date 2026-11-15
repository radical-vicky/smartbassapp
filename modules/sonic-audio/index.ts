import { requireOptionalNativeModule } from "expo-modules-core";

// We define the shape of the data coming from Kotlin
export type SonicAudioCapabilities = {
  attached: boolean;
  sessionId: number;
  enabled: boolean;
  equalizerAvailable: boolean;
  bassBoostAvailable: boolean;
  bassBoostStrengthSupported: boolean;
  spatialAvailable: boolean;
  spatialStrengthSupported: boolean;
  equalizerBands: number;
  equalizerMinDb: number;
  equalizerMaxDb: number;
  equalizerError: string;
  bassBoostError: string;
  spatialError: string;
  bassBoostFallback: boolean;
  diagnostics: string;
};

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

const NativeModule = requireOptionalNativeModule("SonicAudio");

if (!NativeModule) {
  console.warn(
    "[SonicAudio] Native module missing. Rebuild the app to link the Kotlin module."
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
