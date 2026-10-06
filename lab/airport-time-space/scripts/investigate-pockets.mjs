// Reproduce deep pockets using only the app's filtered times and random starts.
// No geographic positions, spherical projection or surface prior is used.
import fs from 'node:fs';
import {SpaceSolver,fitSphere,mulberry} from '../dist/engine.js';
import {filterObservations} from '../dist/observations.js';
const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/flights.json',import.meta.url)));
snapshot.routes=snapshot.route_files.flatMap(file=>JSON.parse(fs.readFileSync(new URL('../dist/'+file,import.meta.url))));
const data=filterObservations(snapshot,{aircraft:'widebody',minHours:3,seedAirport:'SIN'});
const length=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
function inspect(solver,id){
 const sphere=fitSphere(solver.points),edges=solver.incident[id],before=edges.reduce((s,e)=>s+solver.residual(e)**2,0);
 const rng=mulberry(913+id),starts=[solver.points[id],...Array.from({length:28},()=>Array.from({length:3},()=> (rng()-.5)*solver.scale*2))];
 const loss=p=>edges.reduce((sum,e)=>sum+(length(p,solver.points[e.a===id?e.b:e.a])-e.hours)**2,0);
 const candidates=starts.map(start=>{
  let p=[...start],cost=loss(p);
  for(let i=0;i<2500;i++){
   const g=[0,0,0];for(const e of edges){const q=solver.points[e.a===id?e.b:e.a],d=Math.max(1e-8,length(p,q)),f=(d-e.hours)/d;for(let k=0;k<3;k++)g[k]+=f*(p[k]-q[k]);}
   let rate=.35/edges.length,next,nextCost;for(let trial=0;trial<10;trial++){next=p.map((v,k)=>v-rate*g[k]);nextCost=loss(next);if(nextCost<=cost)break;rate*=.5;}
   if(nextCost>cost)break;const move=length(p,next);p=next;cost=nextCost;if(move<1e-9)break;
  }
  return {position:p,loss:cost,radiusRatio:length(p,sphere.center)/sphere.radius};
 }).sort((a,b)=>a.loss-b.loss);
 const target2=edges.reduce((s,e)=>s+e.hours**2,0),best=candidates[0];
 const pairs=edges.map(e=>({other:data.airports[e.a===id?e.b:e.a].id,targetHours:e.hours,fittedHours:length(solver.points[e.a],solver.points[e.b]),relativeError:solver.residual(e)/e.hours,twoWay:e.twoWay,directions:e.directions,observations:e.observations.map(r=>({from:r.from_airport,to:r.to_airport,minutes:r.minutes,aircraft:r.aircraft,flight:r.flight_number,date:r.date,source:r.source,nonstop:r.nonstop_verified,stops:r.stop_count}))})).sort((a,b)=>Math.abs(b.relativeError)-Math.abs(a.relativeError));
 return {airport:data.airports[id].id,name:data.airports[id].name,degree:edges.length,radiusRatio:length(solver.points[id],sphere.center)/sphere.radius,localStress:Math.sqrt(before/target2),localLoss:before,bestFixedNeighborLoss:best.loss,bestFixedNeighborRadiusRatio:best.radiusRatio,localLossReduction:(before-best.loss)/Math.max(1e-12,before),candidateBasins:candidates.filter((c,i)=>!candidates.slice(0,i).some(p=>length(c.position,p.position)<.05)).map(c=>({loss:c.loss,radiusRatio:c.radiusRatio})),pairs};
}
const report={generated:new Date().toISOString(),method:'Exact production solver; wide-body observations of at least 3h, equal-weight two-way means. Each run starts at random XYZ. At selected points, 29 starts re-fit only that airport while holding all its neighbors fixed. Sphere radius ratios are diagnostics only and never enter either optimizer.',airports:data.airports.length,pairs:data.edges.length,steps:30000,runs:[]};
for(const seed of [71,72,73]){
 const solver=new SpaceSolver(data,seed);solver.initializeAll('space');for(let i=0;i<report.steps&&solver.phase!=='stable';i++)solver.step();
 const sphere=fitSphere(solver.points),deep=solver.points.map((p,id)=>({id,ratio:length(p,sphere.center)/sphere.radius})).sort((a,b)=>a.ratio-b.ratio).slice(0,8).map(p=>p.id);
 const ids=[...new Set([data.airports.findIndex(a=>a.id==='LOS'),...deep])],airports=ids.map(id=>inspect(solver,id));
 const entry={seed,...solver.metrics(),radialVariation:sphere.spread,airports};report.runs.push(entry);
 fs.writeFileSync('/tmp/pocket-points-'+seed+'.json',JSON.stringify({points:solver.points,airports:data.airports,sphere}));
 console.log(JSON.stringify({seed,stress:entry.stress,deep:airports.map(({airport,degree,radiusRatio,localLoss,bestFixedNeighborLoss,bestFixedNeighborRadiusRatio})=>({airport,degree,radiusRatio,localLoss,bestFixedNeighborLoss,bestFixedNeighborRadiusRatio}))}));
 fs.writeFileSync(new URL('../dist/airport-pocket-diagnostic.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}
report.findings={
 lagos:report.runs.map(run=>{const p=run.airports.find(p=>p.airport==='LOS');return {seed:run.seed,steps:run.iterations,globalStress:run.stress,degree:p.degree,radiusRatio:p.radiusRatio,localStress:p.localStress,localLoss:p.localLoss,bestFixedNeighborLoss:p.bestFixedNeighborLoss};}),
 interpretation:'Lagos has 17 constraints. Seed 71 places it deep inside and fits its constraints substantially worse than seeds 72 and 73. Re-fitting Lagos alone from 29 starts, with neighbors fixed, does not improve its seed-71 loss appreciably. This is evidence of a coordinated local minimum in the whole reconstruction, rather than a missing surface vertex or a solution recoverable by moving only Lagos. These 30,000-step runs have not satisfied the production stability criterion.',
 sparseExamples:['BSB','SUB'].map(airport=>{const index=data.airports.findIndex(a=>a.id===airport);return {airport,neighbors:[...data.neighbors[index]].map(id=>data.airports[id].id),explanation:'One distance fixes a sphere of possible positions around the sole neighbor. It does not determine this airport\u2019s position within the overall cloud.'};}),
 remainingAmbiguity:'Even the better start leaves dents at several airports. Sparse and clustered neighbor sets, different local minima, and noisy scheduled travel times fitted as straight-line lengths can all contribute. A nearly spherical position is not required by the loss, and none is imposed.'
};
fs.writeFileSync(new URL('../dist/airport-pocket-diagnostic.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
