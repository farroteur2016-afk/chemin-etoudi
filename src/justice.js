/* Chemin d'Etoudi — chaîne pénale complète : garde à vue, parquet, instruction, jugement, appel, Cour suprême,
   exécution des peines et administration pénitentiaire (10 prisons centrales + autres établissements).
   Chiffres nationaux réels (fin 2024) : 37 150 détenus pour 20 955 places (177 %), plus de 70 % en détention
   provisoire, 412 FCFA par jour pour nourrir un détenu, 1 magistrat pour 22 000 habitants en 2025.
   La répartition par prison est une estimation du jeu. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const JUS={};window.JUS=JUS;
let uid=1;const nid=()=>"j"+Date.now().toString(36)+(uid++);
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';
const inbox=(S,o)=>window.SYS.inbox(S,o);

const PRISONS=[
 ["kondengui","Prison centrale de Yaoundé (Kondengui)","CE",1500,4600],["newbell","Prison centrale de Douala (New Bell)","LT",1000,3900],
 ["bafoussam","Prison centrale de Bafoussam","OU",900,1900],["bamenda","Prison centrale de Bamenda","NW",700,1500],["buea","Prison centrale de Buea","SW",500,1100],
 ["garoua","Prison centrale de Garoua","NO",900,2100],["maroua","Prison centrale de Maroua","EN",1000,2900],["ngaoundere","Prison centrale de Ngaoundéré","AD",600,1300],
 ["bertoua","Prison centrale de Bertoua","ES",500,1200],["ebolowa","Prison centrale d'Ebolowa","SU",450,800],["autres","Autres prisons principales et secondaires","",12905,15850]
];
const STAGES=["Garde à vue","Parquet","Instruction","Jugement","Appel","Cour suprême","Exécution de la peine","Clos"];
const MIL={EN:"Maroua",NO:"Garoua",AD:"Ngaoundéré",CE:"Yaoundé",LT:"Douala",OU:"Bafoussam",NW:"Bamenda",SW:"Buea",ES:"Bertoua",SU:"Ebolowa"};
const TYPES={
 casse:{n:"Destructions et pillages lors d'une manifestation",det:.8,peine:[6,36],court:"tgi"},
 militants:{n:"Rassemblement non autorisé et rébellion",det:.9,peine:[6,60],court:"tgi",pol:1},
 corruption:{n:"Détournement de deniers publics",det:.7,peine:[60,240],court:"tcs"},
 terror:{n:"Terrorisme et sécession",det:1,peine:[120,360],court:"mil",pol:1},
 fraude:{n:"Fraude électorale",det:.2,peine:[3,24],court:"tgi"},
 vol:{n:"Vol aggravé et banditisme",det:.9,peine:[24,120],court:"tgi"},
 enlevement:{n:"Enlèvement contre rançon",det:1,peine:[120,300],court:"tgi"}
};
JUS.TYPES=TYPES;JUS.STAGES=STAGES;

/* ---------- état ---------- */
JUS.init=function(S){
  if(S.jus)return;
  S.prisons=PRISONS.map(([id,n,reg,cap,pop])=>({id,n,reg,cap,prev:Math.round(pop*.71),cond:Math.round(pop*.29),ration:412,gard:Math.round(cap/9),tension:clamp(pop/cap*28,10,90)}));
  S.jus={mag:1380,foraines:0,reformeDP:0,reinsertion:0,liberationCond:0,csm:-99,igsj:-99,view:"dossiers",instr:{}};
  // les affaires déjà ouvertes deviennent des dossiers de la chaîne pénale
  const old=(S.cases||[]).slice();S.cases=[];
  for(const c of old)JUS.newCase(S,c.type,c.reg,c.n,c.ville,true);
  JUS.newCase(S,"militants","CE",60,"Yaoundé",true,3);
  JUS.newCase(S,"enlevement","AD",4,"Meiganga",true);
};
function prisonOf(S,reg){return S.prisons.find(p=>p.reg===reg)||S.prisons.find(p=>p.id==="autres")}
function courtName(c,stage){const R=CM.REG[c.reg];const T=TYPES[c.type]||TYPES.casse;
  if(stage<=1)return"Parquet près le tribunal de "+R.chef;
  if(stage===2)return T.court==="mil"?"Juge d'instruction militaire de "+MIL[c.reg]:T.court==="tcs"?"Corps spécialisé d'officiers de police judiciaire du TCS":"Cabinet du juge d'instruction de "+R.chef;
  if(stage===3)return T.court==="mil"?"Tribunal militaire de "+MIL[c.reg]:T.court==="tcs"?"Tribunal criminel spécial (Yaoundé)":"Tribunal de grande instance de "+R.chef;
  if(stage===4)return T.court==="tcs"?"Section spécialisée de la Cour suprême":"Cour d'appel "+(/^[AEÉIOU]/.test(R.n)?"de l'":"du ")+R.n;
  if(stage===5)return"Cour suprême (Yaoundé)";
  return prisonOf(G.S,c.reg).n;
}
JUS.courtName=courtName;
function jc(S){ // capacité de la justice (1 = situation actuelle)
  let b=1;if(S.mode==="pres"&&S.gov)b=S.gov.alloc.MINJUSTICE/70;
  return clamp((S.jus.mag/1380)*(.7+.3*b)*(1+S.jus.foraines*.15),.4,2.5);
}
JUS.newCase=function(S,type,reg,n,ville,silent,stageInit){
  if(!S.jus){S.cases=S.cases||[];} // avant initialisation
  const T=TYPES[type]||TYPES.casse;const R=CM.REG[reg]||CM.REG.CE;ville=ville||R.chef;
  const c={id:nid(),type,reg,n:Math.max(1,n|0),ville,t:T.n+" — "+ville,stage:stageInit||0,next:(S.day||0)+(stageInit?rnd(10,40):2),det:0,renvois:0,verdict:null,peine:0,conv:0,libre:0,appel:0,avocats:0,follow:null,hist:[],court:""};
  c.court=courtName(c,c.stage);
  if(stageInit>=2&&S.prisons){c.det=Math.round(c.n*T.det);prisonOf(S,reg).prev+=c.det}
  c.hist.push({d:S.day||0,t:STAGES[c.stage]+" : "+c.court});
  S.cases.unshift(c);S.cases=S.cases.filter((x,i)=>i<40||x.stage<7);
  if(!silent&&T.pol)inbox(S,{from:"Direction de la police judiciaire",t:"Interpellations : "+c.t,b:c.n+" personne(s) placée(s) en garde à vue. Délai légal : 48 heures renouvelables sur autorisation du procureur de la République.",k:"justice",caseId:c.id,reg});
  return c;
};

