/* Décors 3D du Cameroun (Three.js r128). Paysages procéduraux par région + scènes de vie. */
(function(){
"use strict";
const T=window.THREE;
const S3={ok:false};
window.Scene3D=S3;
if(!T){return;}

let renderer,scene,camera,container,world=null,clock,anims=[],waterMesh=null,waterBase=null,flagMeshes=[];
let cam={theta:0.6,phi:1.05,r:95,target:new T.Vector3(0,4,0),auto:true,minR:30,maxR:170};
let current=null,rng=Math.random,Hfn=()=>0,waterLevel=null,reduce=false,keepOut=[];
/* rendu « style GTA » : ombres, tone mapping, cycle jour/nuit, caméra de reportage */
let sunL=null,hemiL=null,skyMesh=null,skyL=null,hour=10,night=0,lastHour=-9,mobile=false,homeEl=null,lastShow=null,script=null,filmMode=false,forceNight=null;
const nightMats=[],lampMats=[];
const free=(x,z)=>!keepOut.some(k=>Math.hypot(x-k[0],z-k[1])<k[2]);

/* ---------- hasard déterministe et bruit ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
let perm=[];
function seedNoise(r){perm=[];for(let i=0;i<512;i++)perm.push(Math.floor(r()*256))}
function hash2(x,y){return perm[(perm[x&255]+y)&511]/255}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi),b=hash2(xi+1,yi),c=hash2(xi,yi+1),d=hash2(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,o){let s=0,a=.5,f=1;for(let i=0;i<(o||4);i++){s+=a*vnoise(x*f,y*f);f*=2;a*=.5}return s}
const col=h=>new T.Color(h);
function mix(c1,c2,t){return c1.clone().lerp(c2,Math.max(0,Math.min(1,t)))}

/* ---------- géométries et matériaux partagés ---------- */
const G={},M={};
function shared(){
  G.box=new T.BoxGeometry(1,1,1);G.box.translate(0,.5,0);
  G.cyl=new T.CylinderGeometry(.5,.5,1,10);G.cyl.translate(0,.5,0);
  G.cone=new T.ConeGeometry(.5,1,10);G.cone.translate(0,.5,0);
  G.pyr=new T.ConeGeometry(.72,1,4);G.pyr.rotateY(Math.PI/4);G.pyr.translate(0,.5,0);
  G.sph=new T.IcosahedronGeometry(.5,1);
  G.sph0=new T.IcosahedronGeometry(.5,0);
  G.trunk=new T.CylinderGeometry(.35,.5,1,6);G.trunk.translate(0,.5,0);
  G.body=new T.CylinderGeometry(.28,.36,1,7);G.body.translate(0,.5,0);
  G.head=new T.SphereGeometry(.22,8,6);
  G.disc=new T.CylinderGeometry(.5,.5,.18,9);
  G.umb=new T.ConeGeometry(.5,.35,8);G.umb.translate(0,.17,0);
  M.lam=new T.MeshLambertMaterial({color:0xffffff});
  M.flat=new T.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:.9,metalness:0});
  M.metal=new T.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:.5,metalness:.4});
  M.soft=new T.MeshStandardMaterial({color:0xffffff,roughness:.85,metalness:0});
  M.char=new T.MeshStandardMaterial({color:0xffffff,roughness:.75,metalness:0,vertexColors:true});
  M.veh=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.3,metalness:.35});
  M.glow=new T.MeshBasicMaterial({color:0xffffff});
  M.lamp=new T.MeshStandardMaterial({color:0x333333,emissive:0xffd28a,emissiveIntensity:0});lampMats.push(M.lamp);
  M.asphalt=new T.MeshStandardMaterial({map:roadTex(false),roughness:.9});
  M.asphaltBad=new T.MeshStandardMaterial({map:roadTex(true),roughness:.95});
  M.walk=new T.MeshStandardMaterial({map:(()=>{const t=canvasTex(128,128,(g,w,h)=>{g.fillStyle="#c8b89a";g.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=Math.random()*30-15;g.fillStyle="rgba("+(120+v)+","+(100+v)+","+(80+v)+",.12)";g.fillRect(Math.random()*w,Math.random()*h,3,3)}g.strokeStyle="rgba(60,45,30,.28)";g.lineWidth=2;for(let i=0;i<=w;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);return t})(),roughness:.9});
  M.shops=new T.MeshStandardMaterial({map:shopAtlas(),roughness:.7,emissive:0xffffff,emissiveIntensity:0});nightMats.push(M.shops);
  M.ads=new T.MeshStandardMaterial({map:adAtlas(),roughness:.6,emissive:0xffffff,emissiveIntensity:0,side:T.DoubleSide});nightMats.push(M.ads);
  G.shopCell=[];for(let k=0;k<8;k++)G.shopCell.push(cellPlane(k%4,Math.floor(k/4),4,2,3.6,.9));
  G.adCell=[];for(let k=0;k<4;k++)G.adCell.push(cellPlane(k%2,Math.floor(k/2),2,2,9,4.5));
  M.water=new T.MeshStandardMaterial({color:0x2c2a22,roughness:.05,metalness:.85});
  M.flood=new T.MeshStandardMaterial({color:0x6b5a3e,roughness:.15,metalness:.4,transparent:true,opacity:.88});
  M.fac=[0,1,2,3].map(st=>{const d=facadeTex(st,false),n=facadeTex(st,true);return[1,2,4].map(r=>{const a=d.clone(),b=n.clone();a.needsUpdate=b.needsUpdate=true;a.wrapS=a.wrapT=b.wrapS=b.wrapT=T.RepeatWrapping;a.repeat.set(1,r);b.repeat.set(1,r);const m=new T.MeshStandardMaterial({map:a,emissiveMap:b,emissive:0xffd9a0,emissiveIntensity:0,roughness:.75});nightMats.push(m);return m})});
  G.car=vehicle("car");G.taxi=vehicle("taxi");G.truck=vehicle("truck");G.bus=vehicle("bus");G.moto=vehicle("moto");G.police=vehicle("police");G.amb=vehicle("amb");G.wreck=vehicle("car");
  G.lampPost=new T.CylinderGeometry(.09,.12,1,6);G.lampPost.translate(0,.5,0);
  G.hTorso=mergeParts([[bxg(.5,.62,.27,0,.33,0),"#ffffff"],[bxg(.42,.16,.24,0,-.02,0),"#ffffff"]]);
  G.hHead=mergeParts([[new T.SphereGeometry(.13,10,8).toNonIndexed(),"#ffffff"],[bxg(.1,.1,.1,0,-.14,0),"#ffffff"]]);
  G.hLeg=mergeParts([[bxg(.16,.86,.18,0,-.43,0),"#ffffff"],[bxg(.17,.08,.28,0,-.9,.05),"#303030"]]);
  G.hArm=mergeParts([[bxg(.11,.6,.12,0,-.3,0),"#ffffff"],[bxg(.1,.1,.11,0,-.64,0),"#ffffff"]]);
  const fr=[];for(let k=0;k<9;k++){const g=bxg(.5,.05,3.4,0,0,1.7);g.rotateX(.55+(k%2)*.25);g.rotateY(k*Math.PI*2/9);fr.push([g,k%3?"#3f7d2c":"#557f2a"])}fr.push([new T.SphereGeometry(.35,8,6).toNonIndexed(),"#6b4f2a"]);G.frond=mergeParts(fr);
  M.leaf=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.8,side:T.DoubleSide});
  G.pole=new T.CylinderGeometry(.12,.16,1,6);G.pole.translate(0,.5,0);
  G.tlight=mergeParts([[bxg(.12,5.2,.12,0,2.6,0),"#3a3a3a"],[bxg(2.6,.1,.1,1.3,5.1,0),"#3a3a3a"],[bxg(.35,.95,.3,2.5,4.6,0),"#1b1b1b"]]);
}
/* ---------- textures procédurales ---------- */
function facadeTex(style,lit){return canvasTex(128,256,(g,w,h)=>{
  const walls=["#eee6d8","#d9cbb2","#c9d3d9","#e8d2b8"],glass=["#4b6477","#3d5566","#5a7486","#44586a"];
  g.fillStyle=lit?"#000":walls[style];g.fillRect(0,0,w,h);
  const cols=style===2?3:4,rows=8,mx=10,my=10,cw=(w-mx*2)/cols,rh=(h-my*2)/rows;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=mx+c*cw+4,y=my+r*rh+5,ww=cw-8,hh=rh-12;
    if(lit){if(Math.random()<.45){g.fillStyle=Math.random()<.3?"#ffe6b0":"#ffcf7a";g.fillRect(x,y,ww,hh)}}
    else{g.fillStyle=style===2?"#2f4656":glass[style];g.fillRect(x,y,ww,hh);g.fillStyle="rgba(255,255,255,.18)";g.fillRect(x,y,ww*.35,hh);if(style!==2){g.fillStyle="rgba(0,0,0,.25)";g.fillRect(x-2,y+hh,ww+4,3)}}}
  if(!lit){g.fillStyle="rgba(0,0,0,.08)";for(let i=0;i<60;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*6,1+Math.random()*10)}
})}
function cellPlane(cx,cy,nx,ny,w,h){const g=new T.PlaneGeometry(w,h);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(cx+uv.getX(i))/nx,1-(cy+1-uv.getY(i))/ny);return g}
function shopAtlas(){const L=[["PHARMACIE","#15803d","#fff"],["BOULANGERIE","#b45309","#fff"],["QUINCAILLERIE","#1d4ed8","#fff"],["MOBILE MONEY","#facc15","#111"],["SNACK-BAR","#b91c1c","#fff"],["COIFFURE DAMES","#7e22ce","#fff"],["ALIMENTATION","#0f766e","#fff"],["CABINE TÉLÉPHONIQUE","#ea580c","#fff"]];
  return canvasTex(1024,256,(g,W,H)=>{L.forEach(([t,bg,fg],k)=>{const x=(k%4)*256,y=Math.floor(k/4)*128;g.fillStyle=bg;g.fillRect(x+2,y+2,252,124);g.strokeStyle="rgba(255,255,255,.6)";g.lineWidth=4;g.strokeRect(x+8,y+8,240,112);g.fillStyle=fg;g.font="bold 30px 'Arial Black',Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(t,x+128,y+64,228)})})}
function adAtlas(){const L=[["KAMER COLA","Rafraîchis-toi, mola !","#c1121f","#fff"],["MBOA TÉLÉCOM","Le réseau de chez nous","#0b3d91","#fde047"],["CIMENT SAVANE","Bâtir solide","#6b7280","#fff"],["ELECAM","Inscrivez-vous sur les listes","#15803d","#fff"]];
  return canvasTex(1024,512,(g,W,H)=>{L.forEach(([t,sub,bg,fg],k)=>{const x=(k%2)*512,y=Math.floor(k/2)*256;const gr=g.createLinearGradient(x,y,x+512,y+256);gr.addColorStop(0,bg);gr.addColorStop(1,"#111");g.fillStyle=gr;g.fillRect(x+4,y+4,504,248);g.fillStyle=fg;g.font="bold 64px 'Arial Black',Arial,sans-serif";g.textAlign="center";g.fillText(t,x+256,y+120,480);g.font="bold 30px Arial,sans-serif";g.fillStyle="#fff";g.fillText(sub,x+256,y+180,470)})})}
function roadTex(bad){const t=canvasTex(128,256,(g,w,h)=>{g.fillStyle=bad?"#4a4540":"#3a3b3d";g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){const v=Math.random()*40-20;g.fillStyle="rgba("+(128+v)+","+(128+v)+","+(128+v)+",.08)";g.fillRect(Math.random()*w,Math.random()*h,2,2)}
  for(let i=0;i<40;i++){g.strokeStyle="rgba(0,0,0,"+(.08+Math.random()*.12)+")";g.lineWidth=1+Math.random()*2;g.beginPath();let x=Math.random()*w,y=Math.random()*h;g.moveTo(x,y);for(let k=0;k<4;k++){x+=Math.random()*14-7;y+=Math.random()*18;g.lineTo(x,y)}g.stroke()}
  g.fillStyle="rgba(0,0,0,.12)";g.fillRect(w*.22,0,10,h);g.fillRect(w*.7,0,10,h);
  g.fillStyle="#e9e4d4";g.fillRect(4,0,4,h);g.fillRect(w-8,0,4,h);
  g.fillStyle=bad?"rgba(233,200,90,.35)":"#e3b93c";g.fillRect(w/2-6,0,4,h);g.fillRect(w/2+2,0,4,h);
  if(bad){for(let i=0;i<14;i++){g.fillStyle=Math.random()<.5?"#8a4a2c":"#2b2622";g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,6+Math.random()*16,4+Math.random()*10,Math.random()*3,0,7);g.fill()}}
});t.wrapS=t.wrapT=T.RepeatWrapping;return t}
function bxg(w,h,d,x,y,z){const g=new T.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,z);return g}
function mergeParts(parts){const pos=[],nor=[],colr=[],c=new T.Color();for(const [g,cc] of parts){c.set(cc);const P=g.attributes.position,N=g.attributes.normal;for(let i=0;i<P.count;i++){pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(N.getX(i),N.getY(i),N.getZ(i));colr.push(c.r,c.g,c.b)}g.dispose()}
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));geo.setAttribute("normal",new T.Float32BufferAttribute(nor,3));geo.setAttribute("color",new T.Float32BufferAttribute(colr,3));return geo}
/* ---------- véhicules : géométrie fusionnée avec couleurs par sommet (carrosserie teintée par instance) ---------- */
function vehicle(kind){
  const parts=[];const box=(w,h,d,x,y,z,c)=>{const g=new T.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,z);parts.push([g,c])};
  const wheel=(x,z,r,wd)=>{const g=new T.CylinderGeometry(r,r,wd,10).toNonIndexed();g.rotateX(Math.PI/2);g.translate(x,r,z);parts.push([g,"#141414"])};
  if(kind==="moto"){box(1.7,.35,.3,0,.6,0,"#ffffff");box(.5,.5,.35,.1,.95,0,"#ffffff");wheel(.65,0,.32,.12);wheel(-.65,0,.32,.12);box(.35,.7,.45,-.1,1.35,0,"#2b2b2b");box(.28,.28,.28,-.05,1.9,0,"#5a3825");box(.1,.1,.1,.9,.8,0,"#fff6c0")}
  else if(kind==="truck"){box(2.2,2.1,2.2,2.6,1.55,0,"#ffffff");box(1.2,.8,2.1,3.1,2.2,0,"#26343f");box(5,.35,2.3,-.9,.75,0,"#555555");box(4.8,2.2,2.3,-.9,2,0,"#b8a27a");[[3,1.05],[-1.6,1.05],[-3,1.05]].forEach(([x])=>{wheel(x,1.05,.55,.35);wheel(x,-1.05,.55,.35)});box(.08,.3,.5,3.72,1.1,.75,"#fff6c0");box(.08,.3,.5,3.72,1.1,-.75,"#fff6c0")}
  else if(kind==="bus"){box(6,2.2,2.2,0,1.5,0,"#ffffff");box(5.6,.7,2.24,0,2,0,"#26343f");box(.1,.9,2,3,1.9,0,"#26343f");[2,-2].forEach(x=>{wheel(x,1.05,.45,.3);wheel(x,-1.05,.45,.3)});box(.08,.25,.4,3.02,1,.7,"#fff6c0");box(.08,.25,.4,3.02,1,-.7,"#fff6c0")}
  else{const L=4.2,Wd=1.8;box(L,.7,Wd,0,.75,0,"#ffffff");box(L*.52,.62,Wd*.92,-.25,1.4,0,"#26343f");box(L*.5,.08,Wd*.9,-.25,1.74,0,"#ffffff");
    [1.35,-1.35].forEach(x=>{wheel(x,.85,.36,.26);wheel(x,-.85,.36,.26)});box(.06,.18,.36,L/2+.01,.85,.6,"#fff6c0");box(.06,.18,.36,L/2+.01,.85,-.6,"#fff6c0");box(.06,.16,.34,-L/2-.01,.85,.62,"#c1121f");box(.06,.16,.34,-L/2-.01,.85,-.62,"#c1121f");
    if(kind==="taxi")box(.5,.22,.3,-.2,1.86,0,"#1a1a1a");if(kind==="police"||kind==="amb")box(.9,.2,.5,-.2,1.86,0,kind==="police"?"#1d4ed8":"#dc2626")}
  const pos=[],nor=[],colr=[];const c=new T.Color();
  for(const [g,cc] of parts){c.set(cc);const P=g.attributes.position,N=g.attributes.normal;for(let i=0;i<P.count;i++){pos.push(P.getX(i),P.getY(i),P.getZ(i));nor.push(N.getX(i),N.getY(i),N.getZ(i));colr.push(c.r,c.g,c.b)}g.dispose()}
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));geo.setAttribute("normal",new T.Float32BufferAttribute(nor,3));geo.setAttribute("color",new T.Float32BufferAttribute(colr,3));return geo;
}

/* ---------- init ---------- */
S3.init=function(el){
  if(S3.ok)return true;
  try{
    container=el;homeEl=el;
    renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  }catch(e){return false}
  reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||"");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.5:2));
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=!reduce;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.setClearColor(0x87a9c4);
  el.appendChild(renderer.domElement);
  renderer.domElement.style.display="block";
  scene=new T.Scene();
  camera=new T.PerspectiveCamera(50,1,.5,900);
  clock=new T.Clock();
  shared();
  bindControls(renderer.domElement);
  S3.resize();
  window.addEventListener("resize",S3.resize);
  if(window.ResizeObserver)new ResizeObserver(S3.resize).observe(el);
  S3.ok=true;
  loop();
  return true;
};
S3.resize=function(){
  if(!renderer)return;
  const w=container.clientWidth||300,h=container.clientHeight||200;
  renderer.setSize(w,h,false);renderer.domElement.style.width=w+"px";renderer.domElement.style.height=h+"px";
  camera.aspect=w/h;camera.updateProjectionMatrix();
};

