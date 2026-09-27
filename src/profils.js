/* Chemin d'Etoudi — profils de jeu supplémentaires : Maire d'une commune, Ingénieur en génie civil (entreprise de BTP). */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const PROF={};window.PROF=PROF;
let uid=1;const nid=()=>"p"+Date.now().toString(36)+(uid++);
const inbox=(S,o)=>window.SYS.inbox(S,o);
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';

/* ======================= MAIRE ======================= */
PROF.setupMaire=function(){
  let reg="LT",party="RDPC";
  const draw=()=>{
    const R=CM.REG[reg];
    $("panel").innerHTML='<div><span class="eyebrow">Profil maire</span><h2 class="h2">Diriger une commune</h2></div><p>Vous êtes maire, élu en février 2020, mandat prorogé jusqu\'en février 2027. Budget communal, taxes, salubrité, projets, conseil municipal, médias locaux : faites-vous réélire.</p>'+
     VIE.identity("mn","ma",PROF._a||47,"Ex. Gisèle Ngo Mbock")+'<p class="small muted">Code électoral : il faut au moins 23 ans pour être conseiller municipal, donc maire.</p>'+
     '<label class="f" for="mr">Région<select id="mr">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===reg?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label>'+
     '<label class="f" for="mv">Commune<select id="mv">'+R.villes.map(v=>'<option>'+esc(v)+'</option>').join("")+'</select></label>'+
     '<label class="f" for="mp">Votre parti<select id="mp">'+CM.ORDRE.map(p=>'<option'+(p===party?" selected":"")+'>'+p+'</option>').join("")+'</select></label>'+
     '<div class="row"><button class="btn primary" id="go">Prendre mes fonctions à la mairie</button><button class="btn ghost" id="back">Retour</button></div>';
    if(PROF._n)$("mn").value=PROF._n;VIE.bindIdentity("ma");
    $("mr").onchange=()=>{PROF._n=$("mn").value;PROF._a=$("ma").value;reg=$("mr").value;draw()};$("back").onclick=G.home;
    $("go").onclick=()=>{const id=VIE.checkIdentity("mn","ma",23,"maire (conseiller municipal)");if(!id)return;const ville=$("mv").value;party=$("mp").value;G.newGame("opp",{name:id.name,age:id.age,party,home:reg,start:"2026",profil:"maire",ville})};
  };
  draw();
};
PROF.initMaire=function(S,o){
  const R=CM.REG[o.home],big=R.chef===o.ville;
  S.profil="maire";
  const P=S.opp;P.commune={ville:o.ville,reg:o.home,budget:big?3000:900,fonds:big?500:160,taxe:100,agents:big?420:110,mood:52,conseil:o.party===S.power?78:55,adjoint:window.SYS.nom(o.home)+" (premier adjoint)",lastChefs:-9,lastSalub:-30,lastFeicom:-60,lastJum:-90,lastConseil:-30};
  P.mandats=[{t:"Maire",lieu:o.ville,reg:o.home,m:-80}];P.cand.mun={reg:o.home,ville:o.ville};P.cand.leg={reg:o.home};
  P.noto=Math.max(P.noto,22);
};
function communeMood(S){const C=S.opp.commune;return clamp(C.mood*.6+S.mood[C.reg].v*.4,0,100)}
PROF.communeMood=communeMood;
PROF.renderMairie=function(S){
  const P=S.opp,C=P.commune;
  if(!C){$("panel").innerHTML='<div class="card"><h3 class="h2">Vous n\'êtes plus maire</h3><p>Vous avez perdu la mairie. Vous pouvez poursuivre comme responsable politique dans l\'onglet Mon parti.</p></div>';return}
  const m=communeMood(S),mi=window.SYS.moodInfo(m);
  const rec=(C.budget*.55/12)*(C.taxe/100)*(.7+m/200),dep=C.agents*.12;
  const j=(k,n)=>S.day-C[k]>=n;
  $("panel").innerHTML=window.SYS.mailCard(S)+
   '<div class="card"><div class="row" style="justify-content:space-between"><h3 class="h2">Mairie de '+esc(C.ville)+'</h3>'+pill(mi[1],m>=52?"ok":m>=40?"warn":"bad")+'</div><div class="kv"><span>Budget annuel voté</span><b>'+fmt(C.budget)+' M FCFA</b><span>Caisse disponible</span><b>'+fmt(C.fonds)+' M FCFA</b><span>Recettes estimées / mois</span><b>'+fmt(rec,1)+' M</b><span>Salaires des agents / mois</span><b>'+fmt(dep,1)+' M ('+C.agents+' agents)</b><span>Taxes communales (indice)</span><b>'+C.taxe+'</b><span>Majorité au conseil municipal</span><b>'+Math.round(C.conseil)+' %</b><span>Premier adjoint</span><b>'+esc(C.adjoint)+'</b></div><span class="small muted">Recettes : centimes additionnels communaux, taxes de marché et de stationnement, impôt libératoire, dotation générale de la décentralisation.</span></div>'+
   '<div class="card"><span class="eyebrow">Ce que disent les habitants</span><ul class="small" style="margin:0;padding-left:18px">'+(S.mood[C.reg].c.slice(0,5).map(c=>'<li style="color:'+(c.d>0?"var(--ok)":"var(--ink)")+'">'+esc(c.t)+'</li>').join("")||"<li>Rien de particulier.</li>")+'</ul></div>'+
   '<div class="card"><span class="eyebrow">Actions municipales</span>'+
    '<div class="row" style="justify-content:space-between"><span>Taxes de marché et communales</span><span class="row"><button class="btn small" id="tM">−10 %</button><button class="btn small" id="tP">+10 %</button></span></div>'+
    btn("salub","Opération de salubrité et ramassage des ordures (25 M)",!j("lastSalub",10))+
    btn("chefs","Réunir les chefs de quartier et les chefs traditionnels",!j("lastChefs",7))+
    btn("feicom","Demander une subvention au FEICOM",!j("lastFeicom",45))+
    btn("jum","Coopération décentralisée (jumelage avec une ville étrangère)",!j("lastJum",90))+
    btn("conseil","Session du conseil municipal : voter le budget",!j("lastConseil",30))+
    '<div class="row" style="justify-content:space-between"><span>Personnel communal</span><span class="row"><button class="btn small" id="aM">−20 agents</button><button class="btn small" id="aP">+20 agents</button></span></div></div>'+
   '<p class="small muted">Vos grands projets (forages, salles de classe, marché, éclairage) se lancent par appel d\'offres dans l\'onglet Projets. Prochaines municipales : '+esc(G.monthLabel((S.cal.find(c=>c.id==="leg")||{m:4}).m))+'.</p>';
  function btn(id,n,dis){return'<button class="choice" data-ma="'+id+'"'+(dis?" disabled":"")+'><span class="t">'+esc(n)+'</span></button>'}
  const Pn=$("panel");window.SYS.bindMail(S);
  const cause=(t,d)=>window.SYS.cause(S,C.reg,t+" à "+C.ville,d,"");
  $("tM").onclick=()=>{C.taxe=Math.max(50,C.taxe-10);C.mood=clamp(C.mood+3,0,100);cause("Baisse des taxes de marché",2);G.render()};
  $("tP").onclick=()=>{C.taxe=Math.min(160,C.taxe+10);C.mood=clamp(C.mood-4,0,100);cause("Hausse des taxes de marché : colère des commerçants",-3);G.render()};
  $("aM").onclick=()=>{C.agents=Math.max(20,C.agents-20);C.mood=clamp(C.mood-2,0,100);cause("Licenciement d'agents communaux",-2);G.render()};
  $("aP").onclick=()=>{C.agents+=20;C.mood=clamp(C.mood+1,0,100);G.render()};
  Pn.querySelectorAll("[data-ma]").forEach(b=>b.onclick=()=>{const id=b.dataset.ma;
    if(id==="salub"){if(C.fonds<25)return G.toast("Caisse insuffisante.");C.fonds-=25;C.lastSalub=S.day;C.mood=clamp(C.mood+5,0,100);cause("Grande opération de salubrité",3);G.viewRegion(C.reg,"marche");G.toast("Les rues sont nettoyées.")}
    else if(id==="chefs"){C.lastChefs=S.day;C.mood=clamp(C.mood+1.5,0,100);const top=S.mood[C.reg].c.find(c=>c.d<0);G.viewRegion(C.reg,"village");G.subs("Chefs de quartier","Monsieur le maire, nos populations se plaignent surtout de "+(top?top.t.charAt(0).toLowerCase()+top.t.slice(1):"l'état des rues et du manque d'eau")+". Elles attendent des actes avant les élections.",{voix:"f"})}
    else if(id==="feicom"){C.lastFeicom=S.day;const ok=Math.random()<.45+(C.conseil-50)/200;const f=ok?Math.round(rnd(40,160)):0;C.fonds+=f;inbox(S,{from:"FEICOM",t:ok?"Subvention accordée":"Demande en attente",b:ok?"Le Fonds spécial d'équipement et d'intervention intercommunale accorde "+f+" millions FCFA à la commune de "+C.ville+".":"Votre dossier est incomplet ou les fonds sont épuisés. Nouvelle demande possible dans quelques semaines.",k:ok?"bonne":"info"})}
    else if(id==="jum"){C.lastJum=S.day;const v=pick(["Nantes","Lyon","Bruxelles","Montréal","Hambourg","Anvers","Bordeaux"]);const f=Math.round(rnd(20,90));C.fonds+=f;S.opp.noto=clamp(S.opp.noto+2,0,100);inbox(S,{from:"Service de coopération",t:"Jumelage avec "+v,b:"Convention de coopération décentralisée signée avec "+v+" : "+f+" millions FCFA pour l'assainissement et la formation des agents municipaux.",k:"bonne"})}
    else if(id==="conseil"){C.lastConseil=S.day;const ok=Math.random()*100<C.conseil+5;if(ok){C.budget=Math.round(C.budget*1.05);inbox(S,{from:"Secrétariat général de la mairie",t:"Budget communal adopté",b:"Le conseil municipal adopte le budget ("+fmt(C.budget)+" M FCFA). La tutelle (préfet) l'approuvera.",k:"bonne"})}else{C.conseil=clamp(C.conseil-5,0,100);inbox(S,{from:"Secrétariat général de la mairie",t:"Budget rejeté",b:"Une partie des conseillers a voté contre. Le préfet pourrait être saisi.",k:"alerte"})}}
    G.render()});
};
function maireMonth(S){
  const C=S.opp&&S.opp.commune;if(!C)return;
  const m=communeMood(S);const rec=(C.budget*.55/12)*(C.taxe/100)*(.7+m/200);const dep=C.agents*.12;
  C.fonds+=rec-dep;
  if(C.fonds<0){C.mood=clamp(C.mood-6,0,100);window.SYS.cause(S,C.reg,"Les agents communaux de "+C.ville+" en grève : salaires impayés",-4,"emploi");C.fonds=0}
  C.mood=clamp(C.mood+(S.mood[C.reg].v-C.mood)*.05,0,100);
  C.conseil=clamp(C.conseil+(m-50)*.05,20,95);
}
PROF.afterElection=function(S,id){
  if(S.profil==="depute"&&id==="leg"){if(!S.opp.mandats.some(m=>m.t==="Député")){S.phase="over";S.fin=["Battu aux législatives","Votre liste n'a pas obtenu de siège dans la région. Vous quittez l'hémicycle."]}return}
  if(S.profil!=="maire"||id!=="leg")return;
  const P=S.opp;if(!P.mandats.some(m=>m.t==="Maire")){S.phase="over";S.fin=["Battu aux municipales","Les électeurs de "+(P.cand.mun.ville)+" ont choisi une autre liste. Vous remettez l'écharpe de maire à votre successeur."]}
  else if(P.commune)P.commune.mood=clamp(P.commune.mood+5,0,100);
};

