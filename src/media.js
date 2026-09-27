/* Chemin d'Etoudi — médias conventionnels et numériques : invitations sur les plateaux, débats, points de presse,
   réseaux sociaux, invitations diplomatiques, délégation au porte-parole, QCM, discours écrit ou au micro. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const MEDIA={};window.MEDIA=MEDIA;
let uid=1;const nid=()=>"m"+Date.now().toString(36)+(uid++);

/* ---------- paysage médiatique camerounais ---------- */
const OUTLETS=[
 {n:"CRTV Télé",t:"tv",pub:1,reach:1.0},{n:"Canal 2 International",t:"tv",reach:.9},{n:"Equinoxe TV",t:"tv",reach:.85},{n:"STV",t:"tv",reach:.8},{n:"Vision 4",t:"tv",reach:.8},{n:"LTM TV",t:"tv",reach:.6},
 {n:"CRTV Radio (poste national)",t:"radio",pub:1,reach:.9},{n:"Radio Balafon",t:"radio",reach:.5},{n:"Magic FM",t:"radio",reach:.5},{n:"Radio Equinoxe",t:"radio",reach:.5},
 {n:"Cameroon Tribune",t:"presse",pub:1,reach:.4},{n:"Le Messager",t:"presse",reach:.35},{n:"Mutations",t:"presse",reach:.35},{n:"Le Jour",t:"presse",reach:.35},{n:"The Guardian Post",t:"presse",reach:.35},
 {n:"Actu Cameroun",t:"web",reach:.6},{n:"Journal du Cameroun",t:"web",reach:.55},{n:"CamerounWeb",t:"web",reach:.6},{n:"Lebledparle",t:"web",reach:.55},{n:"237online",t:"web",reach:.5}
];
const SOCIAUX=[["Facebook",1],["TikTok",.9],["WhatsApp",.85],["YouTube",.7],["X",.4]];
const FORMATS=[["Vidéo courte",1.2],["Live",1],["Visuel et texte",.8],["Message vocal WhatsApp",.9]];
const SHOWS={tv:["Le Grand Débat du dimanche","Face à la presse","L'Invité du journal de 20 h","Plateau spécial"],radio:["L'Invité de la matinale","Tribune libre"],presse:["Grande interview"],web:["Interview en direct sur la page Facebook"]};
MEDIA.OUTLETS=OUTLETS;

