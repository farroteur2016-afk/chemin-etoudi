/* Chemin d'Etoudi — déplacements : d'un point A à un point B, par le moyen de transport de son choix,
   avec les usages du pays selon le rang (cortège présidentiel, convoi ministériel, voiture de fonction avec chauffeur,
   taxi, bendskin, bus d'agence, train Camrail, vols Camair-Co), durée, coût, risques, et vidéo du trajet (qu'on peut passer).
   Populations : estimations d'agglomération 2025 ; coordonnées approximatives. */
(function(){
"use strict";
const CM=window.CM,G=window.GAME,S3=window.Scene3D,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const VOY={};window.VOY=VOY;
const F=n=>fmt(Math.round(n))+" FCFA";

/* ---------- villes : [nom, région, latitude, longitude, population estimée] ---------- */
const V=[["Yaoundé","CE",3.85,11.50,4.5e6],["Mbalmayo","CE",3.52,11.50,9e4],["Obala","CE",4.17,11.53,5e4],["Bafia","CE",4.75,11.23,7e4],["Nanga-Eboko","CE",4.68,12.37,4e4],["Mfou","CE",3.72,11.64,4e4],
 ["Douala","LT",4.05,9.77,4.2e6],["Édéa","LT",3.80,10.13,2e5],["Nkongsamba","LT",4.95,9.94,1.5e5],["Loum","LT",4.72,9.73,7e4],["Manjo","LT",4.84,9.82,4e4],["Yabassi","LT",4.46,9.97,2e4],
 ["Garoua","NO",9.30,13.40,6.5e5],["Guider","NO",9.93,13.95,1.2e5],["Figuil","NO",9.76,13.97,5e4],["Poli","NO",8.48,13.24,3e4],["Tcholliré","NO",8.40,14.17,3e4],["Pitoa","NO",9.38,13.53,4e4],
 ["Maroua","EN",10.59,14.32,4.8e5],["Kousséri","EN",12.08,15.03,2.5e5],["Mokolo","EN",10.74,13.80,1e5],["Yagoua","EN",10.34,15.23,9e4],["Mora","EN",11.05,14.14,6e4],["Kaélé","EN",10.10,14.45,5e4],
 ["Ngaoundéré","AD",7.32,13.58,3.5e5],["Meiganga","AD",6.52,14.29,9e4],["Tibati","AD",6.47,12.63,6e4],["Banyo","AD",6.75,11.82,5e4],["Tignère","AD",7.37,12.65,3e4],
 ["Bafoussam","OU",5.48,10.42,4.5e5],["Dschang","OU",5.45,10.05,1.5e5],["Foumban","OU",5.73,10.90,1.5e5],["Mbouda","OU",5.63,10.25,1.1e5],["Bangangté","OU",5.14,10.52,6e4],["Bandjoun","OU",5.35,10.41,6e4],
 ["Bamenda","NW",5.96,10.15,5e5],["Kumbo","NW",6.20,10.68,1.1e5],["Wum","NW",6.38,10.07,5e4],["Ndop","NW",6.00,10.42,4e4],["Nkambé","NW",6.63,10.67,3e4],["Bafut","NW",6.08,10.10,3e4],
 ["Buea","SW",4.16,9.24,3e5],["Limbé","SW",4.02,9.21,1.5e5],["Kumba","SW",4.64,9.45,3.5e5],["Tiko","SW",4.08,9.36,8e4],["Mamfe","SW",5.75,9.31,4e4],["Idenau","SW",4.24,8.99,2e4],
 ["Bertoua","ES",4.58,13.68,3e5],["Batouri","ES",4.43,14.36,6e4],["Abong-Mbang","ES",3.98,13.18,3e4],["Yokadouma","ES",3.52,15.05,4e4],["Garoua-Boulaï","ES",5.88,14.55,6e4],["Lomié","ES",3.16,13.62,1.5e4],
 ["Ebolowa","SU",2.90,11.15,1.4e5],["Kribi","SU",2.94,9.91,1.1e5],["Sangmélima","SU",2.93,11.98,9e4],["Ambam","SU",2.38,11.28,3e4],["Campo","SU",2.37,9.82,1e4],["Lolodorf","SU",3.23,10.73,2e4]];
VOY.CITIES=V.map(([n,reg,lat,lon,pop])=>({n,reg,lat,lon,pop}));
const city=n=>VOY.CITIES.find(c=>c.n===n);
/* aéroports (vols intérieurs Camair-Co) et gares Camrail */
const AIR={"Yaoundé":"Aéroport international de Yaoundé-Nsimalen","Douala":"Aéroport international de Douala","Garoua":"Aéroport international de Garoua","Maroua":"Aéroport de Maroua-Salak","Ngaoundéré":"Aéroport de Ngaoundéré","Bertoua":"Aérodrome de Bertoua","Bamenda":"Aérodrome de Bamenda"};
const AIR_COM=["Yaoundé","Douala","Garoua","Maroua","Ngaoundéré"];
const GARES=["Douala","Édéa","Yaoundé","Nanga-Eboko","Ngaoundéré"];
/* lieux dans les grandes villes */
const LIEUX={"Yaoundé":["Palais d'Etoudi","Primature","Assemblée nationale (Ngoa-Ekellé)","Aéroport de Nsimalen","Marché Mokolo","Hôpital central","Université de Yaoundé I","Carrefour Warda","Gare de Yaoundé"],
 "Douala":["Port autonome","Aéroport de Douala","Akwa (quartier des affaires)","Marché central","Bonabéri","Ndokoti","Hôpital Laquintinie","Gare de Bessengué"]};
const PROFIL={CE:"yaounde",LT:"douala",EN:"nord",NO:"nord",AD:"nord"};
VOY.profile=reg=>PROFIL[reg]||"autre";

function km(a,b){const R=6371,t=Math.PI/180,dl=(b.lat-a.lat)*t,dn=(b.lon-a.lon)*t;const h=Math.sin(dl/2)**2+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const roadKm=(a,b)=>a===b?0:Math.round(km(a,b)*1.32);
const hourNow=S=>((S.day%1)*24+8)%24;
const isRush=h=>(h>=6.5&&h<=9)||(h>=16.5&&h<=19.5);

/* ---------- position du joueur ---------- */
VOY.here=function(S){if(!S.loc){const reg=S.mode==="pres"?"CE":S.pro?S.pro.reg:S.ent?S.ent.reg:S.opp?S.opp.home:S.minis?"CE":"CE";const v=S.opp&&S.opp.commune?S.opp.commune.ville:CM.REG[reg].chef;S.loc={reg,v:city(v)?v:CM.REG[reg].chef,lieu:S.mode==="pres"?"Palais d'Etoudi":null}}return S.loc};
VOY.cityInfo=n=>{const c=city(n);return c?{n:c.n,pop:c.pop}:null};

/* position affichée en permanence sous la date */
VOY.whereLabel=function(S){if(!S||S.phase!=="play")return"";const h=VOY.here(S);const c=city(h.v);
  if(VOY.inTrip)return"🚗 En route vers "+(VOY.tripTo||"votre destination");
  const rue=(window.Ultra&&Ultra.inStreet&&Ultra.inStreet())||(S3&&S3.inStreet&&S3.inStreet());if(rue)return"🚶 Dans la rue, à pied · "+h.v;
  if(h.pays)return"🌍 "+(h.lieu?h.lieu+" · ":"")+h.v+" ("+h.pays+")";
  const clean=l=>{l=String(l).replace(/^(sa|son|ses|le|la|les)\s+/i,"").replace(/^l'/i,"");return l.charAt(0).toUpperCase()+l.slice(1)};
  if(h.lieu){const L=h.lieu,ic=/h[oô]pital|clinique|centre de sant/i.test(L)?"🏥":/palais|pr[eé]sidence/i.test(L)?"🏛️":/ambassade|consulat/i.test(L)?"🏳️":/march[eé]/i.test(L)?"🛒":/cacao|plantation|champ|bananeraie/i.test(L)?"🌳":/d[eé]barcad|port\b/i.test(L)?"⚓":/chefferie/i.test(L)?"🛖":/si[eè]ge|entreprise|soci[eé]t[eé]|usine/i.test(L)?"🏢":/quartier|domicile/i.test(L)?"🏘️":/[eé]cole|campus|universit/i.test(L)?"🎓":"📍";return ic+" "+clean(L)+", "+h.v}
  const home=S.mode==="pres"?"Yaoundé":S.mode==="min"?"Yaoundé":S.opp&&S.opp.commune?S.opp.commune.ville:S.ent?CM.REG[S.ent.reg].chef:S.pro?CM.REG[S.pro.reg].chef:S.opp?CM.REG[S.opp.home].chef:null;
  if(h.v===home){if(S.mode==="pres")return"🏛️ Palais d'Etoudi, Yaoundé";if(S.mode==="min"&&S.minis)return"🏢 Ministère "+(window.SYS&&SYS.deM?SYS.deM(S.minis.n):"de ")+S.minis.n+", Yaoundé";
    if(S.opp&&S.opp.commune)return"🏛️ Hôtel de ville, "+h.v;if(S.ent)return"🏢 Siège de "+(S.ent.nom||"votre entreprise")+", "+h.v;if(S.pro){const w=S.pro.employeur&&S.pro.employeur.n;return(/h[oô]pital|clinique/i.test(w||"")?"🏥 ":"🏢 ")+(w||"Votre lieu de travail")+", "+h.v}if(S.opp)return"🏢 Siège du parti, "+h.v}
  return(c&&c.pop<60000?"🏘️ "+h.v+" (petite ville)":"📍 Centre-ville de "+h.v)+", région "+(/^[AEIOUÉ]/.test(CM.REG[h.reg].n)?"de l'":"du ")+CM.REG[h.reg].n};
/* ---------- moyens de transport ---------- */
VOY.MODES={
 marche:{n:"À pied",ic:"🚶",city:4.5,road:4.5,maxKm:6,cost:()=>0,risk:.001},
 moto:{n:"Moto-taxi (bendskin)",ic:"🏍️",city:24,road:40,maxKm:60,cost:d=>Math.max(200,Math.round((150+d*55)/50)*50),risk:.02,note:"rapide dans les embouteillages, mais dangereux"},
 taxi:{n:"Taxi (place ou course)",ic:"🚕",city:17,road:55,maxKm:80,cost:d=>d<10?350:Math.round((1000+d*110)/100)*100,risk:.004},
 voiture:{n:"Votre voiture",ic:"🚗",city:18,road:72,cost:d=>Math.round(d*.1*840+2000),risk:.003,own:1},
 chauffeur:{n:"Voiture avec chauffeur",ic:"🚘",city:18,road:72,cost:d=>Math.round(d*.11*840+5000),risk:.002,work:1},
 convoi:{n:"Convoi officiel avec escorte de motards",ic:"🚨",city:32,road:75,cost:d=>Math.round(d*.4*840+60000),risk:.001,work:1,esc:1,gene:1},
 cortegeR:{n:"Cortège réduit",ic:"🚨",city:36,road:80,cost:d=>Math.round(d*.8*840+150000),risk:0,work:1,esc:1,gene:1.5},
 restreint:{n:"Cortège restreint (2 véhicules)",ic:"🚙",city:24,road:72,cost:d=>Math.round(d*.25*840+30000),risk:.001,work:1,esc:1,gene:.3},
 cortege:{n:"Cortège présidentiel (routes bouclées)",ic:"🚨",city:45,road:85,cost:d=>Math.round(d*1.5*840+400000),risk:0,work:1,esc:2,gene:3},
 bus:{n:"Bus interurbain (agence de voyage)",ic:"🚌",city:15,road:66,minKm:40,cost:d=>Math.round((1500+d*16)/500)*500,risk:.006,work:0,night:1},
 train:{n:"Train Camrail",ic:"🚆",rail:1,road:60,cost:d=>Math.round((d*36)/500)*500+500,risk:.001,work:1},
 avion:{n:"Vol Camair-Co",ic:"✈️",air:1,cost:d=>Math.round((40000+d*85)/1000)*1000,risk:0,work:1,delay:.35},
 jet:{n:"Avion affrété (jet privé)",ic:"🛩️",air:2,cost:d=>Math.round((2500000+d*9000)/10000)*10000,risk:0,work:1},
 avionp:{n:"Avion présidentiel",ic:"✈️",air:2,cost:d=>Math.round((3000000+d*12000)/10000)*10000,risk:0,work:1},
 helico:{n:"Hélicoptère",ic:"🚁",heli:1,cost:d=>Math.round((800000+d*6000)/10000)*10000,risk:0,work:0,maxKm:450}
};
/* modes autorisés et mode par défaut selon le rang (usages actuels) */
function rank(S){if(S.mode==="pres")return"pres";if(S.mode==="min")return"min";if(S.profil==="depute")return"dep";if(S.profil==="maire")return"maire";if(S.mode==="ing")return"dg";if(S.mode==="pro")return(S.pro.grade>=2||S.pro.fonds>8e6)?"cadre":"pro";return"chef"}
const NORMES={
 pres:{ok:["cortege","cortegeR","restreint","avionp","helico","chauffeur","convoi","voiture","taxi","moto"],city:"cortege",long:"avionp",lab:"Président de la République : cortège présidentiel en ville et sur route, avion présidentiel au-delà de 300 km."},
 min:{ok:["convoi","restreint","chauffeur","avion","jet","helico","train","voiture","taxi","moto","bus"],city:"chauffeur",long:"avion",lab:"Ministre : voiture de fonction avec chauffeur (escorte en option), vol Camair-Co pour les longues distances."},
 dep:{ok:["chauffeur","voiture","avion","train","bus","taxi","moto"],city:"chauffeur",long:"avion",lab:"Député : véhicule avec chauffeur, avion ou train pour rejoindre sa circonscription."},
 maire:{ok:["chauffeur","voiture","taxi","moto","bus","train","avion"],city:"chauffeur",long:"voiture",lab:"Maire : voiture de fonction de la commune avec chauffeur."},
 dg:{ok:["chauffeur","voiture","avion","jet","train","taxi","moto","bus"],city:"chauffeur",long:"avion",lab:"Directeur général : voiture avec chauffeur (vous travaillez à l'arrière), avion pour les longues distances."},
 cadre:{ok:["voiture","chauffeur","taxi","moto","bus","train","avion","marche"],city:"voiture",long:"avion",lab:"Cadre ou praticien confirmé : votre voiture en ville, avion ou voiture pour les longues distances."},
 pro:{ok:["taxi","moto","bus","train","marche","voiture","avion"],city:"taxi",long:"bus",lab:"Jeune professionnel : taxi ou bendskin en ville, bus d'agence ou train pour voyager."},
 chef:{ok:["voiture","chauffeur","taxi","moto","bus","train","avion"],city:"voiture",long:"voiture",lab:"Responsable politique : votre voiture, parfois suivie de militants."}
};
VOY.norme=S=>NORMES[rank(S)];

/* ---------- planification ---------- */
function infraOf(S,reg){return S.regs&&S.regs[reg]?S.regs[reg].infra:40}
function secOf(S,reg){return S.regs&&S.regs[reg]?S.regs[reg].sec:50}
VOY.plan=function(S,from,to,mode){
  const M=VOY.MODES[mode];const a=city(from.v),b=city(to.v);const same=from.v===to.v;const d=same?Math.round(rnd(4,a.pop>1e6?18:8)):roadKm(a,b);
  const h=hourNow(S);const jam=isRush(h)?1.9:1;const bigA=a.pop>1e6,bigB=b.pop>1e6;
  if(M.maxKm&&d>M.maxKm)return{ok:false,why:"trop loin pour ce moyen de transport ("+d+" km)"};
  if(M.minKm&&d<M.minKm&&!same)return{ok:false,why:"pas de ligne pour une si courte distance"};
  if(M.minKm&&same)return{ok:false,why:"pas de bus en ville"};
  if(M.rail&&(!GARES.includes(a.n)||!GARES.includes(b.n)||same))return{ok:false,why:"pas de gare Camrail dans l'une des deux villes"};
  if(M.air===1&&(!AIR_COM.includes(a.n)||!AIR_COM.includes(b.n)||same))return{ok:false,why:"pas de vol commercial entre ces villes"};
  if(M.air===2&&(!AIR[a.n]||!AIR[b.n]||same))return{ok:false,why:"pas d'aéroport dans l'une des deux villes"};
  if(M.heli&&same&&d<5)return{ok:false,why:"inutile pour si peu"};
  const cityTime=(c)=>(c.pop>1e6?.35:c.pop>3e5?.2:.1)*(M.esc?.35:mode==="moto"?.6:jam)*(17/(M.city||17));
  let hrs;
  if(M.air){hrs=(M.air===1?1.8:.8)+d/(M.air===1?480:600)+cityTime(a)*.8+cityTime(b)*.8}
  else if(M.heli){hrs=.4+d/210}
  else if(M.rail){hrs=.5+d/68+(d>400?4.5:0)}
  else if(same){hrs=d/(M.city*(M.esc?1:1/jam*1.4))+.1}
  else{const inf=(infraOf(S,a.reg)+infraOf(S,b.reg))/2;const sp=M.road*(.85+inf/300);hrs=d/sp+cityTime(a)+cityTime(b)+(d>350&&!M.esc?1:0)+(mode==="bus"?.3+d/700:0)}
  let cost=M.cost(d);const who=S.mode==="pres"&&["cortege","avionp","helico","chauffeur","convoi"].includes(mode)?"État":S.mode==="min"&&["chauffeur","convoi","avion","jet","helico"].includes(mode)?"ministère":S.profil==="maire"&&mode==="chauffeur"?"commune":S.mode==="ing"&&["chauffeur","avion","jet"].includes(mode)?"entreprise":"personnel";
  const sec=Math.min(secOf(S,a.reg),secOf(S,b.reg));
  return{ok:true,d,hrs,cost,who,sec,jam:jam>1,same,a,b,mode};
};
VOY.defaultMode=function(S,from,to){const N=VOY.norme(S);const p=VOY.plan(S,from,to,N.long);const d=from.v===to.v?5:roadKm(city(from.v),city(to.v));
  let m=d>300?N.long:N.city;let pl=VOY.plan(S,from,to,m);if(!pl.ok){for(const k of N.ok){pl=VOY.plan(S,from,to,k);if(pl.ok){m=k;break}}}return m};

/* ---------- écran de déplacement ---------- */
VOY.open=function(preReg,preCity){
  const S=G.S;if(!S||S.phase!=="play")return;if(S.loc&&S.loc.pays&&window.INTL)return INTL.sheet(S);const here=VOY.here(S);const N=VOY.norme(S);
  let reg=preReg||here.reg,v=preCity||(preReg?CM.REG[preReg].chef:here.v),lieu=null,mode=null,watch=true;
  const draw=el=>{const to={reg,v};const dm=VOY.defaultMode(S,here,to);if(!mode||!N.ok.includes(mode))mode=dm;
    const cities=VOY.CITIES.filter(c=>c.reg===reg).sort((a,b)=>b.pop-a.pop);const lieux=LIEUX[v]||[];
    const opts=Object.keys(VOY.MODES).filter(k=>N.ok.includes(k)).map(k=>{const p=VOY.plan(S,here,to,k);return[k,p]});
    el.querySelector("#vyBody").innerHTML=
     '<div class="kv"><span>Vous êtes à</span><b>'+esc((here.lieu?here.lieu+", ":"")+here.v)+'</b></div>'+
     '<label class="f" for="vyR">Région<select id="vyR">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===reg?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label>'+
     '<label class="f" for="vyV">Ville<select id="vyV">'+cities.map(c=>'<option'+(c.n===v?" selected":"")+'>'+esc(c.n)+'</option>').join("")+'</select></label>'+
     (lieux.length?'<label class="f" for="vyL">Lieu précis<select id="vyL"><option value="">Centre-ville</option>'+lieux.map(l=>'<option'+(l===lieu?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select></label>':"")+
     '<p class="small muted">'+esc(v)+' : environ '+fmt(Math.round(city(v).pop/1000))+' 000 habitants'+(AIR[v]?" · "+esc(AIR[v]):"")+(GARES.includes(v)?" · gare Camrail":"")+'.</p>'+
     '<button class="btn" id="vyIntl">🌍 Voyager à l\'étranger</button><button class="btn primary" id="vyNext">Choisir le moyen de transport ▸</button>';
    el.querySelector("#vyR").onchange=e=>{reg=e.target.value;v=CM.REG[reg].chef;lieu=null;mode=null;draw(el)};
    el.querySelector("#vyV").onchange=e=>{v=e.target.value;lieu=null;mode=null;draw(el)};
    const sl=el.querySelector("#vyL");if(sl)sl.onchange=e=>{lieu=e.target.value||null};
    el.querySelector("#vyIntl").onclick=()=>{el.remove();if(window.INTL)INTL.open()};
    el.querySelector("#vyNext").onclick=()=>{if(v===here.v&&!lieu&&here.lieu==null)return G.toast("Vous êtes déjà à "+v+" : choisissez un lieu précis ou une autre ville.");el.remove();VOY.ask(S,{reg,v,lieu},{})};
  };
  G.sheet('<h3 class="h2">Se déplacer</h3><div id="vyBody"></div>',el=>draw(el));
};
function dur(h){if(h<1)return Math.max(5,Math.round(h*60/5)*5)+" min";let H=Math.floor(h),m=Math.round((h-H)*60/10)*10;if(m>=60){H++;m=0}return H+" h"+(m?String(m).padStart(2,"0"):"")}
function pay(S,p){const c=p.cost;
  if(p.who==="État"){S.nums.dette+=c/1e9;return true}
  if(p.who==="ministère"){if(S.minis.fonds<c/1e6)return false;S.minis.fonds-=c/1e6;return true}
  if(p.who==="commune"){const C=S.opp.commune;if(C.fonds<c/1e6)return false;C.fonds-=c/1e6;return true}
  if(p.who==="entreprise"){if(S.ent.fonds<c/1e6)return false;S.ent.fonds-=c/1e6;return true}
  if(window.EMP){if(EMP.wallet(S)<c)return false;EMP.credit(S,-c);return true}
  if(S.opp){if(S.opp.fonds<c/1e6)return false;S.opp.fonds-=c/1e6;return true}return true}

/* ---------- départ : vidéo (facultative) puis arrivée ---------- */
function go(S,from,to,p,watch,horsNorme,cb){
  const M=VOY.MODES[p.mode];const RA=CM.REG[from.reg],RB=CM.REG[to.reg];let done=false;
  const arrive=()=>{if(done)return;done=true;arrival(S,from,to,p,horsNorme);if(cb)setTimeout(cb,600)};
  if(!watch||!S3||!S3.ok){arrive();return}
  const el=document.createElement("div");el.className="film";el.innerHTML='<div class="fview" id="fview"></div><div class="lb top"></div><div class="lb bot"></div>'+
   '<div class="fhud"><span class="rec" style="color:#fde047">● EN ROUTE</span><span class="src">'+M.ic+' '+esc(M.n)+'</span></div><div class="fclock">'+esc(G.dayLabel(S.day))+' · '+dur(p.hrs)+'</div>'+
   '<div class="lower"><span class="k">'+esc(from.v)+' → '+esc(to.v)+(p.d?" · "+p.d+" km":"")+'</span><b>'+esc(to.lieu||("Direction "+to.v))+'</b><span class="sub" id="vySub"></span></div>'+
   '<div class="fbar"><i id="fprog"></i></div><div class="fctl"><button class="btn small" id="vyWork">'+(p.self?"🎙 Travailler à la voix (au volant)":"💼 Travailler pendant le trajet")+'</button><button class="btn small primary" id="vySkip">Passer la vidéo et arriver</button></div>';
  document.querySelectorAll(".sheet:not([data-trip])").forEach(s=>{s.dataset.hid="1";s.style.display="none"});document.body.appendChild(el);document.body.classList.add("travel");VOY.driving=!!p.self;VOY.inTrip=true;VOY.tripTo=to.v;
  const h0=hourNow(S);const clk=q=>{const h=(h0+p.hrs*q)%24,H=Math.floor(h),Mi=Math.floor((h-H)*60);const c=el.querySelector(".fclock");if(c)c.textContent=G.dayLabel(S.day+p.hrs*q/24)+" · "+String(H).padStart(2,"0")+":"+String(Mi).padStart(2,"0")+" · arrivée prévue dans "+dur(Math.max(0,p.hrs*(1-q)))};clk(0);
  $("vyWork").onclick=()=>{if(p.self){if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){G.toast("Au volant, seul le travail à la voix est autorisé, et votre navigateur n'a pas de micro disponible.");return}if(window.VOIX)VOIX.open({driving:true})}else VOY.workPanel(S)};
  const sub=(M.work?"Pendant le trajet, vous travaillez sur vos dossiers. ":"")+(p.mode==="cortege"?"Les routes sont bouclées ; les motards de la Garde présidentielle ouvrent la voie.":p.mode==="convoi"?"Les motards de l'escorte ouvrent la voie, sirènes hurlantes.":p.mode==="moto"?"Le bendskin se faufile entre les voitures.":p.mode==="train"?"Le train Camrail traverse la campagne.":M.air?"Décollage, vol au-dessus des nuages, puis atterrissage.":p.mode==="helico"?"L'hélicoptère survole la région.":p.jam?"C'est l'heure de pointe : la circulation est dense.":"La route défile.");
  $("vySub").textContent=sub;
  const road=p.same?null:(p.d>250?CM.REG[pick([from.reg,to.reg])].land:RB.land);const insec=p.sec<30&&!M.esc&&!M.air&&!M.heli;
  S3.attach($("fview"));if(window.VID&&VID.filmOn)VID.filmOn($("fview"));S3.travel({mode:p.mode,local:p.same,seed:Math.floor(S.day),from:{land:RA.land,pop:city(from.v).pop,profile:VOY.profile(from.reg),name:from.v,apt:AIR[from.v]},to:{land:RB.land,pop:city(to.v).pop,profile:VOY.profile(to.reg),apt:AIR[to.v],name:to.v},road,insec,
    onProgress:q=>{const b=$("fprog");if(b)b.style.width=(q*100).toFixed(1)+"%";clk(q)},onEnd:()=>setTimeout(close,700)});
  if(RA)try{A.ambient(p.mode==="avion"||p.mode==="avionp"||p.mode==="jet"?"conseil":"ville")}catch(e){}
  function close(){if(!el.parentNode)return;S3.detach();S3.endFilm();if(window.VID&&VID.filmOff)VID.filmOff();el.remove();document.body.classList.remove("travel");VOY.driving=false;VOY.inTrip=false;const vp=$("vxPanel");if(vp)vp.remove();document.querySelectorAll(".sheet[data-trip]").forEach(s=>s.remove());document.querySelectorAll(".sheet[data-hid]").forEach(s=>{delete s.dataset.hid;s.style.display=""});arrive()}
  $("vySkip").onclick=close;
}
/* travailler pendant le trajet (passager) : courrier et assistant */
VOY.workPanel=function(S){const L=S.inbox.filter(i=>!i.read).slice(0,8);
  G.sheet('<span class="eyebrow">En route</span><h3 class="h2">Travailler pendant le trajet</h3><div class="row"><button class="btn primary" id="wpVox">🎙 Assistant (voix ou écrit)</button><button class="btn" id="wpDir">📜 Mes directives</button></div>'+
   '<span class="eyebrow">Courrier non lu ('+L.length+')</span>'+(L.length?'<div class="choices">'+L.map(i=>'<button class="choice" data-wm="'+i.id+'"><span class="t">'+esc(i.t)+'</span><span class="small muted">'+esc(i.from)+'</span></button>').join("")+'</div>':'<p class="small muted">Rien en attente.</p>'),el=>{el.setAttribute("data-trip","");
    el.querySelector("#wpVox").onclick=()=>{el.remove();if(window.VOIX)VOIX.open()};el.querySelector("#wpDir").onclick=()=>{el.remove();if(window.DIR)DIR.sheet(S)};
    el.querySelectorAll("[data-wm]").forEach(b=>b.onclick=()=>{el.remove();window.SYS.openMail(S,b.dataset.wm)})})};
function arrival(S,from,to,p,horsNorme){
  const M=VOY.MODES[p.mode];const RB=CM.REG[to.reg];let extra=[];let hrs=p.hrs;
  // aléas du voyage
  if(M.delay&&Math.random()<M.delay){const dl=Math.random()<.2?20:G.rnd(2,7);hrs+=dl;extra.push(dl>=20?"Vol annulé par Camair-Co, reporté au lendemain.":"Vol retardé de "+Math.round(dl)+" heures.")}
  const night=(()=>{const h=hourNow(S);return h>=20||h<5})();let risk=M.risk*(M.night&&night?2.5:1);
  if(Math.random()<risk){const days=Math.round(G.rnd(2,8));extra.push("Accident sur le trajet : vous êtes légèrement blessé et soigné pendant "+days+" jours.");hrs+=days*24;window.SYS.cause(S,to.reg,"Accident de la route impliquant "+S.name,-1,"");if(window.EMP)EMP.credit(S,-Math.round(G.rnd(50000,300000)))}
  if(p.sec<30&&!M.esc&&!M.air&&!M.heli&&Math.random()<.05){extra.push("Braquage par des coupeurs de route : vos effets personnels sont volés.");if(window.EMP)EMP.credit(S,-Math.round(G.rnd(100000,600000)));window.SYS.cause(S,to.reg,"Coupeurs de route sur l'axe de "+to.v,-2,"securite")}
  // effets du rang et des choix
  if(M.gene&&!p.same||M.gene&&p.a.pop>3e5){window.SYS.cause(S,from.reg,(p.mode==="cortege"?"Routes bouclées des heures pour le cortège présidentiel à ":"Embouteillages monstres au passage du convoi officiel à ")+from.v,-M.gene*.6,"")}
  if(horsNorme&&(S.mode==="pres"||S.mode==="min")&&["taxi","moto","voiture","bus"].includes(p.mode)){extra.push("Vu dans un "+(p.mode==="moto"?"bendskin":p.mode)+" sans escorte : les réseaux sociaux s'enflamment, et la sécurité s'inquiète.");if(S.st)S.st.pop=clamp(S.st.pop+1.5,0,100);if(Math.random()<.06){extra.push("Incident de sécurité en chemin : la Garde présidentielle vous exfiltre.");if(S.st)S.st.sec=clamp(S.st.sec-1,0,100)}}
  if(p.typ==="incognito"){extra.push("Déplacement incognito : la population apprécie la simplicité.");if(S.st)S.st.pop=clamp(S.st.pop+.5,0,100);if((S.mode==="pres"||S.mode==="min")&&Math.random()<.04){extra.push("Frayeur en route : sans escorte, votre véhicule a été pris à partie.");if(S.st)S.st.sec=clamp(S.st.sec-1,0,100)}}
  if(M.work&&!p.self){const w=Math.min(6,hrs);if(S.ent){const c=S.ent.chantiers.find(x=>x.st==="cours");if(c)c.prog=Math.min(100,c.prog+w*.6);S.ent.rep=clamp(S.ent.rep+.3,0,100);extra.push("Vous avez avancé vos dossiers à l'arrière de la voiture.")}
    else if(S.minis){S.minis.perf=clamp(S.minis.perf+w*.12,0,100);extra.push("Vous avez signé des parapheurs pendant le trajet.")}
    else if(S.mode==="pres"){S.integ=clamp((S.integ||35)+.2,0,100);extra.push("Vous avez travaillé sur vos dossiers pendant le trajet.")}
    else if(S.pro){S.pro.xp+=1}}
  S.loc={reg:to.reg,v:to.v,lieu:to.lieu||null};
  G.advanceDays(hrs/24,false);
  window.SYS.inbox(S,{from:"Votre agenda",t:"Arrivé à "+(to.lieu?to.lieu+", ":"")+to.v,b:(p.legs?"Trajet en "+p.legs.length+" étapes : "+p.legs.map(l=>l.v+" ("+VOY.MODES[l.mode].n+", "+dur(l.hrs)+")").join(" ; ")+". Total":VOY.MODES[p.mode].n)+" · "+p.d+" km · "+dur(hrs)+" · "+F(p.cost)+(p.who!=="personnel"?" (payé par : "+p.who+")":"")+". "+extra.join(" "),k:extra.length?"alerte":"info",reg:to.reg,read:!extra.length});
  G.viewRegion(to.reg);G.toast("Arrivé à "+to.v+(extra.length?" · "+extra[0]:""));G.render();
}
/* ---------- agglomérations (pour la carte) ---------- */
/* déplacement lancé par programme (commandes vocales) : renvoie un message d'erreur ou null */
VOY.goTo=function(S,to,mode,watch,cb,cancel){if(S.loc&&S.loc.pays&&window.INTL){INTL.askRetour(S,to,{cb,cancel});return null}const here=VOY.here(S);const dm=VOY.defaultMode(S,here,to);const p=VOY.plan(S,here,to,dm);if(!p.ok&&!VOY.plan(S,here,to,"voiture").ok&&!VOY.plan(S,here,to,"avion").ok)return p.why;
  VOY.ask(S,to,{mode,watch,cb,cancel});return null};
/* départ immédiat sans fenêtre (tests, automatismes) */
VOY.goNow=function(S,to,mode,watch,cb,o){if(S.loc&&S.loc.pays)return"vous êtes à l'étranger";o=o||{};const here=VOY.here(S);const N=VOY.norme(S);const dm=VOY.defaultMode(S,here,to);let m=mode&&N.ok.includes(mode)?mode:dm;let p=VOY.plan(S,here,to,m);
  if(!p.ok){m=dm;p=VOY.plan(S,here,to,m)}if(!p.ok)return p.why;p.typ=o.typ||"officiel";p.self=m==="voiture";if(!pay(S,p))return"fonds insuffisants pour ce trajet";go(S,here,to,p,watch!==false,m!==dm,cb);return null};

/* ---------- fenêtre de départ : moyen, type, cortège, chauffeur, vidéo ---------- */
const ESC={pres:[["complet","Cortège complet (routes bouclées)"],["reduit","Cortège réduit"],["restreint","Cortège restreint (2 véhicules)"],["sans","Sans cortège"]],
  min:[["complet","Convoi avec escorte de motards"],["restreint","Escorte restreinte (1 véhicule)"],["sans","Sans escorte"]]};
const OFFICIEL=["pres","min","maire","dep","dg"];
function officialDriver(S,typ){const r=rank(S);return typ==="officiel"&&["pres","min","maire","dep"].includes(r)}
VOY.hasDriver=(S,typ)=>officialDriver(S,typ||"officiel")||!!S.chauffeur;
const salDriver=S=>S.mode==="ing"?180000:150000;
VOY.recruit=function(S){if(S.chauffeur)return S.chauffeur;const sal=salDriver(S);const payer=S.mode==="ing"&&S.ent?"entreprise":"personnel";
  if(payer==="entreprise"){if(S.ent.fonds<sal/1e6)return null;S.ent.fonds-=sal/1e6}else if(window.EMP){if(EMP.wallet(S)<sal)return null;EMP.credit(S,-sal)}
  const reg=VOY.here(S).reg;S.chauffeur={n:window.SYS.nom(reg,Math.random()<.15?"f":"m"),sal,payer,since:S.day};
  window.SYS.inbox(S,{from:"Ressources humaines",t:"Chauffeur recruté : "+S.chauffeur.n,b:"Salaire : "+F(sal)+" par mois (premier mois payé), à la charge "+(payer==="entreprise"?"de l'entreprise":"de vos finances personnelles")+".",k:"info",read:true});return S.chauffeur};
VOY.monthTick=function(S){const c=S.chauffeur;if(!c)return;let ok=true;if(c.payer==="entreprise"&&S.ent){if(S.ent.fonds<c.sal/1e6)ok=false;else S.ent.fonds-=c.sal/1e6}else if(window.EMP){if(EMP.wallet(S)<c.sal)ok=false;else EMP.credit(S,-c.sal)}
  if(!ok){window.SYS.inbox(S,{from:"Ressources humaines",t:"Votre chauffeur démissionne",b:c.n+" n'a pas été payé ce mois-ci et quitte votre service.",k:"alerte"});S.chauffeur=null}};
VOY.ask=function(S,to,o){o=o||{};if(!S||S.phase!=="play")return;if(S.loc&&S.loc.pays&&window.INTL)return INTL.askRetour(S,to,o);const here=VOY.here(S);const N=VOY.norme(S);const r=rank(S);const dm=VOY.defaultMode(S,here,to);
  const fromMode=m=>{if(["cortege","convoi"].includes(m))return{moy:"vehicule",esc:"complet",drv:true};if(m==="cortegeR")return{moy:"vehicule",esc:"reduit",drv:true};if(m==="restreint")return{moy:"vehicule",esc:"restreint",drv:true};if(m==="chauffeur")return{moy:"vehicule",esc:"sans",drv:true};if(m==="voiture")return{moy:"vehicule",esc:"sans",drv:false};return{moy:m,esc:"sans",drv:false}};
  let pre=o.mode;if(pre==="rapide"){let best=null,bh=1e9;for(const k of N.ok){const q=VOY.plan(S,here,to,k);if(q.ok&&q.hrs<bh){bh=q.hrs;best=k}}pre=best}
  const st=Object.assign({typ:OFFICIEL.includes(r)?"officiel":"prive",watch:o.watch!==false},fromMode(pre&&N.ok.includes(pre)?pre:dm));let gone=false;
  const modeOf=()=>{if(st.moy!=="vehicule")return st.moy;if(st.typ==="incognito")st.esc="sans";if(st.esc==="complet")return r==="pres"?"cortege":"convoi";if(st.esc==="reduit")return"cortegeR";if(st.esc==="restreint")return"restreint";return st.drv?"chauffeur":"voiture"};
  const others=Object.keys(VOY.MODES).filter(k=>N.ok.includes(k)&&!["cortege","cortegeR","restreint","convoi","chauffeur","voiture"].includes(k));
  const vehOk=N.ok.some(k=>["cortege","convoi","chauffeur","voiture","restreint"].includes(k));
  const vehDef=()=>{const o2=Object.assign({},st);if(st.moy!=="vehicule"){const f=fromMode(N.city);st.moy="vehicule";st.esc=f.esc;st.drv=f.drv}const m=modeOf();Object.assign(st,o2);return m};
  const legName=k=>{const M=VOY.MODES[k];return M.ic+" "+(k==="voiture"?"Voiture (vous conduisez)":M.n)};
  const nearAir=(v,kind)=>{const L=kind===1?AIR_COM:Object.keys(AIR);let best=null,bd=1e9;for(const n of L){const c=city(n);if(!c)continue;const d=n===v?0:roadKm(city(v),c);if(d<bd){bd=d;best=n}}return best};
  const cityRef=n=>{const c=city(n);return{reg:c.reg,v:c.n}};
  const viaAir=k=>{const kind=VOY.MODES[k].air;const A1=nearAir(here.v,kind),A2=nearAir(to.v,kind);if(!A1||!A2||A1===A2)return null;const veh=vehDef();const L=[];
    if(A1!==here.v)L.push({from:{reg:here.reg,v:here.v},to:cityRef(A1),mode:veh});L.push({from:cityRef(A1),to:cityRef(A2),mode:k});if(A2!==to.v)L.push({from:cityRef(A2),to:{reg:to.reg,v:to.v,lieu:to.lieu},mode:veh});return L};
  const legsSum=()=>{let hrs=0,cost=0,d=0,ok=true,why="",self=false,main=null;st.legs.forEach((l,i)=>{const q=VOY.plan(S,l.from,l.to,l.mode);l.q=q;if(!q.ok){ok=false;why=why||("Étape "+(i+1)+" : "+q.why);return}hrs+=q.hrs+(i?.5:0);cost+=q.cost;d+=q.d;if(!main||q.hrs>main.hrs)main=q;if(l.mode==="voiture")self=true});return{ok,why,hrs,cost,d,self,main}};
  const legModes=()=>N.ok.slice().sort((a,b)=>(VOY.MODES[a].air?1:0)-(VOY.MODES[b].air?1:0));
  const allCities=VOY.CITIES.slice().sort((a,b)=>a.n.localeCompare(b.n,"fr"));
  const drawLegs=el=>{const T=legsSum();const needDrv=st.legs.some(l=>l.mode==="chauffeur")&&!VOY.hasDriver(S,st.typ);
    el.querySelector("#vaBody").innerHTML='<div class="kv"><span>Départ</span><b>'+esc((here.lieu?here.lieu+", ":"")+here.v)+'</b><span>Arrivée</span><b>'+esc((to.lieu?to.lieu+", ":"")+to.v)+'</b></div>'+
     '<span class="eyebrow">Votre trajet, étape par étape</span>'+st.legs.map((l,i)=>'<div class="card" style="gap:6px;padding:10px"><div class="row" style="justify-content:space-between"><b class="small">Étape '+(i+1)+' : '+esc(l.from.v)+' → '+(i<st.legs.length-1?'<select data-lto="'+i+'">'+allCities.map(c=>'<option'+(c.n===l.to.v?" selected":"")+'>'+esc(c.n)+'</option>').join("")+'</select>':esc(l.to.v))+'</b>'+(st.legs.length>1?'<button class="btn small ghost" data-ldel="'+i+'" aria-label="Supprimer l\'étape">🗑</button>':"")+'</div>'+
       '<select data-lmode="'+i+'" style="width:100%">'+legModes().map(k=>'<option value="'+k+'"'+(k===l.mode?" selected":"")+'>'+esc(legName(k))+'</option>').join("")+'</select><span class="small '+(l.q.ok?"muted":"")+'" style="'+(l.q.ok?"":"color:var(--bad,#ef5350)")+'">'+(l.q.ok?dur(l.q.hrs)+" · "+l.q.d+" km · "+F(l.q.cost):esc(l.q.why))+'</span></div>').join("")+
     '<div class="row"><button class="btn small" id="vaAdd">＋ Ajouter une étape</button><button class="btn small ghost" id="vaSimple">Revenir au choix simple</button></div>'+
     (OFFICIEL.includes(r)?'<span class="eyebrow">Type de déplacement</span><div class="row">'+[["officiel","Officiel"],["prive","Privé"],["incognito","Incognito"]].map(([k,lb])=>'<button class="btn small'+(st.typ===k?" primary":"")+'" data-at="'+k+'">'+lb+'</button>').join("")+'</div>':"")+
     (needDrv?'<div class="card" style="gap:6px"><b>Une étape « voiture avec chauffeur » mais vous n\'avez pas de chauffeur.</b><button class="btn primary" id="vaRec">Recruter un chauffeur ('+F(salDriver(S))+' par mois)</button></div>':"")+
     '<div class="card" style="gap:4px"><b>Total : '+st.legs.length+' étape'+(st.legs.length>1?"s":"")+'</b><span class="small">'+(T.ok?dur(T.hrs)+" (correspondances comprises) · "+T.d+" km · "+F(T.cost)+(st.typ==="officiel"?"":" (à vos frais)"):esc(T.why))+'</span><span class="small" style="color:'+(T.self?"var(--warn,#f0a93a)":"var(--ok,#43c47c)")+'">'+(T.self?"Au moins une étape où vous conduisez : pendant celle-ci, travail à la voix uniquement.":"Vous êtes passager sur tout le trajet : travail possible (écrit et voix).")+'</span></div>'+
     '<label class="row small" style="gap:8px"><input type="checkbox" id="vaW"'+(st.watch?" checked":"")+'> Regarder la vidéo du trajet (sinon, arrivée directe)</label>'+
     '<div class="row"><button class="btn primary" id="vaGo"'+(T.ok&&!needDrv?"":" disabled")+'>Partir</button><button class="btn ghost" id="vaNo">Annuler</button></div>';
    el.querySelectorAll("[data-lmode]").forEach(s=>s.onchange=()=>{st.legs[+s.dataset.lmode].mode=s.value;drawLegs(el)});
    el.querySelectorAll("[data-lto]").forEach(s=>s.onchange=()=>{const i=+s.dataset.lto;const c=cityRef(s.value);st.legs[i].to=c;st.legs[i+1].from=c;drawLegs(el)});
    el.querySelectorAll("[data-ldel]").forEach(b=>b.onclick=()=>{const i=+b.dataset.ldel;const L=st.legs;if(i<L.length-1){L[i+1].from=L[i].from}else{L[i-1].to=L[i].to}L.splice(i,1);drawLegs(el)});
    el.querySelector("#vaAdd").onclick=()=>{const L=st.legs;const last=L[L.length-1];const mid=nearAir(last.from.v,2)||last.from.v;const midC=mid!==last.from.v&&mid!==last.to.v?cityRef(mid):cityRef(last.from.v===here.v?(allCities.find(c=>c.n!==here.v&&c.n!==to.v)||{n:here.v}).n:last.from.v);
      L.splice(L.length-1,0,{from:last.from,to:midC,mode:last.mode});last.from=midC;drawLegs(el)};
    el.querySelector("#vaSimple").onclick=()=>{st.legs=null;draw(el)};
    el.querySelectorAll("[data-at]").forEach(b=>b.onclick=()=>{st.typ=b.dataset.at;drawLegs(el)});
    const rc=el.querySelector("#vaRec");if(rc)rc.onclick=()=>{const c=VOY.recruit(S);if(!c)return G.toast("Fonds insuffisants pour payer un chauffeur.");G.toast("Chauffeur recruté : "+c.n);drawLegs(el)};
    el.querySelector("#vaW").onchange=e=>{st.watch=e.target.checked};
    el.querySelector("#vaNo").onclick=()=>{el.remove();if(!gone&&o.cancel)o.cancel()};
    el.querySelector("#vaGo").onclick=()=>{const T2=legsSum();if(!T2.ok)return G.toast(T2.why);
      const q={ok:true,mode:T2.main.mode,hrs:T2.hrs,cost:T2.cost,d:T2.d,who:st.typ==="officiel"?T2.main.who:"personnel",sec:Math.min(...st.legs.map(l=>l.q.sec)),same:false,a:city(here.v),b:city(to.v),jam:false,typ:st.typ,self:T2.self&&T2.main.mode==="voiture",
        legs:st.legs.map(l=>({v:l.from.v+" → "+l.to.v,mode:l.mode,hrs:l.q.hrs}))};
      if(!pay(S,q))return G.toast("Fonds insuffisants pour ce trajet.");gone=true;el.remove();go(S,here,to,q,st.watch,false,o.cb)}};
  const draw=el=>{if(st.legs)return drawLegs(el);const m=modeOf();const p=VOY.plan(S,here,to,m);const drvNeeded=st.moy==="vehicule"&&st.esc==="sans"&&st.drv;const hasD=VOY.hasDriver(S,st.typ);
    const self=st.moy==="vehicule"&&st.esc==="sans"&&!st.drv;const pv=k=>{const q=VOY.plan(S,here,to,k);return q.ok?dur(q.hrs)+" · "+F(q.cost):q.why};
    el.querySelector("#vaBody").innerHTML='<div class="kv"><span>Départ</span><b>'+esc((here.lieu?here.lieu+", ":"")+here.v)+'</b><span>Arrivée</span><b>'+esc((to.lieu?to.lieu+", ":"")+to.v)+'</b></div>'+
     '<span class="eyebrow">Moyen de transport</span><div class="choices">'+(vehOk?'<button class="choice" data-am="vehicule" aria-pressed="'+(st.moy==="vehicule")+'" style="'+(st.moy==="vehicule"?"border-color:var(--y)":"")+'"><span class="t">🚗 Véhicule (voiture'+(ESC[r]?", cortège ou escorte":"")+')</span><span class="small muted">'+esc(pv(st.moy==="vehicule"?m:vehDef()))+'</span></button>':"")+
       others.map(k=>{const q=VOY.plan(S,here,to,k);const M=VOY.MODES[k];const via=!q.ok&&M.air&&viaAir(k);return'<button class="choice" data-am="'+k+'"'+(q.ok?"":" disabled")+' aria-pressed="'+(st.moy===k)+'" style="'+(st.moy===k?"border-color:var(--y)":"")+(q.ok?"":";opacity:.45")+'"><span class="t">'+M.ic+" "+esc(M.n)+'</span><span class="small muted">'+esc(pv(k))+'</span></button>'+(via?'<button class="btn small" data-via="'+k+'">✈️ '+esc(M.n)+' via '+esc(via.map(l=>l.to.v).slice(0,-1).join(" et "))+' (voiture jusqu\'à l\'aéroport)</button>':"")}).join("")+'</div>'+
     '<button class="btn small" id="vaLegs">✏️ Composer ou modifier le trajet (plusieurs étapes, plusieurs moyens)</button>'+
     (OFFICIEL.includes(r)?'<span class="eyebrow">Type de déplacement</span><div class="row">'+[["officiel","Officiel"],["prive","Privé"],["incognito","Incognito"]].map(([k,l])=>'<button class="btn small'+(st.typ===k?" primary":"")+'" data-at="'+k+'">'+l+'</button>').join("")+'</div><p class="small muted">'+(st.typ==="officiel"?"Frais pris en charge par "+(r==="pres"?"l'État":r==="min"?"le ministère":r==="maire"?"la commune":r==="dg"?"l'entreprise":"l'institution")+", protocole normal.":st.typ==="prive"?"À vos frais, protocole allégé.":"Sans protocole ni escorte, à vos frais : discret, mais plus risqué.")+'</p>':"")+
     (st.moy==="vehicule"&&ESC[r]&&st.typ!=="incognito"?'<span class="eyebrow">'+(r==="pres"?"Cortège":"Escorte")+'</span><div class="choices">'+ESC[r].map(([k,l])=>'<label class="row small" style="gap:8px"><input type="radio" name="vaEsc" value="'+k+'"'+(st.esc===k?" checked":"")+'> '+esc(l)+'</label>').join("")+'</div>':"")+
     (st.moy==="vehicule"?'<span class="eyebrow">Conduite</span>'+(st.esc!=="sans"?'<p class="small">Les véhicules du '+(r==="pres"?"cortège":"convoi")+' sont conduits par des chauffeurs de l\'État.</p>':
       '<label class="row small" style="gap:8px"><input type="checkbox" id="vaDrv"'+(st.drv?" checked":"")+'> Me faire conduire par un chauffeur</label>'+
       (drvNeeded&&!hasD?'<div class="card" style="gap:6px"><b>Vous n\'avez pas de chauffeur.</b><span class="small">Sans chauffeur, impossible de vous faire conduire : recrutez-en un ('+F(salDriver(S))+' par mois, à la charge '+(S.mode==="ing"?"de l\'entreprise":"de vos finances personnelles")+'), ou conduisez vous-même.</span><button class="btn primary" id="vaRec">Recruter un chauffeur</button></div>':
        drvNeeded?'<p class="small muted">Chauffeur : '+esc(officialDriver(S,st.typ)?"chauffeur de fonction":S.chauffeur.n)+'.</p>':"")):"")+
     '<div class="card" style="gap:4px"><b>'+esc(VOY.MODES[m].ic+" "+VOY.MODES[m].n)+'</b><span class="small">'+(p.ok?dur(p.hrs)+" · "+p.d+" km · "+F(p.cost)+(st.typ==="officiel"&&p.who!=="personnel"?" (payé par : "+p.who+")":" (à vos frais)"):esc(p.why))+'</span>'+
       '<span class="small" style="color:'+(self?"var(--warn,#f0a93a)":"var(--ok,#43c47c)")+'">'+(self?"Vous êtes au volant : téléphone interdit. Pendant la vidéo, vous ne pourrez travailler qu'à la voix.":st.moy==="marche"?"À pied : vous pourrez passer des appels à la voix.":"Vous êtes passager : vous pourrez travailler pendant le trajet (écrit et voix).")+'</span></div>'+
     '<label class="row small" style="gap:8px"><input type="checkbox" id="vaW"'+(st.watch?" checked":"")+'> Regarder la vidéo du trajet (sinon, arrivée directe)</label>'+
     '<div class="row"><button class="btn primary" id="vaGo"'+(p.ok&&!(drvNeeded&&!hasD)?"":" disabled")+'>Partir</button><button class="btn ghost" id="vaNo">Annuler</button></div>';
    el.querySelectorAll("[data-am]").forEach(b=>b.onclick=()=>{st.moy=b.dataset.am;draw(el)});
    el.querySelectorAll("[data-via]").forEach(b=>b.onclick=()=>{st.legs=viaAir(b.dataset.via);draw(el)});
    el.querySelector("#vaLegs").onclick=()=>{st.legs=[{from:{reg:here.reg,v:here.v},to:{reg:to.reg,v:to.v,lieu:to.lieu},mode:modeOf()}];draw(el)};
    el.querySelectorAll("[data-at]").forEach(b=>b.onclick=()=>{st.typ=b.dataset.at;draw(el)});
    el.querySelectorAll("input[name=vaEsc]").forEach(i=>i.onchange=()=>{st.esc=i.value;if(st.esc!=="sans")st.drv=true;draw(el)});
    const dv=el.querySelector("#vaDrv");if(dv)dv.onchange=()=>{st.drv=dv.checked;draw(el)};
    const rc=el.querySelector("#vaRec");if(rc)rc.onclick=()=>{const c=VOY.recruit(S);if(!c)return G.toast("Fonds insuffisants pour payer un chauffeur.");G.toast("Chauffeur recruté : "+c.n);draw(el)};
    el.querySelector("#vaW").onchange=e=>{st.watch=e.target.checked};
    el.querySelector("#vaNo").onclick=()=>{el.remove();if(!gone&&o.cancel)o.cancel()};
    el.querySelector("#vaGo").onclick=()=>{const m2=modeOf();const q=VOY.plan(S,here,to,m2);if(!q.ok)return G.toast(q.why);q.typ=st.typ;q.self=self;if(st.typ!=="officiel")q.who="personnel";if(!pay(S,q))return G.toast("Fonds insuffisants pour ce trajet.");gone=true;el.remove();go(S,here,to,q,st.watch,m2!==dm,o.cb)}};
  G.sheet('<span class="eyebrow">Déplacement</span><h3 class="h2">Comment voulez-vous y aller ?</h3><div id="vaBody"></div>',el=>{el.setAttribute("data-noinstr","");draw(el);el.addEventListener("click",e=>{if((e.target===el||e.target.hasAttribute("data-close"))&&!gone&&o.cancel)o.cancel()})})};
VOY.city=n=>city(n);VOY.LIEUX=LIEUX;VOY.dur=dur;VOY.pay=pay;
VOY.agglosHTML=function(){const top=VOY.CITIES.slice().sort((a,b)=>b.pop-a.pop).slice(0,16);const max=top[0].pop;
  return'<div class="card"><span class="eyebrow">Grandes agglomérations (estimations 2025)</span>'+top.map(c=>'<div class="row" style="justify-content:space-between;gap:8px"><span class="small" style="min-width:110px"><b>'+esc(c.n)+'</b> <span class="muted">'+esc(CM.REG[c.reg].n)+'</span></span><span style="flex:1;height:8px;background:var(--panel3);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:'+Math.max(2,c.pop/max*100)+'%;background:var(--y)"></i></span><span class="small" style="font-family:var(--mono);min-width:64px;text-align:right">'+(c.pop>=1e6?(c.pop/1e6).toFixed(1)+" M":Math.round(c.pop/1000)+" k")+'</span><button class="btn small" data-goto="'+esc(c.n)+'" data-gr="'+c.reg+'">Y aller</button></div>').join("")+'</div>'};
VOY.bind=function(root){root.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>VOY.open(b.dataset.gr,b.dataset.goto))};
})();
