/* Chemin d'Etoudi — contrats de travail entre joueurs, salaires payés par l'employeur, rupture du contrat
   (démission d'un commun accord, démission unilatérale, licenciement), contentieux devant le tribunal
   selon le Code du travail (loi n° 92/007 du 14 août 1992 : préavis art. 34, indemnité de licenciement art. 37,
   rupture abusive et dommages-intérêts art. 39, conciliation préalable devant l'inspecteur du travail art. 139),
   intérim d'un centre ou d'une entreprise pendant un mandat de ministre, et retour au profil précédent. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const EMP={};window.EMP=EMP;
let uid=1;const nid=()=>"e"+Date.now().toString(36)+(uid++);
const inbox=(S,o)=>window.SYS.inbox(S,o);
const W=()=>window.WORLD;
const F=n=>fmt(Math.round(n))+" FCFA";
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';
const AVANT="etoudi-avant";

/* ---------- portefeuilles ----------
   finances personnelles : épargne du professionnel, trésorerie de l'entreprise, ou bourse personnelle (élus, ministres)
   finances de l'institution : État, ministère, commune (pour les salaires d'agents recrutés par une autorité) */
function mk(S){S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};const M=S.market;M.emp=M.emp||[];M.py=M.py||[];M.ev=M.ev||[];M.seen=M.seen||{};return M}
EMP.wallet=function(S){if(S.mode==="pro")return S.pro.fonds;if(S.mode==="ing")return S.ent.fonds*1e6;if(S.bourse==null)S.bourse=3000000;return S.bourse};
EMP.credit=function(S,a){if(S.mode==="pro")S.pro.fonds+=a;else if(S.mode==="ing")S.ent.fonds+=a/1e6;else{EMP.wallet(S);S.bourse+=a}};
function debitPerso(S,a){EMP.credit(S,-a)}
function payInstit(S,a){ // salaire d'un agent : par l'institution quand l'employeur est une autorité
  if(S.mode==="pres"){S.nums.dette+=a/1e9;return true}
  if(S.mode==="min"){if(S.minis.fonds<a/1e6)return false;S.minis.fonds-=a/1e6;return true}
  if(S.profil==="maire"&&S.opp&&S.opp.commune){if(S.opp.commune.fonds<a/1e6)return false;S.opp.commune.fonds-=a/1e6;return true}
  if(EMP.wallet(S)<a)return false;debitPerso(S,a);return true;
}
function wlabel(S){return S.mode==="pres"?"le budget de l'État":S.mode==="min"?"les crédits du ministère":S.profil==="maire"?"la caisse de la commune":S.mode==="ing"?"la trésorerie de l'entreprise":"vos finances personnelles"}

/* ---------- envoi d'événements et de paiements à un autre joueur ---------- */
function ev(S,o){const M=mk(S);M.ev.unshift(Object.assign({i:nid()},o));M.ev=M.ev.slice(0,10);if(W())W().publish(true)}
function pay(S,to,c,a,ty){const M=mk(S);M.py.unshift({i:nid(),to,c,a:Math.round(a),ty});M.py=M.py.slice(0,10);if(W())W().publish(true)}
EMP.presence=function(S){const M=mk(S);return{py:M.py.slice(0,10),ev:M.ev.slice(0,10)}};

