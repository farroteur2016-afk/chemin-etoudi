/* Chemin d'Etoudi — les dossiers : chaque profil a un portefeuille de dossiers réels (président, ministre, maire, député,
   opposant, chef d'entreprise selon son secteur, professionnel selon son métier), et chaque interlocuteur (ministre,
   directeur général, directeur d'hôpital, préfet…) connaît les dossiers de son portefeuille : montants, causes de blocage,
   ce qu'il demande. Le joueur peut agir sur chaque dossier (directive, note, appel, rencontre, relance, action propre au
   dossier) ; les résultats arrivent quelques jours plus tard. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const DOSS={};window.DOSS=DOSS;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
const R=(a,b)=>[a,b];/* fourchette : tirée une fois par partie (graine) */
const RN=(a,b)=>a+Math.random()*(b-a);
const pk=a=>a[Math.floor(Math.random()*a.length)];
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function seeded(seed){let x=seed||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%10000)/10000}}
const fmtMd=v=>v>=1?(Math.round(v*10)/10).toString().replace(".",",")+" milliard"+(v>=2?"s":"")+" de FCFA":Math.round(v*1000)+" millions de FCFA";
const fmtM=v=>v>=1000?(Math.round(v/100)/10).toString().replace(".",",")+" milliard"+(v>=2000?"s":"")+" de FCFA":Math.round(v)+" millions de FCFA";

/* ---------- portefeuilles des ministères ----------
   [titre, détail, cause du blocage, ce qui est demandé, montant (milliards), mots-clés, urgence 1-3] */
