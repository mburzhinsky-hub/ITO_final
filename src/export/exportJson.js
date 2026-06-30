import { exportProject as rawExportProject, importProject } from '../app/storage.js';
import { calculateProjectTotals } from '../engine/pricing.js';
import { validateProject } from '../engine/validation.js';
export function exportProject(project) {
  return JSON.stringify({ ...project, calculatedTotals: calculateProjectTotals(project), validationWarnings: validateProject(project) }, null, 2);
}
export { importProject, rawExportProject };
