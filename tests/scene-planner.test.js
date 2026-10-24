import {makeTerrain} from '../dist/terrain-render.js';
import {readFileSync} from 'node:fs';
import test from'node:test';import assert from'node:assert/strict';
import{SCENE_TYPES,SCENE_SYSTEM_PROMPT,validateScene,parseScene,compileScene,applyScene}from'../dist/scene-planner.js';
import{normalizeModelURL,discoverModels,requestScene}from'../dist/local-model.js';
import{validState}from'../dist/core.js';import{makeCampaign,validCampaign}from'../dist/campaign.js';
import{moveSelection,transformSelection}from'../dist/drawing.js';import{recordChange,undoChange,redoChange}from'../dist/history.js';
const scene=(objects)=>({title:'Beliebiger Ort',summary:'Ein spielbarer Ort mit freiem Zugang.',objects});
const fixture=()=>scene([{id:'lake',type:'water',x:0,y:0,w:400,h:400,points:[[0,0],[400,0],[350,350],[0,400]]},{id:'shore',type:'sand',x:0,y:300,w:500,h:100},{id:'pier',type:'pier',x:200,y:200,w:50,h:200},{id:'trail',type:'path',points:[[250,400],[500,500],[800,450]],width:40},{id:'mountain',type:'mountain',x:650,y:0,w:300,h:300},{id:'tree',type:'tree',x:600,y:500,w:70,h:70},{id:'rock',type:'rock',x:750,y:550,w:60,h:50}]);
const state=shapes=>({version:1,id:'fight',title:'Kampf',round:3,active:'hero',people:[{id:'hero',name:'Ada',kind:'ally',hp:7,max:10,init:0,x:75,y:75}],shapes});
test('the automatic prompt supplies general capabilities, spatial rules and full-scene editing context',()=>{
 for(const kind of ['line','wall','stairs','water','door','room','tree','rock','pier','house'])assert.ok(SCENE_SYSTEM_PROMPT.includes(kind));
 assert.ok(SCENE_SYSTEM_PROMPT.includes('COMPLETE revised scene'));assert.ok(SCENE_SYSTEM_PROMPT.includes('1000'));assert.ok(SCENE_SYSTEM_PROMPT.includes('700'));
 assert.ok(SCENE_SYSTEM_PROMPT.includes('Do not ask follow-up'));assert.ok(SCENE_SYSTEM_PROMPT.includes('Never write code'));
});
test('every supported semantic object compiles deterministically into editable, saveable geometry',()=>{
 const defaults={x:100,y:100,w:600,h:500},objects={
  polygon:{points:[[100,100],[300,150],[250,300]]},ellipse:{},rect:{},line:{points:[[10,20],[200,40],[250,90]]},stairs:{steps:4,direction:'vertical'},water:{},sand:{},mountain:{},rock:{},tree:{w:70,h:70},pier:{w:60,h:240},room:{w:260,h:160},
  path:{points:[[0,0],[200,100],[800,650],[1000,700]],width:40},wall:{points:[[100,100],[400,100],[400,400]]},door:{points:[[200,100],[250,100]],open:false},
  house:{w:347,h:271,rooms:4},cave:{count:3},ruins:{count:3},forest:{count:12},rocks:{count:6},river:{direction:'horizontal',crossing:'bridge'}
 };
 for(const type of SCENE_TYPES){
  const plan=scene([{id:type,type,...defaults,...objects[type]}]),one=compileScene(plan,{x:-1300,y:900,w:2000,h:1400}),two=compileScene(plan,{x:-1300,y:900,w:2000,h:1400});assert.deepEqual(one,two,type);
  assert.ok(one.shapes.length>0,type);assert.ok(validState(state(one.shapes)),type);
  let n=0;assert.ok(validCampaign(JSON.parse(JSON.stringify(makeCampaign(state(one.shapes),()=>`id-${++n}`)))),type);
  const moved=moveSelection(one.shapes,100,50),scaled=transformSelection(moved,2,{x:1600,y:2600});assert.ok(validState(state(scaled)),type+' editing');
 }
});
test('invalid model instructions cannot become code, out-of-bounds shapes or unbounded generation',()=>{
 const input=fixture();assert.deepEqual(parseScene('```json\n'+JSON.stringify(input)+'\n```'),validateScene(input));assert.deepEqual(parseScene('<think>not part of output</think>'+JSON.stringify(input)),validateScene(input));
 for(const change of [p=>p.objects[0].type='script',p=>p.objects.push({...p.objects[0]}),p=>p.objects[0].x=-1,p=>p.objects[0].points=[[0,0],[9999,0],[0,400]],p=>p.objects[0].w=Infinity,p=>p.objects[0].w='400',p=>p.objects=Array.from({length:201},(_,i)=>({...p.objects[0],id:'x'+i})),p=>p.objects[0].points=[[0,0],[0,0],[0,0]],p=>p.objects[0].id='../../file']){const p=structuredClone(input);change(p);assert.throws(()=>validateScene(p));}
 assert.throws(()=>parseScene('alert("hello")'));assert.throws(()=>parseScene('a'.repeat(100001)));assert.throws(()=>compileScene(input,{x:10900,y:0,w:1000,h:700}));
 const withExtras=fixture();withExtras.people=[{hp:0}];withExtras.objects[0].onclick='fetch("https://attacker.invalid")';assert.equal(validateScene(withExtras).people,undefined);assert.equal(validateScene(withExtras).objects[0].onclick,undefined);
});
test('compact generated footprints keep the requested room counts without inheriting manual generator size gates',()=>{
 for(const [type,count]of[['house',4],['ruins',6],['cave',4],['forest',12],['rocks',6],['river',undefined]]){
  const result=compileScene(scene([{id:'compact',type,x:100,y:100,w:25,h:30,count}]));assert.ok(validState(state(result.shapes)),type);assert.ok(result.shapes.length>0,type);
 }
});
test('revising one object keeps other geometry stable and maps positions into the selected camera area',()=>{
 const p=fixture(),first=compileScene(p),changed=structuredClone(p);changed.objects.find(o=>o.id==='pier').h=260;
 const second=compileScene(changed);assert.deepEqual(second.shapes.filter(s=>s.terrain!=='pier'),first.shapes.filter(s=>s.terrain!=='pier'));
 const tree=scene([{id:'tree',type:'tree',x:100,y:200,w:50,h:60}]);const compiled=compileScene(tree,{x:-500,y:1000,w:2000,h:1400}).shapes[0];assert.deepEqual({x:compiled.x,y:compiled.y,w:compiled.w,h:compiled.h},{x:-300,y:1400,w:100,h:120});
});
test('scene application replaces only explicit previous AI ids and is atomic and reversible',()=>{
 const s=state([{id:'manual',type:'rect',x:0,y:0,w:100,h:100},{id:'old-ai',type:'ellipse',x:200,y:200,w:50,h:50}]),before=structuredClone(s),compiled=compileScene(fixture()).shapes;
 const past=[],future=[];recordChange(past,future,s);applyScene(s,compiled,['old-ai']);assert.deepEqual(s.people,before.people);assert.equal(s.active,before.active);assert.equal(s.round,before.round);assert.deepEqual(s.shapes[0],before.shapes[0]);assert.equal(s.shapes.some(x=>x.id==='old-ai'),false);assert.deepEqual(undoChange(past,future,s),before);assert.deepEqual(redoChange(past,future,before),s);
 const current=structuredClone(s);assert.throws(()=>applyScene(s,compiled));assert.deepEqual(s,current);assert.throws(()=>applyScene(s,Array.from({length:1001},(_,i)=>({...compiled[0],id:'too-many-'+i}))));assert.deepEqual(s,current);
});
test('local connection accepts only loopback APIs and never forwards credentials to remote redirects',async()=>{
 for(const url of['http://127.0.0.1:47831','http://localhost:8080/','http://[::1]:8080/v1/'])assert.ok(normalizeModelURL(url).endsWith('/v1'));
 for(const url of['https://example.com/v1','http://192.168.1.2:8080/v1','http://127.0.0.1.example.com/v1','file:///v1','http://user:password@localhost:8080/v1','http://localhost:8080/v1?url=https://remote','http://localhost:8080/other'])assert.throws(()=>normalizeModelURL(url));
 let called=false;await assert.rejects(requestScene({base:'https://remote.invalid/v1',model:'q2_0',prompt:'Ort',fetchImpl:()=>{called=true;}}));assert.equal(called,false);
 const fetchImpl=async(url,options)=>{assert.equal(url,'http://127.0.0.1:47831/v1/models');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.deepEqual(options.headers,{});return new Response(JSON.stringify({data:[{id:'q2_0',meta:{label:'Qwen'}}]}));};
 assert.deepEqual(await discoverModels('http://127.0.0.1:47831/v1','',{fetchImpl}),[{id:'q2_0',label:'Qwen'}]);
 await assert.rejects(discoverModels('http://localhost:8080/v1','',{fetchImpl:async()=>new Response('{"data":[]}')}),/noch kein Modell/);
});
test('model requests always include the automatic system prompt and the full previous scene',async()=>{
 let sent;const previous=fixture(),fetchImpl=async(url,options)=>{sent=JSON.parse(options.body);assert.equal(url,'http://127.0.0.1:47831/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-key');return new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(previous)}}]}));};
 const answer=await requestScene({base:'http://127.0.0.1:47831/v1',model:'q2_0',key:'test-key',prompt:'Den Steg länger machen',previous,fetchImpl});assert.deepEqual(answer,validateScene(previous));assert.equal(sent.messages[0].content,SCENE_SYSTEM_PROMPT);assert.deepEqual(JSON.parse(sent.messages[1].content),validateScene(previous));assert.equal(sent.messages[2].content,'Den Steg länger machen');assert.equal(sent.reasoning_effort,'none');assert.equal(sent.response_format.type,'json_object');
 for(const code of[401,503])await assert.rejects(requestScene({base:'http://localhost:8080/v1',model:'q2_0',prompt:'Ort',fetchImpl:async()=>new Response('{"error":{}}',{status:code})}),code===401?/Schlüssel/:/nicht bereit/);
 await assert.rejects(requestScene({base:'http://localhost:8080/v1',model:'q2_0',prompt:'Ort',fetchImpl:async()=>new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'{}'}}]}))}),/zu lang/);
});
test('cancelling a request aborts inference and never yields a plan',async()=>{
 const control=new AbortController();let networkSignal;
 const fetchImpl=async(url,options)=>{networkSignal=options.signal;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('cancelled','AbortError')),{once:true}));};
 const request=requestScene({base:'http://localhost:47831/v1',model:'q2_0',prompt:'Eine Taverne',signal:control.signal,fetchImpl});control.abort();
 await assert.rejects(request,e=>e.name==='AbortError');assert.equal(networkSignal.aborted,true);
});

