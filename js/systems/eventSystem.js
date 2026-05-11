// ============================================================
// systems/eventSystem.js — eventos globales temporales.
// ============================================================

import { state } from '../gameState.js';
import { EVENTS, EVENTS_BY_ID } from '../data/events.js';
import { logEvent } from '../eventLog.js';
import { toast } from '../modalManager.js';

let _nextEventAt = 0;

export function update (dt) {
  const now = performance.now();
  if (state.progression.eventActive) {
    if (now >= state.progression.eventActive.until) {
      logEvent(`Evento terminado: ${state.progression.eventActive.name}`);
      state.progression.eventActive = null;
      _nextEventAt = now + 60_000 + Math.random() * 90_000;
    }
    return;
  }
  if (_nextEventAt === 0) _nextEventAt = now + 90_000 + Math.random() * 90_000;
  if (now >= _nextEventAt) startRandomEvent();
}

function startRandomEvent () {
  let total = 0; for (const e of EVENTS) total += e.weight;
  let r = Math.random() * total;
  let pick = EVENTS[0];
  for (const e of EVENTS) { r -= e.weight; if (r <= 0) { pick = e; break; } }
  state.progression.eventActive = {
    id: pick.id, name: pick.name, icon: pick.icon, desc: pick.desc,
    until: performance.now() + pick.durationMs,
  };
  toast.show({ icon: pick.icon, title: 'Evento: ' + pick.name, desc: pick.desc, kind: 'gold' });
  logEvent('Evento: ' + pick.name, 'purple');
}
