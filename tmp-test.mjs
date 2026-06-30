import { ZONE_TEMPLATES, createZoneSeedFromTemplate } from './src/data/zoneTaxonomy.js';
import { createProject, createZone } from './src/engine/projectFactory.js';
import { generateEstimateFromZones, recommendedCategoriesForZone, LIBRARY } from './src/engine/estimate.js';
import { validateProject } from './src/engine/validation.js';
console.log('templates', ZONE_TEMPLATES.length, 'library', LIBRARY.length);
const bad=[]; const missing=[]; const emptyItems=[];
for (const t of ZONE_TEMPLATES) {
  if (!t.recommendedItems?.length) emptyItems.push(t.id);
  const seed = createZoneSeedFromTemplate(t,'corporate');
  const z=createZone({...seed,id:'z_'+t.id});
  const p=createProject({name:'test',customerName:'client',passport:{projectType:'corporate',scenario:'base'},zones:[z]});
  const report=generateEstimateFromZones(p,{mode:'replace'});
  const equipment=p.estimateItems.filter(i=>!i.isDerived || !['Монтажные работы','ПНР','Контент / ПО','Логистика','Крепления и конструкции','Питание'].includes(i.category));
  const groupWarnings=validateProject(p).filter(w=>w.id.includes('zone-group'));
  if (equipment.length < 3 || p.estimateItems.length < 5) bad.push([t.id,t.name,report.added,p.estimateItems.length,equipment.length,recommendedCategoriesForZone(z).join(', ')]);
  if (groupWarnings.length) missing.push([t.id,t.name,groupWarnings.map(w=>w.message).join(' | ')]);
}
console.log({bad:bad.length, missing:missing.length, emptyItems:emptyItems.length});
console.table(bad.slice(0,20));
console.table(missing.slice(0,20));
