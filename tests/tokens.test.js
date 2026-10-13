import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureTokenCodes,tokenCode,tokenSymbol,ensureEnemyNumbers,participantName} from '../dist/tokens.js';
import {makeCampaign,saveEncounter,validCampaign} from '../dist/campaign.js';
const person=(id,name,kind='enemy')=>({id,name,kind,x:25,y:25,hp:12,max:12,init:10});
const encounter=people=>({version:1,id:'fight',title:'Tokens',round:1,active:null,people,shapes:[]});
test('identical enemies and matching player initials get distinct stable markers',()=>{
 const state=encounter([person('g1','Goblin 1'),person('g2','Goblin 2'),person('g3','Goblin'),person('g4','Goblin'),person('l1','Lyra','ally'),person('l2','Luna','ally')]);
 let nextId=0;const campaign=makeCampaign(state,()=> 'id'+(++nextId));
 // Use campaign's migrated character links in the active state.
 const active=structuredClone(campaign.encounters[0]);ensureTokenCodes(campaign,active);
 const before=new Map(active.people.map(p=>[p.id,p.tokenCode]));
 assert.equal(before.get('g1'),'G1');assert.equal(before.get('g2'),'G2');assert.equal(new Set(before.values()).size,6);
 active.people.reverse();active.people.find(p=>p.id==='g1').name='Renamed Orc';ensureTokenCodes(campaign,active);
 for(const p of active.people)assert.equal(p.tokenCode,before.get(p.id));
 for(const c of campaign.characters)assert.equal(c.tokenCode,active.people.find(p=>p.characterId===c.id).tokenCode);
 saveEncounter(campaign,active);const restored=JSON.parse(JSON.stringify(campaign));
 assert.equal(validCampaign(restored),true);ensureTokenCodes(restored,restored.encounters[0]);
 assert.deepEqual(new Map(restored.encounters[0].people.map(p=>[p.id,p.tokenCode])),new Map(active.people.map(p=>[p.id,p.tokenCode])));
});
test('inserting or removing a duplicate does not renumber existing markers',()=>{
 const state=encounter([person('a','Goblin'),person('b','Goblin')]),campaign={characters:[],encounters:[]};
 ensureTokenCodes(campaign,state);const before=state.people.map(tokenCode);
 state.people.unshift(person('new','Goblin'));ensureTokenCodes(campaign,state);
 assert.deepEqual(state.people.slice(1).map(tokenCode),before);
 state.people.splice(1,1);ensureTokenCodes(campaign,state);assert.equal(tokenCode(state.people[1]),before[1]);
});
test('explicit type determines symbols; monster names never do',()=>{
 assert.equal(tokenSymbol(person('d','Ancient Dragon')),'token-unknown');
 assert.equal(tokenSymbol({...person('d','Anything'),creatureType:'dragon'}),'token-dragon');
 assert.equal(tokenSymbol({...person('u','Anything'),monsterType:'undead'}),'token-undead');
 assert.equal(tokenSymbol({...person('b','Anything'),creatureType:'beast'}),'token-beast');
 assert.equal(tokenSymbol({...person('h','Anything'),creatureType:'humanoid'}),'character');
 assert.equal(tokenSymbol(person('a','Dragon','ally')),'character');
});
test('invalid or duplicate imported codes are repaired without changing combat data',()=>{
 const state=encounter([person('a','Goblin'),person('b','Goblin')]);state.people[0].tokenCode='G';state.people[1].tokenCode='G';
 const before=structuredClone(state);ensureTokenCodes({characters:[],encounters:[]},state);
 assert.notEqual(state.people[0].tokenCode,state.people[1].tokenCode);
 for(let i=0;i<2;i++){const {tokenCode:ignored,...actual}=state.people[i];const {tokenCode:old,...expected}=before.people[i];assert.deepEqual(actual,expected);}
 state.people[0].tokenCode='<script>';ensureTokenCodes({characters:[],encounters:[]},state);assert.equal(tokenCode(state.people[0]),'G');
});

test('enemy display numbers survive sorting, removal, insertion and reload without renaming data',()=>{
 const state=encounter([person('a','Kultist'),person('b','Kultist'),person('c','Kultist')]);
 state.people[0].tokenCode='K';state.people[1].tokenCode='K6';state.people[2].tokenCode='K7';
 ensureEnemyNumbers(state);assert.deepEqual(state.people.map(participantName),['Kultist 1','Kultist 6','Kultist 7']);
 state.people.reverse();ensureEnemyNumbers(state);assert.deepEqual(state.people.map(participantName),['Kultist 7','Kultist 6','Kultist 1']);
 state.people.pop();state.people.push({...person('d','Kultist'),tokenCode:'K8'});ensureEnemyNumbers(state);
 assert.deepEqual(state.people.map(participantName),['Kultist 7','Kultist 6','Kultist 8']);
 const restored=JSON.parse(JSON.stringify(state));ensureEnemyNumbers(restored);assert.deepEqual(restored,state);
 assert.ok(state.people.every(p=>p.name==='Kultist'&&p.hp===12&&p.x===25&&p.y===25));
});
test('legacy explicit numbers and unnumbered enemies receive distinct numbers',()=>{
 const state=encounter([person('a','Goblin'),person('b','Goblin 1'),person('c','Goblin')]);
 ensureEnemyNumbers(state);assert.equal(new Set(state.people.map(participantName)).size,3);
 assert.equal(participantName(state.people[1]),'Goblin 1');assert.equal(participantName(person('hero','Lyra','ally')),'Lyra');
});

test('new duplicate enemies get matching numbered names and map codes',()=>{
 const state=encounter([person('a','Goblin 1'),person('b','Goblin 2')]),campaign={characters:[],encounters:[]};
 ensureEnemyNumbers(state);ensureTokenCodes(campaign,state);
 for(let i=3;i<=4;i++){state.people.push(person('new'+i,'Goblin'));ensureEnemyNumbers(state);ensureTokenCodes(campaign,state);const p=state.people.at(-1);assert.equal(participantName(p),'Goblin '+i);assert.equal(tokenCode(p),'G'+i);}
});
