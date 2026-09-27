/* Chemin d'Etoudi — les problèmes du pays, classés par région puis par ville ou village : faits réels du jour,
   causes de mécontentement, dossiers du bureau et du portefeuille, hôpitaux en rupture, promesses à tenir.
   Pour chacun : donner une instruction (écrite ou dictée), demander une note, appeler l'autorité compétente,
   se rendre sur place. On peut aussi donner une instruction pour un lieu sans problème précis. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const PB={};window.PB=PB;
const say=m=>{try{window.Audio2.speak(m,{voix:"f"})}catch(e){}};
const TY={securite:"MINDEF",paix:"MINDEF",electricite:"MINEE",eau:"MINEE",sante:"MINSANTE",routes:"MINTP",ecole:"MINEDUB",emploi:"MINEFOP",promesse:null,visite:null,directive:null,prix:"MINCOMMERCE",justice:"MINJUSTICE"};
function minFromText(f){if(!f)return null;const n=norm(f);let best=null;for(const m of E.MINISTERES){const k=norm(m.n).split(/[ ,]+/)[0];if(k.length>3&&n.includes(k)){best=m.id;break}}return best}
function cityIn(t,reg){const n=norm(t);const cand=[];if(window.VOY)for(const c of VOY.CITIES)if(!reg||c.reg===reg)cand.push([c.n,c.reg]);if(reg&&CM.REG[reg])for(const v of CM.REG[reg].villes||[])cand.push([v,reg]);
  cand.sort((a,b)=>b[0].length-a[0].length);for(const [v,r] of cand)if(new RegExp("\\b"+norm(v)+"\\b").test(n))return{v,reg:r};return null}
PB.all=function(S){const L=[];const add=o=>{if(!o.t)return;const k=norm(o.t).slice(0,60);if(L.some(x=>norm(x.t).slice(0,60)===k))return;o.id=o.id||"p"+L.length;L.push(o)};
  // dossier posé sur le bureau du président
  if(S.mode==="pres"&&S.cur!=null&&CM.DOSSIERS[S.cur]){const d=CM.DOSSIERS[S.cur];const c=cityIn(d.x,d.lieu);add({id:"bur",t:d.t,d:d.x,reg:d.lieu||null,ville:c&&c.v,src:"Dossier sur votre bureau",sev:3,min:minFromText(d.f),bureau:true})}
  // faits réels (actualités)
  if(window.ACTU)for(const a of ACTU.all()){const au=Array.isArray(a.aut)?a.aut[0]:a.aut;add({id:"a_"+a.id,t:a.titre,d:a.resume||"",reg:a.reg||null,ville:a.ville||null,lieu:a.lieu||null,src:"Actualité du "+(a.date||"jour"),sev:a.grav||2,min:au||null,actu:a.id})}
  // causes de mécontentement dans chaque région
  if(S.mood)for(const r of CM.REGIONS)for(const c of (S.mood[r.id].c||[])){if(c.d>=0)continue;const ci=cityIn(c.t,r.id);add({t:c.t,d:"Cause de mécontentement dans la région "+r.n+" (effet "+Math.round(c.d)+" sur l'humeur).",reg:r.id,ville:ci&&ci.v,src:"Humeur de la région",sev:c.d<=-5?3:2,min:TY[c.ty]||null})}
  // problèmes de fond connus (dossiers de l'État, situés)
  if(S.mode==="pres"||S.mode==="min")for(const d of CM.DOSSIERS){if(!d.lieu)continue;const c=cityIn(d.x,d.lieu);add({id:"f_"+d.id,t:d.t,d:d.x,reg:d.lieu,ville:c&&c.v,src:"Problème de fond",sev:1,min:minFromText(d.f)})}
  // hôpitaux en rupture
  if(S.org)for(const h of S.org.hop){if(h.stock>=30)continue;const c=cityIn(h.n,h.reg);add({id:"h_"+h.id,t:"Rupture de médicaments : "+h.n,d:"Stocks à "+Math.round(h.stock)+" sur 100 ; les patients achètent eux-mêmes leurs médicaments.",reg:h.reg,ville:h.ville||(c&&c.v),src:"Hôpital",sev:3,min:"MINSANTE",hop:h.id})}
  // dossiers du portefeuille
  if(window.DOSS)for(const d of DOSS.open(S))add({id:"d_"+d.id,t:d.t,d:d.d+(d.cause?" Blocage : "+d.cause+".":""),reg:d.reg||null,ville:null,src:"Mes dossiers",sev:d.urg||2,min:d.min||null,doss:d.id});
  // promesses de terrain
  for(const e of S.engagements||[])if(!e.done)add({id:"e_"+e.id,t:"Promesse : "+e.t,d:"Engagement pris à "+(e.ville||"?")+", à tenir avant le "+G.dayLabel(e.due)+".",reg:e.reg||null,ville:e.ville||null,src:"Engagement",sev:e.late?3:2});
  return L.filter(p=>!(S.esc&&S.esc[p.id]&&S.esc[p.id].ok))};
const regName=id=>id&&CM.REG[id]?CM.REG[id].n:"Tout le pays";
const dot=s=>s>=3?"🔴":s===2?"🟠":"🟢";
PB.card=function(S){if(!S||S.phase!=="play")return"";const L=PB.all(S);if(!L.length)return"";const by={};for(const p of L)if(p.reg)by[p.reg]=(by[p.reg]||0)+1;
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,4);
  return '<div class="card" data-pbopen role="button" tabindex="0" style="cursor:pointer"><div class="row" style="justify-content:space-between"><b>🧭 Problèmes et instructions</b><span class="small muted">Par région ▸</span></div><div class="small">'+L.length+' problèmes suivis'+(top.length?" · "+top.map(([r,n])=>esc(CM.REG[r].n)+" "+n).join(" · "):"")+'</div><div class="small muted">Choisissez un problème, une ville ou un village pour donner vos instructions.</div></div>'};
PB.bindCard=function(S,root){(root||document).querySelectorAll("[data-pbopen]").forEach(c=>{c.onclick=()=>PB.sheet(S);c.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();PB.sheet(S)}}})};
PB.sheet=function(S,o){o=o||{};document.querySelectorAll(".sheet[data-pb]").forEach(x=>x.remove());const all=PB.all(S);const q=norm(o.q||"");
  const L=all.filter(p=>(!o.reg||p.reg===o.reg)&&(!o.ville||norm(p.ville||"")===norm(o.ville))&&(!q||norm(p.t+" "+p.d+" "+(p.ville||"")+" "+regName(p.reg)).includes(q)));
  const cnt={};for(const p of all)cnt[p.reg||"_"]=(cnt[p.reg||"_"]||0)+1;
  const chips='<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small'+(!o.reg?" primary":"")+'" data-pbr="">Tout le pays ('+all.length+')</button>'+CM.REGIONS.map(r=>'<button class="btn small'+(o.reg===r.id?" primary":"")+'" data-pbr="'+r.id+'" aria-pressed="'+(o.reg===r.id)+'">'+esc(r.n)+' ('+(cnt[r.id]||0)+')</button>').join("")+'</div>';
  const item=p=>'<button class="choice" data-pbi="'+esc(p.id)+'"><span class="t">'+dot(p.sev)+' '+esc(p.t)+'</span><span class="d">'+(own(p)&&PB.esc?(PB.esc(S,p).l>=4?"🔺 <b>À votre niveau</b> · ":"Géré par "+esc(authName(S,p,PB.esc(S,p).l))+" · "):"")+esc(p.src)+(o.reg?"":" · "+esc(regName(p.reg)))+(p.ville?" · "+esc(p.ville):"")+'</span></button>';
  let body="";
  if(o.reg){const r=CM.REG[o.reg];const groups={};for(const p of L){const k=p.ville||"";(groups[k]=groups[k]||[]).push(p)}
    const places=[""].concat((r.villes||[]).filter(v=>groups[v]),Object.keys(groups).filter(k=>k&&!(r.villes||[]).includes(k)));const seen=new Set();
    body='<p class="small muted">'+esc(r.desc||"")+'</p><button class="btn" data-pbc="'+o.reg+'|">✍️ Donner une instruction pour toute la région '+esc(r.n)+'</button>'+
     places.filter(k=>{if(seen.has(k))return false;seen.add(k);return true}).map(k=>{const g=groups[k]||[];if(!g.length&&k)return"";return '<span class="eyebrow">'+(k?"📍 "+esc(k):"Toute la région")+' ('+g.length+')</span>'+(k?'<button class="btn small" data-pbc="'+o.reg+'|'+esc(k)+'">✍️ Instruction pour '+esc(k)+'</button>':"")+'<div class="choices">'+g.sort((a,b)=>b.sev-a.sev).map(item).join("")+'</div>'}).join("")+
     '<span class="eyebrow">Autres villes et villages de la région</span><div class="row" style="gap:6px;flex-wrap:wrap">'+(r.villes||[]).filter(v=>!groups[v]).map(v=>'<button class="btn small ghost" data-pbc="'+o.reg+'|'+esc(v)+'">✍️ '+esc(v)+'</button>').join("")+'<button class="btn small ghost" data-pbcv="'+o.reg+'">✍️ Autre village…</button></div>'}
  else{const top=S.mode==="pres"?L.filter(p=>own(p)&&PB.esc(S,p).l>=4||p.bureau):[];const nat=L.filter(p=>!p.reg&&!top.includes(p));const loc=L.filter(p=>p.reg&&!top.includes(p)).sort((a,b)=>b.sev-a.sev);
    body=(top.length?'<span class="eyebrow">🔺 Remontés à la Présidence ('+top.length+')</span><div class="choices">'+top.map(item).join("")+'</div>':"")+(nat.length?'<span class="eyebrow">Au niveau national ('+nat.length+')</span><div class="choices">'+nat.map(item).join("")+'</div>':"")+'<span class="eyebrow">Dans les régions ('+loc.length+')</span><div class="choices">'+loc.slice(0,30).map(item).join("")+'</div>'+(loc.length>30?'<p class="small muted">Choisissez une région pour voir tous ses problèmes.</p>':"")+
     '<button class="btn" data-pbc="|">✍️ Donner une instruction pour tout le pays</button>'}
  G.sheet('<span class="eyebrow">'+(o.reg?"Région "+esc(regName(o.reg)):"Carte des problèmes")+'</span><h3 class="h2">Problèmes et instructions</h3>'+
   '<input type="search" data-pbq placeholder="Rechercher : réfugiés, eau, Bertoua, route…" value="'+esc(o.q||"")+'" aria-label="Rechercher un problème" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit">'+chips+body,el=>{el.dataset.pb="1";el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-pbr]").forEach(b=>b.onclick=()=>PB.sheet(S,{reg:b.dataset.pbr||null,q:o.q}));
    const qi=el.querySelector("[data-pbq]");let tm=null;qi.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{PB.sheet(S,{reg:o.reg,q:qi.value});const n=document.querySelector(".sheet[data-pb] [data-pbq]");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},350)};
    el.querySelectorAll("[data-pbi]").forEach(b=>b.onclick=()=>{const p=all.find(x=>x.id===b.dataset.pbi);if(p){el.remove();PB.item(S,p,o)}});
    el.querySelectorAll("[data-pbc]").forEach(b=>b.onclick=()=>{const [r,v]=b.dataset.pbc.split("|");el.remove();PB.compose(S,{reg:r||null,ville:v||null,back:o})});
    el.querySelectorAll("[data-pbcv]").forEach(b=>b.onclick=()=>(el.remove(),PB.compose)(S,{reg:b.dataset.pbcv,ville:null,askPlace:true,back:o}))})};
function authority(S,p){const A=[];if(S.mode!=="pres"&&S.mode!=="min")return A;
  if(p.min&&S.gov&&S.gov.min&&S.gov.min[p.min]&&!(S.mode==="min"&&S.minis.id===p.min)){const g=S.gov.min[p.min];const m=E.MINISTERES.find(x=>x.id===p.min);const sx=window.SYS.sexe(g.n);A.push({k:"min",id:p.min,min:p.min,n:g.n,sexe:sx,lab:window.SYS.accord("le ministre "+window.SYS.deM(m?m.n:p.min)+(m?m.n:p.min),sx)})}
  if(p.reg&&S.org){const gv=S.org.gouv.find(x=>x.reg===p.reg);if(gv){const sx=window.SYS.sexe(gv.n);A.push({k:"gouverneur",org:{k:"gouverneur",id:gv.id},n:gv.n,sexe:sx,reg:p.reg,lab:window.SYS.accord("le gouverneur de la région "+regName(p.reg),sx)})}
    if(p.ville){const pf=S.org.pref.find(x=>norm(x.ville)===norm(p.ville));if(pf){const sx=window.SYS.sexe(pf.n);A.push({k:"prefet",org:{k:"prefet",id:pf.id},n:pf.n,sexe:sx,reg:p.reg,lab:window.SYS.accord("le préfet de "+pf.ville,sx)})}}}
  return A}
PB.item=function(S,p,back){const lieu=p.ville?p.ville+" ("+regName(p.reg)+")":p.reg?"région "+regName(p.reg):"tout le pays";const Au=authority(S,p);
  const lvl=own(p)?PB.esc(S,p):null;const P=PB.prop(S,p);const canDir=(S.mode==="pres"||S.mode==="min")&&!p.bureau;
  const acts=(canDir?[["okp","✅ Approuver la proposition du ministre ("+String(P.cout).replace(".",",")+" Md)"]]:[]).concat(lvl&&lvl.l>=4&&S.mode==="pres"?[["backm","↩️ Renvoyer au ministre (qu'il règle à son niveau)"]]:[]).concat([["dir","📜 Donner une autre instruction"],["note","📝 Demander une note chiffrée avec propositions"]]).concat(Au.map((a,i)=>["call"+i,"📞 Appeler "+a.lab+" ("+a.n+")"]));
  if(p.reg&&window.VOY)acts.push(["go","🚗 Se rendre sur place ("+(p.ville||CM.REG[p.reg].chef)+")"]);
  if(p.actu)acts.push(["actu","📰 Ouvrir l'article et ses options"]);if(p.doss)acts.push(["doss","🗂️ Ouvrir le dossier"]);if(p.hop)acts.push(["hop","🏥 Ouvrir la fiche de l'hôpital"]);if(p.bureau)acts.push(["bur","🗂️ Voir les décisions proposées sur le bureau"]);
  G.sheet('<span class="eyebrow">'+esc(p.src)+' · '+esc(lieu)+'</span><h3 class="h2">'+esc(p.t)+'</h3><p>'+esc(p.d)+'</p>'+(lvl?'<p class="small"><b>Niveau de traitement :</b> '+(lvl.l>=4?"🔺 remonté à la Présidence":esc(authName(S,p,lvl.l)))+' depuis le '+esc(G.dayLabel(lvl.t0))+(lvl.l<4?" ; s\'il n\'est pas réglé, il remontera au niveau supérieur.":"")+'</p>':"")+
   (p.bureau&&S.cur!=null?PB.adviceHTML(S,CM.DOSSIERS[S.cur]):'<div class="card" style="gap:4px;background:var(--panel3)"><b>📋 Proposition du '+esc(P.lab)+'</b><span class="small">'+esc(P.n)+' propose '+(/^[aeéiouh]/i.test(P.text)?"d'":"de ")+esc(P.text)+'. Coût estimé : '+esc(mdS(P.cout))+' de FCFA.</span></div>')+(p.min?'<p class="small muted">Autorité compétente : ministère '+esc(window.SYS.deM((E.MINISTERES.find(m=>m.id===p.min)||{n:p.min}).n)+(E.MINISTERES.find(m=>m.id===p.min)||{n:p.min}).n)+'</p>':"")+
   '<div class="choices">'+acts.map(([k,l])=>'<button class="btn" data-pa="'+k+'">'+esc(l)+'</button>').join("")+'</div><button class="btn ghost" data-pback>← Retour à la liste</button>',el=>{el.dataset.pb="1";el.setAttribute("data-noinstr","");
    el.querySelector("[data-pback]").onclick=()=>{el.remove();PB.sheet(S,back||{reg:p.reg})};
    el.querySelectorAll("[data-pa]").forEach(b=>b.onclick=()=>{const k=b.dataset.pa;el.remove();const rep=m=>{say(m);G.toast(m.slice(0,120))};
      if(k==="okp")return PB.approve(S,p);if(k==="backm")return PB.back(S,p);
      if(k==="dir")return PB.compose(S,{p,reg:p.reg,ville:p.ville,back});
      if(k==="note"&&window.NOTE)return NOTE.handle(S,"Je veux une note chiffrée avec des propositions sur : "+p.t+" ("+lieu+")",rep,{ctx:p.t});
      if(k.startsWith("call")){const a=Au[+k.slice(4)];if(window.CAB&&a.k==="min"){const st=CAB.status(S,a);if(st&&!st.ok)return CAB.unavailable(S,a,st,{objet:p.t,when:"maintenant"})}
        return RENC.open(S,{kind:"officiel",n:a.n,sexe:a.sexe,lab:a.lab.replace(/^(le|la) /,""),min:a.min||null,org:a.org||null,reg:a.reg||p.reg||"CE",ville:p.ville||(p.reg?CM.REG[p.reg].chef:"Yaoundé"),lieu:"au téléphone",sujet:p.t,tel:true,contexte:p.d})}
      if(k==="go")return VOY.ask(S,{reg:p.reg,v:p.ville&&window.VOY&&VOY.CITIES.some(c=>c.n===p.ville)?p.ville:CM.REG[p.reg].chef},{});
      if(k==="actu"){const it=S.inbox.find(i=>i.actu===p.actu);if(it)return window.SYS.openMail(S,it.id);return G.toast("Article introuvable dans votre courrier.")}
      if(k==="doss")return DOSS.sheet(S,p.doss);if(k==="hop")return VIE.openOrg(S,{k:"hop",id:p.hop});
      if(k==="bur"){if(G.setTab)G.setTab("bureau");G.render()}})})};
/* rédiger une instruction pour un problème ou un lieu */
PB.compose=function(S,o){const p=o.p;const lieu=o.ville?o.ville+" (région "+regName(o.reg)+")":o.reg?"la région "+regName(o.reg):"tout le pays";
  const pre=p?"Je veux que ":"Je veux que ";const hint=p?"Problème : « "+p.t+" »":"Lieu : "+lieu;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  G.sheet('<span class="eyebrow">Instruction · '+esc(lieu)+'</span><h3 class="h2">'+esc(p?p.t:"Nouvelle instruction")+'</h3><p class="small muted">'+esc(hint)+'</p>'+
   (o.reg?'<label class="f" for="pcLieu">Lieu précis (ville, village ou quartier, facultatif)<input id="pcLieu" value="'+esc(o.ville||"")+'" placeholder="ex. Garoua-Boulaï, Gado-Badzéré…"></label>':"")+
   '<label class="f" for="pcTx">Votre instruction (écrite ou dictée)<textarea id="pcTx" data-grow rows="3" style="width:100%">'+esc(pre)+'</textarea></label>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap">'+["une aide d'urgence soit apportée","une mission d'inspection se rende sur place","un plan d'action chiffré me soit présenté","les responsables soient entendus","les travaux démarrent"].map(x=>'<button class="btn small ghost" data-pcs="'+esc(x)+'">+ '+esc(x)+'</button>').join("")+'</div>'+
   '<div class="row" style="gap:8px;flex-wrap:wrap"><label class="small">Délai <select id="pcJ"><option value="">selon la mesure</option><option value="2">48 heures</option><option value="7">7 jours</option><option value="15">15 jours</option><option value="30">30 jours</option><option value="90">3 mois</option></select></label>'+
   '<label class="small">Compte rendu <select id="pcCr"><option value="ecrit">par écrit, pour exploitation</option><option value="audience">en audience</option></select></label></div>'+
   '<div class="row"><button class="btn primary" id="pcGo">Donner l\'instruction</button>'+(SR?'<button class="btn" id="pcMic" aria-pressed="false">🎙 Dicter</button>':"")+'<button class="btn ghost" id="pcBack">← Retour</button></div><p class="small muted" id="pcHint">Votre instruction s\'appliquera à '+esc(lieu)+'. Si elle a un impact national ou dépasse les moyens de l\'exécutant, un plan vous sera soumis pour validation avant exécution.</p>',el=>{el.dataset.pb="1";el.setAttribute("data-noinstr","");
    const tx=el.querySelector("#pcTx");setTimeout(()=>{tx.focus();tx.setSelectionRange(tx.value.length,tx.value.length)},60);
    el.querySelectorAll("[data-pcs]").forEach(b=>b.onclick=()=>{const v=tx.value.trim();tx.value=(/^je veux que\s*$/i.test(v)?"Je veux que ":v+(/[.,;]$/.test(v)||!v?" ":", et que "))+b.dataset.pcs;tx.focus()});
    el.querySelector("#pcBack").onclick=()=>{el.remove();if(p)PB.item(S,p,o.back);else PB.sheet(S,o.back||{reg:o.reg})};
    const mic=el.querySelector("#pcMic");if(mic&&window.MIC){const ui=st=>{mic.textContent=MIC.want?"⏹ Micro activé":"🎙 Dicter";mic.classList.toggle("micon",MIC.want);mic.setAttribute("aria-pressed",MIC.want?"true":"false")};
      MIC.bind({onText:t=>{const v=tx.value.trim();tx.value=(/^je veux que$/i.test(v)?"Je veux que ":v?v+" ":"")+t},onState:ui,alive:()=>el.isConnected});mic.onclick=()=>{MIC.toggle();ui()}}
    el.querySelector("#pcGo").onclick=async()=>{let v=tx.value.trim();if(v.replace(/^je veux que\s*/i,"").length<4)return G.toast("Écrivez ou dictez votre instruction.");
      const j=el.querySelector("#pcJ").value;if(j&&!/\bdans \d+|\bsous \d+|\d+ ?(h|heures?|jours?|mois)\b/i.test(v))v+=" dans "+(j==="2"?"48 heures":j==="90"?"3 mois":j+" jours");
      const li=el.querySelector("#pcLieu");if(li)o.ville=li.value.trim()||null;
      if(o.ville&&!norm(v).includes(norm(o.ville)))v+=" (à "+o.ville+")";else if(o.reg&&!o.ville&&!norm(v).includes(norm(regName(o.reg))))v+=" (région "+regName(o.reg)+")";
      const cr=el.querySelector("#pcCr").value;el.remove();const rep=m=>{say(m);G.toast(m.slice(0,140))};const n0=(S.directives||[]).length;
      await DIR.handle(S,v,rep,{force:true,ctx:p?p.t:"Instruction pour "+lieu,nat:!o.reg});const L=S.directives||[];if(L.length>n0){const d=L[L.length-1];if(o.reg)d.reg=o.reg;if(o.ville)d.ville=o.ville;d.cr=cr;if(p&&p.min&&S.mode==="pres"&&!d.resp)d.resp=p.min;G.render()}}})};

