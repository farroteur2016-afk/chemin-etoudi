/* Chemin d'Etoudi — logique du jeu (modes Président et Opposant), élections, carte, institutions. */
(function(){
"use strict";
const CM=window.CM,A=window.Audio2,S3=window.Scene3D;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=(n,d)=>Number(n).toLocaleString("fr-FR",{maximumFractionDigits:d||0,minimumFractionDigits:d||0});
const MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
function monthLabel(m){const t=CM.DEBUT.mois+m;return MOIS[t%12]+" "+(CM.DEBUT.annee+Math.floor(t/12))}
function dayLabel(d){d=Math.max(0,d||0);const m=Math.floor(d/30),j=Math.floor(d-m*30)+1;return j+(j===1?"er":"")+" "+monthLabel(m)}
const STATS=[{k:"pop",n:"Popularité"},{k:"eco",n:"Économie"},{k:"soc",n:"Cohésion"},{k:"sec",n:"Sécurité"},{k:"infra",n:"Infrastructures"},{k:"int",n:"Diplomatie"}];
const SNAME=Object.fromEntries(STATS.map(s=>[s.k,s.n]));Object.assign(SNAME,{dette:"Dette",routes:"Routes",elec:"Électricité"});
const LAND_AMB={sahel:"vent",savane:"vent",plateau:"vent",ville:"ville",port:"ville",hauts:"foret",grassfields:"foret",volcan:"foret",foret:"foret",cote:"mer"};
const KEY="etoudi-save-v1";

let S=null,tab="bureau",ui={};
const GAME={};window.GAME=GAME;

/* ---------- utilitaires d'interface ---------- */
function toast(msg){document.querySelectorAll(".toast").forEach(x=>x.remove());const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function sheet(html,after){const el=document.createElement("div");el.className="sheet";el.innerHTML='<div class="in">'+html+'<button class="btn" data-close>Fermer</button></div>';
  el.addEventListener("click",e=>{if(e.target===el||e.target.hasAttribute("data-close")){el.remove()}});document.body.appendChild(el);if(after)after(el);if(window.VID)VID.bindAll(el);if(window.INSTR)INSTR.attach(el);return el}
GAME.dayLabel=dayLabel;GAME.toast=toast;GAME.sheet=sheet;GAME.esc=esc;GAME.fmt=fmt;GAME.monthLabel=monthLabel;GAME.pick=pick;GAME.rnd=rnd;GAME.clamp=clamp;

let viewKey="";
function setView(o,k,n){
  $("placeK").textContent=k||"";$("placeN").textContent=n||"";
  const ult=window.Ultra&&Ultra.on&&!o.overlay&&!o.palais;if(window.VID&&VID.ultraView)VID.ultraView(ult);if(ult)Ultra.show(o);
  if(S3.ok)S3.show(o);
  const amb=o.overlay==="meeting"?"meeting":o.overlay==="marche"?"marche":o.overlay==="conseil"?"conseil":LAND_AMB[o.land]||"ville";
  A.ambient(amb);
}
GAME.setView=setView;
function viewRegion(id,overlay,extra){const r=CM.REG[id];GAME._reg=id;
  const L=S&&window.VOY?VOY.here(S):null;const cn=L&&L.reg===id?L.v:r.chef;const ci=window.VOY?VOY.cityInfo(cn):null;
  const o=Object.assign({land:r.land,overlay},ci?{city:ci,profile:VOY.profile(id),cortege:id==="CE"&&S&&Math.floor(S.day)%4===0}:{},extra||{});
  setView(o,r.n,overlay==="marche"?cap1(r.marche.replace(/^le |^la /,"")):overlay==="village"?cap1(r.village.split(",")[0].replace(/^le |^la |^un |^une |^les /,"")):(L&&L.reg===id&&L.lieu?L.lieu+", "+cn:cn))}
GAME.viewRegion=viewRegion;

function subs(who,text,opts){
  opts=opts||{};const el=$("subs");
  el.innerHTML='<div class="who"><span>'+esc(who)+'</span><button class="btn small ghost" id="subsX">Fermer</button></div><div class="txt">'+esc(text)+'</div>';
  el.hidden=false;$("place").hidden=true;
  const close=()=>{el.hidden=true;$("place").hidden=false;A.stop()};
  $("subsX").onclick=close;
  const spoke=A.speak(text,{voix:opts.voix||"m",rate:opts.rate||1,pitch:opts.pitch||1,onend:()=>{setTimeout(()=>{if(!A.speaking){el.hidden=true;$("place").hidden=false}},1800)}});
  if(!spoke)setTimeout(()=>{el.hidden=true;$("place").hidden=false},Math.min(14000,3000+text.length*45));
}
GAME.subs=subs;

function roleLabel(){return S.mode==="pres"?"Présidence":S.mode==="min"?S.minis.id:S.mode==="ing"?"Entreprise":S.mode==="pro"?PRO.LIST[S.pro.id].n:S.profil==="maire"?"Mairie":S.profil==="depute"?"Assemblée":"Opposition"}
function hud(){if(window.SYS)window.SYS.hudMood(S);const h=$("hudDate");
  if(!S){h.innerHTML="Cameroun · <b>"+esc(monthLabel(0))+"</b>";h.onclick=null;return}
  h.innerHTML=esc(roleLabel())+" · <b>"+esc(dayLabel(S.day))+"</b>"+(S.paused?" ⏸":S.speed>1?" ⏩":"");h.style.cursor="pointer";h.onclick=timeSheet}

/* ---------- boutons audio ---------- */
function bindAudio(){
  const bv=$("bVoice"),ba=$("bAmb");
  try{const p=JSON.parse(localStorage.getItem("etoudi-audio")||"{}");if(p.v===false)A.voiceOn=false;if(p.a===false)A.ambOn=false;if(p.auto===false)A.auto=false}catch(e){}
  const sync=()=>{bv.setAttribute("aria-pressed",A.voiceOn);ba.setAttribute("aria-pressed",A.ambOn);try{localStorage.setItem("etoudi-audio",JSON.stringify({v:A.voiceOn,a:A.ambOn,auto:A.auto}))}catch(e){}};
  const bgfx=$("bGfx");if(bgfx)bgfx.onclick=()=>{if(window.VID)VID.gfxSheet()};
  const bvox=$("bVox");if(bvox)bvox.onclick=()=>{A.unlock();if(window.VOIX)VOIX.open()};const bwalk=$("bWalk");if(bwalk)bwalk.onclick=()=>{A.unlock();if(window.VID)VID.walk()};
  const btrip=$("bTrip");if(btrip)btrip.onclick=()=>{A.unlock();if(window.VOY)VOY.open()};
  const bvid=$("bVid");if(bvid)bvid.onclick=()=>{A.unlock();if(window.VID)VID.picker()};
  bv.onclick=()=>{A.voiceOn=!A.voiceOn;if(!A.voiceOn)A.stop();sync();toast(A.voiceOn?"Voix off activée":"Voix off coupée")};
  ba.onclick=()=>{A.unlock();A.setAmb(!A.ambOn);sync();toast(A.ambOn?"Ambiance sonore activée":"Ambiance sonore coupée")};
  GAME.syncAudio=sync;sync();
  document.addEventListener("pointerdown",()=>A.unlock(),{once:true});
}

/* ---------- temps réel : 24 h réelles = 4 jours de jeu ---------- */
const DAY_MS=6*3600*1000;
const SPEEDS=[[1,"Temps réel","1 jour de jeu = 6 heures réelles (4 jours par 24 h)"],[36,"Rapide","1 jour = 10 minutes"],[360,"Très rapide","1 jour = 1 minute"]];
function clockTick(){
  if(!S||S.phase!=="play"||S.mode==="multi"||ui.busy)return;
  const now=Date.now();const dt=now-(S.lastReal||now);S.lastReal=now;
  if(S.paused)return;
  advanceDays(dt/DAY_MS*(S.speed||1),true);
}
function inputBusy(){const a=document.activeElement;return a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)||document.querySelector(".sheet")}
function advanceDays(d,auto){
  if(!S||S.phase!=="play"||d<=0)return;
  const target=S.day+d;let refresh=false;setTimeout(()=>{if(S&&S3.setHour)S3.setHour(((S.day%1)*24+8)%24);if(S&&window.Ultra)Ultra.setHour(((S.day%1)*24+8)%24)},0);
  while(S.day<target-1e-9){
    const nextM=(S.m+1)*30;const to=Math.min(target,nextM);S.day=to;
    if(dayEvents())refresh=true;
    if(S.day>=nextM-1e-9){S.day=nextM;const stop=endMonth(true);refresh=true;if(stop==="stop"){save();return}}
  }
  save();hud();gauges();
  if(refresh&&(!auto||!inputBusy()))render();
  if(window.RENC)RENC.tick(S);
  if(window.DIR)DIR.tick(S);
  if(window.VOIX)VOIX.tick(S);
}
GAME.advanceDays=advanceDays;
function dayEvents(){
  let ch=false;
  if(S.mode==="pres"&&S.cur==null&&!S.pendingReport&&S.day>=(S.nextDossier||0)){draw();ch=true;toast("Nouveau dossier sur votre bureau : "+CM.DOSSIERS[S.cur].t);if(tab==="bureau")viewRegion(CM.DOSSIERS[S.cur].lieu||"CE")}
  if(S.mode==="opp"){if(S.nextAp==null)S.nextAp=S.day+7;while(S.day>=S.nextAp){S.nextAp+=7;if(S.ap<3){S.ap++;ch=true}}}
  const nInv=S.media?S.media.inv.length:0,nMail=S.inbox?S.inbox.length:0;
  if(window.MEDIA)MEDIA.dayTick(S);
  if(window.PROF)PROF.dayTick(S);
  if(window.VIE)VIE.dayTick(S);
  if(window.PRO)PRO.dayTick(S);
  if(window.EMP)EMP.dayTick(S);
  if(SYS.dayTick)SYS.dayTick(S);
  if(window.JUS)JUS.dayTick(S);
  if(window.WORLD){WORLD.dayTick(S);WORLD.publish()}
  if((S.media&&S.media.inv.length!==nInv)||(S.inbox&&S.inbox.length!==nMail))ch=true;
  return ch;
}
function timeSheet(){
  if(!S||S.mode==="multi")return;
  const next=(S.m+1)*30;
  sheet('<h3 class="h2">Le temps</h3><p>Nous sommes le <b>'+esc(dayLabel(S.day))+'</b>. Le temps avance même quand le jeu est fermé : 24 heures réelles = 4 jours de jeu.</p><span class="eyebrow">Vitesse</span>'+SPEEDS.map(([v,n,d])=>'<button class="choice" data-sp="'+v+'"'+((S.speed||1)===v&&!S.paused?' style="border-color:var(--y)"':"")+'><span class="t">'+n+'</span><span class="small muted">'+d+'</span></button>').join("")+'<button class="choice" data-sp="0"'+(S.paused?' style="border-color:var(--y)"':"")+'><span class="t">Pause</span><span class="small muted">Le temps s\'arrête jusqu\'à la reprise.</span></button><span class="eyebrow">Avancer maintenant</span><div class="row"><button class="btn" data-adv="1">+1 jour</button><button class="btn" data-adv="7">+1 semaine</button><button class="btn" data-adv="'+(next-S.day)+'">Jusqu\'au 1er '+esc(monthLabel(S.m+1))+'</button></div>',el=>{
    el.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>{const v=+b.dataset.sp;S.lastReal=Date.now();if(v===0)S.paused=true;else{S.paused=false;S.speed=v}save();el.remove();hud();toast(v===0?"Jeu en pause":"Vitesse : "+SPEEDS.find(x=>x[0]===v)[1])});
    el.querySelectorAll("[data-adv]").forEach(b=>b.onclick=()=>{el.remove();advanceDays(+b.dataset.adv,false)});
  });
}
GAME.timeSheet=()=>timeSheet();

/* ---------- sauvegarde ---------- */
/* ---------- sauvegarde : automatique, sûre (copie de secours), exportable ---------- */
let saveWarned=false,saveN=0,saveT=null;
function trim(st){st.log=(st.log||[]).slice(0,60);st.inbox=(st.inbox||[]).slice(0,30);if(st.media&&st.media.feed)st.media.feed=st.media.feed.slice(0,20);if(st.cases)st.cases=st.cases.filter(c=>c.stage!=="Clos"||st.m-(c.m||0)<6).slice(0,120);if(st.pro&&st.pro.hist)st.pro.hist=st.pro.hist.slice(0,10)}
function save(){if(!S||S.mode==="multi")return;clearTimeout(saveT);S.savedAt=Date.now();S.v=2;let js;
  try{js=JSON.stringify(S)}catch(e){return}
  try{localStorage.setItem(KEY,js);if(++saveN%20===1&&js.length<1.8e6)localStorage.setItem(KEY+"-bak",js);saveWarned=false}
  catch(e){try{localStorage.removeItem(KEY+"-bak");trim(S);localStorage.setItem(KEY,JSON.stringify(S))}catch(e2){if(!saveWarned){saveWarned=true;toast("Stockage du navigateur plein : exportez votre partie (Menu) pour ne rien perdre.")}}}}
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(save,400)}
GAME.save=save;
window.addEventListener("pagehide",()=>save());document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")save()});
function tabFor(st){return st.mode==="pres"?"bureau":st.mode==="ing"?"ent":st.mode==="pro"?"pro":st.mode==="min"?"minis":st.profil==="maire"?"mairie":st.profil==="depute"?"assemblee":"qg"}
function exportSave(){if(!S)return;save();let av=null;try{av=localStorage.getItem("etoudi-avant")}catch(e){}
  const data=JSON.stringify({jeu:"chemin-etoudi",version:2,date:new Date().toISOString(),partie:S,avant:av?JSON.parse(av):null});
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));a.download="etoudi-"+String(S.name||"partie").replace(/[^A-Za-z0-9À-ÿ-]+/g,"_")+"-"+monthLabel(S.m).replace(/\s+/g,"_")+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast("Partie exportée dans vos téléchargements.")}
function importSave(){const i=document.createElement("input");i.type="file";i.accept=".json,application/json";i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);const st=d.partie||d;if(!st||!st.mode||st.m==null)throw new Error("fichier non reconnu");
    if(d.avant)try{localStorage.setItem("etoudi-avant",JSON.stringify(d.avant))}catch(e){}
    S=st;GAME.S=S;S.lastReal=Date.now();tab=tabFor(S);save();start();toast("Partie importée : "+(S.name||"")+" · "+monthLabel(S.m))}catch(e){toast("Import impossible : "+e.message)}};r.readAsText(f)};i.click()}
