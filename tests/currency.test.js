import { equal, assert } from './test-utils.js';
import { convertToRub, itemUnitCostRub, shouldRecalculateByRate, normalizeCurrency } from '../src/engine/currency.js';
import { validateEstimate } from '../src/engine/validation.js';
import { createEstimateItem, createProject } from '../src/engine/projectFactory.js';
import { testSettings } from './fixtures.js';

export function run() {
  equal(convertToRub(10, 'USD', testSettings), 800, 'USD to RUB');
  equal(convertToRub(10, 'RUB', testSettings), 10, 'RUB to RUB');
  const manualRub = createEstimateItem({ currency: 'RUB', priceMode: 'manual', unitCost: 100 });
  const usdIndexed = createEstimateItem({ currency: 'USD', priceMode: 'indexed', unitCost: 100 });
  equal(shouldRecalculateByRate(manualRub), false, 'manual RUB does not depend on USD rate');
  equal(shouldRecalculateByRate(usdIndexed), true, 'USD indexed depends on USD rate');
  equal(itemUnitCostRub(usdIndexed, { ...testSettings, usdRate: 90 }), 9000, 'USD indexed recalculates by rate');
  equal(normalizeCurrency('EUR'), 'RUB', 'unknown currency normalized safely');
  const project = createProject({ estimateItems: [{ id: 'bad-currency', name: 'Bad currency', category: 'Оборудование', qty: 1, currency: 'EUR', unitCost: 10, note: 'fixture' }] });
  assert(validateEstimate(project, testSettings).some(w => w.id.includes('currency-unknown')), 'unknown currency gives warning');
}
