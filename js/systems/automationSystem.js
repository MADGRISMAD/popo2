// ============================================================
// systems/automationSystem.js — automatizaciones desbloqueables
// (auto-recolección, auto-rellenado de platos, auto-crianza).
// ============================================================

import { state } from '../gameState.js';
import { ECONOMY } from '../config.js';
import { refillBowl } from './foodBowlSystem.js';
import { startBreeding, canStartBreeding } from './breedingSystem.js';
import { isAdult } from './dogSystem.js';
import { logEvent } from '../eventLog.js';

let _timers = { collect: 0, feed: 0, breed: 0 };

export function update (dt) {
  const auto = state.inventory.automations;

  // ---- AUTO COLLECT (recolección automática lenta) ----
  if ((auto.auto_collect || 0) > 0) {
    _timers.collect += dt;
    const interval = Math.max(2.5, 8 - auto.auto_collect * 0.8);
    if (_timers.collect >= interval && state.park.poops.length > 0) {
      _timers.collect = 0;
      const p = state.park.poops.shift();
      const earned = Math.round((p?.value || 1) * 0.6);
      state.resources.poop += earned;
      state.resources.coinsLifetime += earned;
      state.stats.totalPoopCollected++;
    }
  }

  // ---- AUTO FEED ----
  if ((auto.auto_feed || 0) > 0) {
    _timers.feed += dt;
    const interval = Math.max(8, 25 - auto.auto_feed * 3);
    if (_timers.feed >= interval) {
      _timers.feed = 0;
      for (const b of state.park.bowls) {
        if (b.qty < b.capacity * 0.4) {
          refillBowl(b.id, b.type, 5);
          break;
        }
      }
    }
  }

  // ---- AUTO BREED ----
  if ((auto.auto_breed || 0) > 0 && state.park.breedingZone) {
    _timers.breed += dt;
    if (_timers.breed >= 25) {
      _timers.breed = 0;
      const adults = state.park.activeDogs
        .map(id => state.dogs.map[id])
        .filter(d => d && isAdult(d) && d.state === 'idle');
      const males = adults.filter(d => d.sex === 'M');
      const females = adults.filter(d => d.sex === 'F');
      if (males.length && females.length) {
        const m = males[0]; const f = females[0];
        const ok = canStartBreeding(m, f);
        if (ok.ok) {
          startBreeding(m.id, f.id);
          logEvent(`Auto-crianza: ${m.name} + ${f.name}`);
        }
      }
    }
  }
}
