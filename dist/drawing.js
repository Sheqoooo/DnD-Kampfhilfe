
const EPS=1e-6;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const key=p=>p.x.toFixed(5)+','+p.y.toFixed(5);
export function roomRings(s){
 if(s.type==='room')return s.rings;
 if(s.type==='rect')return [[{x:s.x,y:s.y},{x:s.x+s.w,y:s.y},{x:s.x+s.w,y:s.y+s.h},{x:s.x,y:s.y+s.h}]];
 if(s.type==='ellipse')return [Array.from({length:64},(_,i)=>({x:s.x+s.w/2+Math.cos(i*Math.PI/32)*s.w/2,y:s.y+s.h/2+Math.sin(i*Math.PI/32)*s.h/2}))];
 return null;
}
function edges(rings){return rings.flatMap(r=>r.map((a,i)=>({a,b:r[(i+1)%r.length]})));}
function inside(p,rings){let yes=false;for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function project(p,a,b){const v=sub(b,a),l=v.x*v.x+v.y*v.y;const t=l?Math.max(0,Math.min(1,((p.x-a.x)*v.x+(p.y-a.y)*v.y)/l)):0;return lerp(a,b,t);}
function params(e,f){
 const r=sub(e.b,e.a),s=sub(f.b,f.a),v=sub(f.a,e.a),den=cross(r,s);
 if(Math.abs(den)>EPS){const t=cross(v,s)/den,u=cross(v,r)/den;return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?[Math.max(0,Math.min(1,t))]:[];}
 if(Math.abs(cross(v,r))>EPS)return [];
 const l=r.x*r.x+r.y*r.y;if(l<EPS)return [];
 return [f.a,f.b].map(p=>((p.x-e.a.x)*r.x+(p.y-e.a.y)*r.y)/l).filter(t=>t>=-EPS&&t<=1+EPS).map(t=>Math.max(0,Math.min(1,t)));
}
export function snapDrawingPoint(p,shapes,grid=true,connect=true,tolerance=22){
 if(connect){const vertices=[],segments=[];
 for(const s of shapes){const rings=roomRings(s);if(rings){vertices.push(...rings.flat());segments.push(...edges(rings));}else if(s.points){vertices.push(s.points[0],s.points.at(-1));for(let i=1;i<s.points.length;i++)segments.push({a:s.points[i-1],b:s.points[i]});}}
 let closest=null,d=tolerance;for(const q of vertices){const n=dist(p,q);if(n<=d){closest=q;d=n;}}if(closest)return{...closest,attached:true};
 d=tolerance;for(const e of segments){const q=project(p,e.a,e.b),n=dist(p,q);if(n<d){closest=q;d=n;}}if(closest)return{...closest,attached:true};
 }
 return{x:Math.max(0,Math.min(1000,grid?Math.round(p.x/50)*50:p.x)),y:Math.max(0,Math.min(700,grid?Math.round(p.y/50)*50:p.y)),attached:false};
}
function overlap(a,b){
 const ap=a.flat(),bp=b.flat();if(Math.max(...ap.map(p=>p.x))<Math.min(...bp.map(p=>p.x))-EPS||Math.max(...bp.map(p=>p.x))<Math.min(...ap.map(p=>p.x))-EPS||Math.max(...ap.map(p=>p.y))<Math.min(...bp.map(p=>p.y))-EPS||Math.max(...bp.map(p=>p.y))<Math.min(...ap.map(p=>p.y))-EPS)return false;
 const ea=edges(a),eb=edges(b);
 for(const p of a.flat())if(inside(p,b)&&!eb.some(e=>dist(p,project(p,e.a,e.b))<EPS))return true;
 for(const p of b.flat())if(inside(p,a)&&!ea.some(e=>dist(p,project(p,e.a,e.b))<EPS))return true;
 for(const e of ea)for(const f of eb){const ts=params(e,f);if(!ts.length)continue;
 const r=sub(e.b,e.a),s=sub(f.b,f.a),den=cross(r,s);
 if(Math.abs(den)>EPS){const t=ts[0],u=cross(sub(f.a,e.a),r)/den;if(t>EPS&&t<1-EPS&&u>EPS&&u<1-EPS)return true;}
 else if(Math.abs(cross(sub(f.a,e.a),r))<EPS){const l=r.x*r.x+r.y*r.y;const t1=((f.a.x-e.a.x)*r.x+(f.a.y-e.a.y)*r.y)/l,t2=((f.b.x-e.a.x)*r.x+(f.b.y-e.a.y)*r.y)/l;if(Math.min(1,Math.max(t1,t2))-Math.max(0,Math.min(t1,t2))>EPS)return true;}
 }
 return false;
}
export function unionRooms(shapes){
 const groups=shapes.map(roomRings),all=groups.flatMap(edges),boundary=new Map();
 for(let i=0;i<all.length;i++){
 const e=all[i],cuts=[0,1];for(let j=0;j<all.length;j++)if(i!==j)cuts.push(...params(e,all[j]));
 const ts=[...new Set(cuts.map(t=>Math.round(t*1e9)/1e9))].sort((a,b)=>a-b);
 for(let j=1;j<ts.length;j++){let a=lerp(e.a,e.b,ts[j-1]),b=lerp(e.a,e.b,ts[j]);const v=sub(b,a),l=dist(a,b);if(l<EPS)continue;
 const m=lerp(a,b,.5),n={x:-v.y/l*.0001,y:v.x/l*.0001};
 const left=groups.some(g=>inside({x:m.x+n.x,y:m.y+n.y},g)),right=groups.some(g=>inside({x:m.x-n.x,y:m.y-n.y},g));
 if(left===right)continue;if(!left)[a,b]=[b,a];boundary.set(key(a)+'>'+key(b),{a,b});
 }}
 const remaining=[...boundary.values()],rings=[];
 while(remaining.length){const first=remaining.shift(),ring=[first.a],start=key(first.a);let end=first.b,guard=0;
 while(key(end)!==start&&guard++<all.length*4+100){ring.push(end);const candidates=remaining.map((e,i)=>({e,i})).filter(({e})=>key(e.a)===key(end));if(!candidates.length)throw Error('Raumgrenze konnte nicht verbunden werden');
 const previous=ring.at(-2)||first.a,vin=sub(end,previous);
 candidates.sort((a,b)=>{const turn=e=>{const v=sub(e.b,e.a);let angle=Math.atan2(cross(vin,v),vin.x*v.x+vin.y*v.y);return angle;};return turn(b.e)-turn(a.e);});
 const next=remaining.splice(candidates[0].i,1)[0];end=next.b;
 }
 if(key(end)!==start)throw Error('Raumgrenze ist offen');
 const clean=ring.filter((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length];return Math.abs(cross(sub(p,a),sub(b,p)))>EPS;});
 if(clean.length>=3)rings.push(clean);
 }
 if(!rings.length||rings.flat().length>2000)throw Error('Raum ist zu komplex');
 return {type:'room',rings};
}
function mergeConnected(shapes,newRoom){
 let current=newRoom,removed=[],rest=[...shapes],changed=true;
 while(changed){changed=false;for(let i=0;i<rest.length;i++){const r=roomRings(rest[i]);if(!r||!overlap(roomRings(current),r))continue;
 const merged=unionRooms([current,rest[i]]);current={...merged,id:newRoom.id};removed.push(rest[i]);rest.splice(i,1);changed=true;break;}}
 return{shapes:[...rest,current],merged:removed.length};
}
function closeWalls(shapes,newWall,idFactory){
 const walls=shapes.filter(s=>s.type==='wall'&&s.points.length===2),others=shapes.filter(s=>!walls.includes(s)),split=[];
 for(const w of walls){const cuts=[w.points[0],w.points[1]];for(const p of newWall.points){const q=project(p,...w.points);if(dist(p,q)<.001&&dist(p,w.points[0])>.001&&dist(p,w.points[1])>.001)cuts.push({...p});}
 cuts.sort((a,b)=>dist(a,w.points[0])-dist(b,w.points[0]));for(let i=1;i<cuts.length;i++)if(dist(cuts[i-1],cuts[i])>.001)split.push({id:i===1?w.id:idFactory(),type:'wall',points:[cuts[i-1],cuts[i]]});}
 const [start,end]=newWall.points;
 if(split.some(w=>(dist(w.points[0],start)<.001&&dist(w.points[1],end)<.001)||(dist(w.points[1],start)<.001&&dist(w.points[0],end)<.001)))return{shapes:[...others,...split],closed:false,duplicate:true};
 const queue=[{p:start,points:[start],used:[]}],visited=new Set([key(start)]);let found=null;
 while(queue.length){const item=queue.shift();if(dist(item.p,end)<.001){found=item;break;}
 for(const w of split){let next=dist(w.points[0],item.p)<.001?w.points[1]:dist(w.points[1],item.p)<.001?w.points[0]:null;if(!next||visited.has(key(next)))continue;visited.add(key(next));queue.push({p:next,points:[...item.points,next],used:[...item.used,w.id]});}}
 if(found&&found.points.length>=3){const area=Math.abs(found.points.reduce((s,p,i)=>s+cross(p,found.points[(i+1)%found.points.length]),0))/2;
 if(area>20){const room={id:newWall.id,type:'room',rings:[found.points]};return{shapes:[...others,...split.filter(w=>!found.used.includes(w.id))],room,closed:true};}}
 return{shapes:[...others,...split,newWall],closed:false};
}
export function integrateShape(shapes,shape,{connect=true,idFactory=()=>crypto.randomUUID()}={}){
 if(!connect)return{shapes:[...shapes,shape],merged:0,closed:false};
 if(roomRings(shape))return{...mergeConnected(shapes,shape),closed:false};
 if(shape.type==='wall'&&shape.points.length===2){const wall=closeWalls(shapes,shape,idFactory);if(wall.room)return{...mergeConnected(wall.shapes,wall.room),closed:true};return{...wall,merged:0};}
 return{shapes:[...shapes,shape],merged:0,closed:false};
}

export function translateShape(shape,dx,dy){
 const s=structuredClone(shape),points=roomRings(s)?.flat()??s.points;
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 dx=Math.max(-minX,Math.min(1000-maxX,dx));dy=Math.max(-minY,Math.min(700-maxY,dy));
 if(s.rings)s.rings=s.rings.map(r=>r.map(p=>({x:p.x+dx,y:p.y+dy})));
 else if(s.points)s.points=s.points.map(p=>({x:p.x+dx,y:p.y+dy}));
 else{s.x+=dx;s.y+=dy;}return s;
}
