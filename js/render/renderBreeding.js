// ============================================================
// render/renderBreeding.js — pestaña / modal de crianza.
// ============================================================

import { state } from '../gameState.js';
import { storedDogs, activeDogs, isAdult } from '../systems/dogSystem.js';
import { canStartBreeding, startBreeding, compatibility } from '../systems/breedingSystem.js';
import { BREEDS_BY_ID, RARITIES_BY_ID, QUALITIES_BY_ID } from '../data/dogs.js';
import { findRecipe } from '../data/breedingRecipes.js';
import { TRAITS_BY_ID } from '../data/traits.js';

let _maleId = null;
let _femaleId = null;

const COMPAT_COLOR = {
  baja: '#f87171',
  media: '#fbbf24',
  alta: '#4ade80',
  excelente: '#a855f7',
};

export function renderBreeding (wrap) {
  if (!state.park.breedingZone) {
    wrap.innerHTML = `<div class="object-card">
      <div class="name">💗 Zona de Crianza requerida</div>
      <div class="desc">Construye la Zona de Crianza desde la pestaña <strong>Parque</strong> para poder emparejar perros.</div>
    </div>`;
    return;
  }
  const all = [...activeDogs(), ...storedDogs()].filter(d => isAdult(d));
  const males = all.filter(d => d.sex === 'M');
  const females = all.filter(d => d.sex === 'F');
  const male = state.dogs.map[_maleId];
  const female = state.dogs.map[_femaleId];
  const compat = canStartBreeding(male, female);
  const cmp = (male && female) ? compatibility(male, female) : null;
  const info = compat.ok ? expectedQuality(male, female) : null;

  const labOwned = (state.inventory.parkUpgrades?.lab_genetic || 0) > 0;

  wrap.innerHTML = `
    <div class="breed-grid">
      <div class="breed-slot ${male ? 'filled' : ''}">
        <div style="font-size:30px; color:#60a5fa;">♂</div>
        <div><strong>${male ? male.name : 'Selecciona un macho'}</strong></div>
        ${male ? `<div style="font-size:11px; opacity:.8;">${RARITIES_BY_ID[male.rarity].name} · ${QUALITIES_BY_ID[male.quality].name}<br>Nv ${male.level || 1} · Felicidad ${male.happiness.toFixed(0)}</div>` : ''}
      </div>
      <div class="breed-arrow">💗</div>
      <div class="breed-slot ${female ? 'filled' : ''}">
        <div style="font-size:30px; color:#f472b6;">♀</div>
        <div><strong>${female ? female.name : 'Selecciona una hembra'}</strong></div>
        ${female ? `<div style="font-size:11px; opacity:.8;">${RARITIES_BY_ID[female.rarity].name} · ${QUALITIES_BY_ID[female.quality].name}<br>Nv ${female.level || 1} · Felicidad ${female.happiness.toFixed(0)}</div>` : ''}
      </div>
    </div>

    <div class="breed-info">
      <div class="row">
        <span>Compatibilidad</span>
        <strong style="color:${cmp ? COMPAT_COLOR[cmp.level] : '#f87171'}; text-transform: uppercase;">
          ${cmp ? cmp.level : '—'} ${cmp ? `(${cmp.score})` : ''}
        </strong>
      </div>
      <div class="row"><span>Estado</span>
        <strong style="color:${compat.ok ? '#4ade80' : '#f87171'};">${compat.ok ? 'Listo' : compat.reason}</strong>
      </div>
      ${cmp && cmp.factors.length ? `
        <div style="font-size:11px; color: var(--c-fg-muted); padding: 4px 0;">
          ${cmp.factors.map(f => `<div>• ${f}</div>`).join('')}
        </div>` : ''}
      ${info ? `
        <div class="row"><span>Calidad esperada</span><strong>${labOwned ? info.qualDetail : info.qual}</strong></div>
        <div class="row"><span>Rareza estimada</span><strong>${info.rar}</strong></div>
        <div class="row"><span>Receta posible</span><strong>${info.recipe || '—'}</strong></div>
        <div class="row"><span>Tiempo estimado</span><strong>${info.time}s</strong></div>
        <div class="row"><span>Comida recomendada</span><strong>${info.foodRec}</strong></div>
        <div class="row"><span>Madre quedará inhabilitada</span><strong>Sí</strong></div>
      ` : ''}
      <button class="btn primary" id="breed-start" style="margin-top:10px; width:100%;" ${compat.ok ? '' : 'disabled'}>Iniciar crianza</button>
    </div>

    <h4 style="margin:12px 0 6px;">Machos adultos (${males.length})</h4>
    <div class="card-grid">
      ${males.map(d => slotCard(d, 'm', _maleId === d.id)).join('') || '<div style="opacity:.6; font-size:12px;">No hay machos adultos.</div>'}
    </div>
    <h4 style="margin:12px 0 6px;">Hembras adultas (${females.length})</h4>
    <div class="card-grid">
      ${females.map(d => slotCard(d, 'f', _femaleId === d.id)).join('') || '<div style="opacity:.6; font-size:12px;">No hay hembras adultas.</div>'}
    </div>
  `;

  wrap.querySelectorAll('[data-pickm]').forEach(b => b.onclick = () => { _maleId = +b.dataset.pickm; renderBreeding(wrap); });
  wrap.querySelectorAll('[data-pickf]').forEach(b => b.onclick = () => { _femaleId = +b.dataset.pickf; renderBreeding(wrap); });
  const startBtn = wrap.querySelector('#breed-start');
  if (startBtn) startBtn.onclick = () => {
    const r = startBreeding(_maleId, _femaleId);
    if (r.ok) { _femaleId = null; }
    renderBreeding(wrap);
  };
}

