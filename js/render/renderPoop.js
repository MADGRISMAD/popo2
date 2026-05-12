// ============================================================
// render/renderPoop.js — popó como sticker cómico de papel.
// Animación de aparición con rebote, vibración cerca del cursor,
// y absorción visual al recolectar (hecha por poopSystem).
// ============================================================

import { state } from '../gameState.js';
import { onParkMove } from '../inputManager.js';

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
    const r = 50 + (state.park.magnetRadius || 0);
    ctx.save();
    const grd = ctx.createRadialGradient(_cursor.x, _cursor.y, r * 0.4, _cursor.x, _cursor.y, r * 1.2);
    grd.addColorStop(0, 'rgba(255,255,255,0.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(_cursor.x - r * 1.2, _cursor.y - r * 1.2, r * 2.4, r * 2.4);
    ctx.restore();
  }

  for (const p of state.park.poops) drawPoop(ctx, p, t);
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

  if (p.golden) {
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
