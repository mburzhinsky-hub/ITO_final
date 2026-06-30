import { assert } from './test-utils.js';
import { ZONE_CATEGORIES } from '../src/data/zoneCategories.js';
import { ZONE_TEMPLATES } from '../src/data/zoneTemplates.js';
import { LIBRARY } from '../src/engine/estimate.js';

export function run() {
  const categoryIds = new Set(ZONE_CATEGORIES.map(c => c.id));
  assert(categoryIds.size === ZONE_CATEGORIES.length, 'zone category ids are unique');
  const templateIds = new Set(ZONE_TEMPLATES.map(t => t.id));
  assert(templateIds.size === ZONE_TEMPLATES.length, 'zone template ids are unique');
  assert(ZONE_TEMPLATES.every(t => categoryIds.has(t.categoryId)), 'templates reference existing categories');
  const itemIds = new Set(LIBRARY.map(i => i.id));
  assert(itemIds.size === LIBRARY.length, 'library ids are unique after dedupe');
}
