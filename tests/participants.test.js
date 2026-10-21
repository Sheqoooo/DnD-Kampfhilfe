import test from'node:test';import assert from'node:assert/strict';
import{removeParticipant}from'../dist/participants.js';
import{order,validState}from'../dist/core.js';
import{makeCampaign,saveEncounter,validCampaign}from'../dist/campaign.js';
import{createPreparation,savePreparation}from'../dist/preparations.js';
import{recordChange,undoChange,redoChange}from'../dist/history.js';
const person=(id,kind,turnPosition)=>({id,name:id,kind,turnPosition,hp:8,max:10,init:0,x:75,y:75});
const scene=()=>({version:1,title:'Kapelle',started:true,manualOrder:true,round:3,active:'b',people:[person('c','enemy',2),person('a','ally',0),person('b','enemy',1)],shapes:[{id:'room',type:'rect',x:0,y:0,w:200,h:200}]});
test('removing the active participant chooses the next displayed person and keeps the round and map',()=>{
 const s=scene(),shapes=structuredClone(s.shapes);removeParticipant(s,'b');
 assert.equal(s.active,'c');assert.equal(s.round,3);assert.deepEqual(order(s.people).map(p=>p.id),['a','c']);assert.deepEqual(s.shapes,shapes);assert.ok(validState(s));
});
test('removing someone else preserves the active turn; removing the last active person wraps without advancing the round',()=>{
 const s=scene();removeParticipant(s,'a');assert.equal(s.active,'b');
 s.active='c';removeParticipant(s,'c');assert.equal(s.active,'b');assert.equal(s.round,3);
 removeParticipant(s,'b');assert.deepEqual(s.people,[]);assert.equal(s.active,null);assert.ok(validState(s));
 const before=structuredClone(s);assert.equal(removeParticipant(s,'missing'),null);assert.deepEqual(s,before);
});
test('removal affects only this battle copy, survives save, and undo restores HP, position and turn',()=>{
 let n=0;const campaign=makeCampaign(scene(),()=>`id-${++n}`,1000),state=structuredClone(campaign.encounters[0]);
 campaign.enemies=[{id:'enemy-template',name:'b',max:10,init:0}];const heroes=structuredClone(campaign.characters),enemies=structuredClone(campaign.enemies),old={...structuredClone(state),id:'old-battle'};campaign.encounters.push(old);
 const past=[],future=[],before={campaign:structuredClone(campaign),state:structuredClone(state)};recordChange(past,future,before);
 removeParticipant(state,'a');saveEncounter(campaign,state,2000);
 assert.deepEqual(campaign.characters,heroes);assert.deepEqual(campaign.enemies,enemies);assert.deepEqual(campaign.encounters.find(e=>e.id==='old-battle'),old);assert.ok(validCampaign(JSON.parse(JSON.stringify(campaign))));
 const after={campaign,state},restored=undoChange(past,future,after);assert.deepEqual(restored,before);assert.deepEqual(redoChange(past,future,restored),after);
});
test('removing a prepared hero leaves the reusable character and active battle intact',()=>{
 let n=0;const campaign=makeCampaign(scene(),()=>`id-${++n}`,1000),battle=structuredClone(campaign.encounters[0]),characters=structuredClone(campaign.characters);
 const p=createPreparation(campaign,{title:'Vorbereitung',source:battle,characterIds:characters.map(c=>c.id)},()=>`id-${++n}`,2000);campaign.editingPreparationId=p.id;
 removeParticipant(p,p.people.find(x=>x.kind==='ally').id);savePreparation(campaign,p,3000);
 assert.equal(campaign.preparations[0].people.filter(p=>p.kind==='ally').length,0);assert.deepEqual(campaign.characters,characters);assert.deepEqual(campaign.encounters[0],battle);assert.ok(validCampaign(campaign));
});