const MIN={
 MINFI:[["Décaissements en attente au Trésor","{n} dossiers de paiement de ministères sectoriels sont bloqués au Trésor (routes, hôpitaux, bourses).","trésorerie tendue : les recettes pétrolières sont en baisse et les échéances de la dette extérieure tombent ce mois-ci","un arbitrage sur l'ordre de priorité des paiements",R(60,140),"decaiss|tresor|paiement|payer",3],
  ["Programme avec le FMI (FEC/MEDC)","La revue du programme avec le FMI a lieu dans six semaines ; deux critères de performance sont menacés.","les arriérés intérieurs et les dépenses hors chaîne dépassent les plafonds","l'accord pour geler les dépenses non prioritaires",R(0,0),"fmi|programme|revue|bailleur",2],
  ["Dette intérieure et arriérés aux entreprises","Les entreprises (BTP en tête) réclament des factures impayées.","les engagements ont dépassé les crédits disponibles depuis deux exercices","un plan d'apurement sur 18 mois, avec titrisation d'une partie",R(250,500),"dette|arriere|impaye|entreprise|btp",3],
  ["Recouvrement des recettes douanières et fiscales","Les recettes sont en retard sur les prévisions de la loi de finances.","fraude aux frontières, exonérations accordées sans contrôle","l'autorisation de supprimer des exonérations et de renforcer les contrôles",R(80,160),"recette|impot|douane|fiscal|exoneration",2],
  ["Réduction du train de vie de l'État","Missions à l'étranger, parc automobile, carburant, comités et réceptions pèsent près de 400 milliards par an.","habitudes installées et résistances des administrations","des plafonds par ministère et un contrôle mensuel du ministère des Finances",R(0,0),"train de vie|depenses de fonctionnement|missions|vehicules|economies|rationaliser",2],
  ["Préparation de la loi de finances","Les conférences budgétaires commencent ; tous les ministères demandent plus.","enveloppe contrainte par le service de la dette","vos arbitrages sur les priorités (sécurité, santé, éducation, routes)",R(0,0),"loi de finances|budget|arbitrage|conference",2]],
 MINTP:[["Route {axe}","Le chantier de la route {axe} est à {p} % d'avancement ; l'entreprise menace d'arrêter.","décomptes impayés depuis {mois} mois au Trésor","le décaissement de {m} par le ministère des Finances",R(8,35),"route|axe|bitum|chantier|troncon",3],
  ["Ponts et ouvrages dégradés en saison des pluies","Plusieurs ponts de la région {reg} sont coupés ou menacés d'effondrement.","entretien routier sous-financé depuis des années","une enveloppe d'urgence du Fonds routier",R(3,12),"pont|ouvrage|effondr|pluie|coupe",3],
  ["Entretien routier (Fonds routier)","Les PME de cantonnage n'ont pas été payées ; les pistes se dégradent.","le Fonds routier n'a reçu qu'une partie de ses ressources","la libération de la tranche du Fonds routier",R(10,30),"entretien|fonds routier|piste|cantonnage",2],
  ["Contentieux avec une entreprise étrangère","Une entreprise chinoise réclame des pénalités de retard de paiement.","retards cumulés de paiement de l'État","l'accord pour une transaction amiable plutôt qu'un arbitrage international",R(4,15),"contentieux|chinois|penalite|arbitrage",2]],
 MINSANTE:[["Rupture de médicaments et d'intrants","Plusieurs hôpitaux régionaux sont en rupture (antipaludiques, insuline, réactifs).","la CENAME attend le paiement de ses factures pour importer","un décaissement d'urgence pour la CENAME",R(3,9),"medicament|rupture|cename|intrant|stock",3],
  ["Couverture santé universelle (CSU)","La phase pilote de la CSU prend du retard dans les régions.","financement non mobilisé et formations sanitaires non agréées","l'inscription des crédits CSU et un calendrier",R(20,45),"csu|couverture|assurance|mutuelle",2],
  ["Épidémie de choléra dans la région {reg}","{n} cas signalés, {k} décès ; les centres de traitement manquent de moyens.","eau insalubre et assainissement défaillant après les pluies","la mobilisation d'équipes et d'intrants, avec l'appui du ministère de l'Eau",R(.8,3),"cholera|epidemie|cas|deces|sanitaire",3],
  ["Primes et recrutement des personnels de santé","Les infirmiers menacent d'une grève pour les primes impayées.","arriérés de primes de garde et gel des recrutements","le paiement des primes et 1 500 recrutements",R(5,14),"prime|greve|infirmier|personnel|recrut",2],
  ["Plateau technique des hôpitaux régionaux","Scanners et appareils de radiologie en panne à {ville}.","maintenance non budgétisée","un contrat de maintenance et du matériel neuf",R(2,6),"scanner|equipement|plateau|panne|materiel",1]],
 MINESUP:[["Primes de recherche et vacations impayées","Les enseignants du supérieur réclament la prime de recherche et les vacations.","crédits non débloqués par les Finances","le décaissement de {m}",R(4,10),"prime|vacation|synes|greve|enseignant",3],
  ["Bourses d'excellence et aide aux étudiants","Les étudiants attendent les bourses depuis la rentrée.","liste validée mais fonds non libérés","le paiement avant la fin du mois pour éviter des manifestations",R(2,5),"bourse|etudiant|aide",2],
  ["Amphithéâtres et résidences universitaires","Les universités de {ville} sont saturées ; des chantiers sont à l'arrêt.","décomptes impayés et marchés mal exécutés","la reprise des travaux et un audit des marchés",R(6,18),"amphi|residence|chantier|universite|campus",2]],
 MINESEC:[["Enseignants vacataires et intégration","Des milliers d'enseignants attendent leur intégration et leurs rappels.","dossiers bloqués entre la Fonction publique et les Finances","un calendrier de paiement des rappels",R(15,40),"vacataire|integration|rappel|enseignant|greve",3],
  ["Tables-bancs et salles de classe","Les lycées de la région {reg} manquent de tables-bancs et de salles.","paquet minimum en retard","la livraison de tables-bancs avant les examens",R(3,8),"table|banc|salle|classe|lycee",2],
  ["Organisation des examens officiels","L'Office du Bac signale des risques de fuites et des centres sans électricité.","sécurisation insuffisante des épreuves","des moyens de sécurisation et de transport des épreuves",R(1,3),"examen|bac|probatoire|fuite|office",2]],
 MINEDUB:[["Paquet minimum des écoles","Les écoles primaires n'ont pas reçu craies, cahiers et registres.","fonds transférés en retard aux communes","le transfert immédiat aux communes",R(2,6),"paquet minimum|ecole|primaire|craie",2],
  ["Instituteurs non payés dans les zones de crise","Des enseignants du NOSO et de l'Extrême-Nord ne perçoivent plus leur salaire.","dossiers perdus ou non transférés","une mission spéciale de régularisation",R(2,5),"instituteur|salaire|noso|crise",3]],
 MINDEF:[["Opérations dans l'Extrême-Nord","Recrudescence des attaques de Boko Haram autour de {ville}.","effectifs étirés et moyens aériens limités","des renforts et du carburant pour les opérations",R(15,40),"boko|extreme nord|attaque|operation|terror",3],
  ["Crise anglophone (NOSO)","Enlèvements et engins explosifs sur les axes du Nord-Ouest.","groupes armés mobiles, population prise en étau","la sécurisation des axes et un appui au désarmement (DDR)",R(20,50),"noso|anglophone|ambazonie|separatist|bamenda|nord ouest",3],
  ["Équipement et entretien du matériel","Une partie des blindés et hélicoptères est immobilisée faute de pièces.","contrats de maintenance non payés","le paiement des fournisseurs de pièces",R(8,25),"equipement|materiel|helicoptere|blinde|maintenance",2],
  ["Primes des militaires en opération","Des primes d'opération sont en retard.","trésorerie tendue","le paiement prioritaire des primes",R(4,10),"prime|soldat|militaire|moral",2]],
 MINEE:[["Délestages à Douala et Yaoundé","Délestages de 6 à 8 heures par jour dans plusieurs quartiers.","déficit de production (étiage) et réseau vétuste","un plan d'urgence avec ENEO et des groupes thermiques",R(20,60),"delestage|electricite|eneo|coupure|courant",3],
  ["Dette de l'État envers ENEO et les producteurs","Les producteurs indépendants menacent de réduire leur production.","l'État doit des arriérés d'électricité (bâtiments publics, compensation tarifaire)","un apurement des arriérés",R(80,200),"dette|eneo|arriere|producteur|kpep|globeleq",2],
  ["Barrage de Nachtigal et lignes de transport","Le barrage produit mais la ligne de transport n'évacue pas tout.","retard de la ligne haute tension de la SONATREL","des financements pour la ligne",R(30,90),"nachtigal|barrage|sonatrel|ligne|transport",2],
  ["Eau potable (CAMWATER)","Quartiers sans eau depuis des semaines à {ville}.","pannes de pompes et extension du réseau en retard","des pompes et des forages d'urgence",R(3,12),"eau|camwater|forage|pompe|robinet",2]],
 MINCOMMERCE:[["Prix des produits de première nécessité","Hausse des prix du riz, de l'huile et du ciment.","coûts du fret et spéculation de certains importateurs","l'homologation des prix et des contrôles",R(0,0),"prix|vie chere|riz|huile|ciment|homolog",3],
  ["Carburant à la pompe et stocks","Des stations sont à sec dans la région {reg}.","retard d'approvisionnement de la SONARA / dépôts","la reconstitution des stocks et la lutte contre la contrebande",R(10,30),"carburant|essence|gasoil|station|pompe|sonara",2],
  ["Campagne cacao-café","Les producteurs dénoncent le prix bord champ et les pesées truquées.","acheteurs non agréés et pistes impraticables","des contrôles des balances et l'appui aux coopératives",R(0,0),"cacao|cafe|campagne|bord champ|producteur",2]],
 MINREX:[["Contributions aux organisations internationales","Le Cameroun est en retard de contributions (ONU, UA, CEEAC).","crédits non débloqués","le paiement pour garder notre droit de vote",R(3,8),"contribution|onu|union africaine|ceeac|cotisation",2],
  ["Frais de fonctionnement des ambassades","Plusieurs ambassades n'ont pas payé loyers et personnel local depuis {mois} mois.","transferts en retard du Trésor","le décaissement de {m}",R(2,6),"ambassade|loyer|diplomat|fonctionnement|decaiss",3],
  ["Camerounais en difficulté à l'étranger","Des compatriotes sont bloqués ou détenus à l'étranger.","démarches consulaires lentes","une cellule de crise consulaire",R(.2,1),"diaspora|compatriote|consulaire|detenu|rapatri",2],
  ["Sommets et visites officielles","Un sommet régional se prépare ; la délégation n'est pas arrêtée.","arbitrages en attente","vos instructions sur la délégation et les positions",R(.5,2),"sommet|visite|delegation|bilateral",1]],
 MINADER:[["Engrais et intrants agricoles","Les agriculteurs de la région {reg} n'ont pas reçu les engrais subventionnés.","appel d'offres infructueux et prix mondiaux élevés","une commande d'urgence",R(5,15),"engrais|intrant|semence|agricult",3],
  ["Pistes agricoles","Les récoltes pourrissent faute de pistes praticables.","entretien non financé","un programme de pistes à haute intensité de main-d'œuvre",R(8,20),"piste|recolte|desenclav",2],
  ["Maladies du cacaoyer et relance de la filière","La pourriture brune fait chuter les rendements.","traitements trop chers pour les petits producteurs","la distribution gratuite de fongicides",R(2,6),"cacao|pourriture|filiere|fongicide",2]],
 MINEPIA:[["Grippe aviaire et santé animale","Des foyers suspects signalés dans des élevages de volaille.","surveillance vétérinaire insuffisante","l'abattage indemnisé et des contrôles",R(.5,2),"grippe|volaille|poulet|veterin|elevage",2],
  ["Pêche illégale et chambres froides","Les pêcheurs se plaignent des chalutiers étrangers.","patrouilles maritimes insuffisantes","des patrouilles et des chambres froides",R(1,4),"peche|pecheur|chalutier|poisson",2]],
 MINT:[["Sécurité routière","Série d'accidents graves sur l'axe {axe}.","vitesse, surcharge, état des routes et des véhicules","des contrôles renforcés et une campagne",R(.5,2),"accident|securite routiere|bus|agence de voyage",3],
  ["Camrail et transport ferroviaire","Retards et vétusté du matériel roulant.","investissements différés","un plan de renouvellement du matériel",R(10,40),"camrail|train|ferroviaire|rail",2],
  ["Camair-Co","La compagnie a des avions immobilisés et des dettes.","gestion difficile et flotte réduite","un plan de restructuration",R(20,50),"camair|avion|compagnie aerienne",2]],
 MINJUSTICE:[["Surpopulation carcérale","Les prisons centrales sont à plus de 300 % de leur capacité.","détentions provisoires trop longues","des audiences foraines et des mesures alternatives",R(2,6),"prison|carceral|detenu|surpopulation",3],
  ["Dossiers de détournement de fonds publics","Plusieurs dossiers du Tribunal criminel spécial attendent.","lenteurs des enquêtes et des expertises","des moyens pour le TCS et le parquet",R(.5,2),"detournement|tcs|corruption|parquet|enquete",2],
  ["Délais de jugement","Les justiciables attendent des années.","manque de magistrats et de greffiers","le recrutement de magistrats",R(2,5),"magistrat|greffier|jugement|tribunal",1]],
 MINATD:[["Sécurité et administration dans les régions en crise","Des sous-préfectures ne fonctionnent plus normalement dans le NOSO.","insécurité","le redéploiement de l'administration",R(3,8),"prefet|sous prefet|administration|noso",2],
  ["Préparation des élections locales et du fichier électoral","ELECAM demande des moyens pour la révision des listes.","crédits insuffisants","le financement de la révision",R(10,25),"elecam|election|fichier|liste|electoral",2],
  ["Catastrophes naturelles","Inondations et glissements de terrain dans la région {reg}.","constructions en zones à risque","une aide d'urgence et le relogement",R(1,4),"inondation|glissement|catastrophe|sinistre",3]],
 DGSN:[["Criminalité urbaine","Hausse des braquages à {ville}.","effectifs insuffisants la nuit","des patrouilles et des moyens de mobilité",R(1,4),"braquage|criminal|vol|police|insecurite",3],
  ["Racket sur les routes","La population dénonce les contrôles abusifs.","indiscipline de certains agents","des sanctions et des contrôles inopinés",R(0,0),"racket|controle|corruption|police",2]],
 MINHDU:[["Logements sociaux","Les logements sociaux de {ville} sont inachevés.","décomptes impayés","la reprise des travaux",R(10,30),"logement|habitat|social|immobilier",2],
  ["Assainissement urbain et inondations","Les drains sont bouchés à Douala et Yaoundé.","curage non financé","un programme de curage avant les pluies",R(2,8),"drain|assainissement|curage|inondation",2]],
 MINPOSTEL:[["Couverture réseau et fibre optique","Des zones rurales n'ont aucun réseau.","investissements des opérateurs insuffisants","des obligations de couverture",R(10,30),"reseau|fibre|internet|camtel|operateur",2],
  ["Coûts de l'Internet","Les usagers se plaignent des prix.","coûts de gros élevés","une régulation des prix",R(0,0),"internet|prix|data|forfait",1]],
 MINMIDT:[["Exploitation minière artisanale à l'Est","Accidents dans les chantiers d'or et fuite de l'or.","contrôle insuffisant","le renforcement de la SONAMINES",R(.5,2),"or|mine|minier|sonamines|artisanal",2],
  ["Projet fer de Mbalam-Nabeba","Le projet avance lentement.","financement du chemin de fer minier","vos instructions pour les négociations",R(0,0),"mbalam|fer|minerai",1]],
 MINEPAT:[["Projets d'investissement public en retard","Le taux d'exécution du BIP est faible.","procédures de passation lentes","un suivi mensuel et des sanctions",R(0,0),"bip|investissement|execution|projet",2],
  ["Financements des bailleurs non décaissés","Des prêts signés dorment faute de contreparties.","contreparties nationales non payées","le paiement des contreparties",R(10,40),"bailleur|banque mondiale|bad|pret|contrepartie",2]],
 MINFOPRA:[["Recrutements et dossiers d'intégration","Des milliers de dossiers attendent.","lenteurs et doublons","une opération spéciale de traitement",R(0,0),"recrutement|integration|fonction publique|concours",2],
  ["Fonctionnaires fictifs","Un audit a trouvé des agents payés sans travailler.","contrôle défaillant","un comptage physique et des sanctions",R(5,15),"fictif|audit|comptage|salaire",2]],
 MINTSS:[["Grèves et dialogue social","Des syndicats menacent de grèves dans plusieurs secteurs.","revendications salariales non traitées","l'ouverture de négociations",R(0,0),"greve|syndicat|dialogue social",2],
  ["CNPS et pensions","Des retraités attendent leur pension.","dossiers en retard","le traitement accéléré des dossiers",R(2,6),"cnps|pension|retraite",2]],
 MINAS:[["Personnes déplacées","Des familles déplacées par la crise ont besoin d'aide.","ressources humanitaires insuffisantes","une aide alimentaire et des abris",R(1,4),"deplace|refugie|humanitaire|aide",3]],
 MINPROFF:[["Violences faites aux femmes","Série de féminicides signalés.","impunité et manque de centres d'accueil","des centres d'accueil et des poursuites",R(.5,2),"feminicide|violence|femme",3]],
 MINJEC:[["Emploi et encadrement des jeunes","Le chômage des jeunes alimente les tensions.","programmes trop petits","un programme d'insertion",R(3,10),"jeune|chomage|insertion|emploi",2]],
 MINSEP:[["Primes des Lions et fédérations","Des primes restent dues aux sélections nationales.","crédits insuffisants","le paiement avant la prochaine compétition",R(1,3),"lions|prime|fecafoot|federation|sport",2],
  ["Entretien des stades de la CAN","Des stades se dégradent faute d'entretien.","pas de contrat de maintenance","un contrat de maintenance",R(2,6),"stade|olembe|japoma|entretien",1]],
 MINCOM:[["Médias publics (CRTV) et pluralisme","Critiques sur la couverture de l'actualité.","ligne éditoriale contestée","vos orientations",R(0,0),"crtv|media|journaliste|presse",1]],
 MINMAP:[["Marchés publics bloqués","Des appels d'offres sont infructueux ou contestés.","commissions lentes et recours","l'accélération des procédures",R(0,0),"marche public|appel d offres|commission|attribution",2]],
 MINFOF:[["Exploitation forestière illégale","Des grumes sortent sans autorisation.","contrôles insuffisants","des contrôles aux ports et aux frontières",R(0,0),"foret|grume|bois|braconnage",2]],
 MINEPDED:[["Pollution et déchets plastiques","Les villes sont envahies par les déchets.","collecte insuffisante","un plan de collecte et l'interdiction appliquée",R(1,3),"dechet|pollution|plastique|environnement",1]],
 MINDDEVEL:[["Transferts aux communes","Les communes attendent leur dotation générale de décentralisation.","transferts en retard","le versement de la dotation",R(20,40),"commune|decentralisation|dotation|maire",2]]
};
const AXES=["Yaoundé–Douala","Kumba–Mamfe","Maroua–Mora","Ebolowa–Kribi","Batchenga–Ntui–Yoko","Garoua–Ngaoundéré","Sangmélima–Djoum","Bamenda–Babadjou","Bertoua–Batouri","Yaoundé–Bafoussam"];
function fill(S,s,o,rnd){const r=rnd||Math.random;const regs=CM.REGIONS;const rg=o.reg?CM.REG[o.reg]:regs[Math.floor(r()*regs.length)];
  return String(s).replace(/\{reg\}/g,rg.n).replace(/\{ville\}/g,o.ville||rg.chef).replace(/\{axe\}/g,o.axe).replace(/\{n\}/g,o.n).replace(/\{k\}/g,o.k).replace(/\{p\}/g,o.p).replace(/\{mois\}/g,o.mois).replace(/\{m\}/g,o.mt||"")}
