/* L'État camerounais : budget 2026 par ministère, hiérarchie gouvernementale, fiscalité, salaires,
   ressources minières et énergétiques, partenaires internationaux, défense, transports, justice.
   est:1 = montant estimé par le jeu (le détail officiel n'était pas accessible). */
(function(){
"use strict";
const E={};

/* ---------- Budget 2026 (loi n° 2025/012 du 17 décembre 2025) ---------- */
E.BUDGET={total:8816.4,recettesInternes:5887.0,fiscales:3446.2,douanieres:1243.2,petrole:523.7,nonFiscales:400.0,dons:73.8,
  personnel:1625.4,investissement:2026.3,interets:532.5,amortissement:1870.6,arrieres:498.8,besoinFinancement:3104.2,recrutements:15};

/* s = jauge influencée ; k = force de l'effet ; cat = pôle gouvernemental */
E.MINISTERES=[
 {id:"MINDEF",n:"Défense",b:389.3,s:"sec",k:1.2,cat:"Souveraineté",rang:"Ministre délégué à la Présidence chargé de la Défense"},
 {id:"DGSN",n:"Sûreté nationale (police)",b:145,est:1,s:"sec",k:.8,cat:"Souveraineté",rang:"Délégué général"},
 {id:"MINJUSTICE",n:"Justice",b:70,est:1,s:"soc",k:.4,cat:"Souveraineté",rang:"Ministre d'État"},
 {id:"MINREX",n:"Relations extérieures",b:45,est:1,s:"int",k:.8,cat:"Souveraineté"},
 {id:"MINATD",n:"Administration territoriale",b:60,est:1,s:"sec",k:.3,cat:"Souveraineté"},
 {id:"MINDDEVEL",n:"Décentralisation et Développement local",b:60,est:1,s:"soc",k:.3,cat:"Souveraineté"},
 {id:"MINFI",n:"Finances",b:180,est:1,s:"eco",k:.5,cat:"Économie"},
 {id:"MINEPAT",n:"Économie, Planification et Aménagement du territoire",b:356.3,s:"eco",k:.7,cat:"Économie"},
 {id:"MINCOMMERCE",n:"Commerce",b:12,est:1,s:"eco",k:.2,cat:"Économie"},
 {id:"MINMIDT",n:"Mines, Industrie et Développement technologique",b:30,est:1,s:"eco",k:.4,cat:"Économie"},
 {id:"MINPMEESA",n:"PME, Économie sociale et Artisanat",b:12,est:1,s:"eco",k:.2,cat:"Économie"},
 {id:"MINTOUL",n:"Tourisme et Loisirs",b:10,est:1,s:"eco",k:.1,cat:"Économie"},
 {id:"MINTP",n:"Travaux publics",b:652.0,s:"infra",k:1.2,cat:"Infrastructures"},
 {id:"MINEE",n:"Eau et Énergie",b:425.7,s:"infra",k:1.0,cat:"Infrastructures"},
 {id:"MINHDU",n:"Habitat et Développement urbain",b:180,est:1,s:"infra",k:.5,cat:"Infrastructures"},
 {id:"MINT",n:"Transports",b:45,est:1,s:"infra",k:.3,cat:"Infrastructures"},
 {id:"MINPOSTEL",n:"Postes et Télécommunications",b:40,est:1,s:"eco",k:.3,cat:"Infrastructures"},
 {id:"MINDCAF",n:"Domaines, Cadastre et Affaires foncières",b:15,est:1,s:"soc",k:.1,cat:"Infrastructures"},
 {id:"MINESEC",n:"Enseignements secondaires",b:595.2,s:"soc",k:.9,cat:"Social"},
 {id:"MINEDUB",n:"Éducation de base",b:334.3,s:"soc",k:.8,cat:"Social"},
 {id:"MINESUP",n:"Enseignement supérieur",b:80,est:1,s:"soc",k:.4,cat:"Social",rang:"Ministre d'État"},
 {id:"MINSANTE",n:"Santé publique",b:388.9,s:"soc",k:1.0,cat:"Social"},
 {id:"MINEFOP",n:"Emploi et Formation professionnelle",b:35,est:1,s:"eco",k:.3,cat:"Social"},
 {id:"MINTSS",n:"Travail et Sécurité sociale",b:10,est:1,s:"soc",k:.1,cat:"Social"},
 {id:"MINAS",n:"Affaires sociales",b:15,est:1,s:"soc",k:.2,cat:"Social"},
 {id:"MINPROFF",n:"Promotion de la Femme et de la Famille",b:10,est:1,s:"soc",k:.2,cat:"Social"},
 {id:"MINJEC",n:"Jeunesse et Éducation civique",b:25,est:1,s:"pop",k:.2,cat:"Social"},
 {id:"MINSEP",n:"Sports et Éducation physique",b:35,est:1,s:"pop",k:.2,cat:"Social"},
 {id:"MINAC",n:"Arts et Culture",b:8,est:1,s:"pop",k:.1,cat:"Social"},
 {id:"MINCOM",n:"Communication",b:8.2,s:"pop",k:.2,cat:"Social"},
 {id:"MINADER",n:"Agriculture et Développement rural",b:120,est:1,s:"eco",k:.6,cat:"Production"},
 {id:"MINEPIA",n:"Élevage, Pêches et Industries animales",b:45,est:1,s:"eco",k:.3,cat:"Production"},
 {id:"MINFOF",n:"Forêts et Faune",b:25,est:1,s:"int",k:.2,cat:"Production"},
 {id:"MINEPDED",n:"Environnement et Développement durable",b:12,est:1,s:"int",k:.1,cat:"Production"},
 {id:"MINRESI",n:"Recherche scientifique et Innovation",b:15,est:1,s:"eco",k:.1,cat:"Production"},
 {id:"MINFOPRA",n:"Fonction publique et Réforme administrative",b:15,est:1,s:"soc",k:.2,cat:"Administration"},
 {id:"MINMAP",n:"Marchés publics",b:12,est:1,s:"infra",k:.2,cat:"Administration"},
 {id:"MINCONSUPE",n:"Contrôle supérieur de l'État",b:8,est:1,s:"eco",k:.2,cat:"Administration"}
];
E.INSTITUTIONS=[["Présidence de la République",60],["Services du Premier ministre",30],["Assemblée nationale",35],["Sénat",22],["Conseil constitutionnel",5],["ELECAM",12]];

/* Hiérarchie gouvernementale (structure en vigueur) */
E.HIERARCHIE=[
 {r:"Président de la République",d:"Chef de l'État, chef des armées. Définit la politique de la Nation (art. 5 et 8)."},
 {r:"Vice-président de la République",d:"Poste créé par la révision du 4 avril 2026. Nommé et révoqué par le président ; achève le mandat en cas de vacance."},
 {r:"Secrétaire général de la Présidence",d:"Rang de ministre d'État. Coordonne les services de la Présidence."},
 {r:"Premier ministre, chef du gouvernement",d:"Anime et coordonne l'action du gouvernement (art. 12). Joseph Dion Ngute depuis janvier 2019."},
 {r:"Vice-Premier ministre",d:"Rang protocolaire au-dessus des ministres d'État."},
 {r:"Ministres d'État",d:"Portefeuilles stratégiques (Justice, Enseignement supérieur…)."},
 {r:"Ministres",d:"Une trentaine de départements ministériels."},
 {r:"Ministres délégués",d:"Auprès du président (Défense), du MINREX (Commonwealth, monde islamique), du MINFI, du MINEPAT, du MINJUSTICE."},
 {r:"Secrétaires d'État",d:"Auprès de la Défense (Gendarmerie, Anciens combattants), de l'Éducation de base, de la Santé, des Travaux publics…"},
 {r:"Gouverneurs, préfets, sous-préfets",d:"Représentants de l'État dans les 10 régions, 58 départements et 360 arrondissements."}
];
E.DELEGUES=[["Ministre délégué auprès du MINREX chargé du Commonwealth","int"],["Ministre délégué auprès du MINREX chargé de la Coopération avec le monde islamique","int"],["Ministre délégué auprès du MINFI","eco"],["Ministre délégué auprès du MINEPAT","eco"],["Ministre délégué auprès du MINJUSTICE","soc"],["Secrétaire d'État à la Défense chargé de la Gendarmerie","sec"],["Secrétaire d'État à la Défense chargé des Anciens combattants","sec"],["Secrétaire d'État auprès du MINEDUB","soc"],["Secrétaire d'État auprès du MINSANTE chargé des Épidémies","soc"],["Secrétaire d'État auprès du MINTP chargé des Routes","infra"]];

/* ---------- Fiscalité et salaires ---------- */
E.FISCAL=[
 {id:"tva",n:"TVA (centimes additionnels compris)",v:19.25,min:10,max:25,step:.25,u:" %",rev:73,pop:-1.2,eco:-.3,d:"17,5 % + 10 % de centimes additionnels communaux."},
 {id:"is",n:"Impôt sur les sociétés (régime réel)",v:33,min:20,max:40,step:1,u:" %",rev:18,pop:0,eco:-.8,d:"30 % + 10 % de centimes additionnels."},
 {id:"irpp",n:"IRPP, tranche supérieure",v:35,min:20,max:45,step:1,u:" %",rev:11,pop:-.4,eco:-.2,d:"Barème progressif, abattement de 500 000 FCFA."},
 {id:"douane",n:"Droits de douane (tarif extérieur commun CEMAC, taux moyen)",v:18,min:5,max:30,step:1,u:" %",rev:45,pop:-.6,eco:-.4,d:"Tarif harmonisé en zone CEMAC."}
];
E.SALAIRES={smigPrive:60000,smigAgricole:45000,smigEtat:43969,
  recrues:[{id:"ens",n:"Enseignants",lot:2000,cout:4.3,s:"soc",e:1.2},{id:"med",n:"Médecins et infirmiers",lot:1000,cout:3.6,s:"soc",e:1.1},{id:"pol",n:"Policiers",lot:1500,cout:2.8,s:"sec",e:.9},{id:"sol",n:"Soldats (dont BIR)",lot:1000,cout:2.4,s:"sec",e:1.1}]};

/* ---------- Ressources naturelles (état 2026) ---------- */
E.MINES=[
 {id:"minim",n:"Bauxite de Minim-Martap",reg:"AD",res:"Bauxite",st:"demarrage",v:1.1,d:"Parmi les plus grands gisements de bauxite au monde. Projet prioritaire inauguré en 2025, premières opérations."},
 {id:"lobe",n:"Fer de Kribi-Lobé",reg:"SU",res:"Fer",st:"developpement",v:.9,d:"Projet prioritaire lancé en 2025, près du port de Kribi."},
 {id:"zambi",n:"Fer de Bipindi-Grand Zambi",reg:"SU",res:"Fer",st:"developpement",v:.8,d:"Projet prioritaire lancé en 2025."},
 {id:"mbalam",n:"Fer de Mbalam",reg:"ES",res:"Fer",st:"inexploite",v:1.4,d:"Gisement transfrontalier avec Nabeba (Congo). Projet ferroviaire vers Kribi toujours en négociation."},
 {id:"mamelles",n:"Fer des Mamelles",reg:"SU",res:"Fer",st:"inexploite",v:.5,d:"Gisement côtier près de Kribi, en exploration."},
 {id:"nkamouna",n:"Cobalt-nickel-manganèse de Nkamouna",reg:"ES",res:"Cobalt, nickel, manganèse",st:"inexploite",v:1.3,d:"Environ 121 millions de tonnes. L'appel de la SONAMINES de janvier 2026 a été déclaré infructueux."},
 {id:"rutile",n:"Rutile d'Akonolinga",reg:"CE",res:"Rutile (titane)",st:"inexploite",v:.6,d:"Le pays détiendrait près de 3 Mt de rutile, dont 500 000 t à Akonolinga. Appel infructueux en 2026."},
 {id:"colomine",n:"Or de Colomine",reg:"ES",res:"Or",st:"developpement",v:.5,d:"Projet prioritaire lancé en 2025 (semi-mécanisé)."},
 {id:"betare",n:"Or de Bétaré-Oya et Batouri",reg:"ES",res:"Or",st:"artisanal",v:.4,d:"Orpaillage artisanal et semi-mécanisé, souvent illégal, dégâts environnementaux."},
 {id:"mobilong",n:"Diamant de Mobilong",reg:"ES",res:"Diamant",st:"artisanal",v:.3,d:"Près de Yokadouma. Exploitation artisanale après l'échec d'un projet industriel controversé."},
 {id:"bidzar",n:"Marbre de Bidzar et Biou Sud",reg:"NO",res:"Marbre",st:"developpement",v:.2,d:"Projet prioritaire lancé en 2025."},
 {id:"figuil",n:"Calcaire de Figuil",reg:"NO",res:"Calcaire",st:"exploite",v:.2,d:"Alimente la cimenterie de Figuil."},
 {id:"kitongo",n:"Uranium de Kitongo et Teubang",reg:"NO",res:"Uranium",st:"inexploite",v:.4,d:"Gisements explorés, non exploités."},
 {id:"rdr",n:"Pétrole du bassin du Rio del Rey",reg:"SW",res:"Pétrole",st:"exploite",v:2.2,d:"Principal bassin, en déclin. Production nationale : 19,3 millions de barils en 2025 (≈ 54 200 b/j), 43 800 b/j attendus en 2028."},
 {id:"kribicampo",n:"Pétrole et gaz Douala/Kribi-Campo",reg:"LT",res:"Pétrole, gaz",st:"exploite",v:1.0,d:"Blocs Etinde, Tilapia, Elombo et Ntem attribués en négociation en avril 2026."},
 {id:"flng",n:"Gaz de Sanaga Sud (FLNG Hilli Episeyo)",reg:"SU",res:"Gaz naturel liquéfié",st:"exploite",v:.9,d:"Seule unité d'export de GNL, au large de Kribi depuis 2018. Départ prévu en 2027."},
 {id:"logbaba",n:"Gaz de Logbaba",reg:"LT",res:"Gaz",st:"exploite",v:.2,d:"Gisement terrestre qui alimente des industriels de Douala."},
 {id:"nachtigal",n:"Barrage de Nachtigal",reg:"CE",res:"Hydroélectricité 420 MW",st:"exploite",v:0,d:"En service complet depuis mars 2025, environ 30 % de la capacité nationale."},
 {id:"lompangar",n:"Barrage de Lom Pangar",reg:"ES",res:"Réservoir régulateur",st:"exploite",v:0,d:"Régule la Sanaga pour les centrales en aval."},
 {id:"memveele",n:"Barrage de Memve'ele",reg:"SU",res:"Hydroélectricité 211 MW",st:"exploite",v:0,d:"Mis en service en 2019, lignes d'évacuation longtemps incomplètes."},
 {id:"forets",n:"Forêts de l'Est et du Sud",reg:"ES",res:"Bois",st:"exploite",v:.6,d:"Exploitation forestière industrielle et illégale."}
];
E.MINE_ST={exploite:["Exploité","ok"],demarrage:["Démarrage","ok"],developpement:["En développement","warn"],artisanal:["Artisanal","warn"],inexploite:["Non exploité","bad"],nationalise:["SONAMINES","ok"]};

/* ---------- Transports ---------- */
E.TRANSPORTS=[
 {id:"pad",n:"Port autonome de Douala",t:"port",reg:"LT",etat:55,d:"Premier port d'Afrique centrale, dessert le Tchad et la Centrafrique. Congestion et tirant d'eau limité."},
 {id:"pak",n:"Port autonome de Kribi",t:"port",reg:"SU",etat:70,d:"Port en eau profonde construit avec la Chine, terminal à conteneurs."},
 {id:"limbe",n:"Port de Limbé",t:"port",reg:"SW",etat:40,d:"Port pétrolier et de pêche."},
 {id:"garoua",n:"Port fluvial de Garoua",t:"port",reg:"NO",etat:20,d:"Sur la Bénoué, navigable quelques mois par an."},
 {id:"camrail",n:"Transcamerounais (Camrail)",t:"rail",reg:"CE",etat:45,d:"Douala-Yaoundé-Ngaoundéré. Concession privée. Accident d'Eséka en 2016."},
 {id:"camairco",n:"Camair-Co",t:"air",reg:"LT",etat:25,d:"Compagnie aérienne nationale, flotte réduite et dettes."},
 {id:"aeroports",n:"Aéroports de Douala, Nsimalen, Garoua et Maroua",t:"air",reg:"CE",etat:50,d:"Quatre aéroports internationaux."}
];

/* ---------- Défense et renseignement ---------- */
E.DEFENSE={effectifs:40000,bir:5000,budget:389.3,
 theatres:[
  {id:"EN",n:"Extrême-Nord",op:"Opération Alpha (BIR) et Émergence 4, Force multinationale mixte",need:30,base:30},
  {id:"NW",n:"Nord-Ouest",op:"Commandement opérationnel du Nord-Ouest",need:22,base:22},
  {id:"SW",n:"Sud-Ouest",op:"Commandement opérationnel du Sud-Ouest",need:18,base:18},
  {id:"AD",n:"Frontière RCA (Est et Adamaoua)",op:"Secteurs frontaliers, lutte contre les preneurs d'otages",need:12,base:10},
  {id:"LT",n:"Golfe de Guinée (Bakassi, côtes)",op:"Marine nationale, lutte contre la piraterie",need:8,base:8},
  {id:"RES",n:"Réserve et garnisons",op:"Garde présidentielle, casernes, formation",need:0,base:12}
 ],
 equipements:[{id:"drones",n:"Drones de surveillance",cout:45,sec:4},{id:"blindes",n:"Véhicules blindés",cout:60,sec:4},{id:"helico",n:"Hélicoptères de transport",cout:90,sec:5},{id:"patrouilleurs",n:"Patrouilleurs côtiers",cout:70,sec:3,reg:"LT"}],
 formations:["École militaire interarmées (EMIA) de Yaoundé","École d'état-major","Centres d'instruction du BIR"]
};
E.ESPIONNAGE=[
 {id:"sep",n:"Surveiller les réseaux séparatistes à l'étranger",d:"Financements venus de la diaspora, trafics d'armes via le Nigeria.",ok:.6,gain:{sec:4},reg:{NW:5,SW:5},risk:{int:-3}},
 {id:"bh",n:"Infiltrer les réseaux de Boko Haram et de l'ISWAP",d:"Sources humaines autour du lac Tchad.",ok:.5,gain:{sec:5},reg:{EN:6},risk:{sec:-2}},
 {id:"contre",n:"Contre-espionnage dans les ambassades",d:"Détecter les agents étrangers à Yaoundé.",ok:.65,gain:{int:2,sec:2},risk:{int:-4}},
 {id:"otages",n:"Démanteler les réseaux de preneurs d'otages",d:"Écoutes et informateurs sur les axes de l'Adamaoua.",ok:.55,gain:{sec:3},reg:{AD:6,ES:4},risk:{soc:-1}},
 {id:"opp",n:"Surveiller l'opposition",d:"Écoutes de dirigeants politiques. Illégal et dangereux si révélé.",ok:.7,gain:{sec:1},risk:{int:-8,pop:-6},scandale:1}
];

/* ---------- Relations internationales (niveau de départ 0-100) ---------- */
E.PAYS=[
 {id:"CN",n:"Chine",rel:72,d:"Premier créancier bilatéral. Port de Kribi, barrage de Memve'ele, autoroute Yaoundé-Douala. Accord sur l'IA signé en juillet 2026, visite de la présidente d'Eximbank de Chine en septembre 2026.",atout:"Prêts pour les grands chantiers"},
 {id:"FR",n:"France",rel:58,d:"Ancienne puissance coloniale, coopération militaire et économique, forte diaspora. Relations plus distantes depuis quelques années.",atout:"Coopération militaire et formation"},
 {id:"US",n:"États-Unis",rel:45,d:"Aide militaire réduite en 2019 pour atteintes aux droits humains. Partenaire contre le terrorisme au lac Tchad.",atout:"Renseignement antiterroriste"},
 {id:"NG",n:"Nigeria",rel:48,d:"Grand voisin. Bakassi rétrocédée en 2008 après l'arrêt de la CIJ. L'opposant arrivé deuxième en 2025 s'y est réfugié. Partenaire de la Force multinationale mixte.",atout:"Sécurité de l'Extrême-Nord et frontière anglophone"},
 {id:"TD",n:"Tchad",rel:66,d:"Corridor Douala-N'Djamena, oléoduc Tchad-Cameroun vers Kribi, Force multinationale mixte.",atout:"Transit et revenus de l'oléoduc"},
 {id:"CF",n:"Centrafrique",rel:55,d:"Corridor Douala-Bangui, réfugiés, groupes armés à la frontière Est.",atout:"Sécurité de la frontière Est"},
 {id:"GQ",n:"Guinée équatoriale",rel:48,d:"Frontière de Kyé-Ossi, tensions sur la circulation des personnes, projet de mur frontalier.",atout:"Commerce transfrontalier"},
 {id:"GA",n:"Gabon",rel:58,d:"Voisin CEMAC, commerce frontalier.",atout:"Intégration régionale"},
 {id:"CG",n:"Congo",rel:58,d:"Partenaire du projet de fer Mbalam-Nabeba.",atout:"Projet Mbalam-Nabeba"},
 {id:"DE",n:"Allemagne",rel:60,d:"Ancienne puissance coloniale. Six crânes de chefs exécutés en 1905 rapatriés en juillet 2026.",atout:"Coopération au développement"},
 {id:"GB",n:"Royaume-Uni",rel:55,d:"Le Cameroun est membre du Commonwealth depuis 1995. Regard attentif sur la crise anglophone.",atout:"Commonwealth et médiation anglophone"},
 {id:"RU",n:"Russie",rel:50,d:"Accord de coopération militaire en 2022. Recrutement controversé de jeunes Camerounais pour le front ukrainien.",atout:"Armement"},
 {id:"TR",n:"Turquie",rel:58,d:"Entreprises de BTP très présentes, Turkish Airlines, coopération croissante.",atout:"Entreprises de BTP"},
 {id:"IL",n:"Israël",rel:60,d:"Équipe et forme le Bataillon d'intervention rapide.",atout:"Formation du BIR"},
 {id:"EU",n:"Union européenne",rel:55,d:"Partenaire commercial (accord de partenariat économique), aide au développement, exigences sur les droits humains.",atout:"Aide et commerce"},
 {id:"FMI",n:"FMI",rel:55,d:"Le Cameroun a conclu des programmes FEC/MEC ; nouveau programme en discussion.",atout:"Financement budgétaire sous conditions"},
 {id:"BM",n:"Banque mondiale",rel:60,d:"Financement de l'électricité, de l'éducation et de la santé.",atout:"Projets sociaux et énergie"},
 {id:"UA",n:"Union africaine",rel:60,d:"Missions d'observation électorale, architecture de paix.",atout:"Médiation"},
 {id:"CEMAC",n:"CEMAC",rel:66,d:"Monnaie commune (FCFA, BEAC à Yaoundé), critère de dette de 70 % du PIB.",atout:"Stabilité monétaire"}
];
E.DIPLO_ACTIONS=[
 {id:"visite",n:"Visite officielle",d:"Resserrer les liens.",rel:8,cout:3,int:1},
 {id:"accord",n:"Signer un accord de coopération",d:"Commerce, investissement ou sécurité.",rel:5,cout:2,eco:2},
 {id:"pret",n:"Demander un financement",d:"Prêt ou aide budgétaire.",rel:-3,dette:250,cout:0},
 {id:"militaire",n:"Coopération militaire",d:"Formation, renseignement, équipement.",rel:4,cout:5,sec:3},
 {id:"proteste",n:"Protester officiellement",d:"Convoquer l'ambassadeur.",rel:-10,cout:0,pop:2},
 {id:"expulse",n:"Expulser des diplomates",d:"Réponse forte à une ingérence.",rel:-22,cout:0,pop:3,int:-3}
];

/* ---------- Justice ---------- */
E.TRIBUNAUX={regional:"tribunal de grande instance",special:"Tribunal criminel spécial (détournements de plus de 50 millions FCFA)",militaire:"tribunal militaire",supreme:"Cour suprême"};
E.LOIS_PARTI=[
 {id:"meeting",n:"Tenir un meeting public",ok:1,x:"Loi n° 90/055 du 19 décembre 1990 : une réunion publique est libre mais doit être déclarée au sous-préfet au moins trois jours francs à l'avance. Le sous-préfet peut l'interdire en cas de menace grave pour l'ordre public ; l'interdiction peut être contestée en justice."},
 {id:"marche",n:"Organiser une marche sur la voie publique",ok:1,x:"Loi n° 90/055 : les manifestations sur la voie publique sont soumises à déclaration préalable auprès du sous-préfet au moins sept jours francs avant. En pratique, beaucoup sont interdites et des participants ont été poursuivis sur la base de la loi antiterroriste de 2014. Risque élevé."},
 {id:"cotisation",n:"Lever une cotisation auprès des militants",ok:1,x:"Loi n° 90/056 du 19 décembre 1990 et loi n° 2000/015 : les partis se financent par les cotisations de leurs membres, la vente de cartes, les dons et legs de membres ou de personnes établies au Cameroun. Légal, à condition d'en tenir la comptabilité."},
 {id:"etranger",n:"Recevoir de l'argent d'un État ou d'une organisation étrangère",ok:0,x:"Interdit : le financement des partis par des puissances, organisations ou États étrangers est totalement prohibé. Sanction possible : suspension ou dissolution du parti. Les dons de Camerounais de la diaspora membres du parti restent possibles."},
 {id:"diaspora",n:"Recevoir des dons de militants de la diaspora",ok:1,x:"Possible si les donateurs sont membres du parti. Il faut tracer les fonds pour éviter l'accusation de financement étranger."},
 {id:"candidature",n:"Me présenter à la présidentielle",ok:2,x:"Code électoral : être Camerounais d'origine, avoir au moins 35 ans, résider au Cameroun depuis 12 mois, être investi par un parti, verser une caution de 30 millions FCFA au Trésor public."},
 {id:"boycott",n:"Appeler au boycott d'un scrutin",ok:1,x:"Légal : aucun texte n'oblige un parti à participer. Mais l'abstention prive le parti d'élus et de financement public, qui dépend des résultats électoraux."},
 {id:"recours",n:"Contester des résultats devant le Conseil constitutionnel",ok:1,x:"Le Conseil constitutionnel statue sur le contentieux de la présidentielle, des législatives, des sénatoriales et des référendums. Les recours doivent être déposés dans des délais très courts après la clôture du scrutin."},
 {id:"alliance",n:"Former une coalition avec d'autres partis",ok:1,x:"Libre. Chaque parti garde son existence légale ; une candidature commune doit être investie par un parti."},
 {id:"milice",n:"Créer un service d'ordre armé",ok:0,x:"Interdit : les partis ne peuvent pas avoir d'organisation paramilitaire. Un service d'ordre non armé et déclaré est toléré."}
];

/* ---------- Experts, noms, entreprises ---------- */
E.DOMAINES=[
 {id:"droit",n:"Juriste",role:"Conseiller juridique"},{id:"eco",n:"Économiste",role:"Conseiller économique"},{id:"strat",n:"Politologue",role:"Stratège électoral"},
 {id:"com",n:"Communicant",role:"Porte-parole"},{id:"sec",n:"Expert sécurité et défense",role:"Conseiller sécurité"},{id:"diplo",n:"Diplomate",role:"Relations internationales"},
 {id:"sante",n:"Médecin de santé publique",role:"Santé"},{id:"edu",n:"Expert en éducation",role:"Éducation et formation"},{id:"btp",n:"Ingénieur en travaux publics",role:"Infrastructures"},
 {id:"agri",n:"Agronome",role:"Agriculture et élevage"},{id:"mines",n:"Ingénieur des mines et de l'énergie",role:"Mines et énergie"},{id:"fin",n:"Expert en finances publiques",role:"Trésorier"}
];
E.BUREAU=["Président du parti","Secrétaire général","Trésorier","Porte-parole","Secrétaire à la mobilisation","Conseiller juridique","Chargé des élections"];
E.PRENOMS_F=["Marie","Aïssatou","Chantal","Brenda","Clarisse","Joëlle","Esther","Fadimatou","Solange","Mireille","Rosine","Célestine","Divine","Nadège","Ruth","Hadjara","Hélène","Pauline","Florence","Grâce","Bernadette","Hawaou","Laure","Sandrine","Nathalie","Béatrice","Ramatou","Yvette","Estelle","Madeleine"];
E.PRENOMS_M=["Jean-Paul","Hamidou","Emmanuel","Blaise","Hervé","Yannick","Samuel","Ibrahim","Patrice","Achille","Désiré","Oumarou","Eric","Christian","Moussa","Joseph","Paul","Alain","Issa","Daniel","Martin","Félix","Bouba","Serge","Thierry","Roger","Célestin","Aboubakar","Gilbert","Charles"];
E.PRENOMS=E.PRENOMS_F.concat(E.PRENOMS_M);
E.NOMS={EN:["Hamadou","Abba","Mahamat","Bouba","Djibrilla","Mana"],NO:["Aboubakar","Oumarou","Adamou","Babba","Sali"],AD:["Mohaman","Yaya","Bello","Issa","Hayatou"],CE:["Mbarga","Essomba","Atangana","Ondoa","Nkodo","Owona","Ateba"],LT:["Ekwalla","Moukoko","Ngando","Ebongue","Din","Bell"],OU:["Fotso","Kamga","Tchoupo","Kenfack","Djoumessi","Nana","Njoya"],NW:["Ngwa","Nfor","Achu","Mbah","Fru","Tamfu"],SW:["Tabi","Ayuk","Enow","Ebai","Mokake","Agbor"],ES:["Mboula","Doumba","Ngoe","Bindzi","Yondo"],SU:["Mvondo","Ela","Obam","Nkoulou","Ze","Abessolo"]};
E.ENTREPRISES={
 local:[["Wouri Construction","Douala",62],["Ets Nkodo & Fils","Yaoundé",48],["Sahel BTP","Maroua",55],["Grassfields Engineering","Bamenda",58],["Bafoussam Travaux","Bafoussam",66],["Sanaga Génie civil","Édéa",60],["Diaspora Engineering Group","Douala et Houston",74]],
 inter:[["Sinotech Infra","Chine",72],["Anatolia Yapı","Turquie",70],["Atlantique BTP","France",78],["Lusitana Obras","Portugal",68],["Lagos Heavy Works","Nigeria",57],["Kasai Mining Services","Afrique du Sud",66],["Nordic Energy Partners","Norvège",80]]
};
E.PROJETS=[
 {id:"forage",n:"Forage d'eau potable",s:"eau",cout:.03,mois:2,eff:{soc:.3},mood:4,small:1},
 {id:"classes",n:"Bloc de 6 salles de classe",s:"ecole",cout:.06,mois:4,eff:{soc:.4},mood:4,small:1},
 {id:"csi",n:"Centre de santé intégré",s:"sante",cout:.15,mois:6,eff:{soc:.6},mood:5,small:1},
 {id:"marche",n:"Marché municipal",s:"emploi",cout:.4,mois:8,eff:{eco:.6},mood:5,small:1},
 {id:"eclairage",n:"Éclairage public solaire",s:"electricite",cout:.25,mois:4,eff:{sec:.4,infra:.3},mood:4,small:1},
 {id:"hopital",n:"Hôpital régional (200 lits)",s:"sante",cout:25,mois:24,eff:{soc:3},mood:10},
 {id:"lycee",n:"Lycée technique",s:"ecole",cout:6,mois:14,eff:{soc:1.5,eco:.5},mood:7},
 {id:"universite",n:"Campus universitaire",s:"ecole",cout:40,mois:30,eff:{soc:2.5,eco:1},mood:8},
 {id:"route",n:"Route bitumée de 50 km",s:"routes",cout:30,mois:18,eff:{infra:3,eco:1},mood:9,km:50},
 {id:"pont",n:"Pont sur un fleuve",s:"routes",cout:20,mois:20,eff:{infra:2,eco:.8},mood:7,km:5},
 {id:"solaire",n:"Centrale solaire de 30 MW",s:"electricite",cout:25,mois:14,eff:{infra:2},mood:8,elec:1.5},
 {id:"eau",n:"Adduction d'eau pour une ville",s:"eau",cout:18,mois:16,eff:{soc:1.5,infra:1},mood:8},
 {id:"caserne",n:"Base militaire avancée",s:"securite",cout:12,mois:10,eff:{sec:2},mood:6,sec:10},
 {id:"stade",n:"Stade omnisports",s:"emploi",cout:30,mois:24,eff:{pop:2},mood:6},
 {id:"port",n:"Extension de terminal portuaire",s:"emploi",cout:120,mois:36,eff:{eco:4,infra:2},mood:5},
 {id:"video",n:"Système de vidéosurveillance urbaine",s:"securite",cout:.9,mois:6,eff:{sec:1.5},mood:5,sec:6,secteur:"video"},
 {id:"videobat",n:"Vidéosurveillance d'un bâtiment public",s:"securite",cout:.06,mois:2,eff:{sec:.3},mood:2,small:1,secteur:"video"},
 {id:"logiciel",n:"Plateforme numérique de services publics",s:"emploi",cout:.3,mois:5,eff:{eco:.6},mood:3,secteur:"numerique"},
 {id:"kits",n:"Kits solaires pour 50 villages",s:"electricite",cout:.8,mois:6,eff:{infra:.6},mood:6,elec:.3,secteur:"solaire"},
 {id:"formation",n:"Formation de 500 agents publics",s:"ecole",cout:.05,mois:3,eff:{soc:.3},mood:2,small:1,secteur:"formation"},
 {id:"sensib",n:"Campagne de sensibilisation (santé, civisme)",s:"sante",cout:.05,mois:2,eff:{soc:.3},mood:2,small:1,secteur:"com"},
 {id:"etude",n:"Étude de faisabilité et contrôle des travaux",s:"routes",cout:.12,mois:3,eff:{infra:.2},mood:1,small:1,secteur:"conseil"},
 {id:"medic",n:"Fourniture de médicaments et d'équipements médicaux",s:"sante",cout:.5,mois:3,eff:{soc:.8},mood:4,secteur:"sante"},
 {id:"dechets",n:"Collecte et traitement des déchets urbains",s:"eau",cout:.3,mois:6,eff:{soc:.5},mood:4,secteur:"eau"},
 {id:"prison",n:"Extension de prison centrale (+1 500 places)",s:"securite",cout:15,mois:18,eff:{int:1},mood:2,prison:1500}
];
/* secteur d'entreprise concerné par chaque ouvrage (BTP par défaut) */
E.secteurProjet=id=>{const p=E.PROJETS.find(x=>x.id===id);if(p&&p.secteur)return p.secteur;return({forage:"eau",eau:"eau",solaire:"solaire",eclairage:"solaire"})[id]||"btp"};

/* ---------- Secteurs d'activité des entreprises (profil chef d'entreprise) ----------
   services : prestations vendues (montants en millions FCFA, durée en mois).
   staff : [cadres, agents, équipements] ; sal : salaires mensuels (M FCFA) par cadre / agent. */
E.SECTEURS={
 btp:{n:"BTP et génie civil",staff:["Ingénieurs","Ouvriers","Engins"],sal:[.9,.15],eq:45,cap:80,
   services:null,ai:[["Wouri Construction","Douala",62],["Sahel BTP","Maroua",55],["Bafoussam Travaux","Bafoussam",66],["Sinotech Infra","Chine",72],["Anatolia Yapı","Turquie",70]]},
 video:{n:"Vidéosurveillance et sécurité électronique",staff:["Techniciens supérieurs","Installateurs","Kits caméras"],sal:[.6,.12],eq:15,cap:40,
   services:[["Vidéosurveillance d'un bâtiment public",60,2],["Vidéosurveillance urbaine d'un centre-ville",900,6],["Contrôle d'accès et alarmes",40,1],["Maintenance annuelle de caméras",25,12],["Salle de supervision (centre de commandement)",350,4]],
   ai:[["SecurVision Cameroun","Douala",64],["Kmer Sécurité Électronique","Yaoundé",58],["Global Safe Systems","Dubaï",74],["Sentinel Tech","France",78]]},
 solaire:{n:"Énergie solaire",staff:["Ingénieurs électriciens","Techniciens","Stocks de panneaux"],sal:[.8,.13],eq:25,cap:60,
   services:[["Kits solaires pour 50 villages",800,6],["Éclairage public solaire",250,4],["Centrale solaire de 5 MW",4500,10],["Solarisation d'un hôpital",120,2]],
   ai:[["SolarKam","Garoua",60],["Sahel Énergie Verte","Maroua",55],["Nordic Energy Partners","Norvège",80],["Sunmax China","Chine",70]]},
 numerique:{n:"Informatique et numérique",staff:["Ingénieurs logiciel","Techniciens réseau","Serveurs"],sal:[.7,.2],eq:10,cap:40,
   services:[["Plateforme numérique de services publics",300,5],["Site web et application mobile",30,2],["Réseau informatique et fibre d'un bâtiment",120,2],["Audit de cybersécurité",50,1],["Logiciel de gestion (paie, état civil)",150,4]],
   ai:[["Silicon Mountain Labs","Buea",68],["Douala Digital Services","Douala",60],["Afrik Cloud","Abidjan",66],["IndiaSoft Global","Inde",72]]},
 gardiennage:{n:"Gardiennage et sécurité privée",staff:["Chefs de poste","Agents de sécurité","Véhicules"],sal:[.35,.09],eq:20,cap:30,
   services:[["Gardiennage d'un site (1 an)",36,12],["Sécurisation d'un événement",15,1],["Convoyage de fonds (1 an)",120,12]],
   ai:[["Garde Sûre Cameroun","Yaoundé",58],["Vigilance Plus","Douala",55],["G4 Protection Afrique","Afrique du Sud",70]]},
 sante:{n:"Santé (clinique, pharmacie, fournitures médicales)",staff:["Médecins et pharmaciens","Infirmiers","Équipements"],sal:[1.1,.25],eq:40,cap:70,
   services:[["Fourniture de médicaments et d'équipements médicaux",500,3],["Équipement d'un hôpital de district",1200,4],["Campagne de vaccination",80,2],["Consultations en clinique mobile",40,3]],
   ai:[["Pharmacam Distribution","Douala",64],["Clinique de l'Espoir","Yaoundé",60],["MedAfrica Supplies","Kenya",68],["EuroMed Équipements","Belgique",76]]},
 agro:{n:"Agro-industrie et agriculture",staff:["Agronomes","Ouvriers agricoles","Tracteurs"],sal:[.6,.1],eq:30,cap:50,
   services:[["Fourniture de denrées pour les cantines scolaires",100,3],["Aménagement de 100 ha de rizières",600,8],["Chambres froides et stockage",150,3]],
   ai:[["Agro-Sanaga","Édéa",60],["Coopérative des maraîchers de l'Ouest","Bafoussam",55],["Olam Agri Services","Singapour",72]]},
 transport:{n:"Transport et logistique",staff:["Logisticiens","Chauffeurs","Camions"],sal:[.5,.12],eq:35,cap:50,
   services:[["Transport de matériaux de chantier",60,2],["Location de camions (6 mois)",90,6],["Transit et dédouanement d'équipements",40,1]],
   ai:[["Transcam Logistique","Douala",62],["Bollo Transports","Garoua",55],["Maersk Logistics","Danemark",78]]},
 conseil:{n:"Bureau d'études et conseil",staff:["Ingénieurs-conseils","Techniciens","Logiciels"],sal:[1.0,.2],eq:8,cap:30,
   services:[["Étude de faisabilité et contrôle des travaux",120,3],["Audit financier d'une institution",40,1],["Plan de développement communal",60,3]],
   ai:[["Cabinet Ekwalla & Associés","Douala",66],["Sahel Études","Maroua",58],["Atlas Consulting","Maroc",72]]},
 juridique:{n:"Cabinet d'avocats",staff:["Avocats","Juristes et assistants","Bibliothèque juridique"],sal:[1.2,.25],eq:5,cap:25,
   services:[["Assistance juridique pour un contrat public",20,1],["Défense dans un contentieux",35,3],["Conseil en droit minier",60,2]],
   ai:[["Cabinet Ngando & Partners","Douala",68],["Maître Fotso & Associés","Yaoundé",64],["Lex Africa","Afrique du Sud",74]]},
 com:{n:"Communication, médias et événementiel",staff:["Chargés de communication","Techniciens son et image","Matériel vidéo"],sal:[.6,.15],eq:12,cap:30,
   services:[["Campagne de sensibilisation (santé, civisme)",50,2],["Organisation d'un événement officiel",80,1],["Campagne électorale d'un candidat",120,3]],
   ai:[["Kamer Com","Yaoundé",62],["Wouri Events","Douala",58],["Havas Afrique","France",76]]},
 formation:{n:"Formation professionnelle",staff:["Formateurs","Assistants","Salles équipées"],sal:[.5,.12],eq:10,cap:25,
   services:[["Formation de 500 agents publics",50,3],["Formation de jeunes aux métiers du BTP",80,4],["Formation au numérique",40,2]],
   ai:[["Institut Métiers Plus","Douala",60],["Centre de formation de Bamenda","Bamenda",56],["Campus Pro International","France",72]]},
 import:{n:"Import-export et fournitures",staff:["Acheteurs","Magasiniers","Entrepôts"],sal:[.5,.1],eq:30,cap:60,
   services:[["Fourniture de mobilier de bureau",60,2],["Fourniture de véhicules administratifs",300,3],["Fourniture d'équipements informatiques",150,2]],
   ai:[["Ets Nkodo & Fils","Yaoundé",56],["Douala Trading","Douala",60],["Dubaï Supply Co.","Émirats",68]]},
 eau:{n:"Eau et assainissement",staff:["Ingénieurs hydrauliciens","Techniciens","Foreuses"],sal:[.8,.13],eq:40,cap:50,
   services:[["Forage d'eau potable",30,2],["Adduction d'eau pour une ville",18000,16],["Collecte et traitement des déchets urbains",300,6]],
   ai:[["Hydro-Sahel","Maroua",58],["Aqua Cameroun","Douala",62],["Veolia Afrique","France",78]]},
 hotel:{n:"Hôtellerie et restauration",staff:["Cadres hôteliers","Personnel","Chambres"],sal:[.5,.09],eq:20,cap:40,
   services:[["Hébergement d'une délégation officielle",15,1],["Restauration d'un séminaire",10,1],["Organisation d'un sommet (hébergement et salles)",200,1]],
   ai:[["Hôtel des Députés","Yaoundé",60],["Kribi Beach Resort","Kribi",62],["Accor Afrique","France",76]]},
 mines:{n:"Services miniers et pétroliers",staff:["Ingénieurs des mines","Foreurs","Foreuses"],sal:[1.2,.2],eq:90,cap:100,
   services:[["Forage d'exploration minière",500,6],["Étude d'impact environnemental",80,3],["Sous-traitance sur un champ pétrolier",700,6]],
   ai:[["Kasai Mining Services","Afrique du Sud",66],["Camer Minerals SA","Cameroun",58],["Schlumberger Afrique","États-Unis",80]]}
};

E.DIASPORA=[["Ingénieure en ponts et chaussées","Montréal"],["Médecin urgentiste","Paris"],["Économiste à la Banque africaine de développement","Abidjan"],["Ingénieur électricien","Houston"],["Juriste en droit public","Bruxelles"],["Spécialiste des mines","Johannesburg"],["Expert en cybersécurité","Berlin"],["Professeure d'université","Londres"]];


/* ---------- Train de vie de l'État (montants annuels estimés par le jeu, en milliards FCFA) ----------
   Repères réels : le budget des services a été ramené de 563,6 à 487,8 milliards en 2024 (-80 milliards
   sur les biens et services). Directives de la Présidence : limiter comités, missions à l'étranger,
   achats de véhicules et carburant. */
E.TRAIN=[
 {id:"missions",n:"Missions à l'étranger des ministres et hauts cadres",b:60},
 {id:"vehicules",n:"Achat et entretien du parc automobile administratif",b:45},
 {id:"carburant",n:"Carburant des administrations",b:55},
 {id:"comites",n:"Comités, commissions et groupes de travail (indemnités de session)",b:40},
 {id:"receptions",n:"Réceptions, cérémonies et fêtes officielles",b:25},
 {id:"loyers",n:"Loyers des bâtiments administratifs",b:50},
 {id:"fluides",n:"Eau, électricité et téléphone des administrations",b:70},
 {id:"cabinets",n:"Cabinets ministériels, primes et indemnités",b:35},
 {id:"presidence",n:"Voyages et séjours du chef de l'État, sécurité présidentielle",b:30}
];
E.TRAIN_NIV=[["austere","Austère",.7],["normal","Normal",1],["luxe","Luxueux",1.25]];

/* ---------- Secteur privé ---------- */
E.PRIVE={entreprises:209482,informel:86.6,informelNonAgri:52.0,informelAgri:34.7,public:8.2,priveFormel:5.1,revenuInformel:83409,
  creditT1_2026:1337,creditT1_2025:1887,tauxCredit:9.03,detteInterieure:4265,detteInterieurePIB:12.3,arrieres:498.8,
  patronat:"GECAM (Groupement des entreprises du Cameroun), SYNDUSTRICAM, MECAM",dialogue:"Cameroon Business Forum",
  secteurs:[
   {id:"agro",n:"Agro-industrie",act:55,emp:1200,d:"Cacao, café, coton (SODECOTON), sucre (SOSUCAM), banane, huile de palme.",reg:["CE","SU","SW","LT","NO"]},
   {id:"boissons",n:"Brasseries et boissons",act:65,emp:40,d:"Un des premiers contribuables privés du pays.",reg:["LT","CE"]},
   {id:"ciment",n:"Ciment et BTP",act:58,emp:180,d:"Plusieurs cimenteries en concurrence ; course aux gisements de calcaire en 2026.",reg:["LT","NO","CE"]},
   {id:"telecom",n:"Télécoms et numérique",act:62,emp:60,d:"Opérateurs mobiles, Camtel, start-ups de la « Silicon Mountain » à Buea.",reg:["LT","CE","SW"]},
   {id:"banques",n:"Banques, assurances, microfinance",act:52,emp:35,d:"Crédit rare et cher : nouveaux crédits en baisse au 1er trimestre 2026, taux moyen 9,03 %.",reg:["LT","CE"]},
   {id:"bois",n:"Bois et forêt",act:48,emp:50,d:"Exploitation et transformation, pression sur les forêts de l'Est.",reg:["ES","SU"]},
   {id:"hydro",n:"Pétrole, gaz et mines",act:45,emp:25,d:"Production pétrolière en déclin, projets miniers en démarrage.",reg:["SW","SU","AD","ES"]},
   {id:"transport",n:"Transport et logistique",act:54,emp:250,d:"Ports, transitaires, camionneurs du corridor vers le Tchad et la Centrafrique, mototaxis.",reg:["LT","SU","NO","AD"]},
   {id:"commerce",n:"Commerce et distribution",act:57,emp:2100,d:"Grossistes, marchés, distribution moderne ; très large part d'informel.",reg:["LT","CE","OU","EN"]},
   {id:"tourisme",n:"Tourisme et hôtellerie",act:40,emp:60,d:"Kribi, Limbé, Rhumsiki, Foumban ; freiné par l'insécurité.",reg:["SU","SW","EN","OU"]}
  ]};
E.PRIVE_ACTIONS=[
 {id:"arrieres",n:"Payer une tranche des arriérés intérieurs (100 Mds)",d:"Les PME attendent des centaines de milliards de l'État.",dette:100,climat:6,eco:2},
 {id:"cbf",n:"Réunir le Cameroon Business Forum",d:"Dialogue public-privé annuel avec le patronat.",dette:1,climat:4,cool:12},
 {id:"incitations",n:"Incitations fiscales à l'investissement",d:"Exonérations temporaires pour les nouvelles usines (loi de 2013 sur les incitations à l'investissement privé).",deficit:60,climat:5,eco:2},
 {id:"import",n:"Renforcer l'import-substitution",d:"Protéger la production locale (riz, poisson, huile, ciment). Prix plus élevés à court terme.",climat:2,eco:2,inflation:.4,pop:-1},
 {id:"formel",n:"Campagne de formalisation de l'informel",d:"Simplifier l'impôt libératoire et l'enregistrement des petites entreprises.",deficit:-40,climat:-2,pop:-2},
 {id:"credit",n:"Fonds de garantie pour le crédit aux PME",d:"Garantir une partie des prêts bancaires aux PME.",dette:50,climat:5,eco:1.5},
 {id:"guichet",n:"Guichet unique et dématérialisation",d:"Créer son entreprise en ligne en 72 heures, moins de tracasseries.",dette:5,climat:3}
];

window.ETAT=E;
})();
