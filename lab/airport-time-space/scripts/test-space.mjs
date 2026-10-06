import assert from 'node:assert/strict';
import {prepare,SpaceSolver,fitSphere} from '../dist/engine.js';
import {createSphereBenchmark} from '../dist/benchmark.js';
import {convexHull} from '../dist/hull.js';
const benchmark=createSphereBenchmark(),data=prepare(benchmark.data);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
function verifyHull(points,hull){
 const edges=new Map();
 for(const [a,b,c] of hull.faces){
  const n=cross(sub(points[b],points[a]),sub(points[c],points[a]));assert(Math.hypot(...n)>1e-12);
  for(const p of points)assert(dot(n,sub(p,points[a]))<=1e-7,'Every point lies inside each outward hull plane');
  for(const [i,j] of [[a,b],[b,c],[c,a]]){const key=[i,j].sort((x,y)=>x-y).join(':');edges.set(key,(edges.get(key)??0)+1);}
 }
 if(hull.dimension===3)for(const count of edges.values())assert.equal(count,2,'A closed hull has two facets per edge');
}
for(const seed of [71,1,123])for(const mode of ['space','plane']){
 const solver=new SpaceSolver(data,seed);solver.initializeAll(mode);
 assert.equal(solver.active.length,24);assert.equal(solver.edges.length,276);
 assert(mode==='plane'?solver.points.every(p=>p[2]===0):solver.points.some(p=>Math.abs(p[2])>1));
 const initialHull=convexHull(solver.points);assert.equal(initialHull.dimension,mode==='plane'?2:3);
 for(let i=0;i<10000&&solver.phase!=='stable';i++){
  const before=solver.energy(solver.points);solver.step();assert(solver.energy(solver.points)<=before+1e-8,'All accepted XYZ and plane-exit steps reduce distance loss');
 }
 assert.equal(solver.phase,'stable');assert(solver.metrics().stress<1e-5);
 const sphere=fitSphere(solver.points);assert(sphere.spread<1e-5);assert(Math.abs(sphere.radius-benchmark.truth.radius)<1e-5);
 if(mode==='plane'){assert(solver.planeStress>.2);assert(solver.lift.curvature<0);assert(solver.lift.energyAfter<solver.lift.energyBefore);}
 const hull=convexHull(solver.points);assert.equal(hull.faces.length,44);assert.equal(hull.vertices.length,24);verifyHull(solver.points,hull);
 const points=structuredClone(solver.points),steps=solver.iterations;solver.step();assert.deepEqual(solver.points,points);assert.equal(solver.iterations,steps);
}
const cube=[[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,0,0]];
// Incompatible distances exercise the actual annealing path, including uphill
// search acceptance, the bounded second start, and an unchanged best-fit display.
const noisy=prepare({airports:['AA','BB','CC','DD'].map(id=>({id})),routes:[['AA','BB',60],['BB','CC',60],['AA','CC',180],['AA','DD',90],['BB','DD',90],['CC','DD',90]].map(([from_airport,to_airport,minutes])=>({from_airport,to_airport,minutes}))});
const results=[];
for(let repeat=0;repeat<2;repeat++){
 const solver=new SpaceSolver(noisy,13);solver.initializeAll('space');
 for(let i=0;i<65000&&solver.phase!=='stable';i++){const before=solver.energy(solver.points);solver.step();assert(solver.energy(solver.points)<=before+1e-8,'Best visible fit cannot worsen while annealing explores');assert(solver.points.every(p=>p.every(Number.isFinite)));}
 assert.equal(solver.phase,'stable');assert.equal(solver.annealing.attempt,128);assert.equal(solver.annealing.restarts,1);assert(solver.annealing.uphillAccepted>0,'Cooling permits uphill proposals inside the search');assert(solver.annealing.finished);results.push(solver.points);
}
assert.deepEqual(results[0],results[1],'The same seed reproduces perturbations and restarts');
const hull=convexHull(cube);assert.equal(hull.faces.length,12);assert.equal(hull.vertices.length,8);assert(!hull.vertices.includes(8));verifyHull(cube,hull);
const plane=convexHull([[0,0,0],[1,0,0],[1,1,0],[0,1,0],[.5,.5,0],[0,0,0]]);assert.equal(plane.dimension,2);assert.equal(plane.faces.length,2);
assert.equal(convexHull([[0,0,0],[1,0,0],[2,0,0]]).dimension,1);assert.equal(convexHull([[0,0,0],[0,0,0],[0,0,0]]).dimension,0);
// Hull computation is read-only, including when faces change as points move.
const snapshot=structuredClone(cube);convexHull(cube);assert.deepEqual(cube,snapshot);
console.log(JSON.stringify({checks:'passed',sphereRecovery:'3 seeds × 2 start modes',hull:'sphere, cube, interior, planar, duplicate, collinear'}));
