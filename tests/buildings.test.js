import test from'node:test';import assert from'node:assert/strict';
import{generateHouse,houseBounds,annexEdges,annexRect,attachAnnex,overlapsBuilding}from'../dist/buildings.js';
import{roomRings}from'../dist/drawing.js';import{validState}from'../dist/core.js';import{makeCampaign,validCampaign}from'../dist/campaign.js';
let serial=0;const id=()=>`shape-${serial++}`;const base={id:'house',type:'rect',x:100,y:100,w:400,h:400};
const state=shapes=>({version:1,title:'Buildings',round:1,active:null,people:[],shapes});
const area=r=>Math.abs(r.reduce((v,p,i)=>v+p.x*r[(i+1)%r.length].y-r[(i+1)%r.length].x*p.y,0))/2;
test('house partitions exactly cover the footprint and every room is reachable',()=>{
 for(let count=1;count<=12;count++)for(let seed=1;seed<=40;seed++){
  let n=seed;const random=()=>((n=n*16807%2147483647)-1)/2147483646;
  const {rooms,shapes}=generateHouse({x:0,y:0,w:600,h:500},count,'south',random);
  assert.equal(rooms.length,count);assert.equal(rooms.reduce((n,r)=>n+r.w*r.h,0),300000);
  assert.equal(shapes.filter(s=>s.type==='door').length,count);
  assert.ok(rooms.every(r=>r.w>=100&&r.h>=100));
  for(let i=0;i<rooms.length;i++)assert.equal(overlapsBuilding(rooms[i],rooms.filter((_,j)=>i!==j).map(r=>({...r,type:'rect'}))),false);
  const touches=(r,d)=>{const [a,b]=d.points,c={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return c.x>=r.x&&c.x<=r.x+r.w&&c.y>=r.y&&c.y<=r.y+r.h;};
  const doors=shapes.filter(s=>s.type==='door'),seen=new Set([0]);let changed=true;while(changed){changed=false;for(const d of doors){const adjacent=rooms.map((r,i)=>touches(r,d)?i:-1).filter(i=>i>=0);if(adjacent.some(i=>seen.has(i)))for(const i of adjacent)if(!seen.has(i)){seen.add(i);changed=true;}}}assert.equal(seen.size,count);
  assert.equal(validState(state(shapes.map(s=>({...s,id:id()})))),true);
 }
});
test('small or invalid footprints fail explicitly instead of silently dropping rooms',()=>{
 assert.throws(()=>generateHouse({x:0,y:0,w:150,h:150},2));assert.throws(()=>generateHouse({...base,w:75},1));assert.throws(()=>generateHouse(base,13));
 assert.deepEqual(houseBounds({x:412,y:401},{x:101,y:99}),{x:100,y:100,w:300,h:300});
 for(let count=1;count<=6;count++)assert.equal(generateHouse({x:0,y:0,w:250,h:350},count,'west',()=>.9).rooms.length,count);
});
test('each entrance lies on the requested exterior edge',()=>{
 for(const side of['north','south','east','west']){const d=generateHouse(base,4,side,()=>.4).shapes.at(-1);const [a,b]=d.points;assert.equal(side==='north'?a.y:side==='south'?a.y:side==='west'?a.x:a.x,side==='north'?100:side==='south'?500:side==='west'?100:500);assert.equal(Math.hypot(a.x-b.x,a.y-b.y),50);}
});
test('annexes preserve the shared wall and create a connecting door in all four directions',()=>{
 for(const edge of annexEdges(base)){
  const rect=annexRect(edge),next=attachAnnex([base],base.id,edge,rect,{idFactory:id});
  assert.equal(next.length,3);assert.equal(next.find(s=>s.type==='wall').interior,true);assert.equal(next.filter(s=>s.type==='door').length,1);
  assert.equal(roomRings(next.find(s=>s.id===base.id)).reduce((n,r)=>n+area(r),0),200000);
  assert.equal(validState(state(next)),true);assert.equal(validCampaign(makeCampaign(state(next),id)),true);
 }
});
test('annex collision checks permit touching boundaries, reject occupied space and world overflow',()=>{
 const edge=annexEdges(base).find(e=>e.normal.x===1),rect=annexRect(edge);
 assert.equal(overlapsBuilding(rect,[base]),false);
 assert.throws(()=>attachAnnex([base,{...rect,id:'occupied'}],base.id,edge,rect,{idFactory:id}),/bereits/);
 assert.throws(()=>attachAnnex([base],base.id,edge,{...rect,w:20000},{idFactory:id}),/außerhalb/);
 const l={id:'l',type:'room',rings:[[{x:0,y:0},{x:400,y:0},{x:400,y:100},{x:100,y:100},{x:100,y:400},{x:0,y:400}]]};
 assert.equal(overlapsBuilding({x:150,y:150,w:100,h:100},[l]),false);assert.equal(overlapsBuilding({x:50,y:50,w:100,h:100},[l]),true);
});
test('repeated annexes leave inner walls in place and do not duplicate existing doors',()=>{
 const edge=annexEdges(base)[0],entry={id:'old-door',type:'door',open:true,points:[{x:275,y:100},{x:325,y:100}]};
 const next=attachAnnex([base,entry],base.id,edge,annexRect(edge),{idFactory:id});assert.equal(next.filter(s=>s.type==='door').length,1);assert.equal(next.find(s=>s.id==='old-door').open,true);
 const shape=next.find(s=>s.id===base.id),edge2=annexEdges(shape).find(e=>e.normal.y===-1);const result=attachAnnex(next,base.id,edge2,annexRect(edge2),{idFactory:id});assert.equal(result.filter(s=>s.type==='wall').length,2);
 assert.equal(annexEdges({...base,interior:true}).length,0);assert.equal(annexEdges({...base,type:'ellipse'}).length,0);
});
