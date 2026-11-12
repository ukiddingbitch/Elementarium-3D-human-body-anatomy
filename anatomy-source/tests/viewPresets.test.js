import {describe,it,expect,vi,beforeEach} from 'vitest';
import * as T from 'three';
const {registry,meshes}=vi.hoisted(()=>({registry:new Map(),meshes:new Map()}));
vi.mock('../src/viewer/loadModel.js',()=>({getMeshRegistry:()=>registry,ownMeshesOf:id=>meshes.get(id)||[],withDescendants:id=>[id],getMeshesBySystem:()=>[...registry.values()],loadModel:async()=>{},unloadSystem:()=>true}));
vi.mock('../src/viewer/selection.js',()=>({deselectPart:()=>{state.selectedPart=null;},selectPartById:id=>{state.selectedPart={id};}}));
import {state} from '../src/state/store.js';
import {captureViewSnapshot,restoreViewSnapshot,validateViewSnapshot} from '../src/state/viewSnapshot.js';
import {parseSavedViews,exportSavedViews,uniqueViewName} from '../src/state/savedViews.js';
import {setOwnPartVisibility,setPartTransparency,getPartVisibility,clearGhost} from '../src/viewer/visibility.js';

let viewer;
function add(id){const material=new T.MeshStandardMaterial(),mesh=new T.Mesh(new T.BoxGeometry(.01,.02,.01),material);mesh.userData.baseMaterial=material;mesh.userData.partId=id;registry.set(id,mesh);meshes.set(id,[mesh]);state.partsData[id]={id};state.partStates.set(id,{visible:true,opacity:1});}
beforeEach(()=>{registry.clear();meshes.clear();state.partsData={};state.partStates=new Map();state.hiddenParts=new Set();state.transparentParts=new Set();state.isolatedPart=null;state.selectedPart=null;state.loadedSystems=['skeletal'];state.language='sk';clearGhost();const camera=new T.PerspectiveCamera(50,1.5,.001,100);camera.position.set(.123456,1.334455,.678912);viewer={camera,controls:{target:new T.Vector3(.1,1.3,0),minDistance:.002,maxDistance:20,enableDamping:true,update:vi.fn()},render:vi.fn()};state.viewer=viewer;});
describe('portable named anatomy views',()=>{
  it('round-trips more than 200 hidden parts, exact transparency and camera values',()=>{
    for(let i=0;i<260;i++){add('Part '+i);setOwnPartVisibility('Part '+i,false);}setPartTransparency('Part 4',.47);
    const saved=captureViewSnapshot(viewer,37),file=exportSavedViews([{id:'test',name:'Srdce — detail',state:saved}]);
    const parsed=parseSavedViews(file,new Set(Object.keys(state.partsData)))[0];
    expect(Object.keys(parsed.state.parts)).toHaveLength(260);expect(parsed.state.parts['Part 4']).toEqual({visible:false,opacity:.47});expect(parsed.state.camera.position).toEqual([.123456,1.334455,.678912]);expect(parsed.name).toBe('Srdce — detail');
  });
  it('rejects unrelated, malformed and future files without applying them',()=>{
    for(const file of ['not json','{}','{"format":"other","version":1,"views":[]}','{"format":"elementarium-anatomy-presets","version":2,"views":[]}'])expect(()=>parseSavedViews(file,new Set())).toThrow();
  });
  it('rejects unknown structures instead of silently dropping them',()=>{
    add('Known');const value=captureViewSnapshot(viewer);value.parts.Unknown={visible:true,opacity:1};expect(()=>validateViewSnapshot(value,new Set(['Known']))).toThrow('invalid_view');
  });
  it('rejects invalid camera and material values',()=>{
    add('A');const value=captureViewSnapshot(viewer);value.parts.A.opacity=2;expect(()=>validateViewSnapshot(value)).toThrow('invalid_view');value.parts.A.opacity=1;value.camera.position[1]=NaN;expect(()=>validateViewSnapshot(value)).toThrow('invalid_view');
  });
  it('keeps existing names and gives duplicate saves a distinct name',()=>{
    expect(uniqueViewName('  Srdce  ',[])).toBe('Srdce');expect(uniqueViewName('Srdce',[{name:'Srdce'},{name:'Srdce (2)'}])).toBe('Srdce (3)');expect(()=>uniqueViewName(' ',[])).toThrow('invalid_name');
  });
  it('restores independent visibility, opacity and camera without changing the app language',async()=>{
    add('Parent');add('Child');setOwnPartVisibility('Parent',false);setPartTransparency('Child',.42);const saved=captureViewSnapshot(viewer,29);
    setOwnPartVisibility('Parent',true);setOwnPartVisibility('Child',false);viewer.camera.position.set(9,9,9);state.language='it';
    await restoreViewSnapshot(saved,viewer);
    expect(getPartVisibility('Parent').visible).toBe(false);expect(getPartVisibility('Child')).toMatchObject({visible:true,opacity:.42});expect(viewer.camera.position.toArray()).toEqual(saved.camera.position);expect(viewer.camera.near).toBe(.001);expect(state.language).toBe('it');expect(viewer.render).toHaveBeenCalled();
  });
});
