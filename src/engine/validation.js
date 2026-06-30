import { calculateTotals } from './pricing.js';
export function validateProject(project) {
  const warnings = [];
  if (!project.name?.trim()) warnings.push(w('name','error','Не заполнено название проекта'));
  if (!project.customerName?.trim()) warnings.push(w('customer','warn','Не заполнен заказчик'));
  if (!project.zones.length) warnings.push(w('zones','error','Нет ни одной зоны'));
  if (!project.estimateItems.length) warnings.push(w('estimate','error','Смета пустая'));
  project.zones.forEach(zone => {
    if (!zone.area || zone.area <= 0) warnings.push(w(`zone-area-${zone.id}`,'warn',`У зоны «${zone.name}» не указана площадь`));
    if (zone.flags?.content && !project.estimateItems.some(i => i.category.toLowerCase().includes('контент'))) warnings.push(w(`content-${zone.id}`,'warn',`Для зоны «${zone.name}» включён контент, но в смете нет контентных позиций`));
  });
  const totals = calculateTotals(project);
  if (project.passport.targetBudget > 0 && totals.gross > project.passport.targetBudget) warnings.push(w('budget','warn',`Смета выше целевого бюджета на ${Math.round(totals.gross - project.passport.targetBudget).toLocaleString('ru-RU')} ₽`));
  return warnings.filter(x => !(project.acceptedWarnings || []).includes(x.id));
}
function w(id, level, text) { return {id, level, text}; }
