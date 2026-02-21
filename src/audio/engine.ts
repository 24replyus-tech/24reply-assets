export class QuantizedClock {
  private transportStart = 0;

  constructor(private context: AudioContext, public bpm = 110) {
    this.transportStart = context.currentTime;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
  }

  resetTransport(): void {
    this.transportStart = this.context.currentTime;
  }

  stepSeconds(subdivision = 16): number {
    return (60 / this.bpm) * (4 / subdivision);
  }

  quantizeTime(time: number, subdivision = 16): number {
    const step = this.stepSeconds(subdivision);
    const relative = Math.max(0, time - this.transportStart);
    const nextStep = Math.ceil(relative / step);
    return this.transportStart + nextStep * step;
  }

  nextTime(subdivision = 16, lookAheadSec = 0.03): number {
    const target = this.context.currentTime + lookAheadSec;
    return this.quantizeTime(target, subdivision);
  }
}

export class AudioEngine {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  clock: QuantizedClock | null = null;
  private userActivated = false;

  async startFromUserGesture(): Promise<void> {
    this.userActivated = true;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.context.destination);
      this.clock = new QuantizedClock(this.context);
    }
    if (this.context.state !== 'running') await this.context.resume();
    this.clock?.resetTransport();
  }

  stop(): void {
    void this.context?.suspend();
  }

  isReady(): boolean {
    return this.userActivated && !!this.context && !!this.master && this.context.state === 'running';
  }

  setMasterVolume(value: number): void {
    if (this.master) this.master.gain.value = value;
  }

  setBpm(bpm: number): void {
    this.clock?.setBpm(bpm);
  }

  scheduleToGrid(callback: (time: number) => void, subdivision = 16): void {
    if (!this.clock) return;
    callback(this.clock.nextTime(subdivision, 0.02));
  }

  beep(): void {
    if (!this.context || !this.master || !this.isReady()) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const t = this.context.currentTime;
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.21);
  }
}
