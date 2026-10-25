import{generateHouse}from'./buildings.js?v=terrain-1';
import{generateTerrain}from'./terrain.js?v=forest-clean-1';
import{validState}from'./core.js?v=initiative-entry-1';
import{inWorld}from'./world.js?v=expanded-grid-1';

export const SCENE_TYPES=['water','sand','path','pier','mountain','tree','rock','house','cave','ruins','forest','river','rocks','wall','room','door','line','stairs','polygon','ellipse','rect'];
export const SCENE_SYSTEM_PROMPT=`You plan rough, editable top-down D&D maps for Mini Mind Theater. The user wants a sparse tabletop sketch of OUTLINES and useful distances. Interpret any location, choose reasonable missing measurements, and output ONE JSON object. Do not ask follow-up questions for ordinary missing details. Never write code, HTML, SVG, URLs or markdown.

STYLE AND SPACE:
- Strict overhead plan. Draw the walkable layout seen from directly above, never a front view, landscape, facade, mountain icon or illustration.
- Prioritize relative distances, widths, connected entrances and empty space where miniatures can stand. Use a few long contour lines. Leave the grid visible. No textures, shading, highlights, decorative rubble or automatic embellishments. Only water receives a light fill in the renderer.
- If no direction is specified, place the approach at the BOTTOM and the destination at the TOP. Use the middle 60–80% of the canvas for the main playable area, rather than a narrow strip at one edge.
- Frame the area the user emphasizes. If an entrance is the focus and the cave beyond is secondary, spend most of the canvas on the approach, opening and stairs. Let side boundaries continue to the canvas edge; do not add a huge round cave or mountain blob behind the entrance.
- Draw natural walls, shorelines, cliff edges and route edges as open line polylines. Two side contours can define a passage; keep its entrance and exit OPEN. Never put a closing line across a usable entrance.
- Stairs are a few broad, parallel tread lines across the travel direction. Use stairs, NEVER a stack of rocks or a zigzag path to depict steps. Leave the approach clear and connect it to the opening.
- Choose creative details that help describe the requested place, while keeping the map a readable outline plan. Use as many meaningful contours as the requested place needs. Simple places should stay sparse; elaborate places may use many elements. Invent unusual layouts, organic shapes and structures when they fit the request.
- One canvas unit is one map unit before placement; a grid cell is 50 units in the preview. Normal doorways are 40–60 wide, useful passages 80–150, broad stairs 180–300. Explicit user measurements override these defaults. If feet are supplied, one 50-unit cell represents 5 feet. Keep the relative scale consistent.

OUTPUT: {"title":"short German location name","summary":"brief German description of the spatial layout","objects":[...]}
Canvas: 1000 wide by 700 high; x increases right, y down. This is a reference frame, not a clipping boundary: shapes may extend beyond it; the app fits the whole plan proportionally. Coordinates must be finite numbers. For point-based shapes, send the actual points; no extra bounding rectangle is needed. Rectangle/ellipse tools use x,y,w,h with positive width and height. Every object needs a unique stable id. These are drawing tools, not a list of allowed subjects: you can invent any setting by combining them:

PRIMARY SKETCH TOOLS:
- line: {id,type,points:[[x,y],...]}. Any free open contour, 2–256 points. Use for natural boundaries, cave sides, shorelines, paths and other guide lines. It is NOT a filled region and need not close. Use as many contours as needed for any imaginary structure. Set closed:true to join the last point to the first.
- polygon: {id,type,points:[[x,y],...]}. Any free closed outline, 3–256 points. No bounding rectangle or named terrain category is required. Combine polygons and lines to invent islands, platforms, strange buildings, ruins, machinery, organic caves or anything else. No fill.
- ellipse: {id,type,x,y,w,h}. Unfilled circle/ellipse.
- rect: {id,type,x,y,w,h}. Unfilled rectangle.
- wall: {id,type,points:[[x,y],...]}. Same point format for actual building walls or fences. Leave opening gaps.
- stairs: {id,type,x,y,w,h,steps:4,direction:"vertical"}. 1–64 parallel tread lines inside the rectangle. vertical means travel north/south (treads run east/west); horizontal means travel east/west. Width/height determine physical footprint. Use a wide, shallow rectangle for broad stairs into a northern entrance. No side rails or filled blocks are added.
- water: {id,type,points:[[x,y],...]}. Light blue region with any closed polygon of 3–256 points. The app derives its bounds from the points, so x,y,w,h are unnecessary. Follow the actual shore; water may extend to the canvas edge. Do not make every body of water an isolated oval. A landing/entrance at the water must meet its edge.
- door: {id,type,points:[[x,y],[x,y]],open:false}. A doorway exactly on a wall, normally 40–60 long.
- room: {id,type,x,y,w,h}. Unfilled rectangular outline. For connected building interiors use house.

OPTIONAL SIMPLE OBJECTS (only when requested):
- tree: {id,type,x,y,w,h}. One simple unfilled crown outline, typically 45–90 wide/high.
- rock: {id,type,x,y,w,h,points?}. One unfilled obstacle outline. Optional 3–256 global polygon points; bounds are derived automatically when points are provided. Never use rocks as steps or as the cave itself.
- pier: {id,type,x,y,w,h}. Plain rectangular deck outline. It must meet the shore or both river banks.
- house: {id,type,x,y,w,h,rooms:1,entrance:"south"}. Connected room outlines and doors, 1–8 rooms, entrance north/east/south/west. Allow roughly 30000 square units per room; face the entrance toward a clear approach.

COMPOSING OTHER PLACES:
Use line objects for cave boundaries, mountain edges, ruins, paths, sand boundaries and forest limits. Use water polygons for rivers or lakes. A single cave or passage is defined by its two side contours, NOT by a procedural multi-room generator. A broad natural staircase is ONE stairs object between these side contours. A larger cave behind a focused entrance can simply continue beyond the canvas. Do not add extra chambers when the user calls them secondary.
SPATIAL EXAMPLE (adapt to the request; do not add water or stairs when not requested):
An open entrance approached from the south needs separate left and right boundaries, e.g. left [[200,650],[280,450],[300,250],[260,0]] and right [[800,650],[720,450],[700,250],[740,0]]. This leaves 400 units of OPEN space through the middle. A broad northbound staircase inside that opening could be {"id":"steps","type":"stairs","x":330,"y":200,"w":340,"h":180,"steps":4,"direction":"vertical"}. Its treads run left/right. Do NOT connect the left boundary to the right across the entrance. A water approach, if requested, could occupy the bottom 180 units; its upper shoreline must meet the bottom of the traversable approach. No oval cave or rock symbol is needed: the lines are the cave sides.

Before responding, check that entrances, stairs, paths and shorelines meet as described, important gaps remain open, and secondary scenery does not consume the focus area. Keep room and route distances readable. Return only the complete JSON.
If a previous scene JSON is supplied, return the COMPLETE revised scene. Preserve unaffected objects and stable ids, changing only what was requested. A clearly different requested location starts a new layout.`;

