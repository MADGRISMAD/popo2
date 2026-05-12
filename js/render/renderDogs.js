// ============================================================
// render/renderDogs.js — perros estilo papel recortado.
// Cada raza tiene una silueta distinta (proporciones, orejas, cola).
// Animaciones: caminar (squash & stretch), cola, parpadeo,
// reacciones por estado (eating, fighting, resting, pregnant).
// ============================================================

import { state } from '../gameState.js';
import { BREEDS_BY_ID, RARITIES_BY_ID } from '../data/dogs.js';

// ---- silueta por raza (proporciones del cuerpo) ----------------
const SHAPE = {
  pug:        { wMul: 0.95, hMul: 1.05, ears: 'flop',     tail: 'curl',  legLen: 0.45, headMul: 1.10 },
  bulldog:    { wMul: 1.10, hMul: 1.00, ears: 'flop',     tail: 'short', legLen: 0.42, headMul: 1.10 },
  chihuahua:  { wMul: 0.70, hMul: 0.85, ears: 'big',      tail: 'thin',  legLen: 0.55, headMul: 1.00 },
  corgi:      { wMul: 1.20, hMul: 0.85, ears: 'point',    tail: 'short', legLen: 0.30, headMul: 0.95 },
  poodle:     { wMul: 0.95, hMul: 1.00, ears: 'fluff',    tail: 'puff',  legLen: 0.55, headMul: 0.95 },
  husky:      { wMul: 1.05, hMul: 1.05, ears: 'point',    tail: 'curl',  legLen: 0.55, headMul: 1.00 },
  pastor:     { wMul: 1.05, hMul: 1.05, ears: 'point',    tail: 'long',  legLen: 0.55, headMul: 1.00 },
  border:     { wMul: 1.00, hMul: 1.00, ears: 'flop',     tail: 'long',  legLen: 0.55, headMul: 0.95 },
  golden:     { wMul: 1.10, hMul: 1.05, ears: 'flop',     tail: 'long',  legLen: 0.55, headMul: 1.00 },
  gran_danes: { wMul: 1.20, hMul: 1.20, ears: 'point',    tail: 'long',  legLen: 0.65, headMul: 1.00 },
  shiba:      { wMul: 0.95, hMul: 0.95, ears: 'point',    tail: 'curl',  legLen: 0.50, headMul: 1.00 },
  akita:      { wMul: 1.05, hMul: 1.05, ears: 'point',    tail: 'curl',  legLen: 0.55, headMul: 1.00 },
  samoyedo:   { wMul: 1.00, hMul: 1.05, ears: 'point',    tail: 'puff',  legLen: 0.55, headMul: 1.00 },
  aurodog:    { wMul: 1.05, hMul: 1.05, ears: 'point',    tail: 'puff',  legLen: 0.55, headMul: 1.00 },
  lobo:       { wMul: 1.10, hMul: 1.10, ears: 'point',    tail: 'long',  legLen: 0.60, headMul: 1.00 },
  mecanico:   { wMul: 1.05, hMul: 1.00, ears: 'point',    tail: 'thin',  legLen: 0.55, headMul: 1.00 },
  fenrir:     { wMul: 1.20, hMul: 1.15, ears: 'point',    tail: 'long',  legLen: 0.60, headMul: 1.05 },
  cerbero:    { wMul: 1.20, hMul: 1.15, ears: 'point',    tail: 'long',  legLen: 0.60, headMul: 1.10 },
  estelar:    { wMul: 1.10, hMul: 1.10, ears: 'point',    tail: 'puff',  legLen: 0.55, headMul: 1.05 },
};
const DEFAULT_SHAPE = { wMul: 1.0, hMul: 1.0, ears: 'flop', tail: 'long', legLen: 0.55, headMul: 1.0 };

export function renderDogs (ctx, dt) {
  const t = performance.now() / 1000;
  // Orden por Y para profundidad
  const dogs = state.park.activeDogs
    .map(id => state.dogs.map[id])
    .filter(Boolean)
    .slice()
    .sort((a, b) => a.y - b.y);
  for (const d of dogs) drawDog(ctx, d, t);
}

