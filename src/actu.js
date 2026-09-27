/* Chemin d'Etoudi — actualités réelles : chaque jour, des faits vrais du Cameroun (collectés sur internet) arrivent dans le jeu.
   Ils touchent l'humeur de la région concernée et arrivent au courrier ; l'autorité compétente (président, ministre de tutelle,
   maire ou élu de la région, professionnels concernés) peut agir : descente sur le terrain, aide d'urgence, enquête, communiqué…
   Sources : le lot intégré (actus-data.js) + la base de l'artefact (collection "actus", un document par jour), mise à jour quotidienne. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,clamp=G.clamp;
const ACTU={};window.ACTU=ACTU;
let items=[],maj=null,live=false;
const CAT={violence:"Faits divers",accident:"Accident",securite:"Sécurité",sante:"Santé",catastrophe:"Catastrophe",social:"Social",education:"Éducation",
  economie:"Économie",politique:"Politique",sport:"Sport",justice:"Justice",infra:"Infrastructures",environnement:"Environnement",culture:"Culture"};
const VIDK={violence:"police enquête",accident:"accident route",securite:"attaque sécurité",sante:"hôpital",catastrophe:"inondation glissement",social:"grève manifestation",
  education:"grève université",economie:"port douane",politique:"conférence de presse",sport:"stade match",infra:"route nids de poules",environnement:"inondation"};
const frDate=d=>{try{const [y,m,j]=d.split("-").map(Number);return j+(j===1?"er":"")+" "+["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"][m-1]+" "+y}catch(e){return d}};
function merge(list,m){for(const it of list||[]){if(!it||!it.id||!it.titre)continue;const i=items.findIndex(x=>x.id===it.id);if(i>=0)items[i]=it;else items.push(it)}
  items.sort((a,b)=>(b.date||"").localeCompare(a.date||""));items=items.slice(0,80);if(m&&(!maj||m>maj))maj=m}
merge((window.ACTUS_SEED||{}).items,(window.ACTUS_SEED||{}).maj);
ACTU.all=()=>items.slice();ACTU.maj=()=>maj;ACTU.live=()=>live;

/* base de l'artefact : lecture seule pour la page, alimentée chaque jour par Claude */
(async function(){try{if(!window.claude||!claude.use)return;const db=await claude.use("db");if(!db)return;
  db.collection("actus").orderBy("date","desc").limit(14).onSnapshot(snap=>{const L=[];snap.forEach?snap.forEach(d=>L.push(d.data())):(snap.docs||[]).forEach(d=>L.push(d.data()));
    live=true;for(const d of L)merge(d.items,d.maj||d.date);const S=G.S;if(S&&S.phase==="play"){if(ACTU.sync(S))G.render()}},()=>{})}catch(e){}})();

/* version publique (sans Claude) : le lot du jour est aussi déposé sur GitHub */
(async function(){try{const r=await fetch("https://raw.githubusercontent.com/farroteur2016-afk/chemin-etoudi/main/actus.json",{cache:"no-store"});if(!r.ok)return;const j=await r.json();
  merge(j.items,j.maj);live=true;const S=G.S;if(S&&S.phase==="play"&&ACTU.sync(S))G.render()}catch(e){}})();

/* qui est compétent ? */
function reg(it){return it.reg&&CM.REG[it.reg]?it.reg:null}
function home(S){return S.opp?(S.opp.commune?S.opp.commune.reg||S.opp.home:S.opp.home):S.pro?S.pro.reg:S.ent?S.ent.reg:S.minis?S.minis.home:null}
function role(S,it){const r=reg(it);
  if(S.mode==="pres")return it.grav>0?"pres":"info";
  if(S.mode==="min")return (it.aut||[]).includes(S.minis.id)?"min":"info";
  if(S.profil==="maire")return r&&r===home(S)?"maire":"opp";
  if(S.mode==="opp"||S.opp)return it.grav>0?"opp":"info";
  if(S.mode==="pro"){const p=S.pro.id||"";if(it.grav>0&&((/medecin|infirm|sage/.test(p)&&/violence|accident|sante|catastrophe|securite/.test(it.cat))||(/avocat|jurist/.test(p)&&/violence|justice|politique/.test(it.cat))||(/enseign|prof/.test(p)&&it.cat==="education")||(/journal/.test(p))))return "pro";return "info"}
  if(S.mode==="ing")return it.grav>0&&/accident|infra|catastrophe/.test(it.cat)?"pro":"info";
  return "info"}