test('real Qwen cave entrance response keeps every repeated rock and repairs duplicate ids',()=>{
 const raw=readFileSync(new URL('./fixtures/qwen-cave-entrance.json',import.meta.url),'utf8');
 const scene=parseScene(raw);assert.equal(scene.objects.length,6);assert.equal(scene.objects.filter(o=>o.type==='rock').length,3);
 assert.equal(new Set(scene.objects.map(o=>o.id)).size,6);assert.deepEqual(parseScene(raw),scene);
 assert.ok(validState(state(compileScene(scene).shapes)));
});
test('id repair reserves later valid ids and never drops repeated geometry',()=>{
 const p=scene([{id:'rock',type:'rock',x:10,y:10,w:50,h:50},{id:'rock',type:'rock',x:80,y:10,w:50,h:50},{id:'rock_2',type:'rock',x:150,y:10,w:50,h:50},{type:'tree',x:250,y:10,w:50,h:50}]);
 const plan=parseScene(JSON.stringify(p));assert.equal(plan.objects[2].id,'rock_2');assert.equal(new Set(plan.objects.map(o=>o.id)).size,4);assert.equal(plan.objects[1].x,80);
});
test('invalid model output gets one contextual repair attempt before preview',async()=>{
 let calls=0,repairs=0;const bad=fixture();bad.objects[0].type='ocean';delete bad.objects[0].points;
 const fetchImpl=async(url,options)=>{calls++;const sent=JSON.parse(options.body);if(calls===2){assert.match(sent.messages.at(-1).content,/ocean/);assert.equal(sent.messages.at(-2).role,'assistant');assert.match(sent.messages[1].content,/Höhleneingang/);}return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(calls===1?bad:fixture())}}]}));};
 const result=await requestScene({base:'http://localhost:47831',model:'q2_0',prompt:'Höhleneingang',fetchImpl,onRepair:()=>repairs++});assert.equal(calls,2);assert.equal(repairs,1);assert.deepEqual(result,validateScene(fixture()));
 calls=0;await assert.rejects(requestScene({base:'http://localhost:47831',model:'q2_0',prompt:'Ort',fetchImpl:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(bad)}}]}));}}),/automatischen Korrektur/);assert.equal(calls,2);
});
test('cancelling during repair never starts another inference',async()=>{
 let calls=0;const control=new AbortController();await assert.rejects(requestScene({base:'http://localhost:47831',model:'q2_0',prompt:'Ort',signal:control.signal,onRepair:()=>control.abort(),fetchImpl:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:'{}'}}]}));}}),e=>e.name==='AbortError');assert.equal(calls,1);
});

