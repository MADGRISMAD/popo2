// ============================================================
// render/renderDogs.js — perros estilo Paper Mario.
// Cada perro es una figura de papel de perfil con borde blanco de
// pegatina, cabeza grande, ojo ovalado y collar del color de su
// rareza. Al cambiar de dirección gira como una hoja de papel
// (se ve el reverso blanco a mitad del giro).
//
// La figura se dibuja en coordenadas locales con los pies en (0,0)
// mirando a la derecha. Se pinta en dos pasadas: primero el borde
// blanco (todas las formas engordadas) y después los colores.
// ============================================================

import { state } from '../gameState.js';
import { BREEDS_BY_ID } from '../data/dogs.js';
import { project } from './projection.js';

// ---- silueta por raza ------------------------------------------
const SHAPE = {
  pug:        { wMul: 0.90, hMul: 1.05, ears: 'flop',  tail: 'curl',  legLen: 0.42, headMul: 1.15, snout: 0.45 },
  bulldog:    { wMul: 1.10, hMul: 1.05, ears: 'flop',  tail: 'short', legLen: 0.40, headMul: 1.12, snout: 0.60 },
  chihuahua:  { wMul: 0.72, hMul: 0.82, ears: 'big',   tail: 'thin',  legLen: 0.55, headMul: 1.05, snout: 0.80 },
  corgi:      { wMul: 1.18, hMul: 0.88, ears: 'point', tail: 'short', legLen: 0.28, headMul: 0.98, snout: 1.00 },
  poodle:     { wMul: 0.92, hMul: 0.95, ears: 'fluff', tail: 'puff',  legLen: 0.62, headMul: 0.95, snout: 1.05, fluffy: true },
  husky:      { wMul: 1.05, hMul: 1.02, ears: 'point', tail: 'curl',  legLen: 0.55, headMul: 1.00, snout: 1.00, mask: true },
  pastor:     { wMul: 1.08, hMul: 1.02, ears: 'point', tail: 'long',  legLen: 0.58, headMul: 0.98, snout: 1.15 },
  dalmata:    { wMul: 1.02, hMul: 0.98, ears: 'flop',  tail: 'long',  legLen: 0.60, headMul: 0.98, snout: 1.05, dots: true },
  border:     { wMul: 1.00, hMul: 1.00, ears: 'flop',  tail: 'long',  legLen: 0.55, headMul: 0.98, snout: 1.05, mask: true },
  golden:     { wMul: 1.10, hMul: 1.05, ears: 'flop',  tail: 'long',  legLen: 0.55, headMul: 1.00, snout: 1.05 },
  gran_danes: { wMul: 1.22, hMul: 1.10, ears: 'point', tail: 'long',  legLen: 0.78, headMul: 1.02, snout: 1.15 },
  shiba:      { wMul: 0.95, hMul: 0.95, ears: 'point', tail: 'curl',  legLen: 0.50, headMul: 1.02, snout: 0.90, mask: true },
  akita:      { wMul: 1.05, hMul: 1.05, ears: 'point', tail: 'curl',  legLen: 0.55, headMul: 1.02, snout: 0.95, mask: true },
  samoyedo:   { wMul: 1.00, hMul: 1.08, ears: 'point', tail: 'puff',  legLen: 0.52, headMul: 1.02, snout: 0.90, fluffy: true },
  aurodog:    { wMul: 1.05, hMul: 1.05, ears: 'point', tail: 'puff',  legLen: 0.55, headMul: 1.05, snout: 0.95, crown: true },
  lobo:       { wMul: 1.12, hMul: 1.08, ears: 'point', tail: 'long',  legLen: 0.62, headMul: 1.00, snout: 1.20, mask: true },
  mecanico:   { wMul: 1.05, hMul: 1.00, ears: 'point', tail: 'thin',  legLen: 0.55, headMul: 1.00, snout: 1.00, robot: true },
  fenrir:     { wMul: 1.20, hMul: 1.12, ears: 'point', tail: 'long',  legLen: 0.62, headMul: 1.05, snout: 1.15, glowEye: '#c084fc' },
  cerbero:    { wMul: 1.20, hMul: 1.12, ears: 'point', tail: 'long',  legLen: 0.60, headMul: 0.95, snout: 1.05, heads: 3, glowEye: '#ffb020' },
  estelar:    { wMul: 1.08, hMul: 1.08, ears: 'point', tail: 'puff',  legLen: 0.55, headMul: 1.08, snout: 0.95, stars: true },
};
const DEFAULT_SHAPE = { wMul: 1.0, hMul: 1.0, ears: 'flop', tail: 'long', legLen: 0.55, headMul: 1.0, snout: 1.0 };

