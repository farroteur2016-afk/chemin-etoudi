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

/* ---------- moyens de transport ---------- */
VOY.MODES={
 marche:{n:"À pied",ic:"🚶",city:4.5,road:4.5,maxKm:6,cost:()=>0,risk:.001},
 moto:{n:"Moto-taxi (bendskin)",ic:"🏍️",city:24,road:40,maxKm:60,cost:d=>Math.max(200,Math.round((150+d*55)/50)*50),risk:.02,note:"rapide dans les embouteillages, mais dangereux"},
 taxi:{n:"Taxi (place ou course)",ic:"🚕",city:17,road:55,maxKm:80,cost:d=>d<10?350:Math.round((1000+d*110)/100)*100,risk:.004},
 voiture:{n:"Votre voiture",ic:"🚗",city:18,road:62,cost:d=>Math.round(d*.1*840+2000),risk:.003,own:1},
 chauffeur:{n:"Voiture avec chauffeur",ic:"🚘",city:18,road:65,cost:d=>Math.round(d*.11*840+5000),risk:.002,work:1},
 convoi:{n:"Convoi officiel avec escorte de motards",ic:"🚨",city:32,road:75,cost:d=>Math.round(d*.4*840+60000),risk:.001,work:1,esc:1,gene:1},
 cortege:{n:"Cortège présidentiel (routes bouclées)",ic:"🚨",city:45,road:85,cost:d=>Math.round(d*1.5*840+400000),risk:0,work:1,esc:2,gene:3},
 bus:{n:"Bus interurbain (agence de voyage)",ic:"🚌",city:15,road:52,minKm:40,cost:d=>Math.round((1500+d*16)/500)*500,risk:.006,work:0,night:1},
 train:{n:"Train Camrail",ic:"🚆",rail:1,road:60,cost:d=>Math.round((d*36)/500)*500+500,risk:.001,work:1},
 avion:{n:"Vol Camair-Co",ic:"✈️",air:1,cost:d=>Math.round((40000+d*85)/1000)*1000,risk:0,work:1,delay:.35},
 jet:{n:"Avion affrété (jet privé)",ic:"🛩️",air:2,cost:d=>Math.round((2500000+d*9000)/10000)*10000,risk:0,work:1},
 avionp:{n:"Avion présidentiel",ic:"✈️",air:2,cost:d=>Math.round((3000000+d*12000)/10000)*10000,risk:0,work:1},
 helico:{n:"Hélicoptère",ic:"🚁",heli:1,cost:d=>Math.round((800000+d*6000)/10000)*10000,risk:0,work:0,maxKm:450}
};
/* modes autorisés et mode par défaut selon le rang (usages actuels) */
function rank(S){if(S.mode==="pres")return"pres";if(S.mode==="min")return"min";if(S.profil==="depute")return"dep";if(S.profil==="maire")return"maire";if(S.mode==="ing")return"dg";if(S.mode==="pro")return(S.pro.grade>=2||S.pro.fonds>8e6)?"cadre":"pro";return"chef"}
const NORMES={
 pres:{ok:["cortege","avionp","helico","chauffeur","convoi","voiture","taxi","moto"],city:"cortege",long:"avionp",lab:"Président de la République : cortège présidentiel en ville et sur route, avion présidentiel au-delà de 300 km."},
 min:{ok:["convoi","chauffeur","avion","jet","helico","train","voiture","taxi","moto","bus"],city:"chauffeur",long:"avion",lab:"Ministre : voiture de fonction avec chauffeur (escorte en option), vol Camair-Co pour les longues distances."},
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
  const cityTime=(c)=>(c.pop>1e6?.55:c.pop>3e5?.3:.15)*(M.esc?.35:mode==="moto"?.6:jam)*(17/(M.city||17));
  let hrs;
  if(M.air){hrs=(M.air===1?2.2:1)+d/(M.air===1?420:520)+cityTime(a)*.8+cityTime(b)*.8}
  else if(M.heli){hrs=.4+d/210}
  else if(M.rail){hrs=.8+d/M.road+(d>400?2:0)}
  else if(same){hrs=d/(M.city*(M.esc?1:1/jam*1.4))+.1}
  else{const inf=(infraOf(S,a.reg)+infraOf(S,b.reg))/2;const sp=M.road*(.55+inf/140);hrs=d/sp+cityTime(a)+cityTime(b)+(d>350&&!M.esc?1.5:0)}
  let cost=M.cost(d);const who=S.mode==="pres"&&["cortege","avionp","helico","chauffeur","convoi"].includes(mode)?"État":S.mode==="min"&&["chauffeur","convoi","avion","jet","helico"].includes(mode)?"ministère":S.profil==="maire"&&mode==="chauffeur"?"commune":S.mode==="ing"&&["chauffeur","avion","jet"].includes(mode)?"entreprise":"personnel";
  const sec=Math.min(secOf(S,a.reg),secOf(S,b.reg));
  return{ok:true,d,hrs,cost,who,sec,jam:jam>1,same,a,b,mode};
};
VOY.defaultMode=function(S,from,to){const N=VOY.norme(S);const p=VOY.plan(S,from,to,N.long);const d=from.v===to.v?5:roadKm(city(from.v),city(to.v));
  let m=d>300?N.long:N.city;let pl=VOY.plan(S,from,to,m);if(!pl.ok){for(const k of N.ok){pl=VOY.plan(S,from,to,k);if(pl.ok){m=k;break}}}return m};

