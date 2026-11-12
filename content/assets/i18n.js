import data from '../data/locales.js';

let language='sk';
try{const saved=localStorage.getItem('elementarium:language');if(['sk','en','it','la'].includes(saved))language=saved;}catch{}
const pick=values=>values[language]??values.en;
const originalText=new WeakMap(),originalAttributes=new WeakMap();
const replacements=Object.keys(data.ui).sort((a,b)=>b.length-a.length);
const skSpiral={
  'PERIODIC TABLE OF ELEMENTS':'PERIODICKÁ TABUĽKA PRVKOV',
  'BASED ON THE WAVELENGTH-SPIRAL · VECTOR RECONSTRUCTION':'HISTORICKÁ VLNOVÁ ŠPIRÁLA · VEKTOROVÁ INTERPRETÁCIA',
  'Historical wavelength-octave concept · not a measured spectrum or accepted atomic model':'Historický model vlnových oktáv · nie namerané spektrum ani prijatý atómový model',
  'CHARGING':'NABÍJANIE','DISCHARGING':'VYBÍJANIE','SYSTEMS':'SÚSTAVY'
};
export function currentLanguage(){return language;}
export function latinName(n){return data.elements[n-1]?.latin||'';}
export function localeSearchTerms(n){const e=data.elements[n-1];return e?`${e.latin} ${e.italian} ${e.itDescription} ${e.itUses} ${e.enDescription} ${e.enUses} ${e.laDescription} ${e.laUses}`:'';}
export function numericLocale(){return ({sk:'sk-SK',en:'en-GB',it:'it-IT',la:'en-GB'})[language];}
export function setSiteLanguage(value){
  if(!['sk','en','it','la'].includes(value))return false;
  if(value===language){if(typeof document!=='undefined')localize();return true;}
  language=value;
  try{localStorage.setItem('elementarium:language',language);}catch{}
  if(typeof document!=='undefined')localize();
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('elementarium:language',{detail:language}));
  if(typeof window!=='undefined'&&window.parent!==window)window.parent.postMessage({type:'elementarium-language',language},'*');
  return true;
}
function label(key){return language==='sk'?key:(data.ui[key]?.[language]||key);}
function nameInLanguage(sk){const item=data.elements.find(e=>e.sk.toLowerCase()===sk.toLowerCase());return item?(language==='en'?item.english:language==='la'?item.latin:language==='it'?item.italian:item.sk):sk;}