/* ---------- contrôles caméra ---------- */
function bindControls(dom){
  let drag=null,pinch=null;const pts=new Map();
  dom.style.touchAction="none";
  dom.addEventListener("pointerdown",e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});cam.auto=false;
    if(pts.size===1)drag={x:e.clientX,y:e.clientY,t:cam.theta,p:cam.phi};
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),r:cam.r};drag=null}
    try{dom.setPointerCapture(e.pointerId)}catch(_){}} );
  dom.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size===2){const [a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);cam.r=Math.max(cam.minR,Math.min(cam.maxR,pinch.r*pinch.d/Math.max(d,1)))}
    else if(drag){cam.theta=drag.t-(e.clientX-drag.x)*.008;cam.phi=Math.max(.35,Math.min(1.45,drag.p-(e.clientY-drag.y)*.006))}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(pts.size===0){drag=null;clearTimeout(S3._t);S3._t=setTimeout(()=>cam.auto=true,6000)}};
  dom.addEventListener("pointerup",up);dom.addEventListener("pointercancel",up);
  dom.addEventListener("wheel",e=>{e.preventDefault();cam.r=Math.max(cam.minR,Math.min(cam.maxR,cam.r*(1+Math.sign(e.deltaY)*.08)))},{passive:false});
}

/* ---------- boucle ---------- */
function loop(){
  requestAnimationFrame(loop);
  if(!world||(S3.paused&&!filmMode))return;
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(script){runScript(dt);}
  else if(streetMode&&avatar){runStreet(dt);}
  else{
  if(cam.auto&&!reduce){if(current&&current.interior)cam.theta=Math.sin(t*.08)*.5;else cam.theta+=dt*.05}
  if(current&&current.interior)cam.theta=Math.max(-.75,Math.min(.75,cam.theta));
  const sp=Math.sin(cam.phi);
  camera.position.set(cam.target.x+cam.r*sp*Math.sin(cam.theta),cam.target.y+cam.r*Math.cos(cam.phi),cam.target.z+cam.r*sp*Math.cos(cam.theta));
  if(current&&current.interior){camera.position.y=Math.max(camera.position.y,3)}
  else{const gh=Hfn(camera.position.x,camera.position.z);if(camera.position.y<gh+6)camera.position.y=gh+6}
  camera.lookAt(cam.target);
  }
  if(sunL&&!(current&&current.interior)){const f=script?script.focus:cam.target;sunL.target.position.copy(f);sunL.position.set(f.x+sunDir.x,f.y+sunDir.y,f.z+sunDir.z)}
  if(!reduce){
    for(const a of anims)a(t,dt);
    if(waterMesh){const p=waterMesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=waterBase[i*3],y=waterBase[i*3+1];p.setZ(i,Math.sin(x*.12+t*1.4)*.35+Math.cos(y*.15+t*1.1)*.3)}p.needsUpdate=true}
    for(const f of flagMeshes){const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=f.userData.base[i*3];p.setZ(i,Math.sin(x*2.2-t*5)*.18*(x+1.5)/3)}p.needsUpdate=true}
  }
  renderer.render(scene,camera);
}

/* ---------- utilitaires de construction ---------- */
function inst(geo,mat,items,opts){
  if(!items.length)return null;
  const m=new T.InstancedMesh(geo,mat,items.length);
  const o=new T.Object3D(),c=new T.Color();
  items.forEach((it,i)=>{o.position.set(it.x,it.y,it.z);o.rotation.set(it.rx||0,it.ry||0,it.rz||0);o.scale.set(it.sx||1,it.sy||1,it.sz||1);o.updateMatrix();m.setMatrixAt(i,o.matrix);c.set(it.c||"#fff");m.setColorAt(i,c)});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
  if(opts&&opts.dynamic)m.instanceMatrix.setUsage(T.DynamicDrawUsage);
  if(!(opts&&opts.noShadow)){m.castShadow=true;m.receiveShadow=true}
  world.add(m);return m;
}
function pick(a){return a[Math.floor(rng()*a.length)]}
function rr(a,b){return a+rng()*(b-a)}
function canvasTex(w,h,draw){const cv=document.createElement("canvas");cv.width=w;cv.height=h;draw(cv.getContext("2d"),w,h);const tx=new T.CanvasTexture(cv);tx.anisotropy=4;return tx}
function flagTex(){return canvasTex(192,128,(g,w,h)=>{g.fillStyle="#007a5e";g.fillRect(0,0,w/3,h);g.fillStyle="#ce1126";g.fillRect(w/3,0,w/3,h);g.fillStyle="#fcd116";g.fillRect(2*w/3,0,w/3,h);
  g.fillStyle="#fcd116";g.beginPath();const cx=w/2,cy=h/2,R=18,r=7.5;for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;g.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}g.closePath();g.fill()})}
function addFlag(x,z,h,texture){
  const gy=Hfn(x,z);
  const pole=new T.Mesh(G.cyl,M.metal.clone());pole.material.color.set("#d8d8d8");pole.position.set(x,gy,z);pole.scale.set(.18,h,.18);world.add(pole);
  const geo=new T.PlaneGeometry(3,2,12,4);geo.translate(1.5,0,0);
  const mat=new T.MeshLambertMaterial({map:texture||flagTex(),side:T.DoubleSide});
  const f=new T.Mesh(geo,mat);f.position.set(x,gy+h-1.1,z);f.userData.base=Float32Array.from(geo.attributes.position.array);world.add(f);flagMeshes.push(f);return f;
}
function bannerTex(text,sub,color){return canvasTex(512,128,(g,w,h)=>{g.fillStyle=color;g.fillRect(0,0,w,h);g.fillStyle="rgba(255,255,255,.95)";g.font="bold 58px 'Arial Black',Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(text,w/2,h*.42);g.font="600 24px Arial,sans-serif";g.fillText(sub||"",w/2,h*.8)})}

/* ---------- paysages ---------- */
const LANDS={
 sahel:{sky:["#8fb5d6","#efd9ad"],fog:.0045,sun:"#fff1d6",low:"#c9a46a",mid:"#b59a5a",high:"#7b634d",wl:null},
 savane:{sky:["#7eaed4","#e9dfbf"],fog:.004,sun:"#fff4df",low:"#b7a24d",mid:"#8f9a44",high:"#6f7a3a",wl:-1.6},
 plateau:{sky:["#7fb0d8","#dfe7e4"],fog:.004,sun:"#fffaf0",low:"#6b9c45",mid:"#5a8a3b",high:"#7e8a5a",wl:-2},
 ville:{sky:["#7aa8cf","#e3e6df"],fog:.0045,sun:"#fff7e8",low:"#5f8f3f",mid:"#4f7f37",high:"#3f6c30",wl:null},
 port:{sky:["#7da6c8","#e6e2d6"],fog:.005,sun:"#fff3e2",low:"#4f7a3a",mid:"#5d7f40",high:"#556b3a",wl:0},
 hauts:{sky:["#86aed0","#e4e9e6"],fog:.006,sun:"#fffaf0",low:"#5e9a42",mid:"#4c8638",high:"#6a7f45",wl:null},
 grassfields:{sky:["#93b3cc","#e8ecea"],fog:.008,sun:"#fbfaf4",low:"#79a64b",mid:"#8fb058",high:"#6c8f47",wl:null},
 volcan:{sky:["#7ea3c6","#e1e5e2"],fog:.0045,sun:"#fff6e6",low:"#2f6d33",mid:"#3a7a3a",high:"#3d3632",wl:0},
 foret:{sky:["#8cb2c9","#dfe7e0"],fog:.009,sun:"#fbf7ea",low:"#2d5e2c",mid:"#27552a",high:"#224b25",wl:-1.5},
 cote:{sky:["#72a7d2","#e5ebe6"],fog:.004,sun:"#fff6e3",low:"#2f6a31",mid:"#2a5f2d",high:"#285a2a",wl:0},
 interieur:{sky:["#3a2e22","#3a2e22"],fog:0,sun:"#ffe7c4"}
};

function heightFn(land){
  switch(land){
   case"sahel":{const peaks=[];for(let i=0;i<9;i++)peaks.push([rr(-100,100),rr(-100,-20),rr(14,34),rr(6,13)]);
     return (x,z)=>{let h=fbm(x*.02,z*.02)*4;for(const p of peaks){const d=Math.hypot(x-p[0],z-p[1]);if(d<p[3]*2.2)h+=p[2]*Math.pow(Math.max(0,1-d/(p[3]*2.2)),1.6)*(.8+.4*vnoise(x*.3,z*.3))}return h}}
   case"savane":return (x,z)=>{const rv=Math.sin(x/28)*16+10;const d=Math.abs(z-rv);let h=fbm(x*.015,z*.015)*9;if(d<14)h-=(1-d/14)*6;return h};
   case"plateau":return (x,z)=>fbm(x*.012,z*.012)*12+Math.max(0,fbm(x*.03+9,z*.03)*10-6);
   case"ville":return (x,z)=>{const d=Math.hypot(x,z);let h=fbm(x*.018,z*.018)*20;if(d<40)h=h*(d/40)+ (1-d/40)*6;return h};
   case"port":return (x,z)=>{let h=1+fbm(x*.03,z*.03)*2.5;const shore=-15+Math.sin(z/20)*8;if(x<shore)h=-4+(x-shore)*.05;else if(x<shore+6)h=h*(x-shore)/6;return h};
   case"hauts":return (x,z)=>{let h=fbm(x*.022,z*.022,5)*30;const d=Math.hypot(x,z);if(d<18)h=h*(d/18)+(1-d/18)*9;return h};
   case"grassfields":return (x,z)=>{let h=fbm(x*.02,z*.02,5)*26+Math.abs(Math.sin(x*.05))*4;const d=Math.hypot(x,z);if(d<18)h=h*(d/18)+(1-d/18)*8;return h};
   case"volcan":return (x,z)=>{const d=Math.hypot(x+10,z+75);let h=Math.max(0,65*Math.pow(Math.max(0,1-d/95),1.4));if(d<9)h-=(1-d/9)*6;h+=fbm(x*.03,z*.03)*3;if(z>45)h-= (z-45)*.25;return h};
   case"foret":return (x,z)=>{let h=fbm(x*.02,z*.02)*10;const rv=Math.sin(x/35)*20-50;const d=Math.abs(z-rv);if(d<10)h-=(1-d/10)*5;return h};
   case"cote":return (x,z)=>{let h=2+fbm(x*.02,z*.02)*8;if(z>20)h-= (z-20)*.3;return h};
  }
  return ()=>0;
}

function buildTerrain(land,L){
  const size=260,seg=reduce?70:110;
  const geo=new T.PlaneGeometry(size,size,seg,seg);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,colors=new Float32Array(p.count*3);
  const cl=col(L.low),cm=col(L.mid),ch=col(L.high),sand=col("#d9c28f"),rock=col("#6b5f55"),laterite=col("#b4552f"),mud=col("#7a6a4a");
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);let y=Hfn(x,z);p.setY(i,y);
    let c=mix(cl,cm,fbm(x*.05+3,z*.05)*1.6-.3);
    if(y>18)c=mix(c,ch,(y-18)/20);
    if(L.wl!==null&&L.wl!==undefined&&y<L.wl+1.2)c=mix(c,land==="port"||land==="foret"||land==="savane"?mud:sand,1-(y-L.wl)/1.2);
    if(land==="sahel"&&y>7)c=mix(c,rock,(y-7)/10);
    if(land==="volcan"){const d=Math.hypot(x+10,z+75);if(d<35)c=mix(c,col("#3b3431"),(35-d)/20);else if(z>10&&y>1)c=Math.floor((x+200)/4)%2?mix(c,col("#5b9a3a"),.35):c}
    if(land==="hauts"||land==="grassfields"){const band=Math.floor(y/2.2)%3;if(band===1)c=mix(c,col("#8a7a45"),.35);if(band===2)c=mix(c,col("#9bb85a"),.3)}
    if(land==="foret"){const rz=Math.sin(x/22)*10+18;if(Math.abs(z-rz)<2.2)c=laterite}
    if(land==="savane"||land==="plateau"){const rz=Math.sin(x/40)*12-30;if(Math.abs(z-rz)<1.6)c=laterite}
    const j=(vnoise(x*.8,z*.8)-.5)*.06;colors[i*3]=c.r+j;colors[i*3+1]=c.g+j;colors[i*3+2]=c.b+j;
  }
  geo.setAttribute("color",new T.BufferAttribute(colors,3));geo.computeVertexNormals();
  const m=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.receiveShadow=true;
  world.add(m);
  if(L.wl!==null&&L.wl!==undefined){
    const wg=new T.PlaneGeometry(size*2,size*2,48,48);
    const wm=new T.Mesh(wg,new T.MeshPhongMaterial({color:land==="savane"||land==="foret"?"#5f7f6a":"#2f6f8f",transparent:true,opacity:.86,shininess:80,specular:0x99bbcc,flatShading:true}));
    wm.rotation.x=-Math.PI/2;wm.position.y=L.wl;world.add(wm);waterMesh=wm;waterBase=Float32Array.from(wg.attributes.position.array);
  }
}

function sky(L){
  const g=new T.SphereGeometry(500,24,12),top=col(L.sky[0]),hor=col(L.sky[1]),cs=[];
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=Math.max(0,p.getY(i)/500);const c=mix(hor,top,Math.pow(t,.6));cs.push(c.r,c.g,c.b)}
  g.setAttribute("color",new T.Float32BufferAttribute(cs,3));
  const m=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,fog:false}));world.add(m);skyMesh=m;skyL=L;
  // nuages
  const cl=[];for(let i=0;i<(reduce?6:14);i++){const x=rr(-200,200),z=rr(-200,200),y=rr(55,80);for(let k=0;k<4;k++)cl.push({x:x+rr(-10,10),y:y+rr(-2,2),z:z+rr(-6,6),sx:rr(10,20),sy:rr(4,7),sz:rr(8,14),c:"#ffffff"})}
  const cm=inst(G.sph0,new T.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.85,emissive:0x777777}),cl,{noShadow:true});
  if(cm)anims.push((t)=>{cm.position.x=Math.sin(t*.02)*30});
}

/* placement : trouve des points valides */
function spots(n,test,area){
  const out=[];let tries=0;const A=area||120;
  while(out.length<n&&tries<n*20){tries++;const x=rr(-A,A),z=rr(-A,A),y=Hfn(x,z);if(free(x,z)&&test(x,z,y))out.push({x,z,y})}
  return out;
}
const dry=(wl)=>(x,z,y)=>wl==null||y>wl+.8;

/* ---------- végétation ---------- */
function trees(kind,pts){
  const tr=[];let cn=[];
  for(const p of pts){
    const s=rr(.8,1.4);
    if(kind==="acacia"){tr.push({x:p.x,y:p.y,z:p.z,sx:.5*s,sy:4*s,sz:.5*s,c:"#5a4632"});cn.push({x:p.x,y:p.y+4*s,z:p.z,sx:5*s,sy:1.1*s,sz:5*s,c:pick(["#6f8a34","#7b9139","#5f7a2f"])})}
    else if(kind==="baobab"){tr.push({x:p.x,y:p.y,z:p.z,sx:2.6*s,sy:5*s,sz:2.6*s,c:"#8a7563"});cn.push({x:p.x,y:p.y+5.6*s,z:p.z,sx:5*s,sy:1.8*s,sz:5*s,c:"#6d7f3a"})}
    else if(kind==="jungle"){const h=rr(9,17)*s;tr.push({x:p.x,y:p.y,z:p.z,sx:.8,sy:h,sz:.8,c:"#4d3b2a"});cn.push({x:p.x,y:p.y+h,z:p.z,sx:rr(6,10),sy:rr(4,6),sz:rr(6,10),c:pick(["#1f5a26","#2b6a2c","#23502a","#35733a","#1c4a22"])})}
    else if(kind==="palm"){const h=rr(7,11)*s;tr.push({x:p.x,y:p.y,z:p.z,sx:.32,sy:h,sz:.32,c:"#8a7458",rz:rr(-.06,.06)});cn.push({x:p.x,y:p.y+h,z:p.z,sx:1.1*s,sy:1.1*s,sz:1.1*s,ry:rr(0,6),c:"#ffffff",frond:1})}
    else if(kind==="euca"){const h=rr(8,14)*s;tr.push({x:p.x,y:p.y,z:p.z,sx:.4,sy:h*.5,sz:.4,c:"#b8ab98"});cn.push({x:p.x,y:p.y+h*.35,z:p.z,sx:2.2,sy:h*.75,sz:2.2,c:pick(["#6e8f62","#7c9a6c","#5e7f55"]),cone:1})}
    else if(kind==="bush"){cn.push({x:p.x,y:p.y+.6,z:p.z,sx:rr(1.5,3),sy:rr(1,1.8),sz:rr(1.5,3),c:pick(["#6a7d35","#8a8a3c","#56722f"])})}
    else if(kind==="mangrove"){tr.push({x:p.x,y:p.y-1,z:p.z,sx:.4,sy:3,sz:.4,c:"#4a3d2c"});cn.push({x:p.x,y:p.y+2.2,z:p.z,sx:4,sy:2.2,sz:4,c:pick(["#2d5a2b","#335f30"])})}
    else if(kind==="banana"){tr.push({x:p.x,y:p.y,z:p.z,sx:.35,sy:2.5,sz:.35,c:"#6c7f3a"});cn.push({x:p.x,y:p.y+2.6,z:p.z,sx:2.6,sy:1.4,sz:2.6,c:pick(["#5aa13f","#67ad45"])})}
  }
  inst(G.trunk,M.lam,tr);
  inst(G.frond,M.leaf,cn.filter(c=>c.frond));cn=cn.filter(c=>!c.frond);
  const cones=cn.filter(c=>c.cone),rest=cn.filter(c=>!c.cone);
  inst(G.sph,M.flat,rest);inst(G.cone,M.flat,cones);
}