/* ---------- sujets et questions ---------- */
const TOPICS={
 viechere:{n:"La vie chère",ty:"emploi",kw:/(prix|vie ch[eè]re|pouvoir d'achat|riz|huile|carburant|salaire|smig|inflation|march[eé])/gi,hostile:"Les prix du riz et du carburant ont encore augmenté. Qu'avez-vous concrètement à proposer ?"},
 securite:{n:"L'insécurité dans l'Extrême-Nord et à l'Est",ty:"securite",kw:/(s[eé]curit|boko|terror|arm[ée]e|enl[eè]vement|otage|soldat|bir|vigilance)/gi,hostile:"Des villages sont encore attaqués chaque semaine. Qui est responsable ?"},
 anglophone:{n:"La crise anglophone",ty:"paix",kw:/(anglophone|nord-ouest|sud-ouest|bamenda|buea|dialogue|f[eé]d[eé]ral|s[eé]paratis|paix|statut sp[eé]cial)/gi,hostile:"Depuis 2017, des centaines de milliers de déplacés. Faut-il négocier avec les séparatistes ?"},
 electricite:{n:"Les délestages",ty:"electricite",kw:/(électricit|electricit|courant|d[eé]lestage|eneo|barrage|nachtigal|lumi[eè]re|[eé]nergie)/gi,hostile:"Malgré Nachtigal, Douala est dans le noir. Pourquoi ?"},
 corruption:{n:"La corruption",ty:"corruption",kw:/(corruption|d[eé]tournement|[eé]pervier|article 66|transparence|biens|impunit|conac)/gi,hostile:"Des proches du pouvoir sont cités dans des détournements. Que faites-vous ?"},
 jeunes:{n:"L'emploi des jeunes",ty:"emploi",kw:/(jeune|emploi|ch[oô]mage|travail|dipl[oô]m|formation|entreprise|stage|bendskin)/gi,hostile:"Un jeune diplômé sur deux pousse une moto. Qu'avez-vous à lui dire ?"},
 elections:{n:"La transparence des élections",ty:"corruption",kw:/(élection|election|elecam|fraude|bulletin|vote|scrutin|urne|report)/gi,hostile:"Les élections ont encore été reportées. Est-ce démocratique ?"},
 routes:{n:"Les routes et les infrastructures",ty:"routes",kw:/(route|bitum|autoroute|pont|piste|infrastructure|chantier|n3)/gi,hostile:"Les chantiers promis sont abandonnés. Où est passé l'argent ?"},
 sante:{n:"La santé et l'eau potable",ty:"sante",kw:/(sant[eé]|h[oô]pital|m[eé]decin|soins|malad|pharmac|eau potable|forage|chol[eé]ra)/gi,hostile:"On meurt encore faute de soins dans nos villages. Pourquoi ?"},
 dette:{n:"La dette et le budget de l'État",ty:"corruption",kw:/(dette|budget|fmi|emprunt|finances|milliard|imp[oô]t|train de vie)/gi,hostile:"La dette dépasse 44 % du PIB. Le pays est-il en faillite ?"}
};
MEDIA.TOPICS=TOPICS;
const THEME2TOPIC={securite:"securite",paix:"anglophone",federalisme:"anglophone",emploi:"jeunes",electricite:"electricite",routes:"routes",eau:"sante",corruption:"corruption",ecole:"jeunes",sante:"sante",elevage:"viechere"};
MEDIA.topicOfTheme=th=>THEME2TOPIC[th]||"viechere";

function questions(kind,topic,role){
  const T=TOPICS[topic];const pres=role==="pres";
  const qs=[
   {id:"msg",q:"Quel est le message principal ?",o:[["Annoncer une mesure concrète et chiffrée",pres?2:1],["Mettre en cause "+(pres?"l'opposition qui divise":"le pouvoir en place"),pres?-1:2],["Expliquer le contexte et appeler au calme",pres?1.5:-.5]]},
   {id:"ton",q:"Quel ton adopter ?",o:[["Combatif",kind==="tv"||kind==="web"||kind==="meeting"?1:-.5],["Pédagogue",1],["Conciliant",pres?1:0]]}
  ];
  if(kind!=="meeting")qs.push({id:"hostile",q:"Si l'on vous pose la question : « "+T.hostile+" »",o:[["Répondre franchement, reconnaître les difficultés",2],["Esquiver et revenir à mon message",-1],["Contre-attaquer",pres?-1:1]]});
  qs.push({id:"prom",q:"Faire une promesse ?",o:[["Oui, chiffrée et datée",2],["Un engagement général",.5],["Aucune promesse",0]]});
  return qs;
}
function qcmScore(qs,ans){let s=0,max=0,min=0;qs.forEach(q=>{const v=q.o[ans[q.id]||0][1];s+=v;max+=Math.max(...q.o.map(o=>o[1]));min+=Math.min(...q.o.map(o=>o[1]))});return(s-min)/Math.max(.01,max-min)}

/* ---------- analyse d'un discours (écrit ou dicté) ---------- */
MEDIA.analyse=function(text,topic,reg){
  const t=(text||"").toLowerCase();const notes=[];let s=.35;
  const words=t.split(/\s+/).filter(Boolean).length;
  const T=TOPICS[topic]||TOPICS.viechere;const m=(t.match(T.kw)||[]).length;
  if(m){s+=Math.min(.3,m*.08);notes.push("Vous parlez du sujet ("+m+" référence"+(m>1?"s":"")+").")}else notes.push("Vous vous éloignez du sujet attendu : "+T.n.toLowerCase()+".");
  const R=reg&&CM.REG[reg];if(R&&[R.n,R.chef,...R.villes].some(v=>t.includes(v.toLowerCase()))){s+=.1;notes.push("Vous citez les lieux de la région : le public se sent concerné.")}
  if(/\d/.test(t)){s+=.08;notes.push("Des chiffres précis rendent le discours crédible.")}
  if(/(je m'engage|nous allons|je promets|d'ici|dès (demain|janvier|ce mois))/.test(t)){s+=.07;notes.push("Vos engagements sont clairs.")}
  if(/(jam na|mbolo|good people|mes chers compatriotes|chers compatriotes)/.test(t)){s+=.05;notes.push("Bonne salutation du public.")}
  if(/(voleur|imb[eé]cile|idiot|salaud|tra[iî]tre|menteur|pourri|chien)/.test(t)){s-=.22;notes.push("Propos injurieux : risque de poursuites pour diffamation ou outrage.")}
  if(/(tribu|ethnie|les bami|les b[eé]ti|les anglos|les nordistes)/.test(t)){s-=.15;notes.push("Attention aux propos à caractère tribal : le Code pénal réprime l'outrage tribal.")}
  if(words<15){s-=.1;notes.push("Intervention trop courte.")}else if(words>260){s-=.05;notes.push("Intervention trop longue : le public décroche.")}
  return{score:clamp(s,0,1),notes,words};
};

/* ---------- micro ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
MEDIA.micDispo=!!SR;
function micStart(area,btn,status){
  if(!SR){status.textContent="La dictée vocale n'est pas disponible dans ce navigateur. Utilisez Chrome, ou écrivez votre texte.";return null}
  const r=new SR();r.lang="fr-FR";r.continuous=true;r.interimResults=true;let base=area.value?area.value+" ":"";
  r.onresult=e=>{let fin="",tmp="";for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)fin+=x[0].transcript+" ";else tmp+=x[0].transcript}base+=fin;area.value=base+tmp};
  r.onerror=e=>{status.textContent=e.error==="not-allowed"||e.error==="service-not-allowed"?"Micro refusé. Dans la page Claude, le micro est bloqué : ouvrez le fichier hors ligne dans Chrome, ou écrivez votre texte.":e.error==="network"?"La dictée demande une connexion Internet.":"Micro : "+e.error;btn.textContent="Parler au micro";btn.dataset.on=""};
  r.onend=()=>{btn.textContent="Parler au micro";btn.dataset.on="";status.textContent=status.textContent.startsWith("Micro")?status.textContent:"Enregistrement terminé."};
  try{r.start();status.textContent="Je vous écoute… parlez normalement, puis touchez « Arrêter ».";btn.textContent="Arrêter";btn.dataset.on="1"}catch(e){status.textContent="Impossible de démarrer le micro."}
  return r;
}

/* ---------- préparation d'une intervention (meeting, plateau, point de presse, débat) ----------
   opts : {kind, titre, topic, reg, allowSpeech, rep:{n,skill}|null, memorize, presetAns}
   cb({q, mult, text, ans, notes}) */
MEDIA.prepare=function(opts,cb){
  const S=G.S;const role=S.mode;const qs=questions(opts.kind,opts.topic,role);const ans=Object.assign({},opts.presetAns||{});
  let mode="auto",rec=null;
  const el=G.sheet('<span class="eyebrow">'+esc(opts.titre||"Préparer l'intervention")+'</span><h3 class="h2">'+esc(TOPICS[opts.topic].n)+'</h3>'+
   (opts.rep?'<p class="small muted">Vous donnez vos orientations à '+esc(opts.rep.n)+', qui vous représentera.</p>':"")+
   qs.map(q=>'<div class="card" style="gap:6px"><b class="small">'+esc(q.q)+'</b>'+q.o.map((o,i)=>'<button class="choice" data-q="'+q.id+'" data-o="'+i+'" aria-pressed="'+((ans[q.id]||0)===i)+'" style="'+((ans[q.id]||0)===i?"border-color:var(--y)":"")+'"><span class="t" style="font-weight:600">'+esc(o[0])+'</span></button>').join("")+'</div>').join("")+
   (opts.allowSpeech?'<div class="card" style="gap:8px"><b class="small">Comment voulez-vous vous exprimer ?</b><div class="grid2"><button class="opt" data-mode="auto" aria-pressed="true"><b>Discours de l\'équipe</b><span>Rédigé selon vos réponses.</span></button><button class="opt" data-mode="texte" aria-pressed="false"><b>Écrire / parler</b><span>Votre propre texte, tapé ou dicté.</span></button></div><div id="exWrap" hidden><textarea id="exTxt" rows="6" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit" placeholder="Mes chers compatriotes…"></textarea><div class="row"><button class="btn small" id="exMic">Parler au micro</button><span class="small muted" id="exSt">'+(MEDIA.micDispo?"Le micro utilise la dictée de votre navigateur.":"Dictée vocale indisponible dans ce navigateur.")+'</span></div></div></div>':"")+
   (opts.memorize?'<label class="row small" for="exMem" style="gap:10px"><input type="checkbox" id="exMem" checked> Mémoriser ces réponses comme ligne directrice pour ce sujet</label>':"")+
   '<button class="btn primary" id="exGo">Valider</button>',el2=>{
    el2.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ans[b.dataset.q]=+b.dataset.o;el2.querySelectorAll('[data-q="'+b.dataset.q+'"]').forEach(x=>{const on=x===b;x.setAttribute("aria-pressed",on);x.style.borderColor=on?"var(--y)":""})});
    el2.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;el2.querySelectorAll("[data-mode]").forEach(x=>x.setAttribute("aria-pressed",x===b));el2.querySelector("#exWrap").hidden=mode!=="texte"});
    const mic=el2.querySelector("#exMic");if(mic)mic.onclick=()=>{if(mic.dataset.on&&rec){rec.stop();return}A.stop();rec=micStart(el2.querySelector("#exTxt"),mic,el2.querySelector("#exSt"))};
    el2.querySelector("#exGo").onclick=()=>{if(rec)try{rec.stop()}catch(e){}
      let q=qcmScore(qs,ans);let text="",notes=[];
      if(mode==="texte"){text=el2.querySelector("#exTxt").value.trim();if(text){const a=MEDIA.analyse(text,opts.topic,opts.reg);q=q*.5+a.score*.5;notes=a.notes}}
      if(opts.rep)q=q*clamp(opts.rep.skill/78,.7,1.15);
      const mem=el2.querySelector("#exMem");
      el2.remove();cb({q:clamp(q,0,1),mult:.6+clamp(q,0,1),text,ans,notes,mem:mem?mem.checked:false});
    };
  });
  return el;
};

