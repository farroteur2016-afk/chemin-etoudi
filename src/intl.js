/* Chemin d'Etoudi — voyages à l'étranger, pour tous les profils (présents et futurs) :
   destinations réelles, vol commercial / avion présidentiel / jet privé selon le rang, route pour les pays voisins,
   visas (CEMAC sans visa, passeport diplomatique pour les missions officielles), activités sur place
   (ambassade, officiels du pays, diaspora, investisseurs, sommets), effets de l'absence, et retour au pays. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME,S3=window.Scene3D,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,clamp=G.clamp,pick=G.pick;
const INTL={};window.INTL=INTL;
const F=n=>Math.round(n).toLocaleString("fr-FR")+" FCFA";
const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const dur=h=>window.VOY?VOY.dur(h):Math.round(h)+" h";

/* destinations : distance approximative depuis Yaoundé (km), zone, visa, terre (décor vidéo), lieux notables */
const DEST=[
 {pays:"Gabon",v:"Libreville",km:480,z:"Afrique centrale",cemac:1,route:"Ebolowa",rkm:520,land:"cote"},
 {pays:"Guinée équatoriale",v:"Malabo",km:330,z:"Afrique centrale",cemac:1,land:"cote"},
 {pays:"Tchad",v:"N'Djamena",km:1040,z:"Afrique centrale",cemac:1,route:"Kousséri",rkm:15,land:"sahel"},
 {pays:"République centrafricaine",v:"Bangui",km:880,z:"Afrique centrale",cemac:1,route:"Garoua-Boulaï",rkm:610,land:"foret"},
 {pays:"Congo",v:"Brazzaville",km:1140,z:"Afrique centrale",cemac:1,land:"foret"},
 {pays:"Nigeria",v:"Abuja",km:760,z:"Afrique de l'Ouest",route:"Mamfe",rkm:640,land:"savane"},
 {pays:"Nigeria",v:"Lagos",km:1000,z:"Afrique de l'Ouest",land:"port"},
 {pays:"République démocratique du Congo",v:"Kinshasa",km:1150,z:"Afrique centrale",land:"foret"},
 {pays:"Côte d'Ivoire",v:"Abidjan",km:1800,z:"Afrique de l'Ouest",land:"cote"},
 {pays:"Sénégal",v:"Dakar",km:3300,z:"Afrique de l'Ouest",land:"cote"},
 {pays:"Éthiopie",v:"Addis-Abeba",km:3400,z:"Afrique de l'Est",lieu:"Siège de l'Union africaine",land:"hauts"},
 {pays:"Maroc",v:"Rabat",km:3900,z:"Afrique du Nord",land:"cote"},
 {pays:"Afrique du Sud",v:"Pretoria",km:3700,z:"Afrique australe",land:"plateau"},
 {pays:"France",v:"Paris",km:5000,z:"Europe",land:"ville"},
 {pays:"Belgique",v:"Bruxelles",km:5100,z:"Europe",lieu:"Institutions de l'Union européenne",land:"ville"},
 {pays:"Suisse",v:"Genève",km:4800,z:"Europe",lieu:"Palais des Nations (ONU)",land:"ville"},
 {pays:"Royaume-Uni",v:"Londres",km:5400,z:"Europe",land:"ville"},
 {pays:"Allemagne",v:"Berlin",km:5300,z:"Europe",land:"ville"},
 {pays:"Russie",v:"Moscou",km:6200,z:"Europe",land:"ville"},
 {pays:"États-Unis",v:"New York",km:9300,z:"Amériques",lieu:"Siège des Nations unies",land:"ville"},
 {pays:"États-Unis",v:"Washington",km:9500,z:"Amériques",land:"ville"},
 {pays:"Canada",v:"Ottawa",km:9300,z:"Amériques",land:"ville"},
 {pays:"Chine",v:"Pékin",km:11400,z:"Asie",land:"ville"},
 {pays:"Japon",v:"Tokyo",km:13300,z:"Asie",land:"ville"},
 {pays:"Émirats arabes unis",v:"Dubaï",km:5700,z:"Moyen-Orient",land:"ville"},
 {pays:"Arabie saoudite",v:"Riyad",km:4600,z:"Moyen-Orient",land:"sahel"},
 {pays:"Turquie",v:"Istanbul",km:5000,z:"Europe",land:"ville"}];
