// ============================================================
// parkHover.js — Tooltips sobre los perros (y bowls) del parque.
// Suscribe a onParkMove y muestra info detallada cuando el cursor
// pasa sobre un perro activo.
// ============================================================

import { state } from './gameState.js';
import { onParkMove } from './inputManager.js';
import { tooltip } from './tooltipManager.js';
import { BREEDS_BY_ID, RARITIES_BY_ID, QUALITIES_BY_ID, STAT_LABELS } from './data/dogs.js';
import { TRAITS_BY_ID } from './data/traits.js';
import { FOODS_BY_ID, FOOD_EFFECT_DESC } from './data/foods.js';
import { xpToNext } from './systems/dogSystem.js';
import { dogValue } from './systems/sellSystem.js';

let _hoverDogId = null;
let _hoverBowlId = null;
let _hideAt = 0;
// El tooltip del perro solo aparece si te quedas quieto encima (no estorba al recoger)
const DWELL_MS = 420;
let _candidateId = null;
let _candidateSince = 0;
let _lastEvt = null;

export function initParkHover () {
  onParkMove(handleMove);
  // Tick para ocultar tooltip si el cursor sale o se queda muy lejos
  setInterval(() => {
    if (_candidateId !== null && _hoverDogId !== _candidateId && _lastEvt
        && performance.now() - _candidateSince >= DWELL_MS) {
      const d = state.dogs.map[_candidateId];
      if (d && Math.hypot(d.x - _lastEvt.x, d.y - _lastEvt.y) < 34) {
        _hoverDogId = d.id;
        _hideAt = 0;
        tooltip.show(buildDogTooltip(d), _lastEvt.cx, _lastEvt.cy);
      } else _candidateId = null;
    }
    if (_hideAt && performance.now() > _hideAt) {
      tooltip.hide();
      _hoverDogId = null;
      _hoverBowlId = null;
      _hideAt = 0;
    }
  }, 100);
  // Si salimos del canvas también ocultamos
  const canvas = document.getElementById('park-canvas');
  if (canvas) {
    canvas.addEventListener('mouseleave', () => {
      tooltip.hide();
      _hoverDogId = null;
      _hoverBowlId = null;
      _hideAt = 0;
    });
  }
}

function handleMove (p, e) {
  if (!p || !e) {
    _hideAt = performance.now() + 200;
    return;
  }

  // 1) Perros
  const dog = findDogAt(p.x, p.y);
  _lastEvt = { x: p.x, y: p.y, cx: e.clientX, cy: e.clientY };
  if (dog) {
    if (_candidateId !== dog.id) {
      _candidateId = dog.id;
      _candidateSince = performance.now();
      if (_hoverDogId !== null || _hoverBowlId !== null) { tooltip.hide(); _hoverDogId = null; _hoverBowlId = null; }
      return;
    }
    _hoverBowlId = null;
    if (_hoverDogId === dog.id) {
      _hideAt = 0;
      tooltip.show(buildDogTooltip(dog), e.clientX, e.clientY);
    }
    return;
  }
  _candidateId = null;

  // 2) Platos
  const bowl = findBowlAt(p.x, p.y);
  if (bowl) {
    _hoverBowlId = bowl.id;
    _hoverDogId = null;
    _hideAt = 0;
    tooltip.show(buildBowlTooltip(bowl), e.clientX, e.clientY);
    return;
  }

  // 3) Nada bajo cursor
  if (_hoverDogId !== null || _hoverBowlId !== null) {
    _hideAt = performance.now() + 80;
  }
}

function findDogAt (x, y) {
  // Buscar en orden inverso para preferir el perro dibujado encima
  for (let i = state.park.activeDogs.length - 1; i >= 0; i--) {
    const id = state.park.activeDogs[i];
    const d = state.dogs.map[id];
    if (!d) continue;
    const r = d.age === 'baby' ? 18 : d.age === 'young' ? 22 : 26;
    const dx = d.x - x, dy = d.y - y;
    if (dx * dx + dy * dy <= r * r) return d;
  }
  return null;
}

function findBowlAt (x, y) {
  for (const b of state.park.bowls) {
    const dx = b.x - x, dy = b.y - y;
    if (dx * dx + dy * dy <= 28 * 28) return b;
  }
  return null;
}

