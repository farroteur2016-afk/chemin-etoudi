/* Chemin d'Etoudi — centre de décision et modification des propositions.
   EDIT : toute proposition (ministre, cabinet, recettes, dossier du bureau) peut être modifiée avant validation,
          ou remplacée par « votre autre proposition » : texte, délai, coût, compte rendu ; puis exécution directe.
   HUB  : un seul écran filtrable — problèmes sans votre avis, problèmes en cours, propositions du cabinet et des
          ministres, propositions renvoyées, offres des partenaires, instructions en cours d'exécution, exécutées. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const say=m=>{try{window.Audio2.speak(m,{voix:"f"})}catch(e){}};
const EDIT={};window.EDIT=EDIT;const HUB={};window.HUB=HUB;
const lc=s=>s?s.charAt(0).toLowerCase()+s.slice(1):s;

/* ---------- modifier une proposition avant de la valider ---------- */
EDIT.sheet=function(S,o){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const tx0=o.texte||"";
  G.sheet('<span class="eyebrow">'+esc(o.from||"Proposition")+'</span><h3 class="h2">'+esc(o.titre||"Votre décision")+'</h3>'+(o.info?'<p class="small muted">'+esc(o.info)+'</p>':"")+
   '<label class="f" for="edTx">'+(tx0?"Proposition (modifiez-la librement, ou remplacez-la par votre autre proposition)":"Votre proposition")+'<textarea id="edTx" data-grow rows="4" style="width:100%">'+esc(tx0)+'</textarea></label>'+
   '<div class="row" style="gap:8px;flex-wrap:wrap"><label class="small">Délai (jours)<input id="edJ" type="number" min="1" value="'+(o.delai||30)+'" style="width:90px"></label>'+
   '<label class="small">Coût (milliards FCFA)<input id="edC" type="number" min="0" step="0.1" value="'+(o.cout!=null?o.cout:"")+'" placeholder="selon la mesure" style="width:130px"></label>'+
   '<label class="small">Compte rendu<select id="edCr"><option value="ecrit">par écrit</option><option value="audience">en audience</option></select></label></div>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn primary" id="edGo">✅ Valider et lancer l\'exécution</button>'+(SR?'<button class="btn" id="edMic">🎙 Dicter</button>':"")+(tx0?'<button class="btn" id="edNew">✍️ Autre proposition (effacer)</button>':"")+'<button class="btn ghost" id="edNo">Annuler</button></div>'+
   '<p class="small muted">Vous décidez : la mesure est exécutée directement, dans le délai fixé.</p>',el=>{el.setAttribute("data-noinstr","");
    const tx=el.querySelector("#edTx");setTimeout(()=>{tx.focus();tx.setSelectionRange(tx.value.length,tx.value.length)},60);
    const nw=el.querySelector("#edNew");if(nw)nw.onclick=()=>{tx.value="";tx.focus()};
    const mic=el.querySelector("#edMic");if(mic&&window.MIC){const ui=()=>{mic.textContent=MIC.want?"⏹ Micro activé":"🎙 Dicter";mic.classList.toggle("micon",MIC.want)};MIC.bind({onText:t=>{tx.value=(tx.value.trim()?tx.value.trim()+" ":"")+t},onState:ui,alive:()=>el.isConnected});mic.onclick=()=>{MIC.toggle();ui()}}
    el.querySelector("#edNo").onclick=()=>el.remove();
    el.querySelector("#edGo").onclick=async()=>{let v=tx.value.trim();if(v.length<4)return G.toast("Écrivez votre proposition.");const j=Math.max(1,+el.querySelector("#edJ").value||30);const c=el.querySelector("#edC").value;const cr=el.querySelector("#edCr").value;el.remove();
      v=v.replace(/^(je veux (que )?|il faut (que )?)/i,"");const txt="Je veux "+(/^(qu|que)\b/i.test(v)?v:lc(v))+(/\b(dans|sous|d ici)\s+\d+/.test(v)?"":" dans "+j+" jours");const n0=(S.directives||[]).length;const rep=m=>{say(m);G.toast(m.slice(0,140))};
      if(window.DIR)await DIR.handle(S,txt,rep,{force:true,cout:c!==""?+c:null,direct:S.mode==="pres",ctx:o.ctx||o.titre});
      const L=S.directives||[];const d=L.length>n0?L[L.length-1]:null;if(d){d.cr=cr;if(o.resp&&S.mode==="pres")d.resp=o.resp;if(o.reg)d.reg=o.reg;if(o.ville)d.ville=o.ville;if(c==="")null}
      if(o.onDone)o.onDone(d);G.render()}})};

