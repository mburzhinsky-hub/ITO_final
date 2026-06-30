import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { WarningList } from '../components/WarningList.js';
import { ensureProject, persistProject } from '../app/state.js';
import { validateProject } from '../engine/validation.js';
import { toast } from '../utils/dom.js';

export function CheckPage(root) {
  const p = ensureProject(); const warnings = validateProject(p);
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Проверка</h2><p>Валидация отделена в /src/engine/validation.js. Предупреждения можно принять как риск.</p></div><button class="btn ghost" data-save>Сохранить</button></div>${WarningList(warnings)}`);
  bindLayoutActions(root);
  root.querySelector('[data-save]')?.addEventListener('click',()=>{persistProject(); toast('Проверка сохранена');});
  root.querySelectorAll('[data-accept-warning]').forEach(btn=>btn.addEventListener('click',()=>{p.acceptedWarnings.push(btn.dataset.acceptWarning); persistProject(); CheckPage(root);}));
}
