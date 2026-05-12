// ============================================================
// render/renderPark.js — diorama de papel recortado.
// Capas: pasto → caminos → flores → árboles → objetos → bowls →
//        zonas (crianza) → visitantes → popó → perros.
// Cada elemento se dibuja como pieza de papel con sombra desplazada.
// ============================================================

import { state } from '../gameState.js';
import { PARK } from '../config.js';
import { getDecorations } from '../systems/parkSystem.js';
import { renderDogs } from './renderDogs.js';
import { renderPoops } from './renderPoop.js';
import { grassTexture, pathTexture } from './paperTexture.js';

let ctx = null;
let canvas = null;
let _grassTex = null;
let _pathTex = null;

export function initParkRender () {
  canvas = document.getElementById('park-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  // Cache de texturas
  _grassTex = grassTexture(PARK.W, PARK.H);
  _pathTex  = pathTexture(220, 60);
}

export function render (dt) {
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const t = performance.now() / 1000;

  // ====== CAPA 0: pasto base con textura papel ====================
  ctx.drawImage(_grassTex, 0, 0, w, h);

  // Vignette interior
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // ====== CAPA 1: caminos de cartulina ============================
  const dec = getDecorations();
  drawPapercutPaths(dec.paths);

  // ====== CAPA 2: flores ==========================================
  for (const f of dec.flowers) drawFlower(f, t);

  // ====== CAPA 3: cercas decorativas ==============================
  drawFence();

  // ====== CAPA 4: árboles =========================================
  // Orden por Y para profundidad
  const trees = dec.trees.slice().sort((a, b) => a.y - b.y);
  for (const tr of trees) drawTree(tr, t);

  // ====== CAPA 5: zona de crianza =================================
  if (state.park.breedingZone) drawBreedZone(state.park.breedingZone, t);

  // ====== CAPA 6: platos ==========================================
  for (const b of state.park.bowls) drawBowl(b);

  // ====== CAPA 7: visitantes ======================================
  for (const v of state.park.visitors) drawVisitor(v, t);

  // ====== CAPA 8: popós ===========================================
  renderPoops(ctx);

  // ====== CAPA 9: perros (orden por Y) ============================
  renderDogs(ctx, dt);
}

// ---------------- helpers ----------------------------------------

function drawPapercutPaths (paths) {
  // Bordes oscuros + pieza de papel encima → look recortado
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const p of paths) {
    // Sombra suave
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 38;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1 + 4);
    ctx.bezierCurveTo(
      p.x1 + (p.x2 - p.x1) * 0.3, p.y1 + (p.y2 - p.y1) * 0.4 + 4,
      p.x1 + (p.x2 - p.x1) * 0.7, p.y1 + (p.y2 - p.y1) * 0.6 + 4,
      p.x2, p.y2 + 4
    );
    ctx.stroke();

    // Borde marrón oscuro (pestaña inferior del papel)
    ctx.strokeStyle = '#a47c3f';
    ctx.lineWidth = 36;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.bezierCurveTo(
      p.x1 + (p.x2 - p.x1) * 0.3, p.y1 + (p.y2 - p.y1) * 0.4,
      p.x1 + (p.x2 - p.x1) * 0.7, p.y1 + (p.y2 - p.y1) * 0.6,
      p.x2, p.y2
    );
    ctx.stroke();

    // Cara superior del papel
    ctx.strokeStyle = '#e6c386';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1 - 1);
    ctx.bezierCurveTo(
      p.x1 + (p.x2 - p.x1) * 0.3, p.y1 + (p.y2 - p.y1) * 0.4 - 1,
      p.x1 + (p.x2 - p.x1) * 0.7, p.y1 + (p.y2 - p.y1) * 0.6 - 1,
      p.x2, p.y2 - 1
    );
    ctx.stroke();
  }
}

