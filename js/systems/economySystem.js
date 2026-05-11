// ============================================================
// systems/economySystem.js — economía pasiva (offline catch-up
// limitado), spawn de popó cuando el jugador no está mirando, etc.
// ============================================================

import { state } from '../gameState.js';
import { spawnPoopFromDog } from './poopSystem.js';

export function update (dt) {
  // Si no hay perros activos, nada que hacer
  if (state.park.activeDogs.length === 0) return;
  // Aplicación de bonus prestige a producción ya está en poopSystem.poopValue.
}

export function offlineCatchUp (lastSavedMs) {
  if (!lastSavedMs) return;
  const elapsed = Math.min(60 * 60 * 1000, Date.now() - lastSavedMs); // máx 1h
  if (elapsed <= 0) return;
  // Producción aproximada offline: cada perro adulto produce ~1 popó cada 8s con valor base
  const seconds = elapsed / 1000;
  let totalPoop = 0;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (!d) continue;
    const ageMult = d.age === 'baby' ? 0.2 : d.age === 'young' ? 0.6 : 1.0;
    const base = (d.rarity === 'comun' ? 1 : d.rarity === 'raro' ? 1.5 : d.rarity === 'epico' ? 2.2 : 4) * ageMult;
    totalPoop += seconds / 10 * base;
  }
  totalPoop = Math.floor(totalPoop * 0.5); // 50% de eficiencia offline
  if (totalPoop > 0) {
    state.resources.poop += totalPoop;
    state.resources.coinsLifetime += totalPoop;
  }
}