/* ---------- début d'un contrat ---------- */
// côté employeur
EMP.hire=function(S,o){ // o:{c,pid,name,poste,sal,interim}
  const M=mk(S);if(M.emp.find(x=>x.c===o.c))return;
  M.emp.unshift({c:o.c,pid:o.pid,name:o.name,poste:o.poste,sal:Math.round(o.sal),since:S.day,st:"actif",arr:0,paid:0,interim:!!o.interim});
  inbox(S,{from:"Ressources humaines",t:"Contrat de travail signé avec "+o.name,b:o.name+" (joueur) est recruté : "+o.poste+". Salaire : "+F(o.sal)+" par mois, payé sur "+wlabel(S)+" à chaque fin de mois tant que le contrat court.",k:"info"});
};
// côté salarié
EMP.startJob=function(S,o){ // o:{c,pid,name,poste,sal}
  if(S.job&&S.job.st==="actif")return;
  S.job={c:o.c,pid:o.pid,name:o.name,poste:o.poste,sal:Math.round(o.sal),since:S.day,st:"actif",lastPay:S.day,recu:0};
  if(S.mode==="pro"){const P=S.pro;P.avant={employeur:P.employeur,cabinet:P.cabinet};P.employeur={n:o.poste+" (chez "+o.name+", joueur)",sal:o.sal,tut:o.name,since:S.day,pid:o.pid};P.cabinet=false;P.cv.jo++}
  if(S.mode==="ing"){S.ent.won=S.ent.won||{};S.ent.won.joueur=(S.ent.won.joueur||0)+1}
  inbox(S,{from:o.name,t:"Vous êtes embauché par "+o.name,b:"Poste : "+o.poste+". Salaire : "+F(o.sal)+" par mois, versé par votre employeur. "+(S.mode==="pro"?"Pendant ce contrat, votre activité précédente est suspendue ; vous la retrouverez à la fin du contrat. ":"")+"Vous pouvez démissionner d'un commun accord à tout moment ; en cas de licenciement abusif, vous pourrez saisir le tribunal.",k:"bonne"});
  G.toast("Embauché par "+o.name);
};
function endJob(S,why){
  const J=S.job;if(!J)return;J.st="fini";J.fin=why;
  if(S.mode==="pro"&&S.pro.avant){const P=S.pro;P.employeur=P.avant.employeur;P.cabinet=P.avant.cabinet;P.avant=null}
  inbox(S,{from:"Inspection du travail",t:"Fin de votre contrat avec "+J.name,b:why+(S.mode==="pro"?" Vous retrouvez votre situation d'avant l'embauche.":""),k:"info"});
}

/* ---------- ticks ---------- */
EMP.monthTick=function(S){
  const M=mk(S);
  // l'employeur paie ses salariés joueurs
  for(const c of M.emp.filter(x=>x.st==="actif")){
    const ok=payInstit(S,c.sal);
    if(ok){c.paid++;pay(S,c.pid,c.c,c.sal,"salaire")}
    else{c.arr++;inbox(S,{from:"Ressources humaines",t:"Salaire impayé : "+c.name,b:"Fonds insuffisants sur "+wlabel(S)+" : le salaire de "+c.name+" ("+F(c.sal)+") n'a pas été versé. Arriérés : "+c.arr+" mois. Le salarié peut saisir l'inspection du travail.",k:"alerte"})}
  }
  // le salarié sans paie depuis plus de 45 jours peut saisir l'inspection du travail
  const J=S.job;if(J&&J.st==="actif"&&S.day-J.lastPay>45&&!J.alerte){J.alerte=1;inbox(S,{from:"Votre syndicat",t:"Salaire non versé par "+J.name,b:"Aucun salaire reçu depuis le "+G.dayLabel(J.lastPay)+". Vous pouvez saisir l'inspection du travail, puis le tribunal, ou quitter votre poste.",k:"alerte",emp:{ty:"impaye",c:J.c}})}
  EMP.centreMonth(S);
};
EMP.dayTick=function(S){
  const J=S.job;
  if(J&&J.proc&&!J.proc.done&&S.day>=J.proc.due)verdict(S);
  if(J&&J.st==="actif"&&J.demande&&!J.demande.rep&&S.day-J.demande.day>15&&!J.demande.relance){J.demande.relance=1;inbox(S,{from:"Inspection du travail",t:"Votre employeur ne répond pas",b:"Sans réponse de "+J.name+" depuis 15 jours, vous pouvez partir en respectant le préavis.",k:"info",emp:{ty:"refus",c:J.c}})}
};

