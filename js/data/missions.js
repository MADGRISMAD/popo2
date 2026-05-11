// ============================================================
// data/missions.js — Misión principal lineal.
// Solo una misión activa a la vez. Se completa, da recompensa,
// y la siguiente se desbloquea automáticamente.
// ============================================================

export const MISSIONS = [
  { id: 'm1', title: 'Recolecta tu primera popó', desc: 'Pasa el cursor sobre una popó.',
    type: 'collect', target: 1, reward: { poop: 25 } },
  { id: 'm2', title: 'Tienes 3 perros activos', desc: 'Activa 3 perros desde tu inventario.',
    type: 'activeDogs', target: 3, reward: { poop: 60 } },
  { id: 'm3', title: 'Acumula 200 popós', desc: 'Gana 200 popós en total.',
    type: 'totalPoop', target: 200, reward: { poop: 80, packs: { food: 1 } } },
  { id: 'm4', title: 'Abre 3 sobres', desc: 'Compra y abre 3 sobres cualesquiera.',
    type: 'packsOpened', target: 3, reward: { poop: 120 } },
  { id: 'm5', title: 'Construye una Zona de Crianza', desc: 'Compra la Zona de Crianza en la tienda.',
    type: 'breedingZone', target: 1, reward: { poop: 200, packs: { dog: 1 } } },
  { id: 'm6', title: '¡Tu primer cachorro!', desc: 'Logra que nazca un perro.',
    type: 'birth', target: 1, reward: { poop: 250 } },
  { id: 'm7', title: 'Activa la Fiebre del Parque', desc: 'Llena el medidor de fiebre con combos.',
    type: 'fever', target: 1, reward: { poop: 300 } },
  { id: 'm8', title: 'Consigue un perro Épico', desc: 'Obtén o cría un perro de rareza Épico+.',
    type: 'rarity', rarity: 'epico', target: 1, reward: { poop: 500, packs: { dog: 2 } } },
  { id: 'm9', title: '10 perros en colección', desc: 'Descubre 10 razas distintas.',
    type: 'breedsDiscovered', target: 10, reward: { poop: 800, packs: { legend: 1 } } },
  { id: 'm10', title: 'Calidad Dorada', desc: 'Cría un perro de calidad Dorada o superior.',
    type: 'quality', quality: 'dorado', target: 1, reward: { poop: 1500, packs: { legend: 2 } } },
];

export const MISSIONS_BY_ID = Object.fromEntries(MISSIONS.map(m => [m.id, m]));
export const FIRST_MISSION = MISSIONS[0].id;

export function nextMissionId (currentId) {
  const idx = MISSIONS.findIndex(m => m.id === currentId);
  return idx >= 0 && idx + 1 < MISSIONS.length ? MISSIONS[idx + 1].id : null;
}

// ---------- Mini objetivos rápidos (rotativos) ----------
export const MINI_GOALS = [
  { id: 'mg_collect',   title: 'Recolecta 20 popós',     type: 'collect',     target: 20,  reward: { poop: 30 } },
  { id: 'mg_combo',     title: 'Logra un combo x2',      type: 'combo',       target: 2,   reward: { poop: 50 } },
  { id: 'mg_packs',     title: 'Abre 1 sobre',           type: 'packsOpened', target: 1,   reward: { poop: 40 } },
  { id: 'mg_feed',      title: 'Rellena 2 platos',       type: 'bowlFill',    target: 2,   reward: { poop: 35 } },
  { id: 'mg_active',    title: '4 perros activos',       type: 'activeDogs',  target: 4,   reward: { poop: 60 } },
  { id: 'mg_pet',       title: 'Acaricia 3 perros',      type: 'pet',         target: 3,   reward: { poop: 45 } },
  { id: 'mg_golden',    title: 'Recoge una popó dorada', type: 'golden',      target: 1,   reward: { poop: 80 } },
];
