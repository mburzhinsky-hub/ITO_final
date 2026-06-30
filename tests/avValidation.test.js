import { assert } from './test-utils.js';
import { validateAvSystem } from '../src/engine/avValidation.js';
import { createEstimateItem, createProject, createZone } from '../src/engine/projectFactory.js';

function p(name, category = name) { return createProject({ zones: [], estimateItems: [createEstimateItem({ name, category, note: 'fixture' })] }); }

export function run() {
  assert(validateAvSystem(p('LCD панель', 'LCD-панели')).some(w => w.title.includes('Дисплей')), 'display without mount');
  assert(validateAvSystem(p('Проектор лазерный', 'Проекторы')).some(w => w.title.includes('Проектор')), 'projector without screen');
  assert(validateAvSystem(p('LED экран', 'LED-экраны')).some(w => w.title.includes('LED без процессора')), 'LED without processor');
  assert(validateAvSystem(p('LED экран', 'LED-экраны')).some(w => w.title.includes('LED без питания')), 'LED without power');
  assert(validateAvSystem(p('ВКС комплект', 'ВКС-системы')).some(w => w.title.includes('ВКС')), 'VCS without audio');
  assert(validateAvSystem(p('Акустика настенная', 'Акустика')).some(w => w.title.includes('Акустика')), 'speaker without amplifier');
  assert(validateAvSystem(p('AV стойка', 'AV-стойки')).some(w => w.title.includes('Стойка')), 'rack without PDU');
  const complex = createProject({ zones: [createZone({ id: 'z', area: 120, type: 'hall', name: 'Зал' })], estimateItems: [createEstimateItem({ zoneId: 'z', name: 'LCD панель', note: 'fixture' })] });
  assert(validateAvSystem(complex).some(w => w.title.includes('Сложная зона')), 'complex zone without PNR');
}
