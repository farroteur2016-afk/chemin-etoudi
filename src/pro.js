/* Chemin d'Etoudi — professions libérales et fonctionnaires : carrière, sollicitations des habitants,
   recrutements de l'État, et annuaire des talents où tous les profils (joueurs et personnages du jeu)
   sont retrouvables avec leur parcours, pour être sollicités, recrutés ou nommés.
   Salaires indicatifs de la fonction publique camerounaise (catégories A1/A2) et honoraires moyens du privé. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const PRO={};window.PRO=PRO;
let uid=1;const nid=()=>"p"+Date.now().toString(36)+(uid++);
const pill=(t,c)=>'<span class="pill '+c+'">'+esc(t)+'</span>';
const inbox=(S,o)=>window.SYS.inbox(S,o);
const nom=r=>window.SYS.nom(r);
const W=()=>window.WORLD;
const F=n=>fmt(Math.round(n))+" FCFA";
const lc1=t=>t.charAt(0).toLowerCase()+t.slice(1);
const deR=r=>(/^[AEÉIOU]/.test(r.n)?"de l'":"du ")+r.n;

/* ---------- les professions ----------
   g : grades [titre, salaire mensuel public FCFA] ; min : âge minimum réaliste ; tut : ministère employeur
   rq : sollicitations des habitants {w,d,f:[min,max] FCFA,j:jours,c:[[choix,qualité,coef honoraires]],ok,ko,k:compteur}
   of : offres de l'État [intitulé, grade minimum, employeur, coef salaire] ; svc : prestations sur le marché [nom, M FCFA, mois] */
