// ============================================================
// systems/inventorySystem.js — operaciones sobre inventario:
// añadir/quitar comida, perros, cartas, etc.
// ============================================================

import { state } from '../gameState.js';
import { FOODS_BY_ID } from '../data/foods.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';
import { PARK_OBJECTS_BY_ID } from '../data/parkObjects.js';
import { logEvent } from '../eventLog.js';

export function addFood (foodId, qty = 1) {
  if (!FOODS_BY_ID[foodId]) return false;
  state.inventory.food[foodId] = (state.inventory.food[foodId] || 0) + qty;
  return true;
}

export function addUpgrade (upgId) {
  const u = UPGRADES_BY_ID[upgId];
  if (!u) return false;
  const cur = state.inventory.upgrades[upgId] || 0;
  if (cur >= u.maxLevel) return false;
  state.inventory.upgrades[upgId] = cur + 1;
  // Aplicar inmediatamente
  if (upgId === 'magnet') state.park.magnetRadius = u.effect(cur + 1);
  return true;
}

export function buyUpgrade (upgId) {
  const u = UPGRADES_BY_ID[upgId];
  if (!u) return false;
  const cur = state.inventory.upgrades[upgId] || 0;
  if (cur >= u.maxLevel) return false;
  const cost = u.cost(cur);
  if (state.resources.poop < cost) return false;
  state.resources.poop -= cost;
  addUpgrade(upgId);
  logEvent(`Mejora: ${u.name} → nv ${cur + 1}`, 'gold');
  return true;
}

export function addParkObject (objId) {
  const o = PARK_OBJECTS_BY_ID[objId];
  if (!o) return false;
  state.inventory.parkUpgrades[objId] = (state.inventory.parkUpgrades[objId] || 0) + 1;
  return true;
}

export function addAutomation (autoId, level = 1) {
  state.inventory.automations[autoId] = (state.inventory.automations[autoId] || 0) + level;
}

export function addGeneticCard (cardId, qty = 1) {
  state.inventory.geneticCards[cardId] = (state.inventory.geneticCards[cardId] || 0) + qty;
}
export function addBreedCard (cardId, qty = 1) {
  state.inventory.breedCards[cardId] = (state.inventory.breedCards[cardId] || 0) + qty;
}
export function addSpecialItem (id, qty = 1) {
  state.inventory.specialItems[id] = (state.inventory.specialItems[id] || 0) + qty;
}

export function storeDog (dogId) {
  const d = state.dogs.map[dogId];
  if (!d) return false;
  if (state.park.activeDogs.includes(dogId)) return false;
  if (!state.inventory.storedDogs.includes(dogId)) state.inventory.storedDogs.push(dogId);
  return true;
}
