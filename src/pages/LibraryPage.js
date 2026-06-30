import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { ensureProject, persistProject, getSettings } from '../app/state.js';
import { LIBRARY, addCatalogItemToProject } from '../engine/estimate.js';
import { createEstimateItem } from '../engine/projectFactory.js';
import { formatMoney } from '../utils/format.js';
import { itemUnitCostRub } from '../engine/currency.js';
import { toast } from '../utils/dom.js';

export function LibraryPage(root) {
  const p = ensureProject(); const settings = getSettings(); const q = new URLSearchParams(location.hash.split('?')[1] || ''); const search = q.get('q') || ''; const category = q.get('category') || 'all';
  const categories = ['all', ...new Set(LIBRARY.map(i=>i.category).filter(Boolean))].sort();
  const items = LIBRARY.filter(i => (category==='all'||i.category===category) && `${i.name} ${i.brand} ${i.model} ${i.category} ${i.supplier || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0,60);
  root.innerHTML = AppLayout(`${PageHeader({ title: 'Библиотека', description: 'Поиск оборудования и добавление позиций в смету.', actions: `<span class="badge lime">${LIBRARY.length} позиций</span>` })}
  <div class="card"><div class="grid cols3"><label class="field"><span>Поиск</span><input data-lib-search value="${search}" placeholder="модель, бренд, поставщик"></label><label class="field"><span>Категория</span><select data-lib-category>${categories.map(c=>`<option value="${c}" ${c===category?'selected':''}>${c==='all'?'Все категории':c}</option>`).join('')}</select></label><label class="field"><span>Зона для добавления</span><select data-target-zone><option value="">Без зоны</option>${p.zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('')}</select></label></div></div>
  <div class="separator"></div>${items.length ? `<div class="libraryGrid">${items.map(item=>`<article class="card itemCard"><div><div class="itemTitle">${item.name}</div><div class="muted">${item.brand} ${item.model}${item.article ? ` · арт. ${item.article}` : ''}</div></div><div><span class="badge">${item.category}</span> ${item.supplier ? `<span class="badge lime">${item.supplier}</span>` : ''}</div><strong>${formatMoney(itemUnitCostRub(item, settings))}</strong><div class="muted smallText">${item.currency === 'USD' ? `$${Number(item.unitCost || 0).toLocaleString('ru-RU')} · курс ${settings.usdRate}` : `${formatMoney(item.unitCost)}`}</div><button class="btn primary small" data-add-library="${item.id}">Добавить в смету</button></article>`).join('')}</div>` : EmptyState({ title: 'Ничего не найдено', text: 'Сбросьте фильтры или добавьте ручную позицию.', actions: '<button class="btn ghost" data-reset-library>Сбросить фильтры</button><button class="btn primary" data-add-manual-lib>Добавить ручную позицию</button>' })}`);
  bindLayoutActions(root); bind(root,p);
}
function bind(root,p){
  const updateHash=()=>{const q=root.querySelector('[data-lib-search]').value; const c=root.querySelector('[data-lib-category]').value; location.hash=`#/library?q=${encodeURIComponent(q)}&category=${encodeURIComponent(c)}`;};
  root.querySelector('[data-lib-search]')?.addEventListener('change',updateHash); root.querySelector('[data-lib-category]')?.addEventListener('change',updateHash);
  root.querySelector('[data-reset-library]')?.addEventListener('click',()=>{location.hash='#/library';});
  root.querySelector('[data-add-manual-lib]')?.addEventListener('click',()=>{p.estimateItems.push(createEstimateItem({name:'Ручная позиция', category:'Оборудование', currency:'RUB', source:'manual', isManual:true, note:'добавлено из пустого состояния библиотеки'})); persistProject(); toast('Ручная позиция добавлена'); location.hash='#/estimate?mode=detailed';});
  root.querySelectorAll('[data-add-library]').forEach(btn=>btn.addEventListener('click',()=>{const item=LIBRARY.find(i=>i.id===btn.dataset.addLibrary); addCatalogItemToProject(p,item,root.querySelector('[data-target-zone]').value); persistProject(); toast('Позиция добавлена в смету');}));
}
