// ============================================================
// data/traits.js — Traits de perros (positivos, negativos, especiales).
// ============================================================

export const TRAITS = [
  // ---------- POSITIVOS ----------
  { id: 'productor',     name: 'Productor nato',      kind: 'pos', icon: '⚡', desc: '+25% producción de popó.' },
  { id: 'estomago',      name: 'Estómago eficiente',  kind: 'pos', icon: '🍖', desc: '−25% pérdida de hambre.' },
  { id: 'pacifico',      name: 'Pacífico',            kind: 'pos', icon: '🕊️', desc: 'Nunca inicia peleas.' },
  { id: 'hiperactivo',   name: 'Hiperactivo',         kind: 'pos', icon: '💨', desc: '+30% velocidad de movimiento.' },
  { id: 'felizpornat',   name: 'Feliz por naturaleza',kind: 'pos', icon: '😊', desc: '−40% decay de felicidad.' },
  { id: 'olfato',        name: 'Olfato de tesoro',    kind: 'pos', icon: '🧭', desc: '+20% probabilidad de popó dorada.' },
  { id: 'criador',       name: 'Criador excelente',   kind: 'pos', icon: '💖', desc: '−30% tiempo de embarazo.' },
  { id: 'dominante',     name: 'Gen dominante',       kind: 'pos', icon: '🧬', desc: 'Más probabilidad de heredar sus traits.' },
  { id: 'cuidador',      name: 'Buen cuidador',       kind: 'pos', icon: '🤲', desc: 'Bebés cercanos crecen 25% más rápido.' },
  { id: 'digestion',     name: 'Digestión premium',   kind: 'pos', icon: '✨', desc: '+15% valor de cada popó producida.' },

  // ---------- NEGATIVOS ----------
  { id: 'gloton',        name: 'Glotón',              kind: 'neg', icon: '🍔', desc: '+50% pérdida de hambre.' },
  { id: 'peleonero',     name: 'Peleonero',           kind: 'neg', icon: '👊', desc: 'Inicia peleas con frecuencia.' },
  { id: 'perezoso',      name: 'Perezoso',            kind: 'neg', icon: '😴', desc: '−30% velocidad y producción.' },
  { id: 'celoso',        name: 'Celoso',              kind: 'neg', icon: '😾', desc: 'Pierde felicidad cerca de otros.' },
  { id: 'delicado',      name: 'Delicado',            kind: 'neg', icon: '🥀', desc: 'Se enferma con facilidad.' },
  { id: 'desordenado',   name: 'Desordenado',         kind: 'neg', icon: '🌀', desc: 'No usa platos correctamente.' },
  { id: 'ansioso',       name: 'Ansioso',             kind: 'neg', icon: '😰', desc: '−20% felicidad cuando hay muchas popós.' },
  { id: 'malcomedor',    name: 'Mal comedor',         kind: 'neg', icon: '🙅', desc: 'Recupera 60% menos hambre al comer.' },

  // ---------- ESPECIALES ----------
  { id: 'fantasma',      name: 'Fantasma',            kind: 'esp', icon: '👻', desc: 'Aparece y desaparece, popó vale x2.' },
  { id: 'radiactivo',    name: 'Radiactivo',          kind: 'esp', icon: '☢️', desc: 'Sus popós pueden mutar a doradas.' },
  { id: 'rey',           name: 'Rey del parque',      kind: 'esp', icon: '👑', desc: '+20% productividad a perros cercanos.' },
  { id: 'mutante',       name: 'Mutante estable',     kind: 'esp', icon: '🧪', desc: 'Garantiza heredar 1 trait al criar.' },
  { id: 'legendario',    name: 'Legendario nato',     kind: 'esp', icon: '🌟', desc: 'Calidad inicial mejorada.' },
  { id: 'iman',          name: 'Imán de suerte',      kind: 'esp', icon: '🍀', desc: '+15% valor a TODA la producción.' },
];

export const TRAITS_BY_ID = Object.fromEntries(TRAITS.map(t => [t.id, t]));
export const POS_TRAITS = TRAITS.filter(t => t.kind === 'pos');
export const NEG_TRAITS = TRAITS.filter(t => t.kind === 'neg');
export const ESP_TRAITS = TRAITS.filter(t => t.kind === 'esp');
