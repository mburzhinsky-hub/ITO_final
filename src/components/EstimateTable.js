import { itemCostRub, mergedSettings } from '../engine/pricing.js';
import { formatMoney } from '../utils/format.js';
export function EstimateTable(project) {
  if (!project.estimateItems.length) return '<div class="empty">Смета пустая. Добавьте позиции из библиотеки или сгенерируйте стартовую смету по зонам.</div>';
  const settings = mergedSettings(project);
  const zoneName = id => project.zones.find(z => z.id === id)?.name || '—';
  return `<div class="tableWrap"><table><thead><tr><th>Зона</th><th>Позиция</th><th>Категория</th><th>Ед.</th><th>Кол-во</th><th>Цена / ед.</th><th>Сумма</th><th>Источник</th><th></th></tr></thead><tbody>
  ${project.estimateItems.map(item => `<tr>
    <td>${zoneName(item.zoneId)}</td>
    <td><input data-item-field="name" data-item-id="${item.id}" value="${item.name}"></td>
    <td><input data-item-field="category" data-item-id="${item.id}" value="${item.category}"></td>
    <td><input data-item-field="unit" data-item-id="${item.id}" value="${item.unit}"></td>
    <td><input type="number" step="0.1" data-item-field="qty" data-item-id="${item.id}" value="${item.qty}"></td>
    <td><input type="number" step="1" data-item-field="unitCost" data-item-id="${item.id}" value="${item.unitCost}"></td>
    <td class="money">${formatMoney(itemCostRub(item, settings))}</td>
    <td><span class="badge">${item.source}</span></td>
    <td><button class="btn danger small" data-item-delete="${item.id}">Удалить</button></td>
  </tr>`).join('')}</tbody></table></div>`;
}
