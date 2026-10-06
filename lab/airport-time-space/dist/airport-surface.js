import {convexHull} from './hull.js';
import {cloudCenter} from './camera.js';
const subtract=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=v=>{const length=Math.hypot(...v);return length?v.map(x=>x/length):null;};
// Allocation-light hull of the angular scaffold. All directions lie on the
// unit boundary, so there are many more hull facets than in the raw point cloud.
function triangulateDirections(points){
 const ids=points.flatMap((p,i)=>p?[i]:[]);if(ids.length<4)return [];
 const a=ids[0],pa=points[a];let b=a,c=a,d=a,best=0;
 for(const i of ids){const p=points[i],distance=(p[0]-pa[0])**2+(p[1]-pa[1])**2+(p[2]-pa[2])**2;if(distance>best){best=distance;b=i;}}
 const ab=subtract(points[b],pa);best=0;
 for(const i of ids){const normal=cross(ab,subtract(points[i],pa)),distance=dot(normal,normal);if(distance>best){best=distance;c=i;}}
 const normal=cross(ab,subtract(points[c],pa));best=0;
 for(const i of ids){const distance=Math.abs(dot(normal,subtract(points[i],pa)));if(distance>best){best=distance;d=i;}}
 if(best<1e-12)return [];
 const inside=[0,1,2].map(k=>(pa[k]+points[b][k]+points[c][k]+points[d][k])/4);
 const face=(a,b,c)=>{
  const p=points[a],q=points[b],r=points[c];
  let nx=(q[1]-p[1])*(r[2]-p[2])-(q[2]-p[2])*(r[1]-p[1]),ny=(q[2]-p[2])*(r[0]-p[0])-(q[0]-p[0])*(r[2]-p[2]),nz=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
  if(nx*(inside[0]-p[0])+ny*(inside[1]-p[1])+nz*(inside[2]-p[2])>0){[b,c]=[c,b];nx=-nx;ny=-ny;nz=-nz;}
  const length=Math.hypot(nx,ny,nz)||1;return {a,b,c,nx:nx/length,ny:ny/length,nz:nz/length};
 };
 let faces=[face(a,b,c),face(a,d,b),face(a,c,d),face(b,d,c)];const initial=new Set([a,b,c,d]),capacity=points.length;
 for(const id of ids){
  if(initial.has(id))continue;const p=points[id],kept=[],edges=new Map();let visible=0;
  const edge=(a,b)=>{const key=Math.min(a,b)*capacity+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);};
  for(const f of faces){const origin=points[f.a];if(f.nx*(p[0]-origin[0])+f.ny*(p[1]-origin[1])+f.nz*(p[2]-origin[2])>1e-12){visible++;edge(f.a,f.b);edge(f.b,f.c);edge(f.c,f.a);}else kept.push(f);}
  if(visible){for(const [a,b] of edges.values())kept.push(face(a,b,id));faces=kept;}
 }
 return faces.map(f=>[f.a,f.b,f.c]);
}
// Visualization only: triangulate airport directions around the cloud mean,
// then use the ORIGINAL XYZ positions as every mesh vertex. Normalized directions
// choose connectivity only. They never set a radius, move an airport or enter
// the distance optimizer. Unequal radii become real dents in the rendered mesh.
export function airportSurface(points){
 const ids=points.flatMap((p,i)=>p?.every(Number.isFinite)?[i]:[]),envelope=convexHull(points);
 const center=cloudCenter(points),vertices=[...ids];
 if(envelope.dimension<2)return {...envelope,vertices,extraVertices:[]};
 if(envelope.dimension===2){
  const [a,b,c]=envelope.faces[0].map(i=>points[i]),u=normalize(subtract(b,a)),normal=normalize(cross(subtract(b,a),subtract(c,a))),v=cross(normal,u);
  const scale=Math.max(1,...ids.map(i=>Math.hypot(...subtract(points[i],center)))),epsilon=scale*1e-10;
  const central=ids.filter(i=>Math.hypot(...subtract(points[i],center))<epsilon);
  const ring=ids.filter(i=>!central.includes(i)).sort((i,j)=>{const ai=subtract(points[i],center),aj=subtract(points[j],center);return Math.atan2(dot(ai,v),dot(ai,u))-Math.atan2(dot(aj,v),dot(aj,u))||i-j;});
  const origin=central[0]??points.length,extraVertices=central.length?[]:[{id:origin,position:center}];
  const faces=ring.map((id,i)=>[origin,id,ring[(i+1)%ring.length]]);
  for(const id of central.slice(1)){const [a,b,c]=faces.shift();faces.push([a,b,id],[b,c,id],[c,a,id]);}
  return {faces,dimension:2,vertices,extraVertices};
 }
 const directions=points.map(p=>p?normalize(subtract(p,center)):null);
 let faces=triangulateDirections(directions);if(!faces.length)faces=envelope.faces.map(f=>[...f]);const present=new Set(faces.flat());
 // Coincident directions or a point at the mean cannot define a unique angular
 // neighbor. Insert them into the nearest existing face, preserving every ID and
 // the original position. This may create degenerate facets for coincident data.
 for(const id of ids)if(!present.has(id)){
  let best=0,score=-Infinity;
  for(let i=0;i<faces.length;i++){
   const average=normalize([0,1,2].map(k=>faces[i].reduce((s,j)=>s+(directions[j]?.[k]??0),0)));
   const candidate=directions[id]&&average?dot(directions[id],average):0;
   if(candidate>score){score=candidate;best=i;}
  }
  const [a,b,c]=faces.splice(best,1)[0];faces.push([a,b,id],[b,c,id],[c,a,id]);present.add(id);
 }
 return {faces,dimension:3,vertices,extraVertices:[]};
}
