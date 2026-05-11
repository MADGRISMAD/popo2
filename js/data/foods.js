// ============================================================
// data/foods.js — Platillos del juego.
// Efectos:
//   digest        → +15% producción 30s
//   speed         → +20% velocidad 30s
//   productive    → +25% producción 30s
//   productive2   → +35% producción 60s
//   breed_boost   → −20% duración embarazo si la madre come esto
//   quality_chance→ +15% calidad heredada al criar
//   mutate        → +50% probabilidad mutación al criar
//   grow          → bebés crecen 30% más rápido durante 60s
// ============================================================

export const FOODS = [
  { id: 'croquetas',  name: 'Croquetas básicas',     icon: '🥣', cost: 5,    hunger: 18, happiness: 1,  effect: null,             tier: 1 },
  { id: 'lata',       name: 'Lata sabrosa',          icon: '🥫', cost: 14,   hunger: 30, happiness: 5,  effect: 'happy',          tier: 1 },
  { id: 'snack',      name: 'Snack digestivo',       icon: '🍪', cost: 22,   hunger: 14, happiness: 8,  effect: 'digest',         tier: 2 },
  { id: 'hueso',      name: 'Hueso energético',      icon: '🦴', cost: 40,   hunger: 25, happiness: 6,  effect: 'speed',          tier: 2 },
  { id: 'premium',    name: 'Comida premium',        icon: '🍖', cost: 90,   hunger: 50, happiness: 12, effect: 'productive',     tier: 3 },
  { id: 'banquete',   name: 'Banquete canino',       icon: '🍱', cost: 180,  hunger: 80, happiness: 20, effect: 'productive2',    tier: 3 },
  { id: 'crianza',    name: 'Platillo de crianza',   icon: '💗', cost: 320,  hunger: 30, happiness: 25, effect: 'breed_boost',    tier: 4 },
  { id: 'genetico',   name: 'Platillo genético',     icon: '🧬', cost: 600,  hunger: 30, happiness: 15, effect: 'quality_chance', tier: 4 },
  { id: 'mutante',    name: 'Platillo mutante',      icon: '☢️', cost: 950,  hunger: 30, happiness: 10, effect: 'mutate',         tier: 5 },
  { id: 'crecimiento',name: 'Platillo de crecimiento', icon: '🌱', cost: 240, hunger: 20, happiness: 10, effect: 'grow',         tier: 4 },
];

export const FOODS_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]));

export const FOOD_EFFECT_DESC = {
  null:           'Sin efecto especial.',
  happy:          '+5 felicidad bonus.',
  digest:         '+15% producción durante 30s.',
  speed:          '+20% velocidad durante 30s.',
  productive:     '+25% producción durante 30s.',
  productive2:    '+35% producción durante 60s.',
  breed_boost:    '−20% duración del próximo embarazo.',
  quality_chance: '+15% probabilidad de calidad alta al cría.',
  mutate:         '+50% probabilidad de mutación al criar.',
  grow:           'Bebés crecen 30% más rápido por 60s.',
};
