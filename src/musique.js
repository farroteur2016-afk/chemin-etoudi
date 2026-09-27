/* Chemin d'Etoudi — fond sonore : musiques du jeu (composées en direct, libres et hors ligne) ou musiques du joueur
   (fichiers de l'appareil, gardés dans le navigateur). Volume réglable, coupure automatique quand le micro écoute,
   volume baissé quand une voix parle. Remplace l'ancienne ambiance « vent ». */
(function(){
"use strict";
const G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MUS={};window.MUS=MUS;
const KEY="etoudi-musique";
let P={on:true,src:"jeu",piste:0,vol:.35,baisse:true};try{Object.assign(P,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
MUS.pref=P;

/* l'ancienne ambiance (souffle, vent, foule) est retirée */
try{A.setAmb&&A.setAmb(false)}catch(e){}
A.ambient=function(){};A.setAmb=function(on){MUS.setOn(on)};Object.defineProperty(A,"ambOn",{get:()=>P.on,set:v=>{},configurable:true});

/* ---------- moteur ---------- */
let ctx=null,out=null,verb=null,timer=null,nextT=0,step=0,cur=-1,duckN=0,speakDuck=false,audioEl=null,urls=[];
function ensure(){if(ctx)return ctx;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();out=ctx.createGain();out.gain.value=0;out.connect(ctx.destination);
  // petite réverbération générée
  const len=ctx.sampleRate*1.8,b=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  verb=ctx.createConvolver();verb.buffer=b;const vg=ctx.createGain();vg.gain.value=.28;verb.connect(vg);vg.connect(out);return ctx}
function target(){if(!P.on||duckN>0)return 0;return P.vol*(speakDuck&&P.baisse?.3:1)}
function applyVol(){const v=target();if(out&&ctx)out.gain.setTargetAtTime(v,ctx.currentTime,.25);if(audioEl)audioEl.volume=Math.max(0,Math.min(1,v));
  if(audioEl){if(v===0&&!audioEl.paused&&duckN>0)audioEl.pause();else if(v>0&&audioEl.paused&&P.on&&P.src==="perso")audioEl.play().catch(()=>{})}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function note(t,m,d,type,g,atk,wet){const o=ctx.createOscillator(),e=ctx.createGain();o.type=type;o.frequency.value=mtof(m);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+(atk||.005));e.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(e);e.connect(out);if(wet)e.connect(verb);o.start(t);o.stop(t+d+.05)}
function mallet(t,m,g){note(t,m,.9,"sine",g,.003,true);note(t,m+24,.25,"sine",g*.25,.002)}
function pluck(t,m,g){note(t,m,.5,"triangle",g,.004,true);note(t,m+12,.18,"square",g*.08,.002)}
function piano(t,m,g){note(t,m,1.8,"triangle",g,.004,true);note(t,m+12,.9,"sine",g*.3,.004,true)}
function pad(t,ms,d,g){for(const m of ms){const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),e=ctx.createGain();o.type="sawtooth";o.frequency.value=mtof(m);o.detune.value=(Math.random()-.5)*12;f.type="lowpass";f.frequency.value=900;
  e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+d*.35);e.gain.linearRampToValueAtTime(0,t+d);o.connect(f);f.connect(e);e.connect(out);e.connect(verb);o.start(t);o.stop(t+d+.1)}}
function kick(t,g){const o=ctx.createOscillator(),e=ctx.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(45,t+.15);e.gain.setValueAtTime(g,t);e.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(e);e.connect(out);o.start(t);o.stop(t+.3)}
function tick(t,g){const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),e=ctx.createGain();o.type="square";o.frequency.value=3200+Math.random()*400;f.type="highpass";f.frequency.value=2500;e.gain.setValueAtTime(g,t);e.gain.exponentialRampToValueAtTime(.001,t+.04);o.connect(f);f.connect(e);e.connect(out);o.start(t);o.stop(t+.06)}
const R=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- les 4 morceaux du jeu ---------- */
const PISTES=[
 {n:"Balafon du soir",bpm:96,prog:[[57,60,64,67],[53,57,60,64],[55,59,62,67],[52,55,60,64]],play(t,s,sp,c){const penta=[0,2,4,7,9];if(s%2===0)mallet(t,c[0]+12+R(penta)+(Math.random()<.3?12:0),.16);if(s%8===0)note(t,c[0]-12,1.2,"sine",.22,.01);if(s%4===2)tick(t,.02)}},
 {n:"Piano d'Etoudi",bpm:72,prog:[[48,55,64,67],[45,52,60,64],[41,53,57,65],[43,50,59,62]],play(t,s,sp,c){const i=s%8;if(i===0)piano(t,c[0],.2);if(i%2===0)piano(t,c[1+((i/2)%3)]+12,.11);if(i===5&&Math.random()<.5)piano(t,c[3]+12,.08)}},
 {n:"Makossa léger",bpm:112,prog:[[45,57,60,64],[50,57,62,65],[43,55,59,62],[48,55,60,64]],play(t,s,sp,c){const i=s%8;if(i===0||i===3||i===6)note(t,c[0]-12+(i===6?7:0),.3,"sine",.26,.005);if(i%2===0)kick(t,i===0?.35:.18);tick(t,i%2?.03:.015);if(i===2||i===5||i===7)pluck(t,R(c)+12,.08)}},
 {n:"Cordes solennelles",bpm:60,prog:[[50,57,62,65],[46,53,58,62],[43,55,58,62],[45,52,57,61]],play(t,s,sp,c){if(s%8===0)pad(t,c,sp*8.2,.05);if(s%8===4&&Math.random()<.6)piano(t,c[2]+12,.07)}}];
MUS.PISTES=PISTES.map(p=>p.n);
function sched(){if(!ctx)return;const p=PISTES[cur];if(!p)return;const sp=60/p.bpm/2;while(nextT<ctx.currentTime+.35){const c=p.prog[Math.floor(step/8)%p.prog.length];try{p.play(nextT,step,sp,c)}catch(e){}nextT+=sp;step++}}
function startGen(i){stopAll();if(!ensure())return;if(ctx.state==="suspended")ctx.resume();cur=i;step=0;nextT=ctx.currentTime+.1;timer=setInterval(sched,90);applyVol()}
function stopAll(){clearInterval(timer);timer=null;cur=-1;if(audioEl){audioEl.pause();audioEl.src="";audioEl=null}urls.forEach(u=>URL.revokeObjectURL(u));urls=[]}

/* ---------- musiques du joueur (IndexedDB) ---------- */
function db(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error("stockage indisponible"));const r=indexedDB.open("etoudi-musique",1);r.onupgradeneeded=()=>r.result.createObjectStore("pistes",{keyPath:"id"});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function listPerso(){try{const d=await db();return await new Promise(res=>{const q=d.transaction("pistes").objectStore("pistes").getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([])})}catch(e){return[]}}
async function addPerso(files){const d=await db();for(const f of files){await new Promise(res=>{const tx=d.transaction("pistes","readwrite");tx.objectStore("pistes").put({id:"m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:f.name.replace(/\.[a-z0-9]+$/i,""),blob:f,t:Date.now()});tx.oncomplete=res;tx.onerror=res})}}
async function delPerso(id){const d=await db();await new Promise(res=>{const tx=d.transaction("pistes","readwrite");tx.objectStore("pistes").delete(id);tx.oncomplete=res;tx.onerror=res})}
async function startPerso(i){stopAll();const L=(await listPerso()).sort((a,b)=>a.t-b.t);if(!L.length){startGen(P.piste<PISTES.length?P.piste:0);return}const k=((i||0)%L.length+L.length)%L.length;P.perso=k;save();
  const u=URL.createObjectURL(L[k].blob);urls.push(u);audioEl=new Audio(u);audioEl.volume=target();audioEl.onended=()=>startPerso(k+1);audioEl.play().catch(()=>{});MUS.now=L[k].name}

/* ---------- API ---------- */
MUS.start=function(){if(!P.on){stopAll();return}if(P.src==="perso")startPerso(P.perso||0);else{startGen(P.piste||0);MUS.now=PISTES[P.piste||0].n}};
MUS.setOn=function(on){P.on=!!on;save();if(on)MUS.start();else{applyVol();setTimeout(()=>{if(!P.on)stopAll()},600)}const b=$("bAmb");if(b)b.setAttribute("aria-pressed",P.on)};
MUS.setVol=function(v){P.vol=Math.max(0,Math.min(1,v));save();applyVol()};
MUS.duck=function(on){duckN=Math.max(0,duckN+(on?1:-1));applyVol()};
MUS.next=function(){if(P.src==="perso")startPerso((P.perso||0)+1);else{P.piste=((P.piste||0)+1)%PISTES.length;save();MUS.start()}};
// baisse pendant que le jeu parle
setInterval(()=>{const s=!!(A.speaking||(window.speechSynthesis&&speechSynthesis.speaking));if(s!==speakDuck){speakDuck=s;applyVol()}},300);
// démarrage au premier geste (règle des navigateurs)
const first=()=>{document.removeEventListener("pointerdown",first,true);document.removeEventListener("keydown",first,true);if(P.on&&cur<0&&!audioEl)MUS.start()};
document.addEventListener("pointerdown",first,true);document.addEventListener("keydown",first,true);
// micro : coupure automatique pour toutes les reconnaissances vocales du jeu
const SRc=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SRc){const proto=SRc.prototype,st=proto.start,sp=proto.stop,ab=proto.abort;
  proto.start=function(){if(!this._mus){this._mus=1;const self=this;const end=()=>{if(self._musOn){self._musOn=0;MUS.duck(false)}};this.addEventListener("end",end);this.addEventListener("error",end)}if(!this._musOn){this._musOn=1;MUS.duck(true)}return st.apply(this,arguments)}}

/* ---------- réglages ---------- */
MUS.sheet=async function(){const L=(await listPerso()).sort((a,b)=>a.t-b.t);
  G.sheet('<span class="eyebrow">Paramètres</span><h3 class="h2">Son et musique</h3>'+
   '<div class="row" style="justify-content:space-between"><b>Fond sonore</b><button class="btn '+(P.on?"primary":"")+'" id="muOn">'+(P.on?"Activé":"Coupé")+'</button></div>'+
   '<div class="row" style="justify-content:space-between"><label for="muVol"><b>Volume du fond sonore</b></label><span><span id="muVv">'+Math.round(P.vol*100)+'</span> %</span></div><input type="range" id="muVol" min="0" max="100" value="'+Math.round(P.vol*100)+'" style="width:100%">'+
   '<label class="row small" style="gap:8px"><input type="checkbox" id="muBa"'+(P.baisse?" checked":"")+'> Baisser la musique quand une voix parle</label>'+
   '<p class="small muted">La musique se coupe automatiquement quand le micro écoute, et reprend ensuite.</p>'+
   '<span class="eyebrow">Musiques du jeu (libres, hors ligne)</span><div class="choices">'+PISTES.map((p,i)=>'<button class="choice" data-mp="'+i+'" aria-pressed="'+(P.src==="jeu"&&P.piste===i)+'"><span class="t">'+(P.src==="jeu"&&P.piste===i?"▶ ":"")+esc(p.n)+'</span></button>').join("")+'</div>'+
   '<span class="eyebrow">Mes musiques</span>'+(L.length?'<div class="choices">'+L.map((x,i)=>'<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="choice" style="flex:1" data-mm="'+i+'" aria-pressed="'+(P.src==="perso"&&P.perso===i)+'"><span class="t">'+(P.src==="perso"&&P.perso===i?"▶ ":"")+esc(x.name)+'</span></button><button class="btn small" data-md="'+x.id+'" aria-label="Retirer '+esc(x.name)+'">✕</button></div>').join("")+'</div>':'<p class="small muted">Aucune pour l\'instant.</p>')+
   '<label class="btn" style="text-align:center;cursor:pointer">＋ Ajouter des musiques depuis mon appareil<input type="file" id="muAdd" accept="audio/*" multiple hidden></label>'+
   '<p class="small muted">Vos musiques restent sur cet appareil, dans ce navigateur ; elles ne sont envoyées nulle part. Elles s\'enchaînent en boucle.</p>',el=>{
    el.setAttribute("data-noinstr","");
    el.querySelector("#muOn").onclick=()=>{MUS.setOn(!P.on);el.remove();MUS.sheet()};
    const vol=el.querySelector("#muVol");vol.oninput=()=>{MUS.setVol(vol.value/100);el.querySelector("#muVv").textContent=vol.value;if(!P.on){P.on=true;save();MUS.start()}};
    el.querySelector("#muBa").onchange=e=>{P.baisse=e.target.checked;save();applyVol()};
    el.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{P.src="jeu";P.piste=+b.dataset.mp;P.on=true;save();MUS.start();el.remove();MUS.sheet()});
    el.querySelectorAll("[data-mm]").forEach(b=>b.onclick=()=>{P.src="perso";P.perso=+b.dataset.mm;P.on=true;save();MUS.start();el.remove();MUS.sheet()});
    el.querySelectorAll("[data-md]").forEach(b=>b.onclick=async()=>{await delPerso(b.dataset.md);if(P.src==="perso")MUS.start();el.remove();MUS.sheet()});
    el.querySelector("#muAdd").onchange=async e=>{const f=[...e.target.files];if(!f.length)return;try{await addPerso(f);P.src="perso";P.on=true;P.perso=0;save();MUS.start();G.toast(f.length+" musique"+(f.length>1?"s":"")+" ajoutée"+(f.length>1?"s":""))}catch(x){G.toast("Impossible d'enregistrer : "+x.message)}el.remove();MUS.sheet()};
  })};
})();
