// ============================================================
// uiManager.js — Pantallas, navegación, opciones, botones globales.
// ============================================================

import { state, resetState } from './gameState.js';
import { GAME } from './config.js';
import { save, load, hasSave, deleteSave, startAutoSave } from './saveManager.js';
import { logEvent, subscribe as subLog } from './eventLog.js';
import { sfx, applyVolumes, unlockAudio } from './audioManager.js';
import { modal, toast } from './modalManager.js';
import { platform } from './platformAdapter.js';

const screens = ['screen-loading', 'screen-menu', 'screen-game'];
let _logUnsub = null;

export function showScreen (id) {
  for (const s of screens) {
    document.getElementById(s).classList.toggle('active', s === id);
  }
}

export function initUI ({ onNewGame, onContinue }) {
  // ---------- Menú principal ----------
  document.querySelectorAll('[data-menu]').forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.menu;
      sfx.click(); unlockAudio();
      if (action === 'continue') {
        if (!hasSave()) { toast.show({ icon: '⚠️', title: 'Sin partida guardada', desc: 'Inicia una nueva primero.' }); return; }
        onContinue();
      } else if (action === 'new') {
        if (hasSave()) {
          confirm('¿Empezar nueva partida? Se borrará la anterior.', () => { deleteSave(); onNewGame(); });
        } else onNewGame();
      } else if (action === 'options') openOptions();
      else if (action === 'credits') openCredits();
      else if (action === 'exit')    platform.quit();
    };
  });

  // Botones del topbar
  document.getElementById('btn-save').onclick    = () => { save(); };
  document.getElementById('btn-pause').onclick   = () => togglePause();
  document.getElementById('btn-options').onclick = openOptions;
  document.getElementById('btn-menu').onclick    = () => {
    confirm('¿Volver al menú principal? Se guardará tu partida.', () => {
      save(); showScreen('screen-menu');
      state.meta.paused = true;
    });
  };

  // Pause overlay
  document.getElementById('pause-resume').onclick  = togglePause;
  document.getElementById('pause-save').onclick    = () => save();
  document.getElementById('pause-options').onclick = openOptions;
  document.getElementById('pause-menu').onclick    = () => {
    save(); document.getElementById('pause-overlay').classList.add('hidden');
    state.meta.paused = true; showScreen('screen-menu');
  };

  // Tecla ESC = pausa
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modal.isOpen()) modal.close();
      else if (document.getElementById('screen-game').classList.contains('active')) togglePause();
    }
    if (e.key === 'F11') { e.preventDefault(); platform.toggleFullscreen(); }
  });

  // Subscripción al log
  if (_logUnsub) _logUnsub();
  _logUnsub = subLog(() => renderEventLog());
  renderEventLog();
}

export function togglePause () {
  state.meta.paused = !state.meta.paused;
  document.getElementById('pause-overlay').classList.toggle('hidden', !state.meta.paused);
}

function renderEventLog () {
  const wrap = document.getElementById('event-log');
  if (!wrap) return;
  wrap.innerHTML = state.log.slice(0, 8).map(e => `<div class="log-entry ${e.kind || ''}">${e.msg}</div>`).join('');
}

// ---------- Confirmación reutilizable ----------
function confirm (msg, onYes) {
  modal.open({
    title: 'Confirmación',
    body: `<p style="font-size:14px;">${msg}</p>`,
    footer: `
      <button class="btn ghost" id="cf-no">Cancelar</button>
      <button class="btn danger" id="cf-yes">Aceptar</button>
    `,
  });
  document.getElementById('cf-no').onclick = () => modal.close();
  document.getElementById('cf-yes').onclick = () => { modal.close(); onYes(); };
}