function drawDog (ctx, d, t) {
  const breed = BREEDS_BY_ID[d.breed] || BREEDS_BY_ID.callejero;
  const shape = SHAPE[d.breed] || DEFAULT_SHAPE;
  const body  = d._customBody || breed.body;
  const spot  = d._customSpot ?? breed.spot;
  const isLegendary = ['legend', 'mitico', 'cosmico'].includes(d.rarity);
  const isCosmic = d.rarity === 'cosmico';
  const isMythic = d.rarity === 'mitico';

  // Tamaño base por edad
  const ageScale = d.age === 'baby' ? 0.55 : d.age === 'young' ? 0.80 : d.age === 'veteran' ? 0.95 : 1.0;
  const W = 44 * ageScale * shape.wMul;
  const H = 28 * ageScale * shape.hMul;

  // Animaciones
  const walking  = d.state === 'walking';
  const fighting = d.state === 'fighting';
  const resting  = d.state === 'resting' || d.state === 'pregnant';
  const eating   = d._goingToBowl == null && d.state === 'walking' &&
                   Math.abs(d.x - d.targetX) < 8 && Math.abs(d.y - d.targetY) < 8;

  const phase = t * 8 + d.id;
  const bob   = walking ? Math.sin(phase) * 2.2 : (resting ? Math.sin(t * 1.6 + d.id) * 0.5 : Math.sin(t * 2.4 + d.id) * 0.6);
  const squash = walking ? 1 + Math.sin(phase * 2) * 0.04 : (eating ? 1 + Math.sin(t * 8) * 0.06 : 1);
  const stretch = walking ? 1 - Math.sin(phase * 2) * 0.04 : 1;
  const shake = fighting ? Math.sin(t * 30) * 2 : 0;

  // Dirección facial (mirar hacia el target si está caminando)
  const facingRight = (walking ? (d.targetX - d.x) : (d._lastFacing ?? 1)) >= 0;
  d._lastFacing = facingRight ? 1 : -1;

  const x = d.x + shake;
  const y = d.y + bob;

  ctx.save();

  // ---- Halo de rareza (debajo del cuerpo)
  if (isLegendary) {
    const c = isCosmic ? '#ec59c2' : isMythic ? '#ff4757' : '#ffb71a';
    const grd = ctx.createRadialGradient(x, y + 6, W * 0.2, x, y + 6, W * 1.6);
    grd.addColorStop(0, c + 'aa');
    grd.addColorStop(1, c + '00');
    ctx.fillStyle = grd;
    ctx.fillRect(x - W * 1.6, y - W * 1.6 + 6, W * 3.2, W * 3.2);
  }

  // ---- Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + H * 0.55 + 4, W * 0.62, H * 0.20, 0, 0, Math.PI * 2); ctx.fill();

  // ---- Patas (rebote)
  const legSwing = walking ? Math.sin(phase) * 3.5 : 0;
  const legColor = darken(body, 0.78);
  const legW = W * 0.10;
  const legH = H * shape.legLen;
  drawLeg(ctx, x - W * 0.32, y + H * 0.30, legSwing,  legW, legH, legColor);
  drawLeg(ctx, x + W * 0.32, y + H * 0.30, -legSwing, legW, legH, legColor);
  drawLeg(ctx, x - W * 0.10, y + H * 0.30, -legSwing, legW, legH, legColor);
  drawLeg(ctx, x + W * 0.10, y + H * 0.30, legSwing,  legW, legH, legColor);

  // ---- Cuerpo (con squash & stretch)
  const bodyW = W * 0.55 * stretch;
  const bodyH = H * 0.55 * squash;
  // contorno oscuro (papel oscuro detrás)
  ctx.fillStyle = darken(body, 0.78);
  ctx.beginPath(); ctx.ellipse(x, y, bodyW + 2, bodyH + 2, 0, 0, Math.PI * 2); ctx.fill();
  // cuerpo principal
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(x, y, bodyW, bodyH, 0, 0, Math.PI * 2); ctx.fill();
  // highlight superior (cara papel)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.ellipse(x - bodyW * 0.25, y - bodyH * 0.45, bodyW * 0.55, bodyH * 0.30, 0, 0, Math.PI * 2); ctx.fill();

  // ---- Manchas
  if (spot) {
    ctx.fillStyle = spot;
    ctx.beginPath(); ctx.ellipse(x - bodyW * 0.35, y - bodyH * 0.05, bodyW * 0.32, bodyH * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + bodyW * 0.30, y + bodyH * 0.20, bodyW * 0.24, bodyH * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  }

  // ---- Cola (lado opuesto a la cabeza)
  drawTail(ctx, x, y, W, H, shape, body, t, d, facingRight);

  // ---- Cabeza
  const hx = x + (facingRight ? W * 0.42 : -W * 0.42);
  const hy = y - H * 0.10;
  drawHead(ctx, hx, hy, W, H, shape, body, spot, d, t, facingRight);

  // ---- Indicadores de estado (encima)
  drawStateIcon(ctx, d, x, y, H);

  ctx.restore();
}

// ----- partes -----------------------------------------------------
function drawLeg (ctx, x, y, swing, w, h, color) {
  const len = Math.max(2, h * 0.7 + swing);
  ctx.fillStyle = darken(color, 0.85);
  ctx.fillRect(x - w / 2 - 0.5, y - 0.5, w + 1, len + 1);
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y, w, len);
  // patita marrón
  ctx.fillStyle = darken(color, 0.7);
  ctx.beginPath(); ctx.ellipse(x, y + len, w * 0.7, w * 0.4, 0, 0, Math.PI * 2); ctx.fill();
}

