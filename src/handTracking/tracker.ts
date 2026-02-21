import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import type { HandFrame } from './types';

export class HandTracker {
  private landmarker: HandLandmarker | null = null;

  async init(): Promise<void> {
    if (this.landmarker) return;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      },
      numHands: 2,
      runningMode: 'VIDEO',
    });
  }

  detect(video: HTMLVideoElement, timestampMs: number): HandFrame[] {
    if (!this.landmarker) return [];
    const result: HandLandmarkerResult = this.landmarker.detectForVideo(video, timestampMs);
    return result.landmarks.map((landmarks: NormalizedLandmark[], index: number) => ({
      landmarks,
      worldLandmarks: result.worldLandmarks[index],
      handedness: result.handedness[index][0].categoryName,
      timestampMs,
    }));
  }

  close(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
