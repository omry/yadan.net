import {applyConstraintPolicy} from './constraint-policy.js';
// This module receives only labels and time observations. No geographic inputs.
export function mulberry(seed) {
 return () => { let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296; };
}
export function prepare(data) {
 const overheadMinutes=data.synthetic?0:(data.overheadMinutes??0);
 if(!Number.isFinite(overheadMinutes)||overheadMinutes<0||overheadMinutes>2880)throw Error('Use an overhead adjustment from 0 to 2880 minutes.');
 // Preserve raw records; derive corrected targets afresh on every preparation.
 // Exact synthetic distances bypass flight overhead and the positive floor.
 const adjustedMinutes=r=>overheadMinutes?Math.max(1,r.minutes-overheadMinutes):r.minutes;
 const ids=new Map(data.airports.map((a,i)=>[a.id,i]));
 const pairs=new Map();
 for(const r of data.routes) {
  const a=ids.get(r.from_airport),b=ids.get(r.to_airport);
  if(a===undefined||b===undefined||a===b||!Number.isFinite(r.minutes)||r.minutes<=0)throw Error('Invalid route observation.');
  const key=[a,b].sort((x,y)=>x-y).join(':');
  if(!pairs.has(key))pairs.set(key,{a:Math.min(a,b),b:Math.max(a,b),observations:[]});
  pairs.get(key).observations.push(r);
 }
 const measuredEdges=[...pairs.values()].map(e=>{
  // Give the two travel directions equal weight, regardless of how many
  // flights were retained in each direction. Filtering happens upstream;
  // derive targets again from retained records, never from previous edges.
  const directions=[e.a,e.b].map(from=>{
   const observations=e.observations.filter(r=>ids.get(r.from_airport)===from);
   return observations.length?{from_airport:data.airports[from].id,to_airport:data.airports[from===e.a?e.b:e.a].id,count:observations.length,minutes:observations.reduce((sum,r)=>sum+r.minutes,0)/observations.length,adjustedMinutes:observations.reduce((sum,r)=>sum+adjustedMinutes(r),0)/observations.length}:null;
  }).filter(Boolean);
  return {...e,directions,twoWay:directions.length===2,rawHours:directions.reduce((sum,d)=>sum+d.minutes,0)/directions.length/60,hours:directions.reduce((sum,d)=>sum+d.adjustedMinutes,0)/directions.length/60};
 });
 if(data.airports.length<4||data.airports.length>300)throw Error('Use between 4 and 300 airports.');
 const policy=applyConstraintPolicy(data.airports,measuredEdges,{triangleFilter:!data.synthetic&&!!data.triangleFilter,shortWeights:!data.synthetic&&!!data.shortWeights,minEdges:data.filterInfo?.minEdges??0});
 const {edges}=policy;
 const neighbors=data.airports.map(()=>new Set());
 for(const e of edges){neighbors[e.a].add(e.b);neighbors[e.b].add(e.a);}
 const seed=ids.get(data.seedAirport)??0,seen=new Set([seed]),queue=[seed];
 for(const a of queue)for(const b of neighbors[a])if(!seen.has(b)){seen.add(b);queue.push(b);}
 if(seen.size!==data.airports.length)throw Error('The route network is disconnected. Connect every airport to the same network.');
 const order=[],arrivalHours=Array(data.airports.length).fill(Infinity),mode=data.orderMode??'nearby';
 if(mode==='nearby'){
  // Dijkstra from the selected starting airport. Path sums rank additions only; missing pairs
  // remain missing and no graph-path time is supplied to the objective.
  arrivalHours[seed]=0;const remaining=new Set(data.airports.map((_,i)=>i)),adjacency=data.airports.map(()=>[]);
  for(const e of edges){adjacency[e.a].push([e.b,e.hours]);adjacency[e.b].push([e.a,e.hours]);}
  while(remaining.size){let best=-1;for(const a of remaining)if(best<0||arrivalHours[a]<arrivalHours[best])best=a;order.push(best);remaining.delete(best);for(const [b,hours] of adjacency[best])arrivalHours[b]=Math.min(arrivalHours[b],arrivalHours[best]+hours);}
 }else{
  const remaining=new Set(data.airports.map((_,i)=>i));
  if(data.seedAirport){order.push(seed);remaining.delete(seed);}
  while(remaining.size){let best=-1,score=-1;for(const a of remaining){const linked=order.filter(b=>neighbors[a].has(b)).length;const value=linked*1000+neighbors[a].size;if(value>score){score=value;best=a;}}order.push(best);remaining.delete(best);}
 }
 return {...data,...policy,overheadMinutes,edges,order,neighbors,arrivalHours,orderMode:mode,seedAirport:data.airports[order[0]].id};
}

