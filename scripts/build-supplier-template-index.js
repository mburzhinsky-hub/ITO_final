import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifySupplierItem } from '../src/engine/catalogRelevance.js';
import { scoreRoleFit, templateRoleForCategory, TEMPLATE_CATEGORY_TO_ROLE, AV_ROLE_SCORING_RULES, normalizeRoleText, itemRoleText } from '../src/engine/roleScoring.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SUPPLIER_DIR = path.join(ROOT, 'public', 'data', 'suppliers');
const OUT = path.join(ROOT, 'src', 'data', 'supplierTemplateIndex.js');
const MAX_PER_CATEGORY = 18;
const ALLOWED_RELEVANCE = new Set(['av_core', 'av_infrastructure', 'service', 'it_related', 'questionable']);
const IT_ROLES = new Set(['media-player', 'digital-signage', 'vr-ar', 'interactive-display']);
const RULE_BY_ID = Object.fromEntries(AV_ROLE_SCORING_RULES.map(rule => [rule.id, rule]));
const SUPPLIER_ID = {
  'АНЛАН': 'anlan', 'Арис': 'aris', 'АтенПРО': 'atenpro', 'Аувикс': 'auviks', 'Делайт 2000': 'delight2000',
  'ИМЛАЙТ': 'imlayt', 'Регард': 'regard', 'СНК-С': 'snk-s', 'Треолан': 'treolan', 'Хайтек медиа': 'haytek-media',
  'AT GROUP': 'at-group', 'Audio Project': 'audioProject', 'CTC': 'ctc', 'CVG': 'cvg', 'Digis': 'digis', 'IMS': 'ims',
  'IPVS': 'ipvs', 'OCS': 'ocs', 'Profdisplay': 'profdisplay', 'Tefra': 'tefra'
};

function readSupplierFiles() {
  return fs.readdirSync(SUPPLIER_DIR)
    .filter(name => name.endsWith('.json') && name !== 'suppliers-meta.json')
    .sort()
    .flatMap(file => {
      const fullPath = path.join(SUPPLIER_DIR, file);
      const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const items = Array.isArray(raw) ? raw : raw.items || raw.products || [];
      return items.map(item => ({ ...item, supplierFile: file }));
    });
}

function hasUsablePrice(item = {}) {
  const price = Number(item.unitCost ?? item.price ?? item.priceRub ?? item.price_rub ?? 0);
  return Number.isFinite(price) && price > 0;
}

function relevanceAllowed(item = {}, roleId = '') {
  const relevance = item.relevance || item.catalogRelevance || item.catalogScope || '';
  if (!ALLOWED_RELEVANCE.has(relevance)) return false;
  if (relevance === 'hidden' || item.hiddenByDefault) return false;
  if (relevance === 'it_related') return IT_ROLES.has(roleId) || Boolean(item.approvedForAutoEstimate);
  if (relevance === 'questionable') return true;
  return true;
}

function supplierPriority(item = {}) { return Number(item.supplierPriority || item.priorityScore || 0); }
function price(item = {}) { return Number(item.unitCost ?? item.price ?? item.priceRub ?? item.price_rub ?? 0) || 0; }
function key(item = {}) { return [item.supplier || item.supplierName, item.brand, item.model, item.article || item.supplierSku, item.name].filter(Boolean).join('|').toLowerCase(); }

