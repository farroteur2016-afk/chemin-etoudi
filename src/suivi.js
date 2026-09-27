/* Chemin d'Etoudi — suivi de mes décisions : tout ce que le joueur décide (recrutements, paiements, directives,
   commandes, contrats, missions, recettes…) apparaît au même endroit avec son statut réel :
   en attente de validation, en cours (étape atteinte, date de fin), exécuté, annulé. Les recrutements et les
   paiements ne sont plus instantanés : concours, ordonnancement, paiement par le Trésor, prise de fonction. */
(function(){
"use strict";
const G=window.GAME,E=window.ETAT;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SUIVI={};window.SUIVI=SUIVI;
const L=S=>S.suivi||(S.suivi=[]);
const f0=n=>Math.round(n).toLocaleString("fr-FR").replace(/ | /g," ");
/* étapes : [jours après la décision, libellé] ; la dernière étape = exécution */
SUIVI.add=function(S,o){const a={id:"s"+Date.now().toString(36)+Math.random().toString(36).slice(2,4),t:o.t,cat:o.cat||"Décision",qui:o.qui||"",day:S.day,et:(o.et||[[0,"Décision prise"]]).map(([j,l])=>({j:S.day+j,l,ok:j<=0})),st:"en cours",k:o.k||null,data:o.data||{}};
  if(a.et.every(x=>x.ok)){a.st="exécuté";a.fin=S.day}L(S).push(a);S.suivi=L(S).slice(-150);
  G.toast("📋 "+a.t+" — "+(a.st==="exécuté"?"exécuté":"en cours, fin prévue le "+G.dayLabel(a.et[a.et.length-1].j))+" · voir le suivi",()=>SUIVI.sheet(S));return a};
/* effets à l'exécution (les fonctions ne sont pas sauvegardées : on passe par un type) */
const DONE={
 recrue(S,a){const g=S.gov;if(!g)return;const R=E.SALAIRES.recrues.find(x=>x.id===a.data.id);if(!R)return;g.recruesAtt=g.recruesAtt||{};g.recruesAtt[R.id]=Math.max(0,(g.recruesAtt[R.id]||0)-1);g.recrues[R.id]=(g.recrues[R.id]||0)+1;S.nums.deficit+=R.cout;if(R.id==="sol")S.def.eff+=R.lot;if(R.id==="pol"&&S.st)S.st.sec=Math.min(100,S.st.sec+.5)},
 paiement(S,a){if(S.nums)S.nums.dette+=a.data.md||0;if(S.st&&a.data.fx)for(const k in a.data.fx)if(S.st[k]!=null)S.st[k]=Math.max(0,Math.min(100,S.st[k]+a.data.fx[k]))}};
SUIVI.tick=function(S){for(const a of L(S)){if(a.st!=="en cours")continue;let ch=false;for(const e of a.et)if(!e.ok&&S.day>=e.j){e.ok=true;ch=true}
  if(ch&&a.et.every(x=>x.ok)){a.st="exécuté";a.fin=S.day;if(a.k&&DONE[a.k])DONE[a.k](S,a);window.SYS.inbox(S,{from:a.qui||"Secrétariat général",t:"✅ Exécuté : "+a.t,b:a.et.map(e=>G.dayLabel(e.j)+" — "+e.l).join("\n"),k:"bonne"})}}};
SUIVI.cancel=function(S,id){const a=L(S).find(x=>x.id===id);if(!a||a.st!=="en cours")return;a.st="annulé";a.fin=S.day;if(a.k==="recrue"&&S.gov&&S.gov.recruesAtt)S.gov.recruesAtt[a.data.id]=Math.max(0,(S.gov.recruesAtt[a.data.id]||0)-1);G.toast("Annulé : "+a.t);G.render()};
/* vue d'ensemble : suivi propre + directives, commandes, missions, contrats, recettes, notes */
function all(S){const R=[];const push=(t,cat,st,det,fin,id)=>R.push({t,cat,st,det,fin,id});
  for(const a of L(S)){const next=a.et.find(e=>!e.ok);const done=a.et.filter(e=>e.ok).slice(-1)[0];push(a.t,a.cat,a.st,(done?"Étape atteinte : "+done.l+". ":"")+(next?"Prochaine étape : "+next.l+" le "+G.dayLabel(next.j)+".":""),a.st==="en cours"?a.et[a.et.length-1].j:a.fin,a.st==="en cours"?a.id:null)}
  for(const d of S.directives||[])push(d.titre,"Directive",d.done?(/Annulée|rejeté|Non approuvée/.test(d.res||"")?"annulé":"exécuté"):d.phase==="valid"?"attente":d.phase==="plan"||d.phase==="presid"?"préparation":"en cours",
    d.done?(d.res||"Terminée"):d.phase==="valid"?"Plan à valider (agenda ou courrier).":d.phase==="plan"?"Plan d'exécution attendu le "+G.dayLabel(d.planDue)+".":d.phase==="presid"?"En attente de l'approbation de la Présidence.":"Compte rendu attendu le "+G.dayLabel(d.due)+".",d.done?null:d.due);
  for(const o of S.cmds||[])push("Commande : "+o.qty+" × "+o.n.toLowerCase(),"Achat",o.st==="livré"?"exécuté":"en cours",o.f+" · "+(o.st==="livré"?"livré":"livraison le "+G.dayLabel(o.arr)),o.st==="livré"?null:o.arr);
  if(S.def&&S.def.esp){const x=E.ESPIONNAGE.find(y=>y.id===S.def.esp.id);push("Mission : "+(x?x.n:""),"Renseignement","en cours","Compte rendu le "+G.dayLabel(S.def.esp.fin),S.def.esp.fin)}
  if(S.ctr)for(const k in S.ctr.deals){const d=S.ctr.deals[k];const o=window.CTR&&CTR.OFFRES.find(x=>x.id===k);if(o)push("Contrat : "+o.t,"Contrat",d.fin==="signé"?"exécuté":d.fin?"annulé":"négociation",d.fin==="signé"?"Signé":d.fin?"Offre "+d.fin:"Négociation en cours",null)}
  if(S.rec)for(const p of S.rec.props){if(p.st==="attente")continue;const x=window.REC&&REC.L.find(y=>y.id===p.id);if(x)push("Recettes : "+x.t,"Recettes",p.st==="approuvee"?"exécuté":p.st==="etude"?"préparation":"annulé",p.st==="approuvee"?"Approuvée (voir la directive)":p.st==="etude"?"Étude complémentaire en cours":"Écartée",null)}
  for(const n of S.notes||[])push("Note demandée : "+String(n.texte).slice(0,70),"Note",n.done?"exécuté":"en cours",n.done?"Note reçue au courrier":"Attendue le "+G.dayLabel(n.due),n.done?null:n.due);
  return R}
const LAB={"en cours":["🟡","En cours"],"préparation":["🟠","En préparation"],"attente":["⏳","À valider par vous"],"négociation":["🤝","En négociation"],"exécuté":["✅","Exécuté"],"annulé":["⛔","Annulé ou rejeté"]};
SUIVI.counts=S=>{const c={};for(const r of all(S))c[r.st]=(c[r.st]||0)+1;return c};
SUIVI.card=function(S){if(!S||S.phase!=="play")return"";if(window.HUB){const c=HUB.counts(S);const T=[["avis","🔴","sans votre avis"],["cab","📋","propositions"],["renv","↩️","renvoyées"],["part","🤝","offres"],["exec","⚙️","en exécution"]].filter(x=>c[x[0]]);
    return'<div class="card" data-suivi role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>🗂️ Centre de décision</b><span class="small muted">Ouvrir ▸</span></div><div class="small">'+(T.length?T.map(x=>x[1]+" "+c[x[0]]+" "+x[2]).join(" · "):"Rien en attente")+'</div></div>'}const c=SUIVI.counts(S);const n=(c["en cours"]||0)+(c["préparation"]||0)+(c["attente"]||0)+(c["négociation"]||0);if(!n&&!c["exécuté"])return"";
  return'<div class="card" data-suivi role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>📋 Suivi de mes décisions</b><span class="small muted">Ouvrir ▸</span></div><div class="small">'+["en cours","attente","préparation","exécuté"].filter(k=>c[k]).map(k=>LAB[k][0]+" "+c[k]+" "+LAB[k][1].toLowerCase()).join(" · ")+'</div></div>'};
SUIVI.bindCard=function(S,root){(root||document).querySelectorAll("[data-suivi]").forEach(c=>{c.onclick=()=>window.HUB?HUB.sheet(S):SUIVI.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();window.HUB?HUB.sheet(S):SUIVI.sheet(S)}}})};
SUIVI.sheet=function(S,f){document.querySelectorAll(".sheet[data-suivis]").forEach(x=>x.remove());const R=all(S);f=f||"actif";
  const act=R.filter(r=>/en cours|préparation|attente|négociation/.test(r.st)).sort((a,b)=>(a.st==="attente"?-1:0)-(b.st==="attente"?-1:0)||(a.fin||1e9)-(b.fin||1e9));const fin=R.filter(r=>/exécuté|annulé/.test(r.st)).reverse();
  const row=r=>'<div class="card" style="gap:4px;background:var(--panel3)"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><b>'+esc(r.t)+'</b><span class="small" style="white-space:nowrap">'+LAB[r.st][0]+' '+LAB[r.st][1]+'</span></div><span class="small muted">'+esc(r.cat)+' · '+esc(r.det)+'</span>'+(r.id?'<div class="row"><button class="btn small ghost" data-sx="'+r.id+'">Annuler</button></div>':"")+'</div>';
  G.sheet('<span class="eyebrow">Suivi</span><h3 class="h2">Mes décisions</h3><div class="row" style="gap:6px"><button class="btn small'+(f==="actif"?" primary":"")+'" data-sf="actif">En cours ('+act.length+')</button><button class="btn small'+(f==="fini"?" primary":"")+'" data-sf="fini">Exécutées et annulées ('+fin.length+')</button></div>'+
   ((f==="actif"?act:fin).map(row).join("")||'<p class="small muted">Rien pour l\'instant.</p>')+'<p class="small muted">Chaque décision exécutée vous est aussi confirmée par un message dans le courrier.</p>',el=>{el.dataset.suivis="1";el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-sf]").forEach(b=>b.onclick=()=>SUIVI.sheet(S,b.dataset.sf));el.querySelectorAll("[data-sx]").forEach(b=>b.onclick=()=>{SUIVI.cancel(S,b.dataset.sx);SUIVI.sheet(S,f)})})};
SUIVI.isAsk=t=>/(suivi|mes decisions|ou en (sont|est) (mes|ma|mon|le|la|les)|est ce que (c est|ca a ete) (fait|execute)|a t il ete (fait|execute)|etat d avancement|en cours d execution)/.test(t);
SUIVI.summary=function(S){const R=all(S);const a=R.filter(r=>/en cours|préparation|attente/.test(r.st));return a.length?a.length+" décision"+(a.length>1?"s":"")+" en cours : "+a.slice(0,4).map(r=>r.t+" ("+LAB[r.st][1].toLowerCase()+(r.fin?", fin le "+G.dayLabel(r.fin):"")+")").join(" ; ")+".":"Aucune décision en cours ; tout ce que vous avez décidé est exécuté ou annulé."};
})();