/* ---------- remontée des problèmes : mairie → préfecture → gouverneur → ministre → Présidence ---------- */
const mdS=v=>v<1?Math.round(v*1000)+" millions":String(Math.round(v*10)/10).replace(".",",")+" milliard"+(v>=2?"s":"");
const LV=["la mairie","la sous-préfecture et la préfecture","le gouverneur de région","le ministre compétent","la Présidence"];
PB.LV=LV;
const PROP=[
 [/(se plaignent|plainte|abus|racket|arbitraire|interdictions? de reunion)/,"diligenter une inspection, entendre les plaignants et sanctionner les responsables si les faits sont avérés",.05,"MINATD"],
 [/(poignard|meurtre|assassin|homicide|\bviol\b|soupconne|suspect)/,"laisser la justice suivre son cours : enquête de police judiciaire, poursuites et soutien aux familles",.01,"MINJUSTICE"],
 [/(attaque|embuscade|boko|enlev|separatist|insecurit|braquage|otage|ville morte|combat|tues? par|tirs?)/,"renforcer les patrouilles, installer un poste avancé et relancer les comités de vigilance",2,"MINDEF"],
[/(refugi|deplace)/,"aménager des points d'eau, 30 salles de classe et un centre de santé pour les communes d'accueil, avec l'appui du HCR",1.8,"MINATD"],
 [/(\beau\b|forage|potable|camwater|robinet)/,"réaliser 20 forages équipés et réparer les pompes en panne",.5,"MINEE"],
 [/(medicament|rupture|hopital|sante|cholera|epidemi|paludisme)/,"envoyer d'urgence des médicaments et une équipe médicale, et régler les factures de la CENAME",.6,"MINSANTE"],
 [/(piste|route|pont|axe|impraticable|nid)/,"réhabiliter les tronçons les plus dégradés (30 km) avec le génie militaire et des PME locales",3,"MINTP"],
 [/(delestage|electricit|coupure|courant)/,"installer des groupes électrogènes et accélérer la réparation des lignes avec ENEO",1.5,"MINEE"],
 [/(ecole|enseignant|classe|eleve)/,"construire 10 salles de classe et affecter des enseignants",.4,"MINEDUB"],
 [/(prix|vie chere|carburant|penurie)/,"contrôler les prix et réapprovisionner les marchés",.2,"MINCOMMERCE"],
 [/(accident|collision|\bbus\b|naufrage|pirogue|chauffard)/,"renforcer les contrôles, prendre en charge les victimes et enquêter sur les responsabilités",.1,"MINT"],
 [/(feminicide|violence)/,"ouvrir un centre d'accueil des victimes, poursuivre systématiquement les auteurs et sensibiliser",.3,"MINPROFF"],
 [/(bois|foret|grume|braconn)/,"mener des contrôles conjoints, saisir le bois illégal et appliquer les amendes",.1,"MINFOF"],
 [/(\bor\b|mine|orpaill|carriere)/,"encadrer l'orpaillage, sécuriser les sites et ouvrir un comptoir d'achat de l'État",.3,"MINMIDT"],
 [/(greve|syndicat|salaire|prime|arriere)/,"ouvrir le dialogue et proposer un calendrier de paiement écrit",.8,"MINTSS"],
 [/(inondation|glissement|incendie|sinistr)/,"reloger les sinistrés, distribuer des vivres et curer les drains",.5,"MINATD"]];