/* ---------- écran de déplacement ---------- */
VOY.open=function(preReg,preCity){
  const S=G.S;if(!S||S.phase!=="play")return;const here=VOY.here(S);const N=VOY.norme(S);
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
     '<p class="small" style="color:var(--y)">Usage pour votre rang : '+esc(N.lab)+'</p><div class="choices">'+
     opts.map(([k,p])=>{const M=VOY.MODES[k];return'<button class="choice" data-vm="'+k+'"'+(p.ok?"":" disabled")+' aria-pressed="'+(k===mode)+'" style="'+(k===mode?"border-color:var(--y)":"")+(p.ok?"":";opacity:.45")+'"><span class="t">'+M.ic+' '+esc(M.n)+(k===dm?' <span class="pill ok">par défaut</span>':"")+'</span><span class="small muted">'+(p.ok?dur(p.hrs)+' · '+p.d+' km · '+F(p.cost)+(p.who!=="personnel"?" (payé par : "+p.who+")":"")+(M.work?" · vous pouvez travailler pendant le trajet":"")+(M.note?" · "+M.note:""):esc(p.why))+'</span></button>'}).join("")+'</div>'+
     '<label class="row small" for="vyW" style="gap:8px"><input type="checkbox" id="vyW"'+(watch?" checked":"")+'> Regarder la vidéo du trajet (vous pourrez la passer à tout moment)</label>'+
     '<button class="btn primary" id="vyGo">Partir</button>';
    el.querySelector("#vyR").onchange=e=>{reg=e.target.value;v=CM.REG[reg].chef;lieu=null;mode=null;draw(el)};
    el.querySelector("#vyV").onchange=e=>{v=e.target.value;lieu=null;mode=null;draw(el)};
    const sl=el.querySelector("#vyL");if(sl)sl.onchange=e=>{lieu=e.target.value||null};
    el.querySelectorAll("[data-vm]").forEach(b=>b.onclick=()=>{mode=b.dataset.vm;draw(el)});
    el.querySelector("#vyW").onchange=e=>{watch=e.target.checked};
    el.querySelector("#vyGo").onclick=()=>{const p=VOY.plan(S,here,to,mode);if(!p.ok)return G.toast(p.why);if(!pay(S,p))return G.toast("Fonds insuffisants pour ce trajet.");el.remove();go(S,here,{reg,v,lieu},p,watch,mode!==dm)};
  };
  G.sheet('<h3 class="h2">Se déplacer</h3><div id="vyBody"></div>',el=>draw(el));
};
function dur(h){if(h<1)return Math.max(5,Math.round(h*60/5)*5)+" min";const H=Math.floor(h),m=Math.round((h-H)*60/10)*10;return H+" h"+(m?String(m).padStart(2,"0"):"")}
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
   '<div class="fbar"><i id="fprog"></i></div><div class="fctl"><button class="btn small primary" id="vySkip">Passer la vidéo et arriver</button></div>';
  document.body.appendChild(el);
  const sub=(M.work?"Pendant le trajet, vous travaillez sur vos dossiers. ":"")+(p.mode==="cortege"?"Les routes sont bouclées ; les motards de la Garde présidentielle ouvrent la voie.":p.mode==="convoi"?"Les motards de l'escorte ouvrent la voie, sirènes hurlantes.":p.mode==="moto"?"Le bendskin se faufile entre les voitures.":p.mode==="train"?"Le train Camrail traverse la campagne.":M.air?"Décollage, vol au-dessus des nuages, puis atterrissage.":p.mode==="helico"?"L'hélicoptère survole la région.":p.jam?"C'est l'heure de pointe : la circulation est dense.":"La route défile.");
  $("vySub").textContent=sub;
  const road=p.same?null:(p.d>250?CM.REG[pick([from.reg,to.reg])].land:RB.land);const insec=p.sec<30&&!M.esc&&!M.air&&!M.heli;
  S3.attach($("fview"));S3.travel({mode:p.mode,local:p.same,seed:Math.floor(S.day),from:{land:RA.land,pop:city(from.v).pop,profile:VOY.profile(from.reg),name:from.v,apt:AIR[from.v]},to:{land:RB.land,pop:city(to.v).pop,profile:VOY.profile(to.reg),apt:AIR[to.v],name:to.v},road,insec,
    onProgress:q=>{const b=$("fprog");if(b)b.style.width=(q*100).toFixed(1)+"%"},onEnd:()=>setTimeout(close,700)});
  if(RA)try{A.ambient(p.mode==="avion"||p.mode==="avionp"||p.mode==="jet"?"conseil":"ville")}catch(e){}
  function close(){if(!el.parentNode)return;S3.detach();S3.endFilm();el.remove();arrive()}
  $("vySkip").onclick=close;
}
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
  if(M.work){const w=Math.min(6,hrs);if(S.ent){const c=S.ent.chantiers.find(x=>x.st==="cours");if(c)c.prog=Math.min(100,c.prog+w*.6);S.ent.rep=clamp(S.ent.rep+.3,0,100);extra.push("Vous avez avancé vos dossiers à l'arrière de la voiture.")}
    else if(S.minis){S.minis.perf=clamp(S.minis.perf+w*.12,0,100);extra.push("Vous avez signé des parapheurs pendant le trajet.")}
    else if(S.mode==="pres"){S.integ=clamp((S.integ||35)+.2,0,100);extra.push("Vous avez travaillé sur vos dossiers pendant le trajet.")}
    else if(S.pro){S.pro.xp+=1}}
  S.loc={reg:to.reg,v:to.v,lieu:to.lieu||null};
  G.advanceDays(hrs/24,false);
  window.SYS.inbox(S,{from:"Votre agenda",t:"Arrivé à "+(to.lieu?to.lieu+", ":"")+to.v,b:VOY.MODES[p.mode].n+" · "+p.d+" km · "+dur(hrs)+" · "+F(p.cost)+(p.who!=="personnel"?" (payé par : "+p.who+")":"")+". "+extra.join(" "),k:extra.length?"alerte":"info",reg:to.reg,read:!extra.length});
  G.viewRegion(to.reg);G.toast("Arrivé à "+to.v+(extra.length?" · "+extra[0]:""));G.render();
}
/* ---------- agglomérations (pour la carte) ---------- */
/* déplacement lancé par programme (commandes vocales) : renvoie un message d'erreur ou null */
VOY.goTo=function(S,to,mode,watch,cb){const here=VOY.here(S);const N=VOY.norme(S);const dm=VOY.defaultMode(S,here,to);let m=mode&&N.ok.includes(mode)?mode:dm;let p=VOY.plan(S,here,to,m);
  if(!p.ok){m=dm;p=VOY.plan(S,here,to,m)}if(!p.ok)return p.why;if(!pay(S,p))return"fonds insuffisants pour ce trajet";go(S,here,to,p,watch!==false,m!==dm,cb);return null};
VOY.city=n=>city(n);VOY.LIEUX=LIEUX;VOY.dur=dur;
VOY.agglosHTML=function(){const top=VOY.CITIES.slice().sort((a,b)=>b.pop-a.pop).slice(0,16);const max=top[0].pop;
  return'<div class="card"><span class="eyebrow">Grandes agglomérations (estimations 2025)</span>'+top.map(c=>'<div class="row" style="justify-content:space-between;gap:8px"><span class="small" style="min-width:110px"><b>'+esc(c.n)+'</b> <span class="muted">'+esc(CM.REG[c.reg].n)+'</span></span><span style="flex:1;height:8px;background:var(--panel3);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:'+Math.max(2,c.pop/max*100)+'%;background:var(--y)"></i></span><span class="small" style="font-family:var(--mono);min-width:64px;text-align:right">'+(c.pop>=1e6?(c.pop/1e6).toFixed(1)+" M":Math.round(c.pop/1000)+" k")+'</span><button class="btn small" data-goto="'+esc(c.n)+'" data-gr="'+c.reg+'">Y aller</button></div>').join("")+'</div>'};
VOY.bind=function(root){root.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>VOY.open(b.dataset.gr,b.dataset.goto))};
})();
