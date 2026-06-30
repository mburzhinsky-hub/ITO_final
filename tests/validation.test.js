import { assert } from './test-utils.js';
import { validateProject, validatePassport, validateEstimate } from '../src/engine/validation.js';
import { createEstimateItem, createProject } from '../src/engine/projectFactory.js';
import { sampleProject, testSettings } from './fixtures.js';

export function run() {
  assert(validatePassport(createProject({ name: 'X', customerName: '' }), testSettings).some(w => w.id === 'passport-customer'), 'missing customer is reported');
  assert(!validatePassport(createProject({ name: 'X', passport: { customerName: 'Заказчик' } }), testSettings).some(w => w.id === 'passport-customer'), 'passport customer alias is accepted');
  assert(validateProject(createProject({ zones: [], estimateItems: [] }), testSettings).some(w => w.id === 'zones-empty'), 'no zones warning');
  assert(validateEstimate(createProject({ estimateItems: [] }), testSettings).some(w => w.id === 'estimate-empty'), 'empty estimate warning');
  const bad = sampleProject({ estimateItems: [{ id: 'bad', name: 'Bad row', category: 'Оборудование', qty: 0, unitCost: -1, currency: '', note: 'bad' }] });
  const warnings = validateEstimate(bad, testSettings);
  assert(warnings.some(w => w.id === 'item-qty-bad'), 'zero qty');
  assert(warnings.some(w => w.id === 'item-cost-bad'), 'negative price');
  assert(warnings.some(w => w.id === 'item-currency-bad'), 'missing currency');
  const margin = createProject({ passport: { marginMode: 'margin', marginPct: 100 } });
  assert(validateProject(margin, testSettings).some(w => w.id === 'commercial-margin'), 'invalid margin');
}