function fromTpl(S,T,key,unit,extra){const rnd=seeded(hash(key+":"+(S.seed||S.name||"x")));const o={axe:AXES[Math.floor(rnd()*AXES.length)],n:Math.round(8+rnd()*40),k:Math.round(2+rnd()*20),p:Math.round(20+rnd()*60),mois:Math.round(3+rnd()*9),reg:(extra&&extra.reg)||null};
  let v=T[4];if(Array.isArray(v))v=v[1]?Math.round((v[0]+rnd()*(v[1]-v[0]))*10)/10:0;o.mt=v?(unit==="M"?fmtM(v):fmtMd(v)):"";
  return {id:"d"+hash(key+T[0]).toString(36),t:fill(S,T[0],o,rnd),d:fill(S,T[1],o,rnd),cause:fill(S,T[2],o,rnd),dem:fill(S,T[3],o,rnd),v:v||0,unit:unit||"Md",mt:o.mt,kw:T[5],urg:T[6]||2,st:"ouvert",suivi:[],...(extra||{})}}
DOSS.fmt=d=>d.v?(d.unit==="M"?fmtM(d.v):fmtMd(d.v)):"";

/* dossiers génériques pour un ministère sans liste détaillée */
function genMin(id){const m=E.MINISTERES.find(x=>x.id===id);const n=m?m.n:"du ministère";return[
 ["Crédits de fonctionnement du ministère ("+n+")","Les services centraux et déconcentrés manquent de crédits de fonctionnement.","engagements bloqués au contrôle financier","le déblocage de la tranche trimestrielle",R(1,4),"credit|fonctionnement|decaiss|budget",2],
 ["Projets d'investissement du ministère","Le taux d'exécution du budget d'investissement est de {p} %.","procédures de passation des marchés lentes","un suivi rapproché des marchés",R(2,8),"projet|investissement|marche|execution",2],
 ["Revendications du personnel","Les agents réclament primes et avancements.","dossiers administratifs en retard","un calendrier de régularisation",R(.5,2),"personnel|prime|agent|avancement",1]]}
