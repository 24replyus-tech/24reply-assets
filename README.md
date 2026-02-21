# HandMusic MVP (Frontend)

MVP web de una sola página para crear música con gestos de mano usando cámara + tracking en navegador.

## Requisitos
- Node.js 18+

## Ejecutar local
```bash
npm i
npm run dev
```

## Funciones incluidas
- Start/Stop para cámara + audio (el `AudioContext` solo se crea/reanuda tras interacción del usuario).
- Tracking de manos en tiempo real con MediaPipe Tasks Vision.
- Overlay de landmarks (21) y conexiones sobre video.
- Features por frame: `pinch`, `openHand`, `handX`, `handY`, `swipe` con smoothing/cooldown.
- Drum rack sintetizado (kick/snare/hat) + cuantización exacta a 1/16 con BPM master.
- Bass synth con escala D minor; `handY` controla nota/cutoff.
- Mixer con Deck A/B (carga de archivos), play/pause por deck, LPF por deck y crossfader.
- Mapeo hardcodeado con hysteresis + cooldown por gesto para reducir falsos disparos.
- Presets de performance desde UI:
  - **Electrónica** (BPM 128)
  - **DnB** (BPM 174)
