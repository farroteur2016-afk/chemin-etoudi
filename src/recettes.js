/* Chemin d'Etoudi — les ministres ne font pas que dépenser : ils proposent, sans relâche, des mesures qui font
   rentrer de l'argent dans les caisses de l'État (mines, forêts, fiscalité, pêche, tourisme, télécoms…).
   Chaque proposition est chiffrée (recettes annuelles attendues, coût de départ, délai, risques). Approuvée, elle
   devient une directive ; réussie, elle rapporte chaque mois et allège la dette, pour financer la vie des citoyens. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const REC={};window.REC=REC;
const say=m=>{try{window.Audio2.speak(m,{voix:"f"})}catch(e){}};
const md=v=>String(Math.round(v*10)/10).replace(".",",")+" milliard"+(v>=2?"s":"");
/* [id, ministère, titre, détail, recettes/an (Md), coût de départ (Md), délai (jours), risques, effets] */
const L=[
 ["or","MINMIDT","Comptoirs publics d'achat de l'or artisanal","Canaliser l'or des chantiers de l'Est (Bétaré-Oya, Batouri, Kambélé) vers des comptoirs agréés de la SONAMINES : achat au prix du marché, taxe à l'export, constitution de réserves d'or à la BEAC.",25,6,120,"résistance des collecteurs informels, contrebande vers la Centrafrique",{eco:1,int:.5}],
 ["conv","MINMIDT","Renégociation des conventions minières","Réviser les conventions signées : 10 % de parts gratuites pour l'État, option d'achat de 20 %, redevances indexées sur les cours mondiaux, contenu local et emplois camerounais.",40,1,180,"départ de certains investisseurs, arbitrages internationaux",{eco:1,int:-.5}],
 ["fer","MINMIDT","Relance du fer de Mbalam-Nabeba","Finaliser la convention d'exploitation du fer de Mbalam avec le Congo, le chemin de fer minier et le terminal du port de Kribi ; recettes à pleine production.",60,15,360,"financement du chemin de fer, cours du fer",{eco:2,infra:1}],
 ["bauxite","MINMIDT","Bauxite de Minim-Martap : exploitation et transformation locale","Accorder l'exploitation à un partenaire qui s'engage sur une raffinerie d'alumine au Cameroun plutôt que l'export brut.",35,5,300,"coût de l'énergie, délais industriels",{eco:1.5}],
 ["cobalt","MINMIDT","Cobalt-nickel de Nkamouna (Lomié)","Relancer le projet de cobalt-nickel avec un partenaire solide ; le cobalt est très demandé pour les batteries.",20,3,300,"cours du cobalt, enclavement",{eco:1}],
 ["itie","MINMIDT","Audit de la production et des exportations minières","Traçabilité complète (ITIE), croisement des déclarations d'exportation avec les données des pays acheteurs, redressements.",12,.8,90,"lenteurs administratives",{int:1.5,eco:.5}],
 ["sable","MINMIDT","Carrières et sable : redevances et fin de l'extraction illégale","Recenser les carrières et les sablières, faire payer les redevances et fermer les sites illégaux qui détruisent les rivières.",8,.5,60,"tensions avec les exploitants artisanaux",{eco:.5}],
 ["hydro","MINMIDT","Gaz naturel et hydrocarbures : nouveaux permis et gaz domestique","Attribuer de nouveaux blocs pétroliers et gaziers (bassins de Douala-Kribi-Campo et du Rio del Rey) et développer le gaz domestique pour réduire les importations.",45,4,300,"cours du pétrole, appétit des compagnies",{eco:1.5}],
 ["grumes","MINFOF","Fin progressive de l'export des grumes, transformation locale du bois","Interdire l'export des grumes brutes par étapes et soutenir les 2e et 3e transformations (parquets, meubles, contreplaqué) : plus de valeur et d'emplois au pays.",30,4,240,"baisse temporaire des exportations",{eco:1.5,pop:1}],
 ["rfa","MINFOF","Recouvrement de la redevance forestière et des pénalités","Recouvrer la redevance forestière annuelle impayée et les amendes des exploitants en infraction ; publier la liste des mauvais payeurs.",18,.5,60,"résistances des exploitants",{int:1,eco:.5}],
 ["trace","MINFOF","Traçabilité du bois jusqu'aux ports","Marquage électronique des grumes et contrôles conjoints aux ports de Douala et Kribi pour arrêter l'exploitation illégale.",15,2,120,"corruption aux points de contrôle",{int:1}],
 ["carbone","MINFOF","Crédits carbone des forêts camerounaises","Vendre des crédits carbone certifiés (REDD+) pour les forêts préservées ; une part revient aux communautés riveraines.",25,2,360,"certification longue, prix du carbone",{eco:1,int:1}],
 ["faune","MINFOF","Tourisme de vision dans les parcs (Waza, Bénoué, Lobéké)","Remettre en état les parcs, concessions touristiques, lutte contre le braconnage.",6,3,240,"insécurité dans le Nord",{eco:.5}],
 ["exo","MINFI","Rationalisation des exonérations fiscales et douanières","Supprimer les exonérations sans contrepartie et publier les bénéficiaires ; les exonérations coûtent des centaines de milliards chaque année.",120,0,90,"mécontentement de certaines entreprises",{eco:.5,int:1}],
 ["num","MINFI","Fiscalité du numérique et du mobile money","Faire payer la TVA aux plateformes numériques étrangères et élargir l'assiette des services numériques.",35,.5,120,"réaction des usagers si la taxe touche les transferts",{eco:.5,pop:-.5}],
 ["scan","MINFI","Scanners et dédouanement électronique aux frontières","Scanners aux postes frontières terrestres et dédouanement 100 % électronique pour réduire la fraude.",40,12,180,"coût initial, formation des agents",{eco:1,int:1}],
 ["pechein","MINEPIA","Licences de pêche industrielle et lutte contre la pêche illégale","Revoir les licences, surveillance satellitaire des chalutiers, amendes dissuasives.",10,3,120,"moyens de surveillance en mer",{eco:.5}],
 ["betail","MINEPIA","Exportation de bétail et de viande","Abattoirs modernes à Ngaoundéré et Garoua, vaccination, exportation vers le Nigeria, le Gabon et la Guinée équatoriale.",12,6,240,"maladies animales, insécurité",{eco:1}],
 ["tour","MINTOUL","Relance du tourisme et visa électronique","Visa électronique, promotion de Kribi, Limbé et des monts Mandara, formation hôtelière.",15,5,180,"image sécuritaire du pays",{eco:.5,int:.5}],
 ["5g","MINPOSTEL","Attribution des fréquences 5G","Mise aux enchères des fréquences 5G auprès des opérateurs, avec obligations de couverture rurale.",50,.5,120,"capacité d'investissement des opérateurs",{eco:1,infra:.5}],
 ["cacao","MINADER","Transformation locale du cacao","Objectif 20 % du cacao transformé au pays, label « cacao du Cameroun », usines à Kribi et Douala.",25,8,300,"coût de l'énergie",{eco:1,pop:.5}],
 ["foncier","MINDCAF","Taxation des grands terrains non mis en valeur","Recenser les grands domaines non exploités et appliquer l'impôt foncier ou reprendre les terrains.",20,1,180,"résistances des grands propriétaires",{eco:.5,pop:.5}],
 ["contre","MINCOMMERCE","Lutte contre la contrebande de carburant et de produits importés","Brigades mixtes aux frontières avec le Nigeria, saisies et ventes aux enchères.",30,2,120,"corruption, violences aux frontières",{eco:.5,sec:.5}]];