/* ---------- lecture des autres joueurs ---------- */
EMP.onPeers=function(S,peers,me){
  const M=mk(S);let ch=false;
  for(const w of peers){
    for(const p of (w.py||[]))if(p.to===me&&!M.seen[p.i]){M.seen[p.i]=1;ch=true;EMP.credit(S,p.a);
      if(p.ty==="salaire"&&S.job&&S.job.c===p.c){S.job.lastPay=S.day;S.job.recu+=p.a;S.job.alerte=0;G.toast("Salaire reçu de "+w.n+" : "+F(p.a))}
      else inbox(S,{from:w.n,t:{dommages:"Dommages-intérêts versés",frais:"Frais de procédure remboursés",preavis:"Indemnité de préavis reçue",interim:"Salaire d'intérim"}[p.ty]||"Paiement reçu",b:F(p.a)+" versés par "+w.n+".",k:"bonne"})}
    for(const e of (w.ev||[]))if(e.to===me&&!M.seen[e.i]){M.seen[e.i]=1;ch=true;onEvent(S,w,e)}
  }
  return ch;
};
function onEvent(S,w,e){
  const M=mk(S);const c=M.emp.find(x=>x.c===e.c);const J=S.job&&S.job.c===e.c?S.job:null;
  if(e.ty==="dem"&&c){c.dem={day:S.day};inbox(S,{from:w.n,t:"Demande de démission : "+c.name,b:c.name+" souhaite mettre fin à son contrat ("+c.poste+") d'un commun accord. Vous pouvez accepter, ou refuser : il devra alors respecter un préavis d'un mois.",k:"alerte",emp:{ty:"dem",c:c.c}});G.toast(c.name+" demande à démissionner")}
  else if(e.ty==="accord"&&J){J.demande&&(J.demande.rep="ok");endJob(S,"Rupture d'un commun accord avec "+J.name+".")}
  else if(e.ty==="refus"&&J){J.demande&&(J.demande.rep="non");inbox(S,{from:w.n,t:"Démission refusée par "+J.name,b:"Votre employeur refuse la rupture d'un commun accord. Vous pouvez rester, ou partir quand même en payant l'indemnité de préavis (un mois de salaire, art. 34 du Code du travail).",k:"alerte",emp:{ty:"refus",c:J.c}})}
  else if(e.ty==="depart"&&c){c.st="fini";inbox(S,{from:"Ressources humaines",t:c.name+" a quitté son poste",b:"Démission unilatérale ; l'indemnité de préavis vous est versée.",k:"info"})}
  else if(e.ty==="lic"&&J){J.st="licencie";J.lic={motif:e.motif,day:S.day};
    inbox(S,{from:w.n,t:"Vous êtes licencié par "+J.name,b:"Motif invoqué : "+MOTIFS[e.motif][0]+". Vous pouvez accepter, ou contester devant le tribunal (conciliation devant l'inspecteur du travail, puis chambre sociale). Si le licenciement est jugé abusif, l'employeur paiera de ses propres finances ; sinon, vous paierez les frais de procédure.",k:"alerte",emp:{ty:"lic",c:J.c}});
    if(S.mode==="pro"&&S.pro.avant){const P=S.pro;P.employeur=P.avant.employeur;P.cabinet=P.avant.cabinet;P.avant=null}
    G.toast("Licenciement notifié par "+w.n)}
  else if(e.ty==="saisine"&&c){c.proces=1;inbox(S,{from:"Tribunal de grande instance, chambre sociale",t:c.name+" conteste son licenciement",b:"L'inspection du travail n'a pas obtenu de conciliation. L'affaire est portée devant le tribunal. Le jugement tombera dans quelques semaines ; si le licenciement est jugé abusif, vous paierez de vos finances.",k:"alerte"})}
  else if(e.ty==="jg"&&c){c.jg=e;if(e.ab){const a=e.amt;debitPerso(S,a);pay(S,w.id,c.c,a,"dommages");inbox(S,{from:"Tribunal de grande instance, chambre sociale",t:"Jugement : licenciement abusif de "+c.name,b:"Le tribunal juge le licenciement abusif (art. 39 du Code du travail). Vous êtes condamné à verser "+F(a)+" (préavis, indemnité de licenciement et dommages-intérêts), prélevés sur vos finances personnelles.",k:"alerte"});if(S.mode==="ing")S.ent.rep=clamp(S.ent.rep-4,0,100)}
    else inbox(S,{from:"Tribunal de grande instance, chambre sociale",t:"Jugement : licenciement de "+c.name+" justifié",b:"Le tribunal déboute le salarié ; il vous rembourse "+F(e.amt)+" de frais de procédure.",k:"bonne"})}
  else if(e.ty==="fin"&&J){endJob(S,e.why||"Fin de mission.")}
}

