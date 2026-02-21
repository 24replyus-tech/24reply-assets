import type { FeatureState } from '../handTracking/types';
import { DrumRack } from '../audio/drums';
import { BassSynth } from '../audio/synth';
import { Mixer } from '../audio/mixer';
import { AudioEngine } from '../audio/engine';

export type MappingPreset = {
  name: 'dnb' | 'electronic';
  bpm: number;
  pinchOn: number;
  pinchOff: number;
  openOn: number;
  openOff: number;
  pinchCooldownMs: number;
  openCooldownMs: number;
  swipeCooldownMs: number;
  deckToggleCooldownMs: number;
  hatFillCount: number;
};

export const PRESETS: Record<'dnb' | 'electronic', MappingPreset> = {
  dnb: {
    name: 'dnb',
    bpm: 174,
    pinchOn: 0.78,
    pinchOff: 0.56,
    openOn: 0.78,
    openOff: 0.62,
    pinchCooldownMs: 120,
    openCooldownMs: 180,
    swipeCooldownMs: 260,
    deckToggleCooldownMs: 550,
    hatFillCount: 8,
  },
  electronic: {
    name: 'electronic',
    bpm: 128,
    pinchOn: 0.74,
    pinchOff: 0.52,
    openOn: 0.72,
    openOff: 0.58,
    pinchCooldownMs: 170,
    openCooldownMs: 260,
    swipeCooldownMs: 340,
    deckToggleCooldownMs: 650,
    hatFillCount: 6,
  },
};

export class GestureMapping {
  private pinchLatched = false;
  private openLatched = false;
  private pinchCooldownUntil = 0;
  private openCooldownUntil = 0;
  private swipeCooldownUntil = 0;
  private deckToggleCooldownUntil = 0;

  constructor(
    private drums: DrumRack,
    private bass: BassSynth,
    private mixer: Mixer,
    private engine: AudioEngine,
    private preset: MappingPreset,
  ) {}

  setPreset(preset: MappingPreset): void {
    this.preset = preset;
    this.engine.setBpm(preset.bpm);
    this.resetLatches();
  }

  tunePinchSensitivity(sensitivity: number): void {
    const adaptive = Math.min(0.9, Math.max(0.58, 1 - sensitivity * 1.35));
    this.preset.pinchOn = adaptive;
    this.preset.pinchOff = Math.max(0.4, adaptive - 0.18);
  }

  private resetLatches(): void {
    this.pinchLatched = false;
    this.openLatched = false;
  }

  handle(features: FeatureState, nowMs: number): void {
    if (!this.engine.clock) return;

    if (!this.pinchLatched && features.pinch >= this.preset.pinchOn && nowMs >= this.pinchCooldownUntil) {
      this.pinchLatched = true;
      this.pinchCooldownUntil = nowMs + this.preset.pinchCooldownMs;
      this.engine.scheduleToGrid((time) => this.drums.kick(time), 16);

      if (features.handY < 0.5 && nowMs >= this.deckToggleCooldownUntil) {
        this.mixer.toggleActiveByHandX(features.handX);
        this.deckToggleCooldownUntil = nowMs + this.preset.deckToggleCooldownMs;
      }
    } else if (this.pinchLatched && features.pinch <= this.preset.pinchOff) {
      this.pinchLatched = false;
    }

    if (!this.openLatched && features.openHand >= this.preset.openOn && nowMs >= this.openCooldownUntil) {
      this.openLatched = true;
      this.openCooldownUntil = nowMs + this.preset.openCooldownMs;
      this.engine.scheduleToGrid((time) => this.drums.snare(time), 16);
    } else if (this.openLatched && features.openHand <= this.preset.openOff) {
      this.openLatched = false;
    }

    if (features.swipe && nowMs >= this.swipeCooldownUntil) {
      this.swipeCooldownUntil = nowMs + this.preset.swipeCooldownMs;
      this.drums.hatFill(this.preset.hatFillCount);
    }

    this.bass.setFromHandY(features.handY);
    this.mixer.setCrossfader(features.handX);
  }
}
