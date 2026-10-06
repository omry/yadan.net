import {estimateOptimizationProgress} from './optimization-progress.js';
import {prepare, SpaceSolver, fitSphere, parseCSV} from './engine.js';
import {filterObservations} from './observations.js';
import {createSphereBenchmark,createPlaneBenchmark,fitPlane} from './benchmark.js';
import {convexHull} from './hull.js';
import {airportSurface} from './airport-surface.js';
import {projectPoint,hullFaces,occluded} from './view-geometry.js';
import {airportFlag} from './airport-flags.js';
import {selectAirportLabels} from './airport-view.js';
import {initialRotation,orbitRotation,rollRotation,focusRotation,cloudCenter} from './camera.js';
const flagImages=new Map();
function flagImage(id){
 const info=airportFlag(id);if(!info)return null;
 if(!flagImages.has(info.country)){const image=new Image();image.src=info.src;flagImages.set(info.country,image);}
 const image=flagImages.get(info.country);return image.complete&&image.naturalWidth?image:null;
}
function flagElement(id){
 const info=airportFlag(id);if(!info)return null;
 const image=document.createElement('img');image.src=info.src;image.alt=info.name+' flag';image.title=info.name;image.className='airport-flag';image.width=18;image.height=12;return image;
}

const $=id=>document.getElementById(id);
try{const saved=localStorage.getItem('time-space.flags');if(saved!==null)$('flags').checked=saved==='true';}catch{}
const canvas=$('scene'),visibleContext=canvas.getContext('2d'),buffer=document.createElement('canvas'),ctx=buffer.getContext('2d'),chart=$('chart'),cc=chart.getContext('2d');
const benchmark=createSphereBenchmark(),planeBenchmark=createPlaneBenchmark();
const isPlaneBenchmark=()=>sourceData===planeBenchmark.data;
let builtFlights,uploaded,sourceData,data,solver,running=false,selected=null,newest=null,elapsed=0;
let initialFitStress=0,optimizationPercent=0,revealedSelection=false;
let speed=1,rotation=initialRotation(),zoom=1,extent=7,width=800,height=500,dpr=1;
let projections=[],history=[],lastUI=0,lastTime=0,newAge=0,displayPoints=[],hull={faces:[],vertices:[],dimension:0},pointSeed=71;
let labelOffsets=new Map(),sceneLabelIDs=[],inspectionRows=[],pocketButtons=new Map();
function buildSurface(){return $('surface-mode').value==='airports'?airportSurface(displayPoints):convexHull(displayPoints);}
let visibleFaces=[],labelInfo=null,labelScope=new Set(),labelPreference='hubs',cameraCenter=[0,0,0];
function configureLabels(){
 const synthetic=!!data.synthetic;$('airport-view').disabled=synthetic;$('airport-view').value=synthetic?'all':labelPreference;
 labelInfo=selectAirportLabels(data,synthetic?'all':labelPreference);labelScope=new Set(labelInfo.indices);
 if(selected===null)selected=labelInfo.indices[0];
 labelOffsets.clear();
 $('hub-summary').textContent=synthetic?'All synthetic points and labels are shown for benchmark validation.':labelPreference==='hubs'?`All ${data.airports.length} airports form the cloud and surface. Text labels use the top 10% by distinct incoming connections: ${labelInfo.count} airports.`:`All ${data.airports.length} airports form the cloud and surface, with text labels available for every airport.`;
}

const state=()=>({...solver?.metrics(),running,dataset:data?.title,model:solver?.model,surfaceModel:$('surface-mode').value,surfaceRendering:isPlaneBenchmark()?'wireframe':'opaque',surfaceAirports:hull.vertices.map(id=>data?.airports[id]?.id).filter(Boolean),camera:{target:[...cameraCenter],rotation:[...rotation],zoom,extent,width,height},hullFaces:hull.faces.length,hullDimension:hull.dimension,airportView:'all',labelView:labelInfo?.mode,viewAirports:data?.airports.map(a=>a.id)??[],labelAirports:labelInfo?.indices.map(id=>data.airports[id].id)??[],hullAirports:hull.vertices.map(id=>data?.airports[id]?.id).filter(Boolean),hubRanking:labelInfo?.ranked.map(({id,incoming})=>({id,incoming})),showHidden:$('show-hidden').checked,flags:$('flags').checked,selectedLines:selectedLineCounts(),airportEdges:data?.airports.map((a,index)=>({airport:a.id,total:solver?.incident[index]?.length??0}))??[],selected:selected===null?null:data?.airports[selected]?.id,sceneLabels:sceneLabelIDs.map(id=>data?.airports[id]?.id).filter(Boolean),screenPoints:projections.map(p=>({airport:data.airports[p.id].id,x:p.x,y:p.y,hidden:p.hidden})),renderedPoints:projections.filter(pointIsShown).map(p=>data?.airports[p.id]?.id).filter(Boolean),visiblePoints:projections.filter(p=>!p.hidden).map(p=>data?.airports[p.id]?.id).filter(Boolean),hiddenPoints:projections.filter(p=>p.hidden).map(p=>data?.airports[p.id]?.id).filter(Boolean),randomSeed:pointSeed,seed:data?.airports[data.order[0]]?.id,filters:data?.filterInfo,newest:newest===null?null:data?.airports[newest]?.id,airports:solver?.active.map(i=>data.airports[i].id)??[]});
function notice(message,error=false){$('notice').textContent=message;$('notice').hidden=!message;$('notice').style.borderColor=error?'#ba7752':'';}
function start(nextData){
 data=nextData;solver=new SpaceSolver(data,pointSeed);
 history=[];inspectionRows=[];pocketButtons.clear();$('pocket-airports').replaceChildren();$('airport-search').value='';$('airport-tooltip').hidden=true;if($('inspection-dialog').open)$('inspection-dialog').close();selected=null;revealedSelection=false;newest=null;elapsed=0;newAge=0;displayPoints=[];projections=[];visibleFaces=[];hull={faces:[],vertices:[],dimension:0};labelOffsets.clear();
 solver.initializeAll($('start-mode').value,{anneal:$('anneal').checked});
 initialFitStress=solver.metrics().stress;optimizationPercent=0;
 displayPoints=solver.points.map(p=>p?[...p]:null);configureLabels();hull=buildSurface();cameraCenter=cloudCenter(displayPoints);
 extent=Math.max(3,...displayPoints.filter(Boolean).map(p=>Math.hypot(...p.map((v,k)=>v-cameraCenter[k]))))*1.1;
 history.push({value:solver.metrics().stress,newPoint:false});
 running=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const id of ['play','restart','shuffle'])$(id).disabled=false;
 $('load-error').hidden=true;$('dataset-label').textContent=`${data.airports.length} ${data.synthetic?'points':'airports'} · ${data.edges.length} distance constraints`;
 renderAirportList();renderSources();updateUI();
}
function updateAircraftOptions(){
 const hasAircraft=sourceData.routes.some(r=>r.aircraft||r.aircraft_code);
 $('aircraft-jets').disabled=!hasAircraft;
 if(!hasAircraft&&!sourceData.synthetic)$('aircraft-all').checked=true;
 $('aircraft-note').textContent=sourceData.synthetic?'Synthetic distances have no aircraft. Flight filters are disabled.':!hasAircraft?'Aircraft information is missing, so all flights are included. Add aircraft or aircraft_code fields to use Jets only.':'Jets only reduces the speed differences from mixing jets with slower propeller aircraft, making flight time a more consistent distance proxy. Winds, routing and airport overhead still add noise.';
}

