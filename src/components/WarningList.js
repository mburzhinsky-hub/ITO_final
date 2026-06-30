export function WarningList(warnings) {
  if (!warnings.length) return '<div class="empty">Критичных предупреждений нет. Проект можно готовить к КП.</div>';
  return `<div class="grid">${warnings.map(w => `<div class="card warningItem"><div><span class="badge ${w.level==='error'?'danger':'warn'}">${w.level==='error'?'Ошибка':'Предупреждение'}</span><p>${w.text}</p></div><button class="btn ghost small" data-accept-warning="${w.id}">Принять риск</button></div>`).join('')}</div>`;
}
