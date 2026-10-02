// ============================================================
// render/renderCollection.js — Álbum de razas, híbridos, mutaciones.
// ============================================================

import { state } from '../gameState.js';
import { BREEDS, BREEDS_BY_ID, RARITIES_BY_ID, QUALITIES_BY_ID } from '../data/dogs.js';
import { BREEDING_RECIPES } from '../data/breedingRecipes.js';
import { dogPortrait } from './renderDogs.js';

export function renderCollection (wrap) {
  const breedsHtml = BREEDS.map(b => {
    const slot = state.collection.breeds[b.id];
    if (!slot?.discovered) {
      return `<div class="collection-cell locked">
        <div class="silhouette"><img class="dog-portrait" src="${dogPortrait({ breed: b.id, rarity: b.rarity, age: 'adult' }, { silhouette: true })}" alt=""></div>
        <div>?????</div>
      </div>`;
    }
    return `<div class="collection-cell">
      <div class="silhouette"><img class="dog-portrait" src="${dogPortrait({ breed: b.id, rarity: b.rarity, age: 'adult' })}" alt=""></div>
      <div><strong>${b.name}</strong></div>
      <div style="font-size:10px;opacity:.8;">${RARITIES_BY_ID[b.rarity].name}</div>
      <div style="font-size:10px;">Mejor: ${QUALITIES_BY_ID[slot.bestQuality].name}</div>
    </div>`;
  }).join('');

  const hybridsHtml = BREEDING_RECIPES.filter(r => !r.requireTrait).map(r => {
    const found = !!state.collection.hybrids[r.result];
    return `<div class="collection-cell ${found ? '' : 'locked'}">
      <div class="silhouette">${found ? '🧬' : '❓'}</div>
      <div>${found ? r.name : '?????'}</div>
      <div style="font-size:10px;">${found ? RARITIES_BY_ID[r.rarity].name : ''}</div>
    </div>`;
  }).join('');

  const mutationsHtml = BREEDING_RECIPES.filter(r => r.requireTrait).map(r => {
    const found = !!state.collection.mutations[r.result];
    return `<div class="collection-cell ${found ? '' : 'locked'}">
      <div class="silhouette">${found ? '☢️' : '❓'}</div>
      <div>${found ? r.name : '?????'}</div>
    </div>`;
  }).join('');

  const discovered = Object.keys(state.collection.breeds).length;
  wrap.innerHTML = `
    <h4 style="margin-bottom:6px;">Razas (${discovered}/${BREEDS.length})</h4>
    <div class="collection-grid">${breedsHtml}</div>
    <h4 style="margin:12px 0 6px;">Híbridos</h4>
    <div class="collection-grid">${hybridsHtml || '<div style="opacity:.6; font-size:12px;">Aún sin recetas reveladas.</div>'}</div>
    <h4 style="margin:12px 0 6px;">Mutaciones</h4>
    <div class="collection-grid">${mutationsHtml || '<div style="opacity:.6; font-size:12px;">Sin mutaciones aún.</div>'}</div>
  `;
}
