import {state,setLanguage,subscribe} from './store.js';
export const LANGUAGES=['sk','en','it','la'];
export function savedLanguage(){try{const value=localStorage.getItem('elementarium:language');return LANGUAGES.includes(value)?value:null;}catch{return null;}}
export function connectLanguage(initial){
  const publish=lang=>{
    try{localStorage.setItem('elementarium:language',lang);}catch{}
    document.documentElement.lang=lang;
    if(window.parent!==window)window.parent.postMessage({type:'elementarium-language',language:lang},'*');
  };
  subscribe('language',publish);
  window.addEventListener('storage',event=>{if(event.key==='elementarium:language'&&LANGUAGES.includes(event.newValue))setLanguage(event.newValue);});
  window.addEventListener('elementarium:language-request',event=>{if(LANGUAGES.includes(event.detail))setLanguage(event.detail);});
  if(LANGUAGES.includes(initial))setLanguage(initial);
  publish(state.language);
}
