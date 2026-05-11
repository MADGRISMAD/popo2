// ============================================================
// systems/collectionSystem.js — registra razas, calidades y combos
// descubiertos. Llamado tras cada nuevo perro.
// ============================================================

import { state } from '../gameState.js';
import { QUALITY_INDEX } from '../data/dogs.js';

const order = ['comun','raro','epico','legend','mitico','cosmico'];

export function update (dt) {
  for (const id in state.dogs.map) {
    const d = state.dogs.map[id];
    registerDog(d);
  }
}

export function registerDog (d) {
  if (!d) return;
  const slot = state.collection.breeds[d.breed] || { discovered: false, bestQuality: 'gris', bestRarity: 'comun', count: 0 };
  slot.discovered = true;
  slot.count = (slot.count || 0) + 0; // count se infiere por presencia
  if (QUALITY_INDEX[d.quality] > QUALITY_INDEX[slot.bestQuality]) slot.bestQuality = d.quality;
  if (order.indexOf(d.rarity) > order.indexOf(slot.bestRarity)) slot.bestRarity = d.rarity;
  state.collection.breeds[d.breed] = slot;
}
