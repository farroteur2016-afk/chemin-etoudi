/* Chemin d'Etoudi — équilibre femmes-hommes : le jeu connaît le genre de chaque responsable (ministres, DG, gouverneurs,
   préfets, directeurs d'hôpitaux, commissaires), affiche la parité, et permet de la corriger : nominations au choix,
   remaniement ciblé, ou directive « je veux 30 % de femmes au gouvernement ». Au départ, comme dans la réalité, peu de femmes. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const esc=G.esc,clamp=G.clamp,pick=G.pick;
const GENRE={};window.GENRE=GENRE;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const sx=n=>window.SYS.sexe(n);const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};
const strip=n=>String(n||"").replace(/^(Colonel|Commissaire)\s+/,"");

function groups(S){const G2=[];
  if(S.gov){const L=Object.entries(S.gov.min).map(([id,g])=>({id,n:g.n,poste:(E.MINISTERES.find(m=>m.id===id)||{}).n||id,ref:g,champ:"n"}));if(S.gov.pm)L.unshift({id:"pm",n:S.gov.pm.n,poste:"Premier ministre",ref:S.gov.pm,champ:"n"});G2.push({k:"gouv",lab:"Gouvernement",L})}
  if(S.org){const O=S.org;
    G2.push({k:"dg",lab:"Directions générales des entreprises publiques",L:O.ent.map(e=>({id:e.id,n:e.dg,poste:e.n,ref:e,champ:"dg"}))});
    G2.push({k:"gouverneurs",lab:"Gouverneurs de région",L:O.gouv.map(g=>({id:g.id,n:g.n,poste:CM.REG[g.reg].n,ref:g,champ:"n"}))});
    G2.push({k:"prefets",lab:"Préfets",L:O.pref.map(p=>({id:p.id,n:p.n,poste:p.ville,ref:p,champ:"n"}))});
    G2.push({k:"hop",lab:"Directions d'hôpitaux",L:O.hop.map(h=>({id:h.id,n:h.dir,poste:h.n,ref:h,champ:"dir"}))});
    G2.push({k:"comm",lab:"Commissaires centraux",L:O.comm.map(c=>({id:c.id,n:strip(c.n),poste:c.ville,ref:c,champ:"n",pre:"Commissaire "}))})}
  for(const g of G2){g.f=g.L.filter(x=>sx(x.n)==="f").length;g.t=g.L.length;g.pct=g.t?Math.round(g.f*100/g.t):0}return G2}
GENRE.groups=groups;
const pctC=p=>p>=40?"var(--ok,#43c47c)":p>=30?"var(--warn,#f0a93a)":"var(--bad,#ef5350)";

GENRE.card=function(S){if(S.mode!=="pres"&&S.mode!=="min")return"";const Gs=groups(S);if(!Gs.length)return"";const g=Gs[0];
  return '<div class="card"><div class="row" style="justify-content:space-between"><b>⚖️ Équilibre femmes-hommes</b><button class="btn small" data-genre>Détails</button></div><div class="small">'+
   Gs.slice(0,3).map(x=>esc(x.lab.split(" ")[0])+' : <b style="color:'+pctC(x.pct)+'">'+x.f+'/'+x.t+' ('+x.pct+' %)</b>').join(" · ")+'</div></div>'};
GENRE.bindCard=function(S,root){(root||document).querySelectorAll("[data-genre]").forEach(b=>b.onclick=()=>GENRE.sheet(S))};

GENRE.sheet=function(S){const Gs=groups(S);const pres=S.mode==="pres";
  G.sheet('<span class="eyebrow">Parité</span><h3 class="h2">Équilibre femmes-hommes</h3><p class="small muted">Objectif de référence : au moins 30 % de femmes aux postes de décision (engagements de l\'Union africaine, protocole de Maputo). La parité est à 50 %.</p>'+
   Gs.map(g=>'<div><div class="row" style="justify-content:space-between"><span class="small"><b>'+esc(g.lab)+'</b></span><span class="small" style="color:'+pctC(g.pct)+'">'+g.f+' femmes sur '+g.t+' · '+g.pct+' %</span></div><div class="bar"><i style="width:'+g.pct+'%;background:'+pctC(g.pct)+'"></i></div></div>').join("")+
   '<span class="eyebrow">Membres du gouvernement</span><div class="kv">'+Gs[0].L.map(x=>'<span>'+esc(x.poste)+'</span><b>'+(sx(x.n)==="f"?"♀ ":"♂ ")+esc(x.n)+(window.CAB?' · <span class="muted">'+esc(CAB.traitLab(x.n))+'</span>':"")+'</b>').join("")+'</div>'+
   (pres?'<div class="row"><button class="btn primary" data-gpar="30">Remanier pour atteindre 30 % de femmes</button><button class="btn" data-gpar="50">Viser la parité (50 %)</button></div>':'<p class="small muted">Seul le président de la République nomme les membres du gouvernement.</p>'),el=>{
    el.querySelectorAll("[data-gpar]").forEach(b=>b.onclick=()=>{el.remove();GENRE.apply(S,"gouv",+b.dataset.gpar,m=>{say(m);G.toast(m.slice(0,120))})})})};

/* rééquilibrage : on remplace, dans le groupe, les hommes les moins performants par des femmes jusqu'à la cible */
GENRE.apply=function(S,k,cible,reply){const g=groups(S).find(x=>x.k===k);if(!g)return;const need=Math.ceil(g.t*cible/100)-g.f;
  if(need<=0){reply(g.lab+" : déjà "+g.pct+" % de femmes, l'objectif de "+cible+" % est atteint.");return}
  const score=x=>x.ref.comp!=null?x.ref.comp:x.ref.perf!=null?x.ref.perf:50;
  const men=g.L.filter(x=>sx(x.n)==="m"&&x.id!=="pm").sort((a,b)=>score(a)-score(b)).slice(0,need);const noms=[];
  for(const x of men){const r=x.ref.reg||pick(CM.REGIONS).id;const nn=window.SYS.nom(r,"f");x.ref[x.champ]=(x.pre||"")+nn;if(x.ref.comp!=null)x.ref.comp=Math.round(G.rnd(55,82));if(x.ref.perf!=null)x.ref.perf=Math.round(G.rnd(50,75));if(x.ref.loy!=null)x.ref.loy=78;noms.push(nn+" ("+x.poste+")")}
  const g2=groups(S).find(x=>x.k===k);const big=k==="gouv";
  if(S.st){S.st.pop=clamp(S.st.pop+(big?2:1),0,100);S.st.soc=clamp(S.st.soc+(big?1.5:.8),0,100)}for(const R of CM.REGIONS)window.SYS.cause(S,R.id,"Plus de femmes aux responsabilités",big?1:.5,"parite");
  const msg=(big?"Remaniement ministériel : ":"Nominations : ")+men.length+" femme"+(men.length>1?"s":"")+" nommée"+(men.length>1?"s":"")+". "+g2.lab+" : "+g2.f+" femmes sur "+g2.t+" ("+g2.pct+" %).";
  window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:(big?"Décret portant réaménagement du gouvernement":"Décret de nominations")+" — parité",b:msg+"\nNouvelles nommées : "+noms.join(", ")+".\nLes associations de femmes saluent la décision ; certains barons du régime grincent des dents.",k:"info",read:true});
  reply(msg);G.render()};

