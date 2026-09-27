/* Chemin d'Etoudi — la vie du pays en arrière-plan : administration territoriale, police et gendarmerie,
   hôpitaux (malades, décès, évaluations), entreprises publiques, audiences, et le quotidien des Camerounais.
   Repères réels : paludisme = 26,3 % des consultations et 1 261 décès en 2025 sur 24 950 décès en formation
   sanitaire ; super 840 FCFA/l, gasoil 828 FCFA/l. Les noms des responsables sont fictifs. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const VIE={};window.VIE=VIE;
let uid=1;const nid=()=>"v"+Date.now().toString(36)+(uid++);
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';
const inbox=(S,o)=>window.SYS.inbox(S,o);
const nom=(r,x)=>window.SYS.nom(r,x);
/* au départ, peu de femmes aux postes de direction (comme dans la réalité) : à vous de rééquilibrer */
const nomT=(r,p)=>window.SYS.nom(r,Math.random()<p?"f":"m");
const deR=r=>(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n;

/* ---------- conditions d'âge (Code électoral, Code civil) ---------- */
VIE.AGES=[["Électeur",20],["Conseiller municipal",23],["Conseiller régional",23],["Député",23],["Président de la République",35],["Sénateur",40]];
const lcP=t=>t.charAt(0).toLowerCase()+t.slice(1);
VIE.ageNote=function(age){
  age=+age||0;if(!age)return"";
  const ok=VIE.AGES.filter(a=>age>=a[1]).map(a=>lcP(a[0])),ko=VIE.AGES.filter(a=>age<a[1]);
  let t="À "+age+" ans, ";
  if(age<18)return t+"vous êtes mineur : vous ne pouvez ni voter, ni être candidat, ni diriger une entreprise.";
  t+=ok.length?"vous pouvez être "+ok.join(", ")+". ":"vous ne pouvez encore exercer aucun mandat électif. ";
  if(ko.length)t+="Pas encore éligible : "+ko.map(a=>lcP(a[0])+" ("+a[1]+" ans, dans "+(a[1]-age)+" an"+(a[1]-age>1?"s":"")+")").join(", ")+".";
  if(age<21)t+=" La majorité civile est à 21 ans.";
  return t;
};
VIE.ageNow=S=>(S.age||40)+Math.floor((S.m||0)/12);
/* anniversaire : rappel quand un mandat devient accessible */
VIE.ageTick=function(S){
  const now=VIE.ageNow(S),prev=S.ageVu||now;S.ageVu=now;if(now<=prev)return;
  const neuf=VIE.AGES.filter(a=>a[1]>prev&&a[1]<=now).map(a=>lcP(a[0]));
  G.toast("Joyeux anniversaire : vous avez "+now+" ans.");
  inbox(S,{from:"État civil",t:"Vous avez désormais "+now+" ans",b:(neuf.length?"Vous devenez éligible : "+neuf.join(", ")+". ":"")+VIE.ageNote(now),k:"info"});
};
/* champ nom + âge, commun à tous les profils */
VIE.identity=function(idN,idA,defAge,ph){
  return'<label class="f" for="'+idN+'">Votre nom dans le jeu (obligatoire)<input type="text" id="'+idN+'" maxlength="24" placeholder="'+esc(ph||"Ex. Aïssatou Mbarga")+'" autocomplete="off"></label>'+
   '<label class="f" for="'+idA+'">Votre âge<input type="number" id="'+idA+'" min="16" max="95" value="'+defAge+'"></label><p class="small" id="'+idA+'_n" style="color:var(--y)">'+esc(VIE.ageNote(defAge))+'</p>';
};
VIE.bindIdentity=function(idA){const a=$(idA),n=$(idA+"_n");if(a&&n)a.oninput=()=>n.textContent=VIE.ageNote(a.value)};
VIE.checkIdentity=function(idN,idA,min,poste){
  const n=($(idN).value||"").trim(),a=+$(idA).value||0;
  if(n.length<2){G.toast("Donnez votre nom dans le jeu.");$(idN).focus();return null}
  if(!a||a<16||a>95){G.toast("Indiquez un âge entre 16 et 95 ans.");return null}
  if(min&&a<min){G.toast("Il faut avoir au moins "+min+" ans pour être "+poste+".");return null}
  return{name:n,age:a};
};

/* ---------- constitution des organes ---------- */
const HOPITAUX=[["hgy","Hôpital général de Yaoundé","CE",300,.18],["hcy","Hôpital central de Yaoundé","CE",650,.3],["chu","Centre hospitalier universitaire de Yaoundé","CE",250,.15],["hgd","Hôpital général de Douala","LT",320,.25],["laq","Hôpital Laquintinie de Douala","LT",700,.45]];
const ENTREPRISES=[["ENEO","Électricité","MINEE",38],["CAMWATER","Eau potable","MINEE",40],["SONARA","Raffinerie de Limbé (incendie de 2019, réhabilitation)","MINMIDT",30],["SNH","Hydrocarbures","MINMIDT",60],["CAMTEL","Télécommunications","MINPOSTEL",45],["Camair-Co","Transport aérien","MINT",25],["PAD","Port autonome de Douala","MINT",55],["CAMPOST","Poste","MINPOSTEL",35],["CNPS","Sécurité sociale","MINTSS",50],["SODECOTON","Coton","MINADER",50],["CDC","Plantations du Sud-Ouest","MINADER",30],
 ["CAMRAIL","Chemin de fer (concession de l'État)","MINT",40],["PAK","Port autonome de Kribi","MINT",50],["ADC","Aéroports du Cameroun","MINT",40],["SIC","Société immobilière du Cameroun","MINHDU",35],
 ["MAETUR","Aménagement des terrains urbains et ruraux","MINHDU",35],["CFC","Crédit foncier du Cameroun","MINHDU",40],["FEICOM","Fonds spécial d'équipement des communes","MINDDEVEL",45],
 ["CRTV","Radio-télévision publique","MINCOM",40],["SOPECAM","Presse publique (Cameroon Tribune)","MINCOM",35],["ALUCAM","Aluminium d'Édéa","MINMIDT",40],["SONAMINES","Société nationale des mines","MINMIDT",30],
 ["SODEPA","Développement des productions animales","MINEPIA",30],["MAGZI","Zones industrielles","MINMIDT",35],["SODECAO","Développement du cacao","MINADER",35],["ONCC","Office national du cacao et du café","MINCOMMERCE",45],
 ["ART","Agence de régulation des télécommunications","MINPOSTEL",45],["ARSEL","Régulation du secteur de l'électricité","MINEE",45],["EDC","Electricity Development Corporation (barrages)","MINEE",45],
 ["CSPH","Caisse de stabilisation des prix des hydrocarbures","MINCOMMERCE",40],["SNI","Société nationale d'investissement","MINFI",40]];
const mkEnt=e=>({id:e[0],n:e[0],act:e[1],tut:e[2],perf:e[3]+rnd(-5,5),dg:nomT(pick(CM.REGIONS).id,.15),pl:0});
const MALADIES=[["palu","Paludisme",.263,.012],["ira","Infections respiratoires",.12,.01],["diar","Diarrhées et fièvre typhoïde",.12,.008],["cardio","Hypertension et diabète",.08,.03],["trauma","Accidents et traumatismes",.07,.03],["mat","Grossesses et accouchements",.1,.004],["vih","VIH et tuberculose",.05,.05],["malnut","Malnutrition",.02,.03],["menin","Méningite",.005,.1],["autres","Autres pathologies",.172,.01]];
VIE.init=function(S){
  if(S.org){for(const e of ENTREPRISES)if(!S.org.ent.find(x=>x.id===e[0]))S.org.ent.push(mkEnt(e));return}
  const O={gouv:[],pref:[],comm:[],gend:[],hop:[],ent:[],aud:[],nextAud:(S.day||0)+1,nextPl:(S.day||0)+2,quot:null};
  for(const r of CM.REGIONS){
    O.gouv.push({id:"g"+r.id,reg:r.id,n:nomT(r.id===pick(["CE","SU"])?"CE":regX(r.id),.1),perf:rnd(40,70),integ:rnd(40,80),pl:0});
    O.gend.push({id:"l"+r.id,reg:r.id,n:"Colonel "+nomT(regX(r.id),.05),perf:rnd(40,70),integ:rnd(45,80),pl:0});
    r.villes.forEach((v,i)=>{O.pref.push({id:"p"+r.id+i,reg:r.id,ville:v,n:nomT(regX(r.id),.12),perf:rnd(35,70),integ:rnd(35,80),pl:0});O.comm.push({id:"c"+r.id+i,reg:r.id,ville:v,n:"Commissaire "+nomT(regX(r.id),.15),perf:rnd(30,70),integ:rnd(25,80),pl:0})});
    if(!["CE","LT"].includes(r.id))O.hop.push(mkHop("hr"+r.id,"Hôpital régional de "+r.chef,r.id,220,r.pop/30.36*.6));
    O.hop.push(mkHop("hd"+r.id,"Hôpitaux de district de la région "+deR(r),r.id,900,r.pop/30.36*.9));
  }
  for(const h of HOPITAUX)O.hop.push(mkHop(h[0],h[1],h[2],h[3],h[4]));
  for(const e of ENTREPRISES)O.ent.push(mkEnt(e));
  S.org=O;
};
function regX(r){return Math.random()<.6?r:pick(CM.REGIONS).id}
function mkHop(id,n,reg,lits,share){return{id,n,reg,lits,share,med:Math.round(lits/12),inf:Math.round(lits/3),stock:rnd(35,70),dir:nomT(regX(reg),.3),sat:rnd(35,60),stats:null,pl:0}}

/* ---------- qui peut agir ? ---------- */
function canPolice(S){return S.mode==="pres"||(S.mode==="min"&&["DGSN","MINATD","MINDEF"].includes(S.minis.id))}
function canTerr(S){return S.mode==="pres"||(S.mode==="min"&&S.minis.id==="MINATD")}
function canHop(S){return S.mode==="pres"||(S.mode==="min"&&S.minis.id==="MINSANTE")}
function canEnt(S,e){return S.mode==="pres"||(S.mode==="min"&&S.minis.id===e.tut)}
function pay(S,mds){if(S.mode==="pres"){S.nums.dette+=mds;return true}if(S.mode==="min"){const M=mds*1000;if(S.minis.fonds<M)return false;S.minis.fonds-=M;return true}return false}

/* ---------- fonctionnement mensuel ---------- */
function saison(m,reg){const mo=(CM.DEBUT.mois+m)%12;const nord=["EN","NO","AD"].includes(reg);if(nord)return mo>=5&&mo<=9?"pluies":"sèche";return mo>=2&&mo<=10?"pluies":"sèche"}
VIE.monthTick=function(S){
  if(!S.org)VIE.init(S);const O=S.org,popM=S.nums.popu/30.36e6;
  let totDec=0,totCons=0,palDec=0;
  for(const h of O.hop){
    const r=CM.REG[h.reg],sai=saison(S.m,h.reg);const mo=(CM.DEBUT.mois+S.m)%12;
    const base=S.nums.popu*h.share/10*.04*(h.id.startsWith("hd")?1:.35); // consultations mensuelles
    const staff=clamp((h.med*12+h.inf*3)/(h.lits*2),.3,1.4),st=h.stock/100;
    const by={};let cons=0,dec=0;
    for(const [k,n,p,l] of MALADIES){let f=p;
      if(k==="palu")f*=sai==="pluies"?1.35:.7;
      if(k==="menin")f*=["EN","NO"].includes(h.reg)&&mo>=0&&mo<=3?8:.3;
      if(k==="malnut")f*=["EN","NO"].includes(h.reg)?3:.5;
      if(k==="diar"&&S.mood[h.reg].c.some(c=>/chol[ée]ra|inond/i.test(c.t)))f*=2.2;
      if(k==="trauma")f*=["LT","CE"].includes(h.reg)?1.3:1;
      const c=Math.round(base*f*rnd(.9,1.1));const d=Math.round(c*l*.12*(1.5-st*.6)*(1.4-staff*.5));by[k]={c,d};cons+=c;dec+=d}
    const occ=clamp(cons*.08/(h.lits*30/5),.3,2.2);
    h.stock=clamp(h.stock-occ*8+rnd(-3,3)+(S.mode==="pres"&&S.gov?(S.gov.alloc.MINSANTE/388.9-1)*20:0),0,100);
    h.sat=clamp(h.sat+((st*40+staff*30+(2-occ)*15)-h.sat)*.3+rnd(-3,3),0,100);
    h.stats={cons,dec,occ,by,m:S.m};totDec+=dec;totCons+=cons;palDec+=by.palu.d;
    // plaintes des patients
    if(h.sat<40&&Math.random()<.5){const why=h.stock<30?"ruptures de médicaments":occ>1.3?"malades couchés à même le sol, services saturés":staff<.6?"manque de médecins":"frais exigés avant les soins d'urgence";h.pl++;
      window.SYS.cause(S,h.reg,"Patients en colère "+(/^Hôpitaux/.test(h.n)?"aux "+lcP(h.n):"à l'"+lcP(h.n))+" : "+why,-2,"sante");
      if(h.pl>=3){h.pl=0;inbox(S,{from:"Associations de patients",t:"Colère contre "+(/^Hôpitaux/.test(h.n)?"les "+lcP(h.n):"l'"+lcP(h.n)),b:"Plaintes répétées : "+why+". Satisfaction des usagers : "+Math.round(h.sat)+"/100. Directeur : "+h.dir+".",k:"alerte",reg:h.reg,org:{k:"hop",id:h.id}})}}
  }
  O.sante={m:S.m,cons:totCons,dec:totDec,palu:palDec};
  // administrations et services de sécurité : performance, intégrité, plaintes
  const grp=[["comm","police"],["pref","prefet"],["gouv","gouverneur"],["gend","gendarmerie"]];
  for(const [key,kind] of grp)for(const o of O[key]){
    o.perf=clamp(o.perf+rnd(-3,3)+(S.regs[o.reg].sec-45)*.02,0,100);o.integ=clamp(o.integ+rnd(-2,2),0,100);
    if(kind==="police")S.regs[o.reg].sec=clamp(S.regs[o.reg].sec+(o.perf-50)*.004,2,98);
  }
  for(const e of O.ent){e.perf=clamp(e.perf+rnd(-4,4),0,100);
    if(e.perf<30&&Math.random()<.2){const t={ENEO:"délestages géants",CAMWATER:"coupures d'eau prolongées",SONARA:"retards de réhabilitation",CAMTEL:"pannes d'Internet",["Camair-Co"]:"vols annulés, avion cloué au sol",PAD:"congestion du port",CAMPOST:"salaires impayés des agents",CNPS:"retards dans le paiement des pensions",SODECOTON:"paiement tardif des cotonculteurs",CDC:"grève des ouvriers des plantations",SNH:"baisse des recettes pétrolières"}[e.id]||"mauvaise gestion";
      inbox(S,{from:"Revue de presse",t:e.n+" : "+t,b:"La gestion de "+e.n+" ("+e.act.toLowerCase()+") est vivement critiquée. Directeur général : "+e.dg+". Tutelle : "+e.tut+".",k:"alerte",org:{k:"ent",id:e.id}});window.SYS.cause(S,e.id==="CDC"?"SW":e.id==="SODECOTON"?"NO":"LT",e.n+" : "+t,-2,"emploi")}}
  if(S.mode==="pres"&&S.st)S.st.soc=clamp(S.st.soc+(O.hop.reduce((a,h)=>a+h.sat,0)/O.hop.length-45)*.02,0,100);
};

/* ---------- plaintes contre les responsables (tous les quelques jours) ---------- */
const PL={police:["rackets aux points de contrôle","arrestations arbitraires et gardes à vue abusives","inaction face aux cambriolages","violences contre des jeunes du quartier","dépôts de plainte payants"],prefet:["interdictions de réunion jugées abusives","attributions de terrains contestées","absence sur le terrain"],gouverneur:["gestion de l'insécurité jugée molle","favoritisme dans les nominations locales"],gendarmerie:["rackets sur les axes routiers","bavure lors d'une interpellation"]};
function plainteTick(S){
  const O=S.org;const all=[].concat(O.comm.map(o=>["police",o]),O.pref.map(o=>["prefet",o]),O.gouv.map(o=>["gouverneur",o]),O.gend.map(o=>["gendarmerie",o]));
  const score=([k,o])=>(100-o.integ)*.6+(100-o.perf)*.4;const worst=all.slice().sort((a,b)=>score(b)-score(a)).slice(0,10);
  for(let i=0;i<2;i++){const [k,o]=Math.random()<.6?pick(worst):pick(all);const bad=(100-o.integ)*.6+(100-o.perf)*.4;if(Math.random()*100>bad)continue;
    const why=pick(PL[k]);o.pl++;o.last=why;const lieu=o.ville||CM.REG[o.reg].chef;
    const who=k==="police"?o.n+" (commissariat central de "+lieu+")":k==="prefet"?"le préfet "+o.n+" ("+lieu+")":k==="gouverneur"?"le gouverneur "+o.n+" (région "+deR(CM.REG[o.reg])+")":o.n+" (légion de gendarmerie de la région "+deR(CM.REG[o.reg])+")";
    window.SYS.cause(S,o.reg,"Les habitants de "+lieu+" se plaignent de "+who+" : "+why,-2,k==="police"||k==="gendarmerie"?"securite":"corruption");
    if(o.pl>=3){o.pl=0;inbox(S,{from:"Remontées de la population · "+lieu,t:"Plaintes répétées contre "+who,b:"Depuis plusieurs semaines, les habitants dénoncent : "+why+". Efficacité estimée : "+Math.round(o.perf)+"/100, intégrité : "+Math.round(o.integ)+"/100. Des mesures sont attendues.",k:"alerte",reg:o.reg,org:{k,id:o.id}});G.toast("Remous à "+lieu+" : plaintes contre "+who.split(" (")[0])}
  }
}

/* ---------- audiences ---------- */
const AUD={
 pres:[["Une délégation de chefs traditionnels {r}","demande une route bitumée et un forage pour leurs villages.",[["Promettre un programme spécial",{pop:2,dette:30}],["Confier le dossier au Premier ministre",{pop:1}],["Leur rappeler les contraintes budgétaires",{pop:-1}]]],
      ["Les syndicats de l'enseignement","réclament le paiement des arriérés et l'intégration des enseignants.",[["Ordonner le paiement d'une tranche",{soc:3,dette:40}],["Les renvoyer au ministre des Finances",{soc:-1}],["Refuser",{soc:-3}]]],
      ["Le patronat (GECAM)","s'inquiète des arriérés de l'État et de la fiscalité.",[["Annoncer le paiement de 50 Mds d'arriérés",{eco:2,dette:50}],["Promettre une concertation",{eco:1}],["Écourter l'audience",{eco:-1}]]],
      ["Un investisseur étranger","propose une usine de transformation de cacao à Kribi.",[["Accorder des facilités",{eco:3,int:1}],["Demander une étude",{eco:1}],["Décliner",{}]]],
      ["Les responsables religieux","appellent au dialogue dans les régions anglophones.",[["Accepter une médiation",{soc:3,int:2}],["Remercier sans engagement",{}],["Rejeter",{soc:-2}]]]],
 min:[["Le syndicat des agents du ministère","réclame des primes et de meilleures conditions de travail.",[["Accorder une prime",{perf:2,fonds:-80}],["Ouvrir une négociation",{perf:1}],["Refuser",{perf:-2}]]],
      ["Les élus {r}","demandent un projet de votre ministère dans leur région.",[["Inscrire un projet au budget",{conf:1,fonds:-150,mood:3}],["Promettre une étude",{mood:1}],["Refuser faute de crédits",{mood:-2}]]],
      ["Un bailleur de fonds (Banque mondiale)","propose de cofinancer un programme de votre secteur.",[["Accepter et signer",{perf:3,fonds:200}],["Demander des conditions plus souples",{perf:1}],["Refuser",{perf:-1}]]],
      ["Un entrepreneur","sollicite le paiement de ses factures en souffrance.",[["Payer",{fonds:-60,perf:1}],["Vérifier le service fait",{perf:1}],["Le renvoyer",{conf:-1}]]],
      ["Une ONG","dénonce des dysfonctionnements dans vos services.",[["Lancer une inspection",{perf:2}],["Promettre d'étudier",{}],["Contester",{conf:-1,mood:-1}]]]],
 maire:[["Les commerçants du marché","se plaignent des taxes et de l'insalubrité.",[["Baisser les taxes",{cm:3,caisse:-10}],["Organiser un nettoyage",{cm:2,caisse:-8}],["Maintenir les taxes",{cm:-2}]]],
      ["Une association de jeunes","demande un terrain de football et des emplois.",[["Aménager un terrain",{cm:3,caisse:-20}],["Recruter dans les travaux de la commune",{cm:2,caisse:-10}],["Promettre",{}]]],
      ["Des chefs de quartier","signalent des routes impraticables et l'absence d'éclairage.",[["Programmer des travaux",{cm:3,caisse:-25}],["Transmettre au préfet",{cm:1}],["Reporter",{cm:-2}]]],
      ["Des veuves et des personnes âgées","demandent une aide sociale.",[["Débloquer une aide",{cm:2,caisse:-5}],["Les orienter vers les affaires sociales",{cm:1}],["Refuser",{cm:-2}]]]],
 opp:[["Des militants {r}","demandent des moyens pour leur section.",[["Leur verser 3 M FCFA",{parti:-3,noto:1,mil:300}],["Promettre une visite",{noto:1}],["Refuser",{mil:-200}]]],
      ["Un candidat à l'investiture","veut être tête de liste aux prochaines élections.",[["L'investir",{noto:1}],["Organiser une primaire interne",{noto:2}],["Refuser",{mil:-100}]]],
      ["Un journaliste","demande une interview exclusive.",[["Accepter",{noto:3}],["Envoyer le porte-parole",{noto:1}],["Refuser",{noto:-1}]]]],
 ing:[["Votre banquier","propose une ligne de crédit à 9,03 %.",[["Accepter 30 M",{fonds:30,pret:30}],["Négocier le taux",{}],["Refuser",{}]]],
      ["Le délégué du personnel","réclame une hausse des salaires.",[["Augmenter de 5 %",{rep:1,fonds:-5}],["Promettre une prime de fin de chantier",{}],["Refuser",{rep:-2}]]],
      ["Un inspecteur des impôts","conteste vos déclarations.",[["Payer le redressement",{fonds:-8}],["Contester avec votre avocat",{fonds:-2}],["Proposer « un arrangement » (illégal)",{risque:1}]]],
      ["Un fournisseur","exige le paiement immédiat de ses factures.",[["Payer",{fonds:-10}],["Négocier un échéancier",{}],["Refuser",{rep:-2}]]]]
};
function audProfile(S){return S.mode==="pro"?"pro":S.mode==="pres"?"pres":S.mode==="min"?"min":S.mode==="ing"?"ing":S.profil==="maire"?"maire":"opp"}
function newAud(S){
  const k=audProfile(S);const t=pick(k==="pro"?window.PRO.AUD:AUD[k]);const r=pick(CM.REGIONS);
  S.org.aud.unshift({id:nid(),k,qui:t[0].replace("{r}",deR(r)),objet:t[1],c:t[2],reg:r.id,day:S.day,exp:S.day+7});
  S.org.aud=S.org.aud.slice(0,8);
}
function applyAud(S,a,e){
  if(S.mode==="pro"&&window.PRO){window.PRO.applyAud(S,e);return}
  const st=S.st;
  if(e.pop)st.pop=clamp(st.pop+e.pop,0,100);if(e.soc)st.soc=clamp(st.soc+e.soc,0,100);if(e.eco)st.eco=clamp(st.eco+e.eco,0,100);if(e.int)st.int=clamp(st.int+e.int,0,100);if(e.dette)S.nums.dette+=e.dette;
  if(S.minis){if(e.perf)S.minis.perf=clamp(S.minis.perf+e.perf,0,100);if(e.conf)S.minis.conf=clamp(S.minis.conf+e.conf,0,100);if(e.fonds)S.minis.fonds+=e.fonds}
  if(e.mood)window.SYS.cause(S,a.reg,"Audience : "+lcP(a.qui),e.mood,"");
  if(S.opp){const C=S.opp.commune;if(e.cm&&C)C.mood=clamp(C.mood+e.cm,0,100);if(e.caisse&&C)C.fonds+=e.caisse;if(e.parti)S.opp.fonds=Math.max(0,S.opp.fonds+e.parti);if(e.noto)S.opp.noto=clamp(S.opp.noto+e.noto,0,100);if(e.mil)S.opp.militants=Math.max(0,S.opp.militants+e.mil)}
  if(S.ent){if(e.fonds)S.ent.fonds+=e.fonds;if(e.pret)S.ent.pret+=e.pret;if(e.rep)S.ent.rep=clamp(S.ent.rep+e.rep,0,100);if(e.risque&&Math.random()<.3){window.SYS.newCase(S,"corruption",S.ent.reg,1);S.ent.rep=clamp(S.ent.rep-10,0,100)}}
}
VIE.audCard=function(S){
  if(!S.org)return"";const L=S.org.aud.filter(a=>!a.done);if(!L.length)return"";
  return'<div class="card"><div class="row" style="justify-content:space-between"><span class="eyebrow">Audiences demandées</span>'+pill(L.length+" en attente","warn")+'</div>'+L.slice(0,3).map(a=>'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(a.qui)+'</b><span class="small muted">'+esc(a.objet)+' Reçu le '+esc(G.dayLabel(a.day))+', à recevoir avant le '+esc(G.dayLabel(a.exp))+'.</span><div class="choices">'+a.c.map((c,i)=>'<button class="choice" data-aud="'+a.id+'" data-i="'+i+'" style="padding:8px 10px"><span class="t" style="font-weight:600">'+esc(c[0])+'</span></button>').join("")+'</div></div>').join("")+'</div>';
};
VIE.bindAud=function(S){
  const qc=$("quotCard");if(qc)qc.ontoggle=()=>{S.org.quotOpen=qc.open};
  document.querySelectorAll("[data-aud]").forEach(b=>b.onclick=()=>{const a=S.org.aud.find(x=>x.id===b.dataset.aud);const c=a.c[+b.dataset.i];a.done=1;applyAud(S,a,c[1]);
    G.setView({overlay:"conseil"},S.mode==="pres"?"Palais de l'Unité":S.mode==="min"?"Cabinet du ministre":S.profil==="maire"?"Hôtel de ville":"Bureau","Audience");
    G.toast("Audience : "+lcP(c[0]));window.SYS.inbox(S,{from:"Secrétariat particulier",t:"Audience accordée : "+a.qui,b:"Objet : "+a.objet+" Suite donnée : « "+c[0]+" ».",k:"info",read:true});G.render()});
};

/* ---------- le quotidien ---------- */
const QUOT=[
 s=>"Embouteillages monstres au rond-point Deido et à Ndokoti : les Doualais mettent deux heures pour traverser la ville.",
 s=>"À Yaoundé, files d'attente devant les forages de Mvog-Ada après une nouvelle coupure d'eau.",
 s=>"Les « bendskins » font la loi au carrefour Warda ; la police multiplie les contrôles de casques.",
 s=>"Week-end de funérailles dans l'Ouest : les routes de Bafoussam et Dschang sont chargées.",
 s=>"Au marché Mokolo, les ménagères comparent le prix du riz et de l'huile.",
 s=>"Championnat d'Elite One : ambiance électrique au stade de la Réunification à Douala.",
 s=>"Les Lions indomptables préparent les éliminatoires de la CAN 2027.",
 s=>"Les transferts d'argent mobile explosent à la veille de la fin du mois.",
 s=>"Nouvelle journée « ville morte » dans le Nord-Ouest : boutiques fermées à Bamenda.",
 s=>"À Maroua, les commerçants ferment tôt par crainte des attaques sur les routes.",
 s=>"Les agriculteurs de la Lékié attendent les acheteurs de cacao au bord de la route.",
 s=>"Sur les réseaux sociaux, une vidéo de nids-de-poule géants sur la route de Kribi fait le tour du pays."
];
function prix(S){const inf=clamp((S.nums.inflation-3)*.6+(S.m*.25),-5,40)/100;return{super:S.nums.carbSuper||840,gasoil:S.nums.carbGasoil||828,riz:Math.round(500*(1+inf)/5)*5,huile:Math.round(1500*(1+inf)/10)*10,ciment:Math.round(5500*(1+inf)/50)*50,taxi:350}}
VIE.quotCard=function(S){
  const q=S.org&&S.org.quot;if(!q)return"";
  const P=prix(S);const mo=(CM.DEBUT.mois+S.m)%12;
  return'<details class="card"'+(S.org.quotOpen!==false?" open":"")+' id="quotCard"><summary style="cursor:pointer"><span class="eyebrow">Aujourd\'hui au Cameroun · '+esc(G.dayLabel(S.day))+'</span></summary><ul class="small" style="margin:8px 0 0;padding-left:18px">'+q.items.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul>'+
   '<div class="kv small" style="margin-top:8px"><span>Super / gasoil (litre)</span><b>'+P.super+' / '+P.gasoil+' F</b><span>Riz (kg, moyen)</span><b>'+P.riz+' F</b><span>Huile de palme raffinée (litre)</span><b>'+P.huile+' F</b><span>Sac de ciment (50 kg)</span><b>'+fmt(P.ciment)+' F</b><span>Course de taxi en ville</span><b>≈ '+P.taxi+' F</b><span>Saison</span><b>'+(saison(S.m,"CE")==="pluies"?"des pluies (Sud)":"sèche (Sud)")+" · "+(saison(S.m,"EN")==="pluies"?"des pluies (Nord)":"sèche (Nord)")+'</b></div><span class="small muted">Prix du carburant réels (2026) ; les autres prix sont des moyennes indicatives qui suivent l\'inflation du jeu.</span></details>';
};
function quotTick(S){
  const O=S.org;const items=[];
  const bad=CM.REGIONS.filter(r=>S.regs[r.id].elec<65).map(r=>r.chef);if(bad.length)items.push("Délestages signalés hier à "+bad.slice(0,3).join(", ")+".");
  const worst=CM.REGIONS.slice().sort((a,b)=>S.mood[a.id].v-S.mood[b.id].v)[0];const c=S.mood[worst.id].c.find(x=>x.d<0);if(c)items.push("On en parle partout dans la région "+deR(worst)+" : "+c.t.charAt(0).toLowerCase()+c.t.slice(1)+".");
  const mo=(CM.DEBUT.mois+S.m)%12;const day=Math.floor(S.day%30)+1;
  if(mo===8)items.push("Rentrée scolaire : les parents courent après les fournitures et les frais d'APEE.");
  if(mo===4&&day>=15&&day<=21)items.push("Préparatifs du défilé de la fête nationale du 20 mai.");
  if(mo===1&&day>=8&&day<=11)items.push("Préparatifs de la fête de la jeunesse du 11 février.");
  if(mo===6)items.push("Période des résultats des examens officiels : l'attente est fébrile dans les familles.");
  if(saison(S.m,"LT")==="pluies"&&Math.random()<.5)items.push("Fortes pluies sur Douala : plusieurs quartiers inondés à Makepe et Bonabéri.");
  const h=O.hop.slice().sort((a,b)=>a.sat-b.sat)[0];if(h&&h.sat<40)items.push("Longues files d'attente "+(/^Hôpitaux/.test(h.n)?"aux "+lcP(h.n):"à l'"+lcP(h.n))+".");
  while(items.length<5)items.push(pick(QUOT)(S));
  O.quot={day:Math.floor(S.day),items:[...new Set(items)].slice(0,6)};
}

/* ---------- tick quotidien ---------- */
VIE.dayTick=function(S){
  if(!S.org)VIE.init(S);const O=S.org;
  if(!O.quot||Math.floor(S.day)>O.quot.day)quotTick(S);
  if(S.day>=O.nextAud){O.nextAud=S.day+rnd(3,6);if(S.profil!=="depute"){newAud(S);G.toast("Nouvelle demande d'audience")}}
  for(const a of O.aud)if(!a.done&&S.day>a.exp){a.done=1;const e={};if(S.mode==="pres")S.st.pop=clamp(S.st.pop-.5,0,100);if(S.minis)S.minis.perf=clamp(S.minis.perf-1.5,0,100);if(S.opp&&S.opp.commune)S.opp.commune.mood=clamp(S.opp.commune.mood-1.5,0,100);window.SYS.cause(S,a.reg,"Audience refusée faute de temps : "+lcP(a.qui),-1,"")}
  if(S.day>=O.nextPl){O.nextPl=S.day+rnd(2,5);plainteTick(S)}
};

/* ---------- mesures sur un responsable ou une structure ---------- */
function findOrg(S,o){const O=S.org;const map={police:O.comm,prefet:O.pref,gouverneur:O.gouv,gendarmerie:O.gend,hop:O.hop,ent:O.ent};return(map[o.k]||[]).find(x=>x.id===o.id)}
VIE.openOrg=function(S,ref){
  const o=findOrg(S,ref);if(!o)return;const k=ref.k;
  const lieu=o.ville||(o.reg?CM.REG[o.reg].chef:"");
  const can=k==="police"||k==="gendarmerie"?canPolice(S):k==="prefet"||k==="gouverneur"?canTerr(S):k==="hop"?canHop(S):k==="ent"?canEnt(S,o):false;
  const titre=k==="hop"?o.n:k==="ent"?o.n+" — "+o.act:k==="police"?o.n+", commissariat central de "+lieu:k==="prefet"?"Préfet de "+lieu+" : "+o.n:k==="gouverneur"?"Gouverneur de la région "+deR(CM.REG[o.reg])+" : "+o.n:o.n+", légion de gendarmerie";
  let body=k==="hop"?'<div class="kv"><span>Directeur</span><b>'+esc(o.dir)+'</b><span>Lits</span><b>'+o.lits+'</b><span>Médecins / infirmiers</span><b>'+o.med+' / '+o.inf+'</b><span>Stocks de médicaments</span><b>'+Math.round(o.stock)+'/100</b><span>Satisfaction des usagers</span><b>'+Math.round(o.sat)+'/100</b></div>':k==="ent"?'<div class="kv"><span>Directeur général</span><b>'+esc(o.dg)+'</b><span>Tutelle</span><b>'+o.tut+'</b><span>Performance</span><b>'+Math.round(o.perf)+'/100</b></div>':'<div class="kv"><span>Efficacité</span><b>'+Math.round(o.perf)+'/100</b><span>Intégrité</span><b>'+Math.round(o.integ)+'/100</b><span>Dernière plainte</span><b>'+esc(o.last||"—")+'</b></div>';
  let acts="";let gChoice="";const nomG=r=>window.SYS.nom(r,gChoice||undefined);
  if(can){if(k==="hop")acts='<button class="btn" data-m="med">Envoyer des médicaments (0,5 Md)</button><button class="btn" data-m="doc">Affecter 10 médecins</button><button class="btn" data-m="dir">Nommer un nouveau directeur</button><button class="btn" data-m="insp">Inspection</button>';
    else if(k==="ent")acts='<button class="btn" data-m="dg">Remplacer le directeur général</button><button class="btn" data-m="audit">Audit du CONSUPE</button><button class="btn" data-m="recap">Recapitaliser (20 Mds)</button>';
    else acts='<button class="btn" data-m="enq">'+(k==="police"?"Enquête de la police des polices":"Enquête de l'inspection")+'</button><button class="btn" data-m="mut">Muter</button><button class="btn" data-m="susp">Suspendre et remplacer</button><button class="btn" data-m="fel">Féliciter publiquement</button>'}
  else{acts=S.opp?'<button class="btn" data-m="denonce">Dénoncer publiquement (médias)</button>':"";if(S.profil==="maire")acts+='<button class="btn" data-m="saisir">Saisir le préfet et le gouverneur</button>';if(S.mode==="pro"||S.mode==="ing")acts+='<button class="btn" data-m="saisir">Signer une pétition au gouverneur</button>';if(S.profil==="depute")acts+='<button class="btn" data-m="question">Question orale au gouvernement</button>'}
  if(can)acts+='<div class="row small" style="width:100%;gap:6px">En cas de remplacement, nommer : <button class="btn small" data-gch="f">une femme</button><button class="btn small" data-gch="m">un homme</button><button class="btn small primary" data-gch="">au choix</button></div>';
  const vtxt=k==="hop"?"hôpital patients "+lieu:k==="ent"?(o.id==="ENEO"?"délestage électricité ":o.id==="CAMWATER"?"coupure eau village ":"chantier ")+lieu:"contrôle police racket "+lieu;
  G.sheet('<h3 class="h2">'+esc(titre)+'</h3>'+body+(window.VID||window.RENC?'<div class="row">'+(window.VID?VID.btn(vtxt,o.reg||null,"Voir la vidéo sur place"):"")+(window.RENC?RENC.orgBtn():"")+'</div>':"")+(can?"":'<p class="small muted">Seuls le président et le ministre de tutelle peuvent sanctionner ou nommer. Vous pouvez alerter.</p>')+'<div class="row">'+acts+'</div>',el=>{
    if(window.RENC)RENC.bindOrg(S,el,k,o);
    el.querySelectorAll("[data-gch]").forEach(b=>b.onclick=()=>{gChoice=b.dataset.gch;el.querySelectorAll("[data-gch]").forEach(x=>x.classList.toggle("primary",x===b))});
    el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const m=b.dataset.m;let msg="";
      if(m==="med"){if(!pay(S,.5))return G.toast("Crédits insuffisants.");o.stock=clamp(o.stock+40,0,100);msg="Médicaments livrés"}
      else if(m==="doc"){if(!pay(S,.2))return G.toast("Crédits insuffisants.");o.med+=10;msg="10 médecins affectés"}
      else if(m==="dir"){o.dir=nomG(pick(CM.REGIONS).id);o.sat=clamp(o.sat+5,0,100);msg=window.SYS.accord("Nouveau directeur : ",window.SYS.sexe(o.dir)).replace("Nouveau directrice","Nouvelle directrice")+o.dir}
      else if(m==="insp"){inbox(S,{from:"Inspection générale de la Santé",t:"Inspection : "+o.n,b:rapHop(o),k:"rapport"});msg="Rapport d'inspection au courrier"}
      else if(m==="dg"){o.dg=nomG(pick(CM.REGIONS).id);o.perf=clamp(o.perf+8,0,100);msg=(window.SYS.sexe(o.dg)==="f"?"Nouvelle directrice générale : ":"Nouveau directeur général : ")+o.dg}
      else if(m==="audit"){const f=Math.random()<.4;if(f)window.SYS.newCase(S,"corruption","CE",Math.round(rnd(1,4)),"Yaoundé");inbox(S,{from:"Contrôle supérieur de l'État",t:"Audit de "+o.n,b:f?"Des irrégularités graves ont été relevées ; le dossier est transmis au Tribunal criminel spécial.":"Gestion jugée perfectible, sans faute pénale.",k:"rapport"});msg="Audit lancé"}
      else if(m==="recap"){if(!pay(S,20))return G.toast("Crédits insuffisants.");o.perf=clamp(o.perf+15,0,100);msg="Recapitalisation effectuée"}
      else if(m==="enq"){const guilty=o.integ<45||Math.random()<.2;if(guilty){window.SYS.newCase(S,"corruption",o.reg,1,lieu);o.integ=clamp(o.integ+25,0,100)}msg=guilty?"L'enquête confirme les abus : poursuites engagées":"L'enquête ne relève pas de faute grave";window.SYS.cause(S,o.reg,"Enquête ouverte sur "+o.n+" à "+lieu,2,"")}
      else if(m==="mut"){o.n=(k==="police"?"Commissaire ":k==="gendarmerie"?"Colonel ":"")+nomG(o.reg);o.perf=rnd(40,70);o.integ=rnd(40,80);msg="Responsable muté, remplacé par "+o.n;window.SYS.cause(S,o.reg,"Mutation du responsable contesté à "+lieu,2,"")}
      else if(m==="susp"){o.n=(k==="police"?"Commissaire ":k==="gendarmerie"?"Colonel ":"")+nomG(o.reg);o.perf=rnd(45,75);o.integ=rnd(55,85);msg="Suspendu et remplacé par "+o.n;window.SYS.cause(S,o.reg,"Sanction exemplaire à "+lieu,3,"corruption")}
      else if(m==="fel"){o.perf=clamp(o.perf+5,0,100);msg="Félicitations publiques"}
      else if(m==="denonce"){S.opp.noto=clamp(S.opp.noto+2,0,100);window.SYS.cause(S,o.reg||"CE","L'opposition dénonce la gestion de "+(o.n||o.dir),-1,"corruption");msg="Dénonciation relayée par la presse"}
      else if(m==="saisir"){if(Math.random()<.4){o.n=(k==="police"?"Commissaire ":"")+nom(o.reg);msg="Le gouverneur a muté le responsable"}else msg="Le préfet promet d'examiner la situation"}
      else if(m==="question"){S.opp.noto=clamp(S.opp.noto+2,0,100);msg="Question posée au gouvernement"}
      el.remove();G.toast(msg);G.render()});
  });
};
function rapHop(h){const s=h.stats;if(!s)return"Pas encore de statistiques.";const top=Object.entries(s.by).sort((a,b)=>b[1].c-a[1].c).slice(0,4).map(([k,v])=>MALADIES.find(m=>m[0]===k)[1]+" : "+fmt(v.c)+" cas, "+v.d+" décès");return"Consultations du mois : "+fmt(s.cons)+". Décès : "+s.dec+". Taux d'occupation : "+Math.round(s.occ*100)+" %.\nPrincipales causes : "+top.join(" ; ")+".\nStocks de médicaments : "+Math.round(h.stock)+"/100. Satisfaction : "+Math.round(h.sat)+"/100."}