/* ---------- bâtiments ---------- */
function huts(pts,style){
  const w=[],r=[];
  for(const p of pts){const s=rr(1.6,2.4);
    if(style==="round"){w.push({x:p.x,y:p.y-.2,z:p.z,sx:s*2,sy:s*1.1,sz:s*2,c:pick(["#a0673f","#9a5f39","#b0764a"])});r.push({x:p.x,y:p.y+s*1.05,z:p.z,sx:s*2.6,sy:s*1.6,sz:s*2.6,c:pick(["#c9a55c","#b99447","#d2b06a"])})}
    else if(style==="chef"){w.push({x:p.x,y:p.y-.2,z:p.z,sx:s*2.4,sy:s*1.4,sz:s*2.4,c:"#8c5a36",box:1});r.push({x:p.x,y:p.y+s*1.3,z:p.z,sx:s*3.2,sy:s*3.6,sz:s*3.2,c:"#a8864a"})}
    else{const wd=rr(3,5);w.push({x:p.x,y:p.y-.2,z:p.z,sx:wd,sy:rr(2.2,3),sz:rr(3,4.5),ry:rr(0,3),c:pick(["#c9a27a","#d8c3a0","#b98563","#e0d6c2","#a8744f"]),box:1});r.push({x:p.x,y:p.y+2.6,z:p.z,sx:wd*1.3,sy:1.5,sz:wd*1.3,c:pick(["#8b8f93","#9c5b3a","#7e8286","#a0a4a8"]),pyr:1})}
  }
  inst(G.cyl,M.lam,w.filter(x=>!x.box));inst(G.box,M.lam,w.filter(x=>x.box));
  inst(G.cone,M.flat,r.filter(x=>!x.pyr));inst(G.pyr,M.flat,r.filter(x=>x.pyr));
}
function city(cx,cz,R,n,tall){
  const b=[],roofs=[];
  for(let i=0;i<n;i++){const a=rng()*Math.PI*2,d=Math.sqrt(rng())*R,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=Hfn(x,z);
    if(waterLevel!=null&&y<waterLevel+.6)continue;
    if(!free(x,z))continue;
    const core=1-d/R,h=tall?rr(3,6)+Math.pow(core,3)*rr(10,34):rr(3,8);
    const w=rr(3,6),dd=rr(3,6),ry=rr(0,.3);
    b.push({x,y:y-.5,z,sx:w,sy:h,sz:dd,ry,c:pick(["#ffffff","#ffffff","#f3e8d8","#e8efe9","#f5e1d0"])});
    if(h<7)roofs.push({x,y:y-.5+h,z,sx:w*1.25,sy:1.6,sz:dd*1.25,ry,c:pick(["#8b8f93","#9c5b3a","#7e8286","#a86b45","#6f7478"])});
    else if(rng()<.5)roofs.push({x,y:y-.5+h,z,sx:w*.4,sy:1.2,sz:dd*.4,c:"#9aa0a6"});}
  buildings(b);inst(G.pyr,M.flat,roofs.filter(r=>r.sy>1.5));
}
function mosque(x,z){const y=Hfn(x,z);inst(G.box,M.flat,[{x,y:y-.3,z,sx:9,sy:5,sz:9,c:"#e8dcc0"}]);inst(G.sph,M.flat,[{x,y:y+5,z,sx:6,sy:5,sz:6,c:"#e8dcc0"}]);inst(G.cyl,M.flat,[{x:x+5.5,y:y-.3,z:z+5.5,sx:1.6,sy:14,sz:1.6,c:"#efe6cf"}]);inst(G.cone,M.flat,[{x:x+5.5,y:y+13.6,z:z+5.5,sx:2,sy:2.5,sz:2,c:"#3f8a5a"}])}
function church(x,z){const y=Hfn(x,z);inst(G.box,M.flat,[{x,y:y-.3,z,sx:6,sy:5,sz:12,c:"#efe9df"},{x,y:y-.3,z:z-7,sx:3,sy:11,sz:3,c:"#efe9df"}]);inst(G.pyr,M.flat,[{x,y:y+4.6,z,sx:8,sy:3,sz:14,c:"#9c4a2e"},{x,y:y+10.6,z:z-7,sx:4,sy:4,sz:4,c:"#9c4a2e"}])}
function palais(x,z){const y=Hfn(x,z)-.5;
  inst(G.box,M.flat,[{x,y,z,sx:44,sy:6,sz:18,c:"#f2efe8"},{x,y,z,sx:18,sy:10,sz:12,c:"#f7f5f0"},{x,y:y+10,z,sx:20,sy:.8,sz:14,c:"#d8d2c6"},{x,y:y-.4,z:z+16,sx:60,sy:.5,sz:16,c:"#4f9a3e"},{x,y:y-.3,z:z+26,sx:8,sy:.4,sz:30,c:"#c8c2b6"}]);
  const cols=[];for(let i=-5;i<=5;i++)cols.push({x:x+i*1.6,y,z:z+6.2,sx:.6,sy:10,sz:.6,c:"#ffffff"});inst(G.cyl,M.flat,cols);
  addFlag(x-26,z+10,14);addFlag(x+26,z+10,14);
}
function roadCars(path,n,colors,speed){
  const items=[];for(let i=0;i<n;i++)items.push({x:0,y:0,z:0,c:pick(colors)});
  const m=inst(G.car,M.veh,items,{dynamic:true});if(!m)return;
  const o=new T.Object3D(),off=items.map(()=>rng());
  anims.push(t=>{for(let i=0;i<n;i++){const u=(off[i]+t*speed*(i%2?1:-1)+10)%1;const p=path(u);o.position.set(p.x,Hfn(p.x,p.z)+.05,p.z+(i%2?1.6:-1.6));o.rotation.y=p.a+(i%2?Math.PI:0);o.scale.set(.8,.8,.8);o.updateMatrix();m.setMatrixAt(i,o.matrix)}m.instanceMatrix.needsUpdate=true});
}
function cattle(pts){
  const b=[],h=[];for(const p of pts){const ry=rr(0,6.28),c=pick(["#f1ece3","#7a4a2c","#d8c7b0","#3a2a20"]);b.push({x:p.x,y:p.y+.5,z:p.z,sx:2.2,sy:1.1,sz:1,ry,c});h.push({x:p.x+Math.cos(ry)*1.3,y:p.y+1.1,z:p.z-Math.sin(ry)*1.3,sx:.7,sy:.6,sz:.6,ry,c})}
  inst(G.box,M.flat,b);inst(G.box,M.flat,h);
}

/* ---------- personnages ---------- */
const PAGNE=["#e4572e","#f3a712","#29335c","#669bbc","#a8c686","#db2b39","#f0f3bd","#7b2cbf","#2a9d8f","#e9c46a","#ffffff","#264653"];
const PEAU=["#5a3825","#6b4226","#4a2e1f","#7a4b2e","#3d2618"];
/* personnages : corps articulés (torse, tête, bras, jambes) animés en marche, debout, assis ou en liesse */
const PANTS=["#1f2a44","#2b3a55","#3b3b3b","#5b4a36","#1d3b6e","#6b5b45","#222222"];
const _m1=new T.Matrix4(),_m2=new T.Matrix4(),_m3=new T.Matrix4(),_q=new T.Quaternion(),_v=new T.Vector3(),_sc=new T.Vector3(),_e=new T.Euler();
function people(pts,opts){
  opts=opts||{};const n=pts.length;if(!n)return;
  const P=pts.map(p=>{const s=rr(.92,1.08)*(opts.scale||1);const shirt=opts.party&&rng()<opts.share?opts.party:pick(PAGNE);const fem=rng()<.45;const skin=pick(PEAU);
    return{x:p.x,y:p.y,z:p.z,s,h:rr(0,6.28),ph:rr(0,6.28),shirt,pant:fem&&rng()<.7?shirt:pick(PANTS),arm:rng()<.6?skin:shirt,skin,seg:p.seg,sp:rr(.9,1.5),hx:p.x,hz:p.z,dir:rng()<.5?1:-1,u:rng()}});
  const mT=inst(G.hTorso,M.char,P.map(q=>({x:q.x,y:q.y,z:q.z,c:q.shirt})),{dynamic:true}),mH=inst(G.hHead,M.char,P.map(q=>({x:q.x,y:q.y,z:q.z,c:q.skin})),{dynamic:true});
  const mL=inst(G.hLeg,M.char,P.flatMap(q=>[{x:q.x,y:q.y,z:q.z,c:q.pant},{x:q.x,y:q.y,z:q.z,c:q.pant}]),{dynamic:true}),mA=inst(G.hArm,M.char,P.flatMap(q=>[{x:q.x,y:q.y,z:q.z,c:q.arm},{x:q.x,y:q.y,z:q.z,c:q.arm}]),{dynamic:true});
  const hip=opts.seated?.5:.95;
  const place=(i,q,x,y,z,h,sw,arm,j)=>{_q.setFromAxisAngle(_v.set(0,1,0),h);_sc.set(q.s,q.s,q.s);_m1.compose(_v.set(x,y+j,z),_q,_sc);
    _m2.makeTranslation(0,hip,0);_m3.multiplyMatrices(_m1,_m2);mT.setMatrixAt(i,_m3);
    _m2.makeTranslation(0,hip+.78,0);_m3.multiplyMatrices(_m1,_m2);mH.setMatrixAt(i,_m3);
    for(const sd of [-1,1]){_e.set(opts.seated?-1.45:sw*sd,0,0);_m2.makeRotationFromEuler(_e);_m2.setPosition(sd*.1,hip,0);_m3.multiplyMatrices(_m1,_m2);mL.setMatrixAt(i*2+(sd>0?1:0),_m3);
      _e.set(arm!=null?arm+(sd>0?.25:0)*(j>0?1:0):-sw*sd*.8,0,sd*.08);_m2.makeRotationFromEuler(_e);_m2.setPosition(sd*.31,hip+.6,0);_m3.multiplyMatrices(_m1,_m2);mA.setMatrixAt(i*2+(sd>0?1:0),_m3)}};
  const flush=()=>{mT.instanceMatrix.needsUpdate=mH.instanceMatrix.needsUpdate=mL.instanceMatrix.needsUpdate=mA.instanceMatrix.needsUpdate=true};
  P.forEach((q,i)=>place(i,q,q.x,q.y,q.z,q.h,0,null,0));flush();
  if(reduce)return;
  if(opts.bob){anims.push(t=>{P.forEach((q,i)=>{const w=Math.sin(t*opts.bob+q.ph);const j=Math.max(0,w)*.18*(opts.bob>2?1:.3);place(i,q,q.x,q.y,q.z,q.h,0,opts.bob>2?-2.6+w*.4:null,j)});flush()})}
  else if(opts.wander){anims.push((t,dt)=>{P.forEach((q,i)=>{let x,z,h;
      if(q.seg){const S=q.seg;q.u+=dt*q.sp*q.dir/Math.max(1,S.len);if(q.u>1){q.u=1;q.dir=-1}if(q.u<0){q.u=0;q.dir=1}x=S.ax+(S.bx-S.ax)*q.u;z=S.az+(S.bz-S.az)*q.u;h=Math.atan2((S.bx-S.ax)*q.dir,(S.bz-S.az)*q.dir)}
      else{const k=t*.18*q.sp+q.ph;x=q.hx+Math.sin(k)*3;z=q.hz+Math.cos(k*1.13)*3;const dx=Math.cos(k)*3,dz=-Math.sin(k*1.13)*3.4;h=Math.atan2(dx,dz)}
      const y=q.seg?q.y:Hfn(x,z);const sw=Math.sin(t*6.5*q.sp+q.ph)*.55;place(i,q,x,y,z,h,sw,null,Math.abs(sw)*.03)});flush()})}
}

/* ---------- surimpressions : meeting, marché, village ---------- */
function flatten(cx,cz){return Hfn(cx,cz)}
function meeting(cx,cz,color,label,sub){
  const y=flatten(cx,cz);
  inst(G.box,M.flat,[{x:cx,y:y-.5,z:cz,sx:12,sy:2.4,sz:6,c:"#3b3f46"},{x:cx,y:y+1.9,z:cz-2.6,sx:14,sy:.5,sz:.5,c:"#222"}]);
  const bn=new T.Mesh(new T.PlaneGeometry(14,3.5),new T.MeshBasicMaterial({map:bannerTex(label,sub,color),side:T.DoubleSide}));bn.position.set(cx,y+5,cz-2.8);world.add(bn);
  inst(G.box,M.flat,[{x:cx-7.5,y:y-.5,z:cz-2.8,sx:.4,sy:7.5,sz:.4,c:"#222"},{x:cx+7.5,y:y-.5,z:cz-2.8,sx:.4,sy:7.5,sz:.4,c:"#222"},{x:cx-6,y,z:cz+1,sx:1.4,sy:4,sz:1.4,c:"#111"},{x:cx+6,y,z:cz+1,sx:1.4,sy:4,sz:1.4,c:"#111"}]);
  people([{x:cx,y:y+1.9,z:cz}],{scale:1.15});
  addFlag(cx-10,cz-1,9);addFlag(cx+10,cz-1,9);
  const pts=[];for(let i=0;i<(reduce?160:340);i++){const a=rr(-1.2,1.2)+Math.PI/2,d=rr(8,30),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;pts.push({x,y:Hfn(x,z),z})}
  people(pts,{bob:4.5,party:color,share:.55});
  cam.target.set(cx,y+3,cz+8);
}
function market(cx,cz){
  const st=[],um=[],pr=[];const y0=Hfn(cx,cz);
  for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++){const x=cx+i*6+rr(-1,1),z=cz+j*6+rr(-1,1),y=Hfn(x,z);
    st.push({x,y,z,sx:3.6,sy:1.1,sz:2.2,c:"#7a5a3a"});
    um.push({x,y:y+2.7,z,sx:5.5,sy:1.2,sz:5.5,c:pick(["#d7263d","#f46036","#2e294e","#1b998b","#e9c46a","#3a86ff","#ffbe0b","#fb5607"])});
    st.push({x:x-1.6,y,z:z-1,sx:.2,sy:2.7,sz:.2,c:"#555"});
    for(let k=0;k<6;k++)pr.push({x:x+rr(-1.4,1.4),y:y+1.2,z:z+rr(-.8,.8),sx:.6,sy:.6,sz:.6,c:pick(["#e63946","#ffb703","#fb8500","#8ac926","#6a994e","#bc6c25","#f4a261"])})}
  inst(G.box,M.lam,st);inst(G.umb,M.flat,um);inst(G.sph0,M.lam,pr);
  const pts=[];for(let i=0;i<(reduce?80:170);i++){const x=cx+rr(-22,22),z=cz+rr(-16,16);pts.push({x,y:Hfn(x,z),z})}
  people(pts,{wander:1});
  cam.target.set(cx,y0+2,cz);
}
function village(cx,cz,style){
  const pts=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2+rr(-.2,.2),d=rr(8,20),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;pts.push({x,y:Hfn(x,z),z})}
  huts(pts,style);
  if(style!=="chef")huts([{x:cx,y:Hfn(cx,cz),z:cz}],"chef");
  const pp=[];for(let i=0;i<40;i++){const x=cx+rr(-12,12),z=cz+rr(-12,12);pp.push({x,y:Hfn(x,z),z})}
  people(pp,{wander:1});
  cam.target.set(cx,Hfn(cx,cz)+2,cz);
}

/* ---------- salle du Conseil des ministres ---------- */
function council(){
  const L=LANDS.interieur;scene.fog=null;renderer.setClearColor(0x2a2118);
  const W=30,D=50,H=12;
  inst(G.box,M.flat,[{x:0,y:-.5,z:0,sx:W,sy:.5,sz:D,c:"#6b4a2f"},{x:0,y:0,z:-D/2,sx:W,sy:H,sz:.5,c:"#e8dfcc"},{x:-W/2,y:0,z:0,sx:.5,sy:H,sz:D,c:"#efe7d6"},{x:W/2,y:0,z:0,sx:.5,sy:H,sz:D,c:"#efe7d6"},{x:0,y:H,z:0,sx:W,sy:.4,sz:D,c:"#f5efe3"},
    {x:0,y:0,z:0,sx:7,sy:2.5,sz:32,c:"#4a2c1a"},{x:0,y:2.5,z:0,sx:7.4,sy:.25,sz:32.4,c:"#5b3620"},
    {x:0,y:0,z:-19,sx:3,sy:4.5,sz:1.2,c:"#7d1f1f"}]);
  // fenêtres lumineuses
  const win=[];for(let i=-2;i<=2;i++){win.push({x:-W/2+.4,y:3,z:i*9,sx:.2,sy:6,sz:4,c:"#fff4d6"});win.push({x:W/2-.4,y:3,z:i*9,sx:.2,sy:6,sz:4,c:"#fff4d6"})}
  inst(G.box,new T.MeshBasicMaterial({color:0xffffff}),win);
  // fauteuils et ministres
  const ch=[],pp=[];for(let i=0;i<9;i++){const z=-13+i*3.3;for(const s of [-1,1]){ch.push({x:s*4.9,y:0,z,sx:1.6,sy:1.1,sz:1.6,c:"#7a1e1e"},{x:s*5.8,y:0,z,sx:.35,sy:3.2,sz:1.6,c:"#6a1818"});pp.push({x:s*4.7,y:1.1,z})}}
  inst(G.box,M.lam,ch);people(pp,{seated:1,bob:.6});
  people([{x:0,y:1.3,z:-17.6}],{seated:1,scale:1.15});
  // drapeau et portrait
  addFlag(-4,-22,8);
  const tx=canvasTex(128,160,(g,w,h)=>{g.fillStyle="#caa24a";g.fillRect(0,0,w,h);g.fillStyle="#2b3a4a";g.fillRect(10,10,w-20,h-20);g.fillStyle="#f0d9a8";g.beginPath();g.arc(w/2,h*.42,22,0,7);g.fill();g.fillRect(w/2-30,h*.62,60,40)});
  const pt=new T.Mesh(new T.PlaneGeometry(4,5),new T.MeshBasicMaterial({map:tx}));pt.position.set(0,7.5,-D/2+.4);world.add(pt);
  const lamp=new T.PointLight(0xffe2b0,.9,80);lamp.position.set(0,10,0);world.add(lamp);
  cam.target.set(0,3,-6);cam.r=19;cam.minR=8;cam.maxR=21;cam.phi=1.28;cam.theta=.2;
}