PRO.LIST={
 medecin:{n:"Médecin",min:25,tut:"MINSANTE",cab:["Ouvrir un cabinet médical",2500000],
  g:[["Médecin interne",180000],["Médecin généraliste",330000],["Médecin chef de service",480000],["Médecin chef de district",620000],["Directeur d'hôpital",850000]],
  rq:[{w:"Une mère de famille de {q}",d:"Son fils de 6 ans a 40 °C de fièvre depuis deux jours et vomit.",f:[5000,10000],j:0,c:[["Test de diagnostic rapide du paludisme, puis traitement à l'artémisinine",.92,1],["Injection de quinine sans test",.6,1.2],["Prescrire du paracétamol et attendre",.3,.6]],ok:"Paludisme confirmé et traité : l'enfant est sauvé.",ko:"L'état de l'enfant s'aggrave ; il est transféré en urgence.",k:"patients"},
      {w:"Un conducteur de moto-taxi à {q}",d:"Accident de bendskin : plaie profonde à la jambe, forte douleur.",f:[15000,40000],j:0,c:[["Nettoyer, suturer, vaccin antitétanique et radio",.9,1],["Pansement simple et antalgiques",.55,.7],["L'envoyer à l'hôpital régional",.7,.3]],ok:"La plaie cicatrise bien, sans infection.",ko:"La plaie s'infecte ; le patient revient furieux.",k:"patients"},
      {w:"Un commerçant de {q}",d:"55 ans, maux de tête, vertiges : tension à 19/11.",f:[8000,15000],j:0,c:[["Traitement antihypertenseur, régime et suivi mensuel",.9,1],["Ordonnance sans suivi",.6,.9],["Lui conseiller des tisanes",.25,.4]],ok:"La tension est stabilisée ; il vous recommande à ses amis.",ko:"Il fait un malaise quelques semaines plus tard.",k:"patients"},
      {w:"Une famille de {q}",d:"Plusieurs cas de diarrhées aiguës dans le quartier après de fortes pluies.",f:[10000,25000],j:0,c:[["Réhydratation, isolement et alerte au district (suspicion de choléra)",.92,1],["Antibiotiques pour tous sans alerter",.5,1.3],["Conseiller de bouillir l'eau et partir",.35,.4]],ok:"Le foyer est contenu grâce à l'alerte précoce.",ko:"D'autres cas apparaissent dans le quartier.",k:"patients",mood:1},
      {w:"Une femme enceinte de {q}",d:"Contractions à 2 h du matin, première grossesse, saignements légers.",f:[20000,50000],j:0,c:[["Examen immédiat, puis transfert à la maternité avec vous",.92,1],["Accouchement à domicile",.55,1.2],["Lui dire de venir au matin",.2,0]],ok:"La mère et l'enfant se portent bien.",ko:"Complications graves ; la famille porte plainte.",k:"patients"}],
  of:[["Le MINSANTE recrute des médecins généralistes pour les districts de santé {r}",0,"District de santé de {v}",1],["Poste de médecin chef de service à l'hôpital régional de {v}",2,"Hôpital régional de {v}",1.1],["Médecin urgentiste (contrat) dans un hôpital de Douala",1,"Hôpital Laquintinie de Douala",1.05],["Médecin chef du district de santé de {v}",3,"District de santé de {v}",1.1]],
  svc:[["Consultation à domicile",.015,1],["Couverture médicale d'un événement",.3,1],["Médecin du travail (contrat annuel)",6,12],["Campagne de dépistage",4,2]],
  ai:[["Dr Mbarga (clinique privée)","Clinique",72],["Dr Fotso","Cabinet médical",66],["Dr Ahidjo","Médecin libéral",60]]},
 infirmier:{n:"Infirmier ou infirmière",min:21,tut:"MINSANTE",cab:["Ouvrir un cabinet de soins",600000],
  g:[["Infirmier stagiaire",110000],["Infirmier diplômé d'État",180000],["Infirmier major",240000],["Surveillant général",300000]],
  rq:[{w:"Un vieux papa de {q}",d:"Diabétique, il a besoin de soins de plaie au pied chaque jour.",f:[3000,6000],j:10,c:[["Soins quotidiens stériles et contrôle de la glycémie",.9,1],["Passer un jour sur deux",.6,.7],["Lui apprendre à le faire seul",.45,.4]],ok:"La plaie guérit, l'amputation est évitée.",ko:"La plaie s'aggrave, il faut l'hospitaliser.",k:"patients"},
      {w:"Une maman de {q}",d:"Vaccination de son bébé de 3 mois (calendrier du PEV).",f:[1000,3000],j:0,c:[["Vérifier le carnet, vacciner, noter le prochain rendez-vous",.95,1],["Vacciner sans vérifier le carnet",.6,1],["La renvoyer au centre de santé",.5,0]],ok:"Bébé vacciné, maman rassurée.",ko:"Une dose a été oubliée.",k:"patients"},
      {w:"Un étudiant de {q}",d:"Perfusion prescrite par le médecin pour un paludisme sévère.",f:[5000,10000],j:1,c:[["Poser la perfusion et surveiller toute la nuit",.9,1],["Poser et revenir au matin",.55,1],["Refuser, trop tard",.3,0]],ok:"Il va mieux dès le lendemain.",ko:"Complication pendant la nuit.",k:"patients"}],
  of:[["Recrutement d'infirmiers pour les centres de santé {r}",0,"Centre de santé intégré de {v}",1],["Infirmier major à l'hôpital de district de {v}",2,"Hôpital de district de {v}",1.1]],
  svc:[["Soins infirmiers à domicile (un mois)",.1,1],["Infirmerie d'entreprise",2.4,12]],
  ai:[["Mme Ngo Bassa, infirmière","Soins à domicile",68],["M. Tchoupo","Cabinet de soins",60]]},
 pharmacien:{n:"Pharmacien",min:24,tut:"MINSANTE",cab:["Ouvrir une officine",15000000],
  g:[["Pharmacien assistant",250000],["Pharmacien titulaire",400000],["Pharmacien inspecteur",550000]],
  rq:[{w:"Un client de {q}",d:"Il veut des antibiotiques sans ordonnance « pour la toux ».",f:[2000,6000],j:0,c:[["Refuser poliment et l'orienter vers un médecin",.85,.3],["Vendre un sirop antitussif adapté",.7,1],["Vendre les antibiotiques",.3,1.5]],ok:"Il revient avec une ordonnance et vous fait confiance.",ko:"Mauvais usage : l'Ordre des pharmaciens est alerté.",k:"patients"},
      {w:"Une mère de {q}",d:"Elle a trouvé des médicaments « du poteau » moins chers au marché.",f:[3000,8000],j:0,c:[["Expliquer les dangers des faux médicaments et proposer des génériques",.9,.8],["Lui vendre la marque la plus chère",.5,1.5],["Ne rien dire",.3,0]],ok:"Elle achète désormais en pharmacie.",ko:"Elle retourne au marché.",k:"patients"}],
  of:[["Pharmacien à la Centrale nationale d'approvisionnement (CENAME)",1,"CENAME, Yaoundé",1.1],["Pharmacien d'hôpital régional {r}",0,"Hôpital régional de {v}",1]],
  svc:[["Approvisionnement en médicaments d'un centre de santé",8,1],["Audit de pharmacie hospitalière",3,1]],
  ai:[["Pharmacie du Centre","Officine",70],["Pharmacie de la Cité","Officine",64]]},
 enseignant:{n:"Enseignant",min:21,tut:"MINESEC",cab:["Ouvrir un centre de répétition",400000],
  g:[["Vacataire",60000],["Professeur des lycées (PLEG)",220000],["Censeur",280000],["Proviseur",360000],["Délégué régional",450000]],
  rq:[{w:"Des parents de {q}",d:"Cours de répétition en mathématiques pour leur fille qui prépare le BEPC.",f:[15000,30000],j:30,c:[["Deux séances par semaine avec exercices corrigés",.9,1],["Une séance rapide par semaine",.6,.6],["Lui donner les « épreuves » à l'avance (fraude)",.2,2]],ok:"Elle obtient son BEPC avec mention.",ko:"Échec à l'examen ; les parents sont déçus.",k:"eleves"},
      {w:"Un élève de {q}",d:"Il ne peut pas payer les frais d'APEE et risque l'exclusion.",f:[0,0],j:0,c:[["Plaider sa cause auprès du proviseur",.85,0],["L'aider de votre poche (10 000 FCFA)",.9,-1],["Ne pas vous en mêler",.4,0]],ok:"Il reste à l'école ; la communauté vous respecte.",ko:"Il abandonne l'école.",k:"eleves",mood:1},
      {w:"L'association des parents de {q}",d:"Préparation intensive au baccalauréat pendant les vacances.",f:[80000,150000],j:20,c:[["Programme complet avec examens blancs",.9,1],["Cours magistraux sans suivi",.6,.8],["Refuser",.5,0]],ok:"Taux de réussite de 80 % au bac.",ko:"Résultats décevants.",k:"eleves"}],
  of:[["Concours de l'ENS : le MINESEC recrute des professeurs pour les lycées {r}",0,"Lycée bilingue de {v}",1],["Poste de censeur au lycée classique de {v}",2,"Lycée classique de {v}",1.05],["Nomination de proviseur au lycée de {v}",3,"Lycée de {v}",1.05]],
  svc:[["Cours de répétition (un trimestre)",.09,3],["Formation du personnel",1.5,1]],
  ai:[["M. Essomba, professeur de mathématiques","Répétiteur",66],["Mme Fouda","Centre de répétition",62]]},
 avocat:{n:"Avocat",min:23,tut:"MINJUSTICE",cab:["Ouvrir votre cabinet",3000000],
  g:[["Avocat stagiaire",150000],["Avocat au barreau",0],["Associé",0],["Bâtonnier",0]],
  rq:[{w:"Un jeune de {q}",d:"Il est en garde à vue depuis 5 jours au commissariat, sans avoir vu de juge.",f:[50000,150000],j:3,c:[["Exiger sa présentation au parquet (délai légal dépassé)",.9,1],["Négocier discrètement avec le commissaire",.55,1.2],["Attendre l'audience",.3,.5]],ok:"Il est libéré : la garde à vue était illégale.",ko:"Il est placé en détention provisoire.",k:"clients"},
      {w:"Une veuve de {q}",d:"La famille de son mari veut lui prendre la maison et le terrain.",f:[200000,500000],j:60,c:[["Saisir le tribunal avec le titre foncier et l'acte de mariage",.85,1],["Chercher un arrangement familial",.65,.6],["Lui dire que c'est la coutume",.2,0]],ok:"Le tribunal lui reconnaît ses droits.",ko:"Elle perd sa maison.",k:"clients"},
      {w:"Une PME de {q}",d:"Litige avec l'État : 40 millions de factures impayées.",f:[500000,1500000],j:90,c:[["Mise en demeure puis recours devant la juridiction administrative",.8,1],["Relancer le ministère par courrier",.5,.5],["Conseiller d'abandonner",.2,.2]],ok:"L'État est condamné à payer.",ko:"Le dossier s'enlise.",k:"clients"}],
  of:[["L'État recherche un avocat pour défendre ses intérêts dans un arbitrage",2,"Services du Premier ministre",1],["Commission d'office : défense de détenus à la prison de {v}",0,"Tribunal de grande instance de {v}",1]],
  svc:[["Défense pénale",1.5,3],["Conseil juridique (contrat annuel)",6,12],["Rédaction de contrats",.8,1]],
  ai:[["Cabinet Ekollo & Associés","Avocats",72],["Me Tamfu","Avocat au barreau",65]]},
 genie:{n:"Ingénieur en génie civil",min:23,tut:"MINTP",cab:["Ouvrir un bureau d'études",1500000],
  g:[["Ingénieur débutant",250000],["Ingénieur des travaux",380000],["Chef de projet",520000],["Directeur technique",700000],["Ingénieur général",900000]],
  rq:[{w:"Un fonctionnaire de {q}",d:"Construire sa maison R+1 sur son terrain (budget 25 millions).",f:[1500000,2500000],j:120,c:[["Plans, étude de sol, suivi rigoureux du chantier",.9,1],["Plans types sans étude de sol",.6,.8],["Économiser sur le fer et le ciment",.3,1.3]],ok:"Maison livrée, solide et dans les délais.",ko:"Des fissures apparaissent ; le client exige des réparations.",k:"pv"},
      {w:"Un groupement de commerçants de {q}",d:"Dalle et hangar pour un marché de quartier.",f:[800000,1500000],j:60,c:[["Étude, béton dosé correctement, contrôle des travaux",.88,1],["Aller vite pour la fête",.6,1],["Sous-traiter sans contrôle",.35,1.2]],ok:"Le hangar est inauguré par le chef de quartier.",ko:"La dalle se fissure dès la saison des pluies.",k:"pv",mood:1},
      {w:"Une église de {q}",d:"Diagnostic d'un bâtiment fissuré qui accueille 500 fidèles.",f:[300000,600000],j:10,c:[["Expertise complète et recommandation de fermeture partielle",.9,1],["Rapport rassurant sans essais",.4,1],["Refuser",.5,0]],ok:"Les travaux de confortement évitent un drame.",ko:"Un mur s'effondre partiellement.",k:"pv"},
      {w:"Une famille de {q}",d:"Forage et château d'eau pour la concession familiale.",f:[400000,900000],j:30,c:[["Étude hydrogéologique puis forage",.88,1],["Forer au hasard",.5,.8],["Puits traditionnel",.4,.5]],ok:"L'eau coule, le quartier en profite.",ko:"Forage sec, argent perdu.",k:"pv"}],
  of:[["Le MINTP recrute des ingénieurs pour le contrôle des routes {r}",0,"Délégation régionale des Travaux publics {r}",1],["Chef de projet de la route {v}–chef-lieu (contrat)",2,"MINTP",1.15],["Ingénieur communal de {v}",0,"Commune de {v}",.9],["Directeur technique d'une entreprise publique (MAETUR)",3,"MAETUR",1.2]],
  svc:[["Plans et suivi d'une maison individuelle",2,4],["Étude de sol",.6,1],["Contrôle et surveillance de travaux",8,6],["Expertise de bâtiment",.5,1]],
  ai:[["Ing. Kamga (bureau d'études)","Bureau d'études",70],["Ing. Bello","Ingénieur-conseil",64],["Ing. Nkoulou","Ingénieur BTP",58]]},
 architecte:{n:"Architecte",min:24,tut:"MINHDU",cab:["Ouvrir un cabinet d'architecture",1200000],
  g:[["Architecte stagiaire",200000],["Architecte inscrit à l'Ordre",0],["Architecte associé",0]],
  rq:[{w:"Un couple de {q}",d:"Plans d'une villa et dossier de permis de bâtir.",f:[800000,1500000],j:30,c:[["Plans conformes au plan d'urbanisme, dossier complet",.9,1],["Plans rapides sans visite du terrain",.55,.7],["Vendre des plans téléchargés",.3,.5]],ok:"Permis obtenu, clients ravis.",ko:"Permis refusé par la commune.",k:"pv"}],
  of:[["Architecte à la Mission d'aménagement urbain (MAGZI) {r}",1,"MAGZI",1]],
  svc:[["Plans et permis de bâtir",1,1],["Aménagement d'un immeuble de bureaux",6,3]],
  ai:[["Atelier Nana Architectes","Cabinet",68]]},
 informaticien:{n:"Informaticien",min:21,tut:"MINPOSTEL",cab:["Créer votre start-up",500000],
  g:[["Développeur junior",200000],["Ingénieur logiciel",350000],["Chef de projet informatique",500000],["Directeur des systèmes d'information",750000]],
  rq:[{w:"Une boutique de {q}",d:"Site de vente en ligne avec paiement Mobile Money.",f:[300000,800000],j:30,c:[["Site sécurisé, paiement intégré, formation du gérant",.9,1],["Modèle gratuit vite configuré",.6,.6],["Livrer sans tests",.35,1]],ok:"Les ventes en ligne décollent.",ko:"Le site est piraté au bout d'un mois.",k:"clients"},
      {w:"Un cybercafé de {q}",d:"Virus sur tous les postes, clients perdus.",f:[30000,80000],j:2,c:[["Nettoyage, antivirus et sauvegardes",.9,1],["Réinstaller sans sauvegarde",.6,.8],["Conseiller de tout racheter",.3,.4]],ok:"Tout refonctionne.",ko:"Des données sont perdues.",k:"clients"}],
  of:[["L'ANTIC recrute des ingénieurs en cybersécurité",1,"ANTIC, Yaoundé",1.1],["Informaticien à la mairie de {v}",0,"Commune de {v}",.9]],
  svc:[["Développement d'un logiciel",15,4],["Site Internet",.6,1],["Maintenance informatique (un an)",3,12]],
  ai:[["Digital Kmer SARL","Start-up",70],["Silicon Mountain Labs (Buea)","Start-up",74]]},
 comptable:{n:"Expert-comptable",min:24,tut:"MINFI",cab:["Ouvrir un cabinet comptable",1000000],
  g:[["Comptable",180000],["Expert-comptable stagiaire",280000],["Expert-comptable",0],["Commissaire aux comptes",0]],
  rq:[{w:"Une commerçante de {q}",d:"Déclaration fiscale annuelle en retard, pénalités en vue.",f:[50000,150000],j:7,c:[["Tenir la comptabilité et déclarer en ligne",.9,1],["Déclarer au forfait sans justificatifs",.55,.7],["Proposer d'« arranger » avec l'inspecteur",.25,1.5]],ok:"Déclaration à jour, pénalités évitées.",ko:"Redressement fiscal.",k:"clients"}],
  of:[["Le MINFI recrute des contrôleurs financiers {r}",0,"Délégation régionale des Finances {r}",1],["Commissaire aux comptes d'une entreprise publique",3,"CONSUPE",1.2]],
  svc:[["Tenue de comptabilité (un an)",2.4,12],["Audit financier",8,2]],
  ai:[["Cabinet Mbia Audit","Expertise comptable",70]]},
 journaliste:{n:"Journaliste",min:21,tut:"MINCOM",cab:["Créer votre média en ligne",800000],
  g:[["Pigiste",60000],["Journaliste",180000],["Rédacteur en chef",350000],["Directeur de publication",500000]],
  rq:[{w:"Des habitants de {q}",d:"Ils veulent alerter sur une route coupée depuis six mois.",f:[0,20000],j:3,c:[["Enquêter sur place et donner la parole à tous",.9,1],["Publier leur témoignage sans vérifier",.55,1],["Demander de l'argent pour publier (« gombo »)",.25,2]],ok:"Votre reportage fait réagir la mairie.",ko:"Votre article est contesté et vous êtes menacé de plainte.",k:"clients",mood:1}],
  of:[["La CRTV recrute des journalistes pour ses stations régionales {r}",0,"CRTV {r}",1],["Chargé de communication d'un ministère",2,"Ministère de la Communication",1.1]],
  svc:[["Couverture médiatique d'un événement",.3,1],["Stratégie de communication",3,2]],
  ai:[["Agence Kmer Presse","Agence",64]]},
 agronome:{n:"Ingénieur agronome",min:23,tut:"MINADER",cab:["Créer votre exploitation-conseil",700000],
  g:[["Ingénieur agronome",280000],["Chef de poste agricole",340000],["Délégué départemental",420000],["Délégué régional",520000]],
  rq:[{w:"Une coopérative de cacaoculteurs de {q}",d:"La pourriture brune détruit les cabosses.",f:[100000,250000],j:30,c:[["Formation aux traitements et taille sanitaire",.9,1],["Vendre des pesticides sans formation",.5,1.3],["Conseiller d'attendre la saison sèche",.3,.3]],ok:"Rendement en hausse de 30 %.",ko:"La récolte est perdue.",k:"clients",mood:1},
      {w:"Des jeunes de {q}",d:"Projet de ferme avicole, ils cherchent un plan d'affaires.",f:[80000,150000],j:15,c:[["Plan d'affaires et accompagnement au crédit",.88,1],["Plan type",.6,.7],["Refuser",.4,0]],ok:"La ferme démarre avec 2 000 poulets.",ko:"Le projet échoue faute de trésorerie.",k:"clients"}],
  of:[["Le MINADER recrute des chefs de poste agricole {r}",0,"Délégation d'agriculture de {v}",1],["Projet d'appui à la filière cacao (contrat bailleur)",2,"Projet MINADER–Banque mondiale",1.3]],
  svc:[["Étude de faisabilité agricole",3,2],["Encadrement d'une coopérative (un an)",4,12]],
  ai:[["AgroConseil Cameroun","Bureau-conseil",66]]}
};
PRO.sec=id=>"p_"+id;
PRO.idOf=sec=>sec&&sec.slice(0,2)==="p_"?sec.slice(2):null;
/* secteur au format du marché partagé */
PRO.sector=function(sec){const id=PRO.idOf(sec);const X=PRO.LIST[id];if(!X)return null;return{n:"Profession : "+X.n,services:X.svc,ai:X.ai}};
PRO.sectors=()=>Object.keys(PRO.LIST).map(id=>[PRO.sec(id),PRO.sector(PRO.sec(id))]);

