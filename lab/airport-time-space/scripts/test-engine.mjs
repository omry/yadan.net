import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepare,Solver,parseCSV,fitSphere} from '../dist/engine.js';

// A known non-coplanar tetrahedron checks that Z can emerge from a planar start.
const truth=[[0,0,0],[3,0,0],[0,4,0],[0,0,5],[2,3,4],[5,-2,-1]];
const airports=truth.map((_,i)=>({id:`A${i}`,name:`A${i}`}));
const routes=[];
for(let i=0;i<truth.length;i++)for(let j=i+1;j<truth.length;j++)routes.push({from_airport:`A${i}`,to_airport:`A${j}`,minutes:60*Math.hypot(...truth[i].map((v,k)=>v-truth[j][k]))});
const data=prepare({airports,routes});const solver=new Solver(data);
for(let i=0;i<3;i++)solver.add();for(let i=0;i<300;i++)solver.step();
assert(solver.points.filter(Boolean).every(p=>p[2]===0),'Initial coordinates must be flat');
solver.release();while(solver.active.length<truth.length)solver.add();
const initial=solver.metrics().stress;
for(let i=0;i<4000;i++){const before=solver.energy(solver.points);solver.step();assert(solver.energy(solver.points)<=before+1e-9,'Stress must not rise without a new point');}
assert(solver.metrics().stress<.001,'Reconstruct known 3D distances');
assert(solver.metrics().stress<initial/10);
assert(solver.points.some(p=>Math.abs(p[2])>.5),'Optimization must leave the plane');
const translated=solver.points.map(p=>p.map(v=>v+17));
assert(Math.abs(solver.energy(translated)-solver.energy(solver.points))<1e-9,'Distances are translation invariant');

const csv='from_airport,to_airport,minutes,latitude,longitude\r\nAA,BB,60,1,2\r\nBB,AA,120,3,4\r\nBB,CC,90,4,5\r\nCC,DD,100,6,7';
const parsed=parseCSV(csv);
assert.equal(parsed.edges.find(e=>e.observations.length===2).hours,1.5,'Average duplicate or reciprocal observations');
assert.deepEqual(Object.keys(parsed.airports[0]).sort(),['id','name'],'CSV geographic fields are discarded');
assert.throws(()=>parseCSV(csv.replace('100','-100')),/minutes/);
assert.throws(()=>parseCSV('from_airport,to_airport,minutes\nAA,BB,60\nCC,DD,60'),/disconnected/);
assert.throws(()=>parseCSV('from_airport,to_airport,minutes\n"AA,BB,60'),/unclosed/);
assert.throws(()=>parseCSV('from_airport,to_airport,minutes\nAA,AA,60'),/endpoints/);
assert.equal(parseCSV(csv.replace('AA,BB,60,1,2','"AA","BB",60,"1","2"')).airports.length,4);

const snapshot=JSON.parse(readFileSync(new URL('../dist/flights.json',import.meta.url)));if(snapshot.route_files)snapshot.routes=snapshot.route_files.flatMap(file=>JSON.parse(readFileSync(new URL('../dist/'+file,import.meta.url))));
const built=prepare(snapshot),actual=new Solver(built);
actual.release();while(actual.active.length<built.airports.length)actual.add();
const startError=actual.metrics().stress;
for(let i=0;i<300;i++)actual.step();
assert(actual.metrics().stress<=startError+1e-9);
assert(actual.points.every(p=>p.every(Number.isFinite)));
assert(built.airports.every(a=>!('latitude' in a)&&!('longitude' in a)));

const sphere=fitSphere([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]);
assert(sphere.spread<1e-10);assert(Math.abs(sphere.radius-1)<1e-10);
console.log(JSON.stringify({checks:'passed',syntheticStress:solver.metrics().stress,builtInStress:actual.metrics().stress,airports:built.airports.length,routes:built.edges.length,radialVariation:fitSphere(actual.points)?.spread}));
