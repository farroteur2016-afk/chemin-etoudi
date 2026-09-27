/* Chemin d'Etoudi — systèmes de l'État : humeur sociale, justice, rapports d'experts, marchés publics,
   gouvernement et budget, défense, diplomatie, ressources, parti politique et mandats locaux. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const SYS={};window.SYS=SYS;
let uid=1;const nid=()=>Date.now().toString(36)+(uid++);
const S_=()=>G.S;
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
const lc1=x=>x.charAt(0).toLowerCase()+x.slice(1);
const deR=r=>(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n;

/* ---------- noms ---------- */
function nom(reg){return pick(E.PRENOMS)+" "+pick(E.NOMS[reg]||E.NOMS.CE)}
function regAlea(){const t=Math.random()*30.36;let a=0;for(const r of CM.REGIONS){a+=r.pop;if(t<=a)return r.id}return"CE"}
SYS.nom=nom;

/* ---------- initialisation ---------- */
SYS.init=function(S,o){
  S.mood={};for(const r of CM.REGIONS){S.mood[r.id]={v:clamp(.35*S.regs[r.id].sec+.25*S.regs[r.id].elec+22,15,85),c:[]}}
  seedCauses(S);
  S.inbox=[];S.cases=[];S.tasks=[];S.projects=[];S.intel={};S.diasp=[];
  if(S.mode==="pres")initGov(S);
  else if(S.mode==="opp")initParty(S,o);
  S.mines=Object.fromEntries(E.MINES.map(m=>[m.id,m.st]));
  S.transp=Object.fromEntries(E.TRANSPORTS.map(t=>[t.id,t.etat]));
  S.diplo=Object.fromEntries(E.PAYS.map(p=>[p.id,p.rel]));
  initPrive(S);
  // quelques dossiers déjà devant les tribunaux
  newCase(S,"casse","CE",18);newCase(S,"corruption","CE",3);newCase(S,"terror","EN",9);
  if(window.JUS)JUS.init(S);
};
function seedCauses(S){
  const init=[["EN","Attaques de Boko Haram et enlèvements autour de Mora et Kolofata",-6,"securite"],["NW","Combats et « villes mortes » chaque lundi à Bamenda",-8,"paix"],["SW","Enlèvements sur la route de Kumba",-7,"paix"],["LT","Délestages de 6 à 8 heures par jour à Douala",-4,"electricite"],["CE","Pénuries d'eau dans plusieurs quartiers de Yaoundé",-3,"eau"],["AD","Prises d'otages d'éleveurs près de Meiganga",-4,"securite"],["ES","Pistes impraticables entre Bertoua et Batouri",-3,"routes"],["NO","Enlèvements contre rançon sur les axes de Garoua",-3,"securite"],["OU","Colère des commerçants contre les taxes au marché A de Bafoussam",-2,"emploi"],["SU","Satisfaction autour des emplois du port de Kribi",2,"emploi"]];
  for(const [r,t,d,ty] of init)S.mood[r].c.push({t,d,ty,m:S.m});
}
function initGov(S){
  const gov={min:{},pm:{n:"Joseph Dion Ngute",reg:"SW",comp:62,loy:80,reel:1},vp:null,sg:{n:nom("SU"),reg:"SU",comp:70,loy:85},alloc:{},fisc:{},smig:E.SALAIRES.smigPrive,indice:100,recrues:{},etat:[]};
  const regs=CM.REGIONS.map(r=>r.id);
  E.MINISTERES.forEach((m,i)=>{const reg=regs[(i*7)%10];gov.min[m.id]={n:nom(reg),reg,comp:Math.round(rnd(45,78)),loy:Math.round(rnd(60,90))};gov.alloc[m.id]=m.b});
  E.FISCAL.forEach(f=>gov.fisc[f.id]=f.v);
  for(const id in gov.min)tdvFor(gov.min[id]);
  gov.tdv=Object.fromEntries(E.TRAIN.map(t=>[t.id,"normal"]));
  S.gov=gov;
  S.def={alloc:Object.fromEntries(E.DEFENSE.theatres.map(t=>[t.id,t.base])),eff:E.DEFENSE.effectifs,bir:E.DEFENSE.bir,equip:[],espUsed:-1};
  S.diploUsed={m:-1,n:0};
}
function initParty(S,o){
  const P=S.opp;const custom=!!o.custom;
  // militants répartis dans les 10 régions
  const total=custom?10000:Math.round(P.militants);const w={};let tw=0;
  for(const r of CM.REGIONS){w[r.id]=custom?(r.pop+(r.id===o.home?2:0)):Math.max(.2,(S.sup[r.id][S.party]||0))*r.pop;tw+=w[r.id]}
  P.milReg={};let acc=0;CM.REGIONS.forEach((r,i)=>{const v=i===9?total-acc:Math.round(total*w[r.id]/tw);P.milReg[r.id]=v;acc+=v});
  P.militants=total;
  if(custom)P.fonds=50;
  P.experts=E.DOMAINES.map(d=>{const reg=regAlea();return{dom:d.id,n:nom(reg),reg,skill:Math.round(rnd(58,82)),diaspora:0}});
  P.bureau={};P.bureau["Président du parti"]="moi";
  P.bureau["Secrétaire général"]=0+"";P.bureau["Trésorier"]=String(E.DOMAINES.findIndex(d=>d.id==="fin"));P.bureau["Porte-parole"]=String(E.DOMAINES.findIndex(d=>d.id==="com"));P.bureau["Conseiller juridique"]=String(E.DOMAINES.findIndex(d=>d.id==="droit"));
  P.mandats=[];P.cand={mun:{reg:o.home,ville:CM.REG[o.home].chef},leg:{reg:o.home}};P.commune=null;P.cotiM=-9;P.depUsed=-1;
}

/* ---------- humeur ---------- */
const MOODS=[[65,"Satisfaits","#43c47c"],[52,"Calmes","#a3c94a"],[40,"Mécontents","#f6c945"],[28,"En colère","#f08a3a"],[-1,"Au bord de la révolte","#ef5350"]];
function moodInfo(v){for(const m of MOODS)if(v>=m[0])return m;return MOODS[4]}
SYS.moodInfo=moodInfo;
SYS.cause=function(S,reg,t,d,ty){if(!S.mood||!S.mood[reg])return;S.mood[reg].c.unshift({t,d,ty:ty||"",m:S.m});S.mood[reg].c=S.mood[reg].c.slice(0,8);S.mood[reg].v=clamp(S.mood[reg].v+d*.6,0,100)};
function nationalMood(S){let v=0,t=0;for(const r of CM.REGIONS){v+=S.mood[r.id].v*r.pop;t+=r.pop}return v/t}
SYS.nationalMood=nationalMood;
function moodTick(S){
  const N=S.nums,st=S.st;
  for(const r of CM.REGIONS){
    const M=S.mood[r.id],g=S.regs[r.id];
    let causes=0;for(const c of M.c){causes+=c.d*Math.pow(.82,S.m-c.m)}
    const target=.30*g.sec+.18*g.elec+.18*st.soc+.14*clamp(100-(N.inflation-2)*14,0,100)+.12*st.eco+.08*(S.mode==="pres"?st.pop:50)+causes*.9;
    M.v=clamp(M.v+(target-M.v)*.22+rnd(-1,1),0,100);
    M.c=M.c.filter(c=>S.m-c.m<10);
    const v=r.villes;
    if(g.sec<30&&Math.random()<.4)SYS.cause(S,r.id,pick(["Attaque armée","Enlèvement","Embuscade","Incendie de village"])+" près de "+pick(v.slice(1)),-3,r.id==="NW"||r.id==="SW"?"paix":"securite");
    if(g.elec<60&&Math.random()<.3)SYS.cause(S,r.id,"Délestages à "+pick(v),-2,"electricite");
    if(N.inflation>3.3&&Math.random()<.25)SYS.cause(S,r.id,"Vie chère sur "+r.marche.replace(/^le /,"le "),-2,"emploi");
    if(g.infra<35&&Math.random()<.2)SYS.cause(S,r.id,"Route coupée vers "+r.village.split(",")[0].replace(/^(le |la |un |une |les )/,""),-2,"routes");
    if(Math.random()<.08)SYS.cause(S,r.id,pick(["Bonne récolte","Fête traditionnelle réussie","Nouvelle usine","Victoire du club local"])+" à "+pick(v),2,"");
    // manifestations
    if(M.v<30&&Math.random()<.22){const ville=pick(v.slice(0,3));const n=Math.round(rnd(6,45));
      SYS.cause(S,r.id,"Manifestation avec casses à "+ville,-3,"emploi");newCase(S,"casse",r.id,n,ville);
      inbox(S,{from:"Gouverneur de la région "+deR(r),t:"Émeutes à "+ville,b:"Des manifestants ont dressé des barricades et pillé des commerces. La police a interpellé "+n+" personnes, déférées devant le "+E.TRIBUNAUX.regional+" de "+r.chef+". Cause principale de la colère : "+(M.c[1]?lc1(M.c[1].t):"la vie chère")+".",k:"alerte",reg:r.id});
      if(S.mode==="pres"){S.st.sec=clamp(S.st.sec-1,0,100);S.st.pop=clamp(S.st.pop-1,0,100)}}
  }
}

/* ---------- justice ---------- */
function newCase(S,type,reg,n,ville){
  if(window.JUS&&S.jus)return JUS.newCase(S,type,reg,n,ville);
  const R=CM.REG[reg];ville=ville||R.chef;
  const T={casse:["Casseurs de "+ville,E.TRIBUNAUX.regional+" de "+R.chef],corruption:["Détournement de fonds publics — ancien directeur général d'une société d'État",E.TRIBUNAUX.special],terror:["Terrorisme et sécession — "+n+" accusés",E.TRIBUNAUX.militaire+" de "+(reg==="EN"?"Maroua":reg==="NW"?"Bamenda":"Yaoundé")],militants:["Militants de l'opposition arrêtés à "+ville,E.TRIBUNAUX.regional+" de "+R.chef],fraude:["Fraude électorale présumée à "+ville,E.TRIBUNAUX.regional+" de "+R.chef]}[type];
  S.cases.unshift({id:nid(),type,reg,n,ville,t:T[0],court:T[1],stage:0,due:S.m+Math.round(rnd(2,6)),verdict:null,follow:null,avocats:0});
  S.cases=S.cases.slice(0,30);
}
SYS.newCase=newCase;
function justiceQuality(S){if(S.mode==="pres"){const r=S.gov.alloc.MINJUSTICE/70;return clamp(35+r*15+S.integ*.3,20,90)}return 40+(S.integ||35)*.2}
function casesTick(S){
  if(window.JUS){JUS.monthTick(S);return}
  for(const c of S.cases){
    if(c.verdict)continue;
    if(S.m>=c.due){c.stage=3;const q=justiceQuality(S),R=CM.REG[c.reg];let txt="",md=0,eff={};
      if(c.type==="casse"||c.type==="militants"){const cond=Math.round(c.n*clamp(rnd(.3,.9)-c.avocats*.25,.05,.95));const harsh=Math.random()>q/100;
        txt=cond+" condamné"+(cond>1?"s":"")+" à des peines "+(harsh?"de 1 à 5 ans ferme":"avec sursis ou de quelques mois")+", "+(c.n-cond)+" relaxé"+(c.n-cond>1?"s":"")+".";md=harsh?-3:1;
        if(c.type==="militants"&&S.opp){S.opp.noto=clamp(S.opp.noto+(harsh?4:1),0,100)}}
      else if(c.type==="corruption"){const ok=Math.random()<q/100;const rest=Math.round(rnd(2,40));txt=ok?"Condamné à 15 ans de prison, restitution de "+rest+" milliards FCFA ordonnée.":"Relaxé au bénéfice du doute. L'opinion dénonce l'impunité.";md=ok?2:-3;
        if(ok){S.nums.dette-=rest*.5;if(S.mode==="pres")S.st.pop=clamp(S.st.pop+1.5,0,100)}else if(S.mode==="pres")S.st.pop=clamp(S.st.pop-1.5,0,100)}
      else if(c.type==="terror"){const civ=Math.random()<.5;txt=civ?"Lourdes peines, dont des civils jugés par un tribunal militaire : les ONG protestent.":"Peines prononcées après un procès jugé équitable par les observateurs.";md=civ?-2:1;if(civ&&S.mode==="pres")S.st.int=clamp(S.st.int-1.5,0,100)}
      else{txt="Annulation du scrutin dans deux bureaux de vote.";md=1}
      c.verdict=txt;SYS.cause(S,c.reg,"Verdict : "+lc1(c.t),md,"corruption");
      inbox(S,{from:"Greffe du "+c.court,t:"Verdict — "+c.t,b:txt,k:"justice",caseId:c.id,reg:c.reg,good:md>0});
    }else if(Math.random()<.5)c.stage=Math.min(2,c.stage+1);
  }
}

/* ---------- courrier ---------- */
function inbox(S,it){it.id=nid();it.m=S.m;it.read=false;S.inbox.unshift(it);S.inbox=S.inbox.slice(0,60)}
SYS.inbox=inbox;
SYS.unread=S=>S.inbox?S.inbox.filter(i=>!i.read).length:0;

