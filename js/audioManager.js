// ============================================================
// audioManager.js — Sonidos generados con Web Audio API.
// No usamos archivos externos. Sonidos cortos satisfactorios.
// ============================================================

import { state } from './gameState.js';

let ctx = null;
let masterGain = null;
let sfxGain = null;

function ensureCtx () {
  if (ctx) return ctx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    sfxGain = ctx.createGain();
    sfxGain.connect(masterGain);
    masterGain.connect(ctx.destination);
    applyVolumes();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function applyVolumes () {
  if (!masterGain || !sfxGain) return;
  const enabled = state.options.soundEnabled ? 1 : 0;
  masterGain.gain.value = (state.options.masterVolume ?? 0.7) * enabled;
  sfxGain.gain.value    = (state.options.sfxVolume    ?? 0.9);
}

export function unlockAudio () {
  // Llamar tras primer click del usuario (autoplay policy)
  ensureCtx();
  if (ctx?.state === 'suspended') ctx.resume();
}

function tone ({ freq = 440, type = 'sine', dur = 0.08, vol = 0.3, freqEnd = null, attack = 0.005, release = 0.04 }) {
  const c = ensureCtx();
  if (!c || !state.options.soundEnabled) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), c.currentTime + dur);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur + release);
  o.connect(g); g.connect(sfxGain);
  o.start();
  o.stop(c.currentTime + dur + release + 0.02);
}

function noise ({ dur = 0.08, vol = 0.2, hp = 800 } = {}) {
  const c = ensureCtx();
  if (!c || !state.options.soundEnabled) return;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const filt = c.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hp;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(filt); filt.connect(g); g.connect(sfxGain);
  src.start();
}

// ---------- API pública ----------
export const sfx = {
  pick:        () => tone({ freq: 880, freqEnd: 1320, type: 'triangle', dur: 0.05, vol: 0.18 }),
  pickGold:    () => { tone({ freq: 1100, freqEnd: 1760, type: 'square', dur: 0.10, vol: 0.18 });
                       setTimeout(() => tone({ freq: 1760, freqEnd: 2200, type: 'sine', dur: 0.08, vol: 0.14 }), 30); },
  click:       () => tone({ freq: 320, type: 'square', dur: 0.04, vol: 0.10 }),
  buy:         () => { tone({ freq: 600, freqEnd: 900, type: 'triangle', dur: 0.10, vol: 0.18 });
                       setTimeout(() => tone({ freq: 900, type: 'sine', dur: 0.08, vol: 0.16 }), 70); },
  fail:        () => tone({ freq: 220, freqEnd: 110, type: 'sawtooth', dur: 0.18, vol: 0.16 }),
  pop:         () => tone({ freq: 200, freqEnd: 90, type: 'sine', dur: 0.10, vol: 0.20 }),
  packOpen:    () => { noise({ dur: 0.18, vol: 0.18, hp: 600 });
                       setTimeout(() => tone({ freq: 660, freqEnd: 1200, type: 'sawtooth', dur: 0.18, vol: 0.16 }), 60); },
  reveal:      () => tone({ freq: 800, freqEnd: 1400, type: 'sine', dur: 0.12, vol: 0.16 }),
  legendary:   () => {
    tone({ freq: 523, type: 'sine', dur: 0.18, vol: 0.20 });
    setTimeout(() => tone({ freq: 659, type: 'sine', dur: 0.18, vol: 0.20 }), 120);
    setTimeout(() => tone({ freq: 784, type: 'sine', dur: 0.30, vol: 0.22 }), 240);
  },
  achievement: () => {
    tone({ freq: 880, type: 'sine', dur: 0.12, vol: 0.20 });
    setTimeout(() => tone({ freq: 1320, type: 'sine', dur: 0.18, vol: 0.20 }), 100);
  },
  fever:       () => {
    tone({ freq: 440, freqEnd: 880, type: 'sawtooth', dur: 0.20, vol: 0.18 });
    setTimeout(() => tone({ freq: 880, freqEnd: 1320, type: 'sawtooth', dur: 0.24, vol: 0.20 }), 150);
  },
  birth:       () => {
    tone({ freq: 660, freqEnd: 990, type: 'triangle', dur: 0.18, vol: 0.20 });
    setTimeout(() => tone({ freq: 990, freqEnd: 1320, type: 'triangle', dur: 0.20, vol: 0.20 }), 130);
  },
  bark:        () => tone({ freq: 320, freqEnd: 180, type: 'sawtooth', dur: 0.10, vol: 0.18 }),
  fight:       () => { noise({ dur: 0.10, vol: 0.20, hp: 1200 });
                       setTimeout(() => tone({ freq: 180, freqEnd: 80, type: 'square', dur: 0.10, vol: 0.18 }), 40); },
};
