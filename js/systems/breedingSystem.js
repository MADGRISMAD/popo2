// ============================================================
// systems/breedingSystem.js — embarazo, herencia genética,
// nacimientos. Sin huevos: bebé nace directamente.
// Compatibilidad: Baja / Media / Alta / Excelente.
// ============================================================

import { gainXP } from './hookSystem.js';
import { HOOKS } from '../config.js';
import { state } from '../gameState.js';
import { BREEDING, DOG } from '../config.js';
import { QUALITIES, QUALITY_INDEX, RARITIES, BREEDS_BY_ID } from '../data/dogs.js';
import { POS_TRAITS, NEG_TRAITS, ESP_TRAITS, TRAITS_BY_ID } from '../data/traits.js';
import { findRecipe, findMutation } from '../data/breedingRecipes.js';
import { createDog, isAdult, traitMult } from './dogSystem.js';
import { getModifiers } from './specializationSystem.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { confetti, sparkle } from '../render/particles.js';

const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;

// ---------- Compatibilidad ----------
export function compatibility (male, female) {
  if (!male || !female) return { level: 'baja', score: 0, factors: [] };
  let score = 50;
  const factors = [];

  // Felicidad
  const happyAvg = (male.happiness + female.happiness) / 2;
  if (happyAvg > 80)      { score += 20; factors.push('Felicidad alta +20'); }
  else if (happyAvg < 50) { score -= 20; factors.push('Felicidad baja −20'); }

  // Hambre
  if (male.hunger < 40 || female.hunger < 40) { score -= 15; factors.push('Mucha hambre −15'); }

  // Calidad
  const qa = QUALITY_INDEX[male.quality];
  const qb = QUALITY_INDEX[female.quality];
  const qDiff = Math.abs(qa - qb);
  if (qDiff === 0)      { score += 15; factors.push('Misma calidad +15'); }
  else if (qDiff >= 3)  { score -= 10; factors.push('Calidades muy distintas −10'); }

  // Traits
  const sharedTraits = (male.traits || []).filter(t => (female.traits || []).includes(t));
  if (sharedTraits.length > 0) { score += sharedTraits.length * 6; factors.push(`Traits comunes +${sharedTraits.length * 6}`); }

  // Misma raza
  if (male.breed === female.breed) { score += 10; factors.push('Misma raza +10'); }

  // Consanguinidad
  if (areRelated(male, female)) { score -= 25; factors.push('Parentesco cercano −25'); }

  // Mejoras de crianza
  const owned = state.inventory.parkUpgrades || {};
  if (owned.collar_lineage) { score += owned.collar_lineage * 8; factors.push(`Collar de Linaje +${owned.collar_lineage * 8}`); }
  if (owned.lab_genetic)    { score += 10; factors.push('Lab. Genético +10'); }

  score = Math.max(0, Math.min(120, score));
  let level;
  if (score < 35) level = 'baja';
  else if (score < 65) level = 'media';
  else if (score < 95) level = 'alta';
  else level = 'excelente';
  return { score, level, factors, sharedTraits };
}

function areRelated (a, b) {
  if (!a.parents && !b.parents) return false;
  // Hermanos: comparten padre o madre
  if (a.parents && b.parents) {
    if (a.parents.father === b.parents.father && a.parents.father != null) return true;
    if (a.parents.mother === b.parents.mother && a.parents.mother != null) return true;
  }
  // Padre-hija o madre-hijo
  if (b.parents && (b.parents.father === a.id || b.parents.mother === a.id)) return true;
  if (a.parents && (a.parents.father === b.id || a.parents.mother === b.id)) return true;
  return false;
}

// ---------- Iniciar crianza ----------
export function canStartBreeding (male, female) {
  if (!male || !female) return { ok: false, reason: 'Selecciona macho y hembra.' };
  if (male.sex !== 'M' || female.sex !== 'F') return { ok: false, reason: 'Sexos inválidos.' };
  if (!isAdult(male) || !isAdult(female))    return { ok: false, reason: 'Ambos deben ser adultos.' };
  if (male.state === 'pregnant' || female.state === 'pregnant') return { ok: false, reason: 'Hembra ya embarazada.' };
  if (male.state === 'fighting' || female.state === 'fighting') return { ok: false, reason: 'En pelea.' };
  if (male.state === 'resting'  || female.state === 'resting')  return { ok: false, reason: 'Descansando.' };
  if (male.happiness   < BREEDING.REQUIRE_HAPPINESS || female.happiness < BREEDING.REQUIRE_HAPPINESS) return { ok: false, reason: 'Felicidad mínima 60.' };
  if (male.hunger      < BREEDING.REQUIRE_HUNGER    || female.hunger    < BREEDING.REQUIRE_HUNGER)    return { ok: false, reason: 'Hambre demasiado alta.' };
  if (!state.park.breedingZone) return { ok: false, reason: 'Necesitas Zona de Crianza.' };
  return { ok: true };
}

