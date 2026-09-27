/* Chemin d'Etoudi — ce que sait l'assistant : prix réels (carburant, gaz, SMIG…), effectifs et salaires des
   « hommes en tenue », coûts unitaires des ouvrages publics (forages, salles de classe, routes, centres de santé…)
   pour chiffrer une idée avant d'en faire une directive, et prestataires connus par secteur.
   Chiffres : repères publics 2024-2026 ou estimations du jeu, toujours présentés comme des ordres de grandeur. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const SAV={};window.SAV=SAV;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const f0=n=>Math.round(n).toLocaleString("fr-FR").replace(/ | /g," ");
const fM=m=>m>=1000?(Math.round(m/100)/10).toString().replace(".",",")+" milliard"+(m>=2000?"s":"")+" de FCFA":f0(m)+" millions de FCFA";
const fF=v=>v>=1e9?fM(v/1e6):v>=1e6?(Math.round(v/1e5)/10).toString().replace(".",",")+" million"+(v>=2e6?"s":"")+" de FCFA":f0(v)+" FCFA";

/* ---------- prix (repères) ---------- */
const PRIX=[
 [/super|essence(?! et)|sans plomb/,"Le litre de super (essence) est à 840 FCFA à la pompe (prix homologué depuis février 2024)."],
 [/gasoil|gazole|gazoil/,"Le litre de gasoil est à 828 FCFA à la pompe (prix homologué depuis février 2024)."],
 [/petrole lampant|petrole/,"Le litre de pétrole lampant est à 350 FCFA."],
 [/gaz (domestique|butane)|bouteille de gaz/,"La bouteille de gaz domestique de 12,5 kg est à 6 500 FCFA environ."],
 [/smig|salaire minimum/,()=>"Le salaire minimum est de "+f0(E.SALAIRES.smigPrive)+" FCFA par mois dans le privé, "+f0(E.SALAIRES.smigAgricole)+" FCFA dans l'agriculture et "+f0(E.SALAIRES.smigEtat)+" FCFA pour les agents de l'État les moins payés."],
 [/ciment/,"Le sac de ciment de 50 kg se vend entre 5 000 et 6 500 FCFA selon les régions (plus cher à l'Est et dans le Grand Nord)."],
 [/riz/,"Le sac de riz de 50 kg coûte entre 18 000 et 25 000 FCFA selon la qualité et la ville."],
 [/kwh|electricite (coute|prix)|prix de l electricite/,"Le kWh domestique est facturé environ 50 à 80 FCFA par ENEO, selon la tranche de consommation."]];
function prix(t){if(!/(prix|cout|coute|combien|tarif)/.test(t))return null;const L=[];
  if(/essence|super|carburant|pompe/.test(t))L.push(PRIX[0][1]);if(/gasoil|gazole|gazoil|carburant/.test(t))L.push(PRIX[1][1]);if(/petrole/.test(t))L.push(PRIX[2][1]);
  if(!L.length)for(const [re,x] of PRIX.slice(3))if(re.test(t))L.push(typeof x==="function"?x():x);
  if(!L.length)return null;if(/carburant|essence|gasoil|gazoil|petrole/.test(t))L.push("Ces prix sont fixés par l'État, qui compense une partie de l'écart avec le prix réel (subvention).");return L.join(" ")}

/* ---------- effectifs et salaires des hommes en tenue (estimations du jeu) ---------- */
function forces(S){const rec=(S&&S.gov&&S.gov.recrues)||{};const def=E.DEFENSE.effectifs+(rec.sol||0);
  return[{id:"def",n:"Forces de défense (armée de terre, marine, armée de l'air, gendarmerie, dont BIR)",eff:def,sal:185000,re:/armee|militaire|soldat|defense|bir\b|gendarme/},
   {id:"pol",n:"Police (Sûreté nationale)",eff:30000+(rec.pol||0),sal:165000,re:/police|policier/},
   {id:"dou",n:"Douane",eff:4500,sal:210000,re:/douan/},
   {id:"pen",n:"Administration pénitentiaire",eff:5500,sal:150000,re:/penitentiaire|gardien de prison/},
   {id:"eff",n:"Eaux et forêts (agents en tenue)",eff:2500,sal:150000,re:/eaux et forets|forestier/}]}