/* ---------- actions ---------- */
const MOTIFS={faute:["faute grave du salarié",.25],eco:["motif économique",.45],aucun:["aucun motif sérieux",.92]};
EMP.demission=function(S){const J=S.job;if(!J||J.st!=="actif")return;J.demande={day:S.day};ev(S,{to:J.pid,c:J.c,ty:"dem"});inbox(S,{from:"Vous",t:"Demande de démission envoyée",b:"Votre demande de rupture d'un commun accord est transmise à "+J.name+".",k:"info",read:true});G.toast("Demande envoyée à "+J.name);G.render()};
EMP.partir=function(S){const J=S.job;if(!J||J.st!=="actif")return;debitPerso(S,J.sal);pay(S,J.pid,J.c,J.sal,"preavis");ev(S,{to:J.pid,c:J.c,ty:"depart"});endJob(S,"Démission unilatérale : vous avez versé un mois de salaire d'indemnité de préavis ("+F(J.sal)+").");G.render()};
EMP.accepterDem=function(S,cid,ok){const c=mk(S).emp.find(x=>x.c===cid);if(!c||c.st!=="actif")return;ev(S,{to:c.pid,c:cid,ty:ok?"accord":"refus"});if(ok){c.st="fini";inbox(S,{from:"Ressources humaines",t:"Rupture d'un commun accord : "+c.name,b:c.name+" quitte son poste d'un commun accord. Plus aucun salaire ne lui est dû.",k:"info"})}G.toast(ok?"Rupture acceptée":"Démission refusée");G.render()};
EMP.licencier=function(S,cid){
  const c=mk(S).emp.find(x=>x.c===cid);if(!c)return;
  G.sheet('<h3 class="h2">Licencier '+esc(c.name)+'</h3><p class="small muted">Code du travail : le licenciement doit reposer sur un motif légitime. Sans motif sérieux, le salarié peut obtenir devant le tribunal le préavis, l\'indemnité de licenciement et des dommages-intérêts, que vous paierez de vos finances personnelles.</p><div class="choices">'+Object.entries(MOTIFS).map(([k,m])=>'<button class="choice" data-mo="'+k+'"><span class="t">'+esc(m[0].charAt(0).toUpperCase()+m[0].slice(1))+'</span><span class="small muted">Risque d\'être jugé abusif : '+(k==="aucun"?"très élevé":k==="eco"?"moyen":"faible si la faute est prouvée")+'</span></button>').join("")+'</div>',el=>{
    el.querySelectorAll("[data-mo]").forEach(b=>b.onclick=()=>{const mo=b.dataset.mo;c.st="licencie";c.motif=mo;c.licDay=S.day;ev(S,{to:c.pid,c:cid,ty:"lic",motif:mo});inbox(S,{from:"Ressources humaines",t:"Licenciement notifié : "+c.name,b:"Motif : "+MOTIFS[mo][0]+". Le salarié peut contester devant le tribunal.",k:"info"});el.remove();G.toast("Licenciement notifié");G.render()});
  });
};
EMP.contester=function(S){
  const J=S.job;if(!J||!J.lic||J.proc)return;
  J.proc={day:S.day,due:S.day+Math.round(rnd(12,25)),done:0};ev(S,{to:J.pid,c:J.c,ty:"saisine"});
  inbox(S,{from:"Inspection du travail",t:"Saisine enregistrée",b:"Tentative de conciliation devant l'inspecteur du travail (art. 139), puis audience devant la chambre sociale du tribunal de grande instance. Jugement attendu vers le "+G.dayLabel(J.proc.due)+".",k:"info"});G.toast("Affaire portée devant le tribunal");G.render();
};
EMP.accepterLic=function(S){const J=S.job;if(!J)return;J.st="fini";J.fin="Licenciement accepté.";G.render()};
function verdict(S){
  const J=S.job;const P=J.proc;P.done=1;
  const mo=J.lic?J.lic.motif:"aucun";const rep=S.mode==="pro"?S.pro.rep:S.mode==="ing"?S.ent.rep:55;
  let p=MOTIFS[mo][1];if(mo==="faute"&&rep>70)p+=.2;if(J.impaye)p=.95;
  const ab=Math.random()<p;const mois=Math.max(1,(J.lic?J.lic.day:S.day)-J.since)/30;
  let amt;
  if(ab){amt=Math.round(J.sal*(1+Math.max(.3,mois/12*.3)+Math.max(3,mois/12*1.5)));inbox(S,{from:"Tribunal de grande instance, chambre sociale",t:"Vous gagnez : licenciement abusif",b:"Le tribunal condamne "+J.name+" à vous verser "+F(amt)+" : un mois de préavis (art. 34), l'indemnité de licenciement (art. 37) et des dommages-intérêts (art. 39). Le paiement sera prélevé sur ses finances.",k:"bonne"})}
  else{amt=Math.max(100000,Math.round(J.sal*.5));debitPerso(S,amt);pay(S,J.pid,J.c,amt,"frais");inbox(S,{from:"Tribunal de grande instance, chambre sociale",t:"Vous perdez : licenciement justifié",b:"Le tribunal retient le motif de "+MOTIFS[mo][0]+". Vous êtes débouté et payez "+F(amt)+" de frais de procédure, remboursés à votre ancien employeur.",k:"alerte"})}
  ev(S,{to:J.pid,c:J.c,ty:"jg",ab:ab?1:0,amt});J.st="fini";
}

