/* Données du Cameroun — situation de septembre 2026 (sources : INS, BUCREP, MINFI, ELECAM,
   Conseil constitutionnel, OCHA, Banque mondiale, presse camerounaise). Les chiffres
   régionaux sont des estimations du jeu, le recensement 2026 n'ayant pas encore été publié. */
(function(){
"use strict";
const CM={};

CM.DEBUT={mois:9,annee:2026}; // octobre 2026 (mois 0-based)

CM.NUMS={
  popu:30.36e6,        // habitants (≈30,3 M début 2026, croissance ≈2,6 %/an)
  croissancePop:2.6,
  pib:34800,           // milliards FCFA (dette 15 416 Mds = 44,3 % du PIB, mars 2026)
  croissance:4.3,      // % prévision 2026
  inflation:3.0,
  budget:8816.4,       // loi de finances 2026
  deficit:631,         // milliards FCFA, LF 2026
  dette:15416,         // milliards FCFA, fin mars 2026
  plafondDette:70,     // critère de convergence CEMAC (% du PIB)
  routes:9885,         // km bitumés fin 2025 (≈9,5 % du réseau)
  reseau:104000,       // km de réseau routier total (estimation)
  routesBon:25,        // % du réseau en bon ou moyen état
  elec:68,             // % d'accès à l'électricité (juin 2024)
  pauvrete:37.7,       // % (2022)
  deplaces:1.0e6,      // déplacés internes (NOSO + Extrême-Nord), ordre de grandeur OCHA
  refugies:480000,     // réfugiés (RCA, Nigeria), ordre de grandeur HCR
  inscrits:8.1e6       // électeurs inscrits (présidentielle 2025, ≈)
};

/* Les 10 régions. pop en millions (estimation 2026). seats = sièges de députés.
   communes = nombre de communes (estimation pour un total de 360).
   land = type de paysage 3D. sec/infra/elec = niveau de départ (0-100 / %). */
CM.REGIONS=[
 {id:"EN",n:"Extrême-Nord",chef:"Maroua",pop:5.56,seats:29,communes:47,land:"sahel",sec:24,infra:22,elec:22,turn:58,
  villes:["Maroua","Kousséri","Mokolo","Yagoua","Mora","Kaélé"],marche:"le grand marché de Maroua",village:"Rhumsiki, au pied des pics des monts Mandara",
  enjeux:["securite","eau","ecole"],
  desc:"Région la plus peuplée. Attaques de Boko Haram et de l'ISWAP depuis le Nigeria : 104 tués et 128 enlevés au premier trimestre 2026 selon l'OCHA. Sécheresses, inondations du Logone, forte pauvreté."},
 {id:"NO",n:"Nord",chef:"Garoua",pop:3.49,seats:12,communes:21,land:"savane",sec:42,infra:30,elec:35,turn:60,
  villes:["Garoua","Guider","Figuil","Poli","Tcholliré","Pitoa"],marche:"le grand marché de Garoua",village:"un village peul au bord de la Bénoué",
  enjeux:["securite","routes","emploi"],
  desc:"Savane et vallée de la Bénoué. Coton (SODECOTON), élevage. Enlèvements contre rançon sur les axes routiers. Fief de l'opposant arrivé deuxième en 2025."},
 {id:"AD",n:"Adamaoua",chef:"Ngaoundéré",pop:1.64,seats:10,communes:21,land:"plateau",sec:44,infra:30,elec:40,turn:58,
  villes:["Ngaoundéré","Meiganga","Tibati","Banyo","Tignère"],marche:"le petit marché de Ngaoundéré",village:"un campement d'éleveurs mbororo près de Tibati",
  enjeux:["securite","routes","elevage"],
  desc:"Château d'eau du Cameroun. Élevage bovin, gisement de bauxite de Minim-Martap. Terminus du chemin de fer Transcamerounais. Prises d'otages près de la frontière centrafricaine."},
 {id:"CE",n:"Centre",chef:"Yaoundé",pop:5.89,seats:28,communes:70,land:"ville",sec:70,infra:55,elec:85,turn:62,
  villes:["Yaoundé","Mbalmayo","Obala","Bafia","Nanga-Eboko","Mfou"],marche:"le marché Mokolo de Yaoundé",village:"un village de planteurs de cacao près d'Obala",
  enjeux:["emploi","electricite","eau"],
  desc:"Capitale politique, ville aux sept collines. Siège des institutions : palais de l'Unité, Assemblée nationale, Sénat. Barrage de Nachtigal (420 MW) sur la Sanaga, mis en service en 2025."},
 {id:"LT",n:"Littoral",chef:"Douala",pop:4.47,seats:19,communes:34,land:"port",sec:60,infra:55,elec:88,turn:48,
  villes:["Douala","Édéa","Nkongsamba","Loum","Manjo","Yabassi"],marche:"le marché Mboppi de Douala",village:"le village de pêcheurs de Youpwé",
  enjeux:["emploi","electricite","routes"],
  desc:"Capitale économique. Port de Douala, première place commerciale d'Afrique centrale. Embouteillages sur le pont du Wouri, inondations en saison des pluies, forte opposition urbaine."},
 {id:"OU",n:"Ouest",chef:"Bafoussam",pop:2.51,seats:25,communes:40,land:"hauts",sec:66,infra:45,elec:70,turn:55,
  villes:["Bafoussam","Dschang","Foumban","Mbouda","Bangangté","Bandjoun"],marche:"le marché A de Bafoussam",village:"la chefferie de Bandjoun",
  enjeux:["emploi","routes","corruption"],
  desc:"Hauts plateaux fertiles, chefferies bamiléké et royaume bamoun. Grenier maraîcher du pays, commerçants entreprenants, bastion historique de l'opposition."},
 {id:"NW",n:"Nord-Ouest",chef:"Bamenda",pop:2.40,seats:20,communes:34,land:"grassfields",sec:14,infra:30,elec:55,turn:22,
  villes:["Bamenda","Kumbo","Wum","Ndop","Nkambé","Bafut"],marche:"le Main Market de Bamenda",village:"le palais du Fon de Bafut",
  enjeux:["paix","federalisme","ecole"],
  desc:"Région anglophone. Conflit armé entre séparatistes et forces de défense depuis 2017 : écoles fermées, villages brûlés, « villes mortes ». Statut spécial depuis 2019."},
 {id:"SW",n:"Sud-Ouest",chef:"Buea",pop:1.96,seats:15,communes:31,land:"volcan",sec:22,infra:35,elec:60,turn:30,
  villes:["Buea","Limbé","Kumba","Tiko","Mamfe","Idenau"],marche:"le Main Market de Kumba",village:"un camp de la CDC dans les bananeraies",
  enjeux:["paix","federalisme","emploi"],
  desc:"Région anglophone au pied du mont Cameroun (4 040 m). Plantations de la CDC, raffinerie de la SONARA à Limbé, pétrole offshore. Conflit armé et enlèvements."},
 {id:"ES",n:"Est",chef:"Bertoua",pop:1.42,seats:11,communes:33,land:"foret",sec:46,infra:20,elec:35,turn:60,
  villes:["Bertoua","Batouri","Abong-Mbang","Yokadouma","Garoua-Boulaï","Lomié"],marche:"le marché central de Bertoua",village:"un campement baka près de Lomié",
  enjeux:["routes","electricite","sante"],
  desc:"Grande forêt équatoriale. Exploitation forestière, orpaillage, réfugiés centrafricains. Routes en terre rouge souvent impraticables en saison des pluies."},
 {id:"SU",n:"Sud",chef:"Ebolowa",pop:0.98,seats:11,communes:29,land:"cote",sec:74,infra:40,elec:60,turn:70,
  villes:["Ebolowa","Kribi","Sangmélima","Ambam","Campo","Lolodorf"],marche:"le marché d'Ebolowa",village:"les chutes de la Lobé près de Kribi",
  enjeux:["emploi","routes","sante"],
  desc:"Forêt, cacao et plages de Kribi. Port en eau profonde de Kribi, barrage de Memve'ele. Bastion historique du parti au pouvoir."}
];
CM.REG=Object.fromEntries(CM.REGIONS.map(r=>[r.id,r]));

/* Partis politiques réels. Sièges à l'Assemblée : 10e législature (élue en 2020, mandat prorogé). */
CM.PARTIS={
  RDPC:{n:"RDPC",long:"Rassemblement démocratique du peuple camerounais",c:"#1d8a4a",an:152,pouvoir:true},
  FSNC:{n:"FSNC",long:"Front pour le salut national du Cameroun",c:"#e3a21a",an:3},
  MRC: {n:"MRC", long:"Mouvement pour la renaissance du Cameroun",c:"#d84a3a",an:0},
  PCRN:{n:"PCRN",long:"Parti camerounais pour la réconciliation nationale",c:"#3b82d6",an:5},
  SDF: {n:"SDF", long:"Social Democratic Front",c:"#17a3a3",an:5},
  UNDP:{n:"UNDP",long:"Union nationale pour la démocratie et le progrès",c:"#9b59b6",an:7},
  UDC: {n:"UDC", long:"Union démocratique du Cameroun",c:"#e0762b",an:4},
  AUT: {n:"Autres",long:"Autres partis (MDR, UMS…)",c:"#8a8f98",an:4}
};
CM.ORDRE=["RDPC","FSNC","MRC","PCRN","SDF","UNDP","UDC"];

/* Intentions de vote de départ par région (estimation du jeu, inspirée des tendances
   des scrutins 2020-2025 ; pas un résultat officiel). Ordre : CM.ORDRE */
CM.SOUTIEN={
 EN:[52,34,2,3,1,7,1], NO:[42,46,2,3,1,5,1], AD:[55,30,3,3,1,7,1],
 CE:[68,13,7,8,2,1,1], LT:[37,29,17,11,4,1,1], OU:[44,18,21,5,3,1,8],
 NW:[55,14,5,5,19,1,1], SW:[55,19,8,7,9,1,1], ES:[72,14,4,6,2,1,1], SU:[86,5,3,4,1,.5,.5]
};

/* Présidentielle du 12 octobre 2025, résultats proclamés par le Conseil constitutionnel le 27 octobre 2025. */
CM.PRESIDENTIELLE_2025=[["Paul Biya (RDPC)",53.66],["Issa Tchiroma Bakary (FSNC)",35.19],["Cabral Libii (PCRN)",3.41],["Bello Bouba Maïgari (UNDP)",2.45],["Tomaïno Ndam Njoya (UDC)",1.66],["Joshua Osih (SDF)",1.21],["Autres",2.42]];

/* Calendrier électoral (mois depuis octobre 2026). */
CM.CALENDRIER=[
 {id:"leg",m:4,t:"Législatives et municipales",d:"Mandats des députés et des conseillers municipaux élus en février 2020, prorogés jusqu'en février 2027."},
 {id:"reg",m:6,t:"Régionales",d:"Renouvellement des conseils régionaux créés en 2020 (élus par les conseillers municipaux et les chefs traditionnels)."},
 {id:"sen",m:17,t:"Sénatoriales",d:"70 sénateurs élus au suffrage indirect par les conseillers municipaux et régionaux ; 30 nommés par le président."},
 {id:"pres",m:72,t:"Présidentielle",d:"Scrutin majoritaire à un tour, mandat de 7 ans (art. 6 de la Constitution)."}
];

/* Textes applicables dans le jeu. */
CM.LOIS=[
 {r:"Constitution, art. 6",t:"Élection du président",x:"Le président de la République est élu au suffrage universel direct, au scrutin majoritaire à un tour, pour un mandat de 7 ans. Depuis la révision de 2008, il est rééligible sans limite.",jeu:"Présidentielle en octobre 2032. Le candidat arrivé en tête gagne, même sans majorité absolue."},
 {r:"Révision du 4 avril 2026",t:"Vice-président",x:"Le Congrès a créé le poste de vice-président de la République (200 voix pour, 18 contre). Il est nommé et révoqué par le président. En cas de vacance, il achève le mandat en cours, à la place de l'intérim du président du Sénat.",jeu:"Le président peut nommer un vice-président. En cas de vacance, pas d'élection anticipée."},
 {r:"Constitution, art. 8",t:"Pouvoirs du président",x:"Le président nomme le Premier ministre et les membres du gouvernement, promulgue les lois, exerce le droit de grâce, peut dissoudre l'Assemblée nationale après consultation, et saisit le Conseil constitutionnel.",jeu:"Actions « Remanier », « Grâce présidentielle » et « Dissoudre l'Assemblée »."},
 {r:"Constitution, art. 9",t:"État d'urgence et état d'exception",x:"Le président peut proclamer par décret l'état d'urgence, qui lui confère des pouvoirs spéciaux, et en cas de péril grave l'état d'exception.",jeu:"Action « État d'urgence » dans une région : plus de sécurité, moins de libertés, réactions internationales."},
 {r:"Constitution, art. 14 et 15",t:"Parlement",x:"Le Parlement comprend l'Assemblée nationale (180 députés, mandat de 5 ans) et le Sénat (100 sénateurs : 70 élus au suffrage indirect et 30 nommés par le président, mandat de 5 ans). Le mandat peut être prorogé par une loi.",jeu:"Sans majorité à l'Assemblée, vos réformes peuvent être rejetées. Les reports d'élection coûtent en légitimité."},
 {r:"Constitution, art. 36",t:"Référendum",x:"Le président peut soumettre au référendum tout projet de réforme qui, bien que relevant du domaine de la loi, serait susceptible d'avoir des répercussions profondes sur l'avenir de la Nation et les institutions.",jeu:"Action « Référendum » : fédéralisme, limitation des mandats…"},
 {r:"Constitution, art. 55",t:"Décentralisation",x:"Les collectivités territoriales décentralisées sont les régions et les communes. Le Code général des CTD (2019) accorde un statut spécial aux régions du Nord-Ouest et du Sud-Ouest.",jeu:"360 communes et 10 conseils régionaux à conquérir."},
 {r:"Constitution, art. 66",t:"Déclaration des biens",x:"Le président, les membres du gouvernement, les parlementaires et les hauts responsables doivent déclarer leurs biens et avoirs au début et à la fin de leur mandat. Cette disposition n'a jamais été appliquée.",jeu:"Dossier « Corruption » : l'appliquer enfin."},
 {r:"Code électoral (loi n° 2012/001)",t:"Candidature à la présidentielle",x:"Être Camerounais d'origine, avoir au moins 35 ans, jouir de ses droits civiques, résider au Cameroun depuis 12 mois, être investi par un parti ou présenter 300 signatures, et verser une caution de 30 millions de FCFA au Trésor.",jeu:"Il faut 35 ans et 30 millions FCFA pour se présenter."},
 {r:"Code électoral, législatives",t:"Mode de scrutin des députés",x:"Scrutin mixte à un tour : dans chaque circonscription, une liste qui obtient la majorité absolue remporte tous les sièges. Sinon, la liste arrivée en tête reçoit la moitié des sièges et le reste est réparti à la proportionnelle entre les listes ayant au moins 5 %.",jeu:"Règle appliquée circonscription par circonscription dans le jeu."},
 {r:"Code électoral, art. 170 (modifié en mars 2026)",t:"Prorogation des mandats locaux",x:"Le mandat des conseillers municipaux peut être prorogé « en cas de nécessité », sans plafond de durée depuis la réforme de mars 2026. Décret n° 2026/166 : mandats prorogés jusqu'au 28 février 2027.",jeu:"Le président peut encore reporter les élections locales, au prix de sa légitimité."},
 {r:"ELECAM et Conseil constitutionnel",t:"Organisation et contentieux",x:"Elections Cameroon (ELECAM) organise les scrutins. Le Conseil constitutionnel statue sur le contentieux et proclame les résultats de la présidentielle, des législatives et des sénatoriales.",jeu:"Les résultats sont proclamés quelques jours après chaque scrutin."}
];

/* Thèmes de campagne et leurs effets selon les enjeux régionaux. */
CM.THEMES={
  securite:{n:"Sécurité",m:"Ramener la paix et protéger nos familles contre les terroristes et les preneurs d'otages"},
  paix:{n:"Paix et dialogue",m:"Mettre fin à la guerre dans nos régions anglophones par un vrai dialogue"},
  federalisme:{n:"Fédéralisme",m:"Rendre le pouvoir aux régions, avec une vraie autonomie"},
  emploi:{n:"Emploi des jeunes",m:"Donner un travail digne à chaque jeune diplômé qui aujourd'hui pousse une moto ou part à l'étranger"},
  electricite:{n:"Électricité",m:"En finir avec les délestages : la lumière dans chaque maison"},
  routes:{n:"Routes",m:"Bitumer nos routes pour que nos produits arrivent enfin au marché"},
  eau:{n:"Eau potable",m:"De l'eau potable dans chaque quartier et chaque village"},
  corruption:{n:"Lutte contre la corruption",m:"Rendre à l'État l'argent volé et appliquer enfin l'article 66"},
  ecole:{n:"École",m:"Rouvrir les écoles fermées et payer nos enseignants à temps"},
  sante:{n:"Santé",m:"Un centre de santé équipé à moins d'une heure de chaque village"},
  elevage:{n:"Élevage et agriculture",m:"Protéger nos éleveurs et nos agriculteurs, régler les conflits fonciers"}
};

/* Dossiers du président. e = effets sur les jauges ; n = effets chiffrés
   (dette en milliards FCFA, routes en km, elec en points) ; reg = soutien au parti
   présidentiel par région ; loi = nécessite une majorité à l'Assemblée ; lieu = région du décor 3D. */
CM.DOSSIERS=[
 {id:"noso",lieu:"NW",f:"Ministre de l'Administration territoriale",t:"Crise dans le Nord-Ouest et le Sud-Ouest",x:"Nouvelles attaques près de Bamenda : 23 civils tués à Wowo et Gidado. Les séparatistes imposent des « villes mortes » chaque lundi. Plus de 700 000 personnes ont fui depuis 2017.",c:[
  {t:"Ouvrir un dialogue direct avec les chefs séparatistes, avec une médiation internationale",e:{int:6,sec:[-4,7],soc:5,pop:[-3,4]},reg:{NW:6,SW:6},h:"Dialogue historique avec les séparatistes"},
  {t:"Lancer une offensive militaire d'envergure",e:{sec:[-3,8],int:-5,soc:-4},n:{dette:60},reg:{NW:-5,SW:-5},h:"Offensive militaire dans les régions anglophones"},
  {t:"Appliquer pleinement le statut spécial : budgets et pouvoirs réels aux régions",e:{soc:4,sec:2,int:3},n:{dette:80},reg:{NW:4,SW:4},loi:1,h:"Le statut spécial enfin appliqué"}]},
 {id:"bh",lieu:"EN",f:"Ministre délégué à la Défense",t:"Boko Haram dans l'Extrême-Nord",x:"Un poste du Bataillon d'intervention rapide a été attaqué à Vreket, dans la commune de Koza. Depuis janvier, au moins 177 personnes ont été enlevées dans la région.",c:[
  {t:"Renforcer le BIR et la Force multinationale mixte du lac Tchad",e:{sec:7,int:3},n:{dette:70},reg:{EN:3},h:"Renforts massifs dans l'Extrême-Nord"},
  {t:"Armer et financer les comités de vigilance",e:{sec:3,soc:-2},n:{dette:15},h:"Les comités de vigilance en première ligne"},
  {t:"Programme de désarmement, réinsertion et reconstruction des écoles",e:{soc:4,sec:2,int:2},n:{dette:40},reg:{EN:4},h:"Un plan de réinsertion pour les ex-combattants"}]},
 {id:"otages",lieu:"AD",f:"Délégué général à la Sûreté nationale",t:"Prises d'otages dans l'Adamaoua et l'Est",x:"Des éleveurs et des commerçants sont enlevés contre rançon sur les routes de Meiganga et de Garoua-Boulaï. Les familles vendent leurs bœufs pour payer.",c:[
  {t:"Créer une unité spéciale anti-enlèvements",e:{sec:5},n:{dette:25},reg:{AD:3,ES:2,NO:2},h:"Une unité spéciale contre les ravisseurs"},
  {t:"Coopération militaire avec la Centrafrique",e:{sec:3,int:3},reg:{ES:2},h:"Patrouilles conjointes à la frontière"},
  {t:"Laisser les autorités locales gérer",e:{sec:-4,pop:-2},reg:{AD:-3,NO:-2},h:"Les éleveurs se sentent abandonnés"}]},
 {id:"eneo",lieu:"LT",f:"Ministre de l'Eau et de l'Énergie",t:"Délestages : la colère monte",x:"Malgré les 420 MW de Nachtigal, les quartiers de Douala et Yaoundé restent 6 à 8 heures par jour sans courant. L'État a racheté 51 % d'ENEO en 2025, mais le réseau est vétuste.",c:[
  {t:"Centrales thermiques d'urgence",e:{infra:3,eco:2,pop:2},n:{dette:120,elec:1},h:"Des centrales d'urgence contre les délestages"},
  {t:"Grandes lignes de transport depuis Nachtigal",e:{infra:6,eco:3},n:{dette:220,elec:3},h:"Nouvelles lignes haute tension"},
  {t:"Solaire dans les villages et les villes moyennes",e:{infra:3,soc:3},n:{dette:90,elec:4},reg:{EN:2,NO:2,ES:2},h:"Le solaire gagne les villages"}]},
 {id:"autoroute",lieu:"CE",f:"Ministre des Travaux publics",t:"Autoroute Yaoundé-Douala",x:"La phase 1 (60 km) est ouverte. Les Chinois proposent de financer la phase 2 jusqu'à Douala. Sur la vieille N3, les accidents font des morts chaque semaine.",c:[
  {t:"Lancer la phase 2 avec un prêt chinois",e:{infra:7,eco:3,int:1},n:{dette:450,routes:140},reg:{CE:2,LT:3},h:"Feu vert pour la phase 2 de l'autoroute"},
  {t:"Réhabiliter la N3 existante",e:{infra:3,sec:2},n:{dette:110,routes:60},h:"La N3 réhabilitée"},
  {t:"Reporter faute de moyens",e:{infra:-3,pop:-2},h:"L'autoroute attendra"}]},
 {id:"nord_route",lieu:"NO",f:"Ministre des Travaux publics",t:"La route du Grand Nord",x:"Entre Ngaoundéré et Garoua, les camions du corridor Douala-N'Djamena roulent sur une route défoncée. Les commerçants du Nord se disent oubliés.",c:[
  {t:"Réhabiliter l'axe Ngaoundéré-Garoua-Maroua",e:{infra:6,eco:3},n:{dette:200,routes:120},reg:{NO:5,AD:3,EN:3},h:"Grands travaux sur la route du Nord"},
  {t:"Réparer seulement les nids-de-poule",e:{infra:1},n:{dette:30},reg:{NO:-1},h:"Du rafistolage sur la route du Nord"},
  {t:"Concéder la route à un opérateur privé avec péage",e:{infra:4,eco:2,pop:-2},n:{dette:40,routes:80},h:"Un péage sur la route du Nord"}]},
 {id:"carburant",lieu:"LT",f:"Ministre des Finances",t:"Subvention du carburant",x:"Le soutien au prix du super et du gasoil coûte des centaines de milliards chaque année. Le FMI demande sa suppression. Les mototaxis menacent de paralyser les villes.",c:[
  {t:"Supprimer la subvention d'un coup",e:{eco:4,pop:-9,soc:-7,sec:-2},n:{dette:-220},h:"Le prix du carburant s'envole"},
  {t:"Hausse progressive sur trois ans",e:{eco:1,pop:-3,soc:-2},n:{dette:-80},h:"Carburant : une hausse par étapes"},
  {t:"Maintenir la subvention",e:{pop:2,int:-2},n:{dette:160},h:"Le carburant reste subventionné"}]},
 {id:"ots",lieu:"CE",f:"Ministre de l'Éducation de base",t:"Grève des enseignants",x:"Le mouvement « On a trop supporté » paralyse les écoles. Des milliers d'enseignants attendent depuis des années leur intégration et leurs rappels de salaire.",c:[
  {t:"Payer les arriérés et intégrer les enseignants",e:{soc:6,pop:3},n:{dette:95},h:"Les enseignants obtiennent gain de cause"},
  {t:"Menacer de sanctions les grévistes",e:{soc:-6,pop:-4},h:"Bras de fer avec les enseignants"},
  {t:"Calendrier d'apurement négocié",e:{soc:2},n:{dette:30},h:"Un accord de sortie de crise"}]},
 {id:"art66",lieu:"CE",f:"Président de la CONAC",t:"Corruption et article 66",x:"Un rapport de la Commission nationale anti-corruption chiffre à des centaines de milliards les détournements. L'article 66 sur la déclaration des biens n'a jamais été appliqué.",c:[
  {t:"Appliquer enfin l'article 66 et publier les déclarations",e:{pop:6,int:4,eco:1},reg:{CE:-2,SU:-2},h:"Les ministres doivent déclarer leurs biens"},
  {t:"Relancer l'opération Épervier contre quelques grosses têtes",e:{pop:4,soc:1},h:"Nouvelles arrestations dans l'opération Épervier"},
  {t:"Enterrer le rapport",e:{pop:-4,int:-3},h:"Le rapport de la CONAC oublié dans un tiroir"}]},
 {id:"detenus",lieu:"CE",f:"Ministre de la Justice",t:"Détenus de l'après-présidentielle",x:"Des centaines de manifestants arrêtés après la présidentielle d'octobre 2025 sont toujours en détention. Les ONG et plusieurs chancelleries demandent leur libération.",c:[
  {t:"Grâce présidentielle et libération",e:{int:6,soc:4,pop:3,sec:-1},reg:{NO:4,LT:3},h:"Des centaines de détenus libérés"},
  {t:"Jugement devant les tribunaux militaires",e:{int:-6,soc:-4,sec:2},reg:{NO:-3,LT:-3},h:"Procès devant le tribunal militaire"},
  {t:"Amnistie générale et appel à la réconciliation",e:{int:5,soc:5,pop:[-2,5]},loi:1,h:"Une loi d'amnistie pour tourner la page"}]},
 {id:"russie",lieu:"CE",f:"Ministre des Relations extérieures",t:"Des jeunes Camerounais au front en Ukraine",x:"Le Cameroun est l'un des pays africains les plus touchés par le recrutement de jeunes hommes envoyés combattre pour la Russie. Des familles réclament des nouvelles.",c:[
  {t:"Démanteler les filières et rapatrier les jeunes",e:{int:4,soc:3,pop:3},n:{dette:10},h:"Les filières de recrutement démantelées"},
  {t:"Protestation diplomatique discrète",e:{int:1},h:"Une note diplomatique discrète"},
  {t:"Ne rien dire",e:{soc:-3,pop:-3},h:"Silence du gouvernement, colère des familles"}]},
 {id:"cacao",lieu:"SU",f:"Ministre du Commerce",t:"Prix du cacao et du café",x:"Le cours mondial du cacao reste élevé mais les planteurs de la Lékié et du Sud disent ne pas en profiter, à cause des intermédiaires.",c:[
  {t:"Prix plancher garanti aux planteurs",e:{soc:4,pop:3},n:{dette:40},reg:{CE:2,SU:3,SW:2,LT:1},h:"Un prix garanti pour les planteurs"},
  {t:"Usines de transformation locale",e:{eco:5},n:{dette:70},h:"Le chocolat « made in Cameroon »"},
  {t:"Laisser faire le marché",e:{eco:1,soc:-2},h:"Les planteurs livrés aux intermédiaires"}]},
 {id:"double",lieu:"LT",f:"Ministre des Relations extérieures",t:"La double nationalité",x:"La loi de 1968 interdit la double nationalité. La diaspora, qui envoie des centaines de milliards chaque année, réclame une réforme.",c:[
  {t:"Autoriser la double nationalité",e:{int:4,eco:3,pop:2},loi:1,h:"La double nationalité autorisée"},
  {t:"Créer une carte de la diaspora sans changer la loi",e:{int:1,eco:1},h:"Une carte pour la diaspora"},
  {t:"Maintenir l'interdiction",e:{pop:-1,int:-1},h:"Pas de double nationalité"}]},
 {id:"foncier",lieu:"AD",f:"Ministre des Domaines",t:"Conflits entre éleveurs et agriculteurs",x:"Des troupeaux ont ravagé des champs près de Tibati. Des affrontements ont fait plusieurs morts. Les chefs traditionnels demandent l'arbitrage de l'État.",c:[
  {t:"Commissions foncières et couloirs de transhumance",e:{soc:3,sec:3},n:{dette:20},reg:{AD:3,NO:2,NW:1},h:"Des couloirs de transhumance délimités"},
  {t:"Expulser les éleveurs sans titre",e:{sec:1,soc:-5},reg:{AD:-4},h:"Expulsions d'éleveurs mbororo"},
  {t:"Laisser les chefs trancher",e:{soc:-1},h:"Les chefferies en arbitres"}]},
 {id:"foret",lieu:"ES",f:"Ministre des Forêts",t:"Bois illégal dans l'Est",x:"Des ONG révèlent un vaste trafic de grumes exportées sans taxes. Les Baka dénoncent la destruction de leur forêt.",c:[
  {t:"Interdire l'export de grumes et contrôler la filière",e:{int:4,eco:-2,soc:2},reg:{ES:2},h:"Fin de l'export de grumes"},
  {t:"Taxer davantage la filière bois",e:{eco:1},n:{dette:-40},h:"Le bois rapporte plus à l'État"},
  {t:"Ne rien changer",e:{int:-3},h:"Le pillage de la forêt continue"}]},
 {id:"mines",lieu:"AD",f:"Ministre des Mines",t:"Bauxite de Minim-Martap",x:"Un consortium propose d'exploiter l'un des plus grands gisements de bauxite au monde, dans l'Adamaoua, avec un chemin de fer jusqu'à Kribi.",c:[
  {t:"Signer la convention minière",e:{eco:6,int:2,soc:-1},n:{dette:-120},reg:{AD:3},h:"La bauxite de Minim-Martap enfin exploitée"},
  {t:"Exiger une raffinerie d'alumine au Cameroun",e:{eco:3,int:-1},reg:{AD:2},h:"Le Cameroun pose ses conditions"},
  {t:"Renégocier encore",e:{eco:-1},h:"La bauxite attendra"}]},
 {id:"camwater",lieu:"CE",f:"Ministre de l'Eau",t:"Pénurie d'eau à Yaoundé",x:"Des quartiers entiers de Yaoundé n'ont pas vu couler l'eau du robinet depuis des semaines. Les files d'attente s'allongent devant les puits.",c:[
  {t:"Forages d'urgence et camions-citernes",e:{soc:3,pop:2},n:{dette:40},reg:{CE:2},h:"Des forages d'urgence à Yaoundé"},
  {t:"Achever le projet d'eau potable de la Sanaga",e:{infra:5,soc:2},n:{dette:150},reg:{CE:3},h:"L'eau de la Sanaga arrive à Yaoundé"},
  {t:"Accuser la CAMWATER",e:{pop:-2},h:"La CAMWATER en accusée"}]},
 {id:"fmi",lieu:"CE",f:"Ministre des Finances",t:"Nouveau programme avec le FMI",x:"Le besoin de financement 2026 atteint 3 104 milliards FCFA. Le FMI propose un nouveau programme, avec des réformes exigeantes.",c:[
  {t:"Signer le programme et ses conditions",e:{int:5,eco:2,soc:-4,pop:-2},n:{dette:-150},h:"Accord avec le FMI"},
  {t:"Émettre un eurobond sur les marchés",e:{eco:3,infra:2,int:-1},n:{dette:320},h:"Le Cameroun emprunte sur les marchés"},
  {t:"Payer d'abord la dette intérieure des PME",e:{eco:5,soc:2},n:{dette:180},h:"Les PME enfin payées"}]},
 {id:"csu",lieu:"ES",f:"Ministre de la Santé",t:"Couverture santé universelle",x:"Dans l'Est, des femmes accouchent encore sans sage-femme. La première phase de la couverture santé universelle attend son financement.",c:[
  {t:"Lancer la CSU dans tout le pays",e:{soc:7,pop:4},n:{dette:160},h:"La couverture santé universelle est lancée"},
  {t:"Phase pilote dans trois régions",e:{soc:3},n:{dette:45},reg:{ES:2,EN:2,AD:2},h:"Une CSU pilote"},
  {t:"Reporter",e:{soc:-3},h:"La CSU reportée"}]},
 {id:"motos",lieu:"LT",f:"Ministre des Transports",t:"Les mototaxis",x:"Les « bendskins » transportent des millions de personnes mais causent de nombreux accidents. Le gouverneur du Littoral veut les interdire au centre-ville de Douala.",c:[
  {t:"Interdire les motos au centre-ville",e:{sec:2,soc:-5,pop:-4},reg:{LT:-4},h:"Les mototaxis bannis du centre de Douala"},
  {t:"Immatriculer et former les conducteurs",e:{sec:2,soc:2},n:{dette:10},h:"Un permis pour les bendskinneurs"},
  {t:"Des bus à Douala et Yaoundé",e:{infra:4,soc:2},n:{dette:120},reg:{LT:2,CE:2},h:"De nouveaux bus urbains"}]},
 {id:"vie_chere",lieu:"CE",f:"Ministre du Commerce",t:"Vie chère",x:"Le prix du sac de riz, de l'huile et du ciment a encore augmenté. Les ménagères de Mokolo et Mboppi n'en peuvent plus.",c:[
  {t:"Supprimer les taxes sur les produits de première nécessité",e:{pop:5,soc:3},n:{dette:70},h:"Moins de taxes sur le riz et l'huile"},
  {t:"Contrôler les prix sur les marchés",e:{pop:2,eco:-2},h:"Des brigades de contrôle des prix"},
  {t:"Augmenter la production locale de riz et de maïs",e:{eco:3,soc:1},n:{dette:50},reg:{NO:2,EN:2},h:"Un plan pour produire local"}]},
 {id:"code_elec",lieu:"CE",f:"Directeur général d'ELECAM",t:"Réforme du Code électoral",x:"L'opposition et les observateurs réclament un bulletin unique, un fichier électoral assaini et l'abaissement de l'âge de vote de 20 à 18 ans.",c:[
  {t:"Bulletin unique, fichier audité et vote à 18 ans",e:{int:7,pop:5},integrite:20,loi:1,h:"Une réforme électorale saluée"},
  {t:"Réforme minimale",e:{int:1},integrite:5,h:"Une réforme a minima"},
  {t:"Rien ne change",e:{int:-3,pop:-2},h:"Le Code électoral inchangé"}]},
 {id:"vp",lieu:"CE",f:"Secrétaire général de la présidence",t:"Nommer un vice-président",x:"La révision constitutionnelle d'avril 2026 a créé le poste de vice-président, nommé par le chef de l'État. En cas de vacance, il achèverait le mandat.",unique:1,c:[
  {t:"Un technocrate respecté",e:{int:3,eco:2},h:"Un technocrate nommé vice-président"},
  {t:"Un anglophone, en signe d'unité",e:{soc:4,pop:2},reg:{NW:4,SW:4},h:"Un vice-président anglophone"},
  {t:"Un fidèle du parti",e:{pop:-3,int:-2},h:"Un fidèle du sérail nommé vice-président"}]},
 {id:"refugies",lieu:"ES",f:"Ministre de l'Administration territoriale",t:"Réfugiés à l'Est",x:"Environ 480 000 réfugiés venus de Centrafrique et du Nigeria vivent au Cameroun. Les communes d'accueil manquent d'eau et d'écoles.",c:[
  {t:"Plan conjoint avec le HCR pour les communes d'accueil",e:{int:4,soc:2},n:{dette:15},reg:{ES:2},h:"Les communes d'accueil soutenues"},
  {t:"Fermer la frontière",e:{sec:2,int:-5},h:"Frontière fermée avec la Centrafrique"},
  {t:"Statu quo",e:{soc:-2},h:"Les camps débordent"}]},
 {id:"inondations",lieu:"EN",f:"Ministre de l'Administration territoriale",t:"Inondations dans le Logone",x:"Le fleuve Logone a débordé. Des dizaines de milliers de sinistrés près de Kousséri et Yagoua, des digues rompues.",c:[
  {t:"Aide d'urgence et reconstruction des digues",e:{soc:4,pop:3,infra:2},n:{dette:60},reg:{EN:4},h:"Les sinistrés du Logone secourus"},
  {t:"Appel à l'aide internationale",e:{int:3,soc:2},reg:{EN:1},h:"Appel à l'aide pour l'Extrême-Nord"},
  {t:"Aide symbolique",e:{soc:-3},reg:{EN:-4},h:"Les sinistrés se sentent oubliés"}]},
 {id:"fecafoot",lieu:"CE",f:"Ministre des Sports",t:"Conflit à la FECAFOOT",x:"Le ministère et la Fédération se disputent la gestion des Lions indomptables avant les éliminatoires de la CAN 2027.",c:[
  {t:"Laisser la Fédération gérer",e:{int:2,pop:[-2,3]},h:"La FECAFOOT garde la main"},
  {t:"Imposer le choix du ministère",e:{pop:[-3,4],int:-2},h:"Le ministère reprend les Lions"},
  {t:"Réconcilier les deux camps",e:{pop:2},h:"Paix des braves dans le football"}]},
 {id:"kribi",lieu:"SU",f:"Ministre des Transports",t:"Port de Kribi phase 2",x:"Le port en eau profonde de Kribi veut doubler ses capacités. Des pêcheurs de la côte craignent pour leurs villages.",c:[
  {t:"Lancer l'extension avec un opérateur international",e:{eco:5,int:2,soc:-1},n:{dette:120},reg:{SU:2},h:"Kribi voit plus grand"},
  {t:"Extension plus modeste et indemnisation des pêcheurs",e:{eco:2,soc:2},n:{dette:60},reg:{SU:3},h:"Un port qui protège les pêcheurs"},
  {t:"Reporter",e:{eco:-2},h:"Le port attendra"}]},
 {id:"cyber",lieu:"LT",f:"Ministre des Postes et Télécommunications",t:"Coupure d'Internet ?",x:"Des appels à manifester circulent sur les réseaux sociaux depuis l'étranger. Les services de sécurité proposent de couper Internet.",c:[
  {t:"Couper Internet quelques jours",e:{sec:3,eco:-4,int:-5,pop:-4},h:"Internet coupé, l'économie à l'arrêt"},
  {t:"Laisser Internet ouvert et répondre sur les réseaux",e:{pop:1,int:2,sec:[-3,1]},h:"Le gouvernement répond sur les réseaux"},
  {t:"Poursuivre les auteurs de fausses nouvelles",e:{sec:1,int:-2},h:"Des poursuites pour fausses nouvelles"}]},
 {id:"univ",lieu:"OU",f:"Ministre de l'Enseignement supérieur",t:"Universités surpeuplées",x:"À Dschang et Yaoundé I, des étudiants suivent les cours debout dans les couloirs. Les enseignants du supérieur menacent de faire grève.",c:[
  {t:"Construire de nouveaux amphithéâtres et recruter",e:{soc:4,pop:2},n:{dette:80},reg:{OU:2,CE:1},h:"Des milliers de places en plus à l'université"},
  {t:"Développer les formations professionnelles",e:{eco:3,soc:2},n:{dette:50},h:"Priorité aux métiers"},
  {t:"Ne rien faire",e:{soc:-3},h:"Les étudiants dans la rue"}]},
 {id:"cholera",lieu:"LT",f:"Ministre de la Santé",t:"Choléra à Douala",x:"Une épidémie de choléra se propage dans les quartiers inondables de Douala. Les hôpitaux manquent de lits.",c:[
  {t:"Campagne de vaccination et d'assainissement",e:{soc:4,sec:1},n:{dette:25},reg:{LT:2},h:"Vaccination massive contre le choléra"},
  {t:"Interdire les rassemblements",e:{sec:1,pop:-2,eco:-1},h:"Rassemblements interdits à Douala"},
  {t:"Minimiser l'épidémie",e:{soc:-5,pop:-3},h:"Le choléra fait des ravages"}]},
 {id:"agri_ouest",lieu:"OU",f:"Ministre de l'Agriculture",t:"Les maraîchers de l'Ouest",x:"Les tomates pourrissent au bord des routes impraticables entre Dschang et Foumbot. Les maraîchers réclament des pistes rurales.",c:[
  {t:"Programme de pistes rurales",e:{infra:4,eco:2},n:{dette:70,routes:40},reg:{OU:4},h:"Des pistes pour les maraîchers"},
  {t:"Chambres froides et marchés de gros",e:{eco:3},n:{dette:40},reg:{OU:2},h:"Des chambres froides à Bafoussam"},
  {t:"Ne rien faire",e:{eco:-1},reg:{OU:-3},h:"Les tomates pourrissent"}]},
 {id:"pm",lieu:"CE",f:"Secrétaire général de la présidence",t:"Remaniement ministériel",x:"Certains ministres sont en poste depuis plus de quinze ans. La presse réclame un gouvernement plus jeune.",c:[
  {t:"Gouvernement resserré et rajeuni",e:{pop:[0,7],eco:1},h:"Un gouvernement rajeuni"},
  {t:"Ouvrir le gouvernement à l'opposition",e:{pop:3,soc:3,int:2},h:"Un gouvernement d'union"},
  {t:"Ne rien changer",e:{pop:-3},h:"Toujours les mêmes ministres"}]}
];

/* Événements aléatoires (mode président et opposant). */
CM.EVENEMENTS=[
 {h:"Les Lions indomptables qualifiés pour la CAN 2027",x:"Liesse dans les rues de Yaoundé et Douala.",e:{pop:4,soc:2}},
 {h:"Attaque séparatiste près de Kumbo",x:"Des soldats et des civils tués.",e:{sec:-4},reg:{NW:-1},lieu:"NW"},
 {h:"Attaque de Boko Haram près de Mora",x:"Un village pillé, des habitants enlevés.",e:{sec:-4,pop:-1},lieu:"EN"},
 {h:"Glissement de terrain à Yaoundé",x:"Un quartier bâti sur une colline s'effondre après des pluies diluviennes.",e:{soc:-3,pop:-1},lieu:"CE"},
 {h:"Accident de car sur la N3",x:"Encore un drame sur la route Yaoundé-Douala.",e:{infra:-1,pop:-1},lieu:"LT"},
 {h:"Hausse du cours du cacao",x:"Les recettes d'exportation progressent.",e:{eco:3},n:{dette:-30}},
 {h:"Délestage géant",x:"Une panne du réseau interconnecté plonge le Sud dans le noir.",e:{infra:-3,pop:-2}},
 {h:"Découverte d'un gisement de gaz au large de Kribi",x:"Les réserves pourraient doubler.",e:{eco:4,int:1},lieu:"SU"},
 {h:"Grève des transporteurs",x:"Taxis et mototaxis paralysent Douala.",e:{eco:-2,pop:-1},lieu:"LT"},
 {h:"Rapport accablant d'une ONG sur les droits humains",x:"Plusieurs chancelleries s'inquiètent.",e:{int:-4}},
 {h:"Excellente saison agricole dans l'Ouest",x:"Les marchés débordent de produits.",e:{eco:2,soc:1},lieu:"OU"},
 {h:"Pluies record dans l'Extrême-Nord",x:"Les récoltes de mil sont menacées.",e:{soc:-2},lieu:"EN"},
 {h:"Visite d'un chef d'État européen",x:"Des accords de coopération signés.",e:{int:4,eco:1}},
 {h:"Évasion à la prison de Kondengui",x:"Plusieurs détenus dangereux en fuite.",e:{sec:-3},lieu:"CE"},
 {h:"Le mont Cameroun gronde",x:"Des secousses ressenties à Buea. Les volcanologues surveillent.",e:{sec:-1},lieu:"SW"},
 {h:"Des camions de la CEMAC bloqués à la frontière",x:"Le corridor vers le Tchad est à l'arrêt.",e:{eco:-2,int:-1},lieu:"NO"}
];

/* Événements propres au mode opposant. */
CM.EV_OPP=[
 {h:"Meeting interdit par le sous-préfet",x:"Motif invoqué : « risque de trouble à l'ordre public ».",o:{noto:2,sympa:-1}},
 {h:"Des militants arrêtés",x:"Une dizaine de vos militants sont gardés à vue.",o:{noto:3,militants:-300,risque:6}},
 {h:"Un cadre du parti rejoint le pouvoir",x:"Il obtient un poste de directeur général.",o:{noto:-3,militants:-500}},
 {h:"La diaspora se mobilise",x:"Une collecte en ligne depuis Paris, Bruxelles et Houston.",o:{fonds:25,noto:2}},
 {h:"Un chef traditionnel vous soutient",x:"Le ralliement fait la une des journaux.",o:{sympa:3,militants:800}},
 {h:"Votre vidéo devient virale",x:"Des millions de vues sur TikTok et Facebook.",o:{noto:6}},
 {h:"Campagne de dénigrement",x:"Des médias proches du pouvoir vous accusent de « tribalisme ».",o:{noto:1,sympa:-2}},
 {h:"Un syndicat appelle à voter pour vous",x:"Les enseignants se rapprochent de votre parti.",o:{militants:1200,sympa:2}}
];

/* Actions de l'opposant. */
CM.ACTIONS_OPP=[
 {id:"meeting",n:"Meeting",d:"Grand rassemblement dans le chef-lieu. Fort impact, mais peut être interdit.",cout:12,scene:"meeting",gain:4,noto:3,mil:900,risque:4},
 {id:"marche",n:"Tournée des marchés",d:"Serrer des mains, écouter les commerçants.",cout:3,scene:"marche",gain:2.2,noto:1,mil:400,risque:1},
 {id:"village",n:"Tournée des villages",d:"Rencontrer chefs et paysans dans l'arrière-pays.",cout:4,scene:"village",gain:2.6,noto:1,mil:500,risque:1},
 {id:"medias",n:"Médias et réseaux sociaux",d:"Émissions de radio, vidéos, lives. Effet national.",cout:5,scene:null,gain:.8,national:1,noto:4,mil:300,risque:1},
 {id:"fonds",n:"Collecte de fonds",d:"Cotisations, dîners, diaspora.",cout:0,scene:null,gain:0,noto:0,mil:0,fonds:18,risque:0},
 {id:"scrutateurs",n:"Former des scrutateurs",d:"Des représentants dans les bureaux de vote pour protéger vos voix.",cout:8,scene:null,gain:0,noto:1,mil:200,surv:12,risque:0},
 {id:"marche_pac",n:"Marche pacifique",d:"Grande mobilisation dans la rue. Très visible, très risqué.",cout:6,scene:"meeting",gain:3,noto:8,mil:1500,risque:14},
 {id:"alliance",n:"Proposer une coalition",d:"S'allier avec un autre parti d'opposition.",cout:2,scene:null,gain:0,noto:2,mil:0,alliance:1,risque:0}
];

window.CM=CM;
})();
