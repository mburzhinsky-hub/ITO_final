import { EQUIPMENT_CATEGORIES, childCategories, QUICK_EQUIPMENT_FILTERS } from '../data/equipmentCategories.js';
import { ZONE_CATEGORIES } from '../data/zoneTaxonomy.js';

export function LibraryFilters({ search = '', category = 'all', subcategory = 'all', level = 'all', currency = 'all', price = 'all', projectType = 'all', zoneCategory = 'all', review = 'all', zones = [] } = {}) {
  const subcategories = category === 'all' ? [] : childCategories(category);
  return `<div class="card libraryFilters">
    <div class="quickFilters"><a class="btn ${category === 'all' ? 'primary' : 'ghost'} small" href="#/library">Все</a>${QUICK_EQUIPMENT_FILTERS.map(f => `<a class="btn ${category === f.id ? 'primary' : 'ghost'} small" href="#/library?category=${f.id}">${f.label}</a>`).join('')}</div>
    <div class="grid cols4">
      <label class="field"><span>Поиск</span><input data-lib-search value="${search}" placeholder="название, бренд, модель, тег, поставщик"></label>
      <label class="field"><span>Категория</span><select data-lib-category><option value="all">Все категории</option>${EQUIPMENT_CATEGORIES.map(c => `<option value="${c.id}" ${c.id === category ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      <label class="field"><span>Подкатегория</span><select data-lib-subcategory><option value="all">Все подкатегории</option>${subcategories.map(c => `<option value="${c.id}" ${c.id === subcategory ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      <label class="field"><span>Уровень</span><select data-lib-level>${['all','budget','standard','premium','expert','custom'].map(v => `<option value="${v}" ${v === level ? 'selected' : ''}>${v === 'all' ? 'Все уровни' : v}</option>`).join('')}</select></label>
      <label class="field"><span>Валюта</span><select data-lib-currency>${['all','RUB','USD','EUR','CNY'].map(v => `<option value="${v}" ${v === currency ? 'selected' : ''}>${v === 'all' ? 'Все валюты' : v}</option>`).join('')}</select></label>
      <label class="field"><span>Тип проекта</span><select data-lib-project-type><option value="all">Все типы</option>${['corporate','museum','conference','retail','education','control','hospitality','sport','event','public','vr'].map(v => `<option value="${v}" ${v === projectType ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field"><span>Категория зоны</span><select data-lib-zone-category><option value="all">Все зоны</option>${ZONE_CATEGORIES.map(z => `<option value="${z.id}" ${z.id === zoneCategory ? 'selected' : ''}>${z.name}</option>`).join('')}</select></label>
      <label class="field"><span>Статус цены</span><select data-lib-price>${['all','actual','estimated','unknown'].map(v => `<option value="${v}" ${v === price ? 'selected' : ''}>${v === 'all' ? 'Любой' : v}</option>`).join('')}</select></label>
      <label class="field"><span>Проверка</span><select data-lib-review><option value="all" ${review === 'all' ? 'selected' : ''}>Любой статус</option><option value="yes" ${review === 'yes' ? 'selected' : ''}>Требует проверки</option><option value="no" ${review === 'no' ? 'selected' : ''}>Без проверки</option></select></label>
      <label class="field"><span>Зона для добавления</span><select data-target-zone><option value="">Без зоны</option>${zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('')}</select></label>
    </div>
  </div>`;
}
