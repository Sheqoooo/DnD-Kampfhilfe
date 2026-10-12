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
   const name=people[0].name,base=firstLetter(name),number=String(name).match(/\s+(\d{1,5})\s*$/)?.[1];
   code=base+(number||'');let n=number?Number(number)+1:2;
   while(used.has(code))code=base+n++;
   used.set(code,key);
  }
  for(const p of people)p.tokenCode=code;
 }
}
