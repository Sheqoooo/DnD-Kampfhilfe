import{ensureTokenCodes,tokenSymbol,tokenCode,ensureEnemyNumbers,participantName}from'./tokens.js?v=enemy-numbers-1';
import{icon}from'./ui-icons.js?v=controls-1';
import{worldRect,clampWorldPoint}from'./world.js?v=manual-order-1';
import{fullView,zoomView,panView}from'./viewport.js?v=manual-order-1';
import{recordChange,undoChange,redoChange}from'./history.js?v=manual-order-1';
import{snapDrawingPoint,integrateShape,translateShape,shapeHandles,reshapeShape,selectionBounds,transformSelection,moveSelection,shapesInBox,placeDoor}from'./drawing.js?v=manual-order-1';
import{clamp,order,advance,recognize,validState,reorderCombatants,prepareManualOrder}from'./core.js?v=manual-order-1';
import{CAMPAIGN_KEY,HERO_FIELDS,characterFrom,makeCampaign,saveEncounter,syncCharacterChanges,addToEncounter,validCampaign,updateCharacter,beginEncounter,ensureEnemies,rememberEnemy,spawnEnemy,validEnemy}from'./campaign.js?v=manual-order-1';
const $=s=>document.querySelector(s),uid=()=>crypto.randomUUID(),KEY='initiative.encounter.v1',NS='http://www.w3.org/2000/svg';
const demo=()=>({version:1,title:'Überfall am alten Wachturm',demo:true,started:true,round:1,active:'lyra',people:[{id:'lyra',name:'Lyra',kind:'ally',hp:32,max:38,init:19,x:375,y:475},{id:'g1',name:'Goblin-Späher 1',kind:'enemy',hp:7,max:12,init:16,x:575,y:325},{id:'g2',name:'Goblin-Späher 2',kind:'enemy',hp:12,max:12,init:16,x:625,y:375},{id:'thorin',name:'Thorin',kind:'ally',hp:45,max:45,init:12,x:475,y:525}],shapes:[{id:'room',type:'rect',x:250,y:200,w:500,h:350},{id:'tower',type:'ellipse',x:600,y:100,w:200,h:200},{id:'wall1',type:'wall',points:[{x:250,y:350},{x:350,y:350}]},{id:'wall2',type:'wall',points:[{x:500,y:200},{x:500,y:300}]},{id:'pillar',type:'rect',x:400,y:300,w:50,h:50}]});
let view=fullView(),spaceHeld=false;
let state=demo(),campaign,history=[],future=[],selectedCombatantId=null,selectedShapeId=null,selectedIds=new Set(),multiSelect=false,draggedPerson=null,tool='select',snap=true,connect=true,wallAnchor=null,editId=null,characterEditId=null,gesture=null,toastTimer,storageBroken=false,draggedEnemy=null,enemyEditId=null;
try{const saved=localStorage.getItem(CAMPAIGN_KEY);if(saved){campaign=JSON.parse(saved);if(!validCampaign(campaign))throw Error('invalid campaign');state=structuredClone(campaign.encounters.find(e=>e.id===campaign.activeId));}else{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(!validState(parsed))throw Error('invalid');state=parsed;}campaign=makeCampaign(state,uid);state=structuredClone(campaign.encounters[0]);}}catch{storageBroken=true;campaign=makeCampaign(state,uid);state=structuredClone(campaign.encounters[0]);}
ensureEnemies(campaign,uid);for(const battle of campaign.encounters)prepareManualOrder(battle);prepareManualOrder(state);for(const battle of campaign.encounters)ensureEnemyNumbers(battle);ensureEnemyNumbers(state);ensureTokenCodes(campaign,state);
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200);}
function snapshot(){return structuredClone({state,campaign});}
function checkpoint(){recordChange(history,future,snapshot());}
function persist(){prepareManualOrder(state);for(const battle of campaign.encounters)ensureEnemyNumbers(battle);ensureEnemyNumbers(state);ensureTokenCodes(campaign,state);try{saveEncounter(campaign,state);localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(campaign));storageBroken=false;$('#save-status').innerHTML='<span></span> Lokal gespeichert';}catch{storageBroken=true;$('#save-status').textContent='Speichern nicht möglich · bitte sichern';}}
function mutate(fn){checkpoint();const before=structuredClone(state);fn();syncCharacterChanges(campaign,before,state);persist();render();}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tokenMarkup(p,{active=false,decorative=false}={}){
 const ally=p.kind!=='enemy',label=tokenCode(p);
 return `<span class="fantasy-token ${ally?'ally':'enemy'} ${active?'is-active':''}" style="--list-code-size:${label.length>4?7:label.length>3?9:11}px;--map-code-size:${label.length>3?12:label.length>2?16:label.length>1?20:24}px" ${decorative?'aria-hidden="true"':'role="img" aria-label="'+escape(participantName(p))+', Kürzel '+escape(label)+(active?', am Zug':'')+'"'}><img class="token-base" src="assets/token-base.webp" alt="" aria-hidden="true" draggable="false"><span class="token-symbol">${icon(tokenSymbol(p))}</span><span class="token-code">${escape(label)}</span>${active?'<span class="token-active" aria-hidden="true">◆</span>':''}</span>`;
}
function render(){const sorted=order(state.people);$('#encounter-title').value=state.title;$('#participant-count').textContent=`${state.people.filter(p=>p.kind==='ally').length} Helden · ${state.people.filter(p=>p.kind==='enemy').length} Gegner`;$('#list-count').textContent=state.people.length;$('#round').textContent=state.round;$('#demo-label').hidden=!state.demo;$('#undo').disabled=!history.length;$('#map-undo').disabled=!history.length;$('#map-redo').disabled=!future.length;$('#order-help').textContent='Am Griff ziehen · Alt + ↑/↓';$('#next-turn').disabled=!state.people.length;const active=state.people.find(p=>p.id===state.active);$('#turn-hint').textContent=active?`${participantName(active)} ist am Zug`:'Füge Beteiligte hinzu, um zu starten.';
$('#combatant-list').innerHTML=sorted.length?sorted.map((p,index)=>`<article class="combatant ${p.id===state.active?'active':''} ${p.hp===0?'downed':''}" data-person="${escape(p.id)}" draggable="true"${true?' tabindex="0" aria-label="'+escape(participantName(p))+', Reihenfolge ändern mit Alt und Pfeiltasten"':''}>${p.id===state.active?'<div class="active-label"><span>JETZT AM ZUG</span><span>◆</span></div>':''}<div class="combatant-top"><div class="initiative-number"><strong>${index+1}</strong><small>PLATZ</small></div><button class="token-edit" data-action="edit" aria-label="${escape(participantName(p))} bearbeiten${p.id===state.active?', am Zug':''}" title="Werte bearbeiten">${tokenMarkup(p,{active:p.id===state.active,decorative:true})}</button><div class="person-details"><div class="person-name">${escape(participantName(p))}</div><div class="person-kind">${p.kind==='ally'?'Held':'Gegner'}${p.hp===0?' · 0 HP':''}</div></div><button type="button" class="turn-drag-handle" draggable="false" aria-label="${escape(participantName(p))}: Reihenfolge ziehen oder mit Alt und Pfeiltasten ändern" title="Reihenfolge ziehen · Alt + ↑/↓">⠿</button></div><div class="hp-row"><div class="hp-track"><div class="hp-fill ${p.hp/p.max<.4?'low':''}" style="width:${p.hp/p.max*100}%"></div></div><div class="hp-number">${p.hp} <small>/ ${p.max} HP</small></div></div><div class="hp-controls"><span>TREFFERPUNKTE</span><button data-action="damage" class="damage" title="Schaden zufügen" aria-label="${escape(participantName(p))} Schaden zufügen">−</button><input aria-label="HP-Betrag für ${escape(participantName(p))}" type="number" min="1" max="9999" value="1"><button data-action="heal" title="Heilen" aria-label="${escape(participantName(p))} heilen">＋</button></div></article>`).join(''):'<div class="empty-list"><strong>Noch ist alles ruhig.</strong>Füge Helden und Gegner hinzu.<br>Ziehe die Karten in eure gewürfelte Reihenfolge.<button class="secondary" id="empty-add">'+icon('add')+' Beteiligte hinzufügen</button></div>';markSelectedCombatant();$('#empty-add')?.addEventListener('click',()=>openParticipant());renderMap();renderCampaign();}
function svgEl(tag,attrs={}){const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}

