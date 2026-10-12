// Shared drawing limits; existing encounter coordinates retain their meaning.
export const WORLD={left:-10000,top:-7000,right:11000,bottom:7700};
export const worldRect={x:WORLD.left,y:WORLD.top,width:WORLD.right-WORLD.left,height:WORLD.bottom-WORLD.top};
export const clampWorldPoint=(p,margin=0)=>({x:Math.max(WORLD.left+margin,Math.min(WORLD.right-margin,p.x)),y:Math.max(WORLD.top+margin,Math.min(WORLD.bottom-margin,p.y))});
export const inWorld=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=WORLD.left&&p.x<=WORLD.right&&p.y>=WORLD.top&&p.y<=WORLD.bottom;