/* ---------- courrier ---------- */
EMP.mailActs=function(S,it){
  const e=it.emp;if(!e||e.done)return"";
  if(e.ty==="dem")return'<button class="btn primary" id="eOk">Accepter la rupture d\'un commun accord</button><button class="btn" id="eNo">Refuser</button>';
  if(e.ty==="refus")return'<button class="btn" id="eStay">Rester</button><button class="btn primary" id="eGo">Partir quand même (préavis payé)</button>';
  if(e.ty==="lic")return'<button class="btn" id="eAcc">Accepter</button><button class="btn primary" id="eCon">Contester devant le tribunal</button>';
  if(e.ty==="impaye")return'<button class="btn primary" id="eImp">Saisir l\'inspection du travail</button><button class="btn" id="eGo">Quitter le poste</button>';
  return"";
};
EMP.mailBind=function(S,it,el){
  const q=s=>el.querySelector(s);const e=it.emp;if(!e)return;const done=()=>{e.done=1;el.remove()};
  if(q("#eOk"))q("#eOk").onclick=()=>{done();EMP.accepterDem(S,e.c,true)};
  if(q("#eNo"))q("#eNo").onclick=()=>{done();EMP.accepterDem(S,e.c,false)};
  if(q("#eStay"))q("#eStay").onclick=()=>{done();G.toast("Vous restez en poste")};
  if(q("#eGo"))q("#eGo").onclick=()=>{done();EMP.partir(S)};
  if(q("#eAcc"))q("#eAcc").onclick=()=>{done();EMP.accepterLic(S)};
  if(q("#eCon"))q("#eCon").onclick=()=>{done();EMP.contester(S)};
  if(q("#eImp"))q("#eImp").onclick=()=>{done();const J=S.job;if(!J)return;J.impaye=1;J.lic={motif:"aucun",day:S.day};J.st="licencie";EMP.contester(S)};
};

