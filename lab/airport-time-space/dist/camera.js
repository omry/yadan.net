// A view-space orbit around the centered cloud. This never changes point data.
const normalize=q=>{const length=Math.hypot(...q)||1;return q.map(v=>v/length);};
const multiply=(a,b)=>[
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
];
export function initialRotation(yaw=.5,pitch=-.4){return multiply([Math.sin(pitch/2),0,0,Math.cos(pitch/2)],[0,Math.sin(yaw/2),0,Math.cos(yaw/2)]);}
export function orbitRotation(rotation,dx,dy,sensitivity=.006){
 const distance=Math.hypot(dx,dy);if(!distance)return [...rotation];
 const sine=Math.sin(distance*sensitivity/2)/distance;
 return normalize(multiply([dy*sine,dx*sine,0,Math.cos(distance*sensitivity/2)],rotation));
}
export function rollRotation(rotation,dx,sensitivity=.006){
 // Rotate about the viewing axis, regardless of the current orbit. Dragging
 // right turns the displayed cloud clockwise; its center and depths stay fixed.
 const angle=-dx*sensitivity/2;
 return normalize(multiply([0,0,Math.sin(angle),Math.cos(angle)],rotation));
}
export function focusRotation(rotation,pointFromCenter){
 const view=rotatePoint(pointFromCenter,rotation),length=Math.hypot(...view);
 if(length<1e-10)return [...rotation];
 const [x,y,z]=view.map(v=>v/length);
 // Shortest view-space rotation toward the camera. The target stays on the
 // cloud mean; centering an airport never pans or moves the reconstructed data.
 const delta=z< -1+1e-10?[1,0,0,0]:normalize([y,-x,0,1+z]);
 return normalize(multiply(delta,rotation));
}
export function rotatePoint(point,q){
 const [x,y,z,w]=q,[px,py,pz]=point;
 const tx=2*(y*pz-z*py),ty=2*(z*px-x*pz),tz=2*(x*py-y*px);
 return [px+w*tx+y*tz-z*ty,py+w*ty+z*tx-x*tz,pz+w*tz+x*ty-y*tx];
}
export function cloudCenter(points){
 const present=points.filter(Boolean);return [0,1,2].map(k=>present.reduce((sum,p)=>sum+p[k],0)/(present.length||1));
}
