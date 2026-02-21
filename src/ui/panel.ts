import type { FeatureState } from '../handTracking/types';

export type UIRefs = {
  root: HTMLDivElement;
  startBtn: HTMLButtonElement;
  preset: HTMLSelectElement;
  bpm: HTMLInputElement;
  smoothing: HTMLInputElement;
  pinchSensitivity: HTMLInputElement;
  masterVolume: HTMLInputElement;
  crossfader: HTMLInputElement;
  deckAFile: HTMLInputElement;
  deckBFile: HTMLInputElement;
  deckAPlay: HTMLButtonElement;
  deckBPlay: HTMLButtonElement;
  deckAFilter: HTMLInputElement;
  deckBFilter: HTMLInputElement;
  indicators: Record<'pinch' | 'openHand' | 'handX' | 'handY' | 'latencyMs', HTMLSpanElement>;
};

const makeSlider = (
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
): [HTMLLabelElement, HTMLInputElement] => {
  const wrapper = document.createElement('label');
  wrapper.textContent = `${label} `;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  wrapper.appendChild(input);
  return [wrapper, input];
};

export function createPanel(app: HTMLElement): UIRefs {
  const root = document.createElement('div');
  root.className = 'panel';

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';

  const preset = document.createElement('select');
  preset.innerHTML = '<option value="electronic">Electrónica (128)</option><option value="dnb">DnB (174)</option>';

  const [bpmWrap, bpm] = makeSlider('BPM', 60, 180, 1, 128);
  const [smoothingWrap, smoothing] = makeSlider('Smoothing', 0, 0.95, 0.01, 0.65);
  const [pinchWrap, pinchSensitivity] = makeSlider('Pinch Sens', 0.05, 0.4, 0.01, 0.2);
  const [masterWrap, masterVolume] = makeSlider('Master', 0, 1, 0.01, 0.8);
  const [crossWrap, crossfader] = makeSlider('Crossfader', 0, 1, 0.01, 0.5);

  const deckAFile = document.createElement('input');
  deckAFile.type = 'file';
  deckAFile.accept = 'audio/*';
  const deckBFile = document.createElement('input');
  deckBFile.type = 'file';
  deckBFile.accept = 'audio/*';
  const deckAPlay = document.createElement('button');
  deckAPlay.textContent = 'Deck A Play/Pause';
  const deckBPlay = document.createElement('button');
  deckBPlay.textContent = 'Deck B Play/Pause';
  const [deckAFWrap, deckAFilter] = makeSlider('Deck A LPF', 0, 1, 0.01, 1);
  const [deckBFWrap, deckBFilter] = makeSlider('Deck B LPF', 0, 1, 0.01, 1);

  const indicators: UIRefs['indicators'] = {
    pinch: document.createElement('span'),
    openHand: document.createElement('span'),
    handX: document.createElement('span'),
    handY: document.createElement('span'),
    latencyMs: document.createElement('span'),
  };

  root.append(
    startBtn,
    document.createTextNode('Preset'),
    preset,
    bpmWrap,
    smoothingWrap,
    pinchWrap,
    masterWrap,
    crossWrap,
    document.createTextNode('Deck A file'),
    deckAFile,
    deckAPlay,
    deckAFWrap,
    document.createTextNode('Deck B file'),
    deckBFile,
    deckBPlay,
    deckBFWrap,
  );

  const indWrap = document.createElement('div');
  indWrap.className = 'indicators';
  for (const [key, span] of Object.entries(indicators)) {
    const p = document.createElement('p');
    p.textContent = `${key}: `;
    p.appendChild(span);
    indWrap.appendChild(p);
  }
  root.appendChild(indWrap);
  app.appendChild(root);

  return {
    root,
    startBtn,
    preset,
    bpm,
    smoothing,
    pinchSensitivity,
    masterVolume,
    crossfader,
    deckAFile,
    deckBFile,
    deckAPlay,
    deckBPlay,
    deckAFilter,
    deckBFilter,
    indicators,
  };
}

export function updateIndicators(indicators: UIRefs['indicators'], feature: FeatureState): void {
  indicators.pinch.textContent = feature.pinch.toFixed(2);
  indicators.openHand.textContent = feature.openHand.toFixed(2);
  indicators.handX.textContent = feature.handX.toFixed(2);
  indicators.handY.textContent = feature.handY.toFixed(2);
  indicators.latencyMs.textContent = `${feature.latencyMs.toFixed(1)} ms`;
}
