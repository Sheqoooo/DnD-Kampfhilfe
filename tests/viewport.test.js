import test from 'node:test';
import assert from 'node:assert/strict';
import {fullView,zoomView,panView,wheelView} from '../dist/viewport.js';

test('zoom keeps the chosen map point at its relative screen position',()=>{
 const before={x:200,y:140,width:500,height:350,zoom:2},anchor={x:425,y:280};
 const after=zoomView(before,1.5,anchor);
 assert.ok(Math.abs((anchor.x-before.x)/before.width-(anchor.x-after.x)/after.width)<1e-9);
 assert.ok(Math.abs((anchor.y-before.y)/before.height-(anchor.y-after.y)/after.height)<1e-9);
 assert.deepEqual(before,{x:200,y:140,width:500,height:350,zoom:2});
});
test('zoom is bounded from 25 to 400 percent and keeps the board visible',()=>{
 const max=zoomView(fullView(),20,{x:1000,y:700});
 assert.deepEqual(max,{zoom:4,width:250,height:175,x:750,y:525});
 const min=zoomView(max,.01);
 assert.equal(min.zoom,.25);assert.equal(min.width,4000);assert.equal(min.height,2800);
 assert.ok(min.x<=0&&min.x+min.width>=1000);assert.ok(min.y<=0&&min.y+min.height>=700);
});
test('zooming out from 100 percent centres the full field with surrounding space',()=>{
 assert.deepEqual(zoomView(fullView(),.5),{zoom:.5,width:2000,height:1400,x:-500,y:-350});
 assert.deepEqual(zoomView(fullView(),.1),{zoom:.25,width:4000,height:2800,x:-1500,y:-1050});
});
test('panning a zoomed-out field stays within the expanded drawing area',()=>{
 const view=zoomView(fullView(),.5);
 assert.deepEqual(panView(view,100000,100000),{...view,x:-10000,y:-7000});
 assert.deepEqual(panView(view,-100000,-100000),{...view,x:9000,y:6300});
});
test('panning shifts the camera opposite the pointer without changing zoom or shapes',()=>{
 const before=zoomView(fullView(),2);
 const after=panView(before,100,-70);
 assert.equal(after.x,before.x-100);assert.equal(after.y,before.y+70);
 assert.equal(after.zoom,2);assert.equal(after.width,500);assert.equal(before.x,250);
});
test('panning clamps at the expanded world edges and works at 100 percent',()=>{
 const view=zoomView(fullView(),4);
 assert.deepEqual(panView(view,100000,100000),{...view,x:-10000,y:-7000});
 assert.deepEqual(panView(view,-100000,-100000),{...view,x:10750,y:7525});
 assert.deepEqual(panView(fullView(),100,-100),{...fullView(),x:-100,y:100});
});
test('invalid zoom factors leave the camera unchanged',()=>{
 for(const factor of [0,-1,NaN,Infinity])assert.deepEqual(zoomView(fullView(),factor),fullView());
});

test('two-finger wheel panning preserves figures and accounts for display scale',()=>{
 const view=fullView(),before=structuredClone(view),moved=wheelView(view,{deltaX:30,deltaY:20,deltaMode:0},.5);
 assert.equal(moved.x,60);assert.equal(moved.y,40);assert.equal(moved.zoom,1);assert.deepEqual(view,before);
});
test('wheel line and page units pan consistently',()=>{
 assert.equal(wheelView(fullView(),{deltaY:2,deltaMode:1},1).y,32);
 assert.equal(wheelView(fullView(),{deltaY:1,deltaMode:2},1,undefined,400).y,400);
});
test('pinch wheel zoom keeps the cursor anchor fixed and remains bounded',()=>{
 const view=fullView(),anchor={x:250,y:175},zoomed=wheelView(view,{deltaY:-20,ctrlKey:true},.5,anchor);
 assert.ok(zoomed.zoom>1);assert.ok(Math.abs((anchor.x-zoomed.x)/zoomed.width-.25)<1e-9);
 assert.ok(Math.abs((anchor.y-zoomed.y)/zoomed.height-.25)<1e-9);
 assert.equal(wheelView(view,{deltaY:30},0).zoom,1);
});
