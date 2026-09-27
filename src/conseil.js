/* Chemin d'Etoudi — le cabinet : un collaborateur par profil (secrétaire général de la Présidence, directeur de cabinet,
   secrétaire général de mairie ou du parti, assistant) repère les problèmes de votre zone de compétence et PROPOSE des actions.
   Rien ne s'exécute sans votre validation. Chaque responsable a un caractère (zélé, coopératif, prudent, têtu, négligent,
   ambitieux) qui pèse sur l'exécution ; un rapport mensuel donne le taux d'exécution de chacun. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const esc=G.esc,clamp=G.clamp,pick=G.pick;
const CAB={};window.CAB=CAB;
const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};

/* ---------- caractères ---------- */
const TRAITS={zele:["zélé",.15,"exécute vite et bien"],cooperatif:["coopératif",.06,"suit les consignes"],prudent:["prudent",0,"avance lentement mais sûrement"],
  ambitieux:["ambitieux",.04,"efficace quand cela sert sa carrière"],tetu:["têtu",-.14,"conteste et traîne des pieds"],negligent:["négligent",-.22,"laisse traîner les dossiers"]};
const ORDER=["cooperatif","prudent","zele","ambitieux","tetu","negligent","cooperatif","prudent"];
function hash(s){let h=7;for(const c of String(s||""))h=(h*31+c.charCodeAt(0))>>>0;return h}
CAB.trait=n=>ORDER[hash(n)%ORDER.length];
CAB.traitLab=n=>TRAITS[CAB.trait(n)][0];CAB.traitBonus=n=>TRAITS[CAB.trait(n)][1];CAB.traitDesc=n=>TRAITS[CAB.trait(n)][2];
CAB.TRAITS=TRAITS;

/* ministère responsable d'une directive */
const RESP={audit:"MINFI",prix:"MINCOMMERCE",arrieres:"MINFI",emploi:"MINEFOP",construire:"MINTP",securite:"MINDEF",dialogue:"MINATD",liberer:"MINJUSTICE",gratuite:"MINSANTE",
  electricite:"MINEE",eau:"MINEE",sante:"MINSANTE",education:"MINESEC",agriculture:"MINADER",transparence:"MINCOM",interdire:"MINATD"};
CAB.resp=cat=>RESP[cat]||null;
CAB.minName=(S,id)=>{const m=E.MINISTERES.find(x=>x.id===id);return m?m.n:id};

/* ---------- le collaborateur ---------- */
function conseiller(S){if(S.conseiller)return S.conseiller;const reg=window.VOY?VOY.here(S).reg:"CE";let titre,n;
  if(S.mode==="pres"){titre="secrétaire général de la Présidence";n=S.gov&&S.gov.sg?S.gov.sg.n:window.SYS.nom("SU")}
  else if(S.mode==="min"){titre="directeur de cabinet";n=window.SYS.nom(reg)}else if(S.profil==="maire"){titre="secrétaire général de la mairie";n=window.SYS.nom(reg)}
  else if(S.opp){titre="secrétaire général du parti";n=window.SYS.nom(reg)}else{titre="assistant";n=window.SYS.nom(reg)}
  S.conseiller={n,titre};return S.conseiller}
const lab=S=>{const c=conseiller(S);return window.SYS.accord("le "+c.titre,window.SYS.sexe(c.n)).replace(/^le /,"")};
CAB.conseiller=conseiller;

/* ---------- détection des problèmes et propositions ---------- */
function add(S,key,o){S.cab=S.cab||{props:[],seen:{},stats:{}};if(S.cab.seen[key]||S.cab.props.some(p=>p.key===key))return;const pend=S.cab.props.filter(p=>p.st==="attente");if(pend.length>=8)return;
  const ty=o.x&&o.x.type;if(ty==="actu"&&pend.filter(p=>p.x.type==="actu").length>=3)return;
  S.cab.seen[key]=S.day;const p=Object.assign({id:"p"+Date.now().toString(36)+Math.floor(Math.random()*1e4),key,day:S.day,st:"attente"},o);S.cab.props.push(p);S.cab.props=S.cab.props.slice(-60);
  window.SYS.inbox(S,{from:conseiller(S).n+", "+lab(S),t:"Proposition : "+p.t,b:p.why+"\nJe propose : "+p.act+"\nRien ne sera engagé sans votre validation (carte « Propositions de votre cabinet »).",k:"info",prop:p.id})}
