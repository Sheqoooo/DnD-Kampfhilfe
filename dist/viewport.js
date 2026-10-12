// Camera coordinates are separate from saved combat and drawing data.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const fullView=()=>({x:0,y:0,width:1000,height:700,zoom:1});
export function zoomView(view,factor,anchor={x:view.x+view.width/2,y:view.y+view.height/2}){
 if(!Number.isFinite(factor)||factor<=0)return {...view};
 const zoom=clamp(view.zoom*factor,1,4),width=1000/zoom,height=700/zoom;
 return {zoom,width,height,x:clamp(anchor.x-(anchor.x-view.x)/view.width*width,0,1000-width),y:clamp(anchor.y-(anchor.y-view.y)/view.height*height,0,700-height)};
}
export function panView(view,dx,dy){
 return {...view,x:clamp(view.x-dx,0,1000-view.width),y:clamp(view.y-dy,0,700-view.height)};
}
