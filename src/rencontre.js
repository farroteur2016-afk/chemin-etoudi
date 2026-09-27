/* Chemin d'Etoudi — rencontres et entretiens : lors d'une visite ou d'une audience, on parle à son interlocuteur
   à la voix, par écrit ou avec des choix proposés ; il répond à l'écrit et à voix haute.
   Sur la version en ligne, les réponses libres sont rédigées par Claude (capacité « sample ») ; ailleurs, un moteur de dialogue intégré répond.
   Les promesses faites deviennent des engagements à tenir, sinon la population s'en souvient. */
(function(){
"use strict";
const CM=window.CM,G=window.GAME,A=window.Audio2;
const $=id=>document.getElementById(id);
const esc=G.esc,clamp=G.clamp,pick=G.pick;
const RENC={};window.RENC=RENC;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/\s+/g," ").trim();
let sample=null;(async()=>{try{if(window.claude&&claude.use)sample=await claude.use("sample")}catch(e){}})();
let refused=false;

/* ---------- les interlocuteurs ---------- */
const K={
 cacao:{lab:"producteur de cacao",lieu:"sa cacaoyère",regs:["SU","CE","SW","LT","ES"],pb:["le prix bord champ fixé par les acheteurs","les pisteurs qui paient en retard","la piste agricole impraticable en saison des pluies","le coût des engrais et des produits phytosanitaires","la pourriture brune et le swollen shoot","l'accès au crédit pour renouveler les vieux cacaoyers"],att:"une route de desserte, des intrants subventionnés et un prix juste"},
 cafe:{lab:"planteur de café",lieu:"sa plantation",regs:["OU","NW","LT"],pb:["l'effondrement des prix du café","les vieux caféiers peu productifs","l'exode des jeunes vers la ville","le manque d'encadrement technique"],att:"des plants améliorés et un meilleur prix"},
 coton:{lab:"cultivateur de coton",lieu:"son champ",regs:["NO","EN"],pb:["le prix des intrants de la SODECOTON","les retards de paiement","l'insécurité qui empêche d'aller au champ","la sécheresse"],att:"la sécurité et des paiements à temps"},
 banane:{lab:"producteur de banane plantain",lieu:"sa bananeraie",regs:["LT","SW","CE"],pb:["les routes qui abîment la récolte","les pertes après récolte","le prix payé par les bayam-sellam"],att:"des routes et un marché de gros"},
 pecheur:{lab:"pêcheur",lieu:"le débarcadère",regs:["LT","SW","SU","EN"],pb:["le prix du carburant des pirogues","la pêche illégale des chalutiers étrangers","le manque de chambres froides","les tracasseries des agents"],att:"du carburant moins cher et des chambres froides"},
 commercant:{lab:"commerçante du marché",lieu:"le marché",regs:null,pb:["les taxes communales multiples","les hangars délabrés","les incendies de marché","la cherté des produits importés","le racket"],att:"un marché moderne et des taxes claires"},
 moto:{lab:"moto-taximan",lieu:"le carrefour",regs:null,pb:["les contrôles et le racket","le prix du carburant","les accidents","le manque de permis abordable"],att:"moins de tracasseries et une formation gratuite au permis"},
 chef:{lab:"chef traditionnel",lieu:"la chefferie",regs:null,pb:["les conflits fonciers","le chômage des jeunes","l'absence d'eau potable dans les villages","l'insécurité"],att:"le respect de l'autorité traditionnelle et des projets pour le village"},
 enseignant:{lab:"enseignant",lieu:"l'école",regs:null,pb:["les salaires et rappels impayés","les classes surchargées","le manque de tables-bancs","l'intégration des enseignants vacataires"],att:"le paiement des arriérés et plus de salles de classe"},
 syndicat:{lab:"responsable syndical",lieu:"le siège du syndicat",regs:null,pb:["les primes impayées","la dette due aux personnels","le dialogue social rompu","les conditions de travail"],att:"un calendrier de paiement écrit et respecté"},
 etudiant:{lab:"étudiant",lieu:"le campus",regs:null,pb:["les grèves qui bloquent l'année","les amphis surchargés","le chômage des diplômés","le coût du logement"],att:"la reprise des cours et des emplois"},
 medecin:{lab:"médecin",lieu:"l'hôpital",regs:null,pb:["le manque de médicaments","le plateau technique vétuste","les effectifs insuffisants","les primes non payées"],att:"des équipements et du personnel"},
 famille:{lab:"proche d'une famille éprouvée",lieu:"le domicile familial",regs:null,pb:["la douleur de la perte","l'attente de justice","l'insécurité dans le quartier","le coût des soins et des obsèques"],att:"que justice soit rendue et que cela ne se reproduise pas"},
 habitant:{lab:"habitant du quartier",lieu:"le quartier",regs:null,pb:["les coupures d'électricité","l'eau potable","les routes défoncées","l'insécurité la nuit","la vie chère"],att:"l'eau, la lumière et des routes"},
 sportif:{lab:"supporter des Lions",lieu:"les abords du stade",regs:null,pb:["le prix des billets","l'état des stades","l'encadrement des jeunes talents"],att:"des infrastructures sportives dans chaque région"},
 operateur:{lab:"chef d'entreprise",lieu:"son entreprise",regs:null,pb:["la fiscalité lourde","les lenteurs administratives","les délestages","l'accès aux marchés publics"],att:"moins de tracasseries et de l'électricité stable"},
 officiel:{lab:"responsable",lieu:"votre bureau",regs:null,pb:["les moyens insuffisants","les retards de décaissement","les attentes de la population"],att:"des instructions claires et des moyens"}
};
RENC.K=K;
const KW=[["cacao","cacao|cacaoculteur|chocolat"],["cafe","cafe|cafeiculteur"],["coton","coton"],["banane","banane|plantain"],["pecheur","pecheur|peche|debarcadere"],["commercant","commercant|commercante|marche|bayam"],["moto","moto taxi|mototaxi|bendskin|moto taximan"],
 ["chef","chef traditionnel|chefferie|lamido|sultan|fon\\b|chef de village|chef du village"],["enseignant","enseignant|instituteur|professeur|ecole"],["syndicat","syndicat|syndicaliste|synes"],["etudiant","etudiant|campus|universite"],["medecin","medecin|docteur|infirmier"],
 ["famille","famille|victime|endeuille"],["sportif","supporter|lions|stade"],["operateur","chef d entreprise|patron|entrepreneur|industriel"],["habitant","habitant|population|riverain|quartier"]];
RENC.kindOf=t=>{t=norm(t);for(const [k,re] of KW)if(new RegExp("\\b("+re+")").test(t))return k;return null};

/* ---------- choix proposés (QCM) selon l'objet de la visite ---------- */
function qcmOff(P){const S=G.S,a=adr(S),L=dossOf(S,P),Z=st(P),T=Z.topic||L[0];const O=[{id:"point",q:"Lui demander de faire le point de ses dossiers",fx:{m:.4},r:()=>overview(S,P)}];
  L.filter(d=>d!==T).slice(0,2).concat(T?[T]:[]).reverse().forEach(d=>O.push({id:"d_"+d.id,q:"Parler de : "+d.t,fx:{m:.3},r:()=>detail(S,P,d)}));
  if(T){O.push({id:"cause",q:"Pourquoi « "+T.t.slice(0,50)+(T.t.length>50?"…":"")+" » bloque-t-il ?",fx:{m:.2},r:()=>reply(S,P,"pourquoi ça bloque ?").r()});
    O.push({id:"besoin",q:"Que vous faut-il pour régler ce dossier ?",fx:{m:.4},r:()=>reply(S,P,"qu'est-ce qu'il vous faut ?").r()});
    O.push({id:"delai",q:"Dans quel délai ?",fx:{m:.1},r:()=>reply(S,P,"dans quel délai ?").r()});
    const o=orderReply(S,P,norm(T.t),"Réglez le dossier « "+T.t+" » : "+(T.dem||"prenez les mesures nécessaires")+" dans 30 jours");O.push({id:"ordre",q:"Instruction ferme : régler « "+T.t.slice(0,50)+(T.t.length>50?"…":"")+" » sous 30 jours",fx:{m:o.m,order:o.order,eng:!!o.eng},eng:o.eng,r:()=>o.r})}
  O.push({id:"fin",q:"Remercier et terminer",fx:{},r:()=>reply(S,P,"au revoir").r()});return O}
function qcm(P){if(isOff(P)&&G.S)return qcmOff(P);const k=K[P.kind]||K.habitant;const T=[
  {id:"ecoute",q:"Écouter ses difficultés",fx:{m:1},r:()=>"Merci de venir jusqu'ici. Notre plus gros problème, c'est "+pb(P)+". Et il y a aussi "+pb(P)+"."},
  {id:"attente",q:"Lui demander ce qu'il attend de l'État",fx:{m:.5},r:()=>"Ce que nous voulons ? "+k.att.charAt(0).toUpperCase()+k.att.slice(1)+". Rien de plus, rien de moins."},
  {id:"promesse",q:"Promettre une action concrète dans les deux mois",fx:{m:2.5,eng:true},r:()=>pick(["Si c'est vrai, toute la zone vous en sera reconnaissante. Mais on a déjà entendu beaucoup de promesses…","On vous prend au mot. Nous serons là dans deux mois pour voir.","Que Dieu vous entende ! Nous attendons des actes."])},
  {id:"aide",q:"Annoncer une aide immédiate",fx:{m:3,cost:true},r:()=>pick(["Merci beaucoup. Cela va vraiment soulager les gens d'ici.","C'est un geste fort. On en parlera au village.","Enfin quelqu'un qui agit ! Merci."])},
  {id:"efforts",q:"Expliquer ce que les pouvoirs publics font déjà",fx:{m:-.3},r:()=>pick(["Peut-être, mais ici on ne voit rien de tout ça.","Les programmes, on en entend parler à la radio. Sur le terrain, c'est autre chose.","Je veux bien vous croire, mais il faudrait que ça arrive jusqu'à nous."])},
  {id:"conseil",q:"Lui donner des conseils pratiques",fx:{m:.3},r:()=>pick(["C'est noté, merci du conseil.","On essaiera, même si les moyens manquent.","Vous connaissez le terrain, je vois."])},
  {id:"fin",q:"Remercier et terminer l'entretien",fx:{},r:()=>pick(["Merci pour votre visite. Revenez nous voir !","Merci. N'oubliez pas ce que vous avez vu ici.","Que Dieu vous bénisse. Bonne route."])}];
  if(P.kind==="famille"){T[0]={id:"ecoute",q:"Présenter ses condoléances et l'écouter",fx:{m:1.5},r:()=>"Merci d'être venu. Nous sommes dévastés. Ce que nous attendons, c'est "+k.att+"."};T[5]={id:"justice",q:"Assurer que l'enquête ira jusqu'au bout",fx:{m:1,eng:true},r:()=>"Nous comptons sur vous. Que les coupables répondent de leurs actes."}}
  if(P.kind==="syndicat"){T[5]={id:"calendrier",q:"Proposer un calendrier de paiement écrit",fx:{m:2,eng:true},r:()=>"Un calendrier écrit, signé, avec des dates : c'est ce que nous demandons depuis le début. Nous allons consulter la base."}}
  return T}
const PB_USED=new WeakMap();
function pb(P){const k=K[P.kind]||K.habitant;let u=PB_USED.get(P);if(!u){u=[];PB_USED.set(P,u)}const rest=k.pb.filter(x=>!u.includes(x));const x=pick(rest.length?rest:k.pb);u.push(x);return x}

/* ---------- moteur de dialogue intégré (hors ligne) ----------
   Il comprend l'intention de la phrase (salut, « comment ça va », point de situation, un dossier précis, montant, délai,
   cause du blocage, besoin, instruction, promesse, remerciements, fin) et répond à partir du portefeuille réel de
   l'interlocuteur (dossiers de son ministère, de son entreprise, de son hôpital, difficultés de son métier). */
function adr(S){const f=window.SYS.sexe(S.name||"")==="f";return S.mode==="pres"?"Excellence":S.mode==="min"?(f?"Madame la Ministre":"Monsieur le Ministre"):S.profil==="maire"?(f?"Madame le Maire":"Monsieur le Maire"):S.profil==="depute"?"Honorable":f?"Madame":"Monsieur"}
const isOff=P=>P.kind==="officiel"||!!P.min||!!P.org;
function dossOf(S,P){if(!P._doss){P._doss=window.DOSS?DOSS.npc(S,P):[];if(P.dossier&&window.DOSS){const mine=DOSS.find(S,P.dossier);if(mine){const same=DOSS.match(P._doss,mine.t+" "+(mine.kw||"").replace(/\|/g," "));const top=(S.mode==="pres"||S.mode==="min")&&same?same:Object.assign({},mine,{id:"j"+mine.id});P._doss=[top].concat(P._doss.filter(x=>x!==top));P.st.topic=top}}}return P._doss}
function st(P){return P.st||(P.st={topic:null,told:{},list:[],n:0,det:{}})}
const low1=s=>s?s.charAt(0).toLowerCase()+s.slice(1):s;
const fmtD=d=>window.DOSS?DOSS.fmt(d):"";
function trait(P){try{return window.CAB?CAB.trait(P.n):"cooperatif"}catch(e){return"cooperatif"}}
function detail(S,P,d,full){const a=adr(S),Z=st(P);Z.topic=d;Z.det[d.id]=(Z.det[d.id]||0)+1;
  if(!isOff(P))return pick(["Ah, "+low1(d.t)+" ! C'est ça qui nous tue ici. ","Justement, "+low1(d.t)+"… "])+(d.dem?"Ce que nous voulons, c'est "+d.dem+".":"");
  if(/^j/.test(d.id)&&S.mode!=="pres"&&S.mode!=="min"){const tr=trait(P);return"Votre dossier « "+d.t+" » : je l'ai sous les yeux. "+(d.cause?"Ce qui bloque : "+d.cause+". ":"")+
    ({zele:"Je peux le faire remonter en priorité dès aujourd'hui.",cooperatif:"Je vais voir avec le service concerné pour le débloquer.",prudent:"Il faut que toutes les pièces soient au complet ; ensuite je le fais avancer.",ambitieux:"Je peux vous aider, mais il faudra être patient : tout le monde attend.",tetu:"Je ne peux pas passer devant les autres dossiers.",negligent:"On va regarder ça…"}[tr]||"")}
  if(d.dir)return"Votre directive « "+d.t.replace(/^Votre directive : /,"")+" » : nous sommes à environ "+(d.prog||30)+" % d'exécution. "+pick(["Les services sont mobilisés.","Il reste des blocages administratifs, mais on avance.","Je vous ferai un compte rendu écrit avant l'échéance."]);
  let r=d.t+" : "+low1(d.d)+(fmtD(d)?" Montant en jeu : "+fmtD(d)+".":"");if(full!==false&&d.cause)r+=" Le blocage, "+a+", c'est "+d.cause+".";if(full!==false&&d.dem)r+=" Ce que je demande : "+d.dem+".";return r}
function overview(S,P){const L=dossOf(S,P).filter(d=>d.st!=="regle"),a=adr(S),Z=st(P);if(!L.length)return isOff(P)?"Rien d'alarmant pour l'instant, "+a+". Les services suivent les affaires courantes.":"Ici, on se débrouille comme on peut.";
  Z.list=L.slice(0,3);Z.topic=L[0];
  if(!isOff(P))return"Les problèmes ne manquent pas : "+Z.list.map(d=>low1(d.t)).join(", ")+". Le plus dur, c'est "+low1(L[0].t)+".";
  const n=["D'abord","Ensuite","Enfin"];return(Z.list.length>1?Z.list.length+" dossiers retiennent mon attention, "+a+". ":"Un dossier retient mon attention, "+a+". ")+Z.list.map((d,i)=>(Z.list.length>1?n[i]+", ":"")+low1(d.t)+(fmtD(d)?" ("+fmtD(d)+")":"")+".").join(" ")+(Z.list.length>1?" Par lequel voulez-vous commencer ?":" Voulez-vous le détail ?")}
function orderReply(S,P,t,raw){const a=adr(S),Z=st(P),d=DOSS&&DOSS.match(dossOf(S,P),t)||Z.topic;const tr=trait(P);
  if(!isOff(P))return{r:pick(["D'accord, on va essayer. Mais sans moyens, c'est difficile.","C'est noté. Si l'État nous aide, on fera notre part.","On a compris. Mais il faut aussi que les autorités fassent la leur."]),m:.2};
  const can=S.mode==="pres"||(S.mode==="min"&&(!P.min||P.min===S.minis.id));
  if(!can&&d&&/^j/.test(d.id)&&window.DOSS){const md=DOSS.find(S,d.id.slice(1));const tr=trait(P);const p0={zele:.75,cooperatif:.6,prudent:.5,ambitieux:.5,tetu:.3,negligent:.2}[tr]||.5;
    if(md&&!md.cours){md.cours={a:"relance",fin:S.day+Math.round(8+Math.random()*10),p:p0,lab:"Suivi promis par "+P.n};md.suivi.push({j:S.day,t:"Appel à "+P.n})}
    return{r:{zele:"Entendu, "+a+". Je fais remonter votre dossier aujourd'hui même ; vous aurez des nouvelles sous deux semaines.",cooperatif:"C'est noté. Je transmets votre dossier au service de l'ordonnancement et je vous rappelle.",prudent:"Je note votre demande. Je vérifie que toutes les pièces sont là, puis je le fais avancer.",ambitieux:"Je vais voir ce que je peux faire. Je ne promets rien, mais je le signale.",tetu:"Je ne peux pas vous promettre de délai ; il y a une file d'attente, comme pour tout le monde.",negligent:"D'accord, d'accord… je regarde ça."}[tr]||"C'est noté.",m:.3}}
  if(!can)return{r:pick(["Je comprends votre demande, "+a+". Je vais voir ce que je peux faire, mais la décision ne dépend pas que de moi.","Votre demande est notée ; je la soumets à ma hiérarchie et je vous reviens.","Entendu. Je transmets et je fais le suivi."]),m:.3,eng:"Suivi demandé à "+P.n+(d?" : "+d.t:"")};
  const R={zele:"Bien reçu, "+a+". Je m'y mets dès maintenant ; vous aurez un premier compte rendu sous 48 heures.",cooperatif:"Entendu, "+a+". Ce sera fait dans les délais que vous fixez.",prudent:"C'est noté, "+a+". Je vérifie d'abord les disponibilités budgétaires et les textes, puis j'exécute.",
    ambitieux:"Comptez sur moi, "+a+". Et si vous m'en donnez les moyens, je peux aller plus loin que ce que vous demandez.",tetu:"Je note, "+a+"… même si, franchement, je ne suis pas sûr que ce soit la meilleure voie. J'exécuterai.",negligent:"Oui, oui, "+a+", je m'en occupe."}[tr]||"Entendu, "+a+".";
  const what=infin(raw).replace(/[.!?]+$/,"");const echo=what.length>6&&what.length<140?" Instruction notée : « "+what.charAt(0).toLowerCase()+what.slice(1)+" ».":"";
  const nat=S.mode==="pres"&&window.SAV&&SAV.region&&!SAV.region(t);
  let extra=echo+(nat?" Comme cela touche tout le pays, je vous soumets d'abord un plan chiffré, pour votre validation avant exécution.":"");if(d&&d.v&&P.min&&P.min!=="MINFI"&&/decaiss|paiement|impaye|credit|fonds|dette|tresor/.test(d.kw||""))extra=" Il me faudra toutefois le décaissement de "+fmtD(d)+" par les Finances.";
  return{r:R+extra,m:.4,order:{text:raw,d:DOSS&&DOSS.match(dossOf(S,P),t)?d:null}}}
const IRR={faites:"faire",prenez:"prendre",mettez:"mettre",reunissez:"réunir",réunissez:"réunir",dites:"dire",rendez:"rendre",suspendez:"suspendre",transmettez:"transmettre",faisiez:"faire",preniez:"prendre",mettiez:"mettre",soyez:"être",allez:"aller",fassiez:"faire",preniez:"prendre",réunissiez:"réunir"};
/* « je vous demande de débloquer… », « débloquez… », « que vous régliez… » → « débloquer… » */
function infin(raw){let x=String(raw).trim().replace(/^(alors|donc|bon|bien|monsieur le ministre|madame la ministre|excellence)[ ,]+/i,"")
  .replace(/^(j'ai dit|j’ai dit|je dis|je répète|je repete)( ceci| cela| que)?\s*:?\s*/i,"")
  .replace(/^(je vous (demande|ordonne|charge|instruis|prie|donne l'ordre) (de |d'|d’)|je veux que vous |il faut que vous |il faut qu'on |il faut |il faudrait |nous devons |on doit |j'exige que vous |je souhaite que vous |je veux |je voudrais |veuillez )/i,"");
  x=x.replace(/^([a-zà-ÿ]+?)(iez|ez)\b/i,(m,r,e)=>{const w=m.toLowerCase();if(IRR[w])return IRR[w];return /[^aeiouyéè]iss$/.test(r)?r.replace(/iss$/,"ir"):r+"er"});return x}
function reply(S,P,raw){const t=norm(raw),a=adr(S),Z=st(P),L=dossOf(S,P),off=isOff(P);Z.n++;const k=K[P.kind]||K.habitant;
  const T=Z.topic;const R=(r,fx,id)=>({id:id||"libre",fx:fx||{m:.2},r:()=>r});
  if(/(au revoir|a bientot|bonne (journee|soiree|nuit|continuation)|on se reparle|je vous laisse|ce sera tout|c est tout pour|je raccroche|fin de l entretien)/.test(t))
    return R(off?pick(["Bien reçu, "+a+". Je vous tiens informé. Au revoir.","Merci, "+a+". Je me mets au travail. Au revoir."]):pick(["Merci pour votre visite. Revenez nous voir !","Merci. N'oubliez pas ce que vous avez vu ici.","Que Dieu vous bénisse. Bonne route."]),{m:.2},"fin");
  const greet=/^(bonjour|bonsoir|salut|allo|all?o|hello|mes respects|bienvenue)\b/.test(t),how=/(comment (allez|vas|ca va|vous portez)|ca va\b|vous allez bien|la sante)/.test(t);
  const hit0=window.DOSS?DOSS.match(L,t):null;
  if((greet||how)&&hit0&&t.split(" ").length>3){Z.told[hit0.id]=1;return R((off?"Bonjour, "+a+". ":"Bonjour ! ")+detail(S,P,hit0),{m:.4})}
  if(greet||how){const top=Z.topic||L.find(d=>d.urg===3&&!Z.told[d.id])||L[0];const again=top&&Z.told[top.id];let r=off?(how?"Je vais bien, merci "+a+". ":greet?"Bonjour, "+a+". Je vous écoute. ":""):(how?"Ça va un peu, on se débrouille. ":"Bonjour ! Soyez le bienvenu. ");
    if(top&&Z.n<=3){Z.told[top.id]=1;Z.topic=top;r+=off?(how?(again?"Mais, comme je vous le disais, le dossier « "+top.t+" » me préoccupe.":"Au travail, on tient, mais le dossier « "+top.t+" » me préoccupe beaucoup."):"J'allais justement vous parler de ce dossier : "+low1(top.t)+"."):(again?"Mais comme je disais, ":"Mais ")+low1(top.t)+", ça nous fatigue."}
    else if(how)r+=off?"Que puis-je pour vous ?":"Et vous, merci d'être venu.";return R(r.trim(),{m:.3})}
  if(/^(merci|je vous remercie|thank)/.test(t)&&t.split(" ").length<6)return R(off?"C'est moi qui vous remercie, "+a+". Y a-t-il autre chose ?":"Merci à vous !",{m:.3});
  if(/(qui (etes|est) (vous|a l appareil)|vous etes qui|votre (poste|fonction|role|nom)|presentez vous)/.test(t))return R("Je suis "+P.n+", "+P.lab+(P.lieu&&P.lieu!=="au téléphone"?", ici à "+P.lieu:"")+".");
  if(/(incompetent|nul\b|limog|revoquer|demission|sanctionn|vous etes vire|pas serieux|inadmissible|inacceptable)/.test(t)){const tr=trait(P);return R(off?({tetu:"Je ne peux pas vous laisser dire ça, "+a+". Mes services travaillent dans des conditions très difficiles.",negligent:"Pardon, "+a+"… je vais redresser la situation très vite.",ambitieux:"Je comprends votre exigence, "+a+". Donnez-moi trente jours et jugez-moi sur les résultats."}[tr]||"J'entends votre mécontentement, "+a+". Je prends les mesures immédiatement."):"Nous aussi on est fatigués, vous savez.",{m:-.8})}
  if(/(faites moi le point|faire le point|fais moi le point|le point (de|sur) (vos|tes|la|les)|point de situation|briefing|etat des lieux)/.test(t)&&!(window.DOSS&&DOSS.match(L,t.replace(/point|situation/g,""))))return R(overview(S,P),{m:.5},"ecoute");
  // instruction donnée
  const ACT="(reduire|baisser|diminuer|augmenter|supprimer|arreter|lancer|payer|debloquer|decaisser|construire|recruter|renforcer|ameliorer|limiter|geler|controler|organiser|mettre|creer|former|equiper|reformer|revoir|rationaliser|faire|regler|traiter|rembourser|interdire|sanctionner|auditer|verifier|preparer|envoyer|transmettre|accelerer|terminer|achever|reprendre|relancer|publier|annuler|suspendre)";
  if(new RegExp("\\b(il faut|il faudrait|nous devons|on doit|je veux|je voudrais|je souhaite|je demande|j ai dit|vous devez|vous allez)\\b.{0,20}\\b"+ACT).test(t)||new RegExp("^"+ACT+"\\b").test(t)||/(je vous (demande|ordonne|instruis|charge|donne l ordre)|je veux que vous|il faut que vous|j exige|faites|reglez|debloquez|decaissez|payez|lancez|envoyez|preparez|veillez|assurez vous|occupez vous|prenez les|reunissez|mettez|transmettez|suspendez|arretez|appliquez|dites a|informez|rendez moi|faites moi|je veux un rapport|je veux une note)/.test(t)){const o=orderReply(S,P,t,raw);return{id:"ordre",fx:{m:o.m,eng:o.eng?true:false,order:o.order},r:()=>o.r,eng:o.eng}}
  // promesse du joueur
  if(/(je vais|nous allons|on va|je m engage|je promets|comptez sur moi|vous aurez|je vous garantis|je ferai|nous ferons)/.test(t)){
    if(off)return{id:"promesse",fx:{m:1,eng:true},r:()=>pick(["Merci, "+a+". Avec votre appui, "+(T?low1(T.t):"ce dossier")+" peut se débloquer vite.","C'est noté, "+a+". Je le dirai à mes équipes, cela va les remotiver."])};
    const o=qcm(P).find(x=>x.id==="promesse");if(o)return o}
  if(!off&&/(aide|argent|fonds|financ|debloqu|subvention|don\b)/.test(t)){const o=qcm(P).find(x=>x.id==="aide");if(o)return o}
  if(/(enquete|justice|coupable)/.test(t)&&P.kind==="famille"){const o=qcm(P).find(x=>x.id==="justice");if(o)return o}
  if(/(mon dossier|ma facture|mes factures|ma demande|mon paiement|mes decomptes|mon decompte|ou en est (mon|ma|notre))/.test(t)){const mine=L.find(x=>/^j/.test(x.id));if(mine)return R(detail(S,P,mine))}
  // choix dans une liste (« le premier », « le deuxième »)
  const ord=/(premier|1er|numero un)/.test(t)?0:/(deuxieme|second|numero deux)/.test(t)?1:/(troisieme|dernier|numero trois)/.test(t)?2:-1;
  if(ord>=0&&Z.list[ord])return R(detail(S,P,Z.list[ord]));
  // un dossier précis
  const hit=window.DOSS?DOSS.match(L,t):null;
  const ask=/(combien|montant|cout|coute|somme|milliard|million|chiffre)/.test(t),when=/(quand|delai|date|combien de temps|d ici quand|echeance|pret pour)/.test(t),why=/(pourquoi|cause|raison|bloque|blocage|retard|coince|explique)/.test(t),need=/(besoin|attendez|voulez|que faut|il faut quoi|proposez|solution|proposition|suggerez|que faire|comment faire|que dois|que faudrait|qu est ce qu il (vous )?faut|que peut on faire)/.test(t);
  const d=hit&&(!T||hit===T||DOSS.score(hit,t)>=2)?hit:(T||hit);
  if(ask){if(/(au total|en tout|total)/.test(t)){const s=L.reduce((x,y)=>x+(y.unit==="M"?y.v/1000:y.v),0);return R(s?"Au total, pour mes dossiers ouverts, on est autour de "+window.DOSS.fmt({v:Math.round(s*10)/10,unit:"Md"})+".":"Ce n'est pas d'abord une question d'argent, "+a+".")}
    if(d){Z.topic=d;return R(d.v?"Pour le dossier « "+d.t+" », le montant en jeu est de "+fmtD(d)+"."+(d.dem&&!/^j/.test(d.id)?" Ce que je demande : "+d.dem+".":""):"Pour le dossier « "+d.t+" », ce n'est pas d'abord une question d'argent : "+(d.cause||"il faut une décision")+".")}}
  if(when&&d){Z.topic=d;const tr=trait(P);if(d.dir)return R("L'échéance est fixée au "+G.dayLabel((S.directives||[]).find(x=>x.id===d.dir)?.due||S.day+30)+". "+(tr==="negligent"?"On devrait y arriver…":"Nous tiendrons le délai."));
    return R(off?(tr==="zele"?"Si j'ai le feu vert aujourd'hui, deux à trois semaines.":tr==="prudent"?"Il faut compter un à deux mois, pour faire les choses dans les règles.":tr==="negligent"?"Ça dépend… quelques semaines, peut-être plus.":"Environ un mois, si le financement suit.")+(d.v&&P.min!=="MINFI"&&/decaiss|paiement|impaye|credit|dette|tresor/.test(d.kw||"")?" Tout dépend du décaissement au Trésor.":""):"On attend depuis longtemps déjà. Le plus vite sera le mieux.")}
  if(why&&d){Z.topic=d;return R(d.cause?(off?"Le blocage, "+a+", c'est "+d.cause+".":"Le problème, c'est "+d.cause+"."):"C'est "+low1(d.t)+", tout simplement. Personne ne s'en occupe.")}
  if(need){const x=d||L[0];if(x){Z.topic=x;return R((off?"Ce qu'il faut, "+a+" : ":"Ce que nous voulons : ")+(x.dem||k.att)+".",{m:.5},off?"libre":"attente")}return R("Ce que nous voulons ? "+k.att.charAt(0).toUpperCase()+k.att.slice(1)+".",{m:.5},"attente")}
  if(hit)return R(detail(S,P,hit),{m:.4});
  if(/(point|situation|quoi de neuf|dossiers?|ou en (est|etes|sommes)|nouvelles|comment ca se passe|briefing|rapport|etat des lieux|priorites?|urgences?|problemes?|difficultes?|soucis?|preoccup|racontez|parlez moi|qu est ce qui ne va pas|les choses|vos besoins)/.test(t))return R(overview(S,P),{m:.5},"ecoute");
  if(/^(oui|d accord|ok|okay|entendu|parfait|tres bien|bien sur|allez y|continuez|je vous ecoute|dites|allez|vas y|je vois|bon)\b/.test(t)){
    if(T&&!Z.det[T.id])return R(detail(S,P,T));const nx=L.find(x=>!Z.det[x.id]&&x!==T);if(nx)return R((off?"Autre point, "+a+" : ":"Il y a aussi ")+detail(S,P,nx,true));return R(off?"Je crois que nous avons fait le tour, "+a+". Autre chose ?":"C'est tout ce que j'avais à dire. Merci de nous avoir écoutés.")}
  if(/^(non|pas maintenant|plus tard|laissez|ca ira)\b/.test(t))return R(off?"Très bien, "+a+". Je reste à votre disposition.":"D'accord.");
  if(/(gouvernement|programme|deja fait|efforts?|plan national)/.test(t)&&!off){const o=qcm(P).find(x=>x.id==="efforts");if(o)return o}
  if(/(conseil|devriez|essayez|cooperative|regroup)/.test(t)&&!off){const o=qcm(P).find(x=>x.id==="conseil");if(o)return o}
  // question sur le sujet en cours
  if((/\?$/.test(raw.trim())||/^(quel|quelle|quels|quelles|qu est|est ce|comment|ou |combien|pourquoi|qui )/.test(t))&&T)return R(detail(S,P,T));
  if(/\?$/.test(raw.trim())||/^(quel|quelle|qu est|est ce|comment)/.test(t))return R(overview(S,P),{m:.3},"ecoute");
  const sug=L.filter(x=>x!==T).slice(0,2);
  return R(off?"Pardon, "+a+", je ne suis pas sûr de bien vous suivre."+(T?" Vous parlez de "+low1(T.t)+" ?":"")+(sug.length?" Je peux aussi vous faire le point sur "+sug.map(x=>low1(x.t)).join(" ou sur ")+".":"")+" Vous pouvez aussi me donner une instruction."
    :pick(["Je vous entends. Mais ici, le vrai problème reste "+pb(P)+".","Hmm… Et pour "+pb(P)+", qu'est-ce que vous comptez faire ?","Je n'ai pas bien compris. Vous voulez parler de "+pb(P)+" ?"]),{m:.1})}

/* ---------- réponses libres ---------- */
function fallback(P,t){return reply(G.S,P,t)}
function ctx(S,P){const r=P.reg&&S.mood&&S.mood[P.reg]?Math.round(S.mood[P.reg].v):null;
  const me=S.mode==="pres"?"le président de la République":S.mode==="min"?"le ministre "+(S.minis?S.minis.n:""):S.profil==="maire"?"le maire":S.opp?"un responsable de l'opposition":S.mode==="pro"?"un professionnel ("+((window.PRO&&PRO.LIST[S.pro.id])||{n:"professionnel"}).n+")":S.mode==="ing"?"un chef d'entreprise":"un visiteur";
  return {me,humeur:r,date:G.dayLabel(S.day)+" 2026"}}
async function ask(S,P,turns,text){const k=K[P.kind]||K.habitant;const c=ctx(S,P);
  const prompt="Tu joues "+P.n+", "+(P.lab||k.lab)+" à "+(P.ville||"")+" ("+(P.reg?CM.REG[P.reg].n:"Cameroun")+"), dans un jeu de simulation réaliste de la vie politique au Cameroun. "+
   (P.tel?"Tu es au téléphone avec "+c.me+" ("+(S.name||S.nom||"le joueur")+"), qui t'appelle le "+c.date:"Tu reçois "+c.me+" ("+(S.name||S.nom||"le joueur")+") à "+(P.lieu||k.lieu)+", le "+c.date)+". Objet de la rencontre : "+(P.sujet||"visite de terrain")+"."+(P.contexte?" Contexte réel : "+P.contexte:"")+
   (isOff(P)&&dossOf(S,P).length?" Les dossiers de ton portefeuille (parles-en avec ces chiffres, sans en inventer d'autres) : "+dossOf(S,P).slice(0,5).map(d=>d.t+(fmtD(d)?" ("+fmtD(d)+")":"")+(d.cause?" ; blocage : "+d.cause:"")+(d.dem?" ; tu demandes : "+d.dem:"")).join(" | ")+". Tu t'adresses au joueur en l'appelant « "+adr(S)+" ».":" Tes préoccupations : "+k.pb.join(", ")+". Tu attends : "+k.att+".")+(c.humeur!=null?" L'humeur de ta région envers les autorités est de "+c.humeur+"/100.":"")+
   " Parle comme un Camerounais de ton milieu, en français simple et naturel (quelques expressions locales sont bienvenues), poliment mais franchement ; 1 à 3 phrases courtes, pas de listes. Ne sors jamais du personnage. Ne donne jamais d'informations inventées sur des personnes réelles.\n\n"+
   "Conversation jusqu'ici :\n"+turns.map(x=>(x.me?"Visiteur : ":P.n+" : ")+x.t).join("\n")+"\nVisiteur : "+text+"\n\n"+
   "Réponds uniquement avec un objet JSON : {\"reponse\": \"ta réplique\", \"humeur\": nombre de -2 à 2 (ta réaction à ce que le visiteur vient de dire), \"engagement\": \"la promesse précise que le visiteur vient de faire, ou chaîne vide\", \"fin\": true si l'entretien est terminé}.";
  return await sample.json(prompt,{modelTier:"quick",cache:false})}

/* ---------- engagements ---------- */
RENC.tick=function(S){if(!S||!S.engagements)return;for(const e of S.engagements)if(!e.done&&!e.late&&S.day>e.due){e.late=1;window.SYS.cause(S,e.reg,"Promesse non tenue : "+e.t,-3,"promesse");if(S.st)S.st.pop=clamp(S.st.pop-.8,0,100);
  window.SYS.inbox(S,{from:"Rumeurs de terrain",t:"Promesse non tenue à "+(e.ville||"l'intérieur du pays"),b:"« "+e.t+" » : à "+(e.ville||"?")+", on attend toujours. La population se sent trahie.",k:"alerte",reg:e.reg})}};
RENC.card=function(S){const L=(S.engagements||[]).filter(e=>!e.done).slice(-4);if(!L.length)return"";
  return '<div class="card"><b>🤝 Vos engagements de terrain</b>'+L.map(e=>'<div class="row" style="justify-content:space-between;gap:8px"><span class="small">'+esc(e.t)+' — '+esc(e.ville||"")+(e.late?' <b style="color:var(--bad,#e55)">en retard</b>':' · avant le '+esc(G.dayLabel(e.due)))+'</span><button class="btn small" data-eng="'+e.id+'">Tenir'+(S.mode==="pres"||S.mode==="min"||(S.opp&&S.opp.commune)?" (coût)":"")+'</button></div>').join("")+'</div>'};
RENC.bindCard=function(S,root){(root||document).querySelectorAll("[data-eng]").forEach(b=>b.onclick=()=>{const e=S.engagements.find(x=>x.id===b.dataset.eng);if(!e)return;if(!spend(S,.3))return G.toast("Fonds insuffisants pour tenir cet engagement.");
  e.done=1;window.SYS.cause(S,e.reg,"Promesse tenue : "+e.t,e.late?2:4,"promesse");if(S.st)S.st.pop=clamp(S.st.pop+1,0,100);if(S.opp)S.opp.noto=clamp(S.opp.noto+2,0,100);if(S.pro)S.pro.rep=clamp(S.pro.rep+2,0,100);G.toast("Engagement tenu : "+e.t);G.render()})};
function spend(S,md){if(S.mode==="pres"){S.nums.dette+=md;return true}if(S.mode==="min"){const M=md*300;if(S.minis.fonds<M)return false;S.minis.fonds-=M;return true}
  if(S.opp&&S.opp.commune){const M=md*20;if(S.opp.commune.fonds<M)return false;S.opp.commune.fonds-=M;return true}if(S.opp){if(S.opp.fonds<1)return false;S.opp.fonds-=1;return true}return true}

/* ---------- micro (permanent, voir mic.js) ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

/* ---------- l'entretien ---------- */
RENC.open=function(S,o){if(!S||S.phase!=="play")return;const k=K[o.kind]||K.habitant;
  const reg=o.reg||(window.VOY?VOY.here(S).reg:"CE");const ville=o.ville||(window.VOY?VOY.here(S).v:CM.REG[reg].chef);
  const sexe=o.sexe||(o.n?window.SYS.sexe(o.n):o.kind==="commercant"?"f":Math.random()<.35?"f":"m");
  const P={kind:o.kind||"habitant",n:o.n||window.SYS.nom(reg,sexe),lab:o.lab?window.SYS.accord(o.lab,sexe):(sexe==="f"&&o.kind!=="commercant"?fem(k.lab):k.lab),lieu:o.lieu||k.lieu,reg,ville,sujet:o.sujet||"",contexte:o.contexte||"",sexe,min:o.min||null,org:o.org||null,dossier:o.dossier||null,tel:!!o.tel};st(P);
  const turns=[];let micOff=null;let mood=0,eng=null,cost=false,ended=false,busy=false;
  let mode="choix";try{mode=localStorage.getItem("etoudi-renc-mode")||"choix"}catch(e){}
  const vp=$("vxPanel");if(vp)vp.remove();
  if(!o.tel)G.setView&&G.setView({overlay:"conseil"},ville,"Rencontre");
  G.sheet('<span class="eyebrow">'+(o.tel?"📞 Appel téléphonique · ":"Rencontre · ")+esc(ville)+' · '+esc(G.dayLabel(S.day))+'</span><h3 class="h2">'+esc(P.n)+'</h3><p class="small muted">'+esc(P.lab.charAt(0).toUpperCase()+P.lab.slice(1))+' · '+esc(P.lieu)+(P.sujet?' · Objet : '+esc(P.sujet):"")+'</p>'+
   '<div class="row" role="tablist" style="gap:6px"><button class="btn small" data-rm="voix">🎙 Voix</button><button class="btn small" data-rm="texte">⌨ Texte</button><button class="btn small" data-rm="choix">☑ Choix</button></div>'+
   '<div class="vxlog" id="rnLog" style="flex:none;min-height:140px;max-height:38vh;margin:8px 0"></div><div id="rnIn"></div><p class="small muted" id="rnHint"></p>'+
   '<div class="row"><button class="btn ghost" id="rnEnd">Terminer l\'entretien</button></div>',el=>{
    const log=(t,me)=>{const d=document.createElement("div");d.className=me?"me":"it";d.textContent=(me?"Vous : ":P.n+" : ")+t;$("rnLog").appendChild(d);$("rnLog").scrollTop=1e6;turns.push({me,t})};
    const hint=t=>{const h=$("rnHint");if(h)h.textContent=t||""};
    const speak=t=>{try{A.speak(t,{voix:P.sexe,rate:1,pitch:P.sexe==="f"?1.05:.9})}catch(e){}};
    const npc=(t,d)=>{log(t,false);speak(t);if(d)mood+=d};
    const apply=(o,said)=>{if(o.fx.m)mood+=o.fx.m;if(o.fx.order)giveOrder(o.fx.order);if(o.eng&&typeof o.eng==="string")eng=eng||o.eng;else if(o.fx.eng)eng=eng||(o.id==="promesse"?"Action concrète promise à "+(P.kind==="famille"?"la famille":"un "+P.lab)+" de "+P.ville:o.id==="justice"?"Faire aboutir l'enquête ("+P.ville+")":o.id==="calendrier"?"Calendrier écrit de paiement des primes":said);if(o.fx.cost)cost=true;const r=o.r();npc(r);if(o.id==="fin")finish();else if(mode==="choix")draw()};
    const giveOrder=async od=>{if(!window.DIR||!od)return;const d=od.d;const raw=String(od.text||"").trim();if(window.NOTE&&NOTE.matches(raw)){NOTE.handle(S,raw,m=>hint("📝 "+m.slice(0,160)),{ctx:d?d.t:"Entretien avec "+P.n});return}const txt="Je veux "+infin(raw);
      try{await DIR.handle(S,txt,m=>hint("📜 "+m.slice(0,160)),{force:true,ctx:d?d.t:"Entretien avec "+P.n});const L=S.directives||[];const x=L[L.length-1];if(x&&x.start===S.day){if(P.min&&S.mode==="pres")x.resp=P.min;x.qui2=P.n;
        if(window.DOSS&&P.dossier){const md=DOSS.find(S,P.dossier);if(md&&!md.dir){md.dir=x.id;md.suivi.push({j:S.day,t:"Instruction donnée à "+P.n})}}}}catch(e){}};
    const saySome=async text=>{if(ended||busy||!text.trim())return;log(text,true);
      if(sample&&!refused){busy=true;hint("…");const box=$("rnIn");box&&box.querySelectorAll("button,input").forEach(x=>x.disabled=true);
        try{const loc=reply(S,P,text);if(loc.id==="ordre"&&loc.fx.order)giveOrder(loc.fx.order);const j=await ask(S,P,turns.slice(0,-1),text);npc(String(j.reponse||"…"),clamp(+j.humeur||0,-2,2));if(j.engagement&&String(j.engagement).trim())eng=String(j.engagement).trim();hint("");if(j.fin)finish()}
        catch(e){if(e&&e.code==="not_granted")refused=true;hint(e&&e.code==="rate_limited"?"Trop de demandes : réponse simplifiée.":"");apply(fallback(P,text),text)}
        busy=false;box&&box.querySelectorAll("button,input").forEach(x=>x.disabled=false);return}
      apply(fallback(P,text),text)};
    const draw=()=>{el.querySelectorAll("[data-rm]").forEach(b=>{b.classList.toggle("primary",b.dataset.rm===mode);b.setAttribute("aria-pressed",b.dataset.rm===mode)});const box=$("rnIn");if(!box||ended)return;
      if(mode==="choix"){const T=qcm(P);box.innerHTML='<div class="choices">'+T.map(o=>'<button class="choice" data-rq="'+o.id+'"><span class="t">'+esc(o.q)+'</span></button>').join("")+'</div>';
        box.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>{const o=T.find(x=>x.id===b.dataset.rq);log(o.q,true);apply(o,o.q)});hint("")}
      else if(mode==="texte"){box.innerHTML='<div class="row" style="gap:6px"><textarea data-grow rows="1" id="rnTxt" placeholder="Écrivez ce que vous lui dites…" style="flex:1;min-width:0"></textarea><button class="btn primary" id="rnGo">Dire</button></div>';
        const go=()=>{const v=$("rnTxt").value;$("rnTxt").value="";$("rnTxt").style.height="";saySome(v)};$("rnGo").onclick=go;$("rnTxt").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();go()}};setTimeout(()=>{const i=$("rnTxt");i&&i.focus()},50);hint(sample&&!refused?"":"Réponses du moteur intégré (les réponses rédigées par l'IA sont disponibles sur la version en ligne).")}
      else{box.innerHTML='<button class="btn primary" id="rnMic" style="width:100%" aria-pressed="false">🎙 Activer le micro</button>';
        const ui=(st,x)=>{const b=$("rnMic");if(!b)return;b.textContent=MIC.want?(st==="pause"?"⏸ Micro activé — il vous répond… (appuyez pour couper)":"⏹ Micro activé — parlez (appuyez pour couper)"):"🎙 Activer le micro";b.classList.toggle("micon",MIC.want);b.setAttribute("aria-pressed",MIC.want?"true":"false");
          if(st==="tmp")hint("« "+x+" »");else if(st==="blocked"||st==="err"||st==="off"&&!SR)hint(st==="blocked"?"Le micro est bloqué ici (l'application Claude ne donne pas le micro aux jeux). Ouvrez le jeu (lien GitHub) dans Chrome, ou utilisez Texte / Choix.":MIC.msg(st));else if(st==="off")hint("Micro coupé.");else if(st==="on"||st==="wait")hint("Le micro reste ouvert jusqu'à ce que vous le coupiez. Parlez naturellement.")};
        if(micOff)micOff();micOff=MIC.bind({onText:t=>saySome(t),onState:ui,alive:()=>el.isConnected&&mode==="voix"&&!ended});
        $("rnMic").onclick=()=>{if(!SR){hint("La reconnaissance vocale n'existe pas dans ce navigateur (utilisez Chrome). Passez en mode Texte ou Choix.");return}MIC.toggle();ui(MIC.state)};
        if(MIC.want)ui(MIC.state);else hint(SR?"Activez le micro une fois : il reste ouvert pendant tout l'entretien, et se met en pause quand votre interlocuteur parle.":"La reconnaissance vocale n'existe pas dans ce navigateur : utilisez Texte ou Choix.")}};
    el.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{mode=b.dataset.rm;try{localStorage.setItem("etoudi-renc-mode",mode)}catch(e){}draw()});
    function finish(){if(ended)return;ended=true;const box=$("rnIn");if(box)box.innerHTML="";
      let msg="";if(cost&&!spend(S,.2)){mood-=1;msg+="Faute de fonds, l'aide annoncée n'a pas pu être versée. "}
      const d=clamp(mood,-4,6);window.SYS.cause(S,reg,"Rencontre avec "+P.lab+" à "+ville,d,"visite");if(S.st)S.st.pop=clamp(S.st.pop+d*.15,0,100);if(S.opp)S.opp.noto=clamp(S.opp.noto+Math.max(0,d)*.4,0,100);if(S.pro)S.pro.rep=clamp(S.pro.rep+Math.max(0,d)*.3,0,100);
      if(eng){S.engagements=S.engagements||[];S.engagements.push({id:"e"+Date.now().toString(36),t:eng.length>90?eng.slice(0,88)+"…":eng,reg,ville,due:S.day+60,who:P.n});msg+="Engagement noté : à tenir d'ici deux mois. "}
      msg+=d>=2?"L'entretien s'est très bien passé.":d>0?"L'entretien s'est bien passé.":d<0?"Votre interlocuteur repart déçu.":"Entretien sans effet notable.";
      hint(msg);window.SYS.inbox(S,{from:"Carnet de terrain",t:"Rencontre : "+P.n+", "+P.lab,b:turns.map(x=>(x.me?"Vous : ":P.n+" : ")+x.t).join("\n")+"\n\n"+msg,k:"info",read:true,reg});G.toast(msg.slice(0,100));
      const b=$("rnEnd");if(b){b.textContent="Fermer";b.onclick=()=>{el.remove();G.render()}}}
    $("rnEnd").onclick=()=>{if(ended){el.remove();G.render();return}const o=qcm(P).find(x=>x.id==="fin");log(o.q,true);apply(o,o.q)};
    const cl=el.querySelector("[data-close]");if(cl)cl.addEventListener("click",()=>{if(!ended&&turns.length>1)finish()});
    const hello=o.bonjour||(o.tel?"Allô ? Oui, "+adr(S)+", je vous écoute.":isOff(P)?pick(["Mes respects, "+adr(S)+". Je vous écoute.","Bonjour, "+adr(S)+". Soyez le bienvenu."]):null)||pick(["Bonjour, soyez le bienvenu à "+ville+".","Bienvenue ! On ne s'attendait pas à vous voir ici.","Bonjour. Merci d'être venu jusqu'à nous."]);npc(hello);draw()});
};
function fem(l){return l.replace(/^producteur/,"productrice").replace(/^planteur/,"planteuse").replace(/^cultivateur/,"cultivatrice").replace(/^pêcheur/,"pêcheuse").replace(/^enseignant/,"enseignante").replace(/^étudiant/,"étudiante").replace(/^habitant/,"habitante").replace(/^supporter/,"supportrice").replace(/^responsable syndical/,"responsable syndicale").replace(/^chef traditionnel/,"reine-mère")}

