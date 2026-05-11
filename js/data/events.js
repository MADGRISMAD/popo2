// ============================================================
// data/events.js — Eventos grandes que aparecen aleatoriamente.
// Ej: "Lluvia dorada", "Día festivo", "Plaga de pulgas".
// ============================================================

export const EVENTS = [
  {
    id: 'rain_gold',
    name: 'Lluvia Dorada',
    desc: '+200% probabilidad de popó dorada por 60s.',
    icon: '✨', durationMs: 60_000, weight: 30,
    apply: { goldenChance: 3.0, valueMult: 1.0 },
  },
  {
    id: 'pack_weekend',
    name: 'Fin de semana de sobres',
    desc: 'Costo de sobres −30% por 90s.',
    icon: '🎁', durationMs: 90_000, weight: 25,
    apply: { packCost: 0.7 },
  },
  {
    id: 'festival',
    name: 'Festival canino',
    desc: '+50% felicidad pasiva, +25% producción por 60s.',
    icon: '🎉', durationMs: 60_000, weight: 25,
    apply: { happiness: 1.5, prodMult: 1.25 },
  },
  {
    id: 'famine',
    name: 'Hambruna leve',
    desc: 'Hambre baja 50% más rápido por 45s.',
    icon: '🍖', durationMs: 45_000, weight: 12,
    apply: { hungerDecay: 1.5 },
  },
  {
    id: 'breeze',
    name: 'Brisa fresca',
    desc: '+15% velocidad a todos los perros por 60s.',
    icon: '🍃', durationMs: 60_000, weight: 8,
    apply: { speedMult: 1.15 },
  },
];

export const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
