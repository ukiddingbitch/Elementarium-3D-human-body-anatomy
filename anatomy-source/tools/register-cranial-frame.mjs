import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
const cache=path.resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Usage: node tools/register-cranial-frame.mjs /path/to/input-cache');
const folder=path.join(cache,'bp43-head-anchors');
const output=new URL('../public/data/cranial-registration.json',import.meta.url);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const sourceFiles=await fs.readdir(folder);
function similarity(a,b){
  const ca=new T.Vector3(),cb=new T.Vector3();a.forEach(p=>ca.add(p));b.forEach(p=>cb.add(p));ca.divideScalar(a.length);cb.divideScalar(b.length);
  const S=[[0,0,0],[0,0,0],[0,0,0]];let variance=0;
  a.forEach((p,k)=>{const u=p.clone().sub(ca).toArray(),v=b[k].clone().sub(cb).toArray();variance+=u.reduce((s,n)=>s+n*n,0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)S[i][j]+=u[i]*v[j];});
  const [[xx,xy,xz],[yx,yy,yz],[zx,zy,zz]]=S,t=xx+yy+zz;
  const N=[[t,yz-zy,zx-xz,xy-yx],[yz-zy,xx-yy-zz,xy+yx,zx+xz],[zx-xz,xy+yx,-xx+yy-zz,yz+zy],[xy-yx,zx+xz,yz+zy,-xx-yy+zz]],bound=Math.max(...N.map(row=>row.reduce((s,v)=>s+Math.abs(v),0)));let q=[1,0,0,0];
  for(let i=0;i<180;i++){const v=N.map((row,k)=>row.reduce((s,n,j)=>s+n*q[j],0)+bound*q[k]),length=Math.hypot(...v);q=v.map(n=>n/length);}
  const rotation=new T.Quaternion(q[1],q[2],q[3],q[0]).normalize();let numerator=0;
  a.forEach((p,i)=>{numerator+=p.clone().sub(ca).applyQuaternion(rotation).dot(b[i].clone().sub(cb));});
  const scale=numerator/variance;
  return new T.Matrix4().compose(cb.clone().sub(ca.clone().applyQuaternion(rotation).multiplyScalar(scale)),rotation,new T.Vector3(scale,scale,scale));
}
const source=async name=>{
  const file=sourceFiles.filter(f=>f.endsWith('_'+name+'.obj')).sort((a,b)=>parseInt(a.slice(2))-parseInt(b.slice(2)))[0];if(!file)throw Error('Missing source '+name);
  const bytes=await fs.readFile(path.join(folder,file)),positions=[];
  for(const line of bytes.toString().split(/\r?\n/))if(line.startsWith('v ')){const[x,y,z]=line.slice(2).trim().split(/\s+/).map(Number);positions.push(new T.Vector3(x/1000,z/1000,-y/1000));}
  return{file,points:positions,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
};
const skeletal=await io.read(path.join(cache,'original/models/skeletal.glb'));
const target=name=>{
  const owner=skeletal.getRoot().listNodes().find(n=>n.getExtras().za_name===name);if(!owner)throw Error('Missing target '+name);
  const positions=[];
  function walk(node){if(node!==owner&&node.getExtras().za_name)return;
    for(const primitive of node.getMesh()?.listPrimitives()||[]){const a=primitive.getAttribute('POSITION').getArray(),index=primitive.getIndices().getArray(),m=new T.Matrix4().fromArray(node.getWorldMatrix());for(const id of index){const p=new T.Vector3(a[id*3],a[id*3+1],a[id*3+2]).applyMatrix4(m);positions.push(...p.toArray());}}
    node.listChildren().forEach(walk);
  }walk(owner);
  const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeBoundingBox();
  return{geometry,box:geometry.boundingBox,bvh:new MeshBVH(geometry)};
};
const pairs=[['Left temporal bone','Temporal bone.l'],['Right temporal bone','Temporal bone.r'],['Occipital bone','Occipital bone'],['Mandible','Mandible'],['Atlas','Atlas (C1)'],['Axis','Axis (C2)']];
const anchors=[];
for(const [from,to]of pairs){const s=await source(from),t=target(to);const box=new T.Box3().setFromPoints(s.points);anchors.push({...s,...t,from,to,sourceBox:box,samples:s.points.filter((_,i)=>i%Math.max(1,Math.floor(s.points.length/700))===0)});}
let matrix=similarity(anchors.map(a=>a.sourceBox.getCenter(new T.Vector3())),anchors.map(a=>a.box.getCenter(new T.Vector3())));
const history=[];
for(let iteration=0;iteration<45;iteration++){
  const from=[],to=[];let squared=0,count=0;
  for(const a of anchors){
    const matches=a.samples.map(p=>{const moved=p.clone().applyMatrix4(matrix),result={};a.bvh.closestPointToPoint(moved,result);return{source:p,target:result.point.clone(),distance:result.distance};}).sort((a,b)=>a.distance-b.distance);
    for(const m of matches.slice(0,Math.floor(matches.length*.85))){from.push(m.source);to.push(m.target);squared+=m.distance*m.distance;count++;}
  }
  const next=similarity(from,to);history.push(Math.sqrt(squared/count));matrix=next;
}
const measurements=anchors.map(a=>{
  const distances=a.samples.map(p=>{const result={};a.bvh.closestPointToPoint(p.clone().applyMatrix4(matrix),result);return result.distance;}).sort((a,b)=>a-b);
  return{source:a.from,target:a.to,file:a.file,sha256:a.sha256,samples:distances.length,medianMetres:distances[Math.floor(distances.length*.5)],p90Metres:distances[Math.floor(distances.length*.9)]};
});
const result={method:'One rigid similarity transform fitted to six separately identified skeletal anchors, followed by trimmed label-preserving closest-surface refinement. No per-nerve bounding-box stretch.',matrix:matrix.toArray(),uniformScale:new T.Vector3().setFromMatrixScale(matrix).x,anchors:measurements,fitRmsHistoryMetres:history};
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