function drawFlower (f, t) {
  const sway = Math.sin(t * 1.4 + f.x * 0.05) * 0.6;
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(sway * 0.06);

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(2, 4, 6, 2.4, 0, 0, Math.PI * 2); ctx.fill();

  // Tallo
  ctx.strokeStyle = '#3f6a18';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -10);
  ctx.stroke();

  // Pétalos (5 círculos)
  const c = f.color;
  ctx.fillStyle = c;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const px = Math.cos(a) * 4;
    const py = -10 + Math.sin(a) * 4;
    ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2); ctx.fill();
  }
  // Centro amarillo
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath(); ctx.arc(0, -10, 2.2, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawFence () {
  // Cerca decorativa en parte inferior estilo papel
  const baseY = PARK.H - 18;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, baseY + 4, PARK.W, 6);
  ctx.fillStyle = '#e6c386';
  for (let x = 12; x < PARK.W; x += 26) {
    ctx.fillRect(x, baseY - 12, 6, 22);
    ctx.fillStyle = '#a47c3f';
    ctx.fillRect(x, baseY + 8, 6, 2);
    ctx.fillStyle = '#e6c386';
  }
  // Travesaño horizontal
  ctx.fillStyle = '#a47c3f';
  ctx.fillRect(0, baseY - 4, PARK.W, 4);
  ctx.fillStyle = '#e6c386';
  ctx.fillRect(0, baseY - 5, PARK.W, 2);
}

function drawTree (tr, t) {
  const sway = Math.sin(t * 0.8 + tr.x * 0.01) * 2;
  const x = tr.x + sway;
  const y = tr.y;
  const r = tr.r;

  // Sombra elíptica grande
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.55, r * 1.15, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();

  // Tronco
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(x - 4, y, 8, r * 0.7);
  ctx.fillStyle = '#3a230f';
  ctx.fillRect(x - 4, y + r * 0.7, 8, 3);

  // Copa: 3 círculos overlapping (recortado)
  // Sombra inferior interna
  drawPapercutCircle(x - r * 0.55, y - r * 0.10, r * 0.65, '#2c5a18', '#3a6a20');
  drawPapercutCircle(x + r * 0.55, y - r * 0.10, r * 0.65, '#2c5a18', '#3a6a20');
  drawPapercutCircle(x,            y - r * 0.55, r * 0.85, '#2c5a18', '#5fa030');

  // Pequeñas frutas/flores en algunos
  if ((tr.r | 0) % 3 === 0) {
    ctx.fillStyle = '#ec5985';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * r, y - r * 0.3 + (Math.random() - 0.5) * r, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPapercutCircle (x, y, r, dark, light) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2); ctx.fill();
  // Pieza oscura (borde papel grueso)
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.arc(x, y + 2, r, 0, Math.PI * 2); ctx.fill();
  // Cara superior
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.arc(x, y, r * 0.9, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.4, r * 0.45, 0, Math.PI * 2); ctx.fill();
}

