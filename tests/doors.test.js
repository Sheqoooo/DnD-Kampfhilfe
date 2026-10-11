
import test from 'node:test';import assert from 'node:assert/strict';
import{placeDoor,integrateShape,translateShape,reshapeShape,transformSelection}from'../dist/drawing.js';
import{validState}from'../dist/core.js';
import{makeCampaign,validCampaign}from'../dist/campaign.js';
const wall={id:'w',type:'wall',points:[{x:100,y:100},{x:300,y:100}]};
test('doors snap to horizontal and vertical wall direction and stay within endpoints',()=>{
 const d=placeDoor({x:199,y:108},[wall]);assert.deepEqual(d.points,[{x:175,y:100},{x:225,y:100}]);
 const edge=placeDoor({x:101,y:101},[wall]);assert.deepEqual(edge.points,[{x:100,y:100},{x:150,y:100}]);
 const vertical=placeDoor({x:208,y:200},[{...wall,points:[{x:200,y:100},{x:200,y:300}]}]);assert.deepEqual(vertical.points,[{x:200,y:175},{x:200,y:225}]);
});
test('doors work on diagonal, room and round boundaries, but not in empty space',()=>{
 assert.equal(placeDoor({x:800,y:600},[wall]),null);
 const diagonal=placeDoor({x:200,y:200},[{...wall,points:[{x:100,y:100},{x:300,y:300}]}],{grid:false});assert.ok(Math.abs(diagonal.points[1].x-diagonal.points[0].x-(diagonal.points[1].y-diagonal.points[0].y))<.001);
 const room={id:'r',type:'rect',x:100,y:100,w:200,h:200};assert.equal(placeDoor({x:200,y:100},[room]).points[0].y,100);
 const round=placeDoor({x:300,y:200},[{...room,type:'ellipse'}]);assert.ok(Math.abs(Math.hypot(round.points[1].x-round.points[0].x,round.points[1].y-round.points[0].y)-50)<.001);
});
test('door remains separate from room union and preserves open state while editing',()=>{
 const door={id:'d',...placeDoor({x:200,y:100},[wall]),open:true};
 assert.equal(integrateShape([wall],door).shapes.length,2);
 assert.equal(translateShape(door,50,50).open,true);
 assert.equal(reshapeShape(door,1,{x:250,y:100}).type,'door');
 assert.equal(transformSelection([door],2,{x:300,y:200})[0].open,true);
});
test('doors survive campaign save and reload validation',()=>{
 const door={id:'d',...placeDoor({x:200,y:100},[wall])};
 const state={version:1,title:'Doors',round:1,active:null,people:[],shapes:[wall,door]};
 assert.equal(validState(JSON.parse(JSON.stringify(state))),true);
 assert.equal(validCampaign(JSON.parse(JSON.stringify(makeCampaign(state,()=> 'fight')))),true);
 assert.equal(validState({...state,shapes:[{...door,open:'yes'}]}),false);
 assert.equal(validState({...state,shapes:[{...door,points:[door.points[0],door.points[0]]}]}),false);
});
