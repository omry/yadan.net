import assert from 'node:assert/strict';
import {applyConstraintPolicy,shortFlightWeight} from '../dist/constraint-policy.js';
import {prepare,SpaceSolver,Solver} from '../dist/engine.js';
const airports=['AA','BB','CC','DD'].map(id=>({id,name:id}));
const edges=[[0,1,5],[0,2,2],[1,2,2],[0,3,2],[1,3,2],[2,3,2]].map(([a,b,hours])=>({a,b,hours,observations:[{minutes:hours*60}]}));
const copy=JSON.stringify(edges),opts={triangleFilter:true,shortWeights:true,minEdges:2};
const filtered=applyConstraintPolicy(airports,edges,opts);
assert.equal(filtered.excludedEdges.length,1);assert.equal(filtered.excludedEdges[0].hours,5);
assert.equal(filtered.excludedEdges[0].exclusion.count,2);
assert.equal(filtered.constraintPolicy.before.material,2);assert.equal(filtered.constraintPolicy.after.material,0);
assert.equal(JSON.stringify(edges),copy,'Policy must never mutate source observations');
assert.deepEqual(filtered,applyConstraintPolicy(airports,edges,opts),'Deterministic filtering');
assert.equal(applyConstraintPolicy(airports,edges,{...opts,minEdges:3}).excludedEdges.length,0,'Protect minimum connections');
assert.equal(applyConstraintPolicy(airports,edges.slice(0,4),opts).excludedEdges.length,0,'Do not infer an offender from one triangle');
assert.equal(applyConstraintPolicy(airports,edges.map(e=>({...e,hours:e.hours===5?4.5:e.hours})),opts).excludedEdges.length,0,'Ignore violations of 30 minutes or less');
assert.equal(shortFlightWeight(1),1/9);assert.equal(shortFlightWeight(3),1);assert.equal(shortFlightWeight(15),1);
const routes=edges.map(e=>({from_airport:airports[e.a].id,to_airport:airports[e.b].id,minutes:e.hours*60}));
const data=prepare({airports,routes,triangleFilter:true,shortWeights:true,filterInfo:{minEdges:2}});
assert.equal(data.routes.length,6);assert.equal(data.allEdges.length,6);assert.equal(data.edges.length,5);
const s=new Solver(data);s.active=[0,1,2,3];s.points=[[0,0,0],[2,0,0],[0,2,0],[0,0,2]];s.edges=data.edges;s.cost=s.energy(s.points);
const expected=s.edges.reduce((sum,e)=>sum+e.weight*s.residual(e)**2,0);assert.equal(s.cost,expected);
// Finite differences verify the weighted gradient used by a solver step.
const h=1e-5,gradient=s.points.map(()=>[0,0,0]);
for(let i=0;i<4;i++)for(let k=0;k<3;k++){s.points[i][k]+=h;const plus=s.energy(s.points);s.points[i][k]-=2*h;const minus=s.energy(s.points);s.points[i][k]+=h;gradient[i][k]=(plus-minus)/(2*h);}
const original=s.points.map(p=>[...p]),degrees=[0,0,0,0];for(const e of s.edges){degrees[e.a]+=e.weight;degrees[e.b]+=e.weight;}
let predicted=original.map((p,i)=>p.map((v,k)=>v-.45*gradient[i][k]/degrees[i]));
for(let k=0;k<3;k++){const mean=predicted.reduce((sum,p)=>sum+p[k],0)/4;predicted.forEach(p=>p[k]-=mean);}
assert(s.energy(predicted)<=s.cost,'Fixture accepts the initial step');s.step();
for(let i=0;i<4;i++)for(let k=0;k<3;k++)assert(Math.abs(s.points[i][k]-predicted[i][k])<1e-7,'Weighted gradient and degree normalization');
assert(s.metrics().allObservedStress>=s.metrics().unweightedStress,'Excluded edge remains in original-data diagnostic');
// Unequal weights preserve exact distances, including lifting from a plane.
const truth=[[0,0,0],[1,0,0],[0,2,0],[0,0,4],[2,1,3],[4,-2,-1]],as=truth.map((_,i)=>({id:`P${i}`})),rs=[];
for(let a=0;a<truth.length;a++)for(let b=a+1;b<truth.length;b++)rs.push({from_airport:`P${a}`,to_airport:`P${b}`,minutes:60*Math.hypot(...truth[a].map((v,k)=>v-truth[b][k]))});
for(const mode of ['plane','space']){
 const solver=new SpaceSolver(prepare({airports:as,routes:rs,shortWeights:true}),71);solver.initializeAll(mode,{anneal:false});
 for(let i=0;i<15000&&solver.phase!=='stable';i++){const before=solver.cost;solver.step();assert(solver.cost<=before+1e-9);}
 assert(solver.metrics().allObservedStress<.001,`${mode}: reconstruct weighted exact distances`);
 assert(solver.points.some(p=>Math.abs(p[2])>.5));
}
const synthetic=prepare({airports,routes,synthetic:true,triangleFilter:true,shortWeights:true});
assert.equal(synthetic.excludedEdges.length,0);assert(synthetic.edges.every(e=>e.weight===1),'Synthetic benchmark bypasses flight policies');
console.log('Triangle policy, source preservation, weighted gradients and plane lifting passed.');
