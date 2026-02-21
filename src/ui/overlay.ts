import type { HandFrame } from '../handTracking/types';

const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D | null;

  constructor(private canvas: HTMLCanvasElement, private video: HTMLVideoElement) {
    this.ctx = this.canvas.getContext('2d');
  }

  draw(frames: HandFrame[]): void {
    if (!this.ctx) return;

    const width = this.video.videoWidth || 960;
    const height = this.video.videoHeight || 540;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.video, 0, 0, width, height);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#00e5ff';
    this.ctx.fillStyle = '#ffeb3b';

    for (const hand of frames) {
      this.ctx.beginPath();
      for (const [a, b] of CONNECTIONS) {
        const p1 = hand.landmarks[a];
        const p2 = hand.landmarks[b];
        this.ctx.moveTo(p1.x * width, p1.y * height);
        this.ctx.lineTo(p2.x * width, p2.y * height);
      }
      this.ctx.stroke();

      this.ctx.beginPath();
      for (const p of hand.landmarks) {
        this.ctx.moveTo(p.x * width + 4, p.y * height);
        this.ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
      }
      this.ctx.fill();
    }
  }
}
