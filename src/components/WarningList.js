const severityLabel = { error: 'Ошибка', warning: 'Предупреждение', recommendation: 'Рекомендация', info: 'Инфо' };
const severityClass = { error: 'danger', warning: 'warn', recommendation: 'lime', info: '' };
export function WarningList(warnings) {
  if (!warnings.length) return '<div class="empty">Критичных предупреждений нет. Проект можно готовить к КП.</div>';
  return `<div class="grid">${warnings.map(w => `<div class="card warningItem"><div><span class="badge ${severityClass[w.severity] || ''}">${severityLabel[w.severity] || w.severity}</span><h3 style="margin:8px 0 4px">${w.title}</h3><p class="muted" style="margin:0">${w.message}</p></div><button class="btn ghost small" data-accept-warning="${w.id}">Принять риск</button></div>`).join('')}</div>`;
}