const QUARTIERS={CE:["Mvog-Ada","Biyem-Assi","Essos","Nkolbisson","Mimboman"],LT:["Bonabéri","Deido","Ndokoti","Bépanda","Makepe","New-Bell"],OU:["Tamdja","Djeleng","Kouogouo"],NW:["Nkwen","Up Station","Mankon"],SW:["Molyko","Great Soppo","Mile 16"],EN:["Domayo","Dougoi","Pitoaré"],NO:["Poumpoumré","Lopéré","Roumdé Adjia"],AD:["Joli Soir","Sabongari"],ES:["Tindamba","Nkolbikon"],SU:["Nkoldongo","Mvog-Betsi"]};
const quartier=r=>pick(QUARTIERS[r]||["centre-ville"])+" ("+CM.REG[r].chef+")";

/* ---------- mise en place ---------- */
PRO.setup=function(pre){
  let id=pre||"medecin";
  const draw=()=>{const X=PRO.LIST[id];
    $("panel").innerHTML='<div><span class="eyebrow">Profil professionnel</span><h2 class="h2">Faire carrière</h2></div><p>Choisissez votre métier. Les habitants vous sollicitent directement, sans passer par le président, le maire ou le gouverneur. L\'État et les autres joueurs peuvent vous recruter, et votre parcours est visible dans l\'annuaire des talents : on peut vous confier un poste, jusqu\'à ministre.</p>'+
     '<label class="f" for="prP">Profession<select id="prP">'+Object.entries(PRO.LIST).map(([k,v])=>'<option value="'+k+'"'+(k===id?" selected":"")+'>'+esc(v.n)+'</option>').join("")+'</select></label>'+
     window.VIE.identity("prN","prA",PRO._a||Math.max(30,X.min+3),"Ex. Dr Carine Ndzana")+
     '<p class="small muted">Âge minimum réaliste pour exercer comme '+esc(X.n.toLowerCase())+' : '+X.min+' ans (durée des études). Premier grade : '+esc(X.g[0][0].toLowerCase())+'.</p>'+
     '<label class="f" for="prR">Ville<select id="prR">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===(PRO._r||"LT")?" selected":"")+'>'+esc(r.chef)+' ('+esc(r.n)+')</option>').join("")+'</select></label>'+
     '<label class="f" for="prS">Situation de départ<select id="prS"><option value="pub">Fonctionnaire ou salarié</option><option value="lib">Libéral, à votre compte</option></select></label>'+
     '<div class="row"><button class="btn primary" id="go">Commencer ma carrière</button><button class="btn ghost" id="back">Retour</button></div>';
    if(PRO._n)$("prN").value=PRO._n;window.VIE.bindIdentity("prA");
    $("prP").onchange=()=>{PRO._n=$("prN").value;PRO._a=$("prA").value;PRO._r=$("prR").value;id=$("prP").value;draw()};
    $("back").onclick=G.home;
    $("go").onclick=()=>{const idt=window.VIE.checkIdentity("prN","prA",X.min,X.n.toLowerCase());if(!idt)return;G.newGame("pro",{name:idt.name,age:idt.age,home:$("prR").value,prof:id,sit:$("prS").value})};
  };draw();
};
PRO.init=function(S,o){
  const X=PRO.LIST[o.prof];const reg=o.home;
  S.pro={id:o.prof,reg,grade:o.age>=X.min+8?1:0,xp:0,rep:45,fonds:o.sit==="lib"?600000:350000,employeur:null,cabinet:false,req:[],jobs:[],offres:[],cands:[],
    cv:{x:0,ok:0,ko:0,patients:0,eleves:0,clients:0,pv:0,pu:0,jo:0},nextReq:S.day+1,nextOf:S.day+3,hist:[]};
  if(o.sit==="pub"){const of=X.of[0];S.pro.employeur={n:fill(of[2],reg),sal:X.g[S.pro.grade][1]||200000,tut:X.tut,since:S.day}}
  else S.pro.cabinet=true;
  if(o.cv)Object.assign(S.pro.cv,o.cv);
  PRO.initTalents(S);
  S.news={k:"Début",h:"Vous commencez votre carrière de "+X.n.toLowerCase()+" à "+CM.REG[reg].chef,x:""};
};
function fill(t,reg){const R=CM.REG[reg];return t.replace("{r}",deR(R)).replace(/\{v\}/g,pick(R.villes))}

