// ============================================================
// saveManager.js
// Guardado / carga / migración / borrado de partida.
// Toda la persistencia pasa por platformAdapter para poder
// migrar a Steam Cloud sin tocar el resto del juego.
// ============================================================

import { GAME } from './config.js';
import { state, loadIntoState } from './gameState.js';
import { platform } from './platformAdapter.js';
import { logEvent } from './eventLog.js';

let _autoTimer = null;

export function hasSave () {
  return !!platform.loadLocal(GAME.SAVE_KEY);
}

export function save () {
  state.meta.lastSaved = Date.now();
  state.meta.version = GAME.SAVE_VERSION;
  const ok = platform.saveLocal(GAME.SAVE_KEY, JSON.parse(JSON.stringify(state)));
  if (ok) {
    platform.saveToCloud(GAME.SAVE_KEY, state); // emulado, listo para Steam Cloud
    logEvent('Partida guardada', 'gold');
  } else {
    logEvent('No se pudo guardar', 'red');
  }
  return ok;
}

export function load () {
  const raw = platform.loadLocal(GAME.SAVE_KEY);
  if (!raw) return false;
  const migrated = migrate(raw);
  loadIntoState(migrated);
  state.meta.paused = false;
  return true;
}

export function deleteSave () {
  platform.deleteLocal(GAME.SAVE_KEY);
}

export function startAutoSave () {
  stopAutoSave();
  _autoTimer = setInterval(() => {
    if (!state.meta.paused && state.meta.started) save();
  }, GAME.AUTO_SAVE_MS);
}

export function stopAutoSave () {
  if (_autoTimer) clearInterval(_autoTimer);
  _autoTimer = null;
}

// ------------------------------------------------------------
// MIGRACIÓN
// Cada bump de SAVE_VERSION añade un paso aquí.
// Mantener simple, idempotente y sin romper estados antiguos.
// ------------------------------------------------------------
function migrate (raw) {
  let data = raw;
  let v = data?.meta?.version ?? 0;

  while (v < GAME.SAVE_VERSION) {
    switch (v) {
      // case 1: data = migrateV1toV2(data); break;
      default:
        v = GAME.SAVE_VERSION;
        if (data.meta) data.meta.version = v;
    }
    v++;
  }

  if (!data.meta) data.meta = {};
  data.meta.version = GAME.SAVE_VERSION;
  return data;
}