/* ---------- représentants ---------- */
function representants(S,topic,diplo){
  const out=[];
  if(S.mode==="pres"){const g=S.gov;const add=(id,t)=>{const m=g.min[id];if(m)out.push({n:m.n+" ("+t+")",skill:m.comp})};
    add("MINCOM","ministre de la Communication, porte-parole du gouvernement");if(diplo)add("MINREX","ministre des Relations extérieures");
    const map={securite:"MINDEF",anglophone:"MINATD",electricite:"MINEE",corruption:"MINJUSTICE",jeunes:"MINEFOP",routes:"MINTP",sante:"MINSANTE",dette:"MINFI",viechere:"MINCOMMERCE",elections:"MINATD"};add(map[topic],"ministre du secteur");if(g.pm)out.push({n:g.pm.n+" (Premier ministre)",skill:g.pm.comp})}
  else if(S.mode==="opp"){const P=S.opp;const pp=P.experts[+P.bureau["Porte-parole"]];if(pp)out.push({n:pp.n+" (porte-parole)",skill:pp.skill});
    const dom={securite:"sec",anglophone:"diplo",electricite:"mines",corruption:"droit",jeunes:"eco",routes:"btp",sante:"sante",dette:"fin",viechere:"eco",elections:"strat"}[topic];const ex=P.experts.find(e=>e.dom===(diplo?"diplo":dom));if(ex)out.push({n:ex.n+" ("+E.DOMAINES.find(d=>d.id===ex.dom).n.toLowerCase()+")",skill:ex.skill});
    if(S.profil==="maire"&&P.commune)out.push({n:(P.commune.adjoint||"Premier adjoint au maire"),skill:62})}
  else if(S.mode==="ing"){out.push({n:(S.ent.dt||"Votre directeur technique"),skill:66})}
  else if(S.mode==="pro"){out.push({n:"Un confrère de confiance",skill:60})}
  else if(S.mode==="min"){out.push({n:"Chargé de communication du "+S.minis.id,skill:64},{n:"Secrétaire général du "+S.minis.id,skill:70})}
  return out;
}
MEDIA.representants=representants;

