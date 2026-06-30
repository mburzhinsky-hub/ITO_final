import { CATALOG } from '../data/catalog.js';
import { SUPPLIER_PRICE_CATALOG } from '../data/supplierPriceCatalog.js';
import { createEstimateItem } from './projectFactory.js';
import { normalizeCurrency, normalizePriceMode, convertToRub } from './currency.js';
import { DEFAULT_SETTINGS } from '../data/defaultSettings.js';
import { getZoneTemplate } from '../data/zoneTaxonomy.js';

const SOURCE_CATALOG = [...SUPPLIER_PRICE_CATALOG, ...CATALOG];

function catalogDedupeKey(item = {}) {
  const norm = value => String(value || '').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '');
  const composite = [norm(item.brand), norm(item.model), norm(item.article)].join('|');
  return composite.replace(/\|/g, '') ? composite : norm(item.name).slice(0, 100);
}

function supplierPriority(item = {}) {
  return Number(item.supplierPriority || (item.supplier ? 1 : 0));
}

function buildLibrary(items = []) {
  const byKey = new Map();
  items.map(normalizeCatalogItem).forEach(item => {
    const key = catalogDedupeKey(item);
    const old = byKey.get(key);
    const score = [supplierPriority(item), item.category !== 'Доп. оборудование' ? 1 : 0, item.currency === 'RUB' ? 1 : 0, Number(item.unitCost || 0) > 0 ? 1 : 0];
    const oldScore = old ? [supplierPriority(old), old.category !== 'Доп. оборудование' ? 1 : 0, old.currency === 'RUB' ? 1 : 0, Number(old.unitCost || 0) > 0 ? 1 : 0] : [-1];
    if (!old || score.join('|') > oldScore.join('|')) byKey.set(key, item);
  });
  return [...byKey.values()].sort(compareCatalogItems);
}

function compareCatalogItems(a, b) {
  return supplierPriority(b) - supplierPriority(a)
    || String(a.category || '').localeCompare(String(b.category || ''), 'ru')
    || String(a.brand || '').localeCompare(String(b.brand || ''), 'ru')
    || String(a.model || a.name || '').localeCompare(String(b.model || b.name || ''), 'ru');
}

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
    supplier: item.supplier || '',
    supplierPriority: supplierPriority(item),
    article: item.article || '',
    currency: normalizedCurrency,
    unitCost,
    price: unitCost,
    priceRub: convertToRub(unitCost, normalizedCurrency, DEFAULT_SETTINGS),
    priceMode
  };
}
export const LIBRARY = buildLibrary(SOURCE_CATALOG);

export function recommendedCategoriesForZone(zone = {}) {
  const template = getZoneTemplate(zone.templateId);
  const purpose = String(zone.purpose || zone.type || zone.categoryId || '').toLowerCase();
  const task = String(zone.primaryTask || zone.task || '').toLowerCase();
  const flags = zone.flags || {};
  const categories = [];
  const add = (...values) => values.forEach(v => { if (v && !categories.includes(v)) categories.push(v); });

  add(...(zone.requiredSystemGroups || []), ...(template?.requiredSystemGroups || []));
  if (zone.categoryId === 'meeting-vcs' || purpose.includes('conference') || purpose.includes('meeting') || task.includes('conference')) add('ВКС-системы', 'Конференц-системы', 'Микрофоны', 'LCD-панели', 'DSP и усилители', 'Коммутация');
  if (zone.categoryId === 'museum-exposition' || purpose.includes('hall') || purpose.includes('museum') || flags.content || task.includes('content')) add('LCD-панели', 'LED-экраны', 'Медиасерверы', 'Акустика', 'Коммутация');
  if (zone.categoryId === 'events-conference' || purpose.includes('stage') || purpose.includes('event')) add('Акустика', 'DSP и усилители', 'Микрофоны', 'Свет', 'Коммутация');
  if (zone.categoryId === 'education' || purpose.includes('class') || purpose.includes('education')) add('Интерактивные панели', 'Проекторы', 'Микрофоны', 'Акустика', 'Коммутация');
  if (zone.categoryId === 'led-large-screens' || purpose.includes('outdoor') || purpose.includes('screen')) add('LED-экраны', 'LCD-панели', 'Медиасерверы', 'Крепления и конструкции', 'Коммутация');
  if (zone.categoryId === 'control-centers') add('Видеостены', 'LCD-панели', 'Мониторы', 'Коммутация', 'Сеть', 'Кабельная инфраструктура');
  if (zone.categoryId === 'infrastructure') add('AV-стойки', 'Коммутация', 'Сеть', 'Питание', 'Кабельная инфраструктура');
  if (purpose.includes('vr') || task.includes('wow')) add('VR / AR', 'ПК', 'LCD-панели', 'Акустика');
  if (flags.metal) add('Крепления и конструкции');
  if (flags.delivery) add('Кабельная инфраструктура', 'Сеть');
  add('LCD-панели', 'Акустика', 'Коммутация', 'Кабельная инфраструктура');
  return categories;
}

