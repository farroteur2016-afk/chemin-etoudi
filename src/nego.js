/* Chemin d'Etoudi — négocier un dossier : face au consortium minier, au partenaire chinois, au FMI, aux syndicats…
   On discute les termes un par un (part de l'État, redevance, transformation locale, emplois, taux, calendrier…).
   L'autre partie a ses limites (cachées) : elle accepte, fait une contre-proposition ou menace de se retirer.
   L'accord signé tranche le dossier, avec des effets meilleurs ou moins bons selon les termes obtenus. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const NEGO={};window.NEGO=NEGO;
const say=(m,v)=>{try{window.Audio2.speak(m,{voix:v||"m"})}catch(e){}};
/* termes : options de la moins à la plus exigeante pour l'État ; v = gain pour l'État (0-1), c = coût pour l'autre partie (0-1) */
const T={
 mines:{qui:"le représentant du consortium minier",n:"Consortium Minim-Martap Bauxite",sign:0,rec:[20,60],terms:[
   ["part","Part de l'État dans la société d'exploitation",["10 % gratuits","15 %","20 %","25 %","30 %"]],
   ["red","Redevance minière sur la valeur extraite",["2,5 %","4 %","5,5 %","7 %"]],
   ["tr","Transformation au Cameroun",["Export brut","Usine de concentration","Raffinerie d'alumine sous 7 ans"]],
   ["emp","Emplois réservés aux Camerounais",["50 %","70 %","85 %"]],
   ["rail","Chemin de fer jusqu'à Kribi",["Payé par l'État","Partagé 50/50","Payé par le consortium"]]]},
 autoroute:{qui:"le représentant de la banque chinoise Exim Bank",n:"Exim Bank de Chine et l'entreprise CFHEC",sign:0,terms:[
   ["taux","Taux d'intérêt du prêt",["3 %","2 %","1,5 %","1 %"]],
   ["duree","Durée de remboursement",["15 ans","20 ans","25 ans"]],
   ["local","Part des travaux confiée à des entreprises camerounaises",["10 %","30 %","40 %"]],
   ["peage","Tarif du péage (voiture)",["2 500 FCFA","1 500 FCFA","1 000 FCFA"]]]},
 fmi:{qui:"le chef de mission du FMI",n:"Fonds monétaire international",sign:0,terms:[
   ["subv","Suppression des subventions au carburant",["En 1 an","En 2 ans","En 3 ans, par paliers"]],
   ["social","Filets sociaux pour les ménages pauvres",["Aucun","100 milliards","200 milliards"]],
   ["inv","Protection des dépenses d'investissement",["Non","Partielle","Totale"]],
   ["montant","Montant du programme",["400 milliards","550 milliards","700 milliards"]]]},
 carburant:{qui:"le chef de mission du FMI",n:"Fonds monétaire international",sign:1,terms:[
   ["rythme","Rythme de hausse du prix à la pompe",["+100 FCFA d'un coup","+50 FCFA par semestre","+25 FCFA par trimestre"]],
   ["cible","Subvention maintenue pour",["Personne","Pétrole lampant","Pétrole lampant et moto-taximen"]],
   ["appui","Appui budgétaire du FMI",["200 milliards","300 milliards","400 milliards"]]]},
 ots:{qui:"la porte-parole du collectif « On a trop supporté »",n:"Syndicats d'enseignants",sign:0,opp:true,terms:[
   ["rappels","Paiement des rappels dus",["25 % cette année","50 % cette année","100 % cette année"]],
   ["integ","Intégration des enseignants vacataires",["En 3 ans","En 2 ans","Cette année"]],
   ["prime","Prime spéciale de craie",["Aucune","10 000 FCFA/mois","20 000 FCFA/mois"]],
   ["greve","Reprise des cours",["Immédiate","Sous 1 semaine","Sous 1 mois"]]]},
 univ:{qui:"le secrétaire général du SYNES",n:"Syndicat national des enseignants du supérieur",sign:0,opp:true,terms:[
   ["prime","Prime de recherche",["+10 %","+20 %","+30 %"]],
   ["amphis","Nouveaux amphithéâtres",["2","5","10"]],
   ["greve","Suspension de la grève",["Immédiate","Sous 1 semaine","Sous 1 mois"]]]},
 kribi:{qui:"le représentant de l'opérateur portuaire",n:"Opérateur du terminal de Kribi",sign:0,terms:[
   ["indem","Indemnisation des villages de pêcheurs",["2 milliards","5 milliards","8 milliards"]],
   ["emp","Emplois locaux au port",["40 %","60 %","80 %"]],
   ["part","Part de l'État dans le terminal",["10 %","20 %","30 %"]]]}};