/* ---------- onglet Services publics ---------- */
VIE.render=function(S){
  if(!S.org)VIE.init(S);if(!S.org.sante)VIE.monthTick(S);const O=S.org;O.view=O.view||"hop";
  const views=[["hop","Hôpitaux"],["police","Police et gendarmerie"],["terr","Administration territoriale"],["ent","Entreprises publiques"]];
  let h='<div class="row">'+views.map(([k,n])=>'<button class="btn small'+(O.view===k?" primary":"")+'" data-vv="'+k+'">'+n+'</button>').join("")+'</div>';
  if(O.view==="hop"){const s=O.sante;
    h+='<div class="card"><span class="eyebrow">Santé ce mois-ci</span><div class="facts"><div class="fact"><b>'+fmt(s.cons)+'</b><span>consultations dans les hôpitaux suivis</span></div><div class="fact"><b>'+fmt(s.dec)+'</b><span>décès, dont '+fmt(s.palu)+' liés au paludisme</span></div></div><span class="small muted">Repère réel 2025 : paludisme = 26,3 % des consultations, 1 261 décès sur 24 950 décès en formation sanitaire. La méningite frappe le Nord en saison sèche, la malnutrition l\'Extrême-Nord.</span></div>'+
     O.hop.map(x=>'<button class="choice" data-org="hop" data-id="'+x.id+'"><span class="t">'+esc(x.n)+' '+pill(x.sat>=55?"Satisfaisant":x.sat>=40?"Passable":"Critique",x.sat>=55?"ok":x.sat>=40?"warn":"bad")+'</span><span class="small muted">'+(x.stats?fmt(x.stats.cons)+" consultations, "+x.stats.dec+" décès · occupation "+Math.round(x.stats.occ*100)+" %":"")+' · stocks '+Math.round(x.stock)+'/100 · directeur '+esc(x.dir)+'</span></button>').join("")}
  else if(O.view==="police")h+=grp(O.comm,"police",o=>o.n+" · "+o.ville)+grp(O.gend,"gendarmerie",o=>o.n+" · région "+CM.REG[o.reg].n);
  else if(O.view==="terr")h+=grp(O.gouv,"gouverneur",o=>"Gouverneur "+o.n+" · "+CM.REG[o.reg].n)+grp(O.pref,"prefet",o=>"Préfet "+o.n+" · "+o.ville);
  else h+=O.ent.map(e=>'<button class="choice" data-org="ent" data-id="'+e.id+'"><span class="t">'+esc(e.n)+' '+pill(e.perf>=55?"Bonne gestion":e.perf>=35?"Moyenne":"En crise",e.perf>=55?"ok":e.perf>=35?"warn":"bad")+'</span><span class="small muted">'+esc(e.act)+' · DG '+esc(e.dg)+' · tutelle '+e.tut+'</span></button>').join("");
  $("panel").innerHTML=h;
  $("panel").querySelectorAll("[data-vv]").forEach(b=>b.onclick=()=>{O.view=b.dataset.vv;G.render()});
  $("panel").querySelectorAll("[data-org]").forEach(b=>b.onclick=()=>VIE.openOrg(S,{k:b.dataset.org,id:b.dataset.id}));
  function grp(list,k,lab){const L=list.slice().sort((a,b)=>(a.perf+a.integ)-(b.perf+b.integ));return'<div class="card"><span class="eyebrow">'+({police:"Commissariats centraux",gendarmerie:"Légions de gendarmerie",gouverneur:"Gouverneurs de région",prefet:"Préfets"})[k]+' (du plus critiqué au mieux noté)</span>'+L.map(o=>'<button class="choice" data-org="'+k+'" data-id="'+o.id+'" style="padding:8px 10px"><span class="t" style="font-weight:600">'+esc(lab(o))+'</span><span class="small muted">efficacité '+Math.round(o.perf)+' · intégrité '+Math.round(o.integ)+(o.last?" · plainte : "+esc(o.last):"")+'</span></button>').join("")+'</div>'}
};
})();