function drawBreedZone (z, t) {
  ctx.save();
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(z.x + 4, z.y + 8, 70, 22, 0, 0, Math.PI * 2); ctx.fill();

  // Cojín de papel rosa
  ctx.fillStyle = '#c43d6e';
  ctx.beginPath(); ctx.ellipse(z.x, z.y + 4, 70, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff7a9d';
  ctx.beginPath(); ctx.ellipse(z.x, z.y, 64, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(z.x - 18, z.y - 5, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Aura suave
  const pulse = 0.6 + Math.sin(t * 2.5) * 0.20;
  const grd = ctx.createRadialGradient(z.x, z.y, 30, z.x, z.y, 90);
  grd.addColorStop(0, `rgba(236, 89, 133, ${0.45 * pulse})`);
  grd.addColorStop(1, 'rgba(236, 89, 133, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(z.x - 90, z.y - 90, 180, 180);

  // Corazones flotantes
  for (let i = 0; i < 3; i++) {
    const offY = ((t * 30 + i * 30) % 60) - 30;
    const a = 1 - Math.abs(offY / 30);
    drawHeart(z.x + Math.sin((t + i) * 1.5) * 18, z.y - 30 - offY, 10, '#ff6b9b', a);
  }

  ctx.restore();
}

function drawHeart (x, y, s, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s, x, y + s * 1.2);
  ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.7, x + s, y + s * 0.3);
  ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawBowl (b) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 10, 30, 9, 0, 0, Math.PI * 2); ctx.fill();

  // Plato (capa exterior, cartón)
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 30, 11, 0, 0, Math.PI * 2); ctx.fill();
  // Plato (cara superior, brillante)
  const grd = ctx.createLinearGradient(b.x - 28, b.y, b.x + 28, b.y + 12);
  grd.addColorStop(0, '#f0e6d3');
  grd.addColorStop(1, '#a8a29a');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(b.x - 8, b.y - 4, 10, 2, 0, 0, Math.PI * 2); ctx.fill();

  // Comida
  if (b.qty > 0) {
    const ratio = Math.min(1, b.qty / b.capacity);
    const fc = bowlColor(b.type);
    ctx.fillStyle = fc.shadow;
    ctx.beginPath(); ctx.ellipse(b.x, b.y, 22 * ratio, 7 * ratio, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fc.color;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 1, 20 * ratio, 6 * ratio, 0, 0, Math.PI * 2); ctx.fill();
    // Bolitas/textura
    ctx.fillStyle = fc.spot;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(b.x + (Math.random() - 0.5) * 20 * ratio, b.y + (Math.random() - 0.5) * 5 * ratio, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Etiqueta cantidad (sticker)
  ctx.save();
  ctx.translate(b.x, b.y - 22);
  ctx.rotate(-0.06);
  ctx.fillStyle = '#fff6dd';
  ctx.strokeStyle = '#a47c3f';
  ctx.lineWidth = 1.5;
  const label = `${b.qty}/${b.capacity}`;
  ctx.font = 'bold 12px Trebuchet MS';
  const w = ctx.measureText(label).width + 10;
  roundRect(ctx, -w / 2, -10, w, 18, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4b2a10';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function bowlColor (type) {
  const map = {
    croquetas:    { color: '#c19a5a', shadow: '#7a5a2a', spot: '#5b3a1c' },
    lata:         { color: '#ef6c1a', shadow: '#9a3a02', spot: '#5e2300' },
    snack:        { color: '#bf952b', shadow: '#7a5e15', spot: '#3e2f00' },
    hueso:        { color: '#fefce8', shadow: '#c8c2a8', spot: '#9a9070' },
    premium:      { color: '#dc2626', shadow: '#7a1010', spot: '#3a0606' },
    banquete:     { color: '#a855f7', shadow: '#5a2a8a', spot: '#2a0e44' },
    crianza:      { color: '#ec5985', shadow: '#8a2a4a', spot: '#4a0e22' },
    genetico:     { color: '#22d3ee', shadow: '#0e7a8a', spot: '#003a44' },
    mutante:      { color: '#84cc16', shadow: '#3a6a05', spot: '#1a3300' },
    crecimiento:  { color: '#16a34a', shadow: '#085a2a', spot: '#022a10' },
  };
  return map[type] || map.croquetas;
}

function drawVisitor (v, t) {
  const bob = Math.sin(t * 5 + v.id) * 2.5;
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(v.x, v.y + 22, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Cuerpo (camiseta colorida)
  ctx.fillStyle = v.color;
  roundRect(ctx, v.x - 8, v.y - 4 + bob, 16, 18, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Brazo
  ctx.fillStyle = '#fde0c4';
  ctx.beginPath(); ctx.arc(v.x - 9, v.y + 8 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(v.x + 9, v.y + 8 + bob, 2.5, 0, Math.PI * 2); ctx.fill();
  // Cabeza
  ctx.fillStyle = '#fde0c4';
  ctx.beginPath(); ctx.arc(v.x, v.y - 12 + bob, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
  // Cara
  ctx.fillStyle = '#3a2410';
  ctx.beginPath(); ctx.arc(v.x - 2.5, v.y - 12 + bob, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(v.x + 2.5, v.y - 12 + bob, 1, 0, Math.PI * 2); ctx.fill();
  // Sonrisa
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(v.x, v.y - 9 + bob, 2, 0, Math.PI); ctx.stroke();
  // Mochila / corazón sobre la cabeza
  drawHeart(v.x + 11, v.y - 18 + bob, 4, '#ec5985', 0.8);
}

function roundRect (c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
