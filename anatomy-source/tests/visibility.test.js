import {describe, it, beforeEach, expect, vi} from 'vitest';
import * as THREE from 'three';
const {registry, owned, children} = vi.hoisted(()=>({registry:new Map(),owned:new Map(),children:new Map()}));
vi.mock('../src/viewer/loadModel.js',()=>({
  getMeshRegistry:()=>registry,
  getMeshesBySystem:()=>[...registry.values()],
  ownMeshesOf:id=>owned.get(id)||[],
  withDescendants:id=>[id,...(children.get(id)||[])]
}));
import {state, subscribe} from '../src/state/store.js';
import {hidePart, showPart, isolatePart, setPartTransparency, getPartVisibility, restoreAllParts} from '../src/viewer/visibility.js';
import {setGroupVisibility, groupVisibility} from '../src/ui/structureVisibility.js';
import {focusOnParts,resetView} from '../src/viewer/camera.js';

function add(id, position=new THREE.Vector3()) {
  const material=new THREE.MeshStandardMaterial();
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.04,.08,.03),material);
  mesh.position.copy(position);mesh.userData.baseMaterial=material;
  registry.set(id,mesh);owned.set(id,[mesh]);return mesh;
}
beforeEach(()=>{
  registry.clear();owned.clear();children.clear();
  state.partStates=new Map();state.hiddenParts=new Set();state.transparentParts=new Set();state.isolatedPart=null;state.viewer=null;
});
describe('paired structure visibility',()=>{
  it('restores both sides even when state notifications change a checkbox',()=>{
    const left=add('Calcaneus.l'),right=add('Calcaneus.r');
    setGroupVisibility(['Calcaneus.l','Calcaneus.r'],false);
    const checkbox={checked:true};
    const stop=subscribe('partStates',()=>{checkbox.checked=state.partStates.get('Calcaneus.r').visible;});
    setGroupVisibility(['Calcaneus.l','Calcaneus.r'],checkbox.checked);stop();
    expect(left.visible).toBe(true);expect(right.visible).toBe(true);
    expect(state.hiddenParts.size).toBe(0);
  });
  it('reports a partially visible pair instead of losing the other side',()=>{
    add('Left');add('Right');hidePart('Right');
    expect(groupVisibility(['Left','Right'])).toEqual({visible:true,mixed:true});
    setGroupVisibility(['Left','Right'],false);
    expect(groupVisibility(['Left','Right'])).toEqual({visible:false,mixed:false});
  });
  it('restores a completely faded part to full opacity',()=>{
    const mesh=add('Bone');setPartTransparency('Bone',0);hidePart('Bone');showPart('Bone');
    expect(getPartVisibility('Bone')).toMatchObject({visible:true,opacity:1});
    expect(mesh.material.opacity).toBe(1);
  });
  it('clears stale isolation when another structure is shown',()=>{
    add('A');add('B');isolatePart('A');showPart('B');
    expect(state.isolatedPart).toBe(null);expect(getPartVisibility('B').visible).toBe(true);
  });
  it('isolates a hidden and fully transparent part as a solid structure',()=>{
    const mesh=add('Target');add('Other');setPartTransparency('Target',0);hidePart('Target');isolatePart('Target');
    expect(getPartVisibility('Target')).toMatchObject({visible:true,opacity:1});
    expect(mesh.material.opacity).toBe(1);expect(getPartVisibility('Other').visible).toBe(false);
  });
  it('restores nested structures and supports repeated hide/show cycles',()=>{
    add('Parent');add('Child');children.set('Parent',['Child']);
    for(let i=0;i<5;i++){hidePart('Parent');showPart('Parent');}
    expect(getPartVisibility('Child').visible).toBe(true);restoreAllParts();
    expect(state.hiddenParts.size).toBe(0);
  });
});
describe('isolation framing',()=>{
  it('restores full-body depth precision after isolating a small structure',async()=>{
    const small=add('Small'),body=add('Body');
    body.geometry=new THREE.BoxGeometry(.4,1.8,.3);
    const scene=new THREE.Scene();scene.add(small,body);
    const camera=new THREE.PerspectiveCamera(45,1.5,.01,100);camera.position.set(0,1,4);
    const controls={target:new THREE.Vector3(),minDistance:.02,update:vi.fn()};
    await focusOnParts(['Small'],{camera,controls},false);
    expect(camera.near).toBeLessThan(.01);
    await resetView({camera,controls,scene},false);
    expect(camera.near).toBe(.01);
  });
  it('centres and zooms a small isolated structure in wide and narrow viewports',async()=>{
    add('Small',new THREE.Vector3(.2,1.3,0));
    for(const aspect of [1.8,.55]){
      const camera=new THREE.PerspectiveCamera(45,aspect,.01,100);camera.position.set(0,1,4);
      const controls={target:new THREE.Vector3(0,1,0),minDistance:.02,update:vi.fn()};
      await focusOnParts(['Small'],{camera,controls},false);
      expect(controls.target.distanceTo(new THREE.Vector3(.2,1.3,0))).toBeLessThan(.00001);
      expect(camera.position.distanceTo(controls.target)).toBeLessThan(.5);
      camera.lookAt(controls.target);camera.updateMatrixWorld();
      const box=new THREE.Box3().setFromObject(registry.get('Small'));
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
        const projected=new THREE.Vector3(x,y,z).project(camera);
        expect(Math.abs(projected.x)).toBeLessThan(1);expect(Math.abs(projected.y)).toBeLessThan(1);
      }
    }
  });
});