PB.prop=function(S,p){const t=norm(p.t+" "+p.d);const m=PROP.find(x=>x[0].test(t));const min=(m&&/inspection|justice suivre/.test(m[1]))?(/police|commissaire/.test(t)&&/inspection/.test(m[1])?"DGSN":m[3]):(p.min||(m?m[3]:"MINATD"));const me=E.MINISTERES.find(x=>x.id===min);
  const g=S.gov&&S.gov.min&&S.gov.min[min];const n=g?g.n:"le ministre";const lieu=p.ville?" à "+p.ville:p.reg?" dans la région "+regName(p.reg):" dans tout le pays";
  const cout=Math.round((m?m[2]:.2)*(p.reg?1:5)*10)/10;const act=m?m[1]:"envoyer une mission d'évaluation et présenter un plan d'action chiffré sous 15 jours";
  return{min,n,lab:"ministre "+window.SYS.deM(me?me.n:min)+(me?me.n:min),act,lieu,cout,text:act+lieu}};
const own=p=>!(p.doss||p.bureau||p.src==="Problème de fond"||String(p.id).startsWith("e_")||(p.actu&&p.sev<3));
function lv0(p){if(p.bureau)return 4;if(!p.reg)return p.sev>=3?3:2;if(p.src==="Problème de fond"||p.hop)return 3;if(p.actu)return p.sev>=3?2:1;return p.sev>=3?1:0}
PB.esc=function(S,p){S.esc=S.esc||{};return S.esc[p.id]||(S.esc[p.id]={l:lv0(p),t0:S.day,next:S.day+6+Math.random()*8})};
function authPerf(S,p,l){if(!S.org)return 50;if(l===1&&p.ville){const x=S.org.pref.find(y=>norm(y.ville)===norm(p.ville))||S.org.pref.find(y=>y.reg===p.reg);return x?x.perf:50}if(l===2){const x=S.org.gouv.find(y=>y.reg===p.reg);return x?x.perf:50}return 55}
function authName(S,p,l){if(!S.org)return LV[l];if(l===0)return"la mairie de "+(p.ville||(p.reg?CM.REG[p.reg].chef:"la commune"));if(l===1){const x=(p.ville&&S.org.pref.find(y=>norm(y.ville)===norm(p.ville)))||S.org.pref.find(y=>y.reg===p.reg);return x?"le préfet "+x.n+" ("+x.ville+")":LV[1]}
  if(l===2){const x=S.org.gouv.find(y=>y.reg===p.reg);return x?"le gouverneur "+x.n:LV[2]}if(l===3){const P=PB.prop(S,p);return P.n+", "+P.lab}return"la Présidence"}
