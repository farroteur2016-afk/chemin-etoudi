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
 {id:"audit",re:/audit|corruption|detourn|conac|controle superieur|consupe|enquete sur|inspection generale|gestion des fonds/,titre:"Opération d'audit et de lutte contre la corruption",fx:{int:2,eco:.5,pop:1},loy:-2,delai:45,cout:2},
 {id:"prix",re:/baisse|vie chere|prix des?|carburant|subvention|pouvoir d achat|panier de la menagere/,titre:"Mesures contre la vie chère",fx:{pop:3,soc:1,eco:-1},delai:20,cout:60},
 {id:"arrieres",re:/arriere|primes?|salaires?|rappels?|dette interieure|dette academique|payer (les |leurs )?/,titre:"Apurement des arriérés et des primes",fx:{soc:3,pop:1},delai:30,cout:40},
 {id:"emploi",re:/recrut|emploi des jeunes|chomage|jeunes diplomes|insertion/,titre:"Programme spécial d'emploi des jeunes",fx:{pop:2,soc:1},delai:90,cout:50},
 {id:"construire",re:/constru|batir|bitum|rehabilit|refaire la route|route|pont|hopital|ecole|forage|universite|stade|barrage|logements?/,titre:"Grands travaux",fx:{infra:3,pop:1},delai:180,cout:80},
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

DIR.matches=t=>{t=norm(t);return CAT.some(c=>c.re.test(t))||IMPER.test(t)};

/* ---------- compétence ---------- */
function scope(S,c,t){if(S.mode==="pres")return{ok:true,qui:"Présidence de la République"};
  if(S.mode==="min"){const m=E.MINISTERES.find(x=>x.id===S.minis.id);const mine=c.id==="patrimoine"?/mon ministere|mes (collaborateurs|directeurs)|de mon/.test(t):true;
    if(c.k==="ministres"&&!mine)return{ok:false,msg:"Seul le président de la République peut imposer cela à tout le gouvernement. Je transmets votre proposition à la Présidence ; vous pouvez l'appliquer dans votre propre ministère."};return{ok:true,qui:"Ministère "+(m?m.n:"")}}
  if(S.profil==="maire")return{ok:true,qui:"Mairie",local:true};
  if(S.opp)return{ok:false,msg:"Vous n'êtes pas au pouvoir : votre parti en fait une proposition publique et interpelle le gouvernement.",opp:true};
  return{ok:false,msg:"Cette décision relève des autorités. Votre demande est transmise sous forme de pétition.",pet:true}}