const RARITY_COLOR = {
  comun: '#e04848', raro: '#3d7bff', epico: '#a64dff',
  legend: '#ffb71a', mitico: '#ff3b4f', cosmico: '#ec59c2',
};

const OUTLINE = '#ffffff';
const OUT_W = 5;          // grosor del borde de pegatina (unidades locales)
const BACK = '#efe6d2';   // reverso del papel
const SIL = '#2d2748';    // silueta (colección bloqueada)

// ---- painter con modos -----------------------------------------
let c = null;             // ctx activo
let MODE = 'color';       // 'outline' | 'color' | 'back' | 'sil'

function paint (color) {
  if (MODE === 'outline') {
    c.fillStyle = OUTLINE; c.fill();
    c.strokeStyle = OUTLINE; c.lineWidth = OUT_W; c.lineJoin = 'round'; c.stroke();
    return;
  }
  c.fillStyle = MODE === 'color' ? color : MODE === 'back' ? BACK : SIL;
  c.fill();
}
function strokeLine (color, w) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (MODE === 'outline') { c.strokeStyle = OUTLINE; c.lineWidth = w + OUT_W; c.stroke(); return; }
  c.strokeStyle = MODE === 'color' ? color : MODE === 'back' ? BACK : SIL;
  c.lineWidth = w; c.stroke();
}
const detail = () => MODE === 'color';

