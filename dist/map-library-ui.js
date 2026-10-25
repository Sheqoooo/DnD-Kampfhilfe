import{saveMap,renameMap,removeMap}from'./map-library.js?v=map-library-1';
export function initMapLibrary({getCampaign,getState,getView,change,onLoad,uid,toast}){
 const $=s=>document.querySelector(s),dialog=$('#map-library-dialog'),name=$('#map-library-name');let renameId=null;
 function resetForm(){renameId=null;name.value='';$('#map-library-submit').textContent='Als neues Spielfeld speichern';$('#map-library-cancel').hidden=true;$('#map-library-form-title').textContent='Aktuelles Spielfeld speichern';name.setCustomValidity('');}
 function button(text,action,map){const b=document.createElement('button');b.type='button';b.className=action==='load'?'primary':action==='delete'?'text-button':'secondary';b.textContent=text;b.dataset.mapAction=action;b.dataset.mapId=map.id;b.setAttribute('aria-label',map.title+': '+text);return b;}
 function render(){
  const maps=getCampaign().maps??[],q=$('#map-library-search').value.trim().toLocaleLowerCase('de');$('#map-library-count').textContent=maps.length?'('+maps.length+')':'';
  const list=$('#map-library-list');list.replaceChildren();
  for(const map of maps.filter(m=>m.title.toLocaleLowerCase('de').includes(q)).slice().sort((a,b)=>b.savedAt-a.savedAt)){
   const card=document.createElement('article');card.className='map-library-card';const title=document.createElement('h3');title.textContent=map.title;
   const note=document.createElement('p');note.className='form-note';note.textContent=map.shapes.length+' Kartenelemente · '+new Date(map.savedAt).toLocaleDateString('de-DE');
   const actions=document.createElement('div');actions.className='map-library-actions';actions.append(button('Laden','load',map),button('Aktuelles Feld hier speichern','update',map),button('Umbenennen','rename',map),button('Duplizieren','copy',map),button('Entfernen','delete',map));card.append(title,note,actions);list.append(card);
  }
  if(!list.children.length){const empty=document.createElement('p');empty.className='form-note';empty.textContent=maps.length?'Kein passendes Spielfeld.':'Hier kannst du deine Karten unabhängig von Kämpfen aufbewahren. Speichere dein aktuelles Feld unter einem Namen.';list.append(empty);}
 }
 $('#open-map-library').onclick=()=>{resetForm();render();dialog.showModal();name.focus();};$('#map-library-search').oninput=render;$('#map-library-cancel').onclick=resetForm;
 name.oninput=()=>name.setCustomValidity('');
 $('#map-library-form').onsubmit=e=>{
  e.preventDefault();if(!name.value.trim()){name.setCustomValidity('Bitte einen Namen eingeben.');name.reportValidity();return;}
  try{
   change(()=>renameId?renameMap(getCampaign(),renameId,name.value):saveMap(getCampaign(),{title:name.value,shapes:getState().shapes,view:getView()},uid));
   toast(renameId?'Spielfeld umbenannt.':'Spielfeld gespeichert.');resetForm();render();
  }catch(error){$('#map-library-status').textContent=error.message;}
 };
 $('#map-library-list').onclick=e=>{
  const b=e.target.closest('[data-map-action]');if(!b)return;const map=getCampaign().maps?.find(m=>m.id===b.dataset.mapId);if(!map)return;
  try{
   const action=b.dataset.mapAction;
   if(action==='load'){onLoad(map);dialog.close();toast('Spielfeld „'+map.title+'“ geladen. Mit Rückgängig zurück.');return;}
   if(action==='rename'){renameId=map.id;name.value=map.title;$('#map-library-submit').textContent='Namen speichern';$('#map-library-cancel').hidden=false;$('#map-library-form-title').textContent='Spielfeld umbenennen';name.focus();return;}
   if(action==='update')change(()=>saveMap(getCampaign(),{id:map.id,title:map.title,shapes:getState().shapes,view:getView()},uid));
   if(action==='copy')change(()=>saveMap(getCampaign(),{title:map.title.slice(0,70)+' · Kopie',shapes:map.shapes,view:map.view},uid));
   if(action==='delete')change(()=>removeMap(getCampaign(),map.id));
   if(renameId===map.id)resetForm();render();toast(action==='update'?'Spielfeld aktualisiert.':action==='copy'?'Spielfeld dupliziert.':'Spielfeld entfernt. Mit Rückgängig wiederherstellen.');
  }catch(error){$('#map-library-status').textContent=error.message;}
 };
 dialog.addEventListener('close',()=>{$('#map-library-status').textContent='';});return{render};
}