function drawTail (ctx, x, y, W, H, shape, body, t, d, facingRight) {
  const wagBase = (d.state === 'walking' || d.happiness > 60) ? Math.sin(t * 12 + d.id) : 0;
  const sgn = facingRight ? -1 : 1;
  const tx = x + sgn * W * 0.50;
  const ty = y - H * 0.05;
  const dark = darken(body, 0.78);

  if (shape.tail === 'curl') {
    // Cola tipo cola enroscada (Husky/Shiba)
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.bezierCurveTo(tx + sgn * 14, ty - 22, tx + sgn * 6 + wagBase * 4, ty - 26, tx - sgn * 4, ty - 18);
    ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.bezierCurveTo(tx + sgn * 14, ty - 22, tx + sgn * 6 + wagBase * 4, ty - 26, tx - sgn * 4, ty - 18);
    ctx.stroke();
  } else if (shape.tail === 'puff') {
    // Pompón (Poodle, Samoyedo)
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(tx + sgn * 8, ty - 14 + wagBase * 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(tx + sgn * 8, ty - 14 + wagBase * 2, 7, 0, Math.PI * 2); ctx.fill();
  } else if (shape.tail === 'short') {
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(tx + sgn * 4, ty - 4, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(tx + sgn * 4, ty - 4, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (shape.tail === 'thin') {
    ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + sgn * 14, ty - 18 + wagBase * 5);
    ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + sgn * 14, ty - 18 + wagBase * 5);
    ctx.stroke();
  } else {
    // long (default)
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + sgn * 12, ty - 16 + wagBase * 6, tx + sgn * 18, ty - 20 + wagBase * 8);
    ctx.stroke();
    ctx.strokeStyle = body; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + sgn * 12, ty - 16 + wagBase * 6, tx + sgn * 18, ty - 20 + wagBase * 8);
    ctx.stroke();
  }
}