/* ---------- état ---------- */
MEDIA.init=function(S){if(S.media)return;S.media={inv:[],feed:[],lignes:{},auto:false,nextInv:(S.day||0)+rnd(2,5),nextNpc:(S.day||0)+2,nextRevue:(S.day||0)+4,lastBrief:-99,lastDebat:-99,lastSocial:-99,hostile:0,pubAide:0}};
function roleWho(S){return S.mode==="pro"?"le "+window.PRO.LIST[S.pro.id].n.toLowerCase().split(" ou ")[0]+" "+S.name:S.mode==="pres"?"le président de la République":S.mode==="min"?"le ministre ("+S.minis.id+")":S.profil==="depute"?"l'honorable député "+S.name:S.mode==="ing"?"le chef d'entreprise "+S.name:S.profil==="maire"?"le maire de "+S.opp.commune.ville:"le président du "+S.parties[S.party].n}
function newInvitation(S){
  const M=S.media;const r=Math.random();
  let kind,outlet,show,topic=pickTopic(S),diplo=null;
  if(r<.18&&S.mode!=="ing"&&S.mode!=="pro"){kind="diplo";diplo=pick(E.PAYS.filter(p=>p.id.length<=2));show=S.mode==="pres"?pick(["Réception à l'ambassade pour la fête nationale","Visite officielle à Yaoundé","Sommet régional"]):"Rencontre avec l'ambassadeur";outlet={n:diplo.n,t:"diplo",reach:.5}}
  else{outlet=pick(OUTLETS.filter(o=>S.mode==="pres"||!o.pub||Math.random()<.25));kind=outlet.t;show=pick(SHOWS[kind]||SHOWS.tv)}
  const guests=kind==="tv"?pick([["un cadre du RDPC","un élu du PCRN"],["un universitaire","un responsable du FSNC"],["un député du SDF","un ministre délégué"]]):[];
  M.inv.unshift({id:nid(),kind,outlet:outlet.n,reach:outlet.reach,pub:!!outlet.pub,show,topic,diplo:diplo&&diplo.id,guests,day:S.day,exp:S.day+3,st:"attente"});
  M.inv=M.inv.slice(0,12);
  return M.inv[0];
}
function pickTopic(S){
  // sujet d'actualité : la cause de mécontentement la plus forte du moment
  const counts={};for(const r of CM.REGIONS)for(const c of (S.mood&&S.mood[r.id].c)||[])if(c.d<0){const tp=THEME2TOPIC[c.ty]||null;if(tp)counts[tp]=(counts[tp]||0)+(-c.d)}
  const ks=Object.keys(counts);if(ks.length&&Math.random()<.7)return ks.sort((a,b)=>counts[b]-counts[a])[Math.floor(Math.random()*Math.min(3,ks.length))];
  return pick(Object.keys(TOPICS));
}
function applyOutcome(S,q,reach,topic,label,byRep){
  const d=(q-.5)*reach*6;
  if(S.mode==="pres"){S.st.pop=clamp(S.st.pop+d,0,100)}
  else if(S.mode==="opp"){S.opp.noto=clamp(S.opp.noto+d*1.5+.5,0,100);for(const r of CM.REGIONS){const hit=(S.mood[r.id].c.some(c=>c.d<0&&THEME2TOPIC[c.ty]===topic));G.shift(S.sup,r.id,S.party,Math.max(-.6,d*(hit?.35:.18)),S.power)}}
  else if(S.mode==="ing"){S.ent.rep=clamp(S.ent.rep+d,0,100)}
  else if(S.mode==="pro"){S.pro.rep=clamp(S.pro.rep+d,0,100)}
  else if(S.mode==="min"){S.minis.conf=clamp(S.minis.conf+d*.8,0,100);S.st.pop=clamp(S.st.pop+d*.3,0,100)}
  const verdict=q>=.7?"Prestation remarquée":q>=.5?"Prestation correcte":q>=.35?"Prestation terne":"Prestation ratée";
  const txt=verdict+(byRep?" de votre représentant":"")+" : "+label+" sur « "+TOPICS[topic].n.toLowerCase()+" ».";
  S.media.feed.unshift({day:S.day,t:txt,good:q>=.5});S.media.feed=S.media.feed.slice(0,30);
  if(q>=.7||q<.35)window.SYS.cause(S,"CE",txt,q>=.7?2:-2,TOPICS[topic].ty);
  return{verdict,d,txt};
}
MEDIA.applyOutcome=applyOutcome;

/* résoudre une invitation (soi-même ou représentant) */
function resolveInv(S,inv,res,rep){
  if(inv.kind==="diplo")return resolveDiplo(S,inv,res,rep);
  inv.st="fait";
  const label=inv.show+" ("+inv.outlet+")";
  const o=applyOutcome(S,res.q,inv.reach*(inv.pub&&S.mode!=="pres"?.8:1),inv.topic,label,!!rep);
  window.SYS.inbox(S,{from:rep?rep.n:"Votre cabinet",t:o.verdict+" — "+inv.outlet,b:(rep?rep.n+" vous a représenté":"Vous êtes passé")+" dans « "+inv.show+" » sur "+inv.outlet+(inv.guests.length?", face à "+inv.guests.join(" et "):"")+". "+o.verdict+". "+(res.notes&&res.notes.length?"Analyse de votre intervention : "+res.notes.join(" "):"")+(res.text?"\nExtrait : « "+res.text.slice(0,220)+(res.text.length>220?"…":"")+" »":""),k:"rapport",read:true});
  if(res.ans&&res.ans.prom===0)S.media.promesses=(S.media.promesses||0)+1;
  if(res.text&&/(voleur|imb[eé]cile|salaud|menteur|tra[iî]tre)/i.test(res.text)&&Math.random()<.4){window.SYS.newCase(S,"militants","CE",1,"Yaoundé");window.SYS.inbox(S,{from:"Votre juriste",t:"Plainte pour diffamation",b:"Une personnalité mise en cause dans votre intervention a porté plainte pour diffamation. Le dossier est au tribunal de grande instance de Yaoundé.",k:"alerte"})}
  return o;
}
function resolveDiplo(S,inv,res,rep){
  inv.st="fait";const p=E.PAYS.find(x=>x.id===inv.diplo);const q=res.q;
  if(S.mode==="pres"){S.diplo[p.id]=clamp(S.diplo[p.id]+(q-.4)*12,0,100);S.st.int=clamp(S.st.int+(q-.45)*4,0,100)}
  else if(S.opp){S.opp.noto=clamp(S.opp.noto+(q-.4)*5,0,100);S.integ=clamp(S.integ+(q>.5?1:0),0,100)}
  else if(S.minis){S.minis.conf=clamp(S.minis.conf+(q-.4)*4,0,100)}
  const txt=(q>=.55?"Échange fructueux":"Échange froid")+" avec "+p.n+(rep?" (représenté par "+rep.n+")":"");
  S.media.feed.unshift({day:S.day,t:txt,good:q>=.55});
  window.SYS.inbox(S,{from:rep?rep.n:"Votre cabinet diplomatique",t:inv.show+" — "+p.n,b:txt+". "+(S.mode==="pres"?"Les relations avec "+p.n+" sont désormais à "+Math.round(S.diplo[p.id])+"/100.":"Vos interlocuteurs suivront la transparence des prochains scrutins. Rappel : aucun financement étranger d'un parti n'est autorisé."),k:"rapport",read:true});
}
function diploQuestions(S){
  return[{id:"msg",q:"Quelle priorité mettre en avant ?",o:[[S.mode==="pres"?"Financements et investissements":"Transparence électorale",2],[S.mode==="pres"?"Coopération sécuritaire":"Droits humains et libertés",1.5],["Commerce et diaspora",1]]},
   {id:"ton",q:"Quel ton ?",o:[["Cordial et constructif",2],["Ferme sur nos intérêts",1],["Distant",-1]]},
   {id:"prom",q:"Que demander ?",o:[[S.mode==="pres"?"Un accord concret":"Une observation des élections",2],["Un simple soutien de principe",.5],[S.mode==="pres"?"Rien":"Un soutien financier au parti (interdit)",-2]]}];
}

