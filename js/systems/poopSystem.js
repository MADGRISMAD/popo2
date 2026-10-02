// ============================================================
// systems/poopSystem.js — popó: spawn, recolección, combo, fiebre.
// ============================================================

import { state } from '../gameState.js';
import { POOP, ECONOMY, PARK, HOOKS } from '../config.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';
import { RARITIES_BY_ID, QUALITIES_BY_ID, BREEDS_BY_ID } from '../data/dogs.js';
import { sfx } from '../audioManager.js';
import { traitMult } from './dogSystem.js';
import { getModifiers } from './specializationSystem.js';
import { logEvent } from '../eventLog.js';
import { onParkMove, onParkClick } from '../inputManager.js';
import { burst, sparkle, trail, confetti } from '../render/particles.js';
import { shake, flash, banner, fmt } from '../render/juice.js';
import {
  gainXP, recordEarn, buffValueMult, buffMagnet, buffGoldChance,
  tryCollectBox, onComboPick, setRainImpl,
} from './hookSystem.js';

let _nextPoopId = 1;
let _initialized = false;

export function init () {
  if (_initialized) return;
  _initialized = true;
  onParkMove(handleHover);
  onParkClick(handleClick);
  setRainImpl(spawnRain);
}

// Tras cargar partida: performance.now() reinicia, así que normalizamos
export function normalizeLoaded () {
  let maxId = 0;
  for (const p of state.park.poops) {
    p.bornAt = 0;
    p.dropped = false;
    maxId = Math.max(maxId, p.id || 0);
  }
  _nextPoopId = Math.max(_nextPoopId, maxId + 1);
}

// Lluvia de popó: caen muchas popós de golpe (cajas, fiebre…)
export function spawnRain (n) {
  const dogs = state.park.activeDogs.map(id => state.dogs.map[id]).filter(Boolean);
  if (dogs.length === 0) return;
  const now = performance.now();
  for (let i = 0; i < n; i++) {
    if (state.park.poops.length >= POOP.MAX_ON_GROUND + 40) break;
    const dog = dogs[Math.floor(Math.random() * dogs.length)];
    const golden = Math.random() < 0.08;
    state.park.poops.push({
      id: _nextPoopId++,
      x: 30 + Math.random() * (PARK.W - 60),
      y: 30 + Math.random() * (PARK.H - 60),
      value: poopValue(dog) * (golden ? POOP.GOLDEN_MULT : 1),
      golden,
      bornAt: now + Math.random() * 900, // caen escalonadas
      dropped: true,
    });
  }
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
  const pGold = goldenChanceUpg * eventBoost * olfato * (mods.goldenChance || 1) * buffGoldChance();
  const rainbow = Math.random() < HOOKS.RAINBOW_CHANCE * (eventBoost > 1 ? 2 : 1);
  const golden = !rainbow && Math.random() < pGold;
  const value = poopValue(dog) * (rainbow ? HOOKS.RAINBOW_MULT : golden ? POOP.GOLDEN_MULT : 1);

  const ox = dog.x + (Math.random() - 0.5) * 20;
  const oy = dog.y + (Math.random() - 0.5) * 20;

  state.park.poops.push({
    id: _nextPoopId++,
    x: Math.max(8, Math.min(PARK.W - 8, ox)),
    y: Math.max(8, Math.min(PARK.H - 8, oy)),
    value, golden, rainbow,
    bornAt: performance.now(),
  });
}

// ---------- Recolección por hover / click ----------
function handleHover (p) {
  if (!p) return;
  const mods = getModifiers();
  const radius = 16 + (UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0)) + (mods.magnetExtra || 0) + buffMagnet();
  tryCollectBox(p.x, p.y);
  collectAround(p.x, p.y, radius);
}
function handleClick (p) {
  if (!p) return;
  const mods = getModifiers();
  const radius = 28 + (UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0)) + (mods.magnetExtra || 0) + buffMagnet();
  tryCollectBox(p.x, p.y, 44);
  collectAround(p.x, p.y, radius);
}

function collectAround (x, y, radius) {
  const r2 = radius * radius;
  const now = performance.now();
  const remaining = [];
  let collected = 0;
  let totalValue = 0;
  let goldCount = 0;
  let rainbowCount = 0;
  for (const p of state.park.poops) {
    const dx = p.x - x, dy = p.y - y;
    // Las popós que aún están cayendo no se pueden recoger
    if (dx * dx + dy * dy <= r2 && now >= (p.bornAt || 0)) {
      collected++;
      totalValue += p.value;
      if (p.golden) goldCount++;
      if (p.rainbow) rainbowCount++;
      // Partículas de absorción en cada popó recogida
      burst(p.x, p.y, {
        count: p.rainbow ? 30 : p.golden ? 12 : 5,
        color: p.rainbow ? `hsl(${Math.random() * 360},90%,65%)` : p.golden ? '#ffe27a' : '#7a4a1c',
        speed: p.rainbow ? 220 : 90, gravity: -60, life: p.rainbow ? 0.9 : 0.45,
        size: 2.6, spread: Math.PI * 2, glow: p.golden || p.rainbow,
        shape: p.golden || p.rainbow ? 'star' : 'circle',
      });
    } else remaining.push(p);
  }
  if (collected === 0) return;
  state.park.poops = remaining;
  applyPick(collected, totalValue, goldCount, rainbowCount, x, y);
  if (goldCount > 0) sparkle(x, y, '#ffe27a', 16);
  // Estela hacia el cursor mientras hay combo
  if (state.combo.multiplier > 1.5) trail(x, y, '#ffe27a');
}

