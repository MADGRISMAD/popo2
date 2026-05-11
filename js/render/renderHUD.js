// ============================================================
// render/renderHUD.js — actualiza la barra superior y eventos.
// ============================================================

import { state } from '../gameState.js';
import { ECONOMY } from '../config.js';

let cache = {};
const $ = id => document.getElementById(id);

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

  // Fiebre
  const f = $('fever-fill');
  const pct = Math.min(100, (state.fever.value / ECONOMY.FEVER_MAX) * 100);
  f.style.width = pct + '%';
  const feverLabel = state.fever.active
    ? `¡FIEBRE! ${Math.max(0, ((state.fever.activeUntil - performance.now()) / 1000)).toFixed(0)}s`
    : `Fiebre ${pct.toFixed(0)}%`;
  if (cache.fever !== feverLabel) { $('stat-fever').textContent = feverLabel; cache.fever = feverLabel; }
  const feverEl = document.querySelector('#topbar .stat.fever');
  feverEl.classList.toggle('fever-active', state.fever.active);

  // Popó por minuto (estimado)
  const ppm = estimatePPM();
  if (cache.ppm !== ppm) { $('stat-ppm').textContent = ppm.toLocaleString('es'); cache.ppm = ppm; }

  // Banner evento
  const banner = $('event-banner');
  if (state.progression.eventActive) {
    banner.classList.remove('hidden');
    banner.textContent = `${state.progression.eventActive.icon} ${state.progression.eventActive.name}`;
  } else banner.classList.add('hidden');
}

function estimatePPM () {
  // Suma simple de tasas instantáneas
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