/* ---------- rapports (experts et ministres) ---------- */
const SUJETS={
 eco:[["dette","La dette publique et les finances de l'État"],["trainvie","Le train de vie de l'État"],["prive","La santé du secteur privé"],["prix","Les prix et le pouvoir d'achat"],["region","L'économie d'une région"],["mines","Le potentiel minier inexploité"],["promesse","Le coût d'une gratuité des soins pour les enfants"]],
 strat:[["sondage","Sondage dans une région"],["cible","Les régions à cibler pour la prochaine élection"]],
 sec:[["region","Évaluation sécuritaire d'une région"]],
 com:[["image","Notre image dans l'opinion"]],
 diplo:[["partenaires","Nos appuis possibles à l'étranger"]],
 sante:[["region","Les besoins de santé d'une région"]],edu:[["region","L'éducation dans une région"]],btp:[["region","Les routes et chantiers d'une région"]],
 agri:[["region","L'agriculture et l'élevage d'une région"]],mines:[["mines","Le secteur minier et pétrolier"]],fin:[["tresor","Les finances du parti"]]
};
SYS.SUJETS=SUJETS;
SYS.askReport=function(S,who,dom,sujet,reg,skill){
  const delay=Math.max(1,Math.round((sujet==="sondage"||sujet==="tresor"||sujet==="image"?1:2)+rnd(-.4,1.2)-(skill-60)/40));
  S.tasks.push({id:nid(),who,dom,sujet,reg,skill,due:S.m+delay});
  return delay;
};
function report(S,t){
  const N=S.nums,R=t.reg&&CM.REG[t.reg],err=(100-t.skill)/12;const P=S.opp;
  const lines=[];let title="";
  if(t.sujet==="dette"){title="Rapport sur la dette publique";const pct=N.dette/N.pib*100;lines.push("La dette atteint "+fmt(N.dette)+" milliards FCFA, soit "+fmt(pct,1)+" % du PIB, pour un plafond CEMAC de 70 %.","Au rythme actuel, le seuil de 55 % serait atteint dans environ "+Math.max(1,Math.round((55-pct)/Math.max(.05,(N.deficit*(1.35-S.st.eco/100))/N.pib*100)))+" ans.","Les intérêts de 2026 sont estimés à 532,5 milliards et le besoin de financement à 3 104,2 milliards.",pct>50?"Recommandation : geler les nouveaux emprunts non concessionnels et accélérer les recettes non pétrolières.":"Recommandation : privilégier les financements concessionnels (Banque mondiale, BAD) pour les grands chantiers.")}
  else if(t.sujet==="trainvie"){title="Rapport sur le train de vie de l'État";const tot=S.gov?tdvTotal(S):E.TRAIN.reduce((a,x)=>a+x.b,0);
    lines.push("Dépenses de fonctionnement courant estimées : "+fmt(tot)+" milliards FCFA par an (missions, véhicules, carburant, comités, réceptions, loyers).","Repère : en 2024, le budget des services a été ramené de 563,6 à 487,8 milliards FCFA, soit 80 milliards d'économies sur les biens et services.","Postes les plus lourds : eau-électricité-téléphone des administrations, missions à l'étranger, carburant.","Une cure d'austérité complète dégagerait environ "+fmt(E.TRAIN.reduce((a,x)=>a+x.b*.3,0))+" milliards par an.",S.mode==="opp"?"Argument de campagne : ces économies financeraient des centaines de centres de santé.":"Recommandation : plafonner les missions et mutualiser le parc automobile.")}
  else if(t.sujet==="prive"){title="Rapport sur le secteur privé";const P=S.prive;const worst=E.PRIVE.secteurs.slice().sort((a,b)=>P.act[a.id]-P.act[b.id]);
    lines.push("Climat des affaires : "+Math.round(P.climat)+"/100.","209 482 entreprises recensées par l'INS ; 86,6 % des emplois sont informels, le privé formel ne pèse que 5,1 % de l'emploi.","Filières en difficulté : "+worst.slice(0,3).map(x=>x.n.toLowerCase()).join(", ")+". Filières dynamiques : "+worst.slice(-2).map(x=>x.n.toLowerCase()).join(", ")+".","Le crédit se raréfie : 1 337 milliards de nouveaux crédits au 1er trimestre 2026 contre 1 887 un an plus tôt, taux moyen 9,03 %.","Arriérés de l'État envers les entreprises : environ "+fmt(P.arrieres,1)+" milliards FCFA.")}
  else if(t.sujet==="prix"){title="Rapport sur le pouvoir d'achat";lines.push("Inflation estimée : "+fmt(N.inflation+rnd(-err,err)/10,1)+" %.","SMIG : 60 000 FCFA dans le privé non agricole, 45 000 FCFA dans l'agriculture, 43 969 FCFA pour les agents de l'État relevant du Code du travail.","Les régions les plus touchées par la vie chère : "+CM.REGIONS.slice().sort((a,b)=>S.mood[a.id].v-S.mood[b.id].v).slice(0,3).map(r=>r.n).join(", ")+".","Recommandation : cibler le riz, l'huile, le ciment et le carburant.")}
  else if(t.sujet==="region"&&R){const m=S.mood[R.id],g=S.regs[R.id];title="Rapport sur la région "+deR(R);
    const dom={eco:"économique",sec:"sécuritaire",sante:"sanitaire",edu:"éducative",btp:"des infrastructures",agri:"agricole"}[t.dom]||"générale";
    lines.push("Situation "+dom+" : sécurité "+Math.round(g.sec+rnd(-err,err))+"/100, électricité "+Math.round(g.elec)+" %, humeur « "+moodInfo(m.v)[1].toLowerCase()+" ».","Principales plaintes : "+(m.c.slice(0,3).map(c=>lc1(c.t)).join(" ; ")||"aucune remontée majeure")+".",
      t.dom==="sante"?"Besoin prioritaire : un centre de santé intégré dans les villages autour de "+R.villes[2]+".":t.dom==="edu"?"Besoin prioritaire : des salles de classe et des enseignants à "+R.villes[1]+".":t.dom==="btp"?"Besoin prioritaire : bitumer l'axe "+R.chef+"-"+R.villes[1]+".":t.dom==="agri"?"Besoin prioritaire : pistes rurales et stockage à "+R.villes[3]+".":t.dom==="sec"?(g.sec<30?"Un meeting ici est très risqué : prévoir un service d'ordre et un lieu fermé.":"Risque maîtrisé pour une activité publique."):"Thème le plus porteur : "+CM.THEMES[R.enjeux[0]].n.toLowerCase()+".");
    S.intel[R.id]=S.m+4}
  else if(t.sujet==="mines"){title="Rapport sur le secteur minier et pétrolier";const inx=E.MINES.filter(m=>S.mines[m.id]==="inexploite");lines.push("Sites non exploités : "+inx.map(m=>m.n).join(", ")+".","Production pétrolière en déclin : 19,3 millions de barils en 2025, 43 800 barils par jour attendus en 2028. Le FLNG de Kribi quitte le pays en 2027.","Recommandation : conditionner les conventions à une transformation locale (alumine, acier) et à des emplois camerounais.")}
  else if(t.sujet==="promesse"){title="Chiffrage : gratuité des soins pour les moins de 5 ans";lines.push("Coût estimé : "+fmt(rnd(90,140))+" milliards FCFA par an, soit environ 1,3 % du budget 2026.","Financement possible : taxe sur le tabac et les boissons sucrées, économies sur le carburant subventionné.","Impact attendu : forte adhésion dans l'Est, l'Extrême-Nord et l'Adamaoua, où la mortalité infantile est la plus élevée.")}
  else if(t.sujet==="sondage"&&R){title="Sondage — région "+deR(R);const o=S.sup[R.id];const top=Object.keys(o).filter(p=>p!=="AUT").sort((a,b)=>o[b]-o[a]).slice(0,5);
    lines.push("Intentions de vote (marge d'erreur ±"+fmt(err,1)+" pts) : "+top.map(p=>(S.parties[p]?S.parties[p].n:p)+" "+fmt(o[p]+rnd(-err,err),1)+" %").join(", ")+".","Préoccupations : "+R.enjeux.map(e=>CM.THEMES[e].n.toLowerCase()).join(", ")+".","Humeur : "+moodInfo(S.mood[R.id].v)[1].toLowerCase()+".");S.intel[R.id]=S.m+4}
  else if(t.sujet==="cible"){title="Stratégie électorale";const pr=CM.REGIONS.map(r=>({r,gap:(S.sup[r.id][S.party]||0),w:r.seats*(100-S.mood[r.id].v)})).sort((a,b)=>b.w-a.w).slice(0,4);
    lines.push("Régions prioritaires (beaucoup de sièges et population mécontente) : "+pr.map(x=>x.r.n+" ("+x.r.seats+" sièges, vous : "+fmt(x.gap,1)+" %)").join(", ")+".","Conseil : un meeting sur le bon thème rapporte jusqu'à 60 % de plus.");pr.forEach(x=>S.intel[x.r.id]=S.m+3)}
  else if(t.sujet==="image"){title="Notre image dans l'opinion";lines.push("Notoriété : "+Math.round(P?P.noto:S.st.pop)+"/100.",P?"Les militants attendent des actions de terrain dans les régions où le parti est absent.":"L'opinion juge sévèrement la vie chère et l'insécurité.","Conseil : une vidéo courte sur un problème concret (route, électricité) touche le plus de monde.")}
  else if(t.sujet==="partenaires"){title="Appuis possibles à l'étranger";lines.push("Rappel : tout financement d'un parti par un État ou une organisation étrangère est interdit.","Leviers légaux : plaidoyer auprès de l'Union africaine, du Commonwealth, de l'Union européenne et des ONG ; mobilisation de la diaspora membre du parti.","Les partenaires les plus sensibles aux droits humains : Union européenne, Royaume-Uni, États-Unis.")}
  else if(t.sujet==="tresor"&&P){title="Finances du parti";lines.push("Trésorerie : "+fmt(P.fonds)+" millions FCFA.","Militants : "+fmt(P.militants)+". Une cotisation de 1 000 FCFA rapporterait environ "+fmt(P.militants*.001*(.25+P.noto/200))+" millions.","Dépenses mensuelles de fonctionnement estimées : "+fmt(2+P.militants/20000)+" millions.")}
  else{title="Rapport";lines.push("Rien à signaler.")}
  inbox(S,{from:t.who,t:title,b:lines.join("\n"),k:"rapport"});
}
function tasksTick(S){const due=S.tasks.filter(t=>t.due<=S.m);S.tasks=S.tasks.filter(t=>t.due>S.m);for(const t of due){
  if(t.sujet==="suivi"){const c=S.cases.find(x=>x.id===t.caseId);inbox(S,{from:t.who,t:"Compte rendu — "+(c?c.t:"dossier"),b:c?("Juridiction : "+c.court+".\nÉtape : "+(window.JUS&&c.stage!=null?JUS.STAGES[c.stage]:"—")+". "+(c.verdict?c.verdict:"Prochaine étape vers le "+G.dayLabel(c.next||0)+".")+(c.det?" "+c.det+" personne(s) en détention.":"")+"\n"+(c.type==="casse"||c.type==="militants"?"Recommandation : "+(S.mode==="pres"?"une grâce ciblée apaiserait la région.":"fournir des avocats et médiatiser le procès."):"Recommandation : suivre l'exécution des restitutions.")):"Le dossier a été classé.",k:"rapport"})}
  else report(S,t)}}

/* ---------- marchés publics ---------- */
function bidsFor(S,p){
  const cat=E.PROJETS.find(x=>x.id===p.pid);const base=cat.cout*p.mult;const list=[];
  const sec=E.secteurProjet(p.pid);
  const pool=sec!=="btp"&&E.SECTEURS[sec]?E.SECTEURS[sec].ai:p.mode==="inter"?E.ENTREPRISES.inter.concat(E.ENTREPRISES.local.slice(-1)):E.ENTREPRISES.local;
  const chosen=pool.slice().sort(()=>Math.random()-.5).slice(0,p.mode==="inter"?4:3);
  for(const [n,pays,rep] of chosen){const inter=p.mode==="inter"&&!/Douala/.test(pays);
    let price=base*(inter?rnd(.95,1.35):rnd(.85,1.25));if(/Chine/.test(pays)&&S.diplo)price*=1.1-S.diplo.CN/300;
    const mois=Math.round(cat.mois*(inter?rnd(.8,1.1):rnd(1,1.5)));const qual=clamp(Math.round(rep+rnd(-10,10)+(!inter&&S.prive?(S.prive.climat-50)/8:0)),30,95);
    list.push({co:n,pays,prix:+price.toFixed(3),mois,qual,jobs:inter?Math.round(rnd(20,60)):Math.round(rnd(60,95))})}
  return list;
}
SYS.launchTender=function(S,pid,reg,ville,mode,owner){
  const cat=E.PROJETS.find(x=>x.id===pid);const mult=pid==="route"||pid==="pont"?(CM.REG[reg].land==="foret"||CM.REG[reg].land==="hauts"?1.3:1):1;
  const p={id:nid(),pid,n:cat.n,reg,ville,mode,owner,stage:"ao",m0:S.m,d0:S.day,mult,bids:[],chosen:null,prog:0,paid:0,diaspora:0,insp:null,sector:E.secteurProjet(pid)};
  let humans=0;
  if(window.WORLD){const r=WORLD.post(S,{s:p.sector,t:cat.n+" — "+ville,b:Math.round(cat.cout*1000*mult),mois:cat.mois,reg,ref:p.id,kind:"projet"});p.req=r.req.id;humans=r.humans}
  p.aiDay=S.day+(humans?3:1);p.humans=humans;
  S.projects.unshift(p);
  inbox(S,{from:owner==="etat"?"Ministère des Marchés publics":owner==="commune"?"Secrétariat général de la mairie":owner==="ministere"?"Cellule des marchés du ministère":owner==="depute"?"Secrétariat de la permanence parlementaire":"Trésorier du parti",t:"Appel d'offres publié : "+cat.n,b:"Appel d'offres "+(mode==="inter"?"international":"national")+" ouvert pour « "+cat.n+" » à "+ville+". Profil recherché : "+(E.SECTEURS[p.sector]?E.SECTEURS[p.sector].n.toLowerCase():"BTP")+". "+(humans?humans+" joueur(s) de ce profil sont sollicités en priorité.":"Les entreprises répondront sous quelques jours.")+" Contrôle de l'ARMP.",k:"marche"});
  return p;
};
function money(S,owner,amountMds){ // retourne vrai si payé
  if(owner==="etat"){S.nums.dette+=amountMds;return true}
  const M=amountMds*1000;
  if(owner==="ministere"){if(!S.minis||S.minis.fonds<M)return false;S.minis.fonds-=M;return true}
  if(owner==="depute"){if(!S.opp.dep||S.opp.dep.fonds<M)return false;S.opp.dep.fonds-=M;return true}
  if(owner==="commune"){if(!S.opp.commune||S.opp.commune.fonds<M)return false;S.opp.commune.fonds-=M;return true}
  if(S.opp.fonds<M)return false;S.opp.fonds-=M;return true;
}
SYS.award=function(S,p,i){
  const b=p.bids[i];const first=b.prix*.3;
  if(!money(S,p.owner,first))return false;
  p.chosen=b;p.stage="chantier";p.paid=first;p.due=S.m+b.mois;
  if(p.req&&S.market&&window.WORLD){const r=S.market.mine.find(x=>x.id===p.req);if(r){r.st="attribue";r.aw={human:false,name:b.co,p:b.prix*1000,m:b.mois};WORLD.publish()}}
  inbox(S,{from:"Commission de passation",t:"Marché attribué à "+b.co,b:"« "+p.n+" » à "+p.ville+" : "+fmtM(b.prix)+", délai "+b.mois+" mois, "+b.jobs+" % d'emplois locaux. Avance de démarrage de 30 % versée.",k:"marche"});
  return true;
};
function fmtM(mds){return mds>=1?fmt(mds,1)+" milliards FCFA":fmt(mds*1000)+" millions FCFA"}
SYS.fmtM=fmtM;
function projectsTick(S){
  for(const p of S.projects){
    if(p.stage==="ao"&&p.d0==null&&S.m>p.m0){p.bids=bidsFor(S,p);p.stage="offres"}
    else if(p.stage==="chantier"){const b=p.chosen;const rel=(b.qual+p.diaspora*12)/100;
      let step=100/b.mois*clamp(rnd(.55,1.15)+rel*.25,.3,1.4);
      if(Math.random()<.06*(1-rel)&&!p.probleme){p.probleme=1;inbox(S,{from:"Maître d'œuvre",t:"Retard sur le chantier : "+p.n,b:b.co+" réclame un avenant de 15 % pour « hausse des coûts ». Vous pouvez refuser : l'entreprise risque alors de ralentir.",k:"marche",avenant:p.id})}
      if(Math.random()<.015*(1-rel)*2){p.stage="abandon";inbox(S,{from:"Maître d'œuvre",t:"Chantier abandonné : "+p.n,b:b.co+" a quitté le chantier à "+Math.round(p.prog)+" %. Il faut relancer un appel d'offres ; l'affaire est transmise au "+E.TRIBUNAUX.special+".",k:"alerte",reg:p.reg});newCase(S,"corruption",p.reg,2);SYS.cause(S,p.reg,"Chantier abandonné : "+lc1(p.n)+" à "+p.ville,-3,"routes");continue}
      p.prog=clamp(p.prog+step,0,100);
      const pay=b.prix*.7/b.mois;if(p.paid<b.prix&&money(S,p.owner,Math.min(pay,b.prix-p.paid)))p.paid+=Math.min(pay,b.prix-p.paid);
      if(p.prog>=100)deliver(S,p);
    }
  }
  S.projects=S.projects.filter((p,i)=>i<25||p.stage==="chantier"||p.stage==="offres");
}
/* offres des entreprises du jeu, au jour dit, seulement si aucun joueur n'a répondu */
SYS.dayTick=function(S){
  for(const p of S.projects||[]){
    if(p.stage!=="ao"||p.d0==null||S.day<p.aiDay)continue;
    const hb=window.WORLD&&p.req?WORLD.humanBids(p.req):[];
    if(hb.length&&!p.forceAI)continue;
    p.bids=bidsFor(S,p);p.stage="offres";
    inbox(S,{from:"Commission de passation",t:"Offres reçues : "+p.n,b:(p.humans?"Aucun joueur sollicité n'a répondu à temps. ":"")+p.bids.length+" entreprises ont déposé une offre. Ouvrez l'onglet Projets pour choisir l'attributaire.",k:"marche"});
  }
};
SYS.awardHuman=function(S,p,b){
  const r=S.market.mine.find(x=>x.id===p.req);if(!r)return false;
  WORLD.award(S,r,b);p.stage="joueur";p.chosen={co:b.name+" (joueur)",pays:"joueur",prix:b.p/1000,mois:b.m,qual:70,jobs:80};p.due=S.m+b.m;
  return true;
};
SYS.deliverExternal=function(S,ref,conf,name){
  const p=(S.projects||[]).find(x=>x.id===ref);if(!p||p.stage==="livre")return;
  money(S,p.owner,p.chosen.prix);p.paid=p.chosen.prix;deliver(S,p,conf);
};
function deliver(S,p,forced){
  const cat=E.PROJETS.find(x=>x.id===p.pid),b=p.chosen;p.stage="livre";p.m1=S.m;
  const conf=forced!=null?forced:clamp(Math.round(b.qual+p.diaspora*10+rnd(-12,8)),25,100);p.conf=conf;const k=conf/100;
  const late=S.m-p.due;
  if(S.mode==="pres"||S.mode==="min")for(const s in cat.eff)S.st[s]=clamp(S.st[s]+cat.eff[s]*k*(S.mode==="min"?.6:1),0,100);
  if(S.mode==="min"&&S.minis){S.minis.perf=clamp(S.minis.perf+cat.mood*k*.5,0,100);S.minis.conf=clamp(S.minis.conf+1,0,100)}
  if(cat.km)S.nums.routes+=cat.km*k;if(cat.elec)S.nums.elec=clamp(S.nums.elec+cat.elec*k,0,100);
  if(cat.elec)S.regs[p.reg].elec=clamp(S.regs[p.reg].elec+cat.elec*3*k,0,100);
  if(cat.sec)S.regs[p.reg].sec=clamp(S.regs[p.reg].sec+cat.sec*k,0,100);
  if(cat.prison&&window.JUS)JUS.addCapacity(S,p.reg,cat.prison);
  if(p.pid==="route"||p.pid==="pont")S.regs[p.reg].infra=clamp(S.regs[p.reg].infra+6*k,0,100);
  SYS.cause(S,p.reg,"Nouveau : "+lc1(cat.n)+" à "+p.ville,Math.round(cat.mood*k),cat.s);
  const who=p.owner==="etat"||p.owner==="ministere"?S.power:S.party;if(who)G.shift(S.sup,p.reg,who,cat.mood*k*.25,S.power);
  inbox(S,{from:"Commission de réception",t:"Réception : "+cat.n+" à "+p.ville,b:"Travaux réalisés par "+b.co+". Conformité au cahier des charges : "+conf+" %. "+(late>0?"Livré avec "+late+" mois de retard.":"Livré dans les délais.")+(conf<60?" Des malfaçons ont été relevées : pénalités appliquées à l'entreprise.":" Les populations saluent l'ouvrage."),k:"marche",good:conf>=60});
}
SYS.inspect=function(S,p){const b=p.chosen;const est=clamp(Math.round(b.qual+p.diaspora*10+rnd(-8,8)),20,100);p.insp={m:S.m,v:est};if(est<55){b.qual=Math.min(95,b.qual+8);SYS.cause(S,p.reg,"Contrôle : malfaçons constatées sur "+lc1(p.n),-1,"corruption")}return est};