DOSS.ofMin=function(S,id,extra){S.dossMin=S.dossMin||{};const L=(MIN[id]||genMin(id));return L.map((T,i)=>{const d=fromTpl(S,T,id+i,"Md",extra);d.min=id;const o=(S.dossMin[d.id]||{});return Object.assign(d,o)})};
DOSS.minKey=id=>MIN[id]?id:null;

/* ---------- entreprises (profil chef d'entreprise, et DG d'entreprises dans la fiche) ---------- */
const ENT={
 btp:[["Factures impayées par l'État","{imp} de décomptes validés ne sont toujours pas payés par le Trésor ; vous payez pourtant salaires et fournisseurs.","engagements de l'État supérieurs à la trésorerie ; dossiers « en instance » à la paierie","le paiement, au moins partiel, de vos décomptes",0,"impaye|facture|decompte|tresor|payer|dette",3,"MINFI"],
  ["Appels d'offres en cours","{ao} appels d'offres publics sont ouverts ; les dossiers demandent cautions bancaires, attestations fiscales et CNPS à jour.","coût des cautions et délais courts","une soumission bien préparée et une caution de votre banque",0,"appel d offres|soumission|marche|caution|dao",2,"MINMAP"],
  ["Prix du ciment et du fer","Le sac de ciment a pris 500 à 800 FCFA ; le fer à béton aussi. Vos marchés sont à prix fermes.","inflation importée et fret","une révision des prix (avenant) ou des achats groupés",0,"ciment|fer|prix|materiau|avenant|revision",2,"MINCOMMERCE"],
  ["Engins en panne et location de matériel","Une niveleuse et un camion benne sont immobilisés faute de pièces.","pièces importées chères, maintenance différée","réparer ou louer du matériel pour tenir les délais",0,"engin|panne|niveleuse|camion|materiel|location",2,null],
  ["Personnel, CNPS et sécurité sur les chantiers","Les ouvriers réclament leur déclaration CNPS ; l'inspection du travail annonce un contrôle.","trésorerie tendue par les impayés","régulariser les déclarations et équiper les ouvriers (EPI)",0,"ouvrier|personnel|cnps|salaire|securite|inspection",2,"MINTSS"],
  ["Contrôle fiscal et redressement","Les impôts vous notifient un redressement de {red}.","écritures comptables incomplètes et TVA non reversée sur des marchés impayés","contester avec votre comptable et négocier un échéancier",0,"impot|fisc|redressement|tva|dgi",2,"MINFI"],
  ["Demandes de « motivation » sur les marchés","Un intermédiaire laisse entendre qu'il faut « motiver » pour être payé ou retenu.","corruption dans la chaîne de la dépense","refuser, documenter et, si besoin, saisir la CONAC",0,"corruption|motivation|pot de vin|conac|10 %",2,null]],
 generic:[["Factures impayées par l'État et les grands clients","{imp} de factures restent impayées.","retards de paiement de l'administration","relancer et négocier un calendrier",0,"impaye|facture|payer|dette|client",3,"MINFI"],
  ["Délestages et coût de l'énergie","Les coupures d'électricité vous obligent à tourner au groupe électrogène.","déficit de production d'ENEO","un groupe plus économique ou du solaire",0,"delestage|electricite|eneo|groupe|coupure",2,"MINEE"],
  ["Fiscalité et contrôles","Plusieurs administrations vous réclament taxes et pénalités.","multiplicité des taxes et des contrôles","faire valoir vos droits et regrouper les paiements",0,"impot|taxe|fisc|controle|patente",2,"MINFI"],
  ["Trésorerie et crédit bancaire","Votre banque hésite à renouveler votre découvert.","impayés clients et garanties insuffisantes","négocier une ligne de crédit adossée à vos factures",0,"banque|credit|tresorerie|decouvert|pret",2,null],
  ["Personnel et CNPS","Les employés réclament leurs cotisations et une hausse de salaire.","marges réduites","un accord et la régularisation CNPS",0,"personnel|salaire|cnps|employe|greve",2,"MINTSS"]]
};
const ENT_SPEC={video:["Contrat de vidéosurveillance urbaine","La commune veut un réseau de caméras mais n'a pas de budget voté.","budget communal non voté","monter un financement en partenariat public-privé","camera|video|surveillance|commune"],
 solaire:["Kits solaires bloqués au port","Vos conteneurs de panneaux sont bloqués à la douane de Douala.","classification tarifaire contestée","obtenir l'exonération prévue pour les énergies renouvelables","port|douane|conteneur|panneau|solaire"],
 numerique:["Retard de paiement d'un ministère client","Un logiciel livré n'est pas payé.","réception non signée","obtenir le PV de réception","logiciel|ministere|reception|informatique"],
 gardiennage:["Agents non payés et sites à risque","Vos agents menacent d'abandonner des sites.","impayés de clients publics","payer les agents en priorité","agent|gardien|site|vigile"],
 sante:["Agrément et stock de médicaments","L'inspection demande la mise à jour de l'agrément.","dossier incomplet","compléter le dossier au MINSANTE","agrement|medicament|inspection|clinique"],
 agro:["Récolte et transport vers les marchés","Les pistes coupées bloquent les camions.","saison des pluies","louer des camions tout-terrain","recolte|piste|camion|marche"],
 transport:["Carburant et tracasseries routières","Le gasoil a augmenté et les contrôles se multiplient.","prix à la pompe et racket","négocier les tarifs et signaler les abus","carburant|gasoil|controle|racket|camion"],
 conseil:["Études non payées par un projet public","Votre rapport d'études n'est pas payé.","projet en attente de financement","relancer le maître d'ouvrage","etude|rapport|projet"],
 juridique:["Honoraires d'un grand client en retard","Un client public tarde à payer.","procédure de paiement lourde","relancer et négocier","honoraire|client|dossier"],
 com:["Événement annulé et acompte","Un client a annulé un événement après vos dépenses.","annulation tardive","faire jouer le contrat","evenement|acompte|annulation"],
 formation:["Agrément du centre de formation","Le MINEFOP exige un renouvellement.","dossier incomplet","déposer les pièces","agrement|formation|minefop"],
 import:["Conteneurs bloqués au port","Des marchandises attendent au port de Douala.","lenteurs douanières","dédouaner rapidement pour éviter les frais de magasinage","port|douane|conteneur|marchandise"],
 eau:["Forages et qualité de l'eau","Un forage livré donne une eau non conforme.","nappe polluée","traiter ou refaire l'ouvrage","forage|eau|qualite|pompe"],
 hotel:["Baisse de la clientèle","Le taux de remplissage chute.","insécurité et vie chère","promotions et partenariats","client|hotel|restaurant|remplissage"],
 mines:["Contrat de sous-traitance minière","Un grand groupe réduit ses commandes.","prix des matières premières","diversifier les clients","mine|petrole|sous traitance|contrat"]};
DOSS.ofEnt=function(S,o){/* o : {sector, nom, impayes, ao, reg, key} */const sec=o.sector||"btp";let L=(ENT[sec]||ENT.generic).slice();if(sec!=="btp"&&ENT_SPEC[sec]){const x=ENT_SPEC[sec];L.unshift([x[0],x[1],x[2],x[3],0,x[4],2,null])}
  const imp=o.impayes!=null?o.impayes:Math.round(40+seeded(hash(o.key||"e"))()*360);
  return L.map((T,i)=>{const d=fromTpl(S,T,(o.key||"ent")+sec+i,"M",{reg:o.reg});d.t=d.t;d.d=d.d.replace("{imp}",fmtM(imp)).replace("{ao}",o.ao!=null?o.ao:3).replace("{red}",fmtM(Math.round(8+seeded(hash((o.key||"e")+"red"))()*52)));if(/impay/.test(T[5]))d.v=imp,d.unit="M";d.min=T[7]||null;return d})};

