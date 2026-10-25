import{hasInitiative,setInitiatives}from'./initiative.js?v=initiative-entry-1';
import{order}from'./core.js?v=initiative-entry-1';
export function initInitiative({getState,change,nameOf,toast}){
 const $=s=>document.querySelector(s),dialog=$('#initiative-dialog'),list=$('#initiative-input-list');let stateId=null;
 function open(ids=null){
  const state=getState(),people=order(state.people).filter(p=>!ids||ids.includes(p.id));if(!people.length){toast('Füge zuerst Beteiligte hinzu.');return;}
  stateId=state.id;list.replaceChildren();$('#initiative-dialog-title').textContent=ids?(people.length===1?'Initiative für '+nameOf(people[0]):'Neue Beteiligte einsortieren'):'Initiative eintragen';
  $('#initiative-running-note').textContent=state.started===false?'Vor dem ersten Zug beginnt die höchste Initiative.':'Die aktuell aktive Figur und die Runde bleiben beim Sortieren erhalten.';
  $('#initiative-error').textContent='';
  people.forEach((p,i)=>{
   const row=document.createElement('label');row.className='initiative-input-row';const label=document.createElement('span');label.textContent=nameOf(p);
   const input=document.createElement('input');input.type='number';input.min='-99';input.max='999';input.step='1';input.placeholder='Noch offen';input.value=hasInitiative(p)?p.init:'';input.dataset.personId=p.id;input.setAttribute('aria-label','Initiative für '+nameOf(p));
   input.addEventListener('keydown',e=>{if(e.key==='Enter'&&i<people.length-1&&!e.metaKey&&!e.ctrlKey){e.preventDefault();list.querySelectorAll('input')[i+1]?.focus();}});
   row.append(label,input);list.append(row);
  });
  dialog.showModal();list.querySelector('input')?.focus();
 }
 $('#open-initiative').onclick=()=>open();
 $('#initiative-form').onsubmit=e=>{
  e.preventDefault();if(stateId!==getState().id){$('#initiative-error').textContent='Der Kampf hat sich geändert. Bitte die Liste neu öffnen.';return;}
  const entries=[...list.querySelectorAll('input')].map(input=>({id:input.dataset.personId,value:input.value.trim()===''?null:Number(input.value)}));
  try{change(()=>setInitiatives(getState(),entries));dialog.close();toast('Initiative gespeichert · Zugfolge sortiert.');}catch(error){$('#initiative-error').textContent=error.message;}
 };
 return{open};
}
