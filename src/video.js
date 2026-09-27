/* Chemin d'Etoudi — reportages vidéo : n'importe quel sujet du jeu (route, glissement de terrain, grève, émeute,
   inondation, incendie, hôpital, délestage, insécurité, chantier, embouteillage, marché…) se regarde en vidéo.
   Les images sont des reconstitutions en 3D temps réel, tournées comme un reportage (drone, caméra à l'épaule). */
(function(){
"use strict";
const CM=window.CM,G=window.GAME,S3=window.Scene3D,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,pick=G.pick;
const VID={};window.VID=VID;

VID.TYPES={
 route:["État de la route","Images de l'axe routier"],glissement:["Glissement de terrain","Images de la zone sinistrée"],
 greve:["Mouvement de grève","Images du mouvement"],emeute:["Soulèvement et affrontements","Images des affrontements"],
 inondation:["Inondation","Images des quartiers inondés"],incendie:["Incendie","Images de l'incendie"],
 hopital:["À l'hôpital","Images de l'hôpital"],delestage:["Délestage","La ville plongée dans le noir"],
 attaque:["Insécurité","Images après l'attaque"],controle:["Contrôle routier","Images du point de contrôle"],
 chantier:["Chantier","Images du chantier"],trafic:["Embouteillages","Images de la circulation"],
 marche:["Au marché","Images du marché"],village:["Au village","Images du village"],ville:["La ville","Survol de la ville"]
};
const SOURCES={route:["Drone du ministère des Travaux publics","CRTV","Vidéo amateur, réseaux sociaux"],glissement:["Drone de la Protection civile","CRTV","Canal 2 International"],
 greve:["Équinoxe TV","Vidéo amateur, réseaux sociaux","STV"],emeute:["Vidéo amateur, réseaux sociaux","Équinoxe TV","LTM TV"],inondation:["CRTV","Vidéo amateur, réseaux sociaux","Canal 2 International"],
 incendie:["Vidéo amateur, réseaux sociaux","CRTV","Vision 4"],hopital:["CRTV","Canal 2 International","Équinoxe TV"],delestage:["Vidéo amateur, réseaux sociaux","STV"],
 attaque:["Images de l'armée (Mindef)","CRTV"],controle:["Vidéo amateur, réseaux sociaux","Équinoxe TV"],chantier:["Drone du maître d'ouvrage","CRTV"],trafic:["Canal 2 International","STV"],
 marche:["CRTV","Vision 4"],village:["CRTV","Vision 4"],ville:["Drone de la CRTV","CRTV"]};

/* sujet d'une vidéo d'après le texte d'un événement */
VID.typeOf=function(t){t=String(t||"").toLowerCase();
  const R=[["glissement",/glissement|éboulement|effondrement de terrain|coulée de boue|affaissement/],["inondation",/inond|crue|pluies diluviennes|sinistrés du logone/],
   ["incendie",/incendie|brûl|feu au marché|flammes/],["emeute",/émeute|soulèvement|affrontement|manifest|colère|insurrection|barricade|ville morte|marche pacifique|répression/],
   ["greve",/grève|syndicat|arriérés|débrayage|sit-in/],["attaque",/attaque|boko|séparatist|ambazon|enlèvement|otage|embuscade|terror|bavure|kidnapp/],
   ["controle",/racket|point de contrôle|contrôle routier|commissa|gendarm|police/],["hopital",/hôpital|patients|choléra|paludisme|santé|maternité|épidémie|méningite|malnutrition/],
   ["delestage",/délestage|électricité|eneo|coupure de courant|obscurité/],["route",/route|nids-de-poule|nid de poule|pont|axe|bitum|autoroute|piste|chaussée/],
   ["chantier",/chantier|travaux|construction|livr|réalisé par|inaugur/],["trafic",/embouteillage|circulation|bouchon/],
   ["marche",/marché|prix|vie chère|riz|carburant|commerçants/],["village",/village|forage|chefferie|eau potable|puits/]];
  for(const [k,re] of R)if(re.test(t))return k;return"ville"};
function regOf(t){t=String(t||"");for(const r of CM.REGIONS){if(t.includes(r.n)||t.includes(r.chef)||r.villes.some(v=>t.includes(v)))return r.id}return null}
/* bouton « voir la vidéo » à placer n'importe où */
VID.btn=function(text,reg,label){return'<button class="btn small vidbtn" data-vid="1" data-vx="'+esc(String(text||"").slice(0,220))+'" data-vr="'+esc(reg||"")+'">▶ '+esc(label||"Voir la vidéo")+'</button>'};
VID.bindAll=function(root){if(!root)return;root.querySelectorAll("[data-vid]").forEach(b=>{if(b._vb)return;b._vb=1;b.addEventListener("click",e=>{e.stopPropagation();const x=b.dataset.vx||"";VID.play({text:x,reg:b.dataset.vr||regOf(x),type:b.dataset.vt||VID.typeOf(x)})})})};

function narration(o,R,city){const T=VID.TYPES[o.type];const base=o.text?o.text.replace(/\s+/g," ").trim():"";
  const intro={route:"Nous sommes sur l'axe qui dessert "+city+".",glissement:"Scène de désolation dans la région "+de(R)+".",greve:"À "+city+", le mouvement de grève se poursuit.",emeute:"Tension extrême ce jour à "+city+".",
   inondation:"À "+city+", l'eau a envahi les rues après des pluies diluviennes.",incendie:"Un violent incendie s'est déclaré à "+city+".",hopital:"Nous sommes à l'hôpital de "+city+".",delestage:"Nuit noire sur "+city+", privée d'électricité.",
   attaque:"Nous nous sommes rendus sur les lieux, dans la région "+de(R)+".",controle:"Sur la route de "+city+", les usagers dénoncent ce point de contrôle.",chantier:"Point d'étape sur le chantier, près de "+city+".",
   trafic:"Aux heures de pointe, "+city+" est paralysée.",marche:"Au marché de "+city+", les ménagères font leurs comptes.",village:"Dans ce village de la région "+de(R)+", la vie s'organise.",ville:"Vue d'ensemble de "+city+"."}[o.type];
  return intro+" "+(base&&base.length>12?base.charAt(0).toUpperCase()+base.slice(1)+(/[.!?]$/.test(base)?"":"."):"")}
function de(R){return(/^[AEÉIOU]/.test(R.n)?"de l'":"du ")+R.n}

/* ---------- lecteur ---------- */
VID.play=function(o){
  const S=G.S;o=o||{};const reg=o.reg&&CM.REG[o.reg]?o.reg:(S&&S.opp&&S.opp.home)||(S&&S.pro&&S.pro.reg)||(S&&S.ent&&S.ent.reg)||"CE";const R=CM.REG[reg];
  const type=o.type&&VID.TYPES[o.type]?o.type:VID.typeOf(o.text);const city=o.city||R.chef;
  const q=o.q||(/neuve|livr|inaugur|réhabilit|bitumée/i.test(o.text||"")?"good":S&&S.regs&&S.regs[reg]&&S.regs[reg].infra>55&&!/nid|dégrad|impratic|coupée|mauvais/i.test(o.text||"")?"good":"bad");
  const src=o.source||pick(SOURCES[type]||["CRTV"]);const T=VID.TYPES[type];
  const title=o.title||(T[0]+(type==="route"?(q==="good"?" : route en bon état":" : chaussée dégradée"):"")+" — "+city);
  const date=S?G.dayLabel(S.day):"";
  const el=document.createElement("div");el.className="film";el.setAttribute("role","dialog");el.setAttribute("aria-label","Vidéo : "+title);
  el.innerHTML='<div class="fview" id="fview"></div><div class="lb top"></div><div class="lb bot"></div>'+
   '<div class="fhud"><span class="rec">● REC</span><span class="src">'+esc(src)+'</span></div><div class="fclock">'+esc(date)+' · <span id="ftc">00:00</span></div>'+
   '<div class="lower"><span class="k">'+esc(T[1])+' · '+esc(R.n)+'</span><b>'+esc(title)+'</b><span class="sub" id="fsub"></span></div>'+
   '<div class="fbar"><i id="fprog"></i></div><div class="fctl"><button class="btn small" id="fPause">Pause</button><button class="btn small" id="fAgain">Revoir</button><button class="btn small primary" id="fClose">Fermer</button></div>'+
   '<div class="fnote">Reconstitution en 3D à partir des remontées du terrain.</div>';
  document.body.appendChild(el);
  const text=narration({type,text:o.text},R,city);$("fsub").textContent=text;
  if(!S3||!S3.ok){$("fview").innerHTML='<div class="nogl" style="position:absolute;inset:0;display:grid;place-items:center;padding:20px">Votre appareil n\'affiche pas la 3D : voici le reportage en texte.<br><br>'+esc(text)+'</div>'}
  else{S3.attach($("fview"));S3.film({type,land:R.land,seed:(o.text||"").length+reg.charCodeAt(0),q,banner:o.banner,
    onProgress:(p,i)=>{const pr=$("fprog");if(pr)pr.style.width=(p*100).toFixed(1)+"%";const tc=$("ftc");if(tc){const s=Math.floor(p*20);tc.textContent="00:"+String(s).padStart(2,"0")}},
    onEnd:()=>{const b=$("fPause");if(b)b.textContent="Terminé"}})}
  const amb={greve:"meeting",emeute:"meeting",marche:"marche",incendie:"marche",hopital:"ville",village:"village"}[type]||"ville";try{A.ambient(amb)}catch(e){}
  setTimeout(()=>{try{A.speak(text,{voix:pick(["m","f"]),rate:1.02})}catch(e){}},600);
  let paused=false;
  $("fPause").onclick=()=>{paused=!paused;S3.filmPause&&S3.filmPause(paused);$("fPause").textContent=paused?"Lecture":"Pause";if(paused)A.stop()};
  $("fAgain").onclick=()=>{S3.filmReplay&&S3.filmReplay();paused=false;$("fPause").textContent="Pause";A.speak(text,{voix:"m"})};
  const close=()=>{A.stop();if(S3&&S3.ok){S3.detach();S3.endFilm()}el.remove();document.removeEventListener("keydown",esck)};
  const esck=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esck);
  $("fClose").onclick=close;
};

/* ---------- choisir librement un sujet ---------- */
VID.picker=function(){
  const S=G.S;const def=(S&&S.opp&&S.opp.home)||(S&&S.pro&&S.pro.reg)||"LT";
  G.sheet('<h3 class="h2">Regarder une vidéo</h3><p class="small muted">Choisissez un sujet et un lieu : vous verrez les images de la situation sur place.</p>'+
   '<label class="f" for="vReg">Lieu<select id="vReg">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===def?" selected":"")+'>'+esc(r.chef)+' ('+esc(r.n)+')</option>').join("")+'</select></label>'+
   '<div class="choices">'+Object.entries(VID.TYPES).map(([k,v])=>'<button class="choice" data-vk="'+k+'"><span class="t">▶ '+esc(v[0])+'</span></button>').join("")+'</div>',el=>{
    el.querySelectorAll("[data-vk]").forEach(b=>b.onclick=()=>{const reg=el.querySelector("#vReg").value;el.remove();VID.play({type:b.dataset.vk,reg})});
  });
};

/* ---------- HUD façon jeu d'action : heure, argent, énergie ---------- */
function money(S){try{if(window.EMP)return EMP.wallet(S)}catch(e){}return 0}
function gtaHud(){const S=G.S,el=$("gtahud");if(!el)return;if(!S||S.mode==="multi"){el.hidden=true;return}el.hidden=false;
  const h=((S.day%1)*24+8)%24,H=Math.floor(h),Mi=Math.floor((h-H)*60);const m=Math.round(money(S));
  el.innerHTML='<div class="clk">'+String(H).padStart(2,"0")+':'+String(Mi).padStart(2,"0")+'</div><div class="bar"><i style="width:'+(S.st?Math.max(4,S.st.pop):60)+'%"></i></div><div class="cash">'+(m<0?"-":"")+'F'+String(Math.abs(m)).padStart(9,"0")+'</div>'}
setInterval(()=>{gtaHud();streetMini()},500);
/* ---------- vue rue : commandes et mini-carte des rues ---------- */
/* ---------- qualité graphique : classique (téléphone) ou Ultra (PC) ---------- */
let ultraVis=false;
VID.ultraView=function(on){ultraVis=!!on;if(S3)S3.paused=ultraVis;const c=document.querySelector("#view > canvas:not(.ultra-canvas)");if(c)c.style.visibility=ultraVis?"hidden":"visible";const u=document.querySelector(".ultra-canvas");if(u)u.style.display=ultraVis?"block":"none"};
VID.gfxPref=()=>{try{return localStorage.getItem("etoudi-gfx")}catch(e){return null}};
VID.setGfx=async function(ultra){try{localStorage.setItem("etoudi-gfx",ultra?"ultra":"classic")}catch(e){}
  if(!ultra){if(window.Ultra)await Ultra.enable($("view"),false);VID.ultraView(false);G.S&&G.viewRegion(G._reg||"CE");return}
  if(!window.Ultra||!Ultra.supported){G.toast("Votre appareil ne prend pas en charge le rendu Ultra (WebGL 2).");return}
  const ov=document.createElement("div");ov.className="gfxload";ov.innerHTML='<b>Chargement des graphismes Ultra…</b><span>Humains animés, véhicules, textures et éclairage haute qualité (environ 17 Mo).</span>';$("view").appendChild(ov);
  try{await Ultra.enable($("view"),true);ov.remove();if(G.S){const h=((G.S.day%1)*24+8)%24;Ultra.setHour(h);G.viewRegion(G._reg||"CE")}G.toast("Graphismes Ultra activés")}catch(e){ov.remove();G.toast("Rendu Ultra impossible : "+e.message);VID.ultraView(false)}};
VID.gfxSheet=function(){const on=window.Ultra&&Ultra.on;G.sheet('<h3 class="h2">Qualité graphique</h3><div class="choices"><button class="choice" data-gx="classic" aria-pressed="'+!on+'"><span class="t">Classique (téléphone)</span><span class="small muted">Léger, fonctionne partout.</span></button><button class="choice" data-gx="ultra" aria-pressed="'+!!on+'"><span class="t">Ultra (PC)</span><span class="small muted">Rendu physique PBR, éclairage HDR et réflexions, ombres douces, occlusion ambiante, profondeur de champ, humains animés, véhicules détaillés. Recommandé : PC avec carte graphique.</span></button></div><span class="eyebrow">Votre avatar (vue rue)</span><div class="row"><button class="btn small" data-av="homme">Homme</button><button class="btn small" data-av="femme">Femme</button></div>',el=>{el.querySelectorAll("[data-gx]").forEach(b=>b.onclick=()=>{el.remove();VID.setGfx(b.dataset.gx==="ultra")});el.querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{try{localStorage.setItem("etoudi-avatar",b.dataset.av)}catch(e){}G.toast("Avatar : "+b.textContent)})})};
setTimeout(()=>{const p=VID.gfxPref();const embedded=!!window.U||location.protocol!=="file:";if(embedded&&window.Ultra&&Ultra.supported&&(p==="ultra"||(p==null&&!Ultra.mobile)))VID.setGfx(true)},1500);
VID.walk=function(){const S=G.S;if(ultraVis&&window.Ultra){let av="homme";try{av=localStorage.getItem("etoudi-avatar")||"homme"}catch(e){}const on=Ultra.walk(av==="homme"?{kind:"homme"}:{kind:"michelle",skin:"#4a2f22",cloth:S&&(S.mode==="pres"||S.mode==="min")?"#1f2937":null});ui(on);return}
  if(!S3||!S3.ok)return;if(S3.inStreet()){S3.streetStop();ui(false);return}
  const look={shirt:pick(["#f5f5f5","#1d4ed8","#b91c1c","#0f766e","#111827"]),pant:pick(["#2b4a7a","#1f2937","#6b5b45"]),skin:"#5a3825"};
  if(S.mode==="pres"||S.mode==="min"){look.shirt="#1f2937";look.pant="#1f2937";look.arm="#1f2937"}
  if(!S3.streetStart(look))return G.toast("Placez-vous d'abord dans une ville (onglet Carte, ou « Se déplacer »).");ui(true);G.toast("Vous marchez dans la rue : joystick ou touches Z Q S D / flèches, glissez pour tourner la caméra.")};
