import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseCSV} from '../dist/engine.js';
import {filterObservations,isWideBody,isJet} from '../dist/observations.js';

for(const type of ['Airbus A350-1000','Boeing 777-300ER','Boeing 767-300 Passenger','388','330','350','B773','A35K','B78X'])assert(isWideBody(type),type);
for(const type of ['Airbus A320','Airbus A321neo','Boeing 737-800','Boeing 757-200','Embraer E190','DH8D','unknown',''])assert(!isWideBody(type),type);
for(const type of ['Airbus A319neo','Airbus A320neo','Airbus A321neo family','Airbus A220-300','Boeing 737 MAX 8','Boeing 757-200','Bombardier CRJ-900','Embraer ERJ-145','Embraer E195-E2','COMAC C919','Boeing 787-9','A20N','B38M','E75L','CR9','7S8','73Q','32S','ARJ','C09'])assert(isJet(type),type);
for(const type of ['ATR 72','ATR 42-600','De Havilland Canada Dash 8-400','DH8','DH8D','AT72','Beechcraft 1900','Embraer EMB-120','Cessna 172','helicopter','unidentified jet','Unknown',''])assert(!isJet(type),type);
const jetSource=parseCSV('from_airport,to_airport,minutes,aircraft,aircraft_code\nAA,BB,180,Airbus A320neo,\nAA,BB,120,Embraer E190,\nBB,AA,600,ATR 72,\nBB,CC,240,,A20N\nCC,DD,300,Boeing 787-9,\nAA,DD,600,Unknown,');
const jets=filterObservations(jetSource,{aircraft:'jets'});
assert.equal(jets.routes.length,4,'Jet filtering accepts narrow-body, regional, wide-body and equipment-only records');
assert.equal(jets.edges.find(e=>e.observations.some(r=>r.from_airport==='AA')).hours,2.5,'Exclude turboprops before averaging; the excluded return flight cannot contribute');
assert(jets.routes.every(r=>isJet(r.aircraft)||isJet(r.aircraft_code)));
const csv='from_airport,to_airport,minutes,aircraft,latitude,longitude\nAA,BB,120,Airbus A320,1,2\nAA,BB,300,Airbus A350-900,1,2\nBB,CC,180,Boeing 777-300ER,1,2\nCC,DD,210,Boeing 787-9,1,2\nAA,CC,240,Unknown,1,2\nAA,DD,179,Airbus A350-900,1,2\nDD,EE,260,Boeing 737-800,1,2';
const source=parseCSV(csv),filtered=filterObservations(source,{minHours:3,aircraft:'widebody'});
assert.equal(filtered.airports.length,4);assert.equal(filtered.routes.length,3);
assert.equal(filtered.edges.find(e=>filtered.airports[e.a].id==='AA').hours,5,'Filter individual aircraft records before averaging a pair');
assert.equal(filtered.routes.find(r=>r.minutes===180).aircraft,'Boeing 777-300ER','The 3-hour boundary is inclusive');
assert(source.routes.some(r=>r.aircraft==='Airbus A320'),'Preserve each observation aircraft before filtering');
assert(source.airports.every(a=>!('latitude' in a)&&!('longitude' in a)));
assert.equal(filterObservations(source,{minHours:0,aircraft:'all'}).routes.length,7);
assert.throws(()=>filterObservations(source,{minHours:20,aircraft:'widebody'}),/fewer than four/);
assert.throws(()=>filterObservations(source,{minHours:NaN}),/minimum duration/);
const disconnected={...source,airports:[...source.airports,{id:'XX'},{id:'YY'}],routes:[...source.routes,{from_airport:'XX',to_airport:'YY',minutes:300,aircraft:'Boeing 787-9'}]};
assert.equal(filterObservations(disconnected,{minHours:3,aircraft:'widebody'}).filterInfo.disconnectedObservations,1,'Report observations outside the largest connected network');
assert.throws(()=>filterObservations(source,{minHours:0,aircraft:'Airbus A350-900'}),/fewer than four/);
// Unequal samples must not bias the two-way mean. Excluded records must not
// influence either direction, and a missing reverse direction stays missing.
const directional=parseCSV('from_airport,to_airport,minutes,aircraft\nAA,BB,240,Airbus A350-900\nAA,BB,360,Airbus A350-900\nBB,AA,600,Boeing 777-300ER\nBB,AA,120,Boeing 777-300ER\nBB,AA,1200,Airbus A320\nBB,CC,180,Boeing 787-9\nCC,DD,210,Boeing 787-9');
const balanced=filterObservations(directional,{minHours:3,aircraft:'widebody'});
const ab=balanced.edges.find(e=>e.observations.some(r=>r.from_airport==='AA'));
assert.equal(ab.hours,7.5,'Average directional means: ((240+360)/2+600)/2 = 450 minutes');
assert.equal(ab.twoWay,true);assert.deepEqual(ab.directions.map(d=>[d.minutes,d.count]),[[300,2],[600,1]]);
assert.equal(ab.observations.length,3,'Filter aircraft and duration before two-way averaging');
const oneWay=balanced.edges.find(e=>e.observations.some(r=>r.to_airport==='CC'));
assert.equal(oneWay.twoWay,false);assert.equal(oneWay.hours,3);assert.equal(oneWay.directions.length,1);
const refiltered=filterObservations({...balanced,edges:balanced.edges.map(e=>({...e,hours:999}))},{minHours:3,aircraft:'widebody'});
assert.deepEqual(refiltered.edges.map(e=>e.hours),balanced.edges.map(e=>e.hours),'Always recalculate from retained observations');
const flights=JSON.parse(fs.readFileSync(new URL('../dist/flights.json',import.meta.url)));if(flights.route_files)flights.routes=flights.route_files.flatMap(file=>JSON.parse(fs.readFileSync(new URL('../dist/'+file,import.meta.url))));
assert.equal(flights.nonstop_only,true);assert.equal(flights.duration_basis,'scheduled');
assert(flights.airports.length>60&&flights.routes.length>200);
for(const r of flights.routes){assert(r.aircraft&&r.flight_number&&r.observation_id&&r.source);assert.equal(r.time_basis,'published scheduled nonstop duration');assert.equal(r.stop_count,0);assert.equal(r.nonstop_verified,true);assert.equal(r.aircraft_assignment,'scheduled');assert.equal(r.verification_method,'independent flight-route adjacency');assert(r.verification_source&&r.verification_route);const chain=r.verification_route.split(' → ');assert(chain.some((a,i)=>a===r.from_airport&&chain[i+1]===r.to_airport),'Each flight must match consecutive airports, not a through journey');assert(r.minutes>0);assert(!('latitude' in r)&&!('longitude' in r)&&!('departure_utc' in r));}
const strict=filterObservations({...source,nonstop_only:true,routes:[...source.routes.map(r=>({...r,nonstop_verified:true,stop_count:0,verification_method:'independent flight-route adjacency',verification_source:'https://example.test/flight'})),{from_airport:'AA',to_airport:'BB',minutes:1500,aircraft:'Boeing 787-9',nonstop_verified:false}]},{minHours:3,aircraft:'widebody'});
assert.deepEqual(strict.edges.map(e=>e.hours),filtered.edges.map(e=>e.hours),'Nonstop dataset excludes unverified records before averaging');
for(const invalid of [{nonstop_verified:true},{nonstop_verified:true,stop_count:1,verification_method:'independent flight-route adjacency',verification_source:'https://example.test/flight'}]){const rejected=filterObservations({...source,nonstop_only:true,routes:[...source.routes.map(r=>({...r,nonstop_verified:true,stop_count:0,verification_method:'independent flight-route adjacency',verification_source:'https://example.test/flight'})),{from_airport:'AA',to_airport:'BB',minutes:1500,aircraft:'Boeing 787-9',...invalid}]},{minHours:3,aircraft:'widebody'});assert.deepEqual(rejected.edges.map(e=>e.hours),filtered.edges.map(e=>e.hours),'A caption flag or explicit stop cannot contribute to distance targets');}