/* ---------- composition d'une scène ---------- */
/* ---------- lumière, heure du jour ---------- */
const sunDir=new T.Vector3(80,120,40);
function lights(){
  hemiL=new T.HemisphereLight(0xdfefff,0x5a4a3a,.7);sunL=new T.DirectionalLight(0xffffff,1.1);
  sunL.castShadow=renderer.shadowMap.enabled;const sm=mobile?1024:2048;sunL.shadow.mapSize.set(sm,sm);
  const sc=sunL.shadow.camera;sc.left=-85;sc.right=85;sc.top=85;sc.bottom=-85;sc.near=1;sc.far=420;sunL.shadow.bias=-.0005;sunL.shadow.normalBias=.5;
  world.add(hemiL,sunL,sunL.target);
}
function applyHour(){
  if(!sunL||!skyL||(current&&current.interior))return;
  const h=forceNight!=null?forceNight:hour;lastHour=h;
  const el=Math.sin((h-6)/12.6*Math.PI);const day=Math.max(0,Math.min(1,el*1.8)),dusk=el>-.2&&el<.45?Math.max(0,1-Math.abs(el-.1)/.35):0;night=1-Math.max(0,Math.min(1,(el+.16)*3.2));
  const a=(h-6)/12*Math.PI;if(el>0)sunDir.set(Math.cos(a)*130,Math.max(25,el*160),60);else sunDir.set(-40,150,80);
  sunL.intensity=el>-.04?Math.max(.7*dusk+.25,.25+1.05*day):.2;sunL.color.set(el>0?mix(col(skyL.sun),col("#ffb06a"),dusk):col("#8fa8ff"));
  hemiL.intensity=.3+.5*day+.25*dusk;hemiL.color.set(mix(mix(col("#dfefff"),col("#ffc98a"),dusk*.7),col("#50608f"),night));
  const top=mix(mix(col(skyL.sky[0]),col("#3a4f7a"),dusk*.6),col("#070d1c"),night),hor=mix(mix(col(skyL.sky[1]),col("#ffb257"),Math.min(1,dusk*1.2)),col("#141c33"),night);
  if(skyMesh){const g=skyMesh.geometry,p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const t=Math.max(0,p.getY(i)/500);const k=mix(hor,top,Math.pow(t,.6));c.setXYZ(i,k.r,k.g,k.b)}c.needsUpdate=true}
  if(scene.fog){scene.fog.color.copy(hor)}renderer.setClearColor(hor);
  for(const m of nightMats)m.emissiveIntensity=night*(forceNight!=null&&filmMode&&current&&current.dark?.12:1.15);
  for(const m of lampMats)m.emissiveIntensity=night*(current&&current.dark?0:2.2);
  renderer.toneMappingExposure=1.02-night*.12;
}
S3.setHour=function(h){hour=h;if(!filmMode&&Math.abs(h-lastHour)>.08)applyHour()};

/* ---------- immeubles avec façades ---------- */
function buildings(list){
  const buckets={};const roofs=[],extra=[];
  for(const b of list){const st=b.st!=null?b.st:Math.floor(rng()*4),r=b.sy<9?0:b.sy<20?1:2;const k=st+"_"+r;(buckets[k]=buckets[k]||[]).push(b);
    roofs.push({x:b.x,y:b.y+b.sy,z:b.z,sx:b.sx*1.04,sy:.35,sz:b.sz*1.04,ry:b.ry||0,c:"#7d7f82"});
    if(rng()<.35)extra.push({x:b.x+rr(-b.sx/4,b.sx/4),y:b.y+b.sy+.35,z:b.z+rr(-b.sz/4,b.sz/4),sx:1.2,sy:1.4,sz:1.2,c:rng()<.5?"#2f5f8a":"#d9d9d9"})}
  for(const k in buckets){const [st,r]=k.split("_").map(Number);inst(G.box,M.fac[st][r],buckets[k])}
  inst(G.box,M.soft,roofs);inst(G.cyl,M.soft,extra);
}
/* détails de rue : boutiques, pubs, poteaux électriques et câbles, feux tricolores */
let lastGrid=null;
function streetDetails(g){
  const byK={};for(const sh of g.shops)(byK[sh.k]=byK[sh.k]||[]).push(sh);
  for(const k in byK){inst(G.shopCell[k],M.shops,byK[k].map(sh=>({x:sh.x,y:g.y0+3.5,z:sh.z+(sh.ry?-.02:.02),ry:sh.ry})),{noShadow:true});
    inst(G.box,M.soft,byK[k].map(sh=>({x:sh.x,y:g.y0+2.75,z:sh.z+(sh.ry?-.45:.45),sx:3.6,sy:.12,sz:.8,c:pick(["#b91c1c","#15803d","#1d4ed8","#b45309","#e5e7eb"])})))}
  const ads=g.blds.filter(b=>b.sy>7&&b.sy<16&&rng()<.12).slice(0,8);const byA={};ads.forEach(b=>{(byA[Math.floor(rng()*4)]=byA[Math.floor(rng()*4)]||[]).push(b)});
  for(const k in byA){inst(G.adCell[k],M.ads,byA[k].map(b=>({x:b.x,y:b.y+b.sy+3.6,z:b.z,ry:rng()<.5?0:Math.PI/2})),{noShadow:true});inst(G.box,M.soft,byA[k].flatMap(b=>[{x:b.x-3,y:b.y+b.sy,z:b.z,sx:.25,sy:1.4,sz:.25,c:"#444"},{x:b.x+3,y:b.y+b.sy,z:b.z,sx:.25,sy:1.4,sz:.25,c:"#444"}]))}
  // poteaux électriques et câbles le long des avenues
  const poles=[],bars=[],wires=[];const zs=[];for(let i=-g.n;i<=g.n;i++)zs.push(g.cz+i*g.B+g.RW/2+.35);
  for(const z of zs){let prev=null;for(let x=g.cx-g.L/2+4;x<g.cx+g.L/2;x+=11){if(Math.hypot(x-g.cx,z-g.cz)>g.R+6){prev=null;continue}const top=g.y0+8.2;poles.push({x,y:g.y0,z,sx:1,sy:8.4,sz:1,c:"#5b4636"});bars.push({x,y:top-.3,z,sx:.12,sy:.12,sz:1.8,c:"#4a3a2c"});
      if(prev!=null)for(const dz of [-.8,0,.8]){const N=8;for(let k=0;k<N;k++){const a=k/N,b=(k+1)/N;const sag=u=>-Math.sin(u*Math.PI)*.9;wires.push(prev+(x-prev)*a,top-.25+sag(a),z+dz,prev+(x-prev)*b,top-.25+sag(b),z+dz)}}prev=x}}
  inst(G.pole,M.soft,poles);inst(G.box,M.soft,bars);
  if(wires.length){const wg=new T.BufferGeometry();wg.setAttribute("position",new T.Float32BufferAttribute(wires,3));const wl=new T.LineSegments(wg,new T.LineBasicMaterial({color:0x111111,transparent:true,opacity:.75}));world.add(wl)}
  // feux tricolores
  const tl=[],lights=[];for(let i=-g.n+1;i<g.n;i++)for(let j=-g.n+1;j<g.n;j++){const x=g.cx+i*g.B-g.RW/2-.4,z=g.cz+j*g.B-g.RW/2-.4;if(Math.hypot(x-g.cx,z-g.cz)>g.R-4||tl.length>=24)continue;tl.push({x,y:g.y0+.28,z,c:"#ffffff"});lights.push({x:x+2.5,y:g.y0+.28+4.95,z:z+.17,sx:.28,sy:.28,sz:.1,c:"#ef4444"},{x:x+2.5,y:g.y0+.28+4.35,z:z+.17,sx:.28,sy:.28,sz:.1,c:"#22c55e"})}
  inst(G.tlight,M.char,tl);const lm=inst(G.sph0,new T.MeshBasicMaterial({color:0xffffff}),lights,{noShadow:true});
  if(lm){const c1=new T.Color("#ef4444"),c2=new T.Color("#22c55e"),off=new T.Color("#222222");anims.push(t=>{const ph=Math.floor(t/6)%2;for(let i=0;i<lights.length;i+=2){const a=(ph+(i/2)%2)%2;lm.setColorAt(i,a?c1:off);lm.setColorAt(i+1,a?off:c2)}lm.instanceColor.needsUpdate=true})}
}
/* ville en damier : rues bitumées, trottoirs, lampadaires, circulation, piétons */
function flattenAround(cx,cz,R,level){const base=Hfn;const y0=level!=null?level:base(cx,cz);Hfn=(x,z)=>{const d=Math.hypot(x-cx,z-cz);if(d<R)return y0;if(d<R+22){const t=(d-R)/22;return y0*(1-t*t*(3-2*t))+base(x,z)*(t*t*(3-2*t))}return base(x,z)};return y0}
function cityGrid(cx,cz,R,tall,o){
  o=o||{};const B=24,RW=7.5,n=Math.max(1,Math.floor(R/B+.35));const y0=Hfn(cx,cz),L=2*n*B+RW;
  const roadM=o.bad?M.asphaltBad:M.asphalt;
  for(let i=-n;i<=n;i++){for(const dir of ["x","z"]){const g=new T.PlaneGeometry(RW,L);g.rotateX(-Math.PI/2);if(dir==="x")g.rotateY(Math.PI/2);
    const mm=roadM.clone();mm.map=roadM.map.clone();mm.map.needsUpdate=true;mm.map.repeat.set(1,L/10);const m=new T.Mesh(g,mm);m.receiveShadow=true;
    m.position.set(dir==="z"?cx+i*B:cx,y0+.06+(dir==="x"?.01:0),dir==="x"?cz+i*B:cz);world.add(m)}}
  const blds=[],walks=[],lamps=[],lampHeads=[],parks=[],shops=[];
  for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const bx=cx+(i+.5)*B,bz=cz+(j+.5)*B;if(Math.hypot(bx-cx,bz-cz)>R+4||!free(bx,bz))continue;
    const S=B-RW;walks.push({x:bx,y:y0,z:bz,sx:S,sy:.28,sz:S,c:"#ffffff"});
    const core=1-Math.hypot(bx-cx,bz-cz)/(R+8);
    if(rng()<.08){for(let k=0;k<4;k++)parks.push({x:bx+rr(-3,3),z:bz+rr(-3,3),y:y0+.28});continue}
    const WK=3,lot=(S-2*WK-.6)/2,off=lot/2+.3;for(const ox of [-1,1])for(const oz of [-1,1]){if(rng()<.12)continue;
      if(rng()<.5)shops.push({x:bx+ox*off,z:bz+oz*(off+lot/2+.03),ry:oz>0?0:Math.PI,k:Math.floor(rng()*8)});
      const h=tall===true?rr(4,8)+Math.pow(Math.max(0,core),2.2)*rr(8,38):tall==="mid"?rr(3.5,7)+Math.pow(Math.max(0,core),2)*rr(3,14):rr(3,6.5);blds.push({x:bx+ox*off,y:y0+.28,z:bz+oz*off,sx:lot,sy:h,sz:lot,c:pick(["#ffffff","#e9dcc8","#d6e2ea","#f0d6c4","#e2e8d4","#cfd4d8","#f3e6b8"])})}
    // lampadaires aux coins
    lamps.push({x:bx-S/2+.4,y:y0+.28,z:bz-S/2+.4,sx:1,sy:6,sz:1,c:"#3a3a3a"});lampHeads.push({x:bx-S/2+.9,y:y0+6.1,z:bz-S/2+.9,sx:1.1,sy:.25,sz:.5,c:"#ffffff"})}
  inst(G.box,M.walk,walks);buildings(blds);streetDetails({cx,cz,B,RW,n,y0,L,R,blds,shops});
  lastGrid={cx,cz,B,RW,n,y0,L,R,blds:blds.map(b=>({x:b.x,z:b.z,hx:b.sx/2+.35,hz:b.sz/2+.35}))};inst(G.lampPost,M.soft,lamps);inst(G.box,M.lamp,lampHeads,{noShadow:true});
  if(parks.length)trees("palm",parks);
  // circulation
  const lines=[];for(let i=-n;i<=n;i++){lines.push({dir:"x",v:cz+i*B});lines.push({dir:"z",v:cx+i*B})}
  const nCars=o.jam?Math.min(120,lines.length*9):o.calm?10:Math.min(reduce?30:70,lines.length*4);
  traffic(lines,{cx,cz,L,y:y0+.06,n:nCars,jam:o.jam,profile:o.profile,clearMain:o.clearMain,stopCross:o.stopCross});
  // agents de la circulation aux carrefours
  const agents=[];for(let i=-1;i<=1;i++)agents.push({x:cx+i*B+RW/2-.6,y:y0+.06,z:cz+RW/2-.6});people(agents,{party:"#e5e7eb",share:1,bob:.7});
  if(o.cortege)convoy(CORTEGE,{x0:cx-L/2,x1:cx+L/2+40,z:cz+1.6,speed:14});
  // piétons sur les trottoirs
  const pts=[];for(let k=0;k<(reduce?50:110);k++){const i=Math.floor(rr(-n,n)),j=Math.floor(rr(-n,n)),bx=cx+(i+.5)*B,bz=cz+(j+.5)*B,S=(B-RW)/2-.6;const side=Math.floor(rr(0,4));const t=rr(-S,S);
    const x=side<2?bx+t:bx+(side===2?-S:S),z=side<2?bz+(side===0?-S:S):bz+t;
    const seg=side<2?{ax:bx-S,az:z,bx:bx+S,bz:z,len:2*S}:{ax:x,az:bz-S,bx:x,bz:bz+S,len:2*S};if(Math.hypot(x-cx,z-cz)<R)pts.push({x,y:y0+.28,z,seg})}
  people(pts,{wander:1,small:1});
  // vendeuses ambulantes (bayam-sellam) avec leur bassine sur la tête
  const ven=pts.filter(()=>rng()<.18).map(p=>({x:p.x+rr(-.4,.4),y:y0+.28,z:p.z+rr(-.4,.4)}));people(ven,{bob:.4});inst(G.disc,M.soft,ven.map(p=>({x:p.x,y:p.y+2.15,z:p.z,sx:1,sy:.9,sz:1,c:pick(["#f97316","#2563eb","#dc2626","#e5e7eb"])})),{noShadow:true});
  return{y0,B,n,RW,L};
}
/* circulation réaliste : mélange de véhicules selon la ville (bendskins interdits au centre de Yaoundé, omniprésents à Douala et dans le Nord), heures de pointe */
const PROFILS={yaounde:[["taxi",.55],["car",.27],["moto",.04],["bus",.06],["truck",.03],["amb",.02],["police",.03]],douala:[["taxi",.37],["car",.2],["moto",.35],["bus",.03],["truck",.03],["amb",.01],["police",.01]],
  nord:[["moto",.57],["car",.18],["taxi",.1],["bus",.04],["truck",.08],["amb",.01],["police",.02]],autre:[["taxi",.36],["car",.23],["moto",.3],["bus",.04],["truck",.05],["amb",.01],["police",.01]]};
const rush=()=>{const h=forceNight!=null?forceNight:hour;return(h>=6.5&&h<=9)||(h>=16.5&&h<=19.5)};
function traffic(lines,o){
  const kinds=PROFILS[o.profile]||PROFILS.autre;
  if(o.clearMain)lines=lines.filter(l=>!(l.dir==="x"&&Math.abs(l.v-o.cz)<1));
  const byKind={};for(let i=0;i<o.n;i++){let r=rng(),k="car";for(const [kk,p] of kinds){if(r<p){k=kk;break}r-=p}(byKind[k]=byKind[k]||[]).push(i)}
  const COLS={taxi:["#f2c200","#f5c518","#eab308"],car:["#e5e7eb","#1f2937","#6b7280","#991b1b","#1e3a8a","#d1d5db","#0f766e","#111111"],moto:["#b91c1c","#111827","#1d4ed8","#15803d"],bus:["#f2c200","#ffffff","#0e7490"],truck:["#ffffff","#9ca3af","#b45309"],amb:["#ffffff"],police:["#1e3a8a"]};
  const o3=new T.Object3D();const jam=o.jam||rush();
  for(const k in byKind){const ids=byKind[k];const items=ids.map(()=>({x:0,y:0,z:0,c:pick(COLS[k])}));const m=inst(G[k],M.veh,items,{dynamic:true});if(!m)continue;
    const st=ids.map(()=>({ln:pick(lines),off:rng(),sp:(k==="moto"?1.4:k==="amb"||k==="police"?1.6:1)*rr(.6,1.1),dir:rng()<.5?1:-1,ph:rr(0,6)}));
    anims.push((t,dt)=>{st.forEach((c,i)=>{const stop=o.stopCross&&c.ln.dir==="z";const slow=jam&&k!=="moto"&&k!=="amb";
      let u=stop?(Math.round(c.off*8)/8+.04*c.dir+Math.sin(c.ph)*.01+1)%1:slow?(c.off+Math.sin(t*.3+c.ph)*.004+t*.0012*c.sp*c.dir+10)%1:(c.off+t*.012*c.sp*c.dir*(jam&&k==="moto"?.7:1)+10)%1;if(u<0)u+=1;const p=(u-.5)*o.L;const lane=c.dir*1.55+(k==="moto"&&jam?Math.sin(t*2+c.ph)*.7:0);
      if(c.ln.dir==="x"){o3.position.set(o.cx+p,o.y,c.ln.v+lane);o3.rotation.set(0,c.dir>0?0:Math.PI,0)}else{o3.position.set(c.ln.v-lane,o.y,o.cz+p);o3.rotation.set(0,c.dir>0?-Math.PI/2:Math.PI/2,0)}
      o3.scale.set(1,1,1);o3.updateMatrix();m.setMatrixAt(i,o3.matrix)});m.instanceMatrix.needsUpdate=true});
    if(k==="amb"||k==="police"){const bm=ids.map(()=>{const b=new T.Mesh(G.sph0,new T.MeshBasicMaterial({color:0xef4444}));b.scale.set(.4,.25,.4);world.add(b);return b});
      anims.push(t=>{const on=Math.floor(t*5)%2;const mat=new T.Matrix4(),v=new T.Vector3();bm.forEach((b,i)=>{m.getMatrixAt(i,mat);v.setFromMatrixPosition(mat);b.position.set(v.x,v.y+2,v.z);b.material.color.set(on?(k==="amb"?"#ef4444":"#2563eb"):(k==="amb"?"#ffffff":"#ef4444"))})})}}
}
/* cortège ou convoi : véhicules en file indienne, gyrophares, motards en tête */
function convoy(spec,o){
  const grp=[];let off=0;const beac=[];
  for(const v of spec){const mt=M.veh.clone();mt.color.set(v.c||"#ffffff");const m=new T.Mesh(G[v.k],mt);m.castShadow=true;if(v.s)m.scale.set(v.s,v.s,v.s);world.add(m);grp.push({m,off,lat:v.lat||0});off-=v.gap||(v.k==="moto"?3.2:6.5);
    if(v.b){const b=new T.Mesh(G.sph0,new T.MeshBasicMaterial({color:0x2563eb}));b.scale.set(.35,.22,.35);world.add(b);beac.push({b,g:grp[grp.length-1],h:v.k==="moto"?1.6:2,a:v.b[0],c:v.b[1]})}}
  const st={x:o.x0};
  anims.push((t,dt)=>{const sp=typeof o.speed==="function"?o.speed(st.x):o.speed;st.x+=dt*sp;if(o.x1!=null&&st.x>o.x1)st.x=o.x1;
    for(const g of grp){const x=st.x+g.off,z=(o.z||0)+g.lat;g.m.position.set(x,Hfn(x,z)+(o.y||0)+.06,z);g.m.rotation.y=0}
    const on=Math.floor(t*6)%2;for(const b of beac){b.b.position.set(b.g.m.position.x,b.g.m.position.y+b.h,b.g.m.position.z);b.b.material.color.set(on?b.a:b.c)}});
  return st;
}
const CORTEGE=[{k:"moto",c:"#f8fafc",b:["#2563eb","#ef4444"],lat:-.9},{k:"moto",c:"#f8fafc",b:["#ef4444","#2563eb"],lat:.9,gap:3.5},{k:"moto",c:"#f8fafc",b:["#2563eb","#ef4444"],lat:-.9},{k:"moto",c:"#f8fafc",b:["#ef4444","#2563eb"],lat:.9,gap:4},
  {k:"police",c:"#1e3a8a",b:["#2563eb","#ef4444"]},{k:"car",c:"#0b0b0b",s:1.15},{k:"car",c:"#0b0b0b",s:1.15},{k:"car",c:"#0b0b0b",s:1.15},{k:"police",c:"#14532d",b:["#ef4444","#2563eb"]},{k:"amb",c:"#ffffff",b:["#ef4444","#ffffff"]},{k:"moto",c:"#f8fafc",b:["#2563eb","#ef4444"]}];
