// Diagnostic controls only. Reference positions never enter production inputs.
// Usage: node scripts/investigate-airport-shape.mjs /tmp/reference-xyz.json /tmp/report.json
import fs from 'node:fs';
import {prepare,SpaceSolver,fitSphere} from '../dist/engine.js';
import {filterObservations} from '../dist/observations.js';
import {selectAirportLabels} from '../dist/airport-view.js';
const reference=JSON.parse(fs.readFileSync(process.argv[2])),output=process.argv[3]??'/tmp/airport-shape-report.json';
const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/flights.json',import.meta.url)));snapshot.routes=snapshot.route_files.flatMap(file=>JSON.parse(fs.readFileSync(new URL('../dist/'+file,import.meta.url))));
const data=filterObservations(snapshot,{aircraft:'widebody',minHours:3,seedAirport:'SIN'}),hubs=selectAirportLabels(data),hubIDs=new Set(hubs.indices);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),radius=6;
const covered=data.airports.filter(a=>reference[a.id]);
const testEdges=data.edges.filter(e=>reference[data.airports[e.a].id]&&reference[data.airports[e.b].id]);
const distance=(e,kind)=>{const a=reference[data.airports[e.a].id],b=reference[data.airports[e.b].id];return kind==='chord'?Math.hypot(...a.map((v,k)=>v-b[k])):Math.acos(Math.min(1,Math.max(-1,dot(a,b))));};
const control=kind=>prepare({airports:covered,routes:testEdges.map(e=>({from_airport:data.airports[e.a].id,to_airport:data.airports[e.b].id,minutes:60*radius*distance(e,kind)}))});
const summary=(solver,subset)=>{const sphere=fitSphere(subset?solver.points.filter((p,i)=>subset.has(i)):solver.points);return {stress:solver.metrics().stress,iterations:solver.iterations,stable:solver.phase==='stable',radialVariation:sphere?.spread??null,radius:sphere?.radius??null};};
function radialDetails(solver){const sphere=fitSphere(solver.points);if(!sphere)return [];return solver.points.map((p,i)=>({airport:data.airports[i].id,degree:data.neighbors[i].size,radiusRatio:Math.hypot(...p.map((v,k)=>v-sphere.center[k]))/sphere.radius})).sort((a,b)=>Math.abs(b.radiusRatio-1)-Math.abs(a.radiusRatio-1)).slice(0,15);}
function run(input,seed,max=30000){const solver=new SpaceSolver(input,seed);solver.initializeAll('space');const checkpoints=[];for(let step=1;step<=max;step++){solver.step();if([100,1000,5000,15000,30000].includes(step)||solver.phase==='stable'){checkpoints.push(summary(solver,input===data?hubIDs:null));if(solver.phase==='stable')break;}}return {solver,checkpoints};}
const report={method:'All reconstructions start from random XYZ and fit only edge distances. Independent reference coordinates are used solely to fabricate control measurements and evaluate models, never to initialize or constrain a reconstruction. No sphere prior or projection is added.',referenceSource:'https://github.com/jpatokal/openflights/blob/master/data/airports.dat',airports:data.airports.length,pairs:data.edges.length,referenceAirports:covered.length,referencePairs:testEdges.length,displayedHubs:hubs.ranked.slice(0,hubs.count),runs:[],controls:[]};
for(const seed of [71,72,73]){const {solver,checkpoints}=run(data,seed);const entry={seed,allPoints:summary(solver),hubPoints:summary(solver,hubIDs),checkpoints,outliers:radialDetails(solver)};report.runs.push(entry);console.log(JSON.stringify({stage:'flight schedules',...entry}));}
for(const kind of ['chord','arc']){const input=control(kind);for(const seed of [71,72]){const {solver,checkpoints}=run(input,seed);const entry={kind,seed,...summary(solver),checkpoints};report.controls.push(entry);console.log(JSON.stringify({stage:'reference-sphere control',...entry}));}}
// Best global scale on independently known reference geometry; neither model
// is used to constrain the reconstructions above.
report.referenceModels=['chord','arc'].map(kind=>{const ds=testEdges.map(e=>distance(e,kind));const scale=testEdges.reduce((s,e,i)=>s+e.hours*ds[i],0)/ds.reduce((s,d)=>s+d*d,0);const residual=testEdges.reduce((s,e,i)=>s+(e.hours-scale*ds[i])**2,0);const denominator=testEdges.reduce((s,e)=>s+e.hours**2,0);const outliers=testEdges.map((e,i)=>({from:data.airports[e.a].id,to:data.airports[e.b].id,hours:e.hours,expectedHours:scale*ds[i],relativeError:(e.hours-scale*ds[i])/(scale*ds[i]),observations:e.observations.length})).sort((a,b)=>Math.abs(b.relativeError)-Math.abs(a.relativeError)).slice(0,12);return {kind,normalizedError:Math.sqrt(residual/denominator),scale,outliers};});
report.hubReferenceCoverage={zMin:Math.min(...hubs.indices.map(i=>reference[data.airports[i].id]?.[2]).filter(Number.isFinite)),zMax:Math.max(...hubs.indices.map(i=>reference[data.airports[i].id]?.[2]).filter(Number.isFinite)),southernHubs:hubs.indices.filter(i=>reference[data.airports[i].id]?.[2]<0).map(i=>data.airports[i].id)};
report.lowDegreeCounts=Object.fromEntries([1,2,3].map(degree=>[degree,data.neighbors.filter(n=>n.size===degree).length]));
report.referenceMissingAirports=data.airports.filter(a=>!reference[a.id]).map(a=>a.id);
report.hubReferenceCoverage.latitudeMin=180/Math.PI*Math.asin(report.hubReferenceCoverage.zMin);
report.hubReferenceCoverage.latitudeMax=180/Math.PI*Math.asin(report.hubReferenceCoverage.zMax);
// An exact ambiguity proof, evaluated separately from every reconstruction.
// Degree-one points may rotate around their sole fixed neighbor without
// changing any supplied chord measurement; many distinct shapes share zero loss.
const chordControl=control('chord'),truth=covered.map(a=>reference[a.id].map(v=>radius*v)),moved=truth.map(p=>[...p]),changes=[];
for(const [i,neighbors] of chordControl.neighbors.entries())if(neighbors.size===1){
 const anchor=[...neighbors][0],distance=Math.hypot(...truth[i].map((v,k)=>v-truth[anchor][k]));
 moved[i]=truth[anchor].map(v=>v*(1+distance/radius));
 changes.push({airport:covered[i].id,anchor:covered[anchor].id,radiusBefore:1,radiusAfter:1+distance/radius});
}
const stress=points=>Math.sqrt(chordControl.edges.reduce((s,e)=>s+(Math.hypot(...points[e.a].map((v,k)=>v-points[e.b][k]))-e.hours)**2,0)/chordControl.edges.reduce((s,e)=>s+e.hours**2,0));
report.exactAmbiguityProof={description:'Evaluation only: start with independently known sphere points, then rotate each degree-one point around its sole fixed neighbor onto the outward radial ray. Every observed chord length is unchanged. No reconstruction is initialized from these positions.',airports:covered.length,pairs:chordControl.edges.length,movedAirports:changes,stressBefore:stress(truth),stressAfter:stress(moved),radialVariationBefore:fitSphere(truth).spread,radialVariationAfter:fitSphere(moved).spread};
if(report.exactAmbiguityProof.stressAfter>1e-10)throw Error('Exact distance-preserving ambiguity check failed.');
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({stage:'complete',output,referenceModels:report.referenceModels,hubReferenceCoverage:report.hubReferenceCoverage,exactAmbiguityProof:report.exactAmbiguityProof}));
