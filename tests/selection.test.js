
import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionBounds,transformSelection,moveSelection,shapesInBox} from '../dist/drawing.js';
import {validState} from '../dist/core.js';
const items=()=>[{id:'outer',type:'rect',x:100,y:100,w:200,h:200},{id:'inner',type:'rect',interior:true,x:150,y:150,w:50,h:50},{id:'wall',type:'wall',points:[{x:150,y:200},{x:250,y:200}]}];
test('group scaling preserves room placement, interiors and wall endpoints',()=>{
 const original=items(),result=transformSelection(original,2,{x:500,y:500});
 assert.deepEqual(selectionBounds(result),{x:100,y:100,w:400,h:400});
 assert.equal(result[1].x,200);assert.equal(result[1].w,100);assert.equal(result[1].interior,true);
 assert.deepEqual(result[2].points,[{x:200,y:300},{x:400,y:300}]);
 assert.equal(original[0].w,200);
 assert.equal(validState({version:1,title:'Group',round:1,active:null,people:[],shapes:result}),true);
});
test('whole group clamps together at board edge without distorting relative positions',()=>{
 const moved=moveSelection(items(),1000,1000);
 assert.deepEqual(selectionBounds(moved),{x:800,y:500,w:200,h:200});
 assert.equal(moved[1].x-moved[0].x,50);assert.equal(moved[1].y-moved[0].y,50);
});
test('marquee selects only enclosed shapes and works in either drag direction',()=>{
 assert.deepEqual(shapesInBox(items(),{x:140,y:140},{x:260,y:210}),['inner','wall']);
 assert.deepEqual(shapesInBox(items(),{x:260,y:210},{x:140,y:140}),['inner','wall']);
});
test('scaling does not collapse the group or create invalid tiny rooms',()=>{
 assert.deepEqual(transformSelection(items(),2,{x:101,y:101}),items());
 const wall=[{id:'wall',type:'wall',points:[{x:100,y:100},{x:200,y:100}]}];
 assert.deepEqual(transformSelection(wall,2,{x:300,y:300})[0].points,[{x:100,y:100},{x:300,y:100}]);
});
test('irregular room and courtyard rings scale together',()=>{
 const room={id:'r',type:'room',rings:[[{x:100,y:100},{x:300,y:100},{x:300,y:300},{x:100,y:300}],[{x:150,y:150},{x:150,y:200},{x:200,y:200},{x:200,y:150}]]};
 const result=transformSelection([room],2,{x:500,y:500})[0];
 assert.equal(result.rings.length,2);assert.deepEqual(result.rings[1][0],{x:200,y:200});
});