const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const fail=message=>{throw Error(message);};
export function parseScene(text){
 if(typeof text!=='string'||text.length>200000)fail('Die Modellantwort ist leer oder zu groß.');
 const cleaned=text.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let raw;try{raw=JSON.parse(cleaned);}catch{fail('Strata hat keinen gültigen Kartenplan geliefert. Bitte neu generieren.');}
 return validateScene(normalizeSceneIds(normalizeModelGeometry(raw)));
}
// Model output is a drawing, not a redundant rectangle/point constraint system.
// Derive polygon bounds and fit the entire plan together so shared edges stay joined.
function normalizeModelGeometry(raw){
 if(!raw||!Array.isArray(raw.objects)||raw.objects.length>200)return raw;
 const objects=raw.objects.map(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return value;
  const o={...value};
  if(Array.isArray(o.points)&&o.points.length<=256){
   o.points=o.points.map(p=>Array.isArray(p)?[...p]:p&&typeof p==='object'?[p.x,p.y]:p);
   if(o.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>finite(v,-1000000,1000000)))){
    o.points=o.points.filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
    if(['room','rect','ellipse'].includes(o.type)&&o.points.length>=3)o.type='polygon';
    if(!SCENE_TYPES.includes(o.type))o.type=o.closed===true?'polygon':'line';
    if(['water','sand','mountain','rock','polygon'].includes(o.type)&&o.points.length>=3){
     const xs=o.points.map(p=>p[0]),ys=o.points.map(p=>p[1]);
     o.x=Math.min(...xs);o.y=Math.min(...ys);o.w=Math.max(...xs)-o.x;o.h=Math.max(...ys)-o.y;
    }
   }
  }
  return o;
 });
 const coordinates=[];
 for(const o of objects){
  if(!o||typeof o!=='object')continue;
  if(Array.isArray(o.points))for(const p of o.points)if(Array.isArray(p)&&p.length===2&&p.every(v=>finite(v,-1000000,1000000)))coordinates.push(p);
  if([o.x,o.y,o.w,o.h].every(v=>finite(v,-1000000,1000000))&&o.w>0&&o.h>0)coordinates.push([o.x,o.y],[o.x+o.w,o.y+o.h]);
 }
 if(coordinates.length){
  const left=Math.min(...coordinates.map(p=>p[0])),top=Math.min(...coordinates.map(p=>p[1])),right=Math.max(...coordinates.map(p=>p[0])),bottom=Math.max(...coordinates.map(p=>p[1]));
  if(left<0||top<0||right>1000||bottom>700){
   const scale=Math.min(1,1000/Math.max(1,right-left),700/Math.max(1,bottom-top)),tx=(1000-(right-left)*scale)/2-left*scale,ty=(700-(bottom-top)*scale)/2-top*scale;
   for(const o of objects){
    if(!o||typeof o!=='object')continue;
    if(Array.isArray(o.points))o.points=o.points.map(p=>Array.isArray(p)&&p.length===2&&p.every(v=>finite(v,-1000000,1000000))?p.map((v,i)=>Math.max(0,Math.min(i?700:1000,v*scale+(i?ty:tx)))):p);
    if([o.x,o.y,o.w,o.h].every(v=>finite(v,-1000000,1000000))&&o.w>0&&o.h>0){o.x=Math.max(0,o.x*scale+tx);o.y=Math.max(0,o.y*scale+ty);o.w=Math.min(o.w*scale,1000-o.x);o.h=Math.min(o.h*scale,700-o.y);}
    if(typeof o.width==='number')o.width*=scale;
   }
  }
 }
 return {...raw,objects};
}
// IDs identify scene objects, not executable references. Repair model bookkeeping
// without deleting repeated scenery or relaxing geometry/type validation.
function normalizeSceneIds(raw){
 if(!raw||!Array.isArray(raw.objects)||raw.objects.length>200)return raw;
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
 if(!raw||typeof raw!=='object'||typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>80||typeof raw.summary!=='string'||raw.summary.length>600||!Array.isArray(raw.objects)||!raw.objects.length||raw.objects.length>200)fail('Der Kartenplan braucht einen Titel, eine Beschreibung und 1–200 Elemente.');
 const ids=new Set();
 const objects=raw.objects.map(o=>{
  if(o&&typeof o==='object'&&!SCENE_TYPES.includes(o.type))fail('Unbekannter Elementtyp „'+String(o.type).slice(0,60)+'“. Erlaubt: '+SCENE_TYPES.join(', ')+'.');
  if(!o||!SCENE_TYPES.includes(o.type)||typeof o.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(o.id)||ids.has(o.id))fail('Der Kartenplan enthält unbekannte oder doppelte Elemente.');ids.add(o.id);
  const item={id:o.id,type:o.type};
  if(!['path','wall','door','line','polygon'].includes(o.type)){
   if(!finite(o.x,0,1000)||!finite(o.y,0,700)||!finite(o.w,1,1000)||!finite(o.h,1,700)||o.x+o.w>1000||o.y+o.h>700)fail('Ein Kartenelement liegt außerhalb der Zeichenfläche oder ist zu klein.');
   Object.assign(item,{x:o.x,y:o.y,w:o.w,h:o.h});
  }
  if(o.points!==undefined||['path','wall','door','line','polygon'].includes(o.type)){
   const min=['path','wall','door','line'].includes(o.type)?2:3,max=o.type==='door'?2:256;
   if(!Array.isArray(o.points)||o.points.length<min||o.points.length>max||!o.points.every(p=>Array.isArray(p)&&p.length===2&&finite(p[0],0,1000)&&finite(p[1],0,700)))fail('Der Kartenplan enthält ungültige Punkte.');
   item.points=o.points.map(p=>[...p]);
   if(o.type==='path'){
    item.width=o.width??35;if(!finite(item.width,1,1000)||new Set(item.points.map(p=>p.join(','))).size<2)fail('Der Weg ist zu schmal, zu breit oder hat keine Länge.');
   }else if(['wall','door','line'].includes(o.type)){
    if(new Set(item.points.map(p=>p.join(','))).size<2)fail('Eine Wand oder Tür hat keine Länge.');
    if(o.type==='door'){item.open=o.open??false;if(typeof item.open!=='boolean'||Math.hypot(item.points[0][0]-item.points[1][0],item.points[0][1]-item.points[1][1])<5)fail('Ungültige Tür.');}
   }else if(o.type==='polygon'){
    if(new Set(item.points.map(p=>p.join(','))).size<3)fail('Eine geschlossene Form braucht drei unterschiedliche Punkte.');
   }else if(!['water','sand','mountain','rock'].includes(o.type)||!item.points.every(([x,y])=>x>=item.x-1e-6&&y>=item.y-1e-6&&x<=item.x+item.w+1e-6&&y<=item.y+item.h+1e-6)||!hasArea(item.points))fail('Die Geländeform braucht eine gültige Kontur mit mindestens drei nicht auf einer Geraden liegenden Punkten.');
  }
  if(o.type==='line'&&o.closed!==undefined){if(typeof o.closed!=='boolean')fail('Ungültiger Linienabschluss.');item.closed=o.closed;}
  if(o.type==='stairs'){
   item.steps=o.steps??4;item.direction=o.direction??'vertical';
   if(!Number.isInteger(item.steps)||item.steps<1||item.steps>64||!['vertical','horizontal'].includes(item.direction))fail('Treppen brauchen 1–64 Stufen und die Richtung vertical oder horizontal.');
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
const hasArea=points=>{const a=points[0],b=points.find(p=>p[0]!==a[0]||p[1]!==a[1]);return b&&points.some(c=>Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))>1e-8);};
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
  if(o.type==='wall'||o.type==='door'||o.type==='line'||o.type==='polygon')items=[{type:['line','polygon'].includes(o.type)?'path':o.type,points:(o.type==='polygon'||o.closed?[...o.points,o.points[0]]:o.points).map(([x,y])=>({x,y})),...(o.type==='door'?{open:o.open}:{})}];
  else if(o.type==='stairs')items=Array.from({length:o.steps},(_,i)=>{
   const t=(i+.5)/o.steps;
   return {type:'path',points:o.direction==='vertical'?[{x:b.x,y:b.y+b.h*t},{x:b.x+b.w,y:b.y+b.h*t}]:[{x:b.x+b.w*t,y:b.y},{x:b.x+b.w*t,y:b.y+b.h}]};
  });
  else if(o.type==='room'||o.type==='rect'||o.type==='ellipse')items=[{type:o.type==='ellipse'?'ellipse':'rect',...b}];
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
  shapes.push(...items.filter(s=>!['cave-floor','ruin-floor','rubble'].includes(s.terrain)).map(s=>({...s,sketch:true})));if(shapes.length>1000)fail('Die Szene ist zu komplex. Bitte weniger Details beschreiben.');
 }
 const scale=Math.min(bounds.w/1000,bounds.h/700),fit={x:bounds.x+(bounds.w-1000*scale)/2,y:bounds.y+(bounds.h-700*scale)/2,w:1000*scale,h:700*scale};
 const placed=scaleShapes(shapes,{x:0,y:0,w:1000,h:700},fit).map((s,i)=>({...s,id:'preview-'+i}));
 if(!validState({version:1,title:scene.title,round:1,active:null,people:[],shapes:placed}))fail('Die Szene enthält ungültige Geometrie. Bitte neu generieren.');
 return {scene,shapes:placed};
}
export function applyScene(state,shapes,removeIds=[]){
 const removed=new Set(removeIds),next=state.shapes.filter(s=>!removed.has(s.id)).concat(structuredClone(shapes));
 if(new Set(next.map(s=>s.id)).size!==next.length||!validState({...state,shapes:next}))fail('Die Szene passt nicht mehr auf die Karte oder überschreitet die Objektgrenze.');
 state.shapes=next;state.demo=false;
}