GAME.exportSave=exportSave;GAME.importSave=importSave;
function load(){for(const k of [KEY,KEY+"-bak"]){try{const r=localStorage.getItem(k);if(r)return JSON.parse(r)}catch(e){}}return null}
function clearSave(){try{localStorage.removeItem(KEY)}catch(e){}}

/* ---------- soutiens électoraux ---------- */
function initSupport(extra){
  const sup={};
  for(const r of CM.REGIONS){const o={};CM.ORDRE.forEach((p,i)=>o[p]=CM.SOUTIEN[r.id][i]);o.AUT=Math.max(1,100-CM.ORDRE.reduce((a,p)=>a+o[p],0));sup[r.id]=o}
  return sup;
}
function norm(o){const s=Object.values(o).reduce((a,b)=>a+b,0)||1;for(const k in o)o[k]=o[k]*100/s}
/* ajoute gain à p dans la région, pris aux autres (le parti au pouvoir perd plus) */
function shift(sup,reg,p,gain,power){
  const o=sup[reg];if(!(p in o))o[p]=0;
  if(gain<0){const g=Math.min(-gain,o[p]);o[p]-=g;const others=Object.keys(o).filter(k=>k!==p);const tot=others.reduce((a,k)=>a+o[k],0)||1;for(const k of others)o[k]+=g*o[k]/tot;return}
  const others=Object.keys(o).filter(k=>k!==p&&o[k]>0);
  const w=k=>o[k]*(k===power?1.6:1);const tot=others.reduce((a,k)=>a+w(k),0)||1;
  let taken=0;for(const k of others){const t=Math.min(o[k],gain*w(k)/tot);o[k]-=t;taken+=t}
  o[p]+=taken;
}
GAME.shift=shift;GAME.norm=norm;
function nationalShare(sup,p){let v=0,t=0;for(const r of CM.REGIONS){const w=r.pop*r.turn;v+=(sup[r.id][p]||0)*w;t+=w}return v/t}
GAME.nationalShare=nationalShare;

/* ---------- moteur électoral ---------- */
const ELEC={};GAME.ELEC=ELEC;
function biasFor(p){if(!S||S.mode==="multi")return 0;if(p!==S.power)return 0;const b=Math.max(0,55-S.integ)*.16-(S.opp?S.opp.surv*.05:0);return Math.max(0,b)}
function regionShares(sup,reg,parties,noise){
  const o={};for(const p of parties){o[p]=Math.max(0,(sup[reg][p]||0)+(noise?rnd(-noise,noise):0))}
  for(const p of parties)o[p]+=biasFor(p);
  const s=Object.values(o).reduce((a,b)=>a+b,0)||1;for(const p in o)o[p]=o[p]*100/s;return o;
}
ELEC.parties=function(sup){const set=new Set();for(const r in sup)for(const p in sup[r])if(p!=="AUT"&&p!=="IND")set.add(p);return[...set]};
ELEC.presidentielle=function(sup,cands,label){
  const byReg={},tot={};let voters=0,votes=0;
  for(const r of CM.REGIONS){
    const sh=regionShares(sup,r.id,cands,2.5);const turn=clamp(r.turn+rnd(-4,4),10,85);const ins=r.pop/30.36*CM.NUMS.inscrits;const vv=ins*turn/100;voters+=ins;votes+=vv;
    let w=null;for(const p of cands){tot[p]=(tot[p]||0)+sh[p]*vv/100;if(!w||sh[p]>sh[w])w=p}
    byReg[r.id]={winner:w,shares:sh,turn};
  }
  const nat=cands.map(p=>({p,pct:tot[p]*100/votes,votes:tot[p]})).sort((a,b)=>b.pct-a.pct);
  return{type:"pres",label:label||"Présidentielle",nat,byReg,turnout:votes*100/voters,winner:nat[0].p};
};
function allocate(n,sh){
  const ps=Object.keys(sh).sort((a,b)=>sh[b]-sh[a]);const res={};ps.forEach(p=>res[p]=0);
  const top=ps[0];
  if(sh[top]>=50){res[top]=n;return res}
  const half=Math.ceil(n/2);res[top]=half;let rest=n-half;
  const elig=ps.filter(p=>sh[p]>=5);const tot=elig.reduce((a,p)=>a+sh[p],0)||1;
  const quotas=elig.map(p=>({p,q:rest*sh[p]/tot}));let given=0;
  quotas.forEach(x=>{const f=Math.floor(x.q);res[x.p]+=f;given+=f;x.r=x.q-f});
  quotas.sort((a,b)=>b.r-a.r);for(let i=0;i<rest-given;i++)res[quotas[i%quotas.length].p]++;
  return res;
}
ELEC.legislatives=function(sup,parties){
  const seats={},byReg={};
  for(const r of CM.REGIONS){
    const reg={};let left=r.seats;const nc=Math.max(1,Math.round(r.seats/4));
    for(let c=0;c<nc;c++){const n=c===nc-1?left:Math.round(r.seats/nc);left-=n;const sh=regionShares(sup,r.id,parties,7);const a=allocate(n,sh);for(const p in a){reg[p]=(reg[p]||0)+a[p];seats[p]=(seats[p]||0)+a[p]}}
    let w=null;for(const p in reg)if(!w||reg[p]>reg[w])w=p;byReg[r.id]={seats:reg,winner:w};
  }
  return{type:"leg",label:"Législatives",seats,byReg};
};
ELEC.municipales=function(sup,parties){
  const communes={},byReg={},regions={};
  for(const r of CM.REGIONS){const reg={};for(let i=0;i<r.communes;i++){const sh=regionShares(sup,r.id,parties,11);let w=null;for(const p in sh)if(!w||sh[p]>sh[w])w=p;reg[w]=(reg[w]||0)+1;communes[w]=(communes[w]||0)+1}
    let w=null;for(const p in reg)if(!w||reg[p]>reg[w])w=p;byReg[r.id]=reg;regions[r.id]=w}
  return{type:"mun",communes,byReg,regions};
};
ELEC.senatoriales=function(munByReg,appointer){
  const sen={};
  for(const r of CM.REGIONS){const reg=munByReg[r.id]||{};const ps=Object.keys(reg).sort((a,b)=>reg[b]-reg[a]);const tot=r.communes;
    if(ps.length>1&&reg[ps[1]]/tot>=.3){sen[ps[0]]=(sen[ps[0]]||0)+5;sen[ps[1]]=(sen[ps[1]]||0)+2}else sen[ps[0]]=(sen[ps[0]]||0)+7}
  sen[appointer]=(sen[appointer]||0)+30;
  return{type:"sen",sen};
};

/* ---------- carte SVG ---------- */
const centroids={};
(function(){const M=window.CM_MAP;for(const id in M.p){const nums=M.p[id].match(/-?[\d.]+,-?[\d.]+/g).map(s=>s.split(",").map(Number));let x=0,y=0;nums.forEach(n=>{x+=n[0];y+=n[1]});centroids[id]=[x/nums.length,y/nums.length]}
 centroids.LT=[centroids.LT[0]+6,centroids.LT[1]];centroids.SW=[centroids.SW[0]+8,centroids.SW[1]];})();
function partyColor(p){if(S&&S.parties&&S.parties[p])return S.parties[p].c;if(CM.PARTIS[p])return CM.PARTIS[p].c;return GAME.colorOf?GAME.colorOf(p):"#888"}
GAME.partyColor=partyColor;
function heat(v){const t=clamp(v/100,0,1);const r=Math.round(229-(229-67)*t),g=Math.round(71+(196-71)*t),b=Math.round(63+(124-63)*t);return`rgb(${r},${g},${b})`}
GAME.heat=heat;
/* fill(id) -> couleur ; sel = région sélectionnée */
function mapSVG(fill,sel,labels){
  const M=window.CM_MAP;let h='<svg class="map" viewBox="-6 -6 '+(M.W+12)+' '+(M.H+12)+'" role="img" aria-label="Carte des régions du Cameroun">';
  for(const r of CM.REGIONS)h+='<path data-r="'+r.id+'" d="'+M.p[r.id]+'" fill="'+fill(r.id)+'" class="'+(sel===r.id?"sel":"")+'"><title>'+esc(r.n)+'</title></path>';
  for(const r of CM.REGIONS){const c=centroids[r.id];h+='<text x="'+c[0].toFixed(0)+'" y="'+c[1].toFixed(0)+'" text-anchor="middle">'+esc(labels?labels(r):r.n)+'</text>'}
  return h+'</svg>';
}
GAME.mapSVG=mapSVG;
function leader(o){let w=null;for(const p in o)if(p!=="AUT"&&p!=="IND"&&(!w||o[p]>o[w]))w=p;return w}
GAME.leader=leader;

/* ---------- écran d'accueil ---------- */
function profilLabel(st){return st.mode==="pres"?"Président de la République":st.mode==="min"?"Ministre":st.mode==="ing"?"Chef d'entreprise":st.mode==="pro"&&window.PRO&&st.pro?PRO.LIST[st.pro.id].n:st.profil==="maire"?"Maire":st.profil==="depute"?"Député":"Chef de parti"}
function ago(t){const m=Math.round((Date.now()-t)/60000);return m<1?"à l'instant":m<60?"il y a "+m+" min":m<1440?"il y a "+Math.round(m/60)+" h":"il y a "+Math.round(m/1440)+" j"}
function home(){
  S=null;GAME.S=null;hud();A.stop();
  setView({land:"ville",palais:true},"Yaoundé · Centre","Palais de l'Unité");
  $("gauges").innerHTML="";$("tabs").innerHTML="";
  const saved=load();const N=CM.NUMS;
  $("panel").innerHTML='<div><span class="eyebrow">République du Cameroun · Paix – Travail – Patrie</span><h1 class="title">Chemin d\'Etoudi</h1></div>'+
   '<p>Gouvernez le Cameroun tel qu\'il est en septembre 2026, ou partez de l\'opposition à la conquête du palais d\'Etoudi. Toutes les règles suivent la Constitution et le Code électoral camerounais.</p>'+
   (saved&&saved.phase==="play"?'<div class="card"><span class="eyebrow">Partie sauvegardée</span><b>'+esc(saved.name)+' · '+esc(profilLabel(saved))+'</b><span class="small muted">'+esc(dayLabel(saved.day!=null?saved.day:saved.m*30))+(saved.savedAt?' · enregistrée '+esc(ago(saved.savedAt)):"")+'</span><div class="row"><button class="btn primary" id="bCont">Reprendre la partie</button><button class="btn small" id="bExp">Exporter</button></div></div>':"")+
   '<div class="row"><button class="btn small ghost" id="bImp">Importer une partie (fichier)</button></div>'+
   '<span class="eyebrow">Choisissez votre profil</span><div class="grid2"><button class="opt" id="mPres"><b>Président</b><span>Vous dirigez le pays depuis Etoudi.</span></button><button class="opt" id="mMin"><b>Ministre</b><span>L\'un des 38 ministères, avec son vrai budget 2026.</span></button><button class="opt" id="mDep"><b>Député</b><span>Votez les lois, défendez votre circonscription.</span></button><button class="opt" id="mMaire"><b>Maire</b><span>Une commune de votre choix, sa caisse, ses projets.</span></button><button class="opt" id="mOpp"><b>Chef de parti</b><span>Un parti existant ou le vôtre, jusqu\'à Etoudi.</span></button><button class="opt" id="mIng"><b>Chef d\'entreprise</b><span>16 domaines : BTP, vidéosurveillance, solaire, numérique, santé, avocats…</span></button><button class="opt" id="mPro"><b>Professionnel</b><span>Médecin, enseignant, avocat, ingénieur, journaliste… Les habitants vous sollicitent, l\'État vous recrute.</span></button></div>'+
   (window.WORLD&&WORLD._pendingCode?'<p class="small" style="color:var(--y)">Invitation au monde '+esc(WORLD._pendingCode)+' : choisissez votre profil, vous le rejoindrez automatiquement.</p>':"")+
   '<div class="grid2"><button class="opt" id="mMulti"><b>Entre amis</b><span>Créez une partie de 2 à 6 joueurs, chacun sur son téléphone ou sur un seul appareil.</span></button><button class="opt" id="mJoin"><b>Rejoindre</b><span>Un ami vous a donné un code ? Entrez-le ici.</span></button></div>'+
   '<div class="card"><span class="eyebrow">Le Cameroun en septembre 2026</span><div class="facts">'+
   fact(fmt(N.popu/1e6,1)+" M","habitants (estimation, recensement en cours)")+fact(fmt(N.dette)+" Mds","FCFA de dette publique, "+fmt(N.dette/N.pib*100,1)+" % du PIB")+
   fact(fmt(N.budget,1)+" Mds","FCFA de budget 2026")+fact(fmt(N.routes)+" km","de routes bitumées, 9,5 % du réseau")+
   fact(N.elec+" %","d'accès à l'électricité, délestages")+fact("≈ 1 M","de déplacés (NOSO, Extrême-Nord)")+'</div>'+
   '<p class="small muted">Présidentielle du 12 octobre 2025 : Paul Biya (RDPC) proclamé vainqueur avec 53,66 % contre 35,19 % pour Issa Tchiroma Bakary (FSNC), qui conteste depuis l\'exil. Législatives et municipales reportées à février 2027. Poste de vice-président créé en avril 2026.</p></div>'+
   '<button class="btn small ghost" id="bSrc" style="align-self:flex-start">Sources et méthode</button>';
  $("mPres").onclick=setupPres;$("mOpp").onclick=setupOpp;$("mMaire").onclick=()=>PROF.setupMaire();$("mIng").onclick=()=>PROF.setupIng();$("mMin").onclick=()=>PROF.setupMin();$("mDep").onclick=()=>PROF.setupDep();$("mPro").onclick=()=>PRO.setup();$("mMulti").onclick=()=>window.MULTI&&window.MULTI.setup();$("mJoin").onclick=()=>window.MULTI&&window.MULTI.joinWithCode("");
  $("bSrc").onclick=showSources;
  const c=$("bCont");if(c)c.onclick=()=>{S=saved;GAME.S=S;tab=tabFor(S);start()};
  const ex=$("bExp");if(ex)ex.onclick=()=>{S=saved;exportSave();S=null};$("bImp").onclick=importSave;
}
GAME.home=home;
function fact(b,s){return'<div class="fact"><b>'+b+'</b><span>'+s+'</span></div>'}
function showSources(){sheet('<h3 class="h2">Sources et méthode</h3><p class="small">Données collectées en septembre 2026 : population (BUCREP, Worldometer), budget et dette (MINFI, loi de finances 2026, Investir au Cameroun), routes (INS, Investir au Cameroun), électricité (Banque mondiale, presse), sécurité (OCHA, Crisis Group, HRW), élections (Conseil constitutionnel, ELECAM, Journal du Cameroun), révision constitutionnelle d\'avril 2026 (presse camerounaise).</p><p class="small">Les chiffres par région et les intentions de vote de départ sont des estimations du jeu. Le recensement général de 2026 n\'a pas encore été publié. Contours des régions : Natural Earth.</p><p class="small">Votre personnage est fictif. Les partis réels servent de cadre ; leurs dirigeants ne sont pas joués.</p>')}