PB.level=(S,p)=>{const e=PB.esc(S,p);return{l:e.l,by:authName(S,p,e.l),since:e.t0,ok:e.ok}};
PB.tick=function(S){if(!S||S.phase!=="play"||!S.mood)return;S.esc=S.esc||{};for(const p of PB.all(S)){if(!own(p))continue;const e=PB.esc(S,p);if(e.ok||e.l>=4||S.day<e.next)continue;
   const pr=[.6,.55,.5,.45][e.l]*Math.max(.4,Math.min(1.4,authPerf(S,p,e.l)/55));
   if(Math.random()<pr){e.ok=S.day;e.by=authName(S,p,e.l);if(p.reg)window.SYS.cause(S,p.reg,"Réglé par "+e.by+" : "+p.t.slice(0,60),1.5,"local");continue}
   e.l++;e.t0=S.day;e.next=S.day+8+Math.random()*8;
   if(e.l===3&&S.mode==="min"&&S.minis&&PB.prop(S,p).min===S.minis.id){const P=PB.prop(S,p);window.SYS.inbox(S,{from:"Vos directeurs",t:"Problème remonté à votre ministère : "+p.t.slice(0,70),b:p.d+"\nLe gouverneur n'a pas pu le régler. Proposition de vos services : "+P.text+" (coût estimé : "+mdS(P.cout)+" de FCFA).",k:"alerte",pb:p.id,reg:p.reg})}
   if(e.l===4&&S.mode==="pres"){const P=PB.prop(S,p);window.SYS.inbox(S,{from:P.n+", "+P.lab,t:"🔺 Remonté à la Présidence : "+p.t.slice(0,70),b:p.d+"\nCe problème n'a pas été réglé par "+LV.slice(0,3).join(", puis ")+", ni par le ministère.\nProposition du "+P.lab+" : "+P.text+". Coût estimé : "+mdS(P.cout)+" de FCFA.",k:"alerte",pb:p.id,reg:p.reg});G.toast("🔺 Remonté à la Présidence : "+p.t.slice(0,60),()=>PB.item(S,p))}}};