/* ---------- talents du jeu (personnages avec un parcours) ---------- */
PRO.initTalents=function(S){
  if(S.talents)return;S.talents=[];
  for(const [id,X] of Object.entries(PRO.LIST))for(let i=0;i<3;i++){const reg=pick(CM.REGIONS).id;const g=Math.min(X.g.length-1,Math.floor(rnd(0,X.g.length)));
    S.talents.push({id:nid(),n:nom(reg),reg,prof:id,grade:g,rep:Math.round(rnd(40,85)),x:Math.round(rnd(5,60)*(g+1)),pv:id==="genie"||id==="architecte"?Math.round(rnd(2,25)*(g+1)):0,pu:Math.round(rnd(0,8)*g),age:Math.round(X.min+4+g*6+rnd(0,6)),poste:null})}
  // chefs d'entreprise du jeu (BTP et autres secteurs)
  for(const [sec,X] of Object.entries(E.SECTEURS))for(const a of X.ai.slice(0,2)){const reg=pick(CM.REGIONS).id;S.talents.push({id:nid(),n:nom(reg),reg,prof:"ent:"+sec,ent:a[0],grade:0,rep:a[2]||60,x:Math.round(rnd(10,80)),pv:Math.round(rnd(3,40)),pu:Math.round(rnd(1,15)),age:Math.round(rnd(35,62)),poste:null})}
};
function talentsMonth(S){for(const t of S.talents||[]){const n=Math.random()<.5?1:0;t.x+=n;if(t.prof==="genie"||t.prof.startsWith("ent:"))t.pv+=Math.random()<.4?1:0;t.rep=clamp(t.rep+rnd(-1.5,1.8),20,98)}}
function talentLabel(t){if(t.prof.startsWith("ent:")){const X=E.SECTEURS[t.prof.slice(4)];return"Chef d'entreprise · "+(X?X.n:"")+" ("+t.ent+")"}const X=PRO.LIST[t.prof];return X.g[t.grade][0]+" ("+X.n.toLowerCase()+")"}

/* ---------- parcours affiché (pour tous les profils) ---------- */
PRO.cvOf=function(S){
  if(S.mode==="pro"){const P=S.pro,X=PRO.LIST[P.id];return{p:X.n,pr:P.id,g:X.g[P.grade][0],rep:Math.round(P.rep),x:P.cv.x,ok:P.cv.ok,pv:P.cv.pv,pu:P.cv.pu,jo:P.cv.jo,a:window.VIE?window.VIE.ageNow(S):S.age,e:P.employeur?P.employeur.n:(P.cabinet?"À son compte":"Sans poste")}}
  if(S.mode==="ing"){const e=S.ent,w=e.won||{};return{p:"Chef d'entreprise · "+E.SECTEURS[e.sector||"btp"].n,pr:"ent:"+(e.sector||"btp"),g:e.nom,rep:Math.round(e.rep),x:w.liv||0,ok:w.liv||0,pv:w.prive||0,pu:(w.etat||0)+(w.commune||0),jo:w.joueur||0,a:window.VIE?window.VIE.ageNow(S):S.age,e:e.nom}}
  const a=window.VIE?window.VIE.ageNow(S):S.age;
  if(S.carry){const r=W()?W().roleOf(S):"";return Object.assign({},S.carry,{p:r+" (ancien "+S.carry.p.toLowerCase()+")",e:r,a})}
  return{p:W()?W().roleOf(S):"",pr:"pol",g:"",rep:null,x:0,ok:0,pv:0,pu:0,jo:0,a,e:""};
};
function cvHTML(c){return'<div class="kv"><span>Profil</span><b>'+esc(c.p)+'</b>'+(c.g?'<span>Grade ou structure</span><b>'+esc(c.g)+'</b>':"")+(c.e?'<span>Poste actuel</span><b>'+esc(c.e)+'</b>':"")+(c.a?'<span>Âge</span><b>'+c.a+' ans</b>':"")+(c.rep!=null?'<span>Réputation</span><b>'+c.rep+'/100</b>':"")+'<span>Missions réussies</span><b>'+(c.ok||0)+(c.x?" sur "+c.x:"")+'</b><span>Chantiers ou contrats chez les particuliers</span><b>'+(c.pv||0)+'</b><span>Marchés publics</span><b>'+(c.pu||0)+'</b><span>Contrats avec des joueurs</span><b>'+(c.jo||0)+'</b></div>'}
PRO.cvHTML=cvHTML;

