import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { WarningList } from '../components/WarningList.js';
import { BudgetStatus } from '../components/BudgetStatus.js';
import { ensureProject, persistProject } from '../app/state.js';
import { validateProject } from '../engine/validation.js';
import { calculateProjectTotals } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
import { toast } from '../utils/dom.js';

export function CheckPage(root) {
  const p = ensureProject(); const warnings = validateProject(p); const totals = calculateProjectTotals(p);
  const errors = warnings.filter(w => w.severity === 'error').length;
  const risks = warnings.length - errors;
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Проверка</h2><p>Единая валидация проекта. Ошибки не блокируют интерфейс, но показывают, что смете нельзя полностью доверять.</p></div><button class="btn ghost" data-save>Сохранить</button></div>
  <div class="summaryGrid"><div class="summaryBlock"><div class="label">Ошибки</div><div class="value">${errors}</div></div><div class="summaryBlock"><div class="label">Предупреждения и рекомендации</div><div class="value">${risks}</div></div><div class="summaryBlock"><div class="label">Себестоимость</div><div class="value">${formatMoney(totals.subtotalCost)}</div></div><div class="summaryBlock"><div class="label">Цена с НДС</div><div class="value">${formatMoney(totals.salePriceGross)}</div></div></div>
  <div class="separator"></div>${BudgetStatus(p)}<div class="separator"></div>${WarningList(warnings)}`);
  bindLayoutActions(root);
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Проверка сохранена');});
  root.querySelectorAll('[data-accept-warning]').forEach(btn=>btn.addEventListener('click',()=>{p.acceptedWarnings ||= []; if(!p.acceptedWarnings.includes(btn.dataset.acceptWarning)) p.acceptedWarnings.push(btn.dataset.acceptWarning); persistProject(); CheckPage(root);}));
}
