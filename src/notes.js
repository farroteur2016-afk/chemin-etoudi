/* Chemin d'Etoudi — notes : « donnez-moi la structure du prix de l'essence… je veux des propositions pour baisser de 40 % »
   n'est pas un ordre à exécuter mais une DEMANDE DE NOTE. Le ministre compétent (ou votre cabinet) répond par une note
   (analyse chiffrée + propositions) ; chaque proposition peut ensuite être adoptée en directive, modifiée ou écartée.
   En ligne, Claude rédige la note à partir de l'état de la partie ; ailleurs, des notes types et les chiffres du jeu. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const esc=G.esc,clamp=G.clamp;
const NOTE={};window.NOTE=NOTE;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};
let sample=null;(async()=>{try{if(window.claude&&claude.use)sample=await claude.use("sample")}catch(e){}})();let refused=false;
const F=n=>Math.round(n).toLocaleString("fr-FR");

const RE=/^(donne[rz]? moi|donnez moi|donner moi|fais moi|faites moi|je veux (un complement|une note|un rapport|des propositions|un point|une etude|connaitre|savoir|comprendre|la structure)|propose[rz]? moi|proposez|explique[rz]? moi|expliquez|j ai besoin (d une note|d un rapport|de propositions)|preparez|prepare moi|redigez|faites une etude|je voudrais (une note|des propositions|connaitre|savoir))|\b(structur\w* (du|des|de la) (cout|prix)|des propositions pour|note sur|rapport sur|etude sur|me (fasse|fait|faire|fassent|font|soumette|soumet|presente|propose|proposent|transmette|envoie)( une| des| un)? (propositions?|plan|note|rapport|etude)|(une|des) propositions? (de|d|pour|sur))\b/;
NOTE.matches=t=>RE.test(window.DICO?DICO.n(t):norm(t));

const TOPICS=[
 {id:"train",re:/train de vie|depenses (de l etat|publiques|de fonctionnement)|economies budgetaires|reduire les depenses/,lab:"le train de vie de l'État",min:"MINFI"},
 {id:"carburant",re:/essence|gasoil|gazoil|super\b|petrole lampant|carburant|pompe|hydrocarbure/,lab:"le prix des carburants",min:"MINCOMMERCE"},
 {id:"electricite",re:/electricit|delestage|eneo|courant|kwh/,lab:"l'électricité",min:"MINEE"},
 {id:"vie",re:/vie chere|prix des denrees|panier|riz|farine|huile|ciment|inflation/,lab:"la vie chère",min:"MINCOMMERCE"},
 {id:"budget",re:/budget|dette|deficit|recettes|fiscal|impot|taxe/,lab:"les finances publiques",min:"MINFI"},
 {id:"emploi",re:/emploi|chomage|jeunes/,lab:"l'emploi des jeunes",min:"MINEFOP"},
 {id:"securite",re:/securit|boko|separatist|anglophone|attaque/,lab:"la sécurité",min:"MINDEF"},
 {id:"sante",re:/sante|hopita|medicament|epidemie/,lab:"la santé",min:"MINSANTE"},
 {id:"education",re:/ecole|universit|enseign|education|greve/,lab:"l'éducation",min:"MINESUP"}];
function topicOf(t){return TOPICS.find(x=>x.re.test(t))||{id:"general",lab:"la question posée",min:null}}
function named(t){const m=t.match(/ministre (?:de la |des |du |de l |de |d )([a-z]+)/);if(!m)return null;const w=m[1];const x=E.MINISTERES.find(y=>norm(y.n).split(/[ ,]+/)[0].startsWith(w.slice(0,6)));return x?x.id:null}
function auteur(S,tp,t){const nm=t&&named(t);if(nm)tp=Object.assign({},tp,{min:nm});if(S.mode==="pres"&&tp.min&&S.gov&&S.gov.min[tp.min]){const g=S.gov.min[tp.min];const m=E.MINISTERES.find(x=>x.id===tp.min);return{n:g.n,lab:window.SYS.accord("le ministre",window.SYS.sexe(g.n))+" "+(m?window.SYS.deM(m.n)+m.n:""),min:tp.min}}
  const c=window.CAB?CAB.conseiller(S):{n:"Votre cabinet",titre:"cabinet"};return{n:c.n,lab:c.titre}}

/* ---------- notes types (chiffres indicatifs du jeu, à affiner) ---------- */
function carburant(S,pct){const P={super:840,gasoil:828,petrole:350};const cible=k=>Math.round(P[k]*(1-pct/100));
  const v={achat:480,taxes:190,logistique:70,marges:65,divers:35};
  return{titre:"Structure du prix des carburants à la pompe"+(pct?" et pistes pour une baisse de "+pct+" %":""),
   analyse:"Prix homologués en vigueur (base 2024) : super "+P.super+" FCFA/l, gasoil "+P.gasoil+" FCFA/l, pétrole lampant "+P.petrole+" FCFA/l.\n"+
    "Ventilation indicative d'un litre de super ("+P.super+" FCFA) : produit importé et fret ≈ "+v.achat+" FCFA (57 %) ; taxes (TSPP, TVA, droits) ≈ "+v.taxes+" FCFA (23 %) ; stockage et transport (SCDP, transporteurs) ≈ "+v.logistique+" FCFA (8 %) ; marges des distributeurs ≈ "+v.marges+" FCFA (8 %) ; frais divers ≈ "+v.divers+" FCFA (4 %).\n"+
    "Depuis l'arrêt de la raffinerie SONARA (2019), tout le carburant est importé ; l'écart entre le coût réel et le prix homologué est compensé par l'État via la CSPH (subvention)."+
    (pct?"\nObjectif demandé (−"+pct+" %) : super ≈ "+cible("super")+" FCFA, gasoil ≈ "+cible("gasoil")+" FCFA, pétrole lampant ≈ "+cible("petrole")+" FCFA. Une baisse de cette ampleur suppose de combiner plusieurs mesures ; son coût pour le Trésor serait élevé.":""),
   props:[{t:"Suspendre la TSPP et réduire la TVA sur les carburants pendant 12 mois",effet:"≈ −150 FCFA/l",cout:250},
    {t:"Relancer la raffinerie SONARA de Limbé pour réduire le coût d'importation",effet:"≈ −60 à −90 FCFA/l à moyen terme",cout:300},
    {t:"Mettre en place une subvention ciblée pour les transporteurs, les moto-taximen et le pétrole lampant des ménages ruraux",effet:"baisse ciblée jusqu'à −40 % pour les bénéficiaires",cout:120},
    {t:"Lancer une opération contre la fraude et la contrebande de carburant et plafonner les marges logistiques",effet:"≈ −20 FCFA/l",cout:5}]}}