function mine(S,a){return window.ACTU?ACTU.role(S,a)!=="info":false}
CAB.scan=function(S){if(!S||S.phase!=="play")return;S.cab=S.cab||{props:[],seen:{},stats:{}};
  // 1) faits réels restés sans décision
  if(window.ACTU){for(const a of ACTU.all()){if(!S.actusVus||!S.actusVus.includes(a.id)||!mine(S,a)||a.grav<2)continue;const f=(S.actuFait||{})[a.id]||[];if(f.length)continue;
    const it=S.inbox.find(i=>i.actu===a.id);if(!it||S.m*30+0<0)continue;
    const k=S.mode==="pres"?(a.cat==="violence"||a.cat==="accident"?"aide":"ministre"):S.mode==="min"?"terrain":S.opp?"communique":"aider";
    const L={aide:"débloquer une aide d'urgence (1 milliard) pour les victimes",ministre:"dépêcher le ministre compétent sur place",terrain:"une descente sur le terrain",communique:"un communiqué du parti",aider:"proposer vos services"}[k];
    add(S,"actu:"+a.id,{t:a.titre.slice(0,80),why:"Ce dossier n'a encore reçu aucune réponse de votre part : « "+a.titre+" ». L'opinion attend un geste.",act:L+".",x:{type:"actu",id:a.id,k},reg:a.reg})}}
  // 2) régions en crise (président, maire de la région, opposition)
  if(S.mood){for(const r of CM.REGIONS){const v=S.mood[r.id].v;if(v>=33)continue;
    if(S.mode==="pres")add(S,"crise:"+r.id+":"+Math.floor(S.day/30),{t:"Tension forte dans la région "+r.n,why:"L'humeur de la région "+r.n+" est tombée à "+Math.round(v)+" sur 100.",act:"une directive « plan d'urgence social et sécuritaire pour la région "+r.n+" » (coût estimé 25 milliards).",x:{type:"dir",text:"Je veux un plan d'urgence social et sécuritaire pour la région "+r.n+" : renforts, emploi des jeunes et dialogue avec les chefs traditionnels"},reg:r.id});
    else if(S.opp&&!S.opp.commune)add(S,"crise:"+r.id+":"+Math.floor(S.day/30),{t:"Colère dans la région "+r.n,why:"La population de la région "+r.n+" est très mécontente ("+Math.round(v)+"/100).",act:"une visite de solidarité à "+r.chef+".",x:{type:"trip",to:{reg:r.id,v:r.chef}},reg:r.id})}}
  // 3) hôpitaux en rupture (président, ministre de la Santé)
  if(S.org&&(S.mode==="pres"||(S.mode==="min"&&S.minis.id==="MINSANTE"))){for(const h of S.org.hop){if(h.stock>=25)continue;
    add(S,"hop:"+h.id+":"+Math.floor(S.day/30),{t:"Rupture de médicaments : "+h.n,why:"Les stocks de "+h.n+" sont à "+Math.round(h.stock)+" sur 100 ; les patients achètent eux-mêmes leurs médicaments.",act:"envoyer des médicaments (0,5 milliard).",x:{type:"hop",id:h.id},reg:h.reg});break}}
  // 4) directives en échec
  for(const d of S.directives||[]){if(!d.done||!/partielle|échec/.test(d.res||""))continue;
    add(S,"dir:"+d.id,{t:"Relancer : "+d.titre.slice(0,70),why:"Votre directive « "+d.titre+" » a connu une "+(d.res||"").toLowerCase().replace("mise en œuvre ","mise en œuvre ")+"."+(d.resp&&S.gov&&S.gov.min[d.resp]?" Responsable : "+S.gov.min[d.resp].n+" ("+CAB.traitLab(S.gov.min[d.resp].n)+").":""),act:"relancer les services pour 30 jours et convoquer le ministre responsable.",x:{type:"relance",id:d.id}})}
  // 5) parité (président)
  if(S.mode==="pres"&&window.GENRE){const g=GENRE.groups(S)[0];if(g&&g.pct<25)add(S,"parite:"+Math.floor(S.day/60),{t:"Peu de femmes au gouvernement",why:"Le gouvernement ne compte que "+g.f+" femmes sur "+g.t+" ("+g.pct+" %). Les associations de femmes s'impatientent.",act:"un réaménagement pour atteindre 30 % de femmes.",x:{type:"genre"}})}
  // 6) engagements de terrain oubliés
  for(const e of S.engagements||[]){if(e.done||e.late||e.due-S.day>15)continue;add(S,"eng:"+e.id,{t:"Promesse à tenir : "+e.t.slice(0,60),why:"Vous avez promis à "+(e.ville||"la population")+" : « "+e.t+" ». L'échéance approche ("+G.dayLabel(e.due)+").",act:"tenir l'engagement maintenant.",x:{type:"eng",id:e.id},reg:e.reg})}
  // 7) ministre : secteur en difficulté
  if(S.mode==="min"&&S.minis&&S.st){const sec=S.minis.s;if(S.st[sec]!=null&&S.st[sec]<35)add(S,"secteur:"+Math.floor(S.day/30),{t:"Votre secteur est en difficulté",why:"L'indicateur de votre secteur est à "+Math.round(S.st[sec])+" sur 100.",act:"un plan d'action du ministère sur 60 jours.",x:{type:"dir",text:"Je veux un plan d'action d'urgence de mon ministère sur 60 jours pour redresser la situation"}})}
};

