export function PageHeader({ title, description = '', actions = '' } = {}) {
  return `<div class="pageHead"><div class="pageTitle"><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}
