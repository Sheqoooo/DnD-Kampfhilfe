import{order,prepareManualOrder}from'./core.js?v=initiative-entry-1';

// Remove only this encounter's copy, keeping the current round and libraries.
export function removeParticipant(state,id){
 const person=state.people.find(p=>p.id===id);if(!person)return null;
 prepareManualOrder(state);const sorted=order(state.people),index=sorted.findIndex(p=>p.id===id);
 state.people=state.people.filter(p=>p.id!==id);
 if(state.active===id)state.active=(sorted[index+1]??sorted.find(p=>p.id!==id))?.id??null;
 prepareManualOrder(state);state.demo=false;return person;
}

// Clear this encounter in one undoable change; retain map, round and libraries.
export function removeAllParticipants(state){
 if(!state.people.length)return 0;
 const count=state.people.length;state.people=[];state.active=null;state.demo=false;return count;
}
