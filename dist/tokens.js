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
 // Character identities persist across battles; enemy labels only need to be
 // distinct among participants of the same battle, never across its history.
 const heroes=new Map();
 const add=(p,key)=>{if(!heroes.has(key))heroes.set(key,[]);heroes.get(key).push(p);};
 for(const c of campaign.characters)add(c,'character:'+c.id);
 for(const encounter of [...campaign.encounters,state])for(const p of encounter.people)if(p.kind!=='enemy')add(p,p.characterId?'character:'+p.characterId:'person:'+p.id);
 assignCodes(heroes,new Set());
 for(const encounter of [...campaign.encounters,state]){
  const groups=new Map(),used=new Set(encounter.people.filter(p=>p.kind!=='enemy').map(tokenCode));
  for(const p of encounter.people)if(p.kind==='enemy'){if(!groups.has(p.id))groups.set(p.id,[]);groups.get(p.id).push(p);}
  assignCodes(groups,used);
 }
}
function assignCodes(groups,used){
 const assigned=new Map();
 // Existing labels keep their identity unless their suffix disagrees with the
 // explicit display number. Repair K9 / Knecht 1 to K1 on loading old saves.
 const candidate=p=>{if(!safeCode(p.tokenCode))return null;if(p.kind==='enemy'&&validEnemyNumber(p.enemyNumber)&&Number(p.tokenCode.match(/(\d+)$/)?.[1])!==p.enemyNumber)return null;return p.tokenCode;};
 for(const [key,people]of groups){const code=people.map(candidate).find(Boolean);if(code&&!used.has(code)){assigned.set(key,code);used.add(code);}}
 for(const [key,people]of groups){
  let code=assigned.get(key);
  if(!code){const p=people[0],base=firstLetter(p.name),number=p.kind==='enemy'&&validEnemyNumber(p.enemyNumber)?String(p.enemyNumber):String(p.name).match(/\s+(\d{1,5})\s*$/)?.[1];
   code=base+(number||'');
   if(number&&p.kind==='enemy'&&validEnemyNumber(p.enemyNumber)){
    const letters=(String(p.name).match(/[\p{L}]/gu)||[base]).join('').toLocaleUpperCase('de');
    let length=2;while(used.has(code)&&length<=Math.min(letters.length,7-number.length))code=letters.slice(0,length++)+number;
    // Keep the enemy number intact even when several names share their initials.
    let n=65;while(used.has(code)){const next=String.fromCodePoint(n++)+number;if(safeCode(next))code=next;}
   }else{let n=number?Number(number)+1:2;while(used.has(code))code=base+n++;}
   used.add(code);
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