/* ---------- gouvernement et budget (mode président) ---------- */
function govTick(S){
  const g=S.gov;let delta=0;
  for(const m of E.MINISTERES){const r=g.alloc[m.id]/m.b;const comp=g.min[m.id].comp/70;delta+=g.alloc[m.id]-m.b;
    if(S.st[m.s]!=null)S.st[m.s]=clamp(S.st[m.s]+m.k*(r-1)*1.6*comp+(comp-1)*m.k*.15,0,100);
    if(m.id==="MINTP")S.nums.routes+=Math.max(0,(r-.6))*38*comp/12*10/10;
    if(m.id==="MINEE")S.nums.elec=clamp(S.nums.elec+(r-1)*.15,0,100);}
  // recrutements en cours
  for(const k in g.recrues){const R=E.SALAIRES.recrues.find(x=>x.id===k);const lots=g.recrues[k];if(S.st[R.s]!=null)S.st[R.s]=clamp(S.st[R.s]+lots*R.e*.08,0,100)}
  // équilibre régional
  const cnt={};for(const id in g.min)cnt[g.min[id].reg]=(cnt[g.min[id].reg]||0)+1;
  for(const r of CM.REGIONS)if(!cnt[r.id]&&Math.random()<.2)SYS.cause(S,r.id,"Aucun ministre originaire de la région : sentiment d'exclusion",-2,"");
  // défense
  for(const t of E.DEFENSE.theatres){if(t.id==="RES")continue;const a=S.def.alloc[t.id]*(S.def.eff/40000);const reg=t.id;S.regs[reg].sec=clamp(S.regs[reg].sec+(a/t.need-1)*1.6,2,98);if(t.id==="AD")S.regs.ES.sec=clamp(S.regs.ES.sec+(a/t.need-1)*1.2,2,98);if(t.id==="EN")S.regs.NO.sec=clamp(S.regs.NO.sec+(a/t.need-1)*.6,2,98)}
  // diplomatie : la jauge Diplomatie suit la moyenne des relations
  const avg=Object.values(S.diplo).reduce((a,b)=>a+b,0)/Object.keys(S.diplo).length;S.st.int=clamp(S.st.int+(avg-S.st.int)*.05,0,100);
  // ressources exploitées
  let rev=0;for(const m of E.MINES)if(["exploite","demarrage","nationalise"].includes(S.mines[m.id]))rev+=m.v*(S.mines[m.id]==="demarrage"?.4:1);
  S.nums.dette-=rev*1.2;
}
SYS.candidats=function(S,forPost){const out=[];const types=[["Cadre du parti au pouvoir",45,70,85,95],["Technocrate",60,85,55,75],["Expert de la diaspora",65,90,45,70],["Personnalité de l'opposition (ouverture)",50,80,30,60]];
  for(const t of types){const reg=regAlea();out.push({n:nom(reg),reg,type:t[0],comp:Math.round(rnd(t[1],t[2])),loy:Math.round(rnd(t[3],t[4]))})}return out};

/* ---------- train de vie ---------- */
SYS.tdvFor=m=>tdvFor(m);
function tdvFor(m){if(m.veh==null){m.veh=Math.round(rnd(5,22));m.miss=Math.round(rnd(3,18));m.cab=Math.round(rnd(150,600));m.audit=null}return m}
SYS.tdvFor=tdvFor;
const coutMin=m=>m.veh*12+m.miss*25+m.cab;
SYS.coutMin=coutMin;
function tdvTotal(S){let t=0;for(const x of E.TRAIN){const niv=E.TRAIN_NIV.find(n=>n[0]===S.gov.tdv[x.id]);t+=x.b*niv[2]}return t}
function tdvTick(S){
  const g=S.gov;let aus=0,lux=0;for(const k in g.tdv){if(g.tdv[k]==="austere")aus++;if(g.tdv[k]==="luxe")lux++}
  S.st.pop=clamp(S.st.pop+aus*.05-lux*.08,0,100);
  for(const id in g.min){const m=g.min[id];m.loy=clamp(m.loy-aus*.08+lux*.1,0,100);
    if((m.veh>17||m.miss>14||m.cab>520)&&Math.random()<.025){const mi=E.MINISTERES.find(x=>x.id===id);const what=m.veh>17?m.veh+" véhicules de fonction dont plusieurs 4x4 haut de gamme":m.miss>14?m.miss+" missions à l'étranger en un an":"un cabinet de "+fmt(m.cab)+" millions FCFA par an";
      inbox(S,{from:"Revue de presse",t:"Scandale : le train de vie du "+id,b:"Un journal révèle que "+m.n+" ("+mi.n+") dispose de "+what+". L'opinion s'indigne. Vous pouvez commander un audit du Contrôle supérieur de l'État (onglet Gouvernement, Train de vie).",k:"alerte",reg:"CE"});
      SYS.cause(S,"CE","Scandale sur le train de vie d'un ministre",-3,"corruption");S.st.pop=clamp(S.st.pop-1.5,0,100)}}
}
/* ---------- secteur privé ---------- */
function initPrive(S){S.prive={climat:44,act:Object.fromEntries(E.PRIVE.secteurs.map(x=>[x.id,x.act])),used:{},arrieres:E.PRIVE.arrieres,emplois:0}}
function priveTick(S){
  const P=S.prive,st=S.st;const is=S.gov?S.gov.fisc.is:33;
  const target=22+st.eco*.3+st.sec*.12+st.infra*.12+(33-is)*1.4+(S.nums.elec-60)*.2-(P.arrieres/100);
  P.climat=clamp(P.climat+(target-P.climat)*.1+rnd(-.8,.8),0,100);
  for(const x of E.PRIVE.secteurs){let t=P.climat+(x.id==="tourisme"?(st.sec-45)*.5:0)+(x.id==="hydro"?-5:0)+(x.id==="agro"?(S.regs.NO.sec-40)*.1:0);P.act[x.id]=clamp(P.act[x.id]+(t-P.act[x.id])*.08+rnd(-1,1),0,100)}
  if(S.mode==="pres")st.eco=clamp(st.eco+(P.climat-50)*.02,0,100);
  if(P.climat>58&&Math.random()<.25){const x=pick(E.PRIVE.secteurs),r=CM.REG[pick(x.reg)],n=Math.round(rnd(80,900));P.emplois+=n;SYS.cause(S,r.id,"Nouvelle entreprise ("+x.n.toLowerCase()+") à "+pick(r.villes.slice(0,3))+" : "+n+" emplois",2,"emploi")}
  if(P.climat<38&&Math.random()<.25){const x=pick(E.PRIVE.secteurs),r=CM.REG[pick(x.reg)],n=Math.round(rnd(50,600));P.emplois-=n;SYS.cause(S,r.id,"Licenciements dans le secteur "+x.n.toLowerCase()+" à "+pick(r.villes.slice(0,3))+" ("+n+" emplois)",-2,"emploi")}
}
SYS.priveTick=priveTick;

/* ---------- parti (mode opposant) ---------- */
function partyTick(S){
  const P=S.opp;
  // militants suivent l'implantation
  let tot=0;for(const r of CM.REGIONS){const target=(S.sup[r.id][S.party]||0)*r.pop*900+1000;P.milReg[r.id]=Math.max(50,Math.round(P.milReg[r.id]+(target-P.milReg[r.id])*.02));tot+=P.milReg[r.id]}
  P.militants=tot;
  P.fonds-= (2+tot/20000)*.5; // fonctionnement
  if(P.commune){P.commune.fonds+=P.commune.budget/12}
  if(P.mandats.some(m=>m.t==="Député"))P.fonds+=1.5; // reversement d'une partie de l'indemnité
  P.fonds=Math.max(0,P.fonds);
}
SYS.cotisation=function(S,montant){
  const P=S.opp;const rate=clamp(.35+P.noto/300-montant/60000,.02,.7);const payeurs=Math.round(P.militants*rate);const f=payeurs*montant/1e6;
  P.fonds+=f;P.cotiM=S.m;const pertes=Math.round(P.militants*clamp((montant/1000-1)*.035,0,.95));
  if(pertes){const k=1-pertes/Math.max(1,P.militants);for(const r of CM.REGIONS)P.milReg[r.id]=Math.round(P.milReg[r.id]*k);P.militants-=pertes}
  return{payeurs,f,pertes};
};
SYS.onElection=function(S,id,res){
  if(S.mode!=="opp"||!S.opp)return;const P=S.opp,me=S.party;
  if(id==="leg"){
    P.mandats=P.mandats.filter(m=>m.t!=="Maire"&&m.t!=="Conseiller municipal"&&m.t!=="Député");const oldC=P.commune;P.commune=null;
    const mr=P.cand.mun.reg,R=CM.REG[mr];const won=(res.mu.byReg[mr]||{})[me]||0;const share=S.sup[mr][me]||0;
    if(Math.random()<Math.max(won/R.communes,share>35?.6:0)){P.mandats.push({t:"Maire",lieu:P.cand.mun.ville,reg:mr,m:S.m});const big=R.chef===P.cand.mun.ville;P.commune=oldC&&oldC.ville===P.cand.mun.ville?oldC:{ville:P.cand.mun.ville,reg:mr,budget:big?3000:800,fonds:big?600:150,taxe:100,agents:big?420:110,mood:55,conseil:60,adjoint:nom(mr)+" (premier adjoint)",lastChefs:-9,lastSalub:-30,lastFeicom:-60,lastJum:-90,lastConseil:-30}}
    else if(share>=8)P.mandats.push({t:"Conseiller municipal",lieu:P.cand.mun.ville,reg:mr,m:S.m});
    const lr=P.cand.leg.reg;const seats=((res.l.byReg[lr]||{}).seats||{})[me]||0;
    if(seats>0)P.mandats.push({t:"Député",lieu:"région "+deR(CM.REG[lr]),reg:lr,m:S.m});
    const got=P.mandats.filter(m=>m.m===S.m).map(m=>m.t+" ("+m.lieu+")");
    inbox(S,{from:"Secrétariat général du parti",t:got.length?"Vous êtes élu·e !":"Pas de mandat pour vous cette fois",b:got.length?"Nouveaux mandats : "+got.join(", ")+"."+(P.commune?" La commune dispose d'un budget annuel d'environ "+fmt(P.commune.budget)+" millions FCFA pour ses projets.":""):"Votre liste n'a pas obtenu assez de voix. Renforcez votre implantation avant le prochain scrutin.",k:got.length?"bonne":"alerte"});
  }
  if(id==="reg"){const r=P.cand.mun.reg;P.mandats=P.mandats.filter(m=>!/régional/.test(m.t));
    if(S.regions[r]===me)P.mandats.push({t:"Président du conseil régional",lieu:CM.REG[r].n,reg:r,m:S.m});
    else if(((S.munByReg&&S.munByReg[r]||{})[me]||0)/CM.REG[r].communes>=.15)P.mandats.push({t:"Conseiller régional",lieu:CM.REG[r].n,reg:r,m:S.m});}
};

