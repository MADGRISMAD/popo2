// ============================================================
// eventLog.js — registro compacto de eventos en el footer.
// Acepta cualquier sistema; UI se subscribe.
// ============================================================

import { state } from './gameState.js';

const MAX_LOG = 30;
const subs = new Set();

export function logEvent (msg, kind = 'normal') {
  const entry = { ts: Date.now(), msg, kind };
  state.log.unshift(entry);
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG;
  subs.forEach(cb => { try { cb(entry); } catch (e) {} });
}

export function subscribe (cb) {
  subs.add(cb);
  return () => subs.delete(cb);
}
