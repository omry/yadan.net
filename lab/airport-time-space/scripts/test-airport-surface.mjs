import assert from 'node:assert/strict';
import fs from 'node:fs';
import {airportSurface} from '../dist/airport-surface.js';
import {convexHull} from '../dist/hull.js';
import {prepare,SpaceSolver} from '../dist/engine.js';
import {filterObservations} from '../dist/observations.js';
function closed(surface,count){
 assert.equal(surface.vertices.length,count);assert.equal(new Set(surface.faces.flat()).size,count);
 const edges=new Map();for(const face of surface.faces)for(let i=0;i<3;i++){const a=face[i],b=face[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');const values=edges.get(key)??[];values.push([a,b]);edges.set(key,values);}
 for(const incidence of edges.values()){assert.equal(incidence.length,2,'Closed two-face edge');assert.deepEqual(incidence[0],[...incidence[1]].reverse(),'Consistent winding');}
 assert.equal(count-edges.size+surface.faces.length,2,'Closed genus-zero topology');
}
const tetra=[[2,2,2],[2,-2,-2],[-2,2,-2],[-2,-2,2],[0,0,0]],copy=JSON.stringify(tetra);
assert.equal(convexHull(tetra).vertices.length,4);const surface=airportSurface(tetra);closed(surface,5);assert.equal(JSON.stringify(tetra),copy,'Never move original positions');
const cube=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])cube.push([x,y,z]);cube.push([0,0,0],[.5,.5,.5],[-.5,-.5,-.5]);closed(airportSurface(cube),11);
const plane=[[-2,-2,0],[2,-2,0],[2,2,0],[-2,2,0],[.2,.1,0]];const flat=airportSurface(plane);assert.equal(flat.dimension,2);assert.equal(flat.vertices.length,5);assert(flat.faces.flat().includes(4),'Interior planar airport participates');assert.equal(flat.extraVertices.length,1,'Plane fan uses a visual center, outside the solver');
const sparse=[tetra[0],null,tetra[1],tetra[2],tetra[3],[.1,0,0]];closed(airportSurface(sparse),5);assert(!airportSurface(sparse).faces.flat().includes(1));
assert.equal(airportSurface([[0,0,0],[1,0,0],[2,0,0]]).dimension,1);
const raw=JSON.parse(fs.readFileSync(new URL('../dist/flights.json',import.meta.url)));raw.routes=raw.route_files.flatMap(file=>JSON.parse(fs.readFileSync(new URL('../dist/'+file,import.meta.url))));
const data=filterObservations(prepare(raw),{minHours:3,aircraft:'widebody',seedAirport:'SIN'}),solver=new SpaceSolver(data,71);solver.initializeAll('space');
const initial=solver.energy(solver.points),before=JSON.stringify(solver.points);closed(airportSurface(solver.points),data.airports.length);assert.equal(JSON.stringify(solver.points),before);assert.equal(solver.energy(solver.points),initial);
for(let i=0;i<2000;i++)solver.step();closed(airportSurface(solver.points),data.airports.length);
console.log(JSON.stringify({checks:'passed',allAirportSurface:data.airports.length,facets:airportSurface(solver.points).faces.length,positionsAndLoss:'unchanged',topology:'closed, consistently oriented; interior airports included'}));
