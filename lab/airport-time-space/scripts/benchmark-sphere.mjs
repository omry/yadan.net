import assert from 'node:assert/strict';
import {prepare,SpaceSolver,fitSphere} from '../dist/engine.js';
import {createSphereBenchmark} from '../dist/benchmark.js';
import {convexHull} from '../dist/hull.js';
const benchmark=createSphereBenchmark(),data=prepare(benchmark.data);
assert.equal(data.airports.length,24);assert.equal(data.edges.length,276);
assert(data.airports.every(a=>Object.keys(a).sort().join(',')==='id,name'));
assert(!('truth' in data)&&!('radius' in data)&&!('points' in data),'Ground truth stays outside solver input');
const modes={},start=performance.now();
for(const mode of ['space','plane']){
 const solver=new SpaceSolver(data);solver.initializeAll(mode);
 const initialError=solver.metrics().stress;
 for(let i=0;i<30000&&solver.phase!=='stable';i++)solver.step();
 const sphere=fitSphere(solver.points),radiusError=sphere?Math.abs(sphere.radius-benchmark.truth.radius)/benchmark.truth.radius:null;
 const recovered=!!sphere&&solver.metrics().stress<.01&&sphere.spread<.01&&radiusError<.01;
 const hull=convexHull(solver.points);
 modes[mode]={...solver.metrics(),initialError,radialVariation:sphere?.spread??null,radiusError,recovered,hull:{facets:hull.faces.length,outerPoints:hull.vertices.length,dimension:hull.dimension}};
}
console.log(JSON.stringify({synthetic:true,points:data.airports.length,pairDistances:data.edges.length,metric:'Euclidean chord distance',groundTruthSuppliedToSolver:false,hullAffectsOptimization:false,modes,seconds:(performance.now()-start)/1000},null,2));
if(Object.values(modes).some(m=>!m.recovered||!m.stable)){process.stderr.write('Sphere recovery benchmark FAILED.\n');process.exitCode=1;}
