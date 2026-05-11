// ============================================================
// systems/sellSystem.js — venta de perros y cartas repetidas.
// ============================================================

import { state } from '../gameState.js';
import { RARITIES_BY_ID, QUALITIES_BY_ID, BREEDS_BY_ID } from '../data/dogs.js';
import { TRAITS_BY_ID } from '../data/traits.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';

export function dogValue (dog) {
  if (!dog) return 0;
  const breed = BREEDS_BY_ID[dog.breed];
  const r = RARITIES_BY_ID[dog.rarity];
  const q = QUALITIES_BY_ID[dog.quality];
  let v = 25 * (r?.mult ?? 1) * (q?.mult ?? 1) * (breed?.produce ?? 1);
  v *= 1 + (dog.level - 1) * 0.08;
  v *= 1 + (dog.generation || 1) * 0.05;
  // Bonus por traits positivos
  const pos = (dog.traits || []).filter(t => TRAITS_BY_ID[t]?.kind === 'pos').length;
  const esp = (dog.traits || []).filter(t => TRAITS_BY_ID[t]?.kind === 'esp').length;
  v *= 1 + pos * 0.1 + esp * 0.2;
  // Bebés valen menos
  if (dog.age === 'baby')  v *= 0.5;
  if (dog.age === 'young') v *= 0.75;
  if (dog.age === 'veteran') v *= 0.9;
  return Math.max(5, Math.floor(v));
}

export function canSellDog (dog) {
  if (!dog) return { ok: false, reason: 'No existe.' };
  if (dog.state === 'pregnant') return { ok: false, reason: 'Hembra embarazada.' };
  // No vender el último perro
  const total = state.park.activeDogs.length + state.inventory.storedDogs.length;
  if (total <= 1) return { ok: false, reason: 'No puedes vender al último.' };
  return { ok: true };
}

export function sellDog (dogId) {
  const dog = state.dogs.map[dogId];
  const ok = canSellDog(dog);
  if (!ok.ok) { logEvent(`No puedes vender: ${ok.reason}`, 'red'); return false; }
  const value = dogValue(dog);
  // Quitar de listas
  state.park.activeDogs = state.park.activeDogs.filter(id => id !== dogId);
  state.inventory.storedDogs = state.inventory.storedDogs.filter(id => id !== dogId);
  delete state.dogs.map[dogId];
  state.resources.poop += value;
  state.resources.coinsLifetime += value;
  state.stats.totalSold = (state.stats.totalSold || 0) + 1;
  state.collection.soldDogs = (state.collection.soldDogs || 0) + 1;
  sfx.buy();
  logEvent(`Vendido ${dog.name} (+💩 ${value})`, 'gold');
  return value;
}

export function sellFood (foodId, qty = 1) {
  const owned = state.inventory.food[foodId] || 0;
  if (owned < qty) return 0;
  // Vendemos a 30% del costo (precio asumido en data)
  const FOOD = (window.__FOODS_BY_ID__ ?? null);
  let cost = 5;
  // Importamos sin ciclos — usamos precio aproximado
  state.inventory.food[foodId] = owned - qty;
  const earned = Math.floor(cost * qty * 0.3);
  state.resources.poop += earned;
  return earned;
}
