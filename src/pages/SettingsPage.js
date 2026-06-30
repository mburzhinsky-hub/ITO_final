import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { getSettings, updateSettings } from '../app/state.js';
import { toast } from '../utils/dom.js';

export function SettingsPage(root) {
  const s = getSettings();
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Настройки</h2><p>Экспертные параметры отделены от расчётной логики и могут позже переехать на backend.</p></div><button class="btn primary" data-save-settings>Сохранить настройки</button></div>
  <div class="grid cols2"><div class="card"><h3>Финансы</h3>${input('usdRate','Курс USD → RUB',s.usdRate)}${input('defaultVatPct','НДС по умолчанию, %',s.defaultVatPct)}${input('defaultMarginPct','Наценка / маржа по умолчанию, %',s.defaultMarginPct)}<label class="field"><span>Режим по умолчанию</span><select data-setting="defaultMarginMode"><option value="markup" ${s.defaultMarginMode==='markup'?'selected':''}>Наценка</option><option value="margin" ${s.defaultMarginMode==='margin'?'selected':''}>Маржа</option></select></label><label class="field"><span>Целевой бюджет по умолчанию сравнивать с</span><select data-setting="targetBudgetIncludesVat"><option value="true" ${s.targetBudgetIncludesVat !== false ? 'selected' : ''}>ценой с НДС</option><option value="false" ${s.targetBudgetIncludesVat === false ? 'selected' : ''}>ценой без НДС</option></select></label></div>
  <div class="card"><h3>Ставки работ</h3>${input('installationPct','Монтаж, доля от оборудования',s.laborRates.installationPct,'0.01')}${input('pnrPct','ПНР, доля',s.laborRates.pnrPct,'0.01')}${input('contentPct','Контент, доля',s.laborRates.contentPct,'0.01')}${input('logisticsPct','Логистика, доля',s.laborRates.logisticsPct,'0.01')}${input('cablePct','Кабели и расходники, доля',s.laborRates.cablePct,'0.01')}${input('servicePct','Сервис, доля',s.laborRates.servicePct,'0.01')}</div></div>`);
  bindLayoutActions(root);
  root.querySelector('[data-save-settings]')?.addEventListener('click',()=>{
    const laborRates = {...s.laborRates};
    root.querySelectorAll('[data-setting]').forEach(el=>{const k=el.dataset.setting; let value = el.type==='number' ? Number(el.value) : el.value; if(k === 'targetBudgetIncludesVat') value = el.value === 'true'; if(k in laborRates) laborRates[k]=Number(value); else s[k]=value;});
    updateSettings({...s, laborRates}); toast('Настройки сохранены');
  });
}
function input(key,label,value,step='1'){return `<label class="field"><span>${label}</span><input type="number" step="${step}" data-setting="${key}" value="${value}"></label>`}
