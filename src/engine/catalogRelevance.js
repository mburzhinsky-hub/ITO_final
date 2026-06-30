const AV_CORE_TERMS = ['lcd', 'led', 'проектор', 'панел', 'экран', 'видеостен', 'вкс', 'камера', 'микрофон', 'акуст', 'усилител', 'dsp', 'процессор', 'коммутац', 'матриц', 'scaler', 'switcher', 'media', 'медиасервер', 'конференц', 'свет', 'интерактив'];
const INFRA_TERMS = ['кабель', 'креплен', 'стойк', 'rack', 'питани', 'ups', 'ибп', 'розет', 'патч', 'разъем', 'коннектор', 'кронштейн', 'монтаж', 'сет', 'poe', 'switch', 'маршрут', 'wifi', 'wi-fi'];
const IT_TERMS = ['ноутбук', 'компьютер', 'процессор intel', 'видеокарта', 'ssd', 'hdd', 'память', 'сервер', 'материнск', 'мышь', 'клавиат', 'принтер', 'сканер', 'контроллер вентиляторов', 'охлажден', 'sata'];
const CONSUMABLE_TERMS = ['бумага', 'картридж', 'тонер', 'чернил', 'батарейк', 'аккумулятор', 'расходник'];
const SERVICE_TERMS = ['монтаж', 'услуга', 'работ', 'пусконалад', 'пнр', 'доставка', 'логист'];

export const DEFAULT_VISIBLE_SCOPES = ['av_core', 'av_infrastructure', 'service'];
export const ALL_CATALOG_SCOPES = ['av_core', 'av_infrastructure', 'it_related', 'consumables', 'service', 'unknown', 'hidden'];

export function classifyCatalogScope(item = {}) {
  if (item.catalogScope) return item.catalogScope;
  if (item.relevance) return item.relevance;
  const text = `${item.name || ''} ${item.category || ''} ${item.segment || ''} ${item.note || ''}`.toLowerCase();
  if (SERVICE_TERMS.some(term => text.includes(term))) return 'service';
  if (AV_CORE_TERMS.some(term => text.includes(term))) return 'av_core';
  if (INFRA_TERMS.some(term => text.includes(term))) return 'av_infrastructure';
  if (CONSUMABLE_TERMS.some(term => text.includes(term))) return 'consumables';
  if (IT_TERMS.some(term => text.includes(term))) return 'it_related';
  return 'unknown';
}

export function catalogScopeLabel(scope) {
  return {
    av_core: 'AV-ядро',
    av_infrastructure: 'AV-инфраструктура',
    it_related: 'IT и смежное',
    consumables: 'Расходники',
    service: 'Работы/услуги',
    unknown: 'Не классифицировано',
    hidden: 'Скрыто'
  }[scope] || scope || 'Не классифицировано';
}

export function visibleScopesForMode(mode = 'default') {
  if (mode === 'all') return ALL_CATALOG_SCOPES.filter(scope => scope !== 'hidden');
  if (mode === 'unknown') return ['unknown'];
  if (mode === 'it') return [...DEFAULT_VISIBLE_SCOPES, 'it_related', 'consumables'];
  return DEFAULT_VISIBLE_SCOPES;
}

export function withCatalogScope(item = {}) {
  const catalogScope = classifyCatalogScope(item);
  return { ...item, catalogScope, relevance: item.relevance || catalogScope };
}
