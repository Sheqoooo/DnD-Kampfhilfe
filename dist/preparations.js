import {validState, order, prepareManualOrder} from './core.js?v=map-chat-1';

export const PREPARATION_LIMIT=200;
export function validPreparations(campaign){
 const list=campaign.preparations;
 if(list!==undefined&&(!Array.isArray(list)||list.length>PREPARATION_LIMIT))return false;
 const ids=new Set(campaign.encounters.map(e=>e.id));
 for(const p of list??[]){
  if(!validState(p)||typeof p.id!=='string'||ids.has(p.id)||!['place','battle'].includes(p.category)||typeof p.notes!=='string'||p.notes.length>3000||!Number.isFinite(p.createdAt)||!Number.isFinite(p.savedAt)||p.people.some(x=>x.characterId!==undefined&&typeof x.characterId!=='string'))return false;
  ids.add(p.id);
 }
 return campaign.editingPreparationId===undefined||(typeof campaign.editingPreparationId==='string'&&(list??[]).some(p=>p.id===campaign.editingPreparationId));
}
export const isPreparing=campaign=>typeof campaign.editingPreparationId==='string';
export function workspaceState(campaign){
 const stored=isPreparing(campaign)?campaign.preparations?.find(p=>p.id===campaign.editingPreparationId):campaign.encounters.find(e=>e.id===campaign.activeId);
 if(!stored)throw Error('Gespeicherter Ort oder Kampf fehlt.');
 return structuredClone(stored);
}
export function savePreparation(campaign,state,now=Date.now()){
 const i=campaign.preparations?.findIndex(p=>p.id===state.id)??-1;
 if(i<0||campaign.editingPreparationId!==state.id)throw Error('Vorbereitung fehlt.');
 campaign.preparations[i]={...structuredClone(state),savedAt:now};
}
function copyScene(source,idFactory){
 const people=structuredClone(source?.people??[]),shapes=structuredClone(source?.shapes??[]);
 for(const p of people)p.id=idFactory();
 for(const shape of shapes)shape.id=idFactory();
 const state={version:1,id:idFactory(),title:source?.title??'',notes:source?.notes??'',demo:false,started:false,round:1,active:null,people,shapes};
 prepareManualOrder(state);state.active=order(people)[0]?.id??null;return state;
}
function chooseHeroes(state,characters,ids,idFactory,currentValues){
 const selected=new Set(ids),present=new Set();
 state.people=state.people.filter(p=>!p.characterId||selected.has(p.characterId)&&characters.some(c=>c.id===p.characterId));
 for(const p of state.people){
  if(!p.characterId)continue;
  const c=characters.find(c=>c.id===p.characterId);present.add(c.id);
  if(currentValues){const {id,characterId,x,y,turnPosition,mapHidden}=p;Object.assign(p,structuredClone(c),{id,characterId,x,y,turnPosition});if(mapHidden!==undefined)p.mapHidden=mapHidden;}
 }
 for(const c of characters){
  if(!selected.has(c.id)||present.has(c.id))continue;
  const n=state.people.length;state.people.push({...structuredClone(c),id:idFactory(),characterId:c.id,kind:'ally',init:0,turnPosition:n,x:75+(n%18)*50,y:75+(Math.floor(n/18)%12)*50});
 }
 if(state.people.length>100)throw Error('Maximal 100 Beteiligte.');
 prepareManualOrder(state);state.active=order(state.people)[0]?.id??null;
}
export function createPreparation(campaign,{title,category='battle',characterIds=[],source=null},idFactory,now=Date.now()){
 if((campaign.preparations?.length??0)>=PREPARATION_LIMIT)throw Error('Maximal 200 Vorbereitungen.');
 if(!['place','battle'].includes(category))throw Error('Ungültige Vorbereitung.');
 const state=copyScene(source,idFactory);state.title=title.trim().slice(0,80)||'Neues Abenteuer';
 chooseHeroes(state,campaign.characters,characterIds,idFactory,false);
 Object.assign(state,{category,notes:source?.notes??'',createdAt:now,savedAt:now});
 if(!validState(state))throw Error('Ungültige Karte oder Beteiligte.');
 campaign.preparations??=[];campaign.preparations.push(structuredClone(state));return state;
}
export function startPreparation(campaign,id,{title,characterIds,currentHeroValues=true},idFactory,now=Date.now()){
 if(campaign.encounters.length>=500)throw Error('Maximal 500 Kämpfe.');
 const source=campaign.preparations?.find(p=>p.id===id);if(!source)throw Error('Vorbereitung fehlt.');
 const state=copyScene(source,idFactory);state.title=(title??source.title).trim().slice(0,80)||'Ein neues Abenteuer';
 chooseHeroes(state,campaign.characters,characterIds,idFactory,currentHeroValues);
 for(const p of state.people)if(p.kind==='enemy')p.hp=p.max;
 if(!validState(state))throw Error('Ungültige Karte oder Beteiligte.');
 campaign.encounters.push({...structuredClone(state),createdAt:now,savedAt:now});
 campaign.activeId=state.id;delete campaign.editingPreparationId;return state;
}
