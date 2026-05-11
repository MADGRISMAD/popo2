// ============================================================
// systems/packSystem.js — compra y apertura de sobres.
// Animación de revelado por oleadas, agrupado, summary final.
// ============================================================

import { state } from '../gameState.js';
import { PACKS_BY_ID } from '../data/packs.js';
import { FOODS, FOODS_BY_ID } from '../data/foods.js';
import { UPGRADES } from '../data/upgrades.js';
import { PARK_OBJECTS } from '../data/parkObjects.js';
import { BREEDS, BREEDS_BY_ID, RARITIES, RARITIES_BY_ID } from '../data/dogs.js';
import { addFood, addGeneticCard, addBreedCard, addSpecialItem, storeDog } from './inventorySystem.js';
import { createDog } from './dogSystem.js';
import { logEvent } from '../eventLog.js';
import { sfx } from '../audioManager.js';
import { modal, toast } from '../modalManager.js';

const choice = arr => arr[Math.floor(Math.random() * arr.length)];

function rollWeighted (entries) {
  let total = 0;
  for (const e of entries) total += e[1];
  let r = Math.random() * total;
  for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; }
  return entries[entries.length - 1][0];
}

export function buyPack (packId, qty = 1) {
  const pack = PACKS_BY_ID[packId];
  if (!pack) return false;
  let cost = pack.cost * qty;
  // Evento descuento
  if (state.progression.eventActive?.id === 'pack_weekend') cost = Math.ceil(cost * 0.7);
  if (state.resources.poop < cost) return false;
  state.resources.poop -= cost;
  state.resources.packs[packId] = (state.resources.packs[packId] || 0) + qty;
  sfx.buy();
  logEvent(`Comprado ${qty}x ${pack.name}`);
  return true;
}

export function openPack (packId) {
  const pack = PACKS_BY_ID[packId];
  if (!pack) return null;
  if ((state.resources.packs[packId] || 0) <= 0) return null;
  state.resources.packs[packId]--;
  state.stats.totalPacksOpened++;
  // Mini goal
  if (state.progression.miniGoal?.type === 'packsOpened') {
    state.progression.miniGoal.progress = (state.progression.miniGoal.progress || 0) + 1;
  }
  return openOne(pack);
}

export function openTen (packId) {
  const pack = PACKS_BY_ID[packId];
  if (!pack) return null;
  if ((state.resources.packs[packId] || 0) < 10) return null;
  state.resources.packs[packId] -= 10;
  state.stats.totalPacksOpened += 10;
  if (state.progression.miniGoal?.type === 'packsOpened') {
    state.progression.miniGoal.progress = (state.progression.miniGoal.progress || 0) + 10;
  }
  const results = [];
  for (let i = 0; i < 10; i++) results.push(...openOne(pack, true));
  // Garantía: si es legendary y no hay raro+, fuerza uno
  if (pack.id === 'legend' && !results.some(r => r.kind === 'dog' && ['raro','epico','legend','mitico','cosmico'].includes(r.dog.rarity))) {
    const dog = createDog({ rarityWeights: { comun: 0, raro: 100, epico: 30, legend: 10, mitico: 2, cosmico: 0 } });
    storeDog(dog.id);
    results.push({ kind: 'dog', dog });
  }
  showOpenAnimation(pack, results);
  return results;
}

function openOne (pack, batch = false) {
  // 1) Decide categoría
  const dropEntries = Object.entries(pack.drops);
  const cat = rollWeighted(dropEntries);
  const out = [];

  if (cat === 'food') {
    const tierWeights = [['croquetas', 60], ['lata', 25], ['snack', 10], ['hueso', 4], ['premium', 1]];
    const fid = rollWeighted(tierWeights);
    const qty = 1 + Math.floor(Math.random() * 3);
    addFood(fid, qty);
    out.push({ kind: 'food', id: fid, qty, food: FOODS_BY_ID[fid] });
  } else if (cat === 'dog') {
    const dog = createDog({ rarityWeights: pack.rarityWeights });
    storeDog(dog.id);
    if (dog.rarity === 'legend' || dog.rarity === 'mitico' || dog.rarity === 'cosmico') {
      state.stats.totalLegendaries++;
    }
    out.push({ kind: 'dog', dog });
  } else if (cat === 'upgrade') {
    const u = choice(UPGRADES);
    state.inventory.upgrades[u.id] = Math.min(u.maxLevel, (state.inventory.upgrades[u.id] || 0) + 1);
    out.push({ kind: 'upgrade', id: u.id, name: u.name, icon: u.icon });
  } else if (cat === 'parkObject') {
    const o = choice(PARK_OBJECTS.filter(x => x.id !== 'breed_zone'));
    state.inventory.parkUpgrades[o.id] = (state.inventory.parkUpgrades[o.id] || 0) + 1;
    out.push({ kind: 'parkObject', id: o.id, name: o.name, icon: o.icon });
  } else if (cat === 'automation') {
    const ids = ['auto_collect', 'auto_feed', 'auto_breed'];
    const aid = choice(ids);
    state.inventory.automations[aid] = Math.min(5, (state.inventory.automations[aid] || 0) + 1);
    out.push({ kind: 'automation', id: aid });
  } else if (cat === 'foodBowlUp') {
    state.inventory.specialItems['bowl_up'] = (state.inventory.specialItems['bowl_up'] || 0) + 1;
    out.push({ kind: 'special', id: 'bowl_up', name: 'Mejora plato', icon: '🥣' });
  } else if (cat === 'geneticCard') {
    const ids = ['boost_quality', 'boost_rarity', 'reroll_trait'];
    const id = choice(ids);
    addGeneticCard(id);
    out.push({ kind: 'geneticCard', id });
  } else if (cat === 'breedCard') {
    const ids = ['speed_breed', 'twin_chance'];
    const id = choice(ids);
    addBreedCard(id);
    out.push({ kind: 'breedCard', id });
  } else if (cat === 'special') {
    addSpecialItem('lucky_clover');
    out.push({ kind: 'special', id: 'lucky_clover', name: 'Trébol de la suerte', icon: '🍀' });
  }

  if (!batch) {
    showSingleResult(pack, out);
  }
  return out;
}

