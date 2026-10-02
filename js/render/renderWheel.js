// ============================================================
// render/renderWheel.js — Ruleta de la Suerte.
// Se gana un giro al subir de nivel, con la racha diaria, en cajas
// misteriosas y gratis cada pocos minutos de juego.
// ============================================================

import { state } from '../gameState.js';
import { modal } from '../modalManager.js';
import { sfx } from '../audioManager.js';
import { grant, scaledPoop, secondsToFreeSpin, addBuff } from '../systems/hookSystem.js';
import { fmt, banner, shake } from './juice.js';
import { confetti } from './particles.js';
import { PARK } from '../config.js';

// Orden visual pensado para el "casi": el premio gordo queda entre premios pequeños
const SEGMENTS = [
  { id: 'bag2',   label: '💩 x2',    color: '#c98a4a', w: 22 },
  { id: 'legend', label: '🌟',       color: '#ff4757', w: 2  },
  { id: 'food',   label: '📦 x2',    color: '#5fc66f', w: 16 },
  { id: 'frenzy', label: '🔥 x7',    color: '#ff7a59', w: 14 },
  { id: 'bag5',   label: '💩 x5',    color: '#a0612a', w: 14 },
  { id: 'jackpot',label: '💰 JACKPOT', color: '#ffd56a', w: 3 },
  { id: 'dog',    label: '🎁',       color: '#4d8fff', w: 9  },
  { id: 'fever',  label: '✨ Fiebre', color: '#a64dff', w: 20 },
];
const N = SEGMENTS.length;
const SEG = (Math.PI * 2) / N;

let _angle = 0;
let _spinning = false;
let _raf = 0;

export function openWheel () {
  const body = `
    <div class="wheel-wrap">
      <div class="wheel-stage">
        <canvas id="wheel-canvas" width="420" height="420"></canvas>
        <div class="wheel-pointer"></div>
      </div>
      <div class="wheel-side">
        <div class="wheel-spins">Giros: <strong id="wheel-spins">0</strong></div>
        <button class="btn gold big" id="wheel-spin">¡GIRAR!</button>
        <div class="wheel-result" id="wheel-result">Gira para ganar premios</div>
        <div class="wheel-free" id="wheel-free"></div>
        <div class="wheel-legend">
          ${SEGMENTS.map(s => `<div><span class="dot" style="background:${s.color}"></span>${s.label} <em>${describe(s.id)}</em></div>`).join('')}
        </div>
      </div>
    </div>`;
  const m = modal.open({ title: '🎡 Ruleta de la Suerte', body, wide: true, onClose: () => cancelAnimationFrame(_raf) });
  const canvas = m.querySelector('#wheel-canvas');
  const btn = m.querySelector('#wheel-spin');
  btn.onclick = () => spin(canvas, m);
  const loop = () => {
    if (!canvas.isConnected) return;
    draw(canvas);
    refreshSide(m);
    _raf = requestAnimationFrame(loop);
  };
  loop();
}

function describe (id) {
  switch (id) {
    case 'bag2':    return '2 min de popó';
    case 'bag5':    return '5 min de popó';
    case 'jackpot': return '25 min de popó';
    case 'food':    return '2 Sobres de comida';
    case 'dog':     return 'Sobre de perros';
    case 'legend':  return 'Sobre legendario';
    case 'frenzy':  return 'Frenesí 15 s';
    case 'fever':   return 'Fiebre + lluvia';
  }
  return '';
}