ACTU.role=role;

/* arrivée des nouvelles dans la partie */
ACTU.sync=function(S){if(!S||S.phase!=="play"||!items.length)return false;S.actusVus=S.actusVus||[];
  const fresh=items.filter(it=>!S.actusVus.includes(it.id));if(!fresh.length)return false;
  // au premier lancement, on ne verse que la semaine la plus récente
  const newest=fresh.reduce((a,b)=>a>(b.date||"")?a:(b.date||""),"");const lim=S.actusVus.length?"":new Date(new Date(newest).getTime()-14*864e5).toISOString().slice(0,10);
  let n=0;for(const it of fresh.slice().reverse()){S.actusVus.push(it.id);if(lim&&(it.date||"")<lim)continue;n++;
    const r=reg(it),rl=role(S,it);const sign=it.cat==="sport"||it.bon?1:-1;const d=sign*(it.grav?it.grav:1);
    if(r)window.SYS.cause(S,r,it.titre,d*1.2,it.cat);else if(S.mood&&it.grav>=2)for(const R of CM.REGIONS)window.SYS.cause(S,R.id,it.titre,d*.4,it.cat);
    const comp=rl!=="info";
    window.SYS.inbox(S,{from:"Actualité réelle · "+(CAT[it.cat]||"Société"),t:it.titre,
      b:"Fait du "+frDate(it.date)+".\n"+it.resume+"\nLieu : "+(it.lieu?it.lieu+", ":"")+(it.ville||"tout le pays")+(r?" ("+CM.REG[r].n+")":"")+"\nSource : "+(it.src||"presse camerounaise")+(comp?"\nVous êtes l'autorité compétente : que décidez-vous ?":""),
      k:comp&&it.grav>=2?"alerte":"info",reg:r,actu:it.id})}
  S.actusVus=S.actusVus.slice(-400);
  if(n){const top=fresh.find(it=>role(S,it)!=="info"&&it.grav>=2);G.toast(top?"Fait réel : "+top.titre:n+" nouvelle"+(n>1?"s":"")+" actualité"+(n>1?"s":"")+" réelle"+(n>1?"s":"")+" au courrier")}
  return n>0};

/* décisions possibles depuis le courrier */
const ACTS={
  pres:[["terrain","Me rendre sur place"],["ministre","Dépêcher le ministre compétent"],["aide","Débloquer une aide d'urgence (1 Md)"],["enquete","Ordonner une enquête"],["convoque","Convoquer le ministre compétent demain à 9 h"],["communique","Message à la nation / condoléances"]],
  min:[["terrain","Descente sur le terrain"],["aide","Mesures d'urgence sur le budget du ministère (100 M)"],["rapport","Rapport au président de la République"],["communique","Communiqué du ministère"]],
  maire:[["terrain","Me rendre sur place"],["aide","Aide de la commune (5 M)"],["saisir","Saisir le préfet et le gouverneur"],["communique","Message aux habitants"]],
  opp:[["terrain","Visite de solidarité sur place"],["communique","Communiqué du parti"],["question","Interpeller le gouvernement"]],
  pro:[["terrain","Me rendre sur place"],["aider","Proposer mes services bénévolement"]],
  info:[]};
