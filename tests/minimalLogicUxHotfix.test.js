import assert from 'node:assert/strict';
import { createProject, createZone } from '../src/engine/projectFactory.js';
import { calculateProjectTotals, calculateComplexity, calculateLogistics } from '../src/engine/pricing.js';
import { generateEstimateFromZones, selectBestCandidate } from '../src/engine/estimate.js';
import { PROJECT_TYPES } from '../src/data/projectTypes.js';
import { createZoneSeedFromTemplate, getProjectZoneModel, getZoneTemplate } from '../src/data/zoneTaxonomy.js';
import { LibraryFilters } from '../src/components/LibraryFilters.js';
import { EquipmentCard } from '../src/components/EquipmentCard.js';

function pricedProject(overrides = {}, passport = {}) {
  return createProject({
    name: 'Pricing test',
    customerName: 'Client',
    passport: { projectType: 'corporate', scenario: 'base', cityTier: 'local', ceilingHeight: 3.2, marginPct: 0, vatPct: 0, ...passport },
    settingsOverrides: overrides,
    zones: [createZone({ name: 'Meeting', type: 'conference', flags: { install: true, pnr: true, delivery: true } })],
    estimateItems: [{ name: 'Display', category: 'LCD-панели', qty: 1, unitCost: 100000, currency: 'RUB', priceMode: 'fixed', isManual: true }]
  });
}

function candidate(id, unitCost, extra = {}) {
  return { id, name: id, unitCost, solutionLevel: 'standard', supplier: 'Supplier', supplierPriority: 1, priorityScore: 0, ...extra };
}

