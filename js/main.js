// ============================================================
// main.js — Punto de entrada.
// 1) Inicializa input, audio, UI.
// 2) Muestra pantalla de carga, luego menú.
// 3) Conecta Continuar / Nueva partida.
// 4) Arranca el game loop con todos los sistemas y renders.
// ============================================================

import { GAME } from './config.js';
import { state, resetState } from './gameState.js';
import { startLoop, registerUpdater, registerRenderer } from './gameLoop.js';
import { initInput, fitViewport } from './inputManager.js';
import { initUI, showScreen } from './uiManager.js';
import { initParkHover } from './parkHover.js';
import { applyVolumes } from './audioManager.js';
import { hasSave, save, load, startAutoSave } from './saveManager.js';
import { logEvent } from './eventLog.js';

import * as dogSystem        from './systems/dogSystem.js';
import * as parkSystem       from './systems/parkSystem.js';
import * as poopSystem       from './systems/poopSystem.js';
import * as foodBowlSystem   from './systems/foodBowlSystem.js';
import * as breedingSystem   from './systems/breedingSystem.js';
import * as missionSystem    from './systems/missionSystem.js';
import * as achievementSystem from './systems/achievementSystem.js';
import * as eventSystem      from './systems/eventSystem.js';
import * as combatSystem     from './systems/combatSystem.js';
import * as collectionSystem from './systems/collectionSystem.js';
import * as economySystem    from './systems/economySystem.js';
import * as automationSystem from './systems/automationSystem.js';
import * as visitorSystem    from './systems/visitorSystem.js';
import * as comboHidden      from './systems/comboHiddenSystem.js';
import * as pettingSystem    from './systems/pettingSystem.js';
import { ensureSystemsReady, startNewPark } from './systems/progressionSystem.js';

import { initParkRender, render as renderPark } from './render/renderPark.js';
import { renderHUD }       from './render/renderHUD.js';
import { renderShop }      from './render/renderShop.js';
import { renderInventory } from './render/renderInventory.js';

// ---------- BOOT ----------
window.addEventListener('DOMContentLoaded', boot);

async function boot () {
  // Pantalla de carga animada
  showScreen('screen-loading');
  initInput();
  fitViewport();
  applyVolumes();
  document.body.classList.toggle('reduce-motion', !!state.options.reduceMotion);

  await fakeLoad();

  // Render park (canvas) requiere DOM listo
  initParkRender();
  initParkHover();
  pettingSystem.init();

  // UI principal y conexiones de menú
  initUI({
    onNewGame:  startNewGame,
    onContinue: continueGame,
  });

  // Registra sistemas y renderers en el loop (una sola vez)
  registerUpdater(dt => dogSystem.update(dt));
  registerUpdater(dt => parkSystem.update(dt));
  registerUpdater(dt => poopSystem.update(dt));
  registerUpdater(dt => foodBowlSystem.update(dt));
  registerUpdater(dt => breedingSystem.update(dt));
  registerUpdater(dt => missionSystem.update(dt));
  registerUpdater(dt => achievementSystem.update(dt));
  registerUpdater(dt => eventSystem.update(dt));
  registerUpdater(dt => combatSystem.update(dt));
  registerUpdater(dt => collectionSystem.update(dt));
  registerUpdater(dt => economySystem.update(dt));
  registerUpdater(dt => automationSystem.update(dt));
  registerUpdater(dt => visitorSystem.update(dt));
  registerUpdater(dt => comboHidden.update(dt));

  registerRenderer(dt => renderPark(dt));
  registerRenderer(dt => renderHUD(dt));
  registerRenderer(dt => uiTick(dt));

  startLoop();
  startAutoSave();

  // Mostrar menú
  showScreen('screen-menu');

  // Continuar automáticamente si ya hay partida
  // (el usuario decide vía botón)
}

let _uiLastTick = 0;
function uiTick (dt) {
  _uiLastTick += dt;
  if (_uiLastTick > 0.4) {
    _uiLastTick = 0;
    if (document.getElementById('screen-game').classList.contains('active')) {
      try { renderShop(); renderInventory(); } catch (e) { console.error(e); }
    }
  }
}

function fakeLoad () {
  return new Promise(resolve => {
    const fill = document.querySelector('.loader-fill');
    let p = 0;
    const id = setInterval(() => {
      p += 6 + Math.random() * 14;
      fill.style.width = Math.min(100, p) + '%';
      if (p >= 100) { clearInterval(id); setTimeout(resolve, 200); }
    }, 60);
  });
}

function startNewGame () {
  resetState();
  ensureSystemsReady();
  startNewPark();
  state.meta.paused = false;
  state.meta.started = true;
  showScreen('screen-game');
  logEvent('¡Bienvenido a tu nuevo parque!', 'gold');
  save();
  // Forzar render inicial inmediato
  setTimeout(() => { renderShop(); renderInventory(); }, 16);
}

function continueGame () {
  if (!load()) { startNewGame(); return; }
  ensureSystemsReady();
  // Catch-up offline
  economySystem.offlineCatchUp(state.meta.lastSaved);
  state.meta.paused = false;
  state.meta.started = true;
  showScreen('screen-game');
  applyVolumes();
  document.body.classList.toggle('reduce-motion', !!state.options.reduceMotion);
  document.documentElement.style.setProperty('--ui-scale', state.options.uiScale);
  logEvent('Partida cargada', 'gold');
  setTimeout(() => { renderShop(); renderInventory(); }, 16);
}

// Guardar al cerrar
window.addEventListener('beforeunload', () => {
  if (state.meta.started) save();
});
