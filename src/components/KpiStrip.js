export function KpiStrip(items = []) {
  return `<section class="kpiStrip">${items.map(item => `<div class="kpiCard ${item.tone || ''}"><div class="label">${item.label}</div><div class="value">${item.value}</div>${item.hint ? `<div class="hint">${item.hint}</div>` : ''}</div>`).join('')}</section>`;
}