/* ---------- tick mensuel ---------- */
SYS.tick=function(S){
  if(!S.mood)return;
  moodTick(S);casesTick(S);tasksTick(S);projectsTick(S);
  if(S.mode==="pres"&&S.gov){govTick(S);if(S.gov.tdv)tdvTick(S)}
  if(!S.prive)initPrive(S);priveTick(S);
  if(S.mode==="opp"&&S.opp&&S.opp.milReg)partyTick(S);
};

/* ======================= INTERFACES ======================= */
const panel=()=>$("panel");
function rerender(){G.render()}
function pill(t,c){return'<span class="pill '+c+'">'+esc(t)+'</span>'}
function regionSelect(id,sel){return'<select id="'+id+'">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===sel?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select>'}

/* ---------- jauge d'humeur (HUD) ---------- */
SYS.hudMood=function(S){
  const el=$("hudMood");if(!el)return;
  if(!S||!S.mood){el.hidden=true;return}
  const v=nationalMood(S),mi=moodInfo(v),un=SYS.unread(S);el.hidden=false;
  el.innerHTML='<span class="dot" style="background:'+mi[2]+'"></span>'+esc(mi[1])+(un?' <b class="badge">'+un+'</b>':"");
  el.onclick=()=>SYS.moodSheet(S);
};
SYS.moodSheet=function(S){
  const regs=CM.REGIONS.slice().sort((a,b)=>S.mood[a.id].v-S.mood[b.id].v);
  const v=nationalMood(S),mi=moodInfo(v);
  const alerts=S.inbox.filter(i=>!i.read&&(i.k==="alerte"||i.k==="justice")).slice(0,5);
  G.sheet('<h3 class="h2">Humeur du pays</h3><div class="row"><span class="dot" style="background:'+mi[2]+';width:18px;height:18px"></span><b>'+esc(mi[1])+'</b><span class="muted small">indice '+Math.round(v)+'/100</span></div>'+
   '<div class="bar" style="height:12px"><i style="width:'+v+'%;background:'+mi[2]+'"></i></div>'+
   G.mapSVG(id=>moodInfo(S.mood[id].v)[2],null,r=>r.n)+
   (alerts.length?'<span class="eyebrow">Remous à traiter</span>'+alerts.map(a=>'<div class="card" style="gap:6px"><b>'+esc(a.t)+'</b><span class="small muted">'+esc(a.b.split("\n")[0])+'</span><div class="row"><button class="btn small" data-open="'+a.id+'">Ouvrir</button></div></div>').join(""):"")+
   '<span class="eyebrow">Par région, des plus fâchées aux plus satisfaites</span>'+
   regs.map(r=>{const M=S.mood[r.id],m=moodInfo(M.v);return'<details class="card" style="gap:6px"><summary style="display:flex;justify-content:space-between;gap:8px;cursor:pointer"><span><span class="dot" style="background:'+m[2]+'"></span> <b>'+esc(r.n)+'</b></span><span class="small" style="color:'+m[2]+'">'+esc(m[1])+' · '+Math.round(M.v)+'</span></summary>'+
     (M.c.length?'<ul class="small" style="margin:0;padding-left:18px">'+M.c.slice(0,6).map(c=>'<li style="color:'+(c.d>0?"var(--ok)":"var(--ink)")+'">'+(c.d>0?"Contents : ":"Fâchés : ")+esc(c.t)+' <span class="muted">('+esc(G.monthLabel(c.m))+')</span> '+(window.VID?VID.btn(c.t,r.id,"Vidéo"):"")+'</li>').join("")+'</ul>':'<span class="small muted">Pas de remontée particulière.</span>')+
     '<span class="small muted">Villes : '+esc(r.villes.slice(0,4).join(", "))+' · village : '+esc(r.village.split(",")[0])+'</span><div class="row"><button class="btn small" data-see="'+r.id+'">Voir sur place</button></div></details>'}).join(""),
   el=>{el.querySelectorAll("[data-see]").forEach(b=>b.onclick=()=>{G.viewRegion(b.dataset.see,Math.random()<.5?"marche":"village");el.remove()});
     el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{el.remove();SYS.openMail(S,b.dataset.open)});
     el.querySelectorAll("path[data-r]").forEach(p=>p.onclick=()=>{const d=el.querySelectorAll("details");const idx=regs.findIndex(r=>r.id===p.dataset.r);if(d[idx]){d[idx].open=true;d[idx].scrollIntoView({behavior:"smooth",block:"center"})}})});
};

/* ---------- courrier ---------- */
SYS.mailCard=function(S){
  const un=S.inbox.filter(i=>!i.read);const list=S.inbox.slice(0,5);
  if(!list.length)return"";
  return'<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Courrier et rapports</span>'+(un.length?pill(un.length+" non lu"+(un.length>1?"s":""),"warn"):"")+'</div>'+
   list.map(i=>'<button class="choice" data-mail="'+i.id+'" style="gap:2px"><span class="t" style="'+(i.read?"font-weight:400":"")+'">'+(i.read?"":"● ")+esc(i.t)+'</span><span class="small muted">'+esc(i.from)+' · '+esc(G.monthLabel(i.m))+'</span></button>').join("")+
   (S.inbox.length>5?'<button class="btn small ghost" id="allMail">Tout le courrier ('+S.inbox.length+')</button>':"")+'</div>';
};
SYS.bindMail=function(S){
  panel().querySelectorAll("[data-mail]").forEach(b=>b.onclick=()=>SYS.openMail(S,b.dataset.mail));
  const a=$("allMail");if(a)a.onclick=()=>G.sheet('<h3 class="h2">Courrier</h3>'+S.inbox.map(i=>'<button class="choice" data-m2="'+i.id+'"><span class="t">'+(i.read?"":"● ")+esc(i.t)+'</span><span class="small muted">'+esc(i.from)+' · '+esc(G.monthLabel(i.m))+'</span></button>').join(""),el=>el.querySelectorAll("[data-m2]").forEach(b=>b.onclick=()=>{el.remove();SYS.openMail(S,b.dataset.m2)}));
};
SYS.openMail=function(S,id){
  const it=S.inbox.find(i=>i.id===id);if(!it)return;it.read=true;
  const c=it.caseId&&S.cases.find(x=>x.id===it.caseId);
  const pr=it.avenant&&S.projects.find(x=>x.id===it.avenant);
  let acts="";
  if(c){acts+='<button class="btn" id="mFollow">Confier le suivi à '+esc(S.mode==="pres"?"la ministre de la Justice":"votre juriste")+'</button>';
    if(S.mode==="pres"&&(c.type==="casse"||c.type==="militants"))acts+='<button class="btn" id="mGrace">Accorder une grâce</button>';
    if(S.mode==="opp"&&!c.verdict)acts+='<button class="btn" id="mAvo">Envoyer les avocats du parti (3 M FCFA)</button>'}
  if(pr&&pr.stage==="chantier")acts+='<button class="btn" id="mAvOk">Accepter l\'avenant (+15 %)</button><button class="btn" id="mAvNo">Refuser l\'avenant</button>';
  if(window.PRO)acts+=PRO.mailActs(S,it);
  if(window.EMP)acts+=EMP.mailActs(S,it);
  if(window.ACTU)acts+=ACTU.mailActs(S,it);
  if(it.org&&window.VIE)acts+='<button class="btn primary" id="mOrg">Prendre des mesures</button>';
  if(it.reg)acts+='<button class="btn" id="mSee">Voir la région</button>';
  if(window.VID&&!it.actu&&(it.reg||it.k==="alerte"||it.k==="rapport"))acts+=VID.btn(it.t+". "+it.b,it.reg||null,"Voir la vidéo");
  G.sheet('<span class="eyebrow">'+esc(it.from)+' · '+esc(G.monthLabel(it.m))+'</span><h3 class="h2">'+esc(it.t)+'</h3>'+it.b.split("\n").map(l=>'<p>'+esc(l)+'</p>').join("")+'<div class="row"><button class="btn" id="mRead">Écouter</button>'+acts+'</div>',el=>{
    el.querySelector("#mRead").onclick=()=>G.subs(it.from,it.t+". "+it.b.replace(/\n/g," "),{voix:"f"});
    const q=s=>el.querySelector(s);
    if(window.PRO)PRO.mailBind(S,it,el);
    if(window.EMP)EMP.mailBind(S,it,el);
    if(window.ACTU)ACTU.mailBind(S,it,el);
    if(q("#mOrg"))q("#mOrg").onclick=()=>{el.remove();VIE.openOrg(S,it.org)};
    if(q("#mFollow"))q("#mFollow").onclick=()=>{const who=S.mode==="pres"?"Cabinet du ministre de la Justice":(S.opp.experts.find(e=>e.dom==="droit")||{n:"Juriste"}).n+", juriste du parti";S.tasks.push({id:nid(),who,sujet:"suivi",caseId:c.id,due:S.m+1+Math.round(Math.random()),skill:70});el.remove();G.toast("Dossier confié. Compte rendu d'ici un à deux mois.");rerender()};
    if(q("#mGrace"))q("#mGrace").onclick=()=>{c.verdict=(c.verdict||"")+" Grâce présidentielle accordée.";SYS.cause(S,c.reg,"Grâce présidentielle pour les condamnés de "+c.ville,3,"");S.st.int=clamp(S.st.int+1,0,100);el.remove();G.toast("Grâce accordée.");rerender()};
    if(q("#mAvo"))q("#mAvo").onclick=()=>{if(S.opp.fonds<3){G.toast("Trésorerie insuffisante.");return}S.opp.fonds-=3;c.avocats++;S.opp.noto=clamp(S.opp.noto+2,0,100);SYS.cause(S,c.reg,"L'opposition défend les accusés de "+c.ville,1,"");el.remove();G.toast("Les avocats du parti prennent le dossier.");rerender()};
    if(q("#mAvOk"))q("#mAvOk").onclick=()=>{pr.chosen.prix*=1.15;pr.chosen.qual=Math.min(95,pr.chosen.qual+5);el.remove();G.toast("Avenant accepté.");rerender()};
    if(q("#mAvNo"))q("#mAvNo").onclick=()=>{pr.chosen.qual=Math.max(30,pr.chosen.qual-8);el.remove();G.toast("Avenant refusé : le chantier risque de ralentir.");rerender()};
    if(q("#mSee"))q("#mSee").onclick=()=>{G.viewRegion(it.reg);el.remove()};
  });
  SYS.hudMood(S);
};

/* ---------- demander un rapport ---------- */
function askSheet(S,who,dom,skill){
  const suj=SUJETS[dom]||SUJETS.eco;
  G.sheet('<h3 class="h2">Demander à '+esc(who)+'</h3><label class="f" for="aSuj">Sujet<select id="aSuj">'+suj.map(([k,n])=>'<option value="'+k+'">'+esc(n)+'</option>').join("")+'</select></label><label class="f" for="aReg">Région (si le sujet porte sur une région)'+regionSelect("aReg",S.mode==="opp"?S.opp.home:"EN")+'</label><button class="btn primary" id="aGo">Commander le rapport</button>',el=>{
    el.querySelector("#aGo").onclick=()=>{const sj=el.querySelector("#aSuj").value,rg=el.querySelector("#aReg").value;const d=SYS.askReport(S,who,dom,sj,rg,skill);el.remove();
      G.subs(who,"Bien reçu. Je vous remets mon rapport d'ici "+d+" mois"+(d>1?"":"")+", c'est-à-dire en "+G.monthLabel(S.m+d)+".",{voix:"f"});G.toast("Rapport attendu en "+G.monthLabel(S.m+d));rerender()};
  });
}