INTL.DEST=DEST;
const VISA={Europe:[52000,12],"Amériques":[110000,20],Asie:[60000,10],"Moyen-Orient":[70000,7],"Afrique du Nord":[45000,7],"Afrique de l'Ouest":[35000,5],"Afrique de l'Est":[40000,5],"Afrique australe":[45000,7],"Afrique centrale":[30000,4]};
INTL.find=t=>{t=norm(t);return DEST.find(d=>new RegExp("\\b"+norm(d.v)+"\\b").test(t))||DEST.find(d=>new RegExp("\\b"+norm(d.pays)+"\\b").test(t))||null};
const MOTIFS={officiel:"Visite officielle",sommet:"Sommet ou conférence internationale",eco:"Mission économique",prive:"Voyage privé",sante:"Soins médicaux",formation:"Formation ou congrès professionnel",tourisme:"Tourisme"};
function rank(S){return S.mode==="pres"?"pres":S.mode==="min"?"min":S.mode==="ing"?"dg":S.profil==="maire"||S.profil==="depute"?"elu":S.mode==="pro"?"pro":"chef"}
function motifsFor(S){const r=rank(S);return r==="pres"||r==="min"?["officiel","sommet","eco","prive","sante"]:r==="dg"?["eco","formation","prive","sante","tourisme"]:r==="elu"?["officiel","eco","prive","sante","tourisme"]:r==="pro"?["formation","prive","sante","tourisme"]:["officiel","prive","sante","tourisme"]}
const officiel=(S,motif)=>["officiel","sommet","eco"].includes(motif)&&["pres","min","elu","dg"].includes(rank(S));
function modesFor(S,d,motif){const r=rank(S),o=officiel(S,motif);const L=[{k:"avion",n:"Vol commercial (classe économique)"},{k:"avionB",n:"Vol commercial (classe affaires)"}];
  if(r==="pres"&&o)L.unshift({k:"avionp",n:"Avion présidentiel"});if((r==="min"||r==="dg"||r==="pres")&&(o||r==="dg"))L.push({k:"jet",n:"Avion affrété (jet privé)"});
  if(d.route)L.push({k:"route",n:"Par la route (via "+d.route+")"});return L}
function plan(S,d,mk){const hub=d.km<1500?1:0;
  if(mk==="route"){const hrs=d.rkm/55+2+(d.rkm>300?2:0);return{hrs,cost:Math.round(15000+d.rkm*90),mode:"voiture",road:true}}
  const fly=d.km/800+(mk==="avionp"||mk==="jet"?.3:1.2)+(mk.startsWith("avion")&&mk!=="avionp"&&d.km>7000?3.5:0)+(hub?0:.5);
  const base={avion:180000+d.km*55,avionB:520000+d.km*150,avionp:4e6+d.km*9000,jet:2.5e6+d.km*6500}[mk];
  return{hrs:fly+2,cost:Math.round(base/1000)*1000,mode:mk==="avionB"?"avion":mk}}
function payer(S,motif,mk){const r=rank(S);if(!officiel(S,motif)&&!(r==="dg"&&["eco","formation"].includes(motif)))return"personnel";return r==="pres"?"État":r==="min"?"ministère":r==="dg"?"entreprise":r==="elu"?(S.profil==="maire"?"commune":"personnel"):"personnel"}
function pay(S,who,c){if(window.VOY&&VOY.pay)return VOY.pay(S,{who,cost:c});return true}
function needVisa(S,d,motif){if(d.cemac)return false;if(officiel(S,motif))return false;const v=(S.visas||{})[d.pays];return!(v&&v>S.day)}

