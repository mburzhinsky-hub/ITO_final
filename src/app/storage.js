import { createProject, duplicateProject, normalizeProject } from '../engine/projectFactory.js';
const INDEX_KEY = 'vizhu.stage1.projects.index';
const PROJECT_KEY = id => `vizhu.stage1.projects.${id}`;
const SETTINGS_KEY = 'vizhu.stage1.settings';

export function listProjects() {
  const ids = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  return ids.map(id => readProject(id)).filter(Boolean).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
export function readProject(id) {
  const raw = localStorage.getItem(PROJECT_KEY(id));
  if (!raw) return null;
  try { return normalizeProject(JSON.parse(raw)); } catch { return null; }
}
export function saveProject(project) {
  project.updatedAt = new Date().toISOString();
  localStorage.setItem(PROJECT_KEY(project.id), JSON.stringify(project));
  const ids = new Set(JSON.parse(localStorage.getItem(INDEX_KEY) || '[]')); ids.add(project.id);
  localStorage.setItem(INDEX_KEY, JSON.stringify([...ids]));
  return project;
}
export function deleteProject(id) {
  localStorage.removeItem(PROJECT_KEY(id));
  const ids = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]').filter(x => x !== id);
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}
export function createAndSaveProject(seed = {}) { return saveProject(createProject(seed)); }
export function duplicateAndSaveProject(project) { return saveProject(duplicateProject(project)); }
export function exportProject(project) { return JSON.stringify(project, null, 2); }
export function importProject(jsonText) {
  const parsed = JSON.parse(jsonText);
  const project = normalizeProject(parsed);
  return saveProject(project);
}
export function readSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } }
export function saveSettings(settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return settings; }
