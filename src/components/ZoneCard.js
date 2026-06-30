export function ZoneCard(zone, idx) {
  const activeFlags = Object.entries(zone.flags || {}).filter(([,value]) => value).map(([key]) => flagName(key));
  const status = zone.type && zone.area > 0 ? 'Готова к расчёту' : 'Нужно заполнить';
  const systemGroups = zone.requiredSystemGroups || [];
  const deps = zone.requiredDependencies || [];
  return `<article class="zoneCard card ${zone.nonTypicalForProject ? 'nonTypicalZone' : ''}">
    <div class="zoneCardHead"><div><span class="badge">Зона ${idx+1}</span>${zone.categoryName ? `<span class="badge lime">${zone.categoryName}</span>` : ''}${zone.nonTypicalForProject ? '<span class="badge warn">нетиповая</span>' : ''}<h3>${zone.name}</h3><p>${zone.type || 'тип не выбран'} · ${zone.task || 'задача не указана'}</p></div><span class="badge ${status === 'Готова к расчёту' ? 'ok' : 'warn'}">${status}</span></div>
    ${zone.recommendationReason ? `<div class="notice ${zone.nonTypicalForProject ? 'warn' : 'ok'}"><strong>${zone.nonTypicalForProject ? 'Нетиповая зона' : 'Почему рекомендована'}</strong><p>${zone.recommendationReason}</p></div>` : ''}
    <div class="zoneFields grid cols4">
      <label class="field"><span>Название</span><input data-zone-field="name" data-zone-id="${zone.id}" value="${zone.name}"></label>
      <label class="field"><span>Тип зоны</span><input data-zone-field="type" data-zone-id="${zone.id}" value="${zone.type}"></label>
      <label class="field"><span>Площадь, м²</span><input type="number" data-zone-field="area" data-zone-id="${zone.id}" value="${zone.area}"></label>
      <label class="field"><span>Основная задача</span><input data-zone-field="task" data-zone-id="${zone.id}" value="${zone.task}"></label>
    </div>
    <div class="zoneMeta"><span class="muted">Сервисы:</span>${activeFlags.length ? activeFlags.map(name => `<span class="badge">${name}</span>`).join('') : '<span class="badge warn">не выбраны</span>'}${systemGroups.length ? `<span class="badge">${systemGroups.length} AV-групп</span>` : ''}${deps.length ? `<span class="badge warn">${deps.length} зависимостей</span>` : ''}</div>
    ${zone.requiresEngineerReview ? '<div class="notice warn"><strong>Нужна инженерная проверка</strong><p>Проверьте трассы, питание, конструкции, акустику / изображение и сценарии управления.</p></div>' : ''}
    <details class="compactDetails"><summary>Оборудование, зависимости и сервисы</summary>
      ${systemGroups.length ? `<div class="zoneMeta"><span class="muted">AV-группы:</span>${systemGroups.map(name => `<span class="badge">${name}</span>`).join('')}</div>` : ''}
      ${deps.length ? `<div class="zoneMeta"><span class="muted">Зависимости:</span>${deps.map(name => `<span class="badge warn">${name}</span>`).join('')}</div>` : ''}
      <div class="actions">${['install','pnr','content','delivery','metal','service'].map(f=>`<label class="badge"><input type="checkbox" data-zone-flag="${f}" data-zone-id="${zone.id}" ${zone.flags?.[f]?'checked':''}> ${flagName(f)}</label>`).join('')}</div>
    </details>
    <div class="cardActions"><button class="btn ghost small" data-zone-duplicate="${zone.id}">Дублировать</button><button class="btn ghost small" data-zone-estimate="${zone.id}">Сгенерировать по зоне</button><button class="btn danger small" data-zone-delete="${zone.id}">Удалить</button></div>
  </article>`;
}
function flagName(f){ return ({install:'Монтаж',pnr:'ПНР',content:'Контент / ПО',delivery:'Логистика',metal:'Конструкции',service:'Сервис'}[f] || f); }
