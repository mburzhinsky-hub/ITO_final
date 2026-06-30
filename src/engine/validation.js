import { calculateProjectTotals, mergedSettings } from './pricing.js';
import { calculateBudgetStatus } from './budget.js';
import { normalizeCurrency } from './currency.js';
import { num } from '../utils/format.js';
import { getProjectZoneModel, getZoneCategory, getZoneTemplate } from '../data/zoneTaxonomy.js';

export function validateProject(project = {}, settingsInput = null) {
  const settings = settingsInput || mergedSettings(project);
  const warnings = [
    ...validatePassport(project, settings),
    ...validateZones(project, settings),
    ...validateEstimate(project, settings),
    ...validateCommercialSettings(project, settings)
  ];
  const accepted = new Set(project.acceptedWarnings || []);
  return warnings.filter(item => !accepted.has(item.id));
}

export function validatePassport(project = {}, settings = {}) {
  const warnings = [];
  if (!project.name?.trim()) warnings.push(w('passport-name', 'data', 'error', 'Не заполнено название проекта', 'Проекту нужно понятное название для КП и списка проектов.', 'project', project.id, 'Открыть паспорт', 'open-passport'));
  if (!project.customerName?.trim()) warnings.push(w('passport-customer', 'data', 'warning', 'Не заполнен заказчик', 'КП будет выглядеть неполным без названия заказчика.', 'project', project.id, 'Открыть паспорт', 'open-passport'));
  const vatPct = num(project.passport?.vatPct, settings.defaultVatPct);
  if (vatPct < 0 || vatPct > 100) warnings.push(w('commercial-vat', 'commercial', 'error', 'Некорректный НДС', 'НДС должен быть в диапазоне от 0 до 100%.', 'passport', project.id, 'Исправить НДС', 'open-passport'));
  return warnings;
}

export function validateZones(project = {}) {
  const warnings = [];
  const zones = project.zones || [];
  const projectTypeId = project.passport?.projectType || 'corporate';
  const model = getProjectZoneModel(projectTypeId);
  if (!zones.length) warnings.push(w('zones-empty', 'zones', 'error', 'Нет зон', 'Нельзя предсказуемо сгенерировать смету без зон.', 'project', project.id, 'Добавить зоны', 'open-zones'));
  zones.forEach(zone => {
    const category = getZoneCategory(zone.categoryId);
    const template = getZoneTemplate(zone.templateId);
    if (!zone.area || zone.area <= 0) warnings.push(w(`zone-area-${zone.id}`, 'zones', 'warning', 'У зоны нет площади', `У зоны «${zone.name || 'без названия'}» не указана корректная площадь.`, 'zone', zone.id, 'Исправить зону', 'open-zone'));
    if (!zone.type) warnings.push(w(`zone-type-${zone.id}`, 'zones', 'error', 'У зоны не выбран тип', `Для зоны «${zone.name || 'без названия'}» нужно выбрать тип.`, 'zone', zone.id, 'Исправить зону', 'open-zone'));
    if (!zone.categoryId) warnings.push(w(`zone-category-${zone.id}`, 'zones', 'warning', 'У зоны нет категории', `Зона «${zone.name || 'без названия'}» не привязана к категории, поэтому проверки и смета будут менее точными.`, 'zone', zone.id, 'Выбрать шаблон', 'open-zone'));
    if (!zone.templateId) warnings.push(w(`zone-template-${zone.id}`, 'zones', 'recommendation', 'У зоны нет шаблона', `Зона «${zone.name || 'без названия'}» добавлена вручную. Лучше использовать шаблон, чтобы подтянуть AV-группы и зависимости.`, 'zone', zone.id, 'Выбрать шаблон', 'open-zone'));
    if (zone.categoryId && !model.allowedZoneCategoryIds.includes(zone.categoryId)) warnings.push(w(`zone-nontypical-${zone.id}`, 'zones', 'recommendation', 'Нетиповая зона для типа проекта', `«${zone.name || 'Зона'}» из категории «${category?.name || zone.categoryId}» не является типовой для выбранного типа проекта, но может быть оставлена вручную.`, 'zone', zone.id, 'Проверить зоны', 'open-zone'));
    if (template?.requiresEngineerReview || zone.requiresEngineerReview) warnings.push(w(`zone-engineer-${zone.id}`, 'engineering', 'warning', 'Нужна инженерная проверка зоны', `Для зоны «${zone.name || template?.name || 'без названия'}» проверьте крепления, питание, трассы, коммутацию и сценарии управления.`, 'zone', zone.id, 'Открыть зону', 'open-zone'));
  });
  return warnings;
}