test('sketch stairs are spaced open tread lines with no rocks, fill geometry or enclosing wall',()=>{
 for(const direction of ['vertical','horizontal']){
  const result=compileScene(scene([{id:'stairs',type:'stairs',x:200,y:100,w:300,h:180,steps:4,direction}]));
  assert.equal(result.shapes.length,4);
  result.shapes.forEach((s,i)=>{assert.equal(s.type,'path');assert.equal(s.sketch,true);assert.equal(s.terrain,undefined);assert.equal(s.points.length,2);const [a,b]=s.points;if(direction==='vertical'){assert.equal(a.y,b.y);assert.equal(b.x-a.x,300);assert.equal(a.y,100+(i+.5)*45);}else{assert.equal(a.x,b.x);assert.equal(b.y-a.y,180);assert.equal(a.x,200+(i+.5)*75);}});
 }
 for(const bad of [{steps:0},{steps:65},{direction:'diagonal'}])assert.throws(()=>validateScene(scene([{id:'stairs',type:'stairs',x:0,y:0,w:200,h:150,...bad}])));
});
test('sketch outlines preserve open entrances, aspect ratio, save data and editability',()=>{
 const plan=scene([{id:'left',type:'line',points:[[100,700],[200,400],[200,0]]},{id:'right',type:'line',points:[[700,700],[600,400],[600,0]]}]);
 const natural=compileScene(plan),wide=compileScene(plan,{x:0,y:0,w:2000,h:700});
 assert.equal(wide.shapes.length,2);assert.equal(wide.shapes[0].points.length,3);
 natural.shapes.forEach((s,i)=>s.points.forEach((p,j)=>{assert.equal(wide.shapes[i].points[j].x,p.x+500);assert.equal(wide.shapes[i].points[j].y,p.y);}));
 const saved=JSON.parse(JSON.stringify(state(wide.shapes)));assert.ok(validState(saved));assert.ok(saved.shapes.every(s=>s.sketch));saved.shapes[0].sketch='yes';assert.equal(validState(saved),false);
});
test('AI terrain renders only outlines and light water while manual terrain retains its styling',()=>{
 const svg=(tag,attrs)=>({tag,attrs,children:[],append(...kids){this.children.push(...kids);}});
 for(const type of ['tree','rock','mountain','sand','water','pier']){
  const s=compileScene(scene([{id:type,type,x:100,y:100,w:200,h:150}])).shapes[0];
  const g=makeTerrain(s,svg),visible=g.children.filter(n=>n.attrs.class!=='terrain-outline');
  assert.equal(visible.length,1,type);assert.equal(visible[0].attrs.fill,type==='water'?'#83b8bf':'none',type);
  if(type==='water')assert.equal(visible[0].attrs['fill-opacity'],.35);
  assert.ok(makeTerrain({...s,sketch:undefined},svg).children.length>g.children.length,type+' original artwork');
 }
 for(const type of ['cave','ruins'])assert.ok(compileScene(scene([{id:type,type,x:100,y:100,w:600,h:500,count:2}])).shapes.every(s=>s.sketch&&!['cave-floor','ruin-floor','rubble'].includes(s.terrain)));
});

