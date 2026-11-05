export function setCombatOrder(state,ids){
 if(!Array.isArray(ids)||ids.length!==state.people.length||new Set(ids).size!==ids.length||!ids.every(id=>state.people.some(p=>p.id===id)))throw Error('Die Beteiligten haben sich geändert. Bitte die Reihenfolge neu öffnen.');
 const ranks=new Map(ids.map((id,i)=>[id,i]));for(const p of state.people)p.turnPosition=ranks.get(p.id);state.manualOrder=true;
 if(state.started===false)state.active=ids[0]??null;
}
export function moveToPosition(ids,id,position){
 if(!Number.isInteger(position)||position<1||position>ids.length||!ids.includes(id))throw Error('Ungültiger Platz.');
 const next=ids.filter(x=>x!==id);next.splice(position-1,0,id);return next;
}
export function setCurrentHp(state,id,value){
 const p=state.people.find(p=>p.id===id);if(!p||!Number.isInteger(value)||value<0||value>p.max)throw Error('Bitte einen gültigen HP-Wert zwischen 0 und den maximalen HP eingeben.');
 p.hp=value;state.demo=false;
}
// Session-local corrections affect one person's HP only, even after other actions.
export class HpCorrections{
 constructor(){this.changes=new Map();}
 clear(){this.changes.clear();}
 key(state,id){return state.id+':'+id;}
 capture(before,after){
  if(before.id!==after.id){this.clear();return;}
  for(const p of after.people){const old=before.people.find(x=>x.id===p.id);if(old&&old.hp!==p.hp)this.changes.set(this.key(after,p.id),{before:old.hp,after:p.hp});}
  for(const key of this.changes.keys())if(!after.people.some(p=>this.key(after,p.id)===key))this.changes.delete(key);
 }
 get(state,id){const p=state.people.find(x=>x.id===id),c=this.changes.get(this.key(state,id));return p&&c&&Number.isInteger(c.before)&&p.hp===c.after&&c.before>=0&&c.before<=p.max?c:null;}
 revert(state,id){const c=this.get(state,id);if(!c)throw Error('Keine passende HP-Änderung zum Zurücknehmen.');setCurrentHp(state,id,c.before);this.changes.delete(this.key(state,id));return c.before;}
}
