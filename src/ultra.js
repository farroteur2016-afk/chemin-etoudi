/* Chemin d'Etoudi — moteur graphique ULTRA (PC) : Three.js r169, rendu physique (PBR), éclairage par image HDR
   (réflexions réalistes), ciel physique, ombres douces dynamiques, occlusion ambiante (GTAO), bloom, profondeur de champ,
   anticrénelage SMAA, étalonnage cinéma ; ville ouverte en mètres réels, humains animés par squelette (marche, course,
   repos), véhicules détaillés, caméra à la troisième personne. Le moteur classique reste utilisé sur téléphone. */
(function(){
"use strict";
const UL={ok:false,on:false,loading:false};window.Ultra=UL;
let U,T,renderer,scene,camera,composer,P={},clock,host,canvas,sun,hemi,sky,env={},pmrem,fog;
let world=null,anims=[],city=null,player=null,peds=[],cars=[],lamps=[],mode="orbit",keys={},inp={mx:0,mz:0,run:false},hour=10,lastO=null,rngS=1;
const cam={th:.7,ph:1.12,r:120,tgt:null,auto:true,drag:null};
const rnd=()=>{rngS=(rngS*16807)%2147483647;return(rngS-1)/2147483646},rr=(a,b)=>a+rnd()*(b-a),pick=a=>a[Math.floor(rnd()*a.length)];
UL.supported=(()=>{try{const c=document.createElement("canvas");return!!c.getContext("webgl2")}catch(e){return false}})();
UL.mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||"");

/* ---------- chargement paresseux de la bibliothèque et des ressources ---------- */
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error("chargement impossible : "+src));document.head.appendChild(s)})}
async function ensureLib(){
  if(!window.U)await loadScript("ultra-lib.js");
  for(const [k,f] of [["soldier","ultra-assets-a.js"],["ferrari","ultra-assets-b.js"],["brick","ultra-assets-c.js"],["homme","ultra-assets-d.js"]])if(!(window.U_ASSETS&&window.U_ASSETS[k]))await loadScript(f);
  U=window.U;T=U.THREE;
}
const b64buf=b=>{const s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a.buffer};
const blobURL=(k,type)=>URL.createObjectURL(new Blob([b64buf(U_ASSETS[k])],{type}));
async function loadAssets(){
  const gl=new U.GLTFLoader();gl.setMeshoptDecoder(U.MeshoptDecoder);const A={};
  A.soldier=await gl.parseAsync(b64buf(U_ASSETS.soldier),"");A.homme=await gl.parseAsync(b64buf(U_ASSETS.homme),"");A.michelle=await gl.parseAsync(b64buf(U_ASSETS.michelle),"");A.ferrari=await gl.parseAsync(b64buf(U_ASSETS.ferrari),"");
  const rg=new U.RGBELoader();pmrem=new T.PMREMGenerator(renderer);
  for(const [k,n] of [["hdrDay","day"],["hdrDusk","dusk"]]){const tx=await rg.loadAsync(blobURL(k));tx.mapping=T.EquirectangularReflectionMapping;env[n]=pmrem.fromEquirectangular(tx).texture;tx.dispose()}
  const tl=new T.TextureLoader();const tex=async(k,srgb)=>{const t=await tl.loadAsync(blobURL(k,"image/jpeg"));t.wrapS=t.wrapT=T.RepeatWrapping;if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t};
  A.brick=await tex("brick",true);A.brickBump=await tex("brickBump");A.brickRough=await tex("brickRough");A.waterN=await tex("waterN");
  // animations de marche des deux modèles (même squelette Mixamo) : on retire les translations pour marcher sur place
  const clip=n=>{const c=A.soldier.animations.find(a=>a.name===n).clone();c.tracks=c.tracks.filter(t=>!t.name.endsWith(".position")&&!/(Shoulder|Arm|Hand)/.test(t.name.split(".")[0]));return c};
  A.clips={idle:clip("Idle"),walk:clip("Walk"),run:clip("Run")};
  // reciblage des animations sur Michelle : compensation de la pose de repos os par os
  const rest=sc=>{const m={};sc.traverse(o=>{if(o.isBone)m[o.name]=o.quaternion.clone()});return m};const rS=rest(A.soldier.scene),rM=rest(A.michelle.scene),rH=rest(A.homme.scene);
  const retargetTo=(rT,c)=>{const n=c.clone();n.tracks=n.tracks.map(t=>{const bn=t.name.split(".")[0];if(!t.name.endsWith(".quaternion")||!rS[bn]||!rT[bn])return t;const tt=t.clone();const v=tt.values,q=new T.Quaternion(),comp=rT[bn].clone().multiply(rS[bn].clone().invert());
    for(let i=0;i<v.length;i+=4){q.fromArray(v,i);q.premultiply(comp);q.toArray(v,i)}return tt});return n};
  const retarget=c=>retargetTo(rM,c);A.clipsM={idle:retarget(A.clips.idle),walk:retarget(A.clips.walk),run:retarget(A.clips.run)};
  A.clipsH={idle:retargetTo(rH,A.clips.idle),walk:retargetTo(rH,A.clips.walk),run:retargetTo(rH,A.clips.run)};
  A.h={};for(const k of ["soldier","michelle","homme"]){const sc=A[k].scene;sc.updateMatrixWorld(true);const b=new T.Box3().setFromObject(sc,true);A.h[k]=b.max.y-b.min.y||1}
  return A;
}

