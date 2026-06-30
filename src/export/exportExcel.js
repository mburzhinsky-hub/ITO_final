import { calculateProjectTotals, itemCostRub, mergedSettings } from '../engine/pricing.js';
export function exportCsv(project) {
  const settings = mergedSettings(project);
  const totals = calculateProjectTotals(project, settings);
  const header = ['Зона','Позиция','Категория','Ед.','Кол-во','Цена за ед.','Валюта','Режим цены','Сумма RUB','Источник'];
  const zoneName = id => project.zones.find(z => z.id === id)?.name || '';
  const rows = project.estimateItems.map(i => [zoneName(i.zoneId), i.name, i.category, i.unit, i.qty, i.unitCost, i.currency, i.priceMode, itemCostRub(i, settings), i.source]);
  const totalRows = [
    [],
    ['Итоги','','','','','','','','',''],
    ['Себестоимость','','','','','','','',totals.subtotalCost,''],
    ['Коммерческая цена без НДС','','','','','','','',totals.salePriceNet,''],
    ['НДС','','','','','','','',totals.vatAmount,''],
    ['Коммерческая цена с НДС','','','','','','','',totals.salePriceGross,''],
    ['Прибыль','','','','','','','',totals.profit,''],
    ['Фактическая маржа, %','','','','','','','',totals.actualMarginPct,''],
    ['Фактическая наценка, %','','','','','','','',totals.actualMarkupPct,''],
    ['Курс USD','','','','','','','',settings.usdRate,'']
  ];
  return [header, ...rows, ...totalRows].map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"','""')}"`).join(';')).join('\n');
}
