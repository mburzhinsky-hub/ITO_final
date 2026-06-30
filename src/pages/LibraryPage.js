import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { ensureProject, persistProject, getSettings } from '../app/state.js';
import { LIBRARY, addCatalogItemToProject, buildLibrary } from '../engine/estimate.js';
import { createEstimateItem, createZone } from '../engine/projectFactory.js';
import { toast } from '../utils/dom.js';
import { LibraryFilters } from '../components/LibraryFilters.js';
import { EquipmentCard } from '../components/EquipmentCard.js';
import { InstallationTemplateList } from '../components/InstallationTemplateList.js';
import { INSTALLATION_TEMPLATES } from '../data/installationTemplates.js';
import { catalogQualitySummary } from '../engine/catalogValidation.js';
import { resolveMissingDependencies, createDependencyFallbackItem } from '../engine/dependencyResolver.js';
import { getItemAlternatives, replacementImpact } from '../engine/alternativeResolver.js';

let fullLibrary = null;
let fullLibraryPromise = null;

async function loadFullLibrary() {
  if (fullLibrary) return fullLibrary;
  if (!fullLibraryPromise) {
    fullLibraryPromise = import('../data/supplierPriceCatalog.js').then(({ SUPPLIER_PRICE_CATALOG }) => {
      fullLibrary = buildLibrary([...SUPPLIER_PRICE_CATALOG, ...LIBRARY]);
      return fullLibrary;
    });
  }
  return fullLibraryPromise;
}

export function LibraryPage(root) {
  const p = ensureProject();
  const settings = getSettings();
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const state = readState(q);
  const tab = q.get('tab') || 'equipment';
  const includeSuppliers = q.get('suppliers') === '1';
  if (includeSuppliers && !fullLibrary) {
    root.innerHTML = AppLayout(`${PageHeader({ title: 'Библиотека', description: 'Загружаем полный каталог поставщиков. Обычные страницы калькулятора больше не ждут этот тяжёлый файл.', actions: '<a class="btn ghost" href="#/library">Открыть быстрый каталог</a>' })}<section class="card"><h3>Загрузка прайс-листов</h3><p class="muted">Полный каталог вынесен в ленивую загрузку, чтобы остальные страницы открывались быстро.</p></section>`);
    bindLayoutActions(root);
    loadFullLibrary().then(() => LibraryPage(root)).catch(error => { console.error(error); toast('Не удалось загрузить полный каталог поставщиков'); location.hash = '#/library'; });
    return;
  }
  const library = includeSuppliers ? fullLibrary : LIBRARY;
  const quality = catalogQualitySummary(library);
  const items = filterLibrary(library, state).slice(0, 72);
  const templates = filterTemplates(INSTALLATION_TEMPLATES, state).slice(0, 30);
  const deps = resolveMissingDependencies(p).slice(0, 12);
  const supplierAction = includeSuppliers ? '<a class="btn ghost small" href="#/library">Быстрый каталог</a>' : '<a class="btn ghost small" href="#/library?suppliers=1">Загрузить прайс-листы</a>';
  root.innerHTML = AppLayout(`${PageHeader({ title: 'Библиотека', description: 'Экспертная библиотека оборудования, зависимостей, альтернатив и шаблонов инсталляций. Полный каталог поставщиков загружается только по запросу.', actions: `<span class="badge lime">${library.length} позиций</span><span class="badge ${quality.errors ? 'warn' : 'ok'}">качество: ${quality.totalIssues}</span>${supplierAction}` })}
    <div class="libraryTabs"><a class="btn ${tab === 'equipment' ? 'primary' : 'ghost'} small" href="#/library?tab=equipment">Оборудование</a><a class="btn ${tab === 'templates' ? 'primary' : 'ghost'} small" href="#/library?tab=templates">Шаблоны инсталляций</a><a class="btn ${tab === 'quality' ? 'primary' : 'ghost'} small" href="#/library?tab=quality">Качество данных</a></div>
    ${tab === 'equipment' ? equipmentTab(p, settings, state, items, deps, library) : ''}
    ${tab === 'templates' ? templatesTab(state, templates) : ''}
    ${tab === 'quality' ? qualityTab(quality, deps) : ''}`);
  bindLayoutActions(root); bind(root, p, state, library);
}