export function translateText(raw){
  if(!raw||!raw.trim())return raw;
  const match=raw.match(/^(\s*)([\s\S]*?)(\s*)$/),before=match[1],s=match[2],after=match[3];
  if(language==='sk'){
    if(skSpiral[s])return before+skSpiral[s]+after;
    if(/^\d+(st|nd|rd|th).*Octave/.test(s))return before+s.replace('1st–4th Octaves','1.–4. oktáva').replace(/(\d+)(st|nd|rd|th) Octave/,'$1. oktáva')+after;
    return raw;
  }
  if(data.ui[s])return before+data.ui[s][language]+after;
  if(/^Spoznaj /.test(s))return before+(pick({"en": "About ", "la": "Elementum ", "it": "Scopri "}))+nameInLanguage(s.slice(8))+after;
  if(/^PRVOK \d+ ZO 118$/.test(s))return before+s.replace(/PRVOK (\d+) ZO 118/,pick({"en": "ELEMENT $1 OF 118", "la": "ELEMENTUM $1 EX 118", "it": "ELEMENTO $1 DI 118"}))+after;
  let out=s;
  out=out.replace(/(\d+) vybraných čiar z archívu NIST\. Kliknutím na čiaru vypočítaš frekvenciu\./,pick({"en": "$1 selected lines from the NIST archive. Click a line to calculate its frequency.", "la": "$1 lineae selectae ex archivo NIST. Lineam elige ut frequentiam computes.", "it": "$1 linee selezionate dall'archivio NIST. Fare clic su una linea per calcolare la sua frequenza."}));
  out=out.replace(/Neutrálny atóm v základnom stave · (\d+) elektrónov/,pick({"en": "Ground-state neutral atom · $1 electrons", "la": "Atomus neutra in statu fundamentali · $1 electrona", "it": "Atomo neutro dello stato di terra · elettroni di $1"}));
  out=out.replace(/(\d+) protónov · (\d+) elektrónov · Bohrov model/,pick({"en": "$1 protons · $2 electrons · Bohr model", "la": "$1 protona · $2 electrona · exemplar Bohr", "it": "$1 protons · elettroni di $2 · modello di Bohr"}));
  out=out.replace(/(\d+) protónov · (\d+) elektrónov · Ilustračný elektrónový oblak/,pick({"en": "$1 protons · $2 electrons · Illustrative electron cloud", "la": "$1 protona · $2 electrona · nubes electronorum illustrativa", "it": "1 protoni · elettroni da 2 dollari · Nube di elettroni illustrativo"}));
  out=out.replace(/Pevná látka pri 20 °C/,pick({"en": "Solid at 20 °C", "la": "Solidum ad 20 °C", "it": "Solido a 20 °C"})).replace(/Kvapalina pri 20 °C/,pick({"en": "Liquid at 20 °C", "la": "Liquidum ad 20 °C", "it": "Liquido a 20 °C"})).replace(/Plyn pri 20 °C/,pick({"en": "Gas at 20 °C", "la": "Gas ad 20 °C", "it": "Gas a 20 °C"})).replace(/Neznáme pri 20 °C/,pick({"en": "Unknown at 20 °C", "la": "Ignotum ad 20 °C", "it": "Sconosciuto a 20 °C"}));
  out=out.replace(/Skupenstvo pri /g,pick({"en": "State at ", "la": "Status ad ", "it": "Stato "}));
  out=out.replace('Zmeň teplotu nad tabuľkou a sleduj orientačnú zmenu skupenstva.',pick({"en": "Adjust the temperature above the table to explore changes of state.", "la": "Temperaturam supra tabulam muta ut status materiae explores.", "it": "Regolare la temperatura sopra la tabella per esplorare i cambiamenti di stato."}));
  out=out.replace(/Orientačný hmotnostný podiel:/g,pick({"en": "Approximate body mass fraction:", "la": "Pars massae corporis approximata:", "it": "Frazione di massa corporea approssimativa:"}));
  out=out.replace(/orientačný hmotnostný podiel v tele\./g,pick({"en": "approximate body mass fraction.", "la": "pars massae corporis approximata.", "it": "frazione di massa corporea approssimativa."}));
  out=out.replace(/predpoklad/g,pick({"en": "predicted", "la": "praedictum", "it": "prevedibile"}));
  out=out.replace(/\(predicted\)/g,pick({"en": "(predicted)", "la": "(praedictum)", "it": "(pregiudiziale)"}));
  out=out.replace(/· perióda /g,pick({"en": "· period ", "la": "· periodus ", "it": "· periodo "})).replace(/· skupina /g,pick({"en": "· group ", "la": "· grex ", "it": "· gruppo "})).replace(/f-blok/g,pick({"en": "f-block", "la": "compartimentum f", "it": "blocco f"}));
  out=out.replace(/Anatomický atlas · /g,pick({"en": "Anatomy atlas · ", "la": "Atlas anatomicus · ", "it": "Atlanti di anatomia · "}));
  out=out.replace(/Spektrálne čiary · /g,pick({"en": "Spectral lines · ", "la": "Lineae spectrales · ", "it": "Linee spettrali · "}));
  out=out.replace(/^Odobrať /,pick({"en": "Remove ", "la": "Removere ", "it": "Rimuovi "}));
  out=out.replace(/Pôvodný opis \(EN\)/g,pick({"en": "Original description (EN)", "la": "Descriptio originalis (EN)", "it": "Descrizione originale (EN)"}));
  out=out.replace(/(\d+)(st|nd|rd|th) Octave(s?)/g,pick({"en": "$1$2 Octave$3", "la": "Octava $1", "it": "$1$2 Octave$3"}));
  out=out.replace(/^Select /,pick({"en": "Select ", "la": "Elige ", "it": "Seleziona "}));
  for(const key of replacements){if(out.includes(key))out=out.split(key).join(data.ui[key][language]);}
  if(language==='la'||language==='it')for(const e of data.elements){out=out.replace(new RegExp('\\b'+e.english+'\\b','g'),language==='la'?e.latin:e.italian);}
  // Values produced with the source Slovak locale retain their numeric meaning.
  if(language!=='it'&&/^[-+]?\d[\d\s\u00a0\u202f]*,\d+(\s*(°C|THz|nm|g\/cm³))?$/.test(out))out=out.replace(/[\s\u00a0\u202f](?=\d)/g,'').replace(',','.');
  return before+out+after;
}

let observer=null,queued=false;
function observe(){observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});}
export function localize(){
  observer?.disconnect();
  try{
    document.documentElement.lang=language;
    document.title=language==='sk'?'Elementarium':pick({"en": "Elementarium · Elements", "la": "Elementarium · Elementa", "it": "Elementarium · Elementi"});
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(['SCRIPT','STYLE','TEXTAREA'].includes(node.parentElement?.tagName)||node.parentElement?.id==='atomlabel')continue;
      let entry=originalText.get(node);
      if(!entry||entry.last!==node.nodeValue)entry={raw:node.nodeValue,last:null};
      const text=translateText(entry.raw);if(node.nodeValue!==text)node.nodeValue=text;
      entry.last=text;originalText.set(node,entry);
    }
    for(const element of document.body.querySelectorAll('[title],[aria-label],[placeholder]')){
      const state=originalAttributes.get(element)||{};
      for(const key of ['title','aria-label','placeholder']){
        if(!element.hasAttribute(key))continue;
        const value=element.getAttribute(key);let entry=state[key];
        if(!entry||entry.last!==value)entry={raw:value,last:null};
        const next=translateText(entry.raw);if(next!==value)element.setAttribute(key,next);
        entry.last=next;state[key]=entry;
      }
      originalAttributes.set(element,state);
    }
    document.querySelectorAll('#site-language,#detail-language').forEach(picker=>picker.value=language);
  }finally{observe();}
}
export function initLanguageControl(){
  observer=new MutationObserver(records=>{
    if(records.every(record=>record.target.id==='atomlabel'||record.target.parentElement?.id==='atomlabel'))return;
    if(!queued){queued=true;queueMicrotask(()=>{queued=false;localize();});}
  });
  document.querySelectorAll('#site-language,#detail-language').forEach(picker=>picker.addEventListener('change',()=>{
    setSiteLanguage(picker.value);
  }));
  localize();
}

if(typeof window!=='undefined'){
  window.addEventListener('storage',event=>{if(event.key==='elementarium:language'&&event.newValue!==language)setSiteLanguage(event.newValue);});
  window.addEventListener('elementarium:language-request',event=>setSiteLanguage(event.detail));
}
