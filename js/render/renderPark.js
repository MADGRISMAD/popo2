// ============================================================
// render/renderPark.js — fondo del parque, decoración, caminos,
// platos, zona de crianza, etc. Coordina los demás renders.
// ============================================================

import { state } from '../gameState.js';
import { PARK } from '../config.js';
import { getDecorations } from '../systems/parkSystem.js';
import { renderDogs } from './renderDogs.js';
import { renderPoops } from './renderPoop.js';

let ctx = null;
let canvas = null;

export function initParkRender () {
  canvas = document.getElementById('park-canvas');
  ctx = canvas.getContext('2d');
}

export function render (dt) {
  if (!ctx) return;
  // El canvas tiene resolución lógica fija, sólo se reescala visualmente
  const w = canvas.width;
  const h = canvas.height;

  // Fondo: pasto con gradiente sutil
  const grad = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w);
  grad.addColorStop(0, '#4f7d2a');
  grad.addColorStop(1, '#2c5b1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Patrón sutil de pasto
  drawGrass(w, h);

  // Decoración estática
  const dec = getDecorations();

  // Caminos suaves
  ctx.strokeStyle = 'rgba(122, 94, 53, 0.85)';
  ctx.lineWidth = 28; ctx.lineCap = 'round';
  for (const p of dec.paths) {
    ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(165, 130, 75, 0.9)';
  ctx.lineWidth = 22;
  for (const p of dec.paths) {
    ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
  }

  // Flores
  for (const f of dec.flowers) {
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff5b8';
    ctx.beginPath(); ctx.arc(f.x, f.y, 1, 0, Math.PI*2); ctx.fill();
  }

  // Árboles
  for (const t of dec.trees) drawTree(t.x, t.y, t.r);

  // Zona de crianza
  if (state.park.breedingZone) drawBreedZone(state.park.breedingZone);

  // Platos
  for (const b of state.park.bowls) drawBowl(b);

  // Visitantes (debajo de perros y popó, son fondo)
  for (const v of state.park.visitors) drawVisitor(v);

  // Poops (debajo de perros)
  renderPoops(ctx);

  // Perros
  renderDogs(ctx, dt);
}

function drawVisitor (v) {
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 6 + v.id) * 1.5;
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(v.x, v.y + 18, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Cuerpo
  ctx.fillStyle = v.color;
  ctx.beginPath(); ctx.arc(v.x, v.y + bob, 8, 0, Math.PI * 2); ctx.fill();
  // Cabeza
  ctx.fillStyle = '#fde0c4';
  ctx.beginPath(); ctx.arc(v.x, v.y - 8 + bob, 5, 0, Math.PI * 2); ctx.fill();
  // Sparkle si feliz
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🎒', v.x + 8, v.y);
}

function drawGrass (w, h) {
  // Trama discreta para sensación de pasto
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#1a3712';
  for (let i = 0; i < 60; i++) {
    const x = (i * 173 + 50) % w;
    const y = (i * 91 + 30) % h;
    ctx.fillRect(x, y, 2, 4);
  }
  ctx.restore();
}

function drawTree (x, y, r) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 0.6, r * 1.1, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  // Tronco
  ctx.fillStyle = '#5a3b1d';
  ctx.fillRect(x - 4, y, 8, r * 0.7);
  // Copa
  const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.5, 4, x, y, r);
  grd.addColorStop(0, '#5fa030');
  grd.addColorStop(1, '#2a5a18');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function drawBreedZone (z) {
  ctx.save();
  // Halo
  const grd = ctx.createRadialGradient(z.x, z.y, 30, z.x, z.y, 90);
  grd.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
  grd.addColorStop(1, 'rgba(236, 72, 153, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(z.x - 90, z.y - 90, 180, 180);
  // Marco
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(z.x, z.y, 60, 0, Math.PI * 2); ctx.stroke();
  // Corazón central
  ctx.font = '40px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💗', z.x, z.y);
  ctx.restore();
}

function drawBowl (b) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(b.x + 4, b.y + 8, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Plato
  const grd = ctx.createLinearGradient(b.x - 26, b.y, b.x + 26, b.y + 12);
  grd.addColorStop(0, '#9aa1ac'); grd.addColorStop(1, '#5b6068');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Borde
  ctx.strokeStyle = '#2a2d33'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(b.x, b.y, 28, 10, 0, 0, Math.PI * 2); ctx.stroke();
  // Comida (si tiene)
  if (b.qty > 0) {
    ctx.fillStyle = bowlColor(b.type);
    const ratio = Math.min(1, b.qty / b.capacity);
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 1, 22 * ratio, 7 * ratio, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Etiqueta cantidad
  ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${b.qty}/${b.capacity}`, b.x, b.y - 18);
}

function bowlColor (type) {
  switch (type) {
    case 'lata': return '#c2410c';
    case 'snack': return '#a16207';
    case 'hueso': return '#fefce8';
    case 'premium': return '#dc2626';
    case 'banquete': return '#a855f7';
    case 'crianza': return '#ec4899';
    case 'genetico': return '#22d3ee';
    case 'mutante': return '#84cc16';
    case 'crecimiento': return '#16a34a';
    default: return '#a16207';
  }
}
