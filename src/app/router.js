const routes = new Map();
export function registerRoute(id, renderer) { routes.set(id, renderer); }
export function currentRoute() { return ((location.hash || '#/projects').replace('#/','').split('?')[0]) || 'projects'; }
export function navigate(route) { location.hash = `#/${route}`; }
export function startRouter(root) {
  const render = () => {
    const route = currentRoute();
    const renderer = routes.get(route) || routes.get('projects');
    renderer(root);
    document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  };
  window.addEventListener('hashchange', render);
  render();
}