/* ---------- initialisation ---------- */
UL.enable=async function(el,on){
  host=el;if(!on){UL.on=false;if(canvas)canvas.style.display="none";return false}
  if(!UL.supported)throw new Error("WebGL 2 indisponible sur cet appareil");
  if(!UL.ok){UL.loading=true;await ensureLib();init();UL.assets=await loadAssets();UL.ok=true;UL.loading=false}
  UL.on=true;canvas.style.display="block";if(canvas.parentNode!==host)host.insertBefore(canvas,host.firstChild);resize();return true;
};
function init(){
  _a=new T.Vector3();_b=new T.Vector3();_d=new T.Vector3();_q1=new T.Quaternion();_q2=new T.Quaternion();_q3=new T.Quaternion();_hp=new T.Vector3();
  renderer=new T.WebGLRenderer({antialias:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  canvas=renderer.domElement;canvas.className="ultra-canvas";canvas.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;touch-action:none";
  scene=new T.Scene();camera=new T.PerspectiveCamera(50,1,.1,4000);clock=new T.Clock();cam.tgt=new T.Vector3();
  sky=new U.Sky();sky.scale.setScalar(9000);scene.add(sky);const su=sky.material.uniforms;su.turbidity.value=6;su.rayleigh.value=1.6;su.mieCoefficient.value=.004;su.mieDirectionalG.value=.82;
  sun=new T.DirectionalLight(0xffffff,3);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);const sc=sun.shadow.camera;sc.left=-90;sc.right=90;sc.top=90;sc.bottom=-90;sc.near=1;sc.far=600;sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;sun.shadow.radius=4;
  scene.add(sun,sun.target);hemi=new T.HemisphereLight(0xcfe3ff,0x6b5a45,.35);scene.add(hemi);
  fog=new T.FogExp2(0xc9d6e2,.0016);scene.fog=fog;
  composer=new U.EffectComposer(renderer);composer.addPass(new U.RenderPass(scene,camera));
  P.ao=new U.GTAOPass(scene,camera,256,256);P.ao.output=0;try{P.ao.updateGtaoMaterial({radius:.6,distanceExponent:1,thickness:1,scale:1,samples:12});P.ao.blendIntensity=.9}catch(e){}composer.addPass(P.ao);
  P.dof=new U.BokehPass(scene,camera,{focus:40,aperture:.00018,maxblur:.006});composer.addPass(P.dof);
  P.bloom=new U.UnrealBloomPass(new T.Vector2(256,256),.32,.55,.92);composer.addPass(P.bloom);
  P.grade=new U.ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},warm:{value:.0}},vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"uniform sampler2D tDiffuse;uniform float time,warm;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=c.rgb;float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,1.08);col*=mix(vec3(1.),vec3(1.06,1.,.9),warm);col=mix(col,col*vec3(.96,1.,1.04),smoothstep(.0,.5,.5-l)*.5);float v=smoothstep(.95,.35,length(vUv-.5));col*=mix(.72,1.,v);col+=(h(vUv*vec2(1920.,1080.)+time)-.5)*.018;gl_FragColor=vec4(col,c.a);}"});
  composer.addPass(P.grade);composer.addPass(new U.OutputPass());P.smaa=new U.SMAAPass(256,256);composer.addPass(P.smaa);
  controls();window.addEventListener("resize",resize);if(window.ResizeObserver)new ResizeObserver(resize).observe(document.body);
  requestAnimationFrame(loop);
}
function resize(){if(!renderer||!host)return;const w=host.clientWidth||800,h=host.clientHeight||450;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();composer.setSize(w,h);if(P.ao)P.ao.setSize(w,h)}
UL.attach=el=>{host=el;el.insertBefore(canvas,el.firstChild);resize()};

/* ---------- textures procédurales haute résolution (façades, asphalte, trottoirs) ---------- */
function ctex(w,h,draw,srgb){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
function noise(g,w,h,n,a,col){for(let i=0;i<n;i++){const v=Math.random();g.fillStyle=col?col(v):"rgba("+(v*255|0)+","+(v*255|0)+","+(v*255|0)+","+a+")";g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}}
/* façade : 2 × 2 modules (fenêtre + mur) par tuile ; albédo, rugosité, métal (vitres réfléchissantes), relief, fenêtres allumées */
function facade(style){const W=1024,H=1024;const walls=["#d9cbb0","#c98b5e","#9fb7c4","#e2c48f","#a9b58f","#e8e1d4","#b5654a","#d8a7a0"],glass=["#1d2a33","#24313a","#2a3b47","#1b2630","#30404a"];
  const lay=(g,kind)=>{const wall=walls[style%5];g.fillStyle=kind==="c"?wall:kind==="r"?"#d8d8d8":kind==="m"?"#000":kind==="n"?"#8080ff":"#000";g.fillRect(0,0,W,H);
    if(kind==="c"){noise(g,W,H,9000,.05);const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,"rgba(40,30,20,.12)");g.fillStyle=gr;g.fillRect(0,0,W,H)}
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=c*W/2,y=r*H/2,wx=x+W*.1,wy=y+H*.12,ww=W*.3,wh=H*.28;
      if(kind==="c"){g.fillStyle="#6d6a64";g.fillRect(wx-10,wy-10,ww+20,wh+26);g.fillStyle=glass[style%5];g.fillRect(wx,wy,ww,wh);const gg=g.createLinearGradient(wx,wy,wx+ww,wy+wh);gg.addColorStop(0,"rgba(255,255,255,.18)");gg.addColorStop(.5,"rgba(255,255,255,0)");g.fillStyle=gg;g.fillRect(wx,wy,ww,wh);g.fillStyle="#8a867e";g.fillRect(wx,wy+wh/2-3,ww,6);g.fillRect(wx+ww/2-3,wy,6,wh);g.fillStyle="#b9b4aa";g.fillRect(wx-16,wy+wh+10,ww+32,14);
        if(style%2&&r===1&&c===0){g.fillStyle="#cfcfcf";g.fillRect(wx+ww*.55,wy+wh+26,ww*.4,wh*.32);g.fillStyle="#9a9a9a";for(let k=0;k<6;k++)g.fillRect(wx+ww*.57,wy+wh+32+k*10,ww*.36,3)}
        g.fillStyle="rgba(60,45,30,.18)";g.fillRect(wx+ww*.2,wy+wh+24,6,H*.12)}
      if(kind==="r"){g.fillStyle="#0e0e0e";g.fillRect(wx,wy,ww,wh);g.fillStyle="#9a9a9a";g.fillRect(wx-10,wy-10,ww+20,10)}
      if(kind==="m"){g.fillStyle="#d0d0d0";g.fillRect(wx,wy,ww,wh)}
      if(kind==="n"){g.fillStyle="#6060ff";g.fillRect(wx-10,wy-10,ww+20,10);g.fillStyle="#a0a0ff";g.fillRect(wx-10,wy+wh+16,ww+20,8);g.fillStyle="#8080ff";g.fillRect(wx,wy,ww,wh)}
      if(kind==="e"&&Math.random()<.5){g.fillStyle=Math.random()<.4?"#ffe2b0":"#ffc877";g.fillRect(wx,wy,ww,wh)}}};
  const m=new T.MeshStandardMaterial({map:ctex(W,H,(g)=>lay(g,"c"),true),roughnessMap:ctex(W,H,g=>lay(g,"r")),metalnessMap:ctex(W,H,g=>lay(g,"m")),normalMap:ctex(W,H,g=>lay(g,"n")),emissiveMap:ctex(W,H,g=>lay(g,"e"),true),emissive:0xffffff,emissiveIntensity:0,roughness:1,metalness:1,envMapIntensity:1.1});
  m.normalScale.set(.6,.6);return m}
