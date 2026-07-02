import assert from 'node:assert/strict';
import { scoreRoleFit, enrichItemRoleFit } from '../src/engine/roleScoring.js';
import { createProject, createZone, createEstimateItem } from '../src/engine/projectFactory.js';
import { generateEstimateFromZones, selectBestCandidate } from '../src/engine/estimate.js';
import { createZoneSeedFromTemplate, getZoneTemplate } from '../src/data/zoneTaxonomy.js';
import { validateProject } from '../src/engine/validation.js';
import { resolveEstimateLineSystemGroups, estimateLineCoversGroup } from '../src/engine/systemGroupCoverage.js';
import { AppLayout } from '../src/components/AppLayout.js';
import { LibraryFilters } from '../src/components/LibraryFilters.js';
import { GroupedEstimateTable } from '../src/components/GroupedEstimateTable.js';
import { WarningList } from '../src/components/WarningList.js';
import { getProject, setProject, getUiMode, setUiMode } from '../src/app/state.js';

function passed(item, role) { return scoreRoleFit(item, role).passed; }
function score(item, role) { return scoreRoleFit(item, role).score; }

export function runStage13RoleScoringValidationUxTests() {
  assert.equal(passed({ name: 'LED wall mount bracket', category: 'Крепления и конструкции' }, 'LED screen / LED wall'), false, 'LED role must reject mounts');
  assert.equal(passed({ name: 'Touch panel control 10 inch', category: 'Системы управления' }, 'Projection screen'), false, 'projection screen must reject touch panel');
  assert.equal(passed({ name: 'Ceiling speaker 6 inch', category: 'Акустика' }, 'LCD / display panel'), false, 'LCD role must reject acoustics');
  assert.equal(passed({ name: 'Ceiling speaker 6 inch', category: 'Акустика' }, 'Microphone'), false, 'microphone role must reject speakers');
  assert.equal(passed({ name: 'Power amplifier 2x200W', category: 'DSP и усилители' }, 'Speaker / acoustic system'), false, 'speaker role must reject amplifiers');
  assert.equal(passed({ name: 'Laser projector 7000 lm', category: 'Проекторы' }, 'Rack / cabinet'), false, 'rack role must reject projectors');
  assert.equal(passed({ name: 'HDMI cable 10m', category: 'Кабельная инфраструктура' }, 'Cable infrastructure'), true, 'cable role must allow cable infrastructure');
  assert.equal(passed({ name: 'Wall mount VESA bracket', category: 'Крепления и конструкции' }, 'Mount / bracket'), true, 'mount role must allow brackets');
  assert.equal(passed({ name: '55 inch professional display', category: 'LCD-панели' }, 'Mount / bracket'), false, 'mount role must reject main displays');
  assert.ok(score({ name: 'Светодиодный экран p2.5 led wall', category: 'LED-экраны' }, 'LED screen / LED wall') > score({ name: 'LED wall mount bracket', category: 'Крепления и конструкции' }, 'LED screen / LED wall'), 'roleFitScore must separate main device from accessory');

  const questionable = enrichItemRoleFit({ name: 'ZX-unknown universal AV item', category: 'Доп. оборудование', relevance: 'questionable', requiresCatalogReview: true }, 'Rack / cabinet');
  assert.equal(questionable.needsEngineerReview, true, 'questionable supplier-like rows must be flagged for engineering review');

  const supplier = { id: 'supplier-good', name: 'Supplier microphone', supplier: 'Supplier', sourceType: 'supplier', unitCost: 1000, solutionLevel: 'standard', roleFitScore: 92, roleFitMinScore: 58, priorityScore: 1 };
  const fallback = { id: 'fallback-great', name: 'Fallback microphone', sourceType: 'baseLibrary', unitCost: 900, solutionLevel: 'standard', roleFitScore: 95, roleFitMinScore: 58, priorityScore: 1 };
  assert.equal(selectBestCandidate([supplier, fallback], 'base').id, 'fallback-great', 'better role fit must beat supplier-first if the supplier fit is worse');
  assert.equal(selectBestCandidate([{ ...supplier, roleFitScore: 95 }, { ...fallback, roleFitScore: 95 }], 'base').id, 'supplier-good', 'supplier-first wins after role fit tie');
  assert.equal(selectBestCandidate([{ ...supplier, id: 'bad-fit', roleFitScore: 20 }, { ...fallback, id: 'good-fit', roleFitScore: 90 }], 'base').id, 'good-fit', 'bad supplier fit must not win only because it is supplier');

  const project = createProject({ name: 'Supplier role fit project', customerName: 'Client', passport: { projectType: 'corporate', scenario: 'base' } });
  project.zones.push(createZone(createZoneSeedFromTemplate(getZoneTemplate('small-meeting-room'), 'corporate')));
  const report = generateEstimateFromZones(project, { mode: 'replace' });
  assert.ok(report.added > 0, 'stage13 generation must still add estimate rows');
  const supplierRows = project.estimateItems.filter(item => item.sourceType === 'supplier');
  assert.ok(supplierRows.length > 0, 'supplier-first must still select fitting supplier rows');
  supplierRows.forEach(item => {
    assert.ok(Number(item.roleFitScore || 0) >= Number(item.roleFitMinScore || 1), `supplier row role fit must pass: ${item.name}`);
    assert.ok(item.templateRole, 'supplier row keeps templateRole diagnostics');
    assert.ok(item.replacementGroup, 'supplier row keeps replacementGroup diagnostics');
  });

  assert.ok(resolveEstimateLineSystemGroups({ templateRole: 'Videoconference codec', replacementGroup: 'ВКС-системы' }).includes('video'), 'coverage resolver maps templateRole to video');
  assert.equal(estimateLineCoversGroup({ replacementGroup: 'LCD-панели' }, 'video'), true, 'replacementGroup can close video');
  assert.equal(estimateLineCoversGroup({ templateRole: 'Microphone' }, 'audio'), true, 'templateRole can close audio');
  assert.equal(estimateLineCoversGroup({ systemGroups: ['network'] }, 'network'), true, 'systemGroups can close network');

  const validationProject = createProject({ name: 'Coverage project', customerName: 'Client', passport: { projectType: 'corporate', scenario: 'base' } });
  const zone = createZone({ id: 'zone-coverage', name: 'Coverage zone', type: 'conference', categoryId: 'meeting-vcs', area: 20, requiredSystemGroups: ['video', 'audio', 'control', 'network', 'cabling', 'power'] });
  validationProject.zones.push(zone);
  validationProject.estimateItems = [
    createEstimateItem({ zoneId: zone.id, name: 'Display', replacementGroup: 'LCD-панели', category: 'LCD-панели', templateRole: 'LCD / display panel', unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ zoneId: zone.id, name: 'Mic', category: 'Микрофоны', templateRole: 'Microphone', unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ zoneId: zone.id, name: 'Control processor', category: 'Системы управления', templateRole: 'Control processor', unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ zoneId: zone.id, name: 'Network switch', category: 'Сеть', systemGroups: ['network'], unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ zoneId: zone.id, name: 'Cable kit', category: 'Кабельная инфраструктура', systemGroups: ['cabling'], unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ zoneId: zone.id, name: 'UPS', category: 'ИБП', systemGroups: ['power'], unitCost: 100, currency: 'RUB' })
  ];
  assert.equal(validateProject(validationProject).some(item => item.id.startsWith('zone-group-')), false, 'validation must not create false group warning when role/system coverage exists');

  const depProject = createProject({ name: 'Dependency dedupe', customerName: 'Client', passport: { projectType: 'corporate', scenario: 'base' } });
  depProject.zones.push(createZone({ id: 'zone-dep', name: 'Переговорная 1', type: 'conference', categoryId: 'meeting-vcs', area: 20 }));
  depProject.estimateItems = [
    createEstimateItem({ id: 'display-a', zoneId: 'zone-dep', name: 'Display A', category: 'LCD-панели', categoryId: 'display', unitCost: 100, currency: 'RUB' }),
    createEstimateItem({ id: 'display-b', zoneId: 'zone-dep', name: 'Display B', category: 'LCD-панели', categoryId: 'display', unitCost: 100, currency: 'RUB' })
  ];
  const deps = validateProject(depProject).filter(item => item.id.includes('dependency') && item.missingRole === 'mounting');
  assert.equal(deps.length, 1, 'dependency warnings for same missing role/zone must be grouped');
  assert.ok(deps[0].groupedCount >= 2, 'grouped dependency warning keeps affected count');
  assert.equal(deps[0].severity, 'warning', 'required dependency severity stays warning');

  const criticalProject = createProject({ name: '', customerName: '', zones: [], estimateItems: [] });
  assert.ok(validateProject(criticalProject).some(item => item.severity === 'critical'), 'error-level validation now exposes critical severity');

  setUiMode('quick');
  setProject(project);
  assert.equal(getUiMode(), 'quick', 'quick presale is default/explicit quick mode');
  const quickLayout = AppLayout('<div>Body</div>');
  assert.ok(quickLayout.includes('data-ui-mode="quick"'), 'quick layout renders quick mode marker');
  assert.ok(quickLayout.includes('Быстрый пресейл'), 'quick layout shows quick mode toggle');
  const quickFilters = LibraryFilters({ advanced: true, allowAdvanced: false });
  assert.equal(quickFilters.includes('data-library-advanced-filters'), false, 'quick mode hides advanced library filters');
  const quickWarnings = WarningList([{ id: 'r1', type: 'engineering', severity: 'review', title: 'Review', message: 'Hidden detail' }], { mode: 'quick' });
  assert.ok(quickWarnings.includes('Инженерная проверка'), 'quick warning list points to engineering mode for hidden technical details');
  const compactEstimate = GroupedEstimateTable(project, 'compact');
  assert.equal(compactEstimate.includes('Role fit'), false, 'quick/compact estimate hides roleFitScore');

  const beforeId = getProject().id;
  setUiMode('engineering');
  assert.equal(getProject().id, beforeId, 'switching UX mode must not reset the current project');
  const engineeringLayout = AppLayout('<div>Body</div>');
  assert.ok(engineeringLayout.includes('data-ui-mode="engineering"'), 'engineering layout renders engineering mode marker');
  const engineeringFilters = LibraryFilters({ advanced: true, allowAdvanced: true, scope: 'hidden' });
  assert.ok(engineeringFilters.includes('data-library-advanced-filters'), 'engineering mode exposes advanced library filters');
  const detailedEstimate = GroupedEstimateTable(project, 'detailed');
  assert.ok(detailedEstimate.includes('Role fit'), 'engineering/detailed estimate shows roleFitScore diagnostics');

  console.log('Stage13 role scoring / validation / UX mode tests passed.');
}
