import { calculateTotals } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
export function TopSummary(project) {
  if (!project) return '';
  const t = calculateTotals(project);
  return `<section class="panel card" style="margin-bottom:14px"><div class="summaryGrid">
    <div class="summaryBlock"><div class="label">Себестоимость</div><div class="value">${formatMoney(t.cost)}</div></div>
    <div class="summaryBlock"><div class="label">Маржа</div><div class="value">${formatMoney(t.margin)}</div></div>
    <div class="summaryBlock"><div class="label">Цена без НДС</div><div class="value">${formatMoney(t.net)}</div></div>
    <div class="summaryBlock"><div class="label">Цена с НДС</div><div class="value">${formatMoney(t.gross)}</div></div>
  </div></section>`;
}
