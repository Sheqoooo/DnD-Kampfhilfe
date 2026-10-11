
import test from 'node:test';import assert from 'node:assert/strict';
import{makeCampaign,validCampaign,ensureEnemies,rememberEnemy,spawnEnemy,saveEncounter}from'../dist/campaign.js';
const state=()=>({version:1,id:'fight',title:'Enemies',round:1,active:null,people:[],shapes:[]});
test('older campaigns migrate enemies from history and deduplicate repeated combatants',()=>{
 const s=state();s.people=[{id:'a',name:'Goblin 1',kind:'enemy',hp:1,max:12,init:15,x:25,y:25},{id:'b',name:'Goblin 2',kind:'enemy',hp:12,max:12,init:15,x:75,y:25}];s.active='a';let n=0;
 const c=makeCampaign(s,()=> 'id'+(++n));ensureEnemies(c,()=> 'id'+(++n));assert.equal(c.enemies.length,1);assert.equal(c.enemies[0].name,'Goblin');assert.equal(c.enemies[0].max,12);
 ensureEnemies(c,()=> 'duplicate');assert.equal(c.enemies.length,1);assert.equal(validCampaign(c),true);
});
test('each placed copy has independent full HP and a unique id and position',()=>{
 const c=makeCampaign(state(),()=> 'fight');ensureEnemies(c,()=> 'x');const enemy=rememberEnemy(c,{name:'Orc',max:20,init:12},()=> 'orc'),s=state();
 const first=spawnEnemy(s,enemy,'first',{x:200,y:300}),second=spawnEnemy(s,enemy,'second',{x:250,y:300});first.hp=3;
 assert.equal(second.hp,20);assert.equal(enemy.max,20);assert.equal(s.active,'first');assert.equal(second.x,250);
 saveEncounter(c,s);assert.equal(validCampaign(JSON.parse(JSON.stringify(c))),true);
});
test('template editing and removal do not alter placed enemies',()=>{
 const enemy={id:'orc',name:'Orc',max:20,init:12},s=state();spawnEnemy(s,enemy,'copy');
 enemy.max=50;enemy.name='Big Orc';assert.equal(s.people[0].max,20);assert.equal(s.people[0].name,'Orc');
});
test('template values and duplicate ids are checked during import',()=>{
 const c=makeCampaign(state(),()=> 'fight');c.enemies=[{id:'orc',name:'Orc',max:20,init:12}];assert.equal(validCampaign(c),true);
 assert.equal(validCampaign({...c,enemies:[...c.enemies,...c.enemies]}),false);assert.equal(validCampaign({...c,enemies:[{...c.enemies[0],max:-1}]}),false);
});
test('enemy addition enforces participant limit without partial insertion',()=>{
 const s=state();s.people=Array.from({length:100},(_,i)=>({id:'p'+i}));assert.throws(()=>spawnEnemy(s,{id:'o',name:'Orc',max:20,init:12},'new'));assert.equal(s.people.length,100);
});
