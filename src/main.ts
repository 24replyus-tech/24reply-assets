import './styles.css';
import { CameraController } from './handTracking/camera';
import { HandTracker } from './handTracking/tracker';
import { FeatureEngine } from './handTracking/features';
import { AudioEngine } from './audio/engine';
import { DrumRack } from './audio/drums';
import { BassSynth } from './audio/synth';
import { Mixer } from './audio/mixer';
import { GestureMapping, PRESETS, type MappingPreset } from './mapping/gestureMapping';
import { createPanel, updateIndicators } from './ui/panel';
import { OverlayRenderer } from './ui/overlay';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app');

const video = document.createElement('video');
video.muted = true;
video.playsInline = true;
video.className = 'hiddenVideo';

const canvas = document.createElement('canvas');
canvas.className = 'stage';

const deckAEl = document.createElement('audio');
const deckBEl = document.createElement('audio');

app.append(canvas, video);

const ui = createPanel(app);
const camera = new CameraController();
const tracker = new HandTracker();
const overlay = new OverlayRenderer(canvas, video);
const features = new FeatureEngine({
  smoothing: Number(ui.smoothing.value),
  pinchSensitivity: Number(ui.pinchSensitivity.value),
  swipeVelocityThreshold: 0.75,
  swipeCooldownMs: 450,
});

const audio = new AudioEngine();
const drums = new DrumRack(audio);
const bass = new BassSynth(audio);
const mixer = new Mixer(audio);
let activePreset: MappingPreset = PRESETS.electronic;
const mapping = new GestureMapping(drums, bass, mixer, audio, activePreset);

let running = false;
let rafId = 0;
let lastTrackMs = 0;
let lastDrawMs = 0;
let cachedHands = tracker.detect(video, performance.now());

const TRACK_INTERVAL_MS = 1000 / 30;
const DRAW_INTERVAL_MS = 1000 / 30;

const applyPreset = (key: 'dnb' | 'electronic'): void => {
  activePreset = { ...PRESETS[key] };
  ui.bpm.value = String(activePreset.bpm);
  audio.setBpm(activePreset.bpm);
  features.setConfig({
    swipeVelocityThreshold: key === 'dnb' ? 1.0 : 0.75,
    swipeCooldownMs: activePreset.swipeCooldownMs,
  });
  mapping.setPreset(activePreset);
};

const loop = (): void => {
  if (!running) return;
  const now = performance.now();

  if (now - lastTrackMs >= TRACK_INTERVAL_MS) {
    cachedHands = tracker.detect(video, now);
    const feature = features.update(cachedHands[0] ?? null, now);
    updateIndicators(ui.indicators, feature);
    mapping.handle(feature, now);
    ui.crossfader.value = feature.handX.toFixed(2);
    lastTrackMs = now;
  }

  if (now - lastDrawMs >= DRAW_INTERVAL_MS) {
    overlay.draw(cachedHands);
    lastDrawMs = now;
  }

  rafId = requestAnimationFrame(loop);
};

ui.startBtn.onclick = async () => {
  if (!running) {
    await audio.startFromUserGesture();
    await tracker.init();
    await camera.start(video);
    mixer.init(deckAEl, deckBEl);
    bass.start();
    applyPreset(ui.preset.value as 'dnb' | 'electronic');
    audio.beep();
    running = true;
    ui.startBtn.textContent = 'Stop';
    loop();
    return;
  }

  running = false;
  cancelAnimationFrame(rafId);
  bass.stop();
  camera.stop(video);
  tracker.close();
  audio.stop();
  ui.startBtn.textContent = 'Start';
};

ui.preset.onchange = () => applyPreset(ui.preset.value as 'dnb' | 'electronic');
ui.bpm.oninput = () => {
  const bpm = Number(ui.bpm.value);
  audio.setBpm(bpm);
  activePreset.bpm = bpm;
};
ui.smoothing.oninput = () => features.setConfig({ smoothing: Number(ui.smoothing.value) });
ui.pinchSensitivity.oninput = () => {
  const value = Number(ui.pinchSensitivity.value);
  features.setConfig({ pinchSensitivity: value });
  mapping.tunePinchSensitivity(value);
};
ui.masterVolume.oninput = () => audio.setMasterVolume(Number(ui.masterVolume.value));
ui.crossfader.oninput = () => mixer.setCrossfader(Number(ui.crossfader.value));
ui.deckAFile.onchange = () => {
  const file = ui.deckAFile.files?.[0];
  if (file) mixer.loadDeck('A', file);
};
ui.deckBFile.onchange = () => {
  const file = ui.deckBFile.files?.[0];
  if (file) mixer.loadDeck('B', file);
};
ui.deckAPlay.onclick = () => mixer.togglePlay('A');
ui.deckBPlay.onclick = () => mixer.togglePlay('B');
ui.deckAFilter.oninput = () => mixer.setDeckFilter('A', Number(ui.deckAFilter.value));
ui.deckBFilter.oninput = () => mixer.setDeckFilter('B', Number(ui.deckBFilter.value));

applyPreset('electronic');