const CONVOI=[{k:"moto",c:"#f8fafc",b:["#2563eb","#ef4444"]},{k:"car",c:"#0b0b0b",s:1.1},{k:"police",c:"#1e3a8a",b:["#ef4444","#2563eb"]}];
function cityRad(pop){return pop>=3e6?56:pop>=1e6?46:pop>=4e5?38:pop>=2e5?30:pop>=8e4?24:18}
function cityTall(pop){return pop>=2e6?true:pop>=3e5?"mid":false}

S3.show=function(o){
  if(!S3.ok)return;if(filmMode||streetMode){lastShow=o;return}keepOut=[];lastShow=o;
  const key=JSON.stringify(o);if(current&&current.key===key)return;
  resetWorld(key,o.overlay==="conseil");
  cam.minR=30;cam.maxR=170;cam.target.set(0,4,0);cam.r=o.overlay?60:100;cam.phi=o.overlay?1.12:1.02;cam.auto=true;
  if(o.overlay==="conseil"){Hfn=()=>0;sunL.castShadow=false;council();return}
  const land=o.land||"ville",L=LANDS[land]||LANDS.ville;
  scene.fog=new T.FogExp2(col(L.sky[1]),L.fog*(reduce?.8:1));renderer.setClearColor(col(L.sky[1]));
  Hfn=heightFn(land);waterLevel=L.wl;
  const CP={sahel:[-10,15],savane:[-30,-30],plateau:[20,10],hauts:[0,0],grassfields:[0,0],volcan:[40,25],foret:[0,62],cote:[-30,-10]};
  const pop=o.city&&o.city.pop||(land==="ville"?4.3e6:land==="port"?4.1e6:0);const prof=o.profile||"autre";let cityR=0,cc=null;
  if(land==="ville"){cityR=Math.min(56,cityRad(pop));flattenAround(0,0,cityR+2)}
  else if(land==="port"){cityR=Math.min(42,cityRad(pop));flattenAround(34,6,cityR+2,1.6)}
  else if(pop){cityR=Math.min(40,cityRad(pop));cc=CP[land]||[0,0];flattenAround(cc[0],cc[1],cityR+3);keepOut.push([cc[0],cc[1],cityR+5])}
  sky(L);buildTerrain(land,L);
  const ov0=o.overlay,mx=land==="port"?30:land==="ville"?0:0,mz=land==="port"?10:15;
  keepOut=ov0==="meeting"?[[0,32,36]]:ov0==="marche"?[[land==="port"?30:5,land==="port"?10:15,30]]:ov0==="village"?[[land==="port"?40:-10,land==="port"?20:-5,24]]:[];
  const ok=dry(L.wl);
  // décor par paysage
  if(land==="sahel"){trees("acacia",spots(60,ok));trees("bush",spots(120,ok));trees("baobab",spots(6,ok,80));huts(spots(40,(x,z,y)=>y<4&&z>-10,70),"round");if(free(25,20))mosque(25,20);
    roadCars(u=>({x:-130+u*260,z:40,a:0}),6,["#e6e1d8","#c43b2b","#2b4f7a"],.02)}
  else if(land==="savane"){trees("acacia",spots(70,ok));trees("baobab",spots(8,ok));trees("bush",spots(80,ok));cattle(spots(40,(x,z,y)=>ok(x,z,y)&&y<5,60));huts(spots(25,(x,z,y)=>ok(x,z,y)&&y<6,50),"round");if(free(-30,-10))mosque(-30,-10);if(!cc)city(-30,-30,22,40,false)}
  else if(land==="plateau"){trees("acacia",spots(40,ok));trees("bush",spots(100,ok));cattle(spots(70,ok,90));huts(spots(20,(x,z,y)=>ok(x,z,y)&&y<8,50),"round");if(!cc)city(20,10,20,35,false);if(free(18,-6))mosque(18,-6)}
  else if(land==="ville"){trees("jungle",spots(90,(x,z,y)=>Math.hypot(x,z)>50));trees("palm",spots(30,(x,z)=>Math.hypot(x,z)<50&&Math.hypot(x,z)>20));if(o.palais)keepOut.push([0,-60,26]);cityGrid(0,0,cityR,cityTall(pop),{profile:prof,cortege:o.cortege});
    if(o.palais)palais(0,-60)}
  else if(land==="port"){cityGrid(34,6,cityR,cityTall(pop),{profile:prof});trees("mangrove",spots(80,(x,z,y)=>y<1.4&&y>-1.5));trees("palm",spots(30,(x,z,y)=>y>1));
    const cont=[];for(let i=0;i<14;i++)for(let j=0;j<5;j++)for(let k=0;k<rr(1,4);k++){const x=-2+i*3.2,z=-55+j*3;cont.push({x,y:Hfn(x,z)-.2+k*2.6,z,sx:3,sy:2.6,sz:2.8,c:pick(["#c0392b","#2471a3","#1e8449","#d68910","#7d3c98","#e5e7e9"])})}
    inst(G.box,M.flat,cont);
    const cr=[];for(let i=0;i<4;i++){const x=-12,z=-62+i*6;cr.push({x,y:0,z,sx:1.2,sy:18,sz:1.2,c:"#d35400"},{x:x-6,y:17,z,sx:18,sy:1,sz:1,c:"#d35400"})}inst(G.box,M.metal,cr);
    inst(G.box,M.flat,[{x:-40,y:.8,z:40,sx:70,sy:.8,sz:5,c:"#c9c9c9"}]);
}
  else if(land==="hauts"||land==="grassfields"){trees("euca",spots(land==="hauts"?120:60,ok));trees("banana",spots(60,(x,z,y)=>y<14));trees("bush",spots(60,ok));
    huts(spots(55,(x,z,y)=>y<16&&Math.hypot(x,z)>25),"house");huts(spots(4,(x,z,y)=>Math.hypot(x,z)<40,60),"chef");if(free(-28,22))church(-28,22);if(land==="grassfields")cattle(spots(25,ok))}
  else if(land==="volcan"){trees("jungle",spots(140,(x,z,y)=>y>3&&y<35));trees("banana",spots(180,(x,z,y)=>y>.5&&y<6&&z>0));trees("palm",spots(40,(x,z,y)=>y>.3&&y<3));huts(spots(35,(x,z,y)=>y>.8&&y<8,90),"house");if(!cc)city(40,25,18,30,false)}
  else if(land==="foret"){trees("jungle",spots(reduce?220:420,(x,z,y)=>ok(x,z,y)&&Math.abs(z-(Math.sin(x/22)*10+18))>5,130));huts(spots(16,(x,z,y)=>Math.abs(z-(Math.sin(x/22)*10+18))<9&&Math.abs(z-(Math.sin(x/22)*10+18))>3,60),"round");
    roadCars(u=>{const x=-100+u*200;return{x,z:Math.sin(x/22)*10+18,a:-Math.atan(Math.cos(x/22)*10/22)}},4,["#6d4c41","#c62828","#455a64"],.012)}
  else if(land==="cote"){trees("jungle",spots(220,(x,z,y)=>y>2.5));trees("palm",spots(70,(x,z,y)=>y>.4&&y<3));if(!cc)city(-30,-10,20,40,false);
    const pg=[];for(let i=0;i<10;i++)pg.push({x:rr(-60,60),y:.1,z:rr(30,60),sx:1.2,sy:.6,sz:6,ry:rr(0,3),c:pick(["#8d5524","#c68642","#2e86c1","#e74c3c"])});inst(G.box,M.flat,pg);
    inst(G.box,new T.MeshLambertMaterial({color:0xffffff,emissive:0x444444}),[{x:10,y:0,z:19,sx:10,sy:5,sz:2,c:"#f2f7fa"}])}
  if(cc)cityGrid(cc[0],cc[1],cityR,cityTall(pop),{profile:prof});
  // surimpressions
  const ov=o.overlay;
  if(ov==="meeting")meeting(0,20,o.color||"#1d8a4a",o.banner||"MEETING",o.sub||"");
  else if(ov==="marche")market(land==="port"?30:5,land==="port"?10:15);
  else if(ov==="village")village(land==="port"?40:-10,land==="port"?20:-5,land==="sahel"||land==="savane"||land==="plateau"||land==="foret"?"round":land==="hauts"||land==="grassfields"?"chef":"house");
  else if(land!=="ville"&&land!=="port"){const pp=spots(40,(x,z,y)=>ok(x,z,y)&&Math.hypot(x,z)<40,40);people(pp,{wander:1})}
  applyHour();
};
function resetWorld(key,interior){
  if(world){world.traverse(ob=>{if(ob.isMesh||ob.isInstancedMesh||ob.isPoints||ob.isLineSegments){if(ob.geometry&&!Object.values(G).includes(ob.geometry))ob.geometry.dispose();const m=ob.material;if(m&&!Object.values(M).includes(m)&&!nightMats.includes(m)){if(m.map&&!Object.values(M).some(x=>x.map===m.map))m.map.dispose();m.dispose()}}});scene.remove(world)}
  world=new T.Group();scene.add(world);anims=[];flagMeshes=[];waterMesh=null;skyMesh=null;
  current={key,interior};rng=mulberry(hashStr(key));seedNoise(rng);lights();
}

S3.nudge=function(){cam.auto=true};
/* =====================================================================
   REPORTAGES VIDÉO : scènes filmées en 3D avec caméra scriptée (plans, travellings, drone, caméra à l'épaule)
   ===================================================================== */
let puff=null;
function puffTex(){if(!puff)puff=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"rgba(255,255,255,1)");r.addColorStop(.45,"rgba(255,255,255,.55)");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,w,h)});return puff}
function fireFx(em,o){o=o||{};const n=reduce?60:(o.n||180);const geo=new T.BufferGeometry(),pos=new Float32Array(n*3),cl=new Float32Array(n*3),st=[];
  for(let i=0;i<n;i++)st.push({e:em[i%em.length],life:rng(),sp:rr(1.2,2.6),ox:0,oz:0});
  geo.setAttribute("position",new T.BufferAttribute(pos,3));geo.setAttribute("color",new T.BufferAttribute(cl,3));
  const pts=new T.Points(geo,new T.PointsMaterial({size:o.size||2.2,map:puffTex(),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));pts.frustumCulled=false;world.add(pts);
  const c1=col("#fff3b0"),c2=col("#ff6a00"),c3=col("#5a1000");
  anims.push((t,dt)=>{for(let i=0;i<n;i++){const s=st[i];s.life+=dt*s.sp*.7;if(s.life>1){s.life=0;s.ox=rr(-1,1)*s.e.r;s.oz=rr(-1,1)*s.e.r}const L=s.life;pos[i*3]=s.e.x+s.ox*(1-L*.6)+Math.sin(t*9+i)*.12;pos[i*3+1]=s.e.y+L*(o.h||3.5);pos[i*3+2]=s.e.z+s.oz*(1-L*.6);const c=L<.3?mix(c1,c2,L/.3):mix(c2,c3,(L-.3)/.7),k=1-L;cl[i*3]=c.r*k;cl[i*3+1]=c.g*k;cl[i*3+2]=c.b*k}geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true});
  const pl=new T.PointLight(0xff7a2a,2.2,45);pl.position.set(em[0].x,em[0].y+3,em[0].z);world.add(pl);anims.push(t=>{pl.intensity=1.8+Math.sin(t*17)*.5+Math.sin(t*6)*.3});
}
function smokeFx(em,o){o=o||{};const n=reduce?10:(o.n||26);const arr=[];
  for(let i=0;i<n;i++){const m=new T.SpriteMaterial({map:puffTex(),color:o.color||0x3a3a3a,transparent:true,depthWrite:false,opacity:0});const sp=new T.Sprite(m);world.add(sp);arr.push({sp,e:em[i%em.length],life:i/n,spd:rr(.07,.14),dx:rr(-1,1),dz:rr(-1,1)})}
  anims.push((t,dt)=>{for(const a of arr){a.life+=dt*a.spd*(o.speed||1);if(a.life>1){a.life=0;a.dx=rr(-1,1);a.dz=rr(-1,1)}const L=a.life;a.sp.position.set(a.e.x+a.dx*L*(o.spread||5)+L*(o.wind||6),a.e.y+L*(o.h||24),a.e.z+a.dz*L*(o.spread||5));const sc=(o.s0||3)+L*(o.s1||16);a.sp.scale.set(sc,sc,1);a.sp.material.opacity=(o.op||.6)*Math.sin(Math.PI*Math.min(1,L*1.15))}});
}
function rainFx(){const n=reduce?500:1500;const g=new T.BufferGeometry(),p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=rr(-45,45),y=rr(0,40),z=rr(-45,45);p.set([x,y,z,x-.25,y-1.3,z],i*6)}
  g.setAttribute("position",new T.BufferAttribute(p,3));const m=new T.LineSegments(g,new T.LineBasicMaterial({color:0xb8c6d6,transparent:true,opacity:.5}));m.frustumCulled=false;world.add(m);
  anims.push((t,dt)=>{const f=script?script.focus:cam.target;m.position.set(f.x,f.y-8,f.z);for(let i=0;i<n;i++){let y=p[i*6+1]-dt*36;if(y<0)y+=40;p[i*6+1]=y;p[i*6+4]=y-1.3}g.attributes.position.needsUpdate=true});}
function beacons(list){if(!list.length)return;const ms=list.map(b=>{const m=new T.Mesh(G.sph0,new T.MeshBasicMaterial({color:b.a}));m.position.set(b.x,b.y,b.z);m.scale.set(.45,.3,.45);world.add(m);return[m,b]});
  const pl=new T.PointLight(0x3b82f6,2,28);pl.position.set(list[0].x,list[0].y+1,list[0].z);world.add(pl);
  anims.push(t=>{const on=Math.floor(t*5)%2;ms.forEach(([m,b],i)=>m.material.color.set((on+i)%2?b.a:b.b));pl.color.set(on?list[0].a:list[0].b)});}
function sign(text,x,y,z,w,h,bg,fg,ry,font){const tx=canvasTex(512,Math.round(512*h/w),(g,W,H)=>{g.fillStyle=bg||"#fff";g.fillRect(0,0,W,H);g.fillStyle=fg||"#111";g.font="bold "+(font||Math.round(H*.55))+"px 'Arial Black',Arial,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(text,W/2,H/2,W-24)});
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,side:T.DoubleSide,roughness:.8}));m.position.set(x,y,z);m.rotation.y=ry||0;m.castShadow=true;world.add(m);return m}
function crowdAt(cx,cz,w,d,n,o){const pts=[];for(let i=0;i<n;i++){const x=cx+rr(-w/2,w/2),z=cz+rr(-d/2,d/2);pts.push({x,y:Hfn(x,z)+((o&&o.dy)||0),z})}people(pts,o||{bob:2});return pts}
function placards(pts,texts,frac){pts.filter(()=>rng()<(frac||.14)).forEach(p=>sign(pick(texts),p.x,p.y+3.2,p.z,2.4,.8,pick(["#ffffff","#fde68a","#fee2e2"]),"#111",Math.PI/2+rr(-.3,.3)))}
function corridor(land){const base=Hfn;const sm=x=>(base(x-6,0)+base(x,0)+base(x+6,0))/3;Hfn=(x,z)=>{const a=Math.abs(z);if(a<8)return sm(x);if(a<26){const t=(a-8)/18,k=t*t*(3-2*t);return sm(x)*(1-k)+base(x,z)*k}return base(x,z)}}
function roadStrip(x0,x1,z,w,mat,rep){const len=x1-x0,g=new T.PlaneGeometry(w,len,1,Math.ceil(len/2));g.rotateX(-Math.PI/2);g.rotateY(Math.PI/2);g.translate((x0+x1)/2,0,z);
  const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,Hfn(p.getX(i),p.getZ(i))+.08);g.computeVertexNormals();
  const m2=mat.clone();if(mat.map){m2.map=mat.map.clone();m2.map.needsUpdate=true;m2.map.repeat.set(1,rep||len/10)}const m=new T.Mesh(g,m2);m.receiveShadow=true;world.add(m);return m}
function movingVeh(kind,n,o){const items=[];for(let i=0;i<n;i++)items.push({x:0,y:0,z:0,c:pick(o.colors||["#f2c200","#e5e7eb","#1f2937","#991b1b"])});const m=inst(G[kind],M.veh,items,{dynamic:true});if(!m)return[];
  const st=items.map((_,i)=>({off:i/n+rr(0,.05),dir:i%2?1:-1}));const O=new T.Object3D();const posArr=items.map(()=>({x:0,z:0}));
  anims.push((t,dt)=>{st.forEach((c,i)=>{let u=(c.off+t*(o.speed||.01)*c.dir+10)%1;const x=o.x0+(o.x1-o.x0)*u;let z=(o.z||0)+c.dir*1.7;if(o.swerve)z+=Math.sin(x*.35+i)*o.swerve;const y=Hfn(x,z)+.06+(o.bump?Math.abs(Math.sin(t*9+i*2))*o.bump:0);
    O.position.set(x,y,z);O.rotation.set(o.bump?Math.sin(t*7+i)*.04:0,c.dir>0?0:Math.PI,o.bump?Math.sin(t*8+i)*.05:0);O.updateMatrix();m.setMatrixAt(i,O.matrix);posArr[i].x=x;posArr[i].z=z});m.instanceMatrix.needsUpdate=true});return posArr}