function readState(q) {
  return {
    search: q.get('q') || '',
    category: q.get('category') || 'all',
    subcategory: q.get('subcategory') || 'all',
    level: q.get('level') || 'all',
    currency: q.get('currency') || 'all',
    price: q.get('price') || 'all',
    projectType: q.get('projectType') || 'all',
    zoneCategory: q.get('zoneCategory') || 'all',
    review: q.get('review') || 'all'
  };
}

function equipmentTab(project, settings, state, items, deps, library) {
  return `${LibraryFilters({ ...state, zones: project.zones || [] })}
    ${deps.length ? `<div class="notice warn"><strong>В проекте есть незакрытые зависимости: ${deps.length}</strong><p>Откройте проверку или добавьте fallback-позиции вручную. Библиотека показывает зависимости, но не добавляет их принудительно без действия пользователя.</p><div class="actions">${deps.slice(0, 4).map(dep => `<button class="btn ghost small" data-add-dependency-fallback="${dep.id}">${dep.fallbackName}</button>`).join('')}<a class="btn ghost small" href="#/check">Проверка</a></div></div>` : ''}
    <div class="separator"></div>${items.length ? `<div class="libraryGrid">${items.map(item => EquipmentCard(item, settings, library)).join('')}</div>` : EmptyState({ title: 'Ничего не найдено', text: 'Сбросьте фильтры или добавьте ручную позицию.', actions: '<button class="btn ghost" data-reset-library>Сбросить фильтры</button><button class="btn primary" data-add-manual-lib>Добавить ручную позицию</button>' })}`;
}

function templatesTab(state, templates) {
  return `${LibraryFilters({ ...state, zones: [] })}<div class="separator"></div>${InstallationTemplateList(templates)}`;
}

function qualityTab(quality, deps) {
  return `<div class="grid cols3"><div class="card"><div class="muted">Всего позиций</div><div class="valueBig">${quality.totalItems}</div></div><div class="card"><div class="muted">Ошибки</div><div class="valueBig">${quality.errors}</div></div><div class="card"><div class="muted">Предупреждения</div><div class="valueBig">${quality.warnings}</div></div></div>
  <div class="separator"></div><div class="grid cols2"><section class="card"><h3>Проверка каталога</h3><div class="miniList">${quality.sample.length ? quality.sample.map(issue => `<div class="miniListItem"><span class="badge ${issue.severity === 'error' ? 'danger' : 'warn'}">${issue.issueType}</span><strong>${issue.itemId}</strong><small>${issue.message} ${issue.suggestedAction}</small></div>`).join('') : '<div class="muted">Критичных проблем в нормализованной библиотеке не найдено.</div>'}</div></section><section class="card"><h3>Зависимости проекта</h3><div class="miniList">${deps.length ? deps.map(dep => `<div class="miniListItem"><span class="badge ${dep.required ? 'warn' : ''}">${dep.dependencyType}</span><strong>${dep.sourceItemName} → ${dep.fallbackName}</strong><small>${dep.reason}</small></div>`).join('') : '<div class="muted">Незакрытых зависимостей в текущей смете нет.</div>'}</div></section></div>`;
}

