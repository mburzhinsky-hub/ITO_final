import { assert } from './test-utils.js';
import { buildClientProposalView, buildInternalEstimateView } from '../src/engine/proposalBuilder.js';
import { sampleProject, testSettings } from './fixtures.js';

export function run() {
  const project = sampleProject();
  project.estimateItems[0].supplier = 'Secret Supplier';
  const client = buildClientProposalView(project, testSettings, { detailLevel: 'detailed', showEquipmentNames: true, showQuantities: true, showUnitPrices: true });
  const clientText = JSON.stringify(client).toLowerCase();
  assert(!clientText.includes('unitcost'), 'client proposal does not expose purchase field names');
  assert(!clientText.includes('supplier'), 'client proposal does not expose supplier field names');
  assert(!clientText.includes('secret supplier'), 'client proposal does not expose supplier value');
  assert(!clientText.includes('marginpct'), 'client proposal does not expose margin field names');
  const internal = buildInternalEstimateView(project, testSettings);
  const internalText = JSON.stringify(internal).toLowerCase();
  assert(internalText.includes('unitcost') && internalText.includes('supplier') && internalText.includes('marginpct'), 'internal estimate includes internal fields');
  const brief = buildClientProposalView(project, testSettings, { detailLevel: 'brief' });
  assert(brief.sections.every(s => Array.isArray(s.items)), 'brief detail works');
}
