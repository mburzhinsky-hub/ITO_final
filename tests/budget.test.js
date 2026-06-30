import { equal, assert } from './test-utils.js';
import { calculateBudgetStatus } from '../src/engine/budget.js';
import { sampleProject, testSettings } from './fixtures.js';

export function run() {
  const project = sampleProject();
  const totals = { salePriceNet: 1000, salePriceGross: 1200 };
  project.passport.targetBudget = 900;
  project.passport.targetBudgetIncludesVat = false;
  equal(calculateBudgetStatus(project, totals, testSettings).status, 'over', 'budget lower than net total');
  project.passport.targetBudget = 1500;
  equal(calculateBudgetStatus(project, totals, testSettings).status, 'under', 'budget higher than net total');
  project.passport.targetBudgetIncludesVat = true;
  project.passport.targetBudget = 1200;
  equal(calculateBudgetStatus(project, totals, testSettings).status, 'equal', 'gross comparison');
  const state = calculateBudgetStatus(project, totals, testSettings);
  assert(Number.isFinite(state.delta) && Number.isFinite(state.deltaPct), 'delta values are numeric');
}
