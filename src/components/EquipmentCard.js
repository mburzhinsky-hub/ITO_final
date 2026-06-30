import { formatMoney } from '../utils/format.js';
import { itemUnitCostRub } from '../engine/currency.js';
import { rootCategoryName, subcategoryName } from '../data/equipmentCategories.js';
import { DependencyList } from './DependencyList.js';
import { AlternativeList } from './AlternativeList.js';

export function EquipmentCard(item, settings, library = []) {
  const quality = qualityBadge(item);
  return `<article class="card itemCard equipmentCard">
    <div class="itemCardTop"><div><div class="itemTitle">${item.name}</div><div class="muted">${[item.brand, item.model, item.article ? `арт. ${item.article}` : ''].filter(Boolean).join(' · ') || '—'}</div></div>${quality}</div>
    <div class="tagRow"><span class="badge">${rootCategoryName(item.categoryId)}</span><span class="badge">${subcategoryName(item.subcategoryId) || item.category}</span><span class="badge lime">${item.solutionLevel || 'standard'}</span>${item.supplier ? `<span class="badge">${item.supplier}</span>` : ''}</div>
    <strong>${formatMoney(itemUnitCostRub(item, settings))}</strong>
    <div class="muted smallText">${item.priceStatus || 'actual'} · ${item.currency === 'USD' ? `$${Number(item.unitCost || 0).toLocaleString('ru-RU')}` : formatMoney(item.unitCost)}</div>
    <details class="compactDetails"><summary>Зависимости</summary>${DependencyList(item)}</details>
    <details class="compactDetails"><summary>Альтернативы</summary>${AlternativeList(item, library)}</details>
    <div class="cardActions"><button class="btn primary small" data-add-library="${item.id}">Добавить в смету</button><button class="btn ghost small" data-mark-review="${item.id}">Пометить проверку</button></div>
  </article>`;
}
function qualityBadge(item) {
  if (item.requiresEngineerReview) return '<span class="badge warn">инж. проверка</span>';
  if (item.requiresPriceRequest || item.priceStatus === 'unknown') return '<span class="badge warn">запрос цены</span>';
  if (item.priceStatus === 'estimated') return '<span class="badge lime">estimated</span>';
  return '<span class="badge ok">ok</span>';
}
