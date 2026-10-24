import{generateHouse}from'./buildings.js?v=terrain-1';
import{generateTerrain}from'./terrain.js?v=forest-clean-1';
import{validState}from'./core.js?v=map-chat-1';
import{inWorld}from'./world.js?v=expanded-grid-1';

export const SCENE_TYPES=['water','sand','path','pier','mountain','tree','rock','house','cave','ruins','forest','river','rocks','wall','room','door'];
export const SCENE_SYSTEM_PROMPT=`You are the scene planner for Mini Mind Theater, an editable top-down D&D battle map. The user describes any location in natural language. Interpret their intent, choose useful details yourself, and return a coherent, playable scene. Do not ask follow-up questions for ordinary missing details. Never write code, HTML, SVG, tools, URLs or markdown. Return ONE JSON object, no other text.

OUTPUT: {"title":"short German location name","summary":"brief German description of the layout","objects":[...]}
Canvas is 1000 wide by 700 high; x increases right, y down. Coordinates are numbers. Stay inside the canvas. Use 4-20 objects normally, at most 40. Each object has a unique stable id (letters, numbers, underscores or hyphens). Repeated objects need different ids, e.g. rock_1, rock_2, rock_3. Use ONLY the exact available type names below; represent other requested details with these primitives. No players, enemies or combat rules: only terrain and architecture.

AVAILABLE OBJECTS:
- wall: {id,type,points:[[x,y],[x,y],...]}. An editable wall or fence, 2-24 points. Use connected walls to enclose gardens, courtyards and defensive positions.
- room: {id,type,x,y,w,h}. Simple rectangular floor area. Use house instead for buildings with connected rooms and doors.
- door: {id,type,points:[[x,y],[x,y]],open:false}. A 30-60 unit doorway exactly on an existing wall, not floating away from it. Prefer house for automatically connected doors.
- water, sand, mountain, rock: {id,type,x,y,w,h,points?}. Optional points are a closed polygon as [[x,y],...], 3-48 points in global canvas coordinates inside the stated rectangle. Otherwise an organic outline is generated. Water is blue, sand warm beige, mountains/rocks gray with ridges. Use large water and sand polygons for coasts and lakes; mountains form the edge of a scene, smaller rocks provide cover.
- path: {id,type,points:[[x,y],...],width:35}. A connected winding walkable path, 2-24 points. Width 12-120. Connect entrances, crossings and destinations, avoiding solid mountain interiors.
- pier: {id,type,x,y,w,h}. Wooden decking with planks and posts, horizontal or vertical along the longer side. Also useful as a wooden bridge; connect land to water or both banks, do not place it floating away from land.
- tree: {id,type,x,y,w,h}. One top-down tree, typically 45-90 wide/high. Spread trees irregularly in logical groups, not uniform rows, and keep access routes free.
- house: {id,type,x,y,w,h,rooms:1,entrance:"south"}. Real editable rooms and doors. Width/height at least 150; 1-8 rooms; allow roughly 30000 square canvas units per room. Entrance north/east/south/west must face an approach.
- forest: {id,type,x,y,w,h,count:12,detail:"normal",path:true}. A group of 4-60 trees with an empty clearing and optional clear passage. Use a sufficiently large area, not over buildings or water.
- rocks: {id,type,x,y,w,h,count:6,detail:"normal",path:true}. Group of 3-30 rocks with optional clear passage.
- cave: {id,type,x,y,w,h,count:2,detail:"normal",entrances:2}. Connected chambers and passages. Use at least 500x400 for 2-4 chambers; 1-3 entrances. Do not ask for more chambers than fit.
- ruins: {id,type,x,y,w,h,count:2,detail:"normal"}. Broken building walls and rubble. At least 250x200 for 1 room, more area for additional rooms (1-8).
- river: {id,type,x,y,w,h,detail:"normal",direction:"vertical",crossing:"bridge"}. Winding river, direction vertical/horizontal, crossing bridge/ford/none. Detail for grouped generators is low/normal/high.
All rectangles require positive w,h, x>=0, y>=0, x+w<=1000, y+h<=700. Avoid clutter; leave at least half of useful ground traversable. Terrain can meet or deliberately overlap (a pier crosses water), but do not obstruct the entire map. Match relative sizes and spatial relationships in the user's description. Add only details that support that location. Variety is welcome; do not turn every request into the same beach, forest, river or house.

If a previous scene JSON is supplied, treat the new message as an edit to that scene. Return the COMPLETE revised scene, preserve unaffected objects and their stable ids, and change only what was requested. If the user clearly requests a different location, create a new layout instead.`;

