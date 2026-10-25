import test from'node:test';import assert from'node:assert/strict';
import{saveMap,renameMap,removeMap,loadMap,validMapLibrary}from'../dist/map-library.js';
import{makeCampaign,validCampaign}from'../dist/campaign.js';
import{recordChange,undoChange,redoChange}from'../dist/history.js';
const view={x:-500,y:-350,width:2000,height:1400,zoom:.5};
function setup(){let n=0;const uid=()=>`map-${++n}`;const state={version:1,title:'Laufender Kampf',round:4,active:'hero',people:[{id:'hero',name:'Ada',kind:'ally',hp:7,max:15,init:0,x:300,y:250},{id:'enemy',name:'Ork',kind:'enemy',hp:3,max:20,init:0,x:450,y:250}],shapes:[{id:'room',type:'rect',x:100,y:100,w:300,h:200},{id:'water',type:'room',terrain:'water',sketch:true,rings:[[{x:0,y:300},{x:500,y:300},{x:400,y:500}]]},{id:'door',type:'door',points:[{x:200,y:100},{x:250,y:100}],open:true}]};const campaign=makeCampaign(state,uid,1000);return{state:structuredClone(campaign.encounters[0]),campaign,uid};}
test('maps save only independent geometry and camera, never people or combat state',()=>{
 const{state,campaign,uid}=setup(),before=structuredClone(campaign);const m=saveMap(campaign,{title:'Waldkapelle',shapes:state.shapes,view},uid,2000);
 assert.deepEqual(Object.keys(m).sort(),['createdAt','id','savedAt','shapes','title','view']);assert.deepEqual(campaign.encounters,before.encounters);assert.deepEqual(campaign.characters,before.characters);
 assert.notEqual(m.shapes,state.shapes);state.shapes[0].w=50;assert.equal(m.shapes[0].w,300);assert.deepEqual(m.view,view);assert.ok(validCampaign(JSON.parse(JSON.stringify(campaign))));
});
test('loading replaces only map geometry, preserves combat and master data and keeps the saved field reusable',()=>{
 const{state,campaign,uid}=setup();const m=saveMap(campaign,{title:'Hafen',shapes:state.shapes,view},uid);state.shapes=[];const before=structuredClone(state),library=structuredClone(campaign.maps),characters=structuredClone(campaign.characters);
 loadMap(state,m,uid);assert.deepEqual(state.people,before.people);assert.equal(state.round,4);assert.equal(state.active,before.active);assert.equal(state.title,before.title);assert.equal(state.shapes.length,3);assert.equal(state.shapes[2].open,true);assert.equal(state.shapes[1].sketch,true);assert.notEqual(state.shapes[0].id,m.shapes[0].id);
 state.shapes[0].w=123;assert.deepEqual(campaign.maps,library);assert.deepEqual(campaign.characters,characters);
});
test('multiple maps can be renamed, copied and explicitly updated without linking their geometry',()=>{
 const{state,campaign,uid}=setup();const a=saveMap(campaign,{title:'A',shapes:state.shapes},uid,10),b=saveMap(campaign,{title:'B',shapes:a.shapes},uid,20);
 renameMap(campaign,a.id,'Kapelle',30);assert.equal(campaign.maps[0].title,'Kapelle');assert.equal(campaign.maps[1].title,'B');state.shapes=[];saveMap(campaign,{id:a.id,title:'Kapelle',shapes:state.shapes},uid,40);
 assert.equal(campaign.maps[0].shapes.length,0);assert.equal(campaign.maps[0].createdAt,10);assert.equal(b.shapes.length,3);
 removeMap(campaign,a.id);assert.equal(campaign.maps.length,1);assert.equal(campaign.maps[0].id,b.id);
});
test('load and library deletion are reversible with existing campaign history',()=>{
 const{state,campaign,uid}=setup();const m=saveMap(campaign,{title:'Leer',shapes:[]},uid),before={state:structuredClone(state),campaign:structuredClone(campaign)},past=[],future=[];
 recordChange(past,future,before);loadMap(state,m,uid);const after={state,campaign};assert.deepEqual(undoChange(past,future,after),before);assert.equal(redoChange(past,future,before).state.shapes.length,0);
 recordChange(past,future,before);removeMap(campaign,m.id);assert.deepEqual(undoChange(past,future,{state,campaign}).campaign.maps,before.campaign.maps);
});
test('legacy backups remain valid, malformed map backups are rejected and invalid operations are atomic',()=>{
 const{state,campaign,uid}=setup();assert.ok(validCampaign(campaign));const m=saveMap(campaign,{title:'Ort',shapes:state.shapes,view},uid),before=structuredClone(campaign);
 for(const mutate of [p=>p.maps[0].people=[],p=>p.maps[0].round=4,p=>p.maps[0].shapes[0].w=-1,p=>p.maps[0].view.zoom=0,p=>p.maps.push(structuredClone(p.maps[0]))]){const p=structuredClone(campaign);mutate(p);assert.equal(validCampaign(p),false);}
 assert.throws(()=>saveMap(campaign,{title:'',shapes:[]},uid));assert.throws(()=>saveMap(campaign,{title:'Ort',shapes:[{type:'script',id:'bad'}]},uid));assert.deepEqual(campaign,before);
 const original=structuredClone(state);assert.throws(()=>loadMap(state,{...m,shapes:[{type:'script',id:'bad'}]},uid));assert.deepEqual(state,original);assert.ok(validMapLibrary(campaign));
});
