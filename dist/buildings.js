import{roomRings,unionRooms}from'./drawing.js?v=manual-order-1';
import{inWorld}from'./world.js?v=expanded-grid-1';
const GRID=50,MIN=100,eps=.001;
const area=r=>r.reduce((n,p,i)=>n+p.x*r[(i+1)%r.length].y-r[(i+1)%r.length].x*p.y,0)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const inside=(p,rings)=>{let yes=false;for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
const line=(a,b)=>({type:'wall',points:[a,b]});
const door=(a,b)=>{const l=Math.hypot(b.x-a.x,b.y-a.y),x=(a.x+b.x)/2,y=(a.y+b.y)/2,dx=(b.x-a.x)/l*25,dy=(b.y-a.y)/l*25;return{type:'door',open:false,points:[{x:x-dx,y:y-dy},{x:x+dx,y:y+dy}]};};
export function houseBounds(a,b){return{x:Math.round(Math.min(a.x,b.x)/GRID)*GRID,y:Math.round(Math.min(a.y,b.y)/GRID)*GRID,w:Math.round(Math.abs(b.x-a.x)/GRID)*GRID,h:Math.round(Math.abs(b.y-a.y)/GRID)*GRID};}
// Split grid-aligned regions, then connect the resulting adjacency graph.
// Choosing doors after partitioning avoids doors ending at T junctions.
export function generateHouse(bounds,count=4,entrance='south',random=Math.random){
 const b={...bounds,type:'rect'};
 if(![b.x,b.y,b.w,b.h].every(Number.isFinite)||![b.x,b.y,b.w,b.h].every(v=>v%GRID===0)||b.w<MIN||b.h<MIN||!inWorld(b)||!inWorld({x:b.x+b.w,y:b.y+b.h}))throw Error('Die Grundfläche muss mindestens 2 × 2 Rasterfelder groß sein.');
 if(!Number.isInteger(count)||count<1||count>12)throw Error('Bitte 1 bis 12 Räume wählen.');
 if(!['north','east','south','west'].includes(entrance))throw Error('Bitte eine Eingangsseite wählen.');
 if(Math.floor(b.w/MIN)*Math.floor(b.h/MIN)<count)throw Error('Für diese Raumanzahl ist die Fläche zu klein. Größer zeichnen oder weniger Räume wählen.');
 const rooms=[{...bounds}],walls=[];
 while(rooms.length<count){
  const candidates=rooms.filter(r=>r.w>=MIN*2||r.h>=MIN*2).sort((a,b)=>b.w*b.h-a.w*a.h),r=candidates[0];
  if(!r)throw Error('Nicht genug Platz für weitere Räume.');
  const vertical=r.w>=MIN*2&&(r.h<MIN*2||r.w>r.h||r.w===r.h&&random()<.5),size=vertical?r.w:r.h;
  // Even multiples of MIN retain enough capacity for the requested room count.
  const choices=Math.floor(size/MIN)-1,offset=MIN*(1+Math.floor(clamp(random(),0,.999999)*choices));
  let a,c;if(vertical){a={...r,w:offset};c={...r,x:r.x+offset,w:r.w-offset};walls.push(line({x:c.x,y:r.y},{x:c.x,y:r.y+r.h}));}
  else{a={...r,h:offset};c={...r,y:r.y+offset,h:r.h-offset};walls.push(line({x:r.x,y:c.y},{x:r.x+r.w,y:c.y}));}
  rooms.splice(rooms.indexOf(r),1,a,c);
 }
 const links=[];
 for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){
  const a=rooms[i],b=rooms[j],top=Math.max(a.y,b.y),bottom=Math.min(a.y+a.h,b.y+b.h),left=Math.max(a.x,b.x),right=Math.min(a.x+a.w,b.x+b.w);
  if(bottom-top>=MIN&&(a.x+a.w===b.x||b.x+b.w===a.x)){const x=a.x+a.w===b.x?b.x:a.x;links.push({i,j,a:{x,y:top},b:{x,y:bottom}});}
  if(right-left>=MIN&&(a.y+a.h===b.y||b.y+b.h===a.y)){const y=a.y+a.h===b.y?b.y:a.y;links.push({i,j,a:{x:left,y},b:{x:right,y}});}
 }
 const visited=new Set([0]),doors=[];
 while(visited.size<rooms.length){const link=links.find(l=>visited.has(l.i)!==visited.has(l.j));if(!link)throw Error('Räume konnten nicht verbunden werden.');doors.push(door(link.a,link.b));visited.add(link.i);visited.add(link.j);}
 const outside=rooms.filter(r=>entrance==='north'?r.y===b.y:entrance==='south'?r.y+r.h===b.y+b.h:entrance==='west'?r.x===b.x:r.x+r.w===b.x+b.w).sort((a,b)=>b.w*b.h-a.w*a.h)[0];
 if(entrance==='north'||entrance==='south'){const y=entrance==='north'?b.y:b.y+b.h;doors.push(door({x:outside.x,y},{x:outside.x+outside.w,y}));}
 else{const x=entrance==='west'?b.x:b.x+b.w;doors.push(door({x,y:outside.y},{x,y:outside.y+outside.h}));}
 return{rooms,shapes:[b,...walls,...doors]};
}
function clipToRect(r,b){
 let out=r;for(const [axis,value,sign]of[['x',b.x,1],['x',b.x+b.w,-1],['y',b.y,1],['y',b.y+b.h,-1]]){
 const input=out;out=[];for(let i=0;i<input.length;i++){const a=input[i],c=input[(i+1)%input.length],ia=(a[axis]-value)*sign>=0,ic=(c[axis]-value)*sign>=0;if(ia)out.push(a);if(ia!==ic){const t=(value-a[axis])/(c[axis]-a[axis]);out.push({x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t});}}}
 return out;
}
export function overlapsBuilding(rect,shapes){return shapes.some(s=>{if(s.interior)return false;const rings=roomRings(s);if(!rings)return false;const total=rings.reduce((n,r)=>n+area(clipToRect(r,rect)),0);return Math.abs(total)>eps;});}
export function annexEdges(shape){
 if(shape.interior||shape.type==='ellipse')return[];const rings=roomRings(shape);if(!rings)return[];
 const outer=[...rings].sort((a,b)=>Math.abs(area(b))-Math.abs(area(a)))[0];
 return outer.map((a,i)=>{const b=outer[(i+1)%outer.length],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<MIN||Math.abs(b.x-a.x)>eps&&Math.abs(b.y-a.y)>eps)return null;
 const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};let normal={x:-(b.y-a.y)/length,y:(b.x-a.x)/length};if(inside({x:center.x+normal.x,y:center.y+normal.y},rings))normal={x:-normal.x,y:-normal.y};
 return{a,b,center,normal,length};}).filter(Boolean);
}
export function annexRect(edge,point=null){
 const {center:c,normal:n}=edge,t={x:-n.y,y:n.x};
 const depth=point?Math.max(MIN,Math.round(((point.x-c.x)*n.x+(point.y-c.y)*n.y)/GRID)*GRID):200;
 const width=Math.min(Math.floor(edge.length/GRID)*GRID,point?Math.max(MIN,200+Math.round(Math.abs((point.x-c.x)*t.x+(point.y-c.y)*t.y)/GRID)*GRID*2):200);
 const a={x:c.x+t.x*width/2,y:c.y+t.y*width/2},b={x:c.x-t.x*width/2,y:c.y-t.y*width/2};
 return{type:'rect',x:Math.min(a.x,b.x,a.x+n.x*depth,b.x+n.x*depth),y:Math.min(a.y,b.y,a.y+n.y*depth,b.y+n.y*depth),w:n.x?depth:width,h:n.y?depth:width};
}
export function attachAnnex(shapes,parentId,edge,rect,{open=false,idFactory=()=>crypto.randomUUID()}={}){
 const parent=shapes.find(s=>s.id===parentId);if(!parent||!annexEdges(parent).some(e=>JSON.stringify(e)===JSON.stringify(edge)))throw Error('Bitte eine freie Außenwand wählen.');
 if(!inWorld(rect)||!inWorld({x:rect.x+rect.w,y:rect.y+rect.h}))throw Error('Der Anbau liegt außerhalb der Karte.');
 if(overlapsBuilding(rect,shapes))throw Error('Hier ist bereits ein Gebäude. Wähle eine freie Wand oder einen kleineren Anbau.');
 const merged={...unionRooms([parent,rect]),id:parentId},n=edge.normal,c=edge.center,width=n.x?rect.h:rect.w;
 const a={x:c.x-n.y*width/2,y:c.y+n.x*width/2},b={x:c.x+n.y*width/2,y:c.y-n.x*width/2};
 // Preserve the previous exterior as an interior partition, including any existing door.
 const wall={...line(a,b),id:idFactory(),interior:true},entry=door(a,b),mid=s=>({x:(s.points[0].x+s.points[1].x)/2,y:(s.points[0].y+s.points[1].y)/2});
 const existing=shapes.filter(s=>s.type==='door').some(s=>{const p=mid(s);return Math.abs((p.x-c.x)*n.x+(p.y-c.y)*n.y)<eps&&Math.abs((p.x-c.x)*-n.y+(p.y-c.y)*n.x)<width/2-24;});
 entry.id=idFactory();entry.open=open;
 return[...shapes.filter(s=>s.id!==parentId),merged,wall,...(existing?[]:[entry])];
}