const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const fail=message=>{throw Error(message);};
export function parseScene(text){
 if(typeof text!=='string'||text.length>100000)fail('Die Modellantwort ist leer oder zu groß.');
 const cleaned=text.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let raw;try{raw=JSON.parse(cleaned);}catch{fail('Strata hat keinen gültigen Kartenplan geliefert. Bitte neu generieren.');}
 return validateScene(normalizeSceneIds(raw));
}
// IDs identify scene objects, not executable references. Repair model bookkeeping
// without deleting repeated scenery or relaxing geometry/type validation.
function normalizeSceneIds(raw){
 if(!raw||!Array.isArray(raw.objects)||raw.objects.length>40)return raw;
 const reserved=new Set(raw.objects.map(o=>o?.id).filter(id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,40}$/.test(id))),used=new Set();
 return {...raw,objects:raw.objects.map((o,i)=>{
  if(!o||typeof o!=='object'||Array.isArray(o))return o;
  let id=o.id;
  if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(id)||used.has(id)){
   const base=typeof id==='string'&&/^[a-zA-Z0-9_-]{1,40}$/.test(id)?id:'object';let n=i+1;
   do{id=base.slice(0,30)+'_'+n++;}while(reserved.has(id)||used.has(id));
  }
  used.add(id);return {...o,id};
 })};
}
export function validateScene(raw){
 if(!raw||typeof raw!=='object'||typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>80||typeof raw.summary!=='string'||raw.summary.length>600||!Array.isArray(raw.objects)||!raw.objects.length||raw.objects.length>40)fail('Der Kartenplan braucht einen Titel, eine Beschreibung und 1–40 Elemente.');
 const ids=new Set();
 const objects=raw.objects.map(o=>{
  if(o&&typeof o==='object'&&!SCENE_TYPES.includes(o.type))fail('Unbekannter Elementtyp „'+String(o.type).slice(0,60)+'“. Erlaubt: '+SCENE_TYPES.join(', ')+'.');
  if(!o||!SCENE_TYPES.includes(o.type)||typeof o.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(o.id)||ids.has(o.id))fail('Der Kartenplan enthält unbekannte oder doppelte Elemente.');ids.add(o.id);
  const item={id:o.id,type:o.type};
  if(!['path','wall','door'].includes(o.type)){
   if(!finite(o.x,0,1000)||!finite(o.y,0,700)||!finite(o.w,10,1000)||!finite(o.h,10,700)||o.x+o.w>1000||o.y+o.h>700)fail('Ein Kartenelement liegt außerhalb der Zeichenfläche oder ist zu klein.');
   Object.assign(item,{x:o.x,y:o.y,w:o.w,h:o.h});
  }
  if(o.points!==undefined||['path','wall','door'].includes(o.type)){
   const min=['path','wall','door'].includes(o.type)?2:3,max=o.type==='door'?2:['path','wall'].includes(o.type)?24:48;
   if(!Array.isArray(o.points)||o.points.length<min||o.points.length>max||!o.points.every(p=>Array.isArray(p)&&p.length===2&&finite(p[0],0,1000)&&finite(p[1],0,700)))fail('Der Kartenplan enthält ungültige Punkte.');
   item.points=o.points.map(p=>[...p]);
   if(o.type==='path'){
    item.width=o.width??35;if(!finite(item.width,12,120)||new Set(item.points.map(p=>p.join(','))).size<2)fail('Der Weg ist zu schmal, zu breit oder hat keine Länge.');
   }else if(['wall','door'].includes(o.type)){
    if(new Set(item.points.map(p=>p.join(','))).size<2)fail('Eine Wand oder Tür hat keine Länge.');
    if(o.type==='door'){item.open=o.open??false;if(typeof item.open!=='boolean'||Math.hypot(item.points[0][0]-item.points[1][0],item.points[0][1]-item.points[1][1])<5)fail('Ungültige Tür.');}
   }else if(!['water','sand','mountain','rock'].includes(o.type)||!item.points.every(([x,y])=>x>=item.x&&y>=item.y&&x<=item.x+item.w&&y<=item.y+item.h)||Math.abs(polygonArea(item.points))<1)fail('Die Geländeform passt nicht zu ihrer Grundfläche.');
  }
  if(['house','cave','ruins','forest','rocks','river'].includes(o.type)){
   const count=o.rooms??o.count??({house:1,cave:2,ruins:1,forest:12,rocks:6}[o.type]);
   if(o.type!=='river'){
    const limits={house:[1,8],cave:[2,8],ruins:[1,8],forest:[4,60],rocks:[3,30]}[o.type];
    if(!Number.isInteger(count)||count<limits[0]||count>limits[1])fail('Die gewünschte Anzahl an Räumen oder Objekten ist ungültig.');item.count=count;
   }
   item.detail=o.detail??'normal';if(!['low','normal','high'].includes(item.detail))fail('Ungültige Geländestufe.');
   if(o.type==='house'){item.entrance=o.entrance??'south';if(!['north','east','south','west'].includes(item.entrance))fail('Ungültiger Hauseingang.');}
   if(['forest','rocks'].includes(o.type)){item.path=o.path??true;if(typeof item.path!=='boolean')fail('Ungültige Passage.');}
   if(o.type==='cave'){item.entrances=o.entrances??2;if(!Number.isInteger(item.entrances)||item.entrances<1||item.entrances>3)fail('Ungültige Höhleneingänge.');}
   if(o.type==='river'){item.direction=o.direction??'vertical';item.crossing=o.crossing??'bridge';if(!['vertical','horizontal'].includes(item.direction)||!['bridge','ford','none'].includes(item.crossing))fail('Ungültiger Flussübergang.');}
  }
  return item;
 });
 return {title:raw.title.trim(),summary:raw.summary.trim(),objects};
}
const polygonArea=points=>points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
function randomFor(text){let seed=2166136261;for(const c of text)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function outline(o,rng){return Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r=.82+rng()*.18;return{x:o.x+o.w/2+Math.cos(a)*o.w/2*r,y:o.y+o.h/2+Math.sin(a)*o.h/2*r};});}
function pathRing(o){
 const points=o.points.map(([x,y])=>({x,y})).filter((p,i,a)=>!i||p.x!==a[i-1].x||p.y!==a[i-1].y),sides=[[],[]];
 points.forEach((p,i)=>{const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
  [-1,1].forEach((sign,j)=>sides[j].push({x:Math.max(0,Math.min(1000,p.x-dy/length*o.width/2*sign)),y:Math.max(0,Math.min(700,p.y+dx/length*o.width/2*sign))}));
 });return [...sides[0],...sides[1].reverse()];
}
function scaleShapes(shapes,from,to){
 const map=p=>({x:to.x+(p.x-from.x)*to.w/from.w,y:to.y+(p.y-from.y)*to.h/from.h});
 return shapes.map(shape=>{const s=structuredClone(shape);if(s.rings)s.rings=s.rings.map(r=>r.map(map));else if(s.points)s.points=s.points.map(map);else Object.assign(s,map(s),{w:s.w*to.w/from.w,h:s.h*to.h/from.h});return s;});
}
export function compileScene(plan,bounds={x:0,y:0,w:1000,h:700}){
 const scene=validateScene(plan),shapes=[];
 if(!bounds||![bounds.x,bounds.y,bounds.w,bounds.h].every(Number.isFinite)||bounds.w<=0||bounds.h<=0||!inWorld(bounds)||!inWorld({x:bounds.x+bounds.w,y:bounds.y+bounds.h}))fail('Die Zielfläche liegt außerhalb der Karte.');
 for(const o of scene.objects){
  const rng=randomFor(o.id+o.type),b={x:o.x,y:o.y,w:o.w,h:o.h};let items;
  if(o.type==='wall'||o.type==='door')items=[{type:o.type,points:o.points.map(([x,y])=>({x,y})),...(o.type==='door'?{open:o.open}:{})}];
  else if(o.type==='room')items=[{type:'rect',...b}];
  else if(o.type==='house'||o.type==='ruins'){
   const local={x:0,y:0,w:Math.max(100,Math.round(b.w/50)*50),h:Math.max(100,Math.round(b.h/50)*50)};
   while(Math.floor(local.w/100)*Math.floor(local.h/100)<o.count){if(local.w/local.h<b.w/b.h)local.w+=100;else local.h+=100;}
   items=scaleShapes(o.type==='house'?generateHouse(local,o.count,o.entrance,rng).shapes:generateTerrain('ruins',local,o,rng).shapes,local,b);
  }
  else if(['cave','forest','river','rocks'].includes(o.type)){
   const local={x:0,y:0,w:Math.max(o.type==='cave'?250:50,b.w),h:Math.max(o.type==='cave'?250:50,b.h)};
   if(o.type==='cave')while(Math.floor(local.w/25)*Math.floor(local.h/25)<o.count*36){if(local.w/local.h<b.w/b.h)local.w+=25;else local.h+=25;}
   items=scaleShapes(generateTerrain(o.type,local,o,rng).shapes,local,b);
  }
  else if(o.type==='tree')items=[{type:'ellipse',terrain:'tree',...b}];
  else if(o.type==='pier')items=[{type:'rect',terrain:'pier',...b}];
  else if(o.type==='path')items=[{type:'room',terrain:'ground-path',rings:[pathRing(o)]}];
  else items=[{type:'room',terrain:({sand:'sand',mountain:'mountain',water:'water',rock:'rock'})[o.type],rings:[o.points?o.points.map(([x,y])=>({x,y})):outline(o,rng)]}];
  shapes.push(...items);if(shapes.length>400)fail('Die Szene ist zu komplex. Bitte weniger Details beschreiben.');
 }
 const placed=scaleShapes(shapes,{x:0,y:0,w:1000,h:700},bounds).map((s,i)=>({...s,id:'preview-'+i}));
 if(!validState({version:1,title:scene.title,round:1,active:null,people:[],shapes:placed}))fail('Die Szene enthält ungültige Geometrie. Bitte neu generieren.');
 return {scene,shapes:placed};
}
export function applyScene(state,shapes,removeIds=[]){
 const removed=new Set(removeIds),next=state.shapes.filter(s=>!removed.has(s.id)).concat(structuredClone(shapes));
 if(new Set(next.map(s=>s.id)).size!==next.length||!validState({...state,shapes:next}))fail('Die Szene passt nicht mehr auf die Karte oder überschreitet die Objektgrenze.');
 state.shapes=next;state.demo=false;
}
