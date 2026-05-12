// ============================================================
// render/renderHUD.js — barra superior, combo flotante grande,
// overlay de Fiebre del Parque.
// ============================================================

import { state } from '../gameState.js';
import { ECONOMY } from '../config.js';

let cache = {};
const $ = id => document.getElementById(id);

let _comboLastSeen = 1;
let _comboFloatHideAt = 0;

const COMBO_COLORS = [
  { from: 1.5, color: '#fff6dd' },
  { from: 2.0, color: '#5fc66f' },
  { from: 3.0, color: '#4d8fff' },
  { from: 5.0, color: '#a64dff' },
  { from: 8.0, color: '#ffb71a' },
  { from: 10.0, color: '#ec59c2' },
];

export function renderHUD (dt) {
  // Popó
  const poop = Math.floor(state.resources.poop);
  if (cache.poop !== poop) { $('stat-poop').textContent = poop.toLocaleString('es'); cache.poop = poop; }

  // Perros
  const dogs = state.park.activeDogs.length + '/' + state.park.capacity;
  if (cache.dogs !== dogs) { $('stat-dogs').textContent = dogs; cache.dogs = dogs; }

  // Combo
  const combo = 'x' + state.combo.multiplier.toFixed(1);
  if (cache.combo !== combo) { $('stat-combo').textContent = combo; cache.combo = combo; }

  // Combo flotante grande
  updateComboFloat();

  // Fiebre
  const f = $('fever-fill');
  const pct = Math.min(100, (state.fever.value / ECONOMY.FEVER_MAX) * 100);
  if (f) f.style.width = pct + '%';
  const feverLabel = state.fever.active
    ? `¡FIEBRE! ${Math.max(0, ((state.fever.activeUntil - performance.now()) / 1000)).toFixed(0)}s`
    : `Fiebre ${pct.toFixed(0)}%`;
  if (cache.fever !== feverLabel) { $('stat-fever').textContent = feverLabel; cache.fever = feverLabel; }
  const feverEl = document.querySelector('#topbar .stat.fever');
  if (feverEl) feverEl.classList.toggle('fever-active', state.fever.active);
  // Overlay del parque
  const overlay = $('fever-overlay');
  if (overlay) overlay.classList.toggle('active', state.fever.active);

  // Popó por minuto (estimado)
  const ppm = estimatePPM();
  if (cache.ppm !== ppm) { $('stat-ppm').textContent = ppm.toLocaleString('es'); cache.ppm = ppm; }

  // Banner evento
  const banner = $('event-banner');
  if (state.progression.eventActive) {
    banner.classList.remove('hidden');
    banner.textContent = `${state.progression.eventActive.icon} ${state.progression.eventActive.name}`;
  } else if (banner) banner.classList.add('hidden');
}

function updateComboFloat () {
  const el = $('combo-float');
  if (!el) return;
  const m = state.combo.multiplier;
  const now = performance.now();

  // Si subió, mostramos burst
  if (m > _comboLastSeen + 0.04 && m >= 1.5) {
    el.classList.remove('hidden');
    el.textContent = 'x' + m.toFixed(1);
    el.style.color = colorForCombo(m);
    el.style.fontSize = (50 + Math.min(60, (m - 1) * 10)) + 'px';
    el.style.left = '50%';
    el.style.top  = '38%';
    el.style.transform = 'translate(-50%, -50%) scale(1.30) rotate(-4deg)';
    _comboFloatHideAt = now + 900;
    setTimeout(() => {
      if (el && !el.classList.contains('hidden')) {
        el.style.transform = 'translate(-50%, -50%) scale(1) rotate(-2deg)';
      }
    }, 80);
  } else if (m < _comboLastSeen - 0.05 || (now > _comboFloatHideAt && m < 1.5)) {
    el.classList.add('hidden');
  }
  _comboLastSeen = m;
}

function colorForCombo (m) {
  let c = COMBO_COLORS[0].color;
  for (const e of COMBO_COLORS) if (m >= e.from) c = e.color;
  return c;
}

function estimatePPM () {
  let ppm = 0;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (!d) continue;
    const ageMult = d.age === 'baby' ? 0.2 : d.age === 'young' ? 0.6 : d.age === 'veteran' ? 0.85 : 1.0;
    const base = 4 * ageMult * (d.rarity === 'cosmico' ? 16 : d.rarity === 'mitico' ? 8 : d.rarity === 'legend' ? 4.5 : d.rarity === 'epico' ? 2.5 : d.rarity === 'raro' ? 1.6 : 1);
    ppm += Math.round(base);
  }
  return ppm;
}
