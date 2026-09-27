/* Chemin d'Etoudi — assistant vocal : on parle (ou on tape) une consigne en français, le jeu comprend, répond à voix haute
   et exécute : convocations et audiences à une date et une heure (agenda), déplacements avec le moyen de transport choisi,
   visites d'hôpitaux ou de lieux, vidéos, onglets, avance du temps, point de situation. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,clamp=G.clamp;
const VOIX={};window.VOIX=VOIX;
let uid=1;const nid=()=>"a"+Date.now().toString(36)+(uid++);
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const say=(t,cb)=>{try{A.speak(t,{voix:"f",rate:1.03,onend:cb})}catch(e){}};
const deL=x=>{x=String(x);return /^le /i.test(x)?"du "+x.slice(3):/^les /i.test(x)?"des "+x.slice(4):/^la /i.test(x)?"de "+x:/^l'/i.test(x)?"de "+x:/^[aeiouhéèêàâîôû]/i.test(x)?"d'"+x:"de "+x};
const hourNow=S=>((S.day%1)*24+8)%24;
const hh=h=>{const H=Math.floor(h),m=Math.round((h-H)*60);return H+" h "+String(m).padStart(2,"0")};

/* ---------- dates et heures ---------- */
const NB={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,"dix sept":17,"dix huit":18,"dix neuf":19,vingt:20,"vingt et un":21,"vingt deux":22,"vingt trois":23,trente:30};
function words2num(t){let s=t;for(const k of Object.keys(NB).sort((a,b)=>b.length-a.length))s=s.replace(new RegExp("\\b"+k+"\\b","g"),String(NB[k]));return s}
function parseWhen(S,t){
  t=words2num(t);const cd=Math.floor(S.day+1/3);let day=cd,h=null,explicit=false;const cur=hourNow(S);
  if(/apres demain/.test(t)){day+=2;explicit=true}else if(/demain/.test(t)){day+=1;explicit=true}else if(/aujourd hui|ce soir|cet apres midi|ce matin|tout de suite|maintenant/.test(t))explicit=true;
  let m=t.match(/dans (\d+) (jour|jours|semaine|semaines|heure|heures)/);if(m){const n=+m[1];if(/jour/.test(m[2]))day+=n;else if(/semaine/.test(m[2]))day+=7*n;else{const at=S.day+n/24;return{at,label:"dans "+n+" heure"+(n>1?"s":"")}}explicit=true}
  const J=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];for(let i=0;i<7;i++)if(new RegExp("\\b"+J[i]+"\\b").test(t)){const today=(new Date(2026,9,1).getDay()+cd)%7;let d=(i-today+7)%7||7;day=cd+d;explicit=true}
  m=t.match(/(\d{1,2}) ?(?:h|heures?)(?: ?(\d{1,2}))?/);if(m){h=+m[1]+(m[2]?+m[2]/60:0);if(/et demie/.test(t))h+=.5;if(/et quart/.test(t))h+=.25}
  else if(/midi/.test(t))h=12;else if(/minuit/.test(t))h=0;else if(/ce soir|soir/.test(t))h=19;else if(/apres midi/.test(t))h=15;else if(/matin/.test(t))h=9;
  if(/tout de suite|maintenant|immediatement/.test(t)&&h==null)return{at:S.day+.02,label:"tout de suite"};
  if(h==null&&!explicit)return null;if(h==null)h=10;
  let at=day+h/24-1/3;if(at<=S.day)at+=1;
  const dd=Math.floor(at+1/3)-cd;const lbl=(dd===0?"aujourd'hui":dd===1?"demain":dd===2?"après-demain":"le "+G.dayLabel(at))+" à "+hh(h);
  return{at,label:lbl};
}

/* ---------- personnes ---------- */
const ALIAS={MINDEF:"defense armee militaire forces armees",DGSN:"police surete",MINJUSTICE:"justice garde des sceaux",MINREX:"relations exterieures affaires etrangeres diplomatie",MINATD:"administration territoriale interieur",
  MINDDEVEL:"decentralisation",MINFI:"finances budget tresor",MINEPAT:"economie plan planification",MINCOMMERCE:"commerce prix",MINMIDT:"mines industrie",MINPMEESA:"pme artisanat",MINTOUL:"tourisme",
  MINTP:"travaux publics routes",MINEE:"eau energie electricite",MINHDU:"habitat logement developpement urbain",MINT:"transports transport",MINPOSTEL:"postes telecommunications telecoms",MINDCAF:"domaines cadastre foncier",
  MINESEC:"enseignements secondaires lycees",MINEDUB:"education de base ecoles primaires",MINESUP:"enseignement superieur universites",MINSANTE:"sante hopitaux",MINEFOP:"emploi formation professionnelle",MINTSS:"travail securite sociale",
  MINAS:"affaires sociales",MINPROFF:"femme famille",MINJEC:"jeunesse education civique",MINSEP:"sports",MINAC:"arts culture",MINCOM:"communication porte parole",MINADER:"agriculture",MINEPIA:"elevage peche",
  MINFOF:"forets faune",MINEPDED:"environnement",MINRESI:"recherche innovation",MINFOPRA:"fonction publique",MINMAP:"marches publics",MINCONSUPE:"controle superieur"};