function shopfront(){const W=2048,H=512;const names=[["PHARMACIE","#15803d"],["BOULANGERIE","#9a3412"],["QUINCAILLERIE","#1d4ed8"],["MOBILE MONEY","#ca8a04"],["SNACK-BAR","#b91c1c"],["COIFFURE","#7e22ce"],["ALIMENTATION","#0f766e"],["BANQUE","#1e3a8a"]];
  const draw=(g,kind)=>{g.fillStyle=kind==="c"?"#3a3a3a":kind==="r"?"#bbbbbb":"#000";g.fillRect(0,0,W,H);for(let k=0;k<4;k++){const x=k*W/4;const [n,c]=names[(k*3+Math.floor(Math.random()*8))%8];
    if(kind==="c"){g.fillStyle=c;g.fillRect(x+10,20,W/4-20,110);g.fillStyle="#fff";g.font="bold 64px Arial Black,Arial";g.textAlign="center";g.textBaseline="middle";g.fillText(n,x+W/8,76,W/4-50);g.fillStyle="#1a2229";g.fillRect(x+30,160,W/4-60,330);const gg=g.createLinearGradient(x,160,x+W/4,490);gg.addColorStop(0,"rgba(255,255,255,.22)");gg.addColorStop(.6,"rgba(255,255,255,0)");g.fillStyle=gg;g.fillRect(x+30,160,W/4-60,330);g.fillStyle="#777";g.fillRect(x+W/8-4,160,8,330);noise(g,W,H,300,.06)}
    if(kind==="r"){g.fillStyle="#101010";g.fillRect(x+30,160,W/4-60,330)}if(kind==="e"){g.fillStyle="#fff";g.fillRect(x+10,20,W/4-20,110);g.fillStyle="#ffdca0";g.fillRect(x+30,160,W/4-60,330)}}};
  return new T.MeshStandardMaterial({map:ctex(W,H,g=>draw(g,"c"),true),roughnessMap:ctex(W,H,g=>draw(g,"r")),emissiveMap:ctex(W,H,g=>draw(g,"e"),true),emissive:0xffffff,emissiveIntensity:0,roughness:1,metalness:.2})}
function asphalt(){const W=1024,H=2048;const cracks=g=>{for(let i=0;i<90;i++){g.beginPath();let x=Math.random()*W,y=Math.random()*H;g.moveTo(x,y);for(let k=0;k<6;k++){x+=Math.random()*40-20;y+=Math.random()*50;g.lineTo(x,y)}g.stroke()}};
  const puddles=[];for(let i=0;i<10;i++)puddles.push([Math.random()*W,Math.random()*H,40+Math.random()*120,20+Math.random()*60,Math.random()*3]);
  const lines=(g,c)=>{g.fillStyle=c;g.fillRect(24,0,14,H);g.fillRect(W-38,0,14,H);g.fillRect(W/2-22,0,14,H);g.fillRect(W/2+8,0,14,H);for(let y=0;y<H;y+=256){g.fillRect(W/4-6,y,12,140);g.fillRect(3*W/4-6,y,12,140)}};
  return new T.MeshStandardMaterial({
    map:ctex(W,H,g=>{g.fillStyle="#3c3d3f";g.fillRect(0,0,W,H);noise(g,W,H,60000,.08,v=>"rgba("+(80+v*90|0)+","+(80+v*90|0)+","+(82+v*90|0)+",.18)");g.fillStyle="rgba(0,0,0,.18)";g.fillRect(W*.18,0,90,H);g.fillRect(W*.68,0,90,H);g.strokeStyle="rgba(0,0,0,.35)";g.lineWidth=2;cracks(g);
      for(const p of puddles){g.fillStyle="rgba(20,20,22,.45)";g.beginPath();g.ellipse(p[0],p[1],p[2],p[3],p[4],0,7);g.fill()}
      g.fillStyle="#e9e3d0";g.fillRect(24,0,14,H);g.fillRect(W-38,0,14,H);for(let y=0;y<H;y+=256){g.fillRect(W/4-6,y,12,140);g.fillRect(3*W/4-6,y,12,140)}g.fillStyle="#d6a836";g.fillRect(W/2-22,0,14,H);g.fillRect(W/2+8,0,14,H);noise(g,W,H,4000,.2)},true),
    roughnessMap:ctex(W,H,g=>{g.fillStyle="#e0e0e0";g.fillRect(0,0,W,H);noise(g,W,H,30000,.1);for(const p of puddles){const r=g.createRadialGradient(p[0],p[1],2,p[0],p[1],p[2]);r.addColorStop(0,"#101010");r.addColorStop(1,"rgba(224,224,224,0)");g.fillStyle=r;g.beginPath();g.ellipse(p[0],p[1],p[2],p[3],p[4],0,7);g.fill()}lines(g,"#9a9a9a")}),
    normalMap:ctex(W,H,g=>{g.fillStyle="#8080ff";g.fillRect(0,0,W,H);noise(g,W,H,40000,1,v=>"rgb("+(118+v*20|0)+","+(118+v*20|0)+",255)");g.strokeStyle="#6a6aff";g.lineWidth=3;cracks(g)}),
    roughness:1,metalness:0,envMapIntensity:1})}
function paving(){const W=1024;return new T.MeshStandardMaterial({map:ctex(W,W,g=>{g.fillStyle="#b9ab91";g.fillRect(0,0,W,W);for(let y=0;y<W;y+=128)for(let x=0;x<W;x+=128){const v=Math.random()*24-12;g.fillStyle="rgb("+(185+v|0)+","+(171+v|0)+","+(145+v|0)+")";g.fillRect(x+3,y+3,122,122)}noise(g,W,W,20000,.07);g.fillStyle="rgba(40,30,20,.12)";for(let i=0;i<30;i++){g.beginPath();g.ellipse(Math.random()*W,Math.random()*W,10+Math.random()*40,6+Math.random()*20,0,0,7);g.fill()}},true),
  normalMap:ctex(W,W,g=>{g.fillStyle="#8080ff";g.fillRect(0,0,W,W);g.fillStyle="#6868ff";for(let y=0;y<W;y+=128){g.fillRect(0,y,W,5);g.fillRect(y,0,5,W)}}),roughness:.85,metalness:0})}
