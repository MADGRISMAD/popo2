// ============================================================
// systems/foodBowlSystem.js — platos del parque, alimentación.
// El jugador no alimenta perro a perro, rellena platos.
// ============================================================

import { state } from '../gameState.js';
import { PARK, DOG } from '../config.js';
import { FOODS_BY_ID } from '../data/foods.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';

let _nextBowlId = 1;

export function init () {
  if (state.park.bowls.length === 0) {
    createBowl({ x: PARK.W * 0.30, y: PARK.H * 0.55 });
    createBowl({ x: PARK.W * 0.70, y: PARK.H * 0.45 });
  }
  if (!_nextBowlId || _nextBowlId <= state.park.bowls.length) {
    _nextBowlId = (state.park.bowls.reduce((m, b) => Math.max(m, b.id || 0), 0) || 0) + 1;
  }
}

export function createBowl ({ x, y, type = 'croquetas', capacity = 10 } = {}) {
  if (x === undefined) {
    x = 200 + Math.random() * (PARK.W - 400);
    y = 200 + Math.random() * (PARK.H - 400);
  }
  const bowl = { id: _nextBowlId++, x, y, type, qty: 0, capacity };
  state.park.bowls.push(bowl);
  return bowl;
}

export function extendBowlsCapacity (delta) {
  for (const b of state.park.bowls) b.capacity += delta;
  logEvent(`Capacidad de platos +${delta}`, 'gold');
}

export function setBowlType (bowlId, foodId) {
  const bowl = state.park.bowls.find(b => b.id === bowlId);
  const food = FOODS_BY_ID[foodId];
  if (!bowl || !food) return false;
  bowl.type = foodId;
  return true;
}

export function refillBowl (bowlId, foodId, amount = 5) {
  const bowl = state.park.bowls.find(b => b.id === bowlId);
  const food = FOODS_BY_ID[foodId];
  if (!bowl || !food) return { ok: false };

  const owned = state.inventory.food[foodId] || 0;
  const room = bowl.capacity - (bowl.type === foodId ? bowl.qty : 0);
  if (room <= 0) return { ok: false, reason: 'full' };

  const amt = Math.min(amount, owned, room);
  if (amt <= 0) {
    // Intentar comprar al vuelo
    if (state.resources.poop >= food.cost) {
      state.resources.poop -= food.cost;
      state.inventory.food[foodId] = (state.inventory.food[foodId] || 0) + 1;
      return refillBowl(bowlId, foodId, 1);
    }
    return { ok: false, reason: 'no_food' };
  }

  if (bowl.type !== foodId) {
    bowl.type = foodId;
    bowl.qty = 0;
  }
  bowl.qty += amt;
  state.inventory.food[foodId] = owned - amt;
  sfx.click();
  logEvent(`Plato rellenado con ${food.name} x${amt}`);
  // Mini goal hook
  if (state.progression.miniGoal?.type === 'bowlFill') {
    state.progression.miniGoal.progress = (state.progression.miniGoal.progress || 0) + 1;
  }
  return { ok: true, amount: amt };
}

// ---------- Comer (llamado desde dogSystem) ----------
export function feedFromBowl (dog, bowl) {
  if (!bowl || bowl.qty <= 0) return;
  const food = FOODS_BY_ID[bowl.type] || FOODS_BY_ID.croquetas;
  bowl.qty -= 1;
  let hungerHeal = food.hunger;
  if (dog.traits.includes('malcomedor')) hungerHeal *= 0.4;
  dog.hunger = Math.min(DOG.MAX_HUNGER, dog.hunger + hungerHeal);
  dog.happiness = Math.min(DOG.MAX_HAPPINESS, dog.happiness + (food.happiness || 0));
  // Efectos especiales
  if (food.effect === 'productive')  dog._foodProdBoostUntil = performance.now() + 30_000;
  if (food.effect === 'productive2') dog._foodProdBoostUntil = performance.now() + 60_000;
  if (food.effect === 'breed_boost') dog._breedBoostUntil    = performance.now() + 120_000;
  if (food.effect === 'grow' && dog.age === 'baby') dog.ageT += 12;
}

// ---------- update ----------
export function update (dt) {
  // No hace falta más, comen al llegar al plato.
}
