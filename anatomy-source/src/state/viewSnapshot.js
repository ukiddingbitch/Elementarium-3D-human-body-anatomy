import {state,batchPartStates,setIsolatedPart,setCurrentView} from './store.js';
import {SYSTEM_IDS} from '../data/anatomy.js';
import {getMeshRegistry,loadModel,unloadSystem} from '../viewer/loadModel.js';
import {getPartVisibility,restoreAllParts,setOwnPartVisibility,setPartTransparency,getGhostedParts,restoreGhostedParts} from '../viewer/visibility.js';
import {selectPartById,deselectPart} from '../viewer/selection.js';
import {cancelCameraAnimation} from '../viewer/camera.js';
import {scheduleStateWrite} from './urlState.js';

const vector=value=>Array.isArray(value)&&value.length===3&&value.every(n=>Number.isFinite(n)&&Math.abs(n)<1e6);
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const bounded=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function validateViewSnapshot(value,knownIds){
  if(!object(value)||value.version!==1||!Array.isArray(value.systems)||value.systems.some(id=>!SYSTEM_IDS.includes(id))||new Set(value.systems).size!==value.systems.length)throw Error('invalid_view');
  const c=value.camera,p=value.parts;
  if(!object(c)||!vector(c.position)||!vector(c.target)||!vector(c.up)||!bounded(c.near,1e-8,10)||!bounded(c.far,c.near+1e-8,1e5)||!bounded(c.fov,1,170)||!bounded(c.zoom,.01,100)||!bounded(c.minDistance,0,100)||!bounded(c.maxDistance,c.minDistance,1e6))throw Error('invalid_view');
  if(!object(p)||Object.keys(p).length>5000||!Array.isArray(value.ghosted)||value.ghosted.length>5000||!bounded(value.depth,0,100))throw Error('invalid_view');
  const validId=id=>typeof id==='string'&&id.length>0&&id.length<=300&&(!knownIds||knownIds.has(id));
  for(const [id,part]of Object.entries(p))if(!validId(id)||!object(part)||typeof part.visible!=='boolean'||!bounded(part.opacity,0,1))throw Error('invalid_view');
  for(const id of value.ghosted)if(!validId(id)||!Object.hasOwn(p,id))throw Error('invalid_view');
  for(const id of [value.selected,value.isolated])if(id!==null&&(!validId(id)||!Object.hasOwn(p,id)))throw Error('invalid_view');
  return structuredClone(value);
}
export function captureViewSnapshot(viewer=state.viewer,depth=0){
  const {camera,controls}=viewer,registry=getMeshRegistry(),parts={};
  for(const id of registry.keys()){const part=getPartVisibility(id);parts[id]={visible:part.visible,opacity:part.opacity};}
  const value={version:1,systems:[...state.loadedSystems],parts,ghosted:getGhostedParts(),selected:registry.has(state.selectedPart?.id)?state.selectedPart.id:null,isolated:registry.has(state.isolatedPart)?state.isolatedPart:null,depth,
    camera:{position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray(),near:camera.near,far:camera.far,fov:camera.fov,zoom:camera.zoom,minDistance:controls.minDistance,maxDistance:controls.maxDistance},view:state.currentView};
  return validateViewSnapshot(value,new Set(Object.keys(state.partsData||{})));
}
export async function restoreViewSnapshot(value,viewer=state.viewer){
  const saved=validateViewSnapshot(value,new Set(Object.keys(state.partsData||{})));
  // Do not tear down the current selection before the required models load.
  for(const id of saved.systems)await loadModel(id,viewer);
  cancelCameraAnimation();deselectPart();
  for(const id of [...state.loadedSystems])if(!saved.systems.includes(id))unloadSystem(id);
  batchPartStates(()=>{
    restoreAllParts();
    for(const [id,part]of Object.entries(saved.parts))if(getMeshRegistry().has(id)){
      setOwnPartVisibility(id,part.visible);
      if(part.opacity<1)setPartTransparency(id,part.opacity);
    }
    setIsolatedPart(saved.isolated);
    if(saved.selected)selectPartById(saved.selected,viewer);
    restoreGhostedParts(saved.ghosted);
    // Selection returns its own surfaces to their base material. Reapply a
    // deliberate opacity after that, while keeping the recorded ghost layer.
    const ghosted=new Set(saved.ghosted);
    for(const [id,part]of Object.entries(saved.parts))if(part.opacity<1&&!ghosted.has(id))setPartTransparency(id,part.opacity);
  });
  const {camera,controls}=viewer,c=saved.camera,damping=controls.enableDamping;
  controls.enableDamping=false;controls.update();
  camera.position.fromArray(c.position);camera.up.fromArray(c.up);camera.near=c.near;camera.far=c.far;camera.fov=c.fov;camera.zoom=c.zoom;camera.updateProjectionMatrix();
  controls.target.fromArray(c.target);controls.minDistance=c.minDistance;controls.maxDistance=c.maxDistance;controls.update();controls.enableDamping=damping;
  if(typeof saved.view==='string')setCurrentView(saved.view);
  viewer.render?.();scheduleStateWrite();return saved;
}
