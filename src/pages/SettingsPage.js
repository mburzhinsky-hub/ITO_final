import { AppLayout, bindLayoutActions } from '../components/AppLayout.js';
import { getSettings, updateSettings } from '../app/state.js';
import { toast } from '../utils/dom.js';

export function SettingsPage(root) {
  const s = getSettings();
  root.innerHTML = AppLayout(`<div class="pageHead"><div class="pageTitle"><h2>Настройки</h2><p>Экспертные параметры отделены от расчётной логики и могут позже переехать на backend.</p></div><button class="btn primary" data-save-settings>Сохранить настройки</button></div>
  <div class="grid cols2"><div class="card"><h3>Финансы</h3>${input('usdRate','Курс USD → RUB',s.usdRate)}${input('defaultVatPct','НДС по умолчанию, %',s.defaultVatPct)}${input('defaultMarginPct','Маржа / наценка по умолчанию, %',s.defaultMarginPct)}</div>
  <div class="card"><h3>Ставки работ</h3>${input('installationPct','Монтаж, доля от оборудования',s.laborRates.installationPct,'0.01')}${input('pnrPct','ПНР, доля',s.laborRates.pnrPct,'0.01')}${input('contentPct','Контент, доля',s.laborRates.contentPct,'0.01')}${input('logisticsPct','Логистика, доля',s.laborRates.logisticsPct,'0.01')}</div></div>`);
  bindLayoutActions(root);
  root.querySelector('[data-save-settings]')?.addEventListener('click',()=>{
    const laborRates = {...s.laborRates};
    root.querySelectorAll('[data-setting]').forEach(el=>{const k=el.dataset.setting; if(k in laborRates) laborRates[k]=Number(el.value); else s[k]=Number(el.value);});
    updateSettings({...s, laborRates}); toast('Настройки сохранены');
  });
}
function input(key,label,value,step='1'){return `<label class="field"><span>${label}</span><input type="number" step="${step}" data-setting="${key}" value="${value}"></label>`}
