import { AudioEngine } from './engine';

export class DrumRack {
  constructor(private engine: AudioEngine) {}

  kick(time?: number): void {
    const context = this.engine.context;
    const out = this.engine.master;
    if (!context || !out) return;
    const t = time ?? context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  snare(time?: number): void {
    const context = this.engine.context;
    const out = this.engine.master;
    if (!context || !out) return;
    const t = time ?? context.currentTime;
    const buffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const hp = context.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    noise.connect(hp).connect(gain).connect(out);
    noise.start(t);
    noise.stop(t + 0.15);
  }

  hat(time?: number): void {
    const context = this.engine.context;
    const out = this.engine.master;
    if (!context || !out) return;
    const t = time ?? context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 8000;
    const bp = context.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 9000;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(bp).connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  hatFill(count = 4): void {
    const clock = this.engine.clock;
    if (!clock) return;
    const step = clock.stepSeconds(16);
    const start = clock.nextTime(16, 0.02);
    for (let i = 0; i < count; i += 1) this.hat(start + i * step);
  }
}
