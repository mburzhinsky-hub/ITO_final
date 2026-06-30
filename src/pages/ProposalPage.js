import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { PageHeader } from '../components/PageHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { ensureProject } from '../app/state.js';
import { validateProject } from '../engine/validation.js';
import { exportProject } from '../export/exportJson.js';
import { proposalHtml } from '../export/exportHtml.js';
import { exportCsv } from '../export/exportExcel.js';
import { downloadText } from '../utils/dom.js';

export function ProposalPage(root) {
  const p = ensureProject(); const warnings = validateProject(p); const errors = warnings.filter(w => w.severity === 'error');
  const blocked = !p.estimateItems.length || errors.length;
  const blocker = !p.estimateItems.length ? EmptyState({ title: 'Сначала создайте смету', text: 'КП появится после генерации или ручного заполнения сметы.', actions: '<a class="btn primary" href="#/estimate">Открыть смету</a>' }) : `<div class="notice warn"><strong>Есть критичные ошибки</strong><p>Перед экспортом проверьте проект.</p><a class="btn ghost small" href="#/check">Открыть проверку</a></div>`;
  root.innerHTML = AppLayout(`${PageHeader({ title: 'КП / экспорт', description: 'Финальный просмотр и выгрузка коммерческого предложения.', actions: blocked ? '<a class="btn primary" href="#/check">Проверить проект</a>' : '<button class="btn primary" data-print>Печать / PDF</button><button class="btn ghost" data-html>HTML</button><button class="btn ghost" data-csv>Excel CSV</button><button class="btn ghost" data-json>JSON</button>' })}
  ${blocked ? blocker : `<div class="docPreview">${proposalHtml(p)}</div>`}`);
  bindLayoutActions(root);
  root.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
  root.querySelector('[data-html]')?.addEventListener('click',()=>downloadText(`${p.name}.html`, proposalHtml(p), 'text/html'));
  root.querySelector('[data-csv]')?.addEventListener('click',()=>downloadText(`${p.name}.csv`, exportCsv(p), 'text/csv'));
  root.querySelector('[data-json]')?.addEventListener('click',()=>downloadText(`${p.name}.json`, exportProject(p)));
}
