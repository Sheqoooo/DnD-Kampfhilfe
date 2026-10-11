
import {clamp,validState} from './core.js?v=edit-order-1';
export const CAMPAIGN_KEY='initiative.campaign.v2';
export const HERO_FIELDS=['name','hp','max','ac','initMod','characterClass','level','notes','conditions'];
export function characterFrom(p,id){return{id,name:p.name,hp:p.hp,max:p.max,ac:p.ac??10,initMod:p.initMod??0,characterClass:p.characterClass??'',level:p.level??1,notes:p.notes??'',conditions:p.conditions??''};}
export function addCharacter(campaign,character){if(campaign.characters.some(c=>c.id===character.id))throw Error('Duplicate character');campaign.characters.push(character);}
export function makeCampaign(encounter,idFactory,now=Date.now()){const s=structuredClone(encounter),characters=[];for(const p of s.people){if(p.kind==='ally'){const id=idFactory();p.characterId=id;characters.push(characterFrom(p,id));}}s.id=idFactory();return{version:2,activeId:s.id,characters,encounters:[{...s,createdAt:now,savedAt:now}]};}
export function saveEncounter(campaign,state,now=Date.now()){const i=campaign.encounters.findIndex(e=>e.id===state.id),previous=campaign.encounters[i];const record={...structuredClone(state),createdAt:previous?.createdAt??now,savedAt:now};if(i<0)campaign.encounters.push(record);else campaign.encounters[i]=record;campaign.activeId=state.id;}
export function syncCharacterChanges(campaign,before,after){for(const p of after.people){if(!p.characterId)continue;const c=campaign.characters.find(x=>x.id===p.characterId),old=before.people.find(x=>x.id===p.id);if(!c||!old)continue;for(const field of HERO_FIELDS)if(p[field]!==old[field]&&p[field]!==undefined)c[field]=p[field];c.hp=clamp(c.hp,0,c.max);}}
export function addToEncounter(state,c,id,initiative=10){if(state.people.some(p=>p.characterId===c.id))return false;if(state.people.length>=100)throw Error('Maximal 100 Beteiligte');const n=state.people.length;state.people.push({...structuredClone(c),id,characterId:c.id,kind:'ally',init:initiative,x:75+(n%18)*50,y:75+(Math.floor(n/18)%12)*50});return true;}
export function validCampaign(c){if(!c||c.version!==2||!Array.isArray(c.characters)||c.characters.length>500||!Array.isArray(c.encounters)||c.encounters.length>500)return false;const ids=new Set();for(const p of c.characters){if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>50||!Number.isInteger(p.max)||p.max<1||p.max>9999||!Number.isInteger(p.hp)||p.hp<0||p.hp>p.max||!Number.isInteger(p.ac)||p.ac<0||p.ac>99||!Number.isInteger(p.initMod)||p.initMod<-99||p.initMod>99||!Number.isInteger(p.level)||p.level<1||p.level>20)return false;for(const field of ['notes','conditions','characterClass'])if(typeof p[field]!=='string'||p[field].length>3000)return false;ids.add(p.id);}const encounters=new Set();for(const e of c.encounters){if(!validState(e)||typeof e.id!=='string'||encounters.has(e.id)||!Number.isFinite(e.createdAt)||!Number.isFinite(e.savedAt))return false;encounters.add(e.id);for(const p of e.people)if(p.characterId!==undefined&&typeof p.characterId!=='string')return false;}return encounters.has(c.activeId);}

export function updateCharacter(campaign,state,id,values){
 const c=campaign.characters.find(x=>x.id===id);if(!c)throw Error('Character missing');
 Object.assign(c,values);c.hp=clamp(c.hp,0,c.max);
 for(const p of state.people)if(p.characterId===id)for(const f of HERO_FIELDS)p[f]=c[f];
}
export function beginEncounter(campaign,title,characterIds,idFactory,now=Date.now()){
 if(campaign.encounters.length>=500)throw Error('Maximal 500 Kämpfe');
 const s={version:1,id:idFactory(),title:title.trim().slice(0,80)||'Ein neues Abenteuer',demo:false,started:false,round:1,active:null,people:[],shapes:[]};
 for(const c of campaign.characters)if(characterIds.includes(c.id))addToEncounter(s,c,idFactory(),10+c.initMod);
 s.active=[...s.people].sort((a,b)=>b.init-a.init)[0]?.id??null;
 saveEncounter(campaign,s,now);return s;
}
