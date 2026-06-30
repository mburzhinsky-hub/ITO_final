import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { EstimateTable } from '../components/EstimateTable.js';
import { ensureProject, persistProject } from '../app/state.js';
import { createEstimateItem } from '../engine/projectFactory.js';
import { generateStarterEstimate } from '../engine/estimate.js';
import { calculateTotals } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
import { toast } from '../utils/dom.js';

export function EstimatePage(root) {
  const p = ensureProject(); const t = calculateTotals(p);
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Смета</h2><p>Таблица сметы и ручные позиции. Расчётные функции вызываются из engine, не из UI.</p></div><div class="actions"><button class="btn primary" data-generate>Сгенерировать по зонам</button><button class="btn ghost" data-add-manual>Ручная позиция</button><button class="btn ghost" data-save>Сохранить</button></div></div>
  <div class="summaryGrid"><div class="summaryBlock"><div class="label">Оборудование</div><div class="value">${formatMoney(t.equipment)}</div></div><div class="summaryBlock"><div class="label">Монтаж</div><div class="value">${formatMoney(t.install)}</div></div><div class="summaryBlock"><div class="label">ПНР</div><div class="value">${formatMoney(t.pnr)}</div></div><div class="summaryBlock"><div class="label">Итого с НДС</div><div class="value">${formatMoney(t.gross)}</div></div></div>
  <div class="separator"></div>${EstimateTable(p)}`);
  bindLayoutActions(root); bind(root,p);
}
function bind(root,p){
  root.querySelector('[data-generate]')?.addEventListener('click',()=>{if(!p.zones.length){alert('Сначала добавьте зоны');return;} generateStarterEstimate(p); persistProject(); toast('Стартовая смета создана'); EstimatePage(root);});
  root.querySelector('[data-add-manual]')?.addEventListener('click',()=>{p.estimateItems.push(createEstimateItem({name:'Новая ручная позиция', category:'Оборудование'})); persistProject(); EstimatePage(root);});
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Смета сохранена');});
  root.querySelectorAll('[data-item-field]').forEach(el=>el.addEventListener('input',()=>{const item=p.estimateItems.find(x=>x.id===el.dataset.itemId); item[el.dataset.itemField]=el.type==='number'?Number(el.value):el.value; persistProject();}));
  root.querySelectorAll('[data-item-delete]').forEach(btn=>btn.addEventListener('click',()=>{p.estimateItems=p.estimateItems.filter(i=>i.id!==btn.dataset.itemDelete); persistProject(); EstimatePage(root);}));
}
