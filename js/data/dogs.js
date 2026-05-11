// ============================================================
// data/dogs.js — Catálogo base de razas.
// Stats por raza (rangos 1–10):
//   cago   = Cagonería  (cuánta popó produce)
//   come   = Comelonería (cuánta hambre consume)
//   vel    = Velocidad   (movimiento + llegada a platos)
//   pelea  = Peleonería  (tendencia a iniciar peleas)
// ============================================================

export const RARITIES = [
  { id: 'comun',   name: 'Común',     weight: 1000, mult: 1.0,  className: 'r-comun' },
  { id: 'raro',    name: 'Raro',      weight:  300, mult: 1.6,  className: 'r-raro' },
  { id: 'epico',   name: 'Épico',     weight:   90, mult: 2.5,  className: 'r-epico' },
  { id: 'legend',  name: 'Legendario',weight:   22, mult: 4.5,  className: 'r-legend' },
  { id: 'mitico',  name: 'Mítico',    weight:    6, mult: 8.0,  className: 'r-mitico' },
  { id: 'cosmico', name: 'Cósmico',   weight:    1, mult: 16.0, className: 'r-cosmico' },
];

export const QUALITIES = [
  { id: 'gris',    name: 'Gris',    mult: 1.00, className: 'q-gris' },
  { id: 'verde',   name: 'Verde',   mult: 1.10, className: 'q-verde' },
  { id: 'azul',    name: 'Azul',    mult: 1.25, className: 'q-azul' },
  { id: 'morado',  name: 'Morado',  mult: 1.45, className: 'q-morado' },
  { id: 'dorado',  name: 'Dorado',  mult: 1.75, className: 'q-dorado' },
  { id: 'rojo',    name: 'Rojo',    mult: 2.10, className: 'q-rojo' },
  { id: 'cosmico', name: 'Cósmico', mult: 2.75, className: 'q-cosmico' },
];

export const QUALITY_INDEX = Object.fromEntries(QUALITIES.map((q, i) => [q.id, i]));

