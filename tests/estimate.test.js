import { assert, equal } from './test-utils.js';
import { generateEstimateFromZones, deduplicateEstimateItems } from '../src/engine/estimate.js';
import { createEstimateItem } from '../src/engine/projectFactory.js';
import { sampleProject } from './fixtures.js';

export function run() {
  const project = sampleProject({ estimateItems: [] });
  const report = generateEstimateFromZones(project, { mode: 'replace' });
  assert(report.processedZones.length === 1, 'zone processed');
  assert(project.estimateItems.length > 0, 'estimate generated from zone');
  const len = project.estimateItems.length;
  generateEstimateFromZones(project, { mode: 'append' });
  equal(project.estimateItems.length, len, 're-generation does not duplicate derived rows');
  const manual = createEstimateItem({ id: 'manual-keep', name: 'Manual row', isManual: true, source: 'manual', note: 'keep' });
  project.estimateItems.push(manual);
  generateEstimateFromZones(project, { mode: 'replace' });
  assert(project.estimateItems.some(i => i.id === 'manual-keep'), 'manual row preserved');
  const empty = sampleProject({ zones: [], estimateItems: [] });
  const emptyReport = generateEstimateFromZones(empty);
  assert(emptyReport.warnings.length && empty.estimateItems.length === 0, 'empty zones do not create unclear estimate');
  const dup = deduplicateEstimateItems([createEstimateItem({ derivedKey: 'x', isDerived: true }), createEstimateItem({ derivedKey: 'x', isDerived: true })]);
  equal(dup.length, 1, 'derived duplicate removed');
}