/* approuver la proposition du ministre */
PB.approve=async function(S,p){const P=PB.prop(S,p);if(!window.DIR)return;const n0=(S.directives||[]).length;const rep=m=>{say(m);G.toast(m.slice(0,140))};
  await DIR.handle(S,"Je veux "+P.text,rep,{force:true,cout:P.cout,direct:S.mode==="pres",nat:!p.reg,ctx:p.t});const L=S.directives||[];if(L.length>n0){const d=L[L.length-1];if(p.reg)d.reg=p.reg;if(p.ville)d.ville=p.ville;if(S.mode==="pres")d.resp=P.min;const e=PB.esc(S,p);e.dir=d.id;G.render()}};
PB.back=function(S,p){const e=PB.esc(S,p);e.l=3;e.next=S.day+7;e.t0=S.day;G.toast("Renvoyé au ministre : il doit régler ce problème à son niveau, sous 7 jours.");G.render()};
PB.mailActs=function(S,it){if(!it.pb)return"";return'<button class="btn primary" data-pbx="ok">✅ Approuver la proposition du ministre</button><button class="btn" data-pbx="other">✍️ Donner une autre instruction</button>'+(S.mode==="pres"?'<button class="btn ghost" data-pbx="back">↩️ Renvoyer au ministre</button>':"")};
PB.mailBind=function(S,it,el){el.querySelectorAll("[data-pbx]").forEach(b=>b.onclick=()=>{const p=PB.all(S).find(x=>x.id===it.pb);el.remove();if(!p)return G.toast("Ce problème est déjà réglé.");const k=b.dataset.pbx;if(k==="ok")PB.approve(S,p);else if(k==="back")PB.back(S,p);else PB.compose(S,{p,reg:p.reg,ville:p.ville})})};
/* avis du ministre sur un dossier du bureau présidentiel */
PB.advice=function(S,d){const k=d.id;S.adv=S.adv||{};if(S.adv[k]!=null)return S.adv[k];const min=minFromText(d.f)||"MINFI";const g=S.gov&&S.gov.min&&S.gov.min[min];const tr=g&&window.CAB?CAB.trait(g.n):"cooperatif";
  let best=0,bs=-1e9;d.c.forEach((c,i)=>{const e=c.e||{};let s=Object.values(e).reduce((a,v)=>a+v,0);const dt=(c.n&&c.n.dette)||0;s-=dt/(tr==="prudent"?40:tr==="ambitieux"?160:80);if(tr==="prudent")s-=Object.values(e).filter(v=>v<0).reduce((a,v)=>a+Math.abs(v),0)*.5;if(s>bs){bs=s;best=i}});
  return(S.adv[k]={i:best,n:g?g.n:"Le ministre",min,tr})};
