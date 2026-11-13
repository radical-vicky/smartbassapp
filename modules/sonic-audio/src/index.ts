import { requireOptionalNativeModule } from "expo-modules-core";
import type { SonicAudioCapabilities } from "./SonicAudio.types";

const NativeModule = requireOptionalNativeModule("SonicAudio");

const SonicAudio = NativeModule || {
  attach: () => ({}),
  attachToPlayer: () => Promise.resolve({}),
  setEnabled: () => ({}),
  setEqualizer: () => ({}),
  setBassBoost: () => ({}),
  setClarity: () => ({}),
  setSpatial: () => ({}),
  setPreamp: () => ({}),
  getCapabilities: () => null,
  getDiagnostics: () => ({ last: "Native module missing" }),
  release: () => ({}),
};

export type { SonicAudioCapabilities };

export default {
  attach: (sessionId: number): SonicAudioCapabilities => SonicAudio.attach(sessionId),
  attachToPlayer: (): Promise<SonicAudioCapabilities> => SonicAudio.attachToPlayer(),
  setEnabled: (enabled: boolean): SonicAudioCapabilities => SonicAudio.setEnabled(enabled),
  setEqualizer: (levels: number[]): SonicAudioCapabilities => SonicAudio.setEqualizer(levels),
  setBassBoost: (amount: number): SonicAudioCapabilities => SonicAudio.setBassBoost(amount),
  setClarity: (amount: number): SonicAudioCapabilities => SonicAudio.setClarity(amount),
  setSpatial: (amount: number): SonicAudioCapabilities => SonicAudio.setSpatial(amount),
  setPreamp: (amount: number): SonicAudioCapabilities => SonicAudio.setPreamp(amount),
  getCapabilities: (): SonicAudioCapabilities => SonicAudio.getCapabilities(),
  getDiagnostics: (): { last: string } => SonicAudio.getDiagnostics(),
  release: (): SonicAudioCapabilities => SonicAudio.release(),
};