export class Solver {
 constructor(data,seed=71){this.data=data;this.seed=seed;this.model='direct';this.reset();}
 target(e){return e.hours;}
 reset(){this.rng=mulberry(this.seed);this.points=[];this.active=[];this.edges=[];this.degrees=null;this.iterations=0;this.cost=0;this.change=0;this.flat=true;}
 add(){
  if(this.active.length===this.data.order.length)return null;
  const id=this.data.order[this.active.length];
  this.active.push(id);
  const scale=Math.max(2,this.data.edges.reduce((s,e)=>s+this.target(e),0)/this.data.edges.length*.6);
  this.points[id]=[(this.rng()-.5)*scale,(this.rng()-.5)*scale,this.flat?0:(this.rng()-.5)*.1];
  const present=new Set(this.active);this.edges=this.data.edges.filter(e=>present.has(e.a)&&present.has(e.b));this.degrees=null;this.center();this.cost=this.energy(this.points);return id;
 }
 release(){this.flat=false;for(const id of this.active)this.points[id][2]=(this.rng()-.5)*.15;this.cost=this.energy(this.points);}
 center(){if(!this.active.length)return;const c=[0,0,0];for(const id of this.active)for(let k=0;k<3;k++)c[k]+=this.points[id][k]/this.active.length;for(const id of this.active)for(let k=0;k<3;k++)this.points[id][k]-=c[k];}
 energy(points){let s=0;for(const e of this.edges){const a=points[e.a],b=points[e.b];const d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);s+=(e.weight??1)*(d-this.target(e))**2;}return s;}
 step(){
  if(!this.edges.length)return;
  if(!this.degrees){this.degrees=this.points.map(()=>0);for(const e of this.edges){this.degrees[e.a]+=e.weight??1;this.degrees[e.b]+=e.weight??1;}}
  const grad=this.points.map(p=>p?[0,0,0]:null),degrees=this.degrees;
  for(const e of this.edges){const a=this.points[e.a],b=this.points[e.b],d=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),1e-8);const f=(e.weight??1)*(d-this.target(e))/d;for(let k=0;k<3;k++){const g=f*(a[k]-b[k]);grad[e.a][k]+=g;grad[e.b][k]-=g;}}
  const before=this.cost;let rate=.9;let candidate,cost;
  // A conservative, degree-normalized gradient with backtracking decreases stress.
  for(let trial=0;trial<12;trial++){candidate=this.points.map((p,id)=>p?p.map((v,k)=>v-rate*grad[id][k]/Math.max(degrees[id],1e-8)):null);cost=this.energy(candidate);if(cost<=before+1e-12)break;rate*=.5;}
  if(cost<=before+1e-12){this.change=0;for(const id of this.active){this.change+=Math.hypot(...this.points[id].map((v,k)=>v-candidate[id][k]));this.points[id]=candidate[id];}this.center();this.cost=cost;}
  this.iterations++;
 }
 residual(e){const a=this.points[e.a],b=this.points[e.b];return Math.hypot(...a.map((v,k)=>v-b[k]))-this.target(e);}
 metrics(){
  const weightSum=this.edges.reduce((s,e)=>s+(e.weight??1),0),denominator=this.edges.reduce((s,e)=>s+(e.weight??1)*this.target(e)**2,0);
  const rawStress=edges=>{const active=new Set(this.active);let loss=0,norm=0;for(const e of edges)if(active.has(e.a)&&active.has(e.b)){loss+=this.residual(e)**2;norm+=this.target(e)**2;}return norm?Math.sqrt(loss/norm):0;};
  return {stress:denominator?Math.sqrt(this.energy(this.points)/denominator):0,rmse:weightSum?Math.sqrt(this.energy(this.points)/weightSum):0,unweightedStress:rawStress(this.edges),allObservedStress:rawStress(this.data.allEdges??this.edges),edges:this.edges.length,airports:this.active.length,iterations:this.iterations};
 }
}

