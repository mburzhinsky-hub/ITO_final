import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { ensureProject, persistProject } from '../app/state.js';
import { LIBRARY, addCatalogItemToProject } from '../engine/estimate.js';
import { formatMoney } from '../utils/format.js';
import { toast } from '../utils/dom.js';

export function LibraryPage(root) {
  const p = ensureProject(); const q = new URLSearchParams(location.hash.split('?')[1] || ''); const search = q.get('q') || ''; const category = q.get('category') || 'all';
  const categories = ['all', ...new Set(LIBRARY.map(i=>i.category).filter(Boolean))].sort();
  const items = LIBRARY.filter(i => (category==='all'||i.category===category) && `${i.name} ${i.brand} ${i.model} ${i.category}`.toLowerCase().includes(search.toLowerCase())).slice(0,60);
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Библиотека</h2><p>Каталог оборудования физически вынесен в /src/data/catalog.js и не смешан с UI.</p></div><span class="badge lime">${LIBRARY.length} позиций</span></div>
  <div class="card"><div class="grid cols3"><label class="field"><span>Поиск</span><input data-lib-search value="${search}" placeholder="модель, бренд, категория"></label><label class="field"><span>Категория</span><select data-lib-category>${categories.map(c=>`<option value="${c}" ${c===category?'selected':''}>${c==='all'?'Все категории':c}</option>`).join('')}</select></label><label class="field"><span>Зона для добавления</span><select data-target-zone><option value="">Без зоны</option>${p.zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('')}</select></label></div></div>
  <div class="separator"></div><div class="libraryGrid">${items.map(item=>`<article class="card itemCard"><div><div class="itemTitle">${item.name}</div><div class="muted">${item.brand} ${item.model}</div></div><div><span class="badge">${item.category}</span> <span class="badge">${item.scenario}</span></div><strong>${formatMoney(item.priceRub)}</strong><p class="muted">${item.note?.slice(0,160) || ''}</p><button class="btn primary small" data-add-library="${item.id}">Добавить в смету</button></article>`).join('')}</div>`);
  bindLayoutActions(root); bind(root,p,search,category);
}
function bind(root,p,search,category){
  const updateHash=()=>{const q=root.querySelector('[data-lib-search]').value; const c=root.querySelector('[data-lib-category]').value; location.hash=`#/library?q=${encodeURIComponent(q)}&category=${encodeURIComponent(c)}`;};
  root.querySelector('[data-lib-search]')?.addEventListener('change',updateHash); root.querySelector('[data-lib-category]')?.addEventListener('change',updateHash);
  root.querySelectorAll('[data-add-library]').forEach(btn=>btn.addEventListener('click',()=>{const item=LIBRARY.find(i=>i.id===btn.dataset.addLibrary); addCatalogItemToProject(p,item,root.querySelector('[data-target-zone]').value); persistProject(); toast('Позиция добавлена в смету');}));
}
