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

// Camino ondulado que cruza el parque (en coords de mundo)
export function pathY (x) {
  return 390 + Math.sin(x / 170) * 55;
}

export function getDecorations () {
  if (_decorations) return _decorations;
  const seed = 1337;
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  // Zonas libres: platos, zona de crianza y el camino
  const keepClear = [[PARK.W * 0.30, PARK.H * 0.55], [PARK.W * 0.70, PARK.H * 0.45], [540, 360]];
  const free = (x, y, pad) => Math.abs(y - pathY(x)) > 60 + pad &&
    keepClear.every(([cx, cy]) => Math.hypot(cx - x, cy - y) > 110 + pad);
  const trees = [];
  let guard = 0;
  while (trees.length < 9 && guard++ < 400) {
    const x = rand() * (PARK.W - 80) + 40;
    const y = rand() * (PARK.H - 90) + 30;
    if (!free(x, y, 0)) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.y - y) < 150)) continue;
    trees.push({ x, y, r: 22 + rand() * 10, kind: rand() < 0.35 ? 'bush' : 'tree', fruit: rand() < 0.4 });
  }
  const flowers = [];
  for (let i = 0; i < 70; i++) {
    const x = rand() * PARK.W, y = rand() * PARK.H;
    if (Math.abs(y - pathY(x)) < 40) continue;
    flowers.push({ x, y, color: ['#ff5a8a', '#ffc93c', '#b06bff', '#ffffff', '#ff8a3d'][Math.floor(rand() * 5)] });
  }
  _decorations = { trees, flowers };
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
