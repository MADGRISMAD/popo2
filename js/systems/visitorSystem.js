// ============================================================
// systems/visitorSystem.js — visitantes que cruzan el parque y
// dejan propinas si los perros están felices.
// ============================================================

import { state } from '../gameState.js';
import { VISITORS, PARK } from '../config.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { getModifiers } from './specializationSystem.js';

let _nextSpawnAt = 0;
let _nextId = 1;

export function update (dt) {
  const now = performance.now();
  // Spawn
  if (_nextSpawnAt === 0) _nextSpawnAt = now + (VISITORS.SPAWN_INTERVAL_MIN_S + Math.random() * VISITORS.SPAWN_INTERVAL_VAR_S) * 1000;
  if (now >= _nextSpawnAt) {
    _nextSpawnAt = now + (VISITORS.SPAWN_INTERVAL_MIN_S + Math.random() * VISITORS.SPAWN_INTERVAL_VAR_S) * 1000;
    spawnVisitor();
  }
  // Move
  for (const v of state.park.visitors) {
    v.x += v.vx * dt;
    v.y += v.vy * dt;
  }
  // Salida / propina
  state.park.visitors = state.park.visitors.filter(v => {
    if (now >= v.until || v.x < -40 || v.x > PARK.W + 40) {
      tryGiveTip(v);
      return false;
    }
    return true;
  });
}

function spawnVisitor () {
  if (state.park.activeDogs.length === 0) return;
  const fromLeft = Math.random() < 0.5;
  const v = {
    id: _nextId++,
    x: fromLeft ? -20 : PARK.W + 20,
    y: 80 + Math.random() * (PARK.H - 160),
    vx: fromLeft ? 28 + Math.random() * 12 : -(28 + Math.random() * 12),
    vy: (Math.random() - 0.5) * 6,
    until: performance.now() + VISITORS.STAY_S * 1000,
    color: ['#fbbf24', '#60a5fa', '#a855f7', '#34d399', '#f472b6'][Math.floor(Math.random() * 5)],
  };
  state.park.visitors.push(v);
  state.stats.totalVisitors = (state.stats.totalVisitors || 0) + 1;
  logEvent('Llegó un visitante al parque', 'purple');
}

function tryGiveTip (visitor) {
  const happy = avgHappiness();
  if (happy < VISITORS.REQUIRE_HAPPINESS) return;
  const mods = getModifiers();
  const tip = Math.floor((VISITORS.TIP_BASE + happy * VISITORS.TIP_PER_HAPPINESS) * (mods.tipMult || 1));
  if (tip > 0) {
    state.resources.poop += tip;
    state.resources.coinsLifetime += tip;
    sfx.pickGold();
    logEvent(`Visitante encantado dejó propina (+💩 ${tip})`, 'gold');
  }
}

function avgHappiness () {
  const dogs = state.park.activeDogs.map(id => state.dogs.map[id]).filter(Boolean);
  if (dogs.length === 0) return 0;
  const total = dogs.reduce((s, d) => s + d.happiness, 0);
  return total / dogs.length;
}
