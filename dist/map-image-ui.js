import{readMapImage,imageBackground}from'./map-image.js?v=image-map-1';
export function initMapImage({getState,apply,toast,readImage=readMapImage}){
 const root=document,$=s=>root.querySelector(s),dialog=$('#map-image-dialog');let pending=null,context=null,request=0;
 function preview(){if(!pending)return;$('#map-image-preview').src=pending.src;$('#map-image-preview').hidden=false;$('#map-image-name').textContent=pending.name;}
 function render(){const b=getState().background;$('#open-map-image').textContent=b?'Kartenbild ändern':'Bild als Spielfeld';}
 $('#open-map-image').onclick=()=>{
  context=getState().id;pending=getState().background?structuredClone(getState().background):null;
  $('#map-image-file').value='';$('#map-image-status').textContent='';$('#map-image-preview').hidden=!pending;$('#map-image-name').textContent='Noch kein Bild ausgewählt.';
  $('#map-image-columns').value=pending?pending.w/50:20;$('#map-image-grid').checked=pending?.showGrid??true;
  $('#map-image-apply').disabled=!pending;$('#map-image-remove').hidden=!pending;preview();dialog.showModal();
 };
 $('#map-image-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const current=++request;$('#map-image-apply').disabled=true;$('#map-image-status').textContent='Bild wird vorbereitet …';
  try{const image=await readImage(file);if(current!==request||!dialog.open)return;pending=image;$('#map-image-columns').value=Number((Math.min(1000,700*image.w/image.h)/50).toFixed(2));preview();$('#map-image-status').textContent='Bild bereit. Breite und Raster wählen, dann übernehmen.';}
  catch(error){if(current===request)$('#map-image-status').textContent=error.message;}
  finally{if(current===request)$('#map-image-apply').disabled=!pending;}
 };
 $('#map-image-form').onsubmit=e=>{
  e.preventDefault();if(!pending)return;
  try{if(getState().id!==context)throw Error('Der bearbeitete Kampf hat sich geändert. Bitte den Dialog erneut öffnen.');apply(imageBackground(pending,Number($('#map-image-columns').value),$('#map-image-grid').checked));dialog.close();toast('Kartenbild übernommen. Mit Rückgängig zurück.');}catch(error){$('#map-image-status').textContent=error.message;}
 };
 $('#map-image-remove').onclick=()=>{try{if(getState().id!==context)throw Error('Bitte den Dialog erneut öffnen.');apply(undefined);dialog.close();toast('Kartenbild entfernt. Figuren und Zeichnungen bleiben erhalten.');}catch(error){$('#map-image-status').textContent=error.message;}};
 dialog.addEventListener('close',()=>{request++;pending=null;$('#map-image-preview').removeAttribute('src');});return{render};
}
