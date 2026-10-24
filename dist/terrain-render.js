import{shapeBounds}from'./drawing.js?v=terrain-1';
// The drawings use the saved primitive geometry, so edits scale every detail.
function smooth(points,closed){
 if(points.length<3)return'M'+points.map(p=>p.x+' '+p.y).join('L');
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 if(closed){const start=mid(points.at(-1),points[0]);return'M'+start.x+' '+start.y+points.map((p,i)=>{const q=mid(p,points[(i+1)%points.length]);return`Q${p.x} ${p.y} ${q.x} ${q.y}`;}).join('')+'Z';}
 return'M'+points[0].x+' '+points[0].y+points.slice(1,-1).map((p,i)=>{const q=mid(p,points[i+2]);return`Q${p.x} ${p.y} ${q.x} ${q.y}`;}).join('')+'L'+points.at(-1).x+' '+points.at(-1).y;
}
export function makeTerrain(sh,svg){
 const g=svg('g',{'data-terrain':sh.terrain}),b=shapeBounds(sh),cx=b.x+b.w/2,cy=b.y+b.h/2;
 const add=(tag,a)=>g.append(svg(tag,a)),path=(d,a)=>add('path',{d,...a});
 const ringPath=(smoothly=false)=>sh.rings.map(r=>smoothly?smooth(r,true):'M'+r.map(p=>p.x+' '+p.y).join('L')+'Z').join('');
 const ellipse=(x,y,rx,ry,a)=>add('ellipse',{cx:x,cy:y,rx,ry,...a});
 if(sh.terrain==='tree'){
  ellipse(cx+1,cy+b.h*.1,b.w*.47,b.h*.43,{fill:'#253f2524'});
  const lobes=[[-.17,.08,.32,.35,'#73965b'],[.17,.04,.31,.34,'#87a86b'],[-.04,-.18,.34,.30,'#a2bd7b']];
  for(const[x,y,rx,ry,fill]of lobes)ellipse(cx+x*b.w,cy+y*b.h,rx*b.w,ry*b.h,{fill,stroke:'#526d3c','stroke-width':2});
  path(`M${cx} ${cy+b.h*.32}v${-b.h*.35}m0 ${b.h*.18}l${-b.w*.16} ${-b.h*.17}m${b.w*.16} ${b.h*.1}l${b.w*.16} ${-b.h*.17}`,{fill:'none',stroke:'#567740','stroke-width':2,'stroke-linecap':'round',opacity:.6});
 }else if(sh.terrain==='sand'){
  path(ringPath(),{fill:'#e6cf92',stroke:'#c5a66e','stroke-width':2,'fill-opacity':.8});
  const points=sh.rings[0];for(let i=0;i<points.length;i+=2){const p=points[i],x=p.x*.78+cx*.22,y=p.y*.78+cy*.22;path(`M${x} ${y}h3m5 4h2`,{stroke:'#b89c67','stroke-width':1.5,opacity:.55});}
 }else if(sh.terrain==='ground-path'){
  path(ringPath(),{fill:'#c9b48d',stroke:'#a58d69','stroke-width':1.3,'fill-opacity':.65});
 }else if(sh.terrain==='mountain'){
  path(ringPath(),{fill:'#969c92',stroke:'#626e67','stroke-width':3,'stroke-linejoin':'round'});
  for(const p of sh.rings[0].filter((_,i)=>i%2===0))path(`M${p.x} ${p.y}L${cx} ${cy}`,{fill:'none',stroke:'#717c73','stroke-width':2});
  path(`M${cx-b.w*.2} ${cy+b.h*.05}L${cx} ${cy-b.h*.22}L${cx+b.w*.18} ${cy+b.h*.03}L${cx+b.w*.04} ${cy-b.h*.03}L${cx-b.w*.03} ${cy-b.h*.08}Z`,{fill:'#d2d4c9',stroke:'#adb5a8','stroke-width':1.2});
 }else if(sh.terrain==='rock'){
  path(ringPath(),{fill:'#a8a9a0',stroke:'#686d65','stroke-width':3,'stroke-linejoin':'round'});
  const points=sh.rings[0],p=points[0],q=points[Math.floor(points.length/2)];path(`M${p.x} ${p.y}L${cx} ${cy}L${q.x} ${q.y}`,{fill:'none',stroke:'#7a8077','stroke-width':2});
  path(`M${cx} ${cy}L${cx+b.w*.14} ${b.y+b.h*.18}`,{fill:'none',stroke:'#d1d2c8','stroke-width':3});
 }else if(sh.terrain==='water'){
  path(ringPath(),{fill:'#83b8bf',stroke:'#548d98','stroke-width':3,'fill-opacity':.85});
  const r=sh.rings[0],half=r.length/2;
  for(let i=2;i<half-2;i+=3){const a=r[i],c=r[r.length-1-i],x=(a.x+c.x)/2,y=(a.y+c.y)/2;path(`M${x-10} ${y}q10 -5 20 0t20 0`,{fill:'none',stroke:'#d6e6d9','stroke-width':2,opacity:.65});}
 }else if(sh.terrain==='bridge'||sh.terrain==='ford'||sh.terrain==='pier'){
  const horizontal=b.w>=b.h;
  add('rect',{...{x:b.x,y:b.y,width:b.w,height:b.h},rx:sh.terrain==='ford'?8:2,fill:sh.terrain==='ford'?'#d5cc9b':'#c3a36b',stroke:sh.terrain==='ford'?'#a1a27d':'#755d39','stroke-width':3,'fill-opacity':sh.terrain==='ford'?.8:1});
  if(sh.terrain==='bridge'||sh.terrain==='pier'){
   const size=horizontal?b.w:b.h,parts=Math.max(2,Math.min(80,Math.round(size/20)));
   for(let i=1;i<parts;i++){const t=i/parts;path(horizontal?`M${b.x+b.w*t} ${b.y}v${b.h}`:`M${b.x} ${b.y+b.h*t}h${b.w}`,{stroke:'#92734a','stroke-width':1.5});}
   for(const t of[.1,.9])path(horizontal?`M${b.x} ${b.y+b.h*t}h${b.w}`:`M${b.x+b.w*t} ${b.y}v${b.h}`,{stroke:'#6f5535','stroke-width':4});
   if(sh.terrain==='pier')for(const t of[.08,.92])for(const side of[.08,.92])ellipse(horizontal?b.x+b.w*t:b.x+b.w*side,horizontal?b.y+b.h*side:b.y+b.h*t,Math.min(5,b.w*.09),Math.min(5,b.h*.09),{fill:'#745637',stroke:'#e5cf9b','stroke-width':1});
  }else for(let i=0;i<5;i++){const t=(i+.5)/5;ellipse(horizontal?b.x+b.w*t:cx+(i%2?6:-6),horizontal?cy+(i%2?6:-6):b.y+b.h*t,Math.min(10,b.w*.1),Math.min(10,b.h*.1),{fill:'#e6dfb9',stroke:'#929b85','stroke-width':1.5});}
 }else if(sh.terrain==='clearing')ellipse(cx,cy,b.w/2,b.h/2,{fill:'#bdc68a','fill-opacity':.38,stroke:'#a5af74','stroke-width':1.5,'stroke-dasharray':'5 7'});
 else if(sh.terrain==='trail')path(ringPath(),{fill:'#c6b17f','fill-opacity':.65,stroke:'#a08e62','stroke-width':1.5,'stroke-dasharray':'5 6'});
 else if(sh.terrain==='rubble'){
  for(const[x,y,r]of[[-.2,-.1,.21],[.2,.18,.18],[.07,-.22,.14]])ellipse(cx+b.w*x,cy+b.h*y,b.w*r,b.h*r,{fill:'#b6ad97',stroke:'#8a8270','stroke-width':1.5});
 }else if(sh.terrain==='ruin-floor')add('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:'#c3b99b','fill-opacity':.18,stroke:'none'});
 else if(sh.terrain==='ruin-wall'){
  const d='M'+sh.points.map(p=>p.x+' '+p.y).join('L');path(d,{fill:'none',stroke:'#8c8068','stroke-width':10,'stroke-linecap':'butt'});path(d,{fill:'none',stroke:'#c2b49a','stroke-width':5,'stroke-dasharray':'17 3'});
 }else if(sh.terrain==='cave-floor')path(ringPath(true),{fill:'#b8b7a4','fill-opacity':.5,stroke:'none','fill-rule':'evenodd'});
 else if(sh.terrain==='cave-wall'){
  const d=sh.rings?ringPath(true):smooth(sh.points,false);path(d,{fill:'none',stroke:'#858777','stroke-width':10,'stroke-linecap':'round','stroke-linejoin':'round'});path(d,{fill:'none',stroke:'#a3a590','stroke-width':4,'stroke-linecap':'round'});
 }
 add('rect',{class:'terrain-outline',x:b.x-3,y:b.y-3,width:b.w+6,height:b.h+6,fill:'none',stroke:'#a8742f','stroke-width':2,'stroke-dasharray':'7 5','pointer-events':'none'});
 return g;
}
