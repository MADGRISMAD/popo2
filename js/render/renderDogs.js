// ============================================================
// render/renderDogs.js — perros dibujados con primitivas en canvas:
// cuerpo, cabeza, orejas, cola, patas, manchas, animaciones.
// Sin emojis para perros activos (sí emojis secundarios para iconos).
// ============================================================

import { state } from '../gameState.js';
import { BREEDS_BY_ID, RARITIES_BY_ID } from '../data/dogs.js';

export function renderDogs (ctx, dt) {
  const t = performance.now() / 1000;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (!d) continue;
    drawDog(ctx, d, t);
  }
}

function drawDog (ctx, d, t) {
  const breed = BREEDS_BY_ID[d.breed] || BREEDS_BY_ID.callejero;
  const body = d._customBody || breed.body;
  const spot = d._customSpot ?? breed.spot;
  const rarity = RARITIES_BY_ID[d.rarity];

  const moving = d.state === 'walking';
  const fighting = d.state === 'fighting';
  const resting = d.state === 'resting' || d.state === 'pregnant';
  const sizeMul = d.age === 'baby' ? 0.55 : d.age === 'young' ? 0.80 : d.age === 'veteran' ? 0.95 : 1.0;
  const w = 36 * sizeMul, h = 22 * sizeMul;

  // bobbing al caminar
  const bob = moving ? Math.sin(t * 8 + d.id) * 1.6 : 0;
  const fightShake = fighting ? Math.sin(t * 30) * 2 : 0;
  const x = d.x + fightShake;
  const y = d.y + bob;

  ctx.save();

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(x, y + h * 0.55, w * 0.55, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();

  // Halo de rareza
  if (['legend','mitico','cosmico'].includes(d.rarity)) {
    ctx.save();
    const c = d.rarity === 'cosmico' ? '#ec4899' : d.rarity === 'mitico' ? '#ef4444' : '#fbbf24';
    const grd = ctx.createRadialGradient(x, y, w * 0.2, x, y, w * 1.4);
    grd.addColorStop(0, c + '88');
    grd.addColorStop(1, c + '00');
    ctx.fillStyle = grd;
    ctx.fillRect(x - w * 1.4, y - w * 1.4, w * 2.8, w * 2.8);
    ctx.restore();
  }

  // Patas (con animación)
  const legY = y + h * 0.3;
  const legSwing = moving ? Math.sin(t * 9 + d.id) * 3 : 0;
  ctx.fillStyle = darken(body, 0.85);
  drawLeg(ctx, x - w * 0.35, legY,  legSwing,  w * 0.10, h * 0.55);
  drawLeg(ctx, x + w * 0.35, legY, -legSwing,  w * 0.10, h * 0.55);
  drawLeg(ctx, x - w * 0.10, legY, -legSwing,  w * 0.10, h * 0.55);
  drawLeg(ctx, x + w * 0.10, legY,  legSwing,  w * 0.10, h * 0.55);

  // Cuerpo
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(x, y, w * 0.55, h * 0.55, 0, 0, Math.PI * 2); ctx.fill();

  // Manchas
  if (spot) {
    ctx.fillStyle = spot;
    ctx.beginPath(); ctx.ellipse(x - w * 0.2, y - h * 0.05, w * 0.18, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + w * 0.18, y + h * 0.10, w * 0.14, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Cola
  const tailWag = moving || d.happiness > 60 ? Math.sin(t * 12 + d.id) * 0.6 : 0;
  ctx.strokeStyle = body; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y - h * 0.05);
  ctx.quadraticCurveTo(x - w * 0.7, y - h * 0.5 + tailWag * 6, x - w * 0.85, y - h * 0.7 + tailWag * 8);
  ctx.stroke();

  // Cabeza
  const headX = x + w * 0.45;
  const headY = y - h * 0.10;
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(headX, headY, w * 0.32, h * 0.46, 0, 0, Math.PI * 2); ctx.fill();

  // Orejas (varían por raza simple)
  ctx.fillStyle = darken(body, 0.85);
  ctx.beginPath();
  ctx.moveTo(headX - w * 0.10, headY - h * 0.40);
  ctx.lineTo(headX - w * 0.20, headY - h * 0.05);
  ctx.lineTo(headX,            headY - h * 0.20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + w * 0.18, headY - h * 0.40);
  ctx.lineTo(headX + w * 0.30, headY - h * 0.05);
  ctx.lineTo(headX + w * 0.05, headY - h * 0.20);
  ctx.fill();

  // Hocico
  ctx.fillStyle = darken(body, 1.05);
  ctx.beginPath(); ctx.ellipse(headX + w * 0.18, headY + h * 0.12, w * 0.13, h * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(headX + w * 0.30, headY + h * 0.05, 2, 0, Math.PI * 2); ctx.fill();
  // Ojo
  ctx.fillStyle = '#101010';
  ctx.beginPath(); ctx.arc(headX + w * 0.05, headY - h * 0.05, 1.7, 0, Math.PI * 2); ctx.fill();

  // Indicador estado / sexo
  if (d.state === 'pregnant') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 20, y - h * 0.95 - 8, 40, 7);
    const ratio = 1 - Math.max(0, (d.pregnancyUntil - performance.now())) / Math.max(1, d.pregnancyTotal);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(x - 19, y - h * 0.95 - 7, 38 * ratio, 5);
  }
  if (d.state === 'fighting') drawIcon(ctx, '👊', x, y - h * 0.9);
  if (d.state === 'resting')  drawIcon(ctx, '💤', x, y - h * 0.9);
  if (d.hunger < 20 && d.state !== 'pregnant') drawIcon(ctx, '🍖', x + w * 0.6, y - h * 0.6);

  // Etiqueta de rareza
  if (['legend','mitico','cosmico'].includes(d.rarity)) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(rarity.name, x, y + h * 0.85);
  }

  ctx.restore();
}

function drawIcon (ctx, em, x, y) {
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(em, x, y);
}

function drawLeg (ctx, x, y, swing, w, h) {
  ctx.beginPath();
  ctx.fillRect(x - w / 2, y, w, h * 0.8 + swing);
}

function darken (hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  if (factor < 1) { r = Math.floor(r * factor); g = Math.floor(g * factor); b = Math.floor(b * factor); }
  else            { r = Math.min(255, Math.floor(r / factor)); g = Math.min(255, Math.floor(g / factor)); b = Math.min(255, Math.floor(b / factor)); }
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
