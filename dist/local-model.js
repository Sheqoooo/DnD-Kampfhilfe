import{SCENE_SYSTEM_PROMPT,parseScene,validateScene,compileScene}from'./scene-planner.js?v=map-chat-3';

export const DEFAULT_MODEL_URL='http://127.0.0.1:47831/v1';
export function normalizeModelURL(input){
 let u;try{u=new URL(input);}catch{throw Error('Bitte eine gültige lokale Strata-Adresse eingeben.');}
 if(!['http:','https:'].includes(u.protocol)||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.username||u.password||u.search||u.hash||!['','/','/v1','/v1/'].includes(u.pathname))throw Error('Erlaubt ist nur die lokale Modell-API auf diesem Rechner, z. B. http://127.0.0.1:47831/v1.');
 return u.origin+'/v1';
}
async function jsonRequest(url,{signal,timeout=180000,timeoutMessage='Strata braucht zu lange. Versuche eine einfachere Szene.',fetchImpl=fetch,...options}={}){
 const control=new AbortController(),abort=()=>control.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;control.abort();},timeout);
 try{
  const r=await fetchImpl(url,{...options,signal:control.signal,credentials:'omit',redirect:'error',cache:'no-store'});
  const raw=await r.text();if(raw.length>250000)throw Error('Die Modellantwort ist zu groß.');
  let data;try{data=JSON.parse(raw);}catch{throw Error('Strata hat keine gültige API-Antwort geliefert. Prüfe die Adresse.');}
  if(!r.ok){if(r.status===401||r.status===403)throw Error('Strata lehnt den Zugriff ab. Prüfe gegebenenfalls den API-Schlüssel.');if(r.status===503)throw Error('Strata ist noch nicht bereit. Lade zuerst dein Modell.');throw Error('Strata konnte die Anfrage nicht beantworten ('+r.status+').');}return data;
 }catch(error){
  if(timedOut)throw Error(timeoutMessage);
  if(control.signal.aborted)throw new DOMException('Abgebrochen','AbortError');
  if(error instanceof TypeError)throw Error('Strata ist nicht erreichbar. Prüfe Modell, Adresse und die lokale Netzwerkfreigabe deines Browsers.');throw error;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
const headers=key=>({'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})});
export async function discoverModels(base,key='',options={}){
 const data=await jsonRequest(normalizeModelURL(base)+'/models',{...options,timeout:10000,timeoutMessage:'Strata antwortet nicht auf den Verbindungstest. Prüfe, ob die API läuft und dein Browser den lokalen Netzwerkzugriff erlaubt.',headers:key?{Authorization:'Bearer '+key}:{}});
 const models=(Array.isArray(data.data)?data.data:[]).filter(m=>typeof m.id==='string'&&m.id.length>0&&m.id.length<=200).map(m=>({id:m.id,label:typeof m.meta?.label==='string'?m.meta.label.slice(0,120):m.id}));
 if(!models.length)throw Error('Die API läuft, aber noch kein Modell. Lade zuerst Qwen in Strata.');return models;
}
export async function requestScene({base,model,key='',prompt,previous=null,signal,fetchImpl,onRepair}){
 const url=normalizeModelURL(base);if(typeof prompt!=='string'||!prompt.trim()||prompt.length>1600)throw Error('Bitte beschreibe den Ort in maximal 1600 Zeichen.');
 if(typeof model!=='string'||!model||model.length>200)throw Error('Bitte zuerst die Verbindung zu Strata prüfen.');
 const messages=[{role:'system',content:SCENE_SYSTEM_PROMPT}];
 if(previous)messages.push({role:'assistant',content:JSON.stringify(validateScene(previous))});
 messages.push({role:'user',content:prompt.trim()});
 for(let attempt=0;attempt<2;attempt++){
  if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
  const data=await jsonRequest(url+'/chat/completions',{method:'POST',headers:headers(key),signal,fetchImpl,body:JSON.stringify({model,messages,stream:false,reasoning_effort:'none',temperature:attempt?.2:.5,max_tokens:4096,response_format:{type:'json_object'}})});
  const choice=data.choices?.[0],content=choice?.message?.content;
  try{
   if(choice?.finish_reason==='length')throw Error('Der Kartenplan wurde zu lang. Bitte weniger Details anfordern.');
   const scene=parseScene(content);compileScene(scene);return scene;
  }catch(error){
   if(attempt)throw Error('Strata konnte den Kartenplan auch nach einer automatischen Korrektur nicht umsetzen. '+error.message);
   if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
   if(typeof content==='string'&&content.length<=100000)messages.push({role:'assistant',content});
   messages.push({role:'user',content:'Correct the invalid scene JSON. Validation error: '+error.message+' Return the COMPLETE valid scene, keeping the original request and unaffected objects. Use only supported types, unique ids and in-bounds geometry. If too complex, simplify details. JSON only.'});
   onRepair?.();
  }
 }
}
