import { WarningCard } from './WarningCard.js';
import { EmptyState } from './EmptyState.js';

const groupLabels = {
  data: 'Данные проекта',
  zones: 'Зоны',
  estimate: 'Смета',
  budget: 'Бюджет',
  commercial: 'Коммерческие параметры',
  currency: 'Валюты',
  engineering: 'Инженерная полнота'
};

export function WarningList(warnings) {
  if (!warnings.length) return EmptyState({ title: 'Проект готов к КП', text: 'Критичных ошибок и предупреждений нет.', actions: '<a class="btn primary" href="#/proposal">Перейти к КП</a>' });
  const groups = warnings.reduce((acc, warning) => { const key = warning.type || 'engineering'; (acc[key] ||= []).push(warning); return acc; }, {});
  return `<div class="warningGroups">${Object.entries(groups).map(([key, items]) => `<section class="warningGroup"><div class="groupHeader"><h3>${groupLabels[key] || key}</h3><span class="badge">${items.length}</span></div><div class="grid">${items.map(WarningCard).join('')}</div></section>`).join('')}</div>`;
}