const actual=filterObservations(flights,{minHours:3,aircraft:'widebody'});assert(actual.routes.every(r=>r.minutes>=180&&(isWideBody(r.aircraft_code)||isWideBody(r.aircraft))));
console.log(JSON.stringify({checks:'passed',observations:flights.routes.length,filteredObservations:actual.routes.length,filteredAirports:actual.airports.length}));

// A manual airport label changes growth order without introducing coordinates.
const equatorial=filterObservations(flights,{minHours:3,aircraft:'widebody',seedAirport:'SIN'});
assert.equal(equatorial.airports[equatorial.order[0]].id,'SIN');
assert.equal(equatorial.arrivalHours[equatorial.order[0]],0);
assert.equal(equatorial.edges.length,actual.edges.length);
assert.deepEqual(equatorial.edges.map(e=>e.hours),actual.edges.map(e=>e.hours));
for(let i=1;i<equatorial.order.length;i++)assert(equatorial.arrivalHours[equatorial.order[i]]>=equatorial.arrivalHours[equatorial.order[i-1]]);
const mostLinked=filterObservations(flights,{minHours:3,aircraft:'widebody',seedAirport:'SIN',orderMode:'constraints'});
assert.equal(mostLinked.airports[mostLinked.order[0]].id,'SIN');
const fallback=filterObservations(source,{minHours:3,aircraft:'widebody',seedAirport:'SIN'});
assert.equal(fallback.order[0],0,'CSV without SIN falls back to its first available airport');