function effectifs(S,t){if(!/(combien|nombre|effectif|combien y a)/.test(t))return null;const F=forces(S);
  if(/hommes en tenue|forces de (l ordre|securite)/.test(t)){const tot=F.reduce((a,x)=>a+x.eff,0);return"Environ "+f0(tot)+" hommes et femmes en tenue (estimation) : "+F.map(x=>x.n.split(" (")[0].toLowerCase()+" "+f0(x.eff)).join(", ")+"."}
  const x=F.find(f=>f.re.test(t));if(!x)return null;return"Environ "+f0(x.eff)+" personnels : "+x.n+" (ordre de grandeur, estimation du jeu)."+(x.id==="pol"?" À comparer aux normes internationales : environ 1 policier pour 1 000 habitants au Cameroun, pour 30 millions d'habitants.":x.id==="def"?" Dont environ "+f0(E.DEFENSE.bir)+" au Bataillon d'intervention rapide (BIR).":"")}
function salaires(S,t){if(!/(salaire|solde|revalor|augment|hausse|prime)/.test(t)||!/(armee|militaire|soldat|tenue|police|policier|gendarme|douan|penitentiaire|forces)/.test(t))return null;
  const F=forces(S);let L=/hommes en tenue|forces de (l ordre|securite)/.test(t)?F:F.filter(f=>f.re.test(t));if(!L.length)L=[F[0]];
  const m=t.match(/(\d+(?:[.,]\d+)?)\s*(%|pour ?cent)/);const p=m?parseFloat(m[1].replace(",","."))/100:null;
  const army=/armee|militaire|soldat|defense/.test(t);const main=army?F[0]:L[0];const RG={def:"de 95 000 FCFA pour un soldat de 2e classe à plus de 600 000 FCFA pour un officier supérieur",pol:"de 110 000 FCFA pour un gardien de la paix à plus de 500 000 FCFA pour un commissaire divisionnaire",dou:"de 130 000 à plus de 550 000 FCFA",pen:"de 100 000 à 400 000 FCFA",eff:"de 100 000 à 400 000 FCFA"};
  const one=x=>{const mass=x.eff*x.sal;return x.n+" : "+f0(x.eff)+" personnels, salaire moyen d'environ "+f0(x.sal)+" FCFA par mois ("+RG[x.id]+"), masse salariale d'environ "+fF(mass)+" par mois"+(p?". Avec +"+Math.round(p*100)+" %, le salaire moyen passe à "+f0(x.sal*(1+p))+" FCFA (+"+f0(x.sal*p)+" FCFA par personne et par mois) ; la masse salariale augmente de "+fF(mass*p)+" par mois, soit "+fF(mass*p*12)+" par an":"")};
  let r=one(main)+".";if(L.length>1&&p){const others=L.filter(x=>x!==main);r+=" Pour l'ensemble des hommes en tenue ("+f0(L.reduce((a,x)=>a+x.eff,0))+" personnels, avec "+others.map(x=>x.n.split(" (")[0].toLowerCase()).join(", ")+"), la hausse représente "+fF(L.reduce((a,x)=>a+x.eff*x.sal*p,0))+" par mois."}if(p){const tot=L.reduce((a,x)=>a+x.eff*x.sal*p*12,0);r+=" Coût total supplémentaire : environ "+fF(tot)+" par an, soit "+(Math.round(tot/1e9/CM.NUMS.budget*1000)/10).toString().replace(".",",")+" % du budget de l'État. Une telle mesure a un impact national : dites « fais-en une directive » pour que le ministère des Finances la chiffre précisément et vous la soumette pour validation avant exécution.";
    SAV.last={text:"une revalorisation de "+Math.round(p*100)+" % du salaire des "+(L.length>1?"hommes en tenue":L[0].n.split(" (")[0].toLowerCase()),cout:Math.round(tot/1e9),nat:true}}
  return r}