/* ---------- sollicitations des habitants ---------- */
function newReq(S){
  const P=S.pro,X=PRO.LIST[P.id];const reg=Math.random()<.8?P.reg:pick(CM.REGIONS).id;const t=pick(X.rq);
  const q=quartier(reg);const fee=Math.round(rnd(t.f[0],t.f[1])*(P.cabinet?1.3:1)*(1+P.grade*.15)/500)*500;
  const r={id:nid(),t:X.rq.indexOf(t),w:t.w.replace("{q}",q),d:t.d,fee,reg,day:S.day,exp:S.day+(t.j===0?1.5:3),st:"att"};
  P.req.unshift(r);P.req=P.req.slice(0,10);
  inbox(S,{from:r.w,t:"On a besoin de vous : "+lc1(t.d).slice(0,70),b:r.w+" vous sollicite directement. "+t.d+(fee?" Honoraires proposés : "+F(fee)+".":"")+" Répondez vite : sans réponse, la personne ira voir quelqu'un d'autre.",k:"alerte",proReq:r.id,reg});
  G.toast("Sollicitation : "+r.w);
}
PRO.answer=function(S,rid){
  const P=S.pro,X=PRO.LIST[P.id];const r=P.req.find(x=>x.id===rid);if(!r||r.st!=="att")return G.toast("Cette demande n'est plus d'actualité.");
  const t=X.rq[r.t];
  G.sheet('<span class="eyebrow">'+esc(r.w)+'</span><h3 class="h2">'+esc(t.d)+'</h3>'+(r.fee?'<p class="small muted">Honoraires proposés : '+F(r.fee)+(t.j?" · durée : "+t.j+" jours":"")+'</p>':"")+'<div class="choices">'+t.c.map((c,i)=>'<button class="choice" data-rc="'+i+'"><span class="t">'+esc(c[0])+'</span></button>').join("")+'<button class="choice" data-rc="-1"><span class="t">Décliner poliment</span></button></div>',el=>{
    el.querySelectorAll("[data-rc]").forEach(b=>b.onclick=()=>{const i=+b.dataset.rc;el.remove();
      if(i<0){r.st="refus";P.rep=clamp(P.rep-.5,0,100);G.toast("Demande déclinée");return G.render()}
      const c=t.c[i];r.st="cours";r.ch=i;
      if(c[2]<0){P.fonds-=10000}
      if(t.j>0){r.due=S.day+t.j;P.jobs.unshift({id:r.id,kind:"hab",t:r.t,w:r.w,fee:r.fee,due:r.due,q:c[1],coef:c[2],reg:r.reg});G.toast("Mission acceptée : fin prévue le "+G.dayLabel(r.due))}
      else resolve(S,{t:r.t,w:r.w,fee:r.fee,q:c[1],coef:c[2],reg:r.reg});
      r.st="fait";G.render()});
  });
};
function skill(P){return P.grade*.03+P.rep/1000}
function resolve(S,j){
  const P=S.pro,X=PRO.LIST[P.id];const t=X.rq[j.t];const ok=Math.random()<clamp(j.q+skill(P)-.03,.05,.98);
  const gain=Math.max(0,Math.round(j.fee*Math.max(0,j.coef)*(ok?1:.4)));P.fonds+=gain;
  P.cv.x++;if(ok)P.cv.ok++;else P.cv.ko++;P.cv[t.k]=(P.cv[t.k]||0)+1;P.xp+=ok?2:1;
  P.rep=clamp(P.rep+(ok?1.5:-3)+(j.q<.4?-2:0),0,100);
  if(j.q<.35&&Math.random()<.35){P.rep=clamp(P.rep-6,0,100);if(window.SYS.newCase)window.SYS.newCase(S,"corruption",j.reg,1,CM.REG[j.reg].chef);inbox(S,{from:"Ordre professionnel",t:"Plainte déposée contre vous",b:"Un usager a porté plainte pour faute professionnelle ou pratique illégale. Une procédure est ouverte.",k:"alerte"})}
  if(t.mood&&ok)window.SYS.cause(S,j.reg,"Un "+X.n.toLowerCase().split(" ")[0]+" aide les habitants : "+lc1(t.ok),1,"");
  // médecin ou infirmier en poste : l'hôpital en profite
  if(ok&&S.org&&P.employeur&&/Hôpital|hôpital/.test(P.employeur.n)){const h=S.org.hop.find(x=>x.reg===P.reg);if(h)h.sat=clamp(h.sat+.4,0,100)}
  P.hist.unshift({d:S.day,t:(ok?"✔ ":"✖ ")+j.w+" : "+(ok?t.ok:t.ko),g:gain});P.hist=P.hist.slice(0,15);
  G.toast(ok?t.ok:t.ko);
}

/* ---------- offres de l'État (recrutements, concours, contrats) ---------- */
function newOffer(S){
  const P=S.pro,X=PRO.LIST[P.id];const of=pick(X.of);const reg=Math.random()<.5?P.reg:pick(CM.REGIONS).id;const R=CM.REG[reg];const v=pick(R.villes);
  const title=of[0].replace("{r}",deR(R)).replace(/\{v\}/g,v);const emp=of[2].replace("{r}",deR(R)).replace(/\{v\}/g,v);
  const g=Math.max(of[1],P.grade);const base=X.g[Math.min(g,X.g.length-1)][1]||X.g.find(x=>x[1])[1]*1.6;
  const o={id:nid(),t:title,emp,reg,minG:of[1],sal:Math.round(base*of[3]/1000)*1000,dl:S.day+Math.round(rnd(8,15)),st:"ouvert",from:X.tut};
  P.offres.unshift(o);P.offres=P.offres.filter(x=>x.st==="ouvert"||S.day-x.dl<30).slice(0,8);
  inbox(S,{from:X.tut+" · avis de recrutement",t:title,b:"Employeur : "+emp+". Salaire : "+F(o.sal)+" par mois. Grade demandé : "+X.g[o.minG][0].toLowerCase()+". Date limite : "+G.dayLabel(o.dl)+". Postulez dans l'onglet Ma carrière.",k:"marche",reg});
  G.toast("Nouvel avis de recrutement : "+title.slice(0,60));
}
PRO.apply=function(S,oid){const P=S.pro;const o=P.offres.find(x=>x.id===oid);if(!o||o.st!=="ouvert")return;o.st="candidat";P.cands.unshift({id:o.id,t:o.t,res:S.day+Math.round(rnd(4,10))});G.toast("Candidature envoyée");G.render()};
function decideCands(S){
  const P=S.pro,X=PRO.LIST[P.id];
  for(const c of P.cands)if(!c.done&&S.day>=c.res){c.done=1;const o=P.offres.find(x=>x.id===c.id);if(!o)continue;
    const hard=["EN","NO","AD","ES","NW","SW"].includes(o.reg)?.12:0;const p=clamp(.25+P.rep/250+P.grade*.07+hard+(P.cv.ok/200)-(o.minG>P.grade?.45:0),.03,.92);
    if(Math.random()<p){o.st="retenu";P.employeur={n:o.emp,sal:o.sal,tut:o.from,since:S.day,reg:o.reg};P.reg=o.reg;if(o.minG>P.grade)P.grade=o.minG;P.cv.pu++;P.xp+=4;
      inbox(S,{from:o.from,t:"Vous êtes retenu : "+o.t,b:"Félicitations. Vous prenez vos fonctions : "+o.emp+". Salaire : "+F(o.sal)+" par mois. Votre ancien poste est libéré.",k:"bonne",reg:o.reg});G.toast("Recruté : "+o.emp)}
    else{o.st="refuse";inbox(S,{from:o.from,t:"Candidature non retenue : "+o.t,b:"Votre dossier n'a pas été retenu cette fois. "+(o.minG>P.grade?"Le grade exigé était supérieur au vôtre. ":"")+"Continuez à gagner en expérience et en réputation.",k:"info"})}}
}