const imported=parseCSV(fs.readFileSync(new URL('../dist/aircraft-flights.csv',import.meta.url),'utf8'));assert.equal(imported.routes.length,flights.routes.length,'Full CSV export round-trips within the expanded limits');const importedFiltered=filterObservations(imported,{minHours:3,aircraft:'widebody'});assert.deepEqual(importedFiltered.edges.map(e=>e.hours),actual.edges.map(e=>e.hours),'Exported individual durations preserve filtered two-way targets');

// A three-link airport loses its qualifying degree when a weak neighbor is
// peeled. Multiple flights and reverse observations cannot rescue that degree.
const coreAirports=['A','B','C','D'],coreRoutes=[];
for(let a=0;a<coreAirports.length;a++)for(let b=a+1;b<coreAirports.length;b++)coreRoutes.push({from_airport:coreAirports[a],to_airport:coreAirports[b],minutes:300,aircraft:'Boeing 787-9'});
const tails=[['E','A'],['E','B'],['E','F'],['F','G']].map(([from_airport,to_airport])=>({from_airport,to_airport,minutes:300,aircraft:'Boeing 787-9'}));
const cascading={airports:[...coreAirports,'E','F','G'].map(id=>({id,name:id})),routes:[...coreRoutes,...tails,...Array.from({length:8},()=>({...tails[2]})),{...tails[2],from_airport:'F',to_airport:'E'}]};
const peeled=filterObservations(cascading,{minHours:3,aircraft:'widebody',minEdges:3});
assert.deepEqual(peeled.airports.map(a=>a.id),coreAirports,'Prune newly under-connected airports as well as initially weak ones');
assert(peeled.neighbors.every(n=>n.size===3),'Keep airports exactly at the inclusive threshold');
assert.equal(peeled.filterInfo.connectionPruningRounds,2,'A single initial degree filter would retain E incorrectly');
assert.equal(peeled.filterInfo.insufficientConnectionsAirports,3);assert.equal(peeled.filterInfo.insufficientConnectionsObservations,cascading.routes.length-coreRoutes.length);
assert.equal(peeled.filterInfo.disconnectedObservations,0,'Distinguish connection pruning from disconnected components');
assert.deepEqual(peeled.edges.map(e=>e.hours),Array(6).fill(5));
assert.equal(filterObservations(cascading,{minEdges:0}).airports.length,7,'Zero restores the original graph');
assert.equal(cascading.airports.length,7,'Do not mutate the source dataset while peeling');
assert.throws(()=>filterObservations(cascading,{minEdges:4}),/fewer than four/,'Handle complete graph collapse');
for(const minEdges of [NaN,Infinity,-1,1.5,300])assert.throws(()=>filterObservations(cascading,{minEdges}),/whole-number minimum connections/);
// Pruning happens after individual aircraft and duration eligibility. The
// apparent extra links below cannot supply a missing qualifying constraint.
const ineligible={...cascading,routes:[...cascading.routes,{from_airport:'F',to_airport:'A',minutes:120,aircraft:'Boeing 787-9'},{from_airport:'F',to_airport:'B',minutes:300,aircraft:'Airbus A320'},{from_airport:'G',to_airport:'C',minutes:300,aircraft:'Airbus A320'}]};
assert.deepEqual(filterObservations(ineligible,{minHours:3,aircraft:'widebody',minEdges:3}).airports.map(a=>a.id),coreAirports);
// Retain only the largest component of the surviving core, without confusing
// that exclusion with airports removed for insufficient degree.
const more=['H','I','J','K','L'],moreRoutes=[];for(let a=0;a<more.length;a++)for(let b=a+1;b<more.length;b++)moreRoutes.push({from_airport:more[a],to_airport:more[b],minutes:300,aircraft:'Boeing 787-9'});
const disconnectedCores=filterObservations({airports:[...coreAirports,...more].map(id=>({id})),routes:[...coreRoutes,...moreRoutes]},{minEdges:3});
assert.deepEqual(disconnectedCores.airports.map(a=>a.id),more);assert.equal(disconnectedCores.filterInfo.insufficientConnectionsAirports,0);assert.equal(disconnectedCores.filterInfo.disconnectedObservations,6);
const dense=filterObservations(flights,{minHours:3,aircraft:'widebody',minEdges:4});
assert(dense.airports.length>60);assert(dense.edges.length>200);assert(dense.neighbors.every(n=>n.size>=4));
const targets=new Map(actual.edges.map(e=>[[actual.airports[e.a].id,actual.airports[e.b].id].sort().join(':'),e.hours]));
for(const e of dense.edges)assert.equal(e.hours,targets.get([dense.airports[e.a].id,dense.airports[e.b].id].sort().join(':')),'Surviving pairs keep their original balanced time targets');
console.log(JSON.stringify({minimumConnections:'passed',airports:dense.airports.length,pairs:dense.edges.length,cascadingRemoval:true}));