/* ---------- validation ---------- */
function run(S,p){const x=p.x;S.cab.stats.ok=(S.cab.stats.ok||0)+1;
  if(x.type==="actu"){const it=S.inbox.find(i=>i.actu===x.id);if(!it)return"Dossier introuvable.";window.SYS.openMail(S,it.id);const b=document.querySelector('.sheet [data-ax="'+x.k+'"]');if(b){b.click();return null}document.querySelectorAll(".sheet").forEach(s=>s.remove());return"Action déjà engagée."}
  if(x.type==="dir"&&window.DIR){DIR.handle(S,x.text,m=>{say(m);G.toast(m.slice(0,110))});return null}
  if(x.type==="trip"&&window.VOY){VOY.ask(S,x.to,{});return null}
  if(x.type==="hop"&&window.VIE){VIE.openOrg(S,{k:"hop",id:x.id});const b=document.querySelector('.sheet [data-m="med"]');if(b){b.click();return null}return"Vous n'avez pas autorité sur cet hôpital."}
  if(x.type==="relance"){const d=(S.directives||[]).find(y=>y.id===x.id);if(!d)return"Directive introuvable.";d.done=false;d.due=S.day+30;d.res="";if(d.resp&&S.gov&&S.gov.min[d.resp]){const g=S.gov.min[d.resp];S.agenda=S.agenda||[];S.agenda.push({id:"a"+Date.now(),type:"meet",at:Math.floor(S.day+1/3)+1+9/24-1/3,who:{k:"min",id:d.resp,lab:"le ministre "+CAB.minName(S,d.resp),n:g.n,min:d.resp},objet:"relance : "+d.titre,lab:"Audience : relance "+d.titre.slice(0,40)})}G.toast("Directive relancée pour 30 jours.");return null}
  if(x.type==="genre"&&window.GENRE){GENRE.apply(S,"gouv",30,m=>{say(m);G.toast(m.slice(0,110))});return null}
  if(x.type==="eng"&&window.RENC){const b=document.querySelector('[data-eng="'+x.id+'"]');if(b){b.click();return null}return"Engagement introuvable."}
  return"Action non disponible."}
CAB.validate=function(S,id){const p=(S.cab&&S.cab.props||[]).find(y=>y.id===id);if(!p||p.st!=="attente")return;p.st="validee";p.dv=S.day;const err=run(S,p);if(err){p.st="attente";G.toast(err);return}G.render()};
CAB.reject=function(S,id){const p=(S.cab&&S.cab.props||[]).find(y=>y.id===id);if(!p)return;p.st="rejetee";p.dv=S.day;S.cab.stats.ko=(S.cab.stats.ko||0)+1;G.toast("Proposition écartée.");G.render()};

