import { equal, approx, assert } from './test-utils.js';
import { calculateSalePrice, calculateVat, calculateProfit, calculateActualMargin, calculateActualMarkup, calculateProjectTotals } from '../src/engine/pricing.js';
import { sampleProject, testSettings } from './fixtures.js';

export function run() {
  equal(calculateSalePrice(100, 25, 'markup'), 125, 'markup sale price');
  approx(calculateSalePrice(100, 20, 'margin'), 125, 0.001, 'margin sale price');
  equal(calculateVat(100, 20), 20, 'VAT');
  equal(calculateProfit(125, 100), 25, 'profit');
  approx(calculateActualMargin(125, 100), 20, 0.001, 'actual margin');
  approx(calculateActualMarkup(125, 100), 25, 0.001, 'actual markup');
  const totals = calculateProjectTotals(sampleProject(), testSettings);
  assert(totals.equipmentCost > 0, 'equipment cost is calculated');
  assert(totals.salePriceGross > totals.salePriceNet, 'gross includes VAT');
}
