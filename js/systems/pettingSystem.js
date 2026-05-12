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

  const dog = findDogAt(p.x, p.y);
  if (!dog) return;
  petDog(dog, p.x, p.y);
}

function findDogAt (x, y) {
  for (let i = state.park.activeDogs.length - 1; i >= 0; i--) {
    const d = state.dogs.map[state.park.activeDogs[i]];
    if (!d) continue;
    const r = d.age === 'baby' ? 18 : d.age === 'young' ? 22 : 26;
    if ((d.x - x) ** 2 + (d.y - y) ** 2 <= r * r) return d;
  }
  return null;
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
  const canvas = document.getElementById('park-canvas');
  const rect = canvas.getBoundingClientRect();
  const ovRect = overlay.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const px = (cx / canvas.width) * rect.width + (rect.left - ovRect.left) + (Math.random() * 24 - 12);
    const py = (cy / canvas.height) * rect.height + (rect.top - ovRect.top);
    const el = document.createElement('div');
    el.className = 'float-label';
    el.style.left = px + 'px';
    el.style.top = py + 'px';
    el.style.color = '#f472b6';
    el.style.fontSize = '20px';
    el.textContent = '♥';
    el.style.animationDelay = (i * 0.08) + 's';
    overlay.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}