/* pour les syndicats, l'État « paie » : l'option la plus généreuse coûte plus au Trésor mais apaise ; on inverse les rôles */
function tpl(d){return d&&T[d.id]?T[d.id]:null}
NEGO.has=d=>!!tpl(d);
function st(S,d){S.nego=S.nego||{};let N=S.nego[d.id];if(!N||N.done){const t=tpl(d);N=S.nego[d.id]={sel:t.terms.map(()=>0),round:0,pat:3,lim:.45+Math.random()*.25,log:[],done:false};if(t.opp)N.sel=t.terms.map(x=>x[2].length-1)}return N}
function cost(t,sel){/* coût pour l'autre partie, 0..1 */let s=0;t.terms.forEach((x,i)=>{const k=x[2].length-1;s+=k?sel[i]/k:0});return s/t.terms.length}
function stateGain(t,sel){return t.opp?1-cost(t,sel):cost(t,sel)}
NEGO.open=function(S,d){const t=tpl(d);if(!t)return NEGO.talk(S,d);const N=st(S,d);
  const opp=!!t.opp;const g=Math.round(stateGain(t,N.sel)*100);
  G.sheet('<span class="eyebrow">Négociation · '+esc(d.t)+'</span><h3 class="h2">Négocier avec : '+esc(t.n)+'</h3><p class="small muted">'+esc(d.x)+'</p>'+
   '<p class="small">'+(opp?"Ce que vous concédez : plus vous accordez, plus cela coûte au Trésor, mais plus vite le conflit s'apaise.":"Vos exigences : plus elles sont fortes, plus l'État y gagne, mais plus l'autre partie risque de se retirer.")+'</p>'+
   t.terms.map((x,i)=>'<label class="f" for="ng'+i+'"><b>'+esc(x[1])+'</b><select id="ng'+i+'" data-ng="'+i+'">'+x[2].map((o,j)=>'<option value="'+j+'"'+(N.sel[i]===j?" selected":"")+'>'+esc(o)+'</option>').join("")+'</select></label>').join("")+
   '<div class="card" style="gap:4px;background:var(--panel3)"><span class="small"><b>Intérêt pour l\'État de votre offre :</b> <span id="ngG">'+g+'</span> / 100 · <b>Patience de l\'autre partie :</b> '+"●".repeat(N.pat)+"○".repeat(3-N.pat)+'</span>'+
   (N.log.length?'<div class="vxlog" style="max-height:26vh;margin-top:6px">'+N.log.map(l=>'<div class="'+(l.me?"me":"it")+'">'+esc(l.t)+'</div>').join("")+'</div>':"")+'</div>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn primary" id="ngGo">📨 Soumettre cette offre</button>'+(N.ok?'<button class="btn primary" id="ngSign">✍️ Signer l\'accord</button>':"")+'<button class="btn" id="ngTalk">💬 Discuter de vive voix</button><button class="btn ghost" id="ngMin">📋 Avis du ministre</button></div>'+
   '<p class="small muted">Vous pouvez aussi trancher directement le dossier sur votre bureau.</p>',el=>{el.setAttribute("data-noinstr","");el.dataset.nego="1";
    el.querySelectorAll("[data-ng]").forEach(s=>s.onchange=()=>{N.sel[+s.dataset.ng]=+s.value;N.ok=false;el.querySelector("#ngG").textContent=Math.round(stateGain(t,N.sel)*100)});
    el.querySelector("#ngGo").onclick=()=>{offer(S,d,t,N);el.remove();NEGO.open(S,d)};
    const sg=el.querySelector("#ngSign");if(sg)sg.onclick=()=>{el.remove();sign(S,d,t,N)};
    el.querySelector("#ngTalk").onclick=()=>{el.remove();NEGO.talk(S,d)};
    el.querySelector("#ngMin").onclick=()=>{const m=advice(S,d,t,N);N.log.push({t:"Ministre : "+m});say(m,"m");el.remove();NEGO.open(S,d)}})};
