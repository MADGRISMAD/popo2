// ============================================================
// data/specializations.js — 4 estilos de parque.
// El jugador elige uno; otorga bonus permanentes al estilo.
// ============================================================

export const SPECIALIZATIONS = [
  {
    id: 'productivo',
    name: 'Parque Productivo',
    icon: '⚡',
    desc: 'Enfocado en producir más popó.',
    bonus: 'Producción +20% · Valor de pick +15% · Imán +10px',
    apply: { prodMult: 1.20, pickValue: 1.15, magnetExtra: 10 },
  },
  {
    id: 'criadero',
    name: 'Parque Criadero',
    icon: '💗',
    desc: 'Enfocado en genética y crianza.',
    bonus: 'Embarazos −25% · Bebés crecen +30% · Calidad alta más probable',
    apply: { pregnancyMult: 0.75, babyGrow: 1.30, qualityBoost: 1 },
  },
  {
    id: 'lujo',
    name: 'Parque de Lujo',
    icon: '✨',
    desc: 'Enfocado en felicidad.',
    bonus: 'Decay felicidad −40% · Visitantes pagan +50% · Peleas −50%',
    apply: { happyDecay: 0.60, tipMult: 1.50, fightMult: 0.50 },
  },
  {
    id: 'cientifico',
    name: 'Parque Científico',
    icon: '🔬',
    desc: 'Enfocado en mutaciones y traits.',
    bonus: 'Mutaciones ×2 · Traits +1 al criar · Suerte +20%',
    apply: { mutationMult: 2.0, extraTrait: 1, luck: 1.20 },
  },
];

export const SPECIALIZATIONS_BY_ID = Object.fromEntries(SPECIALIZATIONS.map(s => [s.id, s]));
