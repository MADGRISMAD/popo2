// ============================================================
// render/renderMenu.js — escenario animado del menú principal.
// Cielo, nubes, colinas de cartulina y perros de papel paseando
// (usan el mismo dibujo que el parque).
// ============================================================

import { drawDogFigure, shade } from './renderDogs.js';

let canvas = null;
let ctx = null;
let last = 0;
let running = false;

const BREEDS = [
  { breed: 'corgi',     rarity: 'comun'  },
  { breed: 'husky',     rarity: 'raro'   },
  { breed: 'pug',       rarity: 'comun'  },
  { breed: 'shiba',     rarity: 'epico'  },
  { breed: 'dalmata',   rarity: 'raro'   },
  { breed: 'aurodog',   rarity: 'legend' },
  { breed: 'poodle',    rarity: 'comun'  },
];
const dogs = [];
const clouds = [];

export function initMenuRender () {
  canvas = document.getElementById('menu-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  BREEDS.forEach((b, i) => {
    dogs.push({
      id: 100 + i, ...b, age: 'adult', state: 'walking', happiness: 90, hunger: 90,
      x: Math.random(), lane: i % 3, speed: 0.025 + Math.random() * 0.02,
      dir: Math.random() < 0.5 ? 1 : -1, flip: 1, pause: 0,
    });
  });
  for (let i = 0; i < 6; i++) clouds.push({ x: Math.random(), y: 0.05 + Math.random() * 0.25, s: 0.7 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.006 });
}

function resize () {
  if (!canvas) return;
  canvas.width  = canvas.clientWidth || 1920;
  canvas.height = canvas.clientHeight || 1080;
}

export function startMenuRender () {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
}
export function stopMenuRender () { running = false; }

function loop (ts) {
  if (!running) return;
  const dt = Math.min(0.1, (ts - last) / 1000);
  last = ts;
  update(dt);
  render(dt);
  requestAnimationFrame(loop);
}

function update (dt) {
  for (const d of dogs) {
    if (d.pause > 0) { d.pause -= dt; d.state = 'idle'; continue; }
    d.state = 'walking';
    d.x += d.dir * d.speed * dt;
    if (d.x > 1.05 || d.x < -0.05 || Math.random() < dt * 0.15) {
      d.dir *= -1;
      if (Math.random() < 0.5) d.pause = 1 + Math.random() * 2;
    }
    const sp = 8 * dt;
    if (d.flip < d.dir) d.flip = Math.min(d.dir, d.flip + sp);
    else if (d.flip > d.dir) d.flip = Math.max(d.dir, d.flip - sp);
  }
  for (const c of clouds) { c.x += c.v * dt; if (c.x > 1.2) c.x = -0.2; }
}

function render () {
  if (!ctx || !canvas) return;
  const t = performance.now() / 1000;
  const w = canvas.width, h = canvas.height;
  const horizon = h * 0.62;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#4fb8ff');
  sky.addColorStop(1, '#c9f0ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 4);

  // Nubes
  for (const c of clouds) drawCloud(c.x * w, c.y * h, c.s * (h / 900));

  // Colinas
  hill(horizon - h * 0.10, h * 0.12, w / 3.2, '#9fe07a', t * 0.0);
  hill(horizon - h * 0.04, h * 0.08, w / 4.5, '#7fd05c', 1.7);

  // Suelo a franjas
  const rows = 8;
  for (let i = 0; i < rows; i++) {
    const y0 = horizon + (h - horizon) * Math.pow(i / rows, 1.3);
    const y1 = horizon + (h - horizon) * Math.pow((i + 1) / rows, 1.3);
    ctx.fillStyle = i % 2 ? '#74c94c' : '#82d457';
    ctx.fillRect(0, y0, w, y1 - y0 + 1);
  }

  // Perros por carril
  const sorted = dogs.slice().sort((a, b) => a.lane - b.lane);
  for (const d of sorted) {
    const ly = horizon + (h - horizon) * (0.25 + d.lane * 0.25);
    const scale = (h / 900) * (1.6 + d.lane * 0.45);
    ctx.save();
    ctx.translate(d.x * w, ly);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(30,20,60,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    drawDogFigure(ctx, d, { t, flip: d.flip, walking: d.state === 'walking' });
    ctx.restore();
  }
}

function drawCloud (x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const blobs = [[-40, 6, 22], [-14, -8, 30], [18, -4, 26], [44, 8, 20], [0, 12, 26]];
  ctx.fillStyle = '#9fd6f2';
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by + 6, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffffff';
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function hill (baseY, amp, period, color, phase) {
  const w = canvas.width, bottom = canvas.height * 0.62 + 6;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, baseY - Math.abs(Math.sin(x / period + phase)) * amp);
    ctx.lineTo(w, bottom);
    ctx.closePath();
  };
  ctx.save(); ctx.translate(0, 8); path(); ctx.fillStyle = shade(color, 0.72); ctx.fill(); ctx.restore();
  path(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = color; ctx.fill();
}
