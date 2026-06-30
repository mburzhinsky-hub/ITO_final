const severityLabel = { error: 'Критично', warning: 'Предупреждение', recommendation: 'Рекомендация', info: 'Инфо' };
const severityClass = { error: 'danger', warning: 'warn', recommendation: 'lime', info: '' };
const typeLabel = { data: 'Данные проекта', zones: 'Зоны', estimate: 'Смета', budget: 'Бюджет', commercial: 'Коммерческие параметры', currency: 'Валюты' };

export function WarningCard(warning) {
  return `<article class="warningCard ${severityClass[warning.severity] || ''}">
    <div class="warningMain"><span class="badge ${severityClass[warning.severity] || ''}">${severityLabel[warning.severity] || warning.severity}</span><h3>${warning.title}</h3><p>${warning.message}</p><div class="muted smallText">${typeLabel[warning.type] || 'Инженерная полнота'}${warning.entityType ? ` · ${warning.entityType}` : ''}</div></div>
    <div class="warningActions"><button class="btn primary small" data-warning-action="${warning.actionType || ''}">${warning.actionLabel || 'Исправить'}</button><button class="btn ghost small" data-accept-warning="${warning.id}">Принять риск</button><button class="btn ghost small" data-accept-warning="${warning.id}">Скрыть</button></div>
  </article>`;
}
