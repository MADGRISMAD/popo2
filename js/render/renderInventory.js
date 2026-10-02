// ============================================================
// render/renderInventory.js — panel derecho con pestañas.
// ============================================================

import { state } from '../gameState.js';
import { BREEDS_BY_ID, RARITIES_BY_ID, QUALITIES_BY_ID, STAT_LABELS } from '../data/dogs.js';
import { FOODS, FOODS_BY_ID, FOOD_EFFECT_DESC } from '../data/foods.js';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades.js';
import { PARK_OBJECTS, PARK_OBJECTS_BY_ID, PARK_OBJECT_CATEGORIES } from '../data/parkObjects.js';
import { PACK_TYPES, PACKS_BY_ID } from '../data/packs.js';
import { TRAITS_BY_ID } from '../data/traits.js';
import { SPECIALIZATIONS, SPECIALIZATIONS_BY_ID } from '../data/specializations.js';
import { activateDog, deactivateDog, storedDogs, activeDogs, getDog, xpToNext } from '../systems/dogSystem.js';
import { buyPack, openPack, openTen } from '../systems/packSystem.js';
import { refillBowl } from '../systems/foodBowlSystem.js';
import { sellDog, dogValue, canSellDog } from '../systems/sellSystem.js';
import { buyParkObject } from '../systems/parkSystem.js';
import { chooseSpecialization } from '../systems/specializationSystem.js';
import { renderBreeding } from './renderBreeding.js';
import { renderCollection } from './renderCollection.js';
import { dogPortrait } from './renderDogs.js';

const TABS = [
  { id: 'shop',      name: 'Sobres' },
  { id: 'dogs',      name: 'Perros' },
  { id: 'food',      name: 'Comida' },
  { id: 'upgrades',  name: 'Mejoras' },
  { id: 'parkObj',   name: 'Parque' },
  { id: 'breeding',  name: 'Crianza' },
  { id: 'spec',      name: 'Estilo' },
  { id: 'collection',name: 'Colección' },
  { id: 'stats',     name: 'Stats' },
];

let activeTab = 'shop';
let parkObjFilter = 'all';
const $ = id => document.getElementById(id);

export function renderInventory () {
  renderTabs();
  renderTabContent();
}

function renderTabs () {
  const wrap = $('inventory-tabs');
  if (!wrap) return;
  const unopened = Object.values(state.resources.packs || {}).reduce((a, b) => a + (b || 0), 0);
  const badge = id => id === 'shop' && unopened > 0 ? `<span class="tab-badge">${unopened}</span>` : '';
  wrap.innerHTML = TABS.map(t => `<button class="tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.name}${badge(t.id)}</button>`).join('');
  wrap.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => { activeTab = btn.dataset.tab; renderInventory(); };
  });
}

function renderTabContent () {
  const wrap = $('inventory-content');
  if (!wrap) return;
  switch (activeTab) {
    case 'shop':       wrap.innerHTML = renderShopTab();     attachShopTab(wrap);     break;
    case 'dogs':       wrap.innerHTML = renderDogsTab();     attachDogsTab(wrap);     break;
    case 'food':       wrap.innerHTML = renderFoodTab();     attachFoodTab(wrap);     break;
    case 'upgrades':   wrap.innerHTML = renderUpgradesTab(); attachUpgradesTab(wrap); break;
    case 'parkObj':    wrap.innerHTML = renderParkObjTab();  attachParkObjTab(wrap);  break;
    case 'breeding':   renderBreeding(wrap); break;
    case 'spec':       wrap.innerHTML = renderSpecTab();     attachSpecTab(wrap);     break;
    case 'collection': renderCollection(wrap); break;
    case 'stats':      wrap.innerHTML = renderStatsTab();    break;
  }
}