function ell (x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
function circ (x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }

// ---- estado de animación por perro (no se guarda) --------------
const _anim = new Map(); // id -> { face, flip }

export function renderDogs (ctx, dt) {
  // Mantenido por compatibilidad: el parque ahora dibuja perros
  // mezclados con el resto de objetos (orden por profundidad).
  const dogs = state.park.activeDogs.map(id => state.dogs.map[id]).filter(Boolean).sort((a, b) => a.y - b.y);
  for (const d of dogs) drawDogInPark(ctx, d, dt);
}

export function drawDogInPark (ctx, d, dt) {
  const t = performance.now() / 1000;
  const walking  = d.state === 'walking';
  const fighting = d.state === 'fighting';

  // Dirección + giro de papel
  let a = _anim.get(d.id);
  if (!a) { a = { face: 1, flip: 1 }; _anim.set(d.id, a); }
  if (walking && Math.abs(d.targetX - d.x) > 3) a.face = d.targetX >= d.x ? 1 : -1;
  if (fighting) a.face = Math.sin(t * 6 + d.id) > 0 ? 1 : -1;
  const sp = 9 * (dt || 0.016);
  if (a.flip < a.face) a.flip = Math.min(a.face, a.flip + sp);
  else if (a.flip > a.face) a.flip = Math.max(a.face, a.flip - sp);

  const p = project(d.x, d.y);
  const ageScale = d.age === 'baby' ? 0.58 : d.age === 'young' ? 0.80 : d.age === 'veteran' ? 0.97 : 1.0;
  const scale = p.s * ageScale * 1.6;
  const shake = fighting ? Math.sin(t * 40) * 2 : 0;

  ctx.save();
  ctx.translate(p.x + shake, p.y);
  ctx.scale(scale, scale);
  drawDogFigure(ctx, d, { t, flip: a.flip, walking, park: true });
  ctx.restore();

  if (fighting) drawFightCloud(ctx, p.x, p.y - 26 * scale, scale, t);
}

// Dibuja la figura completa (sombra, halo, pasadas, emotes) en coords locales
export function drawDogFigure (ctx, d, { t = 0, flip = 1, walking = false, park = false, silhouette = false } = {}) {
  const breed = BREEDS_BY_ID[d.breed] || BREEDS_BY_ID.callejero;
  const shape = SHAPE[d.breed] || DEFAULT_SHAPE;
  const body  = d._customBody || breed?.body || '#a08361';
  const spot  = d._customSpot ?? breed?.spot ?? null;
  const resting = d.state === 'resting' || d.state === 'pregnant';
  const phase = t * 9 + (d.id || 0);
  c = ctx;

  // Salto de papel al caminar (sube y cae con pequeño squash)
  const hop = walking ? Math.abs(Math.sin(phase * 0.5)) * 4 : 0;
  const breathe = !walking ? Math.sin(t * 2.2 + (d.id || 0)) * 0.025 : 0;
  const land = walking ? Math.max(0, 1 - Math.abs(Math.sin(phase * 0.5)) * 6) * 0.06 : 0;

  // Sombra en el suelo
  if (park) {
    const sw = 20 * shape.wMul * (1 - hop * 0.04);
    ctx.fillStyle = 'rgba(30,20,60,0.28)';
    ell(0, 0, sw, 4.2);
    ctx.fill();
  }

  // Halo de rareza
  if (park && ['legend', 'mitico', 'cosmico'].includes(d.rarity)) {
    const col = RARITY_COLOR[d.rarity];
    const pulse = 1 + Math.sin(t * 3) * 0.08;
    const g = ctx.createRadialGradient(0, -22, 4, 0, -22, 44 * pulse);
    g.addColorStop(0, col + '88'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g;
    ctx.fillRect(-48, -70, 96, 96);
  }

  const flat = Math.abs(flip);
  const showBack = flat < 0.22;
  ctx.save();
  ctx.translate(0, -hop);
  ctx.scale(Math.sign(flip || 1) * Math.max(0.06, flat), 1 + breathe - land);
  ctx.scale(1, 1 + land * 0.5);

  const geo = { shape, body, spot, phase, walking, resting, t, d };
  if (silhouette) {
    MODE = 'outline'; drawParts(geo);
    MODE = 'sil';     drawParts(geo);
  } else {
    MODE = 'outline'; drawParts(geo);
    MODE = showBack ? 'back' : 'color'; drawParts(geo);
  }
  MODE = 'color';
  ctx.restore();

  if (park) drawEmote(ctx, d, t, shape);
}

// ---- partes ----------------------------------------------------
function dims (shape, resting) {
  const legH = 12 * (shape.legLen / 0.55) * (resting ? 0.35 : 1);
  const rx = 18 * shape.wMul;
  const ry = 12 * shape.hMul;
  const bx = -3;
  const by = -(legH + ry * 0.72);
  const r  = 14.5 * shape.headMul;
  const hx = bx + rx * 0.80;
  const hy = by - ry * 0.95 - 3;
  return { legH, rx, ry, bx, by, r, hx, hy };
}

function drawParts (g) {
  const { shape, body, spot, phase, walking, resting, t, d } = g;
  const D = dims(shape, resting);
  const { legH, rx, ry, bx, by, r, hx, hy } = D;
  const dark = shade(body, 0.72);
  const light = mix(body, '#ffffff', 0.38);
  const earCol = spot && !shape.mask ? spot : shade(body, 0.78);
  const pregnant = d.state === 'pregnant';

  // Patas traseras (lejanas, más oscuras)
  const sw = walking ? Math.sin(phase) * 0.55 : 0;
  leg(bx - rx * 0.55 + 4, by + 2, 0, -sw, shade(body, 0.80), shape, legH);
  leg(bx + rx * 0.55 + 4, by + 2, 0, sw, shade(body, 0.80), shape, legH);

  // Cola (detrás del cuerpo)
  tail(bx - rx * 0.92, by - ry * 0.25, shape, body, earCol, t, d, walking);

  // Cuerpo
  ell(bx, by, rx, ry * (pregnant ? 1.12 : 1));
  paint(body);
  if (detail()) {
    // Panza clara
    c.save(); ell(bx, by, rx, ry * (pregnant ? 1.12 : 1)); c.clip();
    ell(bx + 3, by + ry * 0.85, rx * 0.7, ry * 0.42); c.fillStyle = mix(body, '#ffffff', 0.22); c.fill();
    // Manchas
    if (shape.dots) {
      c.fillStyle = spot || '#1a1814';
      [[-0.5, -0.3, 3], [0.1, -0.5, 2.4], [0.4, 0.1, 2.8], [-0.2, 0.25, 2.2], [0.7, -0.35, 2]].forEach(([u, v, s]) => {
        circ(bx + rx * u, by + ry * v, s); c.fill();
      });
    } else if (shape.stars) {
      c.fillStyle = spot || '#fbbf24';
      [[-0.45, -0.3], [0.2, -0.45], [0.35, 0.15]].forEach(([u, v]) => { star(bx + rx * u, by + ry * v, 3.6, 1.6); c.fill(); });
    } else if (spot) {
      ell(bx - rx * 0.25, by - ry * 0.45, rx * 0.55, ry * 0.55, -0.2); c.fillStyle = spot; c.fill();
    }
    // Brillo de papel
    ell(bx - rx * 0.35, by - ry * 0.55, rx * 0.35, ry * 0.18, -0.2); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill();
    c.restore();
    if (shape.fluffy) {
      c.fillStyle = light;
      for (let i = -2; i <= 2; i++) { circ(bx + i * rx * 0.38, by - ry * 0.85, 3.4); c.fill(); }
    }
  }

  // Patas delanteras (cercanas)
  leg(bx - rx * 0.55, by + 2, 0, sw, body, shape, legH);
  leg(bx + rx * 0.55, by + 2, 0, -sw, body, shape, legH);

  // Cabezas extra (Cerbero)
  if (shape.heads === 3) {
    head(hx - 9, hy - 6, r * 0.82, shape, body, earCol, light, t, d, true);
    head(hx - 4, hy + 6, r * 0.86, shape, body, earCol, light, t, d, true);
  }
  head(hx, hy, r, shape, body, earCol, light, t, d, false);

  // Collar (color de rareza) en la base de la cabeza
  const nx = hx - r * 0.38, ny = hy + r * 0.78;
  c.save(); c.translate(nx, ny); c.rotate(0.75);
  roundRect(-r * 0.5, -3.2, r * 1.0, 6.4, 3.2);
  paint(RARITY_COLOR[d.rarity] || '#e04848');
  c.restore();
  if (detail()) {
    circ(nx + 3, ny + 4.5, 3); c.fillStyle = '#ffd34d'; c.fill();
    c.strokeStyle = '#b8860b'; c.lineWidth = 0.9; c.stroke();
  }
}

function leg (x, top, _unused, swing, color, shape, legH) {
  const len = Math.max(2, -top);
  c.save();
  c.translate(x, top);
  c.rotate(swing);
  roundRect(-3.2, -2, 6.4, len + 2, 3);
  paint(color);
  // patita
  ell(1.2, len, 4.4, 2.6);
  paint(shape.fluffy ? mix(color, '#ffffff', 0.4) : shade(color, 1.08));
  c.restore();
}

function tail (tx, ty, shape, body, earCol, t, d, walking) {
  const happy = walking || d.happiness > 60;
  const wag = happy ? Math.sin(t * 14 + (d.id || 0)) * 0.45 : Math.sin(t * 2) * 0.1;
  c.save();
  c.translate(tx, ty);
  c.rotate(wag);
  if (shape.tail === 'curl') {
    c.beginPath(); c.arc(-3, -7, 6, Math.PI * 0.2, Math.PI * 1.85); strokeLine(body, 5);
  } else if (shape.tail === 'puff') {
    circ(-6, -8, 7); paint(mix(body, '#ffffff', 0.25));
  } else if (shape.tail === 'short') {
    ell(-3, -3, 5, 3.5, -0.4); paint(body);
  } else if (shape.tail === 'thin') {
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -4, -14, -16); strokeLine(body, 2.6);
  } else {
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-12, -2, -16, -16); strokeLine(body, 5);
    if (detail()) { circ(-16, -16, 2.6); c.fillStyle = mix(body, '#ffffff', 0.4); c.fill(); }
  }
  c.restore();
}