/* ---------- déroulement des affaires (quotidien) ---------- */
JUS.dayTick=function(S){
  if(!S.jus)JUS.init(S);
  for(const c of S.cases){if(c.stage>=7||S.day<c.next)continue;advance(S,c)}
};
function hist(c,t){c.hist.push({d:G.S.day,t});c.hist=c.hist.slice(-12)}
function advance(S,c){
  const T=TYPES[c.type]||TYPES.casse,P=prisonOf(S,c.reg),k=jc(S),instr=S.jus.instr[c.id]||0; // instr : -1 clémence, +1 fermeté
  if(c.stage===0){ // parquet
    if(Math.random()<.08&&!T.pol){c.stage=7;c.verdict="Classement sans suite par le procureur.";hist(c,c.verdict);return}
    c.stage=1;c.next=S.day+rnd(2,6);c.court=courtName(c,1);hist(c,"Déféré au parquet");return}
  if(c.stage===1){ // ouverture d'information et détention provisoire
    const dp=clamp(T.det+instr*.1-S.jus.reformeDP*.15-c.avocats*.1,0,1);c.det=Math.round(c.n*dp);P.prev+=c.det;
    c.stage=2;c.next=S.day+rnd(40,200)/k*(T.court==="mil"?1.4:1);c.court=courtName(c,2);
    hist(c,"Information judiciaire ouverte ; "+c.det+" placé(s) en détention provisoire à la "+P.n);return}
  if(c.stage===2){c.stage=3;c.next=S.day+rnd(15,45)/k;c.court=courtName(c,3);hist(c,"Renvoi devant le "+c.court);return}
  if(c.stage===3){ // audiences, renvois, verdict
    if(Math.random()<clamp(.45/k,.1,.7)&&c.renvois<5){c.renvois++;c.next=S.day+rnd(14,35);hist(c,"Audience renvoyée ("+pick(["absence d'un témoin","grève des avocats","dossier incomplet","composition du tribunal"])+")");return}
    verdict(S,c,instr);return}
  if(c.stage===4||c.stage===5){ // appel / pourvoi
    const r=Math.random();const P2=P;
    if(r<.15){P2.cond=Math.max(0,P2.cond-c.conv);c.libre+=c.conv;c.conv=0;c.verdict=(c.stage===4?"En appel":"Devant la Cour suprême")+" : relaxe générale.";hist(c,c.verdict);c.stage=7;window.SYS.cause(S,c.reg,"Relaxe en appel : "+c.t,1,"corruption");notify(S,c);return}
    if(r<.45){c.peine=Math.round(c.peine*.6);c.verdict=(c.stage===4?"La cour d'appel":"La Cour suprême")+" réduit les peines à "+fmtP(c.peine)+".";}
    else c.verdict=(c.stage===4?"La cour d'appel":"La Cour suprême")+" confirme le jugement.";
    hist(c,c.verdict);
    if(c.stage===4&&Math.random()<.2){c.stage=5;c.next=S.day+rnd(90,240);c.court=courtName(c,5);hist(c,"Pourvoi en cassation devant la Cour suprême");notify(S,c);return}
    toExecution(S,c);notify(S,c);return}
  if(c.stage===6){ // fin de peine
    P.cond=Math.max(0,P.cond-c.conv);c.libre+=c.conv;hist(c,c.conv+" libéré(s) en fin de peine");
    if(c.conv>=3)inbox(S,{from:"Régisseur de la "+P.n,t:"Libérations : "+c.t,b:c.conv+" détenu(s) ont purgé leur peine et sont libérés.",k:"info",reg:c.reg});
    c.conv=0;c.stage=7;return}
}
const fmtP=m=>m>=12?(Math.round(m/12*10)/10+" an"+(m>=24?"s":"")).replace(".",","):m+" mois";
function verdict(S,c,instr){
  const T=TYPES[c.type]||TYPES.casse,P=prisonOf(S,c.reg);const q=justiceQ(S);
  const rate=clamp(.62+instr*.12-c.avocats*.12+(T.pol?.1:0)-(q-50)/300,.05,.97);
  const conv=Math.round(c.n*rate);const peine=Math.round(rnd(T.peine[0],T.peine[1])*(1+instr*.2)*(1-c.avocats*.1));
  c.conv=conv;c.peine=peine;
  const acquitted=c.n-conv;const detAcq=Math.max(0,c.det-conv);
  P.prev=Math.max(0,P.prev-c.det);P.cond+=conv;c.libre+=detAcq;
  c.verdict=conv+" condamné(s) à "+fmtP(peine)+" de prison ferme, "+acquitted+" relaxé(s)."+(c.type==="corruption"&&conv?" Restitution de "+Math.round(rnd(2,40))+" milliards FCFA ordonnée.":"");
  hist(c,"Jugement : "+c.verdict);
  const harsh=peine>T.peine[0]*1.8||rate>.85;
  if(c.type==="corruption"){if(conv){S.nums.dette-=rnd(1,15);if(S.st)S.st.pop=clamp(S.st.pop+1.5,0,100)}else if(S.st)S.st.pop=clamp(S.st.pop-1.5,0,100)}
  if(T.pol&&harsh&&S.st)S.st.int=clamp(S.st.int-1.5,0,100);
  window.SYS.cause(S,c.reg,"Verdict : "+c.t.charAt(0).toLowerCase()+c.t.slice(1),harsh&&T.pol?-3:conv?1:-1,"corruption");
  if(c.type==="militants"&&S.opp)S.opp.noto=clamp(S.opp.noto+(harsh?4:1),0,100);
  // appel ?
  if(Math.random()<(T.pol?.6:.35)){c.stage=4;c.appel=1;c.next=S.day+rnd(60,160);c.court=courtName(c,4);hist(c,"Appel interjeté devant la "+c.court)}
  else toExecution(S,c);
  notify(S,c,true);
}
function toExecution(S,c){c.stage=c.conv>0?6:7;c.court=courtName(c,6);
  const lc=S.jus.liberationCond?.75:1;c.next=S.day+c.peine*30*lc*rnd(.85,1);if(c.conv>0)hist(c,"Exécution de la peine à la "+prisonOf(S,c.reg).n+" (libération prévue vers le "+G.dayLabel(c.next)+")")}