// ---------- Tabs ----------
function renderShopTab () {
  return `
    <div class="pack-list">
      ${PACK_TYPES.map(p => `
        <div class="pack ${p.className}">
          <div class="pack-icon">${p.icon}${(state.resources.packs[p.id] || 0) > 0 ? `<span class="pack-count">${state.resources.packs[p.id]}</span>` : ''}</div>
          <div class="pack-head"><div class="pack-name">${p.name}</div><div class="pack-price">💩 ${p.cost.toLocaleString('es')}</div></div>
          <div class="pack-desc">${p.desc}</div>
          <div class="pack-actions">
            <button class="btn small" data-buy="${p.id}" data-qty="1" ${state.resources.poop < p.cost ? 'disabled' : ''}>Comprar 1</button>
            <button class="btn small purple" data-buy="${p.id}" data-qty="10" ${state.resources.poop < p.cost * 10 ? 'disabled' : ''}>Comprar 10</button>
          </div>
          <div class="pack-actions">
            <button class="btn small primary" data-open="${p.id}" ${(state.resources.packs[p.id] || 0) < 1 ? 'disabled' : ''}>Abrir 1 (${state.resources.packs[p.id] || 0})</button>
            <button class="btn small gold" data-open10="${p.id}" ${(state.resources.packs[p.id] || 0) < 10 ? 'disabled' : ''}>Abrir 10</button>
          </div>
        </div>`).join('')}
    </div>`;
}
function attachShopTab (wrap) {
  wrap.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { buyPack(b.dataset.buy, +b.dataset.qty); renderInventory(); });
  wrap.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { openPack(b.dataset.open); renderInventory(); });
  wrap.querySelectorAll('[data-open10]').forEach(b => b.onclick = () => { openTen(b.dataset.open10); renderInventory(); });
}

function renderDogsTab () {
  const stored = storedDogs();
  const active = activeDogs();
  return `
    <h4 style="margin-bottom:6px;">En el parque (${active.length}/${state.park.capacity})</h4>
    <div class="card-grid">${active.map(dogCard).join('') || '<div style="opacity:0.6;font-size:12px;">Vacío</div>'}</div>
    <h4 style="margin:12px 0 6px;">Guardados (${stored.length})</h4>
    <div class="card-grid">${stored.map(dogCard).join('') || '<div style="opacity:0.6;font-size:12px;">Vacío</div>'}</div>
  `;
}
function dogCard (d) {
  const r = RARITIES_BY_ID[d.rarity];
  const q = QUALITIES_BY_ID[d.quality];
  const breed = BREEDS_BY_ID[d.breed];
  const isActive = state.park.activeDogs.includes(d.id);
  const traits = (d.traits || []).slice(0, 3).map(t => TRAITS_BY_ID[t]?.icon || '').join(' ');
  const value = dogValue(d);
  const sellOk = canSellDog(d).ok;
  // Tooltip resumido
  const traitsList = (d.traits || []).map(t => {
    const tr = TRAITS_BY_ID[t]; if (!tr) return t;
    return `${tr.icon} ${tr.name}`;
  }).join(', ') || '—';
  const tooltip = `<strong>${d.name}</strong> ${d.sex === 'M' ? '♂' : '♀'}<br>` +
    `${r.name} · ${q.name} · ${breed?.name || ''}<br>` +
    `Edad: ${d.age} · Nivel ${d.level || 1}<br>` +
    `Hambre: ${d.hunger.toFixed(0)} · Felicidad: ${d.happiness.toFixed(0)}<br>` +
    `Cago ${d.stats?.cago ?? '?'} · Vel ${d.stats?.vel ?? '?'} · Pelea ${d.stats?.pelea ?? '?'}<br>` +
    `Traits: ${traitsList}<br>` +
    `Valor: 💩 ${value.toLocaleString('es')}`;

  const xpNext = xpToNext(d.level || 1);
  const xpPct = Math.min(100, ((d.xp || 0) / xpNext) * 100);

  return `<div class="card ${r.className}" data-tooltip="${tooltip}">
    <div class="card-thumb"><img class="dog-portrait" src="${dogPortrait(d)}" alt=""></div>
    <div class="card-name">${d.name} ${d.sex === 'M' ? '♂' : '♀'}</div>
    <div class="card-meta"><span>${r.name}</span><span>Nv ${d.level || 1}</span></div>
    <div class="progress-bar" style="height:3px; margin-top:2px;"><div class="progress-fill" style="width:${xpPct}%; background: linear-gradient(90deg,#60a5fa,#a855f7);"></div></div>
    <div class="card-meta"><span>${traits}</span><span>${d.state}</span></div>
    <div class="card-quality q-${d.quality}"></div>
    <div style="display:flex; gap:4px; margin-top:6px;">
      <button class="btn small ${isActive ? 'danger' : 'primary'}" data-toggle="${d.id}" style="flex:1;">${isActive ? 'Guardar' : 'Activar'}</button>
      <button class="btn small ghost" data-sell="${d.id}" ${sellOk ? '' : 'disabled'} title="Vender por 💩 ${value}">💰</button>
    </div>
  </div>`;
}
function attachDogsTab (wrap) {
  wrap.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
    const id = +b.dataset.toggle;
    const isActive = state.park.activeDogs.includes(id);
    if (isActive) deactivateDog(id); else activateDog(id);
    renderInventory();
  });
  wrap.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
    const id = +b.dataset.sell;
    const dog = state.dogs.map[id];
    if (!dog) return;
    if (confirm(`¿Vender ${dog.name} por 💩 ${dogValue(dog).toLocaleString('es')}?`)) {
      sellDog(id);
      renderInventory();
    }
  });
}