/* ---------- professions ---------- */
const PRO={
 medecin:[["Ruptures de médicaments à l'hôpital","Vos patients doivent acheter eux-mêmes gants, seringues et antipaludiques.","la pharmacie de l'hôpital attend la CENAME","signaler la rupture au directeur et au district",0,"medicament|rupture|pharmacie|stock",3,"MINSANTE"],
  ["Gardes et primes impayées","Vous enchaînez les gardes ; les primes n'ont pas été payées depuis {mois} mois.","crédits de primes non débloqués","réclamer avec le syndicat des médecins",0,"garde|prime|salaire|syndicat",2,"MINSANTE"],
  ["Plateau technique","L'échographe et le laboratoire tombent souvent en panne.","maintenance absente","un rapport au directeur de l'hôpital",0,"materiel|echographe|laboratoire|panne",2,null],
  ["Évacuations et cas graves","Des patients graves ne peuvent pas être transférés faute d'ambulance.","ambulance en panne","organiser une évacuation avec le SAMU",0,"evacuation|ambulance|transfert|urgence",2,null]],
 infirmier:[["Surcharge de travail","Une infirmière pour 40 lits la nuit.","gel des recrutements","demander des renforts",0,"surcharge|nuit|lit|renfort",2,"MINSANTE"],["Primes et intégration","Votre dossier d'intégration traîne.","lenteurs de la Fonction publique","relancer le dossier",0,"integration|prime|dossier",2,"MINFOPRA"]],
 pharmacien:[["Faux médicaments dans le quartier","Des médicaments de rue se vendent devant votre officine.","contrôles rares","alerter l'inspection et la police",0,"faux|rue|poteau|contrefacon",3,"MINSANTE"],["Approvisionnement","Des grossistes sont en rupture.","retards d'importation","diversifier les fournisseurs",0,"grossiste|rupture|stock",2,null]],
 enseignant:[["Rappels et salaire","Vos rappels de salaire ne sont pas payés depuis {mois} mois.","dossier bloqué aux Finances","relancer la délégation régionale",0,"rappel|salaire|paie|integration",3,"MINESEC"],["Classes surchargées","{n} élèves par classe, sans tables-bancs suffisantes.","manque de salles","signaler au proviseur et à l'APEE",0,"classe|eleve|table|salle",2,"MINESEC"],["Examens officiels","Vous êtes convoqué pour corriger le baccalauréat.","indemnités de correction souvent en retard","préparer la correction et réclamer les indemnités",0,"examen|correction|bac|indemnite",1,"MINESEC"]],
 avocat:[["Clients en détention provisoire prolongée","Deux clients sont détenus sans jugement depuis des mois.","renvois successifs","demander la mise en liberté",0,"detention|client|liberte|prison",3,"MINJUSTICE"],["Honoraires impayés","Des clients ne paient pas.","précarité","des conventions d'honoraires",0,"honoraire|client|paiement",2,null]],
 genie:[["Chantier en retard","Le chantier dont vous êtes responsable est en retard.","approvisionnement irrégulier en ciment","réorganiser le planning",0,"chantier|retard|planning|ciment",2,"MINTP"],["Malfaçons signalées","Le laboratoire a trouvé un béton sous-dosé.","économies de l'entreprise","exiger la reprise",0,"beton|malfacon|laboratoire|qualite",3,"MINTP"]],
 architecte:[["Permis de bâtir bloqués","Des dossiers de vos clients attendent à la mairie.","lenteurs administratives","relancer le service de l'urbanisme",0,"permis|mairie|urbanisme",2,"MINHDU"],["Constructions en zone à risque","Un client veut construire en zone inondable.","prix du terrain","refuser et conseiller",0,"zone|risque|inondable|terrain",2,null]],
 informaticien:[["Coupures d'Internet et d'électricité","Vos projets prennent du retard.","délestages","onduleurs et connexion de secours",0,"internet|coupure|delestage|connexion",2,"MINPOSTEL"],["Client qui ne paie pas","Une administration tarde à payer.","réception non signée","relancer",0,"client|paiement|facture",2,null]],
 comptable:[["Déclarations fiscales de vos clients","Échéances de la DSF et de la TVA.","clients désorganisés","planifier les dépôts",0,"dsf|tva|fiscal|declaration",2,"MINFI"],["Contrôle fiscal d'un client","Redressement contesté.","pièces manquantes","préparer la contestation",0,"controle|redressement|impot",2,"MINFI"]],
 journaliste:[["Enquête sensible","Vous enquêtez sur un marché public douteux.","sources prudentes, pressions","vérifier les faits et protéger vos sources",0,"enquete|marche|corruption|source",3,"MINCOM"],["Carte de presse et salaires","Votre journal paie en retard.","crise de la presse","négocier",0,"salaire|journal|carte de presse",2,null]],
 agronome:[["Maladies des cultures","Des champs de la région {reg} sont touchés.","traitements chers","campagne de traitement",0,"maladie|culture|champ|traitement",3,"MINADER"],["Coopératives à encadrer","Les coopératives veulent de l'appui.","manque d'encadreurs","former et accompagner",0,"cooperative|encadrement|formation",2,"MINADER"]]
};
/* ---------- élus et opposition ---------- */
const OPP={
 maire:[["Budget communal et dotation","La dotation générale de décentralisation n'est pas arrivée.","retard des transferts de l'État","relancer le ministère de la Décentralisation",0,"dotation|budget|commune|decentralisation",3,"MINDDEVEL"],
  ["Ordures ménagères","Les tas d'ordures s'accumulent dans les quartiers.","contrat de collecte impayé","payer le prestataire et organiser des journées de salubrité",0,"ordure|dechet|salubrite|hysacam|collecte",3,null],
  ["Marché municipal","Les commerçants se plaignent des hangars délabrés et des taxes.","investissements non réalisés","rénover et clarifier les taxes",0,"marche|commercant|taxe|hangar",2,"MINCOMMERCE"],
  ["Voirie communale et eau","Rues défoncées et bornes-fontaines en panne.","moyens limités","prioriser quelques axes",0,"route|rue|voirie|eau|borne",2,"MINEE"],
  ["Relations avec le préfet","Le préfet bloque des décisions du conseil municipal.","tutelle administrative","dialoguer ou saisir le ministère",0,"prefet|tutelle|conseil municipal",2,"MINATD"],
  ["État civil","Des enfants n'ont pas d'acte de naissance.","centres d'état civil sous-équipés","une campagne de régularisation",0,"etat civil|acte de naissance|registre",1,null]],
 depute:[["Doléances de la circonscription","Routes, eau et écoles : vos électeurs attendent.","projets non inscrits au budget","plaider en commission des finances",0,"circonscription|doleance|electeur",3,"MINEPAT"],
  ["Session parlementaire et loi de finances","La loi de finances arrive à l'Assemblée.","délais d'examen courts","préparer amendements et questions",0,"session|loi de finances|amendement|assemblee",2,"MINFI"],
  ["Questions orales au gouvernement","Vous pouvez interpeller un ministre.","réponses souvent évasives","préparer une question précise",0,"question orale|interpeller|ministre",2,null]],
 parti:[["Militants arrêtés","Des militants sont en garde à vue après une réunion.","réunion jugée non déclarée","mobiliser des avocats et communiquer",0,"militant|arrete|garde a vue|avocat",3,"MINJUSTICE"],
  ["Financement du parti","Les caisses sont presque vides.","cotisations irrégulières, financement public faible","une collecte et des soutiens",0,"financement|cotisation|argent|caisse",2,null],
  ["Fichier électoral et inscriptions","Beaucoup de jeunes ne sont pas inscrits.","méfiance, procédures lourdes","une campagne d'inscription",0,"inscription|fichier|elecam|electeur",2,"MINATD"],
  ["Alliances de l'opposition","Des partis proposent une coalition.","méfiance entre leaders","négocier un accord",0,"alliance|coalition|opposition",2,null],
  ["Meetings interdits","La sous-préfecture refuse vos déclarations de réunion.","motifs d'ordre public","contester et négocier",0,"meeting|interdit|reunion|sous prefet",2,"MINATD"]]
};
const ORG={hop:[["Stocks de médicaments","La pharmacie de l'hôpital est à {stock} sur 100.","factures dues à la CENAME","un paiement pour réapprovisionner",R(.1,.5),"medicament|stock|rupture|pharmacie",3],["Personnel et gardes","Le personnel manque la nuit.","gel des recrutements","des renforts et le paiement des primes",R(.05,.3),"personnel|garde|infirmier|medecin",2],["Équipements en panne","Scanner ou bloc opératoire en panne.","maintenance absente","un contrat de maintenance",R(.1,.8),"scanner|equipement|bloc|panne",2]],
 gouverneur:[["Sécurité dans la région","Incidents récents dans plusieurs départements.","effectifs limités","des renforts",R(0,0),"securite|incident|attaque",3],["Projets régionaux en retard","Routes et écoles en retard.","financements lents","un suivi",R(1,5),"projet|route|ecole|retard",2]],
 prefet:[["Ordre public","Tensions sociales dans le département.","vie chère, chômage","dialogue et vigilance",0,"ordre public|tension|manifestation",2],["Conflits fonciers","Litiges entre villages.","limites mal définies","une commission",0,"foncier|terrain|conflit",2]],
 police:[["Criminalité","Hausse des vols et braquages.","patrouilles insuffisantes","des véhicules et du carburant",0,"vol|braquage|criminal",3]]};

