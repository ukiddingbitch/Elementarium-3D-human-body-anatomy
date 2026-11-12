// Deterministic data adaptation. No legacy Dundee/Cowley replacement geometry
// is copied. Application code from other viewers is not imported.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Document,NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRDracoMeshCompression} from '@gltf-transform/extensions';
import {dequantize,dedup,prune,weld} from '@gltf-transform/functions';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import draco3d from 'draco3dgltf';
import * as T from 'three';
import {bakeGeometryTransform} from './bake-geometry.mjs';
const sourceCache=process.argv[2];
if(!sourceCache)throw Error('Usage: node tools/build-full-atlas.mjs /path/to/input-cache');
const inputs=path.resolve(sourceCache);
const original=path.join(inputs,'original');
const output=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule(),'meshopt.decoder':MeshoptDecoder});
const catalog=await json(path.join(inputs,'authorod-packages-data-releases-1.2.0-manifest.json'));
const systems=await json(path.join(original,'data/systems.json'));
const fromSource=new Map(catalog.structures.filter(s=>s.source?.object).map(s=>[s.source.object,s]));
const report={version:'3.3.0',license:'CC-BY-SA-4.0',sources:{},parts:{},systems:[],schematicParts:[]};
const registry=new Map();
const shape=(primitive,node)=>{
  const g=new T.BufferGeometry();
  for(const [from,to] of [['POSITION','position'],['NORMAL','normal']]){
    const a=primitive.getAttribute(from);if(a)g.setAttribute(to,new T.BufferAttribute(new Float32Array(a.getArray()),3));
  }
  const indices=primitive.getIndices();if(indices)g.setIndex(new T.BufferAttribute(indices.getArray().slice(),1));
  return bakeGeometryTransform(g,new T.Matrix4().fromArray(node.getWorldMatrix()));
};
const oldDocs=new Map();
for(const system of Object.keys(systems)){
  const file=path.join(original,'models',system+'.glb'),bytes=await fs.readFile(file),doc=await io.read(file);
  oldDocs.set(system,doc);report.sources['original-'+system]={sha256:hash(bytes),file:system+'.glb',publisher:'nqwrc/3d-anatomy',commit:'8ca3b7421bcfbe88b85859eb1983d5cf79f21749'};
  for(const node of doc.getRoot().listNodes())if(node.getExtras().za_name){const id=node.getExtras().za_name;let p=node.getParentNode();while(p&&!p.getExtras().za_name)p=p.getParentNode();registry.set(id,{id,system,parent:p?.getExtras().za_name,shapes:[],source:'z-anatomy'});}
  for(const node of doc.getRoot().listNodes())if(node.getMesh()){
    let owner=node;while(owner&&!owner.getExtras().za_name)owner=owner.getParentNode();if(!owner)continue;
    const entry=registry.get(owner.getExtras().za_name);
    for(const p of node.getMesh().listPrimitives())entry.shapes.push({geometry:shape(p,node),material:p.getMaterial()});
  }
}
const boxOf=shapes=>{const box=new T.Box3();for(const {geometry:g}of shapes){g.computeBoundingBox();box.union(g.boundingBox);}return box;};
const centerOf=shapes=>boxOf(shapes).getCenter(new T.Vector3());
for(const entry of registry.values())entry.originalBounds=boxOf(entry.shapes);
function registered(doc,ids){
  const node=doc.getRoot().listNodes()[0],p=node.getMesh().listPrimitives()[0],g=shape(p,node),tags=p.getAttribute('_ID').getArray();
  const set=new Set(ids),indices=g.index.array,selected=[],map=new Map(),positions=[],normals=[];
  for(let i=0;i<indices.length;i+=3){
    if(!set.has(tags[indices[i]*2]))continue;
    for(const index of [indices[i],indices[i+1],indices[i+2]]){
      if(!set.has(tags[index*2]))throw Error('Mixed IDs in a source triangle');
      if(!map.has(index)){map.set(index,map.size);for(let k=0;k<3;k++){positions.push(g.attributes.position.array[index*3+k]);normals.push(g.attributes.normal.array[index*3+k]);}}
      selected.push(map.get(index));
    }
  }
  if(!selected.length)throw Error('Registered source has no triangles for '+[...set]);
  const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));out.setIndex(selected);g.dispose();return out;
}
const external={};
for(const [key,file] of [['ear','registered-ear.glb'],['kidney','registered-kidneys.glb'],['ossicles','registered-ossicles.glb']]){
  const data=await fs.readFile(path.join(inputs,file));const doc=await io.read(path.join(inputs,file));await doc.transform(dequantize());external[key]=doc;
  report.sources[key]={file,sha256:hash(data),source:'https://github.com/authorOd/3d-anatomy-atlas/tree/main/packages/data/releases/1.2.0',license:'CC-BY-4.0',underlying:key==='kidney'?'Human Reference Atlas kidney v1.3':'OpenEar Delta, doi:10.5281/zenodo.4362584'};
}
function replace(id,shapes,source,{schematic=false,note=''}={}){
  const entry=registry.get(id);if(!entry)throw Error('Unknown original structure '+id);
  if(!shapes.length)throw Error('Empty replacement '+id);
  entry.shapes=shapes.map(x=>x.geometry?x:{geometry:x,color:source==='hra-kidney'?'#a96961':source.startsWith('openear')?'#dccba4':'#e0c889'});
  entry.source=source;entry.schematic=schematic;entry.note=note;
  if(schematic)report.schematicParts.push(id);
}
const meshesOfNames=names=>names.flatMap(name=>{const s=fromSource.get(name);if(!s)throw Error('Unknown registered part '+name);return s.meshes;});
function fitBounds(geometries,target){
  const source=boxOf(geometries.map(geometry=>({geometry}))),a=source.getSize(new T.Vector3()),b=target.getSize(new T.Vector3());
  const scale=new T.Vector3(b.x/Math.max(a.x,1e-6),b.y/Math.max(a.y,1e-6),b.z/Math.max(a.z,1e-6));
  const from=source.getCenter(new T.Vector3()),to=target.getCenter(new T.Vector3());
  const matrix=new T.Matrix4().compose(to.sub(from.multiply(scale)),new T.Quaternion(),scale);
  return geometries.map(g=>g.clone().applyMatrix4(matrix));
}
for(const side of ['l','r']){
  const kidney=registered(external.kidney,meshesOfNames(['Fibrous capsule of kidney.'+side,'Hilum of kidney.'+side,'Renal columns.'+side,'Renal cortex.'+side,'Renal papillae.'+side,'Renal pyramids.'+side]));
  const pelvis=registered(external.kidney,meshesOfNames(['Renal pelvis.'+side,'Major calices.'+side,'Minor calices.'+side]));
  // Both collecting system and parenchyma share one placement transform.
  const kidneyBox=boxOf([{geometry:kidney}]),kidneyTarget=registry.get('Kidney.'+side).originalBounds;
  const kpSize=kidneyBox.getSize(new T.Vector3()),ktSize=kidneyTarget.getSize(new T.Vector3());
  const kpScale=new T.Vector3(ktSize.x/kpSize.x,ktSize.y/kpSize.y,ktSize.z/kpSize.z);
  const kpMatrix=new T.Matrix4().compose(kidneyTarget.getCenter(new T.Vector3()).sub(kidneyBox.getCenter(new T.Vector3()).multiply(kpScale)),new T.Quaternion(),kpScale);
  replace('Kidney.'+side,[kidney.applyMatrix4(kpMatrix)],'hra-kidney');
  replace('Renal pelvis.'+side,[pelvis.applyMatrix4(kpMatrix)],'hra-kidney');
  // The other publisher's body uses a different placement. Register each ear
  // to this atlas on four anatomical landmarks; do not assume equal frames.
  const landmarks=['Malleus','Incus','Stapes','Tympanic membrane'];
  const sourcePoints=landmarks.map(name=>centerOf([{geometry:registered(name==='Tympanic membrane'?external.ear:external.ossicles,meshesOfNames([name+'.'+side]))}]));
  const targetPoints=landmarks.map(name=>registry.get(name+'.'+side).originalBounds.getCenter(new T.Vector3()));
  const placement=similarity(sourcePoints,targetPoints);
  replace('Cochlea.'+side,[registered(external.ear,meshesOfNames(['Scala tympani.'+side,'Scala vestibuli.'+side])).applyMatrix4(placement)],'openear-delta');
  replace('Vestibule.'+side,[registered(external.ear,meshesOfNames(['Vestibule.'+side,'Anterior semicircular canal.'+side,'Lateral semicircular canal.'+side,'Posterior semicircular canal.'+side,'Common bony limb.'+side])).applyMatrix4(placement)],'openear-delta');
  replace('Tympanic membrane.'+side,[registered(external.ear,meshesOfNames(['Tympanic membrane.'+side])).applyMatrix4(placement)],'openear-delta');
  for(const bone of ['Incus','Malleus','Stapes'])replace(bone+'.'+side,[registered(external.ossicles,meshesOfNames([bone+'.'+side])).applyMatrix4(placement)],'openear-delta');
}
// Read only actual OBJ vertices/faces from DBCLS's public 4.3 download endpoint.
const bp=[];
for(const dir of ['bp43','bp43-renal','bp43-ureters'])for(const file of await fs.readdir(path.join(inputs,dir))){
  if(!file.endsWith('.obj'))continue;
  const data=await fs.readFile(path.join(inputs,dir,file)),text=data.toString(),name=text.match(/# English name : (.+)/)?.[1],vertices=[],faces=[];
  for(const line of text.split(/\r?\n/))if(line.startsWith('v ')){const[x,y,z]=line.slice(2).trim().split(/\s+/).map(Number);vertices.push(x/1000,z/1000,-y/1000);}else if(line.startsWith('f ')){const ids=line.slice(2).trim().split(/\s+/).map(v=>Number(v.split('/')[0])-1);for(let i=1;i<ids.length-1;i++)faces.push(ids[0],ids[i],ids[i+1]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();
  bp.push({file,name,geometry:g,center:centerOf([{geometry:g}]),sha256:hash(data),fj:text.match(/# File ID : (.+)/)?.[1]});
}
const clean=s=>s.toLowerCase().replace(/\([ivx]+\)/g,'').replace(/\b(left|right|trunk of)\b/g,'').replace(/[^a-z]/g,'');
const aliases={'Nerve to mylohyoid muscle':'mylohyoid nerve'};
function bpMatches(name,side){
  const base=clean(aliases[name]||name),all=bp.filter(x=>clean(x.name)===base);
  // Side is a source label, not the mean X coordinate: the vagus crosses the
  // midline in the abdomen. The source glossopharyngeal pair has two "Left"
  // headers, so only that documented anomaly uses the anatomical coordinate.
  if(base===clean('Glossopharyngeal nerve'))return all.filter(x=>side==='l'?x.center.x>0:x.center.x<0);
  return all.filter(x=>new RegExp('\\b'+(side==='l'?'left':'right')+'\\b','i').test(x.name));
}
function choose(name,side){
  const matches=bpMatches(name,side);if(!matches.length)throw Error('No DBCLS source for '+name+'.'+side);
  // Different FJ components with the same BP representation are all retained.
  const latest=matches.reduce((a,b)=>parseInt(a.fj.slice(2))>parseInt(b.fj.slice(2))?a:b);
  const bpId=latest.file.match(/_(BP\d+)_/)[1];return matches.filter(x=>x.file.includes('_'+bpId+'_'));
}
// Translation fitted to the two optic nerves; no legacy surface is traced.
const shifts=['l','r'].map(side=>centerOf(registry.get('Optic nerve (II).'+side).shapes).sub(centerOf(choose('Optic nerve',side).map(x=>({geometry:x.geometry})))));
const shift=shifts[0].add(shifts[1]).multiplyScalar(.5);
const moved=x=>x.geometry.clone().translate(shift.x,shift.y,shift.z);
report.sources.bodyparts43={publisher:'DBCLS / BodyParts3D',version:'4.3',endpoint:'https://lifesciencedb.jp/bp3d/download.cgi',licenseEvidence:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',legacyLicense:'CC-BY-SA-2.1-JP',translation:shift.toArray(),components:[]};
const cranialRegistration=await json(path.join(output,'data/cranial-registration.json'));
const cranialMatrix=new T.Matrix4().fromArray(cranialRegistration.matrix);
report.sources.bodyparts43.cranialRegistration=cranialRegistration;
function useBP(id,name,side){
  let list=choose(name,side);
  const facial=name==='Facial nerve (VII)',accessory=name==='Accessory nerve (XI)';
  if(facial){
    // VII is a tree, not just its short trunk. Keep the six source components
    // together in their shared frame instead of stretching the trunk to a tree.
    const word=side==='l'?'left':'right';
    list=bp.filter(x=>/facial nerve$/i.test(x.name)&&new RegExp('\\b'+word+'\\b','i').test(x.name));
    if(list.length!==6)throw Error('Incomplete facial nerve source family: '+id);
  }
  const geometry=(facial||accessory)?list.map(x=>bakeGeometryTransform(x.geometry.clone(),cranialMatrix)):fitBounds(list.map(x=>x.geometry),registry.get(id).originalBounds);
  const note=facial?'Six complete DBCLS facial-nerve components, placed together using a shared six-bone cranial registration. No per-component extent stretch.':accessory?'DBCLS accessory-nerve trunk at its source proportions, placed using the shared six-bone cranial registration. It is not stretched into the larger legacy terminal-branch extent.':'';
  replace(id,geometry,'bodyparts3d-4.3',{note});
  report.sources.bodyparts43.components.push(...list.map(x=>({file:x.file,sha256:x.sha256,sourceName:x.name,partId:id})));
}
for(const side of ['l','r'])useBP('Ureter.'+side,'Ureter',side);
const cranial=new Set(catalog.structures.filter(s=>s.asset==='z-anatomy-dundee-cranial-nerves').map(s=>s.source?.object).filter(x=>registry.has(x)));
for(const side of ['l','r'])cranial.add('Accessory nerve (XI).'+side);
const schematicBases=['Motor root of trigeminal nerve','Sensory root of trigeminal nerve','Anterior division of mandibular nerve','Posterior division of mandibular nerve','Meningeal branch of maxillary nerve'];
const pending=[];
for(const id of cranial){
  const side=id.endsWith('.l')?'l':'r',base=id.replace(/\.[lr]$/,'');
  if(schematicBases.includes(base)||['Chorda tympani','Cochlear nerve','Vestibular nerve'].includes(base)){pending.push({id,side,base});continue;}
  useBP(id,base,side);
}
const bpCenter=(base,side)=>{
  const found=[...registry.values()].find(x=>x.id.endsWith('.'+side)&&clean(x.id.slice(0,-2))===clean(base));
  if(found)return centerOf(found.shapes);
  if(base.toLowerCase()==='mandibular nerve')return registry.get('Posterior division of mandibular nerve.'+side).originalBounds.getCenter(new T.Vector3());
  return centerOf(choose(base,side).map(x=>({geometry:moved(x)})));
};
const tube=(points,radius=.00065)=>new T.TubeGeometry(new T.CatmullRomCurve3(points),18,radius,7,false);
for(const {id,side,base}of pending.filter(x=>schematicBases.includes(x.base))){
  const sign=side==='l'?1:-1;
  let a=bpCenter('Trigeminal nerve',side),b=bpCenter('maxillary nerve',side);
  if(base.includes('mandibular')){a=bpCenter('mandibular nerve',side);b=bpCenter(base.startsWith('Anterior')?'Buccal nerve':'Lingual nerve',side);}
  if(base.startsWith('Motor')){a.add(new T.Vector3(-.006*sign,0,-.008));b=bpCenter('mandibular nerve',side);}
  if(base.startsWith('Sensory')){a.add(new T.Vector3(-.007*sign,.001,-.009));b=bpCenter('Trigeminal nerve',side);}
  if(base.startsWith('Meningeal')){a=bpCenter('maxillary nerve',side);b=a.clone().add(new T.Vector3(.004*sign,.007,-.003));}
  const mid=a.clone().lerp(b,.5).add(new T.Vector3(sign*.001,.0005,0));
  replace(id,[tube([a,mid,b],base.startsWith('Motor')?.0005:.0007)],'elementarium-authored',{schematic:true,note:'New illustrative nerve course between DBCLS 4.3 anatomical landmarks; not a measured segmentation. No legacy CAHID geometry is used.'});
}
// Fit the openly licensed ZETA nerve segment to the independently registered
// Delta ear using ossicle and tympanic-membrane centroids (Horn's quaternion fit).
const zeta=await io.read(path.join(inputs,'openear-zeta.glb'));await zeta.transform(dequantize());
const zetaShapes=new Map();for(const n of zeta.getRoot().listNodes())if(n.getMesh())zetaShapes.set(n.getName(),n.getMesh().listPrimitives().map(p=>({geometry:shape(p,n)})));
function similarity(source,target){
  const ca=new T.Vector3(),cb=new T.Vector3();source.forEach(p=>ca.add(p));target.forEach(p=>cb.add(p));ca.multiplyScalar(1/source.length);cb.multiplyScalar(1/target.length);
  const S=Array.from({length:3},()=>[0,0,0]);let variance=0;
  for(let k=0;k<source.length;k++){const a=source[k].clone().sub(ca).toArray(),b=target[k].clone().sub(cb).toArray();variance+=a.reduce((sum,v)=>sum+v*v,0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)S[i][j]+=a[i]*b[j];}
  const [[xx,xy,xz],[yx,yy,yz],[zx,zy,zz]]=S,trace=xx+yy+zz;
  const N=[[trace,yz-zy,zx-xz,xy-yx],[yz-zy,xx-yy-zz,xy+yx,zx+xz],[zx-xz,xy+yx,-xx+yy-zz,yz+zy],[xy-yx,zx+xz,yz+zy,-xx-yy+zz]];
  const bound=Math.max(...N.map(r=>r.reduce((a,b)=>a+Math.abs(b),0)));let q=[1,0,0,0];
  for(let k=0;k<120;k++){const n=N.map((r,i)=>r.reduce((s,v,j)=>s+v*q[j],0)+bound*q[i]),len=Math.hypot(...n);q=n.map(v=>v/len);}
  const rotation=new T.Quaternion(q[1],q[2],q[3],q[0]).normalize();let numerator=0;
  source.forEach((p,i)=>{numerator+=p.clone().sub(ca).applyQuaternion(rotation).dot(target[i].clone().sub(cb));});
  const scale=numerator/variance,matrix=new T.Matrix4().compose(cb.clone().sub(ca.clone().applyQuaternion(rotation).multiplyScalar(scale)),rotation,new T.Vector3(scale,scale,scale));return matrix;
}
const sourceLandmarks=['Malleus','Incus','Stapes','Tympanic Membrane'].map(n=>centerOf(zetaShapes.get(n)));
const targetLandmarks=['Malleus.r','Incus.r','Stapes.r','Tympanic membrane.r'].map(n=>centerOf(registry.get(n).shapes));
const earMatrix=similarity(sourceLandmarks,targetLandmarks);
const zetaData=await fs.readFile(path.join(inputs,'openear-zeta.glb'));
report.sources['openear-zeta']={sha256:hash(zetaData),url:'https://opentwin.opening.science/models/openear-zeta.glb',original:'https://doi.org/10.5281/zenodo.1473724',license:'CC-BY-4.0',adapter:'Open Twin XR contributors',registration:earMatrix.toArray()};
for(const {id,side,base}of pending.filter(x=>!schematicBases.includes(x.base))){
  const geometries=zetaShapes.get(base==='Chorda tympani'?'Chorda Tympani':'Cochleovestibular Nerve').map(({geometry:g})=>g.clone().applyMatrix4(earMatrix));
  if(side==='l')for(const g of geometries){g.scale(-1,1,1);const arr=g.index.array;for(let i=0;i<arr.length;i+=3){const t=arr[i];arr[i]=arr[i+1];arr[i+1]=t;}g.computeVertexNormals();}
  if(base==='Chorda tympani'){replace(id,fitBounds(geometries,registry.get(id).originalBounds),'openear-zeta');continue;}
  const target=centerOf(registry.get((base==='Cochlear nerve'?'Cochlea.':'Vestibule.')+side).shapes);
  const parent=registry.get('Vestibulocochlear nerve (VIII).'+side);
  let nearest=null,distance=Infinity;
  for(const {geometry:g}of parent.shapes)for(let i=0;i<g.attributes.position.count;i++){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,i),d=v.distanceToSquared(target);if(d<distance){distance=d;nearest=v;}}
  const mid=nearest.clone().lerp(target,.5).add(new T.Vector3(0,.0008,0));
  replace(id,[tube([nearest,mid,target],.00045)],'elementarium-authored',{schematic:true,note:'New illustrative cochlear/vestibular nerve course between the DBCLS VIII-nerve and registered OpenEar organ landmarks; not a separately measured segmentation. No legacy CAHID geometry is used.'});
}
// Replace potentially kidney-derived intrarenal geometry, while keeping every
// original selectable ID. Official renal divisions are independent source data.
for(const entry of registry.values())if(/^Intrarenal (arteries|veins) of (left|right) kidney$/i.test(entry.id)){
  const side=/left/i.test(entry.id)?'l':'r',arterial=/arteries/i.test(entry.id);
  const selected=bp.filter(x=>(side==='l'?x.center.x>0:x.center.x<0)&& (arterial?/^(Anterior|Posterior) division of .* renal artery$/i.test(x.name):/renal vein$/i.test(x.name)));
  if(!selected.length)throw Error('Renal replacement missing '+entry.id);
  replace(entry.id,fitBounds(selected.map(x=>x.geometry),entry.originalBounds),'bodyparts3d-4.3');report.sources.bodyparts43.components.push(...selected.map(x=>({file:x.file,sha256:x.sha256,partId:entry.id})));
}
for(const id of cranial)if(registry.get(id).source==='z-anatomy')throw Error('Unreplaced CAHID candidate '+id);
const registeredCopyright='Z-Anatomy — Gauthier Kervyn and contributors, CC BY-SA 4.0; BodyParts3D, © The Database Center for Life Science; Brain for Blender — Anderson M. Winkler, CC BY-SA 3.0; OpenEar — Sieber et al., CC BY 4.0; HRA — Browne, Schlehlein and HuBMAP, CC BY 4.0; registered data adaptations — authorOd / Svitylo, CC BY 4.0; Open Twin XR OpenEar adaptation, CC BY 4.0; Elementarium adaptations, CC BY-SA 4.0.';
for(const system of Object.keys(systems)){
  const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene(system),nodes=new Map(),materials=new Map();let triangleCount=0;
  doc.getRoot().getAsset().copyright=registeredCopyright;doc.getRoot().getAsset().extras={license:'CC-BY-SA-4.0',provenance:'model-provenance.json',version:'3.3.0'};
  for(const id of systems[system])nodes.set(id,doc.createNode(id).setExtras({za_name:id,license:'CC-BY-SA-4.0',source:registry.get(id).source,schematic:!!registry.get(id).schematic}));
  for(const id of systems[system]){
    const entry=registry.get(id),owner=nodes.get(id),parent=nodes.get(entry.parent);(parent||scene).addChild(owner);
    for(const [index,{geometry:g,material:old,color}]of entry.shapes.entries()){
      // Identity avoids merging distinct source materials with equal names.
      // An omitted glTF material has white/metallic/rough defaults, not beige.
      const key=color||old||null;let material=materials.get(key);
      if(!material){const c=color?new T.Color(color):null;material=doc.createMaterial(color||old?.getName()||'glTF default').setBaseColorFactor(c?[c.r,c.g,c.b,1]:(old?.getBaseColorFactor()||[1,1,1,1])).setMetallicFactor(old?.getMetallicFactor()??(color ? 0 : 1)).setRoughnessFactor(old?.getRoughnessFactor()??(color ? 0.72 : 1)).setDoubleSided(old?.getDoubleSided()||false).setAlphaMode(old?.getAlphaMode()||'OPAQUE').setAlphaCutoff(old?.getAlphaCutoff()??.5).setEmissiveFactor(old?.getEmissiveFactor()||[0,0,0]);materials.set(key,material);}
      const primitive=doc.createPrimitive().setMaterial(material);
      for(const [from,to]of [['position','POSITION'],['normal','NORMAL']])primitive.setAttribute(to,doc.createAccessor().setType('VEC3').setArray(g.attributes[from].array.slice()).setBuffer(buffer));
      primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(g.index.array.slice()).setBuffer(buffer));
      owner.addChild(doc.createNode(id+' surface '+index).setMesh(doc.createMesh(id).addPrimitive(primitive)));triangleCount+=g.index.count/3;
    }
    if(!entry.shapes.length&&!systems[system].some(x=>registry.get(x).parent===id))throw Error('Empty original part '+id);
    const sourceRecord=fromSource.get(id);
    const bounds=boxOf(entry.shapes);
    report.parts[id]={system,source:entry.source==='z-anatomy'&&sourceRecord?.asset==='brainder'?'brain-for-blender-and-z-anatomy':entry.source,license:'CC-BY-SA-4.0',schematic:!!entry.schematic,note:entry.note||'',surfaceCount:entry.shapes.length,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},originalBounds:{min:entry.originalBounds.min.toArray(),max:entry.originalBounds.max.toArray()}};
  }
  await doc.transform(weld(),dedup(),prune());doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({method:KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,quantizationBits:{POSITION:16,NORMAL:12}});
  await io.write(path.join(output,'models',system+'.glb'),doc);report.systems.push({system,structures:systems[system].length,triangles:triangleCount});console.log(system,systems[system].length,'structures',triangleCount,'triangles');
}
if(Object.keys(report.parts).length!==2827)throw Error('Original coverage not restored');
await fs.writeFile(path.join(output,'models/model-provenance.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(output,'models/build-report.json'),JSON.stringify(report.systems,null,2)+'\n');
await fs.writeFile(path.join(output,'data/systems.json'),JSON.stringify(systems,null,2)+'\n');
await fs.writeFile(path.join(output,'data/geometry-notes.json'),JSON.stringify(Object.fromEntries([...registry].filter(([,x])=>x.schematic).map(([id,x])=>[id,{schematic:true,note:x.note}])),null,2)+'\n');
console.log('Restored all 2827 original selectable structures. Authored/partitioned illustrative courses:',report.schematicParts.length);
