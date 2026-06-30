import { assert } from './test-utils.js';
import { exportProjectWorkbook } from '../src/export/exportExcel.js';
import { exportProjectJson, parseProjectJson } from '../src/export/exportJson.js';
import { sampleProject, testSettings } from './fixtures.js';

export async function run() {
  const project = sampleProject();
  const workbook = exportProjectWorkbook(project, testSettings);
  assert(workbook.includes('<Workbook') && workbook.includes('Client Proposal') && workbook.includes('Internal Estimate'), 'Excel XML workbook generated');
  const json = exportProjectJson(project);
  assert(json.includes('exportMetadata') && json.includes('calculatedTotals'), 'project JSON exported');
  const parsed = await parseProjectJson(json);
  assert(parsed.project.id === project.id, 'project JSON imported');
}