/* ---------- ce que sait un interlocuteur ---------- */
DOSS.npc=function(S,P){if(!S||!P)return[];let L=[];
  const minId=P.min||(P.k==="min"?P.id:null);
  if(P.org&&P.org.k==="ent"&&S.org){const e=S.org.ent.find(x=>x.id===P.org.id);if(e){const sec=/banque|bank|afriland|sgc|bicec|ecobank|uba/i.test(e.n)?"generic":/bat|btp|construct|razel|sogea|cgc/i.test(e.n)?"btp":"generic";L=DOSS.ofEnt(S,{sector:sec,key:e.id,reg:e.reg})}}
  else if(P.org&&P.org.k==="hop"&&S.org){const h=S.org.hop.find(x=>x.id===P.org.id);L=ORG.hop.map((T,i)=>{const d=fromTpl(S,T,"hop"+(h?h.id:"")+i,"Md",{reg:h&&h.reg});d.d=d.d.replace("{stock}",h?Math.round(h.stock):50);return d});if(h&&h.stock>=40)L[0].urg=1}
  else if(minId)L=DOSS.ofMin(S,minId,{reg:P.reg});
  else if(P.org&&ORG[P.org.k])L=ORG[P.org.k].map((T,i)=>fromTpl(S,T,P.org.k+(P.org.id||"")+i,"Md",{reg:P.reg}));
  else if(P.kind==="operateur")L=DOSS.ofEnt(S,{sector:"btp",key:P.n,reg:P.reg}).slice(0,5);
  else if(window.RENC&&RENC.K[P.kind]){const k=RENC.K[P.kind];L=k.pb.map((x,i)=>({id:"k"+i,t:x.charAt(0).toUpperCase()+x.slice(1),d:"Ici, "+x+", c'est notre quotidien.",cause:"",dem:k.att,v:0,kw:x.split(/\s+/).filter(w=>w.length>4).map(w=>norm(w).slice(0,6)).join("|"),urg:2,st:"ouvert"}))}
  // directives et faits réels qui le concernent
  const extra=[];
  if(minId){for(const d of (S.directives||[]))if(!d.done&&d.resp===minId)extra.push({id:"dir"+d.id,t:"Votre directive : "+d.titre,d:"Instruction reçue le "+G.dayLabel(d.start)+", échéance le "+G.dayLabel(d.due)+".",cause:"",dem:"",v:d.cout||0,unit:"Md",kw:norm(d.titre).split(" ").filter(w=>w.length>5).slice(0,4).join("|")||"directive",urg:3,st:"ouvert",dir:d.id,prog:Math.round(Math.min(95,(S.day-d.start)/Math.max(1,d.due-d.start)*100))});
    if(window.ACTU)for(const a of ACTU.all().slice(0,40)){if(!(Array.isArray(a.aut)?a.aut:[a.aut]).includes(minId))continue;extra.push({id:"a"+a.id,t:a.titre,d:a.resume||"",cause:"",dem:"vos instructions sur la réponse de l'État",v:0,kw:norm(a.titre).split(" ").filter(w=>w.length>5).slice(0,5).join("|"),urg:a.grav>=3?3:2,st:"ouvert",actu:a.id});if(extra.length>4)break}}
  L=extra.concat(L.filter(d=>d.st!=="regle"));
  return L.sort((a,b)=>b.urg-a.urg).slice(0,8)};

/* ---------- le portefeuille du joueur ---------- */
function build(S){const who=S.mode;let L=[];
  if(who==="pres"){const ids=["MINFI","MINDEF","MINEE","MINSANTE","MINTP","MINESEC","MINCOMMERCE","MINREX","MINJUSTICE","MINESUP"];for(const id of ids){const x=DOSS.ofMin(S,id);const top=x.sort((a,b)=>b.urg-a.urg)[0];if(top){top.t=top.t;L.push(top)}}}
  else if(who==="min"&&S.minis)L=DOSS.ofMin(S,S.minis.id);
  else if(who==="ing"&&S.ent)L=DOSS.ofEnt(S,{sector:S.ent.sector,key:"moi",impayes:Math.round(S.ent.impayes||RN(30,180)),ao:(S.ent.ao||[]).length,reg:S.ent.reg});
  else if(who==="pro"&&S.pro){const T=PRO[S.pro.id]||[["Clients et revenus","Vos revenus varient beaucoup d'un mois à l'autre.","clients qui paient en retard","fidéliser et relancer",0,"client|revenu|paiement",2,null],["Formation et carrière","Une promotion se prépare.","concurrence","compléter votre dossier",0,"promotion|carriere|formation",1,null]];
    L=T.map((x,i)=>{const d=fromTpl(S,x,"pro"+S.pro.id+i,"M",{reg:S.pro.reg});d.min=x[7]||null;return d})}
  else if(S.opp){const T=S.profil==="maire"?OPP.maire:S.profil==="depute"?OPP.depute:OPP.parti;L=T.map((x,i)=>{const d=fromTpl(S,x,"opp"+(S.profil||"p")+i,"M",{reg:S.opp.home});d.min=x[7]||null;return d})}
  return L.map(d=>Object.assign(d,{st:"ouvert",suivi:[],ne:S.day,due:S.day+(d.urg===3?21:d.urg===2?45:75)}))}
DOSS.ensure=function(S){if(!S||S.phase!=="play"||S.mode==="multi")return[];if(!S.doss||!S.doss.L){S.doss={L:build(S),next:S.day+30};if(S.mode==="ing"&&S.ent&&!S.ent.impayes){const d=S.doss.L.find(x=>/impay/.test(x.kw));if(d)S.ent.impayes=d.v}}
  // les impayés réels de l'entreprise suivent le jeu
  if(S.mode==="ing"&&S.ent){const d=S.doss.L.find(x=>/impay/.test(x.kw)&&x.st!=="regle");if(d&&S.ent.impayes>0){d.v=Math.round(S.ent.impayes);d.d=fmtM(d.v)+" de décomptes et factures validés ne sont toujours pas payés ; vous payez pourtant salaires et fournisseurs."}}
  return S.doss.L};
DOSS.open=S=>DOSS.ensure(S).filter(d=>d.st!=="regle");
DOSS.find=(S,id)=>DOSS.ensure(S).find(d=>d.id===id);
DOSS.score=function(d,t){t=norm(t);let s=0;if(d.kw)for(const k of d.kw.split("|"))if(k&&t.includes(k))s+=k.length>5?2:1;for(const w of norm(d.t).split(" "))if(w.length>5&&t.includes(w))s+=1;return s};
DOSS.match=function(L,t){let best=null,bs=0;for(const d of L){const s=DOSS.score(d,t);if(s>bs){bs=s;best=d}}return bs>=1?best:null};