/* ---------- carte « Emploi » en tête des onglets principaux ---------- */
EMP.card=function(S){
  const M=S.market||{};const emp=(M.emp||[]).filter(c=>c.st==="actif"||c.st==="licencie"&&!c.jg);const J=S.job&&S.job.st!=="fini"?S.job:null;const C=S.centre;
  if(!emp.length&&!J&&!C&&!EMP.hasBefore(S))return"";
  let h='<div class="card"><span class="eyebrow">Emploi et contrats</span>';
  if(J)h+='<div class="card" style="gap:6px;background:var(--panel3)"><b>Votre employeur : '+esc(J.name)+' (joueur)</b><span class="small muted">'+esc(J.poste)+' · '+F(J.sal)+'/mois · depuis le '+esc(G.dayLabel(J.since))+' · salaires reçus : '+F(J.recu)+'</span>'+
    (J.st==="actif"?(J.demande&&!J.demande.rep?'<span class="small" style="color:var(--y)">Démission demandée, en attente de réponse.</span>':'<button class="btn small" id="eDem" style="align-self:flex-start">Démissionner d\'un commun accord</button>'):J.proc&&!J.proc.done?'<span class="small" style="color:var(--y)">Procès en cours, jugement vers le '+esc(G.dayLabel(J.proc.due))+'.</span>':'<span class="small">Licencié. <button class="btn small" id="eCon2">Contester</button> <button class="btn small ghost" id="eAcc2">Accepter</button></span>')+'</div>';
  if(emp.length)h+='<span class="small muted">Vos salariés joueurs, payés sur '+esc(wlabel(S))+' :</span>'+emp.map(c=>'<div class="row" style="justify-content:space-between;border-bottom:1px dashed var(--line);padding:4px 0"><span class="small"><b>'+esc(c.name)+'</b> · '+esc(c.poste)+' · '+F(c.sal)+'/mois'+(c.arr?" · "+c.arr+" mois impayés":"")+(c.dem&&c.st==="actif"?" · "+pill("démission demandée","warn"):"")+(c.st==="licencie"?" · licencié"+(c.proces?", procès en cours":""):"")+'</span>'+(c.st==="actif"?(c.dem?'<span class="row"><button class="btn small" data-eok="'+c.c+'">Accepter</button><button class="btn small ghost" data-eno="'+c.c+'">Refuser</button></span>':'<button class="btn small ghost" data-lic="'+c.c+'">Licencier</button>'):"")+'</div>').join("");
  if(C)h+='<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(C.nom)+' : intérim de '+esc(C.interim.n)+(C.interim.human?" (joueur)":"")+'</b><span class="small muted">Caisse accumulée : '+F(C.caisse)+' · réputation du centre '+Math.round(C.rep)+'/100'+(C.last?' · '+esc(C.last):"")+'</span></div>';
  if(EMP.hasBefore(S)&&S.mode==="min")h+='<button class="btn small" id="eBack" style="align-self:flex-start">Démissionner du gouvernement et retrouver mon profil précédent</button>';
  return h+'</div>';
};
EMP.bind=function(S){
  const b=(id,f)=>{const x=$(id);if(x)x.onclick=f};
  b("eDem",()=>EMP.demission(S));b("eCon2",()=>EMP.contester(S));b("eAcc2",()=>EMP.accepterLic(S));
  b("eBack",()=>{if(confirm("Démissionner du gouvernement et retrouver votre profil précédent ?"))EMP.restore(S,"Vous avez démissionné du gouvernement.")});
  document.querySelectorAll("[data-lic]").forEach(x=>x.onclick=()=>EMP.licencier(S,x.dataset.lic));
  document.querySelectorAll("[data-eok]").forEach(x=>x.onclick=()=>EMP.accepterDem(S,x.dataset.eok,true));
  document.querySelectorAll("[data-eno]").forEach(x=>x.onclick=()=>EMP.accepterDem(S,x.dataset.eno,false));
};