/* ---------- lancement ---------- */
DIR.handle=async function(S,raw,reply){if(!S||S.phase!=="play")return false;const t=norm(raw);if(!DIR.matches(t))return false;reply=reply||(m=>{say(m)});
  let c=CAT.find(x=>x.re.test(t))||GENERIC;const cb=cible(t);const sc=scope(S,{...c,k:cb.k},t);
  if(!sc.ok){if(sc.opp){S.opp.noto=clamp(S.opp.noto+1.5,0,100)}window.SYS.inbox(S,{from:sc.opp?"Votre parti":"Pétitions",t:"Proposition : "+raw.slice(0,80),b:sc.msg,k:"info",read:true});reply(sc.msg);G.render();return true}
  let d={id:nid(),resp:S.mode==="pres"&&window.CAB?CAB.resp(c.id):null,cat:c.id,titre:c.titre,texte:raw,cible:cb,reg:region(t),qui:sc.qui,start:S.day,due:S.day+c.delai,cout:c.cout,fx:{...c.fx},loy:c.loy||0,done:false};
  if(c.id==="construire"&&d.reg){d.titre+=" : "+CM.REG[d.reg].n}
  if(c===GENERIC){const x=raw.trim().replace(/^(je veux|j'exige|j'ordonne|il faut|je demande|faites en sorte)\s+(?=(que|qu'))/i,"").replace(/^(j'ordonne|il faut|faites)\s+/i,"");d.titre=(x.charAt(0).toUpperCase()+x.slice(1)).slice(0,80)}
  if(sample&&!refused&&(c===GENERIC||c.id==="construire"||c.id==="interdire")){try{const j=await sample.json(
    "Jeu de simulation politique réaliste au Cameroun (2026). Le joueur ("+sc.qui+") donne cette directive : « "+raw+" ».\n"+
    "Qualifie-la de façon réaliste. Réponds uniquement en JSON : {\"titre\": \"titre officiel court\", \"base_legale\": \"texte camerounais applicable ou chaîne vide\", \"delai_jours\": 7-365, \"cout_milliards_fcfa\": 0-500, "+
    "\"effets\": {\"pop\":-5..5,\"eco\":-5..5,\"soc\":-5..5,\"sec\":-5..5,\"infra\":-5..5,\"int\":-5..5}, \"reaction\": \"une phrase : réaction de l'opinion et de la presse\"}",{modelTier:"quick",cache:false});
    if(j&&j.titre){d.titre=String(j.titre).slice(0,90);d.base=String(j.base_legale||"");d.due=S.day+clamp(+j.delai_jours||30,7,365);d.cout=clamp(+j.cout_milliards_fcfa||0,0,500);d.reaction=String(j.reaction||"");
      d.fx={};for(const k of ["pop","eco","soc","sec","infra","int"])d.fx[k]=clamp(+((j.effets||{})[k])||0,-5,5)}}catch(e){if(e&&e.code==="not_granted")refused=true}}
  if(c.base)d.base=c.base;
  // coût (en milliards : État, ministère ou commune)
  if(d.cout){if(S.mode==="pres")S.nums.dette+=d.cout*.25;else if(S.mode==="min"){const M=d.cout*.25*1000;if(S.minis.fonds<M){reply("Les crédits de votre ministère ne suffisent pas pour cette mesure ("+Math.round(M)+" M FCFA). Demandez une rallonge au Premier ministre.");return true}S.minis.fonds-=M}
    else if(sc.local&&S.opp&&S.opp.commune){const M=Math.min(S.opp.commune.fonds,d.cout*5);S.opp.commune.fonds-=M}}
  // effet d'annonce immédiat (le tiers), le reste à l'exécution
  apply(S,d,1/3);
  if(c.id==="patrimoine"&&S.gov&&cb.k==="ministres"&&S.mode==="pres"){d.liste=Object.keys(S.gov.min);for(const id of d.liste){const g=S.gov.min[id];g.loy=clamp(g.loy+d.loy,0,100)}}
  S.directives=S.directives||[];S.directives.push(d);S.directives=S.directives.slice(-60);
  const when=G.dayLabel(d.due);
  const txt=(S.mode==="pres"?"Directive présidentielle":"Décision")+" enregistrée : "+d.titre.charAt(0).toLowerCase()+d.titre.slice(1)+(c.id==="patrimoine"?", pour "+cb.lab:"")+"."+(d.base?" Base légale : "+d.base+".":"")+
    (S.mode==="pres"?" Le secrétaire général de la Présidence la notifie aux intéressés.":"")+" Premier rapport attendu le "+when+"."+(d.cout?" Coût estimé : "+d.cout+" milliards de FCFA.":"");
  window.SYS.inbox(S,{from:sc.qui,t:d.titre,b:"Votre instruction : « "+raw+" »\n"+txt+(d.reaction?"\n"+d.reaction:c.id==="patrimoine"?"\nLa presse salue une décision attendue depuis 1996 ; plusieurs ministres s'inquiètent en privé.":""),k:"info",read:true,reg:d.reg});
  reply(txt);G.render();return true};

function apply(S,d,part){if(!S.st)return;for(const k in d.fx)if(S.st[k]!=null)S.st[k]=clamp(S.st[k]+d.fx[k]*part,0,100);
  if(d.reg)window.SYS.cause(S,d.reg,d.titre,(d.fx.pop||0)*part*2,"directive");if(S.minis)S.minis.perf=clamp(S.minis.perf+part*2,0,100)}

/* ---------- échéance et compte rendu ---------- */
DIR.tick=function(S){if(!S||!S.directives)return;for(const d of S.directives)if(!d.done&&S.day>=d.due){d.done=true;report(S,d)}};
function report(S,d){const pm=S.gov&&S.gov.pm?S.gov.pm.comp:60;
  if(d.cat==="patrimoine"&&d.liste&&S.gov){const ok=[],ko=[];for(const id of d.liste){const g=S.gov.min[id];if(!g)continue;const p=.35+g.loy/160+(S.st?S.st.int/400:0)+(window.CAB?CAB.traitBonus(g.n):0);(Math.random()<p?ok:ko).push(id)}
    d.ko=ko;d.res=ok.length+" déclarations reçues, "+ko.length+" manquantes";const r=ok.length/(ok.length+ko.length||1);apply(S,d,r*.67);
    const nm=id=>{const m=E.MINISTERES.find(x=>x.id===id);return (S.gov.min[id].n||"?")+" ("+(m?m.n:id)+(window.CAB?", "+CAB.traitLab(S.gov.min[id].n):"")+")"};
    window.SYS.inbox(S,{from:"Commission de déclaration des biens et avoirs",t:"Déclaration des biens : "+ok.length+" déclarations reçues, "+ko.length+" manquantes",
      b:ok.length+" membres du gouvernement ont déposé leur déclaration avec les justificatifs.\n"+(ko.length?"N'ont pas déclaré dans le délai : "+ko.slice(0,8).map(nm).join(", ")+(ko.length>8?" et "+(ko.length-8)+" autres":"")+".":"Tous ont déclaré : c'est une première.")+
      "\nLes déclarations sont transmises à la Commission ; en cas de fausse déclaration ou d'enrichissement illicite, le dossier peut être porté devant le Tribunal criminel spécial.",k:ko.length?"alerte":"rapport",dir:d.id});
    if(ko.length)say("Rapport sur la déclaration des biens : "+ko.length+" membres du gouvernement ne se sont pas exécutés.");return}
  const rg=d.resp&&S.gov&&S.gov.min[d.resp];const tb=rg&&window.CAB?CAB.traitBonus(rg.n):0;const q=clamp(.35+pm/200+(d.cout>100?-.1:0)+tb+Math.random()*.35,0,1);const res=q>.7?"réussie":q>.45?"partielle":"en échec";d.res="Mise en œuvre "+res;apply(S,d,q*.67);
  window.SYS.inbox(S,{from:d.qui,t:"Compte rendu : "+d.titre,b:"Mise en œuvre "+res+" de votre instruction : « "+d.texte+" ».\n"+(rg&&window.CAB?"Responsable : "+rg.n+", ministre "+CAB.minName(S,d.resp)+" ("+CAB.traitLab(rg.n)+" : "+CAB.traitDesc(rg.n)+").\n":"")+(q>.7?"Les services ont exécuté la mesure dans les délais ; les premiers effets sont visibles sur le terrain.":q>.45?"Une partie seulement a été réalisée : lenteurs administratives et retards de décaissement.":"Blocages dans l'administration : la mesure n'a presque pas été appliquée. Il faut relancer ou sanctionner les responsables."),
    k:q>.45?"rapport":"alerte",reg:d.reg,dir:d.id})}

/* ---------- suites possibles depuis le courrier ---------- */
DIR.mailActs=function(S,it){const d=it.dir&&(S.directives||[]).find(x=>x.id===it.dir);if(!d||S.mode!=="pres"&&S.mode!=="min")return"";const f=d.fait||[];
  if(d.cat==="patrimoine"&&d.ko&&d.ko.length)return [["delai","Accorder 15 jours de délai supplémentaire"],["publier","Publier la liste au Journal officiel"],["limoger","Limoger les retardataires"],["tcs","Saisir la justice (Tribunal criminel spécial)"]].filter(([k])=>!f.includes(k)).map(([k,l])=>'<button class="btn" data-dx="'+k+'">'+esc(l)+'</button>').join("");
  if(!/rapport|alerte/.test(it.k))return"";return [["relance","Relancer les services"],["sanction","Sanctionner les responsables"]].filter(([k])=>!f.includes(k)).map(([k,l])=>'<button class="btn" data-dx="'+k+'">'+esc(l)+'</button>').join("")};
DIR.mailBind=function(S,it,el){const d=it.dir&&(S.directives||[]).find(x=>x.id===it.dir);if(!d)return;
  el.querySelectorAll("[data-dx]").forEach(b=>b.onclick=()=>{const k=b.dataset.dx;d.fait=d.fait||[];d.fait.push(k);let msg="";
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
        if(c===GENERIC){const x=tx.replace(/^(je veux|j'exige|j'ordonne|il faut|je demande|faites en sorte)\s+(?=(que|qu'))/i,"").replace(/^(j'ordonne|il faut|faites)\s+/i,"");d.titre=(x.charAt(0).toUpperCase()+x.slice(1)).slice(0,80)}else d.titre=c.titre+(c.id==="construire"&&rg?" : "+CM.REG[rg].n:"");
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
   (L.length?L.slice(-5).reverse().map(d=>'<div class="small">• '+esc(tDir(d))+' — <span class="muted">rapport le '+esc(G.dayLabel(d.due))+'</span></div>').join(""):'<div class="small muted">Aucune en cours · '+all.length+' terminée'+(all.length>1?"s":"")+'</div>')+'</div>'};
DIR.bindCard=function(S,root){(root||document).querySelectorAll("[data-dirall]").forEach(c=>{c.onclick=()=>DIR.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();DIR.sheet(S)}}})};
DIR.sheet=function(S){const all=(S.directives||[]).slice().reverse();const on=all.filter(d=>!d.done),off=all.filter(d=>d.done);
  const item=d=>{const tot=Math.max(1,d.due-d.start),pct=Math.max(0,Math.min(100,Math.round((S.day-d.start)*100/tot)));
    return '<div class="card" style="gap:6px"><b>'+esc(tDir(d))+'</b>'+(d.texte&&tDir(d)!==d.texte?'<span class="small">Votre instruction : « '+esc(d.texte)+' »</span>':"")+
     '<div class="kv small"><span>Donnée par</span><b>'+esc(d.qui||"")+'</b><span>Concerne</span><b>'+esc(d.cat==="patrimoine"?d.cible.lab:d.reg?CM.REG[d.reg].n:"Tout le pays")+'</b>'+
     (d.base?'<span>Base légale</span><b>'+esc(d.base)+'</b>':"")+'<span>Lancée le</span><b>'+esc(G.dayLabel(d.start))+'</b><span>Échéance</span><b>'+esc(G.dayLabel(d.due))+(d.done?"":" ("+Math.max(0,Math.round(d.due-S.day))+" j)")+'</b>'+
     (d.cout?'<span>Coût estimé</span><b>'+d.cout+' Md FCFA</b>':"")+'<span>Statut</span><b>'+(d.done?esc(d.res||"Terminée : compte rendu au courrier"):"En cours d'exécution")+'</b></div>'+
     (d.done?"":'<div class="bar"><i style="width:'+pct+'%"></i></div><div class="row"><button class="btn small primary" data-dedit="'+d.id+'">✏️ Modifier</button><button class="btn small" data-dacc="'+d.id+'">Accélérer (+50 % du coût, délai réduit d\'un tiers)</button><button class="btn small ghost" data-dann="'+d.id+'">Annuler la directive</button></div>')+'</div>'};
  G.sheet('<span class="eyebrow">Suivi</span><h3 class="h2">Vos directives</h3>'+(on.length?'<span class="eyebrow">En cours ('+on.length+')</span>'+on.map(item).join(""):'<p class="small muted">Aucune directive en cours.</p>')+
   (off.length?'<span class="eyebrow">Terminées ('+off.length+')</span>'+off.map(item).join(""):""),el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-dedit]").forEach(b=>b.onclick=()=>{el.remove();DIR.edit(S,b.dataset.dedit)});
    el.querySelectorAll("[data-dacc]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.dacc);if(!d)return;const extra=(d.cout||2)*.5*.25;
      if(S.mode==="pres")S.nums.dette+=extra;else if(S.mode==="min"){const M=extra*1000;if(S.minis.fonds<M)return G.toast("Crédits insuffisants.");S.minis.fonds-=M}
      d.due=Math.max(S.day+1,d.due-(d.due-S.day)/3);d.cout=Math.round((d.cout||2)*1.5);G.toast("Exécution accélérée : rapport le "+G.dayLabel(d.due));el.remove();DIR.sheet(S);G.render()});
    el.querySelectorAll("[data-dann]").forEach(b=>b.onclick=()=>{const d=S.directives.find(x=>x.id===b.dataset.dann);if(!d)return;d.done=true;d.res="Annulée le "+G.dayLabel(S.day);if(S.st)S.st.int=clamp(S.st.int-.5,0,100);G.toast("Directive annulée");el.remove();DIR.sheet(S);G.render()})})};
})();