function compactItem(item, category, roleFit) {
  const supplier = item.supplierName || item.supplier || '';
  const unitCost = price(item);
  const relevance = item.relevance || item.catalogRelevance || item.catalogScope || '';
  const needsEngineerReview = Boolean(item.requiresCatalogReview || item.requiresEngineerReview || roleFit.needsEngineerReview || relevance === 'questionable');
  return {
    id: item.id,
    name: item.name,
    brand: item.brand || '',
    model: item.model || '',
    category,
    supplierCategory: item.supplierCategory || item.sourceCategory || item.category || '',
    unit: item.unit || 'шт.',
    unitCost,
    price: unitCost,
    currency: item.currency || 'RUB',
    priceMode: item.priceMode || (String(item.currency || 'RUB').toUpperCase() === 'USD' ? 'indexed' : 'fixed'),
    priceStatus: item.priceStatus || 'actual',
    priceSource: item.priceSource || supplier,
    priceDate: item.priceDate || '',
    supplier,
    supplierName: supplier,
    supplierId: item.supplierId || SUPPLIER_ID[supplier] || '',
    supplierSku: item.supplierSku || item.article || item.sku || '',
    article: item.article || item.supplierSku || '',
    catalogRelevance: relevance,
    relevance,
    relevanceScore: item.relevanceScore,
    relevanceReason: item.relevanceReason || '',
    qualityVisibility: item.qualityVisibility || (item.hiddenByDefault ? 'hiddenByDefault' : 'default'),
    hiddenByDefault: Boolean(item.hiddenByDefault),
    requiresCatalogReview: Boolean(item.requiresCatalogReview),
    approvedForAutoEstimate: Boolean(item.approvedForAutoEstimate || roleFit.passed),
    sourceType: 'supplier',
    templateRole: roleFit.roleLabel,
    templateRoleId: roleFit.roleId,
    replacementGroup: category,
    systemGroups: [category, roleFit.roleId],
    roleFitScore: roleFit.score,
    roleFitMinScore: roleFit.minScore,
    roleFitReason: roleFit.reason,
    needsEngineerReview,
    requiresEngineerReview: needsEngineerReview,
    isPreferredForTemplates: true,
    priorityScore: Math.round(roleFit.score * 100 + supplierPriority(item) * 10 + Math.min(99, Number(item.relevanceScore || 0))),
    note: item.note || item.description || `Supplier-first позиция из прайса ${supplier}.`
  };
}

function quickRoleCandidate(item, roleId, category) {
  const rule = RULE_BY_ID[roleId];
  if (!rule) return false;
  const text = item.__roleText || itemRoleText(item);
  const categoryText = normalizeRoleText([item.category, item.supplierCategory, item.sourceCategory, item.replacementGroup].filter(Boolean).join(' '));
  if (normalizeRoleText(item.category) === normalizeRoleText(category)) return true;
  if (rule.categories.some(value => categoryText.includes(normalizeRoleText(value)))) return true;
  if (rule.positives.some(value => text.includes(normalizeRoleText(value)))) return true;
  if (rule.contextual.some(group => group.every(value => text.includes(normalizeRoleText(value))))) return true;
  return false;
}

function buildIndex(rawItems) {
  const items = rawItems.filter(item => item?.name && hasUsablePrice(item)).map(item => { const classified = classifySupplierItem(item); return { ...classified, __roleText: itemRoleText(classified) }; });
  const result = {};
  Object.entries(TEMPLATE_CATEGORY_TO_ROLE).forEach(([category, roleId]) => {
    if (['Монтаж', 'ПНР', 'Работы', 'Монтажные работы', 'Digital Signage'].includes(category)) return;
    const seen = new Set();
    const candidates = [];
    for (const classified of items) {
      if (!relevanceAllowed(classified, roleId)) continue;
      if (!quickRoleCandidate(classified, roleId, category)) continue;
      const roleFit = scoreRoleFit(classified, roleId, { category });
      if (!roleFit.passed) continue;
      const dedupeKey = key(classified);
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      candidates.push(compactItem(classified, category, roleFit));
    }
    result[category] = candidates
      .sort((a, b) => Number(b.roleFitScore || 0) - Number(a.roleFitScore || 0)
        || Number(b.priorityScore || 0) - Number(a.priorityScore || 0)
        || Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0)
        || supplierPriority(b) - supplierPriority(a)
        || (price(a) ? 0 : 1) - (price(b) ? 0 : 1)
        || price(a) - price(b)
        || String(a.name || '').localeCompare(String(b.name || ''), 'ru'))
      .slice(0, MAX_PER_CATEGORY);
  });
  return result;
}

const items = readSupplierFiles();
const index = buildIndex(items);
const header = `// Auto-generated compact supplier-first index for template estimates.\n// Built by scripts/build-supplier-template-index.js with deterministic AV roleFitScore rules.\n// Contains only compact real positions from public/data/suppliers/*.json; full supplier catalogs remain lazy-loaded.\n`;
fs.writeFileSync(OUT, `${header}export const SUPPLIER_TEMPLATE_INDEX = ${JSON.stringify(index, null, 2)};\n`, 'utf8');
const summary = Object.fromEntries(Object.entries(index).map(([category, rows]) => [category, rows.length]));
console.log(`Supplier template index built from ${items.length} supplier rows.`);
console.log(summary);