function itemMatchesContext(item, zone, project, scenario) {
  const types = item.types || [];
  return (!types.length || types.includes(project.passport?.projectType) || types.includes(zone.type) || types.includes(zone.purpose));
}

function pickCatalogItemsForZone(zone, project, scenario, limit = 6) {
  const categories = recommendedCategoriesForZone(zone);
  const picked = [];
  const seen = new Set();
  categories.forEach(category => {
    const candidate = LIBRARY.find(item => item.category === category && ['budget', scenario, 'base', 'premium'].includes(item.scenario) && itemMatchesContext(item, zone, project, scenario) && !seen.has(item.id));
    if (candidate && picked.length < limit) { picked.push(candidate); seen.add(candidate.id); }
  });
  if (picked.length < Math.min(limit, categories.length)) {
    categories.forEach(category => {
      const candidate = LIBRARY.find(item => String(item.category || '').toLowerCase().includes(String(category).toLowerCase().split(' ')[0]) && ['budget', scenario, 'base', 'premium'].includes(item.scenario) && !seen.has(item.id));
      if (candidate && picked.length < limit) { picked.push(candidate); seen.add(candidate.id); }
    });
  }
  if (picked.length < limit) {
    LIBRARY.filter(item => ['budget', scenario, 'base'].includes(item.scenario) && itemMatchesContext(item, zone, project, scenario) && !seen.has(item.id))
      .slice(0, limit - picked.length).forEach(item => { picked.push(item); seen.add(item.id); });
  }
  return picked;
}

function addDerivedWorkItems(project, zone, existingKeys) {
  let added = 0;
  const works = Object.entries(zone.flags || {}).filter(([, enabled]) => enabled).map(([key]) => key);
  const deps = zone.requiredDependencies || [];
  const rows = [];
  if (works.includes('install')) rows.push(['Монтажные работы', 'Монтаж оборудования и кабельной инфраструктуры', 1, 0, 'install']);
  if (works.includes('pnr')) rows.push(['ПНР', 'Пусконаладка, настройка и пользовательские сценарии', 1, 0, 'pnr']);
  if (works.includes('content')) rows.push(['Контент / ПО', 'Подготовка, загрузка и проверка контента / ПО', 1, 0, 'content']);
  if (works.includes('delivery')) rows.push(['Логистика', 'Доставка, упаковка и перемещение оборудования', 1, 0, 'delivery']);
  if (works.includes('metal') || deps.some(d => /креп/i.test(d))) rows.push(['Крепления и конструкции', 'Крепления, конструкции и монтажные материалы', 1, 0, 'metal']);
  if (deps.some(d => /пит/i.test(d))) rows.push(['Питание', 'Проверка питания и резервов мощности', 1, 0, 'power']);
  rows.forEach(([category, name, qty, price, key]) => {
    const derivedKey = `${zone.id}:work:${key}`;
    if (existingKeys.has(derivedKey)) return;
    project.estimateItems.push(createEstimateItem({
      zoneId: zone.id, name, category, unit: 'компл.', qty, currency: 'RUB', unitCost: price,
      priceMode: 'fixed', source: 'derived', isManual: false, isDerived: true, derivedKey,
      note: `Автоматически добавлено по шаблону зоны «${zone.name}».`
    }));
    existingKeys.add(derivedKey);
    added += 1;
  });
  return added;
}


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
  const zonesToProcess = options.zoneId ? project.zones.filter(zone => zone.id === options.zoneId) : project.zones;
  zonesToProcess.forEach(zone => {
    if (!zone.type) {
      report.skippedZones.push({ id: zone.id, name: zone.name, reason: 'Не выбран тип зоны' });
      return;
    }
    const matching = pickCatalogItemsForZone(zone, project, scenario, 6);
    if (!matching.length) {
      report.skippedZones.push({ id: zone.id, name: zone.name, reason: 'Нет подходящих позиций каталога' });
      return;
    }
    report.processedZones.push({ id: zone.id, name: zone.name, count: matching.length, categoryId: zone.categoryId, templateId: zone.templateId });
    report.added += addDerivedWorkItems(project, zone, existingKeys);
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