/* ---------- temps : événements quotidiens ---------- */
MEDIA.dayTick=function(S){
  if(!S.media)MEDIA.init(S);const M=S.media;
  if(S.day>=M.nextInv){M.nextInv=S.day+rnd(3,7);const inv=newInvitation(S);
    if(M.auto){const L=M.lignes[inv.kind==="diplo"?"diplo":inv.topic];const rep=representants(S,inv.topic,inv.kind==="diplo")[0];
      if(L&&rep){const qs=inv.kind==="diplo"?diploQuestions(S):questions(inv.kind,inv.topic,S.mode);const q=qcmScore(qs,L)*clamp(rep.skill/78,.7,1.15);resolveInv(S,inv,{q,ans:L,notes:[]},rep);G.toast(rep.n.split(" (")[0]+" gère l'invitation de "+inv.outlet)}
      else{window.SYS.inbox(S,{from:rep?rep.n:"Votre porte-parole",t:"Nouveau sujet : vos orientations ?",b:inv.outlet+" nous invite pour parler de « "+(inv.kind==="diplo"?"relations avec "+inv.outlet:TOPICS[inv.topic].n.toLowerCase())+" ». C'est un sujet nouveau : je ne peux pas y aller sans vos orientations. Ouvrez l'onglet Médias pour me les donner.",k:"alerte"});G.toast("Votre porte-parole attend vos orientations (onglet Médias)")}}
    else G.toast("Invitation : "+inv.outlet+" — "+inv.show);
  }
  for(const inv of M.inv){if(inv.st==="attente"&&S.day>inv.exp){inv.st="manque";if(S.mode==="pres")S.st.pop=clamp(S.st.pop-.5,0,100);else if(S.opp)S.opp.noto=clamp(S.opp.noto-1,0,100);M.feed.unshift({day:S.day,t:inv.outlet+" : « "+inv.show+" » s'est fait sans vous.",good:false})}}
  if(S.day>=M.nextNpc){M.nextNpc=S.day+rnd(3,6);npcDebate(S)}
  if(S.day>=M.nextRevue){M.nextRevue=S.day+14;if(S.mode!=="ing"&&S.mode!=="pro")revue(S)}
};
function npcDebate(S){
  const tp=pickTopic(S),o=pick(OUTLETS.filter(x=>x.t==="tv"||x.t==="radio"));
  const ps=["RDPC","FSNC","PCRN","MRC","SDF","UNDP","UDC"].filter(p=>p!==S.party);const a=pick(ps);let b=pick(ps.filter(p=>p!==a));
  const w=Math.random()<.5?a:b;for(const r of CM.REGIONS)G.shift(S.sup,r.id,w,.12,S.power);
  S.media.feed.unshift({day:S.day,t:"Sur "+o.n+", un responsable du "+a+" et un responsable du "+b+" ont débattu de « "+TOPICS[tp].n.toLowerCase()+" ». Le public donne l'avantage au "+w+".",good:null});
  S.media.feed=S.media.feed.slice(0,30);
}
function revue(S){
  const causes=[];for(const r of CM.REGIONS)for(const c of S.mood[r.id].c.slice(0,2))causes.push(c);causes.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  const lines=[];const pubs=OUTLETS.filter(o=>o.t==="presse"||o.t==="web");
  for(const c of causes.slice(0,4)){const o=pick(pubs);const crit=!o.pub&&S.mode==="pres";lines.push(o.n+" : « "+(crit&&c.d<0?"Colère : ":"")+c.t+" »")}
  if(S.mode==="pres"&&S.media.hostile>0)lines.push("Le Messager : « La presse privée dénonce les suspensions du CNC »");
  window.SYS.inbox(S,{from:"Service de communication",t:"Revue de presse de la semaine",b:lines.join("\n")||"Semaine calme dans les médias.",k:"rapport"});
}