/* ---------- préparer un voyage ---------- */
INTL.open=function(pre,o){o=o||{};const S=G.S;if(!S||S.phase!=="play")return;if(S.loc&&S.loc.pays&&!pre)return INTL.askRetour(S,{reg:"CE",v:"Yaoundé"},{});
  const st={d:pre||DEST.find(x=>x.v==="Paris"),motif:motifsFor(S)[0],mk:null,watch:true};
  const draw=el=>{const d=st.d;const Ms=modesFor(S,d,st.motif);if(!st.mk||!Ms.some(m=>m.k===st.mk))st.mk=Ms[0].k;const p=plan(S,d,st.mk);const who=payer(S,st.motif,st.mk);const vis=needVisa(S,d,st.motif);const vreq=(S.visaReq||[]).find(x=>x.pays===d.pays&&!x.ok);
    const here=window.VOY?VOY.here(S):{v:"Yaoundé"};const apt=st.mk==="route"?null:(here.v==="Douala"?"Douala":"Yaoundé");const pre1=apt&&here.v!==apt&&window.VOY?VOY.plan(S,here,{reg:apt==="Douala"?"LT":"CE",v:apt},VOY.defaultMode(S,here,{reg:apt==="Douala"?"LT":"CE",v:apt})):null;
    const tot={hrs:p.hrs+(pre1&&pre1.ok?pre1.hrs+1:0),cost:p.cost+(pre1&&pre1.ok?pre1.cost:0)};
    const zones=[...new Set(DEST.map(x=>x.z))];
    el.querySelector("#inBody").innerHTML=
     '<label class="f" for="inD">Destination<select id="inD">'+zones.map(z=>'<optgroup label="'+esc(z)+'">'+DEST.filter(x=>x.z===z).map(x=>'<option value="'+DEST.indexOf(x)+'"'+(x===d?" selected":"")+'>'+esc(x.v+" ("+x.pays+")")+'</option>').join("")+'</optgroup>').join("")+'</select></label>'+
     '<label class="f" for="inM">Motif du voyage<select id="inM">'+motifsFor(S).map(k=>'<option value="'+k+'"'+(k===st.motif?" selected":"")+'>'+esc(MOTIFS[k])+'</option>').join("")+'</select></label>'+
     '<span class="eyebrow">Moyen de transport</span><div class="choices">'+Ms.map(m=>{const q=plan(S,d,m.k);return'<button class="choice" data-im="'+m.k+'" aria-pressed="'+(m.k===st.mk)+'" style="'+(m.k===st.mk?"border-color:var(--y)":"")+'"><span class="t">'+(m.k==="route"?"🚗 ":"✈️ ")+esc(m.n)+'</span><span class="small muted">'+dur(q.hrs)+" · "+F(q.cost)+'</span></button>'}).join("")+'</div>'+
     '<div class="card" style="gap:4px"><b>'+esc(here.v)+" → "+esc(d.v)+" ("+esc(d.pays)+")"+'</b>'+(pre1&&pre1.ok?'<span class="small">Trajet jusqu\'à l\'aéroport de '+esc(apt)+" : "+dur(pre1.hrs)+" · "+F(pre1.cost)+'</span>':"")+
      '<span class="small">Total : '+dur(tot.hrs)+" · "+F(tot.cost)+" (payé par : "+(who==="personnel"?"vous-même":who)+')</span>'+
      '<span class="small" style="color:'+(vis?"var(--warn,#f0a93a)":"var(--ok,#43c47c)")+'">'+(d.cemac?"Zone CEMAC : pas de visa nécessaire.":officiel(S,st.motif)?"Mission officielle : passeport diplomatique, pas de visa à demander.":vis?(vreq?"Visa en cours d'instruction : prêt le "+G.dayLabel(vreq.ready)+".":"Visa obligatoire pour ce voyage privé."):"Visa valide.")+'</span></div>'+
     (vis&&!vreq?'<button class="btn" id="inVisa">Demander un visa ('+F(VISA[d.z][0])+', délai environ '+VISA[d.z][1]+' jours)</button>':"")+
     '<label class="row small" style="gap:8px"><input type="checkbox" id="inW"'+(st.watch?" checked":"")+'> Regarder la vidéo du voyage</label>'+
     '<div class="row"><button class="btn primary" id="inGo"'+(vis?" disabled":"")+'>Partir</button><button class="btn ghost" id="inNo">Annuler</button></div>';
    el.querySelector("#inD").onchange=e=>{st.d=DEST[+e.target.value];st.mk=null;draw(el)};
    el.querySelector("#inM").onchange=e=>{st.motif=e.target.value;st.mk=null;draw(el)};
    el.querySelectorAll("[data-im]").forEach(b=>b.onclick=()=>{st.mk=b.dataset.im;draw(el)});
    el.querySelector("#inW").onchange=e=>{st.watch=e.target.checked};
    el.querySelector("#inNo").onclick=()=>el.remove();
    const vb=el.querySelector("#inVisa");if(vb)vb.onclick=()=>{const [c,j]=VISA[d.z];if(!pay(S,"personnel",c))return G.toast("Fonds insuffisants pour les frais de visa.");S.visaReq=S.visaReq||[];S.visaReq.push({pays:d.pays,ready:S.day+j,ok:false});
      window.SYS.inbox(S,{from:"Ambassade de "+d.pays,t:"Demande de visa déposée",b:"Frais payés : "+F(c)+". Délai d'instruction : environ "+j+" jours.",k:"info",read:true});G.toast("Demande de visa déposée : réponse dans environ "+j+" jours.");draw(el)};
    el.querySelector("#inGo").onclick=()=>{const who2=payer(S,st.motif,st.mk);if(!pay(S,who2,tot.cost))return G.toast("Fonds insuffisants pour ce voyage.");el.remove();
      depart(S,{d,motif:st.motif,mk:st.mk,p,hrs:tot.hrs,cost:tot.cost,who:who2,from:here},st.watch,o.cb)}};
  G.sheet('<span class="eyebrow">Voyage à l\'étranger</span><h3 class="h2">Où voulez-vous aller ?</h3><div id="inBody"></div>',el=>{el.setAttribute("data-noinstr","");draw(el)})};