/* ---------- ticks ---------- */
PRO.dayTick=function(S){
  if(S.mode!=="pro"||!S.pro)return;const P=S.pro;
  if(S.day>=P.nextReq){const rate=(P.cabinet?1.6:1)*(P.employeur?1.2:1)*(.6+P.rep/100);P.nextReq=S.day+rnd(1.5,4)/rate;newReq(S)}
  for(const r of P.req)if(r.st==="att"&&S.day>r.exp){r.st="perdu";P.rep=clamp(P.rep-1,0,100);window.SYS.cause(S,r.reg,r.w+" n'a trouvé personne pour l'aider",-.5,"")}
  for(const j of P.jobs.slice())if(S.day>=j.due){P.jobs.splice(P.jobs.indexOf(j),1);
    if(j.kind==="hab")resolve(S,j);
    else if(j.kind==="joueur"){const conf=clamp(Math.round(55+P.rep*.3+P.grade*4+rnd(-10,10)),25,100);P.fonds+=Math.round(j.p*1e6*.8);P.cv.x++;if(conf>=60)P.cv.ok++;P.rep=clamp(P.rep+(conf-60)/10,0,100);if(W())W().deliver(S,j.i,j.to,conf);inbox(S,{from:j.fromName,t:"Prestation livrée : "+j.t,b:"Conformité : "+conf+" %. Solde encaissé.",k:"bonne"})}}
  if(S.day>=P.nextOf){P.nextOf=S.day+rnd(12,25);newOffer(S)}
  decideCands(S);
};
PRO.monthTick=function(S){
  talentsMonth(S);
  if(S.mode!=="pro"||!S.pro)return;const P=S.pro,X=PRO.LIST[P.id];
  let rev=0,txt=[];
  if(P.employeur&&!P.employeur.pid){const late=/Commune|District|Lycée|Centre de santé/.test(P.employeur.n)&&Math.random()<.15;if(late)txt.push("salaire payé en retard ce mois-ci (arriérés)");else{rev+=P.employeur.sal;txt.push("salaire "+F(P.employeur.sal))}}
  const ch=Math.round((90000+P.grade*25000)*(P.cabinet?1.8:1));P.fonds+=rev-ch;txt.push("charges (loyer, famille, transport"+(P.cabinet?", cabinet":"")+") "+F(ch));
  // promotion
  const need=(P.grade+1)*12;
  if(P.grade<X.g.length-1&&P.xp>=need&&P.rep>=45+P.grade*7){P.grade++;P.xp-=need;const t=X.g[P.grade][0];if(P.employeur&&X.g[P.grade][1])P.employeur.sal=Math.max(P.employeur.sal,X.g[P.grade][1]);
    inbox(S,{from:P.employeur?P.employeur.tut:"Ordre professionnel",t:"Promotion : "+t,b:"Votre expérience ("+P.cv.ok+" missions réussies) et votre réputation vous valent le grade de "+t.toLowerCase()+"."+(P.employeur&&X.g[P.grade][1]?" Nouveau salaire : "+F(P.employeur.sal)+".":""),k:"bonne"});G.toast("Promotion : "+t)}
  if(P.fonds<-300000){P.rep=clamp(P.rep-2,0,100);txt.push("vous êtes endetté")}
  P.lastMonth=txt.join(" · ");
};

/* ---------- joueur prestataire : contrat reçu d'un autre joueur ---------- */
PRO.addPlayerContract=function(S,a){
  const P=S.pro;if(a.k==="emploi"){window.EMP.startJob(S,{c:a.i,pid:a.from,name:a.fromName,poste:a.t,sal:a.p*1e6});return}
  const days=Math.max(2,Math.round((a.m||1)*30));P.jobs.unshift({id:nid(),kind:"joueur",i:a.i,to:a.from,fromName:a.fromName,t:a.t,p:a.p,due:S.day+days});P.fonds+=Math.round(a.p*1e6*.2);P.cv.jo++;
  inbox(S,{from:a.fromName,t:"Mission confiée par un joueur : "+a.t,b:a.fromName+" vous confie « "+a.t+" » ("+fmt(a.p*1000)+" 000 FCFA). Avance de 20 % encaissée ; livraison dans "+days+" jours.",k:"bonne"});G.toast("Mission reçue de "+a.fromName);
};

/* ---------- jauges et onglet Ma carrière ---------- */
PRO.gauges=function(S){const P=S.pro,X=PRO.LIST[P.id];const need=(P.grade+1)*12;return[["Réputation",Math.round(P.rep),P.rep],["Épargne",fmt(Math.round(P.fonds/1000))+" k",clamp(P.fonds/20000,2,100)],["Expérience",P.xp+"/"+need,clamp(P.xp/need*100,2,100)],["Missions",P.cv.ok+"/"+P.cv.x,P.cv.x?P.cv.ok/P.cv.x*100:50],["Grade",(P.grade+1)+"/"+X.g.length,(P.grade+1)/X.g.length*100],["Poste",P.employeur?"Oui":"Libre",P.employeur?80:30]]};
PRO.render=function(S){
  const P=S.pro,X=PRO.LIST[P.id];const c=PRO.cvOf(S);
  let h='<div class="card"><div class="row" style="justify-content:space-between"><h3 class="h2">'+esc(S.name)+'</h3>'+pill(X.g[P.grade][0],"ok")+'</div>'+cvHTML(c)+'<div class="kv"><span>Épargne</span><b>'+F(P.fonds)+'</b><span>Ville</span><b>'+esc(CM.REG[P.reg].chef)+'</b></div>'+(P.lastMonth?'<span class="small muted">Mois dernier : '+esc(P.lastMonth)+'</span>':"")+
   '<div class="row">'+(!P.cabinet?'<button class="btn small" id="prCab">'+esc(X.cab[0])+' ('+fmt(X.cab[1])+' FCFA)</button>':"")+'<button class="btn small" id="prForm">Formation continue (250 000 FCFA)</button>'+(P.employeur?'<button class="btn small ghost" id="prQuit">Démissionner</button>':"")+'</div></div>';
  const att=P.req.filter(r=>r.st==="att"&&S.day<=r.exp);
  h+='<div class="card"><span class="eyebrow">Les habitants vous sollicitent</span>'+(att.length?att.map(r=>'<button class="choice" data-rq="'+r.id+'"><span class="t">'+esc(r.w)+'</span><span class="small muted">'+esc(X.rq[r.t].d)+(r.fee?" · "+F(r.fee):"")+' · à traiter avant le '+esc(G.dayLabel(r.exp))+'</span></button>').join(""):'<span class="small muted">Aucune demande en attente. Avancez le temps : les demandes arrivent par notification.</span>')+'</div>';
  if(P.jobs.length)h+='<div class="card"><span class="eyebrow">Missions en cours</span>'+P.jobs.map(j=>'<div class="small">'+esc(j.kind==="joueur"?j.t+" (pour "+j.fromName+", joueur)":j.w+" : "+X.rq[j.t].d)+' · fin le '+esc(G.dayLabel(j.due))+'</div>').join("")+'</div>';
  const of=P.offres.filter(o=>o.st==="ouvert");
  h+='<div class="card"><span class="eyebrow">Offres de l\'État et recrutements</span>'+(of.length?of.map(o=>'<div class="card" style="gap:6px;background:var(--panel3)"><b>'+esc(o.t)+'</b><span class="small muted">'+esc(o.emp)+' · '+F(o.sal)+'/mois · grade : '+esc(X.g[o.minG][0].toLowerCase())+' · clôture le '+esc(G.dayLabel(o.dl))+'</span><button class="btn small primary" data-ap="'+o.id+'" style="align-self:flex-start">Postuler</button></div>').join(""):'<span class="small muted">Pas d\'offre ouverte pour l\'instant.</span>')+
   (P.cands.filter(c=>!c.done).length?'<span class="small" style="color:var(--y)">Candidatures en cours : '+P.cands.filter(c=>!c.done).map(c=>esc(c.t)).join(" ; ")+'</span>':"")+'</div>';
  if(P.hist.length)h+='<div class="card"><span class="eyebrow">Derniers dossiers</span>'+P.hist.slice(0,8).map(x=>'<div class="small">'+esc(G.dayLabel(x.d))+' · '+esc(x.t)+(x.g?" (+"+F(x.g)+")":"")+'</div>').join("")+'</div>';
  $("panel").innerHTML=h;
  const p=$("panel");
  p.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>PRO.answer(S,b.dataset.rq));
  p.querySelectorAll("[data-ap]").forEach(b=>b.onclick=()=>PRO.apply(S,b.dataset.ap));
  const cb=$("prCab");if(cb)cb.onclick=()=>{if(P.fonds<X.cab[1]*.3)return G.toast("Épargne insuffisante (il faut au moins 30 % d'apport, le reste en crédit).");P.fonds-=X.cab[1];P.cabinet=true;P.rep=clamp(P.rep+3,0,100);inbox(S,{from:"Banque",t:"Installation financée",b:X.cab[0]+" : "+F(X.cab[1])+" investis. Les habitants viendront plus nombreux et vos honoraires augmentent.",k:"bonne"});G.render()};
  const fo=$("prForm");if(fo)fo.onclick=()=>{if(P.fonds<250000)return G.toast("Épargne insuffisante.");P.fonds-=250000;P.xp+=5;P.rep=clamp(P.rep+2,0,100);G.toast("Formation suivie : +5 expérience");G.render()};
  const qu=$("prQuit");if(qu)qu.onclick=()=>{inbox(S,{from:P.employeur.tut,t:"Démission acceptée",b:"Vous quittez : "+P.employeur.n+".",k:"info"});P.employeur=null;G.render()};
};

