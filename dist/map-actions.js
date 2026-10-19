// Clear only the board: encounter participants, HP and order stay intact.
export function clearBoard(state,{figures=true}={}){
 state.shapes=[];
 if(figures)for(const person of state.people)person.mapHidden=true;
}
export function showBoardFigures(state){for(const person of state.people)delete person.mapHidden;}
