(()=>{
'use strict';
const host=document.getElementById('crane-scene');
const loading=document.getElementById('crane-loading');
const fallback=document.getElementById('crane-fallback');
if(!host||!window.THREE||!window.CRANE_MODEL_DATA){ if(fallback) fallback.style.opacity='1'; return; }
let renderer;
try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch(e){ if(fallback) fallback.style.opacity='1'; if(loading) loading.textContent='3D недоступно'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0xffffff,0);
renderer.domElement.setAttribute('aria-hidden','true');
host.prepend(renderer.domElement);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(33,1,.1,100);
camera.position.set(15.0,6.35,45.6);
camera.lookAt(1.35,2.95,0);

scene.add(new THREE.HemisphereLight(0xffffff,0xb8b8b8,2.5));
const key=new THREE.DirectionalLight(0xffffff,4.1); key.position.set(-7,14,10); key.castShadow=true; scene.add(key);
const fill=new THREE.DirectionalLight(0xdce6ff,2.0); fill.position.set(10,7,-8); scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,1.4); rim.position.set(1,12,12); scene.add(rim);

const mats={
 red:new THREE.MeshStandardMaterial({color:0xc72d27,metalness:.62,roughness:.3}),
 iron:new THREE.MeshStandardMaterial({color:0x313438,metalness:.82,roughness:.28}),
 rope:new THREE.MeshStandardMaterial({color:0x242627,metalness:.35,roughness:.48}),
 bucket:new THREE.MeshStandardMaterial({color:0xb92722,metalness:.55,roughness:.36}),
 concrete:new THREE.MeshStandardMaterial({color:0xbfc2bd,metalness:.04,roughness:.9}),
 glass:new THREE.MeshPhysicalMaterial({color:0x263b44,metalness:.18,roughness:.12,transparent:true,opacity:.58,transmission:.08,side:THREE.DoubleSide})
};

function decodeFloat32(b64){
 const raw=atob(b64), bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
 return new Float32Array(bytes.buffer);
}
function makeMesh(groupData, material){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(decodeFloat32(groupData.positions),3));
 geometry.setAttribute('normal',new THREE.BufferAttribute(decodeFloat32(groupData.normals),3));
 geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,material);
 mesh.castShadow=true; mesh.receiveShadow=true;
 return mesh;
}

const craneRoot=new THREE.Group();
const baseGroup=new THREE.Group();
const topPivot=new THREE.Group();
craneRoot.add(baseGroup,topPivot); scene.add(craneRoot);
const data=window.CRANE_MODEL_DATA;
const pivot=data.pivot;
topPivot.position.set(pivot[0],pivot[1],pivot[2]);
for(const [name,g] of Object.entries(data.groups)){
 const parts=name.split('_'); const part=parts.shift(); const cat=parts.join('_');
 const mesh=makeMesh(g,mats[cat]||mats.red);
 (part==='top'?topPivot:baseGroup).add(mesh);
}

// Normalize the uploaded model to the site's hero composition.
const scale=.435;
craneRoot.scale.setScalar(scale);
craneRoot.position.set(-2.15,-9.05,.15);
craneRoot.rotation.y=-.16;

// Soft ground shadow to reinforce the 3D read without adding visual clutter.
const shadowMat=new THREE.ShadowMaterial({color:0x000000,opacity:.11});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,30),shadowMat);
ground.rotation.x=-Math.PI/2; ground.position.set(0,-8.6,0); ground.receiveShadow=true; scene.add(ground);

let targetProgress=0, smoothProgress=0, raf=0, visible=true, loaded=false;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function scrollProgress(){
 const problems=document.getElementById('problems');
 if(!problems) return 0;
 const rect=problems.getBoundingClientRect();
 // 0: second block is just below the viewport.
 // 1: its top edge has reached the top and fully covered the first screen.
 return clamp((window.innerHeight-rect.top)/Math.max(1,window.innerHeight),0,1);
}
function resize(){
 const w=Math.max(1,host.clientWidth), h=Math.max(1,host.clientHeight);
 renderer.setSize(w,h,false); camera.aspect=w/h;
 camera.fov=w<700?42:(w/h<.85?38:36); camera.updateProjectionMatrix();
}
function applyPose(p){
 // The upper assembly/boom of the actual model rotates around the tower pivot.
 topPivot.rotation.y=-.18 + p*.86;
 // Small camera drift keeps the move architectural rather than game-like.
 camera.position.x=11.6-p*.58;
 camera.position.y=6.25+p*.18;
 camera.position.z=29.8-p*.48;
 camera.lookAt(1.35,2.95,0);
}
function renderLoop(){
 raf=0;
 if(!visible||document.hidden) return;
 targetProgress=reduced.matches?0:scrollProgress();
 smoothProgress += (targetProgress-smoothProgress)*.075;
 applyPose(smoothProgress);
 renderer.render(scene,camera);
 if(Math.abs(targetProgress-smoothProgress)>.0006) raf=requestAnimationFrame(renderLoop);
}
function schedule(){ if(!raf&&visible&&!document.hidden) raf=requestAnimationFrame(renderLoop); }
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',()=>{resize();schedule();},{passive:true});
document.addEventListener('visibilitychange',schedule);
if('ResizeObserver' in window) new ResizeObserver(()=>{resize();schedule();}).observe(host); else resize();
if('IntersectionObserver' in window) new IntersectionObserver(e=>{visible=e[0].isIntersecting; if(visible)schedule();},{rootMargin:'300px 0px',threshold:0}).observe(host);

renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault(); renderer.domElement.style.display='none'; if(fallback) fallback.style.opacity='1'; if(loading) loading.textContent='Показана резервная версия';});
resize(); applyPose(0); renderer.render(scene,camera); loaded=true;
requestAnimationFrame(()=>{host.classList.add('is-3d-ready'); if(loading) loading.remove(); if(fallback) fallback.remove(); schedule();});
})();


// v32 — add vertical headroom so the crane is not clipped at the top