/* ---------- calendrier électoral paramétrable ---------- */
function calForm(minM){
  const years=[];for(let y=2026;y<=2036;y++)years.push(y);
  return'<span class="eyebrow">Calendrier électoral</span><div class="grid2"><button class="opt" data-cal="reel" aria-pressed="'+(ui.cal!=="perso")+'"><b>Échéances actuelles</b><span>Législatives et municipales en février 2027, présidentielle en octobre 2032.</span></button><button class="opt" data-cal="perso" aria-pressed="'+(ui.cal==="perso")+'"><b>Dates personnalisées</b><span>Choisissez vous-même la date de chaque scrutin.</span></button></div>'+
   (ui.cal==="perso"?'<div class="card">'+CM.CALENDRIER.map(c=>{const t=CM.DEBUT.mois+c.m,mo=t%12,yr=CM.DEBUT.annee+Math.floor(t/12);const cur=ui.calv&&ui.calv[c.id]||{mo,yr};return'<div class="row" style="align-items:flex-end"><label class="f" style="flex:1" for="cm_'+c.id+'">'+esc(c.t)+'<select id="cm_'+c.id+'">'+MOIS.map((n,i)=>'<option value="'+i+'"'+(i==cur.mo?" selected":"")+'>'+n+'</option>').join("")+'</select></label><label class="f" for="cy_'+c.id+'"><span>&nbsp;</span><select id="cy_'+c.id+'">'+years.map(y=>'<option'+(y==cur.yr?" selected":"")+'>'+y+'</option>').join("")+'</select></label></div>'}).join("")+'<span class="small muted">Les sénatoriales et les régionales dépendent des conseillers municipaux : placez-les de préférence après les municipales.</span></div>':"");
}
function readCal(minM){
  if(ui.cal!=="perso")return null;
  ui.calv={};const out=[];
  for(const c of CM.CALENDRIER){const mo=+$("cm_"+c.id).value,yr=+$("cy_"+c.id).value;ui.calv[c.id]={mo,yr};const m=(yr-CM.DEBUT.annee)*12+mo-CM.DEBUT.mois;if(m<=minM){toast("La date « "+c.t+" » doit être après le début de la partie.");return false}out.push({id:c.id,m})}
  return out;
}
function bindCal(redraw){$("panel").querySelectorAll("[data-cal]").forEach(b=>b.onclick=()=>{if(ui.cal==="perso")readCal(-999);ui.cal=b.dataset.cal;redraw()})}
/* ---------- mise en place ---------- */
function setupPres(){
  $("panel").innerHTML='<div><span class="eyebrow">Mode président</span><h2 class="h2">Prêter serment</h2></div>'+
   '<p>Vous êtes le président de la République proclamé en octobre 2025. Le pays sort d\'une élection contestée, la crise anglophone continue, Boko Haram frappe l\'Extrême-Nord et la dette approche 45 % du PIB. Prochaine présidentielle : octobre 2032.</p>'+
   VIE.identity("pn","pa",ui.pAge||58,"Ex. Aïssatou Mbarga")+
   '<p class="small muted">Article 6 de la Constitution : il faut au moins 35 ans pour être président de la République.</p>'+calForm(0)+
   '<div class="row"><button class="btn primary" id="go">Entrer au palais d\'Etoudi</button><button class="btn ghost" id="back">Retour</button></div>';
  if(ui.pName)$("pn").value=ui.pName;VIE.bindIdentity("pa");
  bindCal(()=>{ui.pName=$("pn").value;ui.pAge=$("pa").value;setupPres()});
  $("back").onclick=home;
  $("go").onclick=()=>{const id=VIE.checkIdentity("pn","pa",35,"président de la République (article 6)");if(!id)return;const cal=readCal(0);if(cal===false)return;newGame("pres",{name:id.name,age:id.age,cal})};
}
function setupOpp(){
  let choice="new",color="#f6c945",home="OU",start="2026";
  const draw=()=>{
    $("panel").innerHTML='<div><span class="eyebrow">Mode opposant</span><h2 class="h2">Entrer en politique</h2></div>'+
    VIE.identity("pn","pa",ui.oAge||42,"Ex. Serge Ekotto")+
    '<span class="eyebrow">Votre parti</span><div class="grid2">'+
     [["new","Créer mon parti","Partir de presque rien"],["PCRN","Diriger le PCRN","3,4 % en 2025"],["FSNC","Diriger le FSNC","35 % en 2025, direction en exil"],["MRC","Diriger le MRC","Fort à l'Ouest et au Littoral"],["SDF","Diriger le SDF","Historique chez les anglophones"],["UNDP","Diriger l'UNDP","Implanté dans le Nord"]].map(([k,t,d])=>'<button class="opt" data-c="'+k+'" aria-pressed="'+(k===choice)+'"><b>'+t+'</b><span>'+d+'</span></button>').join("")+'</div>'+
    (choice==="new"?'<div class="row" style="align-items:flex-end"><label class="f" for="ps" style="flex:1">Sigle du parti<input type="text" id="ps" maxlength="6" placeholder="Ex. MPC" value="'+esc(ui.oSig||"")+'"></label><label class="f" for="pc">Couleur<input type="color" id="pc" value="'+color+'"></label></div><label class="f" for="pl">Nom complet<input type="text" id="pl" maxlength="60" placeholder="Ex. Mouvement pour le progrès du Cameroun" value="'+esc(ui.oLong||"")+'"></label>':"")+
    '<label class="f" for="ph">Votre région d\'origine<select id="ph">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===home?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label>'+
    '<span class="eyebrow">Début de partie</span><div class="grid2"><button class="opt" data-s="2026" aria-pressed="'+(start==="2026")+'"><b>Octobre 2026</b><span>Législatives, municipales, sénatoriales, puis présidentielle 2032.</span></button><button class="opt" data-s="2032" aria-pressed="'+(start==="2032")+'"><b>Avril 2032</b><span>Partie courte : six mois de campagne présidentielle.</span></button></div>'+
    '<p class="small muted">Un parti nouvellement créé démarre avec 10 000 militants répartis dans les 10 régions, 50 millions FCFA en caisse et un expert dans chaque domaine. Pour vous présenter à la présidentielle, il faudra avoir 35 ans et verser une caution de 30 millions FCFA (Code électoral).</p>'+calForm(start==="2032"?66:0)+
    '<div class="row"><button class="btn primary" id="go">Lancer mon combat</button><button class="btn ghost" id="back">Retour</button></div>';
    if(ui.oName)$("pn").value=ui.oName;VIE.bindIdentity("pa");
    const keep=()=>{ui.oName=$("pn").value;ui.oAge=$("pa").value;if($("ps")){ui.oSig=$("ps").value;ui.oLong=$("pl").value;color=$("pc").value}home=$("ph").value};
    $("panel").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{keep();choice=b.dataset.c;draw()});
    $("panel").querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{keep();start=b.dataset.s;draw()});
    bindCal(()=>{keep();draw()});
    $("back").onclick=GAME.home;
    $("go").onclick=()=>{keep();const id=VIE.checkIdentity("pn","pa",18,"chef de parti");if(!id)return;const age=id.age;if(age<35)toast("Rappel : à "+age+" ans vous ne pourrez pas être candidat à la présidentielle (35 ans minimum).");
      let party=choice,custom=null;
      if(choice==="new"){const sig=(ui.oSig||"").trim().toUpperCase().replace(/[^A-ZÀ-Ü0-9-]/g,"");if(!sig){toast("Donnez un sigle à votre parti.");return}if(CM.PARTIS[sig]){toast("Ce sigle existe déjà.");return}party=sig;custom={n:sig,long:(ui.oLong||"").trim()||sig,c:color,an:0,custom:1}}
      const cal=readCal(start==="2032"?66:0);if(cal===false)return;
      newGame("opp",{name:id.name,age,party,custom,home,start,cal})};
  };
  draw();
}

/* ---------- nouvelle partie ---------- */
function newGame(mode,o){
  const N=JSON.parse(JSON.stringify(CM.NUMS));
  S={v:1,mode,m:0,name:o.name,age:o.age,phase:"play",power:"RDPC",party:mode==="pres"?"RDPC":o.party,
     parties:JSON.parse(JSON.stringify(CM.PARTIS)),sup:initSupport(),nums:N,
     st:{pop:42,eco:52,soc:38,sec:34,infra:32,int:40},
     regs:Object.fromEntries(CM.REGIONS.map(r=>[r.id,{sec:r.sec,infra:r.infra,elec:r.elec}])),
     an:Object.fromEntries(Object.entries(CM.PARTIS).map(([k,p])=>[k,p.an])),
     sen:{RDPC:100},communes:{RDPC:316,SDF:17,UNDP:9,UDC:8,AUT:10},regions:Object.fromEntries(CM.REGIONS.map(r=>[r.id,"RDPC"])),
     cal:CM.CALENDRIER.map(c=>({id:c.id,m:c.m,done:false,rep:0})),integ:35,
     used:{},cool:{},deck:[],cur:null,news:null,log:[],easy:false,allies:[],elections:[],lastRes:null,ap:2};
  if(mode==="opp"){
    if(o.custom){S.parties[o.party]=o.custom;for(const r of CM.REGIONS){shift(S.sup,r.id,o.party,r.id===o.home?4:.8,"RDPC")}}
    else shift(S.sup,o.home,o.party,3,"RDPC");
    const nat=nationalShare(S.sup,o.party);
    S.opp={noto:o.custom?12:clamp(Math.round(15+nat*1.5),20,70),militants:o.custom?2000:Math.round(8000+nat*2500),fonds:o.custom?45:70,surv:o.custom?5:15,risque:o.party==="FSNC"?25:10,home:o.home};
    if(o.start==="2032"){S.m=66;S.cal.forEach(c=>{if(c.id!=="pres")c.done=true});S.opp.noto+=10;S.opp.fonds+=60;S.opp.militants*=2;
      for(const r of CM.REGIONS)shift(S.sup,r.id,o.party,1.5,"RDPC")}
  }
  if(o.cal)o.cal.forEach(x=>{const c=S.cal.find(y=>y.id===x.id);if(c){c.m=x.m;c.done=x.m<S.m}});
  S.day=S.m*30;S.lastReal=Date.now();S.speed=1;S.paused=false;S.nextDossier=S.day;S.nextAp=S.day+7;
  if(mode==="ing"||mode==="pro"){S.party=null;S.opp=null}
  if(mode==="min"){S.party="RDPC";S.opp=null}
  SYS.init(S,o);
  if(o.profil==="maire")PROF.initMaire(S,o);
  if(o.profil==="depute")PROF.initDep(S,o);
  if(mode==="ing")PROF.initIng(S,o);
  if(mode==="pro")PRO.init(S,o);
  if(o.carry)S.carry=o.carry;
  if(o.centre)S.centre=o.centre;
  if(o.market)S.market=o.market;
  if(o.carry&&window.EMP){EMP.wallet(S);S.bourseStart=S.bourse}
  if(mode==="min")PROF.initMin(S,o);
  MEDIA.init(S);
  GAME.S=S;tab=mode==="pres"?"bureau":mode==="ing"?"ent":mode==="pro"?"pro":mode==="min"?"minis":o.profil==="maire"?"mairie":o.profil==="depute"?"assemblee":"qg";
  if(mode==="pres")draw();
  if(mode==="pro"){log(S.news.h,"Début");save();start();return}
  if(mode==="ing"||mode==="min"||o.profil==="maire"||o.profil==="depute"){const h=mode==="ing"?S.ent.nom+" ouvre ses portes à "+CM.REG[o.home].chef:mode==="min"?"Vous êtes nommé ministre : "+S.minis.n:o.profil==="maire"?"Vous êtes maire de "+o.ville:"Vous siégez à l'Assemblée nationale";S.news={k:"Début",h,x:""};log(h,"Début");save();start();return}
  S.news={k:"Investiture",h:mode==="pres"?"Vous prêtez serment devant le Parlement réuni en Congrès":"Votre combat politique commence",x:mode==="pres"?"Yaoundé, palais des Congrès. Sept ans pour tenir le pays, apaiser les régions en crise et préparer 2032.":"Vous tenez votre première conférence de presse à Douala."};
  log(S.news.h,"Début");save();start();
  setTimeout(()=>subs(mode==="pres"?"Serment":"Conférence de presse",mode==="pres"?"Je jure de remplir loyalement les fonctions de président de la République, de défendre la Constitution et de consacrer toutes mes forces au service du peuple camerounais. Mes chers compatriotes, le Cameroun traverse des épreuves : la guerre dans nos régions du Nord-Ouest et du Sud-Ouest, le terrorisme dans l'Extrême-Nord, la vie chère et les délestages. Ensemble, nous allons relever ces défis.":"Mes chers compatriotes, je m'engage aujourd'hui pour le Cameroun. Notre pays a des richesses immenses, une jeunesse brillante, et pourtant trop de nos enfants n'ont ni emploi, ni électricité, ni route pour aller au marché. Je vais parcourir nos dix régions, de Maroua à Kribi, de Bamenda à Bertoua. Le changement ne viendra pas tout seul : il viendra de vous.",{voix:"m"}),600);
}
GAME.newGame=(m,o)=>newGame(m,o);
function log(h,d){S.log.unshift({m:S.m,h,d});S.log=S.log.slice(0,120)}