function V(x,dy,z){return new T.Vector3(x,Hfn(x,z)+dy,z)}
function shot(d,p0,p1,l0,l1,o){return Object.assign({d,p0,p1,l0,l1},o||{})}
function runScript(dt){const sc=script;if(!sc.paused)sc.t+=dt;
  if(sc.segs){let acc=0,idx=sc.segs.length-1;for(let i=0;i<sc.segs.length;i++){if(sc.t<acc+sc.segs[i].d){idx=i;break}acc+=sc.segs[i].d}if(idx===sc.segs.length-1&&sc.t>=sc.total)acc=sc.total-sc.segs[idx].d;
    if(idx!==sc.cur){sc.cur=idx;sc.segT0=acc;const onEnd=sc.onEnd,onP=sc.onProgress;sc.shots=sc.segs[idx].build();script=sc;sc.onEnd=onEnd;sc.onProgress=onP;applyHour()}}
  const T0=sc.t-(sc.segT0||0);let acc=0,sh=sc.shots[sc.shots.length-1],lt=sh.d;
  for(const s of sc.shots){if(T0<acc+s.d){sh=s;lt=T0-acc;break}acc+=s.d}
  if(sc.t>=sc.total&&!sc.ended){sc.ended=true;lt=sh.d;if(sc.onEnd)sc.onEnd()}
  const u=Math.min(1,Math.max(0,lt/sh.d)),e=sh.lin?u:u*u*(3-2*u);const P=sh.p0.clone().lerp(sh.p1,e),Lk=sh.l0.clone().lerp(sh.l1,e);
  if(sh.follow){const f=sh.follow();P.x+=f.x;Lk.x+=f.x}
  if(sc.segs&&!sh.abs){P.y+=Hfn(P.x,P.z);Lk.y+=Hfn(Lk.x,Lk.z)}
  if(sh.hand){const q=sc.t;P.x+=Math.sin(q*1.7)*.14+Math.sin(q*4.3)*.05;P.y+=Math.sin(q*2.3)*.1;Lk.x+=Math.sin(q*1.1)*.18;Lk.y+=Math.sin(q*1.9)*.08}
  const gh=Hfn(P.x,P.z);if(P.y<gh+.8)P.y=gh+.8;
  camera.position.copy(P);camera.lookAt(Lk);sc.focus.copy(Lk);
  if(sc.onProgress)sc.onProgress(Math.min(1,sc.t/sc.total),sc.shots.indexOf(sh));}

const CITY_T=["greve","emeute","inondation","incendie","hopital","delestage","trafic","ville","marche"];
S3.film=function(o){
  if(!S3.ok)return false;if(streetMode)S3.streetStop();
  filmMode=true;const type=o.type||"ville";let land=o.land||"ville";
  if(type==="glissement"&&!["hauts","grassfields","volcan"].includes(land))land="hauts";
  resetWorld("film-"+type+"-"+(o.seed||0),false);keepOut=[];current.dark=type==="delestage";
  forceNight=type==="delestage"?21.5:type==="inondation"||type==="glissement"?16.5:o.hour||rr(9.5,16);
  let L=LANDS[land]||LANDS.ville;if(["inondation","glissement"].includes(type))L=Object.assign({},L,{sky:["#7d868f","#b9bfc4"],fog:L.fog*1.8});
  scene.fog=new T.FogExp2(col(L.sky[1]),L.fog*(reduce?.8:1));Hfn=heightFn(land);waterLevel=L.wl;
  const city=CITY_T.includes(type);let C={x:land==="port"?34:0,z:land==="port"?6:0};let shots=[];
  if(city){flattenAround(C.x,C.z,50,land==="port"?1.6:undefined);waterLevel=land==="port"?L.wl:null;
    if(["incendie","marche","hopital"].includes(type))keepOut=[[C.x,C.z,23]];
    sky(L);buildTerrain(land,L);trees(land==="sahel"||land==="savane"||land==="plateau"?"acacia":"jungle",spots(60,(x,z,y)=>Math.hypot(x-C.x,z-C.z)>60));
    const tall=land==="ville"||land==="port";const calm=["greve","emeute","inondation","incendie","hopital","delestage"].includes(type);
    const cg=cityGrid(C.x,C.z,46,tall,{jam:type==="trafic",calm});
    const g=cg.y0;
    if(type==="greve"){const pts=crowdAt(C.x,C.z,34,4.5,reduce?90:170,{bob:1.2});placards(pts,o.slogans||["NOS ARRIÉRÉS !","GRÈVE GÉNÉRALE","RESPECT DES ACCORDS","NON À LA VIE CHÈRE"],.18);
      sign(o.banner||"GRÈVE — NOS DROITS",C.x,g+5.5,C.z,14,2.2,"#b91c1c","#ffffff",0);const sh=[];for(let i=-3;i<=3;i++){sh.push({x:C.x+i*6,y:g+.28,z:C.z-6.2,sx:4.5,sy:3,sz:.3,c:"#8a8f96"},{x:C.x+i*6,y:g+.28,z:C.z+6.2,sx:4.5,sy:3,sz:.3,c:"#8a8f96"})}inst(G.box,M.metal,sh);
      crowdAt(C.x+24,C.z-4,4,2,6,{party:"#1e3a8a",share:1});
      shots=[shot(7,V(C.x-45,16,C.z+1),V(C.x-28,11,C.z+1),V(C.x,0,C.z),V(C.x+6,0,C.z)),shot(7,V(C.x-22,1.7,C.z+3.6),V(C.x+12,1.7,C.z+3.6),V(C.x-10,1.6,C.z),V(C.x+22,1.6,C.z),{hand:1,lin:1}),shot(6,V(C.x+6,2.2,C.z+5),V(C.x+3,2.6,C.z+4),V(C.x+2,3,C.z),V(C.x-2,3.2,C.z),{hand:1})]}
    else if(type==="emeute"){const pts=crowdAt(C.x-6,C.z,30,5,reduce?110:220,{wander:1});placards(pts,o.slogans||["LIBÉREZ-LES !","ON EN A MARRE","JUSTICE"],.08);
      const tires=[],em=[];for(let i=-2;i<=2;i++){const x=C.x+16+rr(-1,1),z=C.z+i*1.4;for(let k=0;k<3;k++)tires.push({x,y:g+.1+k*.3,z,sx:1.4,sy:1.6,sz:1.4,c:"#151515"});em.push({x,y:g+.8,z,r:.8})}
      inst(G.disc,M.soft,tires);fireFx(em,{h:4});smokeFx(em.slice(0,3),{color:0x1a1a1a,h:28,op:.7});
      const pol=crowdAt(C.x+30,C.z,2.5,6,16,{party:"#1e3a8a",share:1});inst(G.box,M.soft,pol.map(p=>({x:p.x-.5,y:p.y+.4,z:p.z,sx:.15,sy:1.3,sz:.9,c:"#9ca3af"})));
      inst(G.police,M.veh,[{x:C.x+38,y:g+.06,z:C.z-1.7,c:"#1e3a8a",ry:Math.PI,sx:1.3,sy:1.3,sz:1.3},{x:C.x+40,y:g+.06,z:C.z+1.8,c:"#1e3a8a",ry:Math.PI,sx:1.3,sy:1.3,sz:1.3}]);
      beacons([{x:C.x+38,y:g+2.5,z:C.z-1.7,a:"#1d4ed8",b:"#ef4444"},{x:C.x+40,y:g+2.5,z:C.z+1.8,a:"#ef4444",b:"#1d4ed8"}]);smokeFx([{x:C.x+24,y:g+.5,z:C.z}],{color:0xe5e7eb,h:6,s1:10,op:.5,n:14,wind:-3});
      shots=[shot(7,V(C.x+60,18,C.z+1),V(C.x+46,12,C.z+1),V(C.x+10,1,C.z),V(C.x+4,1,C.z)),shot(7,V(C.x+8,1.8,C.z+4.5),V(C.x+13,1.8,C.z+4),V(C.x+18,1.5,C.z),V(C.x+16,2,C.z-1),{hand:1}),shot(6,V(C.x+34,2.5,C.z+4),V(C.x+33,2.5,C.z+2),V(C.x+10,1.8,C.z),V(C.x,1.8,C.z),{hand:1})]}
    else if(type==="inondation"){const w=new T.Mesh(new T.PlaneGeometry(120,120,1,1),M.flood);w.rotation.x=-Math.PI/2;w.position.set(C.x,g+1.15,C.z);world.add(w);anims.push(t=>{w.position.y=g+1.15+Math.sin(t*.8)*.05});
      const cars=[];for(let i=0;i<14;i++){const ax=rng()<.5;const v=Math.round(rr(-2,2))*cg.B;cars.push({x:ax?C.x+rr(-40,40):C.x+v+1.6,y:g-.25,z:ax?C.z+v-1.6:C.z+rr(-40,40),ry:ax?0:Math.PI/2,c:pick(["#f2c200","#e5e7eb","#1f2937"])})}inst(G.car,M.veh,cars);
      crowdAt(C.x,C.z,30,4,40,{wander:1,dy:-.9});rainFx();
      shots=[shot(7,V(C.x-30,1.6,C.z+2),V(C.x-8,1.6,C.z+2),V(C.x,1.2,C.z),V(C.x+15,1.2,C.z),{hand:1,lin:1}),shot(7,V(C.x-45,14,C.z+1),V(C.x-25,10,C.z+1),V(C.x,1,C.z),V(C.x+12,1,C.z)),shot(6,V(C.x+15,1.5,C.z-5),V(C.x+18,1.5,C.z-2),V(C.x+5,1,C.z),V(C.x,1,C.z+4),{hand:1})]}
    else if(type==="incendie"||type==="marche"){market(C.x,C.z);
      if(type==="incendie"){const em=[];for(let i=0;i<7;i++)em.push({x:C.x+rr(-15,15),y:g+1.5,z:C.z+rr(-9,9),r:1.8});fireFx(em,{n:260,h:5,size:2.8});smokeFx(em.slice(0,4),{color:0x222222,h:40,s1:24,op:.75,n:32});
        inst(G.truck,M.veh,[{x:C.x+28,y:g+.06,z:C.z+2,c:"#b91c1c"}]);beacons([{x:C.x+30.5,y:g+3.2,z:C.z+2,a:"#ef4444",b:"#fbbf24"}]);crowdAt(C.x-30,C.z,6,30,60,{bob:.8})}
      else sign(o.banner||"RIZ 25 KG : 18 500 F",C.x,Hfn(C.x,C.z-20)+4,C.z-19,9,2,"#fde68a","#111",0);
      shots=[shot(7,V(C.x-45,28,C.z+35),V(C.x-30,20,C.z+25),V(C.x,2,C.z),V(C.x,2,C.z)),shot(7,V(C.x-20,1.8,C.z+12),V(C.x-5,1.8,C.z+12),V(C.x-5,2,C.z),V(C.x+8,2,C.z),{hand:1,lin:1}),shot(6,V(C.x+22,3,C.z+10),V(C.x+18,3,C.z+6),V(C.x,3,C.z),V(C.x-3,4,C.z),{hand:1})]}
    else if(type==="hopital"){const y=Hfn(C.x,C.z-8);inst(G.box,M.fac[0][1],[{x:C.x,y,z:C.z-10,sx:32,sy:12,sz:12,c:"#ffffff"}]);sign(o.banner||"HÔPITAL RÉGIONAL",C.x,y+13.2,C.z-3.9,16,2.2,"#ffffff","#0f5132",0);
      sign("+",C.x-12,y+8,C.z-3.9,2.4,2.4,"#dc2626","#ffffff",0,110);crowdAt(C.x,C.z+2,26,6,reduce?40:80,{bob:.5});
      inst(G.amb,M.veh,[{x:C.x+14,y:y+.06,z:C.z+6,c:"#ffffff"},{x:C.x-16,y:y+.06,z:C.z+7,c:"#ffffff",ry:.4}]);beacons([{x:C.x+14,y:y+2.1,z:C.z+6,a:"#ef4444",b:"#ffffff"},{x:C.x-16,y:y+2.1,z:C.z+7,a:"#ffffff",b:"#ef4444"}]);
      inst(G.umb,M.flat,[{x:C.x-8,y:y+2.5,z:C.z+8,sx:7,sy:2,sz:7,c:"#e5e7eb"},{x:C.x+6,y:y+2.5,z:C.z+9,sx:7,sy:2,sz:7,c:"#e5e7eb"}]);
      shots=[shot(7,V(C.x-10,22,C.z+45),V(C.x,14,C.z+32),V(C.x,6,C.z-8),V(C.x,6,C.z-8)),shot(7,V(C.x-14,1.7,C.z+8),V(C.x+8,1.7,C.z+8),V(C.x-6,1.4,C.z+2),V(C.x+10,1.4,C.z+2),{hand:1,lin:1}),shot(6,V(C.x+20,2,C.z+10),V(C.x+17,2.2,C.z+8),V(C.x+14,1.2,C.z+6),V(C.x+10,2,C.z),{hand:1})]}
    else if(type==="delestage"){const em=[];for(let i=0;i<5;i++)em.push({x:C.x+rr(-30,30),y:g+.8,z:C.z+rr(-3,3)*(i%2?1:-1)+(i%2?5:-5),r:.2});fireFx(em,{n:40,h:.8,size:1.2});crowdAt(C.x,C.z,40,6,40,{wander:1});
      shots=[shot(7,V(C.x-50,40,C.z-50),V(C.x+20,36,C.z-45),V(C.x,0,C.z),V(C.x+10,0,C.z)),shot(7,V(C.x-25,1.7,C.z+2),V(C.x,1.7,C.z+2),V(C.x-10,2,C.z),V(C.x+15,2,C.z),{hand:1,lin:1}),shot(6,V(C.x+10,12,C.z+20),V(C.x-10,10,C.z+18),V(C.x,4,C.z),V(C.x,4,C.z))]}
    else if(type==="trafic"){movingVeh("moto",14,{x0:C.x-45,x1:C.x+45,z:C.z,speed:.012,swerve:.6,colors:["#b91c1c","#111827","#1d4ed8"]});
      shots=[shot(7,V(C.x-30,1.5,C.z+1),V(C.x-10,1.5,C.z+1),V(C.x,1.4,C.z),V(C.x+20,1.4,C.z),{hand:1,lin:1}),shot(7,V(C.x-45,14,C.z+1),V(C.x+10,12,C.z+1),V(C.x+10,0,C.z),V(C.x+40,0,C.z)),shot(6,V(C.x+5,6,C.z+2),V(C.x+15,6,C.z+8),V(C.x+10,0,C.z),V(C.x+20,0,C.z))]}
    else{shots=[shot(8,V(C.x-70,50,C.z-70),V(C.x-20,30,C.z-40),V(C.x,6,C.z),V(C.x+10,6,C.z)),shot(7,V(C.x-30,2,C.z+2),V(C.x+10,2,C.z+2),V(C.x,1.6,C.z),V(C.x+30,1.6,C.z),{lin:1}),shot(6,V(C.x+30,20,C.z+30),V(C.x+10,12,C.z+20),V(C.x,8,C.z),V(C.x,8,C.z))]}
  }else{
    // scènes rurales : route, glissement de terrain, attaque, contrôle, chantier, village
    if(type!=="glissement"&&type!=="village")corridor(land);
    sky(L);buildTerrain(land,L);const ok=dry(L.wl);const away=(x,z,y)=>ok(x,z,y)&&Math.abs(z)>12;
    const tk=land==="sahel"||land==="savane"||land==="plateau"?"acacia":land==="hauts"||land==="grassfields"?"euca":"jungle";trees(tk,spots(reduce?60:130,away));trees("bush",spots(60,away));
    if(type!=="glissement"&&type!=="village")huts(spots(18,(x,z,y)=>Math.abs(z)>11&&Math.abs(z)<30,80),land==="sahel"||land==="savane"?"round":"house");
    if(type==="route"){const bad=o.q!=="good";roadStrip(-130,130,0,7.5,bad?M.asphaltBad:M.asphalt,26);let hx=6;
      if(bad){const holes=[],pud=[],lat=[];for(let i=0;i<46;i++){const x=rr(-60,60),z=rr(-3,3),s=rr(.8,2.3);if(i===0)hx=x;const y=Hfn(x,z)+.02;holes.push({x,y,z,sx:s*1.2,sy:.4,sz:s,c:"#1c1814"});if(rng()<.7)pud.push({x,y:y+.07,z,sx:s*.8,sy:.05,sz:s*.65,c:"#ffffff"})}
        for(let i=0;i<30;i++){const x=rr(-80,80),sd=rng()<.5?-1:1;lat.push({x,y:Hfn(x,sd*3.7)+.02,z:sd*rr(3.2,4.2),sx:rr(2,6),sy:.12,sz:rr(.6,1.4),c:"#9a4a28"})}
        inst(G.disc,M.soft,holes,{noShadow:true});inst(G.disc,M.water,pud,{noShadow:true});inst(G.box,M.soft,lat,{noShadow:true});
        inst(G.truck,M.veh,[{x:hx+10,y:Hfn(hx+10,1.6)-.35,z:1.6,rz:.12,rx:.08,c:"#ffffff"}]);crowdAt(hx+14,2.5,3,2,6,{bob:3});smokeFx([{x:hx+18,y:Hfn(hx+18,0)+.4,z:0},{x:hx-20,y:Hfn(hx-20,0)+.4,z:0}],{color:0xb08a60,h:5,s1:12,op:.4,n:16,wind:3})}
      movingVeh(pick(["car","taxi","bus"]),6,{x0:-120,x1:120,speed:bad?.0035:.012,bump:bad?.12:0,swerve:bad?.9:0});movingVeh("truck",3,{x0:-120,x1:120,speed:bad?.0025:.009,bump:bad?.1:0,swerve:bad?.6:0,colors:["#ffffff","#9ca3af"]});
      shots=[shot(7,V(-40,2.2,5.5),V(-12,2.2,5.5),V(-28,1,0),V(2,1,0),{hand:1,lin:1}),shot(7,V(-35,42,-35),V(30,36,-20),V(0,0,0),V(15,0,0)),shot(6,V(hx-6,1.3,3),V(hx-3.5,1,2.2),V(hx,0,0),V(hx+1,0,0),{hand:1})]}
    else if(type==="glissement"){let best={x:0,z:-30,s:0};for(let i=0;i<60;i++){const x=rr(-50,50),z=rr(-50,50);if(Math.hypot(x,z)<22)continue;const s=Math.hypot(Hfn(x+2,z)-Hfn(x-2,z),Hfn(x,z+2)-Hfn(x,z-2));if(s>best.s)best={x,z,s}}
      const gx=(Hfn(best.x+2,best.z)-Hfn(best.x-2,best.z)),gz=(Hfn(best.x,best.z+2)-Hfn(best.x,best.z-2));const gl=Math.hypot(gx,gz)||1;const dx=-gx/gl,dz=-gz/gl;
      const top={x:best.x-dx*18,z:best.z-dz*18},bot={x:best.x+dx*26,z:best.z+dz*26};const len=Math.hypot(bot.x-top.x,bot.z-top.z);
      const mg=new T.PlaneGeometry(16,len,10,30);mg.rotateX(-Math.PI/2);const ang=Math.atan2(dx,dz);mg.rotateY(ang);mg.translate((top.x+bot.x)/2,0,(top.z+bot.z)/2);
      const P=mg.attributes.position,cc=new Float32Array(P.count*3);for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);const lx=(x-(top.x+bot.x)/2)*Math.cos(ang)-(z-(top.z+bot.z)/2)*Math.sin(ang);const edge=1-Math.min(1,Math.abs(lx)/8);P.setY(i,Hfn(x,z)+edge*1.6+vnoise(x*.5,z*.5)*.8-.3);const c=mix(col("#5b3a22"),col("#8a5a34"),vnoise(x*.3,z*.3));cc.set([c.r,c.g,c.b],i*3)}
      mg.setAttribute("color",new T.BufferAttribute(cc,3));mg.computeVertexNormals();const mm=new T.Mesh(mg,new T.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.05}));mm.receiveShadow=true;mm.castShadow=true;world.add(mm);
      const rocks=[];for(let i=0;i<50;i++){const u=rng(),x=top.x+(bot.x-top.x)*u+rr(-6,6),z=top.z+(bot.z-top.z)*u+rr(-6,6);rocks.push({x,y:Hfn(x,z)+rr(.5,1.5),z,sx:rr(.6,2.2),sy:rr(.5,1.6),sz:rr(.6,2),c:pick(["#6b5f55","#7a6a5a","#4a4038"])})}inst(G.sph0,M.flat,rocks);
      const hs=[];for(let i=0;i<6;i++){const x=bot.x+rr(-9,9),z=bot.z+rr(-6,6);hs.push({x,y:Hfn(x,z)-.6,z,sx:4,sy:2.6,sz:3.5,rz:rr(-.5,.5),rx:rr(-.4,.4),ry:rr(0,3),c:pick(["#c9a27a","#d8c3a0","#e0d6c2"])})}inst(G.box,M.soft,hs);
      const B2={x:bot.x+dx*8,z:bot.z+dz*8};crowdAt(B2.x,B2.z,10,6,18,{party:"#f97316",share:.7,wander:1});inst(G.truck,M.veh,[{x:B2.x+6,y:Hfn(B2.x+6,B2.z)+.05,z:B2.z,c:"#f59e0b",ry:ang}]);
      inst(G.amb,M.veh,[{x:B2.x-6,y:Hfn(B2.x-6,B2.z+3)+.05,z:B2.z+3,c:"#ffffff"}]);beacons([{x:B2.x-6,y:Hfn(B2.x-6,B2.z+3)+2.1,z:B2.z+3,a:"#ef4444",b:"#ffffff"}]);rainFx();
      const mid={x:(top.x+bot.x)/2,z:(top.z+bot.z)/2};
      shots=[shot(7,V(B2.x+dx*40+dz*20,35,B2.z+dz*40-dx*20),V(B2.x+dx*25+dz*10,25,B2.z+dz*25-dx*10),V(mid.x,0,mid.z),V(top.x,0,top.z)),shot(7,V(B2.x+dz*10,1.8,B2.z-dx*10),V(B2.x+dz*4,1.8,B2.z-dx*4),V(B2.x,1.5,B2.z),V(bot.x,1.5,bot.z),{hand:1}),shot(6,V(bot.x+dz*12,4,bot.z-dx*12),V(bot.x-dz*10,4,bot.z+dx*10),V(bot.x,0,bot.z),V(bot.x,0,bot.z))]}
    else if(type==="attaque"||type==="controle"){roadStrip(-130,130,0,7.5,M.asphaltBad,26);
      const bar=[{x:0,y:Hfn(0,-2)+.9,z:-1.9,sx:.2,sy:.2,sz:3.6,c:"#ef4444"},{x:0,y:Hfn(0,2)+.9,z:1.9,sx:.2,sy:.2,sz:3.6,c:"#ffffff"}];inst(G.box,M.soft,bar);
      const sand=[];for(let i=0;i<8;i++)sand.push({x:rr(-3,3),y:Hfn(0,-5)+.2,z:-5-rr(0,1),sx:1.2,sy:.6,sz:.7,c:"#a89060"});inst(G.box,M.soft,sand);
      if(type==="attaque"){crowdAt(2,-5,6,2,10,{party:"#4b5320",share:1});inst(G.truck,M.veh,[{x:-8,y:Hfn(-8,-5.5)+.05,z:-5.5,c:"#4b5320"}]);
        const wr=[{x:18,y:Hfn(18,1.5)+.02,z:1.5,ry:.6,rz:.15,c:"#1c1a18"},{x:24,y:Hfn(24,-2)+.02,z:-2,ry:-1.2,c:"#2a2522"}];inst(G.wreck,M.veh,wr);inst(G.disc,M.soft,wr.map(w=>({x:w.x,y:w.y,z:w.z,sx:6,sy:.2,sz:5,c:"#111"})),{noShadow:true});smokeFx([{x:18,y:Hfn(18,1.5)+1,z:1.5}],{color:0x2a2a2a,h:18,op:.5,n:18})}
      else{crowdAt(1,-4.5,4,2,5,{party:"#1e3a8a",share:1});const q=[];for(let i=0;i<7;i++)q.push({x:-8-i*5.5,y:Hfn(-8-i*5.5,1.7)+.06,z:1.7,c:i%3?"#f2c200":"#e5e7eb"});inst(G.taxi,M.veh,q);inst(G.moto,M.veh,[{x:-4,y:Hfn(-4,2.8)+.06,z:2.8,c:"#b91c1c"},{x:-6,y:Hfn(-6,3.2)+.06,z:3.2,c:"#111827"}])}
      shots=[shot(7,V(-45,2,1.7),V(-18,2,1.7),V(-10,1.5,0),V(5,1.5,0),{hand:1,lin:1}),shot(7,V(8,1.8,-9),V(4,1.8,-8),V(1,1.6,-4.5),V(0,1.4,0),{hand:1}),shot(6,V(-30,30,-30),V(20,28,-25),V(0,0,0),V(10,0,0))]}
    else if(type==="chantier"){roadStrip(-130,0,0,7.5,M.asphalt,13);const lat=new T.MeshStandardMaterial({color:0x9a4a28,roughness:1});roadStrip(0,130,0,8,lat,1);
      inst(G.box,M.veh,[{x:6,y:Hfn(6,0)+.1,z:0,sx:4,sy:2,sz:2.2,c:"#f59e0b"},{x:4,y:Hfn(4,0)+.1,z:0,sx:1.2,sy:1.4,sz:2.4,c:"#374151"},{x:18,y:Hfn(18,2)+.1,z:2,sx:3.4,sy:1.8,sz:2.2,c:"#f59e0b"},{x:20,y:Hfn(20,2)+1.9,z:2,sx:4,sy:.4,sz:.4,c:"#f59e0b",rz:-.5}]);
      crowdAt(10,0,20,6,16,{party:"#f97316",share:.9,wander:1});sign(o.banner||"TRAVAUX — MINTP",-4,Hfn(-4,-6)+2.5,-6,6,1.6,"#f59e0b","#111",0);smokeFx([{x:12,y:Hfn(12,0)+.3,z:0}],{color:0xb08a60,h:4,op:.35,n:12});
      movingVeh("truck",2,{x0:-60,x1:40,speed:.006,colors:["#f59e0b"]});
      shots=[shot(7,V(-30,24,-30),V(-5,18,-25),V(10,0,0),V(12,0,0)),shot(7,V(-2,1.8,5),V(8,1.8,5),V(4,1.5,0),V(16,1.5,0),{hand:1,lin:1}),shot(6,V(25,5,8),V(22,4,6),V(10,1,0),V(8,1,0))]}
    else{village(0,0,land==="sahel"||land==="savane"||land==="plateau"||land==="foret"?"round":land==="hauts"||land==="grassfields"?"chef":"house");
      inst(G.box,M.soft,[{x:4,y:Hfn(4,4),z:4,sx:.6,sy:1.4,sz:.6,c:"#1d4ed8"}]);crowdAt(6,4,5,2,10,{bob:1});
      shots=[shot(7,V(-40,24,-30),V(-20,16,-20),V(0,1,0),V(0,1,0)),shot(7,V(12,1.7,10),V(6,1.7,8),V(4,1.2,4),V(0,1.2,0),{hand:1}),shot(6,V(-10,8,20),V(10,8,20),V(0,1,0),V(0,1,0))]}
  }
  applyHour();
  script={shots,total:shots.reduce((a,s)=>a+s.d,0),t:0,focus:new T.Vector3(),onEnd:o.onEnd,onProgress:o.onProgress};
  return true;
};

