import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { ProjectCard } from '../components/ProjectCard.js';
import { listProjects, createAndSaveProject, deleteProject, duplicateAndSaveProject, readProject, importProject } from '../app/storage.js';
import { setProject } from '../app/state.js';
import { navigate } from '../app/router.js';
import { toast } from '../utils/dom.js';

export function ProjectsPage(root) {
  const projects = listProjects();
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Главная / проекты</h2><p>Локальный список расчётов. Каждый проект хранится отдельно в localStorage.</p></div><div class="actions"><button class="btn primary" data-new-project>Новый расчёт</button><label class="btn ghost">Импорт JSON<input type="file" accept="application/json" data-import-json hidden></label></div></div>
  ${projects.length ? `<div class="grid cols2">${projects.map(ProjectCard).join('')}</div>` : '<div class="empty">Сохранённых проектов пока нет. Создайте первый расчёт.</div>'}`);
  bindLayoutActions(root);
  root.querySelector('[data-new-project]')?.addEventListener('click', () => { const p = createAndSaveProject(); setProject(p); navigate('passport'); });
  root.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => { setProject(readProject(btn.dataset.open)); navigate('passport'); }));
  root.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => { if(confirm('Удалить проект?')) { deleteProject(btn.dataset.delete); toast('Проект удалён'); ProjectsPage(root); } }));
  root.querySelectorAll('[data-duplicate]').forEach(btn => btn.addEventListener('click', () => { const p = duplicateAndSaveProject(readProject(btn.dataset.duplicate)); setProject(p); toast('Проект продублирован'); ProjectsPage(root); }));
  root.querySelector('[data-import-json]')?.addEventListener('change', async e => {
    const file = e.target.files?.[0]; if(!file) return;
    try { const p = importProject(await file.text()); setProject(p); toast('JSON импортирован'); navigate('passport'); } catch { alert('Не удалось импортировать JSON'); }
  });
}
