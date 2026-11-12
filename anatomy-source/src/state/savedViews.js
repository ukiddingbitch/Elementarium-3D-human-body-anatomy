import {validateViewSnapshot} from './viewSnapshot.js';
export const PRESET_FORMAT='elementarium-anatomy-presets';
let databasePromise;
function database(){
  if(!databasePromise)databasePromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open('elementarium-saved-views',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('views',{keyPath:'id'});
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();databasePromise=null;};resolve(db);};
    request.onerror=()=>{databasePromise=null;reject(request.error);};
  });return databasePromise;
}
async function operation(mode,callback){
  const db=await database();return new Promise((resolve,reject)=>{
    const tx=db.transaction('views',mode),store=tx.objectStore('views');let result;
    try{const request=callback(store);if(request)request.onsuccess=()=>{result=request.result;};}catch(error){tx.abort();reject(error);return;}
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('storage_failed'));
  });
}
export async function listSavedViews(){return(await operation('readonly',store=>store.getAll())).sort((a,b)=>b.updatedAt-a.updatedAt||a.name.localeCompare(b.name));}
const cleanName=value=>{if(typeof value!=='string')throw Error('invalid_name');const name=value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim();if(!name||name.length>80)throw Error('invalid_name');return name;};
export function uniqueViewName(name,existing){const clean=cleanName(name),names=new Set(existing.map(v=>v.name.toLocaleLowerCase()));if(!names.has(clean.toLocaleLowerCase()))return clean;let count=2;while(names.has((clean.slice(0,70)+' ('+count+')').toLocaleLowerCase()))count++;return clean.slice(0,70)+' ('+count+')';}
export async function saveNamedView(name,snapshot){
  const existing=await listSavedViews(),now=Date.now();
  const record={id:crypto.randomUUID(),name:uniqueViewName(name,existing),createdAt:now,updatedAt:now,state:validateViewSnapshot(snapshot)};
  await operation('readwrite',store=>store.put(record));return record;
}
export async function renameSavedView(id,name){const views=await listSavedViews(),record=views.find(v=>v.id===id);if(!record)throw Error('view_missing');record.name=uniqueViewName(name,views.filter(v=>v.id!==id));record.updatedAt=Date.now();await operation('readwrite',store=>store.put(record));return record;}
export async function deleteSavedView(id){await operation('readwrite',store=>store.delete(id));}
export function exportSavedViews(views){return JSON.stringify({format:PRESET_FORMAT,version:1,views},null,2);}
export function parseSavedViews(text,knownIds){
  let data;try{data=JSON.parse(text);}catch{throw Error('invalid_view');}
  if(data?.format!==PRESET_FORMAT||data.version!==1||!Array.isArray(data.views)||data.views.length>1000)throw Error('invalid_view');
  return data.views.map(record=>({name:cleanName(record.name),state:validateViewSnapshot(record.state,knownIds)}));
}
export async function importSavedViews(text,knownIds){
  const incoming=parseSavedViews(text,knownIds),existing=await listSavedViews(),now=Date.now(),records=[];
  for(const entry of incoming){const record={id:crypto.randomUUID(),name:uniqueViewName(entry.name,[...existing,...records]),createdAt:now,updatedAt:now,state:entry.state};records.push(record);}
  await operation('readwrite',store=>{for(const record of records)store.put(record);});return records;
}
