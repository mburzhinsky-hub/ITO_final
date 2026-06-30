import { CATALOG } from '../data/catalog.js';
import { createEstimateItem } from './projectFactory.js';
import { normalizeCurrency, normalizePriceMode, convertToRub } from './currency.js';
import { DEFAULT_SETTINGS } from '../data/defaultSettings.js';

export function normalizeCatalogItem(item) {
  const currency = item.currency || (item.imported ? 'USD' : 'RUB');
  const unitCost = Number(item.unitCost ?? item.price_usd ?? item.priceUsd ?? item.price_rub ?? item.priceRub ?? item.price ?? 0);
  const normalizedCurrency = normalizeCurrency(currency);
  const priceMode = item.imported || normalizedCurrency === 'USD' ? 'indexed' : 'fixed';
  return {
    id: item.id || `${item.brand || ''}_${item.model || item.name}`.replace(/\W+/g, '_').toLowerCase(),
    name: item.name || [item.brand, item.model].filter(Boolean).join(' ') || item.description || 'Позиция каталога',
    brand: item.brand || '', model: item.model || '',
    category: item.category || item.subcategory || 'Оборудование',
    unit: item.unit || 'шт.', scenario: item.scenario || 'base',
    types: item.types || [], note: item.note || item.description || '',
    currency: normalizedCurrency,
    unitCost,
    price: unitCost,
    priceRub: convertToRub(unitCost, normalizedCurrency, DEFAULT_SETTINGS),
    priceMode
  };
}
export const LIBRARY = CATALOG.map(normalizeCatalogItem);

export function addCatalogItemToProject(project, catalogItem, zoneId = '', options = {}) {
  const item = createEstimateItem({
    zoneId,
    name: catalogItem.name,
    category: catalogItem.category,
    unit: catalogItem.unit,
    qty: options.qty ?? 1,
    currency: catalogItem.currency || 'RUB',
    unitCost: catalogItem.unitCost ?? catalogItem.priceRub ?? 0,
    priceMode: catalogItem.priceMode || (catalogItem.currency === 'USD' ? 'indexed' : 'fixed'),
    source: options.source || 'library',
    isManual: false,
    isDerived: Boolean(options.isDerived),
    derivedKey: options.derivedKey || '',
    note: catalogItem.note
  });
  project.estimateItems.push(item);
  return item;
}

export function generateStarterEstimate(project, options = {}) {
  return generateEstimateFromZones(project, options);
}

export function generateEstimateFromZones(project, options = {}) {
  const mode = options.mode || 'replace';
  const report = { added: 0, processedZones: [], skippedZones: [], warnings: [], mode };
  project.estimateItems ||= [];
  project.zones ||= [];

  if (!project.zones.length) {
    report.warnings.push('Нет зон: смета не сгенерирована.');
    return report;
  }

  if (project.passport?.estimateMode === 'manual') {
    report.warnings.push('Включён ручной режим: добавьте позиции вручную или из библиотеки.');
    return report;
  }

  if (mode === 'replace') project.estimateItems = preserveManualItems(project.estimateItems);
  if (mode === 'recalculate-derived') project.estimateItems = preserveManualItems(project.estimateItems);
  if (mode === 'append') project.estimateItems = deduplicateEstimateItems(project.estimateItems);

  const existingKeys = new Set(project.estimateItems.map(i => i.derivedKey).filter(Boolean));
  const scenario = project.passport?.scenario || 'base';
  project.zones.forEach(zone => {
    if (!zone.type) {
      report.skippedZones.push({ id: zone.id, name: zone.name, reason: 'Не выбран тип зоны' });
      return;
    }
    const matching = LIBRARY
      .filter(item => (!item.types?.length || item.types.includes(project.passport?.projectType) || item.types.includes(zone.type)) && ['budget', scenario, 'base'].includes(item.scenario))
      .slice(0, 4);
    if (!matching.length) {
      report.skippedZones.push({ id: zone.id, name: zone.name, reason: 'Нет подходящих позиций каталога' });
      return;
    }
    report.processedZones.push({ id: zone.id, name: zone.name, count: matching.length });
    matching.forEach(item => {
      const derivedKey = `${zone.id}:${item.id}`;
      if (existingKeys.has(derivedKey)) return;
      addCatalogItemToProject(project, item, zone.id, { source: 'derived', isDerived: true, derivedKey });
      existingKeys.add(derivedKey);
      report.added += 1;
    });
  });
  project.estimateItems = deduplicateEstimateItems(project.estimateItems);
  if (!report.added && !report.warnings.length) report.warnings.push('Новых строк не добавлено: расчётные позиции уже существуют.');
  return report;
}

export function regenerateDerivedItems(project) {
  return generateEstimateFromZones(project, { mode: 'recalculate-derived' });
}

export function preserveManualItems(items = []) {
  return items.filter(item => item.isManual || item.source === 'manual' || !item.isDerived);
}

export function deduplicateEstimateItems(items = []) {
  const seen = new Set();
  const result = [];
  items.forEach(item => {
    const key = item.derivedKey || (item.isDerived ? `${item.zoneId}:${item.name}:${item.category}` : item.id);
    if (item.isDerived && seen.has(key)) return;
    seen.add(key);
    item.currency = normalizeCurrency(item.currency);
    item.priceMode = normalizePriceMode(item.priceMode || (item.isManual ? 'manual' : item.currency === 'USD' ? 'indexed' : 'fixed'));
    result.push(item);
  });
  return result;
}

export function groupedEstimate(items = []) {
  return items.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});
}
