import test from'node:test';import assert from'node:assert/strict';
import{clearBoard,showBoardFigures}from'../dist/map-actions.js';import{isMapShapeVisible}from'../dist/terrain-types.js';
import{validState}from'../dist/core.js';import{makeCampaign,validCampaign}from'../dist/campaign.js';import{recordChange,undoChange,redoChange}from'../dist/history.js';
const demo=()=>({version:1,title:'Map',round:2,active:'a',people:[{id:'a',name:'Ada',kind:'ally',hp:8,max:10,init:0,turnPosition:0,x:75,y:75}],shapes:[{id:'r',type:'rect',x:0,y:0,w:200,h:200}]});
test('clear the full board preserves encounter stats and is one reversible operation',()=>{
 const before=demo(),s=structuredClone(before),h=[],f=[];recordChange(h,f,before);clearBoard(s);assert.deepEqual(s.shapes,[]);assert.deepEqual(s.people,[{...before.people[0],mapHidden:true}]);assert.equal(s.round,2);assert.equal(s.active,'a');assert.equal(validState(s),true);assert.deepEqual(undoChange(h,f,s),before);assert.deepEqual(redoChange(h,f,before),s);
});
test('terrain-only clear leaves tokens visible; figures can return without restoring deleted terrain',()=>{
 const s=demo();clearBoard(s,{figures:false});assert.equal(s.people[0].mapHidden,undefined);clearBoard(s);showBoardFigures(s);assert.deepEqual(s.people,demo().people);assert.deepEqual(s.shapes,[]);
});
test('hidden figures survive save and reload while invalid visibility flags are rejected',()=>{
 const s=demo();clearBoard(s);const c=makeCampaign(s,()=> 'id');assert.equal(validCampaign(JSON.parse(JSON.stringify(c))),true);assert.equal(c.encounters[0].people[0].mapHidden,true);s.people[0].mapHidden='yes';assert.equal(validState(s),false);
});
test('legacy painted forest helpers disappear without deleting their saved geometry',()=>{
 const helpers=[{type:'ellipse',terrain:'clearing'},{type:'room',terrain:'trail'}],shapes=[...helpers,{type:'ellipse',terrain:'tree'},{type:'room',terrain:'cave-floor'},{type:'rect'}];const before=structuredClone(shapes);assert.equal(shapes.filter(isMapShapeVisible).length,3);assert.deepEqual(shapes,before);
});