ACTU.mailActs=function(S,it){if(!it.actu)return"";const a=items.find(x=>x.id===it.actu);if(!a)return"";const rl=role(S,a);S.actuFait=S.actuFait||{};const done=S.actuFait[a.id]||[];
  let h=(ACTS[rl]||[]).filter(([k])=>!done.includes(k)).map(([k,l])=>'<button class="btn'+(k==="terrain"?" primary":"")+'" data-ax="'+k+'">'+esc(l)+'</button>').join("");
  if(a.url)h+='<a class="btn ghost" href="'+esc(a.url)+'" target="_blank" rel="noopener">Lire la source</a>';
  if(window.VID&&!it.reg)h+=VID.btn(a.titre+" "+(VIDK[a.cat]||""),null,"Voir la vidéo");
  return h};
function place(a){const c=a.ville&&window.VOY&&VOY.city(a.ville);const r=reg(a)||"CE";return c?{reg:c.reg||r,v:c.n,lieu:a.lieu||null}:{reg:r,v:CM.REG[r].chef,lieu:a.lieu||null}}
function autMin(S,a){const id=(a.aut||[])[0];const m=id&&E.MINISTERES.find(x=>x.id===id);return m?{id:m.id,m,g:S.gov&&S.gov.min?S.gov.min[m.id]:null}:null}
function pay(S,md){if(S.mode==="pres"){S.nums.dette+=md;return true}if(S.mode==="min"){const M=md*1000;if(S.minis.fonds<M)return false;S.minis.fonds-=M;return true}
  if(S.opp&&S.opp.commune){const M=md*1000;if(S.opp.commune.fonds<M)return false;S.opp.commune.fonds-=M;return true}return true}