/* boutons « S'entretenir » dans les fiches d'organisations */
RENC.orgBtn=function(){return '<button class="btn" data-renc="1">💬 S\'entretenir (voix, texte ou choix)</button>'};
RENC.bindOrg=function(S,el,k,o){const b=el.querySelector("[data-renc]");if(!b)return;b.onclick=()=>{el.remove();
  if(window.CAB){const n=k==="hop"?o.dir:k==="ent"?o.dg:o.n;const P={k:k==="hop"?"hop":k==="ent"?"ent":k==="prefet"?"prefet":k==="police"?"police":k==="gouverneur"?"gouverneur":"org",n:String(n||"").replace(/^(Colonel|Commissaire)\s+/,""),lab:k==="hop"?"le directeur de "+o.n:k==="ent"?"le directeur général de "+o.n:"le responsable",reg:o.reg,org:{k,id:o.id},min:k==="hop"?"MINSANTE":o.tut};
    P.sexe=window.SYS.sexe(P.n);P.lab=window.SYS.accord(P.lab,P.sexe);const st=CAB.status(S,P);if(st&&!st.ok){CAB.unavailable(S,P,st,{objet:"point sur "+(k==="hop"?"l'hôpital":k==="ent"?"l'entreprise":"la situation"),when:"maintenant"});return}}
  const lab=k==="hop"?"directeur de "+o.n:k==="ent"?"directeur général de "+o.n:k==="police"?"commissaire central":k==="prefet"?"préfet":k==="gouverneur"?"gouverneur de la région":"commandant de légion";
  RENC.open(S,{kind:k==="hop"?"medecin":"officiel",n:k==="hop"?o.dir:k==="ent"?o.dg:o.n,lab,reg:o.reg,ville:o.ville||(o.reg?CM.REG[o.reg].chef:null),org:{k,id:o.id},min:k==="hop"?null:(o.tut||null),lieu:k==="hop"?"son bureau à l'hôpital":"son bureau",sujet:"point sur "+(k==="hop"?"l'hôpital":k==="ent"?"l'entreprise":"la situation")})}};
})();
