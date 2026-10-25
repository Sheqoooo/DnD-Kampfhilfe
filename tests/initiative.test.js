import test from'node:test';import assert from'node:assert/strict';
import{setInitiatives,sortInitiative,hasInitiative}from'../dist/initiative.js';
import{order,validState}from'../dist/core.js';
import{recordChange,undoChange,redoChange}from'../dist/history.js';
const make=()=>({version:1,title:'Waldkapelle',round:3,started:true,active:'hero',manualOrder:true,people:['hero','orc','goblin','unknown'].map((id,i)=>({id,name:id,kind:i?'enemy':'ally',hp:7,max:10,init:0,turnPosition:i,x:100+i*50,y:200})),shapes:[{id:'room',type:'rect',x:0,y:0,w:100,h:100}]});
test('entered initiative sorts descending with stable ties and unentered people last',()=>{
 const s=make(),before=structuredClone(s);setInitiatives(s,[{id:'hero',value:12},{id:'orc',value:18},{id:'goblin',value:12},{id:'unknown',value:null}]);
 assert.deepEqual(order(s.people).map(p=>p.id),['orc','hero','goblin','unknown']);assert.equal(s.active,'hero');assert.equal(s.round,3);assert.deepEqual(s.shapes,before.shapes);assert.deepEqual(s.people.map(p=>[p.hp,p.x,p.y]),before.people.map(p=>[p.hp,p.x,p.y]));assert.equal(s.initiativeEnabled,true);
});
test('zero and negative rolled initiatives remain distinct from blank entries',()=>{
 const s=make();setInitiatives(s,[{id:'hero',value:0},{id:'orc',value:-2},{id:'goblin',value:-1}]);assert.deepEqual(order(s.people).map(p=>p.id),['hero','goblin','orc','unknown']);assert.equal(hasInitiative(s.people[0]),true);assert.equal(hasInitiative(s.people[3]),false);
});
test('before the first turn sorting selects the highest roll and later additions keep the running turn',()=>{
 const s=make();s.started=false;s.round=1;setInitiatives(s,[{id:'hero',value:8},{id:'orc',value:18}]);assert.equal(s.active,'orc');
 s.started=true;s.people.push({id:'new',name:'Troll',kind:'enemy',hp:20,max:20,init:22,initiativeSet:true,turnPosition:4,x:100,y:100});sortInitiative(s);assert.equal(order(s.people)[0].id,'new');assert.equal(s.active,'orc');assert.equal(s.round,1);
});
test('invalid batch input is rejected atomically',()=>{
 for(const entries of [[{id:'missing',value:10}],[{id:'hero',value:1000}],[{id:'hero',value:NaN}],[{id:'hero',value:2.5}],[{id:'hero',value:10},{id:'hero',value:12}]]){
  const s=make(),before=structuredClone(s);assert.throws(()=>setInitiatives(s,entries));assert.deepEqual(s,before);
 }
});
test('initiative flags persist, legacy saves remain valid and clearing all values preserves manual order',()=>{
 const s=make();assert.ok(validState(s));setInitiatives(s,[{id:'orc',value:18}]);const restored=JSON.parse(JSON.stringify(s));assert.ok(validState(restored));assert.equal(restored.people.find(p=>p.id==='orc').initiativeSet,true);
 const ids=order(restored.people).map(p=>p.id);setInitiatives(restored,restored.people.map(p=>({id:p.id,value:null})));assert.equal(restored.initiativeEnabled,false);assert.deepEqual(order(restored.people).map(p=>p.id),ids);
 restored.people[0].initiativeSet='yes';assert.equal(validState(restored),false);
});
test('initiative entry and sorting undo and redo as one change',()=>{
 const s=make(),before=structuredClone(s),past=[],future=[];recordChange(past,future,s);setInitiatives(s,[{id:'orc',value:19},{id:'hero',value:11}]);assert.deepEqual(undoChange(past,future,s),before);assert.deepEqual(redoChange(past,future,before),s);
});