function grassMat(){return new T.MeshStandardMaterial({map:ctex(1024,1024,g=>{g.fillStyle="#56703a";g.fillRect(0,0,1024,1024);noise(g,1024,1024,90000,.25,v=>"rgba("+(60+v*60|0)+","+(90+v*60|0)+","+(40+v*30|0)+",.35)");for(let i=0;i<40;i++){g.fillStyle="rgba(120,90,60,.25)";g.beginPath();g.ellipse(Math.random()*1024,Math.random()*1024,30+Math.random()*90,20+Math.random()*50,0,0,7);g.fill()}},true),roughness:.95})}

/* ---------- géométries ---------- */
function boxUV(w,h,d,mu,mv){const g=new T.BoxGeometry(w,h,d);const uv=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<uv.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));const su=ny>.5?w/mu:nx>.5?d/mu:w/mu,sv=ny>.5?d/mu:h/mv;uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv)}return g}
function merge(list){return list.length?U.mergeGeometries(list,false):null}
function add(geo,mat,o){const m=new T.Mesh(geo,mat);m.castShadow=!(o&&o.noCast);m.receiveShadow=true;world.add(m);return m}
/* voiture berline : profil latéral extrudé, vitrage réfléchissant, jantes, pneus, optiques */
let CARGEO=null;
function carGeos(){if(CARGEO)return CARGEO;const L=4.5,Wd=1.76;
  const body=new T.Shape();body.moveTo(-L/2,.35);body.lineTo(-L/2,.8);body.quadraticCurveTo(-L/2+.1,.95,-L/2+.6,.98);body.lineTo(L/2-.9,1);body.quadraticCurveTo(L/2-.1,.92,L/2,.72);body.lineTo(L/2,.35);body.quadraticCurveTo(L/2-.05,.25,L/2-.4,.25);body.lineTo(-L/2+.4,.25);body.quadraticCurveTo(-L/2+.05,.25,-L/2,.35);
  const bg=new T.ExtrudeGeometry(body,{depth:Wd-.16,bevelEnabled:true,bevelThickness:.08,bevelSize:.07,bevelSegments:4,curveSegments:10});bg.translate(0,0,-(Wd-.16)/2);
  const cab=new T.Shape();cab.moveTo(-L/2+.75,.98);cab.lineTo(-L/2+1.25,1.42);cab.quadraticCurveTo(-.2,1.5,.55,1.42);cab.lineTo(1.25,.99);
  const cg=new T.ExtrudeGeometry(cab,{depth:Wd-.36,bevelEnabled:true,bevelThickness:.06,bevelSize:.05,bevelSegments:3,curveSegments:8});cg.translate(0,0,-(Wd-.36)/2);
  const tire=new T.TorusGeometry(.26,.11,10,20);const rim=new T.CylinderGeometry(.22,.22,.16,18);rim.rotateX(Math.PI/2);
  CARGEO={body:bg,cab:cg,tire,rim,L,Wd};return CARGEO}
function makeCar(color,taxi){const G=carGeos();const g=new T.Group();
  const paint=new T.MeshPhysicalMaterial({color,metalness:.6,roughness:.32,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.2});
  const glass=new T.MeshPhysicalMaterial({color:0x0c1217,metalness:.9,roughness:.04,envMapIntensity:1.6});
  const rub=new T.MeshStandardMaterial({color:0x121212,roughness:.9}),alu=new T.MeshStandardMaterial({color:0xb8bcc2,metalness:1,roughness:.25});
  const b=new T.Mesh(G.body,paint),c=new T.Mesh(G.cab,glass);b.castShadow=c.castShadow=true;g.add(b,c);
  for(const x of [1.4,-1.35])for(const z of [.82,-.82]){const t=new T.Mesh(G.tire,rub);t.position.set(x,.37,z);t.castShadow=true;const r=new T.Mesh(G.rim,alu);r.position.set(x,.37,z);g.add(t,r)}
  const hl=new T.MeshStandardMaterial({color:0xffffff,emissive:0xfff2d0,emissiveIntensity:.2}),tl=new T.MeshStandardMaterial({color:0x550000,emissive:0xff1010,emissiveIntensity:.3});
  for(const z of [.55,-.55]){const h=new T.Mesh(new T.BoxGeometry(.06,.14,.34),hl);h.position.set(2.27,.72,z);const t2=new T.Mesh(new T.BoxGeometry(.06,.12,.36),tl);t2.position.set(-2.27,.78,z);g.add(h,t2);lampsCar.push(hl,tl)}
  if(taxi){const s=new T.Mesh(new T.BoxGeometry(.5,.18,.28),new T.MeshStandardMaterial({color:0x111111,emissive:0xffd23a,emissiveIntensity:.4}));s.position.set(-.3,1.55,0);g.add(s)}
  world.add(g);return g}
let lampsCar=[];
function ferrari(color){const f=U.SkeletonUtils.clone(UL.assets.ferrari.scene);f.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material&&o.material.name==="Body_Color"){o.material=new T.MeshPhysicalMaterial({color,metalness:.7,roughness:.25,clearcoat:1,clearcoatRoughness:.03})}}});
  const box=new T.Box3().setFromObject(f),sz=box.getSize(new T.Vector3());const s=4.5/Math.max(sz.x,sz.z);f.scale.setScalar(s);const g=new T.Group();g.add(f);if(sz.z>sz.x)f.rotation.y=Math.PI/2;world.add(g);return g}