function train(S,pct){pct=pct||30;const L=E.TRAIN;const tot=L.reduce((a,x)=>a+x.b,0);const cap={missions:.8,vehicules:.7,carburant:.5,comites:.8,receptions:.7,loyers:.3,fluides:.25,cabinets:.4,presidence:.35};
  const eco=L.map(x=>({x,e:Math.round(x.b*Math.min(pct/100,cap[x.id]||.4))}));const sum=eco.reduce((a,y)=>a+y.e,0);
  return{titre:"Réduction du train de vie de l'État de "+pct+" %",
   analyse:"Le train de vie de l'État (dépenses de fonctionnement courant) représente environ "+tot+" milliards de FCFA par an (estimation du jeu) : "+L.map(x=>x.n.toLowerCase()+" "+x.b).join(" ; ")+" (en milliards).\n"+
    "Une baisse uniforme de "+pct+" % n'est pas réaliste pour tous les postes : les loyers, l'eau et l'électricité des administrations ne se réduisent que progressivement. Économies atteignables en un an : environ "+sum+" milliards de FCFA ("+Math.round(sum*100/tot)+" % du total)"+(sum<tot*pct/100?", en dessous des "+Math.round(tot*pct/100)+" milliards visés":"")+".\nCes mesures ne coûtent presque rien : elles rapportent de l'argent au Trésor.",
   props:[{t:"Plafonner les missions à l'étranger des ministres et hauts cadres, avec autorisation préalable de la Présidence",effet:"≈ "+eco.find(y=>y.x.id==="missions").e+" Md d'économies par an",cout:0},
    {t:"Geler les achats de véhicules administratifs et mutualiser le parc automobile",effet:"≈ "+eco.find(y=>y.x.id==="vehicules").e+" Md d'économies par an",cout:0},
    {t:"Instaurer des dotations de carburant plafonnées et des cartes carburant nominatives",effet:"≈ "+eco.find(y=>y.x.id==="carburant").e+" Md d'économies par an",cout:.5},
    {t:"Supprimer les comités et commissions inactifs et réduire les indemnités de session",effet:"≈ "+eco.find(y=>y.x.id==="comites").e+" Md d'économies par an",cout:0},
    {t:"Limiter les réceptions et cérémonies officielles, et regrouper les services dans des bâtiments publics pour réduire les loyers",effet:"≈ "+(eco.find(y=>y.x.id==="receptions").e+eco.find(y=>y.x.id==="loyers").e)+" Md d'économies par an",cout:2}]}}