/* ---------- départ, vidéo, arrivée ---------- */
function film(S,from,dest,mode,label,onEnd){if(!S3||!S3.ok){onEnd();return}const RA=CM.REG[from.reg]||CM.REG.CE;
  const el=document.createElement("div");el.className="film";el.innerHTML='<div class="fview" id="fview"></div><div class="lb top"></div><div class="lb bot"></div><div class="fhud"><span class="rec" style="color:#fde047">● EN ROUTE</span><span class="src">'+esc(label)+'</span></div>'+
   '<div class="lower"><span class="k">'+esc(from.v)+' → '+esc(dest.v)+'</span><b>'+esc(dest.v+(dest.pays?" ("+dest.pays+")":""))+'</b></div><div class="fbar"><i id="fprog"></i></div><div class="fctl"><button class="btn small primary" id="inSkip">Passer la vidéo et arriver</button></div>';
  document.body.appendChild(el);document.body.classList.add("travel");if(window.VOY){VOY.inTrip=true;VOY.tripTo=dest.v}
  S3.attach($("fview"));if(window.VID&&VID.filmOn)VID.filmOn($("fview"));
  try{S3.travel({mode,local:false,seed:Math.floor(S.day),from:{land:RA.land,pop:2e6,profile:"autre",name:from.v,apt:"Aéroport"},to:{land:dest.land||"ville",pop:2e6,profile:"autre",apt:"Aéroport",name:dest.v},road:null,insec:false,onProgress:q=>{const b=$("fprog");if(b)b.style.width=(q*100).toFixed(1)+"%"},onEnd:()=>setTimeout(close,700)})}catch(e){setTimeout(close,50)}
  function close(){if(!el.parentNode)return;S3.detach();S3.endFilm();if(window.VID&&VID.filmOff)VID.filmOff();el.remove();document.body.classList.remove("travel");if(window.VOY)VOY.inTrip=false;onEnd()}
  $("inSkip").onclick=close}
