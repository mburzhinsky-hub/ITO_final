import { createId } from '../utils/ids.js';
import { DEFAULT_SETTINGS } from '../data/defaultSettings.js';

export const PROJECT_STATUSES = [
  {id:'draft', name:'Черновик'},
  {id:'estimate_ready', name:'Смета готова'},
  {id:'has_errors', name:'Есть ошибки'},
  {id:'proposal_ready', name:'КП готово'}
];

export function createProject(seed = {}) {
  const now = new Date().toISOString();
  const id = seed.id || createId('project');
  return {
    id,
    name: seed.name || 'Новый AV-пресейл',
    customerName: seed.customerName || '',
    createdAt: seed.createdAt || now,
    updatedAt: seed.updatedAt || now,
    status: seed.status || 'draft',
    passport: {
      projectType: 'corporate', cityTier: 'local', area: 350, floors: 1, ceilingHeight: 3.2,
      urgency: 'standard', scenario: 'base', targetBudget: 0,
      vatPct: DEFAULT_SETTINGS.defaultVatPct, marginMode: DEFAULT_SETTINGS.defaultMarginMode,
      marginPct: DEFAULT_SETTINGS.defaultMarginPct,
      ...(seed.passport || {})
    },
    zones: seed.zones || [],
    estimateItems: seed.estimateItems || [],
    acceptedWarnings: seed.acceptedWarnings || [],
    settingsOverrides: seed.settingsOverrides || {},
    notes: seed.notes || ''
  };
}

export function createZone(seed = {}) {
  return {
    id: seed.id || createId('zone'),
    name: seed.name || 'Новая зона',
    type: seed.type || seed.purpose || 'conference',
    area: seed.area ?? 25,
    task: seed.task || seed.primaryTask || 'content',
    scenario: seed.scenario || '',
    flags: { install:true, pnr:true, content:false, delivery:true, metal:false, service:false, ...(seed.flags || {}) },
    notes: seed.notes || ''
  };
}

export function createEstimateItem(seed = {}) {
  return {
    id: seed.id || createId('item'),
    zoneId: seed.zoneId || seed.zoneRef || '',
    name: seed.name || 'Позиция',
    category: seed.category || 'Оборудование',
    unit: seed.unit || 'шт.',
    qty: Number(seed.qty ?? 1),
    currency: seed.currency || 'RUB',
    unitCost: Number(seed.unitCost ?? seed.priceRub ?? seed.price_rub ?? seed.price ?? 0),
    priceMode: seed.priceMode || 'cost',
    source: seed.source || 'manual',
    isManual: seed.isManual ?? true,
    isDerived: seed.isDerived ?? false,
    note: seed.note || seed.description || ''
  };
}

export function normalizeProject(raw) {
  const project = createProject(raw || {});
  project.zones = (raw?.zones || []).map(createZone);
  project.estimateItems = (raw?.estimateItems || raw?.estimate || []).map(createEstimateItem);
  return project;
}

export function duplicateProject(project) {
  return createProject({
    ...structuredClone(project),
    id: createId('project'),
    name: `${project.name || 'Проект'} · копия`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  });
}
