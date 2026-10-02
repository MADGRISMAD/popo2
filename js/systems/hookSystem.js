// ============================================================
// systems/hookSystem.js — los "ganchos" que hacen que quieras
// una partida más:
//   · Nivel del cuidador con XP constante y recompensas al subir.
//   · Buffs temporales (Frenesí, Imán gigante…).
//   · Caja misteriosa que cae al parque (recompensa variable).
//   · Giros de ruleta (por nivel y gratis cada X minutos).
//   · Recompensa diaria con racha.
//   · Callouts de combo y aviso de combo roto.
// ============================================================

import { state } from '../gameState.js';
import { HOOKS, ECONOMY, PARK } from '../config.js';
import { sfx } from '../audioManager.js';
import { logEvent } from '../eventLog.js';
import { modal, toast } from '../modalManager.js';
import { confetti, sparkle, burst } from '../render/particles.js';
import { banner, shake, flash, fmt, floatText } from '../render/juice.js';

// ------------------------------------------------------------
// Ritmo de ganancias (popó/min real de los últimos 60 s)
// ------------------------------------------------------------
const _earnings = []; // [t, amount]
export function recordEarn (amount) {
  _earnings.push([performance.now(), amount]);
}
export function earnRatePerMin () {
  const now = performance.now();
  while (_earnings.length && now - _earnings[0][0] > 60_000) _earnings.shift();
  let sum = 0;
  for (const e of _earnings) sum += e[1];
  return sum;
}
// Recompensas escalan con lo que ganas, para que siempre importen
export function scaledPoop (minutes, floor) {
  const passive = state.park.activeDogs.length * 12;
  return Math.round(Math.max(floor, Math.max(earnRatePerMin(), passive) * minutes));
}

// ------------------------------------------------------------
// Nivel del cuidador
// ------------------------------------------------------------
export function xpForLevel (lvl) {
  return Math.floor(HOOKS.XP_BASE * Math.pow(HOOKS.XP_GROWTH, lvl - 1));
}

export function gainXP (amount) {
  if (!state.player) return;
  state.player.xp += amount;
  let leveled = 0;
  while (state.player.xp >= xpForLevel(state.player.level)) {
    state.player.xp -= xpForLevel(state.player.level);
    state.player.level++;
    leveled++;
  }
  if (leveled) onLevelUp(state.player.level);
}

function levelReward (lvl) {
  const r = { poop: scaledPoop(1.5, Math.round(40 * Math.pow(lvl, 1.5))), spins: 1, packs: {} };
  if (lvl % 5 === 0)  r.packs.dog = (r.packs.dog || 0) + 1;
  if (lvl % 10 === 0) r.packs.legend = (r.packs.legend || 0) + 1;
  if (lvl % 3 === 0)  r.packs.food = (r.packs.food || 0) + 2;
  return r;
}

function onLevelUp (lvl) {
  const r = levelReward(lvl);
  grant(r);
  sfx.levelUp();
  shake(10);
  flash('rgba(255,226,122,0.55)');
  confetti(PARK.W / 2, PARK.H / 2, 90);
  const extras = [];
  extras.push(`💩 +${fmt(r.poop)}`);
  extras.push('🎡 +1 giro');
  if (r.packs.food)   extras.push(`📦 +${r.packs.food}`);
  if (r.packs.dog)    extras.push(`🎁 +${r.packs.dog}`);
  if (r.packs.legend) extras.push(`🌟 +${r.packs.legend}`);
  banner(`¡NIVEL ${lvl}!`, { kind: 'level', color: '#ffe27a', sub: extras.join(' · '), ms: 2400 });
  logEvent(`¡Subiste a nivel ${lvl}! ${extras.join(' ')}`, 'gold');
  // Avance: qué te espera en el próximo hito
  const next = [5, 10].map(s => Math.ceil((lvl + 1) / s) * s);
  const nextMilestone = Math.min(...next);
  setTimeout(() => toast.show({
    icon: '⭐', title: `Nivel ${lvl}`,
    desc: `Próximo premio grande en nivel ${nextMilestone} (${nextMilestone % 10 === 0 ? 'Sobre Legendario' : 'Sobre de Perros'})`,
    kind: 'gold', durationMs: 3500,
  }), 900);
}