/* ---------- annuaire des talents (tous profils) ---------- */
PRO.renderAnnuaire=function(S){
  PRO.initTalents(S);
  const f=PRO._f||"tous";const oth=W()&&W().connected()?W().others():[];
  const profs=[["tous","Tous les profils"]].concat(Object.entries(PRO.LIST).map(([k,v])=>[k,v.n]),[["ent","Chefs d'entreprise"]]);
  const match=pr=>f==="tous"||(f==="ent"?String(pr).startsWith("ent:"):pr===f);
  const hum=oth.filter(w=>w.cv&&match(w.cv.pr));
  const ai=S.talents.filter(t=>match(t.prof)).sort((a,b)=>(b.rep+b.pv+b.x/3)-(a.rep+a.pv+a.x/3));
  let h='<div class="card"><span class="eyebrow">Annuaire des talents</span><p class="small">Tous les profils du pays avec leur parcours : joueurs de votre monde partagé en premier, puis les professionnels du jeu. Vous pouvez les solliciter, les recruter'+(S.mode==="pres"?" ou les nommer ministres":S.mode==="min"?" dans votre ministère":"")+'.</p><label class="f" for="anF">Profil<select id="anF">'+profs.map(([k,n])=>'<option value="'+k+'"'+(k===f?" selected":"")+'>'+esc(n)+'</option>').join("")+'</select></label>'+(S.mode==="pres"||S.mode==="min"||S.profil==="maire"||S.mode==="ing"?'<button class="btn small primary" id="anRec" style="align-self:flex-start">Lancer un recrutement</button>':"")+(W()&&W().connected()?"":'<span class="small muted">Rejoignez un monde partagé (onglet Marché) pour voir aussi vos amis et leur parcours.</span>')+'</div>';
  h+=hum.map(w=>'<button class="choice" data-hu="'+esc(w.id)+'"><span class="t">'+pill("Joueur","ok")+' '+esc(w.n)+'</span><span class="small muted">'+esc(w.cv.p)+(w.cv.g?" · "+esc(w.cv.g):"")+' · '+(w.cv.ok||0)+' missions réussies · '+(w.cv.pv||0)+' chez les particuliers · '+(w.cv.pu||0)+' marchés publics'+(w.cv.rep!=null?" · réputation "+w.cv.rep:"")+'</span></button>').join("");
  h+=ai.slice(0,30).map(t=>'<button class="choice" data-ta="'+t.id+'"><span class="t">'+esc(t.n)+(t.poste?" "+pill(t.poste,"warn"):"")+'</span><span class="small muted">'+esc(talentLabel(t))+' · '+esc(CM.REG[t.reg].n)+' · '+t.age+' ans · '+t.x+' missions · '+t.pv+' chez les particuliers · '+t.pu+' marchés publics · réputation '+Math.round(t.rep)+'</span></button>').join("");
  $("panel").innerHTML=h;
  $("anF").onchange=e=>{PRO._f=e.target.value;G.render()};
  const rc=$("anRec");if(rc)rc.onclick=()=>{if(W())W().openPost(S,PRO.sec(PRO.LIST[f]?f:"medecin"),"emploi")};
  $("panel").querySelectorAll("[data-ta]").forEach(b=>b.onclick=()=>{const t=S.talents.find(x=>x.id===b.dataset.ta);openTalent(S,{ai:t,n:t.n,reg:t.reg,cv:{p:talentLabel(t),pr:t.prof,g:"",rep:Math.round(t.rep),x:t.x,ok:Math.round(t.x*t.rep/100),pv:t.pv,pu:t.pu,jo:0,a:t.age,e:t.poste||""}})});
  $("panel").querySelectorAll("[data-hu]").forEach(b=>b.onclick=()=>{const w=oth.find(x=>x.id===b.dataset.hu);openTalent(S,{hu:w,n:w.n,reg:w.g||"CE",cv:w.cv})});
};
function compOf(cv){return Math.round(clamp(38+(cv.rep||50)*.35+Math.min(18,(cv.ok||0)/2)+Math.min(10,(cv.pu||0)),30,95))}
function openTalent(S,T){
  const secOf=pr=>pr&&pr.startsWith("ent:")?pr.slice(4):pr&&PRO.LIST[pr]?PRO.sec(pr):null;const sec=secOf(T.cv.pr);
  let acts="";
  if(S.mode==="pres")acts+='<label class="f" for="tMin">Nommer ministre<select id="tMin">'+E.MINISTERES.map(m=>'<option value="'+m.id+'"'+(m.id===suggestMin(T.cv.pr)?" selected":"")+'>'+esc(m.id)+' · '+esc(m.n)+'</option>').join("")+'</select></label><button class="btn primary" id="tNom">Signer le décret de nomination</button>';
  if(S.mode==="pres")acts+='<button class="btn" id="tPR">Recruter comme chargé de mission à la Présidence</button>';
  if(S.mode==="min")acts+='<button class="btn primary" id="tCT">Recruter comme conseiller technique ('+S.minis.id+')</button>'+(S.minis.id==="MINSANTE"&&T.cv.pr==="medecin"?'<button class="btn" id="tDir">Nommer directeur d\'hôpital</button>':"");
  if(S.profil==="maire"&&S.opp&&S.opp.commune)acts+='<button class="btn primary" id="tMa">Recruter à la mairie ('+esc(S.opp.commune.ville)+')</button>';
  if(S.mode==="ing")acts+='<button class="btn primary" id="tEmb">Embaucher dans votre entreprise</button>';
  if(sec)acts+='<button class="btn" id="tSol">Solliciter ses services</button>';
  const salIn=T.hu&&(S.mode==="min"||S.profil==="maire"||S.mode==="ing"||S.mode==="pres")?'<label class="f" for="tSal">Salaire mensuel proposé (FCFA), payé par vous tant qu\'il travaille pour vous<input type="number" id="tSal" value="350000" step="10000"></label>':"";
  G.sheet('<span class="eyebrow">'+(T.hu?"Joueur":"Personnage du jeu")+'</span><h3 class="h2">'+esc(T.n)+'</h3>'+cvHTML(T.cv)+(T.hu?'<p class="small muted">C\'est un vrai joueur : il reçoit votre proposition et décide de l\'accepter ou non.</p>':"")+salIn+'<div class="row">'+acts+'</div>',el=>{
    const q=s=>el.querySelector(s);const comp=compOf(T.cv);
    if(q("#tNom"))q("#tNom").onclick=()=>{const mid=q("#tMin").value;const M=E.MINISTERES.find(m=>m.id===mid);
      if(T.hu){sendNom(S,T.hu,{k:"min",id:mid,lab:"Ministre : "+M.n});el.remove();G.toast("Proposition envoyée à "+T.n+" ; en attente de sa réponse.");return}
      S.gov.min[mid]={n:T.n,reg:T.reg,comp,loy:Math.round(rnd(55,80)),type:"Talent repéré dans l'annuaire"};if(window.SYS.tdvFor)window.SYS.tdvFor(S.gov.min[mid]);T.ai.poste="Ministre ("+mid+")";
      window.SYS.cause(S,T.reg,"Nomination surprise d'un "+lc1(T.cv.p)+" au gouvernement",2,"");
      inbox(S,{from:"Secrétariat général de la Présidence",t:"Décret : "+T.n+" nommé ministre",b:T.n+" ("+T.cv.p+", "+(T.cv.ok||0)+" missions réussies, "+(T.cv.pv||0)+" chantiers chez les particuliers) est nommé à la tête du ministère : "+M.n+". Compétence estimée : "+comp+"/100.",k:"info"});el.remove();G.toast("Décret signé.");G.render()};
    const hire=(poste,apply)=>{if(T.hu){const sal=+(q("#tSal")&&q("#tSal").value)||350000;sendNom(S,T.hu,{k:"emploi",lab:poste,sal});el.remove();G.toast("Proposition envoyée à "+T.n);return}apply();T.ai.poste=poste;inbox(S,{from:"Ressources humaines",t:T.n+" recruté",b:T.n+" rejoint vos équipes : "+poste+".",k:"info"});el.remove();G.toast(T.n+" recruté");G.render()};
    if(q("#tPR"))q("#tPR").onclick=()=>hire("Chargé de mission à la Présidence",()=>{S.st.pop=clamp(S.st.pop+.5,0,100)});
    if(q("#tCT"))q("#tCT").onclick=()=>hire("Conseiller technique au "+S.minis.id,()=>{S.minis.perf=clamp(S.minis.perf+comp/25,0,100);S.minis.fonds-=4});
    if(q("#tDir"))q("#tDir").onclick=()=>{const hop=S.org&&S.org.hop.slice().sort((a,b)=>a.sat-b.sat)[0];hire("Directeur : "+(hop?hop.n:"hôpital"),()=>{if(hop){hop.dir=T.n;hop.sat=clamp(hop.sat+comp/12,0,100)}})};
    if(q("#tMa"))q("#tMa").onclick=()=>hire("Cadre de la mairie de "+S.opp.commune.ville,()=>{S.opp.commune.mood=clamp(S.opp.commune.mood+2,0,100);S.opp.commune.fonds-=3});
    if(q("#tEmb"))q("#tEmb").onclick=()=>hire("Cadre de "+S.ent.nom,()=>{if(/genie|architecte/.test(T.cv.pr)||String(T.cv.pr).startsWith("ent:"))S.ent.ing++;else S.ent.emp+=1;S.ent.rep=clamp(S.ent.rep+1,0,100)});
    if(q("#tSol"))q("#tSol").onclick=()=>{el.remove();if(W())W().openPost(S,sec)};
  });
}
function suggestMin(pr){return{medecin:"MINSANTE",infirmier:"MINSANTE",pharmacien:"MINSANTE",enseignant:"MINESEC",avocat:"MINJUSTICE",genie:"MINTP",architecte:"MINHDU",informaticien:"MINPOSTEL",comptable:"MINFI",journaliste:"MINCOM",agronome:"MINADER","ent:btp":"MINTP","ent:mines":"MINMIDT","ent:agro":"MINADER","ent:numerique":"MINPOSTEL","ent:sante":"MINSANTE","ent:transport":"MINT"}[pr]||"MINTP"}

