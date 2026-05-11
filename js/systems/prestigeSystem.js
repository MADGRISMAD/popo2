// ============================================================
// systems/prestigeSystem.js — Renombre Canino (reset suave).
// ============================================================

import { state } from '../gameState.js';
import { resetState } from '../gameState.js';
import { PRESTIGE } from '../data/prestige.js';
import { ECONOMY } from '../config.js';
import { logEvent } from '../eventLog.js';
import { toast } from '../modalManager.js';

export function canPrestige () {
  return state.resources.coinsLifetime >= PRESTIGE.costThreshold;
}

export function pendingPoints () {
  return PRESTIGE.pointsFor(state.resources.coinsLifetime);
}

export function doPrestige () {
  if (!canPrestige()) return false;
  const points = pendingPoints();
  // Conservar colección, achievements y opciones
  const keepCollection = JSON.parse(JSON.stringify(state.collection));
  const keepAch = { ...state.progression.achievements };
  const keepOpts = { ...state.options };
  const keepStats = { ...state.stats };
  const keepPrestigePoints = state.progression.prestigePoints + points;
  const keepLevel = (state.progression.prestigeLevel || 0) + 1;

  resetState();

  state.collection = keepCollection;
  state.progression.achievements = keepAch;
  state.options = keepOpts;
  state.stats = keepStats;
  state.progression.prestigePoints = keepPrestigePoints;
  state.progression.prestigeLevel = keepLevel;

  toast.show({ icon: '👑', title: 'Renombre Canino', desc: `+${points} puntos (total ${keepPrestigePoints})`, kind: 'gold' });
  logEvent(`Renombre Canino +${points}`, 'gold');
  return true;
}