export function runMinimalLogicUxHotfixTests() {
  const existingTemplateIds = new Set(PROJECT_TYPES.flatMap(type => getProjectZoneModel(type.id).defaultZoneTemplateIds));
  assert.equal(existingTemplateIds.has('control-room'), false, 'control-room must not be referenced by default zones');

  PROJECT_TYPES.forEach(projectType => {
    const model = getProjectZoneModel(projectType.id);
    assert.ok(model.defaultZoneTemplateIds.length > 0, `${projectType.id} should have default zones`);
    const project = createProject({ name: `${projectType.id} defaults`, customerName: 'Client', passport: { projectType: projectType.id, scenario: 'base' } });
    model.defaultZoneTemplateIds.forEach(templateId => {
      const template = getZoneTemplate(templateId);
      assert.ok(template, `${projectType.id} default template exists: ${templateId}`);
      project.zones.push(createZone(createZoneSeedFromTemplate(template, projectType.id)));
    });
    assert.equal(project.zones.length, model.defaultZoneTemplateIds.length, `${projectType.id} default zone creation should keep every template`);
    assert.deepEqual(project.zones.map(zone => zone.templateId), model.defaultZoneTemplateIds, `${projectType.id} default generation must not drop template ids`);
  });

  const autoProject = pricedProject();
  const autoTotals = calculateProjectTotals(autoProject);
  assert.equal(autoTotals.complexity, calculateComplexity(autoProject), 'automatic complexity should be unchanged without manual value');
  assert.equal(autoTotals.logisticsCoef, calculateLogistics(autoProject), 'automatic logistics should be unchanged without manual value');

  const manualComplexity = pricedProject({ complexityManual: 1.5 });
  const manualComplexityTotals = calculateProjectTotals(manualComplexity);
  assert.equal(manualComplexityTotals.complexity, 1.5, 'manual complexity should override automatic complexity');
  assert.notEqual(manualComplexityTotals.salePriceGross, autoTotals.salePriceGross, 'manual complexity should change the total');

  const manualLogistics = pricedProject({ logisticsManual: 1.4 });
  const manualLogisticsTotals = calculateProjectTotals(manualLogistics);
  assert.equal(manualLogisticsTotals.logisticsCoef, 1.4, 'manual logistics should override automatic logistics');
  assert.notEqual(manualLogisticsTotals.salePriceGross, autoTotals.salePriceGross, 'manual logistics should change the total');

  const invalidManual = pricedProject({ complexityManual: 0, logisticsManual: 'abc' });
  const invalidTotals = calculateProjectTotals(invalidManual);
  assert.equal(invalidTotals.complexity, calculateComplexity(invalidManual), 'invalid manual complexity should be ignored');
  assert.equal(invalidTotals.logisticsCoef, calculateLogistics(invalidManual), 'invalid manual logistics should be ignored');

  const moderate = selectBestCandidate([candidate('cheap', 1000), candidate('moderate', 2000), candidate('expensive', 10000)], 'base');
  assert.equal(moderate.id, 'moderate', 'selection should prefer a moderate valid price, not the highest price');

  const twoEqual = selectBestCandidate([candidate('low', 1000), candidate('high', 10000)], 'base');
  assert.equal(twoEqual.id, 'low', 'two equivalent candidates should not pick the most expensive by default');

  const priced = selectBestCandidate([candidate('no-price', 0), candidate('priced', 2500)], 'base');
  assert.equal(priced.id, 'priced', 'valid price should beat missing or zero price');

  const premium = selectBestCandidate([candidate('standard', 3000, { solutionLevel: 'standard' }), candidate('premium', 3200, { solutionLevel: 'premium' }), candidate('expert', 3300, { solutionLevel: 'expert' })], 'premium');
  assert.equal(premium.id, 'premium', 'premium scenario should still respect solution level before price');

  const supplierFirstProject = createProject({ name: 'Supplier-first still works', customerName: 'Client', passport: { projectType: 'control', scenario: 'base' } });
  const template = getZoneTemplate('dispatch-room');
  supplierFirstProject.zones.push(createZone(createZoneSeedFromTemplate(template, 'control')));
  const report = generateEstimateFromZones(supplierFirstProject, { mode: 'replace' });
  assert.ok(report.processedZones.length > 0, 'control default zone should be processed');
  assert.ok(report.processedZones[0].supplierCount > 0, 'supplier-first priority should still select supplier rows when available');

  const collapsedFilters = LibraryFilters({ suppliers: [{ id: 's1', name: 'Supplier 1' }], zones: [{ id: 'z1', name: 'Зона 1' }] });
  assert.ok(collapsedFilters.includes('data-lib-search'), 'collapsed filters should show search');
  assert.ok(collapsedFilters.includes('data-lib-category'), 'collapsed filters should show category');
  assert.ok(collapsedFilters.includes('data-lib-supplier'), 'collapsed filters should show supplier');
  assert.ok(collapsedFilters.includes('data-target-zone'), 'collapsed filters should show target zone');
  assert.equal(collapsedFilters.includes('data-lib-subcategory'), false, 'collapsed filters should hide subcategory');
  assert.equal(collapsedFilters.includes('data-lib-project-type'), false, 'collapsed filters should hide project type');
  assert.equal(collapsedFilters.includes('data-lib-scope'), false, 'collapsed filters should hide relevance scope');

  const expandedFilters = LibraryFilters({ advanced: true, subcategory: 'display-lcd', level: 'premium', scope: 'hidden' });
  assert.ok(expandedFilters.includes('data-library-advanced-filters'), 'expanded filters should render advanced group');
  assert.ok(expandedFilters.includes('data-lib-subcategory'), 'expanded filters should keep subcategory filtering available');
  assert.ok(expandedFilters.includes('data-lib-scope'), 'expanded filters should keep supplier quality filtering available');
  assert.ok(expandedFilters.includes('value="hidden" selected') || expandedFilters.includes('value="hidden"  selected'), 'expanded filters should preserve selected scope');

  const item = { id: 'item-1', name: 'PTZ camera', category: 'PTZ-камеры', categoryId: 'video', subcategoryId: 'ptz-cameras', unitCost: 1000, currency: 'RUB', priceStatus: 'actual' };
  const normalCard = EquipmentCard(item, {}, []);
  assert.ok(normalCard.includes('data-add-library="item-1"'), 'normal card should keep Add action');
  assert.ok(normalCard.includes('Подробнее'), 'normal card should keep Details action');
  assert.equal(normalCard.includes('data-mark-av'), false, 'normal card should hide AV curation action');
  assert.equal(normalCard.includes('data-hide-library'), false, 'normal card should hide hide action');

  const curationCard = EquipmentCard(item, {}, [], { showCurationActions: true });
  assert.ok(curationCard.includes('data-mark-av'), 'curation mode may show service actions');
  assert.ok(curationCard.includes('data-hide-library'), 'curation mode may show hide action');

  console.log('Minimal logic/UX hotfix tests passed.');
}
