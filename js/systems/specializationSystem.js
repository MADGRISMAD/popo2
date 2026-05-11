// ============================================================
// systems/specializationSystem.js — aplica modificadores de la
// especialización elegida + de combos ocultos activos.
// ============================================================

import { state } from '../gameState.js';
import { SPECIALIZATIONS_BY_ID } from '../data/specializations.js';
import { HIDDEN_COMBOS_BY_ID } from '../data/combos.js';

// Devuelve un objeto plano con los modificadores activos combinados
export function getModifiers () {
  const out = {
    prodMult: 1,
    pickValue: 1,
    speedMult: 1,
    fightMult: 1,
    happyDecay: 1,
    pregnancyMult: 1,
    babyGrow: 1,
    qualityBoost: 0,
    mutationMult: 1,
    extraTrait: 0,
    luck: 1,
    tipMult: 1,
    magnetExtra: 0,
    goldenChance: 1,
  };

  // Especialización
  const specId = state.meta?.specialization;
  if (specId) {
    const s = SPECIALIZATIONS_BY_ID[specId];
    if (s) Object.assign(out, multiplyMerge(out, s.apply));
  }

  // Combos ocultos
  for (const id of Object.keys(state.park.activeCombos || {})) {
    const c = HIDDEN_COMBOS_BY_ID[id];
    if (c?.bonus) Object.assign(out, multiplyMerge(out, c.bonus));
  }

  return out;
}

function multiplyMerge (base, patch) {
  // Para multiplicadores: multiplicamos. Para sumandos: sumamos.
  const r = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof r[k] !== 'number') { r[k] = v; continue; }
    if (['extraTrait', 'qualityBoost', 'magnetExtra'].includes(k)) r[k] += v;
    else r[k] *= v;
  }
  return r;
}

export function chooseSpecialization (id) {
  if (!SPECIALIZATIONS_BY_ID[id]) return false;
  state.meta.specialization = id;
  return true;
}

export function update (dt) {
  // No-op; los modificadores se leen on-demand por sistemas.
}