const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);
function describe(t,sel){return t.terms.map((x,i)=>lc(x[1])+" : "+x[2][sel[i]]).join(" ; ")}
function offer(S,d,t,N){N.round++;const c=cost(t,N.sel);const lim=t.opp?1-N.lim:N.lim;const over=t.opp?(lim-c):(c-lim);
  N.log.push({me:1,t:"Vous proposez : "+describe(t,N.sel)+"."});
  if(over<=0){N.ok=true;const m=t.opp?"Nous acceptons ces conditions. Nous appellerons à la reprise dès la signature.":"C'est exigeant, mais nous pouvons accepter ces conditions. Nous sommes prêts à signer.";N.log.push({t:cap(t.qui)+" : "+m});say(m);return}
  N.ok=false;N.pat=Math.max(0,N.pat-(over>.2?2:1));
  if(N.pat<=0){N.walk=true;const m=t.opp?"Vos propositions sont insuffisantes. La base décide de durcir le mouvement.":"Nous suspendons les discussions. D'autres pays nous font des offres plus raisonnables.";N.log.push({t:cap(t.qui)+" : "+m});say(m);
    window.SYS.inbox(S,{from:t.n,t:"Négociation rompue : "+d.t,b:m+"\nVous pouvez reprendre plus tard, mais la confiance est entamée.",k:"alerte"});N.pat=1;N.lim=Math.max(.3,N.lim-.05);return}
  // contre-proposition : l'autre partie ramène le terme le plus coûteux vers elle
  let bi=-1,bv=-1;t.terms.forEach((x,i)=>{const k=x[2].length-1;const v=t.opp?(k-N.sel[i]):N.sel[i];if(v>bv&&k){bv=v;bi=i}});
  const cs=N.sel.slice();if(bi>=0)cs[bi]=t.opp?Math.min(t.terms[bi][2].length-1,cs[bi]+1):Math.max(0,cs[bi]-1);N.counter=cs;
  const m=(over>.2?"C'est très loin de ce que nous pouvons accepter. ":"Nous nous rapprochons. ")+"Nous pourrions accepter si "+lc(t.terms[bi][1])+" passe à « "+t.terms[bi][2][cs[bi]]+" ».";
  N.log.push({t:cap(t.qui)+" : "+m});say(m)}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function advice(S,d,t,N){const g=Math.round(stateGain(t,N.sel)*100);const lim=Math.round((t.opp?1-N.lim:N.lim)*100);
  return g>lim+15?"Excellence, nous demandons beaucoup : ils risquent de partir. Je conseille de lâcher du lest sur un point.":g<lim-15?"Excellence, nous pouvons obtenir davantage : ils ont besoin de cet accord.":"Nous sommes proches d'un accord équilibré. Un dernier effort et nous signons."}
function sign(S,d,t,N){const g=stateGain(t,N.sel);N.done=true;
  const i=t.sign;const before=S.nums?S.nums.dette:0;if(G.choose)G.choose(i);
  const q=g;// qualité de l'accord
  if(S.st){S.st.eco=Math.min(100,S.st.eco+(q-.4)*4);if(t.opp)S.st.soc=Math.min(100,S.st.soc+(1-q)*4);S.st.pop=Math.min(100,S.st.pop+(t.opp?(1-q)*3:q*2))}
  if(S.nums&&!t.opp)S.nums.dette=Math.max(0,S.nums.dette-q*60);if(S.nums&&t.opp)S.nums.dette+=(1-q)*80;
  if(t.rec&&S.rec){const v=Math.round(t.rec[0]+(t.rec[1]-t.rec[0])*q);S.rec.on.push({id:"nego_"+d.id,t:"Accord : "+d.t,v,since:S.day})}
  const m="Accord signé avec "+t.n+" : "+describe(t,N.sel)+".";
  window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Accord signé : "+d.t,b:m+"\nQualité de l'accord pour l'État : "+Math.round(q*100)+" sur 100."+(t.rec?"\nRecettes attendues : environ "+Math.round(t.rec[0]+(t.rec[1]-t.rec[0])*q)+" milliards de FCFA par an.":""),k:"bonne"});
  G.toast(m.slice(0,140));say("Accord signé.","f");G.render()}
/* sans modèle de négociation : discussion libre avec l'interlocuteur du dossier */
NEGO.talk=function(S,d){if(!window.RENC)return;const t=tpl(d);const who=t?t.qui:"le "+String(d.f).toLowerCase();
  RENC.open(S,{kind:"officiel",n:t&&t.opp?window.SYS.nom("CE","f"):window.SYS.nom("CE"),lab:who.replace(/^(le|la) /,""),reg:d.lieu||"CE",ville:"Yaoundé",lieu:"le palais de l'Unité",sujet:"négociation : "+d.t,contexte:d.x,bonjour:"Excellence, merci de nous recevoir. Nous sommes venus discuter de ce dossier : "+d.t.toLowerCase()+"."})};
NEGO.btn=d=>'<button class="btn" data-nego="1">🤝 '+(tpl(d)?"Négocier les termes":"Recevoir les parties et négocier")+'</button>';
})();