function slotCard (d, kind, selected) {
  const r = RARITIES_BY_ID[d.rarity];
  const traits = (d.traits || []).slice(0, 2).map(t => TRAITS_BY_ID[t]?.icon || '').join(' ');
  return `<div class="card ${r.className}" style="${selected ? 'outline: 2px solid var(--c-gold-0);' : ''}" data-tooltip="${d.name} · ${r.name}<br>Calidad: ${QUALITIES_BY_ID[d.quality].name}<br>Felicidad: ${d.happiness.toFixed(0)}">
    <div class="card-thumb" style="font-size:24px; color:${kind === 'm' ? '#60a5fa' : '#f472b6'};">${kind === 'm' ? '♂' : '♀'}</div>
    <div class="card-name">${d.name}</div>
    <div class="card-meta"><span>${r.name}</span><span>${QUALITIES_BY_ID[d.quality].name}</span></div>
    <div class="card-meta"><span>${traits}</span><span>Nv ${d.level || 1}</span></div>
    <button class="btn small primary" data-pick${kind}="${d.id}" style="margin-top:6px;">${selected ? '✓ Elegido' : 'Elegir'}</button>
  </div>`;
}

function expectedQuality (m, f) {
  if (!m || !f) return null;
  const order = ['gris','verde','azul','morado','dorado','rojo','cosmico'];
  const a = order.indexOf(m.quality);
  const b = order.indexOf(f.quality);
  const min = Math.min(a, b), max = Math.max(a, b);
  let qual, qualDetail;
  if (a === b) {
    qual = `${order[a]} (chance subir)`;
    qualDetail = `70% ${order[a]} · 22% ${order[Math.min(6, a+1)]} · 7% ${order[Math.min(6, a+2)]} · 1% ${order[Math.min(6, a+3)]}`;
  } else if (max - min >= 3) {
    qual = `${order[min]} probable`;
    qualDetail = `80% ${order[min]} · 14% ${order[min+1]} · 5% ${order[Math.min(6, min+2)]} · 1% ${order[max]}`;
  } else {
    qual = `${order[min]}/${order[max]}`;
    qualDetail = `62% ${order[min]} · 28% ${order[max]} · 8% ${order[Math.min(6, max+1)]} · 2% ${order[Math.min(6, max+2)]}`;
  }
  const rOrder = ['comun','raro','epico','legend','mitico','cosmico'];
  const rar = rOrder[Math.min(rOrder.indexOf(m.rarity), rOrder.indexOf(f.rarity))];
  const recipe = findRecipe(m, f);

  // Recomendación de comida según objetivos
  let foodRec = 'Banquete canino';
  if (max - min >= 2)                             foodRec = 'Platillo genético';
  if (m.traits.some(t => t.startsWith('mut'))
   || f.traits.some(t => t.startsWith('mut')))    foodRec = 'Platillo mutante';
  if ((m.traits.includes('criador')) || (f.traits.includes('criador')))
                                                  foodRec = 'Platillo de crianza';

  return {
    qual, qualDetail,
    rar: RARITIES_BY_ID[rar].name,
    recipe: recipe ? `${recipe.name} (${(recipe.chance * 100).toFixed(0)}%)` : '—',
    time: 120,
    foodRec,
  };
}