/* ---------- nominations entre joueurs (via le monde partagé) ---------- */
function sendNom(S,w,o){S.market=S.market||{mine:[],bids:[],got:{},dl:[],done:{}};S.market.nm=S.market.nm||[];S.market.nm.unshift(Object.assign({i:nid(),to:w.id,toName:w.n},o));S.market.nm=S.market.nm.slice(0,5);if(W())W().publish(true)}
PRO.onPeers=function(S,peers,me){
  const M=S.market;if(!M)return false;M.nmSeen=M.nmSeen||{};M.nrSeen=M.nrSeen||{};let ch=false;
  for(const w of peers){
    for(const n of (w.nm||[]))if(n.to===me&&!M.nmSeen[n.i]){M.nmSeen[n.i]=1;ch=true;
      inbox(S,{from:w.n+" ("+w.r+")",t:"Proposition : "+n.lab,b:w.n+" a vu votre parcours dans l'annuaire des talents et vous propose : "+n.lab+"."+(n.k==="min"?" Accepter met fin à votre partie actuelle : vous devenez ministre, avec votre nom, votre âge et votre parcours.":""),k:"bonne",nom:{i:n.i,from:w.id,fromName:w.n,k:n.k,id:n.id,lab:n.lab,sal:n.sal}});G.toast("Proposition de "+w.n+" : "+n.lab)}
    for(const r of (w.nr||[]))if(r.to===me&&!M.nrSeen[r.i]){M.nrSeen[r.i]=1;ch=true;const n=(M.nm||[]).find(x=>x.i===r.i);if(!n)continue;
      if(n.k==="interim"){window.EMP.interimReply(S,n,r.ok,w);continue}
      if(r.ok&&n.k==="emploi")window.EMP.hire(S,{c:n.i,pid:w.id,name:w.n,poste:n.lab,sal:n.sal||350000});
      if(r.ok&&n.k==="min"&&S.gov){S.gov.min[n.id]={n:w.n+" (joueur)",reg:w.g||"CE",comp:compOf(w.cv||{}),loy:70,type:"Joueur",pid:w.id};if(window.SYS.tdvFor)window.SYS.tdvFor(S.gov.min[n.id])}
      inbox(S,{from:w.n,t:(r.ok?"Proposition acceptée : ":"Proposition refusée : ")+n.lab,b:r.ok?w.n+" accepte et prend ses fonctions.":w.n+" décline votre proposition.",k:r.ok?"bonne":"info"});G.toast(w.n+(r.ok?" accepte : ":" refuse : ")+n.lab)}
  }
  return ch;
};
function reply(S,nomi,ok){S.market.nr=S.market.nr||[];S.market.nr.unshift({i:nomi.i,to:nomi.from,ok:ok?1:0});S.market.nr=S.market.nr.slice(0,5);if(W())W().publish(true)}
/* boutons dans le courrier */
PRO.mailActs=function(S,it){
  if(it.proReq&&S.pro){const r=S.pro.req.find(x=>x.id===it.proReq);if(r&&r.st==="att")return'<button class="btn primary" id="mPro">Répondre à la demande</button>'}
  if(it.nom&&!it.nom.done)return'<button class="btn primary" id="mNomOk">Accepter</button><button class="btn" id="mNomNo">Refuser</button>';
  return"";
};
PRO.mailBind=function(S,it,el){
  const q=s=>el.querySelector(s);
  if(q("#mPro"))q("#mPro").onclick=()=>{el.remove();PRO.answer(S,it.proReq)};
  if(q("#mNomNo"))q("#mNomNo").onclick=()=>{it.nom.done=1;reply(S,it.nom,false);el.remove();G.toast("Proposition refusée");G.render()};
  if(q("#mNomOk"))q("#mNomOk").onclick=()=>{const n=it.nom;
    if(n.k==="min"){el.remove();
      EMP.beforeMinister(S,n,centre=>{n.done=1;reply(S,n,true);const cv=PRO.cvOf(S);const home=S.pro?S.pro.reg:S.ent?S.ent.reg:(S.opp&&S.opp.home)||"CE";const name=S.name,age=window.VIE?window.VIE.ageNow(S):S.age;
        EMP.saveBefore(S);const market=S.market;
        setTimeout(()=>{G.newGame("min",{name,age,home,ministere:n.id,carry:cv,centre,market});G.toast("Vous êtes nommé : "+n.lab)},400)});return}
    if(S.job&&S.job.st==="actif"){G.toast("Vous avez déjà un employeur : démissionnez d'abord.");return}
    n.done=1;reply(S,n,true);el.remove();
    EMP.startJob(S,{c:n.i,pid:n.from,name:n.fromName,poste:n.lab,sal:n.sal||350000});G.render()};
};

/* ---------- audiences propres aux professionnels (utilisées par VIE) ---------- */
PRO.AUD=[["Le délégué régional de votre ministère","vous propose une affectation dans une zone difficile, avec prime.",[["Accepter",{rep:3,xp:3}],["Demander un délai",{}],["Refuser",{rep:-1}]]],
 ["Un laboratoire pharmaceutique ou un fournisseur","vous offre un voyage en échange de commandes.",[["Refuser (conflit d'intérêts)",{rep:2}],["Accepter",{fonds:300000,rep:-3,risque:1}],["Demander conseil à l'Ordre",{rep:1}]]],
 ["Le président de l'Ordre professionnel","vous invite à siéger au conseil de l'Ordre.",[["Accepter",{rep:3,xp:2}],["Décliner",{}]]],
 ["Un ancien camarade de promotion","vous propose de vous associer.",[["Accepter et investir 500 000 FCFA",{fonds:-500000,rep:2,xp:3}],["Refuser",{}]]]];
PRO.applyAud=function(S,e){const P=S.pro;if(!P)return;if(e.rep)P.rep=clamp(P.rep+e.rep,0,100);if(e.xp)P.xp+=e.xp;if(e.fonds)P.fonds+=e.fonds;if(e.risque&&Math.random()<.3){P.rep=clamp(P.rep-8,0,100);inbox(S,{from:"Ordre professionnel",t:"Enquête pour conflit d'intérêts",b:"Des cadeaux de fournisseurs vous sont reprochés.",k:"alerte"})}};
})();
