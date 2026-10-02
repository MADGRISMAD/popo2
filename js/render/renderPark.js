// ============================================================
// render/renderPark.js — el parque como escenario de Paper Mario.
// Fondo (cielo, sol, nubes, colinas de cartulina) y suelo en
// perspectiva se pre-renderizan una vez. Encima, todo lo que está
// "de pie" (árboles, platos, visitantes, popós, perros) se ordena
// por profundidad y se dibuja como recortes de papel con borde
// blanco y sombra en el suelo.
// ============================================================

import { state } from '../gameState.js';
import { PARK } from '../config.js';
import { getDecorations, pathY } from '../systems/parkSystem.js';
import { drawDogInPark, shade, mix } from './renderDogs.js';
import { drawPoopItem, renderCursorGround, renderCursorTop } from './renderPoop.js';
import { renderMysteryBox } from './renderHooks.js';
import { project, HORIZON } from './projection.js';

let ctx = null;
let canvas = null;
let _stage = null;     // fondo + suelo estático
const INK = '#2d2748';
const WHITE = '#ffffff';

const CLOUDS = [
  { x: 120, y: 60, s: 1.0, v: 6 },
  { x: 480, y: 38, s: 0.75, v: 4 },
  { x: 820, y: 80, s: 1.15, v: 7 },
  { x: 1020, y: 30, s: 0.6, v: 3 },
];

export function initParkRender () {
  canvas = document.getElementById('park-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  _stage = buildStage();
}

export function render (dt) {
  if (!ctx) return;
  const t = performance.now() / 1000;
  const now = performance.now();

  // Cielo + colinas + suelo (estático)
  ctx.drawImage(_stage, 0, 0);
  drawSun(t);
  drawClouds(t);

  // Cosas planas en el suelo
  if (state.park.breedingZone) drawBreedZone(state.park.breedingZone, t);
  renderCursorGround(ctx);

  // Todo lo que está de pie, por profundidad
  const items = [];
  for (const tr of getDecorations().trees) items.push([tr.y, 0, tr]);
  for (const b of state.park.bowls) items.push([b.y, 1, b]);
  for (const v of state.park.visitors) items.push([v.y, 2, v]);
  for (const p of state.park.poops) items.push([now < (p.bornAt || 0) ? PARK.H + 1 : p.y, 3, p]);
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (d) items.push([d.y, 4, d]);
  }
  items.sort((a, b) => a[0] - b[0]);
  for (const [, kind, o] of items) {
    if (kind === 0) drawTree(o, t);
    else if (kind === 1) drawBowl(o);
    else if (kind === 2) drawVisitor(o, t);
    else if (kind === 3) drawPoopItem(ctx, o, now);
    else drawDogInPark(ctx, o, dt);
  }

  // Caja misteriosa y anillo del combo encima de todo
  renderMysteryBox(ctx);
  renderCursorTop(ctx);
}

