const TABLE_URL='elementarium://app/content/index.html';
const ATLAS_URL='elementarium://app/content/anatomy/index.html#sys=skeletal&lang=sk';
const table=document.getElementById('table-view'),atlas=document.getElementById('atlas-view');
const supportedLanguages=['sk','en','it','la'];
let applicationLanguage='sk';
try{const saved=localStorage.getItem('elementarium:language');if(supportedLanguages.includes(saved))applicationLanguage=saved;}catch{}
function applyLanguage(language){
  if(!supportedLanguages.includes(language))return;
  applicationLanguage=language;
  try{localStorage.setItem('elementarium:language',language);}catch{}
  const picker=document.getElementById('application-language');if(picker)picker.value=language;
  for(const frame of [table,atlas]){
    try{const win=frame.contentWindow;if(frame.hasAttribute('src'))win.dispatchEvent(new win.CustomEvent('elementarium:language-request',{detail:language}));}catch{}
  }
  syncLanguage();
}
function syncLanguage(){
  const lang=applicationLanguage;
  const labels={sk:['Periodická tabuľka','Anatomický atlas','← Späť na tabuľku'],en:['Periodic table','Anatomy atlas','← Back to table'],it:['Tavola periodica','Atlante anatomico','← Torna alla tavola'],la:['Tabula periodica','Atlas anatomicus','← Ad tabulam']}[lang]||[];
  if(!labels.length)return;
  document.documentElement.lang=lang;
  for(const [index,id]of ['show-table','show-anatomy','back-table'].entries())document.getElementById(id).textContent=labels[index];
  table.title=labels[0];atlas.title=labels[1];
  const languageLabel={sk:'Jazyk aplikácie',en:'Application language',it:'Lingua dell’applicazione',la:'Lingua applicationis'}[lang];
  document.getElementById('application-language').setAttribute('aria-label',languageLabel);
  document.querySelector('.application-language-label span').textContent=languageLabel;
  document.querySelector('.desktop-navigation nav').setAttribute('aria-label',labels[0]+' / '+labels[1]);
}
function useApplicationLanguage(frame){
  const doc=frame.contentDocument;
  for(const picker of doc.querySelectorAll('#site-language,#detail-language,#langSelect')){
    picker.hidden=true;
    picker.style.setProperty('display','none','important');
    if(picker.id)for(const label of doc.querySelectorAll('label[for="'+picker.id+'"]'))label.hidden=true;
  }
}
table.addEventListener('load',()=>{
  useApplicationLanguage(table);
  const duplicateAtlasLink=table.contentDocument.querySelector('.atlas-link');
  if(duplicateAtlasLink)duplicateAtlasLink.hidden=true;
  applyLanguage(applicationLanguage);
  syncLanguage();
  new MutationObserver(syncLanguage).observe(table.contentDocument.documentElement,{attributes:true,attributeFilter:['lang']});
});
atlas.addEventListener('load',()=>{useApplicationLanguage(atlas);applyLanguage(applicationLanguage);});
document.getElementById('application-language').addEventListener('change',event=>applyLanguage(event.target.value));
function activate(view,url){
  const anatomy=view==='anatomy';
  if(anatomy){
    if(!atlas.hasAttribute('src'))atlas.src=url||ATLAS_URL;
    else if(url&&atlas.src!==url){
      const destination=new URL(url);
      destination.searchParams.set('context',Date.now());
      atlas.src=destination.href;
    }
  }
  table.hidden=anatomy;atlas.hidden=!anatomy;
  for(const[id,selected]of[['show-table',!anatomy],['show-anatomy',anatomy]]){const button=document.getElementById(id);button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));}
  document.getElementById('back-table').hidden=!anatomy;
  document.body.dataset.view=anatomy?'anatomy':'table';
}
document.getElementById('show-table').onclick=()=>activate('table');
document.getElementById('show-anatomy').onclick=()=>activate('anatomy');
document.getElementById('back-table').onclick=()=>activate('table');
window.addEventListener('desktop-open-atlas',event=>{
  try{const url=new URL(event.detail);if(url.protocol==='elementarium:'&&url.hostname==='app'&&url.pathname==='/content/anatomy/index.html')activate('anatomy',url.href);}catch{}
});
window.addEventListener('message',event=>{
  if([table.contentWindow,atlas.contentWindow].includes(event.source)&&event.data?.type==='elementarium-language'){
    applyLanguage(event.data.language);return;
  }
  if(event.source!==table.contentWindow||event.data?.type!=='elementarium-open-atlas')return;
  try{const url=new URL(event.data.url,TABLE_URL);if(url.protocol==='elementarium:'&&url.hostname==='app'&&url.pathname==='/content/anatomy/index.html')activate('anatomy',url.href);}catch{}
});
activate('table');
