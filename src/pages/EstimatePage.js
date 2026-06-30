import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { EstimateTable } from '../components/EstimateTable.js';
import { BudgetStatus } from '../components/BudgetStatus.js';
import { ensureProject, persistProject } from '../app/state.js';
import { createEstimateItem } from '../engine/projectFactory.js';
import { generateEstimateFromZones } from '../engine/estimate.js';
import { calculateProjectTotals } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
import { toast } from '../utils/dom.js';

export function EstimatePage(root) {
  const p = ensureProject(); const t = calculateProjectTotals(p);
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Смета</h2><p>Таблица сметы и ручные позиции. Derived-строки можно пересчитать без удаления ручных строк.</p></div><div class="actions"><button class="btn primary" data-generate="replace">Заменить derived</button><button class="btn ghost" data-generate="append">Дополнить</button><button class="btn ghost" data-generate="recalculate-derived">Пересчитать derived</button><button class="btn ghost" data-add-manual>Ручная позиция</button><button class="btn ghost" data-save>Сохранить</button></div></div>
  <div class="summaryGrid"><div class="summaryBlock"><div class="label">Оборудование</div><div class="value">${formatMoney(t.equipmentCost)}</div></div><div class="summaryBlock"><div class="label">Монтаж</div><div class="value">${formatMoney(t.installCost)}</div></div><div class="summaryBlock"><div class="label">ПНР</div><div class="value">${formatMoney(t.pnrCost)}</div></div><div class="summaryBlock"><div class="label">Итого с НДС</div><div class="value">${formatMoney(t.salePriceGross)}</div></div></div>
  <div class="separator"></div>${BudgetStatus(p)}<div class="separator"></div>${EstimateTable(p)}`);
  bindLayoutActions(root); bind(root,p);
}
function bind(root,p){
  root.querySelectorAll('[data-generate]').forEach(btn=>btn.addEventListener('click',()=>{
    const report = generateEstimateFromZones(p, { mode: btn.dataset.generate });
    persistProject();
    const processed = report.processedZones.map(z => z.name).join(', ') || 'нет';
    const skipped = report.skippedZones.map(z => `${z.name}: ${z.reason}`).join('; ') || 'нет';
    const warnings = report.warnings.join(' ') || 'без предупреждений';
    toast(`Добавлено строк: ${report.added}. Зоны: ${processed}. Пропущено: ${skipped}. ${warnings}`);
    EstimatePage(root);
  }));
  root.querySelector('[data-add-manual]')?.addEventListener('click',()=>{p.estimateItems.push(createEstimateItem({name:'Новая ручная позиция', category:'Оборудование', currency:'RUB', priceMode:'manual', source:'manual', isManual:true})); persistProject(); EstimatePage(root);});
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Смета сохранена');});
  root.querySelectorAll('[data-item-field]').forEach(el=>el.addEventListener('input',()=>{const item=p.estimateItems.find(x=>x.id===el.dataset.itemId); if(!item) return; item[el.dataset.itemField]=el.type==='number'?Number(el.value):el.value; persistProject();}));
  root.querySelectorAll('[data-item-delete]').forEach(btn=>btn.addEventListener('click',()=>{p.estimateItems=p.estimateItems.filter(i=>i.id!==btn.dataset.itemDelete); persistProject(); EstimatePage(root);}));
}
