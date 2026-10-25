import{order,prepareManualOrder}from'./core.js?v=initiative-entry-1';
export const hasInitiative=p=>p.initiativeSet===true;
export function sortInitiative(state){
 prepareManualOrder(state);
 const sorted=order(state.people).sort((a,b)=>Number(hasInitiative(b))-Number(hasInitiative(a))||(hasInitiative(a)&&hasInitiative(b)?b.init-a.init:0));
 sorted.forEach((p,i)=>p.turnPosition=i);state.initiativeEnabled=sorted.some(hasInitiative);
 if(!state.active||state.started===false)state.active=sorted[0]?.id??null;
}
export function setInitiatives(state,entries){
 if(!Array.isArray(entries)||entries.length>100||new Set(entries.map(e=>e?.id)).size!==entries.length)throw Error('Ungültige Initiative-Liste.');
 for(const e of entries)if(!e||!state.people.some(p=>p.id===e.id)||e.value!==null&&(!Number.isInteger(e.value)||e.value< -99||e.value>999))throw Error('Bitte ganze Initiative-Werte zwischen −99 und 999 eingeben.');
 for(const e of entries){const p=state.people.find(p=>p.id===e.id);p.init=e.value??0;p.initiativeSet=e.value!==null;}
 if(state.people.some(hasInitiative))sortInitiative(state);else state.initiativeEnabled=false;
 state.demo=false;
}