/* ======================= INGÉNIEUR EN GÉNIE CIVIL ======================= */
PROF.setupIng=function(presec){
  let sec=presec||"btp";
  const draw=()=>{const X=E.SECTEURS[sec];
  $("panel").innerHTML='<div><span class="eyebrow">Profil chef d\'entreprise</span><h2 class="h2">Créer votre entreprise</h2></div><p>Choisissez votre domaine. Vous répondez aux appels d\'offres de l\'État, des communes, du privé et des autres joueurs, vous exécutez vos contrats dans les délais et selon le cahier des charges, et vous faites grandir votre entreprise.</p>'+
   '<label class="f" for="isec">Domaine d\'activité<select id="isec">'+Object.entries(E.SECTEURS).map(([k,v])=>'<option value="'+k+'"'+(k===sec?" selected":"")+'>'+esc(v.n)+'</option>').join("")+'</select></label>'+
   '<p class="small muted">Prestations : '+esc(W().services(sec).slice(0,4).map(x=>x[0]).join(", "))+'…</p>'+
   VIE.identity("in","ia",PROF._a||38,"Ex. Paul Tchinda")+
   '<label class="f" for="ie">Nom de l\'entreprise<input type="text" id="ie" maxlength="30" placeholder="Ex. Tchinda '+esc(X.n.split(" ")[0])+' SARL" autocomplete="off" value="'+esc(PROF._e||"")+'"></label>'+
   '<label class="f" for="ir">Siège<select id="ir">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id==="LT"?" selected":"")+'>'+esc(r.chef)+' ('+esc(r.n)+')</option>').join("")+'</select></label>'+
   '<p class="small muted">Capital de départ : '+X.cap+' millions FCFA · personnel : '+X.staff[0].toLowerCase()+', '+X.staff[1].toLowerCase()+' ; équipement : '+X.staff[2].toLowerCase()+'.</p>'+
   '<div class="row"><button class="btn primary" id="go">Ouvrir l\'entreprise</button><button class="btn ghost" id="back">Retour</button></div>';
  if(PROF._n)$("in").value=PROF._n;VIE.bindIdentity("ia");
  $("isec").onchange=()=>{PROF._n=$("in").value;PROF._a=$("ia").value;PROF._e=$("ie").value;sec=$("isec").value;draw()};
  $("back").onclick=G.home;
  $("go").onclick=()=>{const id=VIE.checkIdentity("in","ia",18,"gérant d'entreprise");if(!id)return;if(id.age<21)G.toast("Rappel : avant 21 ans (majorité civile), certains actes de commerce exigent une émancipation.");const reg=$("ir").value;G.newGame("ing",{name:id.name,age:id.age,home:reg,sector:sec,ent:$("ie").value.trim()||(E.SECTEURS[sec].n.split(" ")[0]+" Cameroun SARL")})};};
  draw();
};
const W=()=>window.WORLD;
const SECT=S=>E.SECTEURS[(S.ent&&S.ent.sector)||"btp"];
PROF.initIng=function(S,o){
  const X=E.SECTEURS[o.sector||"btp"],btp=(o.sector||"btp")==="btp";
  S.ent={sector:o.sector||"btp",nom:o.ent,reg:o.home,fonds:X.cap,emp:btp?30:12,ing:btp?3:2,engins:2,rep:50,ca:0,chantiers:[],ao:[],pret:0,impayes:0,dt:window.SYS.nom(o.home)+" (directeur technique)",nextAO:S.day+1,history:[],form:0};
  for(let i=0;i<3;i++)newAO(S);
};
const CLIENTS=[["Ministère des Travaux publics","MINTP","etat"],["Ministère de la Santé publique","MINSANTE","etat"],["Ministère de l'Éducation de base","MINEDUB","etat"],["Ministère de l'Eau et de l'Énergie","MINEE","etat"],["Commune","COM","commune"],["Société privée (industriel)","PRIV","prive"]];
const CLIENTS2=[["Présidence de la République","etat"],["Services du Premier ministre","etat"],["Ministère de la Santé publique","etat"],["Ministère de l'Administration territoriale","etat"],["Ministère des Enseignements secondaires","etat"],["Commune","commune"],["Société privée","prive"],["Organisation internationale","prive"]];
function newAO(S){
  const r=pick(CM.REGIONS);const ville=pick(r.villes);let ao;
  if(S.ent.sector==="btp"||!S.ent.sector){const cat=pick(E.PROJETS.filter(p=>p.id!=="port"&&p.id!=="caserne"&&E.secteurProjet(p.id)==="btp"));const cl=pick(CLIENTS);const budget=Math.round(cat.cout*1000*rnd(.85,1.2));
    ao={id:nid(),n:cat.n,pid:cat.id,reg:r.id,ville,client:cl[2]==="commune"?"Commune de "+ville:cl[0],type:cl[2],budget,mois:cat.mois,dl:S.day+Math.round(rnd(5,11)),inter:budget>15000,need:{ing:Math.max(1,Math.ceil(budget/8000)),emp:Math.max(10,Math.ceil(budget/400)),engins:budget>3000?Math.ceil(budget/12000)+1:0},bid:null,st:"ouvert"}}
  else{const sv=pick(SECT(S).services);const cl=pick(CLIENTS2);const budget=Math.round(sv[1]*rnd(.85,1.2));const heavy=["mines","eau","transport","agro"].includes(S.ent.sector);
    ao={id:nid(),n:sv[0],pid:null,reg:r.id,ville,client:cl[1]==="commune"?"Commune de "+ville:cl[0],type:cl[1],budget,mois:sv[2],dl:S.day+Math.round(rnd(4,9)),inter:budget>3000,need:{ing:Math.max(1,Math.ceil(budget/2500)),emp:Math.max(2,Math.ceil(budget/60)),engins:heavy?Math.max(1,Math.ceil(budget/3000)):(budget>200?1:0)},bid:null,st:"ouvert"}}
  S.ent.ao.unshift(ao);S.ent.ao=S.ent.ao.filter(a=>a.st!=="clos"||S.day-a.dl<20).slice(0,14);
}
function capacity(S){const e=S.ent;let ni=0,ne=0,ng=0;for(const c of e.chantiers.filter(c=>c.st==="cours")){ni+=c.need.ing;ne+=c.need.emp;ng+=c.need.engins}return{ing:e.ing-ni,emp:e.emp-ne,engins:e.engins-ng}}
PROF.dayTick=function(S){
  if(S.mode==="min")minDay(S);if(S.profil==="depute")depDay(S);
  if(S.mode!=="ing")return;const e=S.ent;
  if(S.day>=e.nextAO){e.nextAO=S.day+rnd(3,6);newAO(S);G.toast("Nouvel appel d'offres publié")}
  for(const a of e.ao){if(a.st==="ouvert"&&S.day>=a.dl)decideAO(S,a)}
};
function decideAO(S,a){
  a.st="clos";const e=S.ent;
  const n=a.inter?4:3;const bids=[];
  const pool=S.ent.sector&&S.ent.sector!=="btp"?SECT(S).ai:(a.inter?E.ENTREPRISES.inter:E.ENTREPRISES.local);
  for(let i=0;i<n;i++){const co=pick(pool);bids.push({co:co[0],prix:a.budget*rnd(.84,1.12),tech:clamp(co[2]+rnd(-12,10),30,95)})}
  let mine=null;
  if(a.bid){const b=a.bid;const cap=capacity(S);const lack=(cap.ing<a.need.ing?1:0)+(cap.emp<a.need.emp?1:0)+(cap.engins<a.need.engins?1:0);
    mine={co:e.nom,prix:a.budget*b.pct/100,tech:clamp(e.rep*.55+[10,22,32][b.qual]+e.form*2-lack*14,10,98),me:1,commission:b.commission};bids.push(mine)}
  const minP=Math.min(...bids.map(x=>x.prix));
  for(const x of bids){x.score=60*minP/x.prix+.4*x.tech+(x.commission?14:0)+(x.me&&a.type==="etat"&&e.rep<35?-5:0)}
  bids.sort((x,y)=>y.score-x.score);const w=bids[0];a.winner=w.co;
  if(mine&&mine.commission&&Math.random()<.2){inbox(S,{from:"Agence de régulation des marchés publics",t:"Enquête ouverte sur l'attribution",b:"L'ARMP et la CONAC enquêtent sur des soupçons de pots-de-vin dans l'attribution de « "+a.n+" » à "+a.ville+". Votre entreprise est citée. Le dossier est transmis au Tribunal criminel spécial.",k:"alerte"});window.SYS.newCase(S,"corruption",a.reg,1,a.ville);e.rep=clamp(e.rep-15,0,100);if(Math.random()<.35){S.phase="over";S.fin=["Condamné pour corruption","Le Tribunal criminel spécial vous condamne pour corruption dans l'attribution d'un marché public. Votre entreprise est liquidée."]}}
  if(w.me){const b=a.bid;const c={id:nid(),n:a.n,pid:a.pid,reg:a.reg,ville:a.ville,client:a.client,type:a.type,prix:w.prix,mois:b.mois,qual:b.qual,need:a.need,prog:0,spent:0,paid:0,start:S.m,due:S.m+b.mois,st:"cours",retards:0};
    const adv=c.prix*.2;e.fonds+=adv;c.paid+=adv;e.chantiers.unshift(c);e.won=e.won||{};e.won[a.type]=(e.won[a.type]||0)+1;
    inbox(S,{from:a.client,t:"Marché gagné : "+a.n,b:"Votre offre ("+fmt(w.prix)+" M FCFA, "+b.mois+" mois) est retenue pour « "+a.n+" » à "+a.ville+". Avance de démarrage de 20 % versée : "+fmt(adv)+" M FCFA. Ordre de service de commencer les travaux.",k:"bonne"});G.viewRegion(a.reg)}
  else if(a.bid)inbox(S,{from:a.client,t:"Offre non retenue : "+a.n,b:"Le marché est attribué à "+w.co+". Votre note : "+Math.round(mine.score)+" ; celle de l'attributaire : "+Math.round(w.score)+". "+(mine.prix>minP*1.05?"Votre prix était trop élevé.":"Votre note technique était insuffisante (renforcez vos équipes et votre réputation)."),k:"info"});
}
function ingMonth(S){
  const e=S.ent;if(!e)return;
  const X=SECT(S);const sal=e.emp*X.sal[1]+e.ing*X.sal[0]+e.engins*X.eq/30;e.fonds-=sal;
  if(e.pret)e.fonds-=e.pret*.0903/12;
  const cap=capacity(S);const staff=clamp(1+Math.min(cap.ing,cap.emp/10,cap.engins)/5,.4,1.1);
  for(const c of e.chantiers.filter(c=>c.st==="cours")){
    const costR=[.74,.83,.93][c.qual];const monthCost=c.prix*costR/c.mois;e.fonds-=monthCost;c.spent+=monthCost;
    let step=100/c.mois*staff*rnd(.75,1.1);
    const ev=Math.random();
    if(ev<.08){step*=.4;c.retards++;inbox(S,{from:e.dt,t:"Retard : pluies sur le chantier de "+c.ville,b:"La saison des pluies a noyé le chantier « "+c.n+" ». Les engins sont bloqués.",k:"info"})}
    else if(ev<.12){const v=Math.round(rnd(3,15));e.fonds-=v;inbox(S,{from:e.dt,t:"Vol de matériel à "+c.ville,b:"Du ciment et des fers à béton ont été volés : "+v+" M FCFA de pertes. Plainte déposée à la gendarmerie.",k:"alerte"})}
    else if(ev<.14){const v=Math.round(rnd(5,20));e.fonds-=v;e.rep=clamp(e.rep-3,0,100);inbox(S,{from:"Inspection du travail",t:"Accident sur le chantier de "+c.ville,b:"Un ouvrier a été blessé. Indemnisation et mise en conformité : "+v+" M FCFA.",k:"alerte"})}
    else if(ev<.17){window.SYS.cause(S,c.reg,"Les jeunes de "+c.ville+" réclament des emplois sur le chantier",-1,"emploi");inbox(S,{from:"Chef de quartier de "+c.ville,t:"Emplois locaux",b:"Les jeunes du quartier exigent d'être embauchés sur le chantier. Recrutez localement pour éviter des blocages.",k:"info"})}
    c.prog=clamp(c.prog+step,0,100);
    // paiements du client
    const due=c.prix*.7/c.mois;const late=c.type==="etat"?.35:c.type==="commune"?.3:c.type==="joueur"?0:.1;
    if(Math.random()<late){e.impayes+=due}else{e.fonds+=due;c.paid+=due}
    if(c.prog>=100)finishChantier(S,c);
  }
  if(e.impayes>0&&Math.random()<.25){const p=e.impayes*rnd(.3,.8);e.impayes-=p;e.fonds+=p;inbox(S,{from:"Trésor public",t:"Paiement d'arriérés",b:fmt(p)+" M FCFA d'impayés vous ont été réglés.",k:"bonne"})}
  e.ca=e.chantiers.reduce((a,c)=>a+c.paid,0);
  if(e.fonds<-60){S.phase="over";S.fin=["Liquidation judiciaire","Votre entreprise ne peut plus payer ses salariés ni ses fournisseurs. Le tribunal prononce la liquidation. Impayés de l'État au moment de la faillite : "+fmt(e.impayes)+" M FCFA."]}
}
function finishChantier(S,c){
  const e=S.ent;c.st="livre";e.won=e.won||{};e.won.liv=(e.won.liv||0)+1;
  const conf=clamp(Math.round(50+c.qual*15+e.form*3+e.rep*.15-c.retards*5+rnd(-10,10)),20,100);c.conf=conf;
  const late=S.m-c.due;const pen=late>0?c.prix*.01*late:0;e.fonds+=c.prix*.1-pen;c.paid+=c.prix*.1;
  e.rep=clamp(e.rep+(conf-60)/5-(late>0?late:0),0,100);
  const cat=E.PROJETS.find(x=>x.id===c.pid)||{n:c.n,mood:3,s:""};
  window.SYS.cause(S,c.reg,"Nouveau : "+cat.n.charAt(0).toLowerCase()+cat.n.slice(1)+" à "+c.ville+" (réalisé par "+e.nom+")",Math.round(cat.mood*conf/100),cat.s);
  if(cat.km)S.nums.routes+=cat.km*conf/100;
  if(c.type==="joueur"&&c.from&&W())W().deliver(S,c.from.i,c.from.pid,conf);
  const marge=c.paid-c.spent;
  inbox(S,{from:c.client,t:"Réception des travaux : "+c.n,b:"Conformité au cahier des charges : "+conf+" %. "+(late>0?late+" mois de retard, pénalités : "+fmt(pen)+" M FCFA. ":"Livré dans les délais. ")+"Retenue de garantie libérée. Marge du chantier : "+fmt(marge)+" M FCFA. Réputation : "+Math.round(e.rep)+"/100.",k:conf>=60?"bonne":"alerte"});
}
PROF.addPlayerContract=function(S,a){
  if(S.mode==="pro"&&window.PRO)return PRO.addPlayerContract(S,a);
  if(a.k==="emploi"&&window.EMP)return EMP.startJob(S,{c:a.i,pid:a.from,name:a.fromName,poste:a.t,sal:a.p*1e6});
  if(S.mode!=="ing"){window.SYS.inbox(S,{from:a.fromName,t:"Prestation attribuée",b:"« "+a.t+" » vous a été attribuée, mais votre profil actuel ne peut pas l'exécuter.",k:"info"});return}
  const e=S.ent;const reg=CM.REG[a.reg]?a.reg:e.reg;const m=Math.max(1,a.m||3);
  const c={id:nid(),n:a.t,pid:null,reg,ville:CM.REG[reg].chef,client:a.fromName+" (joueur)",type:"joueur",from:{i:a.i,pid:a.from},prix:a.p,mois:m,qual:1,need:{ing:1,emp:Math.max(2,Math.ceil(a.p/80)),engins:0},prog:0,spent:0,paid:0,start:S.m,due:S.m+m,st:"cours",retards:0};
  const adv=Math.round(a.p*.2);e.fonds+=adv;c.paid+=adv;
  e.chantiers.unshift(c);e.won=e.won||{};e.won.joueur=(e.won.joueur||0)+1;
  window.SYS.inbox(S,{from:a.fromName,t:"Contrat gagné auprès d'un joueur : "+a.t,b:a.fromName+" vous attribue « "+a.t+" » pour "+fmt(a.p)+" M FCFA, à livrer en "+m+" mois. La livraison lui sera notifiée automatiquement.",k:"bonne"});G.toast("Contrat gagné : "+a.t);
};
PROF.monthTick=function(S){if(S.mode==="ing")ingMonth(S);if(S.profil==="maire")maireMonth(S);if(S.mode==="min")minMonth(S);if(S.profil==="depute")depMonth(S)};