function ui(on){const j=$("joy"),b=$("bWalk"),x=$("streetX");if(j)j.hidden=!on;if(x)x.hidden=!on;$("app").classList.toggle("full",on);setTimeout(()=>window.dispatchEvent(new Event("resize")),50);if(b)b.setAttribute("aria-pressed",on);$("view").classList.toggle("street",on);VID.hud()}
function streetMini(){const S=G.S;const info=ultraVis&&window.Ultra?Ultra.streetInfo():S3&&S3.streetInfo&&S3.streetInfo();const mm=$("minimap");if(!mm||!info)return;
  let cv=mm.querySelector("canvas");if(!cv){mm.innerHTML='<div class="mmap"><canvas width="160" height="160"></canvas></div><div class="stars">'+(S?stars(S):"")+'</div>';cv=mm.querySelector("canvas")}
  const g=cv.getContext("2d"),Gd=info.g,sc=2.2;g.save();g.fillStyle="#6f7a66";g.fillRect(0,0,160,160);g.translate(80,80);g.rotate(info.cam+Math.PI);
  g.fillStyle="#3a3d42";for(let i=-Gd.n;i<=Gd.n;i++){const x=(Gd.cx+i*Gd.B-info.x)*sc,z=(Gd.cz+i*Gd.B-info.z)*sc;g.fillRect(x-Gd.RW*sc/2,-400,Gd.RW*sc,800);g.fillRect(-400,z-Gd.RW*sc/2,800,Gd.RW*sc)}
  g.fillStyle="#e7e2d6";for(const b of Gd.blds)g.fillRect((b.x-b.hx-info.x)*sc,(b.z-b.hz-info.z)*sc,b.hx*2*sc,b.hz*2*sc);g.restore();
  g.save();g.translate(80,80);g.rotate(-(info.yaw-info.cam-Math.PI));g.fillStyle="#fde047";g.strokeStyle="#111";g.lineWidth=1.5;g.beginPath();g.moveTo(0,-8);g.lineTo(6,6);g.lineTo(0,3);g.lineTo(-6,6);g.closePath();g.fill();g.stroke();g.restore();
  g.fillStyle="#fff";g.font="bold 13px Arial";g.fillText("N",74,14)}
