import{WORLD}from'./world.js?v=expanded-grid-1';
export const IMAGE_DATA_LIMIT=900000;
export function validBackground(b){
 if(b===undefined)return true;
 return !!b&&typeof b.name==='string'&&b.name.length<=120&&typeof b.src==='string'&&b.src.length<=IMAGE_DATA_LIMIT&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(b.src)&&['x','y','w','h'].every(k=>Number.isFinite(b[k]))&&b.w>=50&&b.h>=50&&b.x>=WORLD.left&&b.y>=WORLD.top&&b.x+b.w<=WORLD.right&&b.y+b.h<=WORLD.bottom&&typeof b.showGrid==='boolean';
}
export function imageBackground(image,columns,showGrid=true){
 if(!Number.isFinite(columns)||columns<1||columns>100)throw Error('Bitte eine Breite zwischen 1 und 100 Feldern eingeben.');
 const b={...image,x:0,y:0,w:columns*50,h:columns*50*image.h/image.w,showGrid};
 if(!validBackground(b))throw Error('Das Bild oder seine Größe ist ungültig. Bitte eine andere Breite wählen.');
 return b;
}
export async function readMapImage(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Bitte ein PNG-, JPG- oder WebP-Bild auswählen.');
 if(file.size>20e6)throw Error('Das Bild darf höchstens 20 MB groß sein.');
 const url=URL.createObjectURL(file),img=new Image();
 try{
  img.src=url;try{await img.decode();}catch{throw Error('Dieses Bild kann nicht gelesen werden. Bitte eine andere Datei wählen.');}
  if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>80e6)throw Error('Das Bild ist zu groß oder kann nicht gelesen werden.');
  const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e8d7ad';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let src;for(const quality of [.88,.75,.6,.45]){src=canvas.toDataURL('image/jpeg',quality);if(src.length<=IMAGE_DATA_LIMIT)break;}
  if(src.length>IMAGE_DATA_LIMIT)throw Error('Das Bild enthält zu viele Details. Bitte ein kleineres Bild wählen.');
  return{name:file.name.slice(0,120),src,w:canvas.width,h:canvas.height};
 }finally{URL.revokeObjectURL(url);}
}
