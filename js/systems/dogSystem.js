// ============================================================
// systems/dogSystem.js — Crea perros, los mueve, gestiona estados,
// edad, hambre, felicidad, peleas, descanso, embarazo, niveles.
// ============================================================

import { UPGRADES_BY_ID } from '../data/upgrades.js';
import { state } from '../gameState.js';
import { DOG, PARK } from '../config.js';
import { BREEDS, BREEDS_BY_ID, RARITIES, RARITIES_BY_ID, QUALITIES, QUALITIES_BY_ID } from '../data/dogs.js';
import { TRAITS, POS_TRAITS, NEG_TRAITS, ESP_TRAITS, TRAITS_BY_ID } from '../data/traits.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { getModifiers } from './specializationSystem.js';

// ---------- Helpers de aleatoriedad ----------
const rand = (min, max) => Math.random() * (max - min) + min;
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;

function rollWeighted (items, getW) {
  let total = 0;
  for (const it of items) total += getW(it);
  let r = Math.random() * total;
  for (const it of items) {
    r -= getW(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// ---------- Crear perro ----------
export function createDog (opts = {}) {
  const id = state.dogs.nextId++;
  const breedObj = opts.breed ? BREEDS_BY_ID[opts.breed] : null;
  const breed = breedObj ?? rollBreedByRarityWeights(opts.rarityWeights || null);
  const rarity = opts.rarity ?? breed.rarity;
  const quality = opts.quality ?? rollInitialQuality(rarity);
  const sex = opts.sex ?? (chance(0.5) ? 'M' : 'F');
  const traits = opts.traits ?? rollInitialTraits(rarity);

  const dog = {
    id,
    breed: breed.id,
    rarity,
    quality,
    sex,
    traits,
    name: breed.name,
    age: opts.age ?? 'baby',           // baby | young | adult | veteran
    ageT: 0,                           // segundos transcurridos en estado actual
    bornAt: Date.now(),
    parents: opts.parents ?? null,
    generation: opts.generation ?? 1,
    // Niveles / XP
    level: opts.level ?? 1,
    xp: 0,
    // Stats nombrados (con variación aleatoria sobre la base de la raza)
    stats: opts.stats ?? rollStatsFromBreed(breed),
    // Stats vivos (solo si en parque)
    x: opts.x ?? rand(80, PARK.W - 80),
    y: opts.y ?? rand(80, PARK.H - 80),
    targetX: 0, targetY: 0,
    state: 'idle',                     // idle | walking | eating | fighting | resting | pregnant | birthing
    stateUntil: 0,
    hunger: opts.hunger ?? 80,
    happiness: opts.happiness ?? 80,
    lastPoopT: 0,
    pregnancyUntil: 0,
    pregnancyTotal: 0,
    pregnantBy: null,
    lastPetAt: 0,
    _foodProdBoostUntil: 0,
    _breedBoostUntil: 0,
  };
  state.dogs.map[id] = dog;
  return dog;
}

function rollStatsFromBreed (breed) {
  const j = (b) => Math.max(1, Math.min(10, Math.round(b + (Math.random() * 2 - 1))));
  return {
    cago:  j(breed.cago  ?? 5),
    come:  j(breed.come  ?? 5),
    vel:   j(breed.vel   ?? 5),
    pelea: j(breed.pelea ?? 5),
  };
}

function rollBreedByRarityWeights (override) {
  const weights = override ?? Object.fromEntries(RARITIES.map(r => [r.id, r.weight]));
  const r = rollWeighted(RARITIES, x => weights[x.id] || 0);
  const candidates = BREEDS.filter(b => b.rarity === r.id);
  return choice(candidates);
}

function rollInitialQuality (rarity) {
  const tableByRarity = {
    comun:  [['gris', 70], ['verde', 22], ['azul', 7],  ['morado', 1]],
    raro:   [['gris', 50], ['verde', 30], ['azul', 14], ['morado', 5], ['dorado', 1]],
    epico:  [['gris', 25], ['verde', 35], ['azul', 25], ['morado', 12], ['dorado', 3]],
    legend: [['gris', 10], ['verde', 25], ['azul', 32], ['morado', 22], ['dorado', 9], ['rojo', 2]],
    mitico: [['verde', 20], ['azul', 30], ['morado', 28], ['dorado', 16], ['rojo', 5], ['cosmico', 1]],
    cosmico:[['azul', 15], ['morado', 30], ['dorado', 35], ['rojo', 15], ['cosmico', 5]],
  };
  const t = tableByRarity[rarity] || tableByRarity.comun;
  return rollWeighted(t, e => e[1])[0];
}

function rollInitialTraits (rarity) {
  const max = { comun: 1, raro: 2, epico: 3, legend: 4, mitico: 4, cosmico: 4 }[rarity] || 1;
  const n = Math.min(max, Math.floor(Math.random() * (max + 1)));
  const out = new Set();
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    let pool;
    if (rarity === 'cosmico' || rarity === 'mitico') pool = r < 0.55 ? POS_TRAITS : (r < 0.85 ? ESP_TRAITS : NEG_TRAITS);
    else if (rarity === 'legend') pool = r < 0.60 ? POS_TRAITS : (r < 0.80 ? ESP_TRAITS : NEG_TRAITS);
    else if (rarity === 'epico')  pool = r < 0.55 ? POS_TRAITS : (r < 0.65 ? ESP_TRAITS : NEG_TRAITS);
    else                          pool = r < 0.50 ? POS_TRAITS : NEG_TRAITS;
    out.add(choice(pool).id);
  }
  return [...out];
}

// ---------- Niveles ----------
export function xpToNext (lvl) {
  return Math.floor(DOG.LEVEL_XP_BASE * Math.pow(DOG.LEVEL_XP_GROWTH, lvl - 1));
}

export function addXP (dog, amount) {
  if (!dog || dog.level >= DOG.MAX_LEVEL) return false;
  dog.xp += amount;
  let leveled = false;
  while (dog.level < DOG.MAX_LEVEL && dog.xp >= xpToNext(dog.level)) {
    dog.xp -= xpToNext(dog.level);
    dog.level += 1;
    leveled = true;
    // Cada level-up sube ligeramente stats
    const keys = ['cago', 'vel'];
    const k = choice(keys);
    if (dog.stats[k] < 10) dog.stats[k] += 1;
  }
  if (leveled) {
    sfx.click();
    logEvent(`${dog.name} subió a nivel ${dog.level}`, 'gold');
  }
  return leveled;
}

// ---------- Activar / desactivar ----------
export function activateDog (dogId) {
  const dog = state.dogs.map[dogId];
  if (!dog) return false;
  if (state.park.activeDogs.includes(dogId)) return false;
  if (state.park.activeDogs.length >= state.park.capacity) return false;
  state.inventory.storedDogs = state.inventory.storedDogs.filter(id => id !== dogId);
  state.park.activeDogs.push(dogId);
  dog.x = rand(80, PARK.W - 80);
  dog.y = rand(80, PARK.H - 80);
  dog.state = 'idle';
  return true;
}

export function deactivateDog (dogId) {
  const dog = state.dogs.map[dogId];
  if (!dog) return false;
  if (dog.state === 'pregnant') return false;
  state.park.activeDogs = state.park.activeDogs.filter(id => id !== dogId);
  if (!state.inventory.storedDogs.includes(dogId)) state.inventory.storedDogs.push(dogId);
  return true;
}

// ---------- Update por frame ----------
export function update (dt) {
  for (const id of state.park.activeDogs) {
    const dog = state.dogs.map[id];
    if (!dog) continue;
    updateDog(dog, dt);
  }
  // Update edad de bebés en inventario también
  for (const id of state.inventory.storedDogs) {
    const dog = state.dogs.map[id];
    if (dog) updateAge(dog, dt);
  }
}

function updateDog (dog, dt) {
  const now = performance.now();
  const mods = getModifiers();
  updateAge(dog, dt);

  // Hambre / felicidad
  const comeFactor = 0.6 + (dog.stats?.come ?? 5) / 20;        // 0.7 a 1.1
  const hungerMult = traitMult(dog, 'estomago', 0.75) * traitMult(dog, 'gloton', 1.5) * comeFactor
                   * UPGRADES_BY_ID.hunger.effect(state.inventory.upgrades.hunger || 0);
  const happMult   = traitMult(dog, 'felizpornat', 0.6) * (mods.happyDecay || 1)
                   * UPGRADES_BY_ID.happy.effect(state.inventory.upgrades.happy || 0);
  dog.hunger     = Math.max(0, dog.hunger - DOG.HUNGER_DECAY_PER_SEC * hungerMult * dt);
  dog.happiness  = Math.max(0, dog.happiness - DOG.HAPPINESS_DECAY_PER_SEC * happMult * dt);

  // Saturación de popó: si hay demasiada en el suelo, pierde felicidad extra
  const poopCount = state.park.poops.length;
  if (poopCount > 30) {
    dog.happiness = Math.max(0, dog.happiness - 0.4 * dt * (poopCount / 30));
  }

  // Embarazo
  if (dog.state === 'pregnant') {
    if (now >= dog.pregnancyUntil) dog._readyToBirth = true;
    return;
  }

  // Descanso
  if (dog.state === 'resting') {
    if (now >= dog.stateUntil) dog.state = 'idle';
    return;
  }

  // Peleando
  if (dog.state === 'fighting') {
    if (now >= dog.stateUntil) {
      dog.state = 'resting';
      dog.stateUntil = now + DOG.FIGHT_REST_MS;
      dog.happiness = Math.max(0, dog.happiness - 10);
      addXP(dog, DOG.XP_PER_FIGHT);
    }
    return;
  }

  // Movimiento
  if (dog.state === 'idle' || dog.state === 'walking') {
    if (dog.state === 'idle' || (Math.abs(dog.x - dog.targetX) < 4 && Math.abs(dog.y - dog.targetY) < 4)) {
      const targetBowl = (dog.hunger < DOG.HUNGRY_THRESHOLD) ? findBowlFor(dog) : null;
      if (targetBowl) {
        dog.targetX = targetBowl.x; dog.targetY = targetBowl.y;
        dog._goingToBowl = targetBowl.id;
      } else {
        dog.targetX = rand(60, PARK.W - 60);
        dog.targetY = rand(60, PARK.H - 60);
        dog._goingToBowl = null;
      }
      dog.state = 'walking';
    }
    moveTowards(dog, dt, mods);

    if (dog._goingToBowl && Math.abs(dog.x - dog.targetX) < 8 && Math.abs(dog.y - dog.targetY) < 8) {
      const bowl = state.park.bowls.find(b => b.id === dog._goingToBowl);
      if (bowl && bowl.qty > 0) {
        import('./foodBowlSystem.js').then(m => m.feedFromBowl(dog, bowl));
        addXP(dog, DOG.XP_PER_FEED);
      }
      dog._goingToBowl = null;
    }
  }

  // Producir popó
  if (dog.age !== 'baby' || Math.random() < 0.0001) {
    const interval = poopInterval(dog);
    dog.lastPoopT += dt;
    if (dog.lastPoopT >= interval) {
      dog.lastPoopT = 0;
      import('./poopSystem.js').then(m => m.spawnPoopFromDog(dog));
      addXP(dog, DOG.XP_PER_POOP);
    }
  }

  // Posibilidad de pelea
  maybePickFight(dog, mods);
}

function updateAge (dog, dt) {
  const mods = getModifiers();
  const grow = (mods.babyGrow || 1) * (state.park.activeCombos?.baby_3 ? 1.25 : 1);
  dog.ageT += dt * grow;
  if (dog.age === 'baby' && dog.ageT >= DOG.AGE_BABY_S)         { dog.age = 'young';    dog.ageT = 0; logEvent(`${dog.name} creció a joven`, 'gold'); }
  else if (dog.age === 'young' && dog.ageT >= DOG.AGE_YOUNG_S)  { dog.age = 'adult';    dog.ageT = 0; logEvent(`${dog.name} ya es adulto`, 'gold'); }
  else if (dog.age === 'adult' && dog.ageT >= DOG.AGE_VETERAN_S){ dog.age = 'veteran';  dog.ageT = 0; logEvent(`${dog.name} es ahora veterano`); }
}

function moveTowards (dog, dt, mods) {
  const breedSp = (BREEDS_BY_ID[dog.breed]?.baseSpeed ?? 1);
  const statSp  = 0.6 + (dog.stats?.vel ?? 5) / 12;             // 0.7 a 1.4
  const speed = DOG.MOVE_SPEED_BASE
              * breedSp * statSp
              * (dog.age === 'baby' ? DOG.MOVE_SPEED_BABY_MULT : 1)
              * traitMult(dog, 'hiperactivo', 1.3)
              * traitMult(dog, 'perezoso',    0.7)
              * (mods.speedMult || 1)
              * (state.park.activeCombos?.speed_chaos ? 1.20 : 1);
  const dx = dog.targetX - dog.x;
  const dy = dog.targetY - dog.y;
  const d = Math.hypot(dx, dy) || 1;
  dog.x += (dx / d) * speed * dt;
  dog.y += (dy / d) * speed * dt;
}

function findBowlFor (dog) {
  if (state.park.bowls.length === 0) return null;
  let best = null, bestD = Infinity;
  for (const b of state.park.bowls) {
    if (b.qty <= 0) continue;
    const d = Math.hypot(b.x - dog.x, b.y - dog.y);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

function poopInterval (dog) {
  const breedRate = BREEDS_BY_ID[dog.breed]?.produce ?? 1;
  const statCago  = 0.6 + (dog.stats?.cago ?? 5) / 12;          // 0.7 a 1.4
  const baseRate  = breedRate * RARITIES_BY_ID[dog.rarity].mult * QUALITIES_BY_ID[dog.quality].mult * statCago;
  const ageMult = dog.age === 'baby' ? DOG.PRODUCE_BABY_MULT
                : dog.age === 'young' ? DOG.PRODUCE_YOUNG_MULT
                : dog.age === 'veteran' ? DOG.PRODUCE_VETERAN_MULT
                : DOG.PRODUCE_ADULT_MULT;
  const happyMult = 0.5 + dog.happiness / 200;
  const hungerMult = dog.hunger > 30 ? 1 : 0.4;
  const traitMultProd = traitMult(dog, 'productor', 1.25) * traitMult(dog, 'perezoso', 0.7);
  const levelMult = 1 + (dog.level - 1) * DOG.LEVEL_PROD_BONUS;
  const foodBoost = (performance.now() < (dog._foodProdBoostUntil || 0)) ? 1.25 : 1;
  const upgProd = UPGRADES_BY_ID.production.effect(state.inventory.upgrades.production || 0);
  const denom = baseRate * ageMult * happyMult * hungerMult * traitMultProd * levelMult * foodBoost * upgProd || 0.001;
  return Math.max(0.8, (DOG.POOP_INTERVAL_BASE + Math.random() * DOG.POOP_INTERVAL_VAR) / denom);
}

function maybePickFight (dog, mods) {
  if (dog.age === 'baby') return;
  if (dog.traits.includes('pacifico')) return;
  // Peleonería como stat (3-9 normal): cada punto +0.0002 prob/frame
  const statPel = (dog.stats?.pelea ?? 5) / 5;
  const fightProb = (dog.traits.includes('peleonero') ? 0.0015 : 0.0001) * statPel * (mods.fightMult || 1);
  if (Math.random() < fightProb) {
    const others = state.park.activeDogs.map(id => state.dogs.map[id])
      .filter(d => d && d !== dog && d.age !== 'baby' && d.state !== 'pregnant' && d.state !== 'fighting');
    if (others.length === 0) return;
    const opp = choice(others);
    const d = Math.hypot(opp.x - dog.x, opp.y - dog.y);
    if (d > 110) return;
    const now = performance.now();
    dog.state = 'fighting'; dog.stateUntil = now + 2500;
    opp.state = 'fighting'; opp.stateUntil = now + 2500;
    sfx.fight();
    logEvent(`${dog.name} y ${opp.name} están peleando`, 'red');
  }
}

export function traitMult (dog, traitId, mult) {
  return dog.traits?.includes(traitId) ? mult : 1;
}

// ---------- Helpers públicos ----------
export function activeDogs () {
  return state.park.activeDogs.map(id => state.dogs.map[id]).filter(Boolean);
}
export function storedDogs () {
  return state.inventory.storedDogs.map(id => state.dogs.map[id]).filter(Boolean);
}
export function getDog (id) { return state.dogs.map[id]; }
export function isAdult (dog) { return dog.age === 'adult' || dog.age === 'veteran'; }
