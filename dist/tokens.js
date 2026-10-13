// Optional display metadata only: never changes combat IDs, coordinates or rules.
const firstLetter=name=>(String(name).trim().match(/[\p{L}\p{N}]/u)?.[0]||'?').toLocaleUpperCase('de');
const safeCode=code=>typeof code==='string'&&/^[\p{L}\p{N}?]{1,7}$/u.test(code);
export const tokenCode=p=>safeCode(p.tokenCode)?p.tokenCode:firstLetter(p.name);
export function tokenSymbol(p){
 if(p.kind!=='enemy')return 'character';
 // Only explicit type metadata, never guesses based on names.
 const type=String(p.creatureType??p.monsterType??'').toLowerCase();
 return ({humanoid:'character',beast:'token-beast',undead:'token-undead',dragon:'token-dragon'})[type]||'token-unknown';
}
export function ensureTokenCodes(campaign,state){
 const groups=new Map(),used=new Map();
 const add=(p,key)=>{if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);};
 for(const c of campaign.characters)add(c,'character:'+c.id);
 for(const encounter of [...campaign.encounters,state])for(const p of encounter.people)add(p,p.characterId?'character:'+p.characterId:'person:'+p.id);
 // Reserve existing labels first, so newly inserted or renamed people cannot steal them.
 const assigned=new Map();
 for(const [key,people] of groups){
  const code=people.map(p=>p.tokenCode).find(safeCode);
  if(code&&!used.has(code)){assigned.set(key,code);used.set(code,key);}
 }
 for(const [key,people] of groups){
  let code=assigned.get(key);
  if(!code){
   const name=people[0].name,base=firstLetter(name),number=String(name).match(/\s+(\d{1,5})\s*$/)?.[1]||(people[0].kind==='enemy'&&validEnemyNumber(people[0].enemyNumber)?String(people[0].enemyNumber):null);
   code=base+(number||'');let n=number?Number(number)+1:2;
   while(used.has(code))code=base+n++;
   used.set(code,key);
  }
  for(const p of people)p.tokenCode=code;
 }
}

// Encounter-local display numbers are stable across sorting, removal and reload.
const enemyBase=p=>String(p.name).trim().replace(/\s+\d+$/, '');
const validEnemyNumber=n=>Number.isInteger(n)&&n>0&&n<1000000;
export function ensureEnemyNumbers(state){
 const groups=new Map();for(const p of state.people){if(p.kind!=='enemy')continue;const key=enemyBase(p).toLocaleLowerCase('de');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 for(const people of groups.values()){
  const used=new Set(),pending=[];
  for(const p of people){const explicit=String(p.name).match(/\s+(\d+)$/)?.[1],code=tokenCode(p).match(/(\d+)$/)?.[1],n=validEnemyNumber(p.enemyNumber)?p.enemyNumber:Number(explicit||code);if(validEnemyNumber(n)&&!used.has(n)){p.enemyNumber=n;used.add(n);}else pending.push(p);}
  let next=1;for(const p of pending){while(used.has(next))next++;p.enemyNumber=next;used.add(next++);}
 }
}
export function participantName(p){return p.kind==='enemy'&&validEnemyNumber(p.enemyNumber)?enemyBase(p)+' '+p.enemyNumber:p.name;}