REC.L=L.map(([id,min,t,d,rec,cout,delai,risk,fx])=>({id,min,t,d,rec,cout,delai,risk,fx}));
const byId=id=>REC.L.find(x=>x.id===id);
function st(S){return S.rec||(S.rec={next:S.day+3,seen:{},props:[],on:[]})}
function minName(id){const m=E.MINISTERES.find(x=>x.id===id);return m?m.n:id}
function who(S,id){const g=S.gov&&S.gov.min&&S.gov.min[id];const n=g?g.n:(S.recN=S.recN||{},S.recN[id]=S.recN[id]||window.SYS.nom("CE"));const sx=window.SYS.sexe(n);return{n,sexe:sx,lab:window.SYS.accord("le ministre "+window.SYS.deM(minName(id))+minName(id),sx)}}
/* prochaine proposition : mines et forêts en priorité, puis les autres ministères */
function pickNext(S){const R=st(S);const pool=REC.L.filter(x=>!R.seen[x.id]);if(!pool.length)return null;
  if(S.mode==="min"&&S.minis){const own=pool.filter(x=>x.min===S.minis.id);return own[0]||null}
  const pri=pool.filter(x=>x.min==="MINMIDT"||x.min==="MINFOF");const k=Object.keys(R.seen).length;return(k%3!==2&&pri.length?pri:pool)[Math.floor(Math.random()*(k%3!==2&&pri.length?pri.length:pool.length))]}
