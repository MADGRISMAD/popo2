// ============================================================
// data/parkObjects.js — Objetos colocables y mejoras de parque.
// Categorías: capacidad, platos, crianza, decoración, especiales.
// ============================================================

export const PARK_OBJECTS = [
  // ---------- Capacidad ----------
  { id: 'cap_basic',       cat: 'capacity', name: 'Caseta para perros', desc: '+2 capacidad del parque.',
    icon: '🏠', cost: 250,  max: 8, apply: (s) => { s.park.capacity += 2; } },
  { id: 'cap_pro',         cat: 'capacity', name: 'Caseta premium',      desc: '+4 capacidad del parque.',
    icon: '🏛️', cost: 1200, max: 6, apply: (s) => { s.park.capacity += 4; } },

  // ---------- Mejoras de plato ----------
  { id: 'bowl_extra',      cat: 'bowl', name: 'Plato extra',         desc: 'Añade un plato adicional al parque.',
    icon: '🥣', cost: 180,  max: 6, apply: () => null },
  { id: 'bowl_capacity',   cat: 'bowl', name: 'Plato amplio',        desc: '+5 capacidad de todos los platos.',
    icon: '🍱', cost: 400,  max: 5, apply: () => null },
  { id: 'bowl_double',     cat: 'bowl', name: 'Plato Doble',         desc: 'Dos perros pueden comer del mismo plato.',
    icon: '🍽️', cost: 700,  max: 3, apply: () => null },
  { id: 'bowl_premium',    cat: 'bowl', name: 'Plato Premium',       desc: 'Duración de efectos de comida ×1.5.',
    icon: '✨', cost: 1100, max: 3, apply: () => null },
  { id: 'auto_feeder',     cat: 'bowl', name: 'Comedero Automático', desc: 'Rellena platos automáticamente si hay comida.',
    icon: '🤖', cost: 1800, max: 2, apply: () => null },
  { id: 'chef_perruno',    cat: 'bowl', name: 'Chef Perruno',        desc: '−25% costo de comprar comida.',
    icon: '👨‍🍳', cost: 2200, max: 2, apply: () => null },

  // ---------- Crianza ----------
  { id: 'breed_zone',      cat: 'breed', name: 'Zona de Crianza',    desc: 'Permite emparejar perros para tener cachorros.',
    icon: '💗', cost: 700, max: 1, apply: (s) => { s.park.breedingZone = { x: 540, y: 360, level: 1 }; } },
  { id: 'breed_bed',       cat: 'breed', name: 'Cama de Crianza',    desc: '−20% duración de embarazo.',
    icon: '🛏️', cost: 1400, max: 3, apply: () => null },
  { id: 'baby_area',       cat: 'breed', name: 'Área de Cachorros',  desc: 'Bebés crecen 30% más rápido.',
    icon: '🍼', cost: 1100, max: 3, apply: () => null },
  { id: 'vet',             cat: 'breed', name: 'Veterinario Canino', desc: '−30% riesgo de traits negativos heredados.',
    icon: '🩺', cost: 1700, max: 2, apply: () => null },
  { id: 'lab_genetic',     cat: 'breed', name: 'Laboratorio Genético', desc: 'Muestra probabilidades exactas de cría.',
    icon: '🧪', cost: 2500, max: 1, apply: () => null },
  { id: 'collar_lineage',  cat: 'breed', name: 'Collar de Linaje',   desc: '+25% probabilidad de heredar traits positivos.',
    icon: '📿', cost: 2900, max: 2, apply: () => null },

  // ---------- Decoración / soporte ----------
  { id: 'bench',  cat: 'deco', name: 'Banca decorativa', desc: '+5% felicidad pasiva.',
    icon: '🪑', cost: 320, max: 4, apply: () => null },
  { id: 'tree',   cat: 'deco', name: 'Árbol con sombra', desc: 'Reduce decay de felicidad en perros activos.',
    icon: '🌳', cost: 380, max: 6, apply: () => null },

  // ---------- Funcionales ----------
  { id: 'fountain',     cat: 'fun', name: 'Fuente perruna',         desc: 'Mejora felicidad cercana.',
    icon: '⛲', cost: 700,  max: 2, apply: () => null },
  { id: 'agility',      cat: 'fun', name: 'Zona de Agility',        desc: '+10% velocidad global.',
    icon: '🏁', cost: 1300, max: 2, apply: () => null },
  { id: 'siesta',       cat: 'fun', name: 'Área de siesta',         desc: 'Reduce decay de felicidad.',
    icon: '😴', cost: 900,  max: 3, apply: () => null },
  { id: 'gold_statue',  cat: 'fun', name: 'Estatua del Perro Dorado', desc: '+10% producción global.',
    icon: '🗿', cost: 3200, max: 2, apply: () => null },
  { id: 'guarderia',    cat: 'fun', name: 'Guardería canina',       desc: 'Bebés comen el doble de rápido.',
    icon: '🧸', cost: 1500, max: 2, apply: () => null },
  { id: 'vip_zone',     cat: 'fun', name: 'Zona VIP',               desc: '+15% rareza media en sobres.',
    icon: '⭐', cost: 4000, max: 1, apply: () => null },
  { id: 'science_zone', cat: 'fun', name: 'Zona Científica',        desc: '+50% probabilidad de mutación al criar.',
    icon: '🔬', cost: 4500, max: 1, apply: () => null },

  // ---------- Recolectores / automatizaciones físicas ----------
  { id: 'col_bag',     cat: 'auto', name: 'Recolector de bolsas',     desc: 'Recoge popó cada 8s automáticamente.',
    icon: '🛍️', cost: 1200, max: 4, apply: () => null },
  { id: 'col_vacuum',  cat: 'auto', name: 'Aspiradora Popó 3000',     desc: 'Recoge mucha popó cada 30s.',
    icon: '🧹', cost: 4200, max: 2, apply: () => null },
  { id: 'col_walker',  cat: 'auto', name: 'Paseador robot',           desc: '+8% felicidad pasiva.',
    icon: '🤖', cost: 2100, max: 2, apply: () => null },
];

export const PARK_OBJECTS_BY_ID = Object.fromEntries(PARK_OBJECTS.map(o => [o.id, o]));

export const PARK_OBJECT_CATEGORIES = [
  { id: 'capacity', name: 'Capacidad' },
  { id: 'bowl',     name: 'Platos' },
  { id: 'breed',    name: 'Crianza' },
  { id: 'fun',      name: 'Funcional' },
  { id: 'deco',     name: 'Decoración' },
  { id: 'auto',     name: 'Automatización' },
];
