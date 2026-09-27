/* Chemin d'Etoudi — l'agenda : rendez-vous et audiences du jour (confirmés, tenus, annulés, reportés),
   demandes d'audience à traiter (recevoir, fixer un rendez-vous, refuser), plans d'exécution à valider et
   comptes rendus attendus, avec le choix pour chacun : audience ou rapport écrit. */
(function(){
"use strict";
const G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const AG={};window.AG=AG;
const hour=at=>{const h=((at%1)*24+8)%24;const H=Math.floor(h),M=Math.round((h-H)*60)%60;return H+" h "+String(M).padStart(2,"0")};
const dayOf=at=>Math.floor(at+(((at%1)*24+8)>=24?1:0));
const sameDay=(a,b)=>dayOf(a)===dayOf(b);
const atFor=(d,h)=>Math.floor(d)+(h-8)/24;
function lists(S){const A=(S.agenda=S.agenda||[]);const today=A.filter(a=>sameDay(a.at,S.day)).sort((a,b)=>a.at-b.at);
  const next=A.filter(a=>!a.done&&dayOf(a.at)>dayOf(S.day)&&a.at-S.day<8).sort((a,b)=>a.at-b.at);
  const req=((S.org&&S.org.aud)||[]).filter(a=>!a.done&&!a.prog);
  const D=(S.directives||[]).filter(d=>!d.done);const valid=D.filter(d=>d.phase==="valid");const cr=D.filter(d=>(!d.phase||d.phase==="exec")&&d.due-S.day<2.5).sort((a,b)=>a.due-b.due);const wait=D.filter(d=>d.phase==="plan"||d.phase==="presid");
  return{today,next,req,valid,cr,wait}}
function status(S,a){if(a.cancel)return["Annulé","bad"];if(a.done)return[a.held||a.type!=="meet"?"Tenu":"Terminé","ok"];if(a.at<=S.day)return["En cours","warn"];return[a.conf===false?"En attente de confirmation":"Confirmé","ok"]}
const pill=(t,k)=>'<span class="pill '+(k||"")+'" style="font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--line);white-space:nowrap">'+esc(t)+'</span>';
AG.card=function(S){if(!S||S.phase!=="play")return"";const L=lists(S);const up=L.today.filter(a=>!a.done);const n=up.length+L.req.length+L.valid.length+L.cr.length;
  const first=up[0]||L.next[0];
  return '<div class="card" data-agopen role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>📅 Mon agenda · '+esc(G.dayLabel(S.day))+'</b><span class="small muted">Ouvrir ▸</span></div>'+
   '<div class="small">'+[up.length?up.length+" rendez-vous aujourd'hui":"Aucun rendez-vous aujourd'hui",L.req.length?"<b>"+L.req.length+" demande"+(L.req.length>1?"s":"")+" d'audience</b>":"",L.valid.length?"<b>"+L.valid.length+" plan"+(L.valid.length>1?"s":"")+" à valider</b>":"",L.cr.length?L.cr.length+" compte"+(L.cr.length>1?"s":"")+" rendu"+(L.cr.length>1?"s":"")+" attendu"+(L.cr.length>1?"s":""):""].filter(Boolean).join(" · ")+'</div>'+
   (first?'<div class="small muted">Prochain : '+esc(G.dayLabel(first.at))+' à '+hour(first.at)+' — '+esc(first.lab)+'</div>':"")+'</div>'};
AG.bindCard=function(S,root){(root||document).querySelectorAll("[data-agopen]").forEach(c=>{c.onclick=()=>AG.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();AG.sheet(S)}}})};
AG.summary=function(S){const L=lists(S);const up=L.today.filter(a=>!a.done);
  return(up.length?"Aujourd'hui : "+up.map(a=>hour(a.at)+", "+a.lab).join(" ; ")+".":"Aucun rendez-vous prévu aujourd'hui.")+(L.req.length?" "+L.req.length+" demande"+(L.req.length>1?"s":"")+" d'audience en attente : "+L.req.slice(0,3).map(a=>a.qui).join(", ")+".":"")+
   (L.valid.length?" "+L.valid.length+" plan"+(L.valid.length>1?"s":"")+" d'exécution à valider.":"")+(L.cr.length?" Comptes rendus attendus : "+L.cr.map(d=>d.titre.slice(0,60)+" ("+(d.cr==="audience"?"en audience":"par écrit")+", "+G.dayLabel(d.due)+")").join(" ; ")+".":"")};