function notify(S,c,first){inbox(S,{from:"Greffe — "+c.court,t:(first?"Verdict — ":"Décision — ")+c.t,b:c.verdict,k:"justice",caseId:c.id,reg:c.reg,good:c.conv===0})}
function justiceQ(S){return clamp(40+(S.integ||35)*.3+(jc(S)-1)*20,15,95)}

/* ---------- prisons (mensuel) ---------- */
JUS.monthTick=function(S){
  if(!S.jus)JUS.init(S);const k=jc(S);let totPop=0;
  for(const p of S.prisons){
    const reg=p.reg?CM.REG[p.reg]:null;
    const secF=reg?clamp((60-S.regs[p.reg].sec)/40,0,1.5):.5;
    const inflow=(reg?reg.pop/30.36*1300*(.8+secF*.4):1300*.35)*(1-S.jus.reinsertion*.1)*(p.id==="autres"?.35:1);
    const judged=p.prev*.045*k*(1+S.jus.reformeDP*.2);
    const rel=p.cond/(16*(S.jus.liberationCond?.8:1));
    p.prev=Math.max(0,p.prev+inflow*(p.id==="autres"?1:.6)-judged);p.cond=Math.max(0,p.cond+judged*.6-rel);
    const pop=p.prev+p.cond;totPop+=pop;const occ=pop/p.cap;
    p.tension=clamp(p.tension+(occ*22+(412-p.ration)/20+(pop/Math.max(1,p.gard)>12?8:0)-p.tension)*.2+rnd(-2,2),0,100);
    if(p.id!=="autres"){
      if(p.tension>70&&Math.random()<.12){const m=Math.round(rnd(1,8));p.tension-=25;if(S.st){S.st.sec=clamp(S.st.sec-.6,0,100);S.st.int=clamp(S.st.int-.8,0,100)}
        window.SYS.cause(S,p.reg,"Mutinerie à la "+p.n,-3,"securite");JUS.newCase(S,"vol",p.reg,Math.round(rnd(5,20)),reg.chef,true,3);
        inbox(S,{from:"Secrétariat d'État chargé de l'Administration pénitentiaire",t:"Mutinerie à la "+p.n,b:"Des détenus ont pris le contrôle de plusieurs quartiers pour protester contre la surpopulation ("+Math.round(occ*100)+" %) et la nourriture. Bilan : "+m+" blessé(s). Les forces de l'ordre ont rétabli le calme ; une procédure est ouverte contre les meneurs.",k:"alerte",reg:p.reg})}
      else if(p.tension>55&&Math.random()<.08){const n=Math.round(rnd(3,25));p.prev=Math.max(0,p.prev-n);if(S.st)S.st.sec=clamp(S.st.sec-.7,0,100);window.SYS.cause(S,p.reg,"Évasion de "+n+" détenus à la "+p.n,-3,"securite");
        inbox(S,{from:"Gendarmerie nationale",t:"Évasion à la "+p.n,b:n+" détenus se sont évadés pendant la nuit. Un avis de recherche est lancé ; des gardiens sont suspendus.",k:"alerte",reg:p.reg})}
      else if(occ>2.2&&Math.random()<.06){window.SYS.cause(S,p.reg,"Épidémie de choléra à la "+p.n,-2,"sante");inbox(S,{from:"Médecin-chef de la "+p.n,t:"Épidémie en détention",b:"Des cas de choléra sont signalés dans les cellules surpeuplées. L'infirmerie manque de médicaments.",k:"alerte",reg:p.reg})}
    }
  }
  // nouvelles affaires venues de l'insécurité
  for(const r of CM.REGIONS){const sec=S.regs[r.id].sec;if(sec<40&&Math.random()<(40-sec)/120){const t=r.id==="EN"||r.id==="NW"||r.id==="SW"?(Math.random()<.5?"terror":"enlevement"):(Math.random()<.5?"enlevement":"vol");JUS.newCase(S,t,r.id,Math.round(rnd(2,12)),pick(r.villes),true)}}
  if(Math.random()<.3){const r=pick(CM.REGIONS);JUS.newCase(S,"vol",r.id,Math.round(rnd(2,6)),pick(r.villes),true)}
  const places=S.prisons.reduce((a,p)=>a+p.cap,0),prev=S.prisons.reduce((a,p)=>a+p.prev,0);
  S.jus.stats={pop:totPop,places,occ:totPop/places,dp:prev/Math.max(1,totPop)};
  // les droits humains pèsent sur la diplomatie
  if(S.st&&(S.mode==="pres"||S.mode==="min"))S.st.int=clamp(S.st.int-(S.jus.stats.occ-1.6)*.4-(S.jus.stats.dp-.6)*.8,0,100);
  // coût de l'alimentation
  const food=totPop*(S.prisons.reduce((a,p)=>a+p.ration*(p.prev+p.cond),0)/Math.max(1,totPop))*30/1e9;
  if(S.mode==="pres")S.nums.dette+=Math.max(0,food-totPop*412*30/1e9);
  // rapport annuel de la Commission des droits de l'homme
  if(S.m%12===3)inbox(S,{from:"Commission des droits de l'homme du Cameroun",t:"Rapport annuel sur les lieux de détention",b:"Population carcérale : "+fmt(totPop)+" détenus pour "+fmt(places)+" places ("+Math.round(S.jus.stats.occ*100)+" %). Détention provisoire : "+Math.round(S.jus.stats.dp*100)+" %. La Commission recommande de limiter la détention provisoire, d'accélérer les jugements et d'améliorer la ration alimentaire.",k:"rapport"});
};
JUS.addCapacity=function(S,reg,n){const p=prisonOf(S,reg);p.cap+=n;inbox(S,{from:"Administration pénitentiaire",t:"Nouvelles places de détention",b:n+" places supplémentaires ouvertes à la "+p.n+".",k:"bonne",reg})};