export function startBreeding (maleId, femaleId) {
  const male = state.dogs.map[maleId];
  const female = state.dogs.map[femaleId];
  const ok = canStartBreeding(male, female);
  if (!ok.ok) return ok;

  const now = performance.now();
  const mods = getModifiers();
  const owned = state.inventory.parkUpgrades || {};
  let dur = BREEDING.PREGNANCY_BASE_MS;

  if (male.traits.includes('criador'))   dur *= 0.7;
  if (female.traits.includes('criador')) dur *= 0.7;
  if (female._breedBoostUntil > now)     dur *= 0.8;
  if (mods.pregnancyMult)                dur *= mods.pregnancyMult;
  if (owned.breed_bed)                   dur *= Math.max(0.4, 1 - owned.breed_bed * 0.20);
  // Compatibilidad afecta duración
  const cmp = compatibility(male, female);
  if (cmp.level === 'baja')      dur *= 1.25;
  if (cmp.level === 'excelente') dur *= 0.85;
  dur = Math.max(BREEDING.PREGNANCY_MIN_MS, dur);

  female.state = 'pregnant';
  female.pregnantBy = male.id;
  female.pregnancyTotal = dur;
  female.pregnancyUntil = now + dur;
  female._breedCmp = cmp.level;

  male.state = 'resting';
  male.stateUntil = now + BREEDING.MALE_REST_MS;

  logEvent(`${female.name} está embarazada (${cmp.level}) 💗`, 'gold');
  sfx.click();
  return { ok: true };
}

function handleBirth (mother) {
  const father = state.dogs.map[mother.pregnantBy];
  if (!father) {
    mother.state = 'idle';
    mother.pregnancyUntil = 0;
    return null;
  }
  const baby = breedOffspring(father, mother, mother._breedCmp || 'media');
  baby.x = mother.x + (Math.random() - 0.5) * 30;
  baby.y = mother.y + (Math.random() - 0.5) * 30;
  // Si hay capacidad, sale al parque; si no, va al inventario
  if (state.park.activeDogs.length < state.park.capacity) {
    state.park.activeDogs.push(baby.id);
  } else {
    state.inventory.storedDogs.push(baby.id);
  }

  const now = performance.now();
  mother.state = 'resting';
  mother.stateUntil = now + BREEDING.REST_AFTER_BIRTH_MS;
  mother.pregnancyUntil = 0;
  mother.pregnancyTotal = 0;
  mother.pregnantBy = null;

  state.stats.totalDogsBorn++;
  gainXP(HOOKS.XP_PER_BIRTH);
  sfx.birth();
  sfx.confetti();
  confetti(baby.x, baby.y, 50);
  sparkle(baby.x, baby.y, '#ff7ab8', 10);
  logEvent(`Nació ${baby.name} (${baby.quality})`, 'gold');
  return baby;
}

export function update (dt) {
  for (const id of state.park.activeDogs.slice()) {
    const d = state.dogs.map[id];
    if (d?._readyToBirth) {
      d._readyToBirth = false;
      handleBirth(d);
    }
  }
}

// ---------- Genética ----------
function pickQuality (qa, qb, cmpLevel, mods) {
  const ia = QUALITY_INDEX[qa];
  const ib = QUALITY_INDEX[qb];
  const min = Math.min(ia, ib);
  const max = Math.max(ia, ib);

  // Bonus por compatibilidad y modificadores
  const boost = (cmpLevel === 'excelente' ? 1 : cmpLevel === 'alta' ? 0.5 : 0) + (mods.qualityBoost || 0);

  if (ia === ib) {
    const r = Math.random();
    let dlt = r < 0.70 ? 0 : r < 0.92 ? 1 : r < 0.99 ? 2 : 3;
    return QUALITIES[Math.min(QUALITIES.length - 1, ia + dlt + Math.floor(boost))].id;
  }
  const diff = max - min;
  const r = Math.random();
  if (diff >= 3) {
    if (r < 0.80) return QUALITIES[Math.min(QUALITIES.length - 1, min + Math.floor(boost))].id;
    if (r < 0.94) return QUALITIES[Math.min(QUALITIES.length - 1, min + 1)].id;
    if (r < 0.99) return QUALITIES[Math.min(QUALITIES.length - 1, min + 2)].id;
    return QUALITIES[max].id;
  }
  if (r < 0.62) return QUALITIES[min].id;
  if (r < 0.90) return QUALITIES[max].id;
  if (r < 0.98) return QUALITIES[Math.min(QUALITIES.length - 1, max + 1)].id;
  return QUALITIES[Math.min(QUALITIES.length - 1, max + 2)].id;
}

function pickRarity (ra, rb) {
  const ia = RARITIES.findIndex(r => r.id === ra);
  const ib = RARITIES.findIndex(r => r.id === rb);
  const min = Math.min(ia, ib);
  const r = Math.random();
  if (r < 0.85) return RARITIES[min].id;
  if (r < 0.97) return RARITIES[Math.min(RARITIES.length - 1, min + 1)].id;
  return RARITIES[Math.min(RARITIES.length - 1, min + 2)].id;
}