function joystick(){const j=$("joy");if(!j||j._b)return;j._b=1;const sx=$("streetX");if(sx)sx.onclick=()=>VID.walk();const k=j.querySelector(".knob");let id=null,c=null;
  const upd=(x,y)=>{const r=j.getBoundingClientRect();c=c||{x:r.left+r.width/2,y:r.top+r.height/2};let dx=x-c.x,dy=y-c.y;const L=Math.hypot(dx,dy),R=r.width/2-14;if(L>R){dx*=R/L;dy*=R/L}k.style.transform="translate("+dx+"px,"+dy+"px)";if(ultraVis&&window.Ultra)Ultra.input(dx/R,-dy/R,L>R*.95);else S3.streetInput(dx/R,-dy/R,L>R*.95)};
  j.addEventListener("pointerdown",e=>{id=e.pointerId;c=null;j.setPointerCapture(id);upd(e.clientX,e.clientY);e.stopPropagation()});
  j.addEventListener("pointermove",e=>{if(e.pointerId===id)upd(e.clientX,e.clientY)});
  const end=e=>{if(e.pointerId!==id)return;id=null;k.style.transform="";if(window.Ultra)Ultra.input(0,0,false);S3.streetInput(0,0,false)};j.addEventListener("pointerup",end);j.addEventListener("pointercancel",end)}
/* ---------- mini-carte et indice de tension (façon jeu d'action) ---------- */
VID.hud=function(){joystick();gtaHud();if((S3&&S3.inStreet&&S3.inStreet())||(ultraVis&&window.Ultra&&Ultra.inStreet())){streetMini();return}
  const S=G.S,mm=$("minimap");if(!mm)return;if(!S||S.mode==="multi"){mm.hidden=true;return}mm.hidden=false;
  const cur=G._reg||"CE";const moodC=id=>{const v=S.mood&&S.mood[id]?S.mood[id].v:50;return v<35?"#dc2626":v<50?"#f59e0b":"#16a34a"};
  mm.innerHTML='<div class="mmap">'+G.mapSVG(id=>id===cur?"#fde047":moodC(id),cur,()=>"")+'</div><div class="stars" title="Indice de tension">'+stars(S)+'</div>';
  mm.onclick=()=>G.setTab("carte");
};
function stars(S){const v=S.mood?Object.values(S.mood).reduce((a,m)=>a+m.v,0)/Object.keys(S.mood).length:50;const n=Math.max(0,Math.min(5,Math.round((62-v)/7)));return"★".repeat(n)+'<span style="opacity:.3">'+"★".repeat(5-n)+"</span>"}
})();
