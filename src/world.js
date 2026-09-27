/* Chemin d'Etoudi — monde partagé entre joueurs (tous profils confondus) et marché des prestations.
   Chaque joueur publie dans sa présence : son profil, ses avis de recherche, ses offres, ses attributions et ses livraisons.
   Un avis de recherche est d'abord proposé aux joueurs qui ont le profil demandé ; sans eux, le jeu répond par défaut. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const W={code:null,room:null,peers:[],kind:""};window.WORLD=W;
const ARTIFACT_URL="https://claude.ai/artifact/UH4N1hdM1u88qBjMyG6UVX";
let uid=1;const nid=()=>"r"+Date.now().toString(36)+(uid++);
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';

/* identifiant stable du joueur */
function pid(){try{let v=localStorage.getItem("etoudi-pid");if(!v){v=Math.random().toString(36).slice(2,10);localStorage.setItem("etoudi-pid",v)}return v}catch(e){if(!W._pid)W._pid=Math.random().toString(36).slice(2,10);return W._pid}}
W.pid=pid;

/* services d'un secteur : [nom, montant M FCFA, mois] */
/* secteur d'entreprise ou profession libérale */
const SEC=sec=>E.SECTEURS[sec]||(window.PRO&&window.PRO.sector(sec))||E.SECTEURS.btp;W.sec=SEC;
W.services=function(sec){const S=E.SECTEURS[sec]||(window.PRO&&window.PRO.sector(sec));if(!S)return[];if(S.services)return S.services;return E.PROJETS.filter(p=>E.secteurProjet(p.id)==="btp").map(p=>[p.n,Math.round(p.cout*1000),p.mois])};

/* profil affiché dans l'annuaire */
function roleOf(S){
  if(S.mode==="pres")return"Président de la République";
  if(S.mode==="min")return"Ministre : "+S.minis.n;
  if(S.mode==="ing")return"Chef d'entreprise · "+E.SECTEURS[S.ent.sector||"btp"].n;
  if(S.mode==="pro"){const X=window.PRO.LIST[S.pro.id];return X.g[S.pro.grade][0]+" ("+X.n.toLowerCase()+")"}
  if(S.profil==="maire")return"Maire de "+(S.opp.commune?S.opp.commune.ville:"—");
  if(S.profil==="depute")return"Député ("+CM.REG[S.opp.dep.reg].n+") · "+S.parties[S.party].n;
  return"Chef de parti · "+S.parties[S.party].n;
}
function mySector(S){return S&&S.mode==="ing"?(S.ent.sector||"btp"):S&&S.mode==="pro"?window.PRO.sec(S.pro.id):null}
function myReg(S){return S.mode==="ing"?S.ent.reg:S.mode==="pro"?S.pro.reg:S.opp?S.opp.home:S.mode==="min"?"CE":"CE"}
W.roleOf=roleOf;

/* ---------- connexion ---------- */
async function getRoom(){
  if(window.claude&&window.claude.use){try{const r=await window.claude.use("room");if(r){W.kind="claude";return r}}catch(e){}}
  if(window.NET&&window.WebSocket&&!(window.claude&&window.claude.use)){W.kind="public";return{join:n=>window.NET.join(n)}}
  return null;
}
W.connect=async function(code){
  const S=G.S;if(!S)return false;code=code.toUpperCase();
  const r=await getRoom();if(!r)throw new Error("Le réseau n'est pas disponible ici.");
  if(W.room)try{W.room.leave()}catch(e){}
  W.room=await r.join("etoudi-monde-"+code.toLowerCase());W.code=code;
  S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};S.market.code=code;
  W.room.onPeers(()=>onPeers(),e=>{G.toast("Monde partagé : connexion perdue")});
  W.publish(true);
  return true;
};
W.leave=function(){try{W.room&&W.room.leave()}catch(e){}W.room=null;W.code=null;W.peers=[];const S=G.S;if(S&&S.market)S.market.code=null};
W.connected=()=>!!W.room;
W.autoConnect=function(S){if(S&&S.market&&S.market.code&&!W.room)W.connect(S.market.code).catch(()=>{})};

