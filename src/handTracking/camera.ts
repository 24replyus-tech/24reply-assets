export class CameraController {
  private stream: MediaStream | null = null;

  async start(video: HTMLVideoElement): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: 960, height: 540, facingMode: 'user' },
    });
    video.srcObject = this.stream;
    await video.play();
  }

  stop(video: HTMLVideoElement): void {
    video.pause();
    if (video.srcObject) {
      const localStream = video.srcObject as MediaStream;
      localStream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
    this.stream = null;
  }
}