function head (hx, hy, r, shape, body, earCol, light, t, d, extra) {
  const happy = d.happiness > 80;
  const sleeping = d.state === 'resting';
  // Oreja lejana (detrás)
  if (shape.ears === 'point' || shape.ears === 'big') {
    const big = shape.ears === 'big' ? 1.35 : 1;
    c.beginPath();
    c.moveTo(hx - r * 0.05, hy - r * 0.7);
    c.lineTo(hx + r * 0.25 + 3, hy - r * (1.35 * big) - 2);
    c.lineTo(hx + r * 0.55, hy - r * 0.55);
    c.closePath();
    paint(shade(earCol, 0.85));
  }

  // Cráneo
  circ(hx, hy, r);
  paint(body);

  // Máscara (husky, shiba, akita, border, lobo): parte baja de la cara clara
  if (detail() && shape.mask) {
    c.save(); circ(hx, hy, r); c.clip();
    ell(hx + r * 0.45, hy + r * 0.55, r * 0.95, r * 0.6, -0.3);
    c.fillStyle = mix(body, '#ffffff', 0.75); c.fill();
    c.restore();
  }

  // Hocico
  const sn = shape.snout;
  ell(hx + r * (0.62 + sn * 0.18), hy + r * 0.3, r * (0.42 + sn * 0.12), r * 0.36);
  paint(shape.mask ? mix(body, '#ffffff', 0.75) : light);

  // Oreja cercana
  if (shape.ears === 'point' || shape.ears === 'big') {
    const big = shape.ears === 'big' ? 1.35 : 1;
    c.beginPath();
    c.moveTo(hx - r * 0.65, hy - r * 0.55);
    c.lineTo(hx - r * 0.42, hy - r * (1.5 * big) - 3);
    c.lineTo(hx + r * 0.1, hy - r * 0.82);
    c.closePath();
    paint(earCol);
    if (detail()) {
      c.beginPath();
      c.moveTo(hx - r * 0.48, hy - r * 0.68);
      c.lineTo(hx - r * 0.40, hy - r * (1.25 * big) - 2);
      c.lineTo(hx - r * 0.08, hy - r * 0.82);
      c.closePath(); c.fillStyle = '#ffa3bd'; c.fill();
    }
  } else if (shape.ears === 'flop') {
    ell(hx - r * 0.42, hy + r * 0.05, r * 0.36, r * 0.72, 0.35);
    paint(earCol);
  } else if (shape.ears === 'fluff') {
    circ(hx - r * 0.45, hy + r * 0.1, r * 0.5);
    paint(light);
    circ(hx - r * 0.1, hy - r * 0.95, r * 0.45);
    paint(light);
  }

  // Corona dorada (Áurodog)
  if (shape.crown && !extra) {
    c.beginPath();
    const cy = hy - r * 0.95;
    c.moveTo(hx - r * 0.4, cy + 2);
    c.lineTo(hx - r * 0.45, cy - 6); c.lineTo(hx - r * 0.18, cy - 2);
    c.lineTo(hx + r * 0.02, cy - 9); c.lineTo(hx + r * 0.22, cy - 2);
    c.lineTo(hx + r * 0.48, cy - 6); c.lineTo(hx + r * 0.42, cy + 2);
    c.closePath();
    paint('#ffd34d');
  }
  // Antena (Cyberdog)
  if (shape.robot && !extra) {
    c.beginPath(); c.moveTo(hx, hy - r); c.lineTo(hx - 2, hy - r - 9); strokeLine('#9aa3b5', 1.8);
    circ(hx - 2, hy - r - 10, 2.4); paint('#ff5a5a');
  }

  if (!detail()) return;

  // Nariz
  ell(hx + r * (1.0 + sn * 0.22), hy + r * 0.16, r * 0.17, r * 0.13);
  c.fillStyle = '#1d1622'; c.fill();
  circ(hx + r * (0.96 + sn * 0.22), hy + r * 0.11, r * 0.05); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();

  // Boca
  c.strokeStyle = '#1d1622'; c.lineWidth = 1.1; c.lineCap = 'round';
  if (happy && !sleeping) {
    c.beginPath();
    c.moveTo(hx + r * 0.45, hy + r * 0.48);
    c.quadraticCurveTo(hx + r * 0.72, hy + r * 0.85, hx + r * 0.98, hy + r * 0.5);
    c.closePath();
    c.fillStyle = '#7a2238'; c.fill();
    ell(hx + r * 0.72, hy + r * 0.7, r * 0.14, r * 0.1); c.fillStyle = '#ff7b95'; c.fill();
  } else {
    c.beginPath();
    c.moveTo(hx + r * 0.5, hy + r * 0.52);
    c.quadraticCurveTo(hx + r * 0.68, hy + r * 0.64, hx + r * 0.84, hy + r * 0.5);
    c.stroke();
  }

  // Ojo (óvalo negro con brillo, estilo Paper Mario)
  const ex = hx + r * 0.3, ey = hy - r * 0.18;
  const blinkPhase = (t * 0.7 + (d.id || 0) * 0.37) % 3.5;
  const blink = sleeping ? 0.08 : blinkPhase < 0.12 ? 0.12 : 1;
  if (shape.robot) {
    roundRect(ex - r * 0.35, ey - r * 0.16, r * 0.8, r * 0.32, r * 0.15);
    c.fillStyle = '#22e3ff'; c.fill();
  } else {
    if (shape.glowEye) {
      const g = c.createRadialGradient(ex, ey, 0, ex, ey, r * 0.5);
      g.addColorStop(0, shape.glowEye + 'cc'); g.addColorStop(1, shape.glowEye + '00');
      c.fillStyle = g; circ(ex, ey, r * 0.5); c.fill();
    }
    ell(ex, ey, r * 0.15, r * 0.27 * blink);
    c.fillStyle = '#16121e'; c.fill();
    if (blink > 0.5) {
      circ(ex + r * 0.04, ey - r * 0.12, r * 0.065); c.fillStyle = '#ffffff'; c.fill();
    }
  }
  // Mejilla
  ell(hx + r * 0.15, hy + r * 0.38, r * 0.2, r * 0.12);
  c.fillStyle = 'rgba(255,120,150,0.45)'; c.fill();

  // Bigote de veterano
  if (d.age === 'veteran') {
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(hx + r * 0.85, hy + r * 0.38); c.lineTo(hx + r * 1.3, hy + r * 0.3);
    c.moveTo(hx + r * 0.85, hy + r * 0.48); c.lineTo(hx + r * 1.3, hy + r * 0.55);
    c.stroke();
  }
}

