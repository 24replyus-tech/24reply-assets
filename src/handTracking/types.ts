export type Landmark = { x: number; y: number; z: number };

export type HandFrame = {
  handedness: string;
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
  timestampMs: number;
};

export type FeatureState = {
  pinch: number;
  openHand: number;
  handX: number;
  handY: number;
  swipe: 'left' | 'right' | null;
  latencyMs: number;
};

export type FeatureConfig = {
  smoothing: number;
  pinchSensitivity: number;
  swipeVelocityThreshold: number;
  swipeCooldownMs: number;
};