/* ---------- avant d'accepter un poste de ministre : intérim du centre ---------- */
function structureOf(S){
  if(S.mode==="pro"){const P=S.pro,X=window.PRO.LIST[P.id];const dir=P.employeur&&!P.employeur.pid&&P.grade>=2;
    if(P.cabinet)return{type:"cabinet",nom:"Votre "+X.cab[0].replace(/^(Ouvrir|Créer) (un |une |votre )?/,""),prof:P.id,base:Math.round(380000*(1+P.grade*.3)),rep:P.rep};
    if(dir)return{type:"poste",nom:P.employeur.n,prof:P.id,base:0,rep:P.rep};return null}
  if(S.mode==="ing")return{type:"ent",nom:S.ent.nom,prof:"ent:"+(S.ent.sector||"btp"),base:Math.round(Math.max(.5,S.ent.rep/40)*1e6),rep:S.ent.rep};
  return null;
}
EMP.beforeMinister=function(S,n,accept){
  if(S.job&&S.job.st==="actif"){G.toast("Démissionnez d'abord de votre emploi chez "+S.job.name+" avant d'accepter.");return false}
  const st=structureOf(S);if(!st){accept(null);return true}
  window.PRO.initTalents(S);
  const ai=S.talents.filter(t=>t.prof===st.prof).sort((a,b)=>b.rep-a.rep).slice(0,4);
  const hu=W()&&W().connected()?W().others().filter(w=>w.cv&&w.cv.pr===st.prof):[];
  const sal=st.type==="ent"?800000:Math.round(st.base*.45)||300000;
  G.sheet('<span class="eyebrow">Avant d\'accepter : '+esc(n.lab)+'</span><h3 class="h2">Qui dirige '+esc(st.nom.toLowerCase().startsWith("votre")?st.nom.toLowerCase():st.nom)+' pendant votre mandat ?</h3><p class="small muted">Vous le récupérerez si vous perdez votre poste de ministre. L\'intérimaire est payé '+F(sal)+' par mois sur les recettes du centre ; les bénéfices vous attendent à votre retour.</p><div class="choices">'+
    hu.map((w,i)=>'<button class="choice" data-ih="'+i+'"><span class="t">'+pill("Joueur","ok")+' '+esc(w.n)+'</span><span class="small muted">'+esc(w.cv.p)+' · '+(w.cv.ok||0)+' missions réussies · réputation '+(w.cv.rep!=null?w.cv.rep:"—")+'</span></button>').join("")+
    ai.map((t,i)=>'<button class="choice" data-ia="'+i+'"><span class="t">'+esc(t.n)+'</span><span class="small muted">Personnage du jeu · réputation '+Math.round(t.rep)+' · '+t.x+' missions</span></button>').join("")+
    '<button class="choice" data-ix="1"><span class="t">'+(st.type==="poste"?"Laisser l'administration désigner un intérimaire":"Fermer temporairement")+'</span><span class="small muted">'+(st.type==="poste"?"Le ministère nomme un intérimaire.":"Aucune recette, mais aucun risque.")+'</span></button></div>',el=>{
    const go=it=>{el.remove();const C={nom:st.nom,type:st.type,prof:st.prof,interim:it,sal:it.ferme?0:sal,caisse:0,rep:st.rep,base:st.base,since:S.day};accept(C)};
    el.querySelectorAll("[data-ih]").forEach(b=>b.onclick=()=>{const w=hu[+b.dataset.ih];go({n:w.n,pid:w.id,human:true,comp:clamp((w.cv.rep||55)+10,30,95)})});
    el.querySelectorAll("[data-ia]").forEach(b=>b.onclick=()=>{const t=ai[+b.dataset.ia];t.poste="Intérim : "+st.nom;go({n:t.n,human:false,comp:Math.round(t.rep)})});
    el.querySelectorAll("[data-ix]").forEach(b=>b.onclick=()=>go(st.type==="poste"?{n:"Intérimaire désigné par l'administration",human:false,comp:55}:{n:"Personne (fermé)",human:false,comp:0,ferme:true}));
  });
  return true;
};
// après la prise de fonctions : proposer l'intérim au joueur choisi
EMP.afterMinister=function(S){
  const C=S.centre;if(!C||!C.interim.human||C.interim.sent)return;C.interim.sent=1;
  const M=mk(S);M.nm=M.nm||[];const i=nid();C.interim.c=i;
  M.nm.unshift({i,to:C.interim.pid,toName:C.interim.n,k:"interim",lab:"Intérim : "+C.nom+" (pendant le mandat de ministre de "+S.name+")",sal:C.sal});M.nm=M.nm.slice(0,5);if(W())W().publish(true);
};
EMP.centreMonth=function(S){
  const C=S.centre;if(!C||C.fin)return;const it=C.interim;
  if(it.ferme){C.last="fermé";return}
  const q=(it.comp||50)/70;let rec=0;
  if(C.type==="cabinet")rec=C.base*q*rnd(.8,1.2);else if(C.type==="ent")rec=C.base*(q-.3)*rnd(.6,1.4)*2;
  let sal=0;if(it.human){if(it.ok){sal=C.sal;pay(S,it.pid,it.c,sal,"interim")}}else if(C.type!=="poste")sal=C.sal;
  C.caisse+=Math.round(rec-sal);C.rep=clamp(C.rep+((it.comp||50)-60)*.06+rnd(-1,1),0,100);
  C.last=(rec?"recettes "+F(rec)+", ":"")+(sal?"salaire de l'intérimaire "+F(sal):"")+(it.human&&!it.ok?"l'intérimaire joueur n'a pas encore accepté":"");
  if(Math.random()<.35)inbox(S,{from:it.n+" (intérim)",t:"Rapport mensuel : "+C.nom,b:"Réputation : "+Math.round(C.rep)+"/100. Caisse accumulée pour votre retour : "+F(C.caisse)+".",k:"info"});
};
// réponse du joueur sollicité pour l'intérim (appelée par PRO.onPeers)
EMP.interimReply=function(S,nomi,ok,w){
  const C=S.centre;if(!C||!C.interim.human||C.interim.c!==nomi.i)return;
  if(ok){C.interim.ok=1;EMP.hire(S,{c:nomi.i,pid:w.id,name:w.n,poste:"Intérim : "+C.nom,sal:C.sal,interim:true});const x=mk(S).emp.find(z=>z.c===nomi.i);if(x)x.parCentre=1}
  else{C.interim={n:"Votre adjoint (personnage du jeu)",human:false,comp:55};inbox(S,{from:w.n,t:"Intérim refusé",b:w.n+" décline ; votre adjoint assure l'intérim.",k:"info"})}
};