function pickBreed (father, mother, mods) {
  const recipe = findRecipe(father, mother);
  if (recipe && Math.random() < recipe.chance) return { id: recipe.result, isHybrid: true, recipe };

  const mutation = findMutation(father, mother);
  const mutChance = (mutation?.chance || 0) * (mods.mutationMult || 1);
  if (mutation && Math.random() < mutChance) return { id: mutation.result, isMutation: true, recipe: mutation };

  return { id: choice([father.breed, mother.breed]), isHybrid: false };
}

function pickTraits (father, mother, mods, cmpLevel) {
  const out = new Set();
  const owned = state.inventory.parkUpgrades || {};
  const lineageBoost = owned.collar_lineage ? 0.10 * owned.collar_lineage : 0;
  const negPenalty = owned.vet ? 0.30 * owned.vet : 0;
  const inbredBoost = areRelated(father, mother) ? 0.20 : 0;

  for (const t of (father.traits || [])) {
    const tr = TRAITS_BY_ID[t]; if (!tr) continue;
    const both = mother.traits?.includes(t);
    let p = both ? 0.65 : 0.30;
    if (tr.kind === 'pos' || tr.kind === 'esp') p += lineageBoost;
    if (tr.kind === 'neg') p = Math.max(0.05, p - negPenalty);
    if (chance(p)) out.add(t);
  }
  for (const t of (mother.traits || [])) {
    const tr = TRAITS_BY_ID[t]; if (!tr) continue;
    let p = 0.30;
    if (tr.kind === 'pos' || tr.kind === 'esp') p += lineageBoost;
    if (tr.kind === 'neg') p = Math.max(0.05, p - negPenalty);
    if (chance(p)) out.add(t);
  }
  // Mutaciones nuevas (más si la madre come platillo mutante o si hay zona científica)
  const mut = mods.mutationMult || 1;
  if (chance(0.10 * mut)) out.add(choice(POS_TRAITS).id);
  if (chance(Math.max(0.02, 0.05 - negPenalty + inbredBoost))) out.add(choice(NEG_TRAITS).id);
  if (chance(0.02 * mut)) out.add(choice(ESP_TRAITS).id);

  if (father.traits.includes('mutante') || mother.traits.includes('mutante')) {
    out.add(choice(POS_TRAITS).id);
  }
  // Trait extra por modificadores (specialization, combos)
  for (let i = 0; i < (mods.extraTrait || 0); i++) out.add(choice(POS_TRAITS).id);

  // Compatibilidad alta agrega 1 trait extra; baja puede quitar uno
  const arr = [...out];
  if (cmpLevel === 'excelente' || cmpLevel === 'alta') arr.push(choice(POS_TRAITS).id);
  else if (cmpLevel === 'baja' && arr.length > 0) arr.pop();

  return [...new Set(arr)].slice(0, 4);
}

function breedOffspring (father, mother, cmpLevel = 'media') {
  const mods = getModifiers();
  const breedPick = pickBreed(father, mother, mods);
  const recipe = breedPick.recipe;
  const breedId = recipe?.breedAlias ?? breedPick.id;
  const breedObj = BREEDS_BY_ID[breedId] || BREEDS_BY_ID.callejero;

  const rarity = recipe?.rarity ?? pickRarity(father.rarity, mother.rarity);
  const quality = pickQuality(father.quality, mother.quality, cmpLevel, mods);
  const traits = pickTraits(father, mother, mods, cmpLevel);
  const sex = chance(0.5) ? 'M' : 'F';

  // Stats heredados (promedio + ruido)
  const j = (a, b) => Math.max(1, Math.min(10, Math.round(((a + b) / 2) + (Math.random() * 2 - 1))));
  const stats = {
    cago:  j(father.stats?.cago  ?? 5, mother.stats?.cago  ?? 5),
    come:  j(father.stats?.come  ?? 5, mother.stats?.come  ?? 5),
    vel:   j(father.stats?.vel   ?? 5, mother.stats?.vel   ?? 5),
    pelea: j(father.stats?.pelea ?? 5, mother.stats?.pelea ?? 5),
  };

  const baby = createDog({
    breed: breedObj.id,
    rarity, quality, sex, traits, stats,
    age: 'baby',
    parents: { father: father.id, mother: mother.id },
    generation: Math.max(father.generation || 1, mother.generation || 1) + 1,
  });

  if (recipe) {
    baby._displayName = recipe.name;
    baby.name = recipe.name;
    baby._customBody = recipe.body;
    baby._customSpot = recipe.spot;
    if (recipe.mutation) state.collection.mutations[recipe.result] = (state.collection.mutations[recipe.result] || 0) + 1;
    else                 state.collection.hybrids[recipe.result]   = (state.collection.hybrids[recipe.result]   || 0) + 1;
  }
  return baby;
}
