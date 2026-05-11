// ============================================================
// systems/progressionSystem.js — orquesta orden de inicio de
// sistemas, expone helpers de "nueva partida" e iniciar dogs base.
// ============================================================

import { state } from '../gameState.js';
import { createDog, activateDog } from './dogSystem.js';
import { init as missionInit } from './missionSystem.js';
import { init as bowlInit } from './foodBowlSystem.js';
import { init as poopInit } from './poopSystem.js';

export function startNewPark () {
  // Crea 2 callejeros adultos para empezar
  const a = createDog({ breed: 'callejero', age: 'adult', sex: 'M' });
  const b = createDog({ breed: 'callejero', age: 'adult', sex: 'F' });
  activateDog(a.id);
  activateDog(b.id);
  bowlInit();
  missionInit();
  poopInit();
}

export function ensureSystemsReady () {
  bowlInit();
  missionInit();
  poopInit();
}