/* =====================================================================
   VIDÉOS DE DÉPLACEMENT : cortège, convoi, voiture avec chauffeur, taxi, bendskin, bus, train Camrail, avion, hélicoptère
   ===================================================================== */
function groupMesh(parts){const g=new T.Group();for(const p of parts){const mt=new T.MeshStandardMaterial({color:p.c,roughness:p.r!=null?p.r:.4,metalness:p.m||.2});const m=new T.Mesh(p.g,mt);m.position.set(p.x||0,p.y||0,p.z||0);if(p.rx)m.rotation.x=p.rx;if(p.ry)m.rotation.y=p.ry;if(p.rz)m.rotation.z=p.rz;m.scale.set(p.sx||1,p.sy||1,p.sz||1);m.castShadow=true;g.add(m)}world.add(g);return g}
function planeMesh(liv,pres){const cyl=new T.CylinderGeometry(1.4,1.4,1,14),nose=new T.SphereGeometry(1.4,12,8),bx=new T.BoxGeometry(1,1,1);
  return groupMesh([{g:cyl,c:"#f8fafc",rz:Math.PI/2,sy:24,y:2.6},{g:nose,c:"#f8fafc",x:12,y:2.6,sx:1.8},{g:nose,c:"#e5e7eb",x:-12,y:2.9,sx:1.4,sy:.8},
   {g:bx,c:liv[0],x:0,y:2.3,sx:24,sy:.35,sz:2.86},{g:bx,c:liv[1]||liv[0],x:0,y:1.9,sx:24,sy:.25,sz:2.86},
   {g:bx,c:"#e5e7eb",x:0,y:2,sx:4.2,sy:.3,sz:26},{g:bx,c:"#e5e7eb",x:-11,y:3,sx:2.2,sy:.2,sz:8},{g:bx,c:liv[0],x:-11.5,y:5,sx:2.6,sy:4.2,sz:.3,rz:-.35},
   {g:cyl,c:"#9ca3af",rz:Math.PI/2,sy:3,x:.6,y:1.2,z:5.5,sx:.55,sz:.55},{g:cyl,c:"#9ca3af",rz:Math.PI/2,sy:3,x:.6,y:1.2,z:-5.5,sx:.55,sz:.55},
   {g:bx,c:"#111",x:8,y:.6,sx:.3,sy:1.2,sz:.3},{g:bx,c:"#111",x:-1,y:.6,z:2,sx:.3,sy:1.2,sz:.3},{g:bx,c:"#111",x:-1,y:.6,z:-2,sx:.3,sy:1.2,sz:.3}].concat(pres?[{g:bx,c:"#fcd116",x:2,y:3.2,sx:6,sy:.25,sz:2.84}]:[]))}
function heliMesh(){const bx=new T.BoxGeometry(1,1,1),sp=new T.SphereGeometry(1,12,8);const g=groupMesh([{g:sp,c:"#14532d",y:2.2,sx:2.6,sy:1.6,sz:1.6},{g:bx,c:"#14532d",x:-3.5,y:2.5,sx:5,sy:.5,sz:.4},{g:bx,c:"#14532d",x:-6,y:3.2,sx:.8,sy:1.6,sz:.2},{g:bx,c:"#111",y:.4,z:1,sx:4,sy:.15,sz:.2},{g:bx,c:"#111",y:.4,z:-1,sx:4,sy:.15,sz:.2},{g:sp,c:"#1f2937",x:1.2,y:2.5,sx:1.4,sy:1,sz:1.3}]);
  const rot=new T.Mesh(new T.BoxGeometry(12,.08,.5),new T.MeshStandardMaterial({color:0x111111}));rot.position.y=3.9;g.add(rot);anims.push((t,dt)=>{rot.rotation.y+=dt*28});return g}
function trainMesh(){const bx=new T.BoxGeometry(1,1,1);const parts=[{g:bx,c:"#1d4ed8",x:0,y:2,sx:9,sy:3.2,sz:2.8},{g:bx,c:"#facc15",x:0,y:1.2,sx:9.05,sy:.4,sz:2.85},{g:bx,c:"#0f172a",x:4.3,y:2.8,sx:.4,sy:1,sz:2.4}];
  for(let i=1;i<=5;i++){const x=-i*11;parts.push({g:bx,c:"#e5e7eb",x,y:2,sx:10.4,sy:3,sz:2.8},{g:bx,c:"#1e3a8a",x,y:2.5,sx:10.45,sy:.7,sz:2.85},{g:bx,c:"#1d4ed8",x,y:.9,sx:10.45,sy:.25,sz:2.85})}return groupMesh(parts)}
function rails(x0,x1,z){const len=x1-x0;const r=[];for(const dz of [-.75,.75])r.push({x:(x0+x1)/2,y:0,z:z+dz,sx:len,sy:.18,sz:.12,c:"#6b7280"});inst(G.box,M.metal,r.map(q=>Object.assign(q,{y:Hfn(q.x,q.z)+.3})));
  const sl=[];for(let x=x0;x<x1;x+=1.6)sl.push({x,y:Hfn(x,z)+.12,z,sx:.3,sy:.16,sz:2.4,c:"#5b4636"});inst(G.box,M.soft,sl,{noShadow:true});
  const bal=new T.Mesh(new T.PlaneGeometry(len,3.6,Math.ceil(len/3),1),new T.MeshStandardMaterial({color:0x7a746c,roughness:1}));bal.rotation.x=-Math.PI/2;bal.position.set((x0+x1)/2,0,z);const P=bal.geometry.attributes.position;for(let i=0;i<P.count;i++)P.setZ(i,0);world.add(bal);
  const pg=bal.geometry;pg.rotateX(-Math.PI/2);bal.rotation.x=0;const Q=pg.attributes.position;for(let i=0;i<Q.count;i++)Q.setY(i,Hfn(Q.getX(i)+(x0+x1)/2,Q.getZ(i)+z)+.08);pg.computeVertexNormals()}
function mover(g,o){const st={x:o.x0,y:o.y0||0,t:0};anims.push((t,dt)=>{st.t+=dt;o.step(st,dt);g.position.set(st.x,st.y,o.z||0);if(o.rot)g.rotation.z=o.rot(st)});return st}
function baseLand(land,key,skyOver){resetWorld(key,false);keepOut=[];const L0=LANDS[land]||LANDS.ville;const L=skyOver?Object.assign({},L0,skyOver):L0;scene.fog=new T.FogExp2(col(L.sky[1]),L.fog*(reduce?.8:1));Hfn=heightFn(land);waterLevel=L.wl;return L}
const VV=(x,y,z)=>new T.Vector3(x,y,z);

function segCity(c,mode,first,key){return()=>{
  const land=c.land||"ville";const L=baseLand(land,key+(first?"a":"c"));const C={x:land==="port"?34:0,z:land==="port"?6:0};const R=Math.min(land==="port"?42:50,cityRad(c.pop||2e5));
  flattenAround(C.x,C.z,R+3,land==="port"?1.6:undefined);if(land==="port")waterLevel=L.wl;else waterLevel=null;sky(L);buildTerrain(land,L);
  trees(land==="sahel"||land==="savane"||land==="plateau"?"acacia":"jungle",spots(50,(x,z,y)=>Math.hypot(x-C.x,z-C.z)>R+10));
  const esc=mode==="cortege"||mode==="convoi";const cg=cityGrid(C.x,C.z,R,cityTall(c.pop||2e5),{profile:c.profile,clearMain:esc,stopCross:mode==="cortege"});const y0=cg.y0;
  if(mode==="cortege"){const pol=[];for(let i=-2;i<=2;i++)pol.push({x:C.x+i*cg.B-2.5,y:y0+.28,z:C.z-4.2});people(pol,{party:"#1e3a8a",share:1,bob:.3})}
  if(mode==="marche"){const me=[{x:C.x-20,y:y0+.28,z:C.z+4.3}];people(me,{scale:1.1});const st={x:C.x-20};anims.push((t,dt)=>{st.x+=dt*1.4});
    return[shot(4.5,VV(-6,2.2,C.z+6.5),VV(-5,2.2,C.z+6.5),VV(4,1.5,C.z+4),VV(5,1.5,C.z+4),{follow:()=>({x:st.x}),hand:1}),shot(4.5,VV(C.x-20,14,C.z-10),VV(C.x+10,12,C.z-8),VV(C.x,0,C.z),VV(C.x+15,0,C.z))]}
  const spec=SPEC[mode]||SPEC.voiture;const sp=mode==="cortege"?15:mode==="convoi"?12:mode==="moto"?10:rush()?3.5:8;
  const st=convoy(spec,{x0:first?C.x-cg.L/2+8:C.x-cg.L/2+4,x1:first?C.x+cg.L/2+60:C.x+6,z:C.z+1.6,speed:first?sp:x=>Math.max(1.2,Math.min(sp,(C.x+6-x)*.4))});
  return first?[shot(4.5,VV(-18,5.5,C.z+1.6),VV(-14,4.5,C.z+1.6),VV(6,1.5,C.z+1.6),VV(8,1.5,C.z+1.6),{follow:()=>({x:st.x})}),shot(4.5,VV(C.x+10,9,C.z-5.5),VV(C.x+14,7,C.z-5),VV(C.x-10,1,C.z+1.6),VV(C.x+20,1,C.z+1.6),{lin:1})]
   :[shot(4.5,VV(-14,3,C.z+6),VV(-8,3,C.z+6),VV(4,1.5,C.z+1.6),VV(6,1.5,C.z+1.6),{follow:()=>({x:st.x})}),shot(4.5,VV(C.x-60,45,C.z-60),VV(C.x-40,55,C.z-40),VV(C.x,0,C.z),VV(C.x,0,C.z))]}}