function filterLibrary(library, state) {
  const search = state.search.toLowerCase();
  return library.filter(item => {
    const haystack = `${item.name} ${item.brand} ${item.model} ${item.category} ${item.supplier || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (state.category !== 'all' && item.categoryId !== state.category) return false;
    if (state.subcategory !== 'all' && item.subcategoryId !== state.subcategory) return false;
    if (state.level !== 'all' && item.solutionLevel !== state.level) return false;
    if (state.currency !== 'all' && item.currency !== state.currency) return false;
    if (state.price !== 'all' && item.priceStatus !== state.price) return false;
    if (state.projectType !== 'all' && (item.projectTypeIds || item.types || []).length && !(item.projectTypeIds || item.types || []).includes(state.projectType)) return false;
    if (state.zoneCategory !== 'all' && (item.zoneCategoryIds || []).length && !item.zoneCategoryIds.includes(state.zoneCategory)) return false;
    if (state.review === 'yes' && !item.requiresEngineerReview) return false;
    if (state.review === 'no' && item.requiresEngineerReview) return false;
    return true;
  });
}

function filterTemplates(templates, state) {
  const search = state.search.toLowerCase();
  return templates.filter(t => {
    const haystack = `${t.name} ${t.group} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase();
    if (search && !haystack.includes(search)) return false;
    if (state.level !== 'all' && t.scenario !== state.level) return false;
    if (state.projectType !== 'all' && !t.projectTypeIds.includes(state.projectType)) return false;
    if (state.zoneCategory !== 'all' && !t.zoneCategoryIds.includes(state.zoneCategory)) return false;
    return true;
  });
}


function ensureTemplateZone(project, template) {
  const existing = (project.zones || []).find(zone => template.zoneTemplateIds.includes(zone.templateId) || template.zoneCategoryIds.includes(zone.categoryId));
  if (existing) return existing;
  const zone = createZone({
    name: template.name,
    categoryId: template.zoneCategoryIds[0] || '',
    templateId: template.zoneTemplateIds[0] || '',
    type: 'template',
    area: 25,
    requiredSystemGroups: template.items.map(item => item.categoryId),
    requiredDependencies: template.dependencies || [],
    typicalWorks: template.typicalWorks || [],
    requiresEngineerReview: template.requiresEngineerReview,
    notes: `Создано из шаблона инсталляции: ${template.name}`
  });
  project.zones ||= [];
  project.zones.push(zone);
  return zone;
}

