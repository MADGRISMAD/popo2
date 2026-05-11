// ============================================================
// systems/comboHiddenSystem.js — detecta combos ocultos cada
// pocos segundos y los activa/desactiva. Notifica al descubrir.
// ============================================================

import { state } from '../gameState.js';
import { HIDDEN_COMBOS } from '../data/combos.js';
import { toast } from '../modalManager.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';

let _t = 0;

export function update (dt) {
  _t += dt;
  if (_t < 1.5) return;
  _t = 0;

  const ctx = {
    activeDogs: state.park.activeDogs.map(id => state.dogs.map[id]).filter(Boolean),
    parkUpgrades: state.inventory.parkUpgrades || {},
    bowls: state.park.bowls,
  };

  const previous = { ...state.park.activeCombos };
  const next = {};

  for (const c of HIDDEN_COMBOS) {
    try {
      if (c.check(ctx)) next[c.id] = true;
    } catch (e) { /* ignore */ }
  }

  state.park.activeCombos = next;

  // Detectar nuevos descubrimientos (no estaba antes Y nunca antes en la colección)
  for (const id of Object.keys(next)) {
    if (!previous[id] && !state.collection.combos[id]) {
      const c = HIDDEN_COMBOS.find(x => x.id === id);
      if (c) {
        state.collection.combos[id] = true;
        toast.show({ icon: '✨', title: 'Combo descubierto', desc: `${c.name}: ${c.bonusDesc}`, kind: 'gold' });
        sfx.achievement();
        logEvent(`Combo: ${c.name} (${c.bonusDesc})`, 'gold');
      }
    }
  }
}