function segRoad(land,mode,key,insec,gare){return()=>{
  const L=baseLand(land,key+"b");corridor(land);sky(L);buildTerrain(land,L);const ok=dry(L.wl);const away=(x,z,y)=>ok(x,z,y)&&Math.abs(z)>12;
  const tk=land==="sahel"||land==="savane"||land==="plateau"?"acacia":land==="hauts"||land==="grassfields"?"euca":"jungle";trees(tk,spots(reduce?60:140,away));trees("bush",spots(50,away));
  huts(spots(16,(x,z,y)=>Math.abs(z)>11&&Math.abs(z)<28,70),land==="sahel"||land==="savane"?"round":"house");
  if(mode==="train"){rails(-130,130,0);if(gare){const y=Hfn(-40,-4);inst(G.box,M.soft,[{x:-40,y:y,z:-3.4,sx:40,sy:.9,sz:3,c:"#b8b2a6"}]);buildings([{x:-40,y:y,z:-10,sx:24,sy:6,sz:7,st:0,c:"#f3e6b8"}]);sign(gare,-40,y+7,-6.4,16,1.8,"#1d4ed8","#ffffff",0);crowdAt(-40,-3.4,30,2,26,{bob:.4})}
    const tr=trainMesh();const st=mover(tr,{x0:gare?-30:-60,z:0,step:(s,dt)=>{s.v=Math.min(14,(s.v||(gare?0:14))+dt*3);s.x+=dt*s.v;s.y=Hfn(s.x,0)}});
    return gare?[shot(4.5,VV(-70,3,9),VV(-55,3,9),VV(-40,2,0),VV(-25,2,0)),shot(4.5,VV(-10,2.5,7),VV(-6,2.5,7),VV(-30,2,0),VV(0,2,0),{follow:()=>({x:st.x+30})})]
      :[shot(4.5,VV(-30,26,-24),VV(10,22,-18),VV(-10,0,0),VV(30,0,0),{follow:()=>({x:st.x+60})}),shot(4.5,VV(-4,2.5,6),VV(-2,2.5,6),VV(8,2,0),VV(10,2,0),{follow:()=>({x:st.x})})]}
  roadStrip(-130,130,0,7.5,M.asphalt,26);
  const ven=[];for(let i=0;i<10;i++){const x=rr(-60,60);ven.push({x,y:Hfn(x,5.5),z:5.5})}people(ven,{bob:.5});inst(G.umb,M.flat,ven.filter((_,i)=>i%2).map(p=>({x:p.x+1,y:p.y+2.3,z:p.z+.6,sx:3,sy:1,sz:3,c:pick(["#dc2626","#f59e0b","#2563eb"])})));
  movingVeh("truck",3,{x0:-120,x1:120,speed:.004,z:0,colors:["#ffffff","#b45309"]});movingVeh("bus",2,{x0:-120,x1:120,speed:.005,colors:["#0e7490","#f2c200"]});
  if(insec){const bar=[{x:40,y:Hfn(40,-2)+.9,z:-1.9,sx:.2,sy:.2,sz:3.6,c:"#ef4444"}];inst(G.box,M.soft,bar);crowdAt(42,-5,4,2,6,{party:"#4b5320",share:1})}
  const spec=SPEC[mode]||SPEC.voiture;const sp=mode==="cortege"?20:mode==="convoi"?17:mode==="bus"?11:14;const st=convoy(spec,{x0:-80,z:1.6,speed:sp});
  return[shot(4.5,VV(-26,22,-16),VV(-14,18,-12),VV(10,0,1.6),VV(14,0,1.6),{follow:()=>({x:st.x})}),shot(4.5,VV(8,1.6,-4.5),VV(8,1.6,-4.5),VV(-6,1.2,1.6),VV(-2,1.2,1.6),{follow:()=>({x:st.x})})]}}
function segAir(c,depart,key,pres,liv){return()=>{
  const land=c.land||"ville";const L=baseLand(land,key+(depart?"a":"c"));flattenAround(0,0,120,land==="port"?1.6:undefined);if(land==="port")waterLevel=null;sky(L);buildTerrain(land,L);const y0=Hfn(0,0);
  trees(land==="sahel"||land==="savane"?"acacia":"jungle",spots(80,(x,z)=>Math.abs(z)>40));
  const rg=new T.PlaneGeometry(14,260);rg.rotateX(-Math.PI/2);rg.rotateY(Math.PI/2);const rw=new T.Mesh(rg,new T.MeshStandardMaterial({map:roadTex(false),roughness:.9}));rw.material.map.repeat.set(1,26);rw.position.set(0,y0+.05,0);rw.receiveShadow=true;world.add(rw);
  buildings([{x:-40,y:y0,z:-34,sx:50,sy:9,sz:14,st:2,c:"#ffffff"},{x:10,y:y0,z:-38,sx:8,sy:22,sz:8,st:1,c:"#ffffff"}]);sign(c.apt||"AÉROPORT",-40,y0+10.5,-26.9,26,2.2,"#0f172a","#ffffff",0);
  if(pres&&depart){const g=[];for(let i=0;i<10;i++){g.push({x:-78+i*2.2,y:y0+.05,z:7},{x:-78+i*2.2,y:y0+.05,z:12})}people(g,{party:"#14532d",share:1});inst(G.box,M.soft,[{x:-68,y:y0+.02,z:9.5,sx:24,sy:.05,sz:2,c:"#b91c1c"}],{noShadow:true})}
  const pl=planeMesh(liv,pres);let st;
  if(depart)st=mover(pl,{x0:-80,z:0,step:(s,dt)=>{s.v=(s.v||0)+dt*6;s.x+=dt*s.v;s.y=y0+Math.max(0,(s.x-20)*.18)},rot:s=>Math.min(.18,Math.max(0,(s.x-20)*.01))});
  else st=mover(pl,{x0:-160,z:0,step:(s,dt)=>{const v=s.x<-10?34:Math.max(3,34-(s.x+10)*.6);s.x+=dt*v;s.y=y0+Math.max(0,(-10-s.x)*.2)},rot:s=>s.x<-10?-.05:0});
  return depart?[shot(4.5,VV(-100,4,24),VV(-50,4,26),VV(-80,3,0),VV(-30,3,0)),shot(4.5,VV(-10,4,-10),VV(10,6,-18),VV(0,3,0),VV(60,20,0),{follow:()=>({x:st.x*.2})})]
   :[shot(4.5,VV(-20,4,22),VV(-5,4,22),VV(-80,15,0),VV(0,3,0)),shot(4.5,VV(40,6,-20),VV(50,5,-22),VV(0,3,0),VV(20,3,0))]}}
function segCruise(key,liv,pres,heli,land){return()=>{
  const L=baseLand(land||"plateau",key+"b",{fog:.0025});sky(L);buildTerrain(land||"plateau",L);
  const cl=[];for(let i=0;i<(reduce?40:110);i++)cl.push({x:rr(-200,200),y:rr(heli?45:70,heli?55:85),z:rr(-200,200),sx:rr(14,30),sy:rr(4,8),sz:rr(10,22),c:"#ffffff"});
  inst(G.sph0,new T.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.9,emissive:0x888888}),cl,{noShadow:true});
  const g=heli?heliMesh():planeMesh(liv,pres);const alt=heli?38:100;const st=mover(g,{x0:-60,z:0,y0:alt,step:(s,dt)=>{s.x+=dt*(heli?14:30);s.y=alt+Math.sin(s.t*.6)*.6}});
  return[shot(4.5,VV(-30,alt+8,30),VV(-10,alt+6,32),VV(0,alt,0),VV(10,alt,0),{follow:()=>({x:st.x}),abs:1}),shot(4.5,VV(14,alt+2,-14),VV(20,alt+4,-10),VV(0,alt+1,0),VV(-4,alt+1,0),{follow:()=>({x:st.x}),abs:1})]}}
function segHeli(c,depart,key){return()=>{
  const land=c.land||"ville";const L=baseLand(land,key+(depart?"a":"c"));const R=Math.min(46,cityRad(c.pop||2e5));flattenAround(0,0,R+3,land==="port"?1.6:undefined);if(land==="port")waterLevel=null;sky(L);buildTerrain(land,L);
  keepOut=[[0,0,14]];const cg=cityGrid(0,0,R,cityTall(c.pop||2e5),{profile:c.profile});const y0=cg.y0;
  inst(G.disc,M.soft,[{x:0,y:y0+.1,z:0,sx:14,sy:.3,sz:14,c:"#374151"}],{noShadow:true});sign("H",0,y0+.3,0,5,5,"#374151","#fde047",0,300).rotation.x=-Math.PI/2;
  const h=heliMesh();const st=mover(h,{x0:0,z:0,y0:depart?y0:y0+45,step:(s,dt)=>{if(depart){s.y=y0+Math.min(40,s.t*6);if(s.t>3)s.x+=dt*(s.t-3)*6}else{s.y=Math.max(y0,y0+45-s.t*7)}}});
  return[shot(4.5,VV(-22,6,18),VV(-18,8,16),VV(0,3,0),VV(0,10,0)),shot(4.5,VV(30,30,30),VV(10,40,20),VV(0,y0,0),VV(0,20,0),{follow:depart?()=>({x:st.x*.5}):null})]}}
const SPEC={cortege:CORTEGE,convoi:CONVOI,chauffeur:[{k:"car",c:"#0b0b0b",s:1.08}],voiture:[{k:"car",c:"#9ca3af"}],taxi:[{k:"taxi",c:"#f2c200"}],moto:[{k:"moto",c:"#b91c1c"}],bus:[{k:"bus",c:"#0e7490",s:1.1}]};
S3.travel=function(o){
  if(!S3.ok)return false;if(streetMode)S3.streetStop();filmMode=true;forceNight=hour;const key="trip-"+o.mode+"-"+(o.seed||0);const f=o.from,t=o.to;const segs=[];const D=9;
  const air=o.mode==="avion"||o.mode==="avionp"||o.mode==="jet";
  if(air){const liv=o.mode==="avionp"?["#14532d","#ce1126"]:o.mode==="jet"?["#1f2937","#9ca3af"]:["#00843d","#ce1126"];segs.push({d:D,build:segAir(f,true,key,o.mode==="avionp",liv)},{d:D,build:segCruise(key,liv,o.mode==="avionp",false,o.road)},{d:D,build:segAir(t,false,key,o.mode==="avionp",liv)})}
  else if(o.mode==="helico")segs.push({d:D,build:segHeli(f,true,key)},{d:D,build:segCruise(key,null,false,true,o.road)},{d:D,build:segHeli(t,false,key)});
  else if(o.mode==="train")segs.push({d:D,build:segRoad(f.land,"train",key+"s1",false,"GARE DE "+String(f.name||"").toUpperCase()+" — CAMRAIL")},{d:D,build:segRoad(o.road||t.land,"train",key,false)},{d:D,build:segRoad(t.land,"train",key+"s3",false,"GARE DE "+String(t.name||"").toUpperCase()+" — CAMRAIL")});
  else{segs.push({d:D,build:segCity(f,o.mode,true,key)});if(!o.local)segs.push({d:D,build:segRoad(o.road||t.land,o.mode,key,o.insec)});segs.push({d:D,build:segCity(t,o.mode,false,key)})}
  script={segs,cur:-1,shots:[],segT0:0,total:segs.reduce((a,s)=>a+s.d,0),t:0,focus:new T.Vector3(),onEnd:o.onEnd,onProgress:o.onProgress};
  return true;
};


/* =====================================================================
   VUE RUE À LA TROISIÈME PERSONNE : votre personnage marche dans la ville, caméra derrière l'épaule
   ===================================================================== */
let streetMode=false,avatar=null,stv=null;const keys={};
window.addEventListener("keydown",e=>{if(!streetMode)return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;keys[e.code]=true;if(/Arrow|Space/.test(e.code))e.preventDefault()});
window.addEventListener("keyup",e=>{keys[e.code]=false});
function makeAvatar(look){const g=new T.Group();const mk=(geo,c)=>{const m=new T.Mesh(geo,M.char.clone());m.material.color.set(c);m.castShadow=true;g.add(m);return m};
  const skin=look.skin||"#5a3825";const P={t:mk(G.hTorso,look.shirt||"#f5f5f5"),h:mk(G.hHead,skin),l1:mk(G.hLeg,look.pant||"#2b4a7a"),l2:mk(G.hLeg,look.pant||"#2b4a7a"),a1:mk(G.hArm,look.arm||skin),a2:mk(G.hArm,look.arm||skin)};
  P.t.position.y=.95;P.h.position.y=1.73;P.l1.position.set(-.1,.95,0);P.l2.position.set(.1,.95,0);P.a1.position.set(-.31,1.55,0);P.a2.position.set(.31,1.55,0);g.userData=P;world.add(g);return g}
function inBlock(x,z,g){const u=(x-g.cx)/g.B-.5,v=(z-g.cz)/g.B-.5;const fu=u-Math.round(u),fv=v-Math.round(v);const half=(g.B-g.RW)/2/g.B;return Math.abs(fu)<half&&Math.abs(fv)<half}
S3.streetStart=function(look){
  if(!lastGrid||filmMode||(current&&current.interior))return false;const g=lastGrid;streetMode=true;
  avatar=makeAvatar(look||{});const S=(g.B-g.RW)/2-.8;stv={x:g.cx+g.B*.5-S+2,z:g.cz+g.RW/2+.9,yaw:Math.PI/2,sp:0,ph:0,mx:0,mz:0,run:false};
  cam.auto=false;cam.theta=-Math.PI/2;cam.phi=1.25;cam.r=4.6;cam.minR=2.4;cam.maxR=12;camera.fov=62;camera.near=.2;camera.updateProjectionMatrix();
  if(scene.fog)scene.fog.density*=1.6;return true};
S3.streetStop=function(){if(!streetMode)return;streetMode=false;if(avatar){world.remove(avatar);avatar=null}camera.fov=50;camera.near=.5;camera.updateProjectionMatrix();cam.minR=30;cam.maxR=170;cam.r=100;cam.phi=1.02;cam.auto=true;
  if(lastShow){current=null;S3.show(lastShow)}};
S3.streetInput=function(mx,mz,run){if(stv){stv.mx=mx;stv.mz=mz;if(run!=null)stv.run=run}};
S3.streetInfo=()=>streetMode&&stv?{x:stv.x,z:stv.z,yaw:stv.yaw,cam:cam.theta,g:lastGrid,sp:stv.sp}:null;
S3.inStreet=()=>streetMode;
function runStreet(dt){
  const g=lastGrid;let mx=stv.mx,mz=stv.mz;
  if(keys.KeyW||keys.ArrowUp||keys.KeyZ)mz=1;if(keys.KeyS||keys.ArrowDown)mz=-1;if(keys.KeyA||keys.ArrowLeft||keys.KeyQ)mx=-1;if(keys.KeyD||keys.ArrowRight)mx=1;
  const run=stv.run||keys.ShiftLeft||keys.ShiftRight;
  const fx=-Math.sin(cam.theta),fz=-Math.cos(cam.theta),rx=-fz,rz=fx;
  let vx=fx*mz+rx*mx,vz=fz*mz+rz*mx;const l=Math.hypot(vx,vz);
  const target=l>.05?(run?5.4:2.3)*Math.min(1,l):0;stv.sp+=(target-stv.sp)*Math.min(1,dt*6);
  if(l>.05){vx/=l;vz/=l;const want=Math.atan2(vx,vz);let d=want-stv.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;stv.yaw+=d*Math.min(1,dt*10)}
  let px=stv.x+Math.sin(stv.yaw)*stv.sp*dt,pz=stv.z+Math.cos(stv.yaw)*stv.sp*dt;
  for(const b of g.blds){const dx=px-b.x,dz=pz-b.z;if(Math.abs(dx)<b.hx&&Math.abs(dz)<b.hz){const ox=b.hx-Math.abs(dx),oz=b.hz-Math.abs(dz);if(ox<oz)px=b.x+Math.sign(dx||1)*b.hx;else pz=b.z+Math.sign(dz||1)*b.hz}}
  const lim=g.L/2-2;px=Math.max(g.cx-lim,Math.min(g.cx+lim,px));pz=Math.max(g.cz-lim,Math.min(g.cz+lim,pz));stv.x=px;stv.z=pz;
  const y=g.y0+(inBlock(px,pz,g)?.28:.06);
  avatar.position.set(px,y,pz);avatar.rotation.y=stv.yaw;stv.ph+=dt*stv.sp*2.7;const sw=Math.sin(stv.ph)*Math.min(.75,stv.sp*.2);const P=avatar.userData;
  P.l1.rotation.x=sw;P.l2.rotation.x=-sw;P.a1.rotation.x=-sw*.85;P.a2.rotation.x=sw*.85;P.t.position.y=.95+Math.abs(sw)*.03;P.h.position.y=1.73+Math.abs(sw)*.03;
  cam.target.set(px,y+1.5,pz);const r=cam.r,ph=Math.max(.9,Math.min(1.45,cam.phi));
  const want=new T.Vector3(px+Math.sin(cam.theta)*r*Math.sin(ph),y+1.35+r*Math.cos(ph),pz+Math.cos(cam.theta)*r*Math.sin(ph));
  camera.position.lerp(want,Math.min(1,dt*9));camera.lookAt(px+fx*1.5,y+1.55,pz+fz*1.5);
}

S3.filmPause=b=>{if(script)script.paused=b};
S3.filmReplay=()=>{if(script){script.t=0;script.ended=false;script.paused=false}};
S3.endFilm=function(){script=null;filmMode=false;forceNight=null;current=null;if(lastShow)S3.show(lastShow)};
S3.attach=function(el){if(!renderer)return;el.appendChild(renderer.domElement);container=el;S3.resize()};
S3.detach=function(){if(!renderer||!homeEl)return;homeEl.insertBefore(renderer.domElement,homeEl.firstChild);container=homeEl;S3.resize()};

})();