PB.adviceHTML=function(S,d){const a=PB.advice(S,d);const c=d.c[a.i];const me=E.MINISTERES.find(x=>x.id===a.min);if(!c)return"";
  const byMin=!!minFromText(d.f);const sg=!byMin&&S.gov&&S.gov.sg?S.gov.sg.n:null;
  return'<div class="card" style="gap:4px;background:var(--panel3)"><b>📋 Proposition '+(byMin?"du ministre "+esc(window.SYS.deM(me?me.n:a.min)+(me?me.n:a.min)):"du "+esc(String(d.f).toLowerCase()))+'</b><span class="small">'+esc(byMin?a.n:(sg||"Le secrétaire général"))+' recommande : « '+esc(c.t)+' »'+(c.n&&c.n.dette?", pour un coût d'environ "+esc(String(c.n.dette))+" milliards":"")+'.</span><span class="small muted">Vous restez libre de choisir une autre option ou de donner une autre instruction.</span></div>'};

/* à la voix : « quels sont les problèmes de l'Est », « problèmes à Bertoua » */
PB.voice=function(S,t,reply,close){if(!/\b(problemes?|difficultes|crises?|soucis)\b/.test(t)||/mes dossiers/.test(t))return false;if(!/(quels?|quelles?|liste|montre|affiche|voir|ou sont|y a t il|il y a|situation)/.test(t)&&!/^(les )?problemes/.test(t))return false;
  const reg=window.SAV&&SAV.region?SAV.region(t):null;let ville=null;if(window.VOY)for(const c of VOY.CITIES)if(new RegExp("\\b"+norm(c.n)+"\\b").test(t)){ville=c.n;break}
  const L=PB.all(S).filter(p=>(!reg||p.reg===reg)&&(!ville||norm(p.ville||"")===norm(ville)));if(close)close();PB.sheet(S,{reg:reg||null,ville:null,q:ville||""});
  reply((ville?"À "+ville:reg?"Dans la région "+regName(reg):"Dans le pays")+", "+L.length+" problème"+(L.length>1?"s":"")+" suivi"+(L.length>1?"s":"")+(L.length?" : "+L.sort((a,b)=>b.sev-a.sev).slice(0,3).map(p=>p.t).join(" ; ")+".":".")+" Choisissez-en un pour donner vos instructions.");return true};
})();
