import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCampaign,validCampaign,saveEncounter} from '../dist/campaign.js';
import {createPreparation,startPreparation,savePreparation,workspaceState,PREPARATION_LIMIT} from '../dist/preparations.js';
import {recordChange,undoChange,redoChange} from '../dist/history.js';

function setup(){
 let n=0;const uid=()=>`new-${++n}`;
 const battle={version:1,title:'Aktueller Kampf',started:true,round:4,active:'hero',people:[{id:'hero',name:'Lyra',kind:'ally',hp:7,max:30,init:0,x:300,y:250,turnPosition:0},{id:'enemy',name:'Ork',kind:'enemy',hp:2,max:20,init:0,x:500,y:350,turnPosition:1}],shapes:[{id:'room',type:'rect',x:200,y:150,w:400,h:300},{id:'door',type:'door',points:[{x:200,y:200},{x:200,y:250}],open:true}]};
 const campaign=makeCampaign(battle,uid,1000);return {uid,campaign,battle:workspaceState(campaign),heroId:campaign.characters[0].id};
}
test('preparing an existing scene deeply copies it without changing battle, hero HP or active battle',()=>{
 const {uid,campaign,battle,heroId}=setup(),before=structuredClone(campaign);
 const p=createPreparation(campaign,{title:'Kapelle',category:'place',characterIds:[heroId],source:battle},uid,2000);
 assert.deepEqual(campaign.encounters,before.encounters);assert.deepEqual(campaign.characters,before.characters);assert.equal(campaign.activeId,before.activeId);
 assert.equal(p.people[0].hp,7);assert.equal(p.people[1].hp,2);assert.equal(p.people[0].x,300);assert.equal(p.shapes[1].open,true);
 assert.equal(p.round,1);assert.equal(p.started,false);assert.notEqual(p.id,battle.id);assert.notEqual(p.people[0].id,battle.people[0].id);assert.notEqual(p.shapes[0].id,battle.shapes[0].id);
 p.shapes[0].w=100;p.people[0].hp=1;
 assert.equal(battle.shapes[0].w,400);assert.equal(campaign.preparations[0].shapes[0].w,400);assert.equal(campaign.characters[0].hp,7);
 campaign.editingPreparationId=p.id;savePreparation(campaign,p,3000);
 const restored=JSON.parse(JSON.stringify(campaign));assert.ok(validCampaign(restored));assert.equal(workspaceState(restored).people[0].hp,1);assert.equal(workspaceState(restored).shapes[0].w,100);
 delete restored.editingPreparationId;assert.deepEqual(workspaceState(restored),before.encounters[0]);
});
test('starting a prepared fight uses current hero values and full enemy HP, keeps positions and template intact',()=>{
 const {uid,campaign,battle,heroId}=setup();
 const p=createPreparation(campaign,{title:'Kapelle',characterIds:[heroId],source:battle},uid,2000),template=structuredClone(campaign.preparations[0]),original=structuredClone(campaign.encounters[0]);
 campaign.characters[0].hp=19;campaign.characters[0].ac=18;campaign.editingPreparationId=p.id;
 const first=startPreparation(campaign,p.id,{characterIds:[heroId]},uid,3000);
 assert.equal(first.people[0].hp,19);assert.equal(first.people[0].ac,18);assert.equal(first.people[0].x,300);assert.equal(first.people[0].characterId,heroId);assert.equal(first.people[1].hp,20);assert.equal(first.round,1);assert.equal(first.active,first.people[0].id);
 assert.equal(campaign.editingPreparationId,undefined);assert.equal(campaign.activeId,first.id);assert.deepEqual(campaign.encounters[0],original);assert.deepEqual(campaign.preparations[0],template);
 first.people[1].hp=0;first.shapes[0].w=200;saveEncounter(campaign,first,4000);
 const second=startPreparation(campaign,p.id,{characterIds:[heroId]},uid,5000);
 assert.notEqual(first.id,second.id);assert.notEqual(first.people[0].id,second.people[0].id);assert.notEqual(first.shapes[0].id,second.shapes[0].id);assert.equal(second.people[1].hp,20);assert.equal(second.shapes[0].w,400);assert.deepEqual(campaign.preparations[0],template);assert.ok(validCampaign(campaign));
});
test('hero selection supports planned snapshots, additional heroes and removed master characters',()=>{
 const {uid,campaign,battle,heroId}=setup();
 const p=createPreparation(campaign,{title:'Brücke',source:battle,characterIds:[heroId]},uid);
 campaign.characters[0].hp=29;const extra={...campaign.characters[0],id:uid(),name:'Thorin'};campaign.characters.push(extra);
 const planned=startPreparation(campaign,p.id,{characterIds:[heroId,extra.id],currentHeroValues:false},uid);
 assert.equal(planned.people.find(x=>x.characterId===heroId).hp,7);assert.equal(planned.people.find(x=>x.characterId===extra.id).hp,29);
 const withoutHero=startPreparation(campaign,p.id,{characterIds:[]},uid);assert.deepEqual(withoutHero.people.map(x=>x.kind),['enemy']);
 campaign.characters=campaign.characters.filter(c=>c.id!==heroId);
 const deleted=startPreparation(campaign,p.id,{characterIds:[heroId]},uid);assert.equal(deleted.people.length,1);assert.ok(validCampaign(campaign));
});
test('blank places, duplicated scenes and preparation notes round-trip through full backups',()=>{
 const {uid,campaign,heroId}=setup();const empty=createPreparation(campaign,{title:'Wald',category:'place'},uid,2000);assert.equal(empty.people.length,0);assert.equal(empty.active,null);assert.equal(empty.shapes.length,0);
 const p=createPreparation(campaign,{title:'Höhle',characterIds:[heroId]},uid,3000);campaign.editingPreparationId=p.id;p.notes='Zwei Wachen am Eingang';savePreparation(campaign,p,4000);
 const copy=createPreparation(campaign,{title:'Höhle · Kopie',category:p.category,characterIds:[heroId],source:p},uid,5000);
 assert.equal(copy.notes,p.notes);const started=startPreparation(campaign,p.id,{characterIds:[heroId]},uid);assert.equal(started.notes,p.notes);assert.notEqual(copy.people[0].id,p.people[0].id);assert.ok(validCampaign(JSON.parse(JSON.stringify(campaign))));
});
test('validation rejects malformed preparations and dangling editor references, accepts old campaigns',()=>{
 const {uid,campaign}=setup();assert.ok(validCampaign(campaign));createPreparation(campaign,{title:'Ort'},uid,2000);
 for(const change of [c=>c.preparations[0].category='unknown',c=>c.preparations[0].notes=42,c=>c.preparations[0].savedAt=null,c=>c.preparations[0].id=c.activeId,c=>c.preparations.push(structuredClone(c.preparations[0])),c=>c.editingPreparationId='missing',c=>c.preparations[0].shapes=[{id:'bad',type:'rect',x:0,y:0,w:-5,h:50}]]){const c=structuredClone(campaign);change(c);assert.equal(validCampaign(c),false);}
 campaign.preparations=Array.from({length:PREPARATION_LIMIT+1},()=>campaign.preparations[0]);assert.equal(validCampaign(campaign),false);
});
test('capacity errors do not partly mutate a campaign',()=>{
 const {uid,campaign}=setup();campaign.preparations=Array.from({length:PREPARATION_LIMIT},()=>({}));let before=structuredClone(campaign);assert.throws(()=>createPreparation(campaign,{title:'Zu viel'},uid));assert.deepEqual(campaign,before);
 campaign.preparations=[];const p=createPreparation(campaign,{title:'Ort'},uid);campaign.encounters=Array.from({length:500},()=>campaign.encounters[0]);before=structuredClone(campaign);assert.throws(()=>startPreparation(campaign,p.id,{characterIds:[]},uid));assert.deepEqual(campaign,before);
});
test('undo and redo restore preparation content and editing context together',()=>{
 const {uid,campaign}=setup();let current={campaign,state:workspaceState(campaign)};const history=[],future=[];recordChange(history,future,current);
 current.state=createPreparation(current.campaign,{title:'Wald'},uid);current.campaign.editingPreparationId=current.state.id;const prepared=structuredClone(current);
 const old=undoChange(history,future,current);assert.equal(old.campaign.editingPreparationId,undefined);assert.equal(old.state.title,'Aktueller Kampf');assert.equal(old.campaign.preparations,undefined);
 const restored=redoChange(history,future,old);assert.deepEqual(restored,prepared);assert.ok(validCampaign(restored.campaign));
});
