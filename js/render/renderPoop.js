// ============================================================
// render/renderPoop.js — popó como sticker cómico de papel.
// Animación de aparición con rebote, vibración cerca del cursor,
// y absorción visual al recolectar (hecha por poopSystem).
// ============================================================

import { state } from '../gameState.js';
import { onParkMove } from '../inputManager.js';
import { buffMagnet, comboWindowLeft } from '../systems/hookSystem.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';

let _cursor = null;
let _initialized = false;

function ensureInit () {
  if (_initialized) return;
  _initialized = true;
  onParkMove(p => { _cursor = p; });
}

export function renderPoops (ctx) {
  ensureInit();
  const t = performance.now() / 1000;

  // Estela del cursor (aura de imán visible muy sutil)
  if (_cursor && state.park.poops.length > 0) {
    const r = 30 + UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0) + buffMagnet();
    ctx.save();
    const grd = ctx.createRadialGradient(_cursor.x, _cursor.y, r * 0.4, _cursor.x, _cursor.y, r * 1.2);
    grd.addColorStop(0, 'rgba(255,255,255,0.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(_cursor.x - r * 1.2, _cursor.y - r * 1.2, r * 2.4, r * 2.4);
    ctx.restore();
  }

  const now = performance.now();
  for (const p of state.park.poops) {
    if (now < (p.bornAt || 0)) drawFalling(ctx, p, now);
    else drawPoop(ctx, p, t);
  }

  // Anillo de combo alrededor del cursor: cuánto tiempo te queda antes de que se enfríe
  if (_cursor) drawComboRing(ctx, _cursor, t);
}

function drawFalling (ctx, p, now) {
  const FALL = 450;
  const k = 1 - (p.bornAt - now) / FALL;
  if (k <= 0) return;
  const h = (1 - k) * (1 - k) * 320;
  // Sombra que crece al acercarse
  ctx.fillStyle = `rgba(0,0,0,${0.12 + k * 0.22})`;
  ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 7, 4 + k * 6, 1.5 + k * 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(p.x, p.y - h);
  ctx.scale(0.9, 1.15);
  if (p.golden) drawGolden(ctx, now / 1000); else drawNormal(ctx);
  ctx.restore();
}

function drawComboRing (ctx, c, t) {
  const left = comboWindowLeft();
  const m = state.combo.multiplier;
  if (m <= 1.05) return;
  const r = 22;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
  const hue = Math.max(0, 120 - (m - 1) * 13);
  const urgent = left < 0.35;
  ctx.strokeStyle = left > 0 ? `hsl(${hue},90%,${urgent && Math.sin(t * 30) > 0 ? 75 : 60}%)` : 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left > 0 ? left : (m - 1) / 9));
  ctx.stroke();
  ctx.font = '900 13px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4b2a10';
  ctx.strokeText('x' + m.toFixed(1), c.x, c.y - r - 10);
  ctx.fillStyle = '#fff6dd';
  ctx.fillText('x' + m.toFixed(1), c.x, c.y - r - 10);
  ctx.restore();
}

function drawPoop (ctx, p, t) {
  // Aparición: rebote durante los primeros 280ms
  const age = (performance.now() - (p.bornAt || 0)) / 280;
  let scale = 1;
  if (age < 1) {
    // overshoot
    const k = age;
    scale = k < 0.5 ? (k * 2.4) : (1 + Math.sin((k - 0.5) * Math.PI * 2) * 0.20);
    scale = Math.max(0.05, scale);
  }

  // Vibración si el cursor está cerca
  let dx = 0, dy = 0;
  if (_cursor) {
    const distSq = (_cursor.x - p.x) ** 2 + (_cursor.y - p.y) ** 2;
    if (distSq < 80 * 80) {
      const vibrate = (1 - Math.sqrt(distSq) / 80) * 1.4;
      dx = (Math.random() - 0.5) * vibrate * 2;
      dy = (Math.random() - 0.5) * vibrate * 2;
    }
  }

  ctx.save();
  ctx.translate(p.x + dx, p.y + dy);
  // Rotación leve aleatoria estable por id
  ctx.rotate((((p.id ?? 0) * 13) % 17) * 0.018);
  ctx.scale(scale, scale);

  if (p.rainbow) {
    drawRainbow(ctx, t);
  } else if (p.golden) {
    drawGolden(ctx, t);
  } else {
    drawNormal(ctx);
  }

  ctx.restore();
}

function drawNormal (ctx) {
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(2, 7, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  // Tres capas de "popó" estilizadas
  ctx.fillStyle = '#3e240e';
  ctx.beginPath(); ctx.arc(0, 1, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5b3618';
  ctx.beginPath(); ctx.arc(0, 1, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-0.5, -5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -10, 3.2, 0, Math.PI * 2); ctx.fill();
  // Highlight (papel)
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.arc(-2, -6, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-2.5, -1, 1.6, 0, Math.PI * 2); ctx.fill();
}

function drawGolden (ctx, t) {
  // Halo grande pulsante
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, 22 * pulse);
  grd.addColorStop(0, 'rgba(255,239,160,0.95)');
  grd.addColorStop(1, 'rgba(255,200,40,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(-22 * pulse, -22 * pulse, 44 * pulse, 44 * pulse);

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, 7, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  // Cuerpo dorado con borde marrón
  ctx.fillStyle = '#a8770a';
  ctx.beginPath(); ctx.arc(0, 1, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-0.5, -5, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -10, 3.6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ffd56a';
  ctx.beginPath(); ctx.arc(0, 1, 6.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-0.5, -5, 4.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -10, 3.0, 0, Math.PI * 2); ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.arc(-2.5, -1, 2.0, 0, Math.PI * 2); ctx.fill();

  // Carita sutil
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(-1.6, -4.5, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 0.8, -4.5, 0.7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(-0.5, -3.0, 1.2, 0, Math.PI); ctx.stroke();

  // Sparkle giratorio
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  const a = t * 4;
  const r = 11 + Math.sin(t * 4) * 1.5;
  ctx.beginPath();
  ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Math.cos(a + Math.PI / 2) * r * 0.7, Math.sin(a + Math.PI / 2) * r * 0.7);
  ctx.lineTo(-Math.cos(a + Math.PI / 2) * r * 0.7, -Math.sin(a + Math.PI / 2) * r * 0.7);
  ctx.stroke();
}

function drawRainbow (ctx, t) {
  // Halo arcoíris giratorio, más grande que la dorada: se ve desde lejos
  const pulse = 1 + Math.sin(t * 7) * 0.2;
  for (let i = 0; i < 6; i++) {
    const a = t * 2 + (i / 6) * Math.PI * 2;
    ctx.fillStyle = `hsla(${(i * 60 + t * 200) % 360},95%,65%,0.55)`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 14 * pulse, Math.sin(a) * 14 * pulse - 3, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const grd = ctx.createRadialGradient(0, 0, 2, 0, 0, 30 * pulse);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(-30 * pulse, -30 * pulse, 60 * pulse, 60 * pulse);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, 7, 10, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  const layers = [[0, 1, 8], [-0.5, -5, 5.4], [0, -10, 3.6]];
  layers.forEach(([x, y, r], i) => {
    ctx.fillStyle = `hsl(${(t * 240 + i * 90) % 360},90%,60%)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(-2.5, -1, 2.0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(-1.6, -4.5, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 0.8, -4.5, 0.8, 0, Math.PI * 2); ctx.fill();
}