/* ---------- centre de décision ---------- */
function items(S){const R=[];const add=(f,t,det,open,btn)=>R.push({f,t,det,open,btn});
  // dossier du bureau
  if(S.mode==="pres"&&S.cur!=null&&CM.DOSSIERS[S.cur]){const d=CM.DOSSIERS[S.cur];add("avis",d.t,"Dossier sur votre bureau · "+d.f,()=>G.dossierSheet&&G.dossierSheet(),"Décider")}
  // problèmes remontés à votre niveau / problèmes en cours ailleurs
  if(window.PB){for(const p of PB.all(S)){const e=PB.esc?PB.esc(S,p):null;const own=e&&!(p.doss||p.bureau||p.src==="Problème de fond"||String(p.id).startsWith("e_")||(p.actu&&p.sev<3));if(!own)continue;
    const me=S.mode==="pres"?e.l>=4:S.mode==="min"?e.l>=3&&PB.prop(S,p).min===(S.minis&&S.minis.id):false;
    if(e.dir)add("cours",p.t,"Instruction donnée · "+(p.ville||(p.reg?CM.REG[p.reg].n:"national")),()=>PB.item(S,p),"Voir");
    else if(me)add("avis",p.t,"🔺 Remonté à votre niveau · proposition du ministre prête · "+(p.ville||(p.reg?CM.REG[p.reg].n:"national")),()=>PB.item(S,p),"Donner mon avis");
    else add("cours",p.t,"Géré par "+(PB.level?PB.level(S,p).by:"les autorités locales")+" · "+(p.ville||(p.reg?CM.REG[p.reg].n:"")),()=>PB.item(S,p),"Voir")}}
  // dossiers du portefeuille
  if(window.DOSS)for(const d of DOSS.open(S)){if(d.cours||d.dir)add("cours",d.t,"Mes dossiers · "+(d.cours?d.cours.lab:"directive en cours"),()=>DOSS.sheet(S,d.id),"Voir");else if(d.urg>=3)add("avis",d.t,"Mes dossiers · urgent · "+d.cause,()=>DOSS.sheet(S,d.id),"Agir")}
  // actualités sans décision
  if(window.ACTU)for(const a of ACTU.all().slice(0,20)){if(!(S.actusVus||[]).includes(a.id)||a.grav<2)continue;if(((S.actuFait||{})[a.id]||[]).length)continue;const it=S.inbox.find(i=>i.actu===a.id);if(it)add("avis",a.titre,"Fait réel sans réponse de votre part",()=>window.SYS.openMail(S,it.id),"Répondre")}
  // propositions du cabinet et des ministres
  if(S.cab)for(const p of S.cab.props.filter(x=>x.st==="attente"))add("cab",p.t,"Cabinet : "+p.act,()=>HUB.cab(S,p.id),"Examiner");
  if(S.rec)for(const p of S.rec.props){const x=window.REC&&REC.L.find(y=>y.id===p.id);if(!x)continue;if(p.st==="attente")add("cab",x.t,"Proposition de recettes · ~"+x.rec+" Md/an",()=>REC.sheet(S),"Examiner");else if(p.st==="etude")add("renv",x.t,"Étude complémentaire demandée, retour le "+G.dayLabel(p.back||S.day),()=>REC.sheet(S),"Voir")}
  for(const n of S.notes||[])if(n.done&&n.props&&n.props.some(p=>p.st==="attente")){const it=S.inbox.find(i=>i.note===n.id);add("cab","Note : "+(n.titre||n.texte).slice(0,80),"Propositions à adopter, modifier ou écarter",()=>it&&window.SYS.openMail(S,it.id),"Examiner")}
  // plans : à valider / renvoyés
  for(const d of S.directives||[]){if(d.done)continue;if(d.phase==="valid")add(d.retours?"renv":"cab",d.titre,"Plan d'exécution à valider"+(d.retours?" (révisé selon vos instructions)":""),()=>DIR.sheet(S),"Valider");
    else if(d.phase==="plan"||d.phase==="presid")add("renv",d.titre,d.retours?"Renvoyé avec vos instructions · nouveau plan le "+G.dayLabel(d.planDue):d.phase==="presid"?"En attente de la Présidence":"Plan demandé, attendu le "+G.dayLabel(d.planDue),()=>DIR.sheet(S),"Voir");
    else add("exec",d.titre,"Exécution en cours · rapport le "+G.dayLabel(d.due)+(d.resp&&S.gov&&S.gov.min[d.resp]?" · "+S.gov.min[d.resp].n:""),()=>DIR.sheet(S),"Suivre")}
  // offres des partenaires
  if(S.ctr&&window.CTR)for(const k in S.ctr.seen){const o=CTR.OFFRES.find(x=>x.id===k);const dl=S.ctr.deals[k];if(o&&!(dl&&dl.fin))add("part",o.t,o.p+(dl?" · négociation en cours":" · offre reçue"),()=>CTR.contrat(S,k),"Négocier")}
  if(S.mode==="pres"&&S.cur!=null&&window.NEGO&&NEGO.has(CM.DOSSIERS[S.cur]))add("part",CM.DOSSIERS[S.cur].t,"Partenaire prêt à négocier",()=>NEGO.open(S,CM.DOSSIERS[S.cur]),"Négocier");
  // exécution : suivi, commandes, missions
  for(const a of S.suivi||[]){if(a.st==="en cours"){const nx=a.et.find(e=>!e.ok);add("exec",a.t,a.cat+(nx?" · prochaine étape : "+nx.l+" le "+G.dayLabel(nx.j):""),()=>SUIVI.sheet(S),"Suivre")}else if(a.st==="exécuté")add("fait",a.t,a.cat+" · exécuté le "+G.dayLabel(a.fin),()=>SUIVI.sheet(S,"fini"),"Voir")}
  for(const o of S.cmds||[])add(o.st==="livré"?"fait":"exec","Commande : "+o.qty+" × "+o.n.toLowerCase(),o.f+" · "+(o.st==="livré"?"livré":"livraison le "+G.dayLabel(o.arr)),()=>SUIVI.sheet(S),"Suivre");
  if(S.def&&S.def.esp)add("exec","Mission de renseignement","Compte rendu le "+G.dayLabel(S.def.esp.fin),()=>G.setTab("defense"),"Voir");
  for(const d of (S.directives||[]).filter(x=>x.done).slice(-15))add("fait",d.titre,d.res||"Terminée",()=>DIR.sheet(S),"Voir");
  return R}