let _pickStep = 0;

function applyPick (count, totalValue, goldCount, rainbowCount, x, y) {
  const now = performance.now();
  // Combo: el multiplicador se enfría poco a poco (ver update), cada popó suma.
  // Las doradas cuentan triple y las arcoíris x10.
  const steps = count + goldCount * 2 + rainbowCount * 9;
  if (state.combo.multiplier <= 1.01) _pickStep = 0;
  state.combo.multiplier = Math.min(ECONOMY.COMBO_MAX, state.combo.multiplier + ECONOMY.COMBO_STEP * steps);
  state.combo.lastPickAt = now;
  state.stats.maxCombo = Math.max(state.stats.maxCombo || 1, state.combo.multiplier);
  onComboPick(state.combo.multiplier);

  // Aplica fiebre
  state.fever.value = Math.min(ECONOMY.FEVER_MAX, state.fever.value + ECONOMY.FEVER_GAIN_PER_PICK * steps);
  checkFever(now);

  // Final value con combo + fiebre + buffs
  const feverMult = state.fever.active ? 2.0 : 1.0;
  const buffMult = buffValueMult();
  const earned = Math.round(totalValue * state.combo.multiplier * feverMult * buffMult);
  state.resources.poop += earned;
  state.resources.coinsLifetime += earned;
  state.stats.totalPoopCollected += count;
  recordEarn(earned);
  gainXP(count * HOOKS.XP_PER_POOP + goldCount * HOOKS.XP_PER_GOLDEN + rainbowCount * HOOKS.XP_PER_RAINBOW);
  if (goldCount) {
    state.stats.totalGoldenPoop = (state.stats.totalGoldenPoop || 0) + goldCount;
    state.stats._everGolden = true;
  }

  // Sonido: cada popó sube un tono en la escala → el combo "canta"
  _pickStep += count;
  if (rainbowCount) {
    sfx.rainbow();
    shake(16);
    flash('rgba(255,255,255,0.7)');
    confetti(x, y, 70);
    banner('¡¡POPÓ ARCOÍRIS!!', { kind: 'jackpot', color: '#ec59c2', sub: `+${fmt(earned)} 💩`, ms: 2200 });
  } else if (goldCount) {
    sfx.pickGold();
    shake(4);
  } else {
    sfx.pickCombo(Math.min(_pickStep, 24), state.fever.active);
  }

  const cls = rainbowCount ? 'rainbow big' : goldCount ? 'golden' : (buffMult > 1 ? 'frenzy' : '');
  spawnFloatLabel(x, y, '+' + fmt(earned), cls);
}

function checkFever (now = performance.now()) {
  if (state.fever.value >= ECONOMY.FEVER_MAX && !state.fever.active) {
    state.fever.active = true;
    state.fever.activeUntil = now + ECONOMY.FEVER_DURATION_MS;
    state.progression._feverEverActivated = true;
    sfx.fever();
    logEvent('¡FIEBRE DEL PARQUE activada! ✨', 'gold');
    // Confeti grande en el centro del parque + lluvia de popó
    confetti(PARK.W / 2, PARK.H / 2, 80);
    shake(12);
    flash('rgba(236,89,133,0.40)');
    banner('¡FIEBRE DEL PARQUE!', { kind: 'level', color: '#ec5985', sub: 'Todo vale x2 · ¡Lluvia de popó!', ms: 2000 });
    spawnRain(HOOKS.FEVER_RAIN);
  }
}

// ---------- Etiquetas flotantes "+25" ----------
function spawnFloatLabel (cx, cy, text, cls = '') {
  const overlay = document.getElementById('park-overlay');
  if (!overlay) return;
  const canvas = document.getElementById('park-canvas');
  const rect = canvas.getBoundingClientRect();
  const ovRect = overlay.getBoundingClientRect();
  const px = (cx / canvas.width) * rect.width + (rect.left - ovRect.left);
  const py = (cy / canvas.height) * rect.height + (rect.top - ovRect.top);
  const el = document.createElement('div');
  el.className = 'float-label' + (cls ? ' ' + cls : '');
  el.style.left = px + 'px';
  el.style.top = py + 'px';
  el.textContent = text;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ---------- Update por frame ----------
export function update (dt) {
  const now = performance.now();
  // Combo decay: tras la ventana, se enfría cada vez más rápido
  if (state.combo.multiplier > 1 && now - state.combo.lastPickAt > ECONOMY.COMBO_DECAY_MS) {
    const cold = (now - state.combo.lastPickAt - ECONOMY.COMBO_DECAY_MS) / 1000;
    state.combo.multiplier = Math.max(1, state.combo.multiplier - dt * (0.5 + cold * 0.8));
  }
  checkFever(now);
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
