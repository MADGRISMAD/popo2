// ============================================================
// systems/poopSystem.js — popó: spawn, recolección, combo, fiebre.
// ============================================================

import { state } from '../gameState.js';
import { POOP, ECONOMY, PARK } from '../config.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';
import { RARITIES_BY_ID, QUALITIES_BY_ID, BREEDS_BY_ID } from '../data/dogs.js';
import { sfx } from '../audioManager.js';
import { traitMult } from './dogSystem.js';
import { getModifiers } from './specializationSystem.js';
import { logEvent } from '../eventLog.js';
import { onParkMove, onParkClick } from '../inputManager.js';

let _nextPoopId = 1;
let _initialized = false;

export function init () {
  if (_initialized) return;
  _initialized = true;
  onParkMove(handleHover);
  onParkClick(handleClick);
}

function poopValue (dog) {
  const mods = getModifiers();
  const base = POOP.BASE_VALUE
             * (BREEDS_BY_ID[dog.breed]?.produce ?? 1)
             * RARITIES_BY_ID[dog.rarity].mult
             * QUALITIES_BY_ID[dog.quality].mult;
  const upgValue = UPGRADES_BY_ID.value.effect(state.inventory.upgrades.value || 0);
  const ageMult = dog.age === 'baby' ? 0.2 : dog.age === 'young' ? 0.6 : dog.age === 'veteran' ? 0.85 : 1.0;
  const traitV = traitMult(dog, 'digestion', 1.15) * traitMult(dog, 'iman', 1.15) * traitMult(dog, 'fantasma', 2);
  const prestigeBonus = 1 + (state.progression.prestigePoints || 0) * 0.04;
  const levelMult = 1 + ((dog.level || 1) - 1) * 0.04;
  const specMult = (mods.prodMult || 1) * (mods.pickValue || 1);
  return Math.max(1, Math.round(base * upgValue * ageMult * traitV * prestigeBonus * levelMult * specMult));
}

export function spawnPoopFromDog (dog) {
  if (state.park.poops.length >= POOP.MAX_ON_GROUND) return;
  const mods = getModifiers();
  const goldenChanceUpg = UPGRADES_BY_ID.goldenchance.effect(state.inventory.upgrades.goldenchance || 0);
  const eventBoost = state.progression.eventActive?.id === 'rain_gold' ? 3 : 1;
  const olfato = dog.traits.includes('olfato') ? 1.2 : 1;
  const pGold = goldenChanceUpg * eventBoost * olfato * (mods.goldenChance || 1);
  const golden = Math.random() < pGold;
  const value = poopValue(dog) * (golden ? POOP.GOLDEN_MULT : 1);

  const ox = dog.x + (Math.random() - 0.5) * 20;
  const oy = dog.y + (Math.random() - 0.5) * 20;

  state.park.poops.push({
    id: _nextPoopId++,
    x: Math.max(8, Math.min(PARK.W - 8, ox)),
    y: Math.max(8, Math.min(PARK.H - 8, oy)),
    value, golden,
    bornAt: performance.now(),
  });
}

// ---------- Recolección por hover / click ----------
function handleHover (p) {
  if (!p) return;
  const mods = getModifiers();
  const radius = 16 + (UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0)) + (mods.magnetExtra || 0);
  collectAround(p.x, p.y, radius);
}
function handleClick (p) {
  if (!p) return;
  const mods = getModifiers();
  const radius = 28 + (UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0)) + (mods.magnetExtra || 0);
  collectAround(p.x, p.y, radius);
}

function collectAround (x, y, radius) {
  const r2 = radius * radius;
  const remaining = [];
  let collected = 0;
  let totalValue = 0;
  let golden = false;
  for (const p of state.park.poops) {
    const dx = p.x - x, dy = p.y - y;
    if (dx * dx + dy * dy <= r2) {
      collected++;
      totalValue += p.value;
      if (p.golden) golden = true;
    } else remaining.push(p);
  }
  if (collected === 0) return;
  state.park.poops = remaining;
  applyPick(collected, totalValue, golden, x, y);
}

function applyPick (count, totalValue, golden, x, y) {
  // Actualiza combo
  const now = performance.now();
  if (now - state.combo.lastPickAt < ECONOMY.COMBO_DECAY_MS) {
    state.combo.multiplier = Math.min(ECONOMY.COMBO_MAX, state.combo.multiplier + ECONOMY.COMBO_STEP * count);
  } else {
    state.combo.multiplier = Math.max(1, 1 + ECONOMY.COMBO_STEP * count);
  }
  state.combo.lastPickAt = now;
  state.stats.maxCombo = Math.max(state.stats.maxCombo || 1, state.combo.multiplier);

  // Aplica fiebre
  state.fever.value = Math.min(ECONOMY.FEVER_MAX, state.fever.value + ECONOMY.FEVER_GAIN_PER_PICK * count);
  if (state.fever.value >= ECONOMY.FEVER_MAX && !state.fever.active) {
    state.fever.active = true;
    state.fever.activeUntil = now + ECONOMY.FEVER_DURATION_MS;
    sfx.fever();
    logEvent('¡FIEBRE DEL PARQUE activada! ✨', 'gold');
  }

  // Final value con combo + fiebre
  const feverMult = state.fever.active ? 2.0 : 1.0;
  const earned = Math.round(totalValue * state.combo.multiplier * feverMult);
  state.resources.poop += earned;
  state.resources.coinsLifetime += earned;
  state.stats.totalPoopCollected += count;
  if (golden) {
    state.stats.totalGoldenPoop = (state.stats.totalGoldenPoop || 0) + 1;
    state.stats._everGolden = true;
  }

  if (golden) sfx.pickGold(); else sfx.pick();
  spawnFloatLabel(x, y, '+' + earned, golden);
}

// ---------- Etiquetas flotantes "+25" ----------
function spawnFloatLabel (cx, cy, text, gold) {
  const overlay = document.getElementById('park-overlay');
  if (!overlay) return;
  const canvas = document.getElementById('park-canvas');
  const rect = canvas.getBoundingClientRect();
  const ovRect = overlay.getBoundingClientRect();
  const px = (cx / canvas.width) * rect.width + (rect.left - ovRect.left);
  const py = (cy / canvas.height) * rect.height + (rect.top - ovRect.top);
  const el = document.createElement('div');
  el.className = 'float-label';
  el.style.left = px + 'px';
  el.style.top = py + 'px';
  el.style.color = gold ? '#fbbf24' : '#fff';
  el.textContent = text;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

// ---------- Update por frame ----------
export function update (dt) {
  const now = performance.now();
  // Combo decay
  if (state.combo.multiplier > 1 && now - state.combo.lastPickAt > ECONOMY.COMBO_DECAY_MS) {
    state.combo.multiplier = Math.max(1, state.combo.multiplier - dt * 0.6);
  }
  // Fiebre decay/expire
  if (state.fever.active) {
    if (now >= state.fever.activeUntil) {
      state.fever.active = false;
      state.fever.value = 0;
    }
  } else {
    state.fever.value = Math.max(0, state.fever.value - ECONOMY.FEVER_DECAY_PER_SEC * dt);
  }
}