// Direct distance fitting. Convex hulls and benchmark ground truth are never
// read here: every XYZ coordinate is a free variable.
export class SpaceSolver extends Solver {
 initializeAll(startMode='space',{anneal=true,restarts=1}={}){
  if(!['space','plane'].includes(startMode))throw Error('Choose a 3D or plane start.');
  this.reset();this.startMode=startMode;this.flat=startMode==='plane';this.phase=this.flat?'plane':'space';
  this.annealEnabled=!!anneal;this.annealRestarts=restarts?1:0;this.annealing=null;this.annealRestart=null;this.annealRng=mulberry(this.seed^8675242);
  this.active=[...this.data.order];this.edges=[...this.data.edges];this.incident=[];this.stablePasses=0;this.planeStress=null;this.lift=null;
  this.scale=Math.max(4,this.edges.reduce((sum,e)=>sum+this.target(e),0)/this.edges.length*1.6);
  for(const id of this.active){this.points[id]=[(this.rng()-.5)*this.scale,(this.rng()-.5)*this.scale,this.flat?0:(this.rng()-.5)*this.scale];this.incident[id]=[];}
  for(const e of this.edges){this.incident[e.a].push(e);this.incident[e.b].push(e);}
  this.center();this.cost=this.energy(this.points);
 }
 tryThirdDimension(){
  // At exactly Z=0, every first-order Z gradient is zero. The distance loss's
  // second-order curvature can still identify a downhill out-of-plane direction.
  const weights=this.edges.map(e=>{const d=Math.max(1e-8,Math.hypot(...this.points[e.a].map((v,k)=>v-this.points[e.b][k])));return (e.weight??1)*(d-this.target(e))/d;});
  const degree=Array(this.points.length).fill(0);this.edges.forEach((e,i)=>{degree[e.a]+=Math.abs(weights[i]);degree[e.b]+=Math.abs(weights[i]);});
  const shift=Math.max(1e-8,2*Math.max(...degree));
  let direction=this.points.map(()=>this.rng()-.5);
  const normalize=v=>{const mean=this.active.reduce((sum,id)=>sum+v[id],0)/this.active.length;for(const id of this.active)v[id]-=mean;const norm=Math.hypot(...this.active.map(id=>v[id]))||1;for(const id of this.active)v[id]/=norm;return v;};
  direction=normalize(direction);
  for(let pass=0;pass<200;pass++){
   const product=direction.map(()=>0);this.edges.forEach((e,i)=>{const g=weights[i]*(direction[e.a]-direction[e.b]);product[e.a]+=g;product[e.b]-=g;});
   direction=normalize(direction.map((v,id)=>v-product[id]/shift));
  }
  const curvature=this.edges.reduce((sum,e,i)=>sum+weights[i]*(direction[e.a]-direction[e.b])**2,0);
  const before=this.energy(this.points);let best=null;
  if(curvature< -1e-7)for(const fraction of [.005,.01,.02,.04,.08,.16,.32]){
   const amplitude=this.scale*Math.sqrt(this.active.length)*fraction;
   const points=this.points.map((p,id)=>[p[0],p[1],amplitude*direction[id]]),cost=this.energy(points);
   if(cost<before-1e-10&&(!best||cost<best.cost))best={points,cost,amplitude};
  }
  if(!best)return false;
  this.points=best.points;this.center();this.cost=best.cost;this.flat=false;this.phase='space';this.stablePasses=0;
  this.lift={curvature,energyBefore:before,energyAfter:best.cost,iteration:this.iterations};return true;
 }
 step(){
  if(this.phase==='stable'||!this.edges.length)return;
  if(this.phase==='anneal'){this.stepAnnealing();return;}
  const before=this.cost;super.step();
  const settled=(before-this.cost)/Math.max(1,before)<1e-10&&this.change/this.active.length<this.scale*1e-7;
  this.stablePasses=settled?this.stablePasses+1:0;
  if(this.stablePasses>=12){
   if(this.phase==='plane'){this.planeStress=super.metrics().stress;if(this.tryThirdDimension())return;}
   if(this.phase==='space'&&this.annealEnabled&&!this.annealing&&super.metrics().stress>1e-5){this.beginAnnealing();return;}
   this.phase='stable';
  }
 }
 beginAnnealing(){
  const points=this.points.map(p=>[...p]),cost=this.energy(points);
  this.annealing={attempt:0,trials:64*(1+this.annealRestarts),restarts:0,accepted:0,uphillAccepted:0,improvements:0,initialCost:cost,current:{points,cost},temperature:0,finished:false};
  this.phase='anneal';this.nextAnnealingTrial();
 }
 nextAnnealingTrial(){
  const search=this.annealing,rng=this.annealRng,t=search.attempt,current=search.current;
  if(t>=64){
   this.annealCandidate=null;
   if(this.annealRestarts){
    search.restarts=1;search.firstAccepted=search.accepted;search.firstUphill=search.uphillAccepted;
    this.annealRestart=new SpaceSolver(this.data,(this.seed+1)>>>0);this.annealRestart.initializeAll('space',{anneal:true,restarts:0});
   }else{search.finished=true;this.phase='space';this.stablePasses=0;}
   return;
  }
  // Explore coherent groups, selected by measured graph times or current XYZ
  // proximity. Neither airport geography nor any assumed surface enters here.
  const ranked=this.incident.map((edges,id)=>({id,loss:edges.reduce((sum,e)=>{const a=current.points[e.a],b=current.points[e.b];return sum+(e.weight??1)*(Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])-this.target(e))**2;},0)})).sort((a,b)=>b.loss-a.loss);
  const pivot=t%3===0?ranked[Math.floor(rng()*Math.min(12,ranked.length))].id:Math.floor(rng()*this.points.length);
  const size=Math.max(1,Math.floor(this.points.length*(.02+rng()*.18)));let members;
  if(t%2===0){
   const distances=this.points.map(()=>Infinity),remaining=new Set(this.active);members=[];distances[pivot]=0;
   for(let j=0;j<size;j++){let next=-1;for(const id of remaining)if(next<0||distances[id]<distances[next])next=id;remaining.delete(next);members.push(next);for(const e of this.incident[next]){const other=e.a===next?e.b:e.a;distances[other]=Math.min(distances[other],distances[next]+this.target(e));}}
  }else{
   members=current.points.map((p,id)=>({id,d:Math.hypot(...p.map((v,k)=>v-current.points[pivot][k]))})).sort((a,b)=>a.d-b.d).slice(0,size).map(p=>p.id);
  }
  const selected=new Set(members),mean=[0,0,0];for(const id of members)for(let k=0;k<3;k++)mean[k]+=current.points[id][k]/members.length;
  let normal=[rng()-.5,rng()-.5,rng()-.5];const length=Math.hypot(...normal)||1;normal=normal.map(v=>v/length);
  const shift=this.scale*(.1+rng()*.5)*(rng()-.5),offset=mean.reduce((sum,v,k)=>sum+v*normal[k],0)+shift,amplitude=this.scale*[.01,.04,.12,.3][t%4];
  const candidate=new Solver(this.data,this.seed);candidate.active=[...this.active];candidate.edges=this.edges;
  candidate.points=current.points.map((p,id)=>{if(!selected.has(id))return [...p];const distance=p.reduce((sum,v,k)=>sum+v*normal[k],0)-offset;return p.map((v,k)=>t%3===0?v+amplitude*(rng()-.5):v-2*distance*normal[k]+amplitude*(rng()-.5));});
  candidate.center();candidate.cost=candidate.energy(candidate.points);search.temperature=Math.max(1e-12,this.cost*.18*Math.pow(.03,t/63));this.annealCandidate=candidate;
 }
 stepAnnealing(){
  if(this.annealRestart){
   const candidate=this.annealRestart,search=this.annealing;candidate.step();this.iterations++;
   if(candidate.cost<this.cost){this.points=candidate.points.map(p=>[...p]);this.cost=candidate.cost;search.improvements++;}
   if(candidate.annealing){search.attempt=64+candidate.annealing.attempt;search.temperature=candidate.annealing.temperature;search.accepted=search.firstAccepted+candidate.annealing.accepted;search.uphillAccepted=search.firstUphill+candidate.annealing.uphillAccepted;}
   if(candidate.phase==='stable'){search.finished=true;this.annealRestart=null;this.phase='space';this.stablePasses=0;}
   return;
  }
  const candidate=this.annealCandidate,search=this.annealing;
  candidate.step();this.iterations++;
  // Uphill acceptance affects only the search trajectory. Keep the best fit
  // visible and interpolate it in the renderer, avoiding noisy frame jumps.
  if(candidate.cost<this.cost){this.points=candidate.points.map(p=>[...p]);this.cost=candidate.cost;search.improvements++;}
  if(candidate.iterations<400)return;
  const delta=candidate.cost-search.current.cost;
  if(delta<=0||this.annealRng()<Math.exp(-delta/search.temperature)){
   search.current={cost:candidate.cost,points:candidate.points.map(p=>[...p])};search.accepted++;if(delta>0)search.uphillAccepted++;
  }
  search.attempt++;
  // Revisit the incumbent every eight trials rather than losing a good basin
  // to a sequence of accepted worse proposals during the high-temperature phase.
  if(search.attempt%8===0)search.current={cost:this.cost,points:this.points.map(p=>[...p])};
  this.nextAnnealingTrial();
 }
 metrics(){const a=this.annealing;return {...super.metrics(),phase:this.phase,stable:this.phase==='stable',startMode:this.startMode,planeStress:this.planeStress,lift:this.lift,annealing:a?{attempt:a.attempt,trials:a.trials,restarts:a.restarts,accepted:a.accepted,uphillAccepted:a.uphillAccepted,improvements:a.improvements,initialCost:a.initialCost,temperature:a.temperature,finished:a.finished}:null};}
}

