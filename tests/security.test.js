import assert from 'node:assert/strict';
import { escapeAttr, escapeHtml, escapeSpreadsheetCell, safeUrl, sanitizeImportedProject, stripHtml, trimText } from '../src/utils/sanitize.js';
import { ProposalPreview } from '../src/components/ProposalPreview.js';
import { buildStandaloneProposalHtml } from '../src/export/exportHtml.js';
import { WarningList } from '../src/components/WarningList.js';
import { EquipmentCard } from '../src/components/EquipmentCard.js';
import { parseProjectJson } from '../src/export/exportJson.js';

const payloads = {
  script: '<script>alert(1)</script>',
  img: '<img src=x onerror=alert(1)>',
  svg: '"><svg onload=alert(1)>',
  iframe: '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  js: 'javascript:alert(1)',
  formula: '=HYPERLINK("http://evil.test","click")',
  plus: "+cmd|' /C calc'!A0",
  at: '@SUM(1+1)'
};

function assertNoExecutableHtml(html) {
  assert.equal(/<script[\s>]/i.test(html), false, html);
  assert.equal(/<img[\s>]/i.test(html), false, html);
  assert.equal(/<svg[\s>]/i.test(html), false, html);
  assert.equal(/<iframe[\s>]/i.test(html), false, html);
  assert.equal(/<[^>]+\s(onerror|onload|onclick)\s*=|href=[\"']javascript:/i.test(html), false, html);
}

export async function runSecurityTests() {
  assert.equal(escapeHtml(payloads.script).includes('<script>'), false);
  assert.equal(escapeHtml(payloads.img).includes('<img'), false);
  assert.equal(escapeAttr('" onmouseover="alert(1)').includes('onmouseover="'), false);
  assert.equal(safeUrl(payloads.js), '#');
  assert.equal(stripHtml('<b>test</b>'), 'test');
  assert.equal(trimText('x'.repeat(6000)).length, 5000);

  const imported = sanitizeImportedProject({
    id: 'project-x',
    name: payloads.script,
    customerName: payloads.img,
    zones: [{ id: 'zone-x', name: payloads.svg, type: payloads.script, task: payloads.img }],
    estimateItems: [{ id: 'item-x', name: payloads.iframe, category: payloads.img, unit: 'шт.', source: payloads.script }],
    acceptedWarnings: [{ id: 'w1', message: payloads.img }]
  });
  assertNoExecutableHtml(imported.name + imported.customerName + imported.zones[0].name + imported.estimateItems[0].name);

  const parsed = await parseProjectJson(JSON.stringify({ project: {
    id: 'project-1', name: payloads.script, customerName: payloads.img,
    zones: [{ id: 'zone-1', name: payloads.svg }],
    estimateItems: [{ id: 'item-1', name: payloads.iframe }]
  }}));
  assertNoExecutableHtml(parsed.project.name + parsed.project.customerName + parsed.project.zones[0].name + parsed.project.estimateItems[0].name);
  assert.equal(parsed.sanitized, true);

  const view = {
    exportGuard: { isEstimateEmpty: false, softWarnings: [payloads.img] },
    documentInfo: { title: 'КП', date: new Date().toISOString(), proposalNumber: payloads.svg, managerContact: payloads.script },
    projectInfo: { name: payloads.script },
    customerInfo: { name: payloads.img },
    validity: payloads.svg,
    solutionSummary: [payloads.script],
    options: { showZoneBreakdown: true, showQuantities: true, showUnitPrices: true, showSectionPrices: true, includeWarranty: true },
    zones: [{ name: payloads.img, categoryName: payloads.svg, area: 10, total: 100 }],
    sections: [{ title: payloads.script, total: 100, items: [{ name: payloads.img, description: payloads.svg, qty: 1, unit: 'шт.', unitSalePrice: 100, totalSale: 100 }] }],
    totals: { salePriceNet: 100, showVat: true, vatPct: 20, vatAmount: 20, salePriceGross: 120 },
    exclusions: [payloads.iframe], paymentTerms: payloads.script, warranty: payloads.img, assumptions: [payloads.svg],
    timeline: { supply: payloads.script, installation: payloads.img, commissioning: payloads.svg, total: '1 неделя' },
    footer: payloads.iframe
  };
  assertNoExecutableHtml(ProposalPreview(view));

  const html = buildStandaloneProposalHtml({ id: 'p', name: payloads.script, customerName: payloads.img, zones: [], estimateItems: [{ id: 'i', name: payloads.img, unitCost: 1, qty: 1 }] });
  assert.equal(html.includes('&lt;script&gt;'), true);
  assert.equal(/<script>alert/i.test(html), false);

  assertNoExecutableHtml(WarningList([{ id: 'w1', severity: 'warning', type: 'data', title: payloads.script, message: payloads.img, actionLabel: payloads.svg }]));
  assertNoExecutableHtml(EquipmentCard({ id: 'e1', name: payloads.img, brand: payloads.script, model: payloads.svg, categoryId: '', subcategoryId: '', category: payloads.iframe, solutionLevel: 'standard', supplier: payloads.img, unitCost: 1, currency: 'RUB', dependencies: [], alternatives: [] }, {}, []));

  assert.equal(escapeSpreadsheetCell(payloads.formula).startsWith("'="), true);
  assert.equal(escapeSpreadsheetCell(payloads.plus).startsWith("'+"), true);
  assert.equal(escapeSpreadsheetCell('-1+2').startsWith("'-"), true);
  assert.equal(escapeSpreadsheetCell(payloads.at).startsWith("'@"), true);
}
