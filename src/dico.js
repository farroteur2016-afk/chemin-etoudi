/* Chemin d'Etoudi — dictionnaire du jeu : corrige les fautes de frappe et d'orthographe avant que l'assistant analyse
   une consigne (« eesence » → essence, « gazoil » → gasoil, « cacérale » → carcérale, « parket » → parquet…).
   Lexique : mots-clés du jeu + noms propres (villes, régions, ministères, entreprises, hôpitaux) ; correction
   seulement si le mot est inconnu et très proche d'un seul mot du lexique. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT;
const DICO={};window.DICO=DICO;
const nf=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const BASE=("essence gasoil gazole carburant carburants pétrole lampant structure structuration coût coûts prix pompe carcérale prison prisons prisonnier prisonniers détenu détenus parquet procureur "+
 "enquête enquêtes audition auditions tribunal justice ministre ministres ministère ministères gouverneur gouverneurs préfet préfets commissaire directeur directrice général générale généraux "+
 "hôpital hôpitaux convoque convoquer convoquez convocation rendez-vous audience audiences demain après-demain lundi mardi mercredi jeudi vendredi samedi dimanche semaine semaines mois heure heures "+
 "directive directives instruction instructions rapport rapports note notes proposition propositions situation sécurité santé éducation enseignement supérieur secondaire défense finances économie agriculture élevage "+
 "commerce transports travaux publics électricité délestage délestages coupure coupures eau potable route routes pont ponts construire construction bitumer réhabiliter université universités "+
 "grève grèves syndicat syndicats enseignants enseignant primes prime salaires salaire arriérés patrimoine déclaration déclarations corruption détournement détournements audit femmes parité "+
 "gouvernement président présidence présidentiel palais cortège escorte chauffeur hélicoptère avion voiture train bus taxi moto urgence urgent urgemment immédiatement téléphone appel appeler "+
 "appelez joindre visite visiter rencontrer rencontre producteur producteurs productrice cacao café coton banane plantain pêcheur pêcheurs commerçante commerçants marché marchés chef chefferie "+
 "traditionnel village villages ville villes région régions actualité actualités nouvelles accident accidents naufrage attaque attaques incendie inondation inondations glissement féminicides "+
 "victimes victime familles famille aide subvention subventions réduire baisser augmenter diminuer recruter délégation ambassadeurs ambassadeur ambassade conférence budget dette déficit inflation "+
 "population habitants emploi chômage jeunes jeunesse séparatistes terrorisme armée militaires police gendarmerie douane douanes impôts taxes taxe fiscalité exonération investissement "+
 "infrastructure infrastructures barrage barrages centrale réseau médicaments épidémie choléra paludisme vaccination maternité écoles collège lycée étudiants bourse bourses "+
 "ramener ramenez rentrer retourner conduire emmener déplacement voyage aéroport gare port chemin fer raffinerie contrebande fraude marge marges distributeurs stockage importation solaire solaires forage forages alimentation réfugiés réfugié déplacés revalorisation hommes tenue gendarmes policiers policier militaire armée prestataire prestataires vidéosurveillance surveillance caméras train vie missions").split(/\s+/);
const TYPO={alimentaion:"alimentation",revaloration:"revalorisation",refugies:"réfugiés",gazoil:"gasoil",parket:"parquet",gazoil:"gasoil",gazole:"gasoil",petrol:"pétrole",prisonier:"prisonnier",prisoniers:"prisonniers",cacerale:"carcérale",carcerale:"carcérale",eesence:"essence",esence:"essence",
  ministe:"ministre",minstre:"ministre",gouvernemnt:"gouvernement",gouvernment:"gouvernement",convoqe:"convoque",convoc:"convoque",hopitale:"hôpital",hopitaux:"hôpitaux",universite:"université",
  parite:"parité",securite:"sécurité",sante:"santé",electricite:"électricité",delestage:"délestage",situaton:"situation",situtation:"situation",propostion:"proposition",propostions:"propositions",
  directve:"directive",directeu:"directeur",telphone:"téléphone",telephon:"téléphone",apelle:"appelle",apeler:"appeler",apel:"appel",prefe:"préfet",reduir:"réduire",structuraton:"structuration"};
let LEX=null,SET=null;
function build(){const L=new Map();const add=w=>{w=String(w||"").trim();if(w.length<4)return;const k=nf(w);if(!L.has(k))L.set(k,w)};
  BASE.forEach(add);
  try{for(const r of CM.REGIONS){r.n.split(/[\s-]+/).forEach(add);add(r.chef);(r.villes||[]).forEach(add)}}catch(e){}
  try{if(window.VOY)VOY.CITIES.forEach(c=>add(c.n))}catch(e){}
  try{E.MINISTERES.forEach(m=>m.n.split(/[\s,()']+/).forEach(add))}catch(e){}
  try{const S=window.GAME&&GAME.S;if(S&&S.org){S.org.ent.forEach(e=>{add(e.id);e.n.split(/\s+/).forEach(add)});S.org.hop.forEach(h=>h.n.split(/\s+/).forEach(add))}}catch(e){}
  LEX=L;SET=new Set(L.keys())}
function dist(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const m=a.length,n=b.length;let p2=null,p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];let mn=i;for(let j=1;j<=n;j++){let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(p2&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,p2[j-2]+1);c[j]=v;if(v<mn)mn=v}if(mn>max)return max+1;p2=p;p=c}return p[n]}
/* mots français courants à ne jamais « corriger » */
const KEEP=new Set("affaire affaires dossier dossiers appeliez appelle appeler telephone telephoner discuter parler monsieur madame excellence avec dans pour vous nous elle elles leur leurs mais donc alors aussi tres tout tous toute toutes faire fais faites veux voudrais peux pouvez avoir etre suis sont etait sera quand comment combien pourquoi quelle quel quels quelles cette ceux celle celui ainsi apres avant depuis entre sans sous chez vers plus moins bien mieux encore toujours jamais deja donner donnez donne moi toi lui meme autre autres chose choses place temps jour jours annee annees point partie compte rende rendre discute discuter tout suite porte porter parle parler grand grande petit petite nouveau nouvelle premier premiere dernier derniere".split(" "));
DICO.fix=function(raw){if(!raw)return raw;if(!LEX)build();let changed=false;
  const out=String(raw).replace(/[A-Za-zÀ-ÿ'-]+/g,w=>{const parts=w.split(/(['-])/);return parts.map(x=>{if(x.length<4||/['-]/.test(x))return x;const k=nf(x);if(TYPO[k]){changed=true;return TYPO[k]}if(SET.has(k)||KEEP.has(k)||k.length<5)return x;
    const max=k.length>=9?2:1;let best=null,bd=max+1,tie=false;for(const c of SET){if(Math.abs(c.length-k.length)>max||c[0]!==k[0]&&k.length<7)continue;const d=dist(k,c,max);if(d<bd){bd=d;best=c;tie=false}else if(d===bd&&best&&LEX.get(c)!==LEX.get(best))tie=true}
    if(best&&bd<=max&&!tie&&!(k.length>=7&&best.slice(0,6)===k.slice(0,6))&&best+"s"!==k&&k+"s"!==best&&best+"x"!==k&&k+"x"!==best&&!/(iez|ions|ez|ent|ait|ais)$/.test(k)){changed=true;const v=LEX.get(best);return x===x.toLowerCase()&&v!==v.toUpperCase()?v.toLowerCase():v}return x}).join("")});
  DICO.last=changed?out:null;return out};
DICO.rebuild=()=>{LEX=null};
})();