/* ---------- démarrage de l'écran de jeu ---------- */
function start(){
  GAME.S=S;
  if(!S.mood)SYS.init(S,{home:S.opp?S.opp.home:"CE"});
  if(!S.media)MEDIA.init(S);
  if(window.JUS&&!S.jus)JUS.init(S);
  if(window.EMP&&S.centre)setTimeout(()=>EMP.afterMinister(S),1500);
  if(window.VIE)VIE.init(S);
  if(window.WORLD){if(WORLD._pendingCode){const c=WORLD._pendingCode;WORLD._pendingCode=null;WORLD.connect(c).then(()=>{tab="marche";render();toast("Vous avez rejoint le monde "+c)}).catch(()=>{})}else WORLD.autoConnect(S)}
  if(S.day==null){S.day=S.m*30;S.lastReal=Date.now();S.speed=1}
  if(S3.setHour)S3.setHour(((S.day%1)*24+8)%24);if(window.Ultra)Ultra.setHour(((S.day%1)*24+8)%24);
  hud();
  if(S.phase!=="play")return endScreen();
  if(S.mode==="pres"){const d=S.cur!=null?CM.DOSSIERS[S.cur]:null;viewRegion(d&&d.lieu||"CE")}
  else if(S.mode==="ing")viewRegion(S.ent.reg);
  else if(S.mode==="pro")viewRegion(S.pro.reg);
  else if(S.mode==="min")viewRegion(S.minis.home);
  else viewRegion(S.opp.home);
  render();
  // temps écoulé pendant l'absence (plafonné à 120 jours)
  const away=(Date.now()-(S.lastReal||Date.now()))/DAY_MS;S.lastReal=Date.now();
  if(!S.paused&&away>.05){const d=Math.min(120,away);toast("Pendant votre absence, "+(d>=1?Math.floor(d)+" jour"+(d>=2?"s":""):"quelques heures")+" se sont écoulés.");setTimeout(()=>advanceDays(d,false),600)}
}
function render(){
  if(S&&S.phase==="play"&&window.ACTU)ACTU.sync(S);
  hud();gauges();tabs();
  const p=$("panel");p.scrollTop=0;
  if(tab==="bureau")renderBureau();else if(tab==="qg")renderQG();else if(tab==="carte")renderCarte();else if(tab==="pays")renderPays();else if(tab==="inst")renderInst();else if(tab==="journal")renderJournal();
  else if(tab==="gouv")SYS.renderGouv(S);else if(tab==="projets")SYS.renderProjets(S);else if(tab==="defense")SYS.renderDefense(S);else if(tab==="monde")SYS.renderMonde(S);else if(tab==="ress")SYS.renderRessources(S);else if(tab==="parti")SYS.renderParti(S);else if(tab==="eco")SYS.renderEconomie(S);
  else if(tab==="media")MEDIA.render(S);else if(tab==="mairie")PROF.renderMairie(S);else if(tab==="ent")PROF.renderEnt(S);else if(tab==="ao")PROF.renderAO(S);else if(tab==="chantiers")PROF.renderChantiers(S);
  else if(tab==="marche")WORLD.render(S);else if(tab==="justice")JUS.render(S);else if(tab==="minis")PROF.renderMin(S);else if(tab==="assemblee")PROF.renderDep(S);else if(tab==="services")VIE.render(S);else if(tab==="pro")PRO.render(S);else if(tab==="annuaire")PRO.renderAnnuaire(S);
  if(window.VID){VID.bindAll($("panel"));VID.hud()}
  saveSoon();
  if(["bureau","qg","mairie","ent","minis","assemblee","pro","annuaire"].includes(tab))vieTop();
}
/* le quotidien et les audiences en tête des onglets principaux */
function vieTop(){if(!window.VIE||!S||$("vieTop"))return;const h=(window.VOIX?VOIX.agendaCard(S):"")+(window.RENC?RENC.card(S):"")+(window.DIR?DIR.card(S):"")+(window.GENRE?GENRE.card(S):"")+(window.ACTU?ACTU.card(S):"")+(window.EMP?EMP.card(S):"")+VIE.quotCard(S)+VIE.audCard(S);if(!h)return;$("panel").insertAdjacentHTML("afterbegin",'<div id="vieTop" style="display:flex;flex-direction:column;gap:10px">'+h+'</div>');VIE.bindAud(S);if(window.EMP)EMP.bind(S);if(window.VOIX)VOIX.bindAgenda(S,$("vieTop"));if(window.RENC)RENC.bindCard(S,$("vieTop"));if(window.ACTU)ACTU.bindCard(S,$("vieTop"));if(window.GENRE)GENRE.bindCard(S,$("vieTop"))}
GAME.render=()=>{if(S&&S.mode!=="multi")render()};
GAME.setTab=t=>{tab=t;render()};
/* reprendre un état sauvegardé (retour au profil d'avant un poste de ministre) */
GAME.loadState=st=>{S=st;GAME.S=S;tab=tabFor(S);save();start()};
function gauges(){
  const g=$("gauges");
  if(S.mode==="pres"){g.innerHTML='<div class="gauges">'+STATS.map(s=>{const v=Math.round(S.st[s.k]),c=v<25?"low":v<45?"mid":"";return'<div class="g"><div class="lab"><span>'+s.n+'</span><b>'+v+'</b></div><div class="bar"><i class="'+c+'" style="width:'+v+'%"></i></div></div>'}).join("")+'</div>'}
  else{const pg=PROF.gauges(S);if(pg){g.innerHTML='<div class="gauges">'+pg.map(([n,v,w])=>{const c=w<25?"low":w<45?"mid":"";return'<div class="g"><div class="lab"><span>'+n+'</span><b>'+v+'</b></div><div class="bar"><i class="'+c+'" style="width:'+clamp(w,2,100)+'%"></i></div></div>'}).join("")+'</div>';return}
    const o=S.opp,nat=nationalShare(S.sup,S.party);const items=[["Intentions",fmt(nat,1)+" %",nat*2],["Notoriété",Math.round(o.noto),o.noto],["Militants",fmt(o.militants),Math.min(100,o.militants/600)],["Trésorerie",fmt(o.fonds)+" M",Math.min(100,o.fonds)],["Scrutateurs",Math.round(o.surv)+" %",o.surv],["Risque",Math.round(o.risque),100-o.risque]];
    g.innerHTML='<div class="gauges">'+items.map(([n,v,w])=>{const c=w<25?"low":w<45?"mid":"";return'<div class="g"><div class="lab"><span>'+n+'</span><b>'+v+'</b></div><div class="bar"><i class="'+c+'" style="width:'+clamp(w,2,100)+'%"></i></div></div>'}).join("")+'</div>'}
}
function tabs(){
  const list=S.mode==="pro"?[["pro","Ma carrière"],["annuaire","Annuaire"],["marche","Marché"],["media","Médias"],["services","Services publics"],["justice","Justice"],["eco","Économie"],["carte","Carte"],["pays","Pays"],["journal","Journal"]]:S.mode==="ing"?[["ent","Mon entreprise"],["ao","Appels d'offres"],["chantiers","Chantiers"],["marche","Marché"],["media","Médias"],["eco","Économie"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["pays","Pays"],["journal","Journal"]]:
   S.mode==="min"?[["minis","Mon ministère"],["projets","Projets"],["marche","Marché"],["media","Médias"],["eco","Économie"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["pays","Pays"],["inst","Institutions"],["journal","Journal"]]:
   S.profil==="depute"?[["assemblee","Assemblée"],["projets","Micro-projets"],["marche","Marché"],["media","Médias"],["parti","Mon parti"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["pays","Pays"],["inst","Institutions"],["journal","Journal"]]:
   S.profil==="maire"?[["mairie","Mairie"],["projets","Projets"],["marche","Marché"],["media","Médias"],["parti","Mon parti"],["eco","Économie"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["pays","Pays"],["inst","Institutions"],["journal","Journal"]]:
   S.mode==="pres"?[["bureau","Bureau"],["media","Médias"],["gouv","Gouvernement"],["eco","Économie"],["projets","Projets"],["marche","Marché"],["defense","Défense"],["monde","Monde"],["ress","Ressources"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["pays","Pays"],["inst","Institutions"],["journal","Journal"]]:[["qg","QG de campagne"],["parti","Mon parti"],["media","Médias"],["marche","Marché"],["eco","Économie"],["projets","Projets"],["annuaire","Annuaire"],["services","Services publics"],["justice","Justice"],["carte","Carte"],["monde","Monde"],["ress","Ressources"],["pays","Pays"],["inst","Institutions"],["journal","Journal"]];
  $("tabs").innerHTML=list.map(([k,n])=>'<button class="tab" role="tab" data-t="'+k+'" aria-selected="'+(tab===k)+'">'+n+'</button>').join("")+'<button class="tab" id="tMenu">Menu</button>';
  $("tabs").querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
  $("tMenu").onclick=menu;
}
function menu(){
  sheet('<h3 class="h2">Menu</h3><button class="btn" id="mAuto">'+(A.auto?"Désactiver":"Activer")+' la lecture automatique des dossiers</button>'+(S.mode==="pres"?'<button class="btn" id="mEasy">'+(S.easy?"Masquer":"Afficher")+' le sens des effets (mode facile)</button>':"")+'<button class="btn" id="mSrc">Sources et méthode</button><button class="btn" id="mExp">Exporter ma partie (fichier de sauvegarde)</button><button class="btn" id="mImp">Importer une partie</button><button class="btn" id="mHome">Sauvegarder et revenir à l\'accueil</button><button class="btn" id="mQuit">Abandonner la partie</button>',el=>{
    el.querySelector("#mAuto").onclick=()=>{A.auto=!A.auto;GAME.syncAudio();el.remove();toast(A.auto?"Lecture automatique activée":"Lecture automatique désactivée")};
    const e=el.querySelector("#mEasy");if(e)e.onclick=()=>{S.easy=!S.easy;save();el.remove();render()};
    el.querySelector("#mSrc").onclick=()=>{el.remove();showSources()};
    el.querySelector("#mHome").onclick=()=>{save();el.remove();home()};
    el.querySelector("#mExp").onclick=()=>{el.remove();exportSave()};el.querySelector("#mImp").onclick=()=>{el.remove();importSave()};
    const q=el.querySelector("#mQuit");q.onclick=()=>{if(q.dataset.s){clearSave();el.remove();home()}else{q.dataset.s=1;q.textContent="Confirmer : effacer la partie";q.style.color="var(--bad)"}};
  });
}

/* ================= MODE PRÉSIDENT ================= */
function draw(){
  if(!S.deck||!S.deck.length){S.deck=CM.DOSSIERS.map((d,i)=>i).filter(i=>!(CM.DOSSIERS[i].unique&&S.vp)&&i!==S.cur);for(let i=S.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[S.deck[i],S.deck[j]]=[S.deck[j],S.deck[i]]}}
  S.cur=S.deck.pop();
}
function hasMajority(){return(S.an[S.party]||0)>=91}
function hintsHTML(ch){
  const e=Object.assign({},ch.e||{}),n=ch.n||{};const tags=[];
  for(const k in e){const v=e[k],rng=Array.isArray(v),m=rng?Math.max(Math.abs(v[0]),Math.abs(v[1])):Math.abs(v);let cls="hint"+(m>=6?" big":""),lab=SNAME[k];
    if(S.easy&&!rng){cls+=v>0?" up":" down";lab+=v>0?" ▲":" ▼"}if(rng)lab+=" ?";tags.push('<span class="'+cls+'">'+lab+'</span>')}
  if(n.dette){const good=n.dette<0;tags.push('<span class="hint'+(S.easy?(good?" up":" down"):"")+'">'+(n.dette>0?"+":"−")+fmt(Math.abs(n.dette))+' Mds dette</span>')}
  if(n.routes)tags.push('<span class="hint'+(S.easy?" up":"")+'">+'+n.routes+' km routes</span>');
  if(n.elec)tags.push('<span class="hint'+(S.easy?" up":"")+'">+'+n.elec+' pt électricité</span>');
  if(ch.reg)tags.push('<span class="hint">'+Object.keys(ch.reg).map(r=>CM.REG[r].n).join(", ")+'</span>');
  if(ch.loi)tags.push('<span class="hint loi">Vote au Parlement</span>');
  return'<div class="hints">'+tags.join("")+'</div>';
}
function renderBureau(){
  const d=S.cur!=null?CM.DOSSIERS[S.cur]:null;const next=S.cal.filter(c=>!c.done).sort((a,b)=>a.m-b.m)[0];
  const news=S.news?'<div class="card news"><span class="eyebrow" style="color:var(--r)">'+esc(S.news.k)+'</span><b>'+esc(S.news.h)+'</b><span class="small muted">'+esc(S.news.x||"")+'</span>'+(window.VID?'<div class="row">'+VID.btn(S.news.h+". "+(S.news.x||""),null)+'</div>':"")+'</div>':"";
  const report=S.pendingReport;
  let dossier;
  if(report){const c=CM.CALENDRIER.find(x=>x.id===report);
    dossier='<div class="card"><div class="stamp"><span>Ministre de l\'Administration territoriale</span><span class="pill warn">Calendrier</span></div><h3 class="h2">Faut-il tenir les '+esc(c.t.toLowerCase())+' ?</h3><p>Le scrutin est prévu en '+esc(monthLabel(S.cal.find(x=>x.id===report).m))+'. Le parti estime ne pas être prêt et le budget 2026 prévoit peu de moyens pour ELECAM. Un nouveau report exigerait une loi de prorogation.</p><div class="choices">'+
    '<button class="choice" data-rep="0"><span class="t">Tenir le scrutin à la date prévue</span><div class="hints"><span class="hint">Diplomatie</span><span class="hint">Popularité</span></div></button>'+
    '<button class="choice" data-rep="1"><span class="t">Reporter d\'un an par une loi de prorogation</span><div class="hints"><span class="hint big">Diplomatie</span><span class="hint big">Popularité</span><span class="hint loi">Vote au Parlement</span></div></button></div></div>'}
  else if(!d)dossier='<div class="card"><span class="eyebrow">Bureau</span><p>Aucun dossier urgent sur votre bureau. Prochain dossier attendu vers le '+esc(dayLabel(S.nextDossier||S.day))+'.</p><button class="btn" id="bNextD">Avancer jusqu\'au prochain dossier</button></div>';
  else dossier='<div class="card"><div class="stamp"><span>'+esc(d.f)+'</span><button class="btn small ghost" id="bListen">Écouter</button></div><h3 class="h2">'+esc(d.t)+'</h3><p>'+esc(d.x)+'</p>'+(window.VID?'<div class="row">'+VID.btn(d.t+". "+d.x,d.lieu||null,"Voir la vidéo sur place")+'</div>':"")+'<div class="choices">'+
    d.c.map((c,i)=>'<button class="choice" data-i="'+i+'"><span class="t">'+esc(c.t)+'</span>'+hintsHTML(c)+'</button>').join("")+'</div></div>';
  const acts=presActions();
  $("panel").innerHTML=news+SYS.mailCard(S)+'<div class="row" style="justify-content:space-between"><span class="eyebrow">Dossiers · '+esc(dayLabel(S.day))+'</span>'+(next?'<span class="pill '+(next.m-S.m<=2?"warn":"ok")+'">'+esc(CM.CALENDRIER.find(c=>c.id===next.id).t)+' : '+esc(monthLabel(next.m))+'</span>':"")+'</div>'+dossier+
   '<div class="card"><span class="eyebrow">Action présidentielle (facultative, une par mois)</span><div class="grid2">'+acts.map(a=>'<button class="btn small" data-a="'+a.id+'"'+(a.dis?" disabled":"")+' title="'+esc(a.d)+'">'+esc(a.n)+'</button>').join("")+'</div>'+(S.used.m===S.m?'<span class="small muted">Action du mois effectuée.</span>':"")+'</div>';
  SYS.bindMail(S);
  $("panel").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>choose(+b.dataset.i));
  $("panel").querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>decideReport(+b.dataset.rep));
  $("panel").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>presAction(b.dataset.a));
  const nd=$("bNextD");if(nd)nd.onclick=()=>advanceDays(Math.max(.1,(S.nextDossier||S.day)-S.day+.01),false);
  const bl=$("bListen");if(bl)bl.onclick=()=>subs(d.f,d.t+". "+d.x,{voix:"f"});
  if(!report&&d&&A.auto&&ui.readFor!==S.m+":"+S.cur){ui.readFor=S.m+":"+S.cur;setTimeout(()=>{if(tab==="bureau")subs("Journal de 20 h",d.t+". "+d.x,{voix:"f"})},400)}
}
function presActions(){
  const used=S.used.m===S.m,cd=k=>(S.cool[k]||-99)>S.m;
  const near=S.cal.find(c=>!c.done&&c.m-S.m<=3&&c.m>S.m);
  return[
   {id:"conseil",n:"Conseil des ministres",d:"Réunir le gouvernement et écouter les rapports.",dis:used||cd("conseil")},
   {id:"visite",n:"Visite en région",d:"Meeting et inauguration dans une région.",dis:used},
   {id:"discours",n:"Discours à la nation",d:"S'adresser aux Camerounais.",dis:used||cd("discours")},
   {id:"remanier",n:"Remanier",d:"Nommer un nouveau gouvernement (art. 8).",dis:used||cd("remanier")},
   {id:"grace",n:"Grâce présidentielle",d:"Libérer des détenus (art. 8).",dis:used||cd("grace")},
   {id:"urgence",n:"État d'urgence",d:"Pouvoirs spéciaux dans une région (art. 9).",dis:used||cd("urgence")},
   {id:"referendum",n:"Référendum",d:"Consulter le peuple (art. 36).",dis:used||cd("referendum")},
   {id:"dissoudre",n:"Dissoudre l'Assemblée",d:"Législatives anticipées (art. 8).",dis:used||cd("dissoudre")||!!near}
  ];
}
function applyEffects(e,n,reg){
  const d={};
  for(const k in (e||{})){let v=e[k];if(Array.isArray(v))v=rnd(v[0],v[1]);const o=S.st[k];S.st[k]=clamp(o+v,0,100);d[k]=S.st[k]-o}
  if(n){if(n.dette)S.nums.dette+=n.dette;if(n.routes){S.nums.routes+=n.routes;S.st.infra=clamp(S.st.infra+n.routes/60,0,100)}if(n.elec)S.nums.elec=clamp(S.nums.elec+n.elec,0,100)}
  if(reg)for(const r in reg){shift(S.sup,r,S.power,reg[r]*.6,S.power);S.regs[r].sec=clamp(S.regs[r].sec+(reg[r]>0?1:-1),0,100)}
  return d;
}
function choose(i){
  const d=CM.DOSSIERS[S.cur],ch=d.c[i];A.click();
  let rejected=false;
  if(ch.loi&&!hasMajority()&&Math.random()<.55)rejected=true;
  if(rejected){applyEffects({pop:-2});S.news={k:"Assemblée nationale",h:"L'Assemblée rejette votre texte",x:"Sans majorité, « "+ch.t.toLowerCase()+" » n'a pas été adopté."};log("Texte rejeté : "+d.t,"Parlement")}
  else{applyEffects(ch.e,ch.n,ch.reg);if(ch.reg)for(const r in ch.reg)SYS.cause(S,r,ch.h,ch.reg[r]>0?3:-3,"");else if(d.lieu&&ch.e){const tot=Object.values(ch.e).reduce((a,v)=>a+(Array.isArray(v)?0:v),0);SYS.cause(S,d.lieu,ch.h,tot>=0?2:-2,"")}if(ch.integrite)S.integ=clamp(S.integ+ch.integrite,0,100);if(d.unique)S.vp=true;S.news={k:"À la une",h:ch.h,x:"Décision : « "+ch.t.charAt(0).toLowerCase()+ch.t.slice(1)+" »."};log(ch.h,d.t)}
  S.cur=null;S.nextDossier=S.day+rnd(3,7);save();render();
}
function decideReport(yes){
  const id=S.pendingReport;S.pendingReport=null;const c=S.cal.find(x=>x.id===id);
  if(yes){if(!hasMajority()&&Math.random()<.5){S.news={k:"Assemblée nationale",h:"La loi de prorogation est rejetée",x:"Le scrutin aura lieu à la date prévue."};applyEffects({pop:-2})}
    else{c.m+=12;c.rep++;applyEffects({int:-5,pop:-5,soc:-2});S.integ=clamp(S.integ-5,0,100);S.news={k:"Calendrier électoral",h:"Nouveau report des élections",x:"L'opposition dénonce un « glissement » et saisit la communauté internationale."};log("Report : "+CM.CALENDRIER.find(x=>x.id===id).t,"Calendrier")}}
  else{applyEffects({int:2,pop:1});S.news={k:"Calendrier électoral",h:"Le corps électoral est convoqué",x:"ELECAM se prépare pour le scrutin."};log("Scrutin maintenu : "+CM.CALENDRIER.find(x=>x.id===id).t,"Calendrier")}
  S.reportAsked=S.reportAsked||{};S.reportAsked[id+c.m]=1;
  save();render();
}

function speechVisit(r){
  const g=r.id==="NW"||r.id==="SW"?"Good people of "+r.chef+" ! ":r.id==="EN"||r.id==="NO"||r.id==="AD"?"Jam na, "+r.chef+" ! ":r.id==="CE"||r.id==="SU"||r.id==="ES"?"Mbolo, "+r.chef+" ! ":"Chers compatriotes de "+r.chef+" ! ";
  const th=CM.THEMES[r.enjeux[0]];
  return g+"Je suis venu vous dire que l'État ne vous oublie pas. Je sais ce que vit la région "+(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n+" : "+r.desc.split(".")[0].toLowerCase()+". Aujourd'hui, j'annonce un plan pour "+th.n.toLowerCase()+". "+th.m+". Vive la région "+(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n+", vive le Cameroun !";
}
function councilReport(){
  const N=S.nums,pct=N.dette/N.pib*100;
  const secW=CM.REGIONS.filter(r=>S.regs[r.id].sec<30).map(r=>r.n);
  return"Conseil des ministres du "+monthLabel(S.m)+", au palais de l'Unité. Le ministre des Finances rapporte que la dette publique atteint "+fmt(N.dette)+" milliards de francs CFA, soit "+fmt(pct,1)+" pour cent du PIB, pour un plafond CEMAC de 70 pour cent. La croissance est estimée à "+fmt(N.croissance,1)+" pour cent. "+
   "Le ministre délégué à la Défense signale une situation sécuritaire préoccupante "+(secW.length?"dans les régions suivantes : "+secW.join(", "):"mais en amélioration sur l'ensemble du territoire")+". "+
   "Le ministre de l'Eau et de l'Énergie indique un taux d'accès à l'électricité de "+Math.round(N.elec)+" pour cent. Le ministre des Travaux publics fait état de "+fmt(N.routes)+" kilomètres de routes bitumées. "+
   "Le chef de l'État a instruit le gouvernement de maintenir la discipline budgétaire et d'accélérer les projets structurants.";
}
function chooseRegion(title,cb){
  sheet('<h3 class="h2">'+esc(title)+'</h3><div id="rmap"></div><div class="grid2">'+CM.REGIONS.map(r=>'<button class="btn small" data-r="'+r.id+'">'+esc(r.n)+'</button>').join("")+'</div>',el=>{
    el.querySelector("#rmap").innerHTML=mapSVG(id=>heat(S.regs[id].sec));
    el.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{el.remove();cb(b.dataset.r)});
  });
}
function presAction(id){
  A.unlock();
  const done=(h,x,cool)=>{S.used={m:S.m};if(cool)S.cool[id]=S.m+cool;S.news={k:"Présidence",h,x:x||""};log(h,"Action présidentielle");save();render()};
  if(id==="conseil"){setView({overlay:"conseil"},"Palais de l'Unité","Conseil des ministres");applyEffects({eco:1,infra:1});subs("Rapport du Conseil des ministres",councilReport(),{voix:"m",rate:1.02});done("Conseil des ministres au palais de l'Unité","Les ministres ont présenté leurs rapports.",3)}
  else if(id==="visite")chooseRegion("Où voulez-vous aller ?",r=>MEDIA.prepare({kind:"meeting",titre:"Visite présidentielle à "+CM.REG[r].chef,topic:MEDIA.topicOfTheme(CM.REG[r].enjeux[0]),reg:r,allowSpeech:true,rep:null},ex=>{const R=CM.REG[r];viewRegion(r,"meeting",{color:S.parties[S.party].c,banner:S.parties[S.party].n,sub:"Visite présidentielle"});shift(S.sup,r,S.party,rnd(2,4)*ex.mult,S.power);applyEffects({pop:rnd(0,2.5)*ex.mult},{dette:8});subs("Discours à "+R.chef,ex.text||speechVisit(R));done("Visite présidentielle à "+R.chef,"Bain de foule dans la région "+(/^[AEÉIOU]/.test(R.n)?"de l'":"du ")+R.n+". Qualité du discours : "+Math.round(ex.q*100)+"/100.")}))
  else if(id==="discours"){setView({land:"ville",palais:true},"Yaoundé","Adresse à la nation");const e=rnd(-2,4.5);applyEffects({pop:e});subs("Adresse à la nation","Camerounaises, Camerounais, mes chers compatriotes. Notre pays affronte des défis immenses, mais notre peuple est debout. Je veux vous parler franchement : la dette doit être maîtrisée, la paix doit revenir dans nos régions du Nord-Ouest, du Sud-Ouest et de l'Extrême-Nord, et chaque jeune doit trouver sa place. Je compte sur chacune et chacun de vous. Vive la République, vive le Cameroun !");done("Adresse solennelle à la nation",e>1?"Le discours est bien reçu.":"Le discours laisse l'opinion sceptique.",4)}
  else if(id==="remanier"){const e=rnd(-2,6);applyEffects({pop:e,eco:1});done("Remaniement : un nouveau gouvernement est formé",e>2?"La presse salue du sang neuf.":"« Les mêmes, dans d'autres fauteuils », raille l'opposition.",12)}
  else if(id==="grace"){applyEffects({int:4,soc:3,pop:2,sec:-1});done("Décret de grâce présidentielle","Des centaines de détenus libérés, dont des manifestants de 2025.",12)}
  else if(id==="urgence")chooseRegion("État d'urgence : quelle région ?",r=>{S.regs[r].sec=clamp(S.regs[r].sec+15,0,100);applyEffects({sec:3,int:-5,soc:-3});shift(S.sup,r,S.power,-3,S.power);viewRegion(r);done("État d'urgence décrété : "+CM.REG[r].n,"Couvre-feu, contrôles renforcés, libertés restreintes.",6)})
  else if(id==="referendum")sheet('<h3 class="h2">Référendum (art. 36)</h3><p>Quelle question soumettre au peuple ?</p><button class="btn" id="rF">Passer à un État fédéral</button><button class="btn" id="rL">Limiter à deux les mandats présidentiels</button><button class="btn" id="rV">Abaisser l\'âge de vote à 18 ans</button>',el=>{
    const go=(q,good)=>{el.remove();const yes=S.st.pop+rnd(-12,12)>42;if(yes){good();done("Référendum : le OUI l'emporte — "+q,"Le Conseil constitutionnel proclame les résultats.",24)}else{applyEffects({pop:-5});done("Référendum : le NON l'emporte — "+q,"Un désaveu pour le pouvoir.",24)}};
    el.querySelector("#rF").onclick=()=>go("fédéralisme",()=>{applyEffects({soc:8,int:4,sec:3});S.regs.NW.sec+=15;S.regs.SW.sec+=15;shift(S.sup,"NW",S.power,5,S.power);shift(S.sup,"SW",S.power,5,S.power)});
    el.querySelector("#rL").onclick=()=>go("limitation des mandats",()=>{applyEffects({int:6,pop:4});S.integ=clamp(S.integ+10,0,100)});
    el.querySelector("#rV").onclick=()=>go("vote à 18 ans",()=>{applyEffects({pop:3,soc:2})});
  });
  else if(id==="dissoudre"){const c=S.cal.find(x=>x.id==="leg");c.done=false;c.m=S.m+2;applyEffects({pop:[-3,3]});done("Dissolution de l'Assemblée nationale","Législatives anticipées dans deux mois.",24)}
}

/* ---------- fin de mois (président et opposant) ---------- */
function endMonth(fromClock){
  const N=S.nums;
  // événement aléatoire
  if(Math.random()<.3){const ev=pick(CM.EVENEMENTS);applyEffects(ev.e,ev.n);if(ev.reg)for(const r in ev.reg)shift(S.sup,r,S.power,ev.reg[r],S.power);if(ev.lieu){S.regs[ev.lieu].sec=clamp(S.regs[ev.lieu].sec+(ev.e.sec||0),0,100);const tot=Object.values(ev.e).reduce((a,v)=>a+v,0);SYS.cause(S,ev.lieu,ev.h,tot>=0?2:-3,"")}
    S.news={k:"Dernière minute",h:ev.h,x:ev.x+(S.news&&S.news.h?" Et aussi : "+S.news.h+".":"")};log(ev.h,"Événement")}
  if(S.mode==="opp"&&Math.random()<.35){const ev=pick(CM.EV_OPP);applyOpp(ev.o);if(/arrêtés/.test(ev.h))SYS.newCase(S,"militants",S.opp.home,Math.round(rnd(5,15)),CM.REG[S.opp.home].chef);S.news={k:"Votre parti",h:ev.h,x:ev.x};log(ev.h,"Parti")}
  S.m++;S.used={};if(S.day<S.m*30)S.day=S.m*30;
  // économie
  N.popu*=1+N.croissancePop/1200;
  N.croissance=clamp(1.2+S.st.eco*.062,-3,8);N.pib*=1+N.croissance/1200;
  N.dette+=N.deficit*(1.35-S.st.eco/100)/12;
  N.inflation=clamp(2+(50-S.st.eco)*.04+rnd(-.3,.3),0,12);
  N.pauvrete=clamp(N.pauvrete+(45-S.st.eco)*.004+(40-S.st.soc)*.003,15,60);
  N.deplaces=Math.max(2e5,N.deplaces+(35-S.st.sec)*1200);
  // dérive des jauges
  S.st.pop=clamp(S.st.pop+((S.st.eco+S.st.soc+S.st.sec)/3-45)*.05-.25,0,100);
  S.st.infra=clamp(S.st.infra+(N.elec-68)*.01-.1,0,100);
  // régions
  for(const r of CM.REGIONS){const g=S.regs[r.id];g.sec=clamp(g.sec+(S.st.sec-40)*.03+rnd(-1.2,1.2),2,98)}
  // le parti au pouvoir
  for(const r of CM.REGIONS){const d=S.mode==="pres"?(S.st.pop-45)*.03:rnd(-.35,.3);shift(S.sup,r.id,S.power,d,S.power)}
  if(S.mode==="opp"){oppAI()}
  SYS.tick(S);SYS.minesTick(S);if(window.PROF)PROF.monthTick(S);if(window.VIE){VIE.monthTick(S);VIE.ageTick(S)}if(window.PRO)PRO.monthTick(S);if(window.EMP)EMP.monthTick(S);
  // report d'élection ?
  for(const c of S.cal){if(!c.done&&(c.id==="leg"||c.id==="reg")&&c.m-S.m===2&&!(S.reportAsked&&S.reportAsked[c.id+c.m])){
    if(S.mode==="pres"){S.pendingReport=c.id}
    else if(c.rep<2&&Math.random()<(c.rep?.35:.55)){c.m+=12;c.rep++;S.news={k:"Calendrier électoral",h:"Le pouvoir reporte encore les "+CM.CALENDRIER.find(x=>x.id===c.id).t.toLowerCase(),x:"Une loi de prorogation est votée par la majorité RDPC. Nouvelle date : "+monthLabel(c.m)+"."};log(S.news.h,"Calendrier")}
    S.reportAsked=S.reportAsked||{};S.reportAsked[c.id+c.m]=1}}
  // fin de partie ?
  if(checkOver()||S.phase!=="play"){if(S.phase!=="play"){save();endScreen()}return"stop"}
  // élection ?
  const due=S.cal.filter(c=>!c.done&&c.m<=S.m).sort((a,b)=>a.m-b.m)[0];
  save();
  if(due){election(due);return S.mode==="ing"||S.mode==="min"||S.mode==="pro"?null:"stop"}
  if(!fromClock)render();
  return null;
}
GAME.endMonth=()=>endMonth();
function checkOver(){
  const N=S.nums;
  if(S.mode==="pres"){
    const dead=STATS.find(s=>S.st[s.k]<=0);
    const FINS={pop:["Soulèvement populaire","Des foules immenses envahissent les rues de Douala et Yaoundé. Lâché par une partie de l'armée et de votre parti, vous quittez le pouvoir."],
      eco:["Effondrement économique","Récession, arriérés de salaires, pénuries. Le pays est en cessation de paiement et vous démissionnez."],
      soc:["Villes mortes","Grève générale, villes mortes dans tout le pays. Le pays est paralysé et vous cédez le pouvoir au vice-président."],
      sec:["Coup d'État","Des officiers prennent le contrôle de la CRTV et du palais d'Etoudi. Votre mandat s'arrête brutalement."],
      infra:["Faillite des services publics","Plus d'électricité, plus d'eau, des routes impraticables. La colère balaie votre gouvernement."],
      int:["Isolement international","Sanctions, suspension de l'aide, gel des financements. Isolé, vous démissionnez."]};
    if(dead){S.phase="over";S.fin=FINS[dead.k];save();endScreen();return true}
    if(N.dette/N.pib*100>=CM.NUMS.plafondDette){S.phase="over";S.fin=["Crise de la dette","La dette dépasse le plafond CEMAC de 70 % du PIB. Les bailleurs coupent les financements et imposent un plan d'ajustement brutal. Vous démissionnez."];save();endScreen();return true}
  }
  return false;
}

/* ---------- élections ---------- */
function partiesInRace(){
  const ps=Object.keys(S.parties).filter(p=>p!=="AUT"&&!S.allies.includes(p));return ps.filter(p=>nationalShare(S.sup,p)>=.5||p===S.party);
}
function election(c){
  c.done=true;const ps=partiesInRace();let html="",speech="",res;
  const name=p=>p===S.party&&S.mode==="opp"?S.name+" ("+S.parties[p].n+")":p===S.party&&S.mode==="pres"?S.name+" ("+S.parties[p].n+")":S.parties[p]?S.parties[p].n:p;
  if(c.id==="leg"){
    const l=ELEC.legislatives(S.sup,ps),mu=ELEC.municipales(S.sup,ps);
    S.an=Object.assign({},l.seats);S.communes=mu.communes;S.munByReg=mu.byReg;S.regions=mu.regions;res={l,mu};
    const top=Object.keys(l.seats).sort((a,b)=>l.seats[b]-l.seats[a]);
    html='<span class="eyebrow">Proclamation du Conseil constitutionnel</span><h2 class="h2">Législatives et municipales</h2>'+seatsBar(l.seats,180)+legend(top,l.seats)+
      '<span class="eyebrow">Communes remportées (sur 360)</span>'+barsHTML(Object.keys(mu.communes).sort((a,b)=>mu.communes[b]-mu.communes[a]).map(p=>[S.parties[p]?S.parties[p].n:p,mu.communes[p],360,partyColor(p)]),"")+
      mapSVG(id=>partyColor(l.byReg[id].winner),null,r=>r.n);
    const mine=l.seats[S.party]||0;
    speech="Le Conseil constitutionnel proclame les résultats définitifs des élections législatives. Le "+S.parties[top[0]].n+" obtient "+l.seats[top[0]]+" sièges sur 180. "+(top[1]?"Le "+S.parties[top[1]].n+" obtient "+l.seats[top[1]]+" sièges. ":"")+(S.mode==="opp"?"Votre parti obtient "+mine+" députés et "+(mu.communes[S.party]||0)+" communes.":"");
    log("Législatives : "+S.parties[top[0]].n+" "+l.seats[top[0]]+" sièges"+(S.mode==="opp"?" · vous : "+mine:""),"Élection");
    if(S.mode==="pres"&&!hasMajority()){applyEffects({pop:-4});S.news={k:"Assemblée nationale",h:"Vous perdez la majorité à l'Assemblée",x:"Vos réformes devront convaincre au-delà de votre camp."}}
    if(S.mode==="opp"){applyOpp({noto:mine*.5+3,militants:mine*300});}
  }else if(c.id==="reg"){
    if(!S.munByReg){const mu=ELEC.municipales(S.sup,ps);S.munByReg=mu.byReg;S.regions=mu.regions;S.communes=mu.communes}
    const cnt={};for(const r in S.regions)cnt[S.regions[r]]=(cnt[S.regions[r]]||0)+1;res={cnt};
    html='<span class="eyebrow">Élections régionales (suffrage indirect)</span><h2 class="h2">Conseils régionaux</h2><p class="small muted">Les conseillers régionaux sont élus par les conseillers municipaux et les chefs traditionnels : le parti qui domine les communes contrôle la région.</p>'+
      mapSVG(id=>partyColor(S.regions[id]),null,r=>r.n)+legend(Object.keys(cnt),cnt," région(s)");
    speech="Résultats des élections régionales. "+Object.keys(cnt).map(p=>"Le "+S.parties[p].n+" contrôle "+cnt[p]+" région"+(cnt[p]>1?"s":"")).join(". ")+".";
    log("Régionales : "+Object.keys(cnt).map(p=>S.parties[p].n+" "+cnt[p]).join(", "),"Élection");
  }else if(c.id==="sen"){
    if(!S.munByReg){const mu=ELEC.municipales(S.sup,ps);S.munByReg=mu.byReg}
    const s=ELEC.senatoriales(S.munByReg,S.power);S.sen=s.sen;res=s;
    const top=Object.keys(s.sen).sort((a,b)=>s.sen[b]-s.sen[a]);
    html='<span class="eyebrow">Élections sénatoriales</span><h2 class="h2">Sénat</h2><p class="small muted">70 sénateurs élus par les conseillers municipaux et régionaux, 30 nommés par le président de la République.</p>'+seatsBar(s.sen,100)+legend(top,s.sen);
    speech="Élections sénatoriales. Le "+S.parties[top[0]].n+" obtient "+s.sen[top[0]]+" sièges sur 100, dont les 30 sénateurs nommés par le président.";
    log("Sénatoriales : "+top.map(p=>S.parties[p].n+" "+s.sen[p]).join(", "),"Élection");
  }else if(c.id==="pres"){
    let cands=ps.slice();let note="";
    if(S.mode==="opp"){
      if((window.VIE?VIE.ageNow(S):S.age)<35){cands=cands.filter(p=>p!==S.party);note="Vous n'avez pas 35 ans : votre candidature est rejetée par ELECAM (Code électoral)."}
      else if(S.opp.fonds<30){cands=cands.filter(p=>p!==S.party);note="Vous n'avez pas pu verser la caution de 30 millions FCFA : candidature rejetée."}
      else{S.opp.fonds-=30}
    }
    const r=ELEC.presidentielle(S.sup,cands);res=r;S.lastPres=r;
    const w=r.winner;
    html='<span class="eyebrow">Élection présidentielle · '+esc(monthLabel(S.m))+'</span><h2 class="h2">Proclamation des résultats</h2>'+(note?'<p class="small" style="color:var(--bad)">'+esc(note)+'</p>':"")+
      barsHTML(r.nat.filter(x=>x.pct>=.5).map(x=>[name(x.p),x.pct,100,partyColor(x.p)])," %")+'<p class="small muted">Participation : '+fmt(r.turnout,1)+' %. Scrutin à un tour : le candidat arrivé en tête est élu (art. 6).</p>'+
      mapSVG(id=>partyColor(r.byReg[id].winner),null,rr=>rr.n);
    speech="Le Conseil constitutionnel proclame les résultats définitifs de l'élection présidentielle. Est élu président de la République : "+name(w)+", avec "+fmt(r.nat[0].pct,1)+" pour cent des suffrages exprimés.";
    log("Présidentielle : "+name(w)+" élu avec "+fmt(r.nat[0].pct,1)+" %","Élection");
  }
  try{SYS.onElection(S,c.id,res)}catch(e){}
  if(window.PROF)PROF.afterElection(S,c.id);
  if(S.mode==="ing"||S.mode==="min"||S.mode==="pro"){S.news={k:"Politique",h:CM.CALENDRIER.find(x=>x.id===c.id).t+" : résultats proclamés",x:speech};log(S.news.h,"Élection");save();return}
  S.lastRes={html,c:c.id};save();
  setView({land:"ville",overlay:"meeting",color:partyColor(c.id==="pres"?res.winner:Object.keys(S.an).sort((a,b)=>S.an[b]-S.an[a])[0]),banner:"RÉSULTATS",sub:CM.CALENDRIER.find(x=>x.id===c.id).t},"Conseil constitutionnel","Résultats");
  A.fanfare();
  $("panel").innerHTML=html+'<button class="btn primary" id="bRes">Continuer</button>';$("panel").scrollTop=0;
  setTimeout(()=>subs("Conseil constitutionnel",speech,{voix:"m",rate:.98}),800);
  $("bRes").onclick=()=>{A.stop();if(c.id==="pres")return afterPres(res);start()};
}
function afterPres(r){
  const won=r.winner===S.party;
  if(S.mode==="pres"){S.phase="over";S.fin=won?["Réélu·e","Le peuple vous renouvelle sa confiance pour sept ans. Votre bilan : "+Math.round(S.st.pop)+" % de popularité, une dette à "+fmt(S.nums.dette/S.nums.pib*100,1)+" % du PIB."]:["Alternance","Pour la première fois depuis 1982, le pouvoir change de mains. Vous organisez la passation au palais d'Etoudi."];S.win=won;save();return endScreen()}
  if(won){S.phase="over";S.win=true;S.fin=["Élu·e président·e de la République","Parti de l'opposition, vous entrez au palais d'Etoudi. Le Cameroun connaît sa première alternance depuis 1982."];save();return endScreen()}
  S.phase="over";S.fin=["Défaite","Le candidat du "+S.parties[r.winner].n+" est proclamé vainqueur. Votre parti reste la voix de l'opposition."];save();endScreen();
}
function seatsBar(seats,total){const ps=Object.keys(seats).filter(p=>seats[p]>0).sort((a,b)=>seats[b]-seats[a]);return'<div class="seats" role="img" aria-label="Répartition des sièges">'+ps.map(p=>'<i style="width:'+(seats[p]*100/total)+'%;background:'+partyColor(p)+'" title="'+esc((S.parties[p]||{n:p}).n)+' '+seats[p]+'"></i>').join("")+'</div>'}
function legend(ps,vals,suffix){return'<div class="legend">'+ps.filter(p=>vals[p]>0).map(p=>'<span><i style="background:'+partyColor(p)+'"></i>'+esc((S.parties[p]||{n:p}).n)+' '+vals[p]+(suffix||"")+'</span>').join("")+'</div>'}
function barsHTML(rows,unit){return'<div class="bars">'+rows.map(([n,v,max,c])=>'<div class="b"><span>'+esc(n)+'</span><div class="t"><i style="width:'+(v*100/max)+'%;background:'+c+'"></i></div><b>'+fmt(v,unit===" %"?1:0)+(unit||"")+'</b></div>').join("")+'</div>'}
GAME.barsHTML=barsHTML;

function endScreen(){
  const f=S.fin||["Fin","" ];
  hud();$("tabs").innerHTML="";gauges();
  setView(S.win?{land:"ville",overlay:"meeting",color:partyColor(S.party),banner:S.parties[S.party].n,sub:"Victoire !"}:{land:"ville",palais:true},"Yaoundé","Palais d'Etoudi");
  $("panel").innerHTML='<span class="eyebrow">'+esc(monthLabel(S.m))+'</span><h1 class="title">'+esc(f[0])+'</h1><p>'+esc(f[1])+'</p>'+
   (S.lastRes?'<details class="card"><summary>Revoir les derniers résultats</summary>'+S.lastRes.html+'</details>':"")+
   '<div class="row">'+(S.mode==="opp"&&S.win?'<button class="btn primary" id="bGov">Gouverner le Cameroun</button>':"")+(window.EMP&&EMP.hasBefore()?'<button class="btn primary" id="bBack">Retrouver mon profil précédent'+(S.centre?" et "+esc(S.centre.nom.toLowerCase().startsWith("votre")?S.centre.nom.toLowerCase():S.centre.nom):"")+'</button>':"")+'<button class="btn'+(S.mode==="opp"&&S.win?"":" primary")+'" id="bNew">Nouvelle partie</button><button class="btn" id="bLog">Journal</button></div>';
  if(S.win)A.fanfare();
  subs("Épilogue",f[0]+". "+f[1]);
  $("bNew").onclick=()=>{clearSave();home()};
  const bb=$("bBack");if(bb)bb.onclick=()=>EMP.restore(S,f[0]+".");
  $("bLog").onclick=()=>sheet('<h3 class="h2">Journal</h3>'+journalHTML());
  const g=$("bGov");if(g)g.onclick=()=>{S.mode="pres";S.power=S.party;S.phase="play";S.win=false;S.st={pop:62,eco:50,soc:50,sec:36,infra:32,int:58};S.integ=Math.max(S.integ,60);
    S.cal=[{id:"leg",m:S.m+2,done:false,rep:0},{id:"pres",m:S.m+84,done:false,rep:0}];S.sen[S.party]=(S.sen[S.party]||0)+30;S.deck=[];S.cur=null;tab="bureau";
    S.news={k:"Investiture",h:"Vous prêtez serment comme président de la République",x:"Des législatives anticipées sont convoquées dans deux mois."};log(S.news.h,"Investiture");draw();save();start()};
}

/* ================= MODE OPPOSANT ================= */
function applyOpp(o){const p=S.opp;if(o.noto)p.noto=clamp(p.noto+o.noto,0,100);if(o.militants)p.militants=Math.max(0,p.militants+o.militants);if(o.fonds)p.fonds=Math.max(0,p.fonds+o.fonds);if(o.risque)p.risque=clamp(p.risque+o.risque,0,100);if(o.sympa){for(const r of CM.REGIONS)shift(S.sup,r.id,S.party,o.sympa*.3,S.power)}}
function oppAI(){
  const p=S.opp;
  p.fonds+=p.militants*.0003+.5;p.risque=clamp(p.risque-1.5,0,100);p.noto=clamp(p.noto-(p.noto>30?.4:.1),0,100);
  // le pouvoir reprend du terrain dans quelques régions, les autres partis bougent
  for(let i=0;i<2;i++){const r=pick(CM.REGIONS);shift(S.sup,r.id,S.power,rnd(.2,.8),S.power)}
  if(Math.random()<.3){const r=pick(CM.REGIONS);shift(S.sup,r.id,"FSNC",rnd(.2,.8),S.power)}
  for(const q of CM.ORDRE){if(q===S.party||q===S.power||S.allies.includes(q))continue;const r=pick(CM.REGIONS);shift(S.sup,r.id,q,rnd(-.3,.5),S.power)}
}
let oSel={act:null,reg:null,theme:null,result:null};
function renderQG(){
  const p=S.opp,next=S.cal.filter(c=>!c.done).sort((a,b)=>a.m-b.m)[0],nc=next&&CM.CALENDRIER.find(c=>c.id===next.id);
  const news=S.news?'<div class="card news"><span class="eyebrow" style="color:var(--r)">'+esc(S.news.k)+'</span><b>'+esc(S.news.h)+'</b><span class="small muted">'+esc(S.news.x||"")+'</span>'+(window.VID?'<div class="row">'+VID.btn(S.news.h+". "+(S.news.x||""),null)+'</div>':"")+'</div>':"";
  const acts=CM.ACTIONS_OPP;
  const a=oSel.act&&acts.find(x=>x.id===oSel.act);
  const needReg=a&&!a.national&&(a.scene||a.id==="scrutateurs");
  const needTheme=a&&(a.id==="meeting"||a.id==="marche"||a.id==="village"||a.id==="medias"||a.id==="marche_pac");
  const reg=oSel.reg||p.home;
  let form="";
  if(a){
    form='<div class="card"><span class="eyebrow">'+esc(a.n)+' · '+(a.cout?fmt(a.cout)+" M FCFA":"gratuit")+'</span><p class="small">'+esc(a.d)+'</p>'+
     (needReg?'<label class="f" for="oReg">Région<select id="oReg">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===reg?" selected":"")+'>'+esc(r.n)+' · '+esc(r.chef)+'</option>').join("")+'</select></label><p class="small muted">Enjeux locaux : '+CM.REG[reg].enjeux.map(e=>CM.THEMES[e].n).join(", ")+'</p>':"")+
     (needTheme?'<label class="f" for="oTh">Thème du message<select id="oTh">'+Object.entries(CM.THEMES).map(([k,t])=>'<option value="'+k+'"'+(k===(oSel.theme||CM.REG[reg].enjeux[0])?" selected":"")+'>'+esc(t.n)+'</option>').join("")+'</select></label>':"")+
     (a.alliance?'<label class="f" for="oAl">Parti partenaire<select id="oAl">'+CM.ORDRE.filter(q=>q!==S.party&&q!==S.power&&!S.allies.includes(q)).map(q=>'<option value="'+q+'">'+esc(S.parties[q].n)+' · '+fmt(nationalShare(S.sup,q),1)+' %</option>').join("")+'</select></label>':"")+
     '<div class="row"><button class="btn primary" id="oGo"'+(S.ap<=0||p.fonds<a.cout?" disabled":"")+'>Lancer</button><button class="btn ghost" id="oCancel">Annuler</button></div>'+(p.fonds<a.cout?'<span class="small" style="color:var(--bad)">Trésorerie insuffisante.</span>':"")+'</div>';
  }
  const res=oSel.result?'<div class="card" style="border-color:var(--y)"><span class="eyebrow" style="color:var(--y)">Résultat</span><b>'+esc(oSel.result.h)+'</b><span class="small muted">'+esc(oSel.result.x)+'</span></div>':"";
  $("panel").innerHTML=news+res+SYS.mailCard(S)+
   '<div class="row" style="justify-content:space-between"><span class="ap">Actions disponibles : '+[0,1,2].map(i=>'<i class="'+(i<S.ap?"":"off")+'"></i>').join("")+'</span>'+(next?'<span class="pill '+(next.m-S.m<=2?"warn":"ok")+'">'+esc(nc.t)+' : '+esc(monthLabel(next.m))+'</span>':"")+'</div>'+
   (a?form:'<div class="grid2">'+acts.map(x=>'<button class="opt" data-a="'+x.id+'"'+(S.ap<=0?" disabled":"")+'><b>'+esc(x.n)+'</b><span>'+esc(x.d)+'</span></button>').join("")+'</div>')+
   '<div class="row"><button class="btn'+(S.ap<=0?" primary":"")+'" id="oEnd">Avancer d\'une semaine</button><button class="btn ghost" id="oMonth">Mois suivant</button><button class="btn ghost" id="oFast">Avancer de 3 mois</button></div><span class="small muted">Une action de campagne se regagne chaque semaine (3 au maximum).</span>'+
   '<p class="small muted">'+esc(S.parties[S.party].long)+' · '+fmt(nationalShare(S.sup,S.party),1)+' % d\'intentions de vote · '+(S.an[S.party]||0)+' député(s) · '+(S.communes[S.party]||0)+' commune(s)'+(S.allies.length?' · alliés : '+S.allies.map(q=>S.parties[q].n).join(", "):"")+'</p>';
  SYS.bindMail(S);
  $("panel").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{oSel={act:b.dataset.a,reg:oSel.reg,theme:null,result:null};renderQG()});
  const sr=$("oReg");if(sr)sr.onchange=()=>{oSel.reg=sr.value;renderQG()};
  const st=$("oTh");if(st)st.onchange=()=>{oSel.theme=st.value};
  const c=$("oCancel");if(c)c.onclick=()=>{oSel.act=null;renderQG()};
  const g=$("oGo");if(g)g.onclick=()=>{const rg=sr?sr.value:p.home,th=st?st.value:null,al=$("oAl")?$("oAl").value:null;
    if(a.scene==="meeting"||a.id==="marche_pac")MEDIA.prepare({kind:"meeting",titre:a.n+" à "+CM.REG[rg].chef,topic:MEDIA.topicOfTheme(th),reg:rg,allowSpeech:true,rep:null},ex=>doOpp(a,rg,th,al,ex));
    else doOpp(a,rg,th,al,null)};
  $("oEnd").onclick=()=>{oSel={act:null,reg:oSel.reg,theme:null,result:null};advanceDays(7,false)};
  $("oMonth").onclick=()=>{oSel={act:null,reg:oSel.reg,theme:null,result:null};advanceDays((S.m+1)*30-S.day,false)};
  $("oFast").onclick=()=>fastForward();
  vieTop();
}
function meetingSpeech(r,th){
  const g=r.id==="NW"||r.id==="SW"?"Good people of "+r.chef+" ! Mes chers compatriotes ! ":r.id==="EN"||r.id==="NO"||r.id==="AD"?"Jam na, "+r.chef+" ! ":r.id==="CE"||r.id==="SU"||r.id==="ES"?"Mbolo, "+r.chef+" ! ":"Peuple de "+r.chef+", bonsoir ! ";
  const t=CM.THEMES[th];const local=CM.REG[r.id].enjeux.includes(th);
  return g+"Je suis "+S.name+", et je suis venu avec le "+S.parties[S.party].n+" vous parler de "+t.n.toLowerCase()+". "+t.m+". "+(local?"Ici, dans la région "+(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n+", vous le savez mieux que personne. ":"")+
   "Depuis trop longtemps, on vous promet et rien ne change. Les routes, l'électricité, les écoles, les hôpitaux : c'est votre argent, c'est votre droit ! Inscrivez-vous sur les listes électorales, surveillez les bureaux de vote, et ensemble nous irons jusqu'à Etoudi ! Le Cameroun nouveau, c'est maintenant !";
}
function doOpp(a,reg,th,ally,ex){
  A.unlock();const p=S.opp,R=CM.REG[reg];if(S.ap<=0)return;
  S.ap--;p.fonds-=a.cout;let h="",x="";
  const themeMult=th?(R.enjeux.includes(th)?1.6:.8):1;
  let gain=a.gain*themeMult*(.6+p.noto/100)*rnd(.7,1.3);
  if(S.intel&&S.intel[reg]>=S.m)gain*=1.2;
  if(ex)gain*=ex.mult;
  if(th&&S.mood&&S.mood[reg]&&S.mood[reg].c.some(c=>c.d<0&&c.ty===th))gain*=1.25;
  if(a.national){for(const r of CM.REGIONS){const cur=S.sup[r.id][S.party]||0;shift(S.sup,r.id,S.party,gain*Math.max(.25,1-cur/55)*(th&&r.enjeux.includes(th)?1.4:.9),S.power)}h="Campagne médiatique : "+CM.THEMES[th].n;x="Votre message circule dans tout le pays."}
  else if(a.gain){
    let banned=false;
    if(a.scene==="meeting"&&Math.random()<.15+p.risque/200){banned=true;gain*=.5;p.noto+=3;p.risque+=5}
    const cur=S.sup[reg][S.party]||0;gain*=Math.max(.25,1-cur/55);
    shift(S.sup,reg,S.party,gain,S.power);
    const place=a.scene==="marche"?R.marche:a.scene==="village"?R.village:R.chef;
    h=(banned?"Meeting interdit, mais maintenu à ":a.n+" · ")+cap1(place.replace(/^le |^la /,""));
    x="+"+fmt(gain,1)+" point"+(gain>=2?"s":"")+" d'intentions de vote dans la région "+(/^[AEÉIOU]/.test(R.n)?"de l'":"du ")+R.n+". "+(themeMult>1?"Votre thème répond aux attentes locales.":"Thème peu porteur ici.");
    viewRegion(reg,a.scene,{color:S.parties[S.party].c,banner:S.parties[S.party].n,sub:a.id==="marche_pac"?"MARCHE PACIFIQUE":S.name.toUpperCase()});
    if(a.scene==="meeting")setTimeout(()=>subs(S.name+" · "+R.chef,ex&&ex.text?ex.text:meetingSpeech(R,th)),500);
    if(ex)x+=" Qualité de votre intervention : "+Math.round(ex.q*100)+"/100."+(ex.notes&&ex.notes.length?" "+ex.notes.join(" "):"");
    else subs(S.name+" · "+R.chef,a.scene==="marche"?"Bonjour maman ! Bonjour papa ! Comment va le commerce ? Je sais que le sac de riz a encore augmenté et que les taxes de la mairie vous étranglent. Avec le "+S.parties[S.party].n+", nous allons changer ça. Votez pour le changement !":"Mes respects à Sa Majesté le chef et aux notables. Je suis venu écouter les villageois. Ici il faut une route, un forage et un centre de santé. Je ne l'oublierai pas.",{rate:1.02});
  }
  if(a.fonds){const f=a.fonds+p.militants*.0008+rnd(0,8);p.fonds+=f;h="Collecte de fonds";x="+"+fmt(f)+" millions FCFA récoltés."}
  if(a.surv){p.surv=clamp(p.surv+a.surv,0,100);h="Formation de scrutateurs";x="Votre parti couvre désormais "+Math.round(p.surv)+" % des bureaux de vote."}
  if(a.alliance&&ally){const nat=nationalShare(S.sup,S.party),their=nationalShare(S.sup,ally);const ok=Math.random()<.25+(nat-their)/40+p.noto/200;
    if(ok){S.allies.push(ally);for(const r of CM.REGIONS){const v=S.sup[r.id][ally]||0;S.sup[r.id][ally]=v*.4;S.sup[r.id][S.party]=(S.sup[r.id][S.party]||0)+v*.6}h="Coalition conclue avec le "+S.parties[ally].n;x="Ses électeurs vous rejoignent en grande partie. Vous portez désormais les couleurs d'une coalition."}
    else{h="Le "+S.parties[ally].n+" refuse votre offre";x="Ses dirigeants veulent présenter leur propre candidat."}}
  p.noto=clamp(p.noto+a.noto,0,100);p.militants+=a.mil;p.risque=clamp(p.risque+a.risque,0,100);
  if(a.risque&&Math.random()<p.risque/320){S.ap=Math.max(0,S.ap-1);p.noto=clamp(p.noto+6,0,100);h+=" — vous êtes interpellé·e";x+=" Garde à vue de 48 heures : vous perdez une action.";SYS.newCase(S,"militants",reg,Math.round(rnd(3,20)),R.chef);log("Interpellation de "+S.name,"Parti")}
  oSel={act:null,reg,theme:null,result:{h,x}};log(h,"Campagne");save();gauges();renderQG();
}
function fastForward(){
  for(let k=0;k<3;k++){for(const r of CM.REGIONS)shift(S.sup,r.id,S.party,rnd(.05,.3)*(.6+S.opp.noto/100),S.power);S.opp.fonds+=4;S.opp.noto=clamp(S.opp.noto+.5,0,100);
    const next=S.cal.filter(c=>!c.done).sort((a,b)=>a.m-b.m)[0];endMonthSilent();if(next&&next.m<=S.m)break;if(S.phase!=="play")break}
  oSel={act:null,reg:null,theme:null,result:null};
  const due=S.cal.filter(c=>!c.done&&c.m<=S.m).sort((a,b)=>a.m-b.m)[0];save();
  if(due)return election(due);render();
}
function endMonthSilent(){S.m++;S.ap=2;S.nums.popu*=1+S.nums.croissancePop/1200;S.nums.dette+=S.nums.deficit/12;oppAI();SYS.tick(S);
  for(const c of S.cal){if(!c.done&&(c.id==="leg"||c.id==="reg")&&c.m-S.m===2&&!(S.reportAsked&&S.reportAsked[c.id+c.m])){if(c.rep<2&&Math.random()<(c.rep?.35:.55)){c.m+=12;c.rep++;log("Report des "+CM.CALENDRIER.find(x=>x.id===c.id).t.toLowerCase()+" à "+monthLabel(c.m),"Calendrier")}S.reportAsked=S.reportAsked||{};S.reportAsked[c.id+c.m]=1}}}

/* ================= ONGLETS COMMUNS ================= */
let mapMode="parti",selReg=null;
function renderCarte(){
  const modes=[["parti","Intentions de vote"],["sec","Sécurité"],["elec","Électricité"]];if(S.mode==="opp")modes.push(["moi","Mon parti"]);
  const fill=id=>mapMode==="parti"?partyColor(leader(S.sup[id])):mapMode==="sec"?heat(S.regs[id].sec):mapMode==="elec"?heat(S.regs[id].elec):heat(Math.min(100,(S.sup[id][S.party]||0)*2.2));
  const r=selReg&&CM.REG[selReg];
  let det="";
  if(r){const o=S.sup[r.id];const top=Object.keys(o).filter(p=>p!=="AUT").sort((a,b)=>o[b]-o[a]).slice(0,5);const sec=S.regs[r.id].sec;
    det='<div class="card"><div class="row" style="justify-content:space-between"><h3 class="h2">'+esc(r.n)+'</h3><span class="pill '+(sec<30?"bad":sec<55?"warn":"ok")+'">'+(sec<30?"Zone de conflit":sec<55?"Sécurité fragile":"Calme")+'</span></div>'+
     '<div class="kv"><span>Chef-lieu</span><b>'+esc(r.chef)+'</b><span>Population (est.)</span><b>'+fmt(r.pop*S.nums.popu/30.36e6,2)+' M</b><span>Députés</span><b>'+r.seats+'</b><span>Communes</span><b>'+r.communes+'</b><span>Électricité</span><b>'+Math.round(S.regs[r.id].elec)+' %</b><span>Participation habituelle</span><b>'+r.turn+' %</b><span>Conseil régional</span><b>'+esc((S.parties[S.regions[r.id]]||{n:"—"}).n)+'</b></div>'+
     '<p class="small">'+esc(r.desc)+'</p><p class="small muted">Villes : '+esc(r.villes.join(", "))+'. Marché : '+esc(r.marche)+'. Village : '+esc(r.village)+'.</p>'+
     '<span class="eyebrow">Intentions de vote (estimation)</span>'+barsHTML(top.map(p=>[(S.parties[p]||{n:p}).n,o[p],100,partyColor(p)])," %")+
     '<div class="row">'+(window.VID?VID.btn("état de la route axe "+r.chef,r.id,"Vidéo : routes")+VID.btn("vue de la ville "+r.chef,r.id,"Vidéo : la ville"):"")+(window.VOY?'<button class="btn small primary" id="tripHere">Y aller</button>':"")+'<button class="btn small" data-v="">Voir le paysage</button><button class="btn small" data-v="marche">Le marché</button><button class="btn small" data-v="village">Un village</button>'+(S.mode==="opp"?'<button class="btn small primary" id="actHere">Agir ici</button>':"")+'</div></div>'}
  $("panel").innerHTML='<div class="row">'+modes.map(([k,n])=>'<button class="btn small'+(k===mapMode?" primary":"")+'" data-m="'+k+'">'+n+'</button>').join("")+'</div>'+
   mapSVG(fill,selReg)+(mapMode==="parti"?legend(ELEC.parties(S.sup).filter(p=>CM.REGIONS.some(r=>leader(S.sup[r.id])===p)),Object.fromEntries(ELEC.parties(S.sup).map(p=>[p,CM.REGIONS.filter(r=>leader(S.sup[r.id])===p).length]))," rég."):'<p class="small muted">Rouge : situation critique · vert : bonne situation.</p>')+
   (det||'<p class="small muted">Touchez une région pour voir sa situation et visiter ses paysages en 3D.</p>')+(window.VOY?VOY.agglosHTML():"");
  if(window.VOY)VOY.bind($("panel"));const tg=$("tripHere");if(tg)tg.onclick=()=>VOY.open(selReg);
  $("panel").querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{mapMode=b.dataset.m;renderCarte()});
  $("panel").querySelectorAll("path[data-r]").forEach(pth=>pth.onclick=()=>{selReg=pth.dataset.r;viewRegion(selReg);renderCarte()});
  $("panel").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>viewRegion(selReg,b.dataset.v||null));
  const ah=$("actHere");if(ah)ah.onclick=()=>{oSel={act:null,reg:selReg,theme:null,result:null};tab="qg";render()};
}
function renderPays(){
  const N=S.nums,pct=N.dette/N.pib*100;
  $("panel").innerHTML='<span class="eyebrow">République du Cameroun · '+esc(monthLabel(S.m))+'</span>'+
   '<div class="card"><span class="eyebrow">Population estimée</span><span class="big-num" id="popLive">'+fmt(N.popu)+'</span><span class="small muted">Croissance d\'environ 2,6 % par an. Recensement général lancé en avril 2026.</span></div>'+
   '<div class="facts">'+fact(fmt(N.pib)+" Mds","FCFA de PIB")+fact(fmt(N.croissance,1)+" %","de croissance")+fact(fmt(N.inflation,1)+" %","d'inflation")+fact(fmt(N.budget,1)+" Mds","FCFA de budget annuel")+
   fact(fmt(N.routes)+" km","bitumés, "+fmt(N.routes/N.reseau*100,1)+" % du réseau")+fact(Math.round(N.elec)+" %","d'accès à l'électricité")+fact(fmt(N.pauvrete,1)+" %","de pauvreté")+fact(fmt(N.deplaces/1e6,2)+" M","de déplacés internes")+fact(fmt(N.refugies),"réfugiés accueillis")+fact(fmt(N.inscrits/1e6,1)+" M","électeurs inscrits")+'</div>'+
   '<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Dette publique</span><span class="pill '+(pct>60?"bad":pct>50?"warn":"ok")+'">'+fmt(pct,1)+' % du PIB</span></div><span class="big-num">'+fmt(N.dette)+' Mds</span><div class="bar" style="height:10px"><i class="'+(pct>60?"low":pct>50?"mid":"")+'" style="width:'+(pct/70*100)+'%"></i></div><span class="small muted">Plafond du critère de convergence CEMAC : 70 % du PIB. Au-delà, la partie s\'arrête en mode président.</span></div>'+
   '<div class="card"><span class="eyebrow">Présidentielle du 12 octobre 2025 (résultats officiels)</span>'+barsHTML(CM.PRESIDENTIELLE_2025.map(([n,v],i)=>[n.split(" (")[0].split(" ").slice(-1)[0],v,100,["#1d8a4a","#e3a21a","#3b82d6","#9b59b6","#e0762b","#17a3a3","#8a8f98"][i]])," %")+'<span class="small muted">Candidats : '+esc(CM.PRESIDENTIELLE_2025.slice(0,6).map(x=>x[0]).join(", "))+'. Résultat contesté par l\'opposition.</span></div>'+
   '<div class="card"><span class="eyebrow">Sécurité par région</span>'+barsHTML(CM.REGIONS.map(r=>[r.n,S.regs[r.id].sec,100,heat(S.regs[r.id].sec)]),"")+'</div>';
  clearInterval(ui.popT);const el=$("popLive");let v=N.popu;ui.popT=setInterval(()=>{if(!document.body.contains(el)){clearInterval(ui.popT);return}v+=N.popu*.026/31557600;el.textContent=fmt(v)},1000);
}
function renderInst(){
  const an=S.an,anP=Object.keys(an).filter(p=>an[p]>0).sort((a,b)=>an[b]-an[a]);
  const sen=S.sen,senP=Object.keys(sen).filter(p=>sen[p]>0).sort((a,b)=>sen[b]-sen[a]);
  const com=S.communes,comP=Object.keys(com).filter(p=>com[p]>0).sort((a,b)=>com[b]-com[a]);
  $("panel").innerHTML='<div class="card"><span class="eyebrow">Assemblée nationale · 180 députés</span>'+seatsBar(an,180)+legend(anP,an)+'<span class="small muted">Majorité absolue : 91 sièges. '+(S.mode==="pres"?(hasMajority()?"Vous disposez de la majorité.":"Vous n'avez pas la majorité : vos lois peuvent être rejetées."):"")+'</span></div>'+
   '<div class="card"><span class="eyebrow">Sénat · 100 sénateurs</span>'+seatsBar(sen,100)+legend(senP,sen)+'<span class="small muted">70 élus au suffrage indirect, 30 nommés par le président.</span></div>'+
   '<div class="card"><span class="eyebrow">Communes · 360</span>'+seatsBar(com,360)+legend(comP,com)+'</div>'+
   '<div class="card"><span class="eyebrow">Calendrier électoral</span><div class="cal">'+S.cal.slice().sort((a,b)=>a.m-b.m).map(c=>{const d=CM.CALENDRIER.find(x=>x.id===c.id);return'<div><span>'+esc(d.t)+(c.rep?' <span class="pill warn">reporté '+c.rep+'×</span>':"")+'</span><b>'+(c.done?"terminé":esc(monthLabel(c.m)))+'</b></div>'}).join("")+'</div></div>'+
   '<div class="card"><span class="eyebrow">Constitution et lois appliquées dans le jeu</span>'+CM.LOIS.map(l=>'<div class="law"><span class="r">'+esc(l.r)+'</span><b>'+esc(l.t)+'</b><span class="small">'+esc(l.x)+'</span><span class="j">Dans le jeu : '+esc(l.jeu)+'</span></div>').join("")+'</div>';
}
function journalHTML(){return'<div class="log">'+S.log.map(l=>'<div><small>'+esc(monthLabel(l.m))+' · '+esc(l.d)+'</small><br>'+esc(l.h)+(window.VID?' '+VID.btn(l.h,null,"Vidéo"):"")+'</div>').join("")+'</div>'}
function renderJournal(){$("panel").innerHTML='<span class="eyebrow">Journal</span>'+journalHTML()}

/* ---------- lancement ---------- */
function boot(){
  bindAudio();
  setInterval(clockTick,5000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)clockTick()});
  const ok=S3.init?S3.init($("view")):false;
  if(!ok)$("nogl").hidden=false;
  home();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
