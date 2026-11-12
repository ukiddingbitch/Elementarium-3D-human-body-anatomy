export function initSpiral(elements,show,cat){
const spiralSvg=document.getElementById('spiral-svg');
const NS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,parent=spiralSvg){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));parent.appendChild(node);return node}
spiralSvg.setAttribute('viewBox','0 0 1000 1500');
spiralSvg.setAttribute('aria-label','Programmatically drawn interactive Russell-inspired wavelength spiral');
const defs=svgEl('defs',{});
const grad=svgEl('linearGradient',{id:'wavefill',x1:'0%',y1:'0%',x2:'100%',y2:'0%'},defs);
[['0%','#50d9f3'],['24%','#b6d6ff'],['48%','#9e7adf'],['72%','#e89dce'],['100%','#ffbd8b']].forEach(([offset,color])=>svgEl('stop',{offset,'stop-color':color},grad));
const glow=svgEl('radialGradient',{id:'orbfill'},defs);svgEl('stop',{offset:'0%','stop-color':'#f4f9ff'},glow);svgEl('stop',{offset:'100%','stop-color':'#24bbd7'},glow);
svgEl('rect',{x:0,y:0,width:1000,height:1500,rx:16,fill:'#101b30'});
const title=svgEl('text',{x:500,y:37,'text-anchor':'middle',fill:'#e4edff','font-size':23,'font-weight':800});title.textContent='PERIODIC TABLE OF ELEMENTS';
const subtitle=svgEl('text',{x:500,y:59,'text-anchor':'middle',fill:'#9bb8dd','font-size':13});subtitle.textContent='BASED ON THE WAVELENGTH-SPIRAL · VECTOR RECONSTRUCTION';
// Historic octave bands; these are not physical atomic-frequency intervals.
const octaves=[{a:83,b:210,name:'1st–4th Octaves'},{a:210,b:375,name:'5th Octave'},{a:375,b:560,name:'6th Octave'},{a:560,b:785,name:'7th Octave'},{a:785,b:1080,name:'8th Octave'},{a:1080,b:1440,name:'9th Octave'}];
octaves.forEach((o,i)=>{svgEl('rect',{x:265,y:o.a,width:470,height:o.b-o.a,fill:i%2?'#6d78cb':'#4b83ca','fill-opacity':'.12'});svgEl('line',{x1:265,x2:735,y1:o.a,y2:o.a,stroke:'#9aabd4','stroke-dasharray':'5 7','stroke-opacity':'.28'});const t=svgEl('text',{x:715,y:o.a+22,'text-anchor':'end',fill:'#a9a4ed','font-size':17,'font-weight':700});t.textContent=o.name});
svgEl('line',{x1:500,x2:500,y1:82,y2:1450,stroke:'#c9d9f2','stroke-width':1,'stroke-dasharray':'5 6','stroke-opacity':'.4'});
// Alternating, progressively wider lobes, following the visual rhythm of the reference.
const lobes=[{cy:144,ry:51,rx:32,dir:1},{cy:280,ry:80,rx:92,dir:-1},{cy:454,ry:104,rx:142,dir:1},{cy:680,ry:133,rx:186,dir:-1},{cy:1001,ry:177,rx:220,dir:1},{cy:1270,ry:151,rx:224,dir:-1}];
lobes.forEach((o,i)=>{
 const start=o.cy-o.ry,end=o.cy+o.ry;
 const x=y=>500+o.dir*o.rx*Math.pow(Math.max(0,1-Math.pow((y-o.cy)/o.ry,2)),.57);
 const left=[],right=[],mid=[];for(let j=0;j<=100;j++){const y=start+(end-start)*j/100;left.push([x(y)-20,y]);right.push([x(y)+20,y]);mid.push([x(y),y])}
 const path=pts=>pts.map((v,k)=>(k?'L':'M')+v[0].toFixed(1)+' '+v[1].toFixed(1)).join(' ');
 svgEl('path',{d:path(left)+' '+path(right.reverse()).replace('M','L')+' Z',fill:'url(#wavefill)','fill-opacity':'.65',stroke:'#bdc6ff','stroke-opacity':'.5','stroke-width':1.6});
 svgEl('path',{d:path(mid),fill:'none',stroke:'#4d326b','stroke-width':2.2});
 for(let j=1;j<=4;j++){let yy=start+(end-start)*j/5;svgEl('line',{x1:500,x2:x(yy),y1:yy,y2:yy,stroke:'#d2dafa','stroke-opacity':'.32','stroke-dasharray':'3 5'});const t=svgEl('text',{x:x(yy)+o.dir*27,y:yy-5,'text-anchor':'middle',fill:'#e9ddff','font-size':12});t.textContent=j+'+'}
 const c=svgEl('text',{x:500+o.dir*o.rx*.52,y:o.cy-9,'text-anchor':'middle',fill:'#26334f','font-size':13,'font-weight':800});c.textContent=i%2?'DISCHARGING':'CHARGING';const c2=svgEl('text',{x:500+o.dir*o.rx*.52,y:o.cy+7,'text-anchor':'middle',fill:'#26334f','font-size':12,'font-weight':800});c2.textContent='SYSTEMS';
 for(let j=0;j<3;j++){const yy=start+15+j*15;svgEl('circle',{cx:x(yy),cy:yy,r:8+j*2,fill:'url(#orbfill)',stroke:'#b8f5ff','stroke-opacity':'.5'})}
});
// Individual SVG labels, markers and hit targets. No raster image is embedded.
const segments=[{lo:1,hi:2,y1:90,y2:135,side:'right'},{lo:3,hi:10,y1:166,y2:260,side:'left'},{lo:11,hi:18,y1:275,y2:360,side:'right'},{lo:19,hi:36,y1:382,y2:560,side:'left'},{lo:37,hi:54,y1:566,y2:765,side:'right'},{lo:55,hi:86,y1:788,y2:1129,side:'left'},{lo:87,hi:118,y1:1141,y2:1443,side:'right'}];
const symbolNames={};elements.forEach(e=>symbolNames[e.n]=e.s);
segments.forEach(seg=>{const side=seg.side==='left'?-1:1;const count=seg.hi-seg.lo+1;for(let k=0;k<count;k++){
 const n=seg.lo+k,y=seg.y1+(seg.y2-seg.y1)*(k+.5)/count;
 const wobble=lobes.reduce((acc,o)=>{let v=1-Math.pow((y-o.cy)/o.ry,2);return v>0?500+o.dir*o.rx*Math.pow(v,.57):acc},500);
 const anchor=side<0?235:762;const nodeX=side<0?anchor+11:anchor-11;const nearX=Math.max(265,Math.min(735,wobble));
 svgEl('line',{x1:nearX,y1:y,x2:nodeX,y2:y,stroke:'#99b6df','stroke-opacity':'.33','stroke-width':1});
 const g=svgEl('g',{class:'spiral-node','data-n':n,role:'button',tabindex:0,'aria-label':'Select '+symbolNames[n]+' ('+n+')'});
 svgEl('circle',{cx:nodeX,cy:y,r:4.7,fill:cat(n)==='noble'?'#c59afa':cat(n)==='alkali'?'#efb28d':'#50cfe3'},g);
 const label=svgEl('text',{x:anchor,y:y+3.8,'text-anchor':side<0?'end':'start',fill:'#ecf3ff','font-size':count>25?11.5:13,'font-weight':600},g);label.textContent=n+'  '+symbolNames[n];
 svgEl('rect',{x:side<0?anchor-135:anchor-6,y:y-7,width:141,height:14,fill:'transparent'},g);
 svgEl('title',{},g).textContent=n+' · '+symbolNames[n];g.addEventListener('click',()=>show(n));g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();show(n)}});
 }});
const legend=svgEl('text',{x:500,y:1482,'text-anchor':'middle',fill:'#8ea5c8','font-size':11});legend.textContent='Historical wavelength-octave concept · not a measured spectrum or accepted atomic model';

}