function makeDoor(sh,isDraft=false){
 const [a,b]=sh.points,dx=b.x-a.x,dy=b.y-a.y,size=Math.hypot(dx,dy),nx=-dy/size,ny=dx/size;
 const g=svgEl('g',{'data-door':isDraft?'preview':sh.id||''});
 g.append(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'transparent','stroke-width':24,'pointer-events':isDraft?'none':'stroke'}));
 for(const p of [a,b])g.append(svgEl('line',{x1:p.x-nx*6,y1:p.y-ny*6,x2:p.x+nx*6,y2:p.y+ny*6,stroke:'#8c7050','stroke-width':4,'stroke-linecap':'round'}));
 const end=sh.open?{x:a.x-dy,y:a.y+dx}:b;
 g.append(svgEl('line',{class:'door-leaf',x1:a.x,y1:a.y,x2:end.x,y2:end.y,stroke:'#a67847','stroke-width':6,'stroke-linecap':'round'}));
 if(sh.open)g.append(svgEl('path',{d:'M'+b.x+' '+b.y+'A'+size+' '+size+' 0 0 1 '+end.x+' '+end.y,fill:'none',stroke:'#ad935f','stroke-width':1.5,'stroke-dasharray':'4 4','pointer-events':'none'}));
 else g.append(svgEl('circle',{cx:a.x+dx*.8+nx*3,cy:a.y+dy*.8+ny*3,r:2,fill:'#f5d892'}));
 return g;
}
function renderDoorMask(){
 let mask=$('#door-cutouts');if(!mask){mask=svgEl('mask',{id:'door-cutouts',maskUnits:'userSpaceOnUse',...worldRect});$('#map defs').append(mask);}
 mask.replaceChildren(svgEl('rect',{...worldRect,fill:'white'}),...state.shapes.filter(s=>s.type==='door').map(s=>svgEl('line',{x1:s.points[0].x,y1:s.points[0].y,x2:s.points[1].x,y2:s.points[1].y,stroke:'black','stroke-width':12,'stroke-linecap':'butt'})));
}

function makeShape(sh,isDraft=false){let el;const attrs={fill:'none',stroke:isDraft?'#8d9e70':'#7b806a','stroke-width':isDraft?3:5,'stroke-linecap':'round','stroke-linejoin':'round'};if(sh.type==='door'){el=makeDoor(sh,isDraft);}else if(sh.type==='room'){el=svgEl('path',{d:sh.rings.map(r=>'M'+r.map(p=>p.x+' '+p.y).join('L')+'Z').join(' '),...attrs,fill:isDraft?'#b9c79d33':'url(#floor)','fill-rule':'evenodd'});}else if(sh.type==='rect'){el=svgEl('rect',{x:sh.x,y:sh.y,width:sh.w,height:sh.h,rx:3,...attrs,fill:isDraft?'#b9c79d33':'url(#floor)'});}else if(sh.type==='ellipse'){el=svgEl('ellipse',{cx:sh.x+sh.w/2,cy:sh.y+sh.h/2,rx:sh.w/2,ry:sh.h/2,...attrs,fill:isDraft?'#b9c79d33':'url(#floor)'});}else{el=svgEl('polyline',{points:sh.points.map(p=>`${p.x},${p.y}`).join(' '),...attrs});}if(sh.interior){el.setAttribute('fill','none');el.setAttribute('stroke-width',isDraft?3:4);}
 if(isDraft)el.style.pointerEvents='none';if(!isDraft&&sh.type!=='door')el.setAttribute('mask','url(#door-cutouts)');if(isDraft)el.setAttribute('stroke-dasharray','7 5');else{el.dataset.shape=sh.id;if(selectedIds.has(sh.id))el.classList.add('selected-shape');el.style.pointerEvents='all';el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',(sh.type==='door'?'Tür '+(sh.open?'offen':'geschlossen'):sh.type==='wall'?'Wand':sh.interior?'Innenraum':'Gebäude')+' verschieben. Pfeiltasten zum Verschieben.');if(tool==='select')el.style.cursor='grab';if(tool==='erase')el.style.cursor='pointer';}return el;}
function renderMap(){
 renderDoorMask();const shapes=$('#shapes'),tokens=$('#tokens');
 shapes.replaceChildren(...[...state.shapes].sort((a,b)=>(a.type==='door'?2:Number(!!a.interior))-(b.type==='door'?2:Number(!!b.interior))).map(s=>makeShape(s)));tokens.replaceChildren();
 const screenScale=$('#map').clientWidth/view.width,markerScale=Math.max(1,28/(56*screenScale));
 for(const p of state.people){
  const active=p.id===state.active,g=svgEl('g',{'data-token':p.id,transform:`translate(${p.x} ${p.y})`,tabindex:0,role:'button','aria-label':`${participantName(p)}, Kürzel ${tokenCode(p)}, ${p.hp} von ${p.max} HP${active?', am Zug':''}. Pfeiltasten zum Verschieben.`,opacity:p.hp===0?.5:1});
  const visual=svgEl('g',{class:'map-token-visual',transform:`scale(${markerScale})`});
  visual.append(svgEl('circle',{r:27,fill:'transparent'}));
  const content=svgEl('foreignObject',{x:-40,y:-40,width:80,height:80,'pointer-events':'none','aria-hidden':'true'});
  const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');wrapper.className='map-token-content';wrapper.innerHTML=tokenMarkup(p,{active,decorative:true});content.append(wrapper);visual.append(content);g.append(visual);
  if(view.zoom>=.6){const name=svgEl('text',{y:38*markerScale,'text-anchor':'middle',fill:'#49301a','font-size':10*markerScale,'font-weight':600,'paint-order':'stroke',stroke:'#e8d7ad','stroke-width':3,'pointer-events':'none','aria-hidden':'true'});name.textContent=participantName(p);g.append(name);}
  tokens.append(g);
 }
 $('#map-empty').hidden=!!(state.people.length||state.shapes.length);renderHandles();
}

function openParticipant(id=null){editId=id;let p=state.people.find(p=>p.id===id);if(p?.characterId&&campaign.characters.some(c=>c.id===p.characterId)){openCharacter(p.characterId);return;}$('#participant-form').reset();$('#dialog-title').textContent=p?'Beteiligten bearbeiten':'Wer zieht in den Kampf?';$('#p-name').value=p?.name??'';$('#p-hp').value=p?.max??12;document.querySelector(`input[name="kind"][value="${p?.kind??'enemy'}"]`).checked=true;$('#quantity-label').hidden=!!p;$('#submit-participant').textContent=p?'Änderungen speichern':'Zum Kampf hinzufügen ＋';$('#remove-person')?.remove();if(p){let b=document.createElement('button');b.type='button';b.className='text-button';b.id='remove-person';b.textContent='Aus dem Kampf entfernen';b.style.marginTop='15px';b.onclick=()=>{mutate(()=>{state.people=state.people.filter(x=>x.id!==id);if(state.active===id)state.active=order(state.people)[0]?.id??null;});$('#participant-dialog').close();toast('Entfernt. Mit „Rückgängig“ wiederherstellen.');};$('#participant-form').append(b);}$('#participant-dialog').showModal();$('#p-name').focus();}
$('#participant-form').onsubmit=e=>{e.preventDefault();let name=$('#p-name').value.trim();if(!name){$('#p-name').setCustomValidity('Bitte einen Namen eingeben.');$('#p-name').reportValidity();return;}let max=+$('#p-hp').value,init=state.people.find(p=>p.id===editId)?.init??0,count=editId?1:+$('#p-count').value,kind=document.querySelector('input[name=kind]:checked').value;if(state.people.length+(!editId?count:0)>100){toast('Maximal 100 Beteiligte pro Kampf.');return;}mutate(()=>{if(editId){let p=state.people.find(p=>p.id===editId);Object.assign(p,{name,kind,max,hp:Math.min(p.hp,max),init});if(state.started===false)state.active=order(state.people)[0]?.id??null;}else{for(let i=0;i<count;i++){const n=state.people.length;const added={id:uid(),name:count>1?`${name.slice(0,46)} ${i+1}`:name,kind,max,hp:max,init,turnPosition:n,x:75+(n%18)*50,y:75+(Math.floor(n/18)%12)*50};if(kind==='ally'){const character=characterFrom(added,uid());campaign.characters.push(character);added.characterId=character.id;for(const f of HERO_FIELDS)added[f]=character[f];}state.people.push(added);}if(!state.active||state.started===false)state.active=order(state.people)[0].id;}if(kind==='enemy')rememberEnemy(campaign,{name,max,init},uid);state.demo=false;});$('#participant-dialog').close();toast(editId?'Änderungen gespeichert.':`${count===1?name:count+' Beteiligte'} hinzugefügt.`);};$('#p-name').oninput=()=>$('#p-name').setCustomValidity('');$('#add').onclick=()=>openParticipant();
$('#combatant-list').onclick=e=>{let b=e.target.closest('[data-action]');if(!b)return;let card=b.closest('[data-person]'),p=state.people.find(p=>p.id===card.dataset.person);if(b.dataset.action==='move-up'||b.dataset.action==='move-down'){movePerson(p.id,b.dataset.action==='move-up'?-1:1);return;}if(b.dataset.action==='edit'){openParticipant(p.id);return;}let amount=+card.querySelector('input').value;if(!Number.isInteger(amount)||amount<1||amount>9999){toast('Bitte einen HP-Betrag von 1 bis 9999 eingeben.');return;}mutate(()=>p.hp=clamp(p.hp+(b.dataset.action==='heal'?amount:-amount),0,p.max));toast(`${participantName(p)}: ${p.hp} / ${p.max} HP`);};
$('#encounter-title').onchange=e=>mutate(()=>{state.title=e.target.value.trim()||'Ein neues Abenteuer';state.demo=false;});$('#next-turn').onclick=()=>mutate(()=>{state.started=true;advance(state);});function undoAction(){if(gesture)return;const previous=undoChange(history,future,snapshot());if(!previous)return;({state,campaign}=previous);clearSelection();wallAnchor=null;$('#draft').replaceChildren();persist();render();toast('Letzte Änderung zurückgenommen.');}
function redoAction(){if(gesture)return;const next=redoChange(history,future,snapshot());if(!next)return;({state,campaign}=next);clearSelection();persist();render();toast('Änderung wiederhergestellt.');}
$('#undo').onclick=$('#map-undo').onclick=undoAction;$('#map-redo').onclick=redoAction;$('#new-encounter').onclick=()=>openNewEncounter();$('#clear-map').onclick=()=>{if(!state.shapes.length)return;if(confirm('Alle gezeichneten Formen entfernen? Die Figuren bleiben stehen.'))mutate(()=>state.shapes=[]);};
const descriptions={pan:'Die Ansicht ziehen, ohne Figuren oder Formen zu bewegen.',select:'Freie Fläche ziehen, um die Ansicht zu verschieben. Figuren und Formen direkt bewegen. Mit Shift oder Mehrfachauswahl einen Auswahlrahmen ziehen.',smart:'Frei zeichnen: Linien werden glatt, geschlossene Formen werden Räume.',wall:'Wand ziehen oder Anfang und Ende nacheinander anklicken.',rect:'Ziehen, um einen rechteckigen Raum aufzuspannen.',ellipse:'Ziehen, um einen runden Raum aufzuspannen.',door:'Auf eine Wand klicken, um eine Tür einzusetzen. Tür anklicken, um sie zu öffnen oder zu schließen.',erase:'Eine Wand oder einen Raum anklicken, um die Form zu entfernen.'};const names={pan:'Ansicht verschieben',select:'Verschieben',smart:'Freihand schönziehen',wall:'Wand',rect:'Rechteckiger Raum',ellipse:'Runder Raum',door:'Tür einsetzen',erase:'Form entfernen'};
$('#tool-description .map-help-sizing').textContent=descriptions.select;
$('#map-hint .map-help-sizing').textContent='Verschieben · Freie Fläche ziehen: Ansicht verschieben · Shift/Mehrfachauswahl: Auswahlrahmen.';
function setTool(t){if(t!=='select')clearSelection();wallAnchor=null;$('#draft').replaceChildren();tool=t;document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('selected',b.dataset.tool===t);b.setAttribute('aria-pressed',String(b.dataset.tool===t));});$('#tool-description-text').textContent=descriptions[t];$('#map-hint-text').textContent=names[t]+' · '+(t==='smart'?'Kreis oder Rechteck schließen, um einen Raum zu erstellen.':t==='select'?'Freie Fläche ziehen: Ansicht verschieben · Shift/Mehrfachauswahl: Auswahlrahmen.':'Maus oder Finger verwenden.');$('#map').style.cursor=t==='pan'||t==='select'?'grab':'crosshair';renderMap();}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));$('#snap').onchange=e=>snap=e.target.checked;$('#connect').onchange=e=>{connect=e.target.checked;setTool(tool);};$('#room-mode').onchange=()=>{setTool(tool);toast($('#room-mode').value==='interior'?'Innenräume zeichnen · Wände bleiben erhalten.':'Gebäude und Anbauten zeichnen · verbundene Flächen verschmelzen.');};
function position(e){const pt=$('#map').createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform($('#map').getScreenCTM().inverse());return clampWorldPoint(p);}
function renderView(){
 $('#map').setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
 for(const rect of $('#map').querySelectorAll(':scope > rect'))for(const key of ['x','y','width','height'])rect.setAttribute(key,view[key]);
 renderMap();
 $('#zoom-level').textContent=Math.round(view.zoom*100)+'%';
 $('#zoom-out').disabled=view.zoom<=.25;$('#zoom-in').disabled=view.zoom>=4;
 $('#zoom-reset').disabled=view.zoom===1&&view.x===0&&view.y===0;$('#map').setAttribute('aria-label','Interaktives Kampffeld · Zoom '+Math.round(view.zoom*100)+' Prozent.');
}
function changeZoom(factor,anchor){if(gesture)return;view=zoomView(view,factor,anchor);renderView();}
$('#zoom-in').onclick=()=>changeZoom(1.25);$('#zoom-out').onclick=()=>changeZoom(1/1.25);
$('#zoom-reset').onclick=()=>{if(gesture)return;view=fullView();renderView();};
$('#map').addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();if(gesture)return;changeZoom(Math.exp(-e.deltaY*.003),position(e));},{passive:false});
$('#map').oncontextmenu=e=>{if(tool==='pan')e.preventDefault();};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.closest?.('#map-stage')&&!e.target.closest('button')){e.preventDefault();spaceHeld=true;$('#map').style.cursor='grab';}});
document.addEventListener('keyup',e=>{if(e.code==='Space'){spaceHeld=false;$('#map').style.cursor=tool==='pan'||tool==='select'?'grab':'crosshair';}});
window.addEventListener('blur',()=>{spaceHeld=false;});