/* commandes : « combien de femmes au gouvernement ? », « je veux 30 % de femmes au gouvernement » */
const RE=/(parite|equilibre (du |de |des )?genre|equilibre hommes? femmes|combien de femmes|nombre de femmes|pourcentage de femmes|femmes (au|dans le|du) gouvernement|plus de femmes|\d+ ?% de femmes|quota)/;
GENRE.matches=t=>RE.test(norm(t));
GENRE.handle=function(S,raw,reply){if(!S||S.phase!=="play")return false;const t=norm(raw);if(!RE.test(t))return false;reply=reply||say;
  const k=/\bdg\b|directeurs? generaux|entreprises/.test(t)?"dg":/gouverneur/.test(t)?"gouverneurs":/prefet/.test(t)?"prefets":/hopita/.test(t)?"hop":/commissaire/.test(t)?"comm":"gouv";
  const imper=/je veux|j exige|j ordonne|ordonne|il faut|nommez|nommer|atteindre|remani|faites|que le gouvernement|que les/.test(t);
  if(!imper){const Gs=groups(S);const g=Gs.find(x=>x.k===k);reply(g.lab+" : "+g.f+" femmes sur "+g.t+", soit "+g.pct+" %."+(k==="gouv"?" "+Gs.slice(1,3).map(x=>x.lab+" : "+x.pct+" %").join(" ; ")+".":""));return true}
  if(S.mode!=="pres"){reply("Seul le président de la République peut décider de ces nominations. Votre proposition est transmise.");return true}
  const m=t.match(/(\d{1,3}) ?%/);const cible=m?clamp(+m[1],1,100):/parite|moitie/.test(t)?50:30;GENRE.apply(S,k,cible,reply);return true};
})();
