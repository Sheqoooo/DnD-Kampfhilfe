import{order,prepareManualOrder}from'./core.js?v=map-chat-1';

// Remove only this encounter's copy, keeping the current round and libraries.
export function removeParticipant(state,id){
 const person=state.people.find(p=>p.id===id);if(!person)return null;
 prepareManualOrder(state);const sorted=order(state.people),index=sorted.findIndex(p=>p.id===id);
 state.people=state.people.filter(p=>p.id!==id);
 if(state.active===id)state.active=(sorted[index+1]??sorted.find(p=>p.id!==id))?.id??null;
 prepareManualOrder(state);state.demo=false;return person;
}
