import {rotatePoint} from './camera.js';
// Camera and occlusion calculations consume displayed positions only.
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>v.map(x=>x/(Math.hypot(...v)||1));
const clamp=v=>Math.max(0,Math.min(1,v));
export function projectPoint(p,{yaw=0,pitch=0,rotation,extent,width,height,zoom}){
 const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 const xx=cy*p[0]+sy*p[2],zz=-sy*p[0]+cy*p[2];
 const [x,y,z]=rotation?rotatePoint(p,rotation):[xx,cp*p[1]-sp*zz,sp*p[1]+cp*zz];
 const perspective=3.8/(3.8-z/extent),scale=Math.min(width,height)*.48*zoom/extent;
 return {x:width/2+x*scale*perspective,y:height*.5-y*scale*perspective,z,scale:perspective,camera:[x,y,z]};
}
export function hullFaces(hull,projected,extent){
 const eye=[0,0,3.8*extent],light=unit([-.45,.65,1]);
 return hull.faces.flatMap(t=>{
  const points=t.map(id=>projected[id]),camera=points.map(p=>p.camera);
  let normal=unit(cross(sub(camera[1],camera[0]),sub(camera[2],camera[0])));
  const center=[0,1,2].map(k=>camera.reduce((sum,p)=>sum+p[k],0)/3),view=unit(sub(eye,center));
  const facing=dot(normal,view);
  if(hull.dimension===3&&facing<=0)return [];
  if(facing<0)normal=normal.map(v=>-v); // Flat polygons are two-sided.
  const illumination=.22+.52*Math.max(0,dot(normal,light))+.16*Math.abs(facing);
  const shades=points.map(p=>illumination+.1*clamp(.5+p.z/(2*extent)));
  return [{t,points,normal,shades,z:center[2]}];
 }).sort((a,b)=>a.z-b.z);
}
export function occluded(point,faces,extent){
 for(const face of faces){
  const [a,b,c]=face.points;
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  if(Math.abs(den)<1e-8)continue;
  const u=((b.y-c.y)*(point.x-c.x)+(c.x-b.x)*(point.y-c.y))/den;
  const v=((c.y-a.y)*(point.x-c.x)+(a.x-c.x)*(point.y-c.y))/den,w=1-u-v;
  if(Math.min(u,v,w)<-1e-7)continue;
  // Perspective-correct depth: screen-space barycentric weights alone would
  // misclassify points on steeply tilted faces, including front hull vertices.
  const depth=(u*a.z*a.scale+v*b.z*b.scale+w*c.z*c.scale)/(u*a.scale+v*b.scale+w*c.scale);
  if(depth>point.z+extent*1e-5)return true;
 }
 return false;
}