/* ---------- publication de la présence ---------- */
let pubT=null;
W.publish=function(now){
  const S=G.S;if(!W.room||!S)return;
  clearTimeout(pubT);
  pubT=setTimeout(()=>{
    const M=S.market||{mine:[],bids:[],dl:[]};
    const w={n:String(S.name).slice(0,24),id:pid(),r:roleOf(S).slice(0,70),s:mySector(S),g:myReg(S),rep:S.mode==="ing"?Math.round(S.ent.rep):S.mode==="pro"?Math.round(S.pro.rep):null,cv:window.PRO?window.PRO.cvOf(S):null,nm:(M.nm||[]).slice(0,5),nr:(M.nr||[]).slice(0,5),py:(M.py||[]).slice(0,10),ev:(M.ev||[]).slice(0,10),
      rq:M.mine.filter(x=>x.st==="ouvert").slice(0,5).map(x=>({i:x.id,s:x.s,t:x.t.slice(0,60),b:+(+x.b).toFixed(3),g:x.reg,m:x.mois,k:x.kind})),
      bd:(M.bids||[]).slice(0,6).map(x=>({i:x.i,to:x.to,p:+(+x.p).toFixed(3),m:x.m,q:x.q})),
      aw:M.mine.filter(x=>x.aw&&x.aw.human).slice(0,5).map(x=>({i:x.id,to:x.aw.to,p:+(+x.aw.p).toFixed(3),t:x.t.slice(0,60),m:x.aw.m,g:x.reg,s:x.s,k:x.kind})),
      dl:(M.dl||[]).slice(0,5)};
    try{W.room.presence({w})}catch(e){}
  },now?0:800);
};

/* ---------- lecture des autres joueurs ---------- */
function others(){if(!W.room)return[];return W.room.peers().filter(p=>!p.sameTab&&p.presence&&p.presence.w&&p.presence.w.id!==pid()).map(p=>p.presence.w)}
W.others=others;
W.playersWithSector=sec=>others().filter(w=>w.s===sec);
W.humanBids=function(reqId){const out=[];for(const w of others())for(const b of (w.bd||[]))if(b.i===reqId&&b.to===pid())out.push({from:w.id,name:w.n,role:w.r,p:b.p,m:b.m,q:b.q,human:1});return out};
let seenReq={};
function onPeers(){
  const S=G.S;if(!S)return;const M=S.market;if(!M)return;W.peers=others();
  const me=pid();let changed=false;
  for(const w of W.peers){
    // nouvelles demandes pour mon secteur
    if(mySector(S))for(const r of (w.rq||[]))if(r.s===mySector(S)&&!seenReq[r.i]){seenReq[r.i]=1;G.toast("Avis de recherche de "+w.n+" : "+r.t);window.SYS.inbox(S,{from:w.n+" ("+w.r+")",t:"Avis de recherche : "+r.t,b:"Budget indicatif : "+fmt(r.b)+" M FCFA, "+r.m+" mois, région "+(CM.REG[r.g]?CM.REG[r.g].n:"—")+". Vous êtes sollicité en priorité car vous avez ce profil. Répondez dans l'onglet Marché.",k:"marche"});changed=true}
    // attributions à mon profit
    for(const a of (w.aw||[]))if(a.to===me&&!M.got[a.i]){M.got[a.i]=1;if(window.PROF&&PROF.addPlayerContract)PROF.addPlayerContract(S,{i:a.i,from:w.id,fromName:w.n,t:a.t,p:a.p,m:a.m,reg:a.g,k:a.k});changed=true}
    // livraisons des prestataires joueurs
    for(const d of (w.dl||[]))if(d.to===me&&!M.done[d.i]){const r=M.mine.find(x=>x.id===d.i);if(r&&r.aw&&r.aw.to===w.id){M.done[d.i]=1;finishReq(S,r,d.c,w.n);changed=true}}
  }
  if(window.PRO&&window.PRO.onPeers(S,W.peers,me))changed=true;
  if(window.EMP&&window.EMP.onPeers(S,W.peers,me))changed=true;
  if(changed){G.render&&G.render()}
  if(G.S&&document.querySelector('.tab[data-t="marche"][aria-selected="true"]')&&!document.querySelector(".sheet")&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))W.render(S);
}

