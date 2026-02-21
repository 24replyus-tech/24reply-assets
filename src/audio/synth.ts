import { AudioEngine } from './engine';

const D_MINOR = [38, 40, 41, 43, 45, 46, 48, 50];
const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class BassSynth {
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  constructor(private engine: AudioEngine) {}

  start(): void {
    const context = this.engine.context;
    const out = this.engine.master;
    if (!context || !out || this.osc) return;
    this.osc = context.createOscillator();
    this.osc.type = 'sawtooth';
    this.filter = context.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 300;
    this.gain = context.createGain();
    this.gain.gain.value = 0.2;
    this.osc.connect(this.filter).connect(this.gain).connect(out);
    this.osc.start();
  }

  stop(): void {
    this.osc?.stop();
    this.osc = null;
    this.gain = null;
    this.filter = null;
  }

  setFromHandY(handY: number): void {
    const context = this.engine.context;
    if (!context || !this.osc || !this.filter) return;
    const idx = Math.max(0, Math.min(D_MINOR.length - 1, Math.floor((1 - handY) * D_MINOR.length)));
    const freq = midiToFreq(D_MINOR[idx]);
    const cutoff = 120 + (1 - handY) * 2200;
    this.osc.frequency.setTargetAtTime(freq, context.currentTime, 0.03);
    this.filter.frequency.setTargetAtTime(cutoff, context.currentTime, 0.03);
  }
}
