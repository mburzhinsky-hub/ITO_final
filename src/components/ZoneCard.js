export function ZoneCard(zone, idx) {
  const activeFlags = Object.entries(zone.flags || {}).filter(([,value]) => value).map(([key]) => flagName(key));
  const status = zone.type && zone.area > 0 ? 'Готова к расчёту' : 'Нужно заполнить';
  return `<article class="zoneCard card">
    <div class="zoneCardHead"><div><span class="badge">Зона ${idx+1}</span><h3>${zone.name}</h3><p>${zone.type || 'тип не выбран'} · ${zone.task || 'задача не указана'}</p></div><span class="badge ${status === 'Готова к расчёту' ? 'ok' : 'warn'}">${status}</span></div>
    <div class="zoneFields grid cols4">
      <label class="field"><span>Название</span><input data-zone-field="name" data-zone-id="${zone.id}" value="${zone.name}"></label>
      <label class="field"><span>Тип зоны</span><input data-zone-field="type" data-zone-id="${zone.id}" value="${zone.type}"></label>
      <label class="field"><span>Площадь, м²</span><input type="number" data-zone-field="area" data-zone-id="${zone.id}" value="${zone.area}"></label>
      <label class="field"><span>Основная задача</span><input data-zone-field="task" data-zone-id="${zone.id}" value="${zone.task}"></label>
    </div>
    <div class="zoneMeta"><span class="muted">Сервисы:</span>${activeFlags.length ? activeFlags.map(name => `<span class="badge">${name}</span>`).join('') : '<span class="badge warn">не выбраны</span>'}</div>
    <details class="compactDetails"><summary>Сервисы зоны</summary><div class="actions">${['install','pnr','content','delivery','metal','service'].map(f=>`<label class="badge"><input type="checkbox" data-zone-flag="${f}" data-zone-id="${zone.id}" ${zone.flags?.[f]?'checked':''}> ${flagName(f)}</label>`).join('')}</div></details>
    <div class="cardActions"><button class="btn ghost small" data-zone-duplicate="${zone.id}">Дублировать</button><button class="btn ghost small" data-zone-estimate="${zone.id}">Сгенерировать по зоне</button><button class="btn danger small" data-zone-delete="${zone.id}">Удалить</button></div>
  </article>`;
}
function flagName(f){ return ({install:'Монтаж',pnr:'ПНР',content:'Контент / ПО',delivery:'Логистика',metal:'Конструкции',service:'Сервис'}[f] || f); }