/* ---------- publier un avis de recherche ---------- */
W.post=function(S,o){ // o:{s,t,b,mois,reg,ref,kind}
  S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};
  const humans=W.playersWithSector(o.s).length;
  const r={id:nid(),s:o.s,t:o.t,b:o.b,mois:o.mois||3,reg:o.reg,ref:o.ref||null,kind:o.kind||"libre",day:S.day,aiDay:S.day+(humans?3:1),ai:null,st:"ouvert",aw:null};
  S.market.mine.unshift(r);S.market.mine=S.market.mine.slice(0,20);W.publish(true);
  return{req:r,humans};
};
W.payer=function(S,M){ // M en millions FCFA
  if(S.mode==="pres"){S.nums.dette+=M/1000;return true}
  if(S.mode==="min"){if(S.minis.fonds<M)return false;S.minis.fonds-=M;return true}
  if(S.mode==="ing"){if(S.ent.fonds<M)return false;S.ent.fonds-=M;return true}
  if(S.mode==="pro"){if(S.pro.fonds<M*1e6)return false;S.pro.fonds-=M*1e6;return true}
  if(S.profil==="maire"&&S.opp.commune){if(S.opp.commune.fonds<M)return false;S.opp.commune.fonds-=M;return true}
  if(S.profil==="depute"&&S.opp.dep){if(S.opp.dep.fonds>=M){S.opp.dep.fonds-=M;return true}}
  if(S.opp.fonds<M)return false;S.opp.fonds-=M;return true;
};
function aiBidsFor(S,r){
  const sec=SEC(r.s);
  return sec.ai.slice().sort(()=>Math.random()-.5).slice(0,3).map(([n,v,rep])=>({name:n,role:v,p:+(r.b*rnd(.85,1.25)).toFixed(3),m:r.mois<1?r.mois:Math.max(1,Math.round(r.mois*rnd(.8,1.3))),q:clamp(Math.round(rep+rnd(-10,10)),30,95),human:0}));
}
W.aiBidsFor=aiBidsFor;
W.award=function(S,r,b){
  const job=r.kind==="emploi"&&b.human&&window.EMP;
  if(r.kind!=="projet"&&!job){if(!W.payer(S,b.p))return G.toast("Fonds insuffisants."),false}
  if(job)window.EMP.hire(S,{c:r.id,pid:b.from,name:b.name,poste:r.t,sal:b.p*1e6});
  r.st="attribue";r.aw={human:!!b.human,to:b.from||null,name:b.name,p:b.p,m:b.m,q:b.q,day:S.day,due:S.day+b.m*30};
  window.SYS.inbox(S,{from:"Marché",t:"Prestation attribuée à "+b.name,b:"« "+r.t+" » : "+fmt(b.p)+" M FCFA, "+b.m+" mois."+(b.human?" Prestataire joueur : il est prévenu immédiatement.":" Entreprise du jeu."),k:"marche"});
  W.publish(true);return true;
};
function finishReq(S,r,conf,name){
  r.st="livre";r.conf=conf;
  if(r.ref&&window.SYS.deliverExternal){window.SYS.deliverExternal(S,r.ref,conf,name);return}
  const k=conf/100;
  window.SYS.cause(S,r.reg||"CE","Prestation livrée : "+r.t.charAt(0).toLowerCase()+r.t.slice(1)+" (par "+name+")",Math.round(2+3*k),"");
  if(S.mode==="ing"){S.ent.rep=clamp(S.ent.rep+(conf-60)/10,0,100);const c=S.ent.chantiers.find(x=>x.st==="cours");if(c){c.prog=Math.min(100,c.prog+8*k);c.retards=Math.max(0,(c.retards||0)-1)}}
  else if(S.mode==="pres"||S.mode==="min")S.st.pop=clamp(S.st.pop+k,0,100);
  else if(S.mode==="pro")S.pro.rep=clamp(S.pro.rep+k,0,100);
  window.SYS.inbox(S,{from:name,t:"Prestation livrée : "+r.t,b:"Conformité au cahier des charges : "+conf+" %.",k:conf>=60?"bonne":"alerte"});
}
W.deliver=function(S,i,to,conf){S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};S.market.dl.unshift({i,to,c:conf});S.market.dl=S.market.dl.slice(0,5);W.publish(true)};

/* ---------- temps : réponses par défaut et prestations des entreprises du jeu ---------- */
W.dayTick=function(S){
  const M=S.market;if(!M)return;
  for(const r of M.mine){
    if(r.kind==="projet")continue;
    if(r.st==="ouvert"&&!r.ai&&S.day>=r.aiDay&&!W.humanBids(r.id).length){r.ai=aiBidsFor(S,r);window.SYS.inbox(S,{from:"Marché",t:"Réponses reçues : "+r.t,b:(W.connected()&&W.playersWithSector(r.s).length?"Aucun joueur de ce profil n'a répondu à temps : ":"Aucun joueur n'a ce profil dans votre monde : ")+"le jeu vous propose "+r.ai.length+" entreprises. Choisissez dans l'onglet Marché.",k:"marche"})}
    if(r.st==="attribue"&&r.aw&&!r.aw.human&&S.day>=r.aw.due){finishReq(S,r,clamp(Math.round(r.aw.q+rnd(-12,8)),25,100),r.aw.name)}
  }
};

