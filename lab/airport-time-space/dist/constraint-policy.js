// Uses only measured pair times. No point positions or assumed shape.
export const shortFlightWeight=hours=>Math.min(1,(hours/3)**2);

export function inspectTriangles(airports,edges,toleranceHours=.5){
 const n=airports.length,matrix=new Int32Array(n*n).fill(-1),offenders=new Map();
 edges.forEach((e,i)=>{matrix[e.a*n+e.b]=matrix[e.b*n+e.a]=i;});
 let triangles=0,violations=0,material=0;
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
  const ab=matrix[a*n+b];if(ab<0)continue;
  for(let c=b+1;c<n;c++){
   const ac=matrix[a*n+c],bc=matrix[b*n+c];if(ac<0||bc<0)continue;triangles++;
   const indices=[ab,ac,bc];let longest=ab;
   for(const index of indices)if(edges[index].hours>edges[longest].hours)longest=index;
   const excess=2*edges[longest].hours-indices.reduce((s,i)=>s+edges[i].hours,0);
   if(excess>1e-3)violations++;if(excess<=toleranceHours+1e-9)continue;material++;
   const entry=offenders.get(longest)??{index:longest,count:0,totalExcess:0,witnesses:[]};
   entry.count++;entry.totalExcess+=excess;
   const long=edges[longest],via=[a,b,c].find(i=>i!==long.a&&i!==long.b);
   entry.witnesses.push({via:airports[via].id,excessHours:excess,otherHours:indices.filter(i=>i!==longest).map(i=>edges[i].hours)});
   offenders.set(longest,entry);
  }
 }
 return {triangles,violations,material,offenders:[...offenders.values()]};
}

export function applyConstraintPolicy(airports,input,{triangleFilter=false,shortWeights=false,minEdges=0}={}){
 const allEdges=input.map(e=>({...e,weight:shortWeights?shortFlightWeight(e.hours):1}));
 const edges=[...allEdges],excludedEdges=[],before=inspectTriangles(airports,edges);
 let audit=before,limitReached=false;
 if(triangleFilter)while(true){
  const degree=airports.map(()=>0);for(const e of edges){degree[e.a]++;degree[e.b]++;}
  // A singleton contradiction cannot identify its responsible edge. Protect
  // the selected minimum degree. A witnessed triangle also prevents a bridge
  // from being removed: its other two edges still connect the endpoints.
  const candidates=audit.offenders.filter(o=>o.count>=2&&degree[edges[o.index].a]>minEdges&&degree[edges[o.index].b]>minEdges);
  candidates.sort((a,b)=>b.count-a.count||b.totalExcess-a.totalExcess||a.index-b.index);
  if(!candidates.length)break;
  // Bound work on dense uploads. Keep the remainder for review.
  if(excludedEdges.length>=50){limitReached=true;break;}
  const chosen=candidates[0],edge=edges[chosen.index];
  excludedEdges.push({...edge,exclusion:{reason:'Repeated triangle inconsistency',count:chosen.count,witnesses:chosen.witnesses}});
  edges.splice(chosen.index,1);audit=inspectTriangles(airports,edges);
 }
 const summary=a=>({triangles:a.triangles,violations:a.violations,material:a.material});
 return {edges,allEdges,excludedEdges,constraintPolicy:{triangleFilter,shortWeights,toleranceHours:.5,minimumWitnesses:2,maximumExclusions:50,limitReached,shortFullWeightHours:3,before:summary(before),after:summary(audit),excludedEdges:excludedEdges.length,excludedObservations:excludedEdges.reduce((s,e)=>s+e.observations.length,0),downweightedEdges:edges.filter(e=>e.weight<1).length}};
}
