// ============================================================
// data/prestige.js — Renombre Canino.
// Reset suave: el jugador conserva colección y gana puntos
// que dan bonus permanentes.
// ============================================================

export const PRESTIGE = {
  id: 'renombre',
  name: 'Renombre Canino',
  desc: 'Reinicia tu progreso a cambio de Puntos de Renombre que otorgan bonus permanentes.',
  // popó total acumulada para poder hacer prestigio
  costThreshold: 100_000,
  pointsFor (totalLifetimePoop) {
    return Math.floor(Math.cbrt(totalLifetimePoop / 1000));
  },
  bonusPerPoint: {
    prodMult: 0.05,    // +5% por punto
    pickValue: 0.04,   // +4%
    luck: 0.02,        // +2%
  },
};