const gridPoint=p=>clampWorldPoint({x:snap?Math.round(p.x/50)*50:p.x,y:snap?Math.round(p.y/50)*50:p.y});

function drawingPoint(p){return snapDrawingPoint(p,state.shapes,snap,connect);}
function guide(p){if(!p.attached)return;$('#draft').append(svgEl('circle',{cx:p.x,cy:p.y,r:9,fill:'#d3ac5b33',stroke:'#b9954c','stroke-width':2,'pointer-events':'none'}));}
function dragShape(a,b){a=drawingPoint(a);b=drawingPoint(b);if(tool==='wall')return{type:'wall',points:[{x:a.x,y:a.y},{x:b.x,y:b.y}]};return{type:tool,x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};}
function commitDrawing(sh){
 if(!sh)return;sh.id=sh.id||uid();if($('#room-mode').value==='interior')sh.interior=true;let result;
 try{result=integrateShape(state.shapes,sh,{connect,idFactory:uid});}catch{toast('Diese Formen konnten nicht verbunden werden. Sie bleiben einzeln.');result={shapes:[...state.shapes,sh]};}
 if(result.shapes.length>1000){toast('Maximal 1000 Formen. Bitte einige entfernen.');return;}
 mutate(()=>state.shapes=result.shapes);
 if(sh.interior&&['rect','ellipse','room'].includes(sh.type))toast('Innenraum hinzugefügt · Innenwände bleiben erhalten.');
 else if(result.closed)toast('Wände geschlossen · Raum erstellt'+(result.merged?' und verbunden.':'.'));
 else if(result.merged)toast('Räume verbunden · gemeinsame Innenwände entfernt.');
 else if(result.duplicate)toast('Diese Wand ist bereits vorhanden.');
 else if(tool==='smart')toast(sh.type==='rect'?'Rechteck erkannt und ausgerichtet.':sh.type==='ellipse'?'Runder Raum erkannt.':'Linie geglättet und verbunden.');
}
function previewDraw(pos){
 const draft=tool==='smart'?{type:'path',points:gesture.points}:dragShape(gesture.start,pos);if($('#room-mode').value==='interior')draft.interior=true;
 $('#draft').replaceChildren(makeShape(draft,true));guide(drawingPoint(pos));
}
$('#map').ondragover=e=>{if(!draggedEnemy)return;e.preventDefault();e.dataTransfer.dropEffect='copy';};$('#map').ondrop=e=>{if(!draggedEnemy)return;e.preventDefault();const id=draggedEnemy;draggedEnemy=null;const p=position(e);if(snap){p.x=Math.round((p.x-25)/50)*50+25;p.y=Math.round((p.y-25)/50)*50+25;}addEnemy(id,p);};
function beginPan(e){
 e.preventDefault();if(gesture)return;wallAnchor=null;$('#draft').replaceChildren();$('#map').setPointerCapture(e.pointerId);gesture={type:'pan',origin:{...view},start:{x:e.clientX,y:e.clientY},scale:$('#map').getScreenCTM().a};$('#map').style.cursor='grabbing';
}
$('#map').onpointerdown=e=>{
 if(e.button===1||e.button===0&&(tool==='pan'||spaceHeld)){beginPan(e);return;}
 if(e.button!==0||gesture)return;const pos=position(e),token=e.target.closest('[data-token]'),shape=e.target.closest('[data-shape]'),handle=e.target.closest('[data-handle]');
 if(tool==='door'){const existing=shape&&state.shapes.find(s=>s.id===shape.dataset.shape);if(existing?.type==='door'){mutate(()=>existing.open=!existing.open);toast(existing.open?'Tür geöffnet.':'Tür geschlossen.');return;}if(state.shapes.length>=1000){toast('Maximal 1000 Formen.');return;}const door=placeDoor(pos,state.shapes,{grid:snap});if(!door){toast('Klicke nahe an eine Wand, um die Tür einzusetzen.');return;}const center=p=>({x:(p.points[0].x+p.points[1].x)/2,y:(p.points[0].y+p.points[1].y)/2});if(state.shapes.some(s=>s.type==='door'&&Math.hypot(center(s).x-center(door).x,center(s).y-center(door).y)<25)){toast('Hier befindet sich schon eine Tür.');return;}door.id=uid();mutate(()=>state.shapes.push(door));$('#draft').replaceChildren();toast('Tür eingesetzt · mit dem Tür-Werkzeug anklicken zum Öffnen.');return;}
 if(tool==='erase'){if(shape)mutate(()=>state.shapes=state.shapes.filter(s=>s.id!==shape.dataset.shape));return;}
 if(tool==='select'&&!token&&!shape&&!handle){
  if(e.shiftKey||multiSelect){gesture={type:'marquee',start:pos,end:pos,previous:[...selectedIds]};$('#map').setPointerCapture(e.pointerId);renderMap();}
  else{clearSelection();beginPan(e);}
  return;
 }
 if(tool!=='select'&&state.shapes.length>=1000){toast('Maximal 1000 Formen. Bitte einige entfernen.');return;}
 $('#map').setPointerCapture(e.pointerId);
 if(tool==='select'){
 if(handle&&selectedIds.size>1){gesture={type:'group-resize',index:+handle.dataset.handle,origin:structuredClone(selectedShapes()),before:snapshot()};return;}
 if(handle){const sh=state.shapes.find(s=>s.id===selectedShapeId);if(!sh)return;gesture={type:'resize',id:sh.id,index:+handle.dataset.handle,start:pos,origin:structuredClone(sh),before:snapshot()};return;}
 if(token){clearSelection();const p=state.people.find(p=>p.id===token.dataset.token);gesture={type:'token',id:p.id,start:pos,origin:{x:p.x,y:p.y},before:snapshot()};}
 else{const sh=state.shapes.find(s=>s.id===shape.dataset.shape);if(e.shiftKey||multiSelect){if(selectedIds.has(sh.id))selectedIds.delete(sh.id);else selectedIds.add(sh.id);renderMap();return;}if(!selectedIds.has(sh.id))selectedIds=new Set([sh.id]);renderMap();if(selectedIds.size>1)gesture={type:'group-move',start:pos,origin:structuredClone(selectedShapes()),before:snapshot()};else gesture={type:'shape',id:sh.id,start:pos,origin:structuredClone(sh),before:snapshot()};}
 }else gesture={type:'draw',points:[pos],start:wallAnchor||pos,clickStart:pos,anchored:!!wallAnchor};
};
$('#map').onpointermove=e=>{
 if(gesture?.type==='pan'){if(!gesture.moved&&Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)<5)return;gesture.moved=true;view=panView(gesture.origin,(e.clientX-gesture.start.x)/gesture.scale,(e.clientY-gesture.start.y)/gesture.scale);renderView();return;}
 const pos=position(e);
 if(gesture?.type==='token'&&!gesture.moved){const scale=$('#map').getScreenCTM().a;if(Math.hypot(pos.x-gesture.start.x,pos.y-gesture.start.y)*scale<5)return;gesture.moved=true;}
 if(!gesture){if(tool==='door'){const door=placeDoor(pos,state.shapes,{grid:snap});$('#draft').replaceChildren(...(door?[makeShape(door,true)]:[]));return;}if(tool==='wall'&&wallAnchor){$('#draft').replaceChildren(makeShape(dragShape(wallAnchor,pos),true));guide(drawingPoint(pos));}return;}
 if(gesture.type==='marquee'){gesture.end=pos;$('#draft').replaceChildren(svgEl('rect',{x:Math.min(pos.x,gesture.start.x),y:Math.min(pos.y,gesture.start.y),width:Math.abs(pos.x-gesture.start.x),height:Math.abs(pos.y-gesture.start.y),fill:'#bd9d5822',stroke:'#bd9d58','stroke-width':2,'stroke-dasharray':'6 4','pointer-events':'none'}));return;}
 if(gesture.type==='group-resize'){const p=gridPoint(pos);replaceSelection(transformSelection(gesture.origin,gesture.index,p));renderMap();return;}
 if(gesture.type==='group-move'){let dx=pos.x-gesture.start.x,dy=pos.y-gesture.start.y;if(snap){dx=Math.round(dx/50)*50;dy=Math.round(dy/50)*50;}replaceSelection(moveSelection(gesture.origin,dx,dy));renderMap();return;}
 if(gesture.type==='token'){const p=state.people.find(p=>p.id===gesture.id);let x=gesture.origin.x+pos.x-gesture.start.x,y=gesture.origin.y+pos.y-gesture.start.y;if(snap){x=Math.round((x-25)/50)*50+25;y=Math.round((y-25)/50)*50+25;}Object.assign(p,clampWorldPoint({x,y},25));renderMap();}
 else if(gesture.type==='resize'){const p=snapDrawingPoint(pos,state.shapes.filter(s=>s.id!==gesture.id),snap,connect);state.shapes[state.shapes.findIndex(s=>s.id===gesture.id)]=reshapeShape(gesture.origin,gesture.index,p);renderMap();}
 else if(gesture.type==='shape'){let dx=pos.x-gesture.start.x,dy=pos.y-gesture.start.y;if(snap){dx=Math.round(dx/50)*50;dy=Math.round(dy/50)*50;}state.shapes[state.shapes.findIndex(s=>s.id===gesture.id)]=translateShape(gesture.origin,dx,dy);renderMap();}
 else{if(Math.hypot(pos.x-gesture.points.at(-1).x,pos.y-gesture.points.at(-1).y)>2&&gesture.points.length<2000)gesture.points.push(pos);previewDraw(pos);}
};
function finishGesture(e,cancel=false){
 if(!gesture)return;const g=gesture;gesture=null;$('#draft').replaceChildren();
 if(g.type==='pan'){if(cancel)view=g.origin;renderView();$('#map').style.cursor=tool==='pan'||tool==='select'||spaceHeld?'grab':'crosshair';return;}
 if(g.type==='marquee'){if(!cancel)selectedIds=new Set([...g.previous,...shapesInBox(state.shapes,g.start,g.end)]);else selectedIds=new Set(g.previous);renderMap();return;}
 if(g.type==='group-resize'||g.type==='group-move'){if(cancel){({state,campaign}=g.before);render();return;}if(JSON.stringify(selectedShapes())!==JSON.stringify(g.origin)){recordChange(history,future,g.before);persist();render();}return;}
 if(g.type==='token'||g.type==='shape'||g.type==='resize'){
 if(cancel){({state,campaign}=g.before);render();return;}
 const changed=g.type==='token'?(()=>{const p=state.people.find(p=>p.id===g.id);return p.x!==g.origin.x||p.y!==g.origin.y;})():JSON.stringify(state.shapes.find(s=>s.id===g.id))!==JSON.stringify(g.origin);
 if(changed){recordChange(history,future,g.before);
 if(g.type==='shape'||g.type==='resize'){const sh=state.shapes.find(s=>s.id===g.id);try{const result=integrateShape(state.shapes.filter(s=>s.id!==g.id),sh,{connect,idFactory:uid});state.shapes=result.shapes;if(result.merged)toast('Verschobene Räume verbunden.');}catch{toast('Form verschoben; automatische Verbindung war nicht möglich.');}}
 persist();render();}return;
 }
 if(cancel){wallAnchor=null;return;}
 const pos=position(e);
 if(tool==='wall'&&!g.anchored&&Math.hypot(pos.x-g.clickStart.x,pos.y-g.clickStart.y)<8){wallAnchor=drawingPoint(g.start);guide(wallAnchor);$('#map-hint-text').textContent='Wandanfang gesetzt · Ende anklicken · Esc bricht ab.';return;}
 let sh;
 if(tool==='smart'){if(Math.hypot(pos.x-g.points.at(-1).x,pos.y-g.points.at(-1).y)>2)g.points.push(pos);sh=recognize(g.points,false);if(sh?.points){sh.points[0]=drawingPoint(sh.points[0]);sh.points[sh.points.length-1]=drawingPoint(sh.points.at(-1));}else if(sh){const a=drawingPoint({x:sh.x,y:sh.y}),b=drawingPoint({x:sh.x+sh.w,y:sh.y+sh.h});sh={...sh,x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};}}
 else sh=dragShape(g.start,pos);
 if(!sh)return;
 if(sh.points&&(!sh.points.length||Math.hypot(sh.points[0].x-sh.points.at(-1).x,sh.points[0].y-sh.points.at(-1).y)<8&&sh.points.length<=2))return;
 if(!sh.points&&(sh.w<10||sh.h<10))return;
 wallAnchor=null;commitDrawing(sh);setTool(tool);
}
$('#map').onpointerup=e=>finishGesture(e);$('#map').onpointercancel=e=>finishGesture(e,true);
$('#map').onkeydown=e=>{
 if(tool==='pan'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();view=panView(view,e.key==='ArrowLeft'?view.width*.1:e.key==='ArrowRight'?-view.width*.1:0,e.key==='ArrowUp'?view.height*.1:e.key==='ArrowDown'?-view.height*.1:0);renderView();return;}
 const handle=e.target.closest('[data-handle]');if(handle&&selectedIds.size>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const index=+handle.dataset.handle,b=selectionBounds(selectedShapes()),corners=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}],p=corners[index],step=snap?50:10;mutate(()=>replaceSelection(transformSelection(selectedShapes(),index,{x:p.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:p.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)})));$('#handles [data-handle="'+index+'"]')?.focus();return;}
 if(handle&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const id=selectedShapeId,index=+handle.dataset.handle,sh=state.shapes.find(s=>s.id===id),p=shapeHandles(sh)[index],step=snap?50:10;mutate(()=>{state.shapes=state.shapes.map(s=>s.id===id?reshapeShape(s,index,{x:p.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0),y:p.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)}):s);});$('#handles [data-handle="'+index+'"]')?.focus();return;}
 const token=e.target.closest('[data-token]'),shape=e.target.closest('[data-shape]');
 if((!token&&!shape)||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=snap?50:10,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
 if(token){const id=token.dataset.token;mutate(()=>{const p=state.people.find(p=>p.id===id);Object.assign(p,clampWorldPoint({x:p.x+dx,y:p.y+dy},25));});[...$('#tokens').children].find(el=>el.dataset.token===id)?.focus();}
 else{const id=shape.dataset.shape;mutate(()=>{if(selectedIds.size>1&&selectedIds.has(id))replaceSelection(moveSelection(selectedShapes(),dx,dy));else state.shapes=state.shapes.map(s=>s.id===id?translateShape(s,dx,dy):s);});[...$('#shapes').children].find(el=>el.dataset.shape===id)?.focus();}
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selectedIds.size&&!gesture){clearSelection();renderMap();}if(e.key==='Escape'&&wallAnchor){wallAnchor=null;$('#draft').replaceChildren();setTool(tool);}});
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(campaign,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(state.title.replace(/[^\p{L}\p{N}_-]/gu,'-')||'kampf')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Spieler und alle Kämpfe gesichert.');};$('#import').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>20e6)throw Error();const data=JSON.parse(await f.text());if(!validState(data)&&!validCampaign(data))throw Error();if(confirm(data.version===2?'Spieler und Kampfverlauf durch diese Sicherung ersetzen?':'Gesicherten Kampf zum Verlauf hinzufügen?')){if(data.version===2){checkpoint();campaign=data;ensureEnemies(campaign,uid);state=structuredClone(campaign.encounters.find(e=>e.id===campaign.activeId));persist();render();}else{if(campaign.encounters.length>=500)throw Error();mutate(()=>{const imported=makeCampaign(data,uid);campaign.characters.push(...imported.characters);for(const p of imported.encounters[0].people)if(p.kind==='enemy')rememberEnemy(campaign,p,uid);state=structuredClone(imported.encounters[0]);});}toast('Sicherung geladen.');}}catch{toast('Diese Datei ist keine gültige Initiative-Kampfsicherung.');}e.target.value='';};
function info(title,html){$('#info-title').textContent=title;$('#info-content').innerHTML=html;$('#info-dialog').showModal();}$('#help').onclick=()=>info('In einer Minute kampfbereit','<p><b>1. Beteiligte ergänzen.</b> Über ＋ Namen und maximale HP eintragen. Würfelt eure Reihenfolge mit echten Würfeln und sortiert die Karten anschließend selbst. Mehrere gleiche Gegner kannst du auf einmal hinzufügen.</p><p><b>2. Kampf leiten.</b> Die Plätze 1, 2, 3 … zeigen eure selbst festgelegte Reihenfolge. Ziehe am Griff ⠿, um Karten umzusortieren. Mit fokussiertem Griff oder Karte geht das auch über Alt + ↑/↓. Tippe auf das Porträt, um Werte zu bearbeiten. − verursacht Schaden, ＋ heilt um den Betrag dazwischen. „Nächster Zug“ geht weiter; nach dem letzten Beteiligten beginnt die nächste Runde. Figuren mit 0 HP bleiben in der Zugfolge.</p><p><b>3. Kampffeld zeichnen.</b> ✧ glättet Freihandlinien und erkennt grob geschlossene Rechtecke oder Ovale. Mit ▢ und ◯ zeichnest du Räume direkt. Wähle „Gebäude &amp; Anbauten“, um überlappende oder angrenzende Flächen zu verschmelzen. Wähle „Innenräume“, um Zimmer in ein Gebäude zu zeichnen und ihre Innenwände zu behalten. Rechtecke, runde Räume und geschlossene Wandfolgen funktionieren in beiden Modi. Innenräume bleiben einzeln verschiebbar und veränderbar. Wände kannst du ziehen oder mit zwei Klicks setzen; eine geschlossene Wandfolge wird zum Raum. Goldene Punkte zeigen einrastende Enden. ↖ verschiebt Figuren und Formen, ⌫ entfernt Formen.</p><p><b>Zoom:</b> Über ＋ und − oberhalb der Karte änderst du die Ansicht von 25 % bis 400 %. „Zurücksetzen“ zeigt wieder das ganze Feld. Mit dem Hand-Werkzeug (P), mittlerer Maustaste oder gehaltener Leertaste auf der Karte verschiebst du den Ausschnitt. Strg/⌘ + Mausrad zoomt zur Mausposition. Normales Scrollen bewegt die Seite.</p><p><b>Kürzel:</b> V Verschieben · F Freihand · W Wand · R Raum · O Oval · E Entfernen · D Tür · P Ansicht verschieben. Strg/⌘ + Z macht die letzte Änderung rückgängig; Strg/⌘ + Shift + Z stellt sie wieder her. Über ↶ und ↷ am Feld geht das auch per Klick. Form anklicken und goldene Ziehpunkte bewegen, um Räume zu skalieren oder Wandenden zu versetzen. Mit dem Tür-Werkzeug (D) klickst du an eine Wand, um eine Tür einzusetzen. Ein weiterer Klick auf die Tür öffnet oder schließt sie; im Verschieben-Modus gibt es dafür ebenfalls einen Button. Türen lassen sich verschieben, über ihre Endpunkte anpassen und mit anderen Formen gemeinsam auswählen. Mit Shift-Klick oder „Mehrfachauswahl“ markierst du mehrere Formen; auf leerer Fläche ziehst du damit einen Auswahlrahmen. Ohne Shift oder Mehrfachauswahl verschiebst du auf freier Fläche die Ansicht. Goldene Ecken skalieren die ganze Auswahl. „Auswahl löschen“ entfernt sie gemeinsam. Kämpfer lassen sich jederzeit per Drag-and-drop oder mit Alt und Pfeiltasten umsortieren.</p><p>Neue Beteiligte werden hinten angefügt. Über ··· kannst du Werte bearbeiten. Aus der Gegnerliste ziehst du gespeicherte Gegner aufs Feld oder fügst sie über ＋ hinzu. Jede Kopie startet mit vollen HP und hat eigene Werte. Neue Gegner aus dem Beteiligten-Dialog werden automatisch als Vorlage gespeichert. Oben legst du Spieler dauerhaft an und bearbeitest ihre Werte. „Neuer Kampf“ übernimmt ausgewählte Spieler mit aktuellen HP. Im Kampfverlauf öffnest du frühere Kämpfe. „Sichern“ lädt Spieler und alle Kämpfe als Datei herunter.</p>');$('#privacy').onclick=()=>info('Dein Kampf, dein Browser','<p>Deine Spielercharaktere, alle Kämpfe und die Kampffelder werden automatisch <b>nur in diesem Browser</b> gespeichert. Es gibt keine Synchronisation zwischen Geräten oder Spielern.</p><p>Wenn du Browserdaten löschst oder privat surfst, können die Daten verloren gehen. Mit <b>Sichern</b> lädst du deine Spieler und den gesamten Kampfverlauf als Datei herunter und kannst sie später mit <b>Laden</b> wieder öffnen.</p>');document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoAction():undoAction();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redoAction();return;}if((e.key==='Delete'||e.key==='Backspace')&&selectedIds.size){e.preventDefault();deleteSelection();return;}if(e.ctrlKey||e.metaKey||e.altKey)return;const t={v:'select',f:'smart',w:'wall',r:'rect',o:'ellipse',d:'door',p:'pan',e:'erase'}[e.key.toLowerCase()];if(t)setTool(t);});$('.brand').onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});};
function renderCampaign(){renderEnemies();
 $('#hero-count').textContent=campaign.characters.length;
 $('#character-list').innerHTML=campaign.characters.length?campaign.characters.map(c=>{
 const participating=state.people.some(p=>p.characterId===c.id);
 return '<article class="hero-card" data-character="'+escape(c.id)+'"><div class="hero-card-top"><button class="token-edit hero-token" data-hero-action="edit" aria-label="'+escape(c.name)+' Werte bearbeiten'+(state.people.some(p=>p.characterId===c.id&&p.id===state.active)?', am Zug':'')+'" title="Werte bearbeiten">'+tokenMarkup(c,{active:state.people.some(p=>p.characterId===c.id&&p.id===state.active),decorative:true})+'</button><div class="hero-identity"><h3>'+escape(c.name)+'</h3><span>'+escape(c.characterClass||'Abenteurer')+' · Level '+c.level+'</span></div><button class="hero-edit" data-hero-action="edit" aria-label="'+escape(c.name)+' Werte bearbeiten" title="Werte bearbeiten">✎</button></div><div class="hero-stats"><span><b>'+c.hp+'</b> / '+c.max+' HP</span><span>RK <b>'+c.ac+'</b></span></div><div class="hero-hp-track"><span style="width:'+c.hp/c.max*100+'%"></span></div>'+(c.conditions?'<p class="hero-conditions">'+escape(c.conditions)+'</p>':'')+'<button class="hero-join" data-hero-action="join" '+(participating?'disabled':'')+'>'+(participating?'✓ Im aktuellen Kampf':'＋ Zum Kampf hinzufügen')+'</button></article>';
 }).join(''):'<div class="party-empty"><strong>Deine Gruppe wartet auf ihr erstes Abenteuer.</strong><span>Lege Spieler einmal an. HP, Werte und Notizen bleiben für den nächsten Kampf erhalten.</span></div>';
 $('#encounter-count').textContent=campaign.encounters.length;
 $('#encounter-list').innerHTML=[...campaign.encounters].sort((a,b)=>b.savedAt-a.savedAt).map(e=>'<button class="encounter-item '+(e.id===state.id?'current':'')+'" data-encounter="'+escape(e.id)+'"><span><strong>'+escape(e.title)+'</strong><small>'+new Date(e.createdAt).toLocaleDateString('de-DE')+' · Runde '+e.round+' · '+e.people.length+' Beteiligte</small></span><span>'+(e.id===state.id?'Aktuell':'Öffnen →')+'</span></button>').join('');
}
function openCharacter(id=null){
 characterEditId=id;const c=campaign.characters.find(x=>x.id===id);
 $('#character-form').reset();$('#character-dialog-title').textContent=c?'Spieler bearbeiten':'Spieler anlegen';
 $('#c-name').value=c?.name??'';$('#c-class').value=c?.characterClass??'';$('#c-level').value=c?.level??1;
 $('#c-hp').value=c?.hp??20;$('#c-max').value=c?.max??20;$('#c-ac').value=c?.ac??10;
 const participant=state.people.find(p=>p.characterId===id);
 $('#c-conditions').value=c?.conditions??'';$('#c-notes').value=c?.notes??'';
 $('#c-hp').setCustomValidity('');$('#c-name').setCustomValidity('');
 $('#character-actions')?.remove();
 if(c){const actions=document.createElement('div');actions.id='character-actions';actions.className='character-actions';
 if(participant){const leave=document.createElement('button');leave.type='button';leave.className='text-button';leave.textContent='Aus diesem Kampf entfernen';leave.onclick=()=>{mutate(()=>{state.people=state.people.filter(p=>p.characterId!==id);if(!state.people.some(p=>p.id===state.active))state.active=order(state.people)[0]?.id??null;});$('#character-dialog').close();toast('Spieler bleibt in deiner Gruppe gespeichert.');};actions.append(leave);}
 const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Spieler löschen';remove.onclick=()=>{if(!confirm(c.name+' aus deiner Spielergruppe löschen? Im aktuellen Kampf wird die Figur ebenfalls entfernt. Frühere Kämpfe bleiben im Verlauf.'))return;mutate(()=>{campaign.characters=campaign.characters.filter(x=>x.id!==id);state.people=state.people.filter(p=>p.characterId!==id);if(!state.people.some(p=>p.id===state.active))state.active=order(state.people)[0]?.id??null;});$('#character-dialog').close();toast('Spieler gelöscht. Mit Rückgängig wiederherstellen.');};actions.append(remove);$('#character-form').append(actions);}
 $('#character-dialog').showModal();$('#c-name').focus();
}
$('#new-character').onclick=()=>openCharacter();
$('#character-form').onsubmit=e=>{
 e.preventDefault();const name=$('#c-name').value.trim();if(!name){$('#c-name').setCustomValidity('Bitte einen Namen eingeben.');$('#c-name').reportValidity();return;}
 const hp=+$('#c-hp').value,max=+$('#c-max').value;if(hp>max){$('#c-hp').setCustomValidity('Aktuelle HP dürfen nicht höher als maximale HP sein.');$('#c-hp').reportValidity();return;}
 if(!characterEditId&&campaign.characters.length>=500){toast('Maximal 500 Spielercharaktere.');return;}
 const values={name,hp,max,characterClass:$('#c-class').value.trim(),level:+$('#c-level').value,ac:+$('#c-ac').value,initMod:campaign.characters.find(c=>c.id===characterEditId)?.initMod??0,conditions:$('#c-conditions').value.trim(),notes:$('#c-notes').value.trim()};
 mutate(()=>{if(characterEditId){updateCharacter(campaign,state,characterEditId,values);}else campaign.characters.push({id:uid(),...values});});
 $('#character-dialog').close();toast('Spielercharakter gespeichert.');
};
$('#c-name').oninput=()=>$('#c-name').setCustomValidity('');
$('#c-hp').oninput=$('#c-max').oninput=()=>$('#c-hp').setCustomValidity('');
$('#character-list').onclick=e=>{
 const b=e.target.closest('[data-hero-action]');if(!b)return;
 const id=b.closest('[data-character]').dataset.character;
 if(b.dataset.heroAction==='edit'){openCharacter(id);return;}
 if(state.people.length>=100){toast('Maximal 100 Beteiligte pro Kampf.');return;}
 const c=campaign.characters.find(x=>x.id===id);
 mutate(()=>{addToEncounter(state,c,uid());if(!state.started||!state.active)state.active=order(state.people)[0]?.id??null;state.demo=false;});
 toast(c.name+' nimmt am Kampf teil.');
};
function openNewEncounter(){
 if(campaign.encounters.length>=500){toast('Maximal 500 Kämpfe. Bitte die Kampagne sichern.');return;}
 $('#battle-name').value='';
 $('#battle-heroes').innerHTML=campaign.characters.map(c=>'<label><input type="checkbox" value="'+escape(c.id)+'" checked><span><strong>'+escape(c.name)+'</strong><small>'+c.hp+' / '+c.max+' HP · '+escape(c.characterClass||'Abenteurer')+'</small></span></label>').join('')||'<p>Noch keine Spieler angelegt. Du kannst sie später hinzufügen.</p>';
 $('#encounter-dialog').showModal();$('#battle-name').focus();
}
$('#encounter-form').onsubmit=e=>{
 e.preventDefault();const ids=[...document.querySelectorAll('#battle-heroes input:checked')].map(x=>x.value);
 if(ids.length>100){toast('Wähle höchstens 100 Beteiligte.');return;}
 mutate(()=>{saveEncounter(campaign,state);state=beginEncounter(campaign,$('#battle-name').value,ids,uid);});
 $('#encounter-dialog').close();toast('Neuer Kampf gestartet. Der vorherige bleibt im Verlauf.');
};
$('#encounter-list').onclick=e=>{
 const b=e.target.closest('[data-encounter]');if(!b||b.dataset.encounter===state.id)return;
 checkpoint();saveEncounter(campaign,state);state=structuredClone(campaign.encounters.find(x=>x.id===b.dataset.encounter));campaign.activeId=state.id;
 persist();render();toast('Kampf wieder geöffnet · Runde '+state.round);
};


function clearSelection(){selectedShapeId=null;selectedIds.clear();}
function selectedShapes(){return state.shapes.filter(s=>selectedIds.has(s.id));}
function replaceSelection(shapes){const changed=new Map(shapes.map(s=>[s.id,s]));state.shapes=state.shapes.map(s=>changed.get(s.id)||s);}
function deleteSelection(){if(gesture||!selectedIds.size)return;const ids=new Set(selectedIds);mutate(()=>{state.shapes=state.shapes.filter(s=>!ids.has(s.id));clearSelection();});toast(ids.size+' Formen entfernt · mit Rückgängig wiederherstellen.');}
$('#multi-select').onclick=()=>{setTool('select');multiSelect=!multiSelect;renderMap();};
$('#delete-selection').onclick=deleteSelection;$('#toggle-door').onclick=()=>{const door=selectedShapes()[0];if(door?.type==='door')mutate(()=>door.open=!door.open);};
function renderHandles(){
 selectedIds=new Set([...selectedIds].filter(id=>state.shapes.some(s=>s.id===id)));
 selectedShapeId=selectedIds.size===1?[...selectedIds][0]:null;
 $('#multi-select').setAttribute('aria-pressed',String(multiSelect));
 $('#delete-selection').disabled=!selectedIds.size;
 $('#selection-count').textContent=selectedIds.size?selectedIds.size+' markiert':'';const door=selectedShapes().length===1&&selectedShapes()[0].type==='door'?selectedShapes()[0]:null;$('#toggle-door').hidden=!door;$('#toggle-door').textContent=door?.open?'Tür schließen':'Tür öffnen';
 const layer=$('#handles');layer.replaceChildren();const shapes=selectedShapes();
 if(!shapes.length||tool!=='select')return;
 const b=selectionBounds(shapes),group=shapes.length>1;
 if(group)layer.append(svgEl('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:'none',stroke:'#b49a55','stroke-width':2,'stroke-dasharray':'7 5','pointer-events':'none'}));
 const points=group?[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}]:shapeHandles(shapes[0]);
 points.forEach((p,i)=>{const g=svgEl('g',{'data-handle':i,tabindex:0,role:'button','aria-label':'Ziehpunkt '+(i+1)+': '+(group?'Auswahl skalieren':'Form verändern')});
 g.append(svgEl('circle',{cx:p.x,cy:p.y,r:17,fill:'transparent',stroke:'none'}),svgEl('circle',{cx:p.x,cy:p.y,r:7,fill:'#fff8de',stroke:'#b49a55','stroke-width':2.5}));layer.append(g);});
}
function sortParticipants(source,target,after){
 reorderCombatants(state.people,source,target,after);if(state.started===false)state.active=order(state.people)[0]?.id??null;
}
function movePerson(id,direction){
 const sorted=order(state.people),index=sorted.findIndex(p=>p.id===id),target=sorted[index+direction];if(!target)return;
 mutate(()=>sortParticipants(id,target.id,direction>0));
 $('[data-person="'+id+'"]')?.focus();
}
// The last interacted card is distinct from the combatant whose turn it is.
function markSelectedCombatant(){
 if(!state.people.some(p=>p.id===selectedCombatantId))selectedCombatantId=null;
 $('#combatant-list').querySelectorAll('[data-person]').forEach(card=>{const selected=card.dataset.person===selectedCombatantId;card.classList.toggle('selected-combatant',selected);if(selected)card.setAttribute('aria-description','Zuletzt ausgewählt.');else card.removeAttribute('aria-description');});
}
function selectCombatant(id){selectedCombatantId=id;markSelectedCombatant();}
$('#combatant-list').addEventListener('pointerdown',e=>{const card=e.target.closest('[data-person]');if(card&&e.button===0)selectCombatant(card.dataset.person);});
$('#combatant-list').addEventListener('focusin',e=>{const card=e.target.closest('[data-person]');if(card)selectCombatant(card.dataset.person);});
// Preview only changes the list's visual order; save one change on drop.
let orderPointer=null,orderDragFromControl=false,orderPreview=null;
function beginOrderPreview(id,pointer){
 const list=$('#combatant-list'),cards=[...list.querySelectorAll('[data-person]')],source=cards.find(c=>c.dataset.person===id);
 orderPreview={id,cards,original:cards.map(c=>c.dataset.person),ids:cards.map(c=>c.dataset.person),pointer,ghost:null,frame:null};
 if(pointer){const r=source.getBoundingClientRect(),overlay=document.createElement('div');overlay.className='workspace order-drag-overlay';overlay.setAttribute('aria-hidden','true');overlay.inert=true;Object.assign(overlay.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px'});const copy=source.cloneNode(true);copy.removeAttribute('data-person');copy.removeAttribute('tabindex');copy.draggable=false;overlay.append(copy);document.body.append(overlay);orderPreview.ghost=overlay;orderPreview.offsetY=pointer.y-r.top;}
 source.classList.add(pointer?'order-placeholder':'native-order-placeholder');list.classList.add('order-preview');
}
function previewOrderAt(x,y){
 const p=orderPreview;if(!p)return;const list=$('#combatant-list'),bounds=list.getBoundingClientRect();
 p.point={x,y};if(p.ghost)p.ghost.style.top=(y-p.offsetY)+'px';
 if(x<bounds.left-25||x>bounds.right+25)return;
 const others=p.cards.filter(c=>c.dataset.person!==p.id);
 // Layout offsets ignore the short visual animations used for the other cards.
 const columns=getComputedStyle(list).gridTemplateColumns.trim().split(/\s+/).length;
 let index=others.findIndex(c=>{const r=c.getBoundingClientRect(),top=bounds.top+c.offsetTop-list.scrollTop;return columns>1?(y<top||(y<top+r.height&&x<r.left+r.width/2)):y<top+r.height/2;});if(index<0)index=others.length;
 const ids=others.map(c=>c.dataset.person);ids.splice(index,0,p.id);if(ids.join('|')===p.ids.join('|'))return;
 const old=new Map(p.cards.map(c=>[c,c.getBoundingClientRect()]));p.cards.forEach(c=>c.getAnimations().forEach(a=>a.cancel()));
 p.ids=ids;if(p.ghost)p.ghost.querySelector('.initiative-number strong').textContent=ids.indexOf(p.id)+1;p.cards.forEach(c=>{c.style.order=ids.indexOf(c.dataset.person);c.querySelector('.initiative-number strong').textContent=ids.indexOf(c.dataset.person)+1;});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)p.cards.filter(c=>c.dataset.person!==p.id).forEach(c=>{const before=old.get(c),after=c.getBoundingClientRect();if(before.top!==after.top||before.left!==after.left)c.animate([{transform:`translate(${before.left-after.left}px,${before.top-after.top}px)`},{transform:'translate(0,0)'}],{duration:140,easing:'ease-out'});});
}
function scrollOrderPreview(){
 const p=orderPreview;if(!p?.pointer)return;const list=$('#combatant-list'),r=list.getBoundingClientRect(),point=p.point;
 if(point&&point.x>=r.left-25&&point.x<=r.right+25){const delta=point.y<r.top+35?-8:point.y>r.bottom-35?8:0;if(delta){const before=list.scrollTop;list.scrollTop+=delta;if(list.scrollTop!==before)previewOrderAt(point.x,point.y);}}
 p.frame=requestAnimationFrame(scrollOrderPreview);
}
function finishOrderPreview(commit){
 const p=orderPreview;if(!p)return;orderPreview=null;cancelAnimationFrame(p.frame);p.ghost?.remove();$('#combatant-list').classList.remove('order-preview');
 p.cards.forEach(c=>{c.getAnimations().forEach(a=>a.cancel());c.style.removeProperty('order');c.classList.remove('order-placeholder','native-order-placeholder');c.querySelector('.initiative-number strong').textContent=p.original.indexOf(c.dataset.person)+1;});
 if(commit&&p.ids.join('|')!==p.original.join('|')){const index=p.ids.indexOf(p.id),next=p.ids[index+1],previous=p.ids[index-1];mutate(()=>sortParticipants(p.id,next||previous,!next));toast('Kampfreihenfolge angepasst.');}
}
$('#combatant-list').addEventListener('pointerdown',e=>{
 orderDragFromControl=!!e.target.closest('button,input,select,textarea,a')&&!e.target.closest('.turn-drag-handle');
 if(e.button!==0||!e.target.closest('.turn-drag-handle'))return;
 e.preventDefault();e.target.closest('.turn-drag-handle').focus({preventScroll:true});const card=e.target.closest('[data-person]');orderPointer={id:card.dataset.person,startY:e.clientY,pointerId:e.pointerId,moved:false};
 $('#combatant-list').setPointerCapture(e.pointerId);
});
$('#combatant-list').addEventListener('pointermove',e=>{
 if(!orderPointer||orderPointer.pointerId!==e.pointerId)return;
 if(Math.abs(e.clientY-orderPointer.startY)<5&&!orderPointer.moved)return;
 if(!orderPointer.moved){orderPointer.moved=true;beginOrderPreview(orderPointer.id,{x:e.clientX,y:orderPointer.startY});scrollOrderPreview();}
 previewOrderAt(e.clientX,e.clientY);
});
function finishOrderPointer(e,cancel=false){
 if(!orderPointer||orderPointer.pointerId!==e.pointerId)return;orderPointer=null;
 const r=$('#combatant-list').getBoundingClientRect(),inside=e.clientX>=r.left-25&&e.clientX<=r.right+25&&e.clientY>=r.top-35&&e.clientY<=r.bottom+35;
 finishOrderPreview(!cancel&&inside);if($('#combatant-list').hasPointerCapture(e.pointerId))$('#combatant-list').releasePointerCapture(e.pointerId);
}
$('#combatant-list').addEventListener('pointerup',e=>finishOrderPointer(e));
$('#combatant-list').addEventListener('pointercancel',e=>finishOrderPointer(e,true));
$('#combatant-list').addEventListener('lostpointercapture',()=>{if(orderPointer){orderPointer=null;finishOrderPreview(false);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(orderPointer||orderPreview)){e.preventDefault();orderPointer=null;draggedPerson=null;finishOrderPreview(false);}});
window.addEventListener('blur',()=>{orderPointer=null;draggedPerson=null;finishOrderPreview(false);});
$('#combatant-list').ondragstart=e=>{
 if(orderPointer||orderDragFromControl){e.preventDefault();return;}
 const card=e.target.closest('[data-person]');if(!card){e.preventDefault();return;}
 draggedPerson=card.dataset.person;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',draggedPerson);beginOrderPreview(draggedPerson,null);
};
$('#combatant-list').ondragover=e=>{if(!draggedPerson)return;e.preventDefault();e.dataTransfer.dropEffect='move';previewOrderAt(e.clientX,e.clientY);};
$('#combatant-list').ondrop=e=>{if(!draggedPerson)return;e.preventDefault();previewOrderAt(e.clientX,e.clientY);draggedPerson=null;finishOrderPreview(true);};
$('#combatant-list').ondragend=()=>{draggedPerson=null;finishOrderPreview(false);};
$('#combatant-list').addEventListener('keydown',e=>{if(orderPreview||!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key)||(e.target.closest('input,button')&&!e.target.closest('.turn-drag-handle')))return;const card=e.target.closest('[data-person]');if(!card)return;e.preventDefault();movePerson(card.dataset.person,e.key==='ArrowUp'?-1:1);});


function renderEnemies(){
 const q=$('#enemy-search').value.trim().toLocaleLowerCase('de'),enemies=campaign.enemies.filter(e=>e.name.toLocaleLowerCase('de').includes(q));
 $('#enemy-library-count').textContent=campaign.enemies.length;
 $('#enemy-library-list').innerHTML=enemies.length?enemies.map(e=>'<article class="enemy-template" draggable="true" data-enemy-template="'+escape(e.id)+'" tabindex="0" aria-label="'+escape(e.name)+' · aus Gegnerliste aufs Feld ziehen"><div><strong>'+escape(e.name)+'</strong><small>'+e.max+' HP'+'</small></div><button type="button" data-enemy-action="add" aria-label="'+escape(e.name)+' zum Kampf hinzufügen">'+icon('add')+'</button><button type="button" data-enemy-action="edit" aria-label="'+escape(e.name)+' Vorlage bearbeiten">✎</button><button type="button" data-enemy-action="delete" aria-label="'+escape(e.name)+' Vorlage entfernen">'+icon('delete')+'</button></article>').join(''):'<p class="form-note">'+(campaign.enemies.length?'Keine passenden Gegner.':'Lege einen Gegner an – er wird automatisch hier gespeichert.')+'</p>';
}
function addEnemy(id,point=null){
 const enemy=campaign.enemies.find(e=>e.id===id);if(!enemy)return;
 if(state.people.length>=100){toast('Maximal 100 Beteiligte pro Kampf.');return;}
 mutate(()=>spawnEnemy(state,enemy,uid(),point));toast(enemy.name+' mit vollen HP hinzugefügt.');
}
function openEnemyTemplate(id=null){
 enemyEditId=id;const enemy=campaign.enemies.find(e=>e.id===id);$('#enemy-template-form').reset();$('#enemy-template-title').textContent=enemy?'Gegnervorlage bearbeiten':'Gegner speichern';$('#enemy-name').value=enemy?.name??'';$('#enemy-max').value=enemy?.max??12;$('#enemy-template-dialog').showModal();
}
$('#new-enemy-template').onclick=()=>openEnemyTemplate();
$('#enemy-search').oninput=renderEnemies;
$('#enemy-library-list').onclick=e=>{
 const button=e.target.closest('[data-enemy-action]'),card=e.target.closest('[data-enemy-template]');if(!button||!card)return;
 const id=card.dataset.enemyTemplate,action=button.dataset.enemyAction;
 if(action==='add')addEnemy(id);
 else if(action==='edit')openEnemyTemplate(id);
 else if(action==='delete'&&confirm('Vorlage aus der Gegnerliste entfernen? Bereits platzierte Gegner bleiben im Kampf.'))mutate(()=>campaign.enemies=campaign.enemies.filter(e=>e.id!==id));
};
$('#enemy-library-list').ondragstart=e=>{
 const card=e.target.closest('[data-enemy-template]');if(!card){e.preventDefault();return;}draggedEnemy=card.dataset.enemyTemplate;e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-mini-mind-enemy',draggedEnemy);e.dataTransfer.setData('text/plain',card.querySelector('strong').textContent);
};
$('#enemy-library-list').ondragend=()=>draggedEnemy=null;
$('#enemy-library-list').onkeydown=e=>{if(e.key==='Enter'&&e.target.matches('[data-enemy-template]')){e.preventDefault();addEnemy(e.target.dataset.enemyTemplate);}};
$('#enemy-template-form').onsubmit=e=>{
 e.preventDefault();const values={id:enemyEditId||uid(),name:$('#enemy-name').value.trim(),max:+$('#enemy-max').value,init:campaign.enemies.find(e=>e.id===enemyEditId)?.init??0};
 if(!validEnemy(values)){toast('Bitte gültige Gegnerwerte eingeben.');return;}
 if(!enemyEditId&&campaign.enemies.length>=500){toast('Maximal 500 Gegnervorlagen.');return;}
 mutate(()=>{if(enemyEditId){const i=campaign.enemies.findIndex(e=>e.id===enemyEditId);if(i>=0)campaign.enemies[i]=values;}else rememberEnemy(campaign,values,()=>values.id);});
 $('#enemy-template-dialog').close();toast('Gegnervorlage gespeichert.');
};

renderView();render();setTool('select');if(!storageBroken)persist();if(storageBroken)toast('Gespeicherter Stand konnte nicht geladen werden. Beispiel geöffnet.');

new ResizeObserver(()=>renderMap()).observe($('#map'));