// ---------- Opciones ----------
export function openOptions () {
  const o = state.options;
  const html = `
    <div style="display:grid; gap:10px; min-width: 420px;">
      <label class="object-card">
        Volumen maestro: <strong id="lbl-master">${Math.round(o.masterVolume * 100)}%</strong>
        <input type="range" min="0" max="1" step="0.05" value="${o.masterVolume}" id="opt-master" style="width:100%;" />
      </label>
      <label class="object-card">
        Volumen efectos: <strong id="lbl-sfx">${Math.round(o.sfxVolume * 100)}%</strong>
        <input type="range" min="0" max="1" step="0.05" value="${o.sfxVolume}" id="opt-sfx" style="width:100%;" />
      </label>
      <label class="object-card">
        <input type="checkbox" id="opt-sound" ${o.soundEnabled ? 'checked' : ''}/> Activar sonido
      </label>
      <label class="object-card">
        Escala UI: <strong id="lbl-ui">${o.uiScale.toFixed(2)}x</strong>
        <input type="range" min="0.8" max="1.4" step="0.05" value="${o.uiScale}" id="opt-ui" style="width:100%;" />
      </label>
      <label class="object-card">
        <input type="checkbox" id="opt-rm" ${o.reduceMotion ? 'checked' : ''}/> Reducir animaciones
      </label>
      <label class="object-card">
        Idioma: <select id="opt-lang">
          <option value="es" ${o.language === 'es' ? 'selected' : ''}>Español</option>
          <option value="en" ${o.language === 'en' ? 'selected' : ''}>English (próximamente)</option>
        </select>
      </label>
      <button class="btn" id="opt-fs">${platform.isFullscreen() ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</button>
      <button class="btn danger" id="opt-delete">Borrar partida</button>
    </div>
  `;
  modal.open({ title: 'Opciones', body: html, footer: `<button class="btn primary" id="opt-close">Cerrar</button>` });

  document.getElementById('opt-master').oninput = e => { o.masterVolume = +e.target.value; document.getElementById('lbl-master').textContent = Math.round(o.masterVolume*100)+'%'; applyVolumes(); };
  document.getElementById('opt-sfx').oninput    = e => { o.sfxVolume    = +e.target.value; document.getElementById('lbl-sfx').textContent    = Math.round(o.sfxVolume*100)+'%';    applyVolumes(); };
  document.getElementById('opt-sound').onchange = e => { o.soundEnabled = e.target.checked; applyVolumes(); };
  document.getElementById('opt-ui').oninput     = e => { o.uiScale = +e.target.value; document.getElementById('lbl-ui').textContent = o.uiScale.toFixed(2)+'x'; document.documentElement.style.setProperty('--ui-scale', o.uiScale); };
  document.getElementById('opt-rm').onchange    = e => { o.reduceMotion = e.target.checked; document.body.classList.toggle('reduce-motion', o.reduceMotion); };
  document.getElementById('opt-lang').onchange  = e => { o.language = e.target.value; };
  document.getElementById('opt-fs').onclick     = () => { platform.toggleFullscreen(); modal.close(); openOptions(); };
  document.getElementById('opt-delete').onclick = () => {
    confirm('¿Borrar partida guardada? Esto no se puede deshacer.', () => {
      deleteSave(); resetState(); modal.close(); showScreen('screen-menu');
    });
  };
  document.getElementById('opt-close').onclick = () => modal.close();
}

function openCredits () {
  modal.open({
    title: 'Créditos',
    body: `<div style="text-align:center; padding: 20px;">
      <div style="font-size:18px; font-weight:800; margin-bottom:8px;">Popó Park</div>
      <p>Desarrollado con HTML, CSS y JavaScript puro.</p>
      <p style="margin-top:8px; opacity:.8; font-size:12px;">Sin dependencias externas. Sonidos generados con Web Audio API.</p>
      <p style="margin-top:18px; font-size:12px; opacity:.7;">v${GAME.VERSION} · build local</p>
    </div>`,
    footer: `<button class="btn primary" onclick="document.querySelector('.close').click()">Cerrar</button>`,
  });
}
