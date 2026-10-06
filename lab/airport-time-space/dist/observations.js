import {prepare} from './engine.js';

// Match aircraft models or standard IATA/ICAO equipment codes, never route labels.
export function isWideBody(aircraft=''){
 const type=String(aircraft).toUpperCase().trim();
 return /^(?:A(?:300|310|330|340|350|380)|B(?:747|767|777|787)|IL(?:86|96)|DC10|MD11|L1011)/.test(type.replace(/[^A-Z0-9]/g,''))||
  /\b(?:AIRBUS\s+A(?:300|310|330|340|350|380)|BOEING\s+(?:747|767|777|787)|MCDONNELL DOUGLAS\s+(?:DC-?10|MD-?11))\b/.test(type)||
  /^(?:AB6|310|312|313|330|350|332|333|338|339|342|343|345|346|351|359|388|744|747|748|74H|74M|762|763|764|767|772|773|777|77L|77W|788|789|781|787|A306|A332|A333|A338|A339|A342|A343|A345|A346|A359|A35K|A388|B741|B742|B743|B744|B748|B762|B763|B764|B772|B773|B77W|B77L|B788|B789|B78X)$/.test(type);
}

// Positive identification only: unfamiliar equipment is not assumed to be a jet.
const jetCodes=new Set(('220 221 223 318 319 320 321 31N 32A 32B 32C 32D 32N 32Q 32S '+
 '707 717 720 721 722 727 732 733 734 735 736 737 738 739 73C 73G 73H 73J 73L 73M 73N 73Q 73R 73S 73W 7M7 7M8 7M9 7MJ 7S8 752 753 757 '+
 'A318 A319 A320 A321 A19N A20N A21N A221 A223 B703 B712 B720 B721 B722 B732 B733 B734 B735 B736 B737 B738 B739 B37M B38M B39M B3XM B752 B753 '+
 'CR1 CR2 CR7 CR9 CRJ CRK CRJ1 CRJ2 CRJ7 CRJ9 CRJX E70 E75 E7W E90 E95 EMJ ER3 ER4 ERJ E135 E145 E170 E175 E190 E195 E75L E75S E290 E295 '+
 'ARJ AR1 AR7 AR8 AR9 141 142 143 146 B461 B462 B463 RJ70 RJ85 RJ1H '+
 'C09 C919 C909 AJ27 F70 F100 100 D91 D92 D93 D94 D95 DC9 DC91 DC92 DC93 DC94 DC95 M80 M81 M82 M83 M87 M88 M90 MD80 MD81 MD82 MD83 MD87 MD88 MD90 SU9 SU95').split(' '));
export function isJet(aircraft=''){
 const type=String(aircraft).toUpperCase().trim();
 return isWideBody(type)||jetCodes.has(type)||
  /\b(?:AIRBUS\s+A(?:220|318|319|320|321)(?:NEO)?|BOEING\s+(?:707|717|720|727|737|757)|(?:BOMBARDIER|CANADAIR)\s+CRJ[ -]?\d+|EMBRAER\s+(?:E[ -]?(?:170|175|190|195)|ERJ[ -]?(?:135|140|145|170|175|190|195))|COMAC\s+(?:C(?:909|919)|ARJ[ -]?21)|AVRO\s+RJ[ -]?\d+|(?:BAE|BRITISH AEROSPACE)\s+146|FOKKER\s+(?:70|100)|MCDONNELL DOUGLAS\s+(?:DC[ -]?9|MD[ -]?(?:80|81|82|83|87|88|90))|SUKHOI\s+SUPERJET\s+100)\b/.test(type);
}

export function filterObservations(source,{minHours=0,minEdges=0,overheadMinutes=0,aircraft='all',orderMode='nearby',seedAirport,triangleFilter=false,shortWeights=false}={}){
 if(!Number.isFinite(minHours)||minHours<0||minHours>48)throw Error('Use a minimum duration from 0 to 48 hours.');
 if(!Number.isInteger(minEdges)||minEdges<0||minEdges>299)throw Error('Use a whole-number minimum connections from 0 to 299.');
 // Filtering precedes averaging: a short flight or excluded aircraft never
 // contributes to the target, even when other flights connect the same airports.
 const eligible=source.routes.filter(r=>(!source.nonstop_only||(r.nonstop_verified===true&&r.stop_count===0&&r.verification_method==='independent flight-route adjacency'&&r.verification_source))&&r.minutes>=minHours*60&&(aircraft==='all'||(aircraft==='jets'?isJet(r.aircraft_code)||isJet(r.aircraft):aircraft==='widebody'?isWideBody(r.aircraft_code)||isWideBody(r.aircraft):r.aircraft===aircraft)));
 const neighbors=new Map();for(const r of eligible){for(const id of [r.from_airport,r.to_airport])if(!neighbors.has(id))neighbors.set(id,new Set());neighbors.get(r.from_airport).add(r.to_airport);neighbors.get(r.to_airport).add(r.from_airport);}
 // Peel the graph to its k-core. Count distinct undirected airport pairs,
 // not directions or individual observations. Removing an airport can lower
 // its neighbors' degrees, so a single pass cannot enforce the threshold.
 const eligibleAirports=neighbors.size;let connectionPruningRounds=0;
 while(minEdges>0){
  const remove=[...neighbors].filter(([,links])=>links.size<minEdges).map(([id])=>id);
  if(!remove.length)break;connectionPruningRounds++;
  for(const id of remove){for(const other of neighbors.get(id)??[])neighbors.get(other)?.delete(id);neighbors.delete(id);}
 }
 const coreRoutes=eligible.filter(r=>neighbors.has(r.from_airport)&&neighbors.has(r.to_airport));
 const visited=new Set(),components=[];
 for(const id of neighbors.keys()){
  if(visited.has(id))continue;const group=[id];visited.add(id);
  for(const a of group)for(const b of neighbors.get(a))if(!visited.has(b)){visited.add(b);group.push(b);}
  components.push(group);
 }
 components.sort((a,b)=>b.length-a.length);
 const included=new Set(components[0]??[]);
 if(included.size<4)throw Error('These filters leave fewer than four connected airports. Lower the minimum connections or choose more aircraft.');
 const routes=coreRoutes.filter(r=>included.has(r.from_airport)&&included.has(r.to_airport));
 return prepare({...source,triangleFilter,shortWeights,orderMode,seedAirport,overheadMinutes:source.synthetic?0:overheadMinutes,airports:source.airports.filter(a=>included.has(a.id)),routes,filterInfo:{minHours,minEdges,overheadMinutes:source.synthetic?0:overheadMinutes,minAdjustedMinutes:overheadMinutes&&!source.synthetic?1:null,aircraft,orderMode,sourceAirports:source.airports.length,sourceObservations:source.routes.length,eligibleObservations:eligible.length,excludedObservations:source.routes.length-eligible.length,insufficientConnectionsAirports:eligibleAirports-neighbors.size,insufficientConnectionsObservations:eligible.length-coreRoutes.length,connectionPruningRounds,disconnectedObservations:coreRoutes.length-routes.length,excludedAirports:source.airports.length-included.size}});
}