// Entrega genérica de recompensas
export function grant (r = {}) {
  if (r.poop) {
    state.resources.poop += r.poop;
    state.resources.coinsLifetime += r.poop;
  }
  if (r.packs) {
    for (const [k, v] of Object.entries(r.packs)) state.resources.packs[k] = (state.resources.packs[k] || 0) + v;
  }
  if (r.spins) state.hooks.spins = (state.hooks.spins || 0) + r.spins;
  if (r.fever) startFever();
  if (r.rain)  poopRain(r.rain);
  if (r.buff)  addBuff(r.buff);
}

// ------------------------------------------------------------
// Fiebre y lluvia (se registran desde poopSystem para evitar ciclos)
// ------------------------------------------------------------
let _rainImpl = null;
export function setRainImpl (fn) { _rainImpl = fn; }
export function poopRain (n) { if (_rainImpl) _rainImpl(n); }

export function startFever () {
  state.fever.value = ECONOMY.FEVER_MAX;
}

// ------------------------------------------------------------
// Buffs temporales
// ------------------------------------------------------------
const _buffs = []; // { id, name, icon, mult, magnet, until, total }
export const BUFFS = {
  frenzy:  { id: 'frenzy',  name: 'Frenesí',      icon: '🔥', mult: 7,  magnet: 0,   ms: 15_000, color: '#ff7a59' },
  magnet:  { id: 'magnet',  name: 'Imán gigante', icon: '🧲', mult: 1,  magnet: 110, ms: 20_000, color: '#5fb1ff' },
  golden:  { id: 'golden',  name: 'Toque dorado', icon: '✨', mult: 1,  magnet: 0,   ms: 20_000, color: '#ffd56a', goldChance: 6 },
};

export function addBuff (id) {
  const def = BUFFS[id];
  if (!def) return;
  const now = performance.now();
  const existing = _buffs.find(b => b.id === id);
  if (existing) { existing.until = Math.max(existing.until, now) + def.ms; existing.total = existing.until - now; return; }
  _buffs.push({ ...def, until: now + def.ms, total: def.ms });
}
export function activeBuffs () { return _buffs; }
export function buffValueMult () {
  let m = 1; for (const b of _buffs) m *= b.mult || 1; return m;
}
export function buffMagnet () {
  let m = 0; for (const b of _buffs) m += b.magnet || 0; return m;
}
export function buffGoldChance () {
  let m = 1; for (const b of _buffs) m *= b.goldChance || 1; return m;
}

// ------------------------------------------------------------
// Caja misteriosa
// ------------------------------------------------------------
let _box = null;           // { x, y, bornAt, until }
let _nextBoxAt = 0;

const BOX_REWARDS = [
  { id: 'frenzy', w: 26, label: '¡FRENESÍ x7!',        sub: 'Cada popó vale x7 durante 15 s', color: '#ff7a59' },
  { id: 'rain',   w: 24, label: '¡LLUVIA DE POPÓ!',    sub: '¡Recógelas todas!',             color: '#c98a4a' },
  { id: 'bag',    w: 20, label: '¡BOLSA DE POPÓ!',     sub: '',                               color: '#ffe27a' },
  { id: 'magnet', w: 10, label: '¡IMÁN GIGANTE!',      sub: 'Radio enorme durante 20 s',      color: '#5fb1ff' },
  { id: 'golden', w: 8,  label: '¡TOQUE DORADO!',      sub: 'Muchas más popós doradas 20 s',  color: '#ffd56a' },
  { id: 'fever',  w: 7,  label: '¡FIEBRE INSTANTÁNEA!', sub: '',                              color: '#ec5985' },
  { id: 'spin',   w: 6,  label: '¡GIRO GRATIS!',       sub: 'Ve a la ruleta 🎡',              color: '#a64dff' },
  { id: 'pack',   w: 4,  label: '¡SOBRE DE PERROS!',   sub: '',                               color: '#ffb71a' },
  { id: 'legend', w: 1,  label: '¡¡SOBRE LEGENDARIO!!', sub: 'Increíble suerte',              color: '#ff4757' },
];

