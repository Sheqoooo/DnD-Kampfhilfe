import{validState}from'../dist/core.js';
import test from 'node:test';import assert from 'node:assert/strict';import{integrateShape,snapDrawingPoint,roomRings,unionRooms,translateShape,reshapeShape}from'../dist/drawing.js';
const rect=(id,x,y,w,h)=>({id,type:'rect',x,y,w,h});
const area=s=>Math.abs(roomRings(s).reduce((total,r)=>total+r.reduce((n,p,i)=>{const q=r[(i+1)%r.length];return n+p.x*q.y-p.y*q.x;},0)/2,0));
test('snaps raw wall endpoints to existing endpoints and edges ahead of grid',()=>{assert.deepEqual(snapDrawingPoint({x:113,y:105},[{type:'wall',points:[{x:100,y:100},{x:300,y:100}]}],true),{x:100,y:100,attached:true});const p=snapDrawingPoint({x:189,y:110},[rect('r',100,100,200,100)],false);assert.equal(p.y,100);assert.equal(p.x,189);});
test('overlapping rooms become their exact union rather than a bounding box',()=>{const result=integrateShape([rect('a',0,0,100,100)],rect('b',50,50,100,100));assert.equal(result.shapes.length,1);assert.equal(result.merged,1);assert.equal(area(result.shapes[0]),17500);assert.equal(result.shapes[0].rings[0].length,8);});
test('shared room walls disappear while corner-only contacts stay separate',()=>{const r=integrateShape([rect('a',0,0,100,100)],rect('b',100,0,100,100));assert.equal(r.shapes.length,1);assert.equal(area(r.shapes[0]),20000);const corner=integrateShape([rect('a',0,0,100,100)],rect('b',100,100,100,100));assert.equal(corner.shapes.length,2);});
test('contained rooms deduplicate and disconnected rooms remain separate',()=>{const r=integrateShape([rect('a',0,0,200,200)],rect('b',50,50,50,50));assert.equal(r.shapes.length,1);assert.equal(area(r.shapes[0]),40000);assert.equal(integrateShape([rect('a',0,0,50,50)],rect('b',200,200,50,50)).shapes.length,2);});
test('connected chains merge and preserve a courtyard hole',()=>{const rooms=[rect('a',100,100,300,50),rect('b',100,150,50,200),rect('c',350,150,50,200),rect('d',100,350,300,50)];const joined=unionRooms(rooms);assert.equal(joined.rings.length,2);assert.ok(Math.abs(area(joined)-50000)<.001);});
test('overlapping round and rectangular rooms merge with bounded contour detail',()=>{const r=integrateShape([rect('a',100,100,150,100)],{id:'b',type:'ellipse',x:200,y:100,w:100,h:100});assert.equal(r.shapes.length,1);assert.equal(r.shapes[0].type,'room');assert.ok(r.shapes[0].rings[0].length<80);});
test('three walls plus a closing fourth create a room in one reversible operation',()=>{let n=0;const walls=[{id:'a',type:'wall',points:[{x:100,y:100},{x:300,y:100}]},{id:'b',type:'wall',points:[{x:300,y:100},{x:300,y:250}]},{id:'c',type:'wall',points:[{x:300,y:250},{x:100,y:250}]}];const r=integrateShape(walls,{id:'d',type:'wall',points:[{x:100,y:250},{x:100,y:100}]},{idFactory:()=>String(++n)});assert.equal(r.closed,true);assert.equal(r.shapes.length,1);assert.equal(area(r.shapes[0]),30000);assert.equal(walls.length,3);});
test('new wall splits a T junction and repeated walls are ignored',()=>{const wall={id:'a',type:'wall',points:[{x:100,y:100},{x:300,y:100}]};let n=0;const r=integrateShape([wall],{id:'b',type:'wall',points:[{x:200,y:100},{x:200,y:200}]},{idFactory:()=>String(++n)});assert.equal(r.shapes.length,3);assert.equal(integrateShape([wall],{...wall,id:'b'}).shapes.length,1);});
test('switching auto-connect off keeps overlapping shapes independent',()=>{assert.equal(integrateShape([rect('a',0,0,100,100)],rect('b',50,50,100,100),{connect:false}).shapes.length,2);});
test('moving rooms preserves shape and clamps the whole room to the board',()=>{const moved=translateShape(rect('a',900,600,100,100),100,100);assert.equal(moved.x,900);assert.equal(moved.y,600);const irregular=unionRooms([rect('a',100,100,100,100),rect('b',150,150,100,100)]);const shift=translateShape(irregular,-200,-200);assert.equal(Math.min(...shift.rings.flat().map(p=>p.x)),0);assert.equal(area(shift),area(irregular));});

test('merged rooms survive JSON save validation',()=>{const merged=integrateShape([rect('a',100,100,200,200)],rect('b',250,250,200,200)).shapes[0];const state={version:1,title:'Test',round:1,active:null,people:[],shapes:[merged]};assert.equal(validState(JSON.parse(JSON.stringify(state))),true);assert.equal(validState({...state,shapes:[{id:'bad',type:'room',rings:[[{x:-1,y:0},{x:10,y:0},{x:0,y:10}]]}]}),false);});

test('interior rooms survive within buildings and remain separate on editing',()=>{
 const building=rect('building',100,100,300,300),inside={...rect('bedroom',100,100,150,150),interior:true};
 const result=integrateShape([building],inside);
 assert.equal(result.shapes.length,2);assert.deepEqual(result.shapes[0],building);
 const edited=reshapeShape(inside,2,{x:300,y:300});
 assert.equal(edited.interior,true);
 assert.equal(integrateShape([building],edited).shapes.length,2);
 const moved=translateShape(inside,50,50);
 assert.equal(moved.interior,true);
 assert.equal(integrateShape([building],moved).shapes.length,2);
 assert.equal(validState({version:1,title:'Rooms',round:1,active:null,people:[],shapes:JSON.parse(JSON.stringify(result.shapes))}),true);
});
test('an extension merges with the building without consuming its interior rooms',()=>{
 const building=rect('building',100,100,200,200),bedroom={...rect('bedroom',100,100,100,100),interior:true};
 const result=integrateShape([building,bedroom],rect('extension',300,100,100,200));
 assert.equal(result.merged,1);assert.equal(result.shapes.length,2);
 assert.deepEqual(result.shapes.find(s=>s.id==='bedroom'),bedroom);
 assert.equal(area(result.shapes.find(s=>s.id==='extension')),60000);
});
test('closed interior wall loops become rooms without dissolving into the building',()=>{
 const building=rect('building',100,100,300,300);
 const points=[{x:150,y:150},{x:250,y:150},{x:250,y:250},{x:150,y:250}];
 const walls=points.slice(0,3).map((p,i)=>({id:'w'+i,type:'wall',interior:true,points:[p,points[i+1]]}));
 const result=integrateShape([building,...walls],{id:'last',type:'wall',interior:true,points:[points[3],points[0]]});
 assert.equal(result.closed,true);assert.equal(result.shapes.length,2);
 assert.equal(result.shapes.find(s=>s.id==='last').interior,true);
 assert.equal(area(result.shapes.find(s=>s.id==='last')),10000);
});