/* ---------- humains animés ---------- */
function skinShader(mat,skin,cloth,mix){const m=mat.clone();m.onBeforeCompile=sh=>{sh.uniforms.uSkin={value:new T.Color(skin)};sh.uniforms.uCloth={value:new T.Color(cloth)};sh.uniforms.uMix={value:mix};
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 uSkin;uniform vec3 uCloth;uniform float uMix;").replace("#include <map_fragment>","#include <map_fragment>\n{vec3 c=diffuseColor.rgb;float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));float sat=(mx-mn)/(mx+1e-4);float sk=step(c.b,c.g)*step(c.g,c.r)*smoothstep(.1,.22,sat)*(1.-smoothstep(.6,.8,sat))*smoothstep(.18,.35,mx)*step(c.b*1.15,c.r);diffuseColor.rgb=mix(c,c*uSkin*2.2,sk);float l=dot(c,vec3(.3,.59,.11));diffuseColor.rgb=mix(diffuseColor.rgb,uCloth*l*2.,(1.-sk)*uMix*step(.25,sat+.2));}")};m.customProgramCacheKey=()=>"skin"+skin+cloth+mix;return m}
const SKINS=["#4a2f22","#5a3a28","#3b261c","#6b4630","#2f1e16"];const CLOTHS=["#2563eb","#b91c1c","#0f766e","#ca8a04","#7e22ce","#111827","#e5e7eb","#15803d","#ea580c"];
/* bras : orientés vers le bas avec un balancement naturel (les animations d'origine tiennent une arme) */
let _a,_b,_d,_q1,_q2,_q3,_hp;
function aim(bone,child,dir){_a.setFromMatrixPosition(bone.matrixWorld);_b.setFromMatrixPosition(child.matrixWorld).sub(_a).normalize();_q1.setFromUnitVectors(_b,dir);bone.getWorldQuaternion(_q2);bone.parent.getWorldQuaternion(_q3);bone.quaternion.copy(_q3.invert().multiply(_q1.multiply(_q2)));bone.updateMatrixWorld(true)}
function arms(H,sp,dt){const B=H.bones;if(!B.Hips||!B.LeftArm||!B.RightArm)return;H.ph+=dt*(sp<.2?1:sp*2.6);H.g.updateMatrixWorld(true);
  const yaw=H.g.rotation.y,f=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw));_hp.setFromMatrixPosition(B.Hips.matrixWorld);const amp=sp<.2?.04:Math.min(.55,sp*.18);
  for(const [side,sg] of [["Left",1],["Right",-1]]){const arm=B[side+"Arm"],fore=B[side+"ForeArm"],hand=B[side+"Hand"];if(!arm||!fore||!hand)continue;
    _a.setFromMatrixPosition(arm.matrixWorld);const out=_a.clone().sub(_hp);out.y=0;out.normalize();const sw=Math.sin(H.ph)*amp*sg;
    aim(arm,fore,_d.set(0,-1,0).addScaledVector(out,.14).addScaledVector(f,sw).normalize());aim(fore,hand,_d.set(0,-1,0).addScaledVector(out,.08).addScaledVector(f,.28+sw*.6).normalize())}}
function human(kind,o){o=o||{};const src=kind==="soldier"?UL.assets.soldier:kind==="homme"?UL.assets.homme:UL.assets.michelle;const m=U.SkeletonUtils.clone(src.scene);
  m.traverse(x=>{if(x.isMesh||x.isSkinnedMesh){x.castShadow=true;x.receiveShadow=true;x.frustumCulled=false;if(kind==="michelle")x.material=skinShader(x.material,o.skin||pick(SKINS),o.cloth||pick(CLOTHS),o.clothMix!=null?o.clothMix:.55);else if(kind==="homme"&&o.cloth)x.material=skinShader(x.material,"#747474",o.cloth,.45)}});
  m.scale.multiplyScalar((o.h||rr(1.62,1.86))/UL.assets.h[kind]);
  const g=new T.Group();g.add(m);world.add(g);const mixer=new T.AnimationMixer(m);const A=kind==="soldier"?UL.assets.clips:kind==="homme"?UL.assets.clipsH:UL.assets.clipsM;const act={idle:mixer.clipAction(A.idle),walk:mixer.clipAction(A.walk),run:mixer.clipAction(A.run)};
  for(const k in act){act[k].play();act[k].setEffectiveWeight(k==="idle"?1:0)}act.walk.time=rnd()*2;
  const bones={};m.traverse(x=>{if(x.isBone)bones[x.name.replace(/^mixamorig:?/,"")]=x});
  const H={g,mixer,act,bones,ph:rnd()*6,w:{idle:1,walk:0,run:0},set(sp){const tw=sp<.2?{idle:1,walk:0,run:0}:sp<3.2?{idle:0,walk:1,run:0}:{idle:0,walk:0,run:1};for(const k in tw){this.w[k]+=(tw[k]-this.w[k])*.12;this.act[k].setEffectiveWeight(this.w[k])}this.act.walk.timeScale=Math.max(.6,sp/1.4);this.act.run.timeScale=Math.max(.7,sp/4.5)},upd(sp,dt){this.set(sp);this.mixer.update(dt);arms(this,sp,dt)}};
  return H}

/* ---------- la ville ---------- */
function clear(){if(world){world.traverse(o=>{if(o.geometry&&!(CARGEO&&Object.values(CARGEO).includes(o.geometry)))o.geometry.dispose()});scene.remove(world)}world=new T.Group();scene.add(world);anims=[];peds=[];cars=[];lamps=[];lampsCar=[];player=null}
let MATS=null;
function mats(){if(MATS)return MATS;MATS={fac:[0,1,2,3,4,5,6,7].map(facade),shop:shopfront(),road:asphalt(),walk:paving(),grass:grassMat(),roof:new T.MeshStandardMaterial({color:0x6e6e6e,roughness:.9}),curb:new T.MeshStandardMaterial({color:0x9c9a94,roughness:.8}),
  brick:new T.MeshStandardMaterial({map:UL.assets.brick,bumpMap:UL.assets.brickBump,roughnessMap:UL.assets.brickRough,bumpScale:.8}),pole:new T.MeshStandardMaterial({color:0x5a4634,roughness:.9}),metal:new T.MeshStandardMaterial({color:0x4a4f55,metalness:.8,roughness:.4}),
  lamp:new T.MeshStandardMaterial({color:0xfff4d6,emissive:0xffd79a,emissiveIntensity:0}),trunk:new T.MeshStandardMaterial({color:0x7a6650,roughness:.95}),leaf:new T.MeshStandardMaterial({color:0x3f7a2e,roughness:.7,side:T.DoubleSide,alphaTest:.5,map:leafTex()})};return MATS}