/* ---------- qui appeler pour un dossier ---------- */
function contact(S,d){const id=d.min;if(!id)return null;const m=E.MINISTERES.find(x=>x.id===id);const g=S.gov&&S.gov.min&&S.gov.min[id];
  const n=g?g.n:window.SYS.nom("CE");const sexe=window.SYS.sexe(n);
  if(S.mode==="pres"||S.mode==="min")return{k:"min",id,min:id,n,sexe,lab:window.SYS.accord("le ministre "+window.SYS.deM(m?m.n:id)+(m?m.n:id),sexe)};
  // les autres profils joignent un directeur de l'administration, pas le ministre
  const dn=window.SYS.nom("CE");const sx=window.SYS.sexe(dn);return{k:"adm",min:id,n:dn,sexe:sx,lab:window.SYS.accord("le directeur des affaires financières au ministère "+window.SYS.deM(m?m.n:id)+(m?m.n:id),sx)}}
DOSS.contact=contact;

/* ---------- actions sur un dossier ---------- */
function actsFor(S,d){const A=[];const c=contact(S,d);
  if(S.mode==="pres"||S.mode==="min"){A.push(["dir","📜 Donner une directive"],["note","📝 Demander une note de synthèse"]);if(c&&!(S.mode==="min"&&c.id===S.minis.id))A.push(["call","📞 Appeler "+c.lab+" ("+c.n+")"],["conv","🗓️ Convoquer "+c.lab]);
    if(S.mode==="min")A.push(["serv","🏛️ Réunir les directeurs du ministère (7 jours)"])}
  else if(S.mode==="ing"){if(/impay/.test(d.kw))A.push(["relance","✉️ Relance écrite au maître d'ouvrage et au Trésor (10 jours)"],["demeure","⚖️ Mise en demeure par un avocat (500 000 FCFA, 30 jours)"]);
    else if(/appel d offres/.test(d.kw))A.push(["ao","📂 Ouvrir les appels d'offres"]);
    else if(/engin/.test(d.kw))A.push(["repar","🔧 Faire réparer (3 M FCFA, 7 jours)"],["loc","🚜 Louer du matériel (1,5 M FCFA / mois)"]);
    else if(/corruption/.test(d.kw))A.push(["refus","🙅 Refuser et documenter"],["conac","📣 Saisir la CONAC"]);
    else A.push(["traiter","🛠️ Traiter avec votre équipe (7 jours)"]);
    if(c)A.push(["call","📞 Appeler "+c.lab])}
  else{A.push(["traiter","🛠️ M'en occuper (7 jours)"]);if(c)A.push(["call","📞 Appeler "+c.lab]);if(S.opp)A.push(["comm","📣 Communiqué / prise de position"])}
  A.push(["classer","✅ Marquer comme traité"]);return A}
function say(m){try{window.Audio2.speak(m,{voix:"f"})}catch(e){}}
function later(S,d,a,days,p,lab){d.cours={a,fin:S.day+days,p,lab};d.suivi.push({j:S.day,t:lab});G.toast(lab)}
DOSS.act=function(S,id,a){const d=DOSS.find(S,id);if(!d)return;const c=contact(S,d);const close=()=>document.querySelectorAll(".sheet").forEach(s=>{if(s.dataset.doss)s.remove()});
  const rep=m=>{say(m);G.toast(m.slice(0,120))};
  if(a==="dir"&&window.DIR){close();const txt="Je veux que le dossier « "+d.t+" » soit réglé : "+(d.dem||"prenez les mesures nécessaires")+(S.mode==="pres"&&d.min?" (ministère responsable : "+d.min+")":"")+" dans "+(d.urg===3?"15":"30")+" jours";
    DIR.handle(S,txt,rep,{force:true,ctx:d.t}).then(()=>{const L=S.directives||[];const x=L[L.length-1];if(x&&x.dossier===d.t){if(d.min&&S.mode==="pres")x.resp=d.min;d.dir=x.id;d.suivi.push({j:S.day,t:"Directive donnée"});G.render()}});return}
  if(a==="note"&&window.NOTE){close();NOTE.handle(S,"Je veux une note sur le dossier "+d.t,rep,{ctx:d.t});d.suivi.push({j:S.day,t:"Note demandée"});return}
  if(a==="call"&&c&&window.RENC){close();d.suivi.push({j:S.day,t:"Appel à "+c.n});
    if(window.CAB&&c.k==="min"){const st=CAB.status(S,c);if(st&&!st.ok){CAB.unavailable(S,c,st,{objet:d.t,when:"maintenant"});return}}
    RENC.open(S,{kind:"officiel",n:c.n,sexe:c.sexe,lab:c.lab.replace(/^(le|la) /,""),min:c.min,reg:"CE",ville:"Yaoundé",lieu:"au téléphone",sujet:d.t,dossier:d.id,tel:true,bonjour:"Allô ? Oui, "+(S.mode==="pres"?"Excellence":"bonjour")+", je vous écoute."});return}
  if(a==="conv"&&c&&window.VOIX){close();VOIX.handle("convoque "+c.lab+" demain à 10h pour le dossier "+d.t);d.suivi.push({j:S.day,t:"Convocation"});return}
  if(a==="ao"){close();const b=document.querySelector('[data-tab="marche"],[data-t="marche"]');if(b)b.click();else G.toast("Ouvrez l'onglet Marché pour voir les appels d'offres.");return}
  if(a==="classer"){d.st="regle";d.suivi.push({j:S.day,t:"Classé"});close();G.toast("Dossier classé.");G.render();return}
  if(a==="comm"){if(S.opp){S.opp.noto=Math.min(100,S.opp.noto+1.5)}d.suivi.push({j:S.day,t:"Communiqué publié"});window.SYS.inbox(S,{from:"Votre cabinet",t:"Communiqué : "+d.t,b:"Votre prise de position sur « "+d.t+" » a été diffusée. Elle est reprise par quelques journaux privés.",k:"info",read:true});close();G.render();return}
  const cost=M=>{if(S.mode==="ing"){if(S.ent.fonds<M){G.toast("Trésorerie insuffisante.");return false}S.ent.fonds-=M}else if(S.mode==="pro"&&S.pro){const F=M*1e6;if(S.pro.fonds<F){G.toast("Fonds insuffisants.");return false}S.pro.fonds-=F}return true};
  if(a==="relance")later(S,d,a,10,.45,"Relance envoyée au maître d'ouvrage et à la paierie.");
  else if(a==="demeure"){if(!cost(.5))return;later(S,d,a,30,.7,"Mise en demeure envoyée par votre avocat.")}
  else if(a==="repar"){if(!cost(3))return;later(S,d,a,7,.9,"Engin confié au garage.")}
  else if(a==="loc"){if(!cost(1.5))return;d.st="regle";d.suivi.push({j:S.day,t:"Matériel loué"});if(S.ent)S.ent.engins=(S.ent.engins||0)+1;G.toast("Matériel loué : vos chantiers reprennent.")}
  else if(a==="refus"){d.st="regle";if(S.ent)S.ent.rep=Math.min(100,S.ent.rep+1);d.suivi.push({j:S.day,t:"Refus documenté"});G.toast("Vous refusez. Votre intégrité est notée, mais le dossier de paiement risque de traîner.")}
  else if(a==="conac")later(S,d,a,20,.5,"Dénonciation déposée à la CONAC.");
  else if(a==="serv"){if(S.minis)S.minis.perf=Math.min(100,S.minis.perf+1);later(S,d,a,7,.6,"Réunion de crise avec vos directeurs : plan d'action sous 7 jours.")}
  else if(a==="traiter")later(S,d,a,7,.65,"Vous prenez le dossier en main.");
  close();G.render()};