/* ---------- onglet Gouvernement ---------- */
let govView="hier";
SYS.renderGouv=function(S){
  const g=S.gov;if(!g.tdv)g.tdv=Object.fromEntries(E.TRAIN.map(t=>[t.id,"normal"]));const views=[["hier","Hiérarchie"],["budget","Budget"],["train","Train de vie"],["fisc","Fiscalité et salaires"]];
  let h='<div class="row">'+views.map(([k,n])=>'<button class="btn small'+(k===govView?" primary":"")+'" data-gv="'+k+'">'+n+'</button>').join("")+'</div>';
  if(govView==="hier"){
    const cnt={};for(const id in g.min)cnt[g.min[id].reg]=(cnt[g.min[id].reg]||0)+1;
    h+='<div class="card"><span class="eyebrow">Sommet de l\'État</span><div class="kv"><span>Président de la République</span><b>'+esc(S.name)+'</b><span>Vice-président</span><b>'+(g.vp?esc(g.vp.n):"vacant")+'</b><span>Secrétaire général de la Présidence</span><b>'+esc(g.sg.n)+'</b><span>Premier ministre, chef du gouvernement</span><b>'+esc(g.pm.n)+'</b></div><div class="row"><button class="btn small" data-post="vp">'+(g.vp?"Changer de":"Nommer un")+' vice-président</button><button class="btn small" data-post="pm">Changer de Premier ministre</button></div></div>'+
     '<div class="card"><span class="eyebrow">Équilibre régional du gouvernement</span><div class="legend">'+CM.REGIONS.map(r=>'<span>'+esc(r.n)+' <b style="color:'+((cnt[r.id]||0)===0?"var(--bad)":"var(--ink)")+'">'+(cnt[r.id]||0)+'</b></span>').join("")+'</div><span class="small muted">Une région sans ministre se sent exclue : son humeur baisse.</span></div>';
    const cats=[...new Set(E.MINISTERES.map(m=>m.cat))];
    for(const c of cats){h+='<div class="card"><span class="eyebrow">Pôle '+esc(c)+'</span>'+E.MINISTERES.filter(m=>m.cat===c).map(m=>{const x=g.min[m.id];return'<div class="row" style="justify-content:space-between;border-bottom:1px dashed var(--line);padding-bottom:6px"><div style="min-width:0;flex:1"><b>'+esc(m.id)+'</b> <span class="small muted">'+esc(m.n)+'</span><br><span class="small">'+esc(m.rang||"Ministre")+' : '+esc(x.n)+' · '+esc(CM.REG[x.reg].n)+' · compétence '+x.comp+'</span></div><div class="row"><button class="btn small ghost" data-ask="'+m.id+'">Rapport</button><button class="btn small" data-rep="'+m.id+'">Remplacer</button></div></div>'}).join("")+'</div>'}
    h+='<div class="card"><span class="eyebrow">Hiérarchie gouvernementale</span>'+E.HIERARCHIE.map(x=>'<div class="law"><b>'+esc(x.r)+'</b><span class="small muted">'+esc(x.d)+'</span></div>').join("")+'<span class="eyebrow">Ministres délégués et secrétaires d\'État</span><ul class="small" style="margin:0;padding-left:18px">'+E.DELEGUES.map(d=>'<li>'+esc(d[0])+'</li>').join("")+'</ul></div>';
  }else if(govView==="budget"){
    const tot=E.MINISTERES.reduce((a,m)=>a+g.alloc[m.id],0),base=E.MINISTERES.reduce((a,m)=>a+m.b,0);
    const B=E.BUDGET;
    h+='<div class="card"><span class="eyebrow">Loi de finances 2026</span><div class="kv"><span>Budget total</span><b>'+fmt(B.total,1)+' Mds</b><span>Recettes internes</span><b>'+fmt(B.recettesInternes,1)+'</b><span>dont fiscales / douanières</span><b>'+fmt(B.fiscales,1)+' / '+fmt(B.douanieres,1)+'</b><span>dont pétrolières et gazières</span><b>'+fmt(B.petrole,1)+'</b><span>Dépenses de personnel</span><b>'+fmt(B.personnel,1)+'</b><span>Investissement public</span><b>'+fmt(B.investissement,1)+'</b><span>Intérêts de la dette</span><b>'+fmt(B.interets,1)+'</b><span>Amortissement de la dette</span><b>'+fmt(B.amortissement,1)+'</b><span>Arriérés intérieurs</span><b>'+fmt(B.arrieres,1)+'</b><span>Besoin de financement</span><b>'+fmt(B.besoinFinancement,1)+'</b></div></div>'+
     '<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Dotations des ministères</span>'+pill((tot>=base?"+":"")+fmt(tot-base,1)+" Mds / 2026",tot>base?"warn":"ok")+'</div><span class="small muted">Chaque hausse s\'ajoute au déficit ; chaque baisse l\'allège mais affaiblit le secteur. Montants marqués * : estimations du jeu.</span>'+
     E.MINISTERES.slice().sort((a,b)=>b.b-a.b).map(m=>{const v=g.alloc[m.id],r=v/m.b;return'<div class="bars"><div class="b" style="grid-template-columns:minmax(0,1fr) auto"><span><b>'+m.id+'</b>'+(m.est?"*":"")+' <span class="small muted">'+esc(m.n)+'</span><br><span class="small">'+fmt(v,1)+' Mds · '+(r>=1?"+":"")+fmt((r-1)*100)+' %</span></span><span class="row" style="flex-wrap:nowrap"><button class="btn small" data-bm="'+m.id+'">−10 %</button><button class="btn small" data-bp="'+m.id+'">+10 %</button></span></div></div>'}).join("")+'</div>'+
     '<div class="card"><span class="eyebrow">Institutions (estimations)</span>'+G.barsHTML(E.INSTITUTIONS.map(([n,v])=>[n.replace("Présidence de la République","Présidence").replace("Services du Premier ministre","Primature"),v,70,"#8a8f98"])," Mds")+'</div>';
  }else if(govView==="train"){
    const tot=tdvTotal(S),base=E.TRAIN.reduce((a,x)=>a+x.b,0);
    h+='<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Train de vie de l\'État</span>'+pill(fmt(tot)+" Mds/an",tot<base?"ok":tot>base?"bad":"warn")+'</div><span class="small muted">Repère réel : 80 milliards FCFA d\'économies sur les biens et services en 2024 (services ramenés de 563,6 à 487,8 Mds). Directives de la Présidence : limiter comités, missions, achats de véhicules et carburant. L\'austérité plaît à l\'opinion mais irrite les ministres ; le luxe fait l\'inverse.</span>'+
     E.TRAIN.map(x=>'<div style="display:flex;flex-direction:column;gap:4px;border-bottom:1px dashed var(--line);padding-bottom:8px"><div class="row" style="justify-content:space-between"><span>'+esc(x.n)+'</span><b style="font-family:var(--mono)">'+fmt(x.b*E.TRAIN_NIV.find(n=>n[0]===g.tdv[x.id])[2],1)+' Mds</b></div><div class="row">'+E.TRAIN_NIV.map(n=>'<button class="btn small'+(g.tdv[x.id]===n[0]?" primary":"")+'" data-tv="'+x.id+'" data-niv="'+n[0]+'">'+n[1]+'</button>').join("")+'</div></div>').join("")+'</div>'+
     '<div class="card"><span class="eyebrow">Train de vie ministre par ministre</span><span class="small muted">Véhicules de fonction, missions à l\'étranger par an, budget du cabinet. Coût annuel estimé en millions FCFA.</span>'+
     E.MINISTERES.map(mi=>{const m=tdvFor(g.min[mi.id]);const c=coutMin(m),hot=m.veh>17||m.miss>14||m.cab>520;return'<div style="display:flex;flex-direction:column;gap:4px;border-bottom:1px dashed var(--line);padding-bottom:8px"><div class="row" style="justify-content:space-between"><span><b>'+mi.id+'</b> <span class="small">'+esc(m.n)+'</span></span>'+pill(fmt(c)+" M",hot?"bad":c>500?"warn":"ok")+'</div><span class="small muted">'+m.veh+' véhicules · '+m.miss+' missions/an · cabinet '+fmt(m.cab)+' M'+(m.audit?' · audit CONSUPE : '+esc(m.audit):"")+'</span><div class="row"><button class="btn small" data-aud="'+mi.id+'">Audit du CONSUPE</button><button class="btn small" data-red="'+mi.id+'">Imposer la sobriété</button><button class="btn small ghost" data-rep="'+mi.id+'">Limoger</button></div></div>'}).join("")+'</div>';
  }else{
    h+='<div class="card"><span class="eyebrow">Fiscalité</span>'+E.FISCAL.map(f=>'<div class="row" style="justify-content:space-between"><div style="flex:1;min-width:0"><b>'+esc(f.n)+'</b><br><span class="small muted">'+esc(f.d)+'</span></div><div class="row" style="flex-wrap:nowrap"><button class="btn small" data-fm="'+f.id+'">−</button><b style="font-family:var(--mono);min-width:64px;text-align:center">'+fmt(g.fisc[f.id],2)+' %</b><button class="btn small" data-fp="'+f.id+'">+</button></div></div>').join("")+'<span class="small muted">Recettes fiscales 2026 : 3 446,2 Mds ; recettes douanières : 1 243,2 Mds. Nouveauté 2026 : les plateformes numériques étrangères paient la TVA.</span></div>'+
     '<div class="card"><span class="eyebrow">Salaires</span><div class="kv"><span>SMIG secteur privé non agricole</span><b>'+fmt(g.smig)+' FCFA</b><span>SMIG secteur agricole</span><b>'+fmt(E.SALAIRES.smigAgricole)+' FCFA</b><span>SMIG agents de l\'État (Code du travail)</span><b>'+fmt(E.SALAIRES.smigEtat)+' FCFA</b><span>Indice des salaires de la fonction publique</span><b>'+g.indice+'</b><span>Masse salariale 2026</span><b>'+fmt(E.BUDGET.personnel*g.indice/100,1)+' Mds</b></div><div class="row"><button class="btn small" id="smigP">SMIG +5 000 FCFA</button><button class="btn small" id="indP">Fonctionnaires +2 %</button><button class="btn small" id="indM">Fonctionnaires −2 %</button></div></div>'+
     '<div class="card"><span class="eyebrow">Recrutements dans la fonction publique</span><span class="small muted">Budget 2026 des nouveaux recrutements plafonné à 15 milliards FCFA. Chaque lot pèse sur le déficit chaque année.</span>'+E.SALAIRES.recrues.map(r=>'<div class="row" style="justify-content:space-between"><span>'+esc(r.n)+' : '+fmt((g.recrues[r.id]||0)*r.lot)+' recrutés</span><button class="btn small" data-rec="'+r.id+'">Recruter '+fmt(r.lot)+' ('+fmt(r.cout,1)+' Mds/an)</button></div>').join("")+'</div>';
  }
  panel().innerHTML=h;
  const P=panel();
  P.querySelectorAll("[data-gv]").forEach(b=>b.onclick=()=>{govView=b.dataset.gv;rerender()});
  P.querySelectorAll("[data-ask]").forEach(b=>b.onclick=()=>{const m=E.MINISTERES.find(x=>x.id===b.dataset.ask);const dom={sec:"sec",eco:"eco",soc:m.id==="MINSANTE"?"sante":"edu",infra:"btp",int:"diplo",pop:"com"}[m.s]||"eco";askSheet(S,g.min[m.id].n+" ("+m.id+")",m.id==="MINMIDT"?"mines":m.id==="MINADER"||m.id==="MINEPIA"?"agri":dom,g.min[m.id].comp)});
  P.querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>appoint(S,b.dataset.rep));
  P.querySelectorAll("[data-post]").forEach(b=>b.onclick=()=>appoint(S,b.dataset.post));
  P.querySelectorAll("[data-bm],[data-bp]").forEach(b=>b.onclick=()=>{const id=b.dataset.bm||b.dataset.bp;const m=E.MINISTERES.find(x=>x.id===id);const d=m.b*.1*(b.dataset.bp?1:-1);if(g.alloc[id]+d<m.b*.4)return G.toast("Impossible de descendre sous 40 % de la dotation.");g.alloc[id]+=d;S.nums.deficit+=d;rerender()});
  P.querySelectorAll("[data-fm],[data-fp]").forEach(b=>b.onclick=()=>{const id=b.dataset.fm||b.dataset.fp;const f=E.FISCAL.find(x=>x.id===id);const up=!!b.dataset.fp;const nv=+(g.fisc[id]+(up?f.step:-f.step)).toFixed(2);if(nv<f.min||nv>f.max)return;g.fisc[id]=nv;const s=up?1:-1;S.nums.deficit-=s*f.rev*(f.step);S.st.pop=clamp(S.st.pop+s*f.pop*f.step,0,100);S.st.eco=clamp(S.st.eco+s*f.eco*f.step,0,100);if(f.id==="tva")S.nums.inflation+=s*.15*f.step;rerender()});
  P.querySelectorAll("[data-tv]").forEach(b=>b.onclick=()=>{const x=E.TRAIN.find(t=>t.id===b.dataset.tv);const old=E.TRAIN_NIV.find(n=>n[0]===g.tdv[x.id])[2],nv=E.TRAIN_NIV.find(n=>n[0]===b.dataset.niv)[2];g.tdv[x.id]=b.dataset.niv;S.nums.deficit+=x.b*(nv-old);S.st.pop=clamp(S.st.pop+(old-nv)*4,0,100);if(nv<old)SYS.cause(S,"CE","Réduction du train de vie de l'État : "+x.n.toLowerCase(),2,"corruption");rerender()});
  P.querySelectorAll("[data-aud]").forEach(b=>b.onclick=()=>{const id=b.dataset.aud,m=g.min[id];const excess=(m.veh>15?1:0)+(m.miss>12?1:0)+(m.cab>450?1:0);const fraud=Math.random()<excess*.25+(100-m.loy)/400;
    m.audit=fraud?"détournement présumé, transmis au Tribunal criminel spécial":excess?"dépenses excessives, rappel à l'ordre":"gestion conforme";S.nums.dette+=.1;
    if(fraud){SYS.newCase(S,"corruption","CE",1);S.st.pop=clamp(S.st.pop+2,0,100);m.loy=clamp(m.loy-20,0,100)}
    SYS.inbox(S,{from:"Contrôle supérieur de l'État",t:"Audit du "+id,b:"Mission de vérification au cabinet de "+m.n+" : "+m.veh+" véhicules, "+m.miss+" missions, "+fmt(m.cab)+" M FCFA de cabinet. Conclusion : "+m.audit+".",k:fraud?"alerte":"rapport"});G.toast("Audit : "+m.audit);rerender()});
  P.querySelectorAll("[data-red]").forEach(b=>b.onclick=()=>{const m=g.min[b.dataset.red];const before=coutMin(m);m.veh=Math.max(3,Math.round(m.veh*.6));m.miss=Math.max(2,Math.round(m.miss*.5));m.cab=Math.round(m.cab*.7);m.loy=clamp(m.loy-8,0,100);S.nums.deficit-=(before-coutMin(m))/1000;S.st.pop=clamp(S.st.pop+.5,0,100);G.toast("Économie : "+fmt(before-coutMin(m))+" M FCFA par an");rerender()});
  const sp=$("smigP");if(sp)sp.onclick=()=>{g.smig+=5000;S.st.pop=clamp(S.st.pop+2,0,100);S.st.soc=clamp(S.st.soc+2,0,100);S.st.eco=clamp(S.st.eco-1.5,0,100);S.nums.inflation+=.2;G.toast("SMIG porté à "+fmt(g.smig)+" FCFA");rerender()};
  const ip=$("indP");if(ip)ip.onclick=()=>{g.indice+=2;S.nums.deficit+=E.BUDGET.personnel*.02;S.st.soc=clamp(S.st.soc+1.5,0,100);S.st.pop=clamp(S.st.pop+1,0,100);rerender()};
  const im=$("indM");if(im)im.onclick=()=>{g.indice-=2;S.nums.deficit-=E.BUDGET.personnel*.02;S.st.soc=clamp(S.st.soc-3,0,100);S.st.pop=clamp(S.st.pop-2,0,100);SYS.cause(S,"CE","Baisse des salaires des fonctionnaires",-4,"emploi");rerender()};
  P.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>{const r=E.SALAIRES.recrues.find(x=>x.id===b.dataset.rec);g.recrues[r.id]=(g.recrues[r.id]||0)+1;S.nums.deficit+=r.cout;if(r.id==="sol")S.def.eff+=r.lot;G.toast(fmt(r.lot)+" "+r.n.toLowerCase()+" recrutés");rerender()});
};
function appoint(S,post){
  const g=S.gov;const cands=SYS.candidats(S,post);const label=post==="vp"?"Vice-président de la République":post==="pm"?"Premier ministre":(E.MINISTERES.find(m=>m.id===post)||{n:post}).n;
  G.sheet('<h3 class="h2">Nommer : '+esc(label)+'</h3><p class="small muted">Décret présidentiel (art. 8 et 10). La compétence rend le ministère efficace ; la loyauté évite les fuites et les trahisons ; l\'origine compte pour l\'équilibre régional.</p>'+cands.map((c,i)=>'<button class="choice" data-c="'+i+'"><span class="t">'+esc(c.n)+' · '+esc(CM.REG[c.reg].n)+'</span><span class="small muted">'+esc(c.type)+' · compétence '+c.comp+' · loyauté '+c.loy+'</span></button>').join(""),el=>{
    el.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{const c=cands[+b.dataset.c];
      if(post==="vp"){g.vp=c;S.vp=true;SYS.cause(S,c.reg,"Un fils de la région nommé vice-président",4,"");S.st.pop=clamp(S.st.pop+(c.type.includes("opposition")?3:1),0,100)}
      else if(post==="pm"){g.pm=c;S.st.pop=clamp(S.st.pop+rnd(-1,4),0,100);SYS.cause(S,c.reg,"Un fils de la région nommé Premier ministre",4,"")}
      else{g.min[post]=tdvFor(c);if(c.type.includes("opposition")){S.st.soc=clamp(S.st.soc+1,0,100)}SYS.cause(S,c.reg,"Nomination d'un ministre originaire de la région",2,"")}
      SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Décret de nomination : "+label,b:c.n+" ("+c.type.toLowerCase()+", originaire de la région "+deR(CM.REG[c.reg])+") est nommé"+(post==="vp"?" vice-président de la République.":post==="pm"?" Premier ministre, chef du gouvernement.":" à la tête du ministère "+label.toLowerCase()+"."),k:"info"});
      el.remove();G.toast("Nomination signée.");rerender()});
  });
}

