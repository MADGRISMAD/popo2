// ============================================================
// render/renderPoop.js — popó visible en el parque.
// Doradas con brillo animado.
// ============================================================

import { state } from '../gameState.js';

export function renderPoops (ctx) {
  const t = performance.now() / 1000;
  for (const p of state.park.poops) {
    drawPoop(ctx, p, t);
  }
}

function drawPoop (ctx, p, t) {
  ctx.save();
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 6, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

  if (p.golden) {
    // Halo
    const grd = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 16);
    grd.addColorStop(0, 'rgba(251,191,36,0.9)');
    grd.addColorStop(1, 'rgba(251,191,36,0.0)');
    ctx.fillStyle = grd;
    ctx.fillRect(p.x - 16, p.y - 16, 32, 32);
    ctx.fillStyle = '#fbbf24';
  } else {
    ctx.fillStyle = '#5b3a1d';
  }

  // Cuerpo en 3 capas tipo emoji simplificado
  ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x, p.y - 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x, p.y - 9, 2.5, 0, Math.PI * 2); ctx.fill();

  if (p.golden) {
    // Sparkle giratorio
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    const a = t * 4;
    const r = 9 + Math.sin(t * 4) * 1.5;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    ctx.lineTo(p.x - Math.cos(a) * r, p.y - Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}
