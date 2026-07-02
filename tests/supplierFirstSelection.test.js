import assert from 'node:assert/strict';
import { createProject, createZone } from '../src/engine/projectFactory.js';
import { generateEstimateFromZones } from '../src/engine/estimate.js';
import { createZoneSeedFromTemplate, getZoneTemplate } from '../src/data/zoneTaxonomy.js';
import { buildClientProposalView } from '../src/engine/proposalBuilder.js';

function projectWithZone(templateId = 'small-meeting-room', projectType = 'corporate') {
  const template = getZoneTemplate(templateId);
  assert.ok(template, `Template not found: ${templateId}`);
  const project = createProject({ name: 'Supplier-first test', customerName: 'Client', passport: { projectType, scenario: 'base' } });
  project.zones.push(createZone(createZoneSeedFromTemplate(template, projectType)));
  return project;
}

export function runSupplierFirstSelectionTests() {
  const project = projectWithZone('small-meeting-room', 'corporate');
  const report = generateEstimateFromZones(project, { mode: 'replace' });
  assert.ok(report.added > 0, 'estimate rows should be generated');
  assert.ok(report.processedZones[0].supplierCount > 0, 'supplier-first should select supplier rows');
  const supplierRows = project.estimateItems.filter(item => item.sourceType === 'supplier');
  assert.ok(supplierRows.length > 0, 'project should contain supplier rows');
  supplierRows.forEach(item => {
    assert.ok(item.supplierName || item.supplier, 'supplier row keeps supplier name');
    assert.notEqual(item.catalogRelevance, 'it_related', 'IT rows are not used as default AV template choices');
    assert.notEqual(item.catalogRelevance, 'questionable', 'questionable rows are not used by default');
    assert.notEqual(item.catalogRelevance, 'hidden', 'hidden rows are not used by default');
    assert.notEqual(item.qualityVisibility, 'hiddenByDefault', 'hidden-by-default rows are not used by default');
  });

  const fallbackProject = createProject({ name: 'Fallback test', customerName: 'Client', passport: { projectType: 'corporate', scenario: 'base' } });
  fallbackProject.zones.push(createZone({
    name: 'Fallback zone',
    type: 'conference',
    categoryId: 'meeting-vcs',
    templateId: 'manual-fallback-test',
    area: 20,
    requiredSystemGroups: ['Сигнальные кабели'],
    recommendedItems: [{ category: 'Сигнальные кабели', name: 'Сигнальный кабель', qty: 1, priority: 1 }]
  }));
  generateEstimateFromZones(fallbackProject, { mode: 'replace' });
  assert.ok(fallbackProject.estimateItems.some(item => item.sourceType === 'baseLibrary' && item.fallbackReason), 'missing supplier role should use marked base library fallback');

  const clientView = buildClientProposalView(project);
  const clientPayload = JSON.stringify(clientView.sections);
  assert.equal(/supplierSku|supplierName|supplierCategory|маржа|закупк/i.test(clientPayload), false, 'client proposal should not expose internal supplier/margin fields');
  console.log('Supplier-first selection tests passed.');
}
