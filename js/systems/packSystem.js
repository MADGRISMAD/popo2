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
import { gainXP } from './hookSystem.js';
import { HOOKS, PARK } from '../config.js';
import { confetti } from '../render/particles.js';
import { shake, flash } from '../render/juice.js';
import { dogPortrait } from '../render/renderDogs.js';

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
  gainXP(HOOKS.XP_PER_PACK);
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
  gainXP(HOOKS.XP_PER_PACK * 10);
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
// Las cartas salen boca abajo con un brillo del color de su rareza (pista)
// y se voltean una a una. La mejor siempre queda para el final.
const TIER_OF = { comun: 0, raro: 1, epico: 2, legend: 3, mitico: 4, cosmico: 5 };
function tierOf (r) { return r.kind === 'dog' ? (TIER_OF[r.dog.rarity] ?? 0) : 0; }
function glowOf (r) { return r.kind === 'dog' ? `var(--r-${r.dog.rarity})` : '#d8a861'; }

function wrapFlip (r) {
  const tier = tierOf(r);
  return `<div class="flip tier-${tier}" data-tier="${tier}" style="--glow:${glowOf(r)}">
    <div class="flip-inner">
      <div class="flip-back"><span>?</span></div>
      <div class="flip-front">${renderRevealCard(r)}</div>
    </div>
  </div>`;
}

function runReveal (root, gapMs = 220) {
  const cards = [...root.querySelectorAll('.flip')];
  let i = 0;
  const flipOne = (el) => {
    if (el.classList.contains('flipped')) return;
    el.classList.add('flipped');
    const tier = +el.dataset.tier;
    if (tier >= 3) {
      sfx.legendary();
      shake(6 + tier * 2);
      flash('rgba(255,215,120,0.45)');
      confetti(PARK.W / 2, PARK.H / 2, 50 + tier * 10);
    } else if (tier >= 1) sfx.stickerPop();
    else sfx.reveal();
  };
  cards.forEach(el => { el.onclick = () => flipOne(el); });
  const next = () => {
    if (!root.isConnected || i >= cards.length) return;
    const el = cards[i++];
    const tier = +el.dataset.tier;
    if (el.classList.contains('flipped')) { next(); return; }
    if (tier >= 2) {
      // Suspense: la carta tiembla y brilla antes de voltearse
      el.classList.add('charging');
      sfx.paperSlide();
      setTimeout(() => { el.classList.remove('charging'); flipOne(el); setTimeout(next, gapMs + 250); }, 550 + tier * 160);
    } else {
      flipOne(el);
      setTimeout(next, gapMs);
    }
  };
  setTimeout(next, 450);
}

function showSingleResult (pack, results) {
  const sorted = results.slice().sort((a, b) => tierOf(a) - tierOf(b));
  const html = `
    <div style="text-align:center; padding:8px;">
      <div class="pack-burst">${pack.icon}</div>
      <h3 style="margin-bottom:8px;">${pack.name}</h3>
      <div class="card-grid reveal-grid" style="justify-content:center;">${sorted.map(wrapFlip).join('')}</div>
      <p class="reveal-hint">Click en una carta para voltearla</p>
    </div>`;
  const m = modal.open({ title: 'Sobre abierto', body: html, footer: `<button class="btn primary" data-close-modal>Continuar</button>${(state.resources.packs[pack.id] || 0) > 0 ? `<button class="btn gold" data-again>Abrir otro (${state.resources.packs[pack.id]})</button>` : ''}` });
  wireFooter(m, pack, false);
  sfx.packOpen();
  runReveal(m);
}

function showOpenAnimation (pack, results) {
  // Agrupar repetidos sencillos (food, etc.) y dejar lo mejor al final
  const grouped = groupResults(results).sort((a, b) => tierOf(a) - tierOf(b));
  const html = `
    <div style="text-align:center;">
      <div class="pack-burst">${pack.icon}</div>
      <h3 style="margin-bottom:4px;">${pack.name} x10</h3>
      <p class="reveal-hint" style="margin-bottom:14px;">Lo mejor sale al final… 👀</p>
      <div class="card-grid reveal-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px,1fr));">${grouped.map(wrapFlip).join('')}</div>
    </div>`;
  const m = modal.open({ title: 'Apertura x10', body: html, wide: true, footer: `<button class="btn primary" data-close-modal>Continuar</button>${(state.resources.packs[pack.id] || 0) >= 10 ? `<button class="btn gold" data-again>Abrir otros 10 (${state.resources.packs[pack.id]})</button>` : ''}` });
  wireFooter(m, pack, true);
  sfx.packOpen();
  runReveal(m, 160);
}

function wireFooter (m, pack, ten) {
  const close = m.querySelector('[data-close-modal]');
  if (close) close.onclick = () => modal.close();
  const again = m.querySelector('[data-again]');
  if (again) again.onclick = () => { if (ten) openTen(pack.id); else openPack(pack.id); };
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
      <div class="card-thumb"><img class="dog-portrait" src="${dogPortrait(d)}" alt=""></div>
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
