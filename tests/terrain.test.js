import test from'node:test';import assert from'node:assert/strict';
import{generateTerrain,defaultTerrainOptions}from'../dist/terrain.js';
import{validState}from'../dist/core.js';import{makeCampaign,validCampaign}from'../dist/campaign.js';
import{shapeBounds,moveSelection,transformSelection,integrateShape,placeDoor}from'../dist/drawing.js';
import{overlapsBuilding,annexEdges}from'../dist/buildings.js';
import{recordChange,undoChange,redoChange}from'../dist/history.js';
const bounds={x:-500,y:100,w:600,h:500},kinds=['cave','ruins','forest','river','rocks'];
const rng=seed=>()=>((seed=seed*16807%2147483647)-1)/2147483646;
const state=shapes=>({version:1,title:'Terrain',round:1,active:null,people:[],shapes:shapes.map((s,i)=>({...s,id:'t'+i}))});
test('all five generators produce bounded, finite, saveable geometry for many layouts',()=>{
 for(const kind of kinds)for(const detail of['low','normal','high'])for(let seed=1;seed<=15;seed++){
  const result=generateTerrain(kind,bounds,{detail},rng(seed));assert.ok(result.summary.length>0);assert.equal(validState(state(result.shapes)),true,kind+' '+detail+' '+seed);
  for(const s of result.shapes){const b=shapeBounds(s);assert.ok(b.x>=bounds.x-.001&&b.y>=bounds.y-.001&&b.x+b.w<=bounds.x+bounds.w+.001&&b.y+b.h<=bounds.y+bounds.h+.001,kind);}
  const campaign=makeCampaign(state(result.shapes),()=> 'campaign');assert.equal(validCampaign(JSON.parse(JSON.stringify(campaign))),true);
  assert.deepEqual(result,generateTerrain(kind,bounds,{detail},rng(seed)));
 }
});
test('caves connect all chamber centers to each entrance and have explicit open boundary gaps',()=>{
 for(const entrances of[1,2,3])for(const count of[2,4,8]){
  const result=generateTerrain('cave',bounds,{count,entrances,detail:'low'},rng(17)),{cells,centers,entrances:entries}=result.topology,set=new Set(cells),visited=new Set(),queue=[centers[0]];
  for(let i=0;i<queue.length;i++){const p=queue[i],key=p.x+','+p.y;if(visited.has(key)||!set.has(key))continue;visited.add(key);for(const[x,y]of[[1,0],[-1,0],[0,1],[0,-1]])queue.push({x:p.x+x,y:p.y+y});}
  assert.equal(visited.size,set.size);for(const p of[...centers,...entries])assert.ok(visited.has(p.x+','+p.y));assert.equal(entries.length,entrances);
  assert.ok(result.shapes.filter(s=>s.terrain==='cave-wall').every(s=>s.type==='path'||s.type==='room'));assert.ok(result.shapes.some(s=>s.terrain==='cave-wall'&&s.type==='path'));
 }
});
test('forest honors tree count and leaves both clearing and path free of canopies',()=>{
 const result=generateTerrain('forest',bounds,{count:30,path:true},rng(3)),clearing=result.shapes.find(s=>s.terrain==='clearing'),trees=result.shapes.filter(s=>s.terrain==='tree'),cx=clearing.x+clearing.w/2,cy=clearing.y+clearing.h/2;
 assert.equal(trees.length,30);assert.ok(result.shapes.some(s=>s.terrain==='trail'));
 for(const t of trees){const x=t.x+t.w/2,y=t.y+t.h/2,r=t.w/2;assert.ok(((x-cx)/(clearing.w/2+r))**2+((y-cy)/(clearing.h/2+r))**2>1);assert.ok(Math.abs(y-cy)>Math.min(70,bounds.h*.16)/2+r);}
 assert.equal(generateTerrain('forest',bounds,{path:false},rng(3)).shapes.some(s=>s.terrain==='trail'),false);
});
test('rock fields preserve a traversable middle passage and exact obstacle count',()=>{
 const result=generateTerrain('rocks',bounds,{count:18,path:true},rng(6));assert.equal(result.shapes.length,18);
 for(const rock of result.shapes){const b=shapeBounds(rock),center=bounds.y+bounds.h/2;assert.ok(b.y+b.h<center-50||b.y>center+50);}
});
test('rivers span the chosen direction and their bridges or fords cross both banks',()=>{
 for(const direction of['vertical','horizontal'])for(const crossing of['bridge','ford','none']){
  const result=generateTerrain('river',bounds,{direction,crossing},rng(2)),water=result.shapes[0],ring=water.rings[0],b=shapeBounds(water);
  assert.equal(result.shapes.length,crossing==='none'?1:2);assert.equal(direction==='vertical'?b.h:b.w,direction==='vertical'?bounds.h:bounds.w);
  if(crossing!=='none'){const c=result.shapes[1],a=ring[12],z=ring.at(-13);assert.equal(c.terrain,crossing);if(direction==='vertical'){assert.ok(c.x<Math.min(a.x,z.x)&&c.x+c.w>Math.max(a.x,z.x));}else assert.ok(c.y<Math.min(a.y,z.y)&&c.y+c.h>Math.max(a.y,z.y));}
 }
});
test('ruins contain separate broken walls and no automatically closed doors',()=>{
 const result=generateTerrain('ruins',bounds,{count:6},rng(8));assert.equal(result.shapes.filter(s=>s.terrain==='ruin-wall').length,18);assert.equal(result.shapes.filter(s=>s.type==='door').length,0);
 const low=generateTerrain('ruins',bounds,{detail:'low'},rng(7)),high=generateTerrain('ruins',bounds,{detail:'high'},rng(7));const length=r=>r.shapes.filter(s=>s.terrain==='ruin-wall').reduce((n,s)=>n+Math.hypot(s.points[0].x-s.points[1].x,s.points[0].y-s.points[1].y),0);assert.ok(length(high)<length(low));
});
test('generated terrain survives move, resize, undo/redo and cannot dissolve into buildings',()=>{
 const original=state(generateTerrain('forest',bounds,{},rng(4)).shapes),moved=moveSelection(original.shapes,200,100),scaled=transformSelection(moved,2,{x:700,y:900});assert.ok(scaled.every((s,i)=>s.terrain===original.shapes[i].terrain));assert.equal(validState(state(scaled)),true);
 const h=[],f=[];recordChange(h,f,original);const changed={...original,shapes:scaled};assert.deepEqual(undoChange(h,f,changed),original);assert.deepEqual(redoChange(h,f,original),changed);
 const house={id:'house',type:'rect',x:-500,y:100,w:600,h:500},rock=state(generateTerrain('rocks',bounds,{},rng(1)).shapes).shapes[0];
 assert.equal(integrateShape([house],rock).shapes.length,2);assert.equal(integrateShape([rock],house).shapes.length,2);assert.equal(overlapsBuilding(bounds,[rock]),false);assert.deepEqual(annexEdges(rock),[]);assert.equal(placeDoor({x:rock.rings[0][0].x,y:rock.rings[0][0].y},[rock]),null);
});
test('invalid inputs and unsupported terrain metadata fail safely',()=>{
 for(const kind of kinds){assert.throws(()=>generateTerrain(kind,{...bounds,w:100}));assert.throws(()=>generateTerrain(kind,{...bounds,w:3000}));assert.throws(()=>generateTerrain(kind,bounds,{detail:'bad'}));assert.throws(()=>generateTerrain(kind,bounds,{},()=>NaN));}
 assert.throws(()=>generateTerrain('forest',bounds,{count:100}));assert.throws(()=>generateTerrain('river',bounds,{direction:'diagonal'}));assert.throws(()=>generateTerrain('cave',bounds,{entrances:0}));
 const invalid={id:'bad',type:'ellipse',x:1,y:1,w:50,h:50};for(const terrain of['constructor','__proto__','unknown',{},'water'])assert.equal(validState(state([{...invalid,terrain}])),false);
 assert.equal(validState(state([invalid])),true);assert.equal(defaultTerrainOptions('cave').count,4);
});

test('manual walls cannot consume ruin fragments while closing a new room',()=>{
 const fragments=[{id:'r1',type:'wall',terrain:'ruin-wall',points:[{x:0,y:0},{x:100,y:0}]},{id:'r2',type:'wall',terrain:'ruin-wall',points:[{x:100,y:0},{x:100,y:100}]},{id:'r3',type:'wall',terrain:'ruin-wall',points:[{x:100,y:100},{x:0,y:0}]}];
 const result=integrateShape(fragments,{id:'new',type:'wall',points:[{x:0,y:0},{x:100,y:100}]});assert.equal(result.closed,false);for(const f of fragments)assert.deepEqual(result.shapes.find(s=>s.id===f.id),f);
});
