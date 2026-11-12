const path=require('node:path');
const ORIGIN='elementarium://app';
const HOME=ORIGIN+'/shell.html';
const TABLE=ORIGIN+'/content/index.html';
const ATLAS=ORIGIN+'/content/anatomy/index.html#sys=skeletal&lang=sk';
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.wasm':'application/wasm','.glb':'model/gltf-binary','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
// Upstream license files intentionally retain their extensionless names.
MIME['']='text/plain; charset=utf-8';
function isLocal(value){try{const u=new URL(value);return u.protocol==='elementarium:'&&u.hostname==='app'&&!u.port&&!u.username&&!u.password;}catch{return false;}}
function isAtlas(value){if(!isLocal(value))return false;return new URL(value).pathname==='/content/anatomy/index.html';}
function resolveAsset(root,value){
  if(!isLocal(value))return null;
  let pathname;try{pathname=decodeURIComponent(new URL(value).pathname);}catch{return null;}
  if(!['/shell.html','/shell.css','/shell.js'].includes(pathname)&&!pathname.startsWith('/content/'))return null;
  if(pathname.includes('\0')||pathname.includes('\\'))return null;
  if(pathname.split('/').includes('..'))return null;
  if(pathname.endsWith('/'))pathname+='index.html';
  const candidate=path.resolve(root,'.'+pathname),relative=path.relative(root,candidate);
  return !relative.startsWith('..')&&!path.isAbsolute(relative)?candidate:null;
}
function isLicense(value){if(!isLocal(value))return false;const p=new URL(value).pathname;return p==='/content/licenses.html'||/^\/content\/licenses\/[A-Za-z0-9_.-]+$/.test(p)||p==='/content/anatomy/models/License.txt';}
function externalURL(value){try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)return null;const allowed=['pubchem.ncbi.nlm.nih.gov','physics.nist.gov','en.wikipedia.org','www.z-anatomy.com','lifesciencedb.jp','dbarchive.biosciencedbc.jp','creativecommons.org','github.com'];return allowed.includes(url.hostname)?url.href:null;}catch{return null;}}
module.exports={ORIGIN,HOME,TABLE,ATLAS,MIME,isLocal,isAtlas,isLicense,resolveAsset,externalURL};
