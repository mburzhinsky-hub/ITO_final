import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { ensureProject, persistProject } from '../app/state.js';
import { PROJECT_TYPES } from '../data/projectTypes.js';
import { SCENARIOS } from '../data/scenarios.js';
import { CITY_TIERS } from '../data/cityTiers.js';
import { URGENCY } from '../data/urgency.js';
import { toast } from '../utils/dom.js';

export function PassportPage(root) {
  const p = ensureProject(); const pp = p.passport;
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Паспорт проекта</h2><p>Коммерческие и объектовые параметры проекта. Это пользовательская зона.</p></div><button class="btn primary" data-save>Сохранить паспорт</button></div>
  <div class="grid cols2"><div class="card">
    ${field('name','Название проекта',p.name)}${field('customerName','Заказчик',p.customerName)}${text('notes','Комментарий',p.notes)}
  </div><div class="card">
    <label class="field"><span>Статус</span><select data-root-field="status">${opt([{id:'draft',name:'Черновик'},{id:'estimate_ready',name:'Смета готова'},{id:'has_errors',name:'Есть ошибки'},{id:'proposal_ready',name:'КП готово'}],p.status)}</select></label>
    <label class="field"><span>Тип проекта</span><select data-passport-field="projectType">${opt(PROJECT_TYPES,pp.projectType)}</select></label>
    <label class="field"><span>Сценарий бюджета</span><select data-passport-field="scenario">${opt(SCENARIOS,pp.scenario)}</select></label>
  </div></div>
  <div class="card" style="margin-top:12px"><div class="grid cols4">
    <label class="field"><span>Город / регион</span><select data-passport-field="cityTier">${opt(CITY_TIERS,pp.cityTier)}</select></label>
    <label class="field"><span>Площадь, м²</span><input type="number" data-passport-field="area" value="${pp.area}"></label>
    <label class="field"><span>Этажей</span><input type="number" data-passport-field="floors" value="${pp.floors}"></label>
    <label class="field"><span>Высота, м</span><input type="number" step="0.1" data-passport-field="ceilingHeight" value="${pp.ceilingHeight}"></label>
    <label class="field"><span>Срок проекта</span><select data-passport-field="urgency">${opt(URGENCY,pp.urgency)}</select></label>
    <label class="field"><span>Целевой бюджет</span><input type="number" data-passport-field="targetBudget" value="${pp.targetBudget}"></label>
    <label class="field"><span>НДС, %</span><input type="number" data-passport-field="vatPct" value="${pp.vatPct}"></label>
    <label class="field"><span>Маржа / наценка, %</span><input type="number" data-passport-field="marginPct" value="${pp.marginPct}"></label>
  </div></div>`);
  bindLayoutActions(root); bind(root, p);
}
function field(key,label,value){return `<label class="field"><span>${label}</span><input data-root-field="${key}" value="${value || ''}"></label>`}
function text(key,label,value){return `<label class="field"><span>${label}</span><textarea data-root-field="${key}">${value || ''}</textarea></label>`}
function opt(items, selected){return items.map(x=>`<option value="${x.id}" ${x.id===selected?'selected':''}>${x.name}</option>`).join('')}
function bind(root,p){
  root.querySelectorAll('[data-root-field]').forEach(el=>el.addEventListener('input',()=>{p[el.dataset.rootField]=el.value;}));
  root.querySelectorAll('[data-passport-field]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.passportField; p.passport[k]=el.type==='number'?Number(el.value):el.value;}));
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Паспорт сохранён');});
}
