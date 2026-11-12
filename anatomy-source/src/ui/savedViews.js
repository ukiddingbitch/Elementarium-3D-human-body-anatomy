import {state,subscribe,translate} from '../state/store.js';
import {captureViewSnapshot,restoreViewSnapshot} from '../state/viewSnapshot.js';
import {listSavedViews,saveNamedView,renameSavedView,deleteSavedView,exportSavedViews,importSavedViews} from '../state/savedViews.js';
import {getDepthSliderValue,restoreDepthSliderValue} from './depthSlider.js';

const text=(key,values={})=>Object.entries(values).reduce((s,[name,value])=>s.replaceAll('{'+name+'}',String(value)),translate(key));
const element=(tag,className,content)=>{const el=document.createElement(tag);if(className)el.className=className;if(content!==undefined)el.textContent=content;return el;};
export function initSavedViews(viewer,{beforeRestore=()=>{},afterRestore=()=>{}}={}){
  const saveTrigger=document.getElementById('saveViewBtn'),listTrigger=document.getElementById('savedViewsBtn');
  if(!saveTrigger||document.getElementById('savedViewsDialog'))return;
  const dialog=element('dialog','saved-views-dialog');dialog.id='savedViewsDialog';dialog.setAttribute('aria-labelledby','savedViewsTitle');
  dialog.innerHTML=`<header class="saved-views-heading"><h2 id="savedViewsTitle"></h2><button type="button" id="savedViewsClose" class="btn-icon">×</button></header>
    <form id="saveViewForm" class="save-view-form" novalidate><label id="savedViewNameLabel" for="savedViewName"></label><div class="save-view-fields"><input id="savedViewName" name="name" maxlength="80" autocomplete="off" required><button id="saveCurrentView" type="submit"></button></div></form>
    <p id="savedViewsStorageNote" class="saved-views-note"></p><p id="savedViewsStatus" role="status" aria-live="polite"></p>
    <ul id="savedViewsList" class="saved-views-list"></ul><footer class="saved-views-footer"><button type="button" id="exportViewsBtn"></button><button type="button" id="importViewsBtn"></button><input type="file" id="importViewsFile" accept=".json,application/json" hidden></footer>`;
  document.body.append(dialog);
  const nameInput=dialog.querySelector('#savedViewName'),list=dialog.querySelector('#savedViewsList'),status=dialog.querySelector('#savedViewsStatus');
  let busy=false,records=[],message=null;
  function showMessage(key,values={},error=false){message={key,values,error};status.textContent=text(key,values);status.classList.toggle('is-error',error);}
  function setBusy(value){busy=value;dialog.querySelectorAll('button,input').forEach(control=>{control.disabled=value;});saveTrigger.disabled=value;listTrigger.disabled=value;if(!value)dialog.querySelector('#exportViewsBtn').disabled=records.length===0;}
  function reportError(error){console.error('[savedViews]',error);showMessage(['invalid_view','invalid_name','view_missing'].includes(error.message)?error.message:(error.name==='QuotaExceededError'?'storage_failed':'view_error'),{},true);}
  async function task(action){if(busy)return;setBusy(true);try{await action();}catch(error){reportError(error);}finally{setBusy(false);}}
  const actionButton=(key,callback)=>{const button=element('button','saved-view-action',text(key));button.type='button';button.addEventListener('click',callback);return button;};
  async function refresh(){records=await listSavedViews();render();}
  function render(){
    list.replaceChildren();
    if(!records.length){list.append(element('li','saved-views-empty',text('views_empty')));return;}
    for(const record of records){
      const row=element('li','saved-view-row');row.dataset.viewId=record.id;
      const details=element('div','saved-view-details'),name=element('strong','saved-view-name',record.name);
      const locale=({sk:'sk-SK',it:'it-IT',en:'en-GB',la:'en-GB'})[state.language]||'en-GB';
      const date=element('time','saved-view-date',new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(record.updatedAt));date.dateTime=new Date(record.updatedAt).toISOString();details.append(name,date);
      const actions=element('div','saved-view-actions');
      const load=actionButton('load_view',()=>task(async()=>{
        beforeRestore();const restored=await restoreViewSnapshot(record.state,viewer);restoreDepthSliderValue(restored.depth);afterRestore();
        document.getElementById('savedViewFeedback').textContent=text('views_loaded',{name:record.name});dialog.close();
      }));load.dataset.viewAction='load';
      const rename=actionButton('rename_view',()=>{
        details.replaceChildren();const input=element('input');input.value=record.name;input.maxLength=80;input.setAttribute('aria-label',text('view_name'));
        const accept=actionButton('save_name',()=>task(async()=>{const updated=await renameSavedView(record.id,input.value);await refresh();showMessage('views_renamed',{name:updated.name});}));
        const cancel=actionButton('cancel',render);details.append(input);actions.replaceChildren(accept,cancel);input.focus();input.select();
        input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();accept.click();}else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();render();}});
      });rename.dataset.viewAction='rename';
      const remove=actionButton('delete_view',()=>{
        details.replaceChildren(element('span','saved-view-delete-question',text('delete_view_confirm',{name:record.name})));
        const confirm=actionButton('delete_view',()=>task(async()=>{await deleteSavedView(record.id);await refresh();showMessage('views_deleted');}));confirm.dataset.viewAction='confirm-delete';
        actions.replaceChildren(confirm,actionButton('cancel',render));confirm.focus();
      });remove.dataset.viewAction='delete';actions.append(load,rename,remove);row.append(details,actions);list.append(row);
    }
  }
  function translateUI(){
    for(const [id,key]of Object.entries({saveViewBtn:'save_view',savedViewsBtn:'saved_views',savedViewsTitle:'saved_views',savedViewNameLabel:'view_name',saveCurrentView:'save_current_view',savedViewsStorageNote:'views_stored_locally',exportViewsBtn:'export_views',importViewsBtn:'import_views'}))document.getElementById(id).textContent=text(key);
    nameInput.placeholder=text('view_name_placeholder');dialog.querySelector('#savedViewsClose').setAttribute('aria-label',text('close'));
    if(message)showMessage(message.key,message.values,message.error);render();
  }
  async function open(save){
    if(!dialog.open)dialog.showModal();message=null;status.textContent='';
    await task(async()=>{await refresh();});
    if(save){nameInput.value='';nameInput.focus();}else dialog.querySelector('[data-view-action="load"]')?.focus();
  }
  saveTrigger.addEventListener('click',()=>open(true));listTrigger.addEventListener('click',()=>open(false));
  dialog.querySelector('#savedViewsClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.querySelector('#saveViewForm').addEventListener('submit',event=>{event.preventDefault();task(async()=>{
    const record=await saveNamedView(nameInput.value,captureViewSnapshot(viewer,getDepthSliderValue()));await refresh();showMessage('views_saved',{name:record.name});nameInput.value='';
  });});
  dialog.querySelector('#exportViewsBtn').addEventListener('click',()=>task(async()=>{
    const views=await listSavedViews(),url=URL.createObjectURL(new Blob([exportSavedViews(views)],{type:'application/json'})),link=element('a');
    link.href=url;link.download='Elementarium-views-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }));
  const fileInput=dialog.querySelector('#importViewsFile');
  dialog.querySelector('#importViewsBtn').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',()=>task(async()=>{
    const file=fileInput.files?.[0];if(!file)return;if(file.size>50*1024*1024)throw Error('invalid_view');
    const imported=await importSavedViews(await file.text(),new Set(Object.keys(state.partsData||{})));await refresh();showMessage('views_imported',{count:imported.length});fileInput.value='';
  }));
  subscribe('language',translateUI);translateUI();
}