export function validateEstimate(project = {}, settings = {}) {
  const warnings = [];
  const items = project.estimateItems || [];
  if (!items.length) warnings.push(w('estimate-empty', 'estimate', 'error', 'Смета пустая', 'Добавьте позиции вручную, из библиотеки или сгенерируйте по зонам.', 'estimate', project.id, 'Открыть смету', 'open-estimate'));
  const derivedKeys = new Set();
  const zoneItemsByZone = items.reduce((acc, item) => { if (item.zoneId) (acc[item.zoneId] ||= []).push(item); return acc; }, {});
  (project.zones || []).forEach(zone => {
    const zoneItems = zoneItemsByZone[zone.id] || [];
    const requiredGroups = zone.requiredSystemGroups || getZoneTemplate(zone.templateId)?.requiredSystemGroups || [];
    requiredGroups.forEach(group => {
      const covered = zoneItems.some(item => String(item.category || '').toLowerCase().includes(String(group).toLowerCase()) || String(group).toLowerCase().includes(String(item.category || '').toLowerCase()));
      if (!covered && zoneItems.length) warnings.push(w(`zone-group-${zone.id}-${group}`, 'engineering', 'recommendation', 'AV-группа не закрыта в смете', `В зоне «${zone.name}» требуется группа «${group}», но в смете по этой зоне нет очевидной позиции этой категории.`, 'zone', zone.id, 'Проверить смету', 'open-estimate'));
    });
  });
  items.forEach(item => {
    if (num(item.qty, 0) <= 0) warnings.push(w(`item-qty-${item.id}`, 'estimate', 'error', 'Количество позиции меньше или равно нулю', `Позиция «${item.name}» имеет некорректное количество.`, 'item', item.id, 'Исправить позицию', 'open-estimate'));
    if (num(item.unitCost, 0) < 0) warnings.push(w(`item-cost-${item.id}`, 'estimate', 'error', 'Цена позиции меньше нуля', `Позиция «${item.name}» имеет отрицательную цену.`, 'item', item.id, 'Исправить позицию', 'open-estimate'));
    if (!item.currency) warnings.push(w(`item-currency-${item.id}`, 'currency', 'error', 'Валюта не задана', `У позиции «${item.name}» не указана валюта.`, 'item', item.id, 'Исправить валюту', 'open-estimate'));
    if (normalizeCurrency(item.currency) === 'USD' && num(settings.usdRate, 0) <= 0) warnings.push(w(`item-rate-${item.id}`, 'currency', 'error', 'Есть валютная позиция, но курс не задан', `Позиция «${item.name}» зависит от курса USD.`, 'item', item.id, 'Открыть настройки', 'open-settings'));
    if (!item.category?.trim()) warnings.push(w(`item-category-${item.id}`, 'estimate', 'warning', 'Позиция без категории', `Позиция «${item.name}» не попадёт в нормальную группировку сметы.`, 'item', item.id, 'Исправить категорию', 'open-estimate'));
    if (item.isManual && !item.note?.trim()) warnings.push(w(`item-manual-note-${item.id}`, 'estimate', 'recommendation', 'Ручная позиция без комментария', `Для ручной позиции «${item.name}» желательно указать основание цены.`, 'item', item.id, 'Добавить комментарий', 'open-estimate'));
    if ((project.zones || []).length && !item.zoneId && item.isDerived) warnings.push(w(`item-zone-${item.id}`, 'estimate', 'warning', 'Позиция без привязки к зоне', `Расчётная позиция «${item.name}» не привязана к зоне.`, 'item', item.id, 'Привязать к зоне', 'open-estimate'));
    if (item.isDerived && item.derivedKey) {
      if (derivedKeys.has(item.derivedKey)) warnings.push(w(`item-duplicate-${item.derivedKey}`, 'estimate', 'warning', 'Возможный дубль derived-строки', `Расчётная строка «${item.name}» могла продублироваться.`, 'item', item.id, 'Пересчитать derived', 'regenerate-derived'));
      derivedKeys.add(item.derivedKey);
    }
  });
  return warnings;
}

export function validateCommercialSettings(project = {}, settings = {}) {
  const warnings = [];
  const mode = project.passport?.marginMode || settings.defaultMarginMode;
  const pct = num(project.passport?.marginPct, settings.defaultMarginPct);
  if (mode === 'margin' && (pct < 0 || pct >= 100)) warnings.push(w('commercial-margin', 'commercial', 'error', 'Некорректная маржа', 'Маржа должна быть от 0% до 99.99%. При 100% цена продажи математически невозможна.', 'passport', project.id, 'Исправить маржу', 'open-passport'));
  if (mode === 'markup' && pct < 0) warnings.push(w('commercial-markup', 'commercial', 'error', 'Некорректная наценка', 'Наценка не должна быть отрицательной.', 'passport', project.id, 'Исправить наценку', 'open-passport'));
  const totals = calculateProjectTotals(project, settings);
  const budget = calculateBudgetStatus(project, totals, settings);
  if (budget.enabled && budget.status === 'over') warnings.push(w('budget-over', 'budget', 'warning', 'Целевой бюджет превышен', `Текущая цена выше бюджета на ${Math.round(budget.delta).toLocaleString('ru-RU')} ₽ (${budget.deltaPct.toFixed(1)}%).`, 'project', project.id, 'Проверить бюджет', 'open-estimate'));
  return warnings;
}

function w(id, type, severity, title, message, entityType, entityId, actionLabel, actionType) {
  return { id, type, severity, title, message, entityType, entityId, actionLabel, actionType };
}
