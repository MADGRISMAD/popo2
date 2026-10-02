// ============================================================
// systems/economySystem.js — economía pasiva (offline catch-up
// limitado), spawn de popó cuando el jugador no está mirando, etc.
// ============================================================

import { state } from '../gameState.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';

export function update (dt) {
  // Si no hay perros activos, nada que hacer
  if (state.park.activeDogs.length === 0) return;
  // Aplicación de bonus prestige a producción ya está en poopSystem.poopValue.
}

export function offlineCatchUp (lastSavedMs) {
  if (!lastSavedMs) return null;
  const elapsed = Math.min(4 * 60 * 60 * 1000, Date.now() - lastSavedMs); // máx 4h
  if (elapsed < 60_000) return null; // menos de 1 min: no cuenta
  // Producción aproximada offline: cada perro adulto produce ~1 popó cada 8s con valor base
  const seconds = elapsed / 1000;
  let totalPoop = 0;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (!d) continue;
    const ageMult = d.age === 'baby' ? 0.2 : d.age === 'young' ? 0.6 : 1.0;
    const base = (d.rarity === 'comun' ? 1 : d.rarity === 'raro' ? 1.5 : d.rarity === 'epico' ? 2.2 : 4) * ageMult
               * UPGRADES_BY_ID.production.effect(state.inventory.upgrades.production || 0)
               * UPGRADES_BY_ID.value.effect(state.inventory.upgrades.value || 0);
    totalPoop += seconds / 10 * base;
  }
  totalPoop = Math.floor(totalPoop * 0.5); // 50% de eficiencia offline
  if (totalPoop > 0) {
    state.resources.poop += totalPoop;
    state.resources.coinsLifetime += totalPoop;
  }
  return { amount: totalPoop, seconds };
}
