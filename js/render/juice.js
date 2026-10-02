// ============================================================
// render/juice.js — "game feel": sacudida de pantalla, banners
// gigantes, flash, formateo de números grandes y contador animado.
// Todo es DOM/CSS ligero para que funcione en cualquier calidad.
// ============================================================

import { state } from '../gameState.js';

// ---------- Formato de números: 1.2K · 3.4M · 5.6B ----------
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export function fmt (n) {
  n = Math.floor(n || 0);
  if (Math.abs(n) < 10_000) return n.toLocaleString('es');
  let i = 0;
  let v = n;
  while (Math.abs(v) >= 1000 && i < SUFFIXES.length - 1) { v /= 1000; i++; }
  return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + SUFFIXES[i];
}

// ---------- Sacudida de pantalla (sobre el parque) ----------
let _shake = 0;
let _shakeEl = null;
export function shake (intensity = 6) {
  if (!state.options.screenShake || state.options.reduceMotion) return;
  _shake = Math.min(22, Math.max(_shake, intensity));
}

// ---------- Flash de color sobre el parque ----------
export function flash (color = 'rgba(255,240,180,0.55)') {
  if (state.options.reduceMotion) return;
  const area = document.getElementById('park-area');
  if (!area) return;
  const el = document.createElement('div');
  el.className = 'juice-flash';
  el.style.background = color;
  area.appendChild(el);
  setTimeout(() => el.remove(), 450);
}

// ---------- Banner gigante centrado en el parque ----------
// kind: 'combo' | 'level' | 'jackpot' | 'box' | 'break'
// Los banners grandes (level/jackpot/box) van en cola para no pisarse;
// los pequeños (combo/break) se omiten si hay uno grande en pantalla.
const BIG = new Set(['level', 'jackpot', 'box']);
const _queue = [];
let _bigUntil = 0;

export function banner (text, opts = {}) {
  const kind = opts.kind || 'combo';
  const now = performance.now();
  if (BIG.has(kind)) {
    if (now < _bigUntil || _queue.length) { if (_queue.length < 4) _queue.push([text, opts]); return; }
    _bigUntil = now + Math.min(opts.ms || 1300, 1500);
  } else if (now < _bigUntil) return;
  showBanner(text, opts);
}

function showBanner (text, { color = '#ffe27a', sub = '', kind = 'combo', ms = 1300 } = {}) {
  const overlay = document.getElementById('park-overlay');
  if (!overlay) return;
  if (BIG.has(kind)) overlay.querySelectorAll('.juice-banner').forEach(e => e.remove());
  else overlay.querySelectorAll('.juice-banner.' + kind).forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = 'juice-banner ' + kind;
  el.style.setProperty('--banner-color', color);
  el.innerHTML = `<div class="jb-main">${text}</div>${sub ? `<div class="jb-sub">${sub}</div>` : ''}`;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function pumpQueue (now) {
  if (!_queue.length || now < _bigUntil) return;
  const [text, opts] = _queue.shift();
  _bigUntil = now + Math.min(opts.ms || 1300, 1500);
  showBanner(text, opts);
}

// ---------- Texto flotante en coordenadas del parque ----------
export function floatText (cx, cy, text, cls = '') {
  const overlay = document.getElementById('park-overlay');
  const canvas = document.getElementById('park-canvas');
  if (!overlay || !canvas) return;
  const el = document.createElement('div');
  el.className = 'float-label ' + cls;
  el.style.left = (cx / canvas.width) * 100 + '%';
  el.style.top = (cy / canvas.height) * 100 + '%';
  el.textContent = text;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

// ---------- Contador animado (sube rodando) ----------
const _counters = new Map(); // el -> { shown, target }
export function rollCounter (el, target, formatter = fmt) {
  if (!el) return;
  let c = _counters.get(el);
  if (!c) { c = { shown: target, target }; _counters.set(el, c); el.textContent = formatter(target); }
  if (target > c.target + 0.5) {
    // "bump" cuando sube
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
  c.target = target;
  c.formatter = formatter;
}

export function update (dt) {
  pumpQueue(performance.now());
  // Contadores
  for (const [el, c] of _counters) {
    if (c.shown === c.target) continue;
    const diff = c.target - c.shown;
    // Converge rápido pero se ve rodar
    const step = Math.abs(diff) < 1 ? diff : diff * Math.min(1, dt * 9);
    c.shown += step;
    if (Math.abs(c.target - c.shown) < 0.5) c.shown = c.target;
    el.textContent = c.formatter(c.shown);
  }

  // Sacudida
  if (!_shakeEl) _shakeEl = document.getElementById('park-area');
  if (_shakeEl) {
    if (_shake > 0.2) {
      const x = (Math.random() - 0.5) * _shake;
      const y = (Math.random() - 0.5) * _shake;
      const r = (Math.random() - 0.5) * _shake * 0.08;
      _shakeEl.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
      _shake *= Math.pow(0.0009, dt); // decae en ~0.5s
    } else if (_shake !== 0) {
      _shake = 0;
      _shakeEl.style.transform = '';
    }
  }
}
