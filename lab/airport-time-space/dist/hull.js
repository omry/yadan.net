// Incremental convex hull. It consumes displayed positions only and has no
// influence on distance optimization. IDs refer to indices in the input array.
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function convexHull(points){
 const ids=points.flatMap((p,id)=>p?.every(Number.isFinite)?[id]:[]);
 if(ids.length<3)return {faces:[],dimension:ids.length<2?0:1,vertices:ids};
 const scale=Math.max(1,...[0,1,2].map(k=>Math.max(...ids.map(id=>points[id][k]))-Math.min(...ids.map(id=>points[id][k])))),epsilon=scale*1e-8;
 const a=ids[0];let b=a,max=0;
 for(const id of ids){const d=Math.hypot(...sub(points[id],points[a]));if(d>max){max=d;b=id;}}
 if(max<epsilon)return {faces:[],dimension:0,vertices:[a]};
 const ab=sub(points[b],points[a]);let c=a;max=0;
 for(const id of ids){const d=Math.hypot(...cross(ab,sub(points[id],points[a])))/Math.hypot(...ab);if(d>max){max=d;c=id;}}
 if(max<epsilon)return {faces:[],dimension:1,vertices:[a,b]};
 const normal=cross(ab,sub(points[c],points[a])),length=Math.hypot(...normal);let d=a;max=0;
 for(const id of ids){const distance=Math.abs(dot(normal,sub(points[id],points[a])))/length;if(distance>max){max=distance;d=id;}}
 if(max<epsilon){
  const axis=normal.map(v=>Math.abs(v)).indexOf(Math.max(...normal.map(v=>Math.abs(v)))),axes=[0,1,2].filter(k=>k!==axis);
  const sorted=[...ids].sort((i,j)=>points[i][axes[0]]-points[j][axes[0]]||points[i][axes[1]]-points[j][axes[1]]);
  const turn=(i,j,k)=>(points[j][axes[0]]-points[i][axes[0]])*(points[k][axes[1]]-points[i][axes[1]])-(points[j][axes[1]]-points[i][axes[1]])*(points[k][axes[0]]-points[i][axes[0]]);
  const chain=list=>{const h=[];for(const id of list){while(h.length>=2&&turn(h.at(-2),h.at(-1),id)<=epsilon*scale)h.pop();h.push(id);}return h;};
  const lower=chain(sorted),upper=chain([...sorted].reverse()),boundary=[...lower.slice(0,-1),...upper.slice(0,-1)];
  const faces=[];for(let i=1;i<boundary.length-1;i++)faces.push([boundary[0],boundary[i],boundary[i+1]]);
  return {faces,dimension:2,vertices:boundary};
 }
 const inside=[0,1,2].map(k=>(points[a][k]+points[b][k]+points[c][k]+points[d][k])/4);
 const face=(i,j,k)=>{let t=[i,j,k],n=cross(sub(points[j],points[i]),sub(points[k],points[i]));if(dot(n,sub(inside,points[i]))>0){t=[i,k,j];n=n.map(v=>-v);}const size=Math.hypot(...n);return {t,n:n.map(v=>v/size)};};
 let faces=[face(a,b,c),face(a,d,b),face(a,c,d),face(b,d,c)];const initial=new Set([a,b,c,d]);
 for(const id of ids){
  if(initial.has(id))continue;
  const visible=new Set();faces.forEach((f,i)=>{if(dot(f.n,sub(points[id],points[f.t[0]]))>epsilon)visible.add(i);});
  if(!visible.size)continue;
  const edges=new Map();for(const i of visible){const t=faces[i].t;for(let j=0;j<3;j++){const u=t[j],v=t[(j+1)%3],key=[u,v].sort((x,y)=>x-y).join(':');if(edges.has(key))edges.delete(key);else edges.set(key,[u,v]);}}
  faces=faces.filter((_,i)=>!visible.has(i));for(const [u,v] of edges.values())faces.push(face(u,v,id));
 }
 const triangles=faces.map(f=>f.t);return {faces:triangles,dimension:3,vertices:[...new Set(triangles.flat())]};
}