/* ---------- coûts unitaires des ouvrages (millions de FCFA, fourchette basse-haute) ---------- */
const UNIT=[
 [/forages?.{0,30}solaire|forages? a (pompe|alimentation) solaire|solaire.{0,20}forages?/,"forage équipé d'une pompe solaire (forage de 60 à 100 m, panneaux, réservoir, bornes-fontaines)",[18,30],"forage"],
 [/forages?/,"forage équipé d'une pompe manuelle (60 à 80 m de profondeur)",[8,14],"forage"],
 [/puits/,"puits moderne busé",[4,7],"puits"],
 [/chateau d eau|adduction/,"mini-adduction d'eau (forage, château d'eau, réseau de 5 km)",[60,120],"adduction"],
 [/salles? de classe/,"salle de classe équipée de tables-bancs",[16,22],"salle de classe"],
 [/ecoles?/,"école primaire de 6 salles de classe, latrines et forage",[120,160],"école"],
 [/lycees?|colleges?/,"collège ou lycée (12 salles, laboratoire, bloc administratif)",[450,700],"établissement"],
 [/centres? de sante/,"centre de santé intégré (bâtiment, maternité, équipements de base)",[150,250],"centre de santé"],
 [/hopitaux|hopital/,"hôpital de district (80 lits, bloc opératoire, équipements)",[3500,5500],"hôpital"],
 [/km|kilometres?/,null,null,"km"],
 [/ponts?/,"pont en béton sur une rivière moyenne (30 à 60 m)",[600,1500],"pont"],
 [/logements? sociaux|logements?/,"logement social (F3)",[25,35],"logement"],
 [/lampadaires?/,"lampadaire solaire",[1.1,1.8],"lampadaire"],
 [/latrines?/,"bloc de latrines scolaires",[2.5,4],"bloc de latrines"],
 [/tables? bancs?/,"table-banc",[.04,.055],"table-banc"],
 [/ambulances?/,"ambulance médicalisée",[40,60],"ambulance"],
 [/marches?|hangars?/,"marché périodique moderne (hangars, boutiques, latrines)",[200,400],"marché"],
 [/kits? solaires?/,"kit solaire domestique",[.2,.35],"kit"],
 [/centrales? solaires?|mw\b|megawatts?/,"MW de centrale solaire raccordée",[800,1100],"MW"],
 [/abris|tentes?|camp/,"abri familial pour personnes réfugiées ou déplacées",[.8,1.5],"abri"]];
const SUR={ES:.12,EN:.15,NO:.1,AD:.08,NW:.2,SW:.18,SU:.05};
function region(t){if(/\b(l est|region de l est|a l est|dans l est)\b/.test(t))return"ES";for(const r of CM.REGIONS){const n=norm(r.n);if(n!=="est"&&t.includes(n))return r.id}
  if(window.VOY)for(const c of VOY.CITIES)if(t.includes(norm(c.n)))return c.reg;return null}
function couts(S,t,raw){if(!/(combien|cout|coute|couter|prix|budget|estim|chiffr)/.test(t))return null;
  const qm=t.match(/(\d[\d\s.]*)\s*(?:de\s+|d\s+)?(forages?|puits|salles?|ecoles?|lycees?|colleges?|centres?|hopitaux|hopital|km|kilometres?|ponts?|logements?|lampadaires?|latrines?|tables?|ambulances?|marches?|hangars?|kits?|centrales?|mw|megawatts?|abris|tentes?|chateaux?)/);
  let U=null;for(const u of UNIT)if(u[0].test(t)){U=u;break}if(!U)return null;const n=qm?parseInt(qm[1].replace(/[\s.]/g,""),10):1;
  let lab=U[1],rg=U[2];if(U[3]==="km"){const bit=/bitum|goudron/.test(t),reh=/rehabilit|refection|entretien/.test(t),piste=/piste/.test(t);lab=piste?"km de piste rurale en terre":reh?"km de route réhabilitée":"km de route bitumée neuve";rg=piste?[18,35]:reh?[150,300]:[350,600]}
  const reg=region(t);const sur=reg?(SUR[reg]||0):0;const lo=rg[0]*n*(1+sur),hi=rg[1]*n*(1+sur),mid=(lo+hi)/2;
  let r="Estimation : "+f0(n)+" × "+lab+", à "+fM((rg[0]+rg[1])/2)+" l'unité en moyenne (entre "+fM(rg[0])+" et "+fM(rg[1])+")"+(sur?", plus "+Math.round(sur*100)+" % de surcoût dans la région "+CM.REG[reg].n+" (transport, accès, sécurité)":"")+". Total : environ "+fM(mid)+" (entre "+fM(lo)+" et "+fM(hi)+"), études et contrôle des travaux compris.";
  if(/refugi|deplace/.test(t))r+=" Pour les sites de réfugiés, prévoir aussi l'entretien (comités de gestion de l'eau) et un appui du HCR, qui cofinance souvent ces ouvrages.";
  r+=" Voulez-vous en faire une directive ? Dites « fais-en une directive »"+(mid>5000?" : vu le montant, le plan d'exécution vous sera soumis pour validation avant exécution.":".");
  const what=raw.replace(/^(pour [^,]*?,?\s*)?(combien (ca|cela|ça)? ?(doit|va|vont|devrait)? ?(couter|coute|coûter|coûte)( de)?|quel (est le )?(cout|coût|budget)( de| pour)?)\s*/i,"").replace(/\?+$/,"").trim();
  SAV.last={text:(what.length>8?what:"réaliser "+f0(n)+" "+lab),cout:Math.round(mid/100)/10,reg,nat:!reg};return r}

