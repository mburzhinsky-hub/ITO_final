import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { ZoneCard } from '../components/ZoneCard.js';
import { ensureProject, persistProject } from '../app/state.js';
import { createZone } from '../engine/projectFactory.js';
import { generateEstimateFromZones } from '../engine/estimate.js';
import { INSTALLATION_TEMPLATES } from '../data/installationTemplates.js';
import { toast } from '../utils/dom.js';

export function ZonesPage(root) {
  const p = ensureProject();
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const search = q.get('q') || ''; const templateFilter = q.get('filter') || 'all';
  const templates = filteredTemplates(search, templateFilter).slice(0, 12);
  root.innerHTML = AppLayout(`${PageHeader({ title: 'Зоны', description: 'Соберите структуру объекта и переходите к смете.', actions: '<button class="btn primary" data-add-zone>Добавить зону</button><button class="btn ghost" data-add-typical>Добавить типовые зоны</button><button class="btn ghost" data-generate-estimate>Сгенерировать смету по зонам</button>' })}
  ${p.zones.length ? `<div class="grid zoneGrid">${p.zones.map(ZoneCard).join('')}</div>` : EmptyState({ title: 'Зоны ещё не добавлены', text: 'Добавьте зоны вручную или создайте типовые зоны для выбранного типа проекта.', actions: '<button class="btn primary" data-add-zone>Добавить зону</button><button class="btn ghost" data-add-typical>Создать типовые зоны</button>' })}
  <div class="separator"></div>
  <section class="card templatePanel"><div class="sectionTitle"><h3>Типовые зоны</h3><span class="muted">Короткий список без библиотеки оборудования</span></div>
    <div class="grid cols3"><label class="field"><span>Поиск</span><input data-template-search value="${search}" placeholder="переговорная, зал, lobby"></label><label class="field"><span>Фильтр</span><select data-template-filter><option value="all" ${templateFilter==='all'?'selected':''}>Все шаблоны</option><option value="conference" ${templateFilter==='conference'?'selected':''}>Переговорные</option><option value="hall" ${templateFilter==='hall'?'selected':''}>Залы / public</option><option value="content" ${templateFilter==='content'?'selected':''}>Контент</option></select></label><div class="field"><span>&nbsp;</span><button class="btn ghost" data-reset-template-filter>Сбросить</button></div></div>
    ${templates.length ? `<div class="libraryGrid compactTemplates">${templates.map(t=>`<article class="card itemCard"><div class="itemTitle">${t.name}</div><div class="muted smallText">${t.goal || 'Типовая зона'}</div><button class="btn ghost small" data-template-zone="${t.id}">Добавить</button></article>`).join('')}</div>` : EmptyState({ title: 'Ничего не найдено', text: 'Сбросьте фильтры или добавьте зону вручную.', actions: '<button class="btn ghost" data-reset-template-filter>Сбросить фильтры</button><button class="btn primary" data-add-zone>Добавить зону</button>' })}
  </section>`);
  bindLayoutActions(root); bind(root,p);
}
function filteredTemplates(search, filter) {
  return INSTALLATION_TEMPLATES.filter(t => {
    const text = `${t.name} ${t.goal || ''} ${t.zone?.type || ''} ${t.zone?.task || ''}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || text.includes(filter);
    return matchesSearch && matchesFilter;
  });
}
function addTypicalZones(p) {
  const sample = INSTALLATION_TEMPLATES.slice(0, 4);
  sample.forEach(t => p.zones.push(createZone({ name: t.name, ...(t.zone || {}) })));
}
function bind(root,p){
  root.querySelectorAll('[data-add-zone]').forEach(btn=>btn.addEventListener('click',()=>{p.zones.push(createZone({name:`Зона ${p.zones.length+1}`})); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-add-typical]').forEach(btn=>btn.addEventListener('click',()=>{addTypicalZones(p); persistProject(); toast('Типовые зоны добавлены'); ZonesPage(root);}));
  root.querySelector('[data-generate-estimate]')?.addEventListener('click',()=>{const report = generateEstimateFromZones(p, { mode: 'replace' }); persistProject(); toast(`Добавлено строк: ${report.added}`); location.hash = '#/estimate';});
  root.querySelectorAll('[data-template-zone]').forEach(btn=>btn.addEventListener('click',()=>{const t=INSTALLATION_TEMPLATES.find(x=>x.id===btn.dataset.templateZone); p.zones.push(createZone({name:t.name, ...(t.zone||{})})); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-zone-delete]').forEach(btn=>btn.addEventListener('click',()=>{p.zones=p.zones.filter(z=>z.id!==btn.dataset.zoneDelete); p.estimateItems.forEach(i=>{if(i.zoneId===btn.dataset.zoneDelete)i.zoneId='';}); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-zone-duplicate]').forEach(btn=>btn.addEventListener('click',()=>{const z=p.zones.find(x=>x.id===btn.dataset.zoneDuplicate); if(!z) return; p.zones.push(createZone({...structuredClone(z), id: undefined, name: `${z.name} · копия`})); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-zone-estimate]').forEach(btn=>btn.addEventListener('click',()=>{const report = generateEstimateFromZones(p, { mode: 'append' }); persistProject(); toast(`Смета обновлена. Добавлено строк: ${report.added}`); location.hash = '#/estimate';}));
  root.querySelectorAll('[data-zone-field]').forEach(el=>el.addEventListener('input',()=>{const z=p.zones.find(x=>x.id===el.dataset.zoneId); z[el.dataset.zoneField]=el.type==='number'?Number(el.value):el.value; persistProject();}));
  root.querySelectorAll('[data-zone-flag]').forEach(el=>el.addEventListener('change',()=>{const z=p.zones.find(x=>x.id===el.dataset.zoneId); z.flags[el.dataset.zoneFlag]=el.checked; persistProject(); ZonesPage(root);}));
  const updateHash=()=>{const q=root.querySelector('[data-template-search]')?.value || ''; const f=root.querySelector('[data-template-filter]')?.value || 'all'; location.hash=`#/zones?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(f)}`;};
  root.querySelector('[data-template-search]')?.addEventListener('change',updateHash); root.querySelector('[data-template-filter]')?.addEventListener('change',updateHash);
  root.querySelectorAll('[data-reset-template-filter]').forEach(btn=>btn.addEventListener('click',()=>{location.hash='#/zones';}));
}
