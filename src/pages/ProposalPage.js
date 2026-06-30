import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { ensureProject } from '../app/state.js';
import { exportProject } from '../export/exportJson.js';
import { proposalHtml } from '../export/exportHtml.js';
import { exportCsv } from '../export/exportExcel.js';
import { downloadText } from '../utils/dom.js';

export function ProposalPage(root) {
  const p = ensureProject();
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>КП / экспорт</h2><p>Предпросмотр клиентского КП и экспорт. Excel на этом этапе сделан как CSV-совместимая выгрузка.</p></div><div class="actions"><button class="btn primary" data-print>Печать / PDF</button><button class="btn ghost" data-html>HTML</button><button class="btn ghost" data-csv>Excel CSV</button><button class="btn ghost" data-json>JSON</button></div></div><div class="docPreview">${proposalHtml(p)}</div>`);
  bindLayoutActions(root);
  root.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
  root.querySelector('[data-html]')?.addEventListener('click',()=>downloadText(`${p.name}.html`, proposalHtml(p), 'text/html'));
  root.querySelector('[data-csv]')?.addEventListener('click',()=>downloadText(`${p.name}.csv`, exportCsv(p), 'text/csv'));
  root.querySelector('[data-json]')?.addEventListener('click',()=>downloadText(`${p.name}.json`, exportProject(p)));
}
