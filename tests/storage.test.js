import { assert, equal } from './test-utils.js';
import { createProject } from '../src/engine/projectFactory.js';
import { createAndSaveProject, deleteProject, duplicateAndSaveProject, importProject, listProjects, readProject, saveProject } from '../src/app/storage.js';

function installStorageMock() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    clear: () => map.clear()
  };
}

export function run() {
  installStorageMock();
  const created = createAndSaveProject({ name: 'Storage project', customerName: 'Customer' });
  assert(readProject(created.id), 'created project can be opened');
  created.name = 'Saved project';
  saveProject(created);
  equal(readProject(created.id).name, 'Saved project', 'project saved');
  const copy = duplicateAndSaveProject(created);
  assert(copy.id !== created.id && readProject(copy.id), 'project duplicated');
  const imported = importProject(JSON.stringify({ ...created, id: 'imported', schemaVersion: 1 }));
  equal(imported.schemaVersion, 7, 'schema migrated');
  assert(listProjects().length >= 3, 'projects listed');
  deleteProject(created.id);
  assert(!readProject(created.id), 'project deleted');
}