/* ---------- qui peut gérer ? ---------- */
function manager(S){return S.mode==="pres"||(S.mode==="min"&&S.minis.id==="MINJUSTICE")}
function pay(S,mds){if(S.mode==="pres"){S.nums.dette+=mds;return true}if(S.mode==="min"){const M=mds*1000;if(S.minis.fonds<M)return false;S.minis.fonds-=M;return true}return false}
JUS.manager=manager;

/* ---------- onglet Justice ---------- */
JUS.render=function(S){
  if(!S.jus)JUS.init(S);if(!S.jus.stats)JUS.monthTick(S);
  const J=S.jus,st=J.stats,mg=manager(S);const views=[["dossiers","Affaires"],["prisons","Prisons"],["politique","Politique pénale"]];
  let h='<div class="card"><span class="eyebrow">Justice et administration pénitentiaire</span><div class="facts">'+
   f(fmt(st.pop),"détenus pour "+fmt(st.places)+" places")+f(Math.round(st.occ*100)+" %","taux d'occupation des prisons")+f(Math.round(st.dp*100)+" %","en détention provisoire (non jugés)")+f(fmt(J.mag),"magistrats (1 pour "+fmt(Math.round(S.nums.popu/J.mag))+" hab.)")+'</div><span class="small muted">Situation réelle fin 2024 : 37 150 détenus pour 20 955 places (177 %), plus de 70 % de prévenus, ration de 412 FCFA par jour. Objectif OHADA : 1 magistrat pour 15 000 habitants.'+(mg?"":" Vous suivez les affaires ; seuls le président et le ministre de la Justice pilotent la politique pénale.")+'</span></div>'+
   '<div class="row">'+views.map(([k,n])=>'<button class="btn small'+(J.view===k?" primary":"")+'" data-jv="'+k+'">'+n+'</button>').join("")+'</div>';
  if(J.view==="dossiers"){
    const act=S.cases.filter(c=>c.stage<7),clos=S.cases.filter(c=>c.stage>=7).slice(0,6);
    h+=act.map(c=>caseCard(S,c,mg)).join("")||'<p class="small muted">Aucune affaire en cours.</p>';
    if(clos.length)h+='<details class="card"><summary><b>Affaires closes</b></summary>'+clos.map(c=>'<div class="small" style="margin-top:6px"><b>'+esc(c.t)+'</b> — '+esc(c.verdict||"")+'</div>').join("")+'</details>';
  }else if(J.view==="prisons"){
    h+=S.prisons.map(p=>{const pop=p.prev+p.cond,occ=pop/p.cap,t=p.tension;return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(p.n)+'</b>'+pill(t>70?"Explosive":t>55?"Tendue":t>35?"Fragile":"Calme",t>70?"bad":t>55?"warn":"ok")+'</div><div class="bar" style="height:10px"><i class="'+(occ>2?"low":occ>1.3?"mid":"")+'" style="width:'+Math.min(100,occ/3*100)+'%"></i></div><span class="small">'+fmt(pop)+' détenus pour '+fmt(p.cap)+' places ('+Math.round(occ*100)+' %) · '+fmt(p.prev)+' prévenus, '+fmt(p.cond)+' condamnés · ration '+p.ration+' FCFA/jour · '+fmt(p.gard)+' gardiens</span>'+
      (mg?'<div class="row"><button class="btn small" data-rat="'+p.id+'">Ration +150 FCFA</button><button class="btn small" data-gar="'+p.id+'">+100 gardiens</button>'+(p.reg?'<button class="btn small" data-ext="'+p.id+'">Extension (+1 500 places)</button>':"")+'<button class="btn small" data-trf="'+p.id+'">Transférer 300 détenus</button><button class="btn small ghost" data-insp="'+p.id+'">Inspection</button></div>':(p.reg?'<button class="btn small ghost" data-see="'+p.reg+'" style="align-self:flex-start">Voir la région</button>':""))+'</div>'}).join("");
  }else{
    h+=mg?'<div class="card"><span class="eyebrow">Leviers de la politique pénale</span>'+
     lever("mag","Recruter une promotion de 40 magistrats (ENAM)","Plus de capacité de jugement, moins de détention provisoire. Coût : 2 Mds par an.")+
     lever("for","Organiser des audiences foraines et des sessions accélérées","Des juges se déplacent pour vider les stocks d'affaires. Coût : 1,5 Md.")+
     lever("dp","Réformer la détention provisoire (délais stricts)","Projet de loi : nécessite une majorité à l'Assemblée. Meilleure image internationale.",J.reformeDP)+
     lever("lc","Élargir la libération conditionnelle et les aménagements de peine","Désengorge les prisons, mais l'opinion craint le laxisme.",J.liberationCond)+
     lever("rei","Programmes de réinsertion et de formation en prison","Moins de récidive à terme. Coût : 1 Md.",J.reinsertion)+
     lever("csm","Réunir le Conseil supérieur de la magistrature","Nominations, avancements et sanctions des magistrats. Il ne s'était pas réuni pendant six ans avant mars 2026.")+
     lever("igsj","Mission de l'Inspection générale des services judiciaires","Traque la corruption dans les tribunaux et les greffes.")+
     (S.mode==="pres"?lever("grace","Décret de grâce collective","Libère les condamnés à de courtes peines. Mesure de décongestion immédiate."):"")+'</div>'
     :'<div class="card"><p class="small">La politique pénale est conduite par le président de la République et le ministre de la Justice, garde des Sceaux. Vous pouvez suivre les affaires, fournir des avocats ou saisir la justice.</p></div>';
  }
  $("panel").innerHTML=h;const P=$("panel");
  P.querySelectorAll("[data-jv]").forEach(b=>b.onclick=()=>{J.view=b.dataset.jv;G.render()});
  P.querySelectorAll("[data-see]").forEach(b=>b.onclick=()=>G.viewRegion(b.dataset.see));
  P.querySelectorAll("[data-hist]").forEach(b=>b.onclick=()=>{const c=S.cases.find(x=>x.id===b.dataset.hist);G.sheet('<h3 class="h2">'+esc(c.t)+'</h3><div class="log">'+c.hist.map(x=>'<div><small>'+esc(G.dayLabel(x.d))+'</small><br>'+esc(x.t)+'</div>').join("")+'</div>')});
  P.querySelectorAll("[data-cact]").forEach(b=>b.onclick=()=>caseAction(S,S.cases.find(x=>x.id===b.dataset.id),b.dataset.cact));
  const pr=id=>S.prisons.find(x=>x.id===id);
  P.querySelectorAll("[data-rat]").forEach(b=>b.onclick=()=>{const p=pr(b.dataset.rat);if(!pay(S,.5))return G.toast("Crédits insuffisants.");p.ration+=150;p.tension=clamp(p.tension-10,0,100);G.toast("Ration portée à "+p.ration+" FCFA par jour");G.render()});
  P.querySelectorAll("[data-gar]").forEach(b=>b.onclick=()=>{const p=pr(b.dataset.gar);if(!pay(S,.4))return G.toast("Crédits insuffisants.");p.gard+=100;p.tension=clamp(p.tension-6,0,100);G.render()});
  P.querySelectorAll("[data-ext]").forEach(b=>b.onclick=()=>{const p=pr(b.dataset.ext);window.SYS.launchTender(S,"prison",p.reg,CM.REG[p.reg].chef,"nat",S.mode==="pres"?"etat":"ministere");G.toast("Appel d'offres lancé pour l'extension (onglet Projets)");G.render()});
  P.querySelectorAll("[data-trf]").forEach(b=>b.onclick=()=>{const p=pr(b.dataset.trf);const dest=S.prisons.filter(x=>x!==p).sort((a,c)=>(a.prev+a.cond)/a.cap-(c.prev+c.cond)/c.cap)[0];const n=Math.min(300,p.prev);p.prev-=n;dest.prev+=n;p.tension=clamp(p.tension-8,0,100);dest.tension=clamp(dest.tension+6,0,100);G.toast(n+" détenus transférés vers la "+dest.n);G.render()});
  P.querySelectorAll("[data-insp]").forEach(b=>b.onclick=()=>{const p=pr(b.dataset.insp);const pop=p.prev+p.cond;inbox(S,{from:"Inspection des services pénitentiaires",t:"Inspection : "+p.n,b:"Occupation : "+Math.round(pop/p.cap*100)+" %. Un gardien pour "+Math.round(pop/p.gard)+" détenus. Ration : "+p.ration+" FCFA par jour. "+(p.tension>55?"Climat très tendu : risque de mutinerie ou d'évasion.":"Climat sous contrôle.")+" "+Math.round(p.prev/Math.max(1,pop)*100)+" % des détenus attendent leur jugement.",k:"rapport"});G.toast("Rapport d'inspection au courrier");G.render()});
  P.querySelectorAll("[data-lev]").forEach(b=>b.onclick=()=>lev(S,b.dataset.lev));
  function f(b,s){return'<div class="fact"><b>'+b+'</b><span>'+s+'</span></div>'}
  function lever(id,n,d,on){return'<button class="choice" data-lev="'+id+'"'+(on?" disabled":"")+'><span class="t">'+esc(n)+(on?" ✓":"")+'</span><span class="small muted">'+esc(d)+'</span></button>'}
};
function caseCard(S,c,mg){
  const T=TYPES[c.type]||TYPES.casse;const chain=[0,1,2,3,4,5,6].map(i=>'<span class="pill '+(i<c.stage?"ok":i===c.stage?"warn":"")+'" style="'+(i>c.stage?"opacity:.35":"")+'">'+esc(STAGES[i])+'</span>').join(" ");
  const mine=c.type==="militants"&&S.opp;
  let acts='<button class="btn small ghost" data-hist="'+c.id+'">Historique</button><button class="btn small" data-cact="suivi" data-id="'+c.id+'">Confier le suivi</button>';
  if(S.mode==="pres"&&c.stage===6)acts+='<button class="btn small" data-cact="grace" data-id="'+c.id+'">Grâce</button>';
  if(mg&&c.stage>=1&&c.stage<=3)acts+='<button class="btn small" data-cact="clem" data-id="'+c.id+'">Instruire le parquet : clémence</button><button class="btn small" data-cact="ferm" data-id="'+c.id+'">Instruire le parquet : fermeté</button>';
  if(S.opp&&c.stage>=1&&c.stage<=5)acts+='<button class="btn small" data-cact="avo" data-id="'+c.id+'">Avocats (3 M FCFA)</button>';
  if(S.opp&&c.stage===2&&c.det>0)acts+='<button class="btn small" data-cact="lp" data-id="'+c.id+'">Demander la liberté provisoire</button>';
  if(mine&&c.stage===6&&!c.appel)acts+='<button class="btn small" data-cact="appel" data-id="'+c.id+'">Faire appel</button>';
  return'<div class="card" style="gap:6px"><div class="row" style="justify-content:space-between"><b>'+esc(c.t)+'</b>'+(T.pol?pill("Affaire politique","warn"):"")+'</div><div class="row" style="gap:4px">'+chain+'</div><span class="small muted">'+esc(c.court)+' · '+c.n+' mis en cause'+(c.det?" · "+c.det+" en détention":"")+(c.renvois?" · "+c.renvois+" renvoi(s)":"")+(c.stage<7?' · prochaine étape vers le '+esc(G.dayLabel(c.next)):"")+'</span>'+(c.verdict?'<span class="small">'+esc(c.verdict)+'</span>':"")+'<div class="row">'+acts+'</div></div>';
}
function caseAction(S,c,a){
  if(a==="suivi"){const who=S.mode==="pres"?"Cabinet du ministre de la Justice":S.mode==="min"?"Direction des affaires pénales":S.opp?((S.opp.experts||[]).find(e=>e.dom==="droit")||{n:"Votre juriste"}).n:"Votre avocat";S.tasks.push({id:nid(),who,sujet:"suivi",caseId:c.id,due:S.m+1,skill:70});G.toast("Suivi confié : compte rendu le mois prochain")}
  else if(a==="grace"){const P=prisonOf(S,c.reg);P.cond=Math.max(0,P.cond-c.conv);c.libre+=c.conv;c.conv=0;c.stage=7;c.verdict=(c.verdict||"")+" Grâce présidentielle.";hist(c,"Grâce présidentielle");window.SYS.cause(S,c.reg,"Grâce pour les condamnés : "+c.t.toLowerCase(),3,"");S.st.int=clamp(S.st.int+1.5,0,100);G.toast("Grâce accordée")}
  else if(a==="clem"||a==="ferm"){S.jus.instr[c.id]=a==="clem"?-1:1;hist(c,"Instructions du garde des Sceaux au parquet : "+(a==="clem"?"clémence":"fermeté"));if(a==="ferm"&&TYPES[c.type].pol&&S.st)S.st.int=clamp(S.st.int-1,0,100);G.toast("Instructions transmises au parquet")}
  else if(a==="avo"){if(S.opp.fonds<3)return G.toast("Trésorerie insuffisante.");S.opp.fonds-=3;c.avocats++;S.opp.noto=clamp(S.opp.noto+1,0,100);hist(c,"Un collectif d'avocats prend la défense");G.toast("Les avocats prennent le dossier")}
  else if(a==="lp"){const ok=Math.random()<.25+c.avocats*.15;if(ok){const P=prisonOf(S,c.reg);const n=Math.round(c.det*.5);P.prev=Math.max(0,P.prev-n);c.det-=n;hist(c,n+" mis en liberté provisoire");G.toast(n+" militants mis en liberté provisoire")}else{hist(c,"Demande de liberté provisoire rejetée");G.toast("Demande rejetée par le juge")}}
  else if(a==="appel"){c.stage=4;c.appel=1;c.next=S.day+rnd(60,150);c.court=courtName(c,4);hist(c,"Appel interjeté par la défense");G.toast("Appel déposé")}
  G.render();
}
function lev(S,id){
  const J=S.jus;
  if(id==="mag"){if(!pay(S,2))return G.toast("Crédits insuffisants.");J.mag+=40;inbox(S,{from:"École nationale d'administration et de magistrature",t:"Nouvelle promotion de magistrats",b:"40 auditeurs de justice supplémentaires. Ils seront opérationnels après leur formation.",k:"info"})}
  else if(id==="for"){if(!pay(S,1.5))return G.toast("Crédits insuffisants.");J.foraines++;window.SYS.cause(S,"CE","Audiences foraines pour vider les stocks d'affaires",1,"corruption")}
  else if(id==="dp"){const maj=S.mode==="pres"?(S.an[S.party]||0)>=91:true;if(!maj&&Math.random()<.5){G.toast("L'Assemblée rejette la réforme.");return G.render()}J.reformeDP=1;if(S.st)S.st.int=clamp(S.st.int+3,0,100);inbox(S,{from:"Assemblée nationale",t:"Réforme de la détention provisoire adoptée",b:"Des délais maximums stricts s'imposent désormais aux juges d'instruction.",k:"bonne"})}
  else if(id==="lc"){J.liberationCond=1;if(S.st){S.st.pop=clamp(S.st.pop-1,0,100);S.st.int=clamp(S.st.int+1,0,100)}}
  else if(id==="rei"){if(!pay(S,1))return G.toast("Crédits insuffisants.");J.reinsertion=1}
  else if(id==="csm"){if(S.day-J.csm<180)return G.toast("Le Conseil s'est réuni récemment.");J.csm=S.day;J.mag+=10;S.integ=clamp((S.integ||35)+3,0,100);inbox(S,{from:"Conseil supérieur de la magistrature",t:"Session du Conseil supérieur de la magistrature",b:"Nominations, avancements et affectations prononcés ; des magistrats sanctionnés pour manquements.",k:"info"})}
  else if(id==="igsj"){if(S.day-J.igsj<60)return G.toast("Une mission est déjà en cours.");J.igsj=S.day;const n=Math.round(rnd(1,6));S.integ=clamp((S.integ||35)+2,0,100);inbox(S,{from:"Inspection générale des services judiciaires",t:"Rapport de mission",b:n+" magistrats et greffiers mis en cause pour corruption ou négligence. Des poursuites disciplinaires sont engagées.",k:"rapport"})}
  else if(id==="grace"){let n=0;for(const p of S.prisons){const k=Math.round(p.cond*.2);p.cond-=k;n+=k;p.tension=clamp(p.tension-8,0,100)}S.st.int=clamp(S.st.int+3,0,100);S.st.sec=clamp(S.st.sec-1,0,100);inbox(S,{from:"Présidence de la République",t:"Décret de grâce collective",b:fmt(n)+" condamnés à de courtes peines sont libérés. Les prisons respirent.",k:"bonne"})}
  G.toast("Mesure prise");G.render();
}
})();
