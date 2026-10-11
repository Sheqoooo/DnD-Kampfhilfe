export function recordChange(past,future,before,limit=60){past.push(structuredClone(before));if(past.length>limit)past.shift();future.length=0;}
export function undoChange(past,future,current){if(!past.length)return null;future.push(structuredClone(current));return past.pop();}
export function redoChange(past,future,current){if(!future.length)return null;past.push(structuredClone(current));return future.pop();}