function depart(S,t,watch,cb){const lab=t.mk==="route"?"Par la route":t.mk==="avionp"?"Avion présidentiel":t.mk==="jet"?"Jet privé":"Vol commercial";
  const arrive=()=>{const d=t.d;const lieu=d.lieu&&["sommet","officiel"].includes(t.motif)?d.lieu:t.motif==="officiel"||t.motif==="eco"?"Ambassade du Cameroun":t.motif==="sante"?"Hôpital":t.motif==="formation"?"Centre de congrès":"Hôtel";
    S.loc={reg:t.from.reg||"CE",v:d.v,pays:d.pays,lieu,abroad:true};S.abroad={since:S.day,pays:d.pays,v:d.v,motif:t.motif,fait:[],d:DEST.indexOf(d)};
    G.advanceDays(t.hrs/24,false);
    window.SYS.inbox(S,{from:"Votre agenda",t:"Arrivé à "+d.v+" ("+d.pays+")",b:lab+" · "+dur(t.hrs)+" · "+F(t.cost)+(t.who!=="personnel"?" (payé par : "+t.who+")":"")+". Motif : "+MOTIFS[t.motif]+".",k:"info",read:true});
    if(S.mode==="pres"&&t.motif!=="prive")window.SYS.cause(S,"CE","Le président en déplacement à "+d.v,t.motif==="sommet"?.5:-.3,"voyage");
    G.toast("Arrivé à "+d.v+" ("+d.pays+")");G.render();setTimeout(()=>INTL.sheet(S),600);if(cb)cb()};
  if(watch)film(S,t.from,t.d,t.mk==="route"?"voiture":t.p.mode,lab,arrive);else arrive()}

/* ---------- sur place ---------- */
INTL.sheet=function(S){const a=S.abroad;if(!a||!S.loc||!S.loc.pays)return;const d=DEST[a.d]||{};const r=rank(S);const days=Math.max(0,Math.round(S.day-a.since));
  const acts=[["amb","🏳️ Rencontrer l'ambassadeur du Cameroun"],
   ...(r==="pres"||r==="min"||r==="elu"?[["off","🤝 Rencontrer des officiels "+(d.pays?"("+d.pays+")":"")],["dias","👥 Rencontrer la diaspora camerounaise"]]:[["dias","👥 Rencontrer la diaspora camerounaise"]]),
   ...(r==="pres"||r==="min"||r==="dg"?[["inv","💼 Rencontrer des investisseurs"]]:[]),
   ...(d.lieu&&/Union africaine|Nations|européenne/.test(d.lieu)?[["conf","🎙️ Participer aux travaux ("+d.lieu+")"]]:[]),
   ...(r==="pro"||a.motif==="formation"?[["form","🎓 Suivre la formation ou le congrès"]]:[]),
   ["visite","📷 Visiter la ville"]].filter(([k])=>!a.fait.includes(k));
  G.sheet('<span class="eyebrow">À l\'étranger · '+esc(a.v)+' ('+esc(a.pays)+')</span><h3 class="h2">Que voulez-vous faire ?</h3><p class="small muted">Sur place depuis '+(days?days+" jour"+(days>1?"s":""):"aujourd'hui")+' · motif : '+esc(MOTIFS[a.motif])+'. Vous pouvez aussi travailler à distance (courrier, assistant, appels).</p>'+
   '<div class="choices">'+acts.map(([k,l])=>'<button class="choice" data-ia="'+k+'"><span class="t">'+esc(l)+'</span></button>').join("")+'<button class="choice" data-ia="retour"><span class="t">🛬 Rentrer au Cameroun</span></button></div>',el=>{
    el.querySelectorAll("[data-ia]").forEach(b=>b.onclick=()=>{const k=b.dataset.ia;el.remove();act(S,k)})})};