function applyFilters(){
 if(!sourceData)return false;
 try{
  const synthetic=!!sourceData.synthetic;
  $('min-edges').disabled=synthetic;$('aircraft-filter').disabled=synthetic;$('triangle-filter').disabled=synthetic;$('short-weights').disabled=synthetic;
  $('mesh-label').textContent=isPlaneBenchmark()?'Wire mesh':'Surface';$('hull-edges').disabled=isPlaneBenchmark();
  const next=filterObservations(sourceData,{minHours:0,overheadMinutes:0,minEdges:synthetic?0:($('min-edges').value.trim()===''?NaN:Number($('min-edges').value)),aircraft:synthetic?'all':$('aircraft-jets').checked?'jets':'all',seedAirport:'SIN',triangleFilter:!synthetic&&$('triangle-filter').checked,shortWeights:!synthetic&&$('short-weights').checked});start(next);notice('');
  $('overhead-note').textContent=synthetic?'Exact synthetic distances are used unchanged.':'All durations are included. Scheduled times are averaged in each direction, then the two directions receive equal weight. No uniform overhead is subtracted. Audited corrections retain the provider’s original duration and evidence.';
  const policy=next.constraintPolicy;
  $('policy-summary').textContent=synthetic?'Flight policies disabled: exact distances unchanged.':`${policy.triangleFilter?`${policy.excludedEdges} edges excluded (${policy.excludedObservations} observations). Material triangle violations: ${policy.before.material} → ${policy.after.material}. ${policy.limitReached?'Safety limit of 50 exclusions reached; remaining contradictions need review.':'Remaining contradictions are isolated or protected by minimum connections.'}`:'Triangle filtering off.'} ${policy.shortWeights?`${policy.downweightedEdges} short edges downweighted; no times changed.`:'All retained edges have equal weight.'}`;
  $('export-exclusions').disabled=!next.excludedEdges.length;
  const f=next.filterInfo,twoWay=next.edges.filter(e=>e.twoWay).length;$('distance-label').textContent=synthetic?'Exact 3D pair distances':'Flight hours as 3D distance';$('filter-summary').textContent=synthetic?`All ${next.edges.length} exact pair distances. Flight filters are disabled for this benchmark.`:`${next.routes.length} / ${f.sourceObservations} eligible observations · ${next.airports.length} / ${f.sourceAirports} airports. No duration cutoff. Two-way averages: ${twoWay} pairs. One-way estimates: ${next.edges.length-twoWay} pairs. ${f.minEdges?`${f.insufficientConnectionsAirports} airports removed by the ≥${f.minEdges}-connection filter (${f.connectionPruningRounds} pruning rounds).`:'Minimum connections disabled.'} ${f.disconnectedObservations?'Disconnected flights excluded; using the largest connected network.':''} Changing filters restarts the fit.`;
  const weak=next.neighbors.filter(n=>n.size<4).length;
  $('shape-evidence').textContent=synthetic?`${next.airports.length} points · all ${next.edges.length} exact pair distances. Ground truth stays outside the optimizer.`:`${next.edges.length} measured pairs for ${3*next.airports.length-6} position degrees of freedom. ${weak} / ${next.airports.length} airports have fewer than four links. A low distance error does not determine a unique shape.`;
  $('benchmark-status').hidden=!synthetic;$('flight-settings').hidden=synthetic;
  return true;
 }catch(error){
  solver=null;data=null;labelInfo=null;labelScope.clear();projections=[];visibleFaces=[];sceneLabelIDs=[];hull={faces:[],vertices:[],dimension:0};inspectionRows=[];pocketButtons.clear();$('pocket-airports').replaceChildren();if($('inspection-dialog').open)$('inspection-dialog').close();$('hub-summary').textContent='Adjust filters to show a connected network.';running=false;newest=null;selected=null;history=[];$('airports').replaceChildren();$('selection').hidden=true;$('airport-inspector').hidden=true;$('airport-tooltip').hidden=true;$('provenance').textContent='No observations meet the current filters in a usable connected network.';$('source-list').replaceChildren();$('play').textContent='Resume';
  for(const id of ['play','restart','shuffle'])$(id).disabled=true;
  $('load-error').textContent=error.message;$('load-error').hidden=false;$('phase').textContent='No usable network';$('line-legend').hidden=true;$('hidden-legend').hidden=true;$('optimization-progress').dataset.state='idle';$('optimization-label').textContent='Optimization —';$('optimization-bar').style.width='0%';$('optimization-track').removeAttribute('aria-valuenow');$('optimization-track').setAttribute('aria-valuetext','No usable network');$('filter-summary').textContent=error.message;$('policy-summary').textContent='No active constraints.';$('export-exclusions').disabled=true;$('raw-error').textContent='';$('error-label').textContent='normalized distance error';
  $('airport-count').textContent='0';$('progress-text').textContent='0 airports';$('progress').style.width='0%';$('next-text').textContent='Adjust filters';$('dataset-label').textContent=sourceData.provider;
  $('stress').textContent='—';$('constraint-count').textContent='0';$('sphere-spread').textContent='—';$('iteration').textContent='0 steps';$('bend-status').textContent='';$('shape-evidence').textContent='';$('benchmark-status').hidden=true;drawChart();return false;
 }
}
$('min-edges').onchange=applyFilters;$('aircraft-all').onchange=applyFilters;$('aircraft-jets').onchange=applyFilters;$('triangle-filter').onchange=applyFilters;$('short-weights').onchange=applyFilters;
$('export-exclusions').onclick=()=>{if(!data)return;const audit={dataset:data.title,policy:data.constraintPolicy,excluded:data.excludedEdges.map(e=>({from_airport:data.airports[e.a].id,to_airport:data.airports[e.b].id,hours:e.hours,exclusion:e.exclusion,directions:e.directions,observations:e.observations}))};const url=URL.createObjectURL(new Blob([JSON.stringify(audit,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='excluded-distance-constraints.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('dataset').onchange=()=>{const wasSynthetic=!!sourceData?.synthetic;sourceData=$('dataset').value==='synthetic'?benchmark.data:$('dataset').value==='synthetic-plane'?planeBenchmark.data:$('dataset').value==='flights'?builtFlights:uploaded;if(wasSynthetic&&sourceData?.routes.some(r=>r.aircraft||r.aircraft_code))$('aircraft-jets').checked=true;updateAircraftOptions();applyFilters();};
function renderAirportList(){
 $('airports').replaceChildren();
 const active=new Set(solver.active);
 for(const index of data.order){
  const a=data.airports[index];if(!`${a.id} ${a.name}`.toLowerCase().includes($('airport-search').value.trim().toLowerCase()))continue;const button=document.createElement('button');button.type='button';button.className='airport-row';button.setAttribute('role','listitem');
  button.classList.toggle('pending',!active.has(index));button.classList.toggle('new',index===newest);button.classList.toggle('selected',index===selected);button.disabled=!active.has(index);
  const code=document.createElement('span');code.className='airport-code';code.textContent=a.id;
  const name=document.createElement('span');name.className='airport-name';name.textContent=a.name;
  const status=document.createElement('span');status.className='airport-state';status.textContent=`${solver.incident[index].length} edges`;status.title=`Distinct neighboring airports used in the fit. ${labelInfo.ranked.find(a=>a.index===index).incoming} incoming origins used for hub-label ranking.`;
  if($('flags').checked){const flag=flagElement(a.id);if(flag)button.append(flag);}
  button.append(code,name,status);button.onclick=()=>selectAirport(index,{reveal:true});$('airports').append(button);
 }
}

function pointIsShown(p){return !!p&&(!p.hidden||$('show-hidden').checked||(revealedSelection&&p.id===selected));}
function selectAirport(index,{reveal=false}={}){
 selected=index;revealedSelection=reveal;
 if(reveal){const center=cloudCenter(displayPoints);rotation=focusRotation(rotation,displayPoints[index].map((v,k)=>v-center[k]));}
 labelOffsets.delete(index);$('airport-tooltip').hidden=true;renderAirportList();buildInspection();updateUI();
}
function selectedLineCounts(){
 const edges=solver?.incident[selected]??[],projected=new Map(projections.map(p=>[p.id,p])),enabled=$('routes').checked;
 const visible=enabled?edges.filter(e=>pointIsShown(projected.get(e.a))&&pointIsShown(projected.get(e.b))).length:0;
 return {total:edges.length,visible,enabled};
}
$('airport-search').oninput=()=>{if(solver)renderAirportList();};
$('inspect-airport').onclick=()=>{if(selected===null)return;buildInspection();$('inspection-dialog').showModal();updateUI();};
$('inspection-close').onclick=()=>$('inspection-dialog').close();
function buildInspection(){
 inspectionRows=[];$('airport-constraints').replaceChildren();if(!solver||selected===null)return;
 const edges=[...(solver.incident[selected]??[])].sort((a,b)=>Math.abs(solver.residual(b)/b.hours)-Math.abs(solver.residual(a)/a.hours));
 const excluded=(data.excludedEdges??[]).filter(e=>e.a===selected||e.b===selected);
 for(const edge of [...edges,...excluded]){
  const other=edge.a===selected?edge.b:edge.a,row=document.createElement('tr'),cell=document.createElement('td'),details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent=`${data.airports[other].id} · ${data.airports[other].name} · ${solver.incident[other].length} total edges${edge.exclusion?' · EXCLUDED':''}`;details.append(summary);
  const weight=document.createElement('p');weight.textContent=edge.exclusion?`Excluded from optimization: ${edge.exclusion.count} material contradictions at removal. `+edge.exclusion.witnesses.map(w=>`Via ${w.via}: other targets sum to ${w.otherHours.reduce((s,h)=>s+h,0).toFixed(2)} h; excess ${(w.excessHours*60).toFixed(1)} min`).join(' · '):`Optimizer weight: ${(edge.weight??1).toFixed(3)} (1 = full influence).`;details.append(weight);
  const raw=document.createElement('p');raw.textContent=data.synthetic?`Target: ${edge.hours.toFixed(2)} h from exact synthetic measurements.`:`Target: ${edge.hours.toFixed(2)} h from scheduled durations, including audited corrections; no uniform overhead subtracted.`;details.append(raw);
  const records=document.createElement('p');records.textContent=`${edge.observations.length} ${edge.exclusion?'excluded':'retained'} ${data.synthetic?'measurements':'flight-time records'} ${edge.exclusion?'preserved for audit, not used in optimization':'used for this constraint'}.`;details.append(records);
  const direction=document.createElement('p');direction.textContent=edge.directions.map(d=>`${d.from_airport} → ${d.to_airport}: scheduled ${(d.minutes/60).toFixed(2)} h (${d.count} observation${d.count===1?'':'s'})`).join(' · ')+(edge.twoWay?' · Equal-weight two-way mean':' · One-way only');details.append(direction);
  for(const observation of edge.observations){const p=document.createElement('p');p.textContent=`${observation.from_airport} → ${observation.to_airport} · scheduled ${(observation.minutes/60).toFixed(2)} h${observation.original_minutes!==undefined?` (provider originally ${(observation.original_minutes/60).toFixed(2)} h; corrected against independent schedule)`:''} · ${observation.aircraft??observation.aircraft_code??'aircraft unknown'}${observation.flight_number?' · '+observation.flight_number:''}${observation.date?' · '+observation.date:''} `;
   if(observation.source){try{const url=new URL(observation.source);if(['https:','http:'].includes(url.protocol)){const a=document.createElement('a');a.href=url.href;a.textContent='Schedule source';a.target='_blank';a.rel='noopener noreferrer';p.append(a);}}catch{}}
   if(observation.verification_source){try{const url=new URL(observation.verification_source);if(url.protocol==='https:'){const a=document.createElement('a');a.href=url.href;a.textContent=' · Flight sequence: '+observation.verification_route;a.target='_blank';a.rel='noopener noreferrer';p.append(a);}}catch{}}
   if(observation.duration_verification_source){try{const url=new URL(observation.duration_verification_source);if(url.protocol==='https:'){const a=document.createElement('a');a.href=url.href;a.textContent=' · Duration correction evidence';a.target='_blank';a.rel='noopener noreferrer';p.append(a);}}catch{}}
   details.append(p);
  }
  cell.append(details);row.append(cell);const target=document.createElement('td'),fit=document.createElement('td'),error=document.createElement('td');target.textContent=edge.hours.toFixed(2);row.append(target,fit,error);$('airport-constraints').append(row);inspectionRows.push({edge,fit,error});
 }
}
function updateInspection(sphere){
 const edges=solver.incident[selected]??[],loss=edges.reduce((s,e)=>s+solver.residual(e)**2,0),norm=edges.reduce((s,e)=>s+e.hours**2,0),point=solver.points[selected];
 const ratio=sphere?Math.hypot(...point.map((v,k)=>v-sphere.center[k]))/sphere.radius:null;
 const shortest=edges.length?Math.min(...edges.map(e=>e.hours)):null;
 $('selected-fit').textContent=`Local unweighted distance error: ${(100*Math.sqrt(loss/(norm||1))).toFixed(2)}%${ratio!==null?' · Radius ratio: '+ratio.toFixed(2):''}. Radius is diagnostic only; no surface or sphere forces act on this point.${shortest!==null&&!data.synthetic?' Shortest measured connection: '+shortest.toFixed(2)+' h.'+(shortest>=3?' Only long links are retained here; a low error can still leave the position ambiguous.':''):''}`;
 for(const {edge,fit,error} of inspectionRows){const residual=solver.residual(edge),relative=residual/edge.hours;fit.textContent=(edge.hours+residual).toFixed(2);error.textContent=`${relative>=0?'+':''}${(100*relative).toFixed(1)}%`;error.style.color=Math.abs(relative)<=.05?'#6de2d3':Math.abs(relative)<=.15?'#e5ba70':'#cf7979';}
 if(!sphere){$('pocket-airports').replaceChildren();pocketButtons.clear();$('pocket-airports').textContent='Sphere diagnostic unavailable for this layout.';return;}
 const deepest=solver.points.map((p,index)=>({index,ratio:Math.hypot(...p.map((v,k)=>v-sphere.center[k]))/sphere.radius})).sort((a,b)=>a.ratio-b.ratio).slice(0,8);
 const keep=new Set(deepest.map(p=>p.index));for(const [index,button] of pocketButtons)if(!keep.has(index)){button.remove();pocketButtons.delete(index);}
 if(!pocketButtons.size)$('pocket-airports').replaceChildren();
 for(const {index,ratio} of deepest){let button=pocketButtons.get(index);if(!button){button=document.createElement('button');button.className='button small';button.onclick=()=>selectAirport(index,{reveal:true});pocketButtons.set(index,button);$('pocket-airports').append(button);}button.textContent=`${data.airports[index].id} ${ratio.toFixed(2)} · ${solver.incident[index].length} edges`;button.style.order=deepest.findIndex(p=>p.index===index);}
}

function renderSources(){
 const sourceData=data;
 $('provenance').textContent=sourceData.synthetic?sourceData.description:`${sourceData.routes.length} eligible flight-time observations from ${sourceData.provider}, retrieved ${sourceData.retrieved??'from your CSV'}. ${sourceData.description} ${sourceData.neighbors.filter(n=>n.size<4).length} airports have fewer than four observed links and are weakly constrained. ${sourceData.excludedEdges.length} inconsistent distance edges (${sourceData.constraintPolicy.excludedObservations} observations) are preserved here but excluded from optimization. Airport geographic coordinates are not retained. Unobserved airport pairs are not filled in.`;
 $('source-list').replaceChildren();
 const sources=new Map();
 for(const r of sourceData.routes){if(!r.source)continue;const entry=sources.get(r.source)??{...r,count:0};entry.count++;sources.set(r.source,entry);}
 for(const r of sources.values()){const link=document.createElement('a');link.textContent=`${r.from_airport} → ${r.to_airport} · ${r.count} eligible observations`;link.href=r.source;link.target='_blank';link.rel='noopener noreferrer';$('source-list').append(link);}

}
function updateUI(){
 if(!solver)return;const m=solver.metrics(),n=m.airports,total=data.airports.length;
 $('point-legend-label').textContent=data.synthetic?'Points':'Airports';$('selected-legend-label').textContent=data.synthetic?'Selected point':'Selected airport';
 $('line-legend').hidden=selectedLineCounts().visible===0;
 $('hidden-legend').hidden=!projections.some(p=>p.hidden&&pointIsShown(p));
 const candidate=solver.annealRestart?.annealCandidate??solver.annealCandidate;
 optimizationPercent=Math.max(optimizationPercent,estimateOptimizationProgress(m,initialFitStress,solver.annealEnabled&&!data.synthetic,(candidate?.iterations??0)/400));
 const percent=Math.floor(optimizationPercent),progressState=m.stable?'complete':running?'running':'paused';
 $('optimization-progress').dataset.state=progressState;
 $('optimization-label').textContent=`Optimization ${percent}%`;
 $('optimization-bar').style.width=`${optimizationPercent}%`;
 $('optimization-track').setAttribute('aria-valuenow',String(percent));
 $('optimization-track').setAttribute('aria-valuetext',`${percent}% · ${m.stable?'Settled':running?'Optimizing':'Paused'} · estimated progress`);
 $('stress').textContent=(m.stress*100).toFixed(data.synthetic?3:1)+'%';$('constraint-count').textContent=m.edges;
 $('error-label').textContent=data.constraintPolicy.shortWeights?'weighted normalized distance error':'normalized distance error';
 $('raw-error').textContent=data.synthetic?'':`Unweighted: ${(m.unweightedStress*100).toFixed(2)}% retained · ${(m.allObservedStress*100).toFixed(2)}% all eligible edges (including exclusions).`;
 $('iteration').textContent=m.iterations.toLocaleString()+' steps';$('airport-count').textContent=String(total);
 const sphere=fitSphere(solver.points),plane=isPlaneBenchmark()?fitPlane(solver.points):null;
 $('sphere-spread').textContent=plane?(plane.spread*100).toFixed(2)+'%':sphere?(sphere.spread*100).toFixed(1)+'%':'—';
 $('shape-stat-label').textContent=isPlaneBenchmark()?'plane thickness':'radial variation';
 $('radial-help').hidden=isPlaneBenchmark();
 $('sphere-spread').title=isPlaneBenchmark()?'RMS distance from a best-fit plane / RMS cloud radius. Diagnostic only; points are never flattened.':`Best-fit sphere radius deviation of all ${total} fitted airports. Label selection does not affect this diagnostic.`;
 $('progress-text').textContent=`${n} / ${total} airports`;$('progress').style.width=`${100*n/total}%`;
 $('next-text').textContent=m.stable?'Settled':m.phase==='anneal'?`Annealing ${m.annealing.attempt+1}/${m.annealing.trials}`:m.phase==='plane'?'Fitting plane':'Fitting 3D';
 $('phase').textContent=(!running&&!m.stable?'Paused · ':'')+(m.stable?`Settled · ${m.annealing?.finished?`${m.annealing.attempt} annealing trials complete`:'local fit'}`:m.phase==='anneal'?`Annealing · trial ${m.annealing.attempt+1} / ${m.annealing.trials} · best fit shown`:m.phase==='plane'?`Fitting ${n} points on the plane`:`Fitting ${n} points in 3D`);
 $('bend-status').textContent=`${$('surface-mode').value==='airports'?'All-airport surface':'Convex envelope'} · ${hull.vertices.length} / ${total} airport vertices · ${hull.faces.length} facets${m.lift?` · plane fit ${(m.planeStress*100).toFixed(1)}% → 3D`:''}`;
 $('play').textContent=running?'Pause':'Resume';$('play').setAttribute('aria-pressed',String(running));$('play').disabled=m.stable;
 if(data.synthetic){
  if(isPlaneBenchmark()){
   const recovered=plane&&m.stress<.01&&plane.spread<.01;
   $('benchmark-status').textContent=recovered?'Flat shape recovered from distances. No plane constraint.':m.stable?'Settled · plane recovery not reached.':'Reconstructing a flat shape from distances. Coordinates withheld.';
  }else{const radiusError=sphere?Math.abs(sphere.radius-benchmark.truth.radius)/benchmark.truth.radius:null,recovered=sphere&&m.stress<.01&&sphere.spread<.01&&radiusError<.01;
   $('benchmark-status').textContent=recovered?'Sphere recovered from distances. No sphere constraint.':m.stable?'Settled · sphere recovery not reached.':'Reconstructing a sphere from distances. Coordinates withheld.';
  }
 }
 if(selected!==null&&solver.points[selected]){
  const a=data.airports[selected],p=solver.points[selected];$('selection').hidden=false;$('selected-name').replaceChildren();if($('flags').checked){const flag=flagElement(a.id);if(flag)$('selected-name').append(flag,document.createTextNode(' '));}$('selected-name').append(document.createTextNode(`${a.id} · ${a.name} · ${solver.incident[selected].length} total edges`));
  $('coordinates').replaceChildren();for(let k=0;k<3;k++){const s=document.createElement('span'),label=document.createElement('small');label.textContent=['X','Y','Z'][k];s.append(label,document.createTextNode(p[k].toFixed(3)));$('coordinates').append(s);}
  const edges=solver.incident[selected]??[],lines=selectedLineCounts();$('inspection-context').textContent=`Inspecting ${a.id} · ${edges.length} total edges`;$('airport-inspector').hidden=false;$('inspector-name').textContent=`${a.id} · ${a.name}`;$('inspector-summary').textContent=`${edges.length} total edges · ${lines.enabled?`${lines.visible}/${lines.total} lines visible`:'lines off'}${projections.find(p=>p.id===selected)?.hidden?' · airport occluded':''}`;$('inspector-summary').title='Every retained connection is used in optimization, including lines hidden by the surface.';$('selected-detail').textContent=`Free 3D position · ${edges.length} measured constraints · ${hull.vertices.includes(selected)?'on the displayed surface':'inside the convex envelope'}. ${projections.find(p=>p.id===selected)?.hidden?(revealedSelection?'Behind the surface; the selected marker and label are shown through it.':$('show-hidden').checked?'Hidden behind the surface in this view.':'Hidden in this view. Enable Show hidden to display it.'):'Visible in this view.'} All retained constraints are listed below, including hidden lines.`;
  if($('inspection-dialog').open)updateInspection(sphere);
 }
 drawChart();
}
function showMethod(){ $('method').open=true;$('method').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); }
$('method-open').onclick=showMethod;$('data-open').onclick=()=>{showMethod();$('data-sources').open=true;};$('radial-help').onclick=showMethod;
$('play').onclick=()=>{if(!solver)return;running=!running;updateUI();};
$('restart').onclick=applyFilters;
$('shuffle').onclick=()=>{pointSeed=(pointSeed+1)>>>0;applyFilters();};
$('start-mode').onchange=applyFilters;
$('anneal').onchange=applyFilters;
$('surface-mode').onchange=()=>{if(solver){hull=buildSurface();visibleFaces=[];updateUI();}};
$('airport-view').onchange=()=>{labelPreference=$('airport-view').value;if(solver){configureLabels();renderAirportList();updateUI();}};
$('flags').onchange=()=>{try{localStorage.setItem('time-space.flags',String($('flags').checked));}catch{}labelOffsets.clear();if(solver){renderAirportList();updateUI();}};
$('show-hidden').onchange=()=>{labelOffsets.clear();$('hidden-legend').hidden=!$('show-hidden').checked;updateUI();};
$('routes').onchange=()=>updateUI();
$('speed').onchange=()=>{speed=Number($('speed').value);};
document.querySelectorAll('.panel-details').forEach(panel=>panel.addEventListener('toggle',()=>{resize();drawChart();}));
$('view-reset').onclick=()=>{rotation=initialRotation();zoom=1;};
$('csv-format-open').onclick=()=>$('csv-format-dialog').showModal();
$('csv-format-close').onclick=()=>$('csv-format-dialog').close();
$('csv-format-import').onclick=()=>{$('csv-format-dialog').close();$('import').click();};
$('import').onclick=()=>{$('file').value='';$('file').click();};
$('file').onchange=async()=>{
 const file=$('file').files[0];if(!file)return;
 try{if(file.size>32_000_000)throw Error('CSV must be smaller than 32 MB.');uploaded=parseCSV(await file.text());sourceData=uploaded;let option=$('dataset').querySelector('[value=csv]');if(!option){option=document.createElement('option');option.value='csv';$('dataset').append(option);}option.textContent=file.name;$('dataset').value='csv';updateAircraftOptions();if(applyFilters())notice(`Loaded ${data.airports.length} airports and ${data.edges.length} pair constraints after filtering. Your file stays in this browser.`);}
 catch(error){notice(error.message,true);}
};
$('builtin').onclick=()=>{sourceData=builtFlights;$('dataset').value='flights';$('aircraft-jets').checked=true;$('min-edges').value='4';updateAircraftOptions();applyFilters();};

function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);const w=Math.round(width*dpr),h=Math.round(height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;buffer.width=w;buffer.height=h;ctx.setTransform(dpr,0,0,dpr,0,0);labelOffsets.clear();}const cw=Math.round(chart.clientWidth*dpr),ch=Math.round(chart.clientHeight*dpr);if(chart.width!==cw||chart.height!==ch){chart.width=cw;chart.height=ch;cc.setTransform(dpr,0,0,dpr,0,0);}}
new ResizeObserver(resize).observe(canvas);new ResizeObserver(resize).observe(chart);
function project(p){return projectPoint(p.map((v,k)=>v-cameraCenter[k]),{rotation,extent,width,height,zoom});}
function line(a,b,color,lineWidth=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
function drawHull(){
 for(const face of visibleFaces){
  const ps=face.points,near=ps.reduce((best,p,i)=>p.z>ps[best].z?i:best,0),far=ps.reduce((best,p,i)=>p.z<ps[best].z?i:best,0);
  const color=shade=>`rgb(${Math.round(20+54*shade)},${Math.round(45+165*shade)},${Math.round(55+149*shade)})`;
  let fill=color(face.shades[0]);
  if(Math.hypot(ps[near].x-ps[far].x,ps[near].y-ps[far].y)>1){
   fill=ctx.createLinearGradient(ps[far].x,ps[far].y,ps[near].x,ps[near].y);
   fill.addColorStop(0,color(face.shades[far]));fill.addColorStop(1,color(face.shades[near]));
  }
  ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);ctx.lineTo(ps[1].x,ps[1].y);ctx.lineTo(ps[2].x,ps[2].y);ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();
  // Cover antialias seams without introducing transparent cracks.
  ctx.strokeStyle=fill;ctx.lineWidth=.6;ctx.stroke();
  if($('hull-edges').checked){ctx.strokeStyle='rgba(184,238,229,.35)';ctx.lineWidth=.7;ctx.stroke();}
 }
}
function drawWireMesh(projected){
 // Include both sides, drawing shared edges only once. This transparent mesh
 // never occludes a point or label and uses the same fitted XYZ positions.
 const drawn=new Set();
 for(const [a,b,c] of hull.faces)for(const [i,j] of [[a,b],[b,c],[c,a]]){
  const key=[Math.min(i,j),Math.max(i,j)].join(':');if(drawn.has(key))continue;drawn.add(key);
  const p=projected[i],q=projected[j];if(!p||!q)continue;
  const depth=Math.max(0,Math.min(1,.5+(p.z+q.z)/(4*extent)));
  line(p,q,`rgba(109,226,211,${.12+.22*depth})`,.8);
 }
}
function drawSelectedConstraints(){
 if(selected===null||!$('routes').checked)return;
 const projected=new Map(projections.map(p=>[p.id,p]));
 if(!pointIsShown(projected.get(selected)))return;
 // Colors reflect the displayed 3D separation, including animation smoothing.
 // Use a fixed relative-error scale so a line only turns green as its fit improves.
 for(const edge of solver.incident[selected]??[]){
  if(!projected.has(edge.a)||!projected.has(edge.b))continue;
  if(!pointIsShown(projected.get(edge.a))||!pointIsShown(projected.get(edge.b)))continue;
  const a=displayPoints[edge.a],b=displayPoints[edge.b],target=solver.target(edge);
  const error=Math.abs(Math.hypot(...a.map((v,k)=>v-b[k]))-target)/target;
  const green=[109,226,211],amber=[229,186,112],red=[207,121,121];
  const low=error<=.15?green:amber,high=error<=.15?amber:red;
  const mix=error<=.15?Math.max(0,(error-.05)/.10):Math.min(1,(error-.15)/.20);
  const rgb=low.map((v,k)=>Math.round(v+(high[k]-v)*mix));
  const throughHull=$('mesh').checked&&!isPlaneBenchmark()&&hull.dimension===3;
  ctx.setLineDash(throughHull?[7,3]:[]);
  // A dark rim preserves the error color against bright surface facets.
  line(projected.get(edge.a),projected.get(edge.b),'rgba(7,18,27,.6)',3.5);
  line(projected.get(edge.a),projected.get(edge.b),`rgba(${rgb.join(',')},.95)`,1.7);
  ctx.setLineDash([]);
 }
}
let drawDelta=1/60;
function draw(){
 ctx.clearRect(0,0,width,height);if(!solver){visibleContext.clearRect(0,0,canvas.width,canvas.height);return;}
 // Interpolate free XYZ positions, then recompute the surface from those
 // exact displayed positions. The rendered surface never feeds back into fitting.
 let moving=false;const blend=1-Math.exp(-12*Math.max(.001,drawDelta));
 for(const id of solver.active)for(let k=0;k<3;k++){
  const difference=solver.points[id][k]-displayPoints[id][k];
  if(Math.abs(difference)>1e-6){moving=true;displayPoints[id][k]+=difference*blend;}else displayPoints[id][k]=solver.points[id][k];
 }
 if(moving||!hull.faces.length){hull=buildSurface();}
 cameraCenter=cloudCenter(displayPoints);
 const max=Math.max(3,...displayPoints.filter(Boolean).map(p=>Math.hypot(...p.map((v,k)=>v-cameraCenter[k]))));extent+=(max*1.1-extent)*.018;
 projections=data.order.map(id=>({...project(displayPoints[id]),id,hidden:false}));
 const projected=[];for(const p of projections)projected[p.id]=p;for(const vertex of hull.extraVertices??[])projected[vertex.id]=project(vertex.position);
 visibleFaces=hullFaces(hull,projected,extent);
 if($('mesh').checked){
  if(isPlaneBenchmark())drawWireMesh(projected);
  else{for(const p of projections)p.hidden=occluded(p,visibleFaces,extent);drawHull();}
 }
 drawSelectedConstraints();
 const labelBoxes=[];
 for(const p of [...projections].sort((a,b)=>Number(a.id===selected)-Number(b.id===selected)||Number(b.hidden)-Number(a.hidden)||a.z-b.z)){
  if(!pointIsShown(p))continue;
  const chosen=p.id===selected,r=(chosen?4:2.5)*Math.max(.85,p.scale);
  if(p.hidden){
   ctx.globalAlpha=chosen?.85:.55;ctx.setLineDash([2,2]);ctx.beginPath();ctx.arc(p.x,p.y,r+1,0,Math.PI*2);
   ctx.strokeStyle=chosen?'#ffb274':'#b3c3cf';ctx.lineWidth=1.1;ctx.stroke();ctx.setLineDash([]);
   if(chosen){ctx.beginPath();ctx.arc(p.x,p.y,r+4,0,Math.PI*2);ctx.strokeStyle='#ffb274';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
  }else{
   ctx.globalAlpha=1;
   if(chosen){ctx.beginPath();ctx.arc(p.x,p.y,r+5,0,Math.PI*2);ctx.fillStyle='#ffb27430';ctx.fill();ctx.strokeStyle='#0a111b';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#ffb274';ctx.lineWidth=2;ctx.stroke();}
   ctx.beginPath();ctx.arc(p.x,p.y,r+1.5,0,Math.PI*2);ctx.fillStyle='#10252e';ctx.fill();
   ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=chosen?'#ffb274':'#a3fff0';ctx.fill();
  }
  if($('flags').checked){const flag=flagImage(data.airports[p.id].id);if(flag){
   ctx.globalAlpha=p.hidden?(chosen?.85:.55):1;p.flagBox={x:p.x+r+9,y:p.y-6,w:18,h:12};
   ctx.drawImage(flag,p.flagBox.x,p.flagBox.y,p.flagBox.w,p.flagBox.h);labelBoxes.push(p.flagBox);
  }}
  ctx.globalAlpha=1;
 }
 sceneLabelIDs=[];if($('labels').checked||selected!==null){
  const priority=p=>(p.id===selected?1000:0)+(p.hidden?0:200)+p.z/extent;
  const ordered=projections.filter(p=>p.id===selected||$('labels').checked&&labelScope.has(p.id)).sort((a,b)=>priority(b)-priority(a));
  for(const p of ordered){
   if(!pointIsShown(p))continue;
   ctx.font=`${p.hidden?'italic 400':'500'} 13px "Space Grotesk", sans-serif`;const id=data.airports[p.id].id,text=id,w=ctx.measureText(text).width;let box;

   const old=labelOffsets.get(p.id),options=[...(old?[old]:[]),[p.flagBox?40:14,-9],[p.flagBox?40:14,17],[-w-14,-9],[-w-14,17],[p.flagBox?40:14,-27],[-w-14,35]];
   for(const [dx,dy] of options){const b={x:p.x+dx,y:p.y+dy-12,w:w+4,h:18};if(b.x<255&&b.y<90||b.x<8||b.x+w>width-8||b.y<(p.id===selected?8:60)||b.y>height-(p.id===selected?24:70))continue;if(!labelBoxes.some(a=>b.x<a.x+a.w+3&&b.x+b.w+3>a.x&&b.y<a.y+a.h+3&&b.y+b.h+3>a.y)){box=b;labelOffsets.set(p.id,[dx,dy]);break;}}
   // In crowded areas keep dots visible; labels get space in priority order.
   if(!box&&p.id===selected)box={x:Math.max(8,Math.min(width-w-10,p.x+14)),y:Math.max(8,Math.min(height-24,p.y-21)),w:w+4,h:18};
   if(!box)continue;labelBoxes.push(box);sceneLabelIDs.push(p.id);
   ctx.globalAlpha=p.hidden?(p.id===selected?.85:.62):1;
   ctx.fillStyle=p.hidden?'#0c192b9c':'#0b141ce8';ctx.fillRect(box.x-3,box.y-1,box.w+5,box.h);
   ctx.fillStyle=p.id===selected?'#ffcc99':p.hidden?'#b6c3d5':'#dcfff8';ctx.fillText(text,box.x,box.y+12);
   if(p.hidden){ctx.setLineDash([1,3]);line({x:box.x,y:box.y+16},{x:box.x+w,y:box.y+16},ctx.fillStyle,.7);ctx.setLineDash([]);}
   ctx.globalAlpha=1;
  }
 }
 visibleContext.clearRect(0,0,canvas.width,canvas.height);visibleContext.drawImage(buffer,0,0);
}
function drawChart(){
 const w=chart.clientWidth,h=chart.clientHeight;cc.clearRect(0,0,w,h);if(history.length<2)return;
 const values=history.slice(-240),max=Math.max(.025,...values.map(p=>p.value))*1.1;
 for(let i=1;i<3;i++){cc.beginPath();cc.moveTo(0,h*i/3);cc.lineTo(w,h*i/3);cc.strokeStyle='#243440';cc.lineWidth=.6;cc.stroke();}
 cc.beginPath();values.forEach((p,i)=>{const x=i/(values.length-1)*w,y=h-4-p.value/max*(h-8);i?cc.lineTo(x,y):cc.moveTo(x,y);});cc.strokeStyle='#6de2d3';cc.lineWidth=1.4;cc.stroke();cc.lineTo(w,h);cc.lineTo(0,h);cc.closePath();const fill=cc.createLinearGradient(0,0,0,h);fill.addColorStop(0,'#6de2d32b');fill.addColorStop(1,'#6de2d300');cc.fillStyle=fill;cc.fill();
 values.forEach((p,i)=>{if(p.newPoint){const x=i/(values.length-1)*w;cc.beginPath();cc.moveTo(x,0);cc.lineTo(x,h);cc.strokeStyle='#ffb27450';cc.lineWidth=.7;cc.stroke();}});
}
function airportHit(clientX,clientY){
 const rect=canvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;
 return projections.filter(pointIsShown).map(p=>{const f=p.flagBox,onFlag=f&&x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h;return {p,d:onFlag?0:Math.hypot(p.x-x,p.y-y)};}).filter(hit=>hit.d<14).sort((a,b)=>a.d-b.d||b.p.z-a.p.z)[0]?.p;
}
let pointers=new Map(),gesture=null,moved=false,pointerOrigin=null;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;if(e.button===2)e.preventDefault();canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pointerOrigin={x:e.clientX,y:e.clientY};moved=pointers.size>1||e.button===2;gesture=null;$('airport-tooltip').hidden=true;});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)){
  const hit=airportHit(e.clientX,e.clientY),tip=$('airport-tooltip');tip.hidden=!hit;if(hit){const airport=data.airports[hit.id],rect=canvas.parentElement.getBoundingClientRect();tip.textContent=`${airport.id} · ${airport.name} · ${solver.incident[hit.id].length} total edges${hit.hidden?' · hidden':''}`;tip.style.left=Math.max(8,Math.min(rect.width-220,e.clientX-rect.left+16))+'px';tip.style.top=(e.clientY-rect.top+18)+'px';}return;
 }
 const prev=pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointerOrigin&&Math.hypot(e.clientX-pointerOrigin.x,e.clientY-pointerOrigin.y)>4)moved=true;
 if(pointers.size===2){moved=true;const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);if(gesture)zoom=Math.max(.4,Math.min(3,zoom*dist/gesture));gesture=dist;}else if(e.buttons&2){moved=true;rotation=rollRotation(rotation,dx);}else{rotation=orbitRotation(rotation,dx,dy);}
});
canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);gesture=null;if(e.button===0&&!moved&&solver){const hit=airportHit(e.clientX,e.clientY);if(hit)selectAirport(hit.id);}});
canvas.addEventListener('pointerleave',()=>$('airport-tooltip').hidden=true);
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;$('airport-tooltip').hidden=true;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(3,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')rotation=orbitRotation(rotation,-20,0);if(e.key==='ArrowRight')rotation=orbitRotation(rotation,20,0);if(e.key==='ArrowUp')rotation=orbitRotation(rotation,0,-20);if(e.key==='ArrowDown')rotation=orbitRotation(rotation,0,20);if(e.key==='+'||e.key==='=')zoom=Math.min(3,zoom*1.1);if(e.key==='-')zoom=Math.max(.4,zoom/1.1);}});
function frame(time){
 const delta=Math.min(.05,(time-lastTime)/1000||0);lastTime=time;drawDelta=delta;
 if(solver&&running){
  const dt=delta*speed;elapsed+=dt;newAge+=dt;
  // A modest step rate makes convergence visible; work stays bounded per frame.
  const deadline=performance.now()+5,steps=Math.max(1,Math.round(dt*900));
  for(let i=0;i<steps&&performance.now()<deadline;i++){
   solver.step();if(solver.phase==='stable'){running=false;break;}
  }

 }
 draw();if(solver&&time-lastUI>250){if(running){history.push({value:solver.metrics().stress,newPoint:false});if(history.length>1000)history.shift();}updateUI();lastUI=time;}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
try{
 const res=await fetch('flights.json');if(!res.ok)throw Error('Flight-time dataset could not be loaded.');const snapshot=await res.json();if(snapshot.route_files){snapshot.routes=(await Promise.all(snapshot.route_files.map(async file=>{if(!/^flight-observations-\d{3}\.json$/.test(file))throw Error('Invalid observation asset.');const response=await fetch(file);if(!response.ok)throw Error('Nonstop observations could not be loaded.');return response.json();}))).flat();}builtFlights=prepare(snapshot);sourceData=builtFlights;$('dataset').value='flights';updateAircraftOptions();applyFilters();
}catch(e){$('load-error').hidden=false;$('load-error').textContent=e.message+' You can still import your own CSV.';$('phase').textContent='Dataset unavailable';}

// Optional native browser tool interface, using exactly the same visible actions.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const tools=[
  {name:'read_reconstruction',description:'Read the airport reconstruction state and live fit.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>state()},
  {name:'set_reconstruction_playback',description:'Pause or resume the free 3D point distance optimization.',inputSchema:{type:'object',properties:{running:{type:'boolean'}},required:['running'],additionalProperties:false},execute:input=>{if(!solver)throw Error('Dataset is not loaded.');if(typeof input?.running!=='boolean')throw Error('running must be a boolean.');running=input.running&&solver.phase!=='stable';updateUI();return state();}}
 ];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