DOSS.tick=function(S){if(!S||!S.doss)return;for(const d of S.doss.L){if(d.st==="regle")continue;
   if(d.cours&&S.day>=d.cours.fin){const ok=Math.random()<d.cours.p;const a=d.cours.a;d.cours=null;
     if(ok){d.st="regle";let gain="";if(S.mode==="ing"&&/impay/.test(d.kw)&&S.ent){const p=Math.round((S.ent.impayes||d.v)*(a==="demeure"?.6:.35));if(p>0){S.ent.impayes=Math.max(0,(S.ent.impayes||0)-p);S.ent.fonds+=p;gain=" "+fmtM(p)+" ont été versés sur votre compte."}}
       if(a==="repar"&&S.ent)S.ent.engins=(S.ent.engins||0)+1;if(S.pro)S.pro.rep=Math.min(100,S.pro.rep+1.5);if(S.ent)S.ent.rep=Math.min(100,S.ent.rep+.5);
       window.SYS.inbox(S,{from:"Suivi des dossiers",t:"Dossier réglé : "+d.t,b:"Votre action a abouti."+gain,k:"bonne"})}
     else{d.urg=Math.min(3,d.urg+1);window.SYS.inbox(S,{from:"Suivi des dossiers",t:"Sans suite : "+d.t,b:"Votre démarche n'a pas encore abouti ("+d.cause+"). Il faudra insister ou changer d'approche.",k:"info"})}}
   if(d.dir){const x=(S.directives||[]).find(y=>y.id===d.dir);if(x&&x.done){if(/compl|réussi/i.test(x.res||"")){d.st="regle";d.suivi.push({j:S.day,t:"Réglé par la directive"})}else d.dir=null}}
   if(!d.late&&S.day>d.due&&d.urg===3&&!d.cours&&!d.dir){d.late=1;
     if(S.mode==="ing"&&S.ent)S.ent.rep=Math.max(0,S.ent.rep-1);else if(S.st&&S.st.pop!=null)S.st.pop=Math.max(0,S.st.pop-.5);if(S.opp)S.opp.noto=Math.max(0,S.opp.noto-1);if(S.pro)S.pro.rep=Math.max(0,S.pro.rep-1);
     window.SYS.inbox(S,{from:"Votre cabinet",t:"Dossier urgent en souffrance : "+d.t,b:d.d+"\nCe dossier attend une décision depuis le "+G.dayLabel(d.ne)+". Blocage : "+d.cause+".",k:"alerte"})}}
  // nouveaux dossiers chaque mois
  if(S.day>=S.doss.next){S.doss.next=S.day+30;const fresh=build(S).filter(n=>!S.doss.L.some(o=>o.id===n.id&&o.st!=="regle"));const n=fresh.find(x=>!S.doss.L.some(o=>o.id===x.id));
    S.doss.L=S.doss.L.filter(o=>o.st!=="regle"||S.day-(o.ne||0)<60);if(n){S.doss.L.push(n)}else{const old=S.doss.L.find(o=>o.st==="regle");if(old){old.st="ouvert";old.ne=S.day;old.due=S.day+45;old.suivi=[];old.d=old.d+" (le problème ressurgit)"}}}};

/* ---------- carte et fiches ---------- */
DOSS.card=function(S){const L=DOSS.open(S).sort((a,b)=>b.urg-a.urg);if(!L.length)return"";const U=["","·","!","‼"];
  return '<div class="card"><div class="row" style="justify-content:space-between"><b>🗂️ Mes dossiers</b><button class="btn small" data-dsall>Tout voir ('+L.length+')</button></div>'+
   L.slice(0,4).map(d=>'<button class="choice" data-ds="'+d.id+'" style="margin-top:6px"><span class="t">'+(d.urg===3?'<b style="color:var(--bad,#e55)">Urgent</b> · ':"")+esc(d.t)+'</span><span class="d">'+esc((d.mt||DOSS.fmt(d))?(d.mt||DOSS.fmt(d))+" · ":"")+(d.cours?"en cours : "+esc(d.cours.lab):d.dir?"directive en cours":"blocage : "+esc(d.cause))+'</span></button>').join("")+'</div>'};
DOSS.bindCard=function(S,root){(root||document).querySelectorAll("[data-ds]").forEach(b=>b.onclick=()=>DOSS.sheet(S,b.dataset.ds));const a=(root||document).querySelector("[data-dsall]");if(a)a.onclick=()=>DOSS.list(S)};
DOSS.list=function(S){const L=DOSS.ensure(S).slice().sort((a,b)=>(a.st==="regle")-(b.st==="regle")||b.urg-a.urg);
  G.sheet('<span class="eyebrow">Portefeuille</span><h3 class="h2">Mes dossiers</h3><div class="choices">'+L.map(d=>'<button class="choice" data-ds="'+d.id+'"><span class="t">'+(d.st==="regle"?"✅ ":d.urg===3?"🔴 ":d.urg===2?"🟠 ":"🟢 ")+esc(d.t)+'</span><span class="d">'+esc(d.st==="regle"?"réglé":(DOSS.fmt(d)?DOSS.fmt(d)+" · ":"")+"échéance "+G.dayLabel(d.due))+'</span></button>').join("")+'</div>',el=>{el.dataset.doss="1";el.setAttribute("data-noinstr","");el.querySelectorAll("[data-ds]").forEach(b=>b.onclick=()=>{el.remove();DOSS.sheet(S,b.dataset.ds)})})};
DOSS.sheet=function(S,id){const d=DOSS.find(S,id);if(!d)return;const A=d.st==="regle"?[]:actsFor(S,d);
  G.sheet('<span class="eyebrow">Dossier'+(d.urg===3?" urgent":"")+'</span><h3 class="h2">'+esc(d.t)+'</h3><p>'+esc(d.d)+'</p>'+
   (DOSS.fmt(d)?'<p class="small"><b>Montant en jeu :</b> '+esc(DOSS.fmt(d))+'</p>':"")+(d.cause?'<p class="small"><b>Blocage :</b> '+esc(d.cause)+'</p>':"")+(d.dem?'<p class="small"><b>Ce qu\'il faudrait :</b> '+esc(d.dem)+'</p>':"")+
   '<p class="small muted">Ouvert le '+esc(G.dayLabel(d.ne||S.day))+' · échéance souhaitée le '+esc(G.dayLabel(d.due))+(d.cours?" · en cours : "+esc(d.cours.lab)+" (retour vers le "+esc(G.dayLabel(d.cours.fin))+")":"")+'</p>'+
   (d.suivi&&d.suivi.length?'<p class="small muted">Suivi : '+d.suivi.slice(-4).map(x=>esc(G.dayLabel(x.j))+" — "+esc(x.t)).join(" ; ")+'</p>':"")+
   (A.length?'<div class="choices">'+A.map(([k,l])=>'<button class="btn" data-da="'+k+'"'+(d.cours&&k!=="classer"&&k!=="call"&&k!=="note"?" disabled":"")+'>'+esc(l)+'</button>').join("")+'</div>':'<p class="small">Ce dossier est réglé.</p>'),
   el=>{el.dataset.doss="1";el.querySelectorAll("[data-da]").forEach(b=>b.onclick=()=>DOSS.act(S,id,b.dataset.da))})};

/* ---------- résumé parlé (assistant, « quels sont mes dossiers ») ---------- */
DOSS.summary=function(S){const L=DOSS.open(S).sort((a,b)=>b.urg-a.urg);if(!L.length)return"Aucun dossier ouvert pour l'instant.";
  const u=L.filter(d=>d.urg===3);return"Vous avez "+L.length+" dossier"+(L.length>1?"s":"")+" ouvert"+(L.length>1?"s":"")+(u.length?", dont "+u.length+" urgent"+(u.length>1?"s":""):"")+". "+
   L.slice(0,3).map((d,i)=>(i===0?"En tête : ":"Ensuite : ")+d.t+(DOSS.fmt(d)?" ("+DOSS.fmt(d)+")":"")+" ; blocage : "+d.cause+".").join(" ")+" Ouvrez « Mes dossiers » pour agir."};
DOSS.isAsk=t=>/\b(mes|nos|les) dossiers\b|dossiers? (en cours|urgents?|ouverts?|prioritaires?)|portefeuille|qu est ce que j ai a faire|quoi faire aujourd hui|mes priorites/.test(norm(t));
})();