// ---- emotes (bocadillos tipo Paper Mario) -----------------------
function drawEmote (ctx, d, t, shape) {
  let icon = null, col = '#ffffff';
  if (d.state === 'pregnant') icon = '💗';
  else if (d.state === 'resting') icon = 'Zz';
  else if (d.hunger < 25) icon = '🦴';
  else if (d.happiness > 85 && Math.sin(t * 0.7 + (d.id || 0)) > 0.6) icon = '♥';
  if (!icon && d.state !== 'pregnant') return;

  const y = -62 * shape.hMul - Math.sin(t * 3 + (d.id || 0)) * 2;
  const x = 10;
  ctx.save();
  // Bocadillo
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2d2748';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 4, y + 8); ctx.lineTo(x - 7, y + 15); ctx.lineTo(x + 1, y + 9); ctx.closePath(); ctx.fill();
  ctx.font = '900 11px "Arial Rounded MT Bold", Trebuchet MS, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = icon === '♥' ? '#ec4f7c' : icon === 'Zz' ? '#5b6bd6' : '#2d2748';
  ctx.fillText(icon, x, y + 0.5);
  ctx.restore();

  // Barra de embarazo
  if (d.state === 'pregnant') {
    const ratio = 1 - Math.max(0, (d.pregnancyUntil - performance.now())) / Math.max(1, d.pregnancyTotal);
    ctx.fillStyle = '#2d2748';
    roundRectOn(ctx, -16, y - 22, 32, 7, 3.5); ctx.fill();
    ctx.fillStyle = '#ff6fa8';
    roundRectOn(ctx, -15, y - 21, 30 * Math.max(0.05, ratio), 5, 2.5); ctx.fill();
  }
}