PROF.gauges=function(S){
  if(S.mode==="pro"&&window.PRO)return PRO.gauges(S);
  if(S.mode==="ing"){const e=S.ent,cap=capacity(S),X=SECT(S);return[["Trésorerie",fmt(e.fonds)+" M",clamp(e.fonds/2,2,100)],["Réputation",Math.round(e.rep),e.rep],[X.staff[1],e.emp+" ("+cap.emp+" libres)",Math.min(100,e.emp*2)],[X.staff[0],e.ing+" ("+cap.ing+" libres)",e.ing*12],[X.staff[2],e.engins,e.engins*15],["Impayés",fmt(e.impayes)+" M",100-Math.min(100,e.impayes/2)]]}
  if(S.profil==="maire"&&S.opp.commune){const C=S.opp.commune,m=communeMood(S);return[["Humeur",Math.round(m),m],["Caisse",fmt(C.fonds)+" M",clamp(C.fonds/5,2,100)],["Conseil",Math.round(C.conseil)+" %",C.conseil],["Notoriété",Math.round(S.opp.noto),S.opp.noto],["Taxes",C.taxe,100-Math.abs(C.taxe-100)],["Agents",C.agents,60]]}
  if(S.mode==="min"){const M=S.minis;return[["Confiance",Math.round(M.conf),M.conf],["Performance",Math.round(M.perf),M.perf],["Crédits",fmt(M.fonds)+" M",clamp(M.fonds/(M.b*3),2,100)],["Secteur",Math.round(S.st[M.s]||0),S.st[M.s]||0],["Popularité",Math.round(S.st.pop),S.st.pop],["Humeur",Math.round(window.SYS.nationalMood(S)),window.SYS.nationalMood(S)]]}
  if(S.profil==="depute"&&S.opp.dep){const D=S.opp.dep,m=S.mood[D.reg].v;return[["Circonscription",Math.round(m),m],["Discipline",Math.round(D.disc),D.disc],["Micro-projets",fmt(D.fonds)+" M",clamp(D.fonds*4,2,100)],["Notoriété",Math.round(S.opp.noto),S.opp.noto],["Militants",fmt(S.opp.militants),Math.min(100,S.opp.militants/600)],["Trésorerie",fmt(S.opp.fonds)+" M",Math.min(100,S.opp.fonds)]]}
  return null;
};