function bind(root, p, state, library) {
  const updateHash = () => {
    const params = new URLSearchParams();
    const current = new URLSearchParams(location.hash.split('?')[1] || '');
    params.set('tab', current.get('tab') || 'equipment');
    if (current.get('suppliers') === '1') params.set('suppliers', '1');
    const fields = [
      ['q', '[data-lib-search]'], ['category', '[data-lib-category]'], ['subcategory', '[data-lib-subcategory]'], ['level', '[data-lib-level]'],
      ['currency', '[data-lib-currency]'], ['price', '[data-lib-price]'], ['projectType', '[data-lib-project-type]'], ['zoneCategory', '[data-lib-zone-category]'], ['review', '[data-lib-review]']
    ];
    fields.forEach(([key, selector]) => { const value = root.querySelector(selector)?.value || 'all'; if (value && !(key !== 'q' && value === 'all')) params.set(key, value); });
    location.hash = `#/library?${params.toString()}`;
  };
  ['change'].forEach(eventName => root.querySelectorAll('[data-lib-search],[data-lib-category],[data-lib-subcategory],[data-lib-level],[data-lib-currency],[data-lib-price],[data-lib-project-type],[data-lib-zone-category],[data-lib-review]').forEach(el => el.addEventListener(eventName, updateHash)));
  root.querySelector('[data-reset-library]')?.addEventListener('click', () => { location.hash = '#/library'; });
  root.querySelector('[data-add-manual-lib]')?.addEventListener('click', () => { p.estimateItems.push(createEstimateItem({ name: 'Ручная позиция', category: 'Оборудование', currency: 'RUB', source: 'manual', isManual: true, note: 'добавлено из пустого состояния библиотеки' })); persistProject(); toast('Ручная позиция добавлена'); location.hash = '#/estimate?mode=detailed'; });
  root.querySelectorAll('[data-add-library]').forEach(btn => btn.addEventListener('click', () => { const item = library.find(i => i.id === btn.dataset.addLibrary); addCatalogItemToProject(p, item, root.querySelector('[data-target-zone]')?.value || ''); persistProject(); toast('Позиция добавлена в смету'); }));
  root.querySelectorAll('[data-mark-review]').forEach(btn => btn.addEventListener('click', () => { const item = library.find(i => i.id === btn.dataset.markReview); if (item) item.requiresEngineerReview = true; toast('Позиция отмечена в текущей сессии'); LibraryPage(root); }));
  root.querySelectorAll('[data-add-dependency-fallback]').forEach(btn => btn.addEventListener('click', () => { const dep = resolveMissingDependencies(p).find(item => item.id === btn.dataset.addDependencyFallback); if (!dep) return; p.estimateItems.push(createEstimateItem(createDependencyFallbackItem(dep, dep.zoneId))); persistProject(); toast('Fallback-зависимость добавлена в смету'); LibraryPage(root); }));

  root.querySelectorAll('[data-apply-template]').forEach(btn => btn.addEventListener('click', () => {
    const template = INSTALLATION_TEMPLATES.find(t => t.id === btn.dataset.applyTemplate);
    if (!template) return;
    const zone = ensureTemplateZone(p, template);
    let added = 0;
    template.items.forEach(templateItem => {
      const candidate = library.find(item => item.subcategoryId === templateItem.categoryId || item.categoryId === templateItem.categoryId || (item.systemGroups || []).includes(templateItem.categoryId));
      if (candidate) {
        addCatalogItemToProject(p, candidate, zone.id, { source: 'installation-template', qty: templateItem.qty || 1, derivedKey: `${zone.id}:${template.id}:${candidate.id}` });
      } else {
        p.estimateItems.push(createEstimateItem({ zoneId: zone.id, name: templateItem.fallbackName, category: templateItem.fallbackName, categoryId: templateItem.categoryId, subcategoryId: templateItem.categoryId, unit: 'компл.', qty: templateItem.qty || 1, currency: 'RUB', unitCost: 0, source: 'template-fallback', isManual: false, isDerived: true, derivedKey: `${zone.id}:${template.id}:${templateItem.id}`, priceStatus: 'unknown', requiresPriceRequest: true, requiresEngineerReview: true, note: 'Fallback-позиция: исходная позиция шаблона не найдена в библиотеке.' }));
      }
      added += 1;
    });
    persistProject(); toast(`Шаблон добавлен: ${added} строк`); location.hash = '#/estimate?mode=detailed';
  }));
  root.querySelectorAll('[data-replace-library]').forEach(btn => btn.addEventListener('click', () => {
    const source = library.find(i => i.id === btn.dataset.replaceLibrary); const replacement = library.find(i => i.id === btn.dataset.replaceTo); if (!source || !replacement) return;
    const impact = replacementImpact(source, replacement);
    const targetRows = p.estimateItems.filter(row => row.catalogItemId === source.id || row.sourceCatalogItemId === source.id || row.name === source.name);
    if (!targetRows.length) { toast('Сначала добавьте исходную позицию в смету'); return; }
    targetRows.forEach(row => { row.replacedFrom ||= []; row.replacedFrom.push({ name: row.name, catalogItemId: row.catalogItemId, at: new Date().toISOString(), priceDelta: impact.priceDelta }); row.name = replacement.name; row.category = replacement.category; row.categoryId = replacement.categoryId; row.subcategoryId = replacement.subcategoryId; row.catalogItemId = replacement.id; row.sourceCatalogItemId = replacement.id; row.unitCost = replacement.unitCost; row.currency = replacement.currency; row.solutionLevel = replacement.solutionLevel; row.note = [row.note, `Заменено из библиотеки. Δ цены: ${Math.round(impact.priceDelta).toLocaleString('ru-RU')}.`].filter(Boolean).join(' '); });
    persistProject(); toast('Позиция заменена в смете'); LibraryPage(root);
  }));
}