REC.tick=function(S){if(!S||S.phase!=="play"||(S.mode!=="pres"&&S.mode!=="min"))return;const R=st(S);
  if(S.day>=R.next){const x=pickNext(S);R.next=S.day+(S.mode==="min"?10:5)+Math.random()*4;if(x){R.seen[x.id]=S.day;R.props.push({id:x.id,day:S.day,st:"attente"});const W=who(S,x.min);
      const from=S.mode==="min"?"Direction des études de votre ministère":W.n+", "+W.lab;
      window.SYS.inbox(S,{from,t:"💰 Proposition de recettes : "+x.t,b:x.d+"\nRecettes attendues : environ "+md(x.rec)+" de FCFA par an à plein régime.\nCoût de départ : "+(x.cout?md(x.cout)+" de FCFA":"négligeable")+". Délai de mise en place : "+x.delai+" jours.\nRisques : "+x.risk+".",k:"rapport",rec:x.id});
      G.toast("💰 "+(S.mode==="min"?"Vos services proposent":W.n+" propose")+" : "+x.t.slice(0,60),()=>REC.sheet(S))}}
  // mesures réussies : recettes mensuelles
  for(const d of S.directives||[]){if(!d.rec||!d.done||d.recOn)continue;d.recOn=1;const q=/réussie/.test(d.res||"")?1:/partielle/.test(d.res||"")?.5:0;if(q>0)R.on.push({id:d.rec,t:byId(d.rec)?byId(d.rec).t:d.titre,v:byId(d.rec).rec*q,since:S.day})}
  if(R.on.length&&(!R.last||S.day-R.last>=30)){R.last=S.day;const m=R.on.reduce((a,x)=>a+x.v,0)/12;if(S.nums)S.nums.dette=Math.max(0,S.nums.dette-m);if(S.st&&S.st.eco!=null)S.st.eco=Math.min(100,S.st.eco+.3);if(S.minis)S.minis.perf=Math.min(100,S.minis.perf+.5);
    window.SYS.inbox(S,{from:"Direction générale du Trésor",t:"Recettes nouvelles du mois : "+md(m)+" de FCFA",b:"Les mesures de recettes en vigueur ont rapporté environ "+md(m)+" de FCFA ce mois-ci : "+R.on.map(x=>x.t).join(" ; ")+".\nCes ressources financent le fonctionnement de l'État sans nouvel endettement.",k:"bonne"})}};
function approve(S,id){const x=byId(id);if(!x||!window.DIR)return;const R=st(S);const p=R.props.find(y=>y.id===id);if(p)p.st="approuvee";
  const n0=(S.directives||[]).length;DIR.handle(S,"Je veux "+x.t.charAt(0).toLowerCase()+x.t.slice(1)+" dans "+x.delai+" jours",m=>{say(m);G.toast(m.slice(0,130))},{force:true,cout:Math.max(.1,x.cout),direct:S.mode==="pres",nat:S.mode==="min"?true:undefined,ctx:"Proposition de recettes : "+x.t}).then(()=>{const L=S.directives||[];if(L.length>n0){const d=L[L.length-1];d.rec=id;if(S.mode==="pres")d.resp=x.min;d.fx=Object.assign({},x.fx);G.render()}})}
REC.act=function(S,id,k){const R=st(S);const p=R.props.find(y=>y.id===id);if(!p)return;
  if(k==="ok")return approve(S,id);
  if(k==="etude"){p.st="etude";R.seen[id]=S.day;setTimeout(()=>{},0);const x=byId(id);window.SYS.inbox(S,{from:who(S,x.min).n,t:"Étude complémentaire demandée : "+x.t,b:"L'étude détaillée (impact, calendrier, partenaires) vous sera présentée dans 15 jours ; la proposition reviendra alors pour décision.",k:"info",read:true});p.back=S.day+15;G.toast("Étude complémentaire demandée : retour dans 15 jours.")}
  if(k==="non"){p.st="ecartee";G.toast("Proposition écartée.")}G.render()};
