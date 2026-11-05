import test from'node:test';import assert from'node:assert/strict';
import{setCombatOrder,moveToPosition,setCurrentHp,HpCorrections}from'../dist/combat-edit.js';
import{insertByInitiative}from'../dist/initiative.js';import{order}from'../dist/core.js';
import{makeCampaign,syncCharacterChanges}from'../dist/campaign.js';
const state=()=>({version:1,id:'battle',title:'Kapelle',round:3,active:'b',started:true,manualOrder:true,people:['a','b','c'].map((id,i)=>({id,name:id,kind:i?'enemy':'ally',hp:10,max:20,init:[12,18,8][i],initiativeSet:true,turnPosition:i,x:100+i*50,y:100})),shapes:[{id:'wall',type:'wall',points:[{x:0,y:0},{x:100,y:0}]}]});
test('direct placement and full order editing preserve active turn, round, HP and map',()=>{
 const s=state(),before=structuredClone(s);setCombatOrder(s,moveToPosition(['a','b','c'],'c',1));assert.deepEqual(order(s.people).map(p=>p.id),['c','a','b']);assert.equal(s.active,'b');assert.equal(s.round,3);assert.deepEqual(s.shapes,before.shapes);assert.deepEqual(s.people.map(p=>p.hp),before.people.map(p=>p.hp));
 assert.deepEqual(moveToPosition(['a','b','c'],'a',3),['b','c','a']);
});
test('invalid or stale order edits fail before any mutation',()=>{
 const s=state(),before=structuredClone(s);for(const ids of [['a','b'],['a','a','b'],['a','b','missing']])assert.throws(()=>setCombatOrder(s,ids));assert.deepEqual(s,before);assert.throws(()=>moveToPosition(['a'],'a',0));
});
test('exact HP correction supports zero and max, rejecting invalid values atomically',()=>{
 const s=state();setCurrentHp(s,'a',0);assert.equal(s.people[0].hp,0);setCurrentHp(s,'a',20);assert.equal(s.people[0].hp,20);
 for(const value of [-1,21,2.5,NaN]){assert.throws(()=>setCurrentHp(s,'a',value));assert.equal(s.people[0].hp,20);}assert.throws(()=>setCurrentHp(s,'missing',5));
});
test('targeted correction reverts only that person after another HP change, turn and order changes',()=>{
 const s=state(),h=new HpCorrections();let before=structuredClone(s);setCurrentHp(s,'a',7);h.capture(before,s);before=structuredClone(s);setCurrentHp(s,'b',4);h.capture(before,s);
 s.active='c';s.round=4;setCombatOrder(s,['c','b','a']);h.revert(s,'a');assert.equal(s.people[0].hp,10);assert.equal(s.people[1].hp,4);assert.equal(s.active,'c');assert.equal(s.round,4);assert.deepEqual(order(s.people).map(p=>p.id),['c','b','a']);assert.equal(h.get(s,'a'),null);assert.ok(h.get(s,'b'));
});
test('correction tracks the latest HP change and invalidates stale or out-of-range reversions',()=>{
 const s=state(),h=new HpCorrections();for(const hp of [7,5]){const before=structuredClone(s);setCurrentHp(s,'a',hp);h.capture(before,s);}assert.equal(h.get(s,'a').before,7);
 s.people[0].max=6;assert.equal(h.get(s,'a'),null);s.people[0].max=20;s.people[0].hp=3;assert.equal(h.get(s,'a'),null);h.clear();assert.equal(h.get(s,'a'),null);
});
test('correction history is session-local and clears on changing encounter',()=>{
 const s=state(),h=new HpCorrections(),before=structuredClone(s);setCurrentHp(s,'a',7);h.capture(before,s);const other={...structuredClone(s),id:'other'};h.capture(s,other);assert.equal(h.get(s,'a'),null);assert.equal(h.get(other,'a'),null);assert.equal(JSON.stringify(s).includes('changes'),false);
});
test('exact HP and targeted reversal sync master heroes through the existing campaign path',()=>{
 let i=0;const campaign=makeCampaign(state(),()=>`id-${++i}`),s=structuredClone(campaign.encounters[0]),h=new HpCorrections(),before=structuredClone(s);setCurrentHp(s,'a',3);h.capture(before,s);syncCharacterChanges(campaign,before,s);assert.equal(campaign.characters[0].hp,3);const damaged=structuredClone(s);h.revert(s,'a');syncCharacterChanges(campaign,damaged,s);assert.equal(campaign.characters[0].hp,10);
});
test('later initiative additions preserve the relative manual order of existing people',()=>{
 const s=state();setCombatOrder(s,['c','a','b']);s.people.push({id:'new',name:'new',kind:'enemy',hp:20,max:20,init:16,initiativeSet:true,turnPosition:3,x:0,y:0});insertByInitiative(s,['new']);assert.deepEqual(order(s.people).filter(p=>p.id!=='new').map(p=>p.id),['c','a','b']);assert.equal(order(s.people)[0].id,'new');assert.equal(s.active,'b');
 const sorted=state();setCombatOrder(sorted,['b','a','c']);sorted.people.push({...s.people.at(-1),id:'late'});insertByInitiative(sorted,['late']);assert.deepEqual(order(sorted.people).map(p=>p.id),['b','late','a','c']);
});