// =================================================================
// Fondo estático
// =================================================================
function buildStage () {
  const c = document.createElement('canvas');
  c.width = PARK.W; c.height = PARK.H;
  const g = c.getContext('2d');
  const W = PARK.W, H = PARK.H;

  // Cielo
  const sky = g.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#5cc4ff');
  sky.addColorStop(1, '#c9f0ff');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, HORIZON + 10);

  // Colinas lejanas (cartulina con canto)
  hills(g, HORIZON - 70, 70, 260, '#9fe07a', 0.0);
  hills(g, HORIZON - 40, 50, 190, '#7fd05c', 1.7);
  // Arbolitos lejanos tipo piruleta
  for (let i = 0; i < 16; i++) {
    const x = 30 + i * 68 + Math.sin(i * 7.3) * 18;
    const y = HORIZON - 22 - Math.abs(Math.sin(i * 2.1)) * 18;
    lollipopTree(g, x, y, 9 + (i % 3) * 3);
  }
  // Seto del fondo
  g.fillStyle = WHITE;
  bumps(g, HORIZON - 6, 22, 15, 3);
  g.fill();
  g.fillStyle = '#3fa64a';
  bumps(g, HORIZON - 6, 20, 13, 0);
  g.fill();
  g.fillStyle = '#56bf5a';
  bumps(g, HORIZON - 9, 20, 9, 0);
  g.fill();

  // Suelo: franjas de césped cortado en perspectiva
  const rows = 14;
  for (let i = 0; i < rows; i++) {
    const y0 = project(0, (i / rows) * H).y;
    const y1 = project(0, ((i + 1) / rows) * H).y;
    g.fillStyle = i % 2 ? '#74c94c' : '#82d457';
    g.fillRect(0, y0, W, y1 - y0 + 1);
  }
  // Brillo hacia el frente
  const front = g.createLinearGradient(0, HORIZON, 0, H);
  front.addColorStop(0, 'rgba(40,80,120,0.18)');
  front.addColorStop(0.5, 'rgba(255,255,255,0)');
  front.addColorStop(1, 'rgba(255,255,200,0.10)');
  g.fillStyle = front;
  g.fillRect(0, HORIZON, W, H - HORIZON);

  // Camino de tierra (borde blanco + canto + cara)
  pathStroke(g, 64, WHITE);
  pathStroke(g, 56, '#d49a55');
  pathStroke(g, 48, '#f1cf8f', -2);
  // Piedritas del camino
  for (let x = 20; x < W; x += 46) {
    const off = Math.sin(x * 0.37) * 14;
    const p = project(x, pathY(x) + off);
    g.fillStyle = '#e2b876';
    g.beginPath(); g.ellipse(p.x, p.y, 5 * p.s, 2.2 * p.s, 0, 0, Math.PI * 2); g.fill();
  }

  // Flores (pegatinas pequeñas planas)
  const flowers = getDecorations().flowers.slice().sort((a, b) => a.y - b.y);
  for (const f of flowers) {
    const p = project(f.x, f.y);
    const s = p.s * 1.1;
    g.save();
    g.translate(p.x, p.y);
    g.scale(s, s);
    g.strokeStyle = '#2f8f3a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -8); g.stroke();
    g.fillStyle = WHITE;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * 4, -9 + Math.sin(a) * 4, 4, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = f.color;
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * 4, -9 + Math.sin(a) * 4, 2.8, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffe14d';
    g.beginPath(); g.arc(0, -9, 2.2, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // Mechones de hierba
  for (let i = 0; i < 90; i++) {
    const wx = (i * 137.5) % W, wy = (i * 71.3) % H;
    if (Math.abs(wy - pathY(wx)) < 40) continue;
    const p = project(wx, wy);
    g.fillStyle = i % 2 ? '#5fb53e' : '#4fa636';
    g.beginPath();
    g.moveTo(p.x - 5 * p.s, p.y);
    g.lineTo(p.x - 2 * p.s, p.y - 9 * p.s);
    g.lineTo(p.x, p.y - 2 * p.s);
    g.lineTo(p.x + 3 * p.s, p.y - 11 * p.s);
    g.lineTo(p.x + 5 * p.s, p.y);
    g.closePath(); g.fill();
  }
  return c;
}

function hills (g, baseY, amp, period, color, phase) {
  const W = PARK.W;
  const path = () => {
    g.beginPath();
    g.moveTo(0, HORIZON + 10);
    for (let x = 0; x <= W; x += 8) {
      const y = baseY - Math.abs(Math.sin(x / period + phase)) * amp * 0.6 - Math.sin(x / (period * 0.37) + phase) * amp * 0.12;
      g.lineTo(x, y);
    }
    g.lineTo(W, HORIZON + 10);
    g.closePath();
  };
  // Canto (grosor de cartulina) desplazado
  g.save(); g.translate(0, 6); path(); g.fillStyle = shade(color, 0.72); g.fill(); g.restore();
  path();
  g.strokeStyle = WHITE; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = color; g.fill();
}

function lollipopTree (g, x, y, r) {
  g.fillStyle = WHITE;
  g.fillRect(x - 3, y - 2, 6, 20);
  g.beginPath(); g.arc(x, y - r, r + 2.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8b5a3c';
  g.fillRect(x - 1.5, y - 2, 3, 18);
  g.fillStyle = '#3fae55';
  g.beginPath(); g.arc(x, y - r, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.beginPath(); g.arc(x - r * 0.35, y - r * 1.35, r * 0.35, 0, Math.PI * 2); g.fill();
}

function bumps (g, baseY, r, step, grow) {
  g.beginPath();
  g.moveTo(0, baseY + 30);
  for (let x = -step; x <= PARK.W + step; x += step * 1.6) {
    g.moveTo(x + r + grow, baseY);
    g.arc(x, baseY, r + grow, 0, Math.PI * 2);
  }
  g.rect(0, baseY, PARK.W, 14);
}

function pathStroke (g, width, color, lift = 0) {
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = color;
  // Ancho variable según profundidad: segmentos cortos
  let prev = null;
  for (let x = -40; x <= PARK.W + 40; x += 10) {
    const p = project(x, pathY(x));
    if (prev) {
      g.lineWidth = width * p.s * 0.75;
      g.beginPath(); g.moveTo(prev.x, prev.y + lift); g.lineTo(p.x, p.y + lift); g.stroke();
    }
    prev = p;
  }
  g.restore();
}

// =================================================================
// Elementos animados
// =================================================================
function drawSun (t) {
  const x = PARK.W - 110, y = 70;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.15);
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.fillStyle = i % 2 ? '#ffd23f' : '#ffb627';
    ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(0, -60); ctx.lineTo(8, -40); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(x, y, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe680';
  ctx.beginPath(); ctx.arc(x - 9, y - 10, 13, 0, Math.PI * 2); ctx.fill();
  // carita
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(x - 10, y - 2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 10, y - 2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + 6, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,0.5)';
  ctx.beginPath(); ctx.ellipse(x - 20, y + 8, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 20, y + 8, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
}

function drawClouds (t) {
  for (const cl of CLOUDS) {
    const x = ((cl.x + t * cl.v) % (PARK.W + 240)) - 120;
    const y = cl.y + Math.sin(t * 0.6 + cl.x) * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(cl.s, cl.s);
    const blobs = [[-40, 6, 22], [-14, -8, 30], [18, -4, 26], [44, 8, 20], [0, 12, 26]];
    // canto/sombra
    ctx.fillStyle = '#9fd6f2';
    for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by + 6, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = WHITE;
    for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

// Árbol / arbusto de papel de pie con soporte de cartón
function drawTree (tr, t) {
  const p = project(tr.x, tr.y);
  const s = p.s * 1.15;
  const sway = Math.sin(t * 1.1 + tr.x * 0.01) * 0.025;
  ctx.save();
  ctx.translate(p.x, p.y);
  // sombra
  ctx.fillStyle = 'rgba(30,20,60,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 0, tr.r * 1.6 * s, tr.r * 0.38 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(s, s);
  ctx.rotate(sway);
  const r = tr.r;
  if (tr.kind === 'bush') {
    const blobs = [[-r * 0.8, -r * 0.55, r * 0.7], [r * 0.8, -r * 0.55, r * 0.7], [0, -r * 0.85, r * 0.9]];
    ctx.fillStyle = WHITE;
    for (const [x, y, rr] of blobs) { ctx.beginPath(); ctx.arc(x, y, rr + 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#2f9a45';
    for (const [x, y, rr] of blobs) { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#4cbd5c';
    for (const [x, y, rr] of blobs) { ctx.beginPath(); ctx.arc(x - rr * 0.15, y - rr * 0.2, rr * 0.75, 0, Math.PI * 2); ctx.fill(); }
    if (tr.fruit) berries(r);
  } else {
    const trunkH = r * 1.6;
    // borde blanco
    ctx.fillStyle = WHITE;
    roundRect(ctx, -r * 0.28 - 4, -trunkH - 4, r * 0.56 + 8, trunkH + 6, 6); ctx.fill();
    canopy(r, trunkH, 4.5, WHITE, WHITE);
    // tronco
    ctx.fillStyle = '#8b5a3c';
    roundRect(ctx, -r * 0.28, -trunkH, r * 0.56, trunkH, 5); ctx.fill();
    ctx.fillStyle = '#a8714c';
    roundRect(ctx, -r * 0.28, -trunkH, r * 0.2, trunkH, 4); ctx.fill();
    // copa
    canopy(r, trunkH, 0, '#2f9a45', '#4cbd5c');
    if (tr.fruit) berries(r, -trunkH - r * 0.6);
  }
  ctx.restore();
}

function canopy (r, trunkH, grow, dark, light) {
  const cy = -trunkH - r * 0.6;
  const blobs = [[-r * 0.75, cy + r * 0.25, r * 0.75], [r * 0.75, cy + r * 0.25, r * 0.75], [0, cy - r * 0.35, r * 0.95]];
  ctx.fillStyle = dark;
  for (const [x, y, rr] of blobs) { ctx.beginPath(); ctx.arc(x, y, rr + grow, 0, Math.PI * 2); ctx.fill(); }
  if (grow) return;
  ctx.fillStyle = light;
  for (const [x, y, rr] of blobs) { ctx.beginPath(); ctx.arc(x - rr * 0.12, y - rr * 0.18, rr * 0.78, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.ellipse(-r * 0.3, cy - r * 0.7, r * 0.35, r * 0.18, -0.4, 0, Math.PI * 2); ctx.fill();
}

function berries (r, cy = -r * 0.7) {
  const pts = [[-0.6, 0.1], [0.5, -0.2], [0.1, 0.4], [-0.2, -0.5], [0.7, 0.35]];
  for (const [u, v] of pts) {
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(u * r, cy + v * r, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4f6d'; ctx.beginPath(); ctx.arc(u * r, cy + v * r, 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawBreedZone (z, t) {
  const p = project(z.x, z.y);
  const s = p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Alfombra rosa plana con borde blanco
  ctx.fillStyle = 'rgba(30,20,60,0.22)';
  ctx.beginPath(); ctx.ellipse(4, 6, 92 * s, 30 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.ellipse(0, 0, 92 * s, 30 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath(); ctx.ellipse(0, 0, 86 * s, 26 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff9ec0';
  ctx.beginPath(); ctx.ellipse(0, -2 * s, 64 * s, 17 * s, 0, 0, Math.PI * 2); ctx.fill();
  // Corazones flotando
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.6 + i / 3) % 1);
    const hx = Math.sin((t + i) * 1.7) * 30 * s + (i - 1) * 34 * s;
    const hy = -k * 70 * s - 10;
    ctx.globalAlpha = 1 - k;
    heart(hx, hy, 9 * s);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function heart (x, y, s) {
  const path = (g) => {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x, y - s * 0.2, x - s * 1.1, y - s * 0.2, x - s * 1.05, y + s * 0.4);
    ctx.bezierCurveTo(x - s, y + s * 0.85, x - s * 0.2, y + s * 1.05, x, y + s * 1.35);
    ctx.bezierCurveTo(x + s * 0.2, y + s * 1.05, x + s, y + s * 0.85, x + s * 1.05, y + s * 0.4);
    ctx.bezierCurveTo(x + s * 1.1, y - s * 0.2, x, y - s * 0.2, x, y + s * 0.35);
    ctx.closePath();
  };
  path();
  ctx.strokeStyle = WHITE; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#ff4f86'; ctx.fill();
}

// Plato de comida de perfil
function drawBowl (b) {
  const p = project(b.x, b.y);
  const s = p.s * 1.25;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(30,20,60,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 0, 30 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(s, s);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-24, -14); ctx.lineTo(24, -14);
    ctx.lineTo(18, 0); ctx.quadraticCurveTo(0, 3, -18, 0);
    ctx.closePath();
  };
  // borde blanco
  body(); ctx.strokeStyle = WHITE; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(0, -14, 27, 7, 0, 0, Math.PI * 2); ctx.fill();
  // cuerpo rojo con franja
  body(); ctx.fillStyle = '#e63e5c'; ctx.fill();
  ctx.fillStyle = '#ff6f87';
  ctx.fillRect(-21, -10, 42, 3);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, -6, 3.2, 0, Math.PI * 2); ctx.fill(); // huellita
  ctx.beginPath(); ctx.arc(-4, -10, 1.4, 0, Math.PI * 2); ctx.arc(0, -11, 1.4, 0, Math.PI * 2); ctx.arc(4, -10, 1.4, 0, Math.PI * 2); ctx.fill();
  // borde superior
  ctx.fillStyle = '#b52a46';
  ctx.beginPath(); ctx.ellipse(0, -14, 24, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  // comida
  if (b.qty > 0) {
    const ratio = Math.min(1, b.qty / b.capacity);
    const fc = bowlColor(b.type);
    ctx.fillStyle = fc.color;
    ctx.beginPath(); ctx.ellipse(0, -15, 21, 4 + ratio * 4, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = fc.spot;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-12 + i * 6, -16 - ratio * 3 + (i % 2) * 2, 2, 0, Math.PI * 2); ctx.fill(); }
  }
  // etiqueta
  const label = `${b.qty}/${b.capacity}`;
  ctx.font = '900 11px "Arial Rounded MT Bold", Trebuchet MS, sans-serif';
  const w = ctx.measureText(label).width + 12;
  ctx.fillStyle = WHITE;
  roundRect(ctx, -w / 2, -42, w, 18, 9); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = b.qty / b.capacity < 0.25 ? '#e63e5c' : INK;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, -33);
  ctx.restore();
}

function bowlColor (type) {
  const map = {
    croquetas:   { color: '#c98f4a', spot: '#8a5a24' },
    lata:        { color: '#ef6c1a', spot: '#9a3a02' },
    snack:       { color: '#e0b440', spot: '#8a6a10' },
    hueso:       { color: '#fefce8', spot: '#c8c2a8' },
    premium:     { color: '#e63e3e', spot: '#7a1010' },
    banquete:    { color: '#b06bff', spot: '#5a2a8a' },
    crianza:     { color: '#ff7aa8', spot: '#a02a5a' },
    genetico:    { color: '#30d8f0', spot: '#0e7a8a' },
    mutante:     { color: '#94dc26', spot: '#3a6a05' },
    crecimiento: { color: '#2ec05a', spot: '#085a2a' },
  };
  return map[type] || map.croquetas;
}

// Visitante de papel (muñequito redondo con gorro)
function drawVisitor (v, t) {
  const p = project(v.x, v.y);
  const s = p.s * 1.3;
  const hop = Math.abs(Math.sin(t * 7 + v.id)) * 3;
  const face = v.vx >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(30,20,60,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 3.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.scale(s * face, s);
  ctx.translate(0, -hop);
  for (const pass of [0, 1]) {
    const W = pass === 0;
    const g = W ? 3 : 0;
    // piernas
    ctx.fillStyle = W ? WHITE : '#3b3f8f';
    roundRect(ctx, -6 - g, -12 - g, 5 + g * 2, 12 + g * 2, 2.5); ctx.fill();
    roundRect(ctx, 1 - g, -12 - g, 5 + g * 2, 12 + g * 2, 2.5); ctx.fill();
    // cuerpo
    ctx.fillStyle = W ? WHITE : v.color;
    roundRect(ctx, -9 - g, -30 - g, 18 + g * 2, 20 + g * 2, 7); ctx.fill();
    // cabeza
    ctx.fillStyle = W ? WHITE : '#ffd9b8';
    ctx.beginPath(); ctx.arc(1, -40, 10 + g, 0, Math.PI * 2); ctx.fill();
    // gorro
    ctx.fillStyle = W ? WHITE : shade(v.color, 0.8);
    ctx.beginPath(); ctx.ellipse(1, -47, 11 + g, 5 + g, 0, Math.PI, 0); ctx.fill();
    if (!W) { ctx.fillRect(1, -47, 13, 3); }
  }
  // cara
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(5, -40, 1.4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,150,0.5)';
  ctx.beginPath(); ctx.ellipse(3, -36, 2.4, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function roundRect (c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
