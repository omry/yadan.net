import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {prepare,SpaceSolver} from '../dist/engine.js';
import {createPlaneBenchmark,fitPlane} from '../dist/benchmark.js';
import {rotatePoint,initialRotation} from '../dist/camera.js';
const benchmark=createPlaneBenchmark(),data=prepare(benchmark.data),runs=[];
assert.equal(data.edges.length,276);
assert(data.airports.every(a=>Object.keys(a).sort().join(',')==='id,name'));
assert(!('truth' in data)&&!('points' in data)&&!('normal' in data)&&!('radius' in data),'Only labels and exact distances reach optimization');
const tilted=benchmark.truth.points.map(p=>rotatePoint(p.position,initialRotation(.8,.6)).map(v=>v+17));
assert(fitPlane(tilted).spread<1e-7,'Flatness is independent of orientation and translation');
assert(Math.abs(fitPlane([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]).spread-1/Math.sqrt(3))<1e-10,'A sphere must not be diagnosed as flat');
for(const seed of [71,1,123])for(const mode of ['space','plane']){
 const solver=new SpaceSolver(data,seed);solver.initializeAll(mode);
 if(mode==='space')assert(fitPlane(solver.points).spread>.1,'Free 3D starts are not pre-flattened');
 for(let i=0;i<30000&&solver.phase!=='stable';i++){const before=solver.cost;solver.step();assert(solver.cost<=before+1e-8);}
 const plane=fitPlane(solver.points),recovered=solver.metrics().stress<.01&&plane.spread<.01;
 assert(recovered,`${seed}/${mode}: recover plane from distances`);
 if(mode==='plane'){assert(solver.points.every(p=>p[2]===0));assert.equal(solver.lift,null,'Exact flat distances provide no reason to leave a plane');assert.equal(solver.phase,'stable');}
 runs.push({seed,mode,...solver.metrics(),planeThickness:plane.spread,recovered,points:solver.points});
}
const report={points:data.airports.length,pairDistances:data.edges.length,metric:'Exact Euclidean distance',groundTruthSuppliedToSolver:false,planeConstraint:false,criterion:'Less than 1% normalized distance error and RMS best-fit-plane thickness / RMS cloud radius',maximumSteps:30000,note:'3D starts recover a thin plane within the tolerance while continuing to refine; flat starts settle without a 3D lift. Near-flat height gradients diminish slowly. No points are flattened for validation or rendering.',runs};
if(process.argv.includes('--write')){
 writeFileSync(new URL('../dist/plane-distances.csv',import.meta.url),'from_airport,to_airport,minutes\n'+data.routes.map(r=>`${r.from_airport},${r.to_airport},${r.minutes}`).join('\n')+'\n');
 writeFileSync(new URL('../dist/plane-ground-truth.json',import.meta.url),JSON.stringify(benchmark.truth,null,2)+'\n');
 writeFileSync(new URL('../dist/plane-benchmark-result.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({checks:'passed',planeRecovery:'3 seeds × random 3D and flat starts',runs:runs.map(({seed,mode,stress,planeThickness,stable})=>({seed,mode,stress,planeThickness,stable}))}));
