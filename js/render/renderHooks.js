// ============================================================
// render/renderHooks.js — caja misteriosa en el parque.
// Cae del cielo, rebota, brilla y parpadea antes de desaparecer.
// ============================================================

import { getBox } from '../systems/hookSystem.js';
import { project } from './projection.js';

export function renderMysteryBox (ctx) {
  const b = getBox();
  if (!b) return;
  const now = performance.now();
  const t = now / 1000;
  const age = (now - b.bornAt) / 1000;
  const left = (b.until - now) / 1000;

  // Caída con rebote
  let yOff = 0, squash = 1;
  if (age < 0.5) {
    const k = age / 0.5;
    yOff = -(1 - k * k) * 420;
  } else if (age < 0.8) {
    const k = (age - 0.5) / 0.3;
    yOff = -Math.sin(k * Math.PI) * 24;
    squash = 1 + Math.sin(k * Math.PI) * 0.12;
  }
  // Parpadeo al final
  if (left < 3 && Math.sin(t * (left < 1.2 ? 40 : 20)) < 0) return;

  const bob = age > 0.8 ? Math.sin(t * 3) * 3 : 0;
  const pr = project(b.x, b.y);
  const k = pr.s * 1.25;
  ctx.save();
  ctx.translate(pr.x, pr.y - 22 * k);
  ctx.scale(k, k);

  // Haz de luz giratorio
  if (age > 0.5) {
    ctx.save();
    ctx.rotate(t * 0.8);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = 'rgba(255,236,150,0.16)';
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-12, -70); ctx.lineTo(12, -70); ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
    grd.addColorStop(0, 'rgba(255,240,170,0.6)');
    grd.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(-52, -52, 104, 104);
  }

  // Sombra
  const shadowK = age < 0.5 ? age / 0.5 : 1;
  ctx.fillStyle = `rgba(30,20,60,${0.3 * shadowK})`;
  ctx.beginPath(); ctx.ellipse(3, 22, 22 * shadowK, 6 * shadowK, 0, 0, Math.PI * 2); ctx.fill();

  ctx.translate(0, yOff + bob);
  ctx.scale(squash, 2 - squash);
  ctx.rotate(Math.sin(t * 6) * 0.06);

  // Caja (papel recortado con borde blanco)
  const W = 38, H = 32;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -W / 2 - 8, -H / 2 - 12, W + 16, H + 18, 9); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-8, -H / 2 - 12, 11, 8, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 8, -H / 2 - 12, 11, 8,  0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a1a3a';
  roundRect(ctx, -W / 2 - 2, -H / 2 + 2, W + 4, H + 4, 6); ctx.fill();
  ctx.fillStyle = '#ec5985';
  roundRect(ctx, -W / 2, -H / 2, W, H, 5); ctx.fill();
  // Tapa
  ctx.fillStyle = '#ff7aa2';
  roundRect(ctx, -W / 2 - 4, -H / 2 - 8, W + 8, 12, 4); ctx.fill();
  // Cinta
  ctx.fillStyle = '#ffd56a';
  ctx.fillRect(-4, -H / 2 - 8, 8, H + 8);
  ctx.fillRect(-W / 2 - 4, -H / 2 - 4, W + 8, 5);
  // Lazo
  ctx.beginPath(); ctx.ellipse(-8, -H / 2 - 12, 8, 5, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 8, -H / 2 - 12, 8, 5,  0.5, 0, Math.PI * 2); ctx.fill();
  // Signo de interrogación
  ctx.font = '900 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = '#7a1a3a';
  ctx.strokeText('?', -12, 4);
  ctx.fillStyle = '#fff6dd';
  ctx.fillText('?', -12, 4);
  ctx.restore();

  // Chispas
  if (age > 0.5 && Math.random() < 0.3) {
    // dibujadas inline (no consumen pool de partículas)
    const a = Math.random() * Math.PI * 2;
    const r = 26 + Math.random() * 18;
    ctx.fillStyle = '#fff6dd';
    ctx.beginPath(); ctx.arc(pr.x + Math.cos(a) * r * k, pr.y - 22 * k + Math.sin(a) * r * k, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Cuenta atrás
  if (age > 0.8) {
    ctx.save();
    ctx.font = '900 14px "Arial Rounded MT Bold", Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2d2748';
    const label = '¡Atrápala! ' + Math.ceil(left) + 's';
    ctx.strokeText(label, pr.x, pr.y + 18);
    ctx.fillStyle = left < 3 ? '#ffb4b4' : '#ffffff';
    ctx.fillText(label, pr.x, pr.y + 18);
    ctx.restore();
  }
}

function roundRect (c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
