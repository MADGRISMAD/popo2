// ============================================================
// platformAdapter.js
// Capa de abstracción para que el juego no hable directamente
// con localStorage / Steam / Cloud / Fullscreen.
//
// Hoy: implementación local (localStorage + Fullscreen API).
// Mañana: se sustituye por Steamworks / Electron / Tauri sin
// tocar el resto del juego.
// ============================================================

const ACHIEVEMENTS_KEY = 'popo-park-ach';
const STATS_KEY        = 'popo-park-stats';
const CLOUD_PREFIX     = 'popo-park-cloud:';

class LocalPlatformAdapter {
  constructor () {
    this._achievements = this._loadJSON(ACHIEVEMENTS_KEY, {});
    this._stats        = this._loadJSON(STATS_KEY, {});
    this._listeners    = new Map();
  }

  // ---------- Identidad ----------
  isSteamAvailable () { return false; }
  platformName     () { return 'local'; }
  hasCloud         () { return false; }

  // ---------- Logros ----------
  unlockAchievement (id) {
    if (this._achievements[id]) return false;
    this._achievements[id] = { unlockedAt: Date.now() };
    this._saveJSON(ACHIEVEMENTS_KEY, this._achievements);
    this._emit('achievement', id);
    return true;
  }
  isAchievementUnlocked (id) { return !!this._achievements[id]; }
  listAchievements () { return { ...this._achievements }; }

  // ---------- Stats ----------
  setStat (id, value) {
    this._stats[id] = value;
    this._saveJSON(STATS_KEY, this._stats);
  }
  incStat (id, delta = 1) {
    this._stats[id] = (this._stats[id] || 0) + delta;
    this._saveJSON(STATS_KEY, this._stats);
  }
  getStat (id, fallback = 0) {
    return this._stats[id] ?? fallback;
  }

  // ---------- Cloud (emulado) ----------
  saveToCloud (key, data) {
    try {
      localStorage.setItem(CLOUD_PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }
  loadFromCloud (key) {
    try {
      const raw = localStorage.getItem(CLOUD_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ---------- Save (local) ----------
  saveLocal (key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  loadLocal (key) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }
  deleteLocal (key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  // ---------- Fullscreen ----------
  toggleFullscreen () {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  isFullscreen () { return !!document.fullscreenElement; }

  // ---------- Idioma ----------
  getLanguage () { return navigator.language?.slice(0, 2) || 'es'; }

  // ---------- Salir ----------
  quit () {
    // En navegador no podemos forzar el cierre; redirigimos al menú.
    if (window.close) try { window.close(); } catch (e) {}
  }

  // ---------- Eventos ----------
  on (event, cb) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(cb);
    return () => this._listeners.get(event)?.delete(cb);
  }
  _emit (event, payload) {
    this._listeners.get(event)?.forEach(cb => { try { cb(payload); } catch (e) {} });
  }

  // ---------- Helpers ----------
  _loadJSON (key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  _saveJSON (key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }
}

export const platform = new LocalPlatformAdapter();
