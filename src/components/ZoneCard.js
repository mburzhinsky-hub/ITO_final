export function ZoneCard(zone, idx) {
  return `<article class="card">
    <div class="pageHead" style="margin:0 0 10px"><div><h3 style="margin:0">${idx+1}. ${zone.name}</h3><div class="muted">${zone.type} · ${zone.task}</div></div><button class="btn danger small" data-zone-delete="${zone.id}">Удалить</button></div>
    <div class="grid cols4">
      <label class="field"><span>Название</span><input data-zone-field="name" data-zone-id="${zone.id}" value="${zone.name}"></label>
      <label class="field"><span>Тип</span><input data-zone-field="type" data-zone-id="${zone.id}" value="${zone.type}"></label>
      <label class="field"><span>Площадь, м²</span><input type="number" data-zone-field="area" data-zone-id="${zone.id}" value="${zone.area}"></label>
      <label class="field"><span>Задача</span><input data-zone-field="task" data-zone-id="${zone.id}" value="${zone.task}"></label>
    </div>
    <div class="actions">${['install','pnr','content','delivery','metal','service'].map(f=>`<label class="badge"><input type="checkbox" data-zone-flag="${f}" data-zone-id="${zone.id}" ${zone.flags?.[f]?'checked':''}> ${flagName(f)}</label>`).join('')}</div>
  </article>`;
}
function flagName(f){ return ({install:'Монтаж',pnr:'ПНР',content:'Контент',delivery:'Доставка',metal:'Конструкции',service:'Сервис'}[f]); }
