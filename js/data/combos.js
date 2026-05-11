// ============================================================
// data/combos.js — Combos ocultos que el jugador descubre.
// El sistema comprueba estado del parque cada cierto tiempo.
// ============================================================

export const HIDDEN_COMBOS = [
  {
    id: 'pack_3',
    name: 'Manada unida',
    desc: '3 perros de la misma raza activos.',
    bonusDesc: '+10% producción global',
    bonus: { prodMult: 0.10 },
    check: ({ activeDogs }) => {
      const counts = {};
      for (const d of activeDogs) counts[d.breed] = (counts[d.breed] || 0) + 1;
      return Object.values(counts).some(n => n >= 3);
    },
  },
  {
    id: 'baby_3',
    name: 'Guardería Feliz',
    desc: '3 bebés al mismo tiempo en el parque.',
    bonusDesc: '+25% velocidad de crecimiento',
    bonus: { babyGrow: 1.25 },
    check: ({ activeDogs }) => activeDogs.filter(d => d.age === 'baby').length >= 3,
  },
  {
    id: 'pro_statue',
    name: 'Bendición Dorada',
    desc: 'Perro con trait Productor nato + Estatua Dorada.',
    bonusDesc: '+15% producción del Productor nato',
    bonus: { prodMult: 0.15 },
    check: ({ activeDogs, parkUpgrades }) =>
      (parkUpgrades.gold_statue || 0) > 0 && activeDogs.some(d => d.traits?.includes('productor')),
  },
  {
    id: 'speed_chaos',
    name: 'Husky + Chihuahua',
    desc: 'Husky y Chihuahua juntos en el parque.',
    bonusDesc: '+20% velocidad, pero +20% peleas',
    bonus: { speedMult: 1.20, fightMult: 1.20 },
    check: ({ activeDogs }) =>
      activeDogs.some(d => d.breed === 'husky') && activeDogs.some(d => d.breed === 'chihuahua'),
  },
  {
    id: 'spectral_lab',
    name: 'Espectro Científico',
    desc: 'Perro Fantasma + Zona Científica.',
    bonusDesc: 'Popó dorada ×2',
    bonus: { goldenChance: 2.0 },
    check: ({ activeDogs, parkUpgrades }) =>
      (parkUpgrades.science_zone || 0) > 0 && activeDogs.some(d => d.traits?.includes('fantasma')),
  },
  {
    id: 'royal_court',
    name: 'Corte Real',
    desc: 'Perro con trait Rey del parque y al menos 5 perros activos.',
    bonusDesc: '+20% producción global',
    bonus: { prodMult: 0.20 },
    check: ({ activeDogs }) =>
      activeDogs.length >= 5 && activeDogs.some(d => d.traits?.includes('rey')),
  },
  {
    id: 'breed_synergy',
    name: 'Linaje Perfecto',
    desc: 'Madre embarazada con comida de crianza y zona científica.',
    bonusDesc: '+1 trait extra al cría',
    bonus: { extraTrait: 1 },
    check: ({ activeDogs, parkUpgrades, bowls }) => {
      const hasZone = (parkUpgrades.science_zone || 0) > 0;
      const hasBowl = bowls.some(b => b.type === 'crianza' && b.qty > 0);
      const hasPreg = activeDogs.some(d => d.state === 'pregnant');
      return hasZone && hasBowl && hasPreg;
    },
  },
];

export const HIDDEN_COMBOS_BY_ID = Object.fromEntries(HIDDEN_COMBOS.map(c => [c.id, c]));
