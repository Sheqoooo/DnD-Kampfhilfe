import{validState}from'./core.js?v=map-outline-1';
import{WORLD}from'./world.js?v=expanded-grid-1';
export const MAP_LIMIT=200;
function validView(v){return v===undefined||!!v&&['x','y','width','height','zoom'].every(k=>Number.isFinite(v[k]))&&v.zoom>=.25&&v.zoom<=4&&Math.abs(v.width-1000/v.zoom)<.001&&Math.abs(v.height-700/v.zoom)<.001&&v.x>=WORLD.left&&v.y>=WORLD.top&&v.x+v.width<=WORLD.right&&v.y+v.height<=WORLD.bottom;}
function validShapes(shapes){return validState({version:1,title:'Spielfeld',round:1,active:null,people:[],shapes})&&new Set(shapes.map(s=>s.id)).size===shapes.length;}
export function validMapLibrary(campaign){
 if(campaign.maps===undefined)return true;
 if(!Array.isArray(campaign.maps)||campaign.maps.length>MAP_LIMIT)return false;
 const ids=new Set();
 return campaign.maps.every(m=>{
  if(!m||typeof m.id!=='string'||!m.id||ids.has(m.id)||typeof m.title!=='string'||!m.title.trim()||m.title.length>80||!Number.isFinite(m.createdAt)||!Number.isFinite(m.savedAt)||!validShapes(m.shapes)||!validView(m.view)||m.people!==undefined||m.round!==undefined||m.active!==undefined)return false;
  ids.add(m.id);return true;
 });
}
const titleOf=title=>{if(typeof title!=='string'||!title.trim()||title.trim().length>80)throw Error('Bitte einen Namen mit maximal 80 Zeichen eingeben.');return title.trim();};
export function saveMap(campaign,{id,title,shapes,view},idFactory,now=Date.now()){
 const name=titleOf(title),list=campaign.maps??[],index=id===undefined?-1:list.findIndex(m=>m.id===id);
 if(id!==undefined&&index<0)throw Error('Spielfeld nicht gefunden.');
 if(index<0&&list.length>=MAP_LIMIT)throw Error('Maximal 200 Spielfelder.');
 if(!validShapes(shapes)||!validView(view))throw Error('Das Spielfeld enthält ungültige Kartenelemente.');
 const map={id:index<0?idFactory():id,title:name,shapes:structuredClone(shapes),createdAt:index<0?now:list[index].createdAt,savedAt:now,...(view?{view:structuredClone(view)}:{})};
 const next=list.map(m=>m);if(index<0)next.push(map);else next[index]=map;
 if(!validMapLibrary({maps:next}))throw Error('Das Spielfeld konnte nicht gespeichert werden.');
 campaign.maps=next;return map;
}
export function renameMap(campaign,id,title,now=Date.now()){
 const name=titleOf(title),map=campaign.maps?.find(m=>m.id===id);if(!map)throw Error('Spielfeld nicht gefunden.');map.title=name;map.savedAt=now;
}
export function removeMap(campaign,id){
 if(!campaign.maps?.some(m=>m.id===id))throw Error('Spielfeld nicht gefunden.');campaign.maps=campaign.maps.filter(m=>m.id!==id);
}
export function loadMap(state,map,idFactory){
 if(!validMapLibrary({maps:[map]}))throw Error('Das gespeicherte Spielfeld ist ungültig.');
 const shapes=structuredClone(map.shapes).map(s=>({...s,id:idFactory()})),candidate={...state,shapes};
 if(!validShapes(shapes)||!validState(candidate))throw Error('Das Spielfeld konnte nicht geladen werden.');
 state.shapes=shapes;state.demo=false;
}
