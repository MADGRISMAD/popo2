// ============================================================
// data/upgrades.js — Mejoras de perro (productividad, hambre, etc.).
// Cada mejora tiene niveles con costos crecientes.
// ============================================================

export const UPGRADES = [
  {
    id: 'production',
    name: 'Productividad canina',
    desc: 'Aumenta la producción base de popó de todos los perros.',
    icon: '⚡', maxLevel: 25,
    cost: lvl => Math.floor(50 * Math.pow(1.55, lvl)),
    effect: lvl => 1 + lvl * 0.10,
  },
  {
    id: 'magnet',
    name: 'Imán de popó',
    desc: 'Recolecta popós cercanas al cursor automáticamente.',
    icon: '🧲', maxLevel: 12,
    cost: lvl => Math.floor(80 * Math.pow(1.7, lvl)),
    effect: lvl => lvl * 22,        // radio en px
  },
  {
    id: 'value',
    name: 'Popó valiosa',
    desc: 'Cada popó vale más al recolectarse.',
    icon: '💰', maxLevel: 20,
    cost: lvl => Math.floor(110 * Math.pow(1.6, lvl)),
    effect: lvl => 1 + lvl * 0.15,
  },
  {
    id: 'happy',
    name: 'Parque feliz',
    desc: 'Los perros pierden menos felicidad con el tiempo.',
    icon: '😊', maxLevel: 10,
    cost: lvl => Math.floor(140 * Math.pow(1.65, lvl)),
    effect: lvl => Math.max(0.4, 1 - lvl * 0.06),
  },
  {
    id: 'hunger',
    name: 'Estómago grande',
    desc: 'Los perros tardan más en tener hambre.',
    icon: '🍖', maxLevel: 10,
    cost: lvl => Math.floor(160 * Math.pow(1.65, lvl)),
    effect: lvl => Math.max(0.4, 1 - lvl * 0.06),
  },
  {
    id: 'goldenchance',
    name: 'Suerte dorada',
    desc: 'Aumenta la probabilidad de popós doradas.',
    icon: '✨', maxLevel: 10,
    cost: lvl => Math.floor(220 * Math.pow(1.7, lvl)),
    effect: lvl => 0.05 + lvl * 0.015,
  },
];

export const UPGRADES_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
