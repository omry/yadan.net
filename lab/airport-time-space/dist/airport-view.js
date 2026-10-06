// Scene text-label selection only. Points, surface and optimizer always use all airports.
export function selectAirportLabels(data,mode='hubs'){
 if(!['hubs','all'].includes(mode))throw Error('Choose hubs or all airports.');
 const incoming=data.airports.map(()=>new Set()),outgoing=data.airports.map(()=>new Set());
 const ids=new Map(data.airports.map((airport,index)=>[airport.id,index]));
 const excluded=new Set((data.excludedEdges??[]).map(e=>[e.a,e.b].sort((a,b)=>a-b).join(':')));
 for(const flight of data.routes){
  const a=ids.get(flight.from_airport),b=ids.get(flight.to_airport);
  if(a===undefined||b===undefined||a===b)continue;
  if(excluded.has([a,b].sort((a,b)=>a-b).join(':')))continue;
  incoming[b].add(a);outgoing[a].add(b);
 }
 const ranked=data.airports.map((airport,index)=>({index,id:airport.id,incoming:incoming[index].size,outgoing:outgoing[index].size}));
 ranked.sort((a,b)=>b.incoming-a.incoming||(a.id<b.id?-1:a.id>b.id?1:0));
 const count=Math.max(1,Math.ceil(data.airports.length*.1));
 return {mode,ranked,indices:mode==='hubs'?ranked.slice(0,count).map(a=>a.index):[...data.order],count:mode==='hubs'?count:data.airports.length};
}