function leafTex(){return ctex(512,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle="#6b5a2a";g.fillRect(0,h/2-3,w,6);for(let x=8;x<w-10;x+=9){const L=(1-Math.abs(x/w-.3))*h*.48;g.fillStyle=Math.random()<.5?"#4c8a34":"#3e7a2a";g.beginPath();g.moveTo(x,h/2);g.lineTo(x+22,h/2-L);g.lineTo(x+8,h/2);g.fill();g.beginPath();g.moveTo(x,h/2);g.lineTo(x+22,h/2+L);g.lineTo(x+8,h/2);g.fill()}},true)}
function palm(x,z,h){const M=mats();const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.3,h*.4,.1),new T.Vector3(.6,h*.8,0),new T.Vector3(.7,h,.1)]);
  const tr=add(new T.TubeGeometry(curve,12,.22,7),M.trunk);tr.position.set(x,0,z);
  const fronds=[];for(let k=0;k<11;k++){const p=new T.PlaneGeometry(4.2,1.1,8,1);const pos=p.attributes.position;for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+2.1)/4.2;pos.setY(i,pos.getY(i));pos.setZ(i,-u*u*1.6)}p.translate(2.1,0,0);p.rotateX(Math.PI/2-.3);p.rotateZ(-.35);p.rotateY(k*Math.PI*2/11);p.translate(x+.7,h,z+.1);fronds.push(p)}
  add(merge(fronds),M.leaf,{noCast:false})}
function buildCity(o){
  const M=mats();const pop=o.city&&o.city.pop||1e6;const n=pop>=2e6?4:pop>=3e5?3:2,B=30,RW=10,S=B-RW,L=2*n*B+RW,WK=3.2;
  rngS=Math.floor((pop%99991)+7);
  const ground=add(new T.PlaneGeometry(1600,1600),M.grass,{noCast:true});ground.rotation.x=-Math.PI/2;ground.position.y=-.02;M.grass.map.repeat.set(160,160);
  // routes
  const roads=[];for(let i=-n;i<=n;i++){for(const d of ["x","z"]){const g=new T.PlaneGeometry(RW,L+60);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setY(k,uv.getY(k)*(L+60)/20);g.rotateX(-Math.PI/2);if(d==="x")g.rotateY(Math.PI/2);g.translate(d==="z"?i*B:0,d==="x"?.012:.01,d==="x"?i*B:0);roads.push(g)}}
  add(merge(roads),M.road,{noCast:true});
  const walks=[],curbs=[],blds={},shops=[],roofs=[],brickB=[];const foot=[];
  for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const bx=(i+.5)*B,bz=(j+.5)*B;const core=1-Math.hypot(bx,bz)/(n*B*1.2);
    const w=boxUV(S,.18,S,4,4);w.translate(bx,.09,bz);walks.push(w);
    for(const [sx,sz,ox,oz] of [[S,.2,0,S/2],[S,.2,0,-S/2],[.2,S,S/2,0],[.2,S,-S/2,0]]){const c=new T.BoxGeometry(sx,.2,sz);c.translate(bx+ox,.1,bz+oz);curbs.push(c)}
    if(rnd()<.07){for(let k=0;k<3;k++)palm(bx+rr(-5,5),bz+rr(-5,5),rr(7,11));continue}
    const lot=(S-2*WK-1)/2,off=lot/2+.5;
    for(const ox of [-1,1])for(const oz of [-1,1]){if(rnd()<.1)continue;const tall=pop>=2e6?rr(8,16)+Math.pow(Math.max(0,core),2)*rr(20,70):pop>=3e5?rr(7,12)+Math.pow(Math.max(0,core),2)*rr(6,22):rr(6,10);
      const tl=core>.55||rnd()<.06?tall:rr(6,15);const x=bx+ox*off,z=bz+oz*off,h=Math.round(tl/3.2)*3.2+4;const st=Math.floor(rnd()*8);foot.push({x,z,hx:lot/2+.4,hz:lot/2+.4});
      if(h<12&&rnd()<.35){const g=boxUV(lot,h,lot,4,4);g.translate(x,h/2+.18,z);brickB.push(g)}
      else{const up=boxUV(lot,h-4,lot,7,6.4);up.translate(x,4+.18+(h-4)/2,z);(blds[st]=blds[st]||[]).push(up)}
      const sh=new T.BoxGeometry(lot-.3,4,lot-.3);const uv=sh.attributes.uv;for(let k=0;k<uv.count;k++)uv.setX(k,uv.getX(k)*(lot/4)*.25*4);sh.translate(x,2.18,z);shops.push(sh);
      const r=new T.BoxGeometry(lot+.3,.4,lot+.3);r.translate(x,h+.38,z);roofs.push(r);if(rnd()<.4){const t=new T.CylinderGeometry(.8,.8,1.6,12);t.translate(x+rr(-2,2),h+1.4,z+rr(-2,2));roofs.push(t)}}}
  add(merge(walks),M.walk,{noCast:true});add(merge(curbs),M.curb,{noCast:true});for(const k in blds)add(merge(blds[k]),M.fac[k]);add(merge(shops),M.shop);add(merge(roofs),M.roof);if(brickB.length){M.brick.map.repeat.set(1,1);add(merge(brickB),M.brick)}
  // lampadaires, poteaux électriques et câbles, feux
  const poles=[],heads=[],wires=[];for(let i=-n;i<=n;i++){const z=i*B+RW/2+.6;let prev=null;for(let x=-L/2+5;x<L/2;x+=16){const p=new T.CylinderGeometry(.13,.18,9,8);p.translate(x,4.5,z);poles.push(p);const cb=new T.BoxGeometry(.12,.12,2);cb.translate(x,8.6,z);poles.push(cb);
      const a=new T.BoxGeometry(1.6,.1,.1);a.translate(x-.8,7.4,z-.1);poles.push(a);const hd=new T.BoxGeometry(.7,.18,.35);hd.translate(x-1.5,7.3,z-.1);heads.push(hd);lamps.push(new T.Vector3(x-1.5,7.1,z-.1));
      if(prev!=null)for(const dz of [-.8,0,.8]){for(let k=0;k<10;k++){const a1=k/10,a2=(k+1)/10,s=u=>-Math.sin(u*Math.PI)*.9;wires.push(prev+(x-prev)*a1,8.5+s(a1),z+dz,prev+(x-prev)*a2,8.5+s(a2),z+dz)}}prev=x}}
  add(merge(poles),M.pole);add(merge(heads),M.lamp,{noCast:true});const wg=new T.BufferGeometry();wg.setAttribute("position",new T.Float32BufferAttribute(wires,3));world.add(new T.LineSegments(wg,new T.LineBasicMaterial({color:0x151515})));
  for(let i=-n;i<=n;i+=2)for(let j=-n;j<=n;j+=2)palm(i*B-RW/2-1.2,j*B+RW/2+2.2,rr(8,11));
  // circulation : berlines, taxis jaunes, quelques sportives
  const lanes=[];for(let i=-n;i<=n;i++)for(const d of ["x","z"])for(const s of [-1,1])lanes.push({d,v:i*B,s});
  const ncar=Math.min(60,lanes.length*2);for(let k=0;k<ncar;k++){const ln=pick(lanes);const r=rnd();const g=r<.08?ferrari(pick([0xc1121f,0xf2c200,0x111111,0xf5f5f5])):makeCar(r<.55?0xf2c200:pick([0xe5e7eb,0x1f2937,0x6b7280,0x7f1d1d,0x1e3a8a,0x0f766e]),r>=.08&&r<.55);
    cars.push({g,ln,u:rnd(),sp:rr(7,12)})}
  // piétons (humains animés) sur les trottoirs
  const np=UL.mobile?10:28;for(let k=0;k<np;k++){const i=Math.floor(rr(-n,n)),j=Math.floor(rr(-n,n)),bx=(i+.5)*B,bz=(j+.5)*B,e=S/2-1.2;const side=Math.floor(rnd()*4);
    const seg=side<2?{ax:bx-e,az:bz+(side?e:-e),bx:bx+e,bz:bz+(side?e:-e)}:{ax:bx+(side===2?e:-e),az:bz-e,bx:bx+(side===2?e:-e),bz:bz+e};
    const r0=rnd();const h=human(r0<.45?"homme":r0<.9?"michelle":"soldier",r0<.45&&rnd()<.6?{cloth:pick(CLOTHS)}:{});peds.push({h,seg,u:rnd(),dir:rnd()<.5?1:-1,sp:rr(1.1,1.6)})}
  city={n,B,RW,S,L,foot,cx:0,cz:0};cam.tgt.set(0,6,0);
}
/* ---------- personnage joueur et caméra à la troisième personne ---------- */
UL.walk=function(look){if(!city)return false;if(mode==="tp"){mode="orbit";if(player){world.remove(player.h.g);player=null}cam.r=120;cam.auto=true;return false}
  const h=human(look&&look.kind||"michelle",{skin:look&&look.skin||"#4a2f22",cloth:look&&look.cloth||"#f5f5f5",clothMix:look&&look.cloth?.6:.25,h:1.76});
  player={h,x:city.B*.5-city.S/2+1.6,z:city.RW/2+1.6,yaw:Math.PI/2,sp:0};mode="tp";cam.th=-Math.PI/2;cam.ph=1.32;cam.r=4.2;cam.auto=false;return true};
