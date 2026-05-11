// ============================================================
// render/renderShop.js — panel izquierdo: tienda, misión, mini.
// ============================================================

import { state } from '../gameState.js';
import { PARK_OBJECTS } from '../data/parkObjects.js';
import { UPGRADES } from '../data/upgrades.js';
import { buyParkObject } from '../systems/parkSystem.js';
import { buyUpgrade } from '../systems/inventorySystem.js';
import { MISSIONS_BY_ID } from '../data/missions.js';

const $ = id => document.getElementById(id);

export function renderShop () {
  renderShopList();
  renderMission();
  renderGoal();
}

function renderShopList () {
  const wrap = $('shop-list');
  if (!wrap) return;
  // Mostrar mejoras top 3 + objetos top 3 (ciclando para que entre todo)
  const upgItems = UPGRADES.map(u => {
    const lvl = state.inventory.upgrades[u.id] || 0;
    if (lvl >= u.maxLevel) return null;
    const cost = u.cost(lvl);
    return { html: `
      <div class="shop-item" data-tooltip="${u.name}: ${u.desc}">
        <div>
          <div class="name">${u.icon} ${u.name}</div>
          <div class="price">Nv ${lvl} → ${lvl + 1}</div>
        </div>
        <div class="price">💩 ${cost.toLocaleString('es')}</div>
        <button class="btn small" ${state.resources.poop < cost ? 'disabled' : ''} data-buy-upg="${u.id}">Comprar</button>
      </div>` };
  }).filter(Boolean);

  const objItems = PARK_OBJECTS.map(o => {
    const owned = state.inventory.parkUpgrades[o.id] || 0;
    if (o.max && owned >= o.max) return null;
    return { html: `
      <div class="shop-item" data-tooltip="${o.name}: ${o.desc}">
        <div>
          <div class="name">${o.icon} ${o.name}</div>
          <div class="price">Tienes ${owned}${o.max ? '/' + o.max : ''}</div>
        </div>
        <div class="price">💩 ${o.cost.toLocaleString('es')}</div>
        <button class="btn small" ${state.resources.poop < o.cost ? 'disabled' : ''} data-buy-obj="${o.id}">Comprar</button>
      </div>` };
  }).filter(Boolean);

  wrap.innerHTML = [...upgItems.slice(0, 4), ...objItems.slice(0, 4)].map(x => x.html).join('');

  wrap.querySelectorAll('[data-buy-upg]').forEach(btn => {
    btn.onclick = () => { buyUpgrade(btn.dataset.buyUpg); renderShop(); };
  });
  wrap.querySelectorAll('[data-buy-obj]').forEach(btn => {
    btn.onclick = () => { buyParkObject(btn.dataset.buyObj); renderShop(); };
  });
}

function renderMission () {
  const el = $('mission-card');
  if (!el) return;
  const id = state.progression.activeMission;
  if (!id) { el.innerHTML = `<div class="title">Todas las misiones completadas 🏆</div>`; return; }
  const m = MISSIONS_BY_ID[id];
  if (!m) { el.innerHTML = ''; return; }
  const prog = state.progression.missionProgress;
  const pct = Math.min(100, (prog / m.target) * 100);
  el.innerHTML = `
    <div class="title">${m.title}</div>
    <div class="desc">${m.desc}</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="desc" style="margin-top:4px;">${Math.min(prog, m.target)} / ${m.target}</div>
  `;
}

function renderGoal () {
  const el = $('goal-card');
  if (!el) return;
  const g = state.progression.miniGoal;
  if (!g) { el.innerHTML = ''; return; }
  const pct = Math.min(100, ((g.progress || 0) / g.target) * 100);
  el.innerHTML = `
    <div class="title">${g.title}</div>
    <div class="desc">Recompensa: 💩 ${g.reward.poop || 0}</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="desc" style="margin-top:4px;">${(g.progress || 0)} / ${g.target}</div>
  `;
}