/* ---------- onglet Projets (marchés publics) ---------- */
SYS.renderProjets=function(S){
  const owner=S.mode==="pres"?"etat":S.mode==="min"?"ministere":S.profil==="depute"&&S.opp.dep?"depute":(S.opp.commune?"commune":"parti");
  const fonds=owner==="etat"?"Budget de l'État (financement par la dette)":owner==="ministere"?"Crédits d'investissement du "+S.minis.id+" : "+fmt(S.minis.fonds)+" M FCFA":owner==="depute"?"Crédits de micro-projets parlementaires : "+fmt(S.opp.dep.fonds)+" M FCFA":owner==="commune"?"Budget de la commune de "+S.opp.commune.ville+" : "+fmt(S.opp.commune.fonds)+" M FCFA":"Caisse du parti : "+fmt(S.opp.fonds)+" M FCFA (projets communautaires)";
  const cat=E.PROJETS.filter(p=>owner==="etat"||owner==="ministere"?true:owner==="commune"?(p.small||["lycee","eau","eclairage","marche","video","logiciel","kits","dechets"].includes(p.id)):p.small);
  const defReg=owner==="commune"?S.opp.commune.reg:owner==="depute"?S.opp.dep.reg:S.mode==="opp"?S.opp.home:S.mode==="min"?S.minis.home:"EN";
  const act=S.projects.filter(p=>p.owner===owner);
  let h='<div class="card"><span class="eyebrow">Lancer un appel d\'offres</span><span class="small muted">'+esc(fonds)+'. Code des marchés publics (décret n° 2018/366) : publication, dépouillement par la commission, attribution, contrôle de l\'ARMP.</span>'+
   '<label class="f" for="pjP">Ouvrage<select id="pjP">'+cat.map(p=>'<option value="'+p.id+'">'+esc(p.n)+' · ≈ '+esc(fmtM(p.cout))+' · '+p.mois+' mois</option>').join("")+'</select></label>'+
   '<div class="grid2"><label class="f" for="pjR">Région'+(owner==="commune"?'<select id="pjR" disabled><option value="'+defReg+'">'+esc(CM.REG[defReg].n)+'</option></select>':regionSelect("pjR",defReg))+'</label><label class="f" for="pjV">Ville ou village<select id="pjV"></select></label></div>'+
   '<div class="grid2"><button class="opt" data-mode="nat" aria-pressed="true"><b>National</b><span>Entreprises camerounaises, plus d\'emplois locaux.</span></button><button class="opt" data-mode="inter" aria-pressed="false"><b>International</b><span>Groupes étrangers, souvent plus rapides.</span></button></div>'+
   '<button class="btn primary" id="pjGo">Publier l\'appel d\'offres</button></div>';
  if(act.length){h+='<span class="eyebrow">Projets en cours et terminés</span>'+act.map(p=>{
    let body="";
    const hb=window.WORLD&&p.req&&(p.stage==="ao"||p.stage==="offres")?WORLD.humanBids(p.req):[];
    const hum=hb.length?'<span class="small" style="color:var(--y)">Offres de joueurs (prioritaires) :</span>'+hb.map((b,i)=>'<button class="choice" data-hum="'+p.id+'" data-i="'+i+'"><span class="t"><span class="pill ok">Joueur</span> '+esc(b.name)+' <span class="muted small">('+esc(b.role)+')</span></span><span class="small">'+fmt(b.p)+' M FCFA · '+b.m+' mois · paiement à la livraison</span></button>').join(""):"";
    if(p.stage==="joueur")body='<span class="small">Confié à '+esc(p.chosen.co)+' · livraison attendue en '+esc(G.monthLabel(p.due))+'. Vous payerez à la réception.</span>';
    else if(p.stage==="ao")body=hum+(p.d0!=null?'<span class="small muted">'+(p.humans?"Proposé en priorité à "+p.humans+" joueur(s) de ce profil. ":"")+(hb.length?'<button class="btn small ghost" data-forceai="'+p.id+'">Demander aussi des offres aux entreprises du jeu</button>':"Offres des entreprises du jeu attendues le "+esc(G.dayLabel(p.aiDay))+".")+'</span>':'<span class="small muted">Dépouillement le mois prochain.</span>');
    else if(p.stage==="offres")body=hum+'<span class="small">Choisissez l\'attributaire :</span>'+p.bids.map((b,i)=>'<button class="choice" data-award="'+p.id+'" data-i="'+i+'"><span class="t">'+esc(b.co)+' <span class="muted small">('+esc(b.pays)+')</span></span><span class="small">'+esc(fmtM(b.prix))+' · '+b.mois+' mois · note technique '+b.qual+'/100 · '+b.jobs+' % d\'emplois locaux</span></button>').join("")+(S.diasp.length?'<span class="small muted">Vous pourrez affecter un expert de la diaspora au chantier.</span>':"");
    else if(p.stage==="chantier")body='<span class="small">'+esc(p.chosen.co)+' · livraison prévue en '+esc(G.monthLabel(p.due))+(p.diaspora?' · expert de la diaspora affecté':"")+'</span><div class="bar" style="height:10px"><i style="width:'+p.prog+'%"></i></div><span class="small muted">Avancement '+Math.round(p.prog)+' % · payé '+esc(fmtM(p.paid))+(p.insp?' · dernier contrôle : conformité estimée '+p.insp.v+' %':"")+'</span><div class="row"><button class="btn small" data-insp="'+p.id+'">Contrôle de chantier</button>'+(!p.diaspora&&S.diasp.length?'<button class="btn small" data-dia="'+p.id+'">Affecter un expert de la diaspora</button>':"")+'</div>';
    else if(p.stage==="livre")body='<span class="small">Livré en '+esc(G.monthLabel(p.m1))+' par '+esc(p.chosen.co)+'. Conformité au cahier des charges : <b>'+p.conf+' %</b></span>';
    else body='<span class="small" style="color:var(--bad)">Chantier abandonné par '+esc(p.chosen?p.chosen.co:"l\'entreprise")+'.</span>';
    return'<div class="card" style="gap:8px"><div class="row" style="justify-content:space-between"><b>'+esc(p.n)+'</b>'+pill({ao:"Appel d'offres",offres:"Offres reçues",chantier:"Chantier",livre:"Livré",abandon:"Abandonné"}[p.stage],{ao:"warn",offres:"warn",chantier:"ok",livre:"ok",abandon:"bad"}[p.stage])+'</div><span class="small muted">'+esc(p.ville)+' · région '+esc(CM.REG[p.reg].n)+' · appel '+(p.mode==="inter"?"international":"national")+'</span>'+body+'</div>'}).join("")}
  h+='<div class="card"><span class="eyebrow">Expertise de la diaspora</span><span class="small muted">Des Camerounais de l\'étranger peuvent superviser vos chantiers (qualité et délais meilleurs).</span>'+(S.diasp.length?'<ul class="small" style="margin:0;padding-left:18px">'+S.diasp.map(d=>'<li>'+esc(d.n)+', '+esc(d.metier.toLowerCase())+' ('+esc(d.ville)+')</li>').join("")+'</ul>':"")+'<button class="btn small" id="diaG">Faire appel à la diaspora</button></div>';
  panel().innerHTML=h;
  let mode="nat";const P=panel();
  const fillV=()=>{const r=CM.REG[$("pjR").value];$("pjV").innerHTML=r.villes.concat([r.village.split(",")[0].replace(/^(le |la |un |une |les )/,"")]).map(v=>'<option>'+esc(v)+'</option>').join("")};
  fillV();$("pjR").onchange=fillV;
  if(owner==="commune"){$("pjV").innerHTML='<option>'+esc(S.opp.commune.ville)+'</option>'}
  P.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;P.querySelectorAll("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  $("pjGo").onclick=()=>{SYS.launchTender(S,$("pjP").value,$("pjR").value,$("pjV").value,mode,owner);G.toast("Appel d'offres publié.");rerender()};
  P.querySelectorAll("[data-hum]").forEach(b=>b.onclick=()=>{const p=S.projects.find(x=>x.id===b.dataset.hum);const hb=WORLD.humanBids(p.req);if(SYS.awardHuman(S,p,hb[+b.dataset.i])){G.toast("Marché confié à "+hb[+b.dataset.i].name);rerender()}});
  P.querySelectorAll("[data-forceai]").forEach(b=>b.onclick=()=>{const p=S.projects.find(x=>x.id===b.dataset.forceai);p.forceAI=1;p.aiDay=S.day;SYS.dayTick(S);rerender()});
  P.querySelectorAll("[data-award]").forEach(b=>b.onclick=()=>{const p=S.projects.find(x=>x.id===b.dataset.award);if(!SYS.award(S,p,+b.dataset.i))return G.toast("Fonds insuffisants pour l'avance de démarrage.");G.viewRegion(p.reg);rerender()});
  P.querySelectorAll("[data-insp]").forEach(b=>b.onclick=()=>{const p=S.projects.find(x=>x.id===b.dataset.insp);const v=SYS.inspect(S,p);G.toast("Contrôle : conformité estimée à "+v+" %"+(v<55?" — mise en demeure de l'entreprise.":""));rerender()});
  P.querySelectorAll("[data-dia]").forEach(b=>b.onclick=()=>{const p=S.projects.find(x=>x.id===b.dataset.dia);p.diaspora=1;G.toast("Expert affecté au chantier.");rerender()});
  $("diaG").onclick=()=>diasporaSheet(S);
};
function diasporaSheet(S){
  const opts=E.DIASPORA.slice().sort(()=>Math.random()-.5).slice(0,4).map(([metier,ville])=>({metier,ville,n:nom(regAlea())}));
  const cost=S.mode==="pres"?"0,5 Md FCFA":"5 M FCFA";
  G.sheet('<h3 class="h2">Appel à la diaspora</h3><p class="small muted">Coût de la mission : '+cost+' (billets, indemnités). Ils rejoignent votre équipe d\'experts.</p>'+opts.map((o,i)=>'<button class="choice" data-d="'+i+'"><span class="t">'+esc(o.n)+'</span><span class="small muted">'+esc(o.metier)+' à '+esc(o.ville)+'</span></button>').join(""),el=>{
    el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const o=opts[+b.dataset.d];if(S.mode==="pres")S.nums.dette+=.5;else{if(S.opp.fonds<5)return G.toast("Trésorerie insuffisante.");S.opp.fonds-=5;
        const dom=/juriste/i.test(o.metier)?"droit":/économiste/i.test(o.metier)?"eco":/médecin/i.test(o.metier)?"sante":/mines/i.test(o.metier)?"mines":/cyber/i.test(o.metier)?"sec":/professeure/i.test(o.metier)?"edu":"btp";S.opp.experts.push({dom,n:o.n,reg:"CE",skill:Math.round(rnd(80,94)),diaspora:1})}
      S.diasp.push(o);el.remove();G.toast(o.n+" rejoint l'équipe depuis "+o.ville+".");rerender()})});
}

/* ---------- onglet Défense ---------- */
SYS.renderDefense=function(S){
  const D=S.def,T=E.DEFENSE;const used=D.espUsed===S.m;
  let h='<div class="card"><span class="eyebrow">Forces de défense</span><div class="kv"><span>Militaires actifs (estimation)</span><b>'+fmt(D.eff)+'</b><span>Bataillon d\'intervention rapide</span><b>≥ '+fmt(D.bir)+'</b><span>Budget MINDEF</span><b>'+fmt(S.gov.alloc.MINDEF,1)+' Mds</b><span>Fournisseurs principaux</span><b>Chine, Russie, France, Israël</b></div><span class="small muted">Formation : '+esc(T.formations.join(", "))+'.</span></div>'+
   '<div class="card"><span class="eyebrow">Répartition des forces par théâtre</span><span class="small muted">Si un théâtre reçoit moins que son besoin, la sécurité s\'y dégrade. Le total fait 100 %.</span>'+T.theatres.map(t=>{const a=D.alloc[t.id],sec=t.id==="RES"?null:S.regs[t.id].sec;return'<div class="row" style="justify-content:space-between;border-bottom:1px dashed var(--line);padding-bottom:6px"><div style="flex:1;min-width:0"><b>'+esc(t.n)+'</b> '+(sec!=null?pill("sécurité "+Math.round(sec),sec<30?"bad":sec<55?"warn":"ok"):"")+'<br><span class="small muted">'+esc(t.op)+(t.need?" · besoin "+t.need+" %":"")+'</span></div><div class="row" style="flex-wrap:nowrap">'+(t.id!=="RES"?'<button class="btn small" data-dm="'+t.id+'">−</button>':"")+'<b style="font-family:var(--mono);min-width:44px;text-align:center">'+a+' %</b>'+(t.id!=="RES"?'<button class="btn small" data-dp="'+t.id+'">+</button>':"")+'</div></div>'}).join("")+'</div>'+
   '<div class="card"><span class="eyebrow">Équipement (appel d\'offres international)</span>'+T.equipements.map(e=>'<div class="row" style="justify-content:space-between"><span>'+esc(e.n)+' <span class="small muted">≈ '+e.cout+' Mds</span></span><button class="btn small" data-eq="'+e.id+'"'+(D.equip.includes(e.id)?" disabled":"")+'>'+(D.equip.includes(e.id)?"Acquis":"Acheter")+'</button></div>').join("")+'</div>'+
   '<div class="card"><span class="eyebrow">Renseignement extérieur (DGRE) · une mission par mois</span>'+E.ESPIONNAGE.map(x=>'<button class="choice" data-esp="'+x.id+'"'+(used?" disabled":"")+'><span class="t">'+esc(x.n)+'</span><span class="small muted">'+esc(x.d)+' Chances : '+Math.round(x.ok*100)+' %.</span></button>').join("")+'</div>';
  panel().innerHTML=h;const P=panel();
  const mv=(id,d)=>{if(D.alloc.RES-d<0||D.alloc[id]+d<0)return;D.alloc[id]+=d;D.alloc.RES-=d;rerender()};
  P.querySelectorAll("[data-dp]").forEach(b=>b.onclick=()=>mv(b.dataset.dp,2));
  P.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>mv(b.dataset.dm,-2));
  P.querySelectorAll("[data-eq]").forEach(b=>b.onclick=()=>{const e=T.equipements.find(x=>x.id===b.dataset.eq);S.nums.dette+=e.cout;D.equip.push(e.id);S.st.sec=clamp(S.st.sec+e.sec,0,100);if(e.reg)S.regs[e.reg].sec=clamp(S.regs[e.reg].sec+8,0,100);else{S.regs.EN.sec=clamp(S.regs.EN.sec+4,0,100);S.regs.NW.sec=clamp(S.regs.NW.sec+3,0,100);S.regs.SW.sec=clamp(S.regs.SW.sec+3,0,100)}
    SYS.inbox(S,{from:"Ministère délégué à la Défense",t:"Contrat d'armement signé : "+e.n,b:"Appel d'offres international restreint (secret défense). Livraison et formation des équipages dans les prochains mois. Coût : "+e.cout+" milliards FCFA.",k:"info"});G.toast("Contrat signé.");rerender()});
  P.querySelectorAll("[data-esp]").forEach(b=>b.onclick=()=>{const x=E.ESPIONNAGE.find(y=>y.id===b.dataset.esp);D.espUsed=S.m;const ok=Math.random()<x.ok;
    if(ok){for(const k in x.gain)S.st[k]=clamp(S.st[k]+x.gain[k],0,100);if(x.reg)for(const r in x.reg)S.regs[r].sec=clamp(S.regs[r].sec+x.reg[r],0,100)}
    else if(Math.random()<.5||x.scandale&&Math.random()<.6){for(const k in x.risk)S.st[k]=clamp(S.st[k]+x.risk[k],0,100)}
    const txt=ok?"Mission réussie : "+x.n.toLowerCase()+". Informations exploitables transmises aux forces.":"Mission compromise"+(x.scandale?" : la presse révèle des écoutes, scandale national.":". Un agent a été identifié.");
    SYS.inbox(S,{from:"Direction générale de la recherche extérieure",t:"Compte rendu de mission",b:txt,k:ok?"bonne":"alerte"});G.toast(ok?"Mission réussie":"Mission compromise");rerender()});
};

