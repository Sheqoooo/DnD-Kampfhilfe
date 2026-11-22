import test from'node:test';import assert from'node:assert/strict';
import{validBackground,imageBackground,readMapImage,IMAGE_DATA_LIMIT}from'../dist/map-image.js';
import{validState}from'../dist/core.js';import{makeCampaign,saveEncounter,validCampaign}from'../dist/campaign.js';
import{createPreparation,startPreparation}from'../dist/preparations.js';import{saveMap,loadMap,validMapLibrary}from'../dist/map-library.js';
import{clearBoard}from'../dist/map-actions.js';import{recordChange,undoChange,redoChange}from'../dist/history.js';
import{initMapImage}from'../dist/map-image-ui.js';
const image={name:'Karte.jpg',src:'data:image/jpeg;base64,/9j/AA==',w:1600,h:800};
const scene=()=>({version:1,title:'Kampf',round:3,active:'hero',people:[{id:'hero',name:'Ada',kind:'ally',hp:7,max:10,init:0,x:75,y:75}],shapes:[]});
test('image sizing retains aspect ratio and validates embedded raster data and world bounds',()=>{
 const b=imageBackground(image,20,false);assert.equal(b.w,1000);assert.equal(b.h,500);assert.equal(b.showGrid,false);assert.ok(validBackground(b));assert.ok(validBackground(undefined));
 for(const change of [{src:'https://example.com/map.jpg'},{src:'data:image/svg+xml;base64,PHN2Zz4='},{src:'data:image/png;base64,<script>'},{src:'data:image/jpeg;base64,'+'A'.repeat(IMAGE_DATA_LIMIT)},{w:0},{h:Infinity},{x:11000},{showGrid:'yes'}])assert.equal(validBackground({...b,...change}),false);
 for(const columns of [0,101,NaN])assert.throws(()=>imageBackground(image,columns));
 assert.equal(validState({...scene(),background:{...b,src:'javascript:alert(1)'}}),false);assert.ok(validState(scene()));
});
test('image persists through battle save, JSON backup, preparations and a new prepared battle',()=>{
 let i=0;const uid=()=>`id-${++i}`,s={...scene(),background:imageBackground(image,20)},c=makeCampaign(s,uid,1),state=structuredClone(c.encounters[0]);
 saveEncounter(c,state,2);assert.ok(validCampaign(JSON.parse(JSON.stringify(c))));assert.deepEqual(c.encounters[0].background,s.background);
 const p=createPreparation(c,{title:'Bildkarte',source:state,characterIds:c.characters.map(x=>x.id)},uid,3);
 const battle=startPreparation(c,p.id,{characterIds:c.characters.map(x=>x.id)},uid,4);assert.deepEqual(battle.background,s.background);battle.background.w=800;assert.equal(c.preparations[0].background.w,1000);assert.ok(validCampaign(c));
});
test('map library saves, copies and loads backgrounds independently; old maps remove a previous image',()=>{
 let i=0;const uid=()=>`id-${++i}`,state={...scene(),background:imageBackground(image,20)},campaign=makeCampaign(state,uid,1);
 const map=saveMap(campaign,{title:'Bild',shapes:[],background:state.background},uid,2),copy=saveMap(campaign,{title:'Kopie',shapes:map.shapes,background:map.background},uid,3),people=structuredClone(state.people);
 state.background.w=500;assert.equal(map.background.w,1000);loadMap(state,copy,uid);assert.equal(state.background.w,1000);state.background.showGrid=false;assert.equal(copy.background.showGrid,true);assert.deepEqual(state.people,people);assert.equal(state.round,3);
 assert.ok(validMapLibrary(campaign));const old=saveMap(campaign,{title:'Ohne Bild',shapes:[]},uid,4);loadMap(state,old,uid);assert.equal(state.background,undefined);
 assert.throws(()=>saveMap(campaign,{title:'Ungültig',shapes:[],background:{src:'https://example.com'}},uid));
});
test('clearing an image board preserves combat, and undo/redo restores the complete background',()=>{
 const s={...scene(),background:imageBackground(image,20)},before=structuredClone(s),past=[],future=[];recordChange(past,future,s);clearBoard(s,{figures:false});assert.equal(s.background,undefined);assert.deepEqual(s.people,before.people);assert.equal(s.round,3);assert.deepEqual(undoChange(past,future,s),before);assert.deepEqual(redoChange(past,future,before),s);
});
test('upload rejects unsupported types and oversized files before decoding',async()=>{
 await assert.rejects(readMapImage({type:'image/svg+xml',size:10}),/PNG/);await assert.rejects(readMapImage({type:'image/png',size:20000001}),/20 MB/);
});
test('upload shrinks a decoded image, compresses it and releases the temporary URL even on failure',async()=>{
 const original={Image:globalThis.Image,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};let released=0,canvas,quality=[];
 try{
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>released++;
  globalThis.Image=class{naturalWidth=3200;naturalHeight=1600;async decode(){}};
  globalThis.document={createElement:()=>canvas={getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:(type,q)=>{quality.push(q);return q>.75?'data:image/jpeg;base64,'+'A'.repeat(IMAGE_DATA_LIMIT):image.src;}}};
  const result=await readMapImage({type:'image/png',size:50,name:'Map.png'});assert.equal(result.w,1600);assert.equal(result.h,800);assert.equal(canvas.width,1600);assert.deepEqual(quality,[.88,.75]);assert.equal(released,1);assert.ok(validBackground(imageBackground(result,20)));
  globalThis.Image=class{async decode(){throw Error('broken image')}};await assert.rejects(readMapImage({type:'image/png',size:50,name:'broken'}));assert.equal(released,2);
 }finally{globalThis.Image=original.Image;globalThis.document=original.document;URL.createObjectURL=original.create;URL.revokeObjectURL=original.revoke;}
});
function ui({readImage=async()=>image,apply}={}){
 const nodes=new Map(),state={id:'battle'},calls=[];
 const get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',hidden:false,disabled:false,open:false,checked:false,textContent:'',showModal(){this.open=true},close(){this.open=false;this.onclose?.()},addEventListener(event,fn){this['on'+event]=fn},removeAttribute(name){delete this[name]}});return nodes.get(id);};
 const original=globalThis.document;globalThis.document={querySelector:get};
 try{initMapImage({getState:()=>state,apply:apply??(b=>{calls.push(b);state.background=b}),toast:()=>{},readImage});}finally{globalThis.document=original;}
 return{get,state,calls,open:()=>get('#open-map-image').onclick(),choose:()=>get('#map-image-file').onchange({target:{files:[{}]}}),submit:()=>get('#map-image-form').onsubmit({preventDefault(){}})};
}
test('upload dialog is a preview until confirmed, cancellation leaves the battle intact and errors keep dialog open',async()=>{
 const u=ui();u.open();assert.ok(u.get('#map-image-apply').disabled);await u.choose();assert.equal(u.calls.length,0);u.get('#map-image-dialog').close();assert.equal(u.state.background,undefined);
 u.open();await u.choose();u.get('#map-image-columns').value=30;u.get('#map-image-grid').checked=false;u.submit();assert.equal(u.calls.length,1);assert.equal(u.state.background.w,1500);assert.equal(u.state.background.showGrid,false);assert.equal(u.get('#map-image-dialog').open,false);
 u.open();u.get('#map-image-remove').onclick();assert.equal(u.calls.at(-1),undefined);
 const fail=ui({apply:()=>{throw Error('Speicher voll')}});fail.open();await fail.choose();fail.submit();assert.equal(fail.get('#map-image-dialog').open,true);assert.equal(fail.get('#map-image-status').textContent,'Speicher voll');
});
test('late upload results after cancellation or switching battles cannot change the current battle',async()=>{
 let resolve;const u=ui({readImage:()=>new Promise(r=>resolve=r)});u.open();const loading=u.choose();u.get('#map-image-dialog').close();resolve(image);await loading;assert.equal(u.calls.length,0);
 u.open();const next=u.choose();resolve(image);await next;u.state.id='another';u.submit();assert.equal(u.calls.length,0);assert.match(u.get('#map-image-status').textContent,/geändert/);
});