/* autre instruction : toutes les options du dossier + consigne libre (écrite ou dictée) */
CAB.alt=function(S,id){const p=(S.cab&&S.cab.props||[]).find(y=>y.id===id);if(!p)return;const x=p.x;const opts=[];
  if(x.type==="actu")opts.push(["mail","📂 Voir toutes les options du dossier"]);
  if(x.type==="dir")opts.push(["mod","✏️ Réécrire la directive proposée"]);
  if(x.type==="trip")opts.push(["voy","🧭 Choisir une autre destination ou un autre moyen"]);
  if(x.type==="hop")opts.push(["hop","🏥 Ouvrir la fiche de l'hôpital (toutes les mesures)"]);
  if(x.type==="relance")opts.push(["dirs","📜 Ouvrir mes directives"]);
  if(x.type==="genre")opts.push(["par","⚖️ Voir la fiche parité"]);
  if(p.reg)opts.push(["voir","🗺️ Voir la région"]);
  opts.push(["conv","📅 Convoquer le ministre compétent demain à 9 h"]);
  const done=()=>{if(p.st==="attente"){p.st="autre";p.dv=S.day}};
  G.sheet('<span class="eyebrow">Autre instruction</span><h3 class="h2">'+esc(p.t)+'</h3><p class="small muted">'+esc(p.why)+'</p><p class="small">Proposition du cabinet : '+esc(p.act)+'</p>'+
   '<div class="choices">'+opts.map(([k,l])=>'<button class="choice" data-calt="'+k+'"><span class="t">'+esc(l)+'</span></button>').join("")+'</div>'+
   '<p class="small muted">Ou donnez votre propre consigne ci-dessous (écrite, ou dictée avec 🎙) : par exemple « je veux qu\'une délégation se rende auprès des familles » ou « convoque le préfet demain à 10 h ».</p>',el=>{
    el.querySelectorAll("[data-calt]").forEach(b=>b.onclick=()=>{const k=b.dataset.calt;el.remove();done();
      if(k==="mail"){const it=S.inbox.find(i=>i.actu===x.id);if(it)window.SYS.openMail(S,it.id)}
      else if(k==="mod"){p.st="attente";const t=document.createElement("div");t.innerHTML='<button data-cabmod="'+p.id+'"></button>';CAB.bind(S,t);t.firstChild.click()}
      else if(k==="voy"&&window.VOY)VOY.open(x.to&&x.to.reg,x.to&&x.to.v);
      else if(k==="hop"&&window.VIE)VIE.openOrg(S,{k:"hop",id:x.id});
      else if(k==="dirs"&&window.DIR)DIR.sheet(S);
      else if(k==="par"&&window.GENRE)GENRE.sheet(S);
      else if(k==="voir")G.viewRegion(p.reg);
      else if(k==="conv"&&window.VOIX){VOIX.handle("convoque le ministre "+(x.type==="hop"?"de la santé":p.reg?"de l'administration territoriale":"de la communication")+" demain à 9h")}
      G.render()});
    // la zone « Autre instruction » (texte + micro) est ajoutée automatiquement sous la fiche
    el.addEventListener("click",e=>{if(e.target.closest("[data-igo],[data-imic]"))done()});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.closest(".instr"))done()})})};
/* rappel si une situation reste négligée */
CAB.tick=function(S){if(!S||S.phase!=="play")return;S.cab=S.cab||{props:[],seen:{},stats:{}};
  if(!S.cab.next||S.day>=S.cab.next){S.cab.next=S.day+2;CAB.scan(S)}
  for(const p of S.cab.props)if(p.st==="attente"&&!p.rappel&&S.day-p.day>=10){p.rappel=1;window.SYS.inbox(S,{from:conseiller(S).n+", "+lab(S),t:"Situation négligée : "+p.t,b:"Je vous ai proposé il y a 10 jours : "+p.act+"\nAucune décision n'a été prise ; la situation se dégrade dans l'opinion. Validez, modifiez ou écartez la proposition.",k:"alerte",prop:p.id,reg:p.reg});if(p.reg)window.SYS.cause(S,p.reg,"Dossier négligé : "+p.t,-1,"negligence")}};

