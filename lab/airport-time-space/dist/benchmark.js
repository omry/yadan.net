// Ground truth is generated here for validation, and never sent to the solver.
export function createSphereBenchmark(count=24,radius=6){
 const truth=Array.from({length:count},(_,i)=>{
  const z=1-2*(i+.5)/count,angle=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-z*z);
  return {id:`S${String(i+1).padStart(2,'0')}`,position:[radius*r*Math.cos(angle),radius*r*Math.sin(angle),radius*z]};
 });
 const airports=truth.map(p=>({id:p.id,name:`Synthetic point ${p.id.slice(1)}`})),routes=[];
 for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)routes.push({from_airport:truth[i].id,to_airport:truth[j].id,minutes:60*Math.hypot(...truth[i].position.map((v,k)=>v-truth[j].position[k]))});
 return {data:{airports,routes,synthetic:true,title:'Known-sphere benchmark',provider:'Synthetic exact distances',description:`${count} labeled points generated on a sphere. Every pair has an exact straight-line distance. Values are encoded as minutes for the existing importer; these are fabricated measurements, not flight times. True coordinates are withheld from the optimizer.`},truth:{radius,points:truth}};
}

export function createPlaneBenchmark(count=24,radius=6){
 // A disk with boundary and interior points. Only the exact pair distances
 // leave this module; no plane normal, radius or coordinates reach the solver.
 const truth=Array.from({length:count},(_,i)=>{
  const angle=i*Math.PI*(3-Math.sqrt(5)),r=i<8?radius:radius*Math.sqrt((i-7)/(count-7))*.8;
  return {id:`P${String(i+1).padStart(2,'0')}`,position:[r*Math.cos(angle),r*Math.sin(angle),0]};
 });
 const airports=truth.map(p=>({id:p.id,name:`Synthetic point ${p.id.slice(1)}`})),routes=[];
 for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)routes.push({from_airport:truth[i].id,to_airport:truth[j].id,minutes:60*Math.hypot(...truth[i].position.map((v,k)=>v-truth[j].position[k]))});
 return {data:{airports,routes,synthetic:true,title:'Known-plane benchmark',provider:'Synthetic exact distances',description:`${count} labeled points generated on a flat disk. Every pair has an exact straight-line distance. Coordinates are withheld; the same free 3D optimizer must discover the flat shape from distances alone.`},truth:{points:truth}};
}

// Diagnostic only: never flattens positions or guides optimization.
export function fitPlane(points){
 const ps=points.filter(Boolean);if(ps.length<3)return null;
 const center=[0,1,2].map(k=>ps.reduce((s,p)=>s+p[k],0)/ps.length),m=Array.from({length:3},()=>[0,0,0]),axes=[[1,0,0],[0,1,0],[0,0,1]];
 for(const p of ps){const v=p.map((x,k)=>x-center[k]);for(let i=0;i<3;i++)for(let j=0;j<3;j++)m[i][j]+=v[i]*v[j]/ps.length;}
 const total=m[0][0]+m[1][1]+m[2][2];if(total<1e-20)return null;
 for(let pass=0;pass<30;pass++){
  let a=0,b=1;for(const [i,j] of [[0,2],[1,2]])if(Math.abs(m[i][j])>Math.abs(m[a][b])){a=i;b=j;}
  if(Math.abs(m[a][b])<total*1e-14)break;
  const angle=.5*Math.atan2(2*m[a][b],m[b][b]-m[a][a]),c=Math.cos(angle),s=Math.sin(angle),aa=m[a][a],bb=m[b][b],ab=m[a][b];
  for(let k=0;k<3;k++)if(k!==a&&k!==b){const x=m[k][a],y=m[k][b];m[k][a]=m[a][k]=c*x-s*y;m[k][b]=m[b][k]=s*x+c*y;}
  m[a][a]=c*c*aa-2*s*c*ab+s*s*bb;m[b][b]=s*s*aa+2*s*c*ab+c*c*bb;m[a][b]=m[b][a]=0;
  for(let k=0;k<3;k++){const x=axes[k][a],y=axes[k][b];axes[k][a]=c*x-s*y;axes[k][b]=s*x+c*y;}
 }
 let smallest=0;for(let i=1;i<3;i++)if(m[i][i]<m[smallest][smallest])smallest=i;
 const rmsThickness=Math.sqrt(Math.max(0,m[smallest][smallest])),rmsRadius=Math.sqrt(total);
 return {center,normal:axes.map(row=>row[smallest]),rmsThickness,rmsRadius,spread:rmsThickness/rmsRadius};
}
