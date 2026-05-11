// ============================================================
// systems/achievementSystem.js — chequea condiciones, desbloquea
// y notifica al platformAdapter (Steam-ready).
// ============================================================

import { state } from '../gameState.js';
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_ID } from '../data/achievements.js';
import { platform } from '../platformAdapter.js';
import { sfx } from '../audioManager.js';
import { toast } from '../modalManager.js';
import { logEvent } from '../eventLog.js';

const checks = {
  ACH_FIRST_POOP:    () => state.stats.totalPoopCollected >= 1,
  ACH_100_POOP:      () => state.stats.totalPoopCollected >= 100,
  ACH_1000_POOP:     () => state.stats.totalPoopCollected >= 1000,
  ACH_FIRST_PACK:    () => state.stats.totalPacksOpened >= 1,
  ACH_TEN_PACK:      () => state.stats.totalPacksOpened >= 10,
  ACH_FIRST_LEGEND:  () => Object.values(state.dogs.map).some(d => d.rarity === 'legend' || d.rarity === 'mitico' || d.rarity === 'cosmico'),
  ACH_FIRST_MITICO:  () => Object.values(state.dogs.map).some(d => d.rarity === 'mitico' || d.rarity === 'cosmico'),
  ACH_FIRST_COSMICO: () => Object.values(state.dogs.map).some(d => d.rarity === 'cosmico'),
  ACH_FIRST_BIRTH:   () => state.stats.totalDogsBorn >= 1,
  ACH_FIRST_QGOLD:   () => Object.values(state.dogs.map).some(d => ['dorado','rojo','cosmico'].includes(d.quality)),
  ACH_FIRST_FEVER:   () => state.fever.active || state.progression._feverEverActivated,
  ACH_COMBO_X3:      () => state.combo.multiplier >= 3,
  ACH_FULL_PARK:     () => state.park.activeDogs.length >= 6,
  ACH_GOLDEN_POOP:   () => state.stats._everGolden,
  ACH_BREED_ZONE:    () => !!state.park.breedingZone,
  ACH_TEN_BREEDS:    () => Object.keys(state.collection.breeds).length >= 10,
  ACH_PRESTIGE:      () => state.progression.prestigeLevel >= 1,
};

export function update (dt) {
  // Recordar fiebre alguna vez
  if (state.fever.active) state.progression._feverEverActivated = true;
  for (const a of ACHIEVEMENTS) {
    if (state.progression.achievements[a.id]) continue;
    try {
      if (checks[a.id] && checks[a.id]()) unlock(a.id);
    } catch (e) { /* ignore */ }
  }
}

export function unlock (id) {
  if (state.progression.achievements[id]) return;
  state.progression.achievements[id] = true;
  const a = ACHIEVEMENTS_BY_ID[id];
  toast.show({ icon: a?.icon || '🏆', title: 'Logro desbloqueado', desc: a?.name || id, kind: 'gold', durationMs: 5500 });
  sfx.achievement();
  logEvent(`Logro: ${a?.name || id}`, 'gold');
  platform.unlockAchievement(id); // Steam-ready
}