UL.input=(mx,mz,run)=>{inp.mx=mx;inp.mz=mz;if(run!=null)inp.run=run};
UL.inStreet=()=>mode==="tp";
UL.streetInfo=()=>mode==="tp"&&player?{x:player.x,z:player.z,yaw:player.yaw,cam:cam.th,sp:player.sp,g:{cx:0,cz:0,B:city.B,RW:city.RW,n:city.n,blds:city.foot}}:null;
function controls(){
  window.addEventListener("keydown",e=>{if(!UL.on)return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;keys[e.code]=true});window.addEventListener("keyup",e=>{keys[e.code]=false});
  const pts=new Map();let pinch=0;
  canvas.addEventListener("pointerdown",e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});cam.auto=false;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener("pointermove",e=>{const p=pts.get(e.pointerId);if(!p)return;if(pts.size===1){cam.th-=(e.clientX-p.x)*.006;cam.ph=Math.max(.35,Math.min(mode==="tp"?1.62:1.45,cam.ph-(e.clientY-p.y)*.004))}else if(pts.size===2){const a=[...pts.values()];const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch)zoom(pinch/d);pinch=d}p.x=e.clientX;p.y=e.clientY});
  const up=e=>{pts.delete(e.pointerId);pinch=0};canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
  canvas.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY>0?1.1:.9)},{passive:false});
}
function zoom(f){cam.r=Math.max(mode==="tp"?2.2:25,Math.min(mode==="tp"?9:420,cam.r*f))}
function blocked(x,z){for(const b of city.foot)if(Math.abs(x-b.x)<b.hx&&Math.abs(z-b.z)<b.hz)return b;return null}
function tick(dt,t){
  // voitures
  for(const c of cars){c.u=(c.u+dt*c.sp/(city.L+60)*(hour>=7&&hour<=9||hour>=17&&hour<=19?.35:1))%1;const p=(c.u-.5)*(city.L+60);const lane=c.ln.s*2.5;
    if(c.ln.d==="x"){c.g.position.set(p*c.ln.s,.02,c.ln.v+lane);c.g.rotation.y=c.ln.s>0?0:Math.PI}else{c.g.position.set(c.ln.v-lane,.02,p*c.ln.s);c.g.rotation.y=c.ln.s>0?-Math.PI/2:Math.PI/2}}
  for(const q of peds){const s=q.seg;const len=Math.hypot(s.bx-s.ax,s.bz-s.az);q.u+=dt*q.sp*q.dir/len;if(q.u>1){q.u=1;q.dir=-1}if(q.u<0){q.u=0;q.dir=1}
    q.h.g.position.set(s.ax+(s.bx-s.ax)*q.u,.18,s.az+(s.bz-s.az)*q.u);q.h.g.rotation.y=Math.atan2((s.bx-s.ax)*q.dir,(s.bz-s.az)*q.dir);q.h.upd(q.sp,dt)}
  if(mode==="tp"&&player){let mx=inp.mx,mz=inp.mz;if(keys.KeyW||keys.KeyZ||keys.ArrowUp)mz=1;if(keys.KeyS||keys.ArrowDown)mz=-1;if(keys.KeyA||keys.KeyQ||keys.ArrowLeft)mx=-1;if(keys.KeyD||keys.ArrowRight)mx=1;const run=inp.run||keys.ShiftLeft||keys.ShiftRight;
    const fx=-Math.sin(cam.th),fz=-Math.cos(cam.th);let vx=fx*mz-fz*mx,vz=fz*mz+fx*mx;const l=Math.hypot(vx,vz);const tgt=l>.05?(run?5.6:1.5)*Math.min(1,l):0;player.sp+=(tgt-player.sp)*Math.min(1,dt*5);
    if(l>.05){const want=Math.atan2(vx,vz);let d=want-player.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;player.yaw+=d*Math.min(1,dt*9)}
    let nx=player.x+Math.sin(player.yaw)*player.sp*dt,nz=player.z+Math.cos(player.yaw)*player.sp*dt;const b=blocked(nx,nz);if(b){if(!blocked(nx,player.z))nz=player.z;else if(!blocked(player.x,nz))nx=player.x;else{nx=player.x;nz=player.z}}
    const lim=city.L/2+20;player.x=Math.max(-lim,Math.min(lim,nx));player.z=Math.max(-lim,Math.min(lim,nz));
    const u=(player.x)/city.B-.5,v=(player.z)/city.B-.5,half=city.S/2/city.B;const onWalk=Math.abs(u-Math.round(u))<half&&Math.abs(v-Math.round(v))<half;
    player.h.g.position.set(player.x,onWalk?.18:0,player.z);player.h.g.rotation.y=player.yaw;player.h.upd(player.sp,dt);
    const hy=(onWalk?.18:0)+1.55;cam.tgt.set(player.x,hy,player.z);
    let r=cam.r;const dir=new T.Vector3(Math.sin(cam.th)*Math.sin(cam.ph),Math.cos(cam.ph),Math.cos(cam.th)*Math.sin(cam.ph));for(let k=1;k<=10;k++){const q=cam.tgt.clone().addScaledVector(dir,r*k/10);if(q.y<12&&blocked(q.x,q.z)){r=Math.max(1.2,r*(k-1)/10);break}}
    const want=cam.tgt.clone().addScaledVector(dir,r);want.y=Math.max(.4,want.y);camera.position.lerp(want,Math.min(1,dt*10));camera.lookAt(cam.tgt.x+fx*.8,hy+.1,cam.tgt.z+fz*.8);
    P.dof.uniforms.focus.value=camera.position.distanceTo(cam.tgt);P.dof.uniforms.aperture.value=.00012}
  else{if(cam.auto)cam.th+=dt*.04;const dir=new T.Vector3(Math.sin(cam.th)*Math.sin(cam.ph),Math.cos(cam.ph),Math.cos(cam.th)*Math.sin(cam.ph));camera.position.copy(cam.tgt).addScaledVector(dir,cam.r);camera.lookAt(cam.tgt);P.dof.uniforms.focus.value=cam.r;P.dof.uniforms.aperture.value=.00002}
  const f=mode==="tp"&&player?player.h.g.position:cam.tgt;sun.target.position.copy(f);
}
let SD=null;
function applyHour(){if(!sky)return;const h=hour;const el=Math.sin((h-6)/12.6*Math.PI);const az=(h-6)/12.6*Math.PI;const elev=Math.max(-.2,el)*1.25;
  SD=new T.Vector3(Math.cos(az)*Math.cos(elev),Math.sin(Math.max(elev,.02)),.35).normalize();sky.material.uniforms.sunPosition.value.copy(new T.Vector3(Math.cos(az)*Math.cos(elev),Math.sin(elev),.35).normalize());
  const day=Math.max(0,Math.min(1,el*2)),dusk=el>-.15&&el<.4?1-Math.abs(el-.1)/.35:0,night=1-Math.max(0,Math.min(1,(el+.15)*3.2));
  sun.intensity=night>.9?.08:.4+3.2*day+.8*Math.max(0,dusk);sun.color.set(new T.Color(0xffffff).lerp(new T.Color(0xffa860),Math.max(0,dusk)*.8));
  hemi.intensity=.08+.35*day+.1*Math.max(0,dusk);scene.environment=dusk>.3||night>.5?env.dusk:env.day;scene.environmentIntensity=night>.5?.06:.35+.65*day+.3*Math.max(0,dusk);
  fog.color.set(new T.Color(0xc9d6e2).lerp(new T.Color(0xf0b27a),Math.max(0,dusk)).lerp(new T.Color(0x0b1020),night));fog.density=.0012+.0008*Math.max(0,dusk)-.0005*night;
  renderer.toneMappingExposure=night>.5?.9:.85+.15*day;P.grade.uniforms.warm.value=Math.max(0,dusk);
  for(const m of Object.values(mats().fac))m.emissiveIntensity=night*.55;mats().shop.emissiveIntensity=night*.35;mats().lamp.emissiveIntensity=night*3;for(const m of lampsCar)m.emissiveIntensity=night>.3?4:.2;
  P.bloom.strength=.22+night*.18;P.bloom.threshold=night>.5?.97:.92;if(night>.5&&!UL._pl){UL._pl=[];for(let i=0;i<8;i++){const pl=new T.PointLight(0xffc98a,28,24,2);scene.add(pl);UL._pl.push(pl)}}if(UL._pl)UL._pl.forEach(p=>p.visible=night>.5)}
UL.setHour=h=>{hour=h;if(UL.ok)applyHour()};
function loop(){requestAnimationFrame(loop);if(!UL.on||!world)return;const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;tick(dt,t);
  if(SD){sun.position.copy(sun.target.position).addScaledVector(SD,220)}
  if(UL._pl&&UL._pl[0].visible){const f=cam.tgt;const near=lamps.slice().sort((a,b)=>a.distanceToSquared(f)-b.distanceToSquared(f)).slice(0,8);near.forEach((p,i)=>UL._pl[i].position.copy(p))}
  P.grade.uniforms.time.value=t;composer.render(dt)}
/* ---------- afficher un lieu ---------- */
UL.show=function(o){if(!UL.ok)return;const key=JSON.stringify({c:o.city,l:o.land});if(lastO===key)return;lastO=key;clear();buildCity(o);mode="orbit";cam.r=o.city&&o.city.pop>2e6?170:120;cam.ph=1.1;cam.auto=true;applyHour()};
UL.screenshot=()=>canvas&&canvas.toDataURL("image/jpeg",.9);
})();