function general(S,tp,raw,pct){const st=S.st||{};const k={carburant:"eco",electricite:"infra",vie:"soc",budget:"eco",emploi:"soc",securite:"sec",sante:"soc",education:"soc"}[tp.id];
  const P={electricite:[{t:"Lancer un plan d'urgence contre les délestages avec des centrales temporaires",effet:"moins de coupures dans 3 mois",cout:45},{t:"Accélérer les barrages en cours et la réhabilitation du réseau de transport d'électricité",effet:"effet à 2 ans",cout:150},{t:"Imposer à ENEO un contrat de performance avec pénalités",effet:"meilleur service",cout:2}],
   vie:[{t:"Réduire les droits de douane sur le riz, la farine et l'huile pendant 6 mois",effet:"≈ −10 % sur ces produits",cout:40},{t:"Renforcer les contrôles des prix sur les marchés",effet:"lutte contre la spéculation",cout:3},{t:"Créer des magasins témoins dans chaque région",effet:"prix de référence",cout:15}],
   budget:[{t:"Lancer un audit des dépenses fiscales et des exonérations",effet:"+100 Md de recettes potentielles",cout:2},{t:"Geler les achats de véhicules administratifs pendant un an",effet:"≈ 30 Md d'économies",cout:0},{t:"Élargir l'assiette fiscale au secteur informel par un impôt libératoire simplifié",effet:"recettes nouvelles",cout:5}],
   emploi:[{t:"Lancer un programme de 50 000 emplois jeunes dans les travaux à haute intensité de main-d'œuvre",effet:"emplois rapides",cout:60},{t:"Créer un fonds de garantie pour les jeunes entrepreneurs",effet:"création d'entreprises",cout:25},{t:"Relancer l'apprentissage en entreprise avec une prime à l'embauche",effet:"insertion",cout:20}]}[tp.id]||
   [{t:"Mettre en place un comité interministériel sur "+tp.lab+" avec rapport sous 30 jours",effet:"diagnostic partagé",cout:1},{t:"Organiser une concertation avec les acteurs concernés",effet:"apaisement",cout:2},{t:"Dégager une enveloppe d'urgence ciblée",effet:"réponse rapide",cout:20}];
  return{titre:"Note sur "+tp.lab,analyse:"Votre demande : « "+raw+" ».\nÉtat des lieux (indicateurs du jeu) : "+(k?"indicateur du secteur à "+Math.round(st[k]||0)+" sur 100 ; ":"")+"popularité "+Math.round(st.pop||0)+", cohésion "+Math.round(st.soc||0)+"."+(pct?"\nL'objectif de "+pct+" % demandé est ambitieux : il suppose de combiner plusieurs des mesures ci-dessous.":""),props:P}}

/* ---------- demande ---------- */
NOTE.handle=function(S,raw,reply,opt){opt=opt||{};if(!S||S.phase!=="play")return false;const t=window.DICO?DICO.n(raw):norm(raw);reply=reply||say;const tp=topicOf(t);const pct=(t.match(/(\d{1,2}) ?%/)||[])[1];
  const au=auteur(S,tp,t);let dl=1;const m=t.match(/(?:dans|sous|d ici)\s+(\d+)\s*(h|heures?|jours?)/);if(m)dl=/^h/.test(m[2])?Math.max(+m[1]/24,.1):+m[1];
  S.notes=S.notes||[];const n={id:"n"+Date.now().toString(36),texte:raw,topic:tp.id,pct:pct?+pct:0,due:S.day+dl,au,done:false,ctx:opt.ctx||null};S.notes.push(n);
  window.SYS.inbox(S,{from:"Cabinet",t:"Demande de note : "+tp.lab,b:"Votre demande : « "+raw+" »\nTransmise à "+au.n+", "+au.lab+". Note attendue le "+G.dayLabel(n.due)+".",k:"info",read:true});
  reply("Demande transmise à "+au.n+", "+au.lab+". Vous recevrez une note"+(tp.id==="carburant"?" chiffrée":"")+" avec des propositions le "+G.dayLabel(n.due)+(dl<1?" à "+Math.round(((n.due%1)*24+8)%24)+" h":"")+".");G.render();return true};

