import { AudioEngine } from './engine';

type DeckId = 'A' | 'B';

type Deck = {
  element: HTMLAudioElement;
  gain: GainNode;
  filter: BiquadFilterNode;
};

export class Mixer {
  private decks: Record<DeckId, Deck> | null = null;

  constructor(private engine: AudioEngine) {}

  init(deckA: HTMLAudioElement, deckB: HTMLAudioElement): void {
    const context = this.engine.context;
    const out = this.engine.master;
    if (!context || !out || this.decks) return;

    const createDeck = (element: HTMLAudioElement): Deck => {
      const source = context.createMediaElementSource(element);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 18000;
      const gain = context.createGain();
      source.connect(filter).connect(gain).connect(out);
      return { element, gain, filter };
    };

    this.decks = { A: createDeck(deckA), B: createDeck(deckB) };
    this.setCrossfader(0.5);
  }

  loadDeck(deck: DeckId, file: File): void {
    if (!this.decks) return;
    this.decks[deck].element.src = URL.createObjectURL(file);
  }

  togglePlay(deck: DeckId): void {
    if (!this.decks) return;
    const d = this.decks[deck].element;
    if (d.paused) void d.play();
    else d.pause();
  }

  setDeckFilter(deck: DeckId, value: number): void {
    if (!this.decks) return;
    const cutoff = 200 + value * 17800;
    this.decks[deck].filter.frequency.value = cutoff;
  }

  setCrossfader(value: number): void {
    if (!this.decks) return;
    const a = Math.cos(value * Math.PI * 0.5);
    const b = Math.cos((1 - value) * Math.PI * 0.5);
    this.decks.A.gain.gain.value = a;
    this.decks.B.gain.gain.value = b;
  }

  toggleActiveByHandX(handX: number): void {
    this.togglePlay(handX < 0.5 ? 'A' : 'B');
  }
}
