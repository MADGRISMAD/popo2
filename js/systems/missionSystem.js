// ============================================================
// systems/missionSystem.js — misión principal lineal y mini objetivo.
// ============================================================

import { state } from '../gameState.js';
import { MISSIONS_BY_ID, FIRST_MISSION, nextMissionId, MINI_GOALS } from '../data/missions.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { toast } from '../modalManager.js';
import { gainXP, scaledPoop } from './hookSystem.js';
import { fmt } from '../render/juice.js';

export function init () {
  if (!state.progression.activeMission) {
    state.progression.activeMission = FIRST_MISSION;
    state.progression.missionProgress = 0;
  }
  if (!state.progression.miniGoal) rotateMiniGoal();
}

// Los mini objetivos escalan: cada uno es un poco más difícil y paga más
function rotateMiniGoal () {
  const prevId = state.progression.miniGoal?.id;
  const pool = MINI_GOALS.filter(g => g.id !== prevId);
  const g = pool[Math.floor(Math.random() * pool.length)];
  const tier = state.progression.miniGoalsDone || 0;
  let target = g.target;
  let title = g.title;
  switch (g.type) {
    case 'collect':     target = Math.min(400, g.target + tier * 12); title = `Recolecta ${target} popós`; break;
    case 'combo':       target = Math.min(10, g.target + Math.floor(tier / 3)); title = `Logra un combo x${target}`; break;
    case 'golden':      target = 1 + Math.floor(tier / 4); title = target > 1 ? `Recoge ${target} popós doradas` : g.title; break;
    case 'pet':         target = g.target + Math.floor(tier / 3); title = `Acaricia ${target} perros`; break;
    case 'packsOpened': target = 1 + Math.floor(tier / 5); title = target > 1 ? `Abre ${target} sobres` : g.title; break;
    case 'activeDogs':  target = Math.min(state.park.capacity, g.target + Math.floor(tier / 4)); title = `${target} perros activos`; break;
  }
  const poop = scaledPoop(Math.min(3, 0.8 + tier * 0.1), Math.round(g.reward.poop * (1 + tier * 0.3)));
  const base = g.type === 'collect' ? state.stats.totalPoopCollected
             : g.type === 'golden'  ? (state.stats.totalGoldenPoop || 0) : 0;
  state.progression.miniGoal = { ...g, title, target, reward: { poop }, xp: 10 + tier * 2, base, progress: 0 };
}

export function update (dt) {
  evaluateMission();
  evaluateMiniGoal();
}

function getProgress (mission) {
  switch (mission.type) {
    case 'collect':           return state.stats.totalPoopCollected;
    case 'totalPoop':         return state.resources.coinsLifetime;
    case 'activeDogs':        return state.park.activeDogs.length;
    case 'packsOpened':       return state.stats.totalPacksOpened;
    case 'breedingZone':      return state.park.breedingZone ? 1 : 0;
    case 'birth':             return state.stats.totalDogsBorn;
    case 'fever':             return state.fever.active || state.progression._feverEverActivated ? 1 : 0;
    case 'rarity': {
      const want = mission.rarity;
      const order = ['comun','raro','epico','legend','mitico','cosmico'];
      const idx = order.indexOf(want);
      const has = Object.values(state.dogs.map).some(d => order.indexOf(d.rarity) >= idx);
      return has ? 1 : 0;
    }
    case 'breedsDiscovered':  return Object.keys(state.collection.breeds).length;
    case 'quality': {
      const order = ['gris','verde','azul','morado','dorado','rojo','cosmico'];
      const want = order.indexOf(mission.quality);
      const has = Object.values(state.dogs.map).some(d => order.indexOf(d.quality) >= want);
      return has ? 1 : 0;
    }
    case 'combo':             return state.combo.multiplier >= mission.target ? 1 : 0;
    case 'bowlFill':          return 0; // tracked en miniGoal
  }
  return 0;
}

function evaluateMission () {
  const id = state.progression.activeMission;
  if (!id) return;
  const m = MISSIONS_BY_ID[id];
  if (!m) return;
  const prog = getProgress(m);
  state.progression.missionProgress = prog;
  if (prog >= m.target) completeMission(m);
}

function completeMission (m) {
  state.progression.completedMissions.push(m.id);
  if (m.reward?.poop) state.resources.poop += m.reward.poop;
  if (m.reward?.packs) {
    for (const [k, v] of Object.entries(m.reward.packs)) state.resources.packs[k] = (state.resources.packs[k] || 0) + v;
  }
  toast.show({ icon: '✅', title: 'Misión completada', desc: m.title, kind: 'gold' });
  sfx.achievement();
  logEvent(`Misión completada: ${m.title}`, 'gold');
  state.progression.activeMission = nextMissionId(m.id);
  state.progression.missionProgress = 0;
}

function evaluateMiniGoal () {
  const g = state.progression.miniGoal;
  if (!g) { rotateMiniGoal(); return; }
  // Algunos minigoals usan stat directo
  let prog = g.progress || 0;
  if (g.type === 'collect')     prog = state.stats.totalPoopCollected - (g.base ?? state.stats.totalPoopCollected);
  if (g.type === 'activeDogs')  prog = state.park.activeDogs.length;
  if (g.type === 'combo')       prog = Math.max(g.progress || 0, Math.floor(state.combo.multiplier));
  if (g.type === 'golden')      prog = (state.stats.totalGoldenPoop || 0) - (g.base ?? (state.stats.totalGoldenPoop || 0));
  if (g.base === undefined && (g.type === 'collect' || g.type === 'golden')) {
    // Mini objetivo de un save antiguo: fija la base ahora
    g.base = g.type === 'collect' ? state.stats.totalPoopCollected : (state.stats.totalGoldenPoop || 0);
    prog = 0;
  }
  g.progress = Math.max(0, prog);
  if (g.progress >= g.target) {
    const poop = g.reward.poop || 0;
    state.resources.poop += poop;
    state.resources.coinsLifetime += poop;
    state.progression.miniGoalsDone = (state.progression.miniGoalsDone || 0) + 1;
    toast.show({ icon: '🎯', title: 'Mini objetivo completado', desc: `${g.title} · +${fmt(poop)} 💩` });
    sfx.achievement();
    gainXP(g.xp || 10);
    rotateMiniGoal();
  }
}