function act(S,k){const a=S.abroad;const d=DEST[a.d]||{};const st=S.st||{};let msg="";
  if(k==="retour")return INTL.askRetour(S,{reg:"CE",v:"Yaoundé"},{});
  a.fait.push(k);
  if(k==="amb"){if(window.RENC)return RENC.open(S,{kind:"officiel",n:window.SYS.nom("CE"),lab:"ambassadeur du Cameroun en "+a.pays,reg:"CE",ville:a.v,lieu:"l'ambassade du Cameroun",sujet:"point sur les relations avec "+a.pays,bonjour:"Bienvenue à "+a.v+". L'ambassade est à votre disposition."});msg="Entretien avec l'ambassadeur."}
  else if(k==="off"){if(st.int!=null)st.int=clamp(st.int+2,0,100);msg="Entretiens bilatéraux avec les autorités "+(a.pays?"de "+a.pays:"")+" : communiqué commun sur la coopération.";if(window.RENC)setTimeout(()=>RENC.open(S,{kind:"officiel",n:window.SYS.nom("CE"),lab:"représentant du gouvernement ("+a.pays+")",reg:"CE",ville:a.v,lieu:"le ministère des Affaires étrangères",sujet:"coopération bilatérale",bonjour:"Welcome, soyez le bienvenu. Parlons de notre coopération."}),600)}
  else if(k==="dias"){if(st.pop!=null)st.pop=clamp(st.pop+1,0,100);if(S.opp)S.opp.noto=clamp(S.opp.noto+2,0,100);msg="Rencontre chaleureuse avec la diaspora ; ses attentes : visas, investissement au pays, sécurité dans le NOSO.";if(window.RENC)setTimeout(()=>RENC.open(S,{kind:"habitant",lab:"membre de la diaspora camerounaise",reg:"CE",ville:a.v,lieu:"la salle de la communauté",sujet:"la diaspora et le pays"}),600)}
  else if(k==="inv"){const ok=Math.random()<.45+(st.eco||50)/300;if(ok){const md=Math.round(G.rnd(20,250));if(st.eco!=null)st.eco=clamp(st.eco+1.5,0,100);msg="Protocole d'accord signé : projet d'investissement de "+md+" milliards de FCFA au Cameroun.";window.SYS.inbox(S,{from:"Mission économique",t:"Protocole d'accord signé à "+a.v,b:msg+" Sa concrétisation dépendra du climat des affaires.",k:"rapport"})}else msg="Les investisseurs restent prudents : ils demandent plus de garanties juridiques et fiscales."}
  else if(k==="conf"){if(st.int!=null)st.int=clamp(st.int+1.5,0,100);msg="Votre intervention aux travaux ("+d.lieu+") est remarquée ; le Cameroun obtient le soutien de plusieurs délégations."}
  else if(k==="form"){if(S.pro)S.pro.rep=clamp(S.pro.rep+3,0,100),S.pro.xp=(S.pro.xp||0)+2;if(S.ent)S.ent.rep=clamp((S.ent.rep||50)+2,0,100);msg="Formation suivie : vos compétences et votre réputation progressent."}
  else if(k==="visite"){msg="Vous visitez "+a.v+"."}
  G.advanceDays(.25,false);if(msg){say(msg);G.toast(msg.slice(0,110));window.SYS.inbox(S,{from:"Carnet de voyage",t:a.v+" : "+msg.slice(0,60),b:msg,k:"info",read:true})}
  if(k!=="amb"&&k!=="off"&&k!=="dias")setTimeout(()=>INTL.sheet(S),700)}

