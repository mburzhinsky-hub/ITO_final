import { escapeAttr, escapeHtml } from '../utils/format.js';
const severityLabel = { error: 'Критично', warning: 'Предупреждение', recommendation: 'Рекомендация', info: 'Инфо' };
const severityClass = { error: 'danger', warning: 'warn', recommendation: 'lime', info: '' };
const typeLabel = { data: 'Данные проекта', zones: 'Зоны', estimate: 'Смета', budget: 'Бюджет', commercial: 'Коммерческие параметры', currency: 'Валюты' };

export function WarningCard(warning) {
  return `<article class="warningCard ${severityClass[warning.severity] || ''}">
    <div class="warningMain"><span class="badge ${severityClass[warning.severity] || ''}">${escapeHtml(severityLabel[warning.severity] || warning.severity)}</span><h3>${escapeHtml(warning.title)}</h3><p>${escapeHtml(warning.message)}</p><div class="muted smallText">${typeLabel[warning.type] || 'Инженерная полнота'}${warning.entityType ? ` · ${escapeHtml(warning.entityType)}` : ''}</div></div>
    <div class="warningActions"><button class="btn primary small" data-warning-action="${escapeAttr(warning.actionType || '')}">${escapeHtml(warning.actionLabel || 'Исправить')}</button><button class="btn ghost small" data-accept-warning="${escapeAttr(warning.id)}">Принять риск</button><button class="btn ghost small" data-accept-warning="${escapeAttr(warning.id)}">Скрыть</button></div>
  </article>`;
}
