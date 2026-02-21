import type { FeatureConfig, FeatureState, HandFrame, Landmark } from './types';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export class FeatureEngine {
  private state: FeatureState = {
    pinch: 0,
    openHand: 0,
    handX: 0.5,
    handY: 0.5,
    swipe: null,
    latencyMs: 0,
  };

  private previousX = 0.5;
  private lastTimestamp = 0;
  private lastSwipeAt = 0;

  constructor(private config: FeatureConfig) {}

  setConfig(partial: Partial<FeatureConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  update(frame: HandFrame | null, nowMs: number): FeatureState {
    if (!frame || frame.landmarks.length < 21) {
      this.state.swipe = null;
      this.state.latencyMs = 0;
      return this.state;
    }

    const lm = frame.landmarks;
    const indexTip = lm[8];
    const thumbTip = lm[4];
    const wrist = lm[0];
    const middleTip = lm[12];
    const ringTip = lm[16];
    const pinkyTip = lm[20];

    const pinchRaw = clamp01(1 - dist(indexTip, thumbTip) / this.config.pinchSensitivity);
    const opennessRaw = clamp01(
      (dist(wrist, indexTip) + dist(wrist, middleTip) + dist(wrist, ringTip) + dist(wrist, pinkyTip)) /
        1.6,
    );

    const alpha = clamp01(this.config.smoothing);
    this.state.pinch = this.state.pinch * alpha + pinchRaw * (1 - alpha);
    this.state.openHand = this.state.openHand * alpha + opennessRaw * (1 - alpha);
    this.state.handX = this.state.handX * alpha + indexTip.x * (1 - alpha);
    this.state.handY = this.state.handY * alpha + indexTip.y * (1 - alpha);

    const dt = Math.max(1, nowMs - this.lastTimestamp);
    const velocityX = ((this.state.handX - this.previousX) / dt) * 1000;

    const canSwipe = nowMs - this.lastSwipeAt > this.config.swipeCooldownMs;
    if (canSwipe && Math.abs(velocityX) > this.config.swipeVelocityThreshold) {
      this.state.swipe = velocityX > 0 ? 'right' : 'left';
      this.lastSwipeAt = nowMs;
    } else {
      this.state.swipe = null;
    }

    this.state.latencyMs = Math.max(0, nowMs - frame.timestampMs);
    this.previousX = this.state.handX;
    this.lastTimestamp = nowMs;
    return this.state;
  }
}