const F=[["avis","🔴 Sans votre avis"],["cours","🟡 Problèmes en cours"],["cab","📋 Propositions du cabinet et des ministres"],["renv","↩️ Propositions renvoyées"],["part","🤝 Offres des partenaires"],["exec","⚙️ Instructions en cours d'exécution"],["fait","✅ Exécutées"]];
HUB.counts=S=>{const c={};for(const r of items(S))c[r.f]=(c[r.f]||0)+1;return c};
HUB.sheet=function(S,f){document.querySelectorAll(".sheet[data-hub]").forEach(x=>x.remove());const R=items(S);const c={};for(const r of R)c[r.f]=(c[r.f]||0)+1;f=f||F.find(([k])=>c[k])&&F.find(([k])=>c[k])[0]||"avis";const L=R.filter(r=>r.f===f);
  G.sheet('<span class="eyebrow">Centre de décision</span><h3 class="h2">Tout ce qui attend une décision</h3><div class="row" style="gap:6px;flex-wrap:wrap">'+F.map(([k,l])=>'<button class="btn small'+(k===f?" primary":"")+'" data-hf="'+k+'" aria-pressed="'+(k===f)+'">'+esc(l)+' ('+(c[k]||0)+')</button>').join("")+'</div>'+
   (L.length?L.map((r,i)=>'<div class="card" style="gap:4px;background:var(--panel3)"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><b>'+esc(r.t)+'</b><button class="btn small primary" data-hi="'+i+'">'+esc(r.btn)+'</button></div><span class="small muted">'+esc(r.det)+'</span></div>').join(""):'<p class="small muted">Rien dans cette catégorie.</p>')+
   '<button class="btn" data-hnew>✍️ Donner une instruction nouvelle</button>',el=>{el.dataset.hub="1";el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-hf]").forEach(b=>b.onclick=()=>HUB.sheet(S,b.dataset.hf));
    el.querySelectorAll("[data-hi]").forEach(b=>b.onclick=()=>{el.remove();L[+b.dataset.hi].open()});
    el.querySelector("[data-hnew]").onclick=()=>{el.remove();EDIT.sheet(S,{titre:"Nouvelle instruction",from:"Votre décision"})}})};
/* une proposition du cabinet : valider, modifier ou autre proposition */
HUB.cab=function(S,id){const p=(S.cab&&S.cab.props||[]).find(y=>y.id===id);if(!p)return;const x=p.x;
  G.sheet('<span class="eyebrow">Proposition du cabinet</span><h3 class="h2">'+esc(p.t)+'</h3><p class="small muted">'+esc(p.why)+'</p><p>Proposition : '+esc(p.act)+'</p>'+
   '<div class="choices"><button class="btn primary" data-hc="ok">✅ Valider telle quelle</button><button class="btn" data-hc="mod">✏️ Modifier avant validation</button><button class="btn" data-hc="autre">✍️ Autre proposition</button><button class="btn ghost" data-hc="non">❌ Écarter</button></div>',el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-hc]").forEach(b=>b.onclick=()=>{el.remove();const k=b.dataset.hc;
      if(k==="ok")return CAB.validate(S,id);if(k==="non")return CAB.reject(S,id);
      const done=()=>{p.st="autre";p.dv=S.day};
      EDIT.sheet(S,{titre:p.t,from:"Proposition du cabinet",info:p.why,texte:k==="mod"?(x.type==="dir"?x.text:lc(p.act.replace(/\.$/,""))):"",reg:p.reg,ctx:p.t,onDone:done})})})};
})();