export const BREEDS = [
  // ---------- COMUNES ----------
  { id: 'callejero', name: 'Callejero',     rarity: 'comun', produce: 1.0, body: '#a08361', spot: '#5e4a30', baseSpeed: 1.0, cago: 4, come: 5, vel: 6, pelea: 6 },
  { id: 'beagle',    name: 'Beagle',        rarity: 'comun', produce: 1.1, body: '#d8b27d', spot: '#3a2410', baseSpeed: 1.1, cago: 5, come: 4, vel: 7, pelea: 4 },
  { id: 'labrador',  name: 'Labrador',      rarity: 'comun', produce: 1.2, body: '#e9d29a', spot: null,      baseSpeed: 1.0, cago: 6, come: 7, vel: 6, pelea: 3 },
  { id: 'pug',       name: 'Pug',           rarity: 'comun', produce: 0.9, body: '#e2c79b', spot: '#1a1409', baseSpeed: 0.7, cago: 4, come: 7, vel: 3, pelea: 3 },
  { id: 'chihuahua', name: 'Chihuahua',     rarity: 'comun', produce: 0.8, body: '#c69561', spot: '#5a3a1a', baseSpeed: 1.4, cago: 3, come: 2, vel: 9, pelea: 8 },
  { id: 'bulldog',   name: 'Bulldog',       rarity: 'comun', produce: 1.0, body: '#d9b08c', spot: '#5b3a1c', baseSpeed: 0.7, cago: 5, come: 8, vel: 3, pelea: 7 },
  { id: 'corgi',     name: 'Corgi',         rarity: 'comun', produce: 1.1, body: '#d18a4a', spot: '#fff5e0', baseSpeed: 0.9, cago: 5, come: 6, vel: 6, pelea: 4 },
  { id: 'poodle',    name: 'Poodle',        rarity: 'comun', produce: 1.0, body: '#f3eee5', spot: null,      baseSpeed: 1.1, cago: 4, come: 5, vel: 7, pelea: 3 },
  // ---------- RAROS ----------
  { id: 'husky',     name: 'Husky',         rarity: 'raro',  produce: 1.5, body: '#e8edf2', spot: '#2c2c34', baseSpeed: 1.3, cago: 6, come: 8, vel: 9, pelea: 5 },
  { id: 'pastor',    name: 'Pastor Alemán', rarity: 'raro',  produce: 1.7, body: '#8c5a2c', spot: '#1a1207', baseSpeed: 1.2, cago: 7, come: 7, vel: 8, pelea: 5 },
  { id: 'dalmata',   name: 'Dálmata',       rarity: 'raro',  produce: 1.4, body: '#f3eee5', spot: '#1a1814', baseSpeed: 1.2, cago: 6, come: 6, vel: 8, pelea: 4 },
  { id: 'border',    name: 'Border Collie', rarity: 'raro',  produce: 1.6, body: '#1a1814', spot: '#f3eee5', baseSpeed: 1.5, cago: 6, come: 5, vel: 9, pelea: 3 },
  { id: 'golden',    name: 'Golden Retriever', rarity: 'raro', produce: 1.7, body: '#e7c47b', spot: null,    baseSpeed: 1.1, cago: 7, come: 7, vel: 7, pelea: 2 },
  { id: 'gran_danes',name: 'Gran Danés',    rarity: 'raro',  produce: 1.8, body: '#d3c8b5', spot: '#3b2c1c', baseSpeed: 1.1, cago: 8, come: 9, vel: 6, pelea: 5 },
  // ---------- ÉPICOS ----------
  { id: 'shiba',     name: 'Shiba Inu',     rarity: 'epico', produce: 2.2, body: '#d97e2c', spot: '#fff5e0', baseSpeed: 1.3, cago: 7, come: 5, vel: 8, pelea: 4 },
  { id: 'akita',     name: 'Akita',         rarity: 'epico', produce: 2.4, body: '#c98a3a', spot: '#fff8ec', baseSpeed: 1.1, cago: 8, come: 6, vel: 7, pelea: 5 },
  { id: 'samoyedo',  name: 'Samoyedo',      rarity: 'epico', produce: 2.3, body: '#f8f5ec', spot: null,      baseSpeed: 1.2, cago: 7, come: 7, vel: 8, pelea: 2 },
  // ---------- LEGENDARIOS ----------
  { id: 'aurodog',   name: 'Áurodog',       rarity: 'legend',produce: 4.5, body: '#fbbf24', spot: '#92400e', baseSpeed: 1.4, cago: 9, come: 5, vel: 8, pelea: 3 },
  { id: 'lobo',      name: 'Lobo Real',     rarity: 'legend',produce: 4.2, body: '#5d6470', spot: '#1d212a', baseSpeed: 1.7, cago: 8, come: 8, vel: 10, pelea: 7 },
  { id: 'mecanico',  name: 'Cyberdog',      rarity: 'legend',produce: 5.0, body: '#34d6e8', spot: '#1d2940', baseSpeed: 1.5, cago: 10, come: 3, vel: 9, pelea: 4 },
  // ---------- MÍTICOS ----------
  { id: 'fenrir',    name: 'Fenrir',        rarity: 'mitico',produce: 8.5, body: '#9333ea', spot: '#1f0a3c', baseSpeed: 1.6, cago: 10, come: 7, vel: 9, pelea: 8 },
  { id: 'cerbero',   name: 'Cerbero',       rarity: 'mitico',produce: 9.0, body: '#dc2626', spot: '#1c0606', baseSpeed: 1.5, cago: 10, come: 8, vel: 8, pelea: 9 },
  // ---------- CÓSMICOS ----------
  { id: 'estelar',   name: 'Can Estelar',   rarity: 'cosmico',produce: 16.0, body: '#ec4899', spot: '#fbbf24', baseSpeed: 1.5, cago: 10, come: 4, vel: 9, pelea: 1 },
];

export const BREEDS_BY_ID    = Object.fromEntries(BREEDS.map(b => [b.id, b]));
export const RARITIES_BY_ID  = Object.fromEntries(RARITIES.map(r => [r.id, r]));
export const QUALITIES_BY_ID = Object.fromEntries(QUALITIES.map(q => [q.id, q]));

export function breedsByRarity (rarityId) {
  return BREEDS.filter(b => b.rarity === rarityId);
}

// Etiquetas legibles para los stats principales
export const STAT_LABELS = {
  cago:  'Cagonería',
  come:  'Comelonería',
  vel:   'Velocidad',
  pelea: 'Peleonería',
};
