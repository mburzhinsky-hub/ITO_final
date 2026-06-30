import { itemCostRub, mergedSettings } from '../engine/pricing.js';
export function exportCsv(project) {
  const settings = mergedSettings(project);
  const header = ['Зона','Позиция','Категория','Ед.','Кол-во','Цена за ед.','Сумма','Источник'];
  const zoneName = id => project.zones.find(z => z.id === id)?.name || '';
  const rows = project.estimateItems.map(i => [zoneName(i.zoneId), i.name, i.category, i.unit, i.qty, i.unitCost, itemCostRub(i, settings), i.source]);
  return [header, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
}