/* retour des études complémentaires */
const _t=REC.tick;REC.tick=function(S){_t(S);if(!S||!S.rec)return;for(const p of S.rec.props)if(p.st==="etude"&&p.back&&S.day>=p.back){p.st="attente";p.back=null;const x=byId(p.id);window.SYS.inbox(S,{from:who(S,x.min).n,t:"💰 Étude remise : "+x.t,b:x.d+"\nL'étude confirme des recettes d'environ "+md(x.rec)+" de FCFA par an. Décision attendue.",k:"rapport",rec:x.id})}};
REC.mailActs=function(S,it){if(!it.rec)return"";const p=(st(S).props||[]).find(y=>y.id===it.rec);if(!p||p.st!=="attente")return p?'<p class="small muted">Statut : '+esc({approuvee:"approuvée",etude:"étude en cours",ecartee:"écartée"}[p.st]||p.st)+'</p>':"";
  return'<button class="btn primary" data-recx="ok">✅ '+(S.mode==="pres"?"Approuver et lancer":"Soumettre à la Présidence")+'</button><button class="btn" data-recx="etude">📝 Demander une étude complémentaire</button><button class="btn ghost" data-recx="non">❌ Écarter</button>'};
REC.mailBind=function(S,it,el){el.querySelectorAll("[data-recx]").forEach(b=>b.onclick=()=>{el.remove();REC.act(S,it.rec,b.dataset.recx)})};
REC.card=function(S){if(!S||(S.mode!=="pres"&&S.mode!=="min"))return"";const R=st(S);const w=R.props.filter(p=>p.st==="attente");const tot=R.on.reduce((a,x)=>a+x.v,0);if(!w.length&&!R.on.length)return"";
  return'<div class="card" data-recopen role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>💰 Recettes de l\'État</b><span class="small muted">Voir ▸</span></div><div class="small">'+(w.length?"<b>"+w.length+" proposition"+(w.length>1?"s":"")+" à examiner</b>":"Aucune proposition en attente")+(tot?" · mesures en vigueur : +"+md(tot)+" de FCFA par an":"")+'</div></div>'};
REC.bindCard=function(S,root){(root||document).querySelectorAll("[data-recopen]").forEach(c=>{c.onclick=()=>REC.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();REC.sheet(S)}}})};
REC.sheet=function(S){const R=st(S);const P=R.props.slice().reverse();const lab={attente:"à examiner",approuvee:"approuvée",etude:"étude en cours",ecartee:"écartée"};
  G.sheet('<span class="eyebrow">Finances publiques</span><h3 class="h2">Propositions de recettes</h3><p class="small muted">Les ministères proposent des mesures pour faire rentrer de l\'argent dans les caisses de l\'État, en priorité par les mines et les forêts.</p>'+
   (R.on.length?'<span class="eyebrow">En vigueur</span>'+R.on.map(x=>'<div class="small">• '+esc(x.t)+' : +'+md(x.v)+' de FCFA par an</div>').join(""):"")+
   (P.length?P.map(p=>{const x=byId(p.id);return'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(x.t)+'</b><span class="small muted">Ministère '+esc(window.SYS.deM(minName(x.min))+minName(x.min))+' · '+esc(lab[p.st]||p.st)+'</span><span class="small">'+esc(x.d)+'</span><span class="small"><b>Recettes :</b> ~'+md(x.rec)+' de FCFA par an · <b>Coût de départ :</b> '+(x.cout?md(x.cout):"négligeable")+' · <b>Délai :</b> '+x.delai+' j</span><span class="small muted">Risques : '+esc(x.risk)+'</span>'+
     (p.st==="attente"?'<div class="row" style="gap:6px"><button class="btn small primary" data-rc="ok" data-id="'+x.id+'">✅ '+(S.mode==="pres"?"Approuver":"Soumettre à la Présidence")+'</button><button class="btn small" data-rc="etude" data-id="'+x.id+'">📝 Étude</button><button class="btn small ghost" data-rc="non" data-id="'+x.id+'">❌ Écarter</button></div>':"")+'</div>'}).join(""):'<p class="small muted">Les premières propositions arrivent dans quelques jours.</p>')+
   '<button class="btn" data-recask>📣 Demander de nouvelles propositions aux ministres des Mines et des Forêts</button>',el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-rc]").forEach(b=>b.onclick=()=>{el.remove();REC.act(S,b.dataset.id,b.dataset.rc)});
    el.querySelector("[data-recask]").onclick=()=>{R.next=S.day;REC.tick(S);el.remove();REC.sheet(S)}})};
})();