function drawFightCloud (ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (let i = 0; i < 7; i++) {
    const a = t * 6 + i * 0.9;
    const rr = 12 + Math.sin(t * 10 + i) * 3;
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e8e4f0';
    ctx.strokeStyle = '#2d2748'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 16, Math.sin(a) * 9, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#ffd34d';
  for (let i = 0; i < 3; i++) {
    const a = -t * 5 + i * 2.1;
    c = ctx; star(Math.cos(a) * 26, Math.sin(a) * 14 - 6, 5, 2.2); ctx.fill();
  }
  ctx.restore();
}

// ---- retratos para cartas (canvas → dataURL, cacheado) ----------
const _portraits = new Map();
export function dogPortrait (d, { size = 112, silhouette = false } = {}) {
  const key = [d.breed, d._customBody || '', d._customSpot ?? '', d.rarity, d.age, size, silhouette ? 's' : ''].join('|');
  const hit = _portraits.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d');
  const scale = size / 84 * (d.age === 'baby' ? 0.85 : 1);
  ctx.translate(size * 0.52, size * 0.9);
  ctx.scale(scale, scale);
  // sombrita
  ctx.fillStyle = 'rgba(30,20,60,0.22)';
  ctx.beginPath(); ctx.ellipse(2, 0, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
  drawDogFigure(ctx, { ...d, state: 'idle', happiness: 90, hunger: 100, id: 3 }, { t: 0.4, flip: 1, silhouette });
  const url = cv.toDataURL();
  _portraits.set(key, url);
  return url;
}

// ---- helpers ----------------------------------------------------
function roundRect (x, y, w, h, r) { roundRectOn(c, x, y, w, h, r); }
function roundRectOn (ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function star (x, y, R, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = i % 2 ? r : R;
    c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
}

function hexToRgb (hex) {
  const v = parseInt((hex || '#888888').slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function toHex ([r, g, b]) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
export function shade (hex, f) {
  if (!hex || hex[0] !== '#') return hex;
  const [r, g, b] = hexToRgb(hex);
  // Oscurece hacia un violeta (sombras de Paper Mario no son grises)
  if (f < 1) return toHex([r * f + 30 * (1 - f), g * f + 18 * (1 - f), b * f + 60 * (1 - f)]);
  return toHex([r * f, g * f, b * f]);
}
export function mix (a, b, k) {
  if (!a || a[0] !== '#') return a;
  const A = hexToRgb(a), B = hexToRgb(b);
  return toHex([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k]);
}