function refreshSide (m) {
  const spins = state.hooks.spins || 0;
  const s = m.querySelector('#wheel-spins');
  if (s) s.textContent = spins;
  const btn = m.querySelector('#wheel-spin');
  if (btn) btn.disabled = _spinning || spins <= 0;
  const free = m.querySelector('#wheel-free');
  if (free) {
    const sec = Math.ceil(secondsToFreeSpin());
    free.textContent = `Próximo giro gratis en ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }
}

function pickSegment () {
  const total = SEGMENTS.reduce((a, s) => a + s.w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < N; i++) { r -= SEGMENTS[i].w; if (r <= 0) return i; }
  return 0;
}

function spin (canvas, m) {
  if (_spinning || (state.hooks.spins || 0) <= 0) return;
  state.hooks.spins--;
  _spinning = true;
  const idx = pickSegment();
  const seg = SEGMENTS[idx];

  // Posición dentro del segmento. Si está junto al jackpot o al legendario,
  // queda pegado al borde: "¡casi!"
  const prev = SEGMENTS[(idx - 1 + N) % N].id;
  const next = SEGMENTS[(idx + 1) % N].id;
  const big = id => id === 'jackpot' || id === 'legend';
  let within = 0.2 + Math.random() * 0.6;
  if (big(next) && !big(seg.id)) within = 0.9 + Math.random() * 0.07;
  else if (big(prev) && !big(seg.id)) within = 0.03 + Math.random() * 0.07;

  // El puntero está arriba (-PI/2). El segmento i ocupa [i*SEG, (i+1)*SEG] desde 0 rad + _angle.
  const targetLocal = (idx + within) * SEG;
  const pointer = -Math.PI / 2;
  let final = pointer - targetLocal;
  const turns = 6 + Math.floor(Math.random() * 2);
  const base = _angle - (_angle % (Math.PI * 2));
  final = base + turns * Math.PI * 2 + ((final % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const start = _angle;
  const dur = 4300 + Math.random() * 600;
  const t0 = performance.now();
  let lastSeg = Math.floor(norm(start) / SEG);
  const res = m.querySelector('#wheel-result');
  if (res) res.textContent = 'Girando…';

  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - k, 4);
    _angle = start + (final - start) * e;
    const cur = Math.floor(norm(_angle) / SEG);
    if (cur !== lastSeg) { lastSeg = cur; sfx.wheelTick(); }
    if (k < 1) requestAnimationFrame(step);
    else { _spinning = false; award(seg, m); }
  };
  requestAnimationFrame(step);
}

function norm (a) { return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); }

function award (seg, m) {
  let text = '';
  switch (seg.id) {
    case 'bag2':   { const p = scaledPoop(2, 80);   grant({ poop: p }); text = `+${fmt(p)} 💩`; break; }
    case 'bag5':   { const p = scaledPoop(5, 200);  grant({ poop: p }); text = `+${fmt(p)} 💩`; break; }
    case 'jackpot':{ const p = scaledPoop(25, 1500); grant({ poop: p }); text = `¡JACKPOT! +${fmt(p)} 💩`; break; }
    case 'food':   grant({ packs: { food: 2 } }); text = '+2 Sobres de comida 📦'; break;
    case 'dog':    grant({ packs: { dog: 1 } }); text = '+1 Sobre de perros 🎁'; break;
    case 'legend': grant({ packs: { legend: 1 } }); text = '¡SOBRE LEGENDARIO! 🌟'; break;
    case 'frenzy': addBuff('frenzy'); text = '¡Frenesí x7! Vuelve al parque 🔥'; break;
    case 'fever':  grant({ fever: true }); text = '¡Fiebre del parque! ✨'; break;
  }
  const big = seg.id === 'jackpot' || seg.id === 'legend';
  if (big) { sfx.rainbow(); shake(14); confetti(PARK.W / 2, PARK.H / 2, 100); banner(text, { kind: 'jackpot', color: seg.color, ms: 2200 }); }
  else sfx.achievement();
  const res = m.querySelector('#wheel-result');
  if (res) {
    res.textContent = text;
    res.classList.remove('pop'); void res.offsetWidth; res.classList.add('pop');
    res.style.color = seg.color;
  }
}

function draw (canvas) {
  const c = canvas.getContext('2d');
  const W = canvas.width, cx = W / 2, cy = W / 2, R = W / 2 - 14;
  c.clearRect(0, 0, W, W);
  // Borde exterior con bombillas
  c.fillStyle = '#2d2748';
  c.beginPath(); c.arc(cx, cy, R + 12, 0, Math.PI * 2); c.fill();
  const t = performance.now() / 1000;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const on = _spinning ? (Math.floor(t * 12) + i) % 2 === 0 : (Math.floor(t * 2) + i) % 3 === 0;
    c.fillStyle = on ? '#fff6a0' : '#a07a40';
    c.beginPath(); c.arc(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6), 4, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < N; i++) {
    const a0 = _angle + i * SEG;
    const a1 = a0 + SEG;
    c.fillStyle = SEGMENTS[i].color;
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, a0, a1); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke();
    // Etiqueta
    c.save();
    c.translate(cx, cy);
    c.rotate(a0 + SEG / 2);
    c.textAlign = 'right'; c.textBaseline = 'middle';
    c.font = '900 20px Trebuchet MS, sans-serif';
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.strokeText(SEGMENTS[i].label, R - 16, 0);
    c.fillStyle = '#fff';
    c.fillText(SEGMENTS[i].label, R - 16, 0);
    c.restore();
  }
  // Centro
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(cx, cy, 34, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ec5985';
  c.beginPath(); c.arc(cx, cy, 26, 0, Math.PI * 2); c.fill();
  c.font = '28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('💩', cx, cy + 2);
}