/* ---------- onglet Marché ---------- */
W.render=function(S){
  S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};const M=S.market;const P=$("panel");const sec=mySector(S);
  const oth=others();
  let h='<div class="card"><span class="eyebrow">Monde partagé</span>'+(W.room?'<div class="row" style="justify-content:space-between"><span>Code du monde : <b style="font-family:var(--mono);letter-spacing:.15em">'+esc(W.code)+'</b></span>'+pill(oth.length+" autre"+(oth.length>1?"s":"")+" joueur"+(oth.length>1?"s":""),oth.length?"ok":"warn")+'</div><div class="row"><button class="btn small" id="wLink">Copier le lien d\'invitation</button><button class="btn small ghost" id="wLeave">Quitter le monde</button></div><span class="small muted">Réseau : '+(W.kind==="claude"?"Claude":"serveur public")+'. Chacun garde son profil et son rythme ; les avis de recherche circulent entre tous.</span>'
    :'<p class="small">Jouez dans le même monde que vos amis, chacun avec son profil (président, ministre, maire, chefs d\'entreprise…). Vos avis de recherche seront proposés en priorité aux joueurs qui ont le profil demandé ; sinon, le jeu répond avec ses entreprises.</p><div class="row"><button class="btn small primary" id="wNew">Créer un monde</button><input type="text" id="wCode" maxlength="4" placeholder="Code" style="max-width:110px;text-transform:uppercase"><button class="btn small" id="wJoin">Rejoindre</button></div><span class="small" id="wErr" style="color:var(--bad)" hidden></span>')+'</div>';
  if(W.room){h+='<div class="card"><span class="eyebrow">Annuaire des joueurs</span><div class="players"><div class="player"><span class="dot" style="background:var(--y)"></span><span><b>'+esc(S.name)+'</b><br><span class="small muted">'+esc(roleOf(S))+'</span></span><span class="small muted">vous</span></div>'+oth.map(w=>'<div class="player"><span class="dot" style="background:'+(w.s?"var(--ok)":"var(--r)")+'"></span><span><b>'+esc(w.n)+'</b><br><span class="small muted">'+esc(w.r)+(w.g&&CM.REG[w.g]?" · "+esc(CM.REG[w.g].n):"")+'</span></span><span class="small muted">'+(w.rep!=null?"réputation "+w.rep:"")+'</span></div>').join("")+'</div></div>'}
  // demandes pour mon secteur
  if(sec){const inc=[];for(const w of oth)for(const r of (w.rq||[]))if(r.s===sec)inc.push({w,r});
    h+='<div class="card"><span class="eyebrow">Demandes pour votre profil ('+esc(SEC(sec).n)+')</span>'+(inc.length?inc.map(({w,r})=>{const mine=(M.bids||[]).find(b=>b.i===r.i);return'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(r.t)+'</b><span class="small muted">Demandé par '+esc(w.n)+' ('+esc(w.r)+') · budget '+fmt(r.b)+' M FCFA · '+r.m+' mois</span>'+(mine?'<span class="small" style="color:var(--y)">Offre envoyée : '+fmt(mine.p)+' M, '+mine.m+' mois</span>':'<button class="btn small primary" data-offer="'+r.i+'" data-to="'+w.id+'" data-b="'+r.b+'" data-m="'+r.m+'" style="align-self:flex-start">Faire une offre</button>')+'</div>'}).join(""):'<span class="small muted">'+(W.room?"Aucune demande d'un autre joueur pour l'instant.":"Rejoignez un monde partagé pour recevoir les demandes des autres joueurs.")+'</span>')+'</div>'}
  // mes demandes
  const mine=M.mine.filter(r=>r.kind!=="projet");
  h+='<div class="card"><span class="eyebrow">Mes avis de recherche</span>'+(mine.length?mine.map(r=>{const hb=W.humanBids(r.id);const all=hb.concat(r.ai||[]);
    let body="";
    if(r.st==="ouvert")body=all.length?all.map((b,i)=>'<button class="choice" data-aw="'+r.id+'" data-bi="'+i+'"><span class="t">'+(b.human?'<span class="pill ok">Joueur</span> ':"")+esc(b.name)+' <span class="small muted">('+esc(b.role||"")+')</span></span><span class="small">'+fmt(b.p)+' M FCFA · '+b.m+' mois'+(b.human?"":" · note technique "+b.q+"/100")+'</span></button>').join(""):'<span class="small muted">'+(W.playersWithSector(r.s).length?"Proposé en priorité à : "+esc(W.playersWithSector(r.s).map(w=>w.n).join(", "))+". En attente de leurs offres.":"En attente de réponses (le "+esc(G.dayLabel(r.aiDay))+").")+'</span>';
    else if(r.st==="attribue")body='<span class="small">Attribué à '+esc(r.aw.name)+(r.aw.human?" (joueur)":"")+' · '+fmt(r.aw.p)+' M · livraison attendue vers le '+esc(G.dayLabel(r.aw.due))+'</span>';
    else body='<span class="small">Livré · conformité '+r.conf+' %</span>';
    return'<div class="card" style="gap:6px;background:var(--panel3)"><div class="row" style="justify-content:space-between"><b>'+esc(r.t)+'</b>'+pill({ouvert:"Ouvert",attribue:"En cours",livre:"Livré"}[r.st],r.st==="livre"?"ok":"warn")+'</div><span class="small muted">'+esc(SEC(r.s).n)+' · budget '+fmt(r.b)+' M FCFA</span>'+body+'</div>'}).join(""):'<span class="small muted">Aucun avis publié.</span>')+
   '<button class="btn small primary" id="wPost" style="align-self:flex-start">Publier un avis de recherche</button></div>';
  const proj=M.mine.filter(r=>r.kind==="projet"&&r.st==="ouvert");
  if(proj.length)h+='<div class="card"><span class="eyebrow">Vos appels d\'offres publics diffusés aux joueurs</span>'+proj.map(r=>'<div class="small">'+esc(r.t)+' · '+W.humanBids(r.id).length+' offre(s) de joueurs · à attribuer dans l\'onglet Projets</div>').join("")+'</div>';
  P.innerHTML=h;
  const nw=$("wNew");if(nw)nw.onclick=async()=>{const c=Array.from({length:4},()=>"ABCDEFGHJKLMNPRSTUVWXYZ"[Math.floor(Math.random()*23)]).join("");try{await W.connect(c);G.toast("Monde "+c+" créé");W.render(S)}catch(e){err(e)}};
  const jn=$("wJoin");if(jn)jn.onclick=async()=>{const c=($("wCode").value||"").trim().toUpperCase();if(c.length!==4)return err({message:"Le code fait 4 lettres."});try{await W.connect(c);G.toast("Vous avez rejoint le monde "+c);W.render(S)}catch(e){err(e)}};
  function err(e){const x=$("wErr");if(x){x.textContent=(e&&e.message)||"Connexion impossible";x.hidden=false}}
  const lk=$("wLink");if(lk)lk.onclick=()=>{const base=window.claude&&window.claude.use?ARTIFACT_URL:(/^https?:/.test(location.protocol)?location.href.split("#")[0]:"");const t=base?("Rejoins mon monde dans Chemin d'Etoudi : "+base+"#monde-"+W.code+" (code "+W.code+")"):("Code du monde : "+W.code);try{navigator.clipboard.writeText(t).then(()=>G.toast("Copié !"),()=>G.toast(t))}catch(e){G.toast(t)}};
  const lv=$("wLeave");if(lv)lv.onclick=()=>{W.leave();W.render(S)};
  P.querySelectorAll("[data-offer]").forEach(b=>b.onclick=()=>offerSheet(S,b.dataset.offer,b.dataset.to,+b.dataset.b,+b.dataset.m));
  P.querySelectorAll("[data-aw]").forEach(b=>b.onclick=()=>{const r=M.mine.find(x=>x.id===b.dataset.aw);const all=W.humanBids(r.id).concat(r.ai||[]);if(W.award(S,r,all[+b.dataset.bi])){G.render()}});
  $("wPost").onclick=()=>postSheet(S);
};
function offerSheet(S,i,to,b,m){
  G.sheet('<h3 class="h2">Votre offre</h3><label class="f" for="oP">Prix (M FCFA)<input type="number" id="oP" step="any" value="'+(+(b*.95).toFixed(3))+'"></label><label class="f" for="oM">Délai (mois)<input type="number" id="oM" step="any" value="'+m+'" min="0.1"></label><label class="f" for="oQ">Qualité<select id="oQ"><option value="0">Économique</option><option value="1" selected>Standard</option><option value="2">Premium</option></select></label><button class="btn primary" id="oGo">Envoyer l\'offre</button>',el=>{
    el.querySelector("#oGo").onclick=()=>{const S2=G.S;S2.market.bids.unshift({i,to,p:+el.querySelector("#oP").value||b,m:+el.querySelector("#oM").value||m,q:+el.querySelector("#oQ").value});S2.market.bids=S2.market.bids.slice(0,6);W.publish(true);el.remove();G.toast("Offre envoyée");G.render()};
  });
}
function postSheet(S,presec,prekind){let kind=prekind||"presta";
  const secs=Object.entries(E.SECTEURS).concat(window.PRO?window.PRO.sectors():[]);let sec=presec||(S.mode==="ing"?(S.ent.sector==="video"?"btp":"video"):"video");
  const draw=el=>{const isPro=!!(window.PRO&&window.PRO.idOf(sec));el.querySelector("#pK").parentNode.hidden=!isPro;if(!isPro)kind="presta";el.querySelector("#pK").value=kind;el.querySelector("#pS").parentNode.hidden=kind==="emploi";el.querySelector("#pB").placeholder=kind==="emploi"?"salaire mensuel en M FCFA, ex. 0,35":"montant indicatif";const sv=W.services(sec);el.querySelector("#pS").innerHTML=sv.map((x,i)=>'<option value="'+i+'">'+esc(x[0])+' · ≈ '+(x[1]<1?fmt(Math.round(x[1]*1e6))+" FCFA":fmt(x[1])+" M")+'</option>').join("");const n=W.playersWithSector(sec);el.querySelector("#pInfo").textContent=W.room?(n.length?"Joueurs avec ce profil (proposés en premier) : "+n.map(w=>w.n).join(", "):"Aucun joueur n'a ce profil : le jeu proposera ses entreprises."):"Hors monde partagé : le jeu proposera ses entreprises."};
  G.sheet('<h3 class="h2">Avis de recherche d\'un prestataire</h3><label class="f" for="pSec">Profil recherché<select id="pSec">'+secs.map(([k,v])=>'<option value="'+k+'"'+(k===sec?" selected":"")+'>'+esc(v.n)+'</option>').join("")+'</select></label><label class="f" for="pK">Type<select id="pK"><option value="presta">Prestation ponctuelle</option><option value="emploi">Recrutement (poste salarié)</option></select></label><label class="f" for="pS">Prestation<select id="pS"></select></label><label class="f" for="pB">Budget (M FCFA, facultatif)<input type="number" id="pB" placeholder="montant indicatif"></label><label class="f" for="pR">Lieu<select id="pR">'+CM.REGIONS.map(r=>'<option value="'+r.id+'">'+esc(r.chef)+' ('+esc(r.n)+')</option>').join("")+'</select></label><p class="small" id="pInfo" style="color:var(--y)"></p><button class="btn primary" id="pGo">Publier</button>',el=>{
    draw(el);el.querySelector("#pSec").onchange=e=>{sec=e.target.value;draw(el)};el.querySelector("#pK").onchange=e=>{kind=e.target.value;draw(el)};
    el.querySelector("#pGo").onclick=()=>{const sv=W.services(sec)[+el.querySelector("#pS").value];const reg=el.querySelector("#pR").value;const bIn=+String(el.querySelector("#pB").value).replace(",",".");
      const o=kind==="emploi"?{s:sec,t:"Recrutement : "+SEC(sec).n.replace("Profession : ","")+" — "+CM.REG[reg].chef,b:bIn||.35,mois:1,reg,kind:"emploi"}:{s:sec,t:sv[0]+" — "+CM.REG[reg].chef,b:bIn||sv[1],mois:sv[2],reg,kind:S.mode==="ing"?"sous":"libre"};
      const {humans}=W.post(S,o);el.remove();
      G.toast(humans?"Avis envoyé en priorité à "+humans+" joueur(s) de ce profil":"Avis publié : réponses des entreprises du jeu sous peu");G.render()};
  });
}
W.openPost=(S,sec,kind)=>postSheet(S,sec,kind);
/* lien d'invitation vers un monde */
(function(){function check(){const m=/^#monde-([A-Za-z]{4})$/.exec(location.hash||"");if(m)W._pendingCode=m[1].toUpperCase()}check();window.addEventListener("hashchange",check)})();
})();