function who(a){return a.cat==="violence"||a.cat==="securite"||a.cat==="accident"||a.cat==="catastrophe"?"famille":a.cat==="education"?"syndicat":a.cat==="sport"?"sportif":a.cat==="economie"?"operateur":"habitant"}
ACTU.mailBind=function(S,it,el){if(!it.actu)return;const a=items.find(x=>x.id===it.actu);if(!a)return;S.actuFait=S.actuFait||{};
  el.querySelectorAll("[data-ax]").forEach(b=>b.onclick=()=>{const k=b.dataset.ax;const r=reg(a);const done=S.actuFait[a.id]=S.actuFait[a.id]||[];const am=autMin(S,a);let msg="";
    const good=(d,t)=>{if(r)window.SYS.cause(S,r,t,d,a.cat);else for(const R of CM.REGIONS)window.SYS.cause(S,R.id,t,d*.4,a.cat)};
    if(k==="terrain"){el.remove();done.push(k);const to=place(a);const p=window.VOY?VOY.goTo(S,to,null,true,()=>{good(2,"Visite de terrain après : "+a.titre);if(S.st)S.st.pop=clamp(S.st.pop+.6,0,100);if(S.opp)S.opp.noto=clamp(S.opp.noto+2,0,100);
        if(window.RENC)setTimeout(()=>RENC.open(S,{kind:who(a),reg:to.reg,ville:to.v,sujet:a.titre,contexte:a.resume}),700);G.render()}):"voyage indisponible";
      if(p){G.toast("Déplacement impossible : "+p);done.pop()}return}
    if(k==="ministre"){good(1.5,"Le ministre dépêché sur place : "+a.titre);if(am&&am.g)am.g.loy=clamp(am.g.loy+1,0,100);msg=(am?(am.g&&am.g.n?am.g.n+", ministre "+(/^[AEÉIOU]/.test(am.m.n)?"de l'":"de la ")+am.m.n:"Le ministre compétent"):"Le ministre compétent")+" se rend à "+(a.ville||"l'endroit concerné")+" dès demain."}
    else if(k==="aide"){const md=S.mode==="pres"?1:S.mode==="min"?.1:.005;if(!pay(S,md))return G.toast("Fonds insuffisants.");good(3,"Aide d'urgence : "+a.titre);if(S.st)S.st.soc=clamp(S.st.soc+.5,0,100);if(S.minis)S.minis.perf=clamp(S.minis.perf+2,0,100);msg="L'aide d'urgence est débloquée et acheminée vers "+(a.ville||"les zones touchées")+"."}
    else if(k==="enquete"){good(1.5,"Enquête ordonnée : "+a.titre);if(S.st)S.st.int=clamp(S.st.int+.8,0,100);msg="Une enquête est ouverte. Le parquet vous rendra compte."}
    else if(k==="convoque"){if(!am)return G.toast("Aucun ministre identifié.");const at=Math.floor(S.day+1/3)+1+9/24-1/3;S.agenda=S.agenda||[];
      S.agenda.push({id:"a"+Date.now(),type:"meet",at,who:{k:"min",id:am.id,lab:(am.id==="DGSN"?"le délégué général à la Sûreté nationale":"le ministre "+(/^[AEÉIOU]/.test(am.m.n)?"de l'":"de la ")+am.m.n),n:am.g?am.g.n:null,min:am.id},objet:a.titre,lab:"Audience : "+a.titre.slice(0,50)});msg="Audience fixée demain à 9 h."}
    else if(k==="communique"){good(1,"Message officiel : "+a.titre);if(S.st)S.st.pop=clamp(S.st.pop+.4,0,100);if(S.opp)S.opp.noto=clamp(S.opp.noto+1,0,100);msg="Votre message est repris par les médias."}
    else if(k==="rapport"){if(S.minis)S.minis.conf=clamp(S.minis.conf+2,0,100);msg="Rapport transmis à la Présidence."}
    else if(k==="saisir"){good(.8,"La mairie saisit les autorités : "+a.titre);msg="Le préfet et le gouverneur sont saisis."}
    else if(k==="question"){if(S.opp)S.opp.noto=clamp(S.opp.noto+2,0,100);msg="Votre interpellation fait réagir le gouvernement."}
    else if(k==="aider"){if(S.pro)S.pro.rep=clamp(S.pro.rep+3,0,100);if(S.ent)S.ent.rep=clamp((S.ent.rep||50)+3,0,100);good(1,"Des professionnels se mobilisent : "+a.titre);msg="Votre aide est appréciée ; votre réputation progresse."}
    done.push(k);el.remove();G.toast(msg);try{window.Audio2.speak(msg,{voix:"f"})}catch(e){}window.SYS.inbox(S,{from:"Suivi",t:"Décision : "+a.titre.slice(0,70),b:msg,k:"info",read:true,reg:r});G.render()})};

/* carte « À la une » sur les écrans principaux */
ACTU.card=function(S){const L=items.slice(0,3);if(!L.length)return"";
  return '<div class="card"><div class="row" style="justify-content:space-between"><b>📰 Actualité réelle du Cameroun</b><span class="small muted">'+(live?"mise à jour quotidienne":"lot intégré")+(maj?" · "+esc(frDate(maj)):"")+'</span></div>'+
   L.map(it=>'<button class="choice" data-actu="'+esc(it.id)+'"><span class="t">'+esc(it.titre)+'</span><span class="small muted">'+esc((CAT[it.cat]||"")+" · "+frDate(it.date)+(it.ville?" · "+it.ville:""))+'</span></button>').join("")+'</div>'};
ACTU.bindCard=function(S,root){(root||document).querySelectorAll("[data-actu]").forEach(b=>b.onclick=()=>{const m=S.inbox.find(i=>i.actu===b.dataset.actu);if(m)window.SYS.openMail(S,m.id);else{const a=items.find(x=>x.id===b.dataset.actu);if(a)G.sheet('<span class="eyebrow">'+esc(frDate(a.date))+'</span><h3 class="h2">'+esc(a.titre)+'</h3><p>'+esc(a.resume)+'</p>'+(a.url?'<a class="btn" href="'+esc(a.url)+'" target="_blank" rel="noopener">Lire la source</a>':""))}})};
})();
