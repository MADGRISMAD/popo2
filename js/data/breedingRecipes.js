// ============================================================
// data/breedingRecipes.js — Recetas de hibridación / mutación.
// Si los padres coinciden con una receta, hay una probabilidad de
// que el bebé sea el resultado especial en lugar de heredar raza
// normal.
// ============================================================

export const BREEDING_RECIPES = [
  // ---------- Híbridos clásicos ----------
  { id: 'h_labsky',     parents: ['labrador',  'husky'],     result: 'labsky',
    name: 'Labsky',          rarity: 'epico',  chance: 0.22, breedAlias: 'husky',
    body: '#e8d6a4', spot: '#2c2c34' },
  { id: 'h_pughuahua',  parents: ['pug',       'chihuahua'], result: 'pughuahua',
    name: 'Pughuahua',       rarity: 'raro',   chance: 0.20, breedAlias: 'pug',
    body: '#dcc090', spot: '#3a2410' },
  { id: 'h_bullcorgi',  parents: ['bulldog',   'corgi'],     result: 'bullcorgi',
    name: 'Bullcorgi',       rarity: 'raro',   chance: 0.20, breedAlias: 'corgi',
    body: '#d59661', spot: '#fff5e0' },
  { id: 'h_goldendoodle', parents: ['golden',  'poodle'],    result: 'goldendoodle',
    name: 'Goldendoodle',    rarity: 'epico',  chance: 0.22, breedAlias: 'golden',
    body: '#eed6a3', spot: null },
  { id: 'h_granchi',    parents: ['gran_danes','chihuahua'], result: 'granchi',
    name: 'Gran Chi',        rarity: 'epico',  chance: 0.18, breedAlias: 'gran_danes',
    body: '#d3c8b5', spot: '#5a3a1a' },
  { id: 'h_shibsky',    parents: ['shiba',     'husky'],     result: 'shibsky',
    name: 'Shibsky',         rarity: 'epico',  chance: 0.22, breedAlias: 'shiba',
    body: '#dba368', spot: '#2c2c34' },
  { id: 'h_pastorcollie', parents: ['pastor',  'border'],    result: 'pastorcollie',
    name: 'Pastor Collie',   rarity: 'epico',  chance: 0.22, breedAlias: 'pastor',
    body: '#8c5a2c', spot: '#f3eee5' },
  { id: 'h_pomky',      parents: ['husky',     'chihuahua'], result: 'pomky',
    name: 'Pomky',           rarity: 'epico',  chance: 0.20, breedAlias: 'husky',
    body: '#cfd6e0', spot: '#22272f' },
  { id: 'h_aurolobo',   parents: ['aurodog',   'lobo'],      result: 'aurolobo',
    name: 'Áurolobo',        rarity: 'mitico', chance: 0.30, breedAlias: 'lobo',
    body: '#fbbf24', spot: '#1d212a' },

  // ---------- Mutaciones por trait ----------
  { id: 'm_radioglow', requireTrait: 'radiactivo', result: 'radioglow', chance: 0.10,
    name: 'Radioglow', rarity: 'mitico', breedAlias: 'mecanico',
    body: '#a3e635', spot: '#1f3300', mutation: true },
  { id: 'm_spectral',  requireTrait: 'fantasma',   result: 'spectral',  chance: 0.12,
    name: 'Espectral', rarity: 'mitico', breedAlias: 'lobo',
    body: '#94a3b8', spot: '#0f172a', mutation: true },
];

export const BREEDING_RECIPES_BY_RESULT = Object.fromEntries(
  BREEDING_RECIPES.map(r => [r.result, r])
);

export function findRecipe (parentA, parentB) {
  for (const r of BREEDING_RECIPES) {
    if (!r.parents) continue;
    const a = r.parents[0], b = r.parents[1];
    if ((parentA.breed === a && parentB.breed === b) ||
        (parentA.breed === b && parentB.breed === a)) return r;
  }
  return null;
}

export function findMutation (parentA, parentB) {
  for (const r of BREEDING_RECIPES) {
    if (!r.requireTrait) continue;
    const aHas = parentA.traits?.includes(r.requireTrait);
    const bHas = parentB.traits?.includes(r.requireTrait);
    if (aHas || bHas) return r;
  }
  return null;
}