/* ---------- onglet Monde ---------- */
SYS.renderMonde=function(S){
  const pres=S.mode==="pres";if(pres&&S.diploUsed.m!==S.m)S.diploUsed={m:S.m,n:0};
  const left=pres?2-S.diploUsed.n:0;
  let h='<div class="card"><span class="eyebrow">Relations internationales</span><span class="small muted">'+(pres?"Deux initiatives diplomatiques par mois. Il en reste "+left+".":"En tant qu'opposant, vous pouvez plaider votre cause, mais tout financement étranger d'un parti est interdit.")+'</span></div>'+
   E.PAYS.map(p=>{const r=S.diplo[p.id];return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(p.n)+'</b>'+pill(r>=65?"Excellentes":r>=50?"Bonnes":r>=35?"Tendues":"Mauvaises",r>=50?"ok":r>=35?"warn":"bad")+'</div><div class="bar"><i class="'+(r<35?"low":r<50?"mid":"")+'" style="width:'+r+'%"></i></div><span class="small muted">'+esc(p.d)+'</span><span class="small">Atout : '+esc(p.atout)+'</span><div class="row">'+(pres?E.DIPLO_ACTIONS.map(a=>'<button class="btn small" data-dip="'+p.id+'" data-a="'+a.id+'"'+(left<=0?" disabled":"")+'>'+esc(a.n)+'</button>').join(""):'<button class="btn small" data-plaid="'+p.id+'">Plaider auprès de ce partenaire</button>')+'</div></div>'}).join("");
  panel().innerHTML=h;const P=panel();
  P.querySelectorAll("[data-dip]").forEach(b=>b.onclick=()=>{const p=E.PAYS.find(x=>x.id===b.dataset.dip),a=E.DIPLO_ACTIONS.find(x=>x.id===b.dataset.a);S.diploUsed.n++;
    let rel=a.rel*(rnd(.7,1.3));if(a.id==="pret"){if(S.diplo[p.id]<45){G.toast(p.n+" refuse votre demande.");rerender();return}const amt=Math.round(a.dette*(S.diplo[p.id]/60));S.nums.dette+=amt;S.st.eco=clamp(S.st.eco+2,0,100);if(p.id==="FMI"){S.st.soc=clamp(S.st.soc-2,0,100)}SYS.inbox(S,{from:"Ministère des Finances",t:"Financement obtenu : "+p.n,b:amt+" milliards FCFA mobilisés"+(p.id==="FMI"?", avec des engagements de réformes (subventions, masse salariale).":p.id==="CN"?" pour les grands chantiers, garantis par des recettes futures.":"."),k:"info"})}
    S.diplo[p.id]=clamp(S.diplo[p.id]+rel,0,100);if(a.eco)S.st.eco=clamp(S.st.eco+a.eco,0,100);if(a.sec)S.st.sec=clamp(S.st.sec+a.sec,0,100);if(a.pop)S.st.pop=clamp(S.st.pop+a.pop,0,100);if(a.int)S.st.int=clamp(S.st.int+a.int,0,100);if(a.cout)S.nums.dette+=a.cout*.1;
    if(a.id==="militaire"&&p.id==="NG"){S.regs.EN.sec=clamp(S.regs.EN.sec+5,0,100)}
    if(a.id==="visite")G.subs("Visite officielle",p.n+" : entretiens au plus haut niveau. Les deux délégations ont salué l'excellence de leurs relations et signé plusieurs mémorandums d'entente.",{voix:"f"});
    G.toast(a.n+" : "+p.n);rerender()});
  P.querySelectorAll("[data-plaid]").forEach(b=>b.onclick=()=>{const p=E.PAYS.find(x=>x.id===b.dataset.plaid);if(S.opp.fonds<4)return G.toast("Trésorerie insuffisante (4 M FCFA).");S.opp.fonds-=4;S.opp.noto=clamp(S.opp.noto+2,0,100);S.opp.surv=clamp(S.opp.surv+2,0,100);S.integ=clamp(S.integ+1,0,100);SYS.inbox(S,{from:"Votre diplomate",t:"Plaidoyer auprès de : "+p.n,b:"Rencontres avec des diplomates et des parlementaires. Ils suivront de près la transparence des prochains scrutins. Aucun financement n'a été demandé ni reçu, conformément à la loi.",k:"info"});G.toast("Plaidoyer effectué.");rerender()});
};

/* ---------- onglet Ressources ---------- */
SYS.renderRessources=function(S){
  const pres=S.mode==="pres";
  let h='<div class="card"><span class="eyebrow">Mines, hydrocarbures et énergie</span><span class="small muted">Recensement des sites connus en 2026, exploités ou non. Revenus versés à l\'État lorsqu\'ils sont en production.</span></div>';
  h+=E.MINES.map(m=>{const st=S.mines[m.id],L=E.MINE_ST[st];return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(m.n)+'</b>'+pill(L[0],L[1])+'</div><span class="small muted">'+esc(m.res)+' · région '+esc(CM.REG[m.reg].n)+'</span><span class="small">'+esc(m.d)+'</span>'+
    (pres&&m.v>0?'<div class="row">'+(st==="inexploite"||st==="developpement"?'<button class="btn small" data-mao="'+m.id+'">Appel d\'offres international d\'exploitation</button><button class="btn small" data-mnat="'+m.id+'">Confier à la SONAMINES</button>':"")+(st==="artisanal"?'<button class="btn small" data-mart="'+m.id+'">Encadrer l\'orpaillage</button>':"")+'<button class="btn small ghost" data-mview="'+m.reg+'">Voir la région</button></div>':'<div class="row"><button class="btn small ghost" data-mview="'+m.reg+'">Voir la région</button></div>')+'</div>'}).join("");
  h+='<div class="card"><span class="eyebrow">Ports et transports</span>'+E.TRANSPORTS.map(t=>'<div style="display:flex;flex-direction:column;gap:4px;border-bottom:1px dashed var(--line);padding-bottom:8px"><div class="row" style="justify-content:space-between"><b>'+esc(t.n)+'</b><span class="small">état '+Math.round(S.transp[t.id])+'/100</span></div><div class="bar"><i class="'+(S.transp[t.id]<35?"low":S.transp[t.id]<55?"mid":"")+'" style="width:'+S.transp[t.id]+'%"></i></div><span class="small muted">'+esc(t.d)+'</span>'+(pres?'<button class="btn small" data-tr="'+t.id+'" style="align-self:flex-start">Moderniser ('+(t.t==="port"?"120":t.t==="rail"?"80":"60")+' Mds)</button>':"")+'</div>').join("")+'</div>';
  panel().innerHTML=h;const P=panel();
  P.querySelectorAll("[data-mview]").forEach(b=>b.onclick=()=>G.viewRegion(b.dataset.mview));
  P.querySelectorAll("[data-mao]").forEach(b=>b.onclick=()=>mineTender(S,b.dataset.mao));
  P.querySelectorAll("[data-mnat]").forEach(b=>b.onclick=()=>{const m=E.MINES.find(x=>x.id===b.dataset.mnat);S.mines[m.id]="nationalise";S.nums.dette+=m.v*80;S.st.eco=clamp(S.st.eco+1,0,100);SYS.inbox(S,{from:"SONAMINES",t:"Reprise par l'État : "+m.n,b:"La Société nationale des mines prend l'exploitation en main, avec un investissement public de "+fmt(m.v*80)+" milliards FCFA. Rendement plus faible qu'un opérateur privé, mais contrôle national.",k:"info"});rerender()});
  P.querySelectorAll("[data-mart]").forEach(b=>b.onclick=()=>{const m=E.MINES.find(x=>x.id===b.dataset.mart);S.mines[m.id]="exploite";S.st.int=clamp(S.st.int+2,0,100);SYS.cause(S,m.reg,"Coopératives d'orpailleurs encadrées à "+(m.reg==="ES"?"Bétaré-Oya":"la mine"),2,"emploi");rerender()});
  P.querySelectorAll("[data-tr]").forEach(b=>b.onclick=()=>{const t=E.TRANSPORTS.find(x=>x.id===b.dataset.tr);const c=t.t==="port"?120:t.t==="rail"?80:60;S.nums.dette+=c;S.transp[t.id]=clamp(S.transp[t.id]+25,0,100);S.st.eco=clamp(S.st.eco+2,0,100);S.st.infra=clamp(S.st.infra+2,0,100);SYS.cause(S,t.reg,"Modernisation : "+t.n,3,"emploi");G.toast("Travaux lancés.");rerender()});
};
function mineTender(S,id){
  const m=E.MINES.find(x=>x.id===id);const cos=[["Kasai Mining Services","Afrique du Sud"],["Sinotech Resources","Chine"],["Atlas Metals","Australie"],["Anatolia Maden","Turquie"],["Camer Minerals SA (capitaux camerounais)","Cameroun"]].sort(()=>Math.random()-.5).slice(0,3);
  const offers=cos.map(([n,p])=>({n,p,roy:Math.round(rnd(4,12)),inv:Math.round(m.v*rnd(300,900)),mois:Math.round(rnd(12,36)),local:Math.random()<.45,emp:Math.round(rnd(400,3000))}));
  G.sheet('<h3 class="h2">Offres : '+esc(m.n)+'</h3><p class="small muted">Code minier : redevances, part de l\'État, obligations sociales et environnementales.</p>'+offers.map((o,i)=>'<button class="choice" data-o="'+i+'"><span class="t">'+esc(o.n)+' <span class="small muted">('+esc(o.p)+')</span></span><span class="small">Investissement '+fmt(o.inv)+' Mds · redevance '+o.roy+' % · production dans '+o.mois+' mois · '+fmt(o.emp)+' emplois'+(o.local?' · transformation locale':"")+'</span></button>').join(""),el=>{
    el.querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{const o=offers[+b.dataset.o];S.mines[m.id]="developpement";S.minePending=S.minePending||[];S.minePending.push({id:m.id,due:S.m+Math.round(o.mois/3),roy:o.roy});S.st.eco=clamp(S.st.eco+(o.local?3:1.5),0,100);SYS.cause(S,m.reg,"Convention minière signée : "+m.n+" ("+fmt(o.emp)+" emplois annoncés)",3,"emploi");
      SYS.inbox(S,{from:"Ministère des Mines",t:"Convention signée : "+m.n,b:o.n+" s'engage à investir "+fmt(o.inv)+" milliards FCFA. Premiers revenus attendus en "+G.monthLabel(S.m+Math.round(o.mois/3))+".",k:"info"});el.remove();rerender()})});
}
SYS.minesTick=function(S){if(!S.minePending)return;for(const p of S.minePending)if(p.due<=S.m){S.mines[p.id]="exploite";const m=E.MINES.find(x=>x.id===p.id);SYS.inbox(S,{from:"Ministère des Mines",t:"Entrée en production : "+m.n,b:"Les premières recettes minières arrivent au Trésor.",k:"bonne"});SYS.cause(S,m.reg,"Démarrage de la production : "+m.n,2,"emploi")}S.minePending=S.minePending.filter(p=>p.due>S.m)};

