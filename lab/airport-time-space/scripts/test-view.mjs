import assert from 'node:assert/strict';
import {convexHull} from '../dist/hull.js';
import {projectPoint,hullFaces,occluded} from '../dist/view-geometry.js';
const view={yaw:0,pitch:0,extent:4,width:800,height:600,zoom:1};
const project=p=>projectPoint(p,view);
const cube=[[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,0,0]];
const hull=convexHull(cube),faces=hullFaces(hull,cube.map(project),view.extent);
assert.equal(faces.length,2,'Only the two front triangles are rendered for an axis-aligned cube');
cube.forEach((p,i)=>assert.equal(occluded(project(p),faces,view.extent),p[2]<1,`Correct visibility of cube point ${i}`));
const rotated=cube.map(p=>projectPoint(p,{...view,yaw:Math.PI,pitch:0}));
const reversed=hullFaces(hull,rotated,view.extent);
cube.forEach((p,i)=>assert.equal(occluded(rotated[i],reversed,view.extent),p[2]>-1,'Orbit reverses front and back visibility'));
const plane=[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[0,0,0]],planeHull=convexHull(plane);
for(const yaw of [0,Math.PI]){
 const ps=plane.map(p=>projectPoint(p,{...view,yaw})),fs=hullFaces(planeHull,ps,view.extent);
 assert.equal(fs.length,2);assert(ps.every(p=>!occluded(p,fs,view.extent)),'Coplanar points remain visible from both sides');
}
// Tilted triangle: a point on the face must not self-occlude, despite unequal
// perspective scales at the vertices. Moving along its viewing ray preserves
// screen position while changing which side of the opaque surface it is on.
const triangle=[[3,0,2],[-3,-2,-2],[0,3,-1]],on=[0,1,2].map(k=>triangle[0][k]*.2+triangle[1][k]*.3+triangle[2][k]*.5);
const triangleFaces=hullFaces({faces:[[0,1,2]],dimension:2},triangle.map(project),view.extent),eye=[0,0,3.8*view.extent];
const ray=factor=>on.map((v,k)=>eye[k]+(v-eye[k])*factor);
assert(!occluded(project(on),triangleFaces,view.extent));
assert(occluded(project(ray(1.05)),triangleFaces,view.extent));
assert(!occluded(project(ray(.95)),triangleFaces,view.extent));
assert(!occluded(project([20,20,-2]),triangleFaces,view.extent));
assert(triangleFaces[0].shades.every(v=>v>=.22&&v<=1));
const otherFaces=hullFaces({faces:[[0,1,2]],dimension:2},triangle.map(p=>projectPoint(p,{...view,yaw:1})),view.extent);
assert.notDeepEqual(triangleFaces[0].shades,otherFaces[0].shades,'Lighting follows the camera when geometry rotates');
console.log(JSON.stringify({checks:'passed',occlusion:'front, rear, interior, rotated, flat and tilted perspective',shading:'camera-relative'}));