// ---------- Animaciones de apertura ----------
function showSingleResult (pack, results) {
  const wave = results.map(r => renderRevealCard(r)).join('');
  const html = `
    <div style="text-align:center; padding:8px;">
      <div style="font-size:48px; margin-bottom:8px;">${pack.icon}</div>
      <h3 style="margin-bottom:8px;">${pack.name}</h3>
      <div class="card-grid" style="justify-content:center;">${wave}</div>
    </div>`;
  modal.open({ title: 'Sobre abierto', body: html, footer: `<button class="btn primary" onclick="document.querySelector('.close').click()">Continuar</button>` });
  sfx.packOpen();
  setTimeout(() => sfx.reveal(), 300);
  if (results.some(r => r.kind === 'dog' && ['legend', 'mitico', 'cosmico'].includes(r.dog.rarity))) {
    setTimeout(() => sfx.legendary(), 600);
  }
}

function showOpenAnimation (pack, results) {
  // Agrupar repetidos sencillos (food, etc.)
  const grouped = groupResults(results);
  const cardsHtml = grouped.map(r => renderRevealCard(r)).join('');
  const html = `
    <div style="text-align:center;">
      <div style="font-size:56px; margin-bottom:6px;">${pack.icon}</div>
      <h3 style="margin-bottom:4px;">${pack.name} x10</h3>
      <p style="color:var(--c-fg-muted); font-size:12px; margin-bottom:14px;">Resumen de la apertura</p>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px,1fr));">${cardsHtml}</div>
    </div>`;
  modal.open({ title: 'Apertura x10', body: html, wide: true, footer: `<button class="btn primary" onclick="document.querySelector('.close').click()">Continuar</button>` });
  sfx.packOpen();
  let delay = 0;
  for (const r of grouped) {
    setTimeout(() => {
      sfx.reveal();
      if (r.kind === 'dog' && ['legend', 'mitico', 'cosmico'].includes(r.dog.rarity)) sfx.legendary();
    }, delay);
    delay += 80;
  }
}

function groupResults (results) {
  const map = new Map();
  const dogs = [];
  for (const r of results) {
    if (r.kind === 'dog') { dogs.push(r); continue; }
    const k = r.kind + ':' + (r.id ?? r.name ?? 'x');
    if (!map.has(k)) map.set(k, { ...r, qty: r.qty || 1 });
    else map.get(k).qty += (r.qty || 1);
  }
  return [...dogs, ...map.values()];
}

function renderRevealCard (r) {
  if (r.kind === 'dog') {
    const d = r.dog;
    const rarityCls = RARITIES_BY_ID[d.rarity].className;
    return `<div class="card ${rarityCls}">
      <div class="card-thumb"><span style="font-size:36px">${dogEmoji(d)}</span></div>
      <div class="card-name">${d.name}</div>
      <div class="card-meta"><span>${RARITIES_BY_ID[d.rarity].name}</span><span>${d.sex === 'M' ? '♂' : '♀'}</span></div>
      <div class="card-quality q-${d.quality}"></div>
    </div>`;
  }
  if (r.kind === 'food') {
    return `<div class="card r-comun">
      <div class="card-thumb" style="font-size:32px;">${r.food.icon}</div>
      <div class="card-name">${r.food.name}</div>
      <div class="card-meta"><span>x${r.qty}</span><span>Comida</span></div>
    </div>`;
  }
  return `<div class="card r-raro">
    <div class="card-thumb" style="font-size:30px;">${r.icon || '🎁'}</div>
    <div class="card-name">${r.name || r.id}</div>
    <div class="card-meta"><span>${r.qty ? 'x' + r.qty : ''}</span><span>${r.kind}</span></div>
  </div>`;
}

function dogEmoji (d) {
  // Emoji secundario solo en cards (los activos en parque sí son CSS/Canvas)
  if (d.rarity === 'cosmico') return '🌌';
  if (d.rarity === 'mitico') return '🔥';
  if (d.rarity === 'legend') return '🌟';
  return '🐕';
}
