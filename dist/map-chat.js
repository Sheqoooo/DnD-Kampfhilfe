import{DEFAULT_MODEL_URL,normalizeModelURL,discoverModels,requestScene}from'./local-model.js?v=map-chat-3';
import{compileScene}from'./scene-planner.js?v=map-chat-3';

// The model supplies a scene plan only. The host owns all actual map mutations.
export function initMapChat({getState,getBounds,renderPreview,commit}){
 const $=s=>document.querySelector(s),dialog=$('#map-chat-dialog'),settingsKey='miniMind.localModel.v1';
 let previous=null,pending=null,applied=null,controller=null,knownModels=[],saved={};
 try{saved=JSON.parse(localStorage.getItem(settingsKey)||'{}')??{};}catch{}
 $('#ai-base').value=typeof saved.base==='string'?saved.base:DEFAULT_MODEL_URL;
 const signature=()=>JSON.stringify([getState().id,getState().shapes]);
 const groupSignature=ids=>JSON.stringify(getState().shapes.filter(s=>ids.includes(s.id)));
 function message(role,text){const p=document.createElement('p');p.className='ai-message '+role;const label=document.createElement('strong');label.textContent=role==='user'?'Du':'Kartenplaner';p.append(label,document.createTextNode(text));$('#ai-log').append(p);while($('#ai-log').children.length>10)$('#ai-log').firstElementChild.remove();$('#ai-log').scrollTop=$('#ai-log').scrollHeight;}
 function status(text,error=false){$('#ai-status').textContent=text;$('#ai-status').classList.toggle('ai-error',error);}
 function busy(value){
  for(const id of['ai-send','ai-test','ai-base','ai-model','ai-key','ai-reset'])$('#'+id).disabled=value;
  for(const b of dialog.querySelectorAll('[data-ai-example]'))b.disabled=value;
  $('#ai-abort').hidden=!value;$('#ai-prompt').readOnly=value;$('#ai-apply').disabled=value||!pending;
  $('#ai-chat-form').setAttribute('aria-busy',String(value));
 }
 function clearPreview(){pending=null;$('#ai-preview').replaceChildren();$('#ai-preview-empty').hidden=false;$('#ai-preview-summary').textContent='';$('#ai-apply').disabled=true;}
 function checkContext(){
  if(applied&&(applied.stateId!==getState().id||applied.signature!==groupSignature(applied.ids))){applied=null;previous=null;clearPreview();$('#ai-log').replaceChildren();message('assistant','Die Karte wurde inzwischen verändert. Deine Änderungen bleiben erhalten; die nächste Beschreibung beginnt eine neue Szene.');}
  if(pending&&pending.signature!==signature()){if(pending.stateId!==getState().id){previous=null;$('#ai-log').replaceChildren();}clearPreview();}
  $('#ai-replace-label').hidden=!applied;
 }
 function saveConnection(base,model){try{localStorage.setItem(settingsKey,JSON.stringify({base,model}));}catch{}saved={base,model};}
 async function connect(signal){
  const base=normalizeModelURL($('#ai-base').value),models=await discoverModels(base,$('#ai-key').value.trim(),{signal});knownModels=models;
  $('#ai-model').replaceChildren(...models.map(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.label;return o;}));
  $('#ai-model').value=models.some(m=>m.id===saved.model)?saved.model:models[0].id;
  $('#ai-connection-status').textContent='Verbunden · '+models.find(m=>m.id===$('#ai-model').value).label;
  saveConnection(base,$('#ai-model').value);$('#ai-base').value=base;$('#ai-connection').open=false;return base;
 }
 $('#ai-test').onclick=async()=>{
  const control=new AbortController();controller=control;busy(true);status('Verbindung zu Strata wird geprüft …');
  try{await connect(control.signal);status('Strata ist bereit. Beschreibe deinen Ort.');}catch(e){if(controller===control){status(e.name==='AbortError'?'Verbindungsprüfung abgebrochen.':e.message,true);$('#ai-connection-status').textContent='Nicht verbunden';}}
  finally{if(controller===control){controller=null;busy(false);}}
 };
 $('#ai-base').oninput=$('#ai-key').oninput=()=>{knownModels=[];$('#ai-connection-status').textContent='Verbindung noch nicht geprüft';};
 $('#ai-model').onchange=()=>{try{saveConnection(normalizeModelURL($('#ai-base').value),$('#ai-model').value);}catch(e){status(e.message,true);}};
 $('#open-map-chat').onclick=()=>{$('#generator-picker').close();checkContext();dialog.showModal();$('#ai-prompt').focus();};
 $('#ai-chat-form').onsubmit=async e=>{
  e.preventDefault();const prompt=$('#ai-prompt').value.trim();if(!prompt||controller)return;
  checkContext();const control=new AbortController();controller=control;busy(true);status('Strata plant deine Szene …');message('user',prompt);
  const context=signature(),stateId=getState().id,bounds=applied?.bounds??getBounds();
  try{
   const base=knownModels.length?normalizeModelURL($('#ai-base').value):await connect(control.signal);
   const scene=await requestScene({base,model:$('#ai-model').value,key:$('#ai-key').value.trim(),prompt,previous,signal:control.signal,onRepair:()=>status('Strata korrigiert den Kartenplan automatisch …')});
   if(control.signal.aborted||controller!==control)return;
   if(context!==signature())throw Error('Die Karte wurde inzwischen verändert. Bitte die Szene erneut generieren.');
   const result=compileScene(scene,bounds);pending={...result,signature:context,stateId,bounds};previous=scene;
   renderPreview($('#ai-preview'),compileScene(scene).shapes);$('#ai-preview-empty').hidden=true;
   $('#ai-preview-summary').textContent=scene.title+' · '+result.shapes.length+' bearbeitbare Elemente';
   $('#ai-replace-label').hidden=!applied;$('#ai-replace').checked=!!applied;
   message('assistant',scene.summary);$('#ai-prompt').value='';status('Vorschau bereit. Du kannst sie übernehmen oder im Chat weiter verändern.');
  }catch(error){if(controller===control)status(error.name==='AbortError'?'Generierung abgebrochen. Deine Karte bleibt unverändert.':error.message,true);}
  finally{if(controller===control){controller=null;busy(false);}}
 };
 $('#ai-abort').onclick=()=>controller?.abort();
 dialog.addEventListener('close',()=>{controller?.abort();});
 $('#ai-apply').onclick=()=>{
  if(!pending||controller)return;
  try{
   if(pending.signature!==signature()||pending.stateId!==getState().id)throw Error('Die Karte wurde inzwischen verändert. Bitte neu generieren.');
   const ids=commit(pending.shapes,applied&&$('#ai-replace').checked?applied.ids:[],pending.bounds);
   applied={stateId:getState().id,ids,bounds:pending.bounds,signature:groupSignature(ids)};
   const title=pending.scene.title;clearPreview();$('#ai-replace-label').hidden=false;status('„'+title+'“ ist auf der Karte. Weitere Wünsche verändern diese KI-Szene.');dialog.close();
  }catch(error){status(error.message,true);}
 };
 $('#ai-reset').onclick=()=>{applied=null;previous=null;clearPreview();$('#ai-log').replaceChildren();$('#ai-replace-label').hidden=true;status('Neue Beschreibung. Bereits platzierte Karten bleiben erhalten.');$('#ai-prompt').focus();};
 for(const b of dialog.querySelectorAll('[data-ai-example]'))b.onclick=()=>{$('#ai-prompt').value=b.dataset.aiExample;$('#ai-prompt').focus();};
 $('#ai-prompt').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();$('#ai-chat-form').requestSubmit();}});
}
