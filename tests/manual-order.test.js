import test from 'node:test';
import assert from 'node:assert/strict';
import {order,prepareManualOrder,reorderCombatants,advance} from '../dist/core.js';
import {beginEncounter,makeCampaign,spawnEnemy,saveEncounter,validCampaign} from '../dist/campaign.js';
const p=(id,init)=>({id,name:id,kind:'enemy',init,x:25,y:25,hp:10,max:10});
test('legacy saves keep their order and active turn, additions append regardless of old initiative',()=>{
 const s={version:1,id:'fight',title:'Manual',round:3,active:'a',people:[p('a',10),p('b',20)],shapes:[]};
 prepareManualOrder(s);assert.deepEqual(order(s.people).map(p=>p.id),['b','a']);assert.equal(s.active,'a');
 spawnEnemy(s,{id:'template',name:'Dragon',max:20,init:999},'new');prepareManualOrder(s);
 assert.deepEqual(order(s.people).map(p=>p.id),['b','a','new']);assert.equal(s.active,'a');
 reorderCombatants(s.people,'new','b');prepareManualOrder(s);assert.deepEqual(order(s.people).map(p=>p.id),['new','b','a']);
 s.people[0].init=999;prepareManualOrder(s);assert.deepEqual(order(s.people).map(p=>p.id),['new','b','a']);
 advance(s);assert.equal(s.active,'new');assert.equal(s.round,4);
 let n=0;const c=makeCampaign(s,()=>String(++n));saveEncounter(c,{...s,id:c.activeId});assert.equal(validCampaign(JSON.parse(JSON.stringify(c))),true);
});
test('new battles use chosen character order without initiative bonuses',()=>{
 const c={characters:[{id:'a',name:'First',initMod:-10},{id:'b',name:'Second',initMod:99}],encounters:[]};let n=0;
 const s=beginEncounter(c,'New',['a','b'],()=>String(++n));
 assert.deepEqual(order(s.people).map(p=>p.characterId),['a','b']);assert.equal(s.active,s.people[0].id);
 assert.ok(s.people.every(p=>p.init===0));
});
