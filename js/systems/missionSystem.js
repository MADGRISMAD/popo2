// ============================================================
// systems/missionSystem.js — misión principal lineal y mini objetivo.
// ============================================================

import { state } from '../gameState.js';
import { MISSIONS_BY_ID, FIRST_MISSION, nextMissionId, MINI_GOALS } from '../data/missions.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { toast } from '../modalManager.js';

export function init () {
  if (!state.progression.activeMission) {
    state.progression.activeMission = FIRST_MISSION;
    state.progression.missionProgress = 0;
  }
  if (!state.progression.miniGoal) rotateMiniGoal();
}

function rotateMiniGoal () {
  const g = MINI_GOALS[Math.floor(Math.random() * MINI_GOALS.length)];
  state.progression.miniGoal = { ...g, progress: 0 };
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
  if (g.type === 'collect')     prog = state.stats.totalPoopCollected % 1000;
  if (g.type === 'activeDogs')  prog = state.park.activeDogs.length;
  if (g.type === 'combo')       prog = Math.floor(state.combo.multiplier);
  if (g.type === 'golden')      prog = state.stats.totalGoldenPoop || 0;
  g.progress = prog;
  if (prog >= g.target) {
    state.resources.poop += g.reward.poop || 0;
    toast.show({ icon: '🎯', title: 'Mini objetivo completado', desc: g.title });
    rotateMiniGoal();
  }
}