/* ---------- sauvegarde du profil d'avant, et retour ---------- */
EMP.hasBefore=()=>{try{return!!localStorage.getItem(AVANT)}catch(e){return false}};
EMP.saveBefore=function(S){try{localStorage.setItem(AVANT,JSON.stringify({S,day:S.day}))}catch(e){}};
EMP.restore=function(S,why){
  let snap;try{snap=JSON.parse(localStorage.getItem(AVANT)||"null")}catch(e){}
  if(!snap)return G.toast("Aucun profil précédent enregistré.");
  const P=snap.S;const C=S.centre;const gain=S.bourse!=null&&S.bourseStart!=null?S.bourse-S.bourseStart:0;
  P.day=S.day;P.m=S.m;P.lastReal=Date.now();P.phase="play";P.cal.forEach(c=>{if(c.m<P.m)c.done=true});
  P.market=Object.assign({},S.market||{},{emp:((S.market||{}).emp||[]).filter(c=>!c.parCentre)});
  // fin de l'intérim : le joueur intérimaire est libéré d'un commun accord
  if(C&&C.interim.human&&C.interim.ok){const M=mk(S);M.ev.unshift({i:nid(),to:C.interim.pid,c:C.interim.c,ty:"fin",why:"Le titulaire reprend son centre : fin de l'intérim d'un commun accord."});P.market.ev=M.ev.slice(0,10)}
  let bilan="";
  if(C){const net=C.caisse;if(P.mode==="pro"){P.pro.fonds+=net+Math.max(0,gain);P.pro.rep=clamp(P.pro.rep*.5+C.rep*.5,0,100)}else if(P.mode==="ing"){P.ent.fonds+=net/1e6+Math.max(0,gain)/1e6;P.ent.rep=clamp(P.ent.rep*.5+C.rep*.5,0,100)}
    bilan=" Vous reprenez "+C.nom.replace(/^Votre/,"votre")+" : caisse de l'intérim "+F(net)+", réputation "+Math.round(C.rep)+"/100."}
  P.inbox=P.inbox||[];P.inbox.unshift({id:nid(),m:P.m,read:false,from:"État civil",t:"Retour à votre profil précédent",b:(why||"Vous quittez le gouvernement.")+bilan,k:"bonne"});
  try{localStorage.removeItem(AVANT)}catch(e){}
  G.loadState(P);G.toast("Vous retrouvez votre profil précédent");
};
})();