AG.sheet=function(S){if(!S)return;document.querySelectorAll(".sheet[data-ag]").forEach(x=>x.remove());const L=lists(S);
  const row=(a,acts)=>{const [st,k]=status(S,a);return '<div class="card" style="gap:6px;background:var(--panel3)"><div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start"><span><b>'+hour(a.at)+'</b> — '+esc(a.lab)+'</span>'+pill(st,k)+'</div>'+(a.objet?'<span class="small muted">Objet : '+esc(a.objet)+'</span>':"")+
    (acts&&!a.done?'<div class="row" style="gap:6px"><button class="btn small primary" data-agnow="'+a.id+'">Recevoir maintenant</button><button class="btn small" data-agrep="'+a.id+'">Reporter au lendemain</button><button class="btn small ghost" data-agx="'+a.id+'">Annuler</button></div>':"")+'</div>'};
  const hours=[9,10,11,12,14,15,16,17];
  G.sheet('<span class="eyebrow">Agenda · '+esc(G.dayLabel(S.day))+' · '+hour(S.day)+'</span><h3 class="h2">Mon agenda</h3>'+
   (L.valid.length?'<span class="eyebrow">⏳ Plans d\'exécution à valider ('+L.valid.length+')</span>'+L.valid.map(d=>'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(d.titre)+'</b><span class="small">'+esc(d.plan||"")+'</span><span class="small muted">Validation requise : '+esc(d.why||"")+'</span><div class="row" style="gap:6px"><button class="btn small primary" data-agvok="'+d.id+'">✅ Approuver et lancer</button><button class="btn small" data-agveco="'+d.id+'">💰 Moins cher</button><button class="btn small ghost" data-agvno="'+d.id+'">❌ Rejeter</button></div></div>').join(""):"")+
   '<span class="eyebrow">Aujourd\'hui</span>'+(L.today.length?L.today.map(a=>row(a,true)).join(""):'<p class="small muted">Aucun rendez-vous aujourd\'hui.</p>')+
   (L.req.length?'<span class="eyebrow">Demandes d\'audience en attente ('+L.req.length+')</span>'+L.req.map(a=>'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(a.qui)+'</b><span class="small">'+esc(a.objet)+'</span><span class="small muted">Reçue le '+esc(G.dayLabel(a.day))+' · à recevoir avant le '+esc(G.dayLabel(a.exp))+'</span>'+
     '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small primary" data-agaud="'+a.id+'">Recevoir maintenant</button><select data-agd="'+a.id+'" aria-label="Jour du rendez-vous"><option value="0">Aujourd\'hui</option><option value="1" selected>Demain</option><option value="2">Après-demain</option><option value="3">Dans 3 jours</option></select><select data-agh="'+a.id+'" aria-label="Heure du rendez-vous">'+hours.map(h=>'<option value="'+h+'"'+(h===10?" selected":"")+'>'+h+' h</option>').join("")+'</select><button class="btn small" data-agfix="'+a.id+'">Fixer le rendez-vous</button><button class="btn small ghost" data-agno="'+a.id+'">Refuser</button></div></div>').join(""):"")+
   (L.cr.length?'<span class="eyebrow">Comptes rendus attendus</span>'+L.cr.map(d=>{const R=window.DIR?DIR.resp(S,d):{n:""};return '<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(d.titre)+'</b><span class="small muted">Attendu le '+esc(G.dayLabel(d.due))+' à '+hour(d.due)+' · responsable : '+esc(R.n)+(d.audProg?" · audience programmée":"")+'</span><div class="row small" style="gap:6px;align-items:center"><span>Recevoir le compte rendu :</span><button class="btn small'+(d.cr==="audience"?" primary":"")+'" data-agcr="audience" data-id="'+d.id+'" aria-pressed="'+(d.cr==="audience")+'">🤝 En audience</button><button class="btn small'+(d.cr!=="audience"?" primary":"")+'" data-agcr="ecrit" data-id="'+d.id+'" aria-pressed="'+(d.cr!=="audience")+'">📄 Par écrit, pour exploitation</button></div></div>'}).join(""):"")+
   (L.wait.length?'<span class="eyebrow">En préparation</span>'+L.wait.map(d=>'<div class="small">• '+esc(d.titre.slice(0,90))+' — <span class="muted">'+(d.phase==="plan"?"plan attendu le "+esc(G.dayLabel(d.planDue)):"en attente de la Présidence")+'</span></div>').join(""):"")+
   (L.next.length?'<span class="eyebrow">Prochains jours</span>'+L.next.map(a=>'<div class="small">• <b>'+esc(G.dayLabel(a.at))+' à '+hour(a.at)+'</b> — '+esc(a.lab)+' '+pill(status(S,a)[0],"ok")+' <button class="btn small ghost" data-agx="'+a.id+'">Annuler</button></div>').join(""):"")+
   '<p class="small muted">Pour ajouter un rendez-vous : « convoque le ministre de la Santé demain à 10 h » (assistant 🎙 ou « Autre instruction »).</p>',el=>{el.dataset.ag="1";el.setAttribute("data-noinstr","");
    const re=()=>{el.remove();G.render();AG.sheet(S)};
    const byId=id=>(S.agenda||[]).find(x=>x.id===id);
    el.querySelectorAll("[data-agnow]").forEach(b=>b.onclick=()=>{const a=byId(b.dataset.agnow);if(!a)return;a.at=S.day;el.remove();if(window.VOIX)VOIX.tick(S)});
    el.querySelectorAll("[data-agrep]").forEach(b=>b.onclick=()=>{const a=byId(b.dataset.agrep);if(!a)return;a.at=Math.max(a.at,S.day)+1;a.lab=a.lab.replace(/ \(reporté\)$/,"")+" (reporté)";G.toast("Rendez-vous reporté au "+G.dayLabel(a.at)+" à "+hour(a.at));re()});
    el.querySelectorAll("[data-agx]").forEach(b=>b.onclick=()=>{const a=byId(b.dataset.agx);if(!a)return;a.done=1;a.cancel=1;if(a.rapport&&window.DIR){DIR.deliver(S,a.rapport);G.toast("Annulé : le compte rendu vous est envoyé par écrit.")}else G.toast("Rendez-vous annulé");re()});
    el.querySelectorAll("[data-agaud]").forEach(b=>b.onclick=()=>{el.remove();VIE.audSheet(S,b.dataset.agaud)});
    el.querySelectorAll("[data-agfix]").forEach(b=>b.onclick=()=>{const id=b.dataset.agfix;const a=S.org.aud.find(x=>x.id===id);if(!a)return;const dd=+el.querySelector('[data-agd="'+id+'"]').value,hh=+el.querySelector('[data-agh="'+id+'"]').value;
      let at=atFor(S.day,hh)+dd;if(at<=S.day)at+=1;a.prog=at;S.agenda=S.agenda||[];S.agenda.push({id:"a"+Date.now().toString(36),type:"aud",aud:id,at,lab:"Audience : "+a.qui,objet:a.objet,conf:true});if(a.exp<at)a.exp=at+1;
      window.SYS.inbox(S,{from:"Secrétariat particulier",t:"Rendez-vous fixé : "+a.qui,b:"Audience confirmée le "+G.dayLabel(at)+" à "+hour(at)+". Objet : "+a.objet,k:"info",read:true});G.toast("Rendez-vous confirmé : "+G.dayLabel(at)+" à "+hour(at));re()});
    el.querySelectorAll("[data-agno]").forEach(b=>b.onclick=()=>{const a=S.org.aud.find(x=>x.id===b.dataset.agno);if(!a)return;a.done=1;a.refus=1;window.SYS.inbox(S,{from:"Secrétariat particulier",t:"Audience refusée : "+a.qui,b:"Votre secrétariat a décliné poliment la demande. Objet : "+a.objet,k:"info",read:true});G.toast("Demande d'audience déclinée.");re()});
    el.querySelectorAll("[data-agcr]").forEach(b=>b.onclick=()=>{const d=(S.directives||[]).find(x=>x.id===b.dataset.id);if(!d)return;d.cr=b.dataset.agcr;G.toast(d.cr==="audience"?"Le responsable viendra vous présenter le compte rendu.":"Compte rendu par écrit, pour exploitation.");re()});
    el.querySelectorAll("[data-agvok]").forEach(b=>b.onclick=()=>{DIR.approve(S,b.dataset.agvok);re()});el.querySelectorAll("[data-agveco]").forEach(b=>b.onclick=()=>{DIR.econ(S,b.dataset.agveco);re()});el.querySelectorAll("[data-agvno]").forEach(b=>b.onclick=()=>{DIR.reject(S,b.dataset.agvno);re()});
  })};
/* pastille sur le bouton agenda : plans à valider + demandes d'audience */
setInterval(()=>{const b=document.getElementById("bAg");const S=G.S;if(!b)return;let n=0;if(S&&S.phase==="play"){const L=lists(S);n=L.valid.length+L.req.length}
  let d=b.querySelector(".agbadge");if(!n){if(d)d.remove();b.setAttribute("aria-label","Mon agenda");return}
  if(!d){d=document.createElement("span");d.className="agbadge";d.style.cssText="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#c42b1c;color:#fff;font:700 11px/18px system-ui,sans-serif;text-align:center;pointer-events:none";b.style.position="relative";b.appendChild(d)}
  d.textContent=n;b.setAttribute("aria-label","Mon agenda : "+n+" élément"+(n>1?"s":"")+" à traiter")},1000);
AG.isAsk=t=>/(mon agenda|mes rendez vous|mes rdv|mes audiences|audiences? (du jour|d aujourd hui|prevues?)|programme (du jour|de la journee|d aujourd hui)|emploi du temps|qui (dois je|je dois) recevoir|demandes? d audience|rapports? (attendus?|du jour)|comptes? rendus? (attendus?|du jour)|plans? a valider)/.test(t);
})();
