import { DEFAULT_SETTINGS } from '../data/defaultSettings.js';
import { num } from '../utils/format.js';

export function mergedSettings(project) { return {...DEFAULT_SETTINGS, ...(project?.settingsOverrides || {})}; }
export function itemCostRub(item, settings = DEFAULT_SETTINGS) {
  const unitCost = num(item.unitCost);
  const rate = item.currency === 'USD' ? num(settings.usdRate, 80) : 1;
  return num(item.qty, 1) * unitCost * rate;
}
export function calculateTotals(project) {
  const settings = mergedSettings(project);
  const rates = settings.laborRates;
  const equipment = project.estimateItems.reduce((sum, item) => sum + itemCostRub(item, settings), 0);
  const complexity = calculateComplexity(project);
  const logisticsCoef = calculateLogistics(project);
  const install = equipment * rates.installationPct * complexity;
  const pnr = equipment * rates.pnrPct * complexity;
  const content = equipment * rates.contentPct * countFlag(project, 'content');
  const cables = equipment * rates.cablePct * logisticsCoef;
  const logistics = equipment * rates.logisticsPct * logisticsCoef;
  const service = equipment * rates.servicePct * countFlag(project, 'service');
  const cost = equipment + install + pnr + content + cables + logistics + service;
  const marginPct = num(project.passport.marginPct, settings.defaultMarginPct) / 100;
  const net = project.passport.marginMode === 'margin' ? cost / Math.max(0.01, 1 - marginPct) : cost * (1 + marginPct);
  const vat = num(project.passport.vatPct, settings.defaultVatPct) / 100;
  return { equipment, install, pnr, content, cables, logistics, service, cost, margin: net - cost, net, gross: net * (1 + vat), complexity, logisticsCoef };
}
function countFlag(project, flag) { return project.zones.some(z => z.flags?.[flag]) ? 1 : 0; }
export function calculateComplexity(project) {
  const p = project.passport || {}; const zones = project.zones || [];
  let coef = 1 + Math.max(0, num(p.ceilingHeight,3)-3) * 0.03 + Math.max(0, zones.length-1) * 0.03;
  if (p.urgency === 'urgent') coef += 0.12;
  if (zones.some(z => ['interactive','wow','vc'].includes(z.task))) coef += 0.08;
  if (zones.some(z => ['outdoor','stage'].includes(z.type))) coef += 0.10;
  return Number(coef.toFixed(2));
}
export function calculateLogistics(project) {
  const tier = project.passport?.cityTier || 'local';
  const map = {local:1, regional:1.08, remote:1.18, hard:1.3, moscow:1, spb:1.03, region:1.12, far:1.25};
  return map[tier] || 1;
}
