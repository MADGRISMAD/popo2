// ============================================================
// render/renderShop.js — panel izquierdo: tienda, misión, mini.
// ============================================================

import { state } from '../gameState.js';
import { PARK_OBJECTS } from '../data/parkObjects.js';
import { UPGRADES } from '../data/upgrades.js';
import { buyParkObject } from '../systems/parkSystem.js';
import { buyUpgrade } from '../systems/inventorySystem.js';
import { MISSIONS_BY_ID } from '../data/missions.js';
import { fmt } from './juice.js';

// Barra "casi lo tienes" + brillo sincronizado (no se reinicia al re-renderizar)
function affordBits (cost) {
  const have = state.resources.poop;
  const can = have >= cost;
  const pct = Math.min(100, (have / Math.max(1, cost)) * 100);
  const sync = `animation-delay:-${(performance.now() % 1600).toFixed(0)}ms`;
  return {
    cls: can ? ' affordable' : pct >= 75 ? ' almost' : '',
    style: can ? sync : '',
    bar: can ? '' : `<div class="afford-bar"><div class="afford-fill" style="width:${pct}%"></div></div>`,
  };
}

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
    const a = affordBits(cost);
    return { cost, html: `
      <div class="shop-item${a.cls}" style="${a.style}" data-tooltip="${u.name}: ${u.desc}">
        <div>
          <div class="name">${u.icon} ${u.name}</div>
          <div class="price">Nv ${lvl} → ${lvl + 1}</div>
          ${a.bar}
        </div>
        <div class="price">💩 ${fmt(cost)}</div>
        <button class="btn small" ${state.resources.poop < cost ? 'disabled' : ''} data-buy-upg="${u.id}">Comprar</button>
      </div>` };
  }).filter(Boolean);

  const objItems = PARK_OBJECTS.map(o => {
    const owned = state.inventory.parkUpgrades[o.id] || 0;
    if (o.max && owned >= o.max) return null;
    const a = affordBits(o.cost);
    return { cost: o.cost, html: `
      <div class="shop-item${a.cls}" style="${a.style}" data-tooltip="${o.name}: ${o.desc}">
        <div>
          <div class="name">${o.icon} ${o.name}</div>
          <div class="price">Tienes ${owned}${o.max ? '/' + o.max : ''}</div>
          ${a.bar}
        </div>
        <div class="price">💩 ${fmt(o.cost)}</div>
        <button class="btn small" ${state.resources.poop < o.cost ? 'disabled' : ''} data-buy-obj="${o.id}">Comprar</button>
      </div>` };
  }).filter(Boolean);

  // Lo más barato primero: siempre hay algo "a punto" de comprarse
  const items = [...upgItems, ...objItems].sort((a, b) => a.cost - b.cost).slice(0, 8);
  const html = items.map(x => x.html).join('');
  // Evita re-crear el DOM si no cambió nada (mantiene hover y clicks)
  if (wrap._lastHtml === html.replace(/animation-delay:-\d+ms/g, '')) return;
  wrap._lastHtml = html.replace(/animation-delay:-\d+ms/g, '');
  wrap.innerHTML = html;

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
    <div class="desc">Recompensa: 💩 ${fmt(g.reward.poop || 0)} · ⭐ ${g.xp || 10} XP</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    <div class="desc" style="margin-top:4px;">${(g.progress || 0)} / ${g.target}</div>
  `;
}
