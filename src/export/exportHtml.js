import { calculateTotals, itemCostRub, mergedSettings } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
export function proposalHtml(project) {
  const t = calculateTotals(project); const settings = mergedSettings(project);
  const rows = project.estimateItems.map((item, idx) => `<tr><td>${idx+1}</td><td>${item.name}</td><td>${item.category}</td><td>${item.qty} ${item.unit}</td><td>${formatMoney(itemCostRub(item, settings))}</td></tr>`).join('');
  return `<h1>${settings.proposalSettings.title}</h1><p><b>Проект:</b> ${project.name}</p><p><b>Заказчик:</b> ${project.customerName || '—'}</p>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0"><div><small>Себестоимость</small><br><b>${formatMoney(t.cost)}</b></div><div><small>Цена без НДС</small><br><b>${formatMoney(t.net)}</b></div><div><small>НДС</small><br><b>${project.passport.vatPct}%</b></div><div><small>Цена с НДС</small><br><b>${formatMoney(t.gross)}</b></div></div>
  <table><thead><tr><th>№</th><th>Позиция</th><th>Группа</th><th>Кол-во</th><th>Сумма</th></tr></thead><tbody>${rows || '<tr><td colspan="5">Смета пустая</td></tr>'}</tbody></table>
  <p><b>Гарантия:</b> ${settings.proposalSettings.warranty}. <b>Срок действия:</b> ${settings.proposalSettings.validityDays} дней.</p>`;
}