export function getBox () { return _box; }

function scheduleBox (now) {
  _nextBoxAt = now + (HOOKS.BOX_MIN_S + Math.random() * HOOKS.BOX_VAR_S) * 1000;
}

function spawnBox (now) {
  _box = {
    x: 90 + Math.random() * (PARK.W - 180),
    y: 90 + Math.random() * (PARK.H - 180),
    bornAt: now,
    until: now + HOOKS.BOX_LIFETIME_S * 1000,
  };
  sfx.boxSpawn();
}

export function tryCollectBox (x, y, radius = 36) {
  if (!_box) return false;
  // Mientras cae no se puede recoger
  if (performance.now() - _box.bornAt < 500) return false;
  const dx = _box.x - x, dy = _box.y - y;
  if (dx * dx + dy * dy > radius * radius) return false;
  openBox();
  return true;
}

function openBox () {
  const b = _box;
  _box = null;
  state.hooks.boxesOpened = (state.hooks.boxesOpened || 0) + 1;
  const total = BOX_REWARDS.reduce((s, r) => s + r.w, 0);
  let roll = Math.random() * total;
  let pick = BOX_REWARDS[0];
  for (const r of BOX_REWARDS) { roll -= r.w; if (roll <= 0) { pick = r; break; } }

  let sub = pick.sub;
  switch (pick.id) {
    case 'frenzy': addBuff('frenzy'); break;
    case 'magnet': addBuff('magnet'); break;
    case 'golden': addBuff('golden'); break;
    case 'rain':   poopRain(40); break;
    case 'bag': {
      const amount = scaledPoop(4, 150);
      grant({ poop: amount });
      sub = `+${fmt(amount)} 💩`;
      floatText(b.x, b.y - 20, '+' + fmt(amount), 'golden big');
      break;
    }
    case 'fever':  startFever(); break;
    case 'spin':   grant({ spins: 1 }); break;
    case 'pack':   grant({ packs: { dog: 1 } }); break;
    case 'legend': grant({ packs: { legend: 1 } }); break;
  }
  gainXP(HOOKS.XP_PER_BOX);
  sfx.boxOpen();
  shake(8);
  burst(b.x, b.y, { count: 30, color: pick.color, speed: 260, gravity: 300, life: 0.9, size: 4, shape: 'star', glow: true });
  confetti(b.x, b.y, 40);
  banner(pick.label, { kind: 'box', color: pick.color, sub, ms: 1800 });
  logEvent(`🎁 Caja misteriosa: ${pick.label.replace(/[¡!]/g, '')}`, 'gold');
}

// ------------------------------------------------------------
// Combo: callouts y aviso de combo roto
// ------------------------------------------------------------
const COMBO_CALLS = [
  { at: 2,  text: '¡BIEN!',         color: '#5fc66f' },
  { at: 3,  text: '¡GENIAL!',       color: '#4d8fff' },
  { at: 4,  text: '¡BRUTAL!',       color: '#a64dff' },
  { at: 5,  text: '¡IMPARABLE!',    color: '#ff7a59' },
  { at: 7,  text: '¡LEGENDARIO!',   color: '#ffb71a' },
  { at: 10, text: '¡¡POPÓ-DIOS!!',  color: '#ec59c2' },
];
let _chainPeak = 1;
let _callIdx = -1;
let _brokenShown = true;

