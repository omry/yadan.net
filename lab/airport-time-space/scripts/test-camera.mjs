import assert from 'node:assert/strict';
import {initialRotation,orbitRotation,rollRotation,focusRotation,rotatePoint,cloudCenter} from '../dist/camera.js';
import {projectPoint} from '../dist/view-geometry.js';
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} ≈ ${b}`);
const points=[[10,20,30],[14,25,32],[8,18,24]],original=JSON.stringify(points),center=cloudCenter(points),view={extent:10,width:800,height:600,zoom:1};
let rotation=initialRotation();
const euler=projectPoint([2,3,4],{...view,yaw:.5,pitch:-.4}),quaternion=projectPoint([2,3,4],{...view,rotation});near(euler.x,quaternion.x);near(euler.y,quaternion.y);
for(const [dx,dy] of [[100,0],[0,120],[-200,30],[70,-200]]){
 rotation=orbitRotation(rotation,dx,dy);
 const target=projectPoint(center.map((v,k)=>v-center[k]),{...view,rotation});near(target.x,400);near(target.y,300);
 const transformed=points.map(p=>rotatePoint(p.map((v,k)=>v-center[k]),rotation));
 near(Math.hypot(...transformed[0].map((v,k)=>v-transformed[1][k])),Math.hypot(...points[0].map((v,k)=>v-points[1][k])));
}
const before=[...rotation];rotation=orbitRotation(rotation,45,-67);rotation=orbitRotation(rotation,-45,67);rotation.forEach((v,k)=>near(v,before[k]));
// Roll acts around the viewing axis after any orbit, preserving depth and the
// centroid's screen position. A quarter-turn right is clockwise on screen.
const rolled=rollRotation(rotation,Math.PI/2/.006);
for(const point of points){
 const p=point.map((v,k)=>v-center[k]),a=rotatePoint(p,rotation),b=rotatePoint(p,rolled);
 near(b[0],a[1]);near(b[1],-a[0]);near(b[2],a[2]);
 near(Math.hypot(...a),Math.hypot(...b));
}
const target=projectPoint([0,0,0],{...view,rotation:rolled});near(target.x,400);near(target.y,300);
rollRotation(rollRotation(rotation,83),-83).forEach((v,k)=>near(v,rotation[k]));
// List selection faces the airport toward the camera while preserving the
// cloud mean, roll continuity and all reconstructed coordinates.
for(const point of points){
 const p=point.map((v,k)=>v-center[k]),focused=focusRotation(rolled,p),front=rotatePoint(p,focused);
 near(front[0],0);near(front[1],0);near(front[2],Math.hypot(...p));near(Math.hypot(...focused),1);
 const screen=projectPoint(p,{...view,rotation:focused});near(screen.x,400);near(screen.y,300);
 const mean=projectPoint([0,0,0],{...view,rotation:focused});near(mean.x,400);near(mean.y,300);
}
const opposite=rotatePoint([0,0,-2],focusRotation([0,0,0,1],[0,0,-2]));opposite.forEach((v,k)=>near(v,[0,0,2][k]));
assert.deepEqual(focusRotation(rolled,[0,0,0]),rolled);
for(let i=0;i<10000;i++)rotation=orbitRotation(rotation,2,-3);
for(let i=0;i<10000;i++)rotation=rollRotation(rotation,2);
near(Math.hypot(...rotation),1);assert.equal(JSON.stringify(points),original);
assert.deepEqual(cloudCenter([]),[0,0,0]);
console.log(JSON.stringify({checks:'passed',camera:'fixed centroid, view-space orbit and roll, preserved depth on roll, selected airport centered toward camera, reversible rotation, preserved distances, no pole clamp'}));
