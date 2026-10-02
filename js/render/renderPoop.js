// ============================================================
// render/renderPoop.js — popó como pegatina de papel (borde blanco,
// carita), estilo Paper Mario. Se dibuja de pie sobre el suelo del
// escenario y se ordena por profundidad con perros y árboles.
// ============================================================

import { state } from '../gameState.js';
import { onParkMove } from '../inputManager.js';
import { buffMagnet, comboWindowLeft } from '../systems/hookSystem.js';
import { UPGRADES_BY_ID } from '../data/upgrades.js';
import { project } from './projection.js';
import { PARK } from '../config.js';

let _cursor = null;
let _initialized = false;

function ensureInit () {
  if (_initialized) return;
  _initialized = true;
  onParkMove(p => { _cursor = p; });
}

// Aura del imán (en el suelo, bajo todo)
export function renderCursorGround (ctx) {
  ensureInit();
  if (!_cursor || _cursor.y < -20 || state.park.poops.length === 0) return;
  const r = 30 + UPGRADES_BY_ID.magnet.effect(state.inventory.upgrades.magnet || 0) + buffMagnet();
  const p = project(_cursor.x, _cursor.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, 0.55);
  const grd = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.1);
  grd.addColorStop(0, 'rgba(255,255,255,0.30)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Anillo de combo (encima de todo)
export function renderCursorTop (ctx) {
  if (_cursor && _cursor.sx != null) drawComboRing(ctx, { x: _cursor.sx, y: _cursor.sy }, performance.now() / 1000);
}

// Compatibilidad: dibuja todas las popós de golpe
export function renderPoops (ctx) {
  renderCursorGround(ctx);
  const now = performance.now();
  for (const p of state.park.poops) drawPoopItem(ctx, p, now);
  renderCursorTop(ctx);
}

export function drawPoopItem (ctx, p, now = performance.now()) {
  const t = now / 1000;
  if (now < (p.bornAt || 0)) { drawFalling(ctx, p, now); return; }
  const pr = project(p.x, p.y);
  // Aparición: rebote
  const age = (now - (p.bornAt || 0)) / 300;
  let scale = 1;
  if (age < 1) scale = Math.max(0.05, age < 0.5 ? age * 2.4 : 1 + Math.sin((age - 0.5) * Math.PI * 2) * 0.2);
  // Vibración si el cursor está cerca
  let dx = 0;
  if (_cursor) {
    const d2 = (_cursor.x - p.x) ** 2 + (_cursor.y - p.y) ** 2;
    if (d2 < 80 * 80) dx = (Math.random() - 0.5) * (1 - Math.sqrt(d2) / 80) * 3;
  }
  ctx.save();
  ctx.translate(pr.x + dx, pr.y);
  // Sombra en el suelo
  ctx.fillStyle = 'rgba(30,20,60,0.28)';
  ctx.beginPath(); ctx.ellipse(0, 0, 10 * pr.s, 3 * pr.s, 0, 0, Math.PI * 2); ctx.fill();
  const k = pr.s * 1.25 * scale;
  ctx.scale(k, k);
  // Leve balanceo de papel
  ctx.rotate(Math.sin(t * 3 + (p.id || 0)) * 0.06);
  if (p.rainbow) drawRainbow(ctx, t);
  else if (p.golden) drawGolden(ctx, t);
  else drawPoopSticker(ctx, ['#7a4520', '#94572a', '#a9683a'], false);
  ctx.restore();
}

function drawFalling (ctx, p, now) {
  const FALL = 450;
  const k = 1 - (p.bornAt - now) / FALL;
  if (k <= 0) return;
  const pr = project(p.x, p.y);
  const h = (1 - k) * (1 - k) * 360;
  ctx.fillStyle = `rgba(30,20,60,${0.10 + k * 0.2})`;
  ctx.beginPath(); ctx.ellipse(pr.x, pr.y, (4 + k * 7) * pr.s, (1.5 + k * 2) * pr.s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(pr.x, pr.y - h);
  const s = pr.s * 1.25;
  ctx.scale(s * 0.9, s * 1.12);
  if (p.golden) drawGolden(ctx, now / 1000); else drawPoopSticker(ctx, ['#7a4520', '#94572a', '#a9683a'], false);
  ctx.restore();
}

// Tres bolitas apiladas con borde blanco de pegatina y carita
function poopPath (ctx, grow = 0) {
  ctx.beginPath(); ctx.ellipse(0, -5, 9 + grow, 5.5 + grow, 0, 0, Math.PI * 2);
  ctx.moveTo(6.5 + grow, -11); ctx.ellipse(0, -11, 6.5 + grow, 4.5 + grow, 0, 0, Math.PI * 2);
  ctx.moveTo(4 + grow, -16.5); ctx.ellipse(0, -16.5, 4 + grow, 3.4 + grow, 0, 0, Math.PI * 2);
  ctx.moveTo(1.5 + grow, -21); ctx.arc(0.5, -20.5, 1.6 + grow, 0, Math.PI * 2);
}

function drawPoopSticker (ctx, [c1, c2, c3], face = true, eyeCol = '#1d1622') {
  // Borde blanco
  ctx.fillStyle = '#ffffff';
  poopPath(ctx, 2.6); ctx.fill();
  // Capas
  ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, -5, 9, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, -11, 6.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c3; ctx.beginPath(); ctx.ellipse(0, -16.5, 4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0.5, -20.5, 1.6, 0, Math.PI * 2); ctx.fill();
  // Brillos
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.ellipse(-4, -7, 2.4, 1.2, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-2.5, -12.5, 1.6, 0.9, -0.3, 0, Math.PI * 2); ctx.fill();
  // Carita
  ctx.fillStyle = eyeCol;
  ctx.beginPath(); ctx.ellipse(-2.4, -10.5, 0.9, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2.4, -10.5, 0.9, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  if (face) {
    ctx.strokeStyle = eyeCol; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -7.6, 1.8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
}

function drawGolden (ctx, t) {
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const grd = ctx.createRadialGradient(0, -10, 2, 0, -10, 24 * pulse);
  grd.addColorStop(0, 'rgba(255,240,160,0.9)');
  grd.addColorStop(1, 'rgba(255,200,40,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(-26, -36, 52, 52);
  drawPoopSticker(ctx, ['#e09a12', '#f5b82a', '#ffd65a'], true, '#5a3600');
  // Destellos
  ctx.fillStyle = '#ffffff';
  const a = t * 4;
  for (let i = 0; i < 2; i++) {
    const sx = Math.cos(a + i * Math.PI) * 13, sy = -11 + Math.sin(a + i * Math.PI) * 9;
    sparkle4(ctx, sx, sy, 3.2);
  }
}

function drawRainbow (ctx, t) {
  const pulse = 1 + Math.sin(t * 7) * 0.2;
  for (let i = 0; i < 6; i++) {
    const a = t * 2 + (i / 6) * Math.PI * 2;
    ctx.fillStyle = `hsla(${(i * 60 + t * 200) % 360},95%,65%,0.7)`;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 16 * pulse, -11 + Math.sin(a) * 12 * pulse, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  const h = (t * 240) % 360;
  drawPoopSticker(ctx, [`hsl(${h},85%,55%)`, `hsl(${(h + 90) % 360},85%,60%)`, `hsl(${(h + 180) % 360},85%,65%)`], true);
  ctx.fillStyle = '#ffffff';
  sparkle4(ctx, 11, -22, 4);
}

function sparkle4 (ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function drawComboRing (ctx, c, t) {
  const left = comboWindowLeft();
  const m = state.combo.multiplier;
  if (m <= 1.05 || c.y < 0 || c.y > PARK.H) return;
  const r = 22;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#2d2748';
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
  const hue = Math.max(0, 120 - (m - 1) * 13);
  const urgent = left < 0.35;
  ctx.strokeStyle = left > 0 ? `hsl(${hue},90%,${urgent && Math.sin(t * 30) > 0 ? 70 : 52}%)` : 'rgba(45,39,72,0.4)';
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left > 0 ? left : (m - 1) / 9));
  ctx.stroke();
  ctx.font = '900 15px "Arial Rounded MT Bold", Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#2d2748';
  ctx.strokeText('x' + m.toFixed(1), c.x, c.y - r - 12);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('x' + m.toFixed(1), c.x, c.y - r - 12);
  ctx.restore();
}
