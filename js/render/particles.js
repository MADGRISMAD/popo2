// ============================================================
// render/particles.js — sistema central de partículas en Canvas.
// Pool reutilizable, baja huella, soporte para reduce-motion y
// niveles de calidad gráfica.
// ============================================================

import { state } from '../gameState.js';
import { PARK } from '../config.js';
import { project } from './projection.js';

let canvas = null;
let ctx = null;
const pool = [];           // partículas vivas
const MAX_PARTICLES = 250; // tope absoluto

export function initParticles () {
  canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize () {
  if (!canvas) return;
  // Mismo tamaño lógico del park-canvas
  canvas.width  = PARK.W;
  canvas.height = PARK.H;
}

function densityCap () {
  const opt = state.options?.graphicsQuality ?? 'media';
  const baseDensity = state.options?.particleDensity ?? 1;
  const qmul = opt === 'baja' ? 0.35 : opt === 'alta' ? 1.5 : 1;
  return Math.max(0.15, baseDensity * qmul);
}

// ---------------- spawn helpers --------------------------------
export function burst (x, y, opts = {}) {
  const {
    count    = 14,
    color    = '#ffe27a',
    speed    = 120,
    spread   = Math.PI * 2,
    angle    = -Math.PI / 2,
    life     = 0.7,
    size     = 4,
    gravity  = 380,
    friction = 0.92,
    shape    = 'circle',     // circle | star | square | sticker
    glow     = false,
  } = opts;
  const n = Math.max(1, Math.floor(count * densityCap()));
  for (let i = 0; i < n && pool.length < MAX_PARTICLES; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.5 + Math.random() * 1.0);
    pool.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: life * (0.7 + Math.random() * 0.6),
      maxLife: life,
      color, size: size * (0.6 + Math.random() * 0.8),
      gravity, friction, shape, glow,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 6,
      birth: performance.now(),
    });
  }
}

export function confetti (x, y, count = 40) {
  const colors = ['#ec5985', '#f59e0b', '#5fc66f', '#4d8fff', '#a64dff', '#ec59c2', '#ffe27a'];
  for (let i = 0; i < count * densityCap() && pool.length < MAX_PARTICLES; i++) {
    pool.push({
      x, y,
      vx: (Math.random() - 0.5) * 280,
      vy: -Math.random() * 320 - 80,
      life: 1.6 + Math.random() * 0.8,
      maxLife: 2.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      gravity: 520, friction: 0.985,
      shape: 'square',
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 9,
      birth: performance.now(),
    });
  }
}

export function sparkle (x, y, color = '#ffffff', count = 6) {
  for (let i = 0; i < count * densityCap() && pool.length < MAX_PARTICLES; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 50 + Math.random() * 80;
    pool.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color, size: 2 + Math.random() * 2,
      gravity: -40, friction: 0.92,
      shape: 'star', glow: true,
      rot: 0, vrot: 0,
      birth: performance.now(),
    });
  }
}

export function trail (x, y, color = '#fff') {
  if (Math.random() > densityCap()) return;
  pool.push({
    x, y, vx: 0, vy: 0,
    life: 0.32, maxLife: 0.32,
    color, size: 5,
    gravity: 0, friction: 1,
    shape: 'circle', glow: true,
    rot: 0, vrot: 0,
    birth: performance.now(),
  });
}

export function feverFloat () {
  // Partículas suaves que flotan hacia arriba durante la fiebre
  if (!state.fever?.active) return;
  if (Math.random() > 0.25 * densityCap()) return;
  pool.push({
    x: Math.random() * PARK.W,
    y: PARK.H + 10,
    vx: (Math.random() - 0.5) * 14,
    vy: -25 - Math.random() * 30,
    life: 3.0, maxLife: 3.0,
    color: ['#ffe27a', '#ec5985', '#a64dff'][Math.floor(Math.random() * 3)],
    size: 4 + Math.random() * 4,
    gravity: -10, friction: 1,
    shape: 'star', glow: true,
    rot: 0, vrot: (Math.random() - 0.5) * 2,
    birth: performance.now(),
  });
}

// ---------------- update / render ------------------------------
export function update (dt) {
  feverFloat();
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.life -= dt;
    if (p.life <= 0) { pool.splice(i, 1); continue; }
    p.vy += p.gravity * dt;
    p.vx *= Math.pow(p.friction, dt * 60);
    p.vy *= Math.pow(p.friction, dt * 60);
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.rot += p.vrot * dt;
  }
}

export function renderParticles () {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of pool) {
    const k = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = k;
    if (p.glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 10;
    }
    ctx.fillStyle = p.color;
    // Las partículas viven en coords de mundo: se proyectan al escenario
    const pr = project(p.x, p.y);
    ctx.translate(pr.x, pr.y - 12 * pr.s);
    ctx.scale(pr.s * 1.2, pr.s * 1.2);
    ctx.rotate(p.rot);
    if (p.shape === 'square') {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
    } else if (p.shape === 'star') {
      drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawStar (c, cx, cy, spikes, outer, inner) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  c.beginPath();
  c.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outer;
    let y = cy + Math.sin(rot) * outer;
    c.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * inner;
    y = cy + Math.sin(rot) * inner;
    c.lineTo(x, y);
    rot += step;
  }
  c.lineTo(cx, cy - outer);
  c.closePath();
}
