import{generateHouse}from'./buildings.js?v=terrain-1';
import{inWorld}from'./world.js?v=expanded-grid-1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const GENERATORS={house:'Haus',cave:'Höhle',ruins:'Ruine',forest:'Wald & Lichtung',river:'Fluss & Übergang',rocks:'Felsfeld'};
const optionsByKind={cave:{count:4,detail:'normal',entrances:2},ruins:{count:4,detail:'normal'},forest:{count:24,detail:'normal',path:true},river:{detail:'normal',direction:'vertical',crossing:'bridge'},rocks:{count:12,detail:'normal',path:true}};
export const defaultTerrainOptions=kind=>({...optionsByKind[kind]});
function boundsCheck(b){if(!b||![b.x,b.y,b.w,b.h].every(Number.isFinite)||b.w<300||b.h<300||b.w>2000||b.h>2000||!inWorld(b)||!inWorld({x:b.x+b.w,y:b.y+b.h}))throw Error('Bitte eine Fläche von 6 × 6 bis 40 × 40 Feldern zeichnen.');}
function polygon(points,terrain){return{type:'room',rings:[points],terrain};}
function line(a,b,terrain){return{type:'wall',points:[a,b],terrain};}
function validateOptions(kind,o){
 if(!['low','normal','high'].includes(o.detail))throw Error('Bitte eine gültige Stärke wählen.');
 const limits={cave:[2,8],ruins:[1,12],forest:[4,60],rocks:[3,30]};
 if(limits[kind]&&(!Number.isInteger(o.count)||o.count<limits[kind][0]||o.count>limits[kind][1]))throw Error(`Bitte eine Anzahl von ${limits[kind][0]} bis ${limits[kind][1]} wählen.`);
 if(kind==='cave'&&(!Number.isInteger(o.entrances)||o.entrances<1||o.entrances>3))throw Error('Bitte 1 bis 3 Eingänge wählen.');
 if(kind==='river'&&(!['vertical','horizontal'].includes(o.direction)||!['bridge','ford','none'].includes(o.crossing)))throw Error('Bitte Richtung und Übergang wählen.');
}
export function generateTerrain(kind,bounds,options={},random=Math.random){
 if(!optionsByKind[kind])throw Error('Unbekanntes Gelände.');boundsCheck(bounds);const o={...defaultTerrainOptions(kind),...options};validateOptions(kind,o);
 // Guard callers' RNG and keep generation deterministic when a seeded RNG is supplied.
 const rng=()=>{const n=random();if(!Number.isFinite(n))throw Error('Ungültige Zufallsquelle.');return clamp(n,0,.999999999);};
 const result=({cave:cave,ruins:ruins,forest:forest,river:river,rocks:rocks}[kind])(bounds,o,rng);
 if(!result.shapes.length||result.shapes.length>1000)throw Error('Das Gelände ist zu komplex. Bitte eine kleinere Fläche wählen.');return result;
}
function ruins(b,o,rng){
 const house=generateHouse(b,o.count,'south',rng),outline=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}],walls=outline.map((p,i)=>line(p,outline[(i+1)%4],'ruin-wall'));
 walls.push(...house.shapes.filter(s=>s.type==='wall'));const shapes=[{type:'rect',...b,terrain:'ruin-floor'}],damage={low:.25,normal:.45,high:.65}[o.detail];
 for(const wall of walls){const [a,c]=wall.points,length=Math.hypot(c.x-a.x,c.y-a.y),gap=Math.max(50,length*damage),center=.4+rng()*.2,left=clamp(center-gap/length/2,.12,.8),right=clamp(center+gap/length/2,.2,.88),p=t=>({x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t});
  shapes.push(line(a,p(left),'ruin-wall'),line(p(right),c,'ruin-wall'));
  const mid=p(center),size=12+rng()*12;shapes.push({type:'ellipse',terrain:'rubble',x:clamp(mid.x-size,b.x,b.x+b.w-size*2),y:clamp(mid.y-size,b.y,b.y+b.h-size*2),w:size*2,h:size*2});
 }
 return{shapes,summary:`Ruine mit ${o.count} offenen Raumbereichen und ${walls.length} Durchbrüchen.`};
}
function scatter(b,count,radius,allowed,rng,make){
 const placed=[],shapes=[];
 for(let i=0;i<count;i++){
  let accepted=false;
  for(let tries=0;tries<1500;tries++){
   const r=radius*(.8+rng()*.35),x=b.x+r+rng()*(b.w-r*2),y=b.y+r+rng()*(b.h-r*2);
   if(!allowed(x,y,r)||placed.some(p=>Math.hypot(p.x-x,p.y-y)<(p.r+r)*1.12))continue;
   placed.push({x,y,r});shapes.push(make(x,y,r,rng));accepted=true;break;
  }
  if(!accepted)throw Error('Dafür ist zu wenig Platz. Größere Fläche, kleinere Objekte oder eine geringere Anzahl wählen.');
 }
 return shapes;
}
function forest(b,o,rng){
 const cx=b.x+b.w/2,cy=b.y+b.h/2,rx=b.w*{low:.16,normal:.23,high:.30}[o.detail],ry=b.h*{low:.16,normal:.23,high:.30}[o.detail],pathWidth=Math.min(70,b.h*.16);
 const shapes=[{type:'ellipse',terrain:'clearing',x:cx-rx,y:cy-ry,w:rx*2,h:ry*2}];
 if(o.path)shapes.push(polygon([{x:b.x,y:cy-pathWidth/2},{x:b.x+b.w,y:cy-pathWidth/2},{x:b.x+b.w,y:cy+pathWidth/2},{x:b.x,y:cy+pathWidth/2}],'trail'));
 const radius=Math.min(38,Math.sqrt(b.w*b.h/o.count)*.24);
 shapes.push(...scatter(b,o.count,radius,(x,y,r)=>((x-cx)/(rx+r))**2+((y-cy)/(ry+r))**2>1&&(!o.path||Math.abs(y-cy)>pathWidth/2+r+6),rng,(x,y,r)=>({type:'ellipse',terrain:'tree',x:x-r,y:y-r,w:r*2,h:r*2})));
 return{shapes,summary:`${o.count} Bäume, eine freie Lichtung${o.path?' und ein durchgehender Weg':''}.`};
}
function rocks(b,o,rng){
 const size={low:.7,normal:1,high:1.35}[o.detail],radius=Math.min(55,Math.sqrt(b.w*b.h/o.count)*.21)*size,cy=b.y+b.h/2,pathWidth=Math.min(100,b.h*.2);
 const shapes=scatter(b,o.count,radius,(x,y,r)=>!o.path||Math.abs(y-cy)>pathWidth/2+r+8,rng,(x,y,r)=>{
  const n=6+Math.floor(rng()*3),phase=rng()*Math.PI,points=Array.from({length:n},(_,i)=>{const a=phase+i*Math.PI*2/n,scale=.8+rng()*.2;return{x:x+Math.cos(a)*r*scale,y:y+Math.sin(a)*r*scale};});return polygon(points,'rock');
 });return{shapes,summary:`${o.count} einzeln verschiebbare Felsen${o.path?' mit freier Passage durch die Mitte':''}.`};
}
function river(b,o,rng){
 const vertical=o.direction==='vertical',length=vertical?b.h:b.w,span=vertical?b.w:b.h,width=span*{low:.14,normal:.24,high:.36}[o.detail],phase=(rng()-.5)*.8,frequency=.8+rng()*.4;
 const point=(across,along)=>vertical?{x:b.x+across,y:b.y+along}:{x:b.x+along,y:b.y+across};
 const center=t=>span*(.5+Math.sin((t*frequency+phase)*Math.PI*2)*.12),left=[],right=[];
 for(let i=0;i<=24;i++){const t=i/24;left.push(point(center(t)-width/2,t*length));right.push(point(center(t)+width/2,t*length));}
 const shapes=[polygon([...left,...right.reverse()],'water')];
 if(o.crossing!=='none'){const c=center(.5),cross=width+50;shapes.push(vertical?{type:'rect',terrain:o.crossing,x:b.x+c-cross/2,y:b.y+length/2-32,w:cross,h:64}:{type:'rect',terrain:o.crossing,x:b.x+length/2-32,y:b.y+c-cross/2,w:64,h:cross});}
 return{shapes,summary:`Geschwungener Fluss${o.crossing==='bridge'?' mit Brücke':o.crossing==='ford'?' mit Furt':' ohne Übergang'}.`};
}
const key=p=>p.x+','+p.y;
function cellRings(cells,step,b){
 const edges=new Map(),add=(a,c)=>{const reverse=key(c)+'>'+key(a);if(edges.has(reverse))edges.delete(reverse);else edges.set(key(a)+'>'+key(c),{a,c});};
 for(const value of cells){const[x,y]=value.split(',').map(Number);const points=[{x,y},{x:x+1,y},{x:x+1,y:y+1},{x,y:y+1}];points.forEach((p,i)=>add(p,points[(i+1)%4]));}
 const outgoing=new Map();for(const e of edges.values()){const k=key(e.a);if(!outgoing.has(k))outgoing.set(k,[]);outgoing.get(k).push(e);}
 const rings=[];
 while(edges.size){const first=edges.values().next().value,ring=[],start=key(first.a);let e=first,guard=0;
  do{ring.push(e.a);edges.delete(key(e.a)+'>'+key(e.c));const end=key(e.c);if(end===start)break;
   const candidates=(outgoing.get(end)||[]).filter(f=>edges.has(key(f.a)+'>'+key(f.c))),dx=e.c.x-e.a.x,dy=e.c.y-e.a.y;
   candidates.sort((a,c)=>{const angle=f=>Math.atan2(dx*(f.c.y-f.a.y)-dy*(f.c.x-f.a.x),dx*(f.c.x-f.a.x)+dy*(f.c.y-f.a.y));return angle(c)-angle(a);});
   if(!candidates.length)throw Error('Höhlenrand konnte nicht geschlossen werden.');e=candidates[0];
  }while(guard++<10000);
  if(guard>=10000)throw Error('Höhle ist zu komplex.');
  const clean=ring.filter((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],c=ring[(i+1)%ring.length];return(a.x-p.x)*(c.y-p.y)!==(a.y-p.y)*(c.x-p.x);});
  rings.push(clean.map(p=>({x:b.x+p.x*step,y:b.y+p.y*step})));
 }
 return rings;
}
function cave(b,o,rng){
 const step=25,nx=Math.floor(b.w/step),ny=Math.floor(b.h/step);
 if(nx*ny<o.count*36)throw Error('Für so viele Kammern bitte eine größere Fläche zeichnen.');
 const cols=Math.min(o.count,Math.max(1,Math.round(Math.sqrt(o.count*nx/ny)))),rows=Math.ceil(o.count/cols),centers=[],cells=new Set();
 const add=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<nx&&y<ny)cells.add(x+','+y);};
 for(let i=0;i<o.count;i++){
  const x=clamp(Math.round((i%cols+.5)*nx/cols+(rng()-.5)*.4),1,nx-2),y=clamp(Math.round((Math.floor(i/cols)+.5)*ny/rows+(rng()-.5)*.4),1,ny-2),rx=Math.max(1.25,nx/cols*.36),ry=Math.max(1.25,ny/rows*.36);centers.push({x,y});
  for(let xx=1;xx<nx-1;xx++)for(let yy=1;yy<ny-1;yy++)if(((xx-x)/rx)**2+((yy-y)/ry)**2<.8+rng()*.3)add(xx,yy);add(x,y);
 }
 const wide={low:2,normal:3,high:4}[o.detail],carve=(a,c)=>{let{x,y}=a;const stamp=()=>{for(let i=0;i<wide;i++)for(let j=0;j<wide;j++)add(x+i-Math.floor(wide/2),y+j-Math.floor(wide/2));};stamp();while(x!==c.x){x+=Math.sign(c.x-x);stamp();}while(y!==c.y){y+=Math.sign(c.y-y);stamp();}};
 for(let i=1;i<centers.length;i++){const nearest=centers.slice(0,i).sort((a,c)=>Math.hypot(a.x-centers[i].x,a.y-centers[i].y)-Math.hypot(c.x-centers[i].x,c.y-centers[i].y))[0];carve(centers[i],nearest);}
 // Keep natural chambers away from the frame, then carve explicit entrances.
 for(const k of [...cells]){const[x,y]=k.split(',').map(Number);if(x===0||y===0||x===nx-1||y===ny-1)cells.delete(k);}
 const entrances=[{side:'west',from:centers[0],to:{x:0,y:centers[0].y}}];
 if(o.entrances>1)entrances.push({side:'east',from:centers.at(-1),to:{x:nx-1,y:centers.at(-1).y}});
 if(o.entrances>2)entrances.push({side:'south',from:centers[Math.floor(centers.length/2)],to:{x:centers[Math.floor(centers.length/2)].x,y:ny-1}});
 entrances.forEach(e=>carve(e.from,e.to));
 const connected=new Set(),queue=[centers[0]];for(let i=0;i<queue.length;i++){const p=queue[i],k=key(p);if(connected.has(k)||!cells.has(k))continue;connected.add(k);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});}
 if(centers.some(p=>!connected.has(key(p))))throw Error('Die Gänge sind zu eng. Bitte eine breitere Gangstufe wählen.');
 const rings=cellRings(connected,step,b);if(rings.length>90||rings.reduce((n,r)=>n+r.length,0)>1800)throw Error('Die Höhle ist zu kleinteilig. Bitte weniger Kammern oder eine kleinere Fläche wählen.');const shapes=[{type:'room',terrain:'cave-floor',rings}],sides=new Set(entrances.map(e=>e.side));
 const gap=(a,c)=>sides.has('west')&&a.x===b.x&&c.x===b.x||sides.has('east')&&a.x===b.x+nx*step&&c.x===a.x||sides.has('south')&&a.y===b.y+ny*step&&c.y===a.y;
 for(const ring of rings){const gaps=ring.map((p,i)=>gap(p,ring[(i+1)%ring.length]));if(!gaps.some(Boolean)){shapes.push({type:'room',terrain:'cave-wall',rings:[ring]});continue;}
  const start=gaps.indexOf(true);let run=[];for(let k=1;k<=ring.length;k++){const i=(start+k)%ring.length,a=ring[i],c=ring[(i+1)%ring.length];if(gaps[i]){if(run.length>1)shapes.push({type:'path',terrain:'cave-wall',points:run});run=[];}else{if(!run.length)run.push(a);run.push(c);}}if(run.length>1)shapes.push({type:'path',terrain:'cave-wall',points:run});
 }
 return{shapes,summary:`${o.count} verbundene Kammern und ${o.entrances} offene Eingänge.`,topology:{cells:[...connected],centers,entrances:entrances.map(e=>e.to)}};
}