// Flight overhead adjusts each raw record, before directional averaging. A
// short or exactly one-hour flight stays positive and stays in the graph.
const shortFlights=parseCSV('from_airport,to_airport,minutes,aircraft\nAA,BB,30,Boeing 787-9\nAA,BB,90,Boeing 787-9\nBB,AA,120,Boeing 787-9\nAA,CC,60,Boeing 787-9\nCC,DD,45,Boeing 787-9');
const corrected=filterObservations(shortFlights,{aircraft:'widebody',overheadMinutes:60});
assert.equal(corrected.routes.length,5,'No default minimum-duration cutoff');
assert.deepEqual(corrected.routes.map(r=>r.minutes),[30,90,120,60,45],'Preserve original durations for audit and re-filtering');
const correctedAB=corrected.edges.find(e=>e.observations.some(r=>r.from_airport==='BB'));
assert.deepEqual(correctedAB.directions.map(d=>d.minutes),[60,120]);assert.deepEqual(correctedAB.directions.map(d=>d.adjustedMinutes),[15.5,60]);
assert.equal(correctedAB.rawHours,1.5);assert.equal(correctedAB.hours,37.75/60,'Clamp each observation, then average directions equally');
assert(corrected.edges.filter(e=>e!==correctedAB).every(e=>e.hours===1/60),'One minute floor prevents zero and negative target lengths');
const repeated=filterObservations(corrected,{aircraft:'widebody',overheadMinutes:60});assert.deepEqual(repeated.edges.map(e=>e.hours),corrected.edges.map(e=>e.hours),'Repeated filtering does not subtract overhead twice');
for(const overheadMinutes of [-1,NaN,Infinity,2881])assert.throws(()=>filterObservations(shortFlights,{overheadMinutes}),/overhead adjustment/);
const exactSmall={...shortFlights,synthetic:true,routes:shortFlights.routes.map(r=>({...r,minutes:.25}))};
assert(filterObservations(exactSmall,{overheadMinutes:60}).edges.every(e=>e.hours===.25/60),'Synthetic measurements bypass flight correction and its floor');
const restored=filterObservations(corrected,{aircraft:'widebody',overheadMinutes:0});
assert(restored.edges.every(e=>e.hours===e.rawHours),'Removing overhead restores original directional means, even from a previously adjusted dataset');
assert.equal(restored.edges.find(e=>e.observations.some(r=>r.to_airport==='DD')).hours,.75,'Sub-hour flights remain included at their original durations');
const expanded=filterObservations(flights,{aircraft:'widebody',minEdges:4,overheadMinutes:0});
assert(expanded.edges.every(e=>e.hours===e.rawHours),'All current targets use original flight durations');
assert(expanded.routes.some(r=>r.minutes<180));assert(expanded.edges.every(e=>e.hours>=1/60));
assert(expanded.edges.length>dense.edges.length,'Removing the cutoff restores short connections');
console.log(JSON.stringify({originalDurations:'passed',airports:expanded.airports.length,edges:expanded.edges.length,observations:expanded.routes.length}));