// Diagnostic sphere fit only. Never used to initialize or optimize coordinates.
export function fitSphere(points) {
 const ps=points.filter(Boolean);if(ps.length<6)return null;
 const m=Array.from({length:4},()=>Array(5).fill(0));
 for(const p of ps){const row=[2*p[0],2*p[1],2*p[2],1],b=p.reduce((s,v)=>s+v*v,0);for(let i=0;i<4;i++){for(let j=0;j<4;j++)m[i][j]+=row[i]*row[j];m[i][4]+=row[i]*b;}}
 for(let i=0;i<4;i++){let pivot=i;for(let j=i+1;j<4;j++)if(Math.abs(m[j][i])>Math.abs(m[pivot][i]))pivot=j;if(Math.abs(m[pivot][i])<1e-8)return null;[m[i],m[pivot]]=[m[pivot],m[i]];const q=m[i][i];for(let j=i;j<5;j++)m[i][j]/=q;for(let k=0;k<4;k++)if(k!==i){const factor=m[k][i];for(let j=i;j<5;j++)m[k][j]-=factor*m[i][j];}}
 const center=m.slice(0,3).map(row=>row[4]);const radius=Math.sqrt(Math.max(0,m[3][4]+center.reduce((s,v)=>s+v*v,0)));if(!Number.isFinite(radius)||radius<1e-6)return null;
 const cloudSize=Math.sqrt(ps.reduce((s,p)=>s+p.reduce((q,v)=>q+v*v,0),0)/ps.length);
 if(radius>cloudSize*3)return null; // A nearly flat sheet can fit a huge meaningless sphere.
 const spread=Math.sqrt(ps.reduce((s,p)=>s+(Math.hypot(...p.map((v,k)=>v-center[k]))-radius)**2,0)/ps.length)/radius;
 return {center,radius,spread};
}

