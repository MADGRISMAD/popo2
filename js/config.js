// ============================================================
// config.js — Constantes globales de balance y motor.
// Cambiar valores aquí afecta todo el juego de forma consistente.
// ============================================================

export const GAME = Object.freeze({
  NAME: 'Popó Park',
  VERSION: '0.3.0',
  SAVE_VERSION: 1,
  SAVE_KEY: 'popo-park-save',
  AUTO_SAVE_MS: 20_000,
  MAX_DELTA_MS: 200,        // clamp para evitar saltos al volver a la pestaña
  TARGET_FPS: 60,
});

export const VIEWPORT = Object.freeze({
  W: 1920,
  H: 1080,
});

export const PARK = Object.freeze({
  W: 1080,                  // canvas lógico
  H: 720,
  GRID: 60,                 // tamaño de celda interna (no visible salvo build mode)
  BG: '#3d6a1d',            // color base pasto (canvas)
  PATH: '#7a5e35',
});

export const ECONOMY = Object.freeze({
  START_POOP: 50,
  START_PACK_FOOD: 1,
  START_PACK_DOG: 1,
  START_PACK_LEGEND: 0,
  // Multiplicadores de combo de recolección
  COMBO_DECAY_MS: 2400,     // ventana antes de que el combo empiece a enfriarse
  COMBO_STEP: 0.08,
  COMBO_MAX: 10.0,
  FEVER_MAX: 100,
  FEVER_DECAY_PER_SEC: 1.2,
  FEVER_GAIN_PER_PICK: 2.2,
  FEVER_DURATION_MS: 14_000,
});

export const DOG = Object.freeze({
  MAX_HUNGER: 100,
  MAX_HAPPINESS: 100,
  HUNGER_DECAY_PER_SEC: 0.55,
  HAPPINESS_DECAY_PER_SEC: 0.10,
  AGE_BABY_S: 60,
  AGE_YOUNG_S: 180,
  AGE_VETERAN_S: 1800,
  PRODUCE_BABY_MULT: 0.20,
  PRODUCE_YOUNG_MULT: 0.60,
  PRODUCE_ADULT_MULT: 1.0,
  PRODUCE_VETERAN_MULT: 0.85,
  MOVE_SPEED_BASE: 22,      // px/s
  MOVE_SPEED_BABY_MULT: 0.6,
  POOP_INTERVAL_BASE: 2.6,   // segundos base entre popó (perro común adulto)
  POOP_INTERVAL_VAR: 1.8,    // variación aleatoria
  FIGHT_REST_MS: 8_000,
  HUNGRY_THRESHOLD: 35,
  PARK_CAPACITY_BASE: 5,
  PET_COOLDOWN_MS: 6_000,
  PET_HAPPINESS: 12,
  PET_FEVER_GAIN: 4,
  XP_PER_POOP: 1,
  XP_PER_FEED: 4,
  XP_PER_PET: 2,
  XP_PER_FIGHT: 6,
  LEVEL_XP_BASE: 50,
  LEVEL_XP_GROWTH: 1.35,
  LEVEL_PROD_BONUS: 0.04,   // +4% producción por nivel
  MAX_LEVEL: 50,
});

// Saturación de popó: si hay demasiada en el suelo, los perros pierden felicidad
export const SATURATION = Object.freeze({
  THRESHOLD: 30,            // popós sin recoger antes de empezar a molestar
  HAPPINESS_LOSS_PER_SEC: 0.4,
  EVENT_TRIGGER_AT: 60,     // si pasa de aquí, evento "Inspección Sanitaria" puede penalizar
});

// Visitantes del parque
export const VISITORS = Object.freeze({
  SPAWN_INTERVAL_MIN_S: 90,
  SPAWN_INTERVAL_VAR_S: 90,
  STAY_S: 30,
  TIP_BASE: 8,
  TIP_PER_HAPPINESS: 0.4,   // multiplicador según felicidad media del parque
  REQUIRE_HAPPINESS: 50,
});

export const BREEDING = Object.freeze({
  REQUIRE_HAPPINESS: 60,
  REQUIRE_HUNGER: 40,
  PREGNANCY_BASE_MS: 120_000,
  PREGNANCY_MIN_MS: 45_000,
  REST_AFTER_BIRTH_MS: 20_000,
  MALE_REST_MS: 10_000,
});

export const POOP = Object.freeze({
  BASE_VALUE: 1,
  GOLDEN_CHANCE: 0.05,
  GOLDEN_MULT: 8,
  MAGNET_RADIUS_BASE: 0,
  MAGNET_RADIUS_STEP: 22,
  MAX_ON_GROUND: 80,
});

// Ganchos de progresión / recompensa variable (nivel, ruleta, cajas, diario)
export const HOOKS = Object.freeze({
  XP_BASE: 25,              // XP para pasar de nivel 1 a 2
  XP_GROWTH: 1.22,          // crecimiento por nivel
  XP_PER_POOP: 1,
  XP_PER_GOLDEN: 6,
  XP_PER_RAINBOW: 40,
  XP_PER_PACK: 4,
  XP_PER_BIRTH: 25,
  XP_PER_BOX: 15,
  FREE_SPIN_EVERY_S: 480,   // giro gratis cada 8 min jugados
  BOX_MIN_S: 40,            // caja misteriosa: cada 40–100 s
  BOX_VAR_S: 60,
  BOX_LIFETIME_S: 11,
  RAINBOW_CHANCE: 0.004,    // popó arcoíris (jackpot)
  RAINBOW_MULT: 60,
  FEVER_RAIN: 18,           // popós extra que caen al activar fiebre
});
