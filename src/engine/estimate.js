import { CATALOG } from '../data/catalog.js';
import { createEstimateItem } from './projectFactory.js';

export function normalizeCatalogItem(item) {
  return {
    id: item.id || `${item.brand || ''}_${item.model || item.name}`.replace(/\W+/g, '_').toLowerCase(),
    name: item.name || [item.brand, item.model].filter(Boolean).join(' ') || item.description || 'Позиция каталога',
    brand: item.brand || '', model: item.model || '',
    category: item.category || item.subcategory || 'Оборудование',
    unit: item.unit || 'шт.', scenario: item.scenario || 'base',
    types: item.types || [], note: item.note || item.description || '',
    priceRub: Number(item.price_rub ?? item.priceRub ?? (item.price ? item.price * 80 : 0))
  };
}
export const LIBRARY = CATALOG.map(normalizeCatalogItem);
export function addCatalogItemToProject(project, catalogItem, zoneId = '') {
  project.estimateItems.push(createEstimateItem({
    zoneId, name: catalogItem.name, category: catalogItem.category, unit: catalogItem.unit,
    qty: 1, currency: 'RUB', unitCost: catalogItem.priceRub, source: 'library', isManual: false, note: catalogItem.note
  }));
}
export function generateStarterEstimate(project) {
  const scenario = project.passport.scenario || 'base';
  project.estimateItems = [];
  project.zones.forEach(zone => {
    const matching = LIBRARY.filter(item => (!item.types?.length || item.types.includes(project.passport.projectType) || item.types.includes(zone.type)) && ['budget', scenario, 'base'].includes(item.scenario)).slice(0, 4);
    matching.forEach(item => addCatalogItemToProject(project, item, zone.id));
  });
  return project.estimateItems;
}
export function groupedEstimate(items = []) {
  return items.reduce((acc, item) => { (acc[item.category] ||= []).push(item); return acc; }, {});
}
