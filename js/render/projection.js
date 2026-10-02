// ============================================================
// render/projection.js — "escenario" estilo Paper Mario.
// La lógica del juego sigue en coordenadas de mundo (1080x720,
// vista desde arriba). Aquí se proyectan a una vista lateral en
// perspectiva: el fondo (y=0) queda arriba y pequeño, el frente
// (y=720) abajo y grande. Todo el render y el input pasan por aquí.
// ============================================================

import { PARK } from '../config.js';

export const HORIZON = 232;               // y de pantalla donde empieza el suelo
const GROUND_H = PARK.H - HORIZON;        // alto del suelo en pantalla
const CX = PARK.W / 2;
const BACK_SCALE = 0.58;                  // tamaño de los objetos al fondo
const BACK_WIDTH = 0.80;                  // ancho del suelo al fondo (trapecio)

// Escala de los objetos según profundidad (y de mundo)
export function depthScale (y) {
  const k = Math.max(0, Math.min(1, y / PARK.H));
  return BACK_SCALE + (1 - BACK_SCALE) * k;
}

function widthScale (y) {
  const k = Math.max(0, Math.min(1, y / PARK.H));
  return BACK_WIDTH + (1 - BACK_WIDTH) * k;
}

// Mundo -> pantalla
export function project (x, y) {
  return {
    x: CX + (x - CX) * widthScale(y),
    y: HORIZON + y * (GROUND_H / PARK.H),
    s: depthScale(y),
  };
}

// Pantalla -> mundo (para el cursor)
export function unproject (sx, sy) {
  const y = (sy - HORIZON) * (PARK.H / GROUND_H);
  const x = CX + (sx - CX) / widthScale(y);
  return { x, y };
}

// Mundo -> porcentaje del overlay HTML (para etiquetas flotantes)
export function toOverlayPct (x, y, liftPx = 0) {
  const p = project(x, y);
  return {
    left: (p.x / PARK.W) * 100,
    top: ((p.y - liftPx * p.s) / PARK.H) * 100,
  };
}