/* ---------- onglet Économie : secteur privé ---------- */
SYS.renderEconomie=function(S){
  if(!S.prive)initPrive(S);
  const P=S.prive,X=E.PRIVE,pres=S.mode==="pres";const c=Math.round(P.climat);
  let h='<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Climat des affaires</span>'+pill(c>=60?"Favorable":c>=45?"Moyen":c>=32?"Dégradé":"Très dégradé",c>=60?"ok":c>=45?"warn":"bad")+'</div><span class="big-num">'+c+'<span class="small muted">/100</span></span><div class="bar" style="height:10px"><i class="'+(c<32?"low":c<45?"mid":"")+'" style="width:'+c+'%"></i></div><span class="small muted">Dépend de l\'économie, de la sécurité, de l\'électricité, de l\'impôt sur les sociétés et des arriérés de l\'État. Emplois créés ou perdus depuis le début : '+(P.emplois>=0?"+":"")+fmt(P.emplois)+'.</span></div>'+
   '<div class="facts">'+fact2(fmt(X.entreprises),"entreprises recensées (INS, RGE-2)")+fact2(fmt(X.informel,1)+" %","des emplois sont informels")+fact2(fmt(X.priveFormel,1)+" %","de l\'emploi dans le privé formel")+fact2(fmt(X.revenuInformel)+" F","revenu mensuel moyen dans l\'informel")+fact2(fmt(X.creditT1_2026)+" Mds","de nouveaux crédits au 1er trimestre 2026 (1 887 un an plus tôt)")+fact2(fmt(P.arrieres,1)+" Mds","d\'arriérés de l\'État envers les entreprises")+'</div>'+
   '<p class="small muted">Organisations patronales : '+esc(X.patronat)+'. Dialogue public-privé : '+esc(X.dialogue)+'. Dette intérieure : 4 265 milliards FCFA (12,3 % du PIB) fin mars 2026.</p>'+
   '<span class="eyebrow">Filières</span>'+X.secteurs.map(x=>{const a=Math.round(P.act[x.id]);return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(x.n)+'</b><span class="small">activité '+a+'/100</span></div><div class="bar"><i class="'+(a<35?"low":a<50?"mid":"")+'" style="width:'+a+'%"></i></div><span class="small muted">'+esc(x.d)+' Emplois estimés : '+fmt(x.emp*a/50)+' 000. Régions : '+x.reg.map(r=>CM.REG[r].n).join(", ")+'.</span></div>'}).join("");
  if(pres){h+='<div class="card"><span class="eyebrow">Politique en faveur du secteur privé</span>'+E.PRIVE_ACTIONS.map(a=>{const cd=a.cool&&P.used[a.id]!=null&&S.m-P.used[a.id]<a.cool;const dis=cd||(a.id==="arrieres"&&P.arrieres<=0);return'<button class="choice" data-pa="'+a.id+'"'+(dis?" disabled":"")+'><span class="t">'+esc(a.n)+'</span><span class="small muted">'+esc(a.d)+'</span></button>'}).join("")+'</div>'}
  else{h+='<div class="card"><span class="eyebrow">L\'opposition et les entreprises</span><button class="choice" id="gecam"><span class="t">Rencontrer le patronat (GECAM)</span><span class="small muted">Présenter votre programme économique. Les dons de personnes établies au Cameroun sont autorisés s\'ils sont déclarés.</span></button><button class="choice" id="pme"><span class="t">Tournée des PME et de l\'informel</span><span class="small muted">Écouter commerçants, artisans, bendskinneurs : gros gisement de voix.</span></button></div>'}
  panel().innerHTML=h;const Pn=panel();
  Pn.querySelectorAll("[data-pa]").forEach(b=>b.onclick=()=>{const a=E.PRIVE_ACTIONS.find(x=>x.id===b.dataset.pa);
    if(a.dette)S.nums.dette+=a.dette;if(a.deficit)S.nums.deficit+=a.deficit;P.climat=clamp(P.climat+a.climat,0,100);if(a.eco)S.st.eco=clamp(S.st.eco+a.eco,0,100);if(a.pop)S.st.pop=clamp(S.st.pop+a.pop,0,100);if(a.inflation)S.nums.inflation+=a.inflation;
    if(a.id==="arrieres")P.arrieres=Math.max(0,P.arrieres-100);P.used[a.id]=S.m;
    if(a.id==="cbf")G.subs("Cameroon Business Forum","Le patronat salue l'ouverture du dialogue et présente ses priorités : paiement des arriérés, électricité fiable, fiscalité stable et fin des tracasseries administratives.",{voix:"f"});
    SYS.cause(S,"LT",a.n,a.climat>0?2:-2,"emploi");G.toast(a.n);rerender()});
  const ge=$("gecam");if(ge)ge.onclick=()=>{if(S.opp.fonds<2)return G.toast("Trésorerie insuffisante.");S.opp.fonds-=2;const ok=Math.random()<.35+S.opp.noto/200+(50-P.climat)/100;const don=ok?Math.round(rnd(5,25)):0;S.opp.fonds+=don;S.opp.noto=clamp(S.opp.noto+2,0,100);
    SYS.inbox(S,{from:"Votre économiste",t:"Rencontre avec le patronat",b:ok?"Les chefs d'entreprise ont apprécié votre programme. Des dons déclarés de "+don+" millions FCFA ont été reçus de personnes établies au Cameroun.":"Accueil poli mais prudent : les patrons craignent des représailles fiscales s'ils soutiennent l'opposition.",k:"rapport"});G.toast(ok?"+"+don+" M FCFA":"Accueil prudent");rerender()};
  const pm=$("pme");if(pm)pm.onclick=()=>{if(S.opp.fonds<3)return G.toast("Trésorerie insuffisante.");S.opp.fonds-=3;for(const r of ["LT","CE","OU"])G.shift(S.sup,r,S.party,rnd(.5,1.2),S.power);S.opp.noto=clamp(S.opp.noto+2,0,100);G.viewRegion("LT","marche",{color:S.parties[S.party].c,banner:S.parties[S.party].n,sub:"PME ET INFORMEL"});G.toast("Tournée effectuée à Douala, Yaoundé et Bafoussam.");rerender()};
};
function fact2(b,s){return'<div class="fact"><b>'+b+'</b><span>'+s+'</span></div>'}

/* ---------- onglet Parti ---------- */
let partyView="bureau";
SYS.renderParti=function(S){
  const P=S.opp,pa=S.parties[S.party];const views=[["bureau","Bureau et experts"],["militants","Militants et finances"],["mandats","Mandats"],["loi","Questions au juriste"]];
  let h='<div class="card"><div class="row" style="justify-content:space-between"><h3 class="h2">'+esc(pa.n)+'</h3><span class="dot" style="background:'+pa.c+';width:18px;height:18px"></span></div><span class="small muted">'+esc(pa.long)+' · président : '+esc(S.name)+'</span><div class="kv"><span>Trésorerie</span><b>'+fmt(P.fonds)+' M FCFA</b><span>Militants</span><b>'+fmt(P.militants)+'</b><span>Experts</span><b>'+P.experts.length+'</b><span>Mandats</span><b>'+(P.mandats.length?esc(P.mandats.map(m=>m.t).join(", ")):"aucun")+'</b></div></div>'+
   '<div class="row">'+views.map(([k,n])=>'<button class="btn small'+(k===partyView?" primary":"")+'" data-pv="'+k+'">'+n+'</button>').join("")+'</div>';
  if(partyView==="bureau"){
    h+='<div class="card"><span class="eyebrow">Bureau politique</span>'+E.BUREAU.map(role=>{const v=P.bureau[role];return'<label class="f" for="bu'+role.length+role.charCodeAt(0)+'">'+esc(role)+'<select data-role="'+esc(role)+'" id="bu'+role.length+role.charCodeAt(0)+'"'+(role==="Président du parti"?" disabled":"")+'><option value="">— vacant —</option>'+(role==="Président du parti"?'<option value="moi" selected>'+esc(S.name)+'</option>':"")+P.experts.map((e,i)=>'<option value="'+i+'"'+(String(i)===v?" selected":"")+'>'+esc(e.n)+' · '+esc(E.DOMAINES.find(d=>d.id===e.dom).n)+'</option>').join("")+'</select></label>'}).join("")+'</div>'+
     '<span class="eyebrow">Vos experts</span>'+P.experts.map((e,i)=>{const d=E.DOMAINES.find(x=>x.id===e.dom);return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(e.n)+'</b>'+(e.diaspora?pill("Diaspora","ok"):"")+'</div><span class="small muted">'+esc(d.n)+' · originaire de la région '+esc(deR(CM.REG[e.reg]))+' · expertise '+e.skill+'/100</span><div class="row">'+(e.dom==="droit"?'<button class="btn small" data-law="1">Poser une question juridique</button>':"")+'<button class="btn small" data-ex="'+i+'">Commander un rapport</button></div></div>'}).join("")+
     '<button class="btn small" id="diaP">Faire appel à un expert de la diaspora</button>';
  }else if(partyView==="militants"){
    const can=true;
    h+='<div class="card"><span class="eyebrow">Militants par région</span>'+G.barsHTML(CM.REGIONS.map(r=>[r.n,P.milReg[r.id],Math.max(...Object.values(P.milReg)),pa.c]),"")+'</div>'+
     '<div class="card"><span class="eyebrow">Cotisation exceptionnelle</span><span class="small muted">Légal : les partis se financent par les cotisations de leurs membres (lois n° 90/056 et 2000/015). Aucun plafond ni délai : c\'est vous qui décidez. Plus la somme est élevée, plus de militants risquent de partir.</span><div class="row"><input type="number" id="cotiV" min="100" step="100" value="1000" style="max-width:160px"><span class="small">FCFA par militant</span><button class="btn small primary" id="cotiGo">Lancer la cotisation</button></div><div class="row">'+[500,1000,2000,5000,10000].map(v=>'<button class="btn small" data-coti="'+v+'">'+fmt(v)+' FCFA</button>').join("")+'</div></div>'+
     '<div class="card"><span class="eyebrow">Dépenses</span><span class="small">Fonctionnement du siège et des sections : environ '+fmt(2+P.militants/20000,1)+' M FCFA par mois.</span></div>';
  }else if(partyView==="mandats"){
    h+='<div class="card"><span class="eyebrow">Mes mandats</span>'+(P.mandats.length?P.mandats.map(m=>'<div class="law"><b>'+esc(m.t)+'</b><span class="small">'+esc(m.lieu)+' · depuis '+esc(G.monthLabel(m.m))+'</span></div>').join(""):'<p class="small muted">Aucun mandat. Commencez par les municipales pour devenir maire ou conseiller, puis député, avant de viser la présidence.</p>')+'</div>'+
     (P.commune?'<div class="card"><span class="eyebrow">Mairie de '+esc(P.commune.ville)+'</span><div class="kv"><span>Budget annuel</span><b>'+fmt(P.commune.budget)+' M FCFA</b><span>Disponible</span><b>'+fmt(P.commune.fonds)+' M FCFA</b></div><span class="small muted">Lancez vos projets communaux dans l\'onglet Projets.</span></div>':"")+
     (P.mandats.some(m=>m.t==="Député")?'<div class="card"><span class="eyebrow">À l\'Assemblée nationale</span><div class="row"><button class="btn small" id="dQ"'+(P.depUsed===S.m?" disabled":"")+'>Question orale au gouvernement</button><button class="btn small" id="dL"'+(P.depUsed===S.m?" disabled":"")+'>Déposer une proposition de loi</button></div></div>':"")+
     '<div class="card"><span class="eyebrow">Mes candidatures aux prochains scrutins</span><label class="f" for="cmR">Municipales : région'+regionSelect("cmR",P.cand.mun.reg)+'</label><label class="f" for="cmV">Commune<select id="cmV">'+CM.REG[P.cand.mun.reg].villes.map(v=>'<option'+(v===P.cand.mun.ville?" selected":"")+'>'+esc(v)+'</option>').join("")+'</select></label><label class="f" for="clR">Législatives : tête de liste dans la région'+regionSelect("clR",P.cand.leg.reg)+'</label><span class="small muted">Municipales et législatives ont lieu le même jour. Vous serez élu·e si votre parti gagne votre commune ou des sièges dans votre région.</span></div>';
  }else{
    h+='<div class="card"><span class="eyebrow">Votre juriste répond</span><span class="small muted">'+esc((P.experts.find(e=>e.dom==="droit")||{n:"Juriste"}).n)+' analyse vos projets au regard du droit camerounais.</span>'+E.LOIS_PARTI.map(l=>'<button class="choice" data-lq="'+l.id+'"><span class="t">Puis-je '+esc(l.n.charAt(0).toLowerCase()+l.n.slice(1))+' ?</span></button>').join("")+'</div>';
  }
  panel().innerHTML=h;const Pn=panel();
  Pn.querySelectorAll("[data-pv]").forEach(b=>b.onclick=()=>{partyView=b.dataset.pv;rerender()});
  Pn.querySelectorAll("[data-role]").forEach(s=>s.onchange=()=>{P.bureau[s.dataset.role]=s.value;G.toast("Bureau politique mis à jour.")});
  Pn.querySelectorAll("[data-ex]").forEach(b=>b.onclick=()=>{const e=P.experts[+b.dataset.ex];askSheet(S,e.n+" ("+E.DOMAINES.find(d=>d.id===e.dom).n.toLowerCase()+")",e.dom,e.skill)});
  Pn.querySelectorAll("[data-law]").forEach(b=>b.onclick=()=>{partyView="loi";rerender()});
  Pn.querySelectorAll("[data-lq]").forEach(b=>b.onclick=()=>{const l=E.LOIS_PARTI.find(x=>x.id===b.dataset.lq);const j=(P.experts.find(e=>e.dom==="droit")||{n:"Votre juriste"}).n;
    const ans=(l.ok===1?"Oui, c'est possible. ":l.ok===0?"Non, c'est interdit. ":"Oui, sous conditions. ")+l.x+(l.id==="candidature"?" Vous avez "+S.age+" ans"+(S.age<35?" : vous ne remplissez pas encore la condition d'âge.":" : la condition d'âge est remplie.")+" Trésorerie actuelle : "+fmt(P.fonds)+" M FCFA.":"");
    SYS.inbox(S,{from:j+", juriste du parti",t:"Avis juridique : "+l.n.toLowerCase(),b:ans,k:"rapport",read:true});
    G.sheet('<span class="eyebrow">Avis juridique de '+esc(j)+'</span><h3 class="h2">'+esc(l.n)+'</h3>'+pill(l.ok===1?"Autorisé":l.ok===0?"Interdit":"Sous conditions",l.ok===1?"ok":l.ok===0?"bad":"warn")+'<p>'+esc(ans)+'</p>');G.subs(j,ans,{voix:"f"})});
  Pn.querySelectorAll("[data-coti]").forEach(b=>b.onclick=()=>{const r=SYS.cotisation(S,+b.dataset.coti);SYS.inbox(S,{from:"Trésorier du parti",t:"Résultat de la cotisation",b:fmt(r.payeurs)+" militants ont cotisé, pour "+fmt(r.f,1)+" millions FCFA. "+(r.pertes?fmt(r.pertes)+" militants ont quitté le parti, jugeant la somme trop élevée.":"Aucun départ signalé.")+" Reçus délivrés et comptabilité tenue, conformément à la loi.",k:"rapport"});G.toast("+"+fmt(r.f,1)+" M FCFA");rerender()});
  const dp=$("diaP");if(dp)dp.onclick=()=>diasporaSheet(S);
  const cg=$("cotiGo");if(cg)cg.onclick=()=>{const v=Math.max(100,Math.round(+$("cotiV").value||0));const r=SYS.cotisation(S,v);SYS.inbox(S,{from:"Trésorier du parti",t:"Résultat de la cotisation ("+fmt(v)+" FCFA)",b:fmt(r.payeurs)+" militants ont cotisé, pour "+fmt(r.f,1)+" millions FCFA. "+(r.pertes?fmt(r.pertes)+" militants ont quitté le parti.":"Aucun départ signalé."),k:"rapport"});G.toast("+"+fmt(r.f,1)+" M FCFA"+(r.pertes?", "+fmt(r.pertes)+" départs":""));rerender()};
  const cmR=$("cmR");if(cmR){cmR.onchange=()=>{P.cand.mun.reg=cmR.value;P.cand.mun.ville=CM.REG[cmR.value].chef;rerender()};$("cmV").onchange=()=>{P.cand.mun.ville=$("cmV").value};$("clR").onchange=()=>{P.cand.leg.reg=$("clR").value}}
  const dQ=$("dQ");if(dQ)dQ.onclick=()=>{P.depUsed=S.m;P.noto=clamp(P.noto+3,0,100);for(const r of CM.REGIONS)G.shift(S.sup,r.id,S.party,.25,S.power);G.subs("Assemblée nationale","Monsieur le Premier ministre, pendant que vos ministres roulent en grosses cylindrées, les populations de nos villages marchent des heures pour un seau d'eau. Quand le gouvernement va-t-il enfin agir ?");G.toast("Votre question fait le buzz.");rerender()};
  const dL=$("dL");if(dL)dL.onclick=()=>{P.depUsed=S.m;const maj=(S.an[S.power]||0)>=91;P.noto=clamp(P.noto+4,0,100);SYS.inbox(S,{from:"Bureau de l'Assemblée nationale",t:"Proposition de loi : bulletin unique",b:maj?"La majorité a refusé d'inscrire votre texte à l'ordre du jour. Le débat s'installe pourtant dans l'opinion.":"Votre texte est inscrit à l'ordre du jour : c'est une première.",k:"info"});if(!maj)S.integ=clamp(S.integ+8,0,100);rerender()};
};

})();
