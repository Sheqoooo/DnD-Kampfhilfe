import{order}from'./core.js?v=initiative-entry-1';
import{moveToPosition,setCombatOrder,setCurrentHp}from'./combat-edit.js?v=quick-combat-1';
export function initCombatEdit({getState,change,nameOf,toast}){
 const $=s=>document.querySelector(s);let ids=[],context=null,personId=null,hpContext=null;
 function drawOrder(focusId=null,focusAction='position'){
  const people=getState().people,list=$('#order-edit-list');list.replaceChildren();
  ids.forEach((id,i)=>{
   const p=people.find(x=>x.id===id);if(!p)return;
   const row=document.createElement('div');row.className='order-edit-row';row.dataset.orderPerson=id;
   if(getState().active===id)row.classList.add('current-turn');
   const select=document.createElement('select');select.setAttribute('aria-label','Platz für '+nameOf(p));select.dataset.orderAction='position';
   ids.forEach((_,n)=>{const option=document.createElement('option');option.value=n+1;option.textContent=n+1;option.selected=n===i;select.append(option);});
   select.onchange=()=>{ids=moveToPosition(ids,id,Number(select.value));drawOrder(id);};
   const label=document.createElement('span');label.textContent=nameOf(p);row.append(select,label);
   for(const[step,text,action]of[[-1,'↑','up'],[1,'↓','down']]){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.dataset.orderAction=action;b.setAttribute('aria-label',nameOf(p)+(step<0?' nach oben':' nach unten'));b.disabled=i+step<0||i+step>=ids.length;b.onclick=()=>{ids=moveToPosition(ids,id,i+step+1);drawOrder(id,action);};row.append(b);}
   list.append(row);
  });
  if(focusId){const row=[...list.children].find(el=>el.dataset.orderPerson===focusId),target=row?.querySelector('[data-order-action="'+focusAction+'"]');(target&&!target.disabled?target:row?.querySelector('select'))?.focus({preventScroll:true});row?.scrollIntoView({block:'nearest'});}
 }
 function openOrder(id=null){
  const state=getState();if(!state.people.length){toast('Füge zuerst Beteiligte hinzu.');return;}
  context=state.id;ids=order(state.people).map(p=>p.id);$('#order-edit-error').textContent='';drawOrder();$('#order-edit-dialog').showModal();if(id)drawOrder(id);else $('#order-edit-list select')?.focus();
 }
 $('#open-order-editor').onclick=()=>openOrder();
 $('#order-edit-form').onsubmit=e=>{e.preventDefault();try{if(getState().id!==context)throw Error('Der Kampf hat sich geändert.');change(()=>setCombatOrder(getState(),ids));$('#order-edit-dialog').close();toast('Reihenfolge übernommen.');}catch(error){$('#order-edit-error').textContent=error.message;}};
 function openHp(id){
  const state=getState(),p=state.people.find(p=>p.id===id);if(!p)return;personId=id;hpContext=state.id;
  $('#hp-edit-title').textContent=nameOf(p)+' · Trefferpunkte';const input=$('#hp-exact');input.max=p.max;input.value=p.hp;$('#hp-edit-max').textContent='von '+p.max+' maximalen HP';$('#hp-edit-error').textContent='';$('#hp-edit-dialog').showModal();input.focus();input.select();
 }
 $('#hp-edit-form').onsubmit=e=>{e.preventDefault();try{if(getState().id!==hpContext)throw Error('Der Kampf hat sich geändert.');if($('#hp-exact').value.trim()==='')throw Error('Bitte die aktuellen HP eingeben.');const hp=Number($('#hp-exact').value);change(()=>setCurrentHp(getState(),personId,hp));$('#hp-edit-dialog').close();toast('Trefferpunkte korrigiert.');}catch(error){$('#hp-edit-error').textContent=error.message;}};
 return{openOrder,openHp};
}
