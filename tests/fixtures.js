import { createProject, createZone, createEstimateItem } from '../src/engine/projectFactory.js';

export function sampleProject(seed = {}) {
  return createProject({
    name: 'Тестовый проект',
    customerName: 'Тестовый заказчик',
    passport: { area: 100, marginMode: 'markup', marginPct: 25, vatPct: 20, targetBudget: 0, projectType: 'corporate', scenario: 'base' },
    zones: [createZone({ id: 'zone-1', name: 'Переговорная', type: 'conference', categoryId: 'meeting-vcs', templateId: 'small-meeting-room', area: 25 })],
    estimateItems: [
      createEstimateItem({ id: 'item-1', zoneId: 'zone-1', name: 'LCD панель', category: 'LCD-панели', qty: 1, unitCost: 100000, currency: 'RUB', priceMode: 'fixed', source: 'manual', isManual: true, note: 'fixture' }),
      createEstimateItem({ id: 'item-2', zoneId: 'zone-1', name: 'ВКС комплект', category: 'ВКС-системы', qty: 1, unitCost: 1000, currency: 'USD', priceMode: 'indexed', source: 'manual', isManual: true, note: 'fixture' })
    ],
    ...seed
  });
}

export const testSettings = {
  usdRate: 80,
  defaultVatPct: 20,
  defaultMarginMode: 'markup',
  defaultMarginPct: 25,
  targetBudgetIncludesVat: true,
  laborRates: { installationPct: 0.1, pnrPct: 0.05, contentPct: 0.1, cablePct: 0.05, logisticsPct: 0.03, servicePct: 0.02 },
  proposalSettings: { validityDays: 14, warranty: '12 месяцев' }
};