/* ---------- taux d'exécution (rapport mensuel) ---------- */
CAB.execStats=function(S){const T={};for(const d of S.directives||[]){if(!d.resp)continue;const t=T[d.resp]=T[d.resp]||{n:0,fini:0,ok:0,part:0,ko:0};t.n++;if(d.done&&d.res){t.fini++;if(/réussie/.test(d.res))t.ok++;else if(/partielle/.test(d.res))t.part++;else if(/échec/.test(d.res))t.ko++}}
  return Object.entries(T).map(([id,t])=>{const g=S.gov&&S.gov.min[id];const taux=t.fini?Math.round((t.ok+t.part*.5)*100/t.fini):null;return{id,poste:CAB.minName(S,id),n:g?g.n:"?",trait:g?CAB.traitLab(g.n):"",...t,taux}}).sort((a,b)=>(a.taux==null)-(b.taux==null)||(a.taux||0)-(b.taux||0))};
CAB.monthTick=function(S){if(S.mode!=="pres"&&S.mode!=="min")return;const L=CAB.execStats(S);const P=(S.cab&&S.cab.props)||[];const since=P.filter(p=>p.day>=S.day-30);
  const lines=L.map(x=>"• "+x.poste+" — "+x.n+" ("+x.trait+") : "+x.fini+"/"+x.n+" directives échues"+(x.taux!=null?", taux d'exécution "+x.taux+" %":"")+".");
  window.SYS.inbox(S,{from:conseiller(S).n+", "+lab(S),t:"Rapport mensuel : taux d'exécution",b:(lines.length?lines.join("\n"):"Aucune directive échue ce mois-ci.")+"\nPropositions du cabinet ce mois : "+since.length+" (validées : "+since.filter(p=>p.st==="validee").length+", écartées : "+since.filter(p=>p.st==="rejetee").length+", en attente : "+since.filter(p=>p.st==="attente").length+").",k:"rapport"})};

/* ---------- interface ---------- */
CAB.card=function(S){if(!S.cab||!S.cab.next){S.cab=S.cab||{props:[],seen:{},stats:{}};S.cab.next=S.day+2;CAB.scan(S)}const P=((S.cab&&S.cab.props)||[]).filter(p=>p.st==="attente");const c=conseiller(S);
  return '<div class="card"><div class="row" style="justify-content:space-between"><b>📋 Propositions de votre cabinet ('+P.length+')</b><button class="btn small" data-caball>Tout voir</button></div><span class="small muted">'+esc(c.n)+', '+esc(lab(S))+'</span>'+
   (P.length?P.slice(-3).reverse().map(p=>'<div class="card" style="gap:6px;padding:10px"><b class="small">'+esc(p.t)+'</b><span class="small muted">'+esc(p.why)+'</span><span class="small">Proposition : '+esc(p.act)+'</span><div class="row"><button class="btn small primary" data-cabok="'+p.id+'">Valider</button>'+(p.x.type==="dir"?'<button class="btn small" data-cabmod="'+p.id+'">Modifier</button>':"")+'<button class="btn small" data-cabalt="'+p.id+'">✍️ Autre instruction</button><button class="btn small ghost" data-cabno="'+p.id+'">Écarter</button></div></div>').join(""):'<span class="small muted">Rien à signaler pour l\'instant.</span>')+
   (S.mode==="pres"||S.mode==="min"?'<button class="btn small" data-cabexec>📊 Taux d\'exécution par responsable</button>':"")+'</div>'};
