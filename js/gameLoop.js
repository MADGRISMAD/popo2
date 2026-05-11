// ============================================================
// gameLoop.js — Loop central basado en requestAnimationFrame.
// Usa delta time, soporta pausa, expone hooks update/render.
// ============================================================

import { GAME } from './config.js';
import { state } from './gameState.js';

const updaters = [];
const renderers = [];
let lastTs = 0;
let running = false;
let _accSec = 0;

export function registerUpdater (fn)  { updaters.push(fn);  }
export function registerRenderer (fn) { renderers.push(fn); }

export function startLoop () {
  if (running) return;
  running = true;
  lastTs = performance.now();
  requestAnimationFrame(tick);
}
export function stopLoop () { running = false; }

function tick (ts) {
  if (!running) return;
  let dt = ts - lastTs;
  lastTs = ts;
  if (dt > GAME.MAX_DELTA_MS) dt = GAME.MAX_DELTA_MS;
  const dts = dt / 1000;

  if (!state.meta.paused && state.meta.started) {
    _accSec += dts;
    if (_accSec >= 1) {
      state.stats.playTimeSec += Math.floor(_accSec);
      _accSec -= Math.floor(_accSec);
    }
    for (const fn of updaters) {
      try { fn(dts); } catch (e) { console.error('updater error', e); }
    }
  }

  // Renderers corren siempre (pause overlay, UI animation, etc.)
  for (const fn of renderers) {
    try { fn(dts); } catch (e) { console.error('renderer error', e); }
  }

  requestAnimationFrame(tick);
}
