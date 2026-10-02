// ============================================================
// render/renderHUD.js — barra superior, combo flotante grande,
// overlay de Fiebre del Parque.
// ============================================================

import { state } from '../gameState.js';
import { ECONOMY } from '../config.js';
import { fmt, rollCounter } from './juice.js';
import { xpForLevel, activeBuffs, earnRatePerMin } from '../systems/hookSystem.js';

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
  if (cache.poop !== poop) { rollCounter($('stat-poop'), poop); cache.poop = poop; }

  // Nivel + XP
  const lvl = state.player?.level || 1;
  const need = xpForLevel(lvl);
  const xp = Math.floor(state.player?.xp || 0);
  const lvlKey = lvl + ':' + xp;
  if (cache.lvl !== lvlKey) {
    $('stat-level').textContent = 'Nv ' + lvl;
    $('stat-xp').textContent = fmt(xp) + '/' + fmt(need);
    $('level-fill').style.width = Math.min(100, (xp / need) * 100) + '%';
    const wrap = $('stat-level-wrap');
    if (cache.lvlNum !== undefined && cache.lvlNum !== lvl && wrap) {
      wrap.classList.remove('level-up'); void wrap.offsetWidth; wrap.classList.add('level-up');
    }
    cache.lvlNum = lvl;
    cache.lvl = lvlKey;
  }

  // Ruleta
  const spins = state.hooks?.spins || 0;
  if (cache.spins !== spins) {
    $('wheel-count').textContent = spins;
    $('btn-wheel').classList.toggle('has-spins', spins > 0);
    cache.spins = spins;
  }

  // Buffs activos
  renderBuffs();

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
  // Mostramos lo que realmente estás ganando si supera el estimado pasivo
  const ppm = Math.max(estimatePPM(), Math.round(earnRatePerMin()));
  if (cache.ppm !== ppm) { $('stat-ppm').textContent = fmt(ppm); cache.ppm = ppm; }

  // Banner evento
  const banner = $('event-banner');
  if (state.progression.eventActive) {
    banner.classList.remove('hidden');
    banner.textContent = `${state.progression.eventActive.icon} ${state.progression.eventActive.name}`;
  } else if (banner) banner.classList.add('hidden');
}

function updateComboFloat () {
  // El combo ahora se muestra junto al cursor (anillo) y con callouts grandes
  return;
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

function renderBuffs () {
  const bar = $('buff-bar');
  if (!bar) return;
  const now = performance.now();
  const buffs = activeBuffs();
  const key = buffs.map(b => b.id + Math.ceil((b.until - now) / 1000)).join('|');
  if (cache.buffs === key) return;
  cache.buffs = key;
  bar.innerHTML = buffs.map(b => {
    const left = Math.max(0, (b.until - now) / 1000);
    const pct = Math.min(100, (left * 1000 / b.total) * 100);
    return `<div class="buff-chip" style="--buff-color:${b.color}">
      <div class="buff-fill" style="width:${pct}%"></div>
      <span>${b.icon} ${b.name}${b.mult > 1 ? ' x' + b.mult : ''}</span><strong>${Math.ceil(left)}s</strong>
    </div>`;
  }).join('');
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
