import {subscribe,translate} from '../state/store.js';

export function sidebarBounds(viewportWidth,compact=false){
  const maximum=Math.max(120,Math.min(800,viewportWidth-(compact?24:360)));
  return {minimum:Math.min(260,maximum),maximum};
}
export function clampSidebarWidth(width,viewportWidth,compact=false){
  const {minimum,maximum}=sidebarBounds(viewportWidth,compact);
  return Math.round(Math.max(minimum,Math.min(maximum,Number.isFinite(width)?width:280)));
}

export function initSidebarResize(){
  const panel=document.getElementById('systemsSidebar');
  if(!panel||document.getElementById('systemsResize'))return;
  const compact=()=>window.matchMedia('(max-width:1024px)').matches;
  let preferred=compact()?320:340;
  try{const stored=Number(localStorage.getItem('anatomy:sidebar-width'));if(stored>=120)preferred=stored;}catch{}
  const handle=document.createElement('div');
  handle.id='systemsResize';handle.className='systems-resize';
  handle.setAttribute('role','separator');handle.tabIndex=0;
  handle.setAttribute('aria-orientation','vertical');
  panel.appendChild(handle);
  const expand=document.createElement('button');
  expand.type='button';expand.id='systemsExpand';expand.className='systems-expand';expand.textContent='↔';
  panel.querySelector('.sidebar-header')?.insertBefore(expand,document.getElementById('systemsToggle'));
  let width=preferred,drag=null;
  const expandedWidth=()=>clampSidebarWidth(560,window.innerWidth,compact());
  const isExpanded=()=>width>=expandedWidth()-2;
  function labels(){
    const {minimum,maximum}=sidebarBounds(window.innerWidth,compact());
    handle.setAttribute('aria-label',translate('resize_panel'));
    handle.title=translate('resize_panel_hint');
    handle.setAttribute('aria-valuemin',String(minimum));
    handle.setAttribute('aria-valuemax',String(maximum));
    handle.setAttribute('aria-valuenow',String(width));
    const text=translate(isExpanded()?'shrink_panel':'expand_panel');
    expand.title=text;expand.setAttribute('aria-label',text);
    expand.disabled=maximum-minimum<2;
  }
  function apply(next,persist=false){
    width=clampSidebarWidth(next,window.innerWidth,compact());
    document.documentElement.style.setProperty('--sidebar-width',width+'px');
    document.documentElement.style.setProperty('--systems-panel-width',width+'px');
    labels();
    if(persist){preferred=width;try{localStorage.setItem('anatomy:sidebar-width',String(width));}catch{}}
  }
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    event.preventDefault();drag={x:event.clientX,width};handle.setPointerCapture(event.pointerId);
    document.body.classList.add('resizing-systems');
  });
  handle.addEventListener('pointermove',event=>{if(drag)apply(drag.width+event.clientX-drag.x);});
  const finish=()=>{if(!drag)return;drag=null;document.body.classList.remove('resizing-systems');apply(width,true);};
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);
  handle.addEventListener('keydown',event=>{
    const bounds=sidebarBounds(window.innerWidth,compact()),step=event.shiftKey?50:20;
    const next=event.key==='ArrowRight'?width+step:event.key==='ArrowLeft'?width-step:event.key==='Home'?bounds.minimum:event.key==='End'?bounds.maximum:null;
    if(next===null)return;event.preventDefault();event.stopPropagation();apply(next,true);
  });
  handle.addEventListener('dblclick',()=>apply(compact()?320:280,true));
  expand.addEventListener('click',()=>apply(isExpanded()?(compact()?Math.min(320,expandedWidth()-60):280):expandedWidth(),true));
  window.addEventListener('resize',()=>apply(preferred));
  subscribe('language',labels);
  apply(preferred);
}