/* ---------- onglet Médias ---------- */
MEDIA.render=function(S){
  if(!S.media)MEDIA.init(S);const M=S.media;const P=$("panel");
  const att=M.inv.filter(i=>i.st==="attente");
  let h='<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Invitations en attente</span>'+(att.length?'<span class="pill warn">'+att.length+'</span>':"")+'</div>'+
   (att.length?att.map(i=>'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(i.kind==="diplo"?i.show+" — "+i.outlet:i.show+" · "+i.outlet)+'</b><span class="small muted">'+(i.kind==="diplo"?"Invitation diplomatique":"Sujet : "+esc(TOPICS[i.topic].n))+(i.guests.length?" · autres invités : "+esc(i.guests.join(", ")):"")+' · réponse avant le '+esc(G.dayLabel(i.exp))+'</span><div class="row"><button class="btn small primary" data-go="'+i.id+'">J\'y vais</button><button class="btn small" data-rep="'+i.id+'">Envoyer un représentant</button><button class="btn small ghost" data-no="'+i.id+'">Décliner</button></div></div>').join(""):'<span class="small muted">Aucune invitation pour l\'instant. Les rédactions vous contactent au fil des jours.</span>')+'</div>'+
   '<div class="card"><span class="eyebrow">Prendre la parole</span><div class="grid2">'+
    '<button class="opt" id="mBrief"'+(S.day-M.lastBrief<5?" disabled":"")+'><b>Point de presse</b><span>'+(S.mode==="pres"?"Briefing du porte-parole du gouvernement.":"Conférence de presse au siège.")+(S.day-M.lastBrief<5?" Prochain possible le "+esc(G.dayLabel(M.lastBrief+5))+".":"")+'</span></button>'+
    '<button class="opt" id="mDebat"'+(S.day-M.lastDebat<10||S.mode==="ing"||S.mode==="pro"?" disabled":"")+'><b>Organiser un débat</b><span>Face-à-face télévisé avec un adversaire.</span></button>'+
    '<button class="opt" id="mSocial"'+(S.day-M.lastSocial<2?" disabled":"")+'><b>Réseaux sociaux</b><span>Facebook, TikTok, WhatsApp, YouTube, X.</span></button>'+
    (S.mode==="pres"?'<button class="opt" id="mPol"><b>Politique des médias</b><span>Conseil national de la communication, aide à la presse.</span></button>':'<button class="opt" id="mTribune"><b>Tribune dans la presse</b><span>Publier un texte signé dans un journal.</span></button>')+'</div></div>'+
   '<div class="card"><span class="eyebrow">Délégation</span><label class="row" for="mAuto" style="gap:10px"><input type="checkbox" id="mAuto"'+(M.auto?" checked":"")+'> <span>Autoriser '+esc((representants(S,"viechere")[0]||{n:"mon porte-parole"}).n)+' à gérer seul les invitations, et à ne me consulter que pour un sujet nouveau</span></label>'+
   '<span class="small muted">Lignes directrices enregistrées : '+(Object.keys(M.lignes).length?Object.keys(M.lignes).map(k=>k==="diplo"?"diplomatie":TOPICS[k].n.toLowerCase()).join(", "):"aucune")+'.</span><button class="btn small" id="mLignes" style="align-self:flex-start">Définir une ligne directrice</button></div>'+
   '<div class="card"><span class="eyebrow">Fil des médias</span><div class="log">'+(M.feed.length?M.feed.slice(0,12).map(f=>'<div><small>'+esc(G.dayLabel(f.day))+'</small><br><span style="color:'+(f.good===true?"var(--ok)":f.good===false?"var(--bad)":"var(--ink)")+'">'+esc(f.t)+'</span></div>').join(""):'<div class="muted">Rien pour l\'instant.</div>')+'</div></div>'+
   '<details class="card"><summary><b>Paysage médiatique</b></summary><div class="kv" style="margin-top:8px">'+OUTLETS.map(o=>'<span>'+esc(o.n)+'</span><b>'+({tv:"télévision",radio:"radio",presse:"presse écrite",web:"site d'information"}[o.t])+(o.pub?" publique":"")+'</b>').join("")+'</div><p class="small muted">Régulateur : Conseil national de la communication (CNC). Réseaux : '+SOCIAUX.map(s=>s[0]).join(", ")+'.</p></details>';
  P.innerHTML=h;
  const find=id=>M.inv.find(i=>i.id===id);
  P.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{const inv=find(b.dataset.go);goInv(S,inv,null)});
  P.querySelectorAll("[data-rep]").forEach(b=>b.onclick=()=>{const inv=find(b.dataset.rep);const reps=representants(S,inv.topic,inv.kind==="diplo");
    G.sheet('<h3 class="h2">Qui vous représente ?</h3>'+reps.map((r,i)=>'<button class="choice" data-r="'+i+'"><span class="t">'+esc(r.n)+'</span><span class="small muted">Aisance médiatique '+r.skill+'/100</span></button>').join(""),el=>el.querySelectorAll("[data-r]").forEach(x=>x.onclick=()=>{el.remove();goInv(S,inv,reps[+x.dataset.r])}))});
  P.querySelectorAll("[data-no]").forEach(b=>b.onclick=()=>{const inv=find(b.dataset.no);inv.st="decline";M.feed.unshift({day:S.day,t:"Vous avez décliné l'invitation de "+inv.outlet+".",good:null});G.render()});
  $("mAuto").onchange=e=>{M.auto=e.target.checked;G.toast(M.auto?"Délégation activée":"Délégation désactivée")};
  $("mLignes").onclick=()=>G.sheet('<h3 class="h2">Ligne directrice sur quel sujet ?</h3>'+Object.entries(TOPICS).map(([k,t])=>'<button class="choice" data-l="'+k+'"><span class="t">'+esc(t.n)+(M.lignes[k]?" ✓":"")+'</span></button>').join("")+'<button class="choice" data-l="diplo"><span class="t">Invitations diplomatiques'+(M.lignes.diplo?" ✓":"")+'</span></button>',el=>el.querySelectorAll("[data-l]").forEach(x=>x.onclick=()=>{el.remove();const k=x.dataset.l;
    if(k==="diplo")return diploPrep(S,null,null,true,res=>{M.lignes.diplo=res.ans;G.toast("Ligne diplomatique enregistrée");G.render()});
    MEDIA.prepare({kind:"tv",titre:"Ligne directrice pour votre porte-parole",topic:k,allowSpeech:false,rep:null,presetAns:M.lignes[k]},res=>{M.lignes[k]=res.ans;G.toast("Ligne directrice enregistrée");G.render()})}));
  const br=$("mBrief");if(br)br.onclick=()=>brief(S);
  const db=$("mDebat");if(db)db.onclick=()=>debat(S);
  const so=$("mSocial");if(so)so.onclick=()=>social(S);
  const po=$("mPol");if(po)po.onclick=()=>politique(S);
  const tr=$("mTribune");if(tr)tr.onclick=()=>tribune(S);
};
function goInv(S,inv,rep){
  const M=S.media;
  if(inv.kind==="diplo")return diploPrep(S,inv,rep,false,res=>{if(res.mem)M.lignes.diplo=res.ans;resolveDiplo(S,inv,res,rep);G.render()});
  G.setView({land:"ville",overlay:"conseil"},inv.outlet,inv.show);
  MEDIA.prepare({kind:inv.kind,titre:(rep?"Orientations pour ":"")+inv.show+" · "+inv.outlet,topic:inv.topic,allowSpeech:!rep,rep,memorize:!!rep},res=>{
    if(res.mem)M.lignes[inv.topic]=res.ans;
    const o=resolveInv(S,inv,res,rep);
    G.subs(inv.outlet,(res.text?res.text:"Sur le plateau de « "+inv.show+" », "+(rep?rep.n.split(" (")[0]:roleWho(S))+" a défendu sa position sur "+TOPICS[inv.topic].n.toLowerCase()+". ")+" "+o.verdict+".",{voix:rep?"f":"m"});
    G.render()});
}
function diploPrep(S,inv,rep,memOnly,cb){
  const qs=diploQuestions(S);const ans={};
  G.sheet('<span class="eyebrow">'+esc(inv?inv.show+" — "+inv.outlet:"Ligne diplomatique")+'</span><h3 class="h2">'+(rep?"Orientations pour "+esc(rep.n):"Vos orientations")+'</h3>'+qs.map(q=>'<div class="card" style="gap:6px"><b class="small">'+esc(q.q)+'</b>'+q.o.map((o,i)=>'<button class="choice" data-q="'+q.id+'" data-o="'+i+'" style="'+(!i?"border-color:var(--y)":"")+'"><span class="t" style="font-weight:600">'+esc(o[0])+'</span></button>').join("")+'</div>').join("")+(inv?'<label class="row small" for="dMem" style="gap:10px"><input type="checkbox" id="dMem"> Mémoriser comme ligne directrice</label>':"")+'<button class="btn primary" id="dGo">Valider</button>',el=>{
    el.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{ans[b.dataset.q]=+b.dataset.o;el.querySelectorAll('[data-q="'+b.dataset.q+'"]').forEach(x=>x.style.borderColor=x===b?"var(--y)":"")});
    el.querySelector("#dGo").onclick=()=>{let q=qcmScore(qs,ans);if(rep)q*=clamp(rep.skill/78,.7,1.15);
      if(S.mode==="opp"&&ans.prom===2){window.SYS.inbox(S,{from:"Votre juriste",t:"Attention : financement étranger",b:"Demander un soutien financier à un État étranger est interdit par la loi sur les partis politiques. Si cela se sait, le parti risque la suspension.",k:"alerte"});if(Math.random()<.3){S.opp.risque=clamp(S.opp.risque+15,0,100);S.opp.noto=clamp(S.opp.noto-5,0,100)}}
      const mem=el.querySelector("#dMem");el.remove();cb({q:clamp(q,0,1),ans,mem:memOnly||(mem&&mem.checked)})};
  });
}
function brief(S){
  const M=S.media;
  G.sheet('<h3 class="h2">Point de presse : quel sujet ?</h3>'+Object.entries(TOPICS).map(([k,t])=>'<button class="choice" data-t="'+k+'"><span class="t">'+esc(t.n)+'</span></button>').join(""),el=>el.querySelectorAll("[data-t]").forEach(x=>x.onclick=()=>{el.remove();const tp=x.dataset.t;
    const reps=representants(S,tp);
    G.sheet('<h3 class="h2">Qui s\'exprime ?</h3><button class="choice" data-w="-1"><span class="t">Moi-même</span><span class="small muted">Vous pouvez parler au micro ou écrire votre déclaration.</span></button>'+reps.map((r,i)=>'<button class="choice" data-w="'+i+'"><span class="t">'+esc(r.n)+'</span></button>').join(""),el2=>el2.querySelectorAll("[data-w]").forEach(y=>y.onclick=()=>{el2.remove();const rep=+y.dataset.w>=0?reps[+y.dataset.w]:null;
      G.setView({land:"ville",overlay:"conseil"},S.mode==="pres"?"Yaoundé":"Siège du parti","Point de presse");
      MEDIA.prepare({kind:"presse",titre:"Point de presse",topic:tp,allowSpeech:!rep,rep},res=>{M.lastBrief=S.day;const o=applyOutcome(S,res.q,1.2,tp,"point de presse",!!rep);
        G.subs("Point de presse",res.text||("Mesdames et messieurs les journalistes, "+(rep?"au nom de "+roleWho(S)+", ":"")+"je souhaite faire le point sur "+TOPICS[tp].n.toLowerCase()+"."),{voix:rep?"f":"m"});
        window.SYS.inbox(S,{from:"Service de communication",t:"Point de presse : "+o.verdict.toLowerCase(),b:"Reprise dans "+Math.round(3+res.q*9)+" médias. "+(res.notes.length?res.notes.join(" "):""),k:"rapport",read:true});G.render()})}))}));
}
function debat(S){
  const M=S.media;const ps=["RDPC","FSNC","PCRN","MRC","SDF","UNDP","UDC"].filter(p=>p!==S.party);
  G.sheet('<h3 class="h2">Organiser un débat télévisé</h3><label class="f" for="dbA">Adversaire<select id="dbA">'+ps.map(p=>'<option>'+p+'</option>').join("")+'</select></label><label class="f" for="dbM">Chaîne<select id="dbM">'+OUTLETS.filter(o=>o.t==="tv").map(o=>'<option>'+esc(o.n)+'</option>').join("")+'</select></label><label class="f" for="dbT">Sujet<select id="dbT">'+Object.entries(TOPICS).map(([k,t])=>'<option value="'+k+'">'+esc(t.n)+'</option>').join("")+'</select></label><button class="btn primary" id="dbGo">Lancer le débat</button>',el=>{
    el.querySelector("#dbGo").onclick=()=>{const adv=el.querySelector("#dbA").value,ch=el.querySelector("#dbM").value,tp=el.querySelector("#dbT").value;el.remove();
      const acc=Math.random()<.75;if(!acc){G.toast("Le "+adv+" décline le débat.");M.feed.unshift({day:S.day,t:"Le "+adv+" a refusé votre défi de débat sur "+ch+".",good:true});if(S.opp)S.opp.noto=clamp(S.opp.noto+1,0,100);M.lastDebat=S.day;G.render();return}
      G.setView({land:"ville",overlay:"conseil"},ch,"Grand débat");
      MEDIA.prepare({kind:"tv",titre:"Débat face au "+adv+" sur "+ch,topic:tp,allowSpeech:true,rep:null},res=>{M.lastDebat=S.day;
        const strength=G.nationalShare(S.sup,adv)/100;const oppQ=clamp(rnd(.35,.7)+strength*.3,0,1);const win=res.q>oppQ;const diff=res.q-oppQ;
        const me=S.mode==="pres"?S.power:S.party;for(const r of CM.REGIONS){if(win)G.shift(S.sup,r.id,me,Math.min(1.5,diff*4+.2),S.power);else G.shift(S.sup,r.id,adv,Math.min(1.5,-diff*4+.2),S.power)}
        if(S.mode==="pres")S.st.pop=clamp(S.st.pop+diff*6,0,100);else S.opp.noto=clamp(S.opp.noto+3+diff*8,0,100);
        const txt=(win?"Vous remportez":"Vous perdez")+" le débat face au "+adv+" sur "+ch+" ("+TOPICS[tp].n.toLowerCase()+").";M.feed.unshift({day:S.day,t:txt,good:win});
        G.subs("Grand débat · "+ch,(res.text?res.text+" ":"")+"Selon le sondage réalisé à la fin de l'émission, "+(win?"le public vous donne l'avantage.":"le public donne l'avantage à votre adversaire."),{voix:"f"});
        window.SYS.inbox(S,{from:ch,t:txt,b:"Note de votre prestation : "+Math.round(res.q*100)+"/100 ; adversaire : "+Math.round(oppQ*100)+"/100. "+(res.notes.length?res.notes.join(" "):""),k:"rapport",read:true});G.render()})};
  });
}
function social(S){
  const M=S.media;
  G.sheet('<h3 class="h2">Campagne sur les réseaux sociaux</h3><label class="f" for="soP">Plateforme<select id="soP">'+SOCIAUX.map(s=>'<option>'+s[0]+'</option>').join("")+'</select></label><label class="f" for="soF">Format<select id="soF">'+FORMATS.map(f=>'<option>'+f[0]+'</option>').join("")+'</select></label><label class="f" for="soT">Sujet<select id="soT">'+Object.entries(TOPICS).map(([k,t])=>'<option value="'+k+'">'+esc(t.n)+'</option>').join("")+'</select></label><label class="f" for="soX">Votre message (facultatif)<textarea id="soX" rows="3" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit"></textarea></label><button class="btn primary" id="soGo">Publier ('+(S.mode==="opp"?"2 M FCFA de sponsorisation":"sans coût")+')</button>',el=>{
    el.querySelector("#soGo").onclick=()=>{const pl=el.querySelector("#soP").value,fo=el.querySelector("#soF").value,tp=el.querySelector("#soT").value,tx=el.querySelector("#soX").value.trim();
      if(S.mode==="opp"){if(S.opp.fonds<2)return G.toast("Trésorerie insuffisante.");S.opp.fonds-=2}
      el.remove();M.lastSocial=S.day;const pw=SOCIAUX.find(s=>s[0]===pl)[1]*FORMATS.find(f=>f[0]===fo)[1];
      let q=rnd(.25,.75);if(tx){const a=MEDIA.analyse(tx,tp,null);q=q*.5+a.score*.5}
      const viral=Math.random()<.12+q*.25;const bad=!viral&&Math.random()<.1;
      if(viral)q=Math.min(1,q+.3);if(bad)q=Math.max(0,q-.35);
      const o=applyOutcome(S,q,pw,tp,pl+" ("+fo.toLowerCase()+")",false);
      const txt=viral?"Votre publication devient virale sur "+pl+" : des centaines de milliers de vues.":bad?"Bad buzz sur "+pl+" : votre message est détourné et moqué.":"Publication sur "+pl+" : audience "+(q>.5?"correcte":"faible")+".";
      M.feed.unshift({day:S.day,t:txt,good:viral?true:bad?false:null});G.toast(txt);G.render()};
  });
}
function tribune(S){
  const tp=Object.keys(TOPICS)[0];
  G.sheet('<h3 class="h2">Tribune signée</h3><label class="f" for="tbJ">Journal<select id="tbJ">'+OUTLETS.filter(o=>o.t==="presse"||o.t==="web").map(o=>'<option>'+esc(o.n)+'</option>').join("")+'</select></label><label class="f" for="tbT">Sujet<select id="tbT">'+Object.entries(TOPICS).map(([k,t])=>'<option value="'+k+'">'+esc(t.n)+'</option>').join("")+'</select></label><label class="f" for="tbX">Votre texte<textarea id="tbX" rows="7" style="width:100%;background:var(--panel3);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit" placeholder="Camerounaises, Camerounais…"></textarea></label><button class="btn primary" id="tbGo">Envoyer au journal</button>',el=>{
    el.querySelector("#tbGo").onclick=()=>{const j=el.querySelector("#tbJ").value,t=el.querySelector("#tbT").value,x=el.querySelector("#tbX").value.trim();if(x.split(/\s+/).length<20)return G.toast("Une tribune fait au moins 20 mots.");
      const a=MEDIA.analyse(x,t,null);el.remove();const o=applyOutcome(S,a.score,.45,t,"tribune dans "+j,false);
      window.SYS.inbox(S,{from:j,t:"Votre tribune est publiée",b:o.verdict+". "+a.notes.join(" "),k:"rapport",read:true});G.render()};
  });
}
function politique(S){
  const M=S.media;
  G.sheet('<h3 class="h2">Politique des médias</h3><button class="choice" id="pCnc"><span class="t">Saisir le CNC pour suspendre un média critique</span><span class="small muted">Moins de critiques à court terme, mais réprobation internationale et colère de la presse privée.</span></button><button class="choice" id="pAide"><span class="t">Verser l\'aide publique à la communication privée (1 Md FCFA)</span><span class="small muted">Améliore les relations avec les rédactions.</span></button><button class="choice" id="pAccr"><span class="t">Ouvrir les conférences de presse à tous les médias</span><span class="small muted">Transparence : légère hausse de la popularité et de la diplomatie.</span></button>',el=>{
    el.querySelector("#pCnc").onclick=()=>{S.st.int=clamp(S.st.int-3,0,100);S.st.pop=clamp(S.st.pop-2,0,100);M.hostile++;M.feed.unshift({day:S.day,t:"Le CNC suspend un média privé pour un mois. Les journalistes protestent.",good:false});window.SYS.cause(S,"LT","Suspension d'un média par le CNC",-2,"corruption");el.remove();G.render()};
    el.querySelector("#pAide").onclick=()=>{S.nums.dette+=1;M.hostile=Math.max(0,M.hostile-1);S.st.pop=clamp(S.st.pop+.5,0,100);M.feed.unshift({day:S.day,t:"L'aide publique à la presse privée est versée.",good:true});el.remove();G.render()};
    el.querySelector("#pAccr").onclick=()=>{S.st.pop=clamp(S.st.pop+1,0,100);S.st.int=clamp(S.st.int+1,0,100);M.feed.unshift({day:S.day,t:"La présidence ouvre ses points de presse à tous les médias.",good:true});el.remove();G.render()};
  });
}
})();
