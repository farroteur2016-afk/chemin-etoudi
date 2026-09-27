/* Chemin d'Etoudi — directives : toute décision politique donnée en clair (à la voix, par écrit, ou dans « Autre instruction »)
   devient une directive officielle, exécutée par l'administration avec des effets réalistes et un compte rendu à échéance.
   Ex. : « Je veux que tous les ministres déclarent leur patrimoine avec justificatifs » → article 66 de la Constitution,
   loi n° 003/2006 : chaque ministre dépose (ou non) sa déclaration ; rapport nominatif ; sanctions possibles.
   En ligne, Claude qualifie les directives libres ; ailleurs, un catalogue intégré. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const esc=G.esc,clamp=G.clamp,pick=G.pick;
const DIR={};window.DIR=DIR;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
let sample=null;(async()=>{try{if(window.claude&&claude.use)sample=await claude.use("sample")}catch(e){}})();let refused=false;
const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};
const nid=()=>"d"+Date.now().toString(36)+Math.floor(Math.random()*1e4);

/* cibles d'une directive */
function cible(t){if(/mon ministere|mes collaborateurs|mes directeurs|de mes services/.test(t))return{k:"ministere",lab:"les responsables de votre ministère"};if(/ministres?|gouvernement|membres du gouvernement/.test(t))return{k:"ministres",lab:"tous les membres du gouvernement"};
  if(/\bdg\b|directeurs? generaux|entreprises publiques|societes d etat/.test(t))return{k:"dg",lab:"les directeurs généraux des entreprises publiques"};
  if(/magistrat|juges?/.test(t))return{k:"magistrats",lab:"les magistrats"};if(/gouverneurs?|prefets?/.test(t))return{k:"territoriaux",lab:"les gouverneurs et préfets"};
  if(/maires?/.test(t))return{k:"maires",lab:"les maires"};if(/deputes?|senateurs?|parlementaires?/.test(t))return{k:"elus",lab:"les parlementaires"};return{k:"ministres",lab:"tous les membres du gouvernement"}}
function region(t){const w=x=>new RegExp("\\b"+x+"\\b");for(const r of CM.REGIONS){const n=norm(r.n),c=norm(r.chef);if((n==="est"?/\b(l est|region est|a l est|dans l est)\b/:w(n)).test(t)||w(c).test(t))return r.id;for(const v of r.villes||[])if(w(norm(v)).test(t))return r.id}return null}

/* ---------- catalogue ---------- */
const CAT=[
 {id:"patrimoine",re:/patrimoine|declar\w* (de |des )?(leurs |ses )?biens|biens et avoirs|avoirs|declaration de fortune/,titre:"Déclaration des biens et avoirs",
  base:"article 66 de la Constitution et loi n° 003/2006 du 25 avril 2006 relative à la déclaration des biens et avoirs",fx:{int:3,pop:2},loy:-3,delai:30,cout:0},
 {id:"justice",re:/parquet|procureur|poursuiv|poursuite|auditionn|audition|entendre (les|le|la)|enquete judiciaire|ouvrir une enquete|interpell|arrest|tribunal|juge d instruction|traduire en justice|mettre aux arrets|garde a vue|police judiciaire/,titre:"Action judiciaire",fx:{int:2,soc:1,pop:1},delai:30,cout:.5},
 {id:"audit",re:/\baudit|corruption|detourn|conac|controle superieur|consupe|inspection generale|gestion des fonds/,titre:"Opération d'audit et de lutte contre la corruption",fx:{int:2,eco:.5,pop:1},loy:-2,delai:45,cout:2},
 {id:"prix",re:/baisse|vie chere|prix des?|carburant|subvention|pouvoir d achat|panier de la menagere/,titre:"Mesures contre la vie chère",fx:{pop:3,soc:1,eco:-1},delai:20,cout:60},
 {id:"arrieres",re:/arriere|primes?|salaires?|rappels?|dette interieure|dette academique|payer (les |leurs )?/,titre:"Apurement des arriérés et des primes",fx:{soc:3,pop:1},delai:30,cout:40},
 {id:"emploi",re:/recrut|emploi des jeunes|chomage|jeunes diplomes|insertion/,titre:"Programme spécial d'emploi des jeunes",fx:{pop:2,soc:1},delai:90,cout:50},
 {id:"construire",re:/constru|batir|bitum|rehabilit|refaire (la|les|des) (route|pont)|refection|edifier|amenager (un|une|des)|forages?/,titre:"Grands travaux",fx:{infra:3,pop:1},delai:180,cout:80},
 {id:"securite",re:/renfort|securis|armee|militaire|\bbir\b|patrouille|gendarmerie|police|terroris|boko|separatist/,titre:"Renforcement du dispositif de sécurité",fx:{sec:3,pop:.5},delai:21,cout:25},
 {id:"dialogue",re:/dialogue|negoci|paix|reconcili|concertation|table ronde|syndicats?/,titre:"Ouverture d'un dialogue",fx:{soc:3,sec:1,pop:1},delai:30,cout:3},
 {id:"liberer",re:/liber|grace|amnistie|prisonniers?|detenus?/,titre:"Mesures de grâce et de libération",fx:{soc:2,int:1,pop:1,sec:-.5},delai:10,cout:0},
 {id:"gratuite",re:/gratuit/,titre:"Mesure de gratuité",fx:{pop:3,soc:2,eco:-1},delai:60,cout:70},
 {id:"electricite",re:/electricit|delestage|eneo|courant/,titre:"Plan d'urgence contre les délestages",fx:{infra:1.5,pop:2,eco:.5},delai:60,cout:45},
 {id:"eau",re:/\beau\b|camwater|potable/,titre:"Plan d'urgence pour l'eau potable",fx:{infra:1.5,pop:2},delai:60,cout:30},
 {id:"sante",re:/sante|medicament|epidemie|cholera|paludisme|vaccin/,titre:"Plan d'urgence sanitaire",fx:{soc:2,pop:1.5},delai:30,cout:25},
 {id:"education",re:/enseign|education|eleves|etudiants|tables bancs|salles de classe/,titre:"Plan d'urgence pour l'éducation",fx:{soc:2,pop:1},delai:60,cout:30},
 {id:"agriculture",re:/agricult|cacao|cafe|coton|engrais|paysans|producteurs|elevage|peche/,titre:"Soutien au monde rural",fx:{eco:1,pop:1.5},delai:60,cout:25},
 {id:"transparence",re:/transparen|publier|rendre public|journal officiel|open data|budget citoyen/,titre:"Mesure de transparence",fx:{int:2,pop:1},delai:20,cout:0},
 {id:"interdire",re:/interdi|suspend|fermer|bannir|proscri/,titre:"Mesure d'interdiction",fx:{sec:.5,pop:-.5,int:-.3},delai:7,cout:0},
];
const GENERIC={id:"generique",titre:"Directive",fx:{pop:.5},delai:30,cout:5};
const IMPER=/je veux|j exige|j ordonne|ordonne|exige|il faut|faites|demande[zr]? (a|aux|que)|je demande|qu on|que (tous|toutes|les|le|la)|instruis|instruction|decret|decide|je decide|mettez|lancez|prenez/;

