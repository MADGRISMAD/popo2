// ============================================================
// systems/combatSystem.js — peleas entre perros (chequeo macro).
// La lógica fina está en dogSystem; aquí van efectos colaterales.
// ============================================================

import { state } from '../gameState.js';

export function update (dt) {
  // Mantener el código de pelea coherente: limita peleas simultáneas
  let fighting = 0;
  for (const id of state.park.activeDogs) {
    const d = state.dogs.map[id];
    if (d?.state === 'fighting') fighting++;
  }
  // Si hay más de 4 peleando, fuerza descanso al primero
  if (fighting > 4) {
    for (const id of state.park.activeDogs) {
      const d = state.dogs.map[id];
      if (d?.state === 'fighting') {
        d.state = 'resting';
        d.stateUntil = performance.now() + 6000;
        break;
      }
    }
  }
}