function drawHead (ctx, hx, hy, W, H, shape, body, spot, d, t, facingRight) {
  const dark = darken(body, 0.78);
  const headW = W * 0.32 * shape.headMul;
  const headH = H * 0.46 * shape.headMul;

  // Orejas (detrás de cabeza)
  drawEars(ctx, hx, hy, W, H, shape, body, dark, facingRight);

  // Contorno cabeza
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(hx, hy, headW + 1.5, headH + 1.5, 0, 0, Math.PI * 2); ctx.fill();
  // Cara
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(hx, hy, headW, headH, 0, 0, Math.PI * 2); ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.ellipse(hx - headW * 0.3, hy - headH * 0.5, headW * 0.45, headH * 0.25, 0, 0, Math.PI * 2); ctx.fill();

  // Hocico
  const sgn = facingRight ? 1 : -1;
  ctx.fillStyle = darken(body, 1.10);
  ctx.beginPath(); ctx.ellipse(hx + sgn * headW * 0.55, hy + headH * 0.18, headW * 0.40, headH * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  // Nariz
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(hx + sgn * headW * 0.85, hy + headH * 0.05, 2.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();

  // Ojos (con parpadeo)
  const blinkPhase = (t * 0.8 + d.id * 0.3) % 4;
  const blink = blinkPhase < 0.12 ? 0.15 : 1;
  const eyeY = hy - headH * 0.10;
  const eyeX1 = hx - sgn * headW * 0.05;
  const eyeX2 = hx + sgn * headW * 0.30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(eyeX1, eyeY, 2.6, 3 * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeX2, eyeY, 2.6, 3 * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(eyeX1 + sgn * 0.5, eyeY, 1.4, 2 * blink, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eyeX2 + sgn * 0.5, eyeY, 1.4, 2 * blink, 0, 0, Math.PI * 2); ctx.fill();

  // Detalles veterano (bigote)
  if (d.age === 'veteran') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hx + sgn * headW * 0.35, hy + headH * 0.10);
    ctx.lineTo(hx + sgn * headW * 0.85, hy + headH * 0.05);
    ctx.moveTo(hx + sgn * headW * 0.35, hy + headH * 0.18);
    ctx.lineTo(hx + sgn * headW * 0.85, hy + headH * 0.18);
    ctx.stroke();
  }
}

function drawEars (ctx, hx, hy, W, H, shape, body, dark, facingRight) {
  const sgn = facingRight ? 1 : -1;
  ctx.fillStyle = dark;
  if (shape.ears === 'point') {
    // Triángulos puntiagudos
    ctx.beginPath();
    ctx.moveTo(hx - sgn * 2, hy - H * 0.42);
    ctx.lineTo(hx - sgn * 12, hy - H * 0.10);
    ctx.lineTo(hx + sgn * 5, hy - H * 0.20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + sgn * 14, hy - H * 0.42);
    ctx.lineTo(hx + sgn * 22, hy - H * 0.08);
    ctx.lineTo(hx + sgn * 6, hy - H * 0.18);
    ctx.fill();
    // interior rosa
    ctx.fillStyle = '#ff9bb6';
    ctx.beginPath();
    ctx.moveTo(hx - sgn * 4, hy - H * 0.34);
    ctx.lineTo(hx - sgn * 9, hy - H * 0.14);
    ctx.lineTo(hx + sgn * 2, hy - H * 0.20);
    ctx.fill();
  } else if (shape.ears === 'flop') {
    // Orejas caídas
    ctx.beginPath();
    ctx.ellipse(hx - sgn * 8, hy - H * 0.05, 7, 12, sgn * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + sgn * 14, hy - H * 0.05, 7, 12, -sgn * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape.ears === 'big') {
    // Orejas enormes (Chihuahua)
    ctx.beginPath();
    ctx.moveTo(hx - sgn * 3, hy - H * 0.45);
    ctx.lineTo(hx - sgn * 16, hy - H * 0.10);
    ctx.lineTo(hx + sgn * 3, hy - H * 0.20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + sgn * 18, hy - H * 0.45);
    ctx.lineTo(hx + sgn * 26, hy - H * 0.05);
    ctx.lineTo(hx + sgn * 6, hy - H * 0.18);
    ctx.fill();
  } else if (shape.ears === 'fluff') {
    ctx.beginPath(); ctx.arc(hx - sgn * 8, hy - H * 0.20, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + sgn * 14, hy - H * 0.20, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(hx - sgn * 8, hy - H * 0.22, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + sgn * 14, hy - H * 0.22, 6.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawStateIcon (ctx, d, x, y, H) {
  // Embarazo: barra arriba
  if (d.state === 'pregnant') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 22, y - H * 1.0 - 10, 44, 8);
    const ratio = 1 - Math.max(0, (d.pregnancyUntil - performance.now())) / Math.max(1, d.pregnancyTotal);
    const grd = ctx.createLinearGradient(x - 21, 0, x + 21, 0);
    grd.addColorStop(0, '#ff7ab8'); grd.addColorStop(1, '#ff3d8b');
    ctx.fillStyle = grd;
    ctx.fillRect(x - 21, y - H * 1.0 - 9, 42 * ratio, 6);
  }
  // Iconos sticker
  if (d.state === 'fighting')                    drawStickerIcon(ctx, '💥', x, y - H * 1.0);
  else if (d.state === 'resting')                drawStickerIcon(ctx, '💤', x, y - H * 1.0);
  if (d.hunger < 25 && d.state !== 'pregnant')   drawStickerIcon(ctx, '🦴', x + H * 0.85, y - H * 0.7);
  if (d.happiness > 80 && d.state !== 'fighting') drawStickerIcon(ctx, '♥', x - H * 0.85, y - H * 0.7, '#ec5985');
}

function drawStickerIcon (ctx, em, x, y, color) {
  ctx.save();
  ctx.font = 'bold 16px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (color) {
    ctx.fillStyle = color;
    ctx.fillText(em, x, y);
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    ctx.fillText(em, x, y);
  }
  ctx.restore();
}

function darken (hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  if (factor < 1) { r = Math.floor(r * factor); g = Math.floor(g * factor); b = Math.floor(b * factor); }
  else            { r = Math.min(255, Math.floor(r / Math.max(0.001, factor)) + 8);
                    g = Math.min(255, Math.floor(g / Math.max(0.001, factor)) + 8);
                    b = Math.min(255, Math.floor(b / Math.max(0.001, factor)) + 8); }
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
