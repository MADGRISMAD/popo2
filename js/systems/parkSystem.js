// ============================================================
// systems/parkSystem.js — gestiona objetos del parque y elementos
// decorativos generados (árboles, flores, caminos).
// ============================================================

import { state } from '../gameState.js';
import { PARK } from '../config.js';
import { PARK_OBJECTS_BY_ID } from '../data/parkObjects.js';
import { logEvent } from '../eventLog.js';

// Decoración determinista por seed simple (no se guarda, solo visual)
let _decorations = null;

export function getDecorations () {
  if (_decorations) return _decorations;
  const seed = 1337;
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const trees = [];
  for (let i = 0; i < 12; i++) {
    trees.push({ x: rand() * (PARK.W - 60) + 30, y: rand() * (PARK.H - 60) + 30, r: 18 + rand() * 10 });
  }
  const flowers = [];
  for (let i = 0; i < 40; i++) {
    flowers.push({ x: rand() * PARK.W, y: rand() * PARK.H, color: ['#ec4899', '#f59e0b', '#a855f7', '#fbbf24'][Math.floor(rand() * 4)] });
  }
  const paths = [
    { x1: 0, y1: 360, x2: PARK.W, y2: 380 },
    { x1: 540, y1: 0, x2: 560, y2: PARK.H },
  ];
  _decorations = { trees, flowers, paths };
  return _decorations;
}

export function buyParkObject (objId) {
  const obj = PARK_OBJECTS_BY_ID[objId];
  if (!obj) return false;
  const owned = state.inventory.parkUpgrades[objId] || 0;
  if (obj.max && owned >= obj.max) return false;
  if (state.resources.poop < obj.cost) return false;
  state.resources.poop -= obj.cost;
  state.inventory.parkUpgrades[objId] = owned + 1;
  if (obj.apply) obj.apply(state);

  // Hooks especiales
  if (objId === 'bowl_extra')    addBowl();
  if (objId === 'bowl_capacity') extendBowls(5);
  if (objId === 'bowl_double')   extendBowls(3);
  if (objId === 'breed_zone')    logEvent('Zona de Crianza construida 💗', 'gold');

  logEvent(`Comprado: ${obj.name}`, 'gold');
  return true;
}

// Re-export wrappers para evitar import circular en el ui
export function addBowl () {
  import('./foodBowlSystem.js').then(m => m.createBowl());
}
export function extendBowls (qty) {
  import('./foodBowlSystem.js').then(m => m.extendBowlsCapacity(qty));
}

export function update (dt) {
  // Reservado para animaciones/objetos vivos del parque (banderines, etc.)
}
