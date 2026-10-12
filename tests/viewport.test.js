import test from 'node:test';
import assert from 'node:assert/strict';
import {fullView,zoomView,panView} from '../dist/viewport.js';

test('zoom keeps the chosen map point at its relative screen position',()=>{
 const before={x:200,y:140,width:500,height:350,zoom:2},anchor={x:425,y:280};
 const after=zoomView(before,1.5,anchor);
 assert.ok(Math.abs((anchor.x-before.x)/before.width-(anchor.x-after.x)/after.width)<1e-9);
 assert.ok(Math.abs((anchor.y-before.y)/before.height-(anchor.y-after.y)/after.height)<1e-9);
 assert.deepEqual(before,{x:200,y:140,width:500,height:350,zoom:2});
});
test('zoom is bounded from full field to 400 percent and stays inside the board',()=>{
 const max=zoomView(fullView(),20,{x:1000,y:700});
 assert.deepEqual(max,{zoom:4,width:250,height:175,x:750,y:525});
 assert.deepEqual(zoomView(max,.01),{zoom:1,width:1000,height:700,x:0,y:0});
});
test('panning shifts the camera opposite the pointer without changing zoom or shapes',()=>{
 const before=zoomView(fullView(),2);
 const after=panView(before,100,-70);
 assert.equal(after.x,before.x-100);assert.equal(after.y,before.y+70);
 assert.equal(after.zoom,2);assert.equal(after.width,500);assert.equal(before.x,250);
});
test('panning clamps to every map edge and cannot move the full-field camera',()=>{
 const view=zoomView(fullView(),4);
 assert.deepEqual(panView(view,10000,10000),{...view,x:0,y:0});
 assert.deepEqual(panView(view,-10000,-10000),{...view,x:750,y:525});
 assert.deepEqual(panView(fullView(),100,-100),fullView());
});
test('invalid zoom factors leave the camera unchanged',()=>{
 for(const factor of [0,-1,NaN,Infinity])assert.deepEqual(zoomView(fullView(),factor),fullView());
});