function renderFoodTab () {
  return `
    <div style="display:grid; gap:6px;">
      ${FOODS.map(f => {
        const owned = state.inventory.food[f.id] || 0;
        const chefDiscount = (state.inventory.parkUpgrades?.chef_perruno || 0) > 0 ? 0.75 : 1;
        const cost = Math.floor(f.cost * chefDiscount);
        return `<div class="bowl-card" data-tooltip="<strong>${f.name}</strong><br>${FOOD_EFFECT_DESC[f.effect ?? 'null']}<br>+${f.hunger} hambre · +${f.happiness} fel.">
          <div class="ico">${f.icon}</div>
          <div>
            <div class="name">${f.name}</div>
            <div class="meta">+${f.hunger} hambre · +${f.happiness} fel.</div>
          </div>
          <div style="text-align:right;">
            <div class="meta">x${owned}</div>
            <button class="btn small" ${state.resources.poop < cost ? 'disabled' : ''} data-buyfood="${f.id}">💩 ${cost}</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <h4 style="margin:12px 0 6px;">Platos en el parque</h4>
    <div style="display:grid; gap:6px;">
      ${state.park.bowls.map(b => {
        const f = FOODS_BY_ID[b.type] || FOODS_BY_ID.croquetas;
        const pct = (b.qty / b.capacity) * 100;
        return `<div class="bowl-card">
          <div class="ico">${f.icon}</div>
          <div>
            <div class="name">${f.name}</div>
            <div class="meta">${b.qty}/${b.capacity}</div>
            <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%"></div></div>
          </div>
          <div style="display:grid; gap:4px;">
            <button class="btn small primary" data-fill="${b.id}|${f.id}">Rellenar</button>
            <select class="btn small ghost" data-typechg="${b.id}" style="font-size:10px;">
              ${FOODS.map(ff => `<option value="${ff.id}" ${ff.id === b.type ? 'selected' : ''}>${ff.icon} ${ff.name}</option>`).join('')}
            </select>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}
function attachFoodTab (wrap) {
  wrap.querySelectorAll('[data-buyfood]').forEach(b => b.onclick = () => {
    const f = FOODS_BY_ID[b.dataset.buyfood];
    if (!f) return;
    const chefDiscount = (state.inventory.parkUpgrades?.chef_perruno || 0) > 0 ? 0.75 : 1;
    const cost = Math.floor(f.cost * chefDiscount);
    if (state.resources.poop < cost) return;
    state.resources.poop -= cost;
    state.inventory.food[f.id] = (state.inventory.food[f.id] || 0) + 1;
    renderInventory();
  });
  wrap.querySelectorAll('[data-fill]').forEach(b => b.onclick = () => {
    const [bid, fid] = b.dataset.fill.split('|');
    refillBowl(+bid, fid, 5);
    renderInventory();
  });
  wrap.querySelectorAll('[data-typechg]').forEach(s => s.onchange = () => {
    import('../systems/foodBowlSystem.js').then(m => { m.setBowlType(+s.dataset.typechg, s.value); renderInventory(); });
  });
}

function renderUpgradesTab () {
  return `<div style="display:grid; gap:8px;">
    ${UPGRADES.map(u => {
      const lvl = state.inventory.upgrades[u.id] || 0;
      const cost = lvl < u.maxLevel ? u.cost(lvl) : null;
      return `<div class="object-card" data-tooltip="${u.desc}">
        <div class="name">${u.icon} ${u.name} <span style="opacity:0.7;">(Nv ${lvl}/${u.maxLevel})</span></div>
        <div class="desc">Bonus actual: ${formatEffect(u, lvl)}</div>
        ${cost !== null ? `<button class="btn small primary" ${state.resources.poop < cost ? 'disabled' : ''} data-buyup="${u.id}">Mejorar (💩 ${cost})</button>` : `<div class="desc">Nivel máximo</div>`}
      </div>`;
    }).join('')}
  </div>`;
}
function attachUpgradesTab (wrap) {
  wrap.querySelectorAll('[data-buyup]').forEach(b => b.onclick = () => {
    import('../systems/inventorySystem.js').then(m => { m.buyUpgrade(b.dataset.buyup); renderInventory(); });
  });
}

function renderParkObjTab () {
  const cats = [{ id: 'all', name: 'Todos' }, ...PARK_OBJECT_CATEGORIES];
  const filterBar = `
    <div class="tabs" style="margin-bottom:8px;">
      ${cats.map(c => `<button class="tab ${parkObjFilter === c.id ? 'active' : ''}" data-pof="${c.id}">${c.name}</button>`).join('')}
    </div>`;
  const items = PARK_OBJECTS.filter(o => parkObjFilter === 'all' || o.cat === parkObjFilter);
  const list = items.map(o => {
    const owned = state.inventory.parkUpgrades[o.id] || 0;
    return `<div class="object-card" data-tooltip="${o.desc}">
      <div class="name">${o.icon} ${o.name} <span style="opacity:0.7;">(${owned}${o.max ? '/' + o.max : ''})</span></div>
      <div class="desc">${o.desc}</div>
      <button class="btn small" ${state.resources.poop < o.cost || (o.max && owned >= o.max) ? 'disabled' : ''} data-buyobj="${o.id}">Comprar (💩 ${o.cost.toLocaleString('es')})</button>
    </div>`;
  }).join('');
  return `${filterBar}<div style="display:grid; gap:8px;">${list}</div>`;
}
function attachParkObjTab (wrap) {
  wrap.querySelectorAll('[data-pof]').forEach(b => b.onclick = () => { parkObjFilter = b.dataset.pof; renderInventory(); });
  wrap.querySelectorAll('[data-buyobj]').forEach(b => b.onclick = () => { buyParkObject(b.dataset.buyobj); renderInventory(); });
}

function renderSpecTab () {
  const current = state.meta?.specialization;
  const intro = current
    ? `<div class="object-card" style="border-color:var(--c-gold-0);">
        <div class="name">Estilo actual: ${SPECIALIZATIONS_BY_ID[current]?.icon} ${SPECIALIZATIONS_BY_ID[current]?.name}</div>
        <div class="desc">${SPECIALIZATIONS_BY_ID[current]?.bonus}</div>
      </div>`
    : `<div class="object-card">
        <div class="name">Aún no has elegido un estilo</div>
        <div class="desc">Cada estilo enfoca tu parque hacia una estrategia.</div>
      </div>`;
  return `${intro}
    <div style="display:grid; gap:10px; margin-top:10px;">
      ${SPECIALIZATIONS.map(s => `
        <div class="object-card" data-tooltip="${s.bonus}">
          <div class="name">${s.icon} ${s.name}</div>
          <div class="desc">${s.desc}</div>
          <div class="desc" style="color:var(--c-gold-0);">${s.bonus}</div>
          <button class="btn small ${current === s.id ? 'gold' : 'primary'}" data-spec="${s.id}">${current === s.id ? 'Activo' : 'Elegir'}</button>
        </div>`).join('')}
    </div>`;
}
function attachSpecTab (wrap) {
  wrap.querySelectorAll('[data-spec]').forEach(b => b.onclick = () => {
    if (confirm('¿Cambiar tu especialización? Reemplazará la actual si tienes una.')) {
      chooseSpecialization(b.dataset.spec);
      renderInventory();
    }
  });
}

function renderStatsTab () {
  const s = state.stats;
  const m = (n) => (Math.floor(n)).toLocaleString('es');
  return `<div style="display:grid; gap:8px; font-size:12px;">
    <div class="object-card"><div class="name">Tiempo de juego</div><div class="desc">${formatTime(s.playTimeSec)}</div></div>
    <div class="object-card"><div class="name">Popó recolectada</div><div class="desc">${m(s.totalPoopCollected)}</div></div>
    <div class="object-card"><div class="name">Popó dorada</div><div class="desc">${m(s.totalGoldenPoop || 0)}</div></div>
    <div class="object-card"><div class="name">Combo máximo</div><div class="desc">x${(s.maxCombo || 1).toFixed(1)}</div></div>
    <div class="object-card"><div class="name">Sobres abiertos</div><div class="desc">${m(s.totalPacksOpened)}</div></div>
    <div class="object-card"><div class="name">Perros nacidos</div><div class="desc">${m(s.totalDogsBorn)}</div></div>
    <div class="object-card"><div class="name">Perros vendidos</div><div class="desc">${m(s.totalSold || 0)}</div></div>
    <div class="object-card"><div class="name">Caricias</div><div class="desc">${m(s.totalPets || 0)}</div></div>
    <div class="object-card"><div class="name">Visitantes</div><div class="desc">${m(s.totalVisitors || 0)}</div></div>
    <div class="object-card"><div class="name">Legendarios+</div><div class="desc">${m(s.totalLegendaries)}</div></div>
    <div class="object-card"><div class="name">Renombre Canino</div><div class="desc">Nivel ${state.progression.prestigeLevel} · ${state.progression.prestigePoints} pts</div></div>
  </div>`;
}

function formatTime (sec) {
  const h = Math.floor(sec / 3600), mn = Math.floor((sec % 3600) / 60), ss = sec % 60;
  return `${h}h ${mn}m ${ss}s`;
}

function formatEffect (u, lvl) {
  if (u.id === 'production') return `+${((u.effect(lvl) - 1) * 100).toFixed(0)}% producción`;
  if (u.id === 'magnet')     return `Radio ${u.effect(lvl)}px`;
  if (u.id === 'value')      return `+${((u.effect(lvl) - 1) * 100).toFixed(0)}% valor`;
  if (u.id === 'happy')      return `Decay felicidad x${u.effect(lvl).toFixed(2)}`;
  if (u.id === 'hunger')     return `Decay hambre x${u.effect(lvl).toFixed(2)}`;
  if (u.id === 'goldenchance') return `Prob. dorada ${(u.effect(lvl) * 100).toFixed(1)}%`;
  return '';
}

function dogIcon (d) {
  if (d.rarity === 'cosmico') return '🌌';
  if (d.rarity === 'mitico')  return '🔥';
  if (d.rarity === 'legend')  return '🌟';
  if (d.age === 'baby')       return '🐶';
  return '🐕';
}