/* ---------- retour au pays (puis, si besoin, trajet intérieur) ---------- */
INTL.askRetour=function(S,to,o){o=o||{};const a=S.abroad;const d=a?DEST[a.d]:null;if(!d){if(S.loc)delete S.loc.pays;return}
  const st={mk:null,apt:to&&to.v==="Douala"?"Douala":"Yaoundé",watch:true};
  const draw=el=>{const Ms=modesFor(S,d,a.motif);if(!st.mk||!Ms.some(m=>m.k===st.mk))st.mk=Ms[0].k;const p=plan(S,d,st.mk);const who=payer(S,a.motif,st.mk);
    el.querySelector("#irBody").innerHTML='<p class="small">Vous êtes à '+esc(d.v)+' ('+esc(d.pays)+').'+(to&&to.v!==st.apt&&st.mk!=="route"?" Destination finale : "+esc(to.v)+" (trajet intérieur ensuite).":"")+'</p>'+
     (st.mk!=="route"?'<label class="f" for="irA">Aéroport d\'arrivée<select id="irA"><option'+(st.apt==="Yaoundé"?" selected":"")+'>Yaoundé</option><option'+(st.apt==="Douala"?" selected":"")+'>Douala</option></select></label>':"")+
     '<div class="choices">'+Ms.map(m=>{const q=plan(S,d,m.k);return'<button class="choice" data-rm="'+m.k+'" style="'+(m.k===st.mk?"border-color:var(--y)":"")+'"><span class="t">'+(m.k==="route"?"🚗 ":"✈️ ")+esc(m.n)+'</span><span class="small muted">'+dur(q.hrs)+" · "+F(q.cost)+'</span></button>'}).join("")+'</div>'+
     '<div class="card"><span class="small">Retour : '+dur(p.hrs)+" · "+F(p.cost)+" (payé par : "+(who==="personnel"?"vous-même":who)+')</span></div><label class="row small" style="gap:8px"><input type="checkbox" id="irW"'+(st.watch?" checked":"")+'> Regarder la vidéo du voyage</label><div class="row"><button class="btn primary" id="irGo">Rentrer</button><button class="btn ghost" id="irNo">Rester</button></div>';
    const sa=el.querySelector("#irA");if(sa)sa.onchange=e=>{st.apt=e.target.value;draw(el)};
    el.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{st.mk=b.dataset.rm;draw(el)});el.querySelector("#irW").onchange=e=>{st.watch=e.target.checked};
    el.querySelector("#irNo").onclick=()=>{el.remove();if(o.cancel)o.cancel()};
    el.querySelector("#irGo").onclick=()=>{if(!pay(S,who,p.cost))return G.toast("Fonds insuffisants pour le retour.");el.remove();
      const land=st.mk==="route"?(d.route||"Yaoundé"):st.apt;const c=window.VOY?VOY.city(land):null;const dest={reg:c?c.reg:"CE",v:land};
      const done=()=>{const days=Math.round(S.day-a.since);S.loc={reg:dest.reg,v:dest.v,lieu:null};S.abroad=null;G.advanceDays(p.hrs/24,false);window.SYS.inbox(S,{from:"Votre agenda",t:"De retour au Cameroun ("+dest.v+")",b:"Retour de "+d.v+" après "+Math.max(1,days)+" jour"+(days>1?"s":"")+" à l'étranger. "+dur(p.hrs)+" · "+F(p.cost)+".",k:"info",read:true});G.toast("De retour au Cameroun : "+dest.v);G.render();
        if(to&&to.v&&to.v!==dest.v&&window.VOY)setTimeout(()=>VOY.ask(S,to,o),700);else if(o.cb)o.cb()};
      if(st.watch)film(S,{reg:"CE",v:d.v},{v:dest.v,land:CM.REG[dest.reg].land},st.mk==="route"?"voiture":p.mode,"Retour au pays",done);else done()}};
  G.sheet('<span class="eyebrow">Retour</span><h3 class="h2">Rentrer au Cameroun</h3><div id="irBody"></div>',el=>{el.setAttribute("data-noinstr","");draw(el)})};

/* ---------- chaque jour : visas prêts, effets de l'absence ---------- */
INTL.tick=function(S){if(!S)return;for(const v of S.visaReq||[])if(!v.ok&&S.day>=v.ready){v.ok=true;S.visas=S.visas||{};S.visas[v.pays]=S.day+180;window.SYS.inbox(S,{from:"Ambassade de "+v.pays,t:"Visa accordé",b:"Votre visa pour "+v.pays+" est prêt, valable six mois.",k:"info"})}
  const a=S.abroad;if(!a)return;const days=S.day-a.since;
  if(S.mode==="pres"&&days>7&&!a.warn){a.warn=1;window.SYS.inbox(S,{from:"Revue de presse",t:"Polémique : le président à l'étranger depuis une semaine",b:"L'opposition dénonce un pouvoir « gouverné à distance » ; les réseaux sociaux s'interrogent sur votre retour.",k:"alerte"})}
  if(S.mode==="pres"&&days>7&&S.st)S.st.pop=clamp(S.st.pop-.05,0,100);if(S.mode==="min"&&days>10&&S.minis)S.minis.perf=clamp(S.minis.perf-.05,0,100)};
})();