/* ---------- prestataires ---------- */
function prestataire(S,t){if(!/(prestataire|fournisseur|entreprise|societe|sous traitant|installateur|cabinet)/.test(t))return null;
  const map=[["video","video|camera|surveillance"],["solaire","solaire|panneau"],["btp","btp|construction|batiment|route|genie civil"],["numerique","informatique|numerique|logiciel|reseau"],["gardiennage","gardiennage|vigile|securite privee"],["sante","medical|clinique|medicament"],["transport","transport|logistique|camion"],["eau","forage|eau|assainissement"],["conseil","etude|bureau d etudes|conseil"],["com","communication|evenement"],["formation","formation"],["import","import|fourniture"],["hotel","hotel|restauration"],["agro","agro|agricole"]];
  const m=map.find(([k,re])=>new RegExp(re).test(t));if(!m)return null;const X=E.SECTEURS[m[0]];if(!X)return null;const local=/local|camerounais|du pays|national/.test(t);
  const L=X.ai.filter(a=>!local||!/(Chine|France|Dubaï|Turquie|Inde|Maroc|Nigeria|Afrique du Sud|États-Unis)/.test(a[1]));
  const sv=(X.services||[]).slice(0,3).map(s=>s[0]+" : environ "+fM(s[1])).join(" ; ");
  return"Prestataires "+(local?"camerounais ":"")+"connus en "+X.n.toLowerCase()+" : "+L.map(a=>a[0]+" ("+a[1]+", note "+a[2]+"/100)").join(", ")+"."+(sv?" Prix indicatifs : "+sv+".":"")+
   (S&&(S.mode==="pres"||S.mode==="min")?" Pour un marché public, la règle est l'appel d'offres (Code des marchés publics, ministère des Marchés publics) ; dites par exemple « je veux un appel d'offres pour la vidéosurveillance de Yaoundé » pour en faire une directive.":"")}

/* ---------- entrée ---------- */
SAV.handle=function(S,raw,reply){const t=norm(raw);let r=null;
  if(window.NOTE&&NOTE.matches(raw)&&!/^(combien|quel|quelle)/.test(t))return false;
  if(SAV.last&&/^(oui|d accord|ok|vas y|allez y)?\s*,?\s*(fais|faites|fait|transforme|transformez)[- ]?(en|le|la|moi)? ?(une )?directive|^(oui|ok|d accord),? (lance|lancez|valide)/.test(t)&&window.DIR){const L=SAV.last;SAV.last=null;DIR.handle(S,"Je veux "+L.text.replace(/^je veux /i,""),reply,{force:true,cout:L.cout,nat:L.nat});return true}
  r=salaires(S,t)||effectifs(S,t)||prix(t)||couts(S,t,raw)||prestataire(S,t);
  if(r){reply(r);return true}return false};
SAV.region=region;
SAV.fuel={super:840,gasoil:828,petrole:350};
})();