export function onComboPick (mult) {
  _brokenShown = false;
  if (mult > _chainPeak) _chainPeak = mult;
  if (mult > (state.hooks.bestCombo || 1)) state.hooks.bestCombo = mult;
  for (let i = COMBO_CALLS.length - 1; i > _callIdx; i--) {
    if (mult >= COMBO_CALLS[i].at) {
      _callIdx = i;
      const c = COMBO_CALLS[i];
      banner(c.text, { kind: 'combo', color: c.color, sub: `Combo x${c.at}`, ms: 1100 });
      sfx.comboCall(i);
      shake(3 + i * 1.5);
      break;
    }
  }
}

// Fracción de la ventana de combo que queda (para el anillo del cursor)
export function comboWindowLeft () {
  if (state.combo.multiplier <= 1.01) return 0;
  const since = performance.now() - state.combo.lastPickAt;
  return Math.max(0, 1 - since / ECONOMY.COMBO_DECAY_MS);
}

// ------------------------------------------------------------
// Recompensa diaria con racha
// ------------------------------------------------------------
const DAILY = [
  { poopMin: 3,  floor: 100, label: '💩' },
  { poopMin: 4,  floor: 150, packs: { food: 2 }, label: '📦 x2' },
  { poopMin: 5,  floor: 200, spins: 2, label: '🎡 x2' },
  { poopMin: 6,  floor: 300, packs: { dog: 1 }, label: '🎁' },
  { poopMin: 8,  floor: 400, spins: 3, label: '🎡 x3' },
  { poopMin: 10, floor: 600, packs: { dog: 2 }, label: '🎁 x2' },
  { poopMin: 15, floor: 1000, packs: { legend: 1 }, spins: 3, label: '🌟 + 🎡 x3' },
];

function todayKey (d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayKey () {
  const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d);
}

export function checkDaily () {
  const today = todayKey();
  if (state.hooks.dailyDay === today) return false;
  const continued = state.hooks.dailyDay === yesterdayKey();
  const streak = continued ? (state.hooks.dailyStreak || 0) + 1 : 1;
  const lost = !continued && (state.hooks.dailyStreak || 0) > 1;
  const idx = (streak - 1) % DAILY.length;
  const day = DAILY[idx];
  const reward = { poop: scaledPoop(day.poopMin, day.floor), packs: day.packs, spins: day.spins };

  const cells = DAILY.map((d, i) => {
    const cls = i < idx ? 'done' : i === idx ? 'today' : 'future';
    return `<div class="daily-cell ${cls} ${i === 6 ? 'big' : ''}">
      <div class="daily-day">Día ${i + 1}</div>
      <div class="daily-ico">${i === 6 ? '🌟' : i < idx ? '✅' : d.label.split(' ')[0]}</div>
      <div class="daily-lbl">${d.label}</div>
    </div>`;
  }).join('');

  const body = `
    <div class="daily-wrap">
      <div class="daily-streak">🔥 Racha: <strong>${streak}</strong> día${streak === 1 ? '' : 's'}</div>
      ${lost ? `<div class="daily-lost">Perdiste tu racha anterior de ${state.hooks.dailyStreak} días 😢 ¡No vuelvas a faltar!</div>` : ''}
      <div class="daily-grid">${cells}</div>
      <div class="daily-today">Hoy: 💩 ${fmt(reward.poop)}${day.packs ? ' · ' + day.label : day.spins ? ' · ' + day.label : ''}</div>
      <div class="daily-hint">Vuelve mañana para el Día ${(idx + 1) % 7 + 1}. El Día 7 trae un Sobre Legendario.</div>
    </div>`;
  const claim = () => {
    if (state.hooks.dailyDay === today) return;
    state.hooks.dailyDay = today;
    state.hooks.dailyStreak = streak;
    grant(reward);
    sfx.levelUp();
    confetti(PARK.W / 2, PARK.H / 2, 80);
    logEvent(`Recompensa diaria (día ${streak}) reclamada`, 'gold');
    modal.close();
  };
  const m = modal.open({
    title: '🎁 Recompensa diaria',
    body,
    footer: `<button class="btn gold big" data-claim>¡Reclamar!</button>`,
    onClose: claim,
  });
  m.querySelector('[data-claim]').onclick = claim;
  return true;
}

