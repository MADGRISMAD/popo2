// ============================================================
// gameState.js
// Estado central del juego. Es un único objeto plano y serializable.
// Cualquier sistema lee y escribe sobre `state`.
// No coloques aquí lógica de juego, solo estructura por defecto.
// ============================================================

import { GAME, ECONOMY, DOG } from './config.js';

export const state = {
  meta: {
    version: GAME.SAVE_VERSION,
    createdAt: 0,
    lastSaved: 0,
    paused: false,
    started: false,
    specialization: null,    // id de especialización elegida (o null)
  },

  options: {
    masterVolume: 0.7,
    sfxVolume: 0.9,
    soundEnabled: true,
    uiScale: 1.0,
    reduceMotion: false,
    language: 'es',
    fullscreen: false,
  },

  resources: {
    poop: ECONOMY.START_POOP,
    coinsLifetime: ECONOMY.START_POOP,
    packs: { food: ECONOMY.START_PACK_FOOD, dog: ECONOMY.START_PACK_DOG, legend: ECONOMY.START_PACK_LEGEND },
  },

  combo: {
    multiplier: 1.0,
    lastPickAt: 0,
  },

  fever: {
    value: 0,
    active: false,
    activeUntil: 0,
  },

  park: {
    capacity: DOG.PARK_CAPACITY_BASE,
    activeDogs: [],        // ids
    poops: [],             // [{ id, x, y, value, golden, bornAt }]
    bowls: [],             // [{ id, x, y, type, qty, capacity }]
    objects: [],           // mejoras decorativas/funcionales colocadas
    breedingZone: null,    // { x, y, level } si está construida
    magnetRadius: 0,
    visitors: [],          // [{ id, x, y, vy, until, satisfaction }]
    activeCombos: {},      // id -> true mientras el combo esté activo
  },

  inventory: {
    storedDogs: [],        // perros guardados (no activos)
    food: {},              // foodId -> qty
    upgrades: {},          // upgradeId -> level
    parkUpgrades: {},      // parkObjId -> qty
    automations: {},       // automationId -> level
    geneticCards: {},      // cardId -> qty
    breedCards: {},
    specialItems: {},
  },

  dogs: {
    nextId: 1,
    map: {},               // id -> dogObject
  },

  collection: {
    breeds:    {},         // breedId -> { discovered, bestQuality, bestRarity, count }
    hybrids:   {},
    mutations: {},
    combos:    {},         // hidden combos descubiertos
    soldDogs:  0,
  },

  progression: {
    activeMission: null,   // missionId
    missionProgress: 0,
    completedMissions: [],
    miniGoal: null,        // { type, target, progress }
    achievements: {},      // id -> true
    eventActive: null,     // { id, until }
    prestigeLevel: 0,
    prestigePoints: 0,
  },

  stats: {
    totalPoopCollected: 0,
    totalDogsBorn: 0,
    totalPacksOpened: 0,
    totalLegendaries: 0,
    totalGoldenPoop: 0,
    totalPets: 0,
    totalSold: 0,
    totalVisitors: 0,
    playTimeSec: 0,
    maxCombo: 1,
  },

  log: [],                 // [{ ts, msg, kind }]
};

// Reset profundo (nueva partida)
export function resetState () {
  // Limpiamos in-place para no romper referencias en módulos.
  Object.assign(state.meta, {
    version: GAME.SAVE_VERSION,
    createdAt: Date.now(),
    lastSaved: 0,
    paused: false,
    started: true,
  });
  Object.assign(state.resources, {
    poop: ECONOMY.START_POOP,
    coinsLifetime: ECONOMY.START_POOP,
    packs: { food: ECONOMY.START_PACK_FOOD, dog: ECONOMY.START_PACK_DOG, legend: ECONOMY.START_PACK_LEGEND },
  });
  Object.assign(state.combo, { multiplier: 1.0, lastPickAt: 0 });
  Object.assign(state.fever, { value: 0, active: false, activeUntil: 0 });

  state.park.capacity = DOG.PARK_CAPACITY_BASE;
  state.park.activeDogs = [];
  state.park.poops = [];
  state.park.bowls = [];
  state.park.objects = [];
  state.park.breedingZone = null;
  state.park.magnetRadius = 0;
  state.park.visitors = [];
  state.park.activeCombos = {};
  state.meta.specialization = null;

  state.inventory.storedDogs = [];
  state.inventory.food = {};
  state.inventory.upgrades = {};
  state.inventory.parkUpgrades = {};
  state.inventory.automations = {};
  state.inventory.geneticCards = {};
  state.inventory.breedCards = {};
  state.inventory.specialItems = {};

  state.dogs.nextId = 1;
  state.dogs.map = {};

  state.collection.breeds = {};
  state.collection.hybrids = {};
  state.collection.mutations = {};
  state.collection.combos = {};
  state.collection.soldDogs = 0;

  state.progression.activeMission = null;
  state.progression.missionProgress = 0;
  state.progression.completedMissions = [];
  state.progression.miniGoal = null;
  state.progression.achievements = {};
  state.progression.eventActive = null;
  state.progression.prestigeLevel = 0;
  state.progression.prestigePoints = 0;

  state.stats.totalPoopCollected = 0;
  state.stats.totalDogsBorn = 0;
  state.stats.totalPacksOpened = 0;
  state.stats.totalLegendaries = 0;
  state.stats.totalGoldenPoop = 0;
  state.stats.totalPets = 0;
  state.stats.totalSold = 0;
  state.stats.totalVisitors = 0;
  state.stats.playTimeSec = 0;
  state.stats.maxCombo = 1;

  state.log.length = 0;
}

// Sustituye el estado in-place (usado al cargar)
export function loadIntoState (incoming) {
  // Solo copia llaves conocidas; cualquier extra se ignora para evitar inyectar campos.
  for (const key of Object.keys(state)) {
    if (incoming[key] !== undefined) {
      if (Array.isArray(state[key])) {
        state[key].length = 0;
        state[key].push(...incoming[key]);
      } else if (typeof state[key] === 'object' && state[key] !== null) {
        // Limpiar y volver a poblar el objeto
        for (const k of Object.keys(state[key])) delete state[key][k];
        Object.assign(state[key], incoming[key]);
      } else {
        state[key] = incoming[key];
      }
    }
  }
}