function buildDogTooltip (d) {
  const r = RARITIES_BY_ID[d.rarity];
  const q = QUALITIES_BY_ID[d.quality];
  const breed = BREEDS_BY_ID[d.breed];
  const traitList = (d.traits || []).length
    ? (d.traits || []).map(t => {
        const tr = TRAITS_BY_ID[t];
        if (!tr) return t;
        const colorMap = { pos: '#4ade80', neg: '#f87171', esp: '#fbbf24' };
        return `<div style="display:flex; gap:6px; align-items:center; padding:1px 0; color:${colorMap[tr.kind] || '#fff'};">
          <span>${tr.icon}</span><span><strong>${tr.name}</strong></span>
        </div>`;
      }).join('')
    : '<div style="opacity:.6;">Sin traits</div>';

  const stateLabel = {
    idle: 'Descansando',
    walking: 'Caminando',
    eating: 'Comiendo',
    fighting: 'Peleando',
    resting: 'En reposo',
    pregnant: 'Embarazada',
    birthing: 'Pariendo',
  }[d.state] || d.state;

  const ageLabel = { baby: 'Bebé', young: 'Joven', adult: 'Adulto', veteran: 'Veterano' }[d.age] || d.age;
  const sexIcon = d.sex === 'M' ? '♂' : '♀';
  const sexColor = d.sex === 'M' ? '#60a5fa' : '#f472b6';

  const parents = d.parents
    ? `<div class="row"><span>Padres</span><strong>♂#${d.parents.father} + ♀#${d.parents.mother}</strong></div>`
    : `<div class="row"><span>Origen</span><strong>Salvaje</strong></div>`;

  const pregnancyBar = d.state === 'pregnant'
    ? `<div style="margin-top:6px;">
        <div style="font-size:11px; opacity:.8;">Embarazo</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${(1 - Math.max(0, d.pregnancyUntil - performance.now()) / Math.max(1, d.pregnancyTotal)) * 100}%; background: linear-gradient(90deg, #ec4899, #f472b6);"></div></div>
      </div>`
    : '';

  // XP bar
  const xpNext = xpToNext(d.level || 1);
  const xpPct = Math.min(100, ((d.xp || 0) / xpNext) * 100);
  const xpBar = `
    <div style="margin-top:4px;">
      <div style="font-size:10px; opacity:.7;">XP ${(d.xp || 0).toFixed(0)} / ${xpNext}</div>
      <div class="progress-bar" style="height:4px;"><div class="progress-fill" style="width:${xpPct}%; background: linear-gradient(90deg, #60a5fa, #a855f7);"></div></div>
    </div>`;

  // Stats nombrados
  const statRow = (id, val) => `<div class="row" style="font-size:11px;"><span>${STAT_LABELS[id]}</span><strong>${'★'.repeat(Math.round(val/2))}<span style="opacity:.5;">${'★'.repeat(5 - Math.round(val/2))}</span> ${val}</strong></div>`;
  const stats = d.stats ? `
    <div style="margin-top:4px; padding-top:4px; border-top: 1px solid rgba(255,255,255,0.08);">
      ${statRow('cago',  d.stats.cago)}
      ${statRow('come',  d.stats.come)}
      ${statRow('vel',   d.stats.vel)}
      ${statRow('pelea', d.stats.pelea)}
    </div>` : '';

  const value = dogValue(d);

  return `
    <h4 style="display:flex; gap:6px; align-items:center;">
      <span style="color:${sexColor}">${sexIcon}</span>
      <span>${d.name}</span>
      <span style="margin-left:auto; color:var(--r-${d.rarity});">${r.name}</span>
    </h4>
    <div class="row"><span>Raza</span><strong>${breed?.name || d.breed}</strong></div>
    <div class="row"><span>Calidad</span><strong style="color:var(--q-${d.quality});">${q.name} (×${q.mult})</strong></div>
    <div class="row"><span>Edad</span><strong>${ageLabel}</strong></div>
    <div class="row"><span>Nivel</span><strong>${d.level || 1}</strong></div>
    ${xpBar}
    <div class="row"><span>Estado</span><strong>${stateLabel}</strong></div>
    <div class="row"><span>Hambre</span><strong>${d.hunger.toFixed(0)} / 100</strong></div>
    <div class="row"><span>Felicidad</span><strong>${d.happiness.toFixed(0)} / 100</strong></div>
    <div class="row"><span>Generación</span><strong>${d.generation || 1}</strong></div>
    <div class="row"><span>Valor</span><strong>💩 ${value.toLocaleString('es')}</strong></div>
    ${parents}
    ${pregnancyBar}
    ${stats}
    <div style="margin-top:6px; padding-top:6px; border-top: 1px solid rgba(255,255,255,0.10);">
      <div style="font-size:11px; opacity:.8; margin-bottom:2px;">Traits</div>
      ${traitList}
    </div>
    <div style="margin-top:6px; padding-top:6px; font-size:10px; opacity:.7; border-top: 1px solid rgba(255,255,255,0.10);">
      Click sobre el perro para acariciarlo (cada 6s)
    </div>
  `;
}

function buildBowlTooltip (b) {
  const f = FOODS_BY_ID[b.type] || FOODS_BY_ID.croquetas;
  const ratio = b.qty / b.capacity;
  const color = ratio < 0.25 ? '#f87171' : ratio < 0.6 ? '#fbbf24' : '#4ade80';
  return `
    <h4>${f.icon} Plato</h4>
    <div class="row"><span>Comida</span><strong>${f.name}</strong></div>
    <div class="row"><span>Cantidad</span><strong style="color:${color};">${b.qty} / ${b.capacity}</strong></div>
    <div class="row"><span>+ Hambre</span><strong>${f.hunger}</strong></div>
    <div class="row"><span>+ Felicidad</span><strong>${f.happiness}</strong></div>
    <div class="row"><span>Efecto</span><strong>${FOOD_EFFECT_DESC[f.effect ?? 'null']}</strong></div>
  `;
}
