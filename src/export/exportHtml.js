import { calculateProjectTotals, itemCostRub, mergedSettings } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
export function proposalHtml(project) {
  const t = calculateProjectTotals(project); const settings = mergedSettings(project);
  const hasCurrency = project.estimateItems.some(item => item.currency && item.currency !== 'RUB');
  const rows = project.estimateItems.map((item, idx) => `<tr><td>${idx+1}</td><td>${item.name}</td><td>${item.category}</td><td>${item.qty} ${item.unit}</td><td>${item.currency || 'RUB'} / ${item.priceMode || 'manual'}</td><td>${formatMoney(itemCostRub(item, settings))}</td></tr>`).join('');
  return `<h1>${settings.proposalSettings.title}</h1><p><b>Проект:</b> ${project.name}</p><p><b>Заказчик:</b> ${project.customerName || '—'}</p>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0"><div><small>Себестоимость</small><br><b>${formatMoney(t.subtotalCost)}</b></div><div><small>Цена без НДС</small><br><b>${formatMoney(t.salePriceNet)}</b></div><div><small>НДС</small><br><b>${formatMoney(t.vatAmount)} (${t.vatPct}%)</b></div><div><small>Цена с НДС</small><br><b>${formatMoney(t.salePriceGross)}</b></div></div>
  <p><b>Коммерческий режим:</b> ${t.marginMode === 'margin' ? 'маржа от цены продажи' : 'наценка на себестоимость'} ${t.marginPct}%. <b>Прибыль:</b> ${formatMoney(t.profit)}. <b>Факт. маржа:</b> ${t.actualMarginPct}%. <b>Факт. наценка:</b> ${t.actualMarkupPct}%.</p>
  ${hasCurrency ? `<p><b>Курс USD:</b> ${settings.usdRate} RUB. Валютные indexed-позиции пересчитываются по курсу, ручные RUB/manual не меняются.</p>` : ''}
  <table><thead><tr><th>№</th><th>Позиция</th><th>Группа</th><th>Кол-во</th><th>Валюта / режим</th><th>Сумма</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Смета пустая</td></tr>'}</tbody></table>
  <p><b>Гарантия:</b> ${settings.proposalSettings.warranty}. <b>Срок действия:</b> ${settings.proposalSettings.validityDays} дней.</p>`;
}