function findMinistry(t){let best=null,sc=0;for(const m of E.MINISTERES){const al=(ALIAS[m.id]||"")+" "+norm(m.n);let s=0;for(const w of al.split(" "))if(w.length>3&&new RegExp("\\b"+w+"\\b").test(t))s+=w.length;if(s>sc){sc=s;best=m}}return best}
function findRegion(t){for(const r of CM.REGIONS){if(t.includes(norm(r.n))||t.includes(norm(r.chef)))return r}return null}
function findCity(t){const L=window.VOY?VOY.CITIES.slice().sort((a,b)=>b.n.length-a.n.length):[];for(const c of L)if(new RegExp("\\b"+norm(c.n)+"\\b").test(t))return c;return null}
const ENT_AL={AFRILAND:"afriland|first bank",BICEC:"bicec",SGC:"sgc|societe generale",UBA:"uba",ECOBANK:"ecobank",CCA:"cca bank|cca",BGFI:"bgfi",SCB:"scb",SABC:"brasseries|sabc",MTN:"mtn",ORANGE:"orange cameroun|orange",DANGOTE:"dangote",CIMENCAM:"cimencam|cimenteries",SOPECAM:"cameroon tribune",PAD:"port de douala|port autonome de douala",PAK:"port de kribi",CRTV:"television|radio nationale",CAMRAIL:"chemin de fer|chemins de fer|rail",ADC:"aeroports?",ENEO:"electricite",CAMWATER:"eau potable",CNPS:"securite sociale|caisse de prevoyance",SNH:"hydrocarbures|petrole",SONARA:"raffinerie","Camair-Co":"camair|compagnie aerienne",CAMPOST:"la poste",FEICOM:"fonds special",ONCC:"office du cacao|office national du cacao"};
function findEnt(S,t){for(const x of S.org.ent){const id=norm(x.id);if(new RegExp("\\b"+id.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b").test(t))return x;const al=ENT_AL[x.id];if(al&&new RegExp("\\b("+al+")\\b").test(t))return x}return null}
function findPerson(S,t){const P=findPerson0(S,t);if(P&&P.n&&!/^(le|la) /.test(P.n)){P.sexe=window.SYS.sexe(P.n);P.lab=window.SYS.accord(P.lab,P.sexe)}return P}
function findPerson0(S,t){
  if(/premier ministre/.test(t))return{k:"pm",lab:"le Premier ministre",n:S.gov&&S.gov.pm?S.gov.pm.n:"le Premier ministre"};
  if(/vice president/.test(t))return{k:"vp",lab:"le vice-président",n:S.gov&&S.gov.vp?S.gov.vp.n:null};
  if(/secretaire general/.test(t))return{k:"sg",lab:"le secrétaire général de la Présidence",n:S.gov&&S.gov.sg?S.gov.sg.n:"le secrétaire général"};
  if(/chef d etat major|etat major/.test(t))return{k:"cema",lab:"le chef d'état-major des armées",n:"le général chef d'état-major",min:"MINDEF"};
  if(/gouverneur/.test(t)){const r=findRegion(t)||CM.REG[VOY.here(S).reg];const o=S.org&&S.org.gouv.find(g=>g.reg===r.id);return{k:"gouverneur",lab:"le gouverneur de la région "+de(r),n:o?o.n:"le gouverneur",org:o&&{k:"gouverneur",id:o.id},reg:r.id}}
  if(/prefet/.test(t)){const c=findCity(t);const o=S.org&&c&&S.org.pref.find(p=>norm(p.ville)===norm(c.n));return{k:"prefet",lab:"le préfet"+(c?" de "+c.n:""),n:o?o.n:"le préfet",org:o&&{k:"prefet",id:o.id},reg:c&&c.reg}}
  if(/commissaire|commissariat/.test(t)){const c=findCity(t);const o=S.org&&c&&S.org.comm.find(p=>norm(p.ville)===norm(c.n));return{k:"police",lab:"le commissaire"+(c?" de "+c.n:""),n:o?o.n:"le commissaire",org:o&&{k:"police",id:o.id},reg:c&&c.reg}}
  if(/\b(dg|pdg|directeur|directrice|patron|patronne|administrateur|responsable|chef|dirige|gere|tete)\b/.test(t)&&S.org&&!/hopital|clinique/.test(t)){const e=findEnt(S,t);if(e)return{k:"ent",lab:"le directeur général "+(/^[AEIOU]/.test(e.n)?"d'":"de ")+e.n+(e.act?" ("+e.act.replace(/\s*\(.*\)/,"")+")":""),n:e.dg,org:{k:"ent",id:e.id},min:e.tut}}
  if(/directeur|directrice/.test(t)&&/hopital/.test(t)&&S.org){const h=findHospital(S,t);if(h)return{k:"hop",lab:"le directeur "+deL(lc(h.n).replace(/^(h[oô]pital|centre|clinique)/i,m=>"l'"+m).replace(/^l'centre/,"le centre").replace(/^l'clinique/,"la clinique")),n:h.dir,org:{k:"hop",id:h.id},reg:h.reg,min:"MINSANTE"}}
  if(/ministre|ministere/.test(t)){const m=findMinistry(t);if(m){const g=S.gov&&S.gov.min[m.id];return{k:"min",id:m.id,lab:(m.id==="DGSN"?"le délégué général à la Sûreté nationale":"le ministre "+window.SYS.deM(m.n)+m.n),n:g?g.n:null,min:m.id}}}
  return null}
const de=r=>(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n;const lc=t=>t.charAt(0).toLowerCase()+t.slice(1);
function findHospital(S,t){if(!S.org)return null;const c=findCity(t),r=findRegion(t);let L=S.org.hop.filter(h=>t.includes(norm(h.n).replace(/^hopital (general|central|regional|de district) (de |d )?/,"")));
  if(!L.length&&/laquintinie/.test(t))L=S.org.hop.filter(h=>/laquintinie/i.test(h.n));if(!L.length&&/central/.test(t))L=S.org.hop.filter(h=>/central/i.test(h.n));if(!L.length&&/chu|universitaire/.test(t))L=S.org.hop.filter(h=>/universitaire/i.test(h.n));
  if(!L.length&&(c||r)){const reg=c?c.reg:r.id;L=S.org.hop.filter(h=>h.reg===reg&&(!c||norm(h.n).includes(norm(c.n))));if(!L.length)L=S.org.hop.filter(h=>h.reg===reg)}
  if(!L.length){const here=VOY.here(S);L=S.org.hop.filter(h=>h.reg===here.reg)}return L[0]||null}
function modeOf(S,t){const pres=S.mode==="pres";
  if(/urgen|au plus vite|le plus vite|rapidement|tout de suite|immediatement/.test(t)&&!/taxi|moto|bus|train|voiture|pied/.test(t))return"rapide";
  if(/sans (cortege|escorte|protocole)|discret|incognito|sans convoi/.test(t))return/taxi/.test(t)?"taxi":/moto|bendskin/.test(t)?"moto":/pied/.test(t)?"marche":"chauffeur";
  if(/cortege/.test(t))return pres?"cortege":"convoi";if(/convoi|escorte|motard/.test(t))return"convoi";if(/taxi/.test(t))return"taxi";if(/moto|bendskin|mototaxi/.test(t))return"moto";
  if(/a pied|en marchant/.test(t))return"marche";if(/avion|vol\b|par air/.test(t))return pres?"avionp":"avion";if(/jet/.test(t))return"jet";if(/train|camrail/.test(t))return"train";if(/helico/.test(t))return"helico";if(/bus|car\b|agence/.test(t))return"bus";
  if(/ma voiture|en voiture|je conduis/.test(t))return"voiture";if(/chauffeur/.test(t))return"chauffeur";return null}

/* ---------- agenda ---------- */
function agenda(S){S.agenda=S.agenda||[];return S.agenda}
VOIX.findPerson=(S,t)=>findPerson(S,norm(t));
VOIX.agendaCard=function(S){const L=agenda(S).filter(a=>!a.done).sort((a,b)=>a.at-b.at);if(!L.length)return"";
  return'<div class="card"><span class="eyebrow">Agenda</span>'+L.slice(0,5).map(a=>'<div class="row" style="justify-content:space-between"><span class="small"><b>'+esc(G.dayLabel(a.at))+' · '+hh(hourNow({day:a.at}))+'</b> — '+esc(a.lab)+'</span><button class="btn small ghost" data-agx="'+a.id+'">Annuler</button></div>').join("")+'</div>'};
VOIX.bindAgenda=function(S,root){(root||document).querySelectorAll("[data-agx]").forEach(b=>b.onclick=()=>{const a=agenda(S).find(x=>x.id===b.dataset.agx);if(a){a.done=1;G.toast("Rendez-vous annulé");G.render()}})};
let busy=false;
VOIX.tick=function(S){if(!S||busy||S.phase!=="play")return;const due=agenda(S).filter(a=>!a.done&&S.day>=a.at).sort((a,b)=>a.at-b.at)[0];if(!due)return;due.done=1;busy=true;setTimeout(()=>{run(S,due);},200)};
function closeP(){try{stop()}catch(e){}const e=$("vxPanel");if(e)e.remove()}
function run(S,a){closeP();const end=()=>{busy=false;G.render();setTimeout(()=>VOIX.tick(G.S),400)};
  if(a.type==="trip"){const err=VOY.goTo(S,a.to,a.mode,true,()=>{if(a.visit)visit(S,a.visit);end()},end);if(err){say("Le déplacement prévu n'a pas pu avoir lieu : "+err+".");end()}return}
  if(a.type==="meet")return meeting(S,a,end);
  if(a.type==="renc"){const here=VOY.here(S);if(here.v===a.to.v){end();RENC.open(S,a.renc);return}const err=VOY.goTo(S,a.to,a.mode,true,()=>{end();setTimeout(()=>RENC.open(G.S,a.renc),700)});if(err){say("Le déplacement prévu n'a pas pu avoir lieu : "+err+".");end()}return}
  end()}
function meeting(S,a,end){const P=a.who;if(P&&P.n&&!P.sexe&&window.SYS)P.sexe=window.SYS.sexe(P.n);
  if(window.CAB&&!a.force){const st=CAB.status(S,P,S.day);if(st&&!st.ok){CAB.unavailable(S,P,st,{objet:a.objet,when:"à l'heure prévue"});end();return}}const who=(P.n?P.n+", ":"")+P.lab;G.toast("Audience : "+who);say("Votre rendez-vous est arrivé : "+who+" est là.");
  G.setView({overlay:"conseil"},S.mode==="pres"?"Palais de l'Unité":"Bureau","Audience");
  const g=P.k==="min"&&S.gov?S.gov.min[P.id]:null;const opts=[["Faire le point de la situation","point"],["Donner des instructions fermes","ordre"],["Le féliciter et l'encourager","bravo"]];
  if(S.mode==="pres"&&(P.k==="min"||P.k==="pm"))opts.push(["Mettre fin à ses fonctions et nommer une femme","limoger_f"],["Mettre fin à ses fonctions et nommer un homme","limoger_m"]);if(P.org)opts.push(["Ouvrir sa fiche (mesures possibles)","fiche"]);if(window.RENC)opts.unshift(["💬 S'entretenir librement (voix, texte ou choix)","libre"]);
  G.sheet('<span class="eyebrow">Audience · '+esc(G.dayLabel(S.day))+'</span><h3 class="h2">'+esc(who.charAt(0).toUpperCase()+who.slice(1))+'</h3><p class="small muted">Objet : '+esc(a.objet||"point de situation")+'</p><div class="choices">'+opts.map(([l,k])=>'<button class="choice" data-mk="'+k+'"><span class="t">'+esc(l)+'</span></button>').join("")+'</div>',el=>{
    el.querySelectorAll("[data-mk]").forEach(b=>b.onclick=()=>{const k=b.dataset.mk;el.remove();let txt="";const comp=g?g.comp:60;
      if(k==="point"){const sec=P.min?(E.MINISTERES.find(m=>m.id===P.min)||{}).s:null;const v=sec&&S.st&&S.st[sec]!=null?Math.round(S.st[sec]):null;txt=who+" vous présente la situation"+(v!=null?" : l'indicateur de son secteur est à "+v+" sur 100":"")+". "+(comp>65?"Son rapport est précis et convaincant.":"Son rapport est approximatif.");window.SYS.inbox(S,{from:P.lab,t:"Compte rendu d'audience",b:txt,k:"rapport",reg:P.reg})}
      else if(k==="ordre"){const tb=window.CAB&&P.n?CAB.traitBonus(P.n):0;const tr=window.CAB&&P.n?CAB.trait(P.n):"";if(tr==="tetu"&&Math.random()<.5){txt=(P.n||"Votre interlocuteur")+" conteste vos instructions et demande du temps. Il faudra le relancer.";say(txt);G.toast(txt.slice(0,90));window.SYS.inbox(S,{from:"Cabinet",t:"Audience : "+(P.n||P.lab),b:txt,k:"info",read:true});end();return}
        if(sec(P)&&S.st)S.st[sec(P)]=clamp(S.st[sec(P)]+(comp-50)/40*(1+tb*3),0,100);if(g)g.loy=clamp(g.loy-2,0,100);if(S.minis&&P.min===S.minis.id)S.minis.perf=clamp(S.minis.perf+1,0,100);txt="Instructions transmises. "+(comp>60?"Elles seront appliquées rapidement.":"Leur application risque de traîner.")}
      else if(k==="bravo"){if(g)g.loy=clamp(g.loy+4,0,100);txt="Encouragé, "+(P.n||"votre interlocuteur")+" repart motivé."}
      else if(k.startsWith("limoger")){if(P.k==="min"&&S.gov){const regs=CM.REGIONS;const r=pick(regs);S.gov.min[P.id]={n:window.SYS.nom(r.id,k.slice(-1)),reg:r.id,comp:Math.round(G.rnd(50,80)),loy:75};txt="Décret signé : "+(P.n||"le ministre")+" est remplacé par "+S.gov.min[P.id].n+"."}else txt="Le Premier ministre remet sa démission."}
      else if(k==="fiche"){VIE.openOrg(S,P.org);end();return}
      else if(k==="libre"){end();setTimeout(()=>RENC.open(S,{kind:P.k==="hop"?"medecin":"officiel",n:P.n||P.lab,lab:P.lab.replace(/^(le|la) /,""),reg:P.reg||"CE",ville:P.reg?CM.REG[P.reg].chef:"Yaoundé",lieu:S.mode==="pres"?"le palais d'Etoudi":"votre bureau",sujet:a.objet,bonjour:"Mes respects. Je suis à votre disposition."}),300);return}
      say(txt);G.toast(txt.slice(0,90));window.SYS.inbox(S,{from:"Cabinet",t:"Audience : "+(P.n||P.lab),b:txt,k:"info",read:true});end()});
    const cl=el.querySelector("[data-close]");if(cl)cl.addEventListener("click",end);});
  function sec(P){return P.min?(E.MINISTERES.find(m=>m.id===P.min)||{}).s:null}
}
function visit(S,v){if(v.hop&&window.VIE){say("Vous êtes arrivé à "+lc(v.name)+". Voici la situation de l'établissement.");setTimeout(()=>{window.VIE.openOrg(S,{k:"hop",id:v.hop});if(window.VID)setTimeout(()=>{},0)},900);S.st&&(S.st.pop=clamp(S.st.pop+.5,0,100));window.SYS.cause(S,v.reg,"Visite surprise à "+lc(v.name),1.5,"sante")}}

/* ---------- compréhension d'une consigne ---------- */
VOIX.handle=function(raw){const S=G.S;const t=norm(raw);if(!t)return;log("Vous : "+raw);
  const reply=m=>{log("Jeu : "+m);say(m)};
  if(!S||S.phase!=="play")return reply("Aucune partie n'est encore lancée. Sur l'écran d'accueil, choisissez votre profil (président, ministre, maire, médecin…) ou cliquez sur Reprendre, puis parlez-moi à nouveau.");
  // appel téléphonique immédiat
  if(/\b(telephone|un appel|coup de fil|en ligne|joindre|appelez le|appelez la|appelle le|appelle la|l appeliez|l appeler|l appelle|appeler le|appeler la|le joindre|la joindre|passe moi|passez moi|lancez un appel|lance un appel)\b/.test(t)&&!/\b(demain|apres demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|\d{1,2} ?h)\b/.test(t)&&window.RENC){
    const P=findPerson(S,t)||(window.QA&&QA._last)||null;if(!P||!P.n)return reply("Qui voulez-vous appeler ? Par exemple : « appelle le ministre de la Défense ».");
    const st=window.CAB?CAB.status(S,P):null;const F=P.sexe==="f";
    if(st&&st.st==="injoignable"){reply((P.n)+" ne répond pas au téléphone. Son secrétariat prend le message."+"");return}
    reply("J'appelle "+P.n+", "+P.lab+"."+(st&&st.st==="domicile"?" "+(F?"Elle":"Il")+" est chez "+(F?"elle":"lui")+" à cette heure-ci ; "+(F?"elle":"il")+" décroche quand même.":st&&st.st==="etranger"?" "+(F?"Elle":"Il")+" est à "+st.ville+", l'appel passe par l'international.":""));
    closeP();setTimeout(()=>RENC.open(S,{kind:P.k==="hop"?"medecin":"officiel",n:P.n,lab:P.lab.replace(/^(le|la) /,""),reg:P.reg||"CE",ville:(st&&(st.ville||st.base))||"Yaoundé",lieu:"au téléphone",sujet:"appel du "+(S.mode==="pres"?"président de la République":"cabinet"),tel:true,bonjour:(st&&st.st==="domicile"?"Allô… Oui, ":"Allô ? Oui, ")+(S.mode==="pres"?"Excellence, Monsieur le Président":"bonjour")+", je vous écoute."}),500);QA._last=P;return}
  if(window.NOTE&&NOTE.matches(raw)){NOTE.handle(S,raw,reply);return}
  if(window.GENRE&&GENRE.handle(S,raw,reply))return;
  if(window.QA&&QA.isQuestion(raw)&&QA.handle(S,raw,reply))return;
  // directive politique claire (« je veux que… », « j'ordonne… »)
  if(window.DIR&&/^(je veux qu|j exige qu|j ordonne|ordonne|je decide|il faut qu|que tous|que toutes|je demande (a|aux|que))/.test(t)&&!/^je veux (aller|visiter|voir|rencontrer|parler)/.test(t)){DIR.handle(S,raw,reply);return}
  // qui est… / nom du…
  if(/\b(qui est|qui sont|nom d|comment s appelle|c est qui|qui dirige|qui gere|qui est a la tete)/.test(t)&&!/convoqu|recevoir|audience/.test(t)){const P=findPerson(S,t);if(P&&P.k==="ent"&&P.n){const e=S.org.ent.find(x=>x.id===P.org.id);return reply("À la tête "+(/^[AEIOU]/.test(e.n)?"d'":"de ")+e.n+(e.act?" ("+e.act.replace(/\s*\(.*\)/,"")+")":"")+" : "+P.n+(P.sexe==="f"?", directrice générale.":", directeur général."))}if(P){const L=P.lab.charAt(0).toUpperCase()+P.lab.slice(1);return reply(P.n&&!/^le /.test(P.n)?L+" s'appelle "+P.n+".":L+" n'a pas encore été nommé, ou son nom n'est pas connu.")}
    return reply("Je ne trouve pas cette personne parmi les responsables suivis dans le jeu. Je connais les ministres, le Premier ministre, les gouverneurs, préfets, commissaires, directeurs d'hôpitaux et les directeurs généraux de : "+S.org.ent.map(x=>x.n).join(", ")+".")}
  // temps
  if(/\b(pause|arrete le temps|stop le temps)\b/.test(t)){S.paused=true;G.render();return reply("Le temps est en pause.")}
  if(/reprends le temps|relance le temps|continue le temps/.test(t)){S.paused=false;S.lastReal=Date.now();return reply("Le temps reprend.")}
  let m=words2num(t).match(/avance(?:r)? (?:de |d )?(\d+|une?)? ?(jour|jours|semaine|semaines|mois)/);if(m){const n=m[1]&&/\d/.test(m[1])?+m[1]:1;const d=/semaine/.test(m[2])?7*n:/mois/.test(m[2])?30*n:n;G.advanceDays(d,false);return reply("J'avance de "+(d>=30?Math.round(d/30)+" mois":d+" jour"+(d>1?"s":""))+". Nous sommes le "+G.dayLabel(S.day)+".")}
  if(/quel jour|quelle date|quelle heure/.test(t))return reply("Nous sommes le "+G.dayLabel(S.day)+", il est "+hh(hourNow(S))+".");
  // point de situation
  if(/situation|resume|bilan|comment va le pays|point sur/.test(t)&&!/convoqu|recevoir/.test(t)){const al=S.inbox.filter(i=>!i.read&&i.k==="alerte").length;const moods=S.mood?Object.values(S.mood).map(x=>x.v):[];const avg=moods.length?Math.round(moods.reduce((a,b)=>a+b,0)/moods.length):50;
    const worst=S.mood?CM.REGIONS.slice().sort((a,b)=>S.mood[a.id].v-S.mood[b.id].v)[0]:null;return reply("Nous sommes le "+G.dayLabel(S.day)+". L'humeur du pays est à "+avg+" sur 100"+(worst?", la région la plus tendue est "+worst.n:"")+". Vous avez "+al+" alerte"+(al>1?"s":"")+" non lue"+(al>1?"s":"")+(S.st?". Popularité "+Math.round(S.st.pop)+", sécurité "+Math.round(S.st.sec):"")+".")}
  // vidéo
  if(/video|montre moi les images|filme/.test(t)&&window.VID){VID.play({text:raw});return reply("Voici les images.")}
  // marcher
  if(/(je veux|allons|on va|laisse moi|fais moi|descend|descends|descendre)?.*\b(marcher|me promener|promenade|descendre dans la rue|dans la rue a pied)\b/.test(t)&&!/\?|^(suis je|est ce que|ou |si je)|je suis (au|dans)/.test(raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""))&&window.VID){VID.walk();return reply("Vous descendez dans la rue.")}
  // onglets
  const TABS=[["carte","carte"],["budget|gouvernement","gouv"],["justice|prison","justice"],["courrier|messages|mails","bureau"],["journal","journal"],["marche|appels d offres","marche"],["medias|presse","media"],["services publics|hopitaux","services"],["annuaire|talents","annuaire"],["carriere","pro"],["economie","eco"],["defense","defense"],["projets","projets"],["parti","parti"]];
  if(/^(ouvre|montre|affiche|va sur|va dans|je veux voir)\b/.test(t)&&!/video/.test(t)){for(const [re,tab] of TABS)if(new RegExp(re).test(t)&&document.querySelector('.tab[data-t="'+tab+'"]')){G.setTab(tab);return reply("J'ouvre l'onglet "+tab+".")}}
  // actualité réelle
  if(/actualite|quoi de neuf|nouvelles du pays|infos du jour|a la une|les nouvelles/.test(t)&&window.ACTU){const L=ACTU.all().slice(0,3);if(!L.length)return reply("Aucune actualité pour le moment.");return reply("À la une : "+L.map(x=>x.titre).join(". ")+". Tout est dans votre courrier.")}
  // rencontre sur le terrain : producteur, commerçants, chef, syndicat…
  {const rk=window.RENC&&RENC.kindOf(t);if(rk&&/(visite|visiter|rencontrer|rencontre|parler|discuter|echanger|voir|aller|rendre)/.test(t)&&!/ministre|gouverneur|prefet|directeur general|premier ministre/.test(t)){
    const here=VOY.here(S);const kd=RENC.K[rk];let c=findCity(t);let to=c?{reg:c.reg,v:c.n,lieu:null}:null;
    if(!to&&kd.regs&&!kd.regs.includes(here.reg)){const r=CM.REG[kd.regs[0]];to={reg:r.id,v:r.chef,lieu:null}}if(!to)to={reg:here.reg,v:here.v,lieu:null};to.lieu=kd.lieu;
    const un=(/^commer/.test(kd.lab)?"une ":"un ");const mode=modeOf(S,t);const w=parseWhen(S,t);const renc={kind:rk,reg:to.reg,ville:to.v,sujet:"visite de terrain"};
    if(w&&w.at-S.day>.05){agenda(S).push({id:nid(),type:"renc",at:w.at,to,mode,renc,lab:"Rencontre : "+kd.lab+" à "+to.v});G.render();return reply("C'est noté : rencontre avec "+un+kd.lab+" à "+to.v+", "+w.label+".")}
    if(to.v===here.v){reply("Très bien, je vous emmène rencontrer "+un+kd.lab+" à "+to.v+".");closeP();setTimeout(()=>RENC.open(S,renc),600);return}
    reply("Je prépare votre visite chez "+un+kd.lab+" à "+to.v+".");setTimeout(closeP,1500);const err=VOY.goTo(S,to,mode,true,()=>setTimeout(()=>RENC.open(G.S,renc),700));if(err)reply("Impossible : "+err+".");return}}
  // convocation / audience
  if(/convoqu|recevoir|recois|rencontrer|voir le|voir la|rendez vous|audience|faire venir|appelle/.test(t)&&!/s appelle/.test(t)){if(/\bbanque\b/.test(t)&&!(S.org&&findEnt(S,t)))return reply("Quelle banque ? Je suis : Afriland First Bank, BICEC, Société Générale (SGC), UBA, Ecobank, CCA Bank, BGFIBank et SCB. Dites par exemple : « convoque le DG d'Afriland demain à 10 h ».");
    const P=findPerson(S,t)||(/\b(convoque|convoquez|fais|faites|recois|recevez) (le|la)\b|\b(le|la) (convoquer|recevoir|faire venir)\b/.test(t)&&window.QA&&QA._last)||null;if(!P)return reply("Qui voulez-vous recevoir ? Par exemple : le ministre de la Défense, le Premier ministre, le gouverneur de l'Ouest, le directeur général d'ENEO.");
    const w=parseWhen(S,t)||{at:S.day+.1,label:"dans environ deux heures"};const obj=(t.match(/pour (parler de|discuter de|le point sur|evoquer) (.+)$/)||[])[2];
    if(window.CAB){const st=CAB.status(S,P,w.at);if(st&&!st.ok){log("Jeu : "+(P.n?P.n+", ":"")+P.lab+" "+st.txt+(st.back&&!st.soft?", retour prévu le "+G.dayLabel(st.back):"")+".");closeP();CAB.unavailable(S,P,st,{objet:obj||"point de situation",when:w.label});return}}
    const can=S.mode==="pres"||(S.mode==="min"&&(P.min===S.minis.id||["prefet","police","gouverneur","hop","ent"].includes(P.k)&&P.min===S.minis.id));
    if(!can&&S.mode!=="pres"){const ok=Math.random()<(S.mode==="min"?.8:.35);if(!ok)return reply("Votre demande d'audience auprès "+deL(P.lab)+" a été enregistrée, mais son cabinet ne vous a pas encore proposé de créneau.");}
    agenda(S).push({id:nid(),type:"meet",at:w.at,who:P,objet:obj||"point de situation",lab:(can?"Audience : ":"Rendez-vous avec ")+(P.n?P.n+", ":"")+P.lab});G.render();
    return reply((can?"Très bien. ":"Votre demande est acceptée. ")+(P.n?P.n+", "+P.lab+", ":P.lab.charAt(0).toUpperCase()+P.lab.slice(1)+" ")+(can?"est convoqué"+(P.sexe==="f"?"e ":" "):"vous recevra ")+w.label+(S.mode==="pres"?" au palais d'Etoudi.":"."))}
  // déplacement / visite
  if(/\b(aller|va|vais|rendre|deplacer|deplace|visite|visiter|partir|pars|conduis|conduisez|conduire|emmene|emmenez|emmener|voyage|voyager|ramene|ramenez|ramener|rentrer|rentre|rentrons|retourner|retourne|retour|amene|amenez|amener|transporte|transportez|filer|file|direction|rejoindre|rejoins|gagner)\b/.test(t)){if(!window.VOY)return reply("Les déplacements ne sont pas disponibles.");
    let to=null,visitInfo=null;const here=VOY.here(S);
    if(/hopital|clinique|centre de sante/.test(t)){const h=findHospital(S,t);if(h){const c=VOY.CITIES.find(x=>h.n.includes(x.n))||VOY.CITIES.find(x=>x.reg===h.reg&&x.n===CM.REG[h.reg].chef);to={reg:h.reg,v:c?c.n:CM.REG[h.reg].chef,lieu:h.n};visitInfo={hop:h.id,name:h.n,reg:h.reg}}}
    if(!to){for(const [cty,L] of Object.entries(VOY.LIEUX||{}))for(const l of L)if(t.includes(norm(l).replace(/\(.*\)/,"").trim()))to={reg:VOY.city(cty).reg,v:cty,lieu:l}}
    if(!to){const c=findCity(t);if(c)to={reg:c.reg,v:c.n,lieu:null};else{const r=findRegion(t);if(r)to={reg:r.id,v:r.chef,lieu:null}}}
    if(!to&&/marche/.test(t))to={reg:here.reg,v:here.v,lieu:"le marché"};
    if(!to)return reply("Où voulez-vous aller ? Dites par exemple : je veux aller à Douala en avion, ou : visite l'hôpital Laquintinie sans cortège.");
    const mode=modeOf(S,t);const N=VOY.norme(S);let note="";if(mode&&mode!=="rapide"&&!N.ok.includes(mode))note=" Ce moyen de transport n'est pas prévu pour votre rang : j'utilise celui par défaut.";
    const w=parseWhen(S,t);const ml=mode==="rapide"?"par le moyen le plus rapide":mode&&N.ok.includes(mode)?VOY.MODES[mode].n.toLowerCase():"le moyen habituel pour votre rang";
    if(w&&w.at-S.day>.05){agenda(S).push({id:nid(),type:"trip",at:w.at,to,mode,visit:visitInfo,lab:"Déplacement : "+(to.lieu?to.lieu+", ":"")+to.v+" ("+ml+")"});G.render();return reply("C'est noté. Départ "+w.label+" pour "+(to.lieu||to.v)+", "+ml+"."+note)}
    reply("Je prépare votre déplacement vers "+(to.lieu||to.v)+", "+ml+"."+note);setTimeout(closeP,1500);const err=VOY.goTo(S,to,mode,true,()=>{if(visitInfo)visit(S,visitInfo)});if(err)reply("Impossible : "+err+".");return}
  if(window.DIR&&DIR.matches(t)&&!(window.QA&&QA.isQuestion(raw))){DIR.handle(S,raw,reply);return}
  if(window.QA&&QA.handle(S,raw,reply,{final:true}))return;
  reply("Je n'ai pas compris. Essayez par exemple : « convoque le ministre de la Défense demain à 9 h », « je veux visiter l'hôpital de Maroua sans cortège », « avance d'une semaine », « montre-moi la vidéo de la route de Kribi », « fais le point sur la situation ».")};

/* ---------- interface : micro et saisie ---------- */
let rec=null,listening=false;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function log(t){const l=$("vxLog");if(!l)return;const d=document.createElement("div");d.textContent=t;d.className=t.startsWith("Vous")?"me":"it";l.appendChild(d);l.scrollTop=l.scrollHeight}
VOIX.open=function(o){o=o||{};const driving=!!(o.driving||(window.VOY&&VOY.driving));let el=$("vxPanel");if(el){el.remove();if(!o.driving)return}
  el=document.createElement("div");el.id="vxPanel";el.className="vxpanel";
  el.innerHTML='<div class="row" style="justify-content:space-between"><b>Assistant vocal</b><button class="sheet-x" id="vxX" aria-label="Fermer" title="Fermer" style="margin:0;position:static">✕</button></div><div class="vxlog" id="vxLog"></div>'+
   '<div class="row" style="gap:6px"><button class="btn primary" id="vxMic" aria-pressed="false">🎙 Parler</button><textarea data-grow rows="1" id="vxIn" placeholder="…ou tapez votre consigne" style="flex:1;min-width:0"></textarea><button class="btn" id="vxGo">OK</button></div>'+
   '<span class="small muted" id="vxHint">'+(SR?"Appuyez sur Parler, puis dites votre consigne.":"La reconnaissance vocale n'est pas disponible dans ce navigateur : tapez votre consigne (Chrome la prend en charge).")+'</span>';
  document.body.appendChild(el);$("vxX").onclick=()=>{stop();el.remove()};
  if(driving){const inp=$("vxIn"),go=$("vxGo");if(inp){inp.disabled=true;inp.placeholder="Au volant : écrire est interdit, parlez"}if(go)go.disabled=true;const h=$("vxHint");if(h)h.textContent="Vous conduisez : téléphone interdit. Appuyez sur Parler et donnez vos consignes à la voix.";setTimeout(()=>{if(SR)start()},300)}
  const send=()=>{if(window.VOY&&VOY.driving){G.toast("Au volant, uniquement à la voix.");return}const v=$("vxIn").value.trim();if(v){$("vxIn").value="";$("vxIn").style.height="";VOIX.handle(v)}};$("vxGo").onclick=send;$("vxIn").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};
  $("vxMic").onclick=()=>listening?stop():start();

};
function start(){if(!SR){G.toast("Reconnaissance vocale indisponible ici : tapez la consigne.");return}try{A.stop()}catch(e){}
  rec=new SR();rec.lang="fr-FR";rec.interimResults=true;rec.maxAlternatives=1;listening=true;const b=$("vxMic");if(b){b.textContent="⏹ J'écoute…";b.setAttribute("aria-pressed","true")}
  rec.onresult=e=>{let fin="",tmp="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript;else tmp+=r[0].transcript}const h=$("vxHint");if(h)h.textContent=tmp||fin;if(fin){stop();VOIX.handle(fin)}};
  rec.onerror=e=>{stop();const h=$("vxHint");if(h)h.textContent=window.VOY&&VOY.driving?"Micro indisponible : au volant, vous ne pouvez pas écrire. Autorisez le micro dans Chrome, ou passez la vidéo pour arriver.":e.error==="not-allowed"||e.error==="service-not-allowed"?"Le micro est bloqué ici (autorisez-le, ou utilisez la version hors ligne dans Chrome). Vous pouvez taper la consigne.":"Micro : "+e.error+". Réessayez ou tapez la consigne."};
  rec.onend=()=>stop();try{rec.start()}catch(e){stop()}}
function stop(){listening=false;try{rec&&rec.stop()}catch(e){}const b=$("vxMic");if(b){b.textContent="🎙 Parler";b.setAttribute("aria-pressed","false")}}
})();
