import{WORLD}from'./world.js?v=expanded-grid-1';
// Camera coordinates are separate from saved combat and drawing data.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const axis=(value,size,min,max)=>clamp(value,min,max-size);
export const fullView=()=>({x:0,y:0,width:1000,height:700,zoom:1});
export function zoomView(view,factor,anchor={x:view.x+view.width/2,y:view.y+view.height/2}){
 if(!Number.isFinite(factor)||factor<=0)return {...view};
 const zoom=clamp(view.zoom*factor,.25,4),width=1000/zoom,height=700/zoom;
 return {zoom,width,height,x:axis(anchor.x-(anchor.x-view.x)/view.width*width,width,WORLD.left,WORLD.right),y:axis(anchor.y-(anchor.y-view.y)/view.height*height,height,WORLD.top,WORLD.bottom)};
}
export function panView(view,dx,dy){
 return {...view,x:axis(view.x-dx,view.width,WORLD.left,WORLD.right),y:axis(view.y-dy,view.height,WORLD.top,WORLD.bottom)};
}