CAB.bind=function(S,root){root=root||document;
  root.querySelectorAll("[data-cabok]").forEach(b=>b.onclick=()=>CAB.validate(S,b.dataset.cabok));
  root.querySelectorAll("[data-cabno]").forEach(b=>b.onclick=()=>CAB.reject(S,b.dataset.cabno));
  root.querySelectorAll("[data-cabmod]").forEach(b=>b.onclick=()=>{const p=S.cab.props.find(y=>y.id===b.dataset.cabmod);if(!p)return;
    G.sheet('<span class="eyebrow">Modifier la proposition</span><h3 class="h2">'+esc(p.t)+'</h3><label class="f" for="cmTx">Directive à donner<textarea id="cmTx" rows="4" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit">'+esc(p.x.text)+'</textarea></label><div class="row"><button class="btn primary" id="cmOk">Valider cette version</button><button class="btn ghost" id="cmNo">Annuler</button></div>',el=>{el.setAttribute("data-noinstr","");
      el.querySelector("#cmNo").onclick=()=>el.remove();el.querySelector("#cmOk").onclick=()=>{const v=el.querySelector("#cmTx").value.trim();if(!v)return;p.x.text=v;p.act="directive : « "+v+" »";el.remove();CAB.validate(S,p.id)}})});
  root.querySelectorAll("[data-caball]").forEach(b=>b.onclick=()=>CAB.sheet(S));
  root.querySelectorAll("[data-cabalt]").forEach(b=>b.onclick=()=>CAB.alt(S,b.dataset.cabalt));
  root.querySelectorAll("[data-cabexec]").forEach(b=>b.onclick=()=>CAB.execSheet(S))};
CAB.sheet=function(S){const P=((S.cab&&S.cab.props)||[]).slice().reverse();const st={attente:"En attente",validee:"Validée",rejetee:"Écartée",autre:"Autre instruction donnée"};
  G.sheet('<span class="eyebrow">Cabinet</span><h3 class="h2">Propositions de votre cabinet</h3>'+(P.length?P.map(p=>'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(p.t)+'</b><span class="pill '+(p.st==="validee"?"ok":p.st==="rejetee"?"bad":"warn")+'">'+st[p.st]+'</span></div><span class="small muted">'+esc(G.dayLabel(p.day))+' · '+esc(p.why)+'</span><span class="small">Proposition : '+esc(p.act)+'</span>'+
   (p.st==="attente"?'<div class="row"><button class="btn small primary" data-cabok="'+p.id+'">Valider</button>'+(p.x.type==="dir"?'<button class="btn small" data-cabmod="'+p.id+'">Modifier</button>':"")+'<button class="btn small" data-cabalt="'+p.id+'">✍️ Autre instruction</button><button class="btn small ghost" data-cabno="'+p.id+'">Écarter</button></div>':"")+'</div>').join(""):'<p class="small muted">Aucune proposition pour le moment.</p>'),el=>{el.setAttribute("data-noinstr","");CAB.bind(S,el);el.querySelectorAll("[data-cabok],[data-cabno],[data-cabmod],[data-cabalt]").forEach(b=>b.addEventListener("click",()=>el.remove()))})};
CAB.execSheet=function(S){const L=CAB.execStats(S);const all=S.gov?Object.entries(S.gov.min):[];
  G.sheet('<span class="eyebrow">Suivi</span><h3 class="h2">Taux d\'exécution</h3><p class="small muted">Directives échues par ministère responsable, et caractère de chaque ministre (il pèse sur l\'exécution).</p>'+
   (L.length?L.map(x=>'<div><div class="row" style="justify-content:space-between"><span class="small"><b>'+esc(x.poste)+'</b> — '+esc(x.n)+' <span class="muted">('+esc(x.trait)+')</span></span><span class="small">'+(x.taux!=null?x.taux+" %":"en cours")+'</span></div><div class="bar"><i style="width:'+(x.taux||0)+'%;background:'+((x.taux||0)>=70?"var(--ok)":(x.taux||0)>=45?"var(--warn)":"var(--bad)")+'"></i></div><span class="small muted">'+x.fini+' directive'+(x.fini>1?"s":"")+' échue'+(x.fini>1?"s":"")+' sur '+x.n+' · réussies '+x.ok+', partielles '+x.part+', échecs '+x.ko+'</span></div>').join(""):'<p class="small muted">Aucune directive attribuée pour l\'instant.</p>')+
   '<span class="eyebrow">Caractère des membres du gouvernement</span><div class="kv">'+all.map(([id,g])=>'<span>'+esc(CAB.minName(S,id))+'</span><b>'+esc(g.n)+' · '+esc(CAB.traitLab(g.n))+'</b>').join("")+'</div>',el=>el.setAttribute("data-noinstr",""))};
})();