// ------------------------------------------------------------
// Ganancias offline (popup con contador)
// ------------------------------------------------------------
export function showOfflineEarnings (amount, seconds, then) {
  if (!amount || amount <= 0) { if (then) then(); return; }
  const mins = Math.max(1, Math.round(seconds / 60));
  const body = `
    <div class="offline-wrap">
      <div class="offline-ico">🐕💤💩</div>
      <div>Mientras no estabas (${mins} min), tus perros siguieron trabajando:</div>
      <div class="offline-amount" data-amount>💩 0</div>
      <div class="daily-hint">Mejora la producción para ganar más la próxima vez.</div>
    </div>`;
  const m = modal.open({ title: '¡Bienvenido de vuelta!', body, footer: `<button class="btn gold big" data-ok>¡Genial!</button>`, onClose: then });
  m.querySelector('[data-ok]').onclick = () => modal.close();
  const el = m.querySelector('[data-amount]');
  const start = performance.now();
  const dur = 1200;
  const step = () => {
    const k = Math.min(1, (performance.now() - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = '💩 ' + fmt(amount * eased);
    if (k < 1 && el.isConnected) { if (Math.random() < 0.4) sfx.coin(); requestAnimationFrame(step); }
  };
  requestAnimationFrame(step);
}

// ------------------------------------------------------------
// Update por frame
// ------------------------------------------------------------
let _lastPlaySec = null;
export function update (dt) {
  const now = performance.now();

  // Buffs
  for (let i = _buffs.length - 1; i >= 0; i--) {
    if (now >= _buffs[i].until) {
      logEvent(`${_buffs[i].icon} ${_buffs[i].name} terminó`);
      _buffs.splice(i, 1);
    }
  }

  // Caja misteriosa
  if (_nextBoxAt === 0) scheduleBox(now - 20_000); // la primera llega antes
  if (_box && now >= _box.until) { _box = null; scheduleBox(now); }
  if (!_box && now >= _nextBoxAt && state.park.activeDogs.length > 0) { spawnBox(now); scheduleBox(now + HOOKS.BOX_LIFETIME_S * 1000); }

  // Giro gratis cada X minutos jugados
  state.hooks.spinClock = (state.hooks.spinClock || 0) + dt;
  if (state.hooks.spinClock >= HOOKS.FREE_SPIN_EVERY_S) {
    state.hooks.spinClock = 0;
    state.hooks.spins = (state.hooks.spins || 0) + 1;
    toast.show({ icon: '🎡', title: '¡Giro gratis!', desc: 'Tienes un giro de ruleta disponible.', kind: 'gold' });
    sfx.boxSpawn();
  }

  // Combo roto: el combo se enfría por completo
  if (!_brokenShown && state.combo.multiplier <= 1.01) {
    _brokenShown = true;
    if (_chainPeak >= 2.5) {
      banner(`Combo perdido x${_chainPeak.toFixed(1)}`, { kind: 'break', color: '#c9b8a6', sub: `Récord: x${(state.hooks.bestCombo || 1).toFixed(1)}`, ms: 1300 });
      sfx.comboBreak();
    }
    _chainPeak = 1;
    _callIdx = -1;
  }
  // Si el combo baja por debajo del callout alcanzado, permite repetirlo
  while (_callIdx >= 0 && state.combo.multiplier < COMBO_CALLS[_callIdx].at - 0.6) _callIdx--;
}

export function secondsToFreeSpin () {
  return Math.max(0, HOOKS.FREE_SPIN_EVERY_S - (state.hooks.spinClock || 0));
}
