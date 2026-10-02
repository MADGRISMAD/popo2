// ============================================================
// inputManager.js — mouse, click, hover, teclas, escalado de viewport.
// Convierte coordenadas de pantalla a coordenadas del canvas del parque.
// ============================================================

import { VIEWPORT, GAME } from './config.js';
import { state } from './gameState.js';
import { unlockAudio } from './audioManager.js';
import { unproject } from './render/projection.js';

const listeners = {
  parkMove: new Set(),
  parkClick: new Set(),
  key: new Set(),
};

let canvas = null;
let canvasRect = null;
let _scale = 1;
let _offsetX = 0;
let _offsetY = 0;

export function initInput () {
  canvas = document.getElementById('park-canvas');
  fitViewport();
  window.addEventListener('resize', fitViewport);
  if (canvas) {
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  handleTouchMove,  { passive: false });
  }
  window.addEventListener('keydown', handleKey);
  window.addEventListener('pointerdown', () => unlockAudio(), { once: true });
}

export function fitViewport () {
  const wrap = document.getElementById('viewport-wrap');
  const vp = document.getElementById('viewport');
  if (!wrap || !vp) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  const scaleX = w / VIEWPORT.W;
  const scaleY = h / VIEWPORT.H;
  const s = Math.min(scaleX, scaleY);
  const left = (w - VIEWPORT.W * s) / 2;
  const top  = (h - VIEWPORT.H * s) / 2;
  vp.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
  // Recalcular rect al canvas
  if (canvas) canvasRect = canvas.getBoundingClientRect();
}

function refreshRect () {
  if (canvas) canvasRect = canvas.getBoundingClientRect();
}

function toCanvas (clientX, clientY) {
  if (!canvas) return { x: 0, y: 0 };
  if (!canvasRect) refreshRect();
  const sx = (clientX - canvasRect.left) * (canvas.width  / canvasRect.width);
  const sy = (clientY - canvasRect.top)  * (canvas.height / canvasRect.height);
  // x,y = mundo (lógica del juego) · sx,sy = pantalla del canvas (hit-tests visuales)
  const w = unproject(sx, sy);
  return { x: w.x, y: w.y, sx, sy };
}

function handleMove (e) {
  refreshRect();
  const p = toCanvas(e.clientX, e.clientY);
  listeners.parkMove.forEach(cb => cb(p, e));
}
function handleClick (e) {
  refreshRect();
  const p = toCanvas(e.clientX, e.clientY);
  listeners.parkClick.forEach(cb => cb(p, e));
}
function handleLeave () {
  listeners.parkMove.forEach(cb => cb(null));
}
function handleTouchStart (e) {
  if (e.touches.length === 0) return;
  e.preventDefault();
  refreshRect();
  const t = e.touches[0];
  const p = toCanvas(t.clientX, t.clientY);
  listeners.parkClick.forEach(cb => cb(p, e));
  listeners.parkMove.forEach(cb => cb(p, e));
}
function handleTouchMove (e) {
  if (e.touches.length === 0) return;
  e.preventDefault();
  refreshRect();
  const t = e.touches[0];
  const p = toCanvas(t.clientX, t.clientY);
  listeners.parkMove.forEach(cb => cb(p, e));
}
function handleKey (e) {
  listeners.key.forEach(cb => cb(e));
}

export function onParkMove  (cb) { listeners.parkMove.add(cb);  return () => listeners.parkMove.delete(cb); }
export function onParkClick (cb) { listeners.parkClick.add(cb); return () => listeners.parkClick.delete(cb); }
export function onKey       (cb) { listeners.key.add(cb);       return () => listeners.key.delete(cb); }