export function parseCSV(text) {
 if(text.length>32_000_000)throw Error('CSV must be smaller than 32 MB.');
 // RFC-style quoted fields, escaped quotes and CRLF; reject malformed records.
 const rows=[];let row=[],field='',quoted=false,closed=false;
 for(let i=0;i<=text.length;i++){
  const c=i===text.length?'\n':text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field.trim()||closed)throw Error('Malformed CSV quotation.');quoted=true;continue;}
  if(c===','||c==='\n'||c==='\r'){
   row.push(field.trim());field='';closed=false;
   if(c!==','){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}
  }else{if(closed&&!/\s/.test(c))throw Error('Unexpected text after a quoted CSV field.');field+=c;}
 }
 if(quoted)throw Error('CSV has an unclosed quoted field.');
 const header=rows.shift()?.map(x=>x.replace(/^\uFEFF/,'').toLowerCase());
 if(!header)throw Error('CSV is empty.');
 const keys=['from_airport','to_airport','minutes'];const columns=keys.map(k=>header.indexOf(k));
 if(columns.some(i=>i<0))throw Error('Required columns: from_airport, to_airport, minutes.');
 const airports=new Map();const routes=[];
 for(let i=0;i<rows.length;i++){
  const row=rows[i];if(row.length!==header.length)throw Error(`Row ${i+2} has a different number of columns.`);
  const [from_airport,to_airport]=columns.slice(0,2).map(c=>row[c].toUpperCase());const minutes=Number(row[columns[2]]);
  if(!/^[A-Z0-9_-]{2,12}$/.test(from_airport)||!/^[A-Z0-9_-]{2,12}$/.test(to_airport))throw Error(`Row ${i+2}: use airport codes of 2–12 letters, numbers, underscores or hyphens.`);
  if(from_airport===to_airport||!Number.isFinite(minutes)||minutes<=0||minutes>2880)throw Error(`Row ${i+2}: route endpoints must differ and minutes must be between 0 and 2880.`);
  for(const id of [from_airport,to_airport])airports.set(id,{id,name:id});
  const aircraftColumn=header.indexOf('aircraft'),codeColumn=header.indexOf('aircraft_code');
  const aircraft=aircraftColumn>=0?row[aircraftColumn]:undefined,aircraft_code=codeColumn>=0?row[codeColumn]:undefined;
  routes.push({from_airport,to_airport,minutes,...(aircraft?{aircraft}:{}),...(aircraft_code?{aircraft_code}:{} )});
 }
 if(routes.length>100000)throw Error('Use at most 100,000 observations.');
 return prepare({airports:[...airports.values()],routes,title:'Your CSV',provider:'Uploaded CSV',description:'Uploaded duration observations. Optional aircraft and aircraft_code fields are retained for filtering. Geographic fields are ignored.'});
}
