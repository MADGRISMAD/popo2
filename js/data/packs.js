// ============================================================
// data/packs.js — Sobres del juego.
// Solo 3 tipos: comida, perros, legendario.
// Cada uno define probabilidades de las distintas categorías.
// ============================================================

export const PACK_TYPES = [
  {
    id: 'food',
    name: 'Sobre de Comida',
    desc: 'Comida, suministros y algún perro común.',
    icon: '📦',
    cost: 30, costType: 'poop',
    rarityWeights: { comun: 80, raro: 16, epico: 3, legend: 1, mitico: 0,   cosmico: 0 },
    drops: { food: 65, dog: 10, upgrade: 5, parkObject: 5, automation: 2, geneticCard: 2, breedCard: 1, special: 0, foodBowlUp: 10 },
    className: '',
  },
  {
    id: 'dog',
    name: 'Sobre de Perros',
    desc: 'Más probabilidad de perros y cartas genéticas.',
    icon: '🎁',
    cost: 80, costType: 'poop',
    rarityWeights: { comun: 55, raro: 28, epico: 11, legend: 5, mitico: 1,   cosmico: 0 },
    drops: { food: 18, dog: 50, upgrade: 6, parkObject: 6, automation: 3, geneticCard: 8, breedCard: 5, special: 1, foodBowlUp: 3 },
    className: 'gold',
  },
  {
    id: 'legend',
    name: 'Sobre Legendario',
    desc: 'Garantiza al menos un perro raro+. Mayor chance de míticos.',
    icon: '🌟',
    cost: 250, costType: 'poop',
    rarityWeights: { comun: 25, raro: 35, epico: 24, legend: 12, mitico: 3,  cosmico: 1 },
    drops: { food: 8, dog: 60, upgrade: 5, parkObject: 5, automation: 3, geneticCard: 9, breedCard: 6, special: 4, foodBowlUp: 0 },
    className: 'legendary',
  },
];

export const PACKS_BY_ID = Object.fromEntries(PACK_TYPES.map(p => [p.id, p]));
