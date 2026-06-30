import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { ZoneCard } from '../components/ZoneCard.js';
import { ensureProject, persistProject } from '../app/state.js';
import { createZone } from '../engine/projectFactory.js';
import { INSTALLATION_TEMPLATES } from '../data/installationTemplates.js';
import { toast } from '../utils/dom.js';

export function ZonesPage(root) {
  const p = ensureProject();
  const templates = INSTALLATION_TEMPLATES.slice(0, 12);
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Зоны</h2><p>Зоны отделены от паспорта и сметы. Типовые зоны можно добавлять из шаблонов.</p></div><div class="actions"><button class="btn primary" data-add-zone>Добавить зону</button><button class="btn ghost" data-save>Сохранить</button></div></div>
  <div class="card"><h3>Типовые зоны / инсталляции</h3><div class="libraryGrid">${templates.map(t=>`<div class="card"><div class="itemTitle">${t.name}</div><div class="muted">${t.goal || ''}</div><button class="btn ghost small" data-template-zone="${t.id}">Добавить зону</button></div>`).join('')}</div></div>
  <div class="separator"></div>${p.zones.length ? `<div class="grid">${p.zones.map(ZoneCard).join('')}</div>` : '<div class="empty">Зон пока нет. Добавьте вручную или из шаблона.</div>'}`);
  bindLayoutActions(root); bind(root,p);
}
function bind(root,p){
  root.querySelector('[data-add-zone]')?.addEventListener('click',()=>{p.zones.push(createZone({name:`Зона ${p.zones.length+1}`})); persistProject(); ZonesPage(root);});
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Зоны сохранены');});
  root.querySelectorAll('[data-template-zone]').forEach(btn=>btn.addEventListener('click',()=>{const t=INSTALLATION_TEMPLATES.find(x=>x.id===btn.dataset.templateZone); p.zones.push(createZone({name:t.name, ...(t.zone||{})})); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-zone-delete]').forEach(btn=>btn.addEventListener('click',()=>{p.zones=p.zones.filter(z=>z.id!==btn.dataset.zoneDelete); p.estimateItems.forEach(i=>{if(i.zoneId===btn.dataset.zoneDelete)i.zoneId='';}); persistProject(); ZonesPage(root);}));
  root.querySelectorAll('[data-zone-field]').forEach(el=>el.addEventListener('input',()=>{const z=p.zones.find(x=>x.id===el.dataset.zoneId); z[el.dataset.zoneField]=el.type==='number'?Number(el.value):el.value; persistProject();}));
  root.querySelectorAll('[data-zone-flag]').forEach(el=>el.addEventListener('change',()=>{const z=p.zones.find(x=>x.id===el.dataset.zoneId); z.flags[el.dataset.zoneFlag]=el.checked; persistProject();}));
}
