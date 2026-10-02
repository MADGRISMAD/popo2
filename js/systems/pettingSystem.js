// ============================================================
// systems/pettingSystem.js — acariciar perros con click sostenido
// (en realidad: doble click / click sobre perro fuera de popó).
// ============================================================

import { state } from '../gameState.js';
import { DOG, ECONOMY } from '../config.js';
import { onParkClick } from '../inputManager.js';
import { sfx } from '../audioManager.js';
import { logEvent } from '../eventLog.js';
import { addXP } from './dogSystem.js';
import { burst } from '../render/particles.js';
import { toOverlayPct, project } from '../render/projection.js';

let _initialized = false;

export function init () {
  if (_initialized) return;
  _initialized = true;
  onParkClick(handleClick);
}

function handleClick (p) {
  if (!p) return;
  // Solo acariciamos si NO había popó cerca (la prioridad es recolectar)
  if (state.park.poops.some(pp => Math.hypot(pp.x - p.x, pp.y - p.y) < 26)) return;

  const dog = findDogAtScreen(p.sx, p.sy);
  if (!dog) return;
  petDog(dog, dog.x, dog.y);
}

// Hit-test en pantalla: el perro está de pie, su cuerpo queda por encima de los pies
export function findDogAtScreen (sx, sy) {
  if (sx == null) return null;
  let best = null, bestY = -Infinity;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (!d) continue;
    const pr = project(d.x, d.y);
    const k = pr.s * 1.6 * (d.age === 'baby' ? 0.58 : d.age === 'young' ? 0.8 : 1);
    const cx = pr.x, cy = pr.y - 28 * k;
    if (Math.abs(sx - cx) <= 32 * k && Math.abs(sy - cy) <= 30 * k && d.y > bestY) { best = d; bestY = d.y; }
  }
  return best;
}

export function petDog (dog, sx, sy) {
  const now = performance.now();
  if (now - (dog.lastPetAt || 0) < DOG.PET_COOLDOWN_MS) return false;
  dog.lastPetAt = now;
  dog.happiness = Math.min(DOG.MAX_HAPPINESS, dog.happiness + DOG.PET_HAPPINESS);
  state.fever.value = Math.min(ECONOMY.FEVER_MAX, state.fever.value + DOG.PET_FEVER_GAIN);
  state.stats.totalPets = (state.stats.totalPets || 0) + 1;
  addXP(dog, DOG.XP_PER_PET);
  sfx.bark();
  burst(sx ?? dog.x, sy ?? dog.y, {
    count: 8, color: '#ec5985', speed: 80, gravity: -120,
    life: 0.8, size: 5, spread: Math.PI * 2,
    shape: 'star', glow: true,
  });
  spawnHearts(sx ?? dog.x, sy ?? dog.y);
  // Mini goal hook
  if (state.progression.miniGoal?.type === 'pet') {
    state.progression.miniGoal.progress = (state.progression.miniGoal.progress || 0) + 1;
  }
  return true;
}

function spawnHearts (cx, cy) {
  const overlay = document.getElementById('park-overlay');
  if (!overlay) return;
  for (let i = 0; i < 3; i++) {
    const pos = toOverlayPct(cx + (Math.random() * 24 - 12), cy, 60);
    const el = document.createElement('div');
    el.className = 'float-label';
    el.style.left = pos.left + '%';
    el.style.top = pos.top + '%';
    el.style.color = '#f472b6';
    el.style.fontSize = '20px';
    el.textContent = '♥';
    el.style.animationDelay = (i * 0.08) + 's';
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}