const cut=(s,n)=>s.length<=n?s:s.slice(0,Math.max(20,s.lastIndexOf(" ",n)))+"…";
const stripTxt=raw=>{const x=String(raw).trim().replace(/^(je veux|j'exige|j'ordonne|il faut|je demande|faites en sorte)\s+(?=(que|qu'))/i,"").replace(/^(j'ordonne|il faut|faites|je veux|je souhaite|je demande)\s+/i,"");return x.charAt(0).toUpperCase()+x.slice(1)};
const NBW={un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,dix:10,quinze:15,vingt:20,trente:30};
/* délai donné dans la consigne : « dans 48 h », « sous 72 heures », « d'ici une semaine », « dans 15 jours », « d'ici 3 mois », « immédiatement » */
function delai(S,t){const num=x=>/^\d+$/.test(x)?+x:NBW[x]||null;let m=t.match(/(?:dans|sous|d ici|en|avant|au plus tard dans|delai de)\s+(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|dix|quinze|vingt|trente)\s*(h|heures?|jours?|j|semaines?|mois)\b/);
  if(m){const n=num(m[1]);if(n){const u=m[2];return/^h/.test(u)?Math.max(n/24,1/24):/^j/.test(u)?n:/^s/.test(u)?n*7:n*30}}
  if(/immediatement|sans delai|tout de suite|dans l heure|en urgence|d urgence/.test(t))return .5;if(/fin de la semaine/.test(t))return 7-((new Date(2026,9,1).getDay()+Math.floor(S.day))%7);
  if(/fin du mois/.test(t))return Math.max(1,(S.m+1)*30-S.day);return null}
DIR.matches=t=>{t=norm(t);return CAT.some(c=>c.re.test(t))||IMPER.test(t)};

/* ---------- compétence ---------- */
function scope(S,c,t){if(S.mode==="pres")return{ok:true,qui:"Présidence de la République"};
  if(S.mode==="min"){const m=E.MINISTERES.find(x=>x.id===S.minis.id);const mine=c.id==="patrimoine"?/mon ministere|mes (collaborateurs|directeurs)|de mon/.test(t):true;
    if(c.k==="ministres"&&!mine)return{ok:false,msg:"Seul le président de la République peut imposer cela à tout le gouvernement. Je transmets votre proposition à la Présidence ; vous pouvez l'appliquer dans votre propre ministère."};return{ok:true,qui:"Ministère "+(m?m.n:"")}}
  if(S.profil==="maire")return{ok:true,qui:"Mairie",local:true};
  if(S.opp)return{ok:false,msg:"Vous n'êtes pas au pouvoir : votre parti en fait une proposition publique et interpelle le gouvernement.",opp:true};
  return{ok:false,msg:"Cette décision relève des autorités. Votre demande est transmise sous forme de pétition.",pet:true}}

/* ---------- lancement ---------- */
DIR.handle=async function(S,raw,reply,opt){opt=opt||{};if(window.DICO)raw=DICO.fix(raw);if(!opt.force&&window.NOTE&&S&&NOTE.matches(raw))return NOTE.handle(S,raw,reply,opt);if(!S||S.phase!=="play")return false;const t=norm(raw);if(!DIR.matches(t))return false;reply=reply||(m=>{say(m)});
  let c=CAT.find(x=>x.re.test(t))||GENERIC;const cb=cible(t);const sc=scope(S,{...c,k:cb.k},t);
  if(!sc.ok){if(sc.opp){S.opp.noto=clamp(S.opp.noto+1.5,0,100)}window.SYS.inbox(S,{from:sc.opp?"Votre parti":"Pétitions",t:"Proposition : "+raw.slice(0,80),b:sc.msg,k:"info",read:true});reply(sc.msg);G.render();return true}
  let d={id:nid(),resp:S.mode==="pres"&&window.CAB?CAB.resp(c.id):null,cat:c.id,titre:c.titre,texte:raw,cible:cb,reg:region(t),qui:sc.qui,start:S.day,due:S.day+c.delai,cout:c.cout,fx:{...c.fx},loy:c.loy||0,done:false};
  if(c.id==="construire"&&d.reg){d.titre+=" : "+CM.REG[d.reg].n}
  // le titre, ce sont VOS mots ; le domaine est indiqué à part ; le délai que vous donnez est respecté
  d.domaine=c===GENERIC?"Directive":d.titre;d.titre=cut(stripTxt(raw),140);const dl=delai(S,t);if(dl!=null){d.due=S.day+dl;d.delaiDonne=true}
  // coût selon l'étendue : une ville ou une région coûte bien moins qu'une mesure nationale
  if(d.reg&&d.cout>5&&!opt.cout){const town=window.VOY&&VOY.CITIES.some(c=>new RegExp("\\b"+norm(c.n)+"\\b").test(t)&&c.n!==CM.REG[d.reg].n);d.cout=Math.max(.3,Math.round(d.cout*(town?.06:.2)*10)/10)}
  if(/en audience|venir me (presenter|rendre compte)|me (le )?presenter en personne|rendre compte de vive voix/.test(t))d.cr="audience";else if(/par ecrit|rapport ecrit|m envoyer (le|un) rapport/.test(t))d.cr="ecrit";
  if(opt.ctx){d.dossier=String(opt.ctx).slice(0,140);if(window.ACTU){const a=ACTU.all().find(x=>x.titre===opt.ctx||x.titre.startsWith(opt.ctx.slice(0,70)));if(a){S.actuFait=S.actuFait||{};(S.actuFait[a.id]=S.actuFait[a.id]||[]).push("directive");d.reg=d.reg||a.reg}}}
  if(sample&&!refused&&(c===GENERIC||c.id==="construire"||c.id==="interdire")){try{const j=await sample.json(
    "Jeu de simulation politique réaliste au Cameroun (2026). Le joueur ("+sc.qui+") donne cette directive : « "+raw+" ».\n"+
    "Qualifie-la de façon réaliste. Réponds uniquement en JSON : {\"titre\": \"titre officiel court\", \"base_legale\": \"texte camerounais applicable ou chaîne vide\", \"delai_jours\": 7-365, \"cout_milliards_fcfa\": 0-500, "+
    "\"effets\": {\"pop\":-5..5,\"eco\":-5..5,\"soc\":-5..5,\"sec\":-5..5,\"infra\":-5..5,\"int\":-5..5}, \"reaction\": \"une phrase : réaction de l'opinion et de la presse\"}",{modelTier:"quick",cache:false});
    if(j&&j.titre){d.domaine=String(j.titre).slice(0,90);d.base=String(j.base_legale||"");if(!d.delaiDonne)d.due=S.day+clamp(+j.delai_jours||30,7,365);d.cout=clamp(+j.cout_milliards_fcfa||0,0,500);d.reaction=String(j.reaction||"");
      d.fx={};for(const k of ["pop","eco","soc","sec","infra","int"])d.fx[k]=clamp(+((j.effets||{})[k])||0,-5,5)}}catch(e){if(e&&e.code==="not_granted")refused=true}}
  if(c.base)d.base=c.base;
  if(opt.cout!=null&&opt.cout>0)d.cout=opt.cout;
  // validation avant exécution : impact national, ou coût au-delà des marges de l'exécutant
  const gate=DIR.gate(S,d,opt);
  if(gate.need){d.why=gate.why;d.execJ=Math.max(.25,d.due-S.day);d.phase=gate.need==="pres"?"plan":"presid";const pj=planDays(S,d);d.planDue=S.day+pj;d.due=d.planDue+d.execJ;
    S.directives=S.directives||[];S.directives.push(d);S.directives=S.directives.slice(-60);const R=DIR.resp(S,d);
    const txt=gate.need==="pres"?"Instruction transmise à "+R.n+" ("+R.lab+") : « "+d.titre+" ». Comme elle a un "+gate.why+", rien ne sera exécuté sans votre accord : "+R.n+" vous soumettra un plan d'exécution chiffré le "+G.dayLabel(d.planDue)+(d.planDue-S.day<1?" vers "+Math.round(((d.planDue%1)*24+8)%24)+" h":"")+", pour validation. Coût estimé à ce stade : "+(d.cout||"moins de 1")+" milliard"+(d.cout>=2?"s":"")+" de FCFA."
      :"Votre décision « "+d.titre+" » a un "+gate.why+" : elle est transmise à la Présidence de la République pour approbation avant exécution. Réponse attendue vers le "+G.dayLabel(d.planDue)+".";
    window.SYS.inbox(S,{from:sc.qui,t:"En attente de validation : "+d.titre.slice(0,70),b:"Votre instruction : « "+raw+" »\n"+txt,k:"info",read:true,reg:d.reg});reply(txt);G.render();return true}
  // coût (en milliards : État, ministère ou commune)
  if(d.cout){if(S.mode==="pres")S.nums.dette+=d.cout*.25;else if(S.mode==="min"){const M=d.cout*.25*1000;if(S.minis.fonds<M){reply("Les crédits de votre ministère ne suffisent pas pour cette mesure ("+Math.round(M)+" M FCFA). Demandez une rallonge au Premier ministre.");return true}S.minis.fonds-=M}
    else if(sc.local&&S.opp&&S.opp.commune){const M=Math.min(S.opp.commune.fonds,d.cout*5);S.opp.commune.fonds-=M}}
  // effet d'annonce immédiat (le tiers), le reste à l'exécution
  apply(S,d,1/3);
  if(c.id==="patrimoine"&&S.gov&&cb.k==="ministres"&&S.mode==="pres"){d.liste=Object.keys(S.gov.min);for(const id of d.liste){const g=S.gov.min[id];g.loy=clamp(g.loy+d.loy,0,100)}}
  S.directives=S.directives||[];S.directives.push(d);S.directives=S.directives.slice(-60);
  const when=G.dayLabel(d.due);
  const txt=(S.mode==="pres"?"Directive présidentielle":"Décision")+" enregistrée : « "+d.titre+" »"+(c.id==="patrimoine"?", pour "+cb.lab:"")+". Domaine : "+d.domaine.toLowerCase()+"."+(d.dossier?" Dossier : "+d.dossier+".":"")+(d.base?" Base légale : "+d.base+".":"")+
    (S.mode==="pres"?" Le secrétaire général de la Présidence la notifie aux intéressés.":"")+" Rapport attendu le "+when+(d.due-S.day<2?" à "+Math.round(((d.due%1)*24+8)%24)+" h":"")+"."+(d.cout?" Coût estimé : "+String(d.cout).replace(".",",")+" milliard"+(d.cout>=2?"s":"")+" de FCFA.":"")+(d.cr==="audience"?" "+DIR.resp(S,d).n+" viendra vous présenter le compte rendu en audience.":" Compte rendu par écrit ; vous pouvez choisir de recevoir le responsable en audience dans « Vos directives » ou votre agenda.");
  window.SYS.inbox(S,{from:sc.qui,t:d.titre,b:"Votre instruction : « "+raw+" »\n"+txt+(d.reaction?"\n"+d.reaction:c.id==="patrimoine"?"\nLa presse salue une décision attendue depuis 1996 ; plusieurs ministres s'inquiètent en privé.":""),k:"info",read:true,reg:d.reg});
  reply(txt);G.render();return true};

/* ---------- circuit de validation ---------- */
const capOf=id=>{const m=id&&E.MINISTERES.find(x=>x.id===id);return m?Math.max(1,Math.round(m.b*.05*10)/10):5};
DIR.cap=capOf;
DIR.gate=function(S,d,opt){opt=opt||{};if(d.cat==="patrimoine"||opt.direct)return{};
  const nat=opt.nat!=null?!!opt.nat:(!d.reg&&!d.ville);
  if(S.mode==="pres"){const cap=capOf(d.resp);const over=(d.cout||0)>cap;if(!nat&&!over)return{};
    return{need:"pres",why:[nat?"impact national":"",over?"coût ("+String(d.cout).replace(".",",")+" milliards) au-delà de ce que "+(d.resp?"le ministère":"les services")+" peut gérer seul ("+String(cap).replace(".",",")+" milliards)":""].filter(Boolean).join(" et un ")}}
  if(S.mode==="min"&&S.minis){const cap=capOf(S.minis.id);const over=(d.cout||0)>cap;if(!nat&&!over)return{};
    return{need:"presidence",why:[nat?"impact national":"",over?"coût ("+String(d.cout).replace(".",",")+" milliards) au-delà des marges de votre ministère ("+String(cap).replace(".",",")+" milliards)":""].filter(Boolean).join(" et un ")}}
  return{}};
function planDays(S,d){const R=DIR.resp(S,d);const tr=window.CAB&&R.n?CAB.trait(R.n):"cooperatif";let j={zele:2,cooperatif:3,prudent:5,ambitieux:3,tetu:6,negligent:7}[tr]||3;
  if(d.phase==="presid")j=2+Math.round(Math.random()*3);if(d.execJ<3)j=Math.max(.25,Math.min(j,d.execJ/2));return j}
function commit(S,d){if(d.cout){if(S.mode==="pres")S.nums.dette+=d.cout*.25;else if(S.mode==="min"){const M=d.cout*.25*1000;S.minis.fonds=Math.max(0,S.minis.fonds-Math.min(M,capOf(S.minis.id)*250))}}apply(S,d,1/3)}
const STEPS={construire:["études techniques et choix des sites","appel d'offres et attribution des marchés","travaux et réception des ouvrages"],justice:["saisine du parquet compétent","enquête et auditions","poursuites et suivi des procédures"],
  audit:["désignation des équipes d'inspection","contrôles sur pièces et sur place","rapport, sanctions et recouvrement"]};
function sendPlan(S,d){const R=DIR.resp(S,d);const tr=window.CAB&&R.n?CAB.trait(R.n):"cooperatif";if(tr==="ambitieux")d.cout=Math.round((d.cout||1)*1.2*10)/10;
  const st=STEPS[d.cat]||["cadrage, textes d'application et désignation des responsables","mobilisation des crédits et des moyens","mise en œuvre sur le terrain et suivi"];
  const ej=Math.round(d.execJ*10)/10;d.plan="1) "+st[0]+" ; 2) "+st[1]+" ; 3) "+st[2]+". Délai d'exécution après votre accord : "+(ej<1?Math.round(ej*24)+" heures":ej+" jours")+". Coût : "+(d.cout||"moins de 1")+" milliard"+(d.cout>=2?"s":"")+" de FCFA"+(d.cout>capOf(d.resp)?", avec un financement complémentaire du budget de l'État":"")+".";
  window.SYS.inbox(S,{from:R.n+", "+R.lab,t:"Plan d'exécution à valider : "+d.titre.slice(0,70),b:"Instruction : « "+d.texte+" »\nMotif de la validation : "+d.why+".\nPlan proposé : "+d.plan+(tr==="negligent"?"\nLe dossier est peu détaillé.":tr==="prudent"?"\nLes risques juridiques et budgétaires sont analysés en annexe.":""),k:"alerte",dir:d.id,valid:true});
  G.toast("Plan d'exécution à valider : "+d.titre.slice(0,60));try{A.speak(R.n+" vous soumet le plan d'exécution de votre instruction, pour validation.",{voix:"f"})}catch(e){}}
DIR.approve=function(S,id){const d=(S.directives||[]).find(x=>x.id===id);if(!d||d.phase!=="valid")return;commit(S,d);d.phase="exec";d.start=S.day;d.due=S.day+d.execJ;
  const m="Plan approuvé : « "+d.titre+" ». Exécution lancée, compte rendu le "+G.dayLabel(d.due)+".";window.SYS.inbox(S,{from:"Secrétariat général",t:"Exécution lancée : "+d.titre.slice(0,70),b:m,k:"info",read:true,reg:d.reg});G.toast(m.slice(0,120));try{A.speak(m,{voix:"f"})}catch(e){}G.render()};
DIR.reject=function(S,id){const d=(S.directives||[]).find(x=>x.id===id);if(!d)return;d.phase=null;d.done=true;d.res="Plan rejeté le "+G.dayLabel(S.day);G.toast("Plan rejeté : rien n'est exécuté.");G.render()};
DIR.econ=function(S,id){const d=(S.directives||[]).find(x=>x.id===id);if(!d)return;d.cout=Math.round((d.cout||1)*.8*10)/10;d.phase="plan";d.planSent=0;d.planDue=S.day+2;d.due=d.planDue+d.execJ;G.toast("Nouvelle version du plan demandée, 20 % moins chère : retour le "+G.dayLabel(d.planDue)+".");G.render()};
function decidePres(S,d){const conf=S.minis?S.minis.conf:60;const ok=Math.random()<.4+conf/200-((d.cout||0)>capOf(S.minis&&S.minis.id)*3?.15:0);
  if(ok){commit(S,d);d.phase="exec";d.start=S.day;d.due=S.day+d.execJ;window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Approuvé : "+d.titre.slice(0,70),b:"Le président de la République a approuvé votre décision « "+d.titre+" ». Vous pouvez l'exécuter ; compte rendu attendu le "+G.dayLabel(d.due)+".",k:"bonne",reg:d.reg});G.toast("La Présidence approuve : « "+d.titre.slice(0,60)+" »")}
  else{d.phase=null;d.done=true;d.res="Non approuvée par la Présidence";window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Non approuvé : "+d.titre.slice(0,70),b:"La Présidence n'a pas approuvé votre décision « "+d.titre+" » ("+pick(["contraintes budgétaires","la mesure doit être examinée en Conseil des ministres","le Premier ministre demande une concertation préalable"])+"). Vous pouvez la reformuler.",k:"alerte",reg:d.reg});G.toast("La Présidence n'approuve pas « "+d.titre.slice(0,50)+" »")}}
function apply(S,d,part){if(!S.st)return;for(const k in d.fx)if(S.st[k]!=null)S.st[k]=clamp(S.st[k]+d.fx[k]*part,0,100);
  if(d.reg)window.SYS.cause(S,d.reg,d.titre,(d.fx.pop||0)*part*2,"directive");if(S.minis)S.minis.perf=clamp(S.minis.perf+part*2,0,100)}

/* ---------- échéance et compte rendu ---------- */
DIR.tick=function(S){if(!S||!S.directives)return;for(const d of S.directives){if(d.done)continue;
    if(d.phase==="plan"){if(S.day>=d.planDue){d.phase="valid";sendPlan(S,d)}continue}
    if(d.phase==="valid")continue;
    if(d.phase==="presid"){if(S.day>=d.planDue)decidePres(S,d);continue}
    // la veille : demander comment recevoir le compte rendu
    if(!d.crAsk&&!d.cr&&d.due-S.day<=1&&d.due-S.day>0&&d.due-d.start>1.5){d.crAsk=1;const R=DIR.resp(S,d);window.SYS.inbox(S,{from:"Secrétariat particulier",t:"Compte rendu attendu le "+G.dayLabel(d.due)+" : "+d.titre.slice(0,70),b:"Le compte rendu de votre instruction « "+d.titre+" » est attendu le "+G.dayLabel(d.due)+".\nVoulez-vous recevoir "+R.n+" ("+R.lab+") en audience pour qu'il vous le présente, ou qu'il vous l'envoie par écrit pour exploitation ?",k:"info",dir:d.id,crAsk:true});G.toast("Compte rendu attendu : écrit ou audience ? (voir votre courrier ou votre agenda)")}
    if(S.day<d.due)continue;
    if(d.cr==="audience"&&!d.audProg){d.audProg=S.day;DIR.audience(S,d,"compte rendu : "+d.titre,true);continue}
    if(d.cr==="audience"&&d.audProg&&S.day<d.due+3)continue;
    d.done=true;report(S,d)}};
/* le responsable qui rend compte */
DIR.resp=function(S,d){if(d.resp&&S.gov&&S.gov.min&&S.gov.min[d.resp]){const g=S.gov.min[d.resp];const m=E.MINISTERES.find(x=>x.id===d.resp);const sx=window.SYS.sexe(g.n);return{k:"min",id:d.resp,min:d.resp,n:g.n,sexe:sx,lab:window.SYS.accord("le ministre "+window.SYS.deM(m?m.n:d.resp)+(m?m.n:d.resp),sx)}}
  if(!d.rn)d.rn=window.SYS.nom("CE");const sx=window.SYS.sexe(d.rn);
  const lab=S.mode==="pres"?"le secrétaire général de la Présidence":S.mode==="min"?"le secrétaire général du ministère":S.mode==="ing"?"le directeur technique":S.profil==="maire"?"le secrétaire général de la mairie":S.opp?"le secrétaire général du parti":"votre collaborateur";
  if(S.mode==="pres"&&S.gov&&S.gov.sg)return{k:"sg",n:S.gov.sg.n,sexe:window.SYS.sexe(S.gov.sg.n),lab:window.SYS.accord(lab,window.SYS.sexe(S.gov.sg.n))};
  return{k:"collab",n:d.rn,sexe:sx,lab:window.SYS.accord(lab,sx)}};
/* prochain créneau de travail : dans l'heure en journée, sinon le lendemain à 9 h */
DIR.slot=function(S,R){const wd=d=>(new Date(2026,9,1).getDay()+Math.floor(d+1/3))%7;const h=((S.day%1)*24+8)%24;const C=[];if(h>=8&&h<16.5)C.push(S.day+1/24);for(let k=1;k<10;k++)C.push(Math.floor(S.day)+k+1/24);
  for(const at of C){if(wd(at)===0||wd(at)===6)continue;if(R&&window.CAB&&R.k==="min"){const st=CAB.status(S,R,at);if(st&&!st.ok)continue}return at}return C[C.length-1]};
DIR.audience=function(S,d,objet,rapport){const R=DIR.resp(S,d);const at=DIR.slot(S,R);S.agenda=S.agenda||[];
  S.agenda.push({id:"a"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),type:"meet",at,who:R,objet,lab:"Audience : "+R.n+" — "+objet.slice(0,70),rapport:rapport?d.id:null,force:R.k!=="min",conf:true});
  G.toast("Audience programmée : "+R.n+", "+G.dayLabel(at)+" à "+Math.floor(((at%1)*24+8)%24)+" h");G.render()};
/* compte rendu remis (par écrit ou en audience) : renvoie le résumé */
DIR.deliver=function(S,id){const d=(S.directives||[]).find(x=>x.id===id);if(!d)return"";if(!d.done){d.done=true;report(S,d)}
  const it=(S.inbox||[]).find(i=>i.dir===d.id&&/^Compte rendu|Déclaration/.test(i.t));return(d.res||"")+(it?" — "+String(it.b).split("\n").slice(-1)[0]:"")};
function report(S,d){const pm=S.gov&&S.gov.pm?S.gov.pm.comp:60;
  if(d.cat==="patrimoine"&&d.liste&&S.gov){const ok=[],ko=[];for(const id of d.liste){const g=S.gov.min[id];if(!g)continue;const p=.35+g.loy/160+(S.st?S.st.int/400:0)+(window.CAB?CAB.traitBonus(g.n):0);(Math.random()<p?ok:ko).push(id)}
    d.ko=ko;d.res=ok.length+" déclarations reçues, "+ko.length+" manquantes";const r=ok.length/(ok.length+ko.length||1);apply(S,d,r*.67);
    const nm=id=>{const m=E.MINISTERES.find(x=>x.id===id);return (S.gov.min[id].n||"?")+" ("+(m?m.n:id)+(window.CAB?", "+CAB.traitLab(S.gov.min[id].n):"")+")"};
    window.SYS.inbox(S,{from:"Commission de déclaration des biens et avoirs",t:"Déclaration des biens : "+ok.length+" déclarations reçues, "+ko.length+" manquantes",
      b:ok.length+" membres du gouvernement ont déposé leur déclaration avec les justificatifs.\n"+(ko.length?"N'ont pas déclaré dans le délai : "+ko.slice(0,8).map(nm).join(", ")+(ko.length>8?" et "+(ko.length-8)+" autres":"")+".":"Tous ont déclaré : c'est une première.")+
      "\nLes déclarations sont transmises à la Commission ; en cas de fausse déclaration ou d'enrichissement illicite, le dossier peut être porté devant le Tribunal criminel spécial.",k:ko.length?"alerte":"rapport",dir:d.id});
    if(ko.length)say("Rapport sur la déclaration des biens : "+ko.length+" membres du gouvernement ne se sont pas exécutés.");return}
  const rg=d.resp&&S.gov&&S.gov.min[d.resp];const tb=rg&&window.CAB?CAB.traitBonus(rg.n):0;const q=clamp(.35+pm/200+(d.cout>100?-.1:0)+tb+Math.random()*.35,0,1);const res=q>.7?"réussie":q>.45?"partielle":"en échec";d.res="Mise en œuvre "+res;apply(S,d,q*.67);
  window.SYS.inbox(S,{from:d.qui,t:"Compte rendu : "+d.titre,b:"Mise en œuvre "+res+" de votre instruction : « "+d.texte+" ».\n"+(rg&&window.CAB?"Responsable : "+rg.n+", "+window.SYS.accord("le ministre",window.SYS.sexe(rg.n)).replace(/^l[ea] /,"")+" "+window.SYS.deM(CAB.minName(S,d.resp))+CAB.minName(S,d.resp)+" ("+CAB.traitLab(rg.n)+" : "+CAB.traitDesc(rg.n)+").\n":"")+(q>.7?"Les services ont exécuté la mesure dans les délais ; les premiers effets sont visibles sur le terrain.":q>.45?"Une partie seulement a été réalisée : lenteurs administratives et retards de décaissement.":"Blocages dans l'administration : la mesure n'a presque pas été appliquée. Il faut relancer ou sanctionner les responsables."),
    k:q>.45?"rapport":"alerte",reg:d.reg,dir:d.id})}

/* ---------- suites possibles depuis le courrier ---------- */
DIR.mailActs=function(S,it){const d=it.dir&&(S.directives||[]).find(x=>x.id===it.dir);if(!d)return"";const f=d.fait||[];
  if(it.valid){if(d.phase!=="valid")return'<p class="small muted">'+(d.done?"Décision prise : "+esc(d.res||""):"Plan déjà validé : exécution en cours.")+'</p>';return '<button class="btn primary" data-dx="vok">✅ Approuver et lancer l\'exécution</button><button class="btn" data-dx="vmod">✏️ Modifier l\'instruction</button><button class="btn" data-dx="veco">💰 Demander une version moins chère</button><button class="btn ghost" data-dx="vno">❌ Rejeter</button>'}
  if(it.crAsk){if(d.done)return'<p class="small muted">Le compte rendu a déjà été remis.</p>';return '<button class="btn primary" data-dx="craud">🤝 Le recevoir en audience pour le compte rendu</button><button class="btn" data-dx="crecr">📄 Rapport écrit pour exploitation</button>'+(d.cr?'<p class="small muted">Choix actuel : '+(d.cr==="audience"?"audience":"rapport écrit")+'</p>':"")}
  if(S.mode!=="pres"&&S.mode!=="min")return /rapport|alerte/.test(it.k)?'<button class="btn" data-dx="discuter">🤝 Recevoir le responsable pour en discuter</button>':"";
  if(d.cat==="patrimoine"&&d.ko&&d.ko.length)return [["delai","Accorder 15 jours de délai supplémentaire"],["publier","Publier la liste au Journal officiel"],["limoger","Limoger les retardataires"],["tcs","Saisir la justice (Tribunal criminel spécial)"]].filter(([k])=>!f.includes(k)).map(([k,l])=>'<button class="btn" data-dx="'+k+'">'+esc(l)+'</button>').join("");
  if(!/rapport|alerte/.test(it.k))return"";return [["discuter","🤝 Recevoir le responsable pour en discuter"],["relance","Relancer les services"],["sanction","Sanctionner les responsables"]].filter(([k])=>!f.includes(k)).map(([k,l])=>'<button class="btn" data-dx="'+k+'">'+esc(l)+'</button>').join("")};
DIR.mailBind=function(S,it,el){const d=it.dir&&(S.directives||[]).find(x=>x.id===it.dir);if(!d)return;
  el.querySelectorAll("[data-dx]").forEach(b=>b.onclick=()=>{const k=b.dataset.dx;
    if(k==="vok"){el.remove();DIR.approve(S,d.id);return}if(k==="vno"){el.remove();DIR.reject(S,d.id);return}if(k==="veco"){el.remove();DIR.econ(S,d.id);return}if(k==="vmod"){el.remove();DIR.edit(S,d.id);return}
    if(k==="craud"||k==="crecr"){d.cr=k==="craud"?"audience":"ecrit";const R=DIR.resp(S,d);const m=d.cr==="audience"?R.n+" vous présentera le compte rendu en audience, le "+G.dayLabel(d.due)+".":R.n+" vous enverra le compte rendu par écrit pour exploitation.";el.remove();G.toast(m);say(m);G.render();return}
    if(k==="discuter"){if(!(d.fait||[]).includes("discuter")){d.fait=d.fait||[];d.fait.push(k)}el.remove();DIR.audience(S,d,"suite du compte rendu : "+d.titre,false);return}
    d.fait=d.fait||[];d.fait.push(k);let msg="";
    if(k==="delai"){d.done=false;d.due=S.day+15;d.liste=d.ko.slice();msg="Un délai de 15 jours est accordé aux retardataires."}
    else if(k==="publier"){if(S.st){S.st.int=clamp(S.st.int+2,0,100);S.st.pop=clamp(S.st.pop+1,0,100)}for(const id of d.ko)if(S.gov.min[id])S.gov.min[id].loy=clamp(S.gov.min[id].loy-6,0,100);msg="La liste est publiée au Journal officiel. L'opinion applaudit ; les ministres visés sont fragilisés."}
    else if(k==="limoger"){let n=0;for(const id of d.ko){const r=pick(CM.REGIONS).id;S.gov.min[id]={n:window.SYS.nom(r),reg:r,comp:Math.round(G.rnd(50,80)),loy:80};n++}if(S.st){S.st.int=clamp(S.st.int+3,0,100);S.st.pop=clamp(S.st.pop+2,0,100)}msg=n+" ministre"+(n>1?"s":"")+" limogé"+(n>1?"s":"")+" et remplacé"+(n>1?"s":"")+" par décret."}
    else if(k==="tcs"){window.SYS.newCase(S,"corruption","CE",Math.min(4,d.ko.length),"Yaoundé");if(S.st)S.st.int=clamp(S.st.int+2,0,100);msg="Le Tribunal criminel spécial est saisi ; une enquête pour enrichissement illicite est ouverte."}
    else if(k==="relance"){d.done=false;d.due=S.day+30;msg="Les services sont relancés ; nouveau rapport dans 30 jours."}
    else if(k==="sanction"){if(S.st)S.st.int=clamp(S.st.int+1,0,100);if(S.gov&&S.gov.pm)S.gov.pm.loy=clamp(S.gov.pm.loy-2,0,100);d.done=false;d.due=S.day+30;msg="Des responsables sont relevés de leurs fonctions ; la mesure est relancée."}
    el.remove();G.toast(msg);say(msg);window.SYS.inbox(S,{from:"Cabinet",t:"Suite : "+d.titre,b:msg,k:"info",read:true});G.render()})};

/* modifier une directive en cours : consigne, région, délai */
DIR.edit=function(S,id){const d=(S.directives||[]).find(x=>x.id===id);if(!d||d.done)return;const rest=Math.max(1,Math.round(d.due-S.day));
  G.sheet('<span class="eyebrow">Modifier la directive</span><h3 class="h2">'+esc(d.titre)+'</h3>'+
   '<label class="f" for="deTx">Votre instruction<textarea id="deTx" rows="4" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit">'+esc(d.texte||"")+'</textarea></label>'+
   '<label class="f" for="deReg">Région concernée<select id="deReg"><option value="">Tout le pays</option>'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(d.reg===r.id?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label>'+
   '<label class="f" for="deJ">Délai d\'exécution restant (jours)<input type="number" id="deJ" min="1" max="720" value="'+rest+'"></label>'+
   '<p class="small muted">Raccourcir le délai coûte plus cher et augmente le risque d\'échec ; changer l\'instruction relance l\'analyse de la mesure.</p>'+
   '<div class="row"><button class="btn primary" id="deOk">Enregistrer les modifications</button><button class="btn ghost" id="deNo">Annuler</button></div>',el=>{el.setAttribute("data-noinstr","");
    el.querySelector("#deNo").onclick=()=>{el.remove();DIR.sheet(S)};
    el.querySelector("#deOk").onclick=()=>{const tx=el.querySelector("#deTx").value.trim();if(!tx)return G.toast("L'instruction ne peut pas être vide.");const j=Math.max(1,Math.min(720,+el.querySelector("#deJ").value||rest));const rg=el.querySelector("#deReg").value||null;
      const ch=[];if(tx!==d.texte){const t=norm(tx);const c=CAT.find(x=>x.re.test(t))||GENERIC;const oldCost=d.cout||0;d.texte=tx;d.cat=c.id;d.fx={...c.fx};d.base=c.base||"";
        d.titre=cut(stripTxt(tx),140);d.domaine=c===GENERIC?"Directive":c.titre+(c.id==="construire"&&rg?" : "+CM.REG[rg].n:"");if(window.CAB&&S.mode==="pres")d.resp=CAB.resp(c.id);
        d.cout=c.cout;const extra=Math.max(0,d.cout-oldCost)*.25;if(extra){if(S.mode==="pres")S.nums.dette+=extra;else if(S.mode==="min")S.minis.fonds=Math.max(0,S.minis.fonds-extra*1000)}ch.push("instruction")}
      if(rg!==d.reg){d.reg=rg;ch.push("région")}
      if(j!==rest){const faster=j<rest;d.due=S.day+j;if(faster){const extra=(d.cout||2)*.25*(rest/j-1)*.3;if(S.mode==="pres")S.nums.dette+=extra;else if(S.mode==="min")S.minis.fonds=Math.max(0,S.minis.fonds-extra*1000);d.cout=Math.round((d.cout||0)*(1+.3*(rest/j-1)))}ch.push("délai")}
      el.remove();if(!ch.length){DIR.sheet(S);return}
      const msg="Directive modifiée ("+ch.join(", ")+") : "+d.titre+". Nouvelle échéance : "+G.dayLabel(d.due)+".";
      window.SYS.inbox(S,{from:d.qui||"Cabinet",t:"Modification : "+d.titre.slice(0,70),b:"Nouvelle instruction : « "+d.texte+" »\n"+msg,k:"info",read:true,reg:d.reg});G.toast(msg.slice(0,120));try{A.speak(msg,{voix:"f"})}catch(e){}G.render();DIR.sheet(S)}})};
/* carte de suivi (dépliable) et fiche détaillée */
const tDir=d=>d.titre==="Directive"?(d.texte||"Directive").slice(0,80):d.titre;
DIR.card=function(S){const all=S.directives||[];const L=all.filter(d=>!d.done);if(!all.length)return"";
  return '<div class="card" data-dirall role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>📜 Directives en cours ('+L.length+')</b><span class="small muted">Détails ▸</span></div>'+
   (L.length?L.slice(-5).reverse().map(d=>'<div class="small">• '+esc(tDir(d))+' — <span class="muted">'+(d.phase==="plan"?"plan attendu le "+esc(G.dayLabel(d.planDue)):d.phase==="valid"?"<b>à valider</b>":d.phase==="presid"?"en attente de la Présidence":"rapport le "+esc(G.dayLabel(d.due)))+'</span></div>').join(""):'<div class="small muted">Aucune en cours · '+all.length+' terminée'+(all.length>1?"s":"")+'</div>')+'</div>'};
DIR.bindCard=function(S,root){(root||document).querySelectorAll("[data-dirall]").forEach(c=>{c.onclick=()=>DIR.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();DIR.sheet(S)}}})};
DIR.sheet=function(S){const all=(S.directives||[]).slice().reverse();const on=all.filter(d=>!d.done),off=all.filter(d=>d.done);
  const item=d=>{const tot=Math.max(1,d.due-d.start),pct=Math.max(0,Math.min(100,Math.round((S.day-d.start)*100/tot)));
    return '<div class="card" style="gap:6px"><b>'+esc(tDir(d))+'</b>'+(d.texte&&tDir(d)!==d.texte?'<span class="small">Votre instruction : « '+esc(d.texte)+' »</span>':"")+
     '<div class="kv small">'+(d.domaine?'<span>Domaine</span><b>'+esc(d.domaine)+'</b>':"")+(d.dossier?'<span>Dossier</span><b>'+esc(d.dossier)+'</b>':"")+'<span>Donnée par</span><b>'+esc(d.qui||"")+'</b><span>Concerne</span><b>'+esc(d.cat==="patrimoine"?d.cible.lab:d.reg?CM.REG[d.reg].n:"Tout le pays")+'</b>'+
     (d.base?'<span>Base légale</span><b>'+esc(d.base)+'</b>':"")+'<span>Lancée le</span><b>'+esc(G.dayLabel(d.start))+'</b><span>Échéance</span><b>'+esc(G.dayLabel(d.due))+(d.done?"":d.due-S.day<2?" ("+Math.max(1,Math.round((d.due-S.day)*24))+" h)":" ("+Math.max(0,Math.round(d.due-S.day))+" j)")+'</b>'+
     (d.cout?'<span>Coût estimé</span><b>'+d.cout+' Md FCFA</b>':"")+'<span>Statut</span><b>'+(d.done?esc(d.res||"Terminée : compte rendu au courrier"):d.phase==="plan"?"Plan d'exécution en préparation (retour le "+esc(G.dayLabel(d.planDue))+")":d.phase==="valid"?"⏳ En attente de votre validation":d.phase==="presid"?"En attente de l'approbation de la Présidence":"En cours d'exécution")+'</b>'+(d.why&&!d.done?'<span>Validation requise</span><b>'+esc(d.why)+'</b>':"")+(d.plan&&!d.done?'<span>Plan proposé</span><b>'+esc(d.plan)+'</b>':"")+'</div>'+
     (d.phase==="valid"&&!d.done?'<div class="row"><button class="btn small primary" data-dvok="'+d.id+'">✅ Approuver et lancer</button><button class="btn small" data-dveco="'+d.id+'">💰 Version moins chère</button><button class="btn small ghost" data-dvno="'+d.id+'">❌ Rejeter</button></div>':"")+
     (d.done?'':'<div class="row small" style="gap:6px;align-items:center"><span>Compte rendu :</span><button class="btn small'+(d.cr!=="audience"?" primary":"")+'" data-dcr="ecrit" data-id="'+d.id+'" aria-pressed="'+(d.cr!=="audience")+'">📄 Par écrit</button><button class="btn small'+(d.cr==="audience"?" primary":"")+'" data-dcr="audience" data-id="'+d.id+'" aria-pressed="'+(d.cr==="audience")+'">🤝 En audience ('+esc(DIR.resp(S,d).n)+')</button></div>')+
     (d.done?'<div class="row"><button class="btn small primary" data-dreact="'+d.id+'">↩️ Réactiver la directive</button><button class="btn small ghost" data-ddel="'+d.id+'">🗑️ Supprimer définitivement</button></div>':"")+(d.done?"":'<div class="bar"><i style="width:'+pct+'%"></i></div><div class="row"><button class="btn small primary" data-dedit="'+d.id+'">✏️ Modifier</button><button class="btn small" data-dacc="'+d.id+'">Accélérer (+50 % du coût, délai réduit d\'un tiers)</button><button class="btn small ghost" data-dann="'+d.id+'">Annuler la directive</button><button class="btn small ghost" data-ddel="'+d.id+'">🗑️ Supprimer</button></div>')+'</div>'};
  G.sheet('<span class="eyebrow">Suivi</span><h3 class="h2">Vos directives</h3>'+(on.length?'<span class="eyebrow">En cours ('+on.length+')</span>'+on.map(item).join(""):'<p class="small muted">Aucune directive en cours.</p>')+
   (off.length?'<span class="eyebrow">Terminées ('+off.length+')</span>'+off.map(item).join(""):""),el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-dedit]").forEach(b=>b.onclick=()=>{el.remove();DIR.edit(S,b.dataset.dedit)});
    el.querySelectorAll("[data-dreact]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.dreact);if(!d)return;const was=d.res||"";d.done=false;d.res="";d.audProg=null;d.crAsk=0;d.start=S.day;d.due=S.day+Math.max(1,/^Annulée/.test(was)?(d.restant||7):30);if(S.st)S.st.int=clamp(S.st.int+.5,0,100);const m="Directive réactivée : « "+d.titre+" ». Nouvelle échéance : "+G.dayLabel(d.due)+".";G.toast(m.slice(0,110));try{A.speak(m,{voix:"f"})}catch(e){}window.SYS.inbox(S,{from:d.qui||"Cabinet",t:"Réactivation : "+d.titre.slice(0,70),b:m,k:"info",read:true});el.remove();DIR.sheet(S);G.render()});
    el.querySelectorAll("[data-dvok]").forEach(b=>b.onclick=()=>{DIR.approve(S,b.dataset.dvok);el.remove();DIR.sheet(S)});el.querySelectorAll("[data-dveco]").forEach(b=>b.onclick=()=>{DIR.econ(S,b.dataset.dveco);el.remove();DIR.sheet(S)});el.querySelectorAll("[data-dvno]").forEach(b=>b.onclick=()=>{DIR.reject(S,b.dataset.dvno);el.remove();DIR.sheet(S)});
    el.querySelectorAll("[data-dcr]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.id);if(!d)return;d.cr=b.dataset.dcr;const R=DIR.resp(S,d);G.toast(d.cr==="audience"?R.n+" vous présentera le compte rendu en audience.":"Compte rendu par écrit, pour exploitation.");el.remove();DIR.sheet(S)});
    el.querySelectorAll("[data-ddel]").forEach(b=>b.onclick=()=>{const id=b.dataset.ddel;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="⚠️ Confirmer la suppression définitive";b.classList.add("primary");return}
      S.directives=S.directives.filter(x=>x.id!==id);S.agenda=(S.agenda||[]).filter(a=>a.rapport!==id);if(S.doss&&S.doss.L)S.doss.L.forEach(x=>{if(x.dir===id)x.dir=null});if(S.cab&&S.cab.props)S.cab.props=S.cab.props.filter(p=>!(p.x&&p.x.id===id));
      G.toast("Directive supprimée définitivement.");el.remove();DIR.sheet(S);G.render()});
    el.querySelectorAll("[data-dacc]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.dacc);if(!d)return;const extra=(d.cout||2)*.5*.25;
      if(S.mode==="pres")S.nums.dette+=extra;else if(S.mode==="min"){const M=extra*1000;if(S.minis.fonds<M)return G.toast("Crédits insuffisants.");S.minis.fonds-=M}
      d.due=Math.max(S.day+1,d.due-(d.due-S.day)/3);d.cout=Math.round((d.cout||2)*1.5);G.toast("Exécution accélérée : rapport le "+G.dayLabel(d.due));el.remove();DIR.sheet(S);G.render()});
    el.querySelectorAll("[data-dann]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.dann);if(!d)return;d.restant=Math.max(1,d.due-S.day);d.done=true;d.res="Annulée le "+G.dayLabel(S.day);if(S.st)S.st.int=clamp(S.st.int-.5,0,100);G.toast("Directive annulée");el.remove();DIR.sheet(S);G.render()})})};
})();
