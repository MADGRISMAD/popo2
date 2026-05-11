// ============================================================
// data/achievements.js — Logros, listos para enchufarse a Steam.
// IDs exactos para usar como Steam Achievement IDs.
// ============================================================

export const ACHIEVEMENTS = [
  { id: 'ACH_FIRST_POOP',     name: 'Manos sucias',          desc: 'Recolecta tu primera popó.',         icon: '💩' },
  { id: 'ACH_100_POOP',       name: 'Cien razones',          desc: 'Recolecta 100 popós.',                icon: '💯' },
  { id: 'ACH_1000_POOP',      name: 'Maestro popero',        desc: 'Recolecta 1.000 popós.',              icon: '🏆' },
  { id: 'ACH_FIRST_PACK',     name: 'Curiosidad',            desc: 'Abre tu primer sobre.',               icon: '📦' },
  { id: 'ACH_TEN_PACK',       name: 'Coleccionista nato',    desc: 'Abre 10 sobres seguidos.',            icon: '🎁' },
  { id: 'ACH_FIRST_LEGEND',   name: '¡Legendario!',          desc: 'Obtén tu primer perro Legendario.',   icon: '🌟' },
  { id: 'ACH_FIRST_MITICO',   name: 'Mítico',                desc: 'Obtén tu primer perro Mítico.',       icon: '🔥' },
  { id: 'ACH_FIRST_COSMICO',  name: 'Más allá',              desc: 'Obtén un perro Cósmico.',             icon: '🌌' },
  { id: 'ACH_FIRST_BIRTH',    name: 'Nuevo miembro',         desc: 'Logra el primer nacimiento.',         icon: '🐾' },
  { id: 'ACH_FIRST_QGOLD',    name: 'Genética premium',      desc: 'Cría un perro de calidad Dorada.',    icon: '🧬' },
  { id: 'ACH_FIRST_FEVER',    name: '¡Fiebre del Parque!',   desc: 'Activa la Fiebre del Parque.',        icon: '✨' },
  { id: 'ACH_COMBO_X3',       name: 'Cadena imparable',      desc: 'Logra un combo x3 o más.',            icon: '🔥' },
  { id: 'ACH_FULL_PARK',      name: 'Parque lleno',          desc: 'Llega a la capacidad máxima inicial.',icon: '🐕' },
  { id: 'ACH_GOLDEN_POOP',    name: 'Brillo dorado',         desc: 'Recolecta una popó dorada.',          icon: '✨' },
  { id: 'ACH_BREED_ZONE',     name: 'Apertura de criadero',  desc: 'Construye la Zona de Crianza.',       icon: '💗' },
  { id: 'ACH_TEN_BREEDS',     name: 'Catálogo abierto',      desc: 'Descubre 10 razas distintas.',        icon: '📚' },
  { id: 'ACH_PRESTIGE',       name: 'Renombre Canino',       desc: 'Realiza tu primer prestigio.',        icon: '👑' },
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