test('free polygons and water derive bounds instead of rejecting redundant model rectangles',()=>{
 const points=[[0,200],[800,150],[1000,700],[0,700]];
 for(const type of ['water','rock','polygon']){
  const plan=parseScene(JSON.stringify(scene([{id:'free',type,x:300,y:300,w:30,h:20,points}])));
  assert.deepEqual(plan.objects[0].points,points);assert.ok(validState(state(compileScene(plan).shapes)));
  if(type!=='polygon')assert.deepEqual([plan.objects[0].x,plan.objects[0].y,plan.objects[0].w,plan.objects[0].h],[0,150,1000,550]);
 }
 const noRectangle=parseScene(JSON.stringify(scene([{id:'water',type:'water',points}])));assert.ok(validState(state(compileScene(noRectangle).shapes)));
});
test('free drawing beyond the nominal canvas fits together without clipping connections',()=>{
 const raw=scene([{id:'edge',type:'line',points:[[-500,-200],[1500,800]]},{id:'pool',type:'water',points:[[500,300],[1500,300],[1500,800],[500,800]]},{id:'oval',type:'ellipse',x:0,y:0,w:500,h:200}]);
 const plan=parseScene(JSON.stringify(raw)),edge=plan.objects[0].points,pool=plan.objects[1].points;
 assert.deepEqual(edge[1],pool[2]);assert.equal(edge[1][0]-edge[0][0],1000);assert.equal((edge[1][0]-edge[0][0])/(edge[1][1]-edge[0][1]),2);
 assert.ok(validState(state(compileScene(plan).shapes)));assert.equal(plan.objects[2].w/plan.objects[2].h,2.5);
});
test('invented subjects can use editable free contours without named terrain presets',()=>{
 const plan=parseScene(JSON.stringify(scene([{id:'altar',type:'floating_altar',closed:true,points:[{x:100,y:100},{x:300,y:100},{x:250,y:300}]},{id:'spiral',type:'line',points:Array.from({length:90},(_,i)=>[500+Math.cos(i/8)*i,350+Math.sin(i/8)*i])}])));
 assert.equal(plan.objects[0].type,'polygon');const shapes=compileScene(plan).shapes;assert.equal(shapes[0].type,'path');assert.deepEqual(shapes[0].points[0],shapes[0].points.at(-1));assert.equal(shapes[1].points.length,90);assert.ok(validState(state(shapes)));
 const many=scene(Array.from({length:80},(_,i)=>({id:'mark'+i,type:'line',points:[[i*10,100],[i*10,200]]})));assert.equal(compileScene(parseScene(JSON.stringify(many))).shapes.length,80);
});