/* ---------- onglets de l'ingénieur ---------- */
PROF.renderEnt=function(S){
  const e=S.ent,cap=capacity(S),X=SECT(S);
  $("panel").innerHTML=window.SYS.mailCard(S)+'<div class="card"><h3 class="h2">'+esc(e.nom)+'</h3><span class="small muted">'+esc(X.n)+' · siège : '+esc(CM.REG[e.reg].chef)+' · gérant : '+esc(S.name)+' · '+esc(e.dt)+'</span><div class="kv"><span>Trésorerie</span><b>'+fmt(e.fonds)+' M FCFA</b><span>Chiffre d\'affaires encaissé</span><b>'+fmt(e.ca)+' M</b><span>Impayés des clients</span><b>'+fmt(e.impayes)+' M</b><span>Emprunt bancaire</span><b>'+fmt(e.pret)+' M (9,03 %)</b><span>Masse salariale / mois</span><b>'+fmt(e.emp*X.sal[1]+e.ing*X.sal[0],1)+' M</b><span>Réputation</span><b>'+Math.round(e.rep)+'/100</b><span>Niveau de formation</span><b>'+e.form+'</b></div></div>'+
   '<div class="card"><span class="eyebrow">Moyens</span>'+
    row(X.staff[1]+" : "+e.emp+" ("+cap.emp+" disponibles)","emp","+"+(e.sector==="btp"?10:5)+" ("+fmt(X.sal[1]*(e.sector==="btp"?10:5),1)+" M/mois)")+row(X.staff[0]+" : "+e.ing+" ("+cap.ing+" disponibles)","ing","+1 ("+fmt(X.sal[0],1)+" M/mois)")+row(X.staff[2]+" : "+e.engins+" ("+cap.engins+" disponibles)","eng","Acheter ("+X.eq+" M)")+
    '<div class="row"><button class="btn small" id="eLoan">Emprunter 50 M à la banque</button><button class="btn small" id="eRep"'+(e.pret<50||e.fonds<50?" disabled":"")+'>Rembourser 50 M</button><button class="btn small" id="eForm">Former les équipes (8 M)</button><button class="btn small" id="eTres"'+(e.impayes<=0?" disabled":"")+'>Relancer le Trésor pour les impayés</button><button class="btn small" id="eGecam">Adhérer au GECAM (2 M)</button><button class="btn small primary" id="eSous">Rechercher un sous-traitant</button></div></div>'+
   '<div class="card"><span class="eyebrow">Historique</span><div class="log">'+(e.chantiers.filter(c=>c.st==="livre").map(c=>'<div>'+esc(c.n)+' à '+esc(c.ville)+' · conformité '+c.conf+' %</div>').join("")||'<div class="muted">Aucun chantier livré.</div>')+'</div></div>';
  function row(t,id,lab){return'<div class="row" style="justify-content:space-between"><span>'+esc(t)+'</span><button class="btn small" data-hire="'+id+'">'+esc(lab)+'</button></div>'}
  window.SYS.bindMail(S);
  $("panel").querySelectorAll("[data-hire]").forEach(b=>b.onclick=()=>{const id=b.dataset.hire;if(id==="emp")e.emp+=e.sector==="btp"?10:5;else if(id==="ing")e.ing+=1;else{if(e.fonds<X.eq)return G.toast("Trésorerie insuffisante.");e.fonds-=X.eq;e.engins++}G.render()});
  $("eSous").onclick=()=>{G.setTab("marche");W().openPost(S)};
  $("eLoan").onclick=()=>{if(e.pret>=300)return G.toast("La banque refuse : endettement trop élevé.");const ok=Math.random()<.4+e.rep/150;if(!ok){G.toast("La banque refuse votre dossier (crédit rare en 2026).");return}e.pret+=50;e.fonds+=50;G.toast("Prêt accordé à 9,03 %.");G.render()};
  $("eRep").onclick=()=>{e.pret-=50;e.fonds-=50;G.render()};
  $("eForm").onclick=()=>{if(e.fonds<8)return G.toast("Trésorerie insuffisante.");e.fonds-=8;e.form++;G.toast("Équipes formées : meilleure qualité.");G.render()};
  $("eTres").onclick=()=>{const ok=Math.random()<.3;if(ok){const p=e.impayes*.5;e.impayes-=p;e.fonds+=p;G.toast("Le Trésor paie "+fmt(p)+" M FCFA.")}else G.toast("« Votre dossier est en cours de traitement. »");G.render()};
  $("eGecam").onclick=()=>{if(e.fonds<2)return;e.fonds-=2;e.rep=clamp(e.rep+2,0,100);G.toast("Vous rejoignez le GECAM.");G.render()};
};
PROF.renderAO=function(S){
  const e=S.ent;const open=e.ao.filter(a=>a.st==="ouvert"),closed=e.ao.filter(a=>a.st==="clos").slice(0,5);
  $("panel").innerHTML='<div class="card"><span class="eyebrow">Appels d\'offres ouverts</span><span class="small muted">Code des marchés publics : note financière (60 %) et note technique (40 %). La note technique dépend de votre réputation, de la qualité proposée et des moyens disponibles.</span></div>'+
   (open.length?open.map(a=>'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(a.n)+'</b>'+pill(a.inter?"International":"National",a.inter?"warn":"ok")+'</div><span class="small muted">'+esc(a.client)+' · '+esc(a.ville)+' ('+esc(CM.REG[a.reg].n)+') · budget estimé '+fmt(a.budget)+' M FCFA · '+a.mois+' mois · dépôt avant le '+esc(G.dayLabel(a.dl))+'</span><span class="small">Moyens exigés : '+a.need.ing+' '+SECT(S).staff[0].toLowerCase()+', '+a.need.emp+' '+SECT(S).staff[1].toLowerCase()+(a.need.engins?", "+a.need.engins+" "+SECT(S).staff[2].toLowerCase():"")+'</span>'+(a.bid?'<span class="small" style="color:var(--y)">Offre déposée : '+a.bid.pct+' % du budget, '+a.bid.mois+' mois, qualité '+["économique","standard","premium"][a.bid.qual]+(a.bid.commission?", avec « commission »":"")+'</span>':'<button class="btn small primary" data-bid="'+a.id+'" style="align-self:flex-start">Préparer une offre</button>')+'</div>').join(""):'<p class="small muted">Aucun appel d\'offres ouvert. De nouveaux sont publiés tous les quelques jours.</p>')+
   (closed.length?'<span class="eyebrow">Derniers résultats</span>'+closed.map(a=>'<div class="small">'+esc(a.n)+' à '+esc(a.ville)+' : attribué à <b>'+esc(a.winner||"—")+'</b></div>').join(""):"");
  $("panel").querySelectorAll("[data-bid]").forEach(b=>b.onclick=()=>bidSheet(S,e.ao.find(a=>a.id===b.dataset.bid)));
};
function bidSheet(S,a){
  let qual=1;
  G.sheet('<h3 class="h2">Offre : '+esc(a.n)+'</h3><span class="small muted">Budget estimé du maître d\'ouvrage : '+fmt(a.budget)+' M FCFA · délai indicatif '+a.mois+' mois</span>'+
   '<label class="f" for="bP">Prix proposé (% du budget) : <b id="bPv">95</b> %<input type="range" id="bP" min="70" max="130" value="95"></label>'+
   '<label class="f" for="bM">Délai proposé (mois)<input type="number" id="bM" min="'+Math.max(1,Math.round(a.mois*.6))+'" max="'+Math.round(a.mois*1.6)+'" value="'+a.mois+'"></label>'+
   '<span class="eyebrow">Qualité des matériaux et des méthodes</span><div class="grid2">'+["Économique","Standard","Premium"].map((q,i)=>'<button class="opt" data-q="'+i+'" aria-pressed="'+(i===1)+'"><b>'+q+'</b><span>Coût '+[74,83,93][i]+' % du prix</span></button>').join("")+'</div>'+
   '<label class="row small" for="bC" style="gap:10px;align-items:flex-start"><input type="checkbox" id="bC"> <span>Verser une « commission » à un membre de la commission de passation. <b style="color:var(--bad)">Illégal</b> : la corruption est un délit (Code pénal) ; enquêtes de l\'ARMP et de la CONAC, Tribunal criminel spécial.</span></label>'+
   '<button class="btn primary" id="bGo">Déposer l\'offre</button>',el=>{
    el.querySelector("#bP").oninput=ev=>el.querySelector("#bPv").textContent=ev.target.value;
    el.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{qual=+b.dataset.q;el.querySelectorAll("[data-q]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
    el.querySelector("#bGo").onclick=()=>{const com=el.querySelector("#bC").checked;if(com){if(S.ent.fonds<5)return G.toast("Trésorerie insuffisante.");S.ent.fonds-=5}
      a.bid={pct:+el.querySelector("#bP").value,mois:Math.max(1,+el.querySelector("#bM").value||a.mois),qual,commission:com};el.remove();G.toast("Offre déposée. Résultat le "+G.dayLabel(a.dl)+".");G.render()};
  });
}
PROF.renderChantiers=function(S){
  const e=S.ent;const cs=e.chantiers.filter(c=>c.st==="cours");
  $("panel").innerHTML='<div class="card"><span class="eyebrow">Chantiers en cours</span><span class="small muted">L\'avancement dépend de vos ingénieurs, ouvriers et engins disponibles. Les clients publics paient souvent en retard.</span></div>'+
   (cs.length?cs.map(c=>'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(c.n)+'</b><span class="small">'+Math.round(c.prog)+' %</span></div><div class="bar" style="height:10px"><i style="width:'+c.prog+'%"></i></div><span class="small muted">'+esc(c.client)+' · '+esc(c.ville)+' · marché de '+fmt(c.prix)+' M · livraison prévue en '+esc(G.monthLabel(c.due))+' · dépensé '+fmt(c.spent)+' M · encaissé '+fmt(c.paid)+' M · qualité '+["économique","standard","premium"][c.qual]+'</span><div class="row"><button class="btn small" data-see="'+c.reg+'">Voir le site</button><button class="btn small" data-boost="'+c.id+'">Heures supplémentaires (5 M)</button></div></div>').join(""):'<p class="small muted">Aucun chantier en cours. Gagnez un appel d\'offres !</p>');
  $("panel").querySelectorAll("[data-see]").forEach(b=>b.onclick=()=>G.viewRegion(b.dataset.see,"village"));
  $("panel").querySelectorAll("[data-boost]").forEach(b=>b.onclick=()=>{const c=e.chantiers.find(x=>x.id===b.dataset.boost);if(e.fonds<5)return G.toast("Trésorerie insuffisante.");e.fonds-=5;c.prog=Math.min(100,c.prog+100/c.mois*.4);if(c.prog>=100)finishChantier(S,c);G.toast("Le chantier accélère.");G.render()});
};
/* ======================= MINISTRE ======================= */
const MIN_DOSSIERS={MINSANTE:["csu","cholera"],MINTP:["autoroute","nord_route"],MINEE:["eneo","camwater"],MINDEF:["bh","noso","otages"],DGSN:["otages","motos"],MINATD:["noso","refugies","inondations"],MINJUSTICE:["detenus","art66"],MINREX:["russie","double"],MINCOMMERCE:["cacao","vie_chere"],MINFI:["carburant","fmi"],MINEPAT:["fmi","mines"],MINEDUB:["ots"],MINESEC:["ots"],MINESUP:["univ"],MINDCAF:["foncier"],MINFOF:["foret"],MINMIDT:["mines"],MINT:["motos","kribi"],MINPOSTEL:["cyber"],MINCOM:["cyber"],MINSEP:["fecafoot"],MINADER:["agri_ouest","cacao"],MINEPIA:["foncier"],MINDDEVEL:["noso"],MINFOPRA:["ots"],MINCONSUPE:["art66"],MINMAP:["autoroute"]};
const GEN=[
 {t:"Grève des agents du ministère",x:"Les agents réclament le paiement de primes en retard. Les services tournent au ralenti.",c:[["Payer les primes en retard",{perf:2,conf:-1,fonds:-150}],["Négocier un calendrier de paiement",{perf:1}],["Sanctionner les meneurs",{perf:-2,conf:1,mood:-2}]]},
 {t:"Audit du Contrôle supérieur de l'État",x:"Une mission du CONSUPE s'installe dans vos services pour vérifier la gestion des crédits.",c:[["Coopérer pleinement",{conf:3,perf:1}],["Retarder la remise des pièces",{conf:-5}],["Limoger le directeur des affaires financières",{conf:2,perf:-1}]]},
 {t:"Crédits insuffisants",x:"Au milieu de l'exercice, vos crédits d'investissement sont presque épuisés.",c:[["Demander une rallonge au ministre des Finances",{rallonge:1}],["Redéployer les crédits entre programmes",{perf:-1}],["Geler des projets",{perf:-3,mood:-1}]]},
 {t:"Visite de terrain annoncée par la Présidence",x:"Le cabinet civil annonce une visite de vos chantiers phares.",c:[["Préparer sérieusement les chantiers",{fonds:-100,conf:4,perf:1}],["Maquiller les retards",{conf:2,risque:1}],["Dire la vérité sur les retards",{conf:-1,perf:1}]]},
 {t:"Révélations de la presse",x:"Un journal accuse un directeur de votre ministère de surfacturations.",c:[["Démentir en bloc",{conf:-1,mood:-1}],["Ouvrir une enquête interne",{conf:2,perf:1}],["Suspendre le directeur mis en cause",{conf:3}]]},
 {t:"Nomination d'un directeur général",x:"Le poste de directeur général d'un établissement sous tutelle est vacant.",c:[["Un technocrate compétent",{perf:3}],["Un cadre influent du parti",{conf:3,perf:-1}],["Une personnalité de votre région",{conf:-1,mood:1}]]},
 {t:"Conseil de cabinet chez le Premier ministre",x:"Chaque ministre doit présenter l'état d'avancement de ses programmes.",c:[["Présenter un bilan chiffré",{bilan:1}],["Réclamer plus de moyens",{rallonge:.5,conf:-1}],["Rester discret",{}]]},
 {t:"Réforme proposée par vos services",x:"Vos cadres proposent une réforme ambitieuse pour moderniser le secteur.",c:[["Porter la réforme",{perf:4,conf:-1}],["La tester dans une région",{perf:2}],["La mettre au placard",{perf:-1}]]}
];
PROF.setupMin=function(){
  $("panel").innerHTML='<div><span class="eyebrow">Profil ministre</span><h2 class="h2">Entrer au gouvernement</h2></div><p>Vous êtes nommé ministre par décret du président de la République. Gérez votre budget, vos dossiers, vos marchés publics et vos médias. Gardez la confiance du chef de l\'État : un remaniement peut tomber à tout moment.</p>'+
   VIE.identity("nn","na",52,"Ex. Aminatou Bello")+'<p class="small muted">Aucun âge minimum légal pour être ministre, mais un ministre doit jouir de ses droits civiques.</p>'+
   '<label class="f" for="nm">Ministère<select id="nm">'+E.MINISTERES.map(m=>'<option value="'+m.id+'">'+esc(m.id)+' · '+esc(m.n)+' ('+fmt(m.b,1)+' Mds'+(m.est?"*":"")+')</option>').join("")+'</select></label>'+
   '<label class="f" for="nr">Région d\'origine<select id="nr">'+CM.REGIONS.map(r=>'<option value="'+r.id+'">'+esc(r.n)+'</option>').join("")+'</select></label>'+
   '<div class="row"><button class="btn primary" id="go">Prêter serment et prendre mes fonctions</button><button class="btn ghost" id="back">Retour</button></div>';
  $("back").onclick=G.home;VIE.bindIdentity("na");
  $("go").onclick=()=>{const id=VIE.checkIdentity("nn","na",21,"ministre (majorité civile)");if(!id)return;G.newGame("min",{name:id.name,age:id.age,home:$("nr").value,ministere:$("nm").value})};
};
PROF.initMin=function(S,o){
  const m=E.MINISTERES.find(x=>x.id===o.ministere);
  S.minis={id:m.id,n:m.n,s:m.s,b:m.b,fonds:Math.round(m.b*1000*.35/12*3),conf:62,perf:50,deck:[],cur:null,nextD:S.day+1,used:{},home:o.home,tdv:"normal",risque:0};
};
function minDeck(S){const ids=MIN_DOSSIERS[S.minis.id]||[];const list=ids.map(id=>({real:CM.DOSSIERS.find(d=>d.id===id)})).filter(x=>x.real).concat(GEN.map(g=>({gen:g})));for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]]}return list}
function minDraw(S){const M=S.minis;if(!M.deck.length)M.deck=minDeck(S);M.cur=M.deck.pop();G.toast("Nouveau dossier au ministère")}
function minApply(S,e){const M=S.minis;
  if(e.perf)M.perf=clamp(M.perf+e.perf,0,100);if(e.conf)M.conf=clamp(M.conf+e.conf,0,100);if(e.fonds)M.fonds+=e.fonds;
  if(e.mood)window.SYS.cause(S,M.home,"Décision du ministre "+M.id,e.mood,"");
  if(e.risque)M.risque+=e.risque;
  if(e.rallonge){const ok=Math.random()<.35+M.conf/200;const f=ok?Math.round(M.b*1000*.05*e.rallonge):0;M.fonds+=f;window.SYS.inbox(S,{from:"Ministère des Finances",t:ok?"Rallonge accordée":"Rallonge refusée",b:ok?f+" millions FCFA de crédits supplémentaires.":"Le budget 2026 ne permet aucune rallonge. Redéployez vos crédits.",k:ok?"bonne":"info"})}
  if(e.bilan){const good=M.perf>=50;M.conf=clamp(M.conf+(good?3:-3),0,100);window.SYS.inbox(S,{from:"Services du Premier ministre",t:"Conseil de cabinet",b:good?"Votre bilan chiffré a été salué par le Premier ministre.":"Votre bilan a été jugé insuffisant devant vos collègues.",k:good?"bonne":"alerte"})}
}
PROF.renderMin=function(S){
  const M=S.minis,mi=E.MINISTERES.find(x=>x.id===M.id);const d=M.cur;
  let dos;
  if(!d)dos='<div class="card"><p>Aucun dossier urgent. Prochain dossier vers le '+esc(G.dayLabel(M.nextD))+'.</p><button class="btn" id="mnNext">Avancer jusqu\'au prochain dossier</button></div>';
  else if(d.real)dos='<div class="card"><div class="stamp"><span>'+esc(d.real.f)+'</span></div><h3 class="h2">'+esc(d.real.t)+'</h3><p>'+esc(d.real.x)+'</p><div class="choices">'+d.real.c.map((c,i)=>'<button class="choice" data-dc="'+i+'"><span class="t">'+esc(c.t)+'</span></button>').join("")+'</div></div>';
  else dos='<div class="card"><div class="stamp"><span>Cabinet du ministre</span></div><h3 class="h2">'+esc(d.gen.t)+'</h3><p>'+esc(d.gen.x)+'</p><div class="choices">'+d.gen.c.map((c,i)=>'<button class="choice" data-dc="'+i+'"><span class="t">'+esc(c[0])+'</span></button>').join("")+'</div></div>';
  const j=(k,n)=>S.day-(M.used[k]||-99)>=n;
  $("panel").innerHTML=window.SYS.mailCard(S)+'<div class="card"><h3 class="h2">'+esc(mi.n)+'</h3><span class="small muted">'+esc(S.name)+' · '+esc(mi.rang||"Ministre")+' · pôle '+esc(mi.cat)+'</span><div class="kv"><span>Dotation 2026'+(mi.est?" (estimation)":"")+'</span><b>'+fmt(M.b,1)+' Mds FCFA</b><span>Crédits d\'investissement disponibles</span><b>'+fmt(M.fonds)+' M FCFA</b><span>Confiance du chef de l\'État</span><b>'+Math.round(M.conf)+'/100</b><span>Performance du ministère</span><b>'+Math.round(M.perf)+'/100</b><span>Indicateur national du secteur</span><b>'+Math.round(S.st[M.s]||0)+'/100</b><span>Train de vie du cabinet</span><b>'+({austere:"austère",normal:"normal",luxe:"luxueux"}[M.tdv])+'</b></div></div>'+
   '<span class="eyebrow">Dossiers du ministère</span>'+dos+
   '<div class="card"><span class="eyebrow">Actions du ministre</span><div class="grid2">'+
    '<button class="btn small" id="mnTour"'+(j("tour",7)?"":" disabled")+'>Tournée de terrain</button><button class="btn small" id="mnDir"'+(j("dir",7)?"":" disabled")+'>Conseil de direction</button><button class="btn small" id="mnRap"'+(j("rap",30)?"":" disabled")+'>Rapport au chef de l\'État</button><button class="btn small" id="mnEtude">Commander une étude à mes services</button><button class="btn small" id="mnTdv">Train de vie du cabinet</button><button class="btn small" id="mnProj">Lancer un appel d\'offres</button></div></div>';
  window.SYS.bindMail(S);const P=$("panel");
  const nx=$("mnNext");if(nx)nx.onclick=()=>G.advanceDays(Math.max(.1,M.nextD-S.day+.01),false);
  P.querySelectorAll("[data-dc]").forEach(b=>b.onclick=()=>{const i=+b.dataset.dc;
    if(d.real){const ch=d.real.c[i];const e=ch.e||{};const sum=Object.values(e).reduce((a,v)=>a+(Array.isArray(v)?(v[0]+v[1])/2:v),0);
      for(const k in e){let v=e[k];if(Array.isArray(v))v=rnd(v[0],v[1]);if(S.st[k]!=null)S.st[k]=clamp(S.st[k]+v*.5,0,100)}
      if(ch.n&&ch.n.dette>0)M.fonds-=ch.n.dette*300;
      if(ch.reg)for(const r in ch.reg)window.SYS.cause(S,r,ch.h,ch.reg[r]>0?3:-3,"");
      minApply(S,{perf:sum*.35,conf:sum*.2+(e.pop||0)*.2});window.SYS.inbox(S,{from:"Cabinet du ministre",t:ch.h,b:"Décision prise : « "+ch.t+" ».",k:"info",read:true})}
    else{minApply(S,d.gen.c[i][1])}
    if(M.fonds<0){M.conf=clamp(M.conf-4,0,100);window.SYS.inbox(S,{from:"Contrôleur financier",t:"Dépassement de crédits",b:"Vos engagements dépassent les crédits disponibles. Le ministre des Finances s'en plaint au Premier ministre.",k:"alerte"})}
    M.cur=null;M.nextD=S.day+rnd(3,7);G.render()});
  $("mnTour").onclick=()=>{M.used.tour=S.day;const r=pick(CM.REGIONS);M.fonds-=20;M.conf=clamp(M.conf+1,0,100);M.perf=clamp(M.perf+1,0,100);window.SYS.cause(S,r.id,"Tournée du ministre "+M.id+" à "+r.chef,2,"");G.viewRegion(r.id,"village");G.subs("Tournée du ministre","Je suis venu constater par moi-même l'état de nos services à "+r.chef+". Les instructions sont claires : les travaux doivent avancer et les usagers doivent être servis.");G.render()};
  $("mnDir").onclick=()=>{M.used.dir=S.day;M.perf=clamp(M.perf+1.5,0,100);G.setView({overlay:"conseil"},"Ministère","Conseil de direction");G.toast("Conseil de direction tenu");G.render()};
  $("mnRap").onclick=()=>{M.used.rap=S.day;const good=M.perf>=55;M.conf=clamp(M.conf+(good?4:-2),0,100);window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Rapport transmis au chef de l'État",b:good?"Le chef de l'État a pris connaissance de vos résultats avec satisfaction.":"Le rapport suscite des interrogations sur l'exécution de vos programmes.",k:good?"bonne":"alerte"});G.render()};
  $("mnEtude").onclick=()=>{const dom={sec:"sec",eco:"eco",soc:M.id==="MINSANTE"?"sante":"edu",infra:"btp",int:"diplo",pop:"com"}[M.s]||"eco";window.SYS.askReport(S,"Direction des études du "+M.id,dom,dom==="eco"?"dette":"region",M.home,70);G.toast("Étude commandée à vos services");G.render()};
  $("mnTdv").onclick=()=>G.sheet('<h3 class="h2">Train de vie du cabinet</h3><button class="choice" data-t="austere"><span class="t">Austère</span><span class="small muted">Économies, bonne image, collaborateurs mécontents.</span></button><button class="choice" data-t="normal"><span class="t">Normal</span></button><button class="choice" data-t="luxe"><span class="t">Luxueux</span><span class="small muted">Véhicules neufs, missions : risque de scandale.</span></button>',el=>el.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{M.tdv=b.dataset.t;el.remove();G.render()}));
  $("mnProj").onclick=()=>G.setTab("projets");
  if(d&&d.real)G.viewRegion(d.real.lieu||"CE");
};
function minMonth(S){
  const M=S.minis;if(!M)return;
  M.fonds+=Math.round(M.b*1000*.35/12);
  M.perf=clamp(M.perf+((S.st[M.s]||50)-50)*.03+rnd(-1,1),0,100);
  M.conf=clamp(M.conf+(M.perf-50)*.04-(M.tdv==="luxe"?0:0)+rnd(-1.5,1),0,100);
  if(S.st[M.s]!=null)S.st[M.s]=clamp(S.st[M.s]+(M.perf-50)*.02,0,100);
  if(M.tdv==="luxe"&&Math.random()<.12){M.conf=clamp(M.conf-6,0,100);window.SYS.cause(S,"CE","Scandale : le train de vie du ministre "+M.id,-3,"corruption");window.SYS.inbox(S,{from:"Revue de presse",t:"Scandale sur votre train de vie",b:"La presse révèle l'achat de véhicules de luxe par votre cabinet.",k:"alerte"})}
  if(M.tdv==="austere")M.perf=clamp(M.perf-.3,0,100);
  if(M.risque&&Math.random()<.15*M.risque){M.risque=0;M.conf=clamp(M.conf-8,0,100);window.SYS.inbox(S,{from:"Cabinet civil",t:"Les retards découverts",b:"La Présidence a découvert que les chantiers avaient été maquillés lors de la visite.",k:"alerte"})}
  if(M.conf<25&&Math.random()<.4){S.phase="over";S.fin=["Limogé par décret","Un décret présidentiel lu à la radio nationale met fin à vos fonctions. Confiance du chef de l'État : "+Math.round(M.conf)+"/100."];return}
  if(M.conf>80&&M.perf>70&&Math.random()<.1)window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Vos résultats sont remarqués",b:"Votre nom circule pour un poste de ministre d'État lors du prochain remaniement.",k:"bonne"});
}

/* ======================= DÉPUTÉ ======================= */
const LOIS=[
 {t:"Loi de finances rectificative : hausse de la TVA sur certains produits",gov:1,pop:-1},
 {t:"Révision du Code électoral : bulletin unique et fichier audité",gov:0,pop:1},
 {t:"Prorogation du mandat des conseillers municipaux",gov:1,pop:-1},
 {t:"Ratification d'un prêt pour la phase 2 de l'autoroute Yaoundé-Douala",gov:1,pop:0},
 {t:"Proposition de loi sur la double nationalité",gov:0,pop:1},
 {t:"Renforcement de la loi sur la cybercriminalité",gov:1,pop:-1},
 {t:"Statut de l'opposition parlementaire",gov:0,pop:1},
 {t:"Loi sur les partenariats public-privé",gov:1,pop:0},
 {t:"Amnistie pour les détenus de l'après-présidentielle",gov:0,pop:1},
 {t:"Renforcement du statut spécial du Nord-Ouest et du Sud-Ouest",gov:1,pop:1},
 {t:"Création d'une couverture santé universelle obligatoire",gov:1,pop:1},
 {t:"Suppression progressive de la subvention du carburant",gov:1,pop:-1}
];
PROF.setupDep=function(){
  $("panel").innerHTML='<div><span class="eyebrow">Profil député</span><h2 class="h2">Siéger à l\'Assemblée nationale</h2></div><p>Élu en 2020, votre mandat court jusqu\'aux prochaines législatives. Votez les lois, interpellez le gouvernement, défendez votre circonscription et financez des micro-projets. Discipline de parti ou fidélité à vos électeurs : à vous de choisir.</p>'+
   VIE.identity("dn","da",50,"Ex. Honorable Tabi Enow")+'<p class="small muted">Code électoral : il faut au moins 23 ans pour être député.</p>'+
   '<label class="f" for="dr">Circonscription (région)<select id="dr">'+CM.REGIONS.map(r=>'<option value="'+r.id+'">'+esc(r.n)+' ('+r.seats+' députés)</option>').join("")+'</select></label>'+
   '<label class="f" for="dp">Votre parti<select id="dp">'+["RDPC","UNDP","SDF","PCRN","UDC","FSNC"].map(p=>'<option>'+p+'</option>').join("")+'</select></label>'+
   '<div class="row"><button class="btn primary" id="go">Rejoindre l\'hémicycle</button><button class="btn ghost" id="back">Retour</button></div>';
  $("back").onclick=G.home;VIE.bindIdentity("da");
  $("go").onclick=()=>{const id=VIE.checkIdentity("dn","da",23,"député");if(!id)return;const reg=$("dr").value;G.newGame("opp",{name:id.name,age:id.age,party:$("dp").value,home:reg,start:"2026",profil:"depute"})};
};
PROF.initDep=function(S,o){
  S.profil="depute";const P=S.opp;
  P.dep={reg:o.home,fonds:15,disc:75,cur:null,nextBill:S.day+2,votes:[],used:{}};
  P.mandats=[{t:"Député",lieu:"région "+CM.REG[o.home].n,reg:o.home,m:-80}];P.cand.leg={reg:o.home};P.noto=Math.max(P.noto,25);
};
PROF.renderDep=function(S){
  const P=S.opp,D=P.dep;if(!D)return;
  if(!P.mandats.some(m=>m.t==="Député")){$("panel").innerHTML='<div class="card"><h3 class="h2">Vous n\'êtes plus député</h3><p>Poursuivez votre carrière dans l\'onglet Mon parti.</p></div>';return}
  const R=CM.REG[D.reg],mood=S.mood[D.reg].v,mi=window.SYS.moodInfo(mood);const b=D.cur;
  const line=l=>S.party===S.power?(l.gov?"pour":"contre"):(l.gov&&l.pop<=0?"contre":"pour");
  const j=(k,n)=>S.day-(D.used[k]||-99)>=n;
  $("panel").innerHTML=window.SYS.mailCard(S)+'<div class="card"><h3 class="h2">L\'honorable '+esc(S.name)+'</h3><span class="small muted">Député '+esc(S.parties[S.party].n)+' · région '+esc(R.n)+'</span><div class="kv"><span>Humeur de la circonscription</span><b>'+esc(mi[1])+' ('+Math.round(mood)+')</b><span>Discipline de parti</span><b>'+Math.round(D.disc)+'/100</b><span>Crédits de micro-projets</span><b>'+fmt(D.fonds)+' M FCFA</b><span>Sièges de votre parti à l\'Assemblée</span><b>'+(S.an[S.party]||0)+' / 180</b></div></div>'+
   (b?'<div class="card"><span class="eyebrow">Vote en séance plénière</span><h3 class="h2">'+esc(b.t)+'</h3><span class="small muted">'+(b.gov?"Projet du gouvernement":"Proposition de loi")+' · consigne de votre groupe : <b>'+line(b)+'</b> · opinion dans votre région : '+(b.pop>0?"favorable":b.pop<0?"hostile":"partagée")+'</span><div class="grid2"><button class="btn" data-v="pour">Pour</button><button class="btn" data-v="contre">Contre</button><button class="btn" data-v="abst">Abstention</button></div></div>':'<div class="card"><p class="small">Pas de texte en discussion. Prochaine séance vers le '+esc(G.dayLabel(D.nextBill))+'.</p></div>')+
   '<div class="card"><span class="eyebrow">Travail de député</span><div class="grid2"><button class="btn small" id="dQ"'+(j("q",7)?"":" disabled")+'>Question orale au gouvernement</button><button class="btn small" id="dT"'+(j("t",7)?"":" disabled")+'>Tournée dans la circonscription</button><button class="btn small" id="dPerm"'+(j("p",5)?"":" disabled")+'>Permanence parlementaire</button><button class="btn small" id="dMP">Micro-projets (onglet Projets)</button></div></div>'+
   (D.votes.length?'<div class="card"><span class="eyebrow">Mes votes</span><div class="log">'+D.votes.slice(0,8).map(v=>'<div>'+esc(v.t)+' : <b>'+esc(v.v)+'</b> · '+(v.ok?"adopté":"rejeté")+'</div>').join("")+'</div></div>':"");
  window.SYS.bindMail(S);const Pn=$("panel");
  Pn.querySelectorAll("[data-v]").forEach(x=>x.onclick=()=>{const v=x.dataset.v;const l=line(b);
    const popular=(b.pop>0&&v==="pour")||(b.pop<0&&v==="contre");const unpop=(b.pop>0&&v==="contre")||(b.pop<0&&v==="pour");
    if(v!==l){D.disc=clamp(D.disc-(v==="abst"?5:12),0,100);P.noto=clamp(P.noto+2,0,100)}else D.disc=clamp(D.disc+3,0,100);
    if(popular){window.SYS.cause(S,D.reg,"Votre député a voté "+v+" : "+b.t.toLowerCase(),2,"");G.shift(S.sup,D.reg,S.party,1,S.power)}
    if(unpop){window.SYS.cause(S,D.reg,"Colère : le député a voté "+v+" « "+b.t.toLowerCase()+" »",-2,"");G.shift(S.sup,D.reg,S.party,-1,S.power)}
    const maj=(S.an[S.power]||0)>=91;const ok=b.gov?maj:(!maj&&Math.random()<.5);
    D.votes.unshift({t:b.t,v,ok});D.cur=null;D.nextBill=S.day+rnd(7,12);
    if(D.disc<20&&Math.random()<.4){window.SYS.inbox(S,{from:"Secrétariat général du "+S.parties[S.party].n,t:"Menace d'exclusion du groupe",b:"Vos votes répétés contre la consigne exaspèrent la direction du parti. Vous risquez de ne pas être réinvesti aux prochaines législatives.",k:"alerte"})}
    window.SYS.inbox(S,{from:"Assemblée nationale",t:(ok?"Texte adopté : ":"Texte rejeté : ")+b.t,b:"Vous avez voté "+v+". Consigne de votre groupe : "+l+".",k:"info",read:true});G.render()});
  $("dQ").onclick=()=>{D.used.q=S.day;P.noto=clamp(P.noto+3,0,100);G.subs("Questions au gouvernement","Monsieur le Premier ministre, dans la région "+(/^[AEÉIOU]/.test(R.n)?"de l'":"du ")+R.n+", "+(S.mood[D.reg].c.find(c=>c.d<0)||{t:"les routes sont impraticables"}).t.charAt(0).toLowerCase()+(S.mood[D.reg].c.find(c=>c.d<0)||{t:"les routes sont impraticables"}).t.slice(1)+". Que compte faire le gouvernement ?");G.render()};
  $("dT").onclick=()=>{D.used.t=S.day;window.SYS.cause(S,D.reg,"Tournée du député à "+pick(R.villes),2,"");G.shift(S.sup,D.reg,S.party,.8,S.power);G.viewRegion(D.reg,"village");G.render()};
  $("dPerm").onclick=()=>{D.used.p=S.day;const c=S.mood[D.reg].c.filter(x=>x.d<0).slice(0,3).map(x=>x.t);G.sheet('<h3 class="h2">Permanence parlementaire</h3><p>Les habitants venus vous voir se plaignent de :</p><ul>'+(c.length?c.map(t=>'<li>'+esc(t)+'</li>').join(""):"<li>Rien de particulier cette semaine.</li>")+'</ul><p class="small muted">Utilisez vos micro-projets ou vos questions au gouvernement pour y répondre.</p>');G.render()};
  $("dMP").onclick=()=>G.setTab("projets");
};
function depMonth(S){const D=S.opp&&S.opp.dep;if(!D)return;D.fonds+=15/12}
function depDay(S){const D=S.opp&&S.opp.dep;if(!D||D.cur||S.day<D.nextBill)return;D.cur=pick(LOIS);G.toast("Nouveau texte en discussion à l'Assemblée")}
function minDay(S){const M=S.minis;if(M&&!M.cur&&S.day>=M.nextD)minDraw(S)}

})();