NOTE.tick=function(S){if(!S||!S.notes)return;for(const n of S.notes)if(!n.done&&!n.busy&&S.day>=n.due)deliver(S,n)};
function deliver(S,n){const tp=TOPICS.find(x=>x.id===n.topic)||{id:"general",lab:"la question posée"};
  const fin=N=>{n.done=true;n.busy=false;n.titre=N.titre;n.props=N.props.map(p=>Object.assign({st:"attente"},p));
    window.SYS.inbox(S,{from:n.au.n+", "+n.au.lab,t:"Note : "+N.titre,b:N.analyse+"\n\nPropositions :\n"+n.props.map((p,i)=>(i+1)+". "+p.t+" — effet attendu : "+p.effet+(p.cout?" ; coût estimé : "+String(p.cout).replace(".",",")+" milliard"+(p.cout>=2?"s":"")+" de FCFA":"")).join("\n")+"\n\nChaque proposition peut être adoptée en directive, modifiée ou écartée.",k:"rapport",note:n.id});
    say("Vous avez reçu la note de "+n.au.n+" sur "+tp.lab+".");G.render()};
  if(sample&&!refused){n.busy=true;const st=S.st||{};
    sample.json("Tu es "+n.au.n+", "+n.au.lab+", dans « Chemin d'Etoudi », simulation réaliste de la politique au Cameroun (2026). Le président (le joueur) te demande : « "+n.texte+" ».\nDonnées de la partie : jauges "+Object.entries(st).map(([k,v])=>k+" "+Math.round(v)).join(", ")+", dette "+Math.round((S.nums||{}).dette||0)+" milliards de FCFA.\n"+
      "Rédige une note administrative réaliste et chiffrée (ordres de grandeur plausibles au Cameroun, indiqués comme estimations), sans inventer de propos de personnes réelles. Réponds uniquement en JSON : {\"titre\": \"...\", \"analyse\": \"3 à 6 phrases, retours à la ligne permis\", \"props\": [{\"t\": \"mesure formulée comme une instruction\", \"effet\": \"effet attendu chiffré\", \"cout\": nombre de milliards de FCFA}] (3 à 4 propositions)}",{modelTier:"default",cache:false})
      .then(j=>{if(j&&j.titre&&Array.isArray(j.props)&&j.props.length)fin({titre:String(j.titre).slice(0,120),analyse:String(j.analyse||""),props:j.props.slice(0,5).map(p=>({t:String(p.t||"").slice(0,200),effet:String(p.effet||""),cout:clamp(+p.cout||0,0,2000)}))});else fin(n.topic==="carburant"?carburant(S,n.pct):n.topic==="train"?train(S,n.pct):general(S,tp,n.texte,n.pct))})
      .catch(e=>{if(e&&e.code==="not_granted")refused=true;fin(n.topic==="carburant"?carburant(S,n.pct):n.topic==="train"?train(S,n.pct):general(S,tp,n.texte,n.pct))});return}
  fin(n.topic==="carburant"?carburant(S,n.pct):n.topic==="train"?train(S,n.pct):general(S,tp,n.texte,n.pct))}

/* ---------- adopter une proposition depuis le courrier ---------- */
NOTE.mailActs=function(S,it){const n=it.note&&(S.notes||[]).find(x=>x.id===it.note);if(!n||!n.props)return"";
  return n.props.map((p,i)=>p.st==="attente"?'<button class="btn small primary" data-nadopt="'+i+'">Adopter la proposition '+(i+1)+'</button><button class="btn small" data-nmod="'+i+'">Modifier '+(i+1)+'</button>':'<span class="pill '+(p.st==="adoptee"?"ok":"bad")+'">'+(i+1)+' : '+(p.st==="adoptee"?"adoptée":"écartée")+'</span>').join("")+'<button class="btn small ghost" data-nplus>Demander un complément</button>'};
NOTE.mailBind=function(S,it,el){const n=it.note&&(S.notes||[]).find(x=>x.id===it.note);if(!n||!n.props)return;
  const adopt=(i,txt)=>{const p=n.props[i];p.st="adoptee";el.remove();if(window.DIR)DIR.handle(S,"Je veux "+txt.charAt(0).toLowerCase()+txt.slice(1),m=>{say(m);G.toast(m.slice(0,110))},{ctx:n.titre,force:true})};
  el.querySelectorAll("[data-nadopt]").forEach(b=>b.onclick=()=>{const i=+b.dataset.nadopt;adopt(i,n.props[i].t)});
  el.querySelectorAll("[data-nmod]").forEach(b=>b.onclick=()=>{const i=+b.dataset.nmod;el.remove();G.sheet('<span class="eyebrow">Modifier la proposition</span><h3 class="h2">'+esc(n.titre)+'</h3><textarea data-grow id="nmTx" rows="3">'+esc(n.props[i].t)+'</textarea><div class="row"><button class="btn primary" id="nmOk">Adopter cette version</button></div>',e2=>{e2.setAttribute("data-noinstr","");e2.querySelector("#nmOk").onclick=()=>{const v=e2.querySelector("#nmTx").value.trim();if(!v)return;n.props[i].t=v;adopt(i,v);e2.remove()}})});
  const pl=el.querySelector("[data-nplus]");if(pl)pl.onclick=()=>{el.remove();NOTE.handle(S,"Je veux un complément sur : "+n.titre,m=>{say(m);G.toast(m.slice(0,110))})}};
})();
