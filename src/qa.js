/* Chemin d'Etoudi — questions au jeu : l'assistant répond à partir de l'état réel de la partie
   (où suis-je, point sur un événement ou un lieu, directives, agenda, engagements, humeur d'une région, finances…).
   Recherche plein texte dans les actualités réelles, le courrier et les directives ; en ligne, Claude reformule
   les questions libres à partir d'un résumé de la partie. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const QA={};window.QA=QA;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const STOP=new Set("les des une pour avec dans sur par que qui quoi quel quelle quels quelles est sont ete etait fait faire mon mes son ses leur vous nous moi toi tout tous plus point situation actuellement actuel actuelle comment combien pourquoi quand ou dit dis donne donner peux savoir veux aussi alors cette celle celui ceux avoir etre eu lieu a au aux du de la le un il elle on en y".split(" "));
const toks=t=>norm(t).split(" ").filter(w=>w.length>2&&!STOP.has(w));
const stem=w=>w.slice(0,6);
let sample=null;(async()=>{try{if(window.claude&&claude.use)sample=await claude.use("sample")}catch(e){}})();let refused=false;
const Q=/^(ou |quel|quelle|quels|quelles|comment|combien|pourquoi|quand|qui |qu est|que se passe|est ce|c est quoi|dis moi|donne moi|rappelle moi|fais le point|fais moi le point|le point|point sur|ou en est|des nouvelles|quoi de neuf)/;
QA.isQuestion=raw=>{const t=norm(raw);return /\?\s*$/.test(String(raw))||Q.test(t)};

function place(t){for(const r of CM.REGIONS){const rn=norm(r.n);const re=rn==="est"?/\b(l est|region est|a l est|dans l est)\b/:new RegExp("\\b"+rn+"\\b");if(re.test(t))return{reg:r.id,v:null};for(const v of [r.chef].concat(r.villes||[]))if(new RegExp("\\b"+norm(v)+"\\b").test(t))return{reg:r.id,v}}
  if(window.VOY)for(const c of VOY.CITIES)if(new RegExp("\\b"+norm(c.n)+"\\b").test(t))return{reg:c.reg,v:c.n};return null}
const jours=d=>{const n=Math.round(d);return n<=0?"aujourd'hui":n===1?"dans 1 jour":"dans "+n+" jours"};

/* recherche plein texte : actualités, courrier, directives */
function search(S,t,pl){const T=toks(t).map(stem);const R=[];
  const score=(txt,extra)=>{const X=new Set(toks(txt).map(stem));let s=0;for(const w of T)if(X.has(w))s+=w.length>4?2:1;return s+(extra||0)};
  if(window.ACTU)for(const a of ACTU.all()){const bonus=pl&&(a.reg===pl.reg||(pl.v&&norm(a.ville||"")===norm(pl.v)))?3:0;const s=score(a.titre+" "+a.resume+" "+(a.ville||"")+" "+(a.lieu||""),bonus);if(s>=2)R.push({k:"actu",s:s+.5,a})}
  for(const m of S.inbox||[]){if(m.actu)continue;const s=score(m.t+" "+m.b,pl&&m.reg===pl.reg?2:0);if(s>=3)R.push({k:"mail",s,m})}
  for(const d of S.directives||[]){const s=score(d.titre+" "+d.texte,pl&&d.reg===pl.reg?2:0);if(s>=2)R.push({k:"dir",s:s+.3,d})}
  return R.sort((a,b)=>b.s-a.s)}
function actuPoint(S,a){const fait=(S.actuFait||{})[a.id]||[];const lab={terrain:"visite sur place",ministre:"ministre dépêché",aide:"aide d'urgence débloquée",enquete:"enquête ordonnée",convoque:"ministre convoqué",communique:"message officiel",rapport:"rapport transmis",saisir:"autorités saisies",question:"gouvernement interpellé",aider:"aide proposée"};
  const r=a.reg&&S.mood&&S.mood[a.reg]?Math.round(S.mood[a.reg].v):null;
  return a.titre+". "+a.resume+(fait.length?" Vos décisions : "+fait.map(k=>lab[k]||k).join(", ")+".":" Vous n'avez encore pris aucune décision sur ce dossier : il est dans votre courrier.")+(r!=null?" L'humeur de la région "+CM.REG[a.reg].n+" est à "+r+" sur 100.":"")}
function dirPoint(S,d){return d.titre+(d.titre.startsWith("Directive")?"":" — « "+d.texte+" »")+". "+(d.done?"Échéance passée : le compte rendu est dans votre courrier.":"Rapport attendu le "+G.dayLabel(d.due)+" ("+jours(d.due-S.day)+").")}

QA.handle=function(S,raw,reply,opt){opt=opt||{};if(!S||S.phase!=="play")return false;const t=window.DICO?DICO.n(raw):norm(raw);
  if(window.DOSS&&DOSS.isAsk(raw)){reply(DOSS.summary(S));return true}
  if(window.SAV&&SAV.handle(S,raw,reply))return true;
  if(window.AG&&AG.isAsk(t)){reply(AG.summary(S));return true}const pl=place(t);
  if(/(quelle heure|quel jour|quelle date|qui est|qui dirige|comment s appelle)/.test(t)&&!opt.final)return false;
  // où est / que fait un responsable
  if(/\b(ou est|ou se trouve|ou se trouvent|que fait|il est ou|elle est ou|ou sont|ou est ce que se trouve|joignable)\b/.test(t)&&window.VOIX&&VOIX.findPerson&&window.CAB){const P=VOIX.findPerson(S,raw);if(P&&P.n&&!/^le /.test(P.n)){const w=CAB.where(S,P);if(w){const f=P.sexe==="f";const rdv=(S.agenda||[]).some(a=>!a.done&&a.type==="meet"&&a.who&&a.who.n===P.n);if(rdv){reply(w);QA._last=P;return true}reply(w+" Voulez-vous "+(f?"la":"le")+" convoquer ? Dites par exemple : « convoque-"+(f?"la":"le")+" demain à 9 h ».");QA._last=P;return true}}}
  // où suis-je
  if(/(ou (je suis|suis je|je me trouve|me trouve je|sommes nous|est ce que je suis)|dans quelle ville|quelle ville|ma position|ou suis|si je suis|suis je (au|dans|a)|je suis (au|dans) (le |la )?(palais|rue|bureau)|au palais ou dans la rue|dans la rue ou au palais)/.test(t)){const h=window.VOY?VOY.here(S):null;if(h&&h.pays){reply("Vous êtes à l'étranger : "+h.v+" ("+h.pays+")"+(h.lieu?", "+h.lieu.charAt(0).toLowerCase()+h.lieu.slice(1):"")+".");return true}if(h){
    const rue=(window.Ultra&&Ultra.inStreet&&Ultra.inStreet())||(window.Scene3D&&Scene3D.inStreet&&Scene3D.inStreet());const au=l=>/^palais/i.test(l)?"au "+l.charAt(0).toLowerCase()+l.slice(1):/^(hôpital|h[oô]pital|immeuble|stade|port|march[eé]|aéroport|a[eé]roport)/i.test(l)?(/^[aeiouhéô]/i.test(l)?"à l'":"au ")+l.charAt(0).toLowerCase()+l.slice(1):"à "+l;
    const bureau=S.mode==="pres"&&h.v==="Yaoundé"&&!h.lieu?"au palais d'Etoudi":S.mode==="pres"&&h.lieu?au(h.lieu):S.mode==="min"&&h.v==="Yaoundé"&&!h.lieu?"à votre ministère":h.lieu||"en ville";
    reply("Vous êtes "+(rue?"dans la rue, à pied, à "+h.v:(h.lieu&&S.mode!=="pres"?au(h.lieu)+", à "+h.v:bureau+(bureau.includes(h.v)?"":", à "+h.v)))+", région "+(/^[AEIOUÉ]/.test(CM.REG[h.reg].n)?"de l'":"du ")+CM.REG[h.reg].n+"."+(rue?" Pour revenir, touchez « Quitter la rue ».":""));return true}}
  // prisons
  if(/(prison|prisonnier|detenu|carcer|cacer|penitenti|kondengui|new bell|incarcer|surpopulation)/.test(t)&&S.prisons&&S.prisons.length){const P=S.prisons;const tot=P.reduce((a,x)=>a+x.prev+x.cond,0),cap=P.reduce((a,x)=>a+x.cap,0),prev=P.reduce((a,x)=>a+x.prev,0);
    const pl=place(t);const L=pl?P.filter(x=>x.reg===pl.reg):P;const top=L.slice().sort((a,b)=>(b.prev+b.cond)/b.cap-(a.prev+a.cond)/a.cap).slice(0,3);
    reply((pl?"Région "+CM.REG[pl.reg].n+" : les prisons ":"Les prisons ")+(pl?"de la région ":"du pays ")+"comptent "+L.reduce((a,x)=>a+x.prev+x.cond,0).toLocaleString("fr-FR")+" détenus pour "+L.reduce((a,x)=>a+x.cap,0).toLocaleString("fr-FR")+" places"+(pl?"":" (taux d'occupation "+Math.round(tot*100/cap)+" %). "+Math.round(prev*100/tot)+" % sont des prévenus en attente de jugement")+". Les plus surpeuplées : "+top.map(x=>x.n+" ("+Math.round((x.prev+x.cond)*100/x.cap)+" %)").join(", ")+". Le détail est dans l'onglet Justice.");return true}
  // chiffres du pays
  if(/(combien d habitants|population du pays|nombre d habitants)/.test(t)&&S.nums){reply("Le Cameroun compte environ "+(S.nums.popu/1e6).toFixed(1).replace(".",",")+" millions d'habitants (estimation du jeu).");return true}
  if(/inflation|hausse des prix/.test(t)&&S.nums&&S.nums.inflation!=null){reply("L'inflation est de "+(+S.nums.inflation).toFixed(1).replace(".",",")+" % sur un an.");return true}
  // agenda
  if(/(agenda|rendez vous|rdv|audiences? prevues?|mon programme|qu est ce que j ai (demain|aujourd hui))/.test(t)){const L=(S.agenda||[]).filter(a=>!a.done).sort((a,b)=>a.at-b.at);reply(L.length?"Votre agenda : "+L.slice(0,6).map(a=>a.lab+", le "+G.dayLabel(a.at)).join(" ; ")+".":"Votre agenda est vide.");return true}
  // directives
  if(/directive|instructions? (donnees|en cours)|decisions? en cours|ou en (est|sont)/.test(t)&&!(pl&&!/directive/.test(t))){const L=(S.directives||[]).filter(d=>!d.done);const hit=search(S,t,pl).find(x=>x.k==="dir");
    if(hit&&toks(t).length>2){reply(dirPoint(S,hit.d));return true}reply(L.length?L.length+" directive"+(L.length>1?"s":"")+" en cours : "+L.map(d=>dirPoint(S,d)).join(" ")+" Touchez la carte « Directives en cours » pour le détail.":"Aucune directive en cours.");return true}
  // engagements
  if(/(promesses?|engagements?)/.test(t)){const L=(S.engagements||[]).filter(e=>!e.done);reply(L.length?"Engagements à tenir : "+L.map(e=>e.t+" ("+(e.late?"en retard":"avant le "+G.dayLabel(e.due))+")").join(" ; ")+".":"Aucun engagement en attente.");return true}
  // finances
  if(/(dette|budget|tresor|caisse|argent|finances publiques|fonds|combien j ai|mon salaire|mes economies)/.test(t)&&!pl){let m="";if(S.mode==="pres"&&S.nums)m="La dette publique est de "+Math.round(S.nums.dette)+" milliards de FCFA"+(S.nums.deficit!=null?", déficit annuel "+Math.round(S.nums.deficit)+" milliards":"")+".";
    else if(S.mode==="min"&&S.minis)m="Crédits disponibles de votre ministère : "+Math.round(S.minis.fonds)+" millions de FCFA.";else if(S.opp&&S.opp.commune)m="Caisse de la commune : "+Math.round(S.opp.commune.fonds)+" millions de FCFA.";else if(S.opp)m="Trésorerie du parti : "+Math.round(S.opp.fonds)+" millions de FCFA.";
    if(window.EMP){try{m+=" Vos finances personnelles : "+Math.round(EMP.wallet(S)).toLocaleString("fr-FR")+" FCFA."}catch(e){}}reply(m||"Je n'ai pas d'information financière pour votre profil.");return true}
  if(opt.final&&!QA.isQuestion(raw))return false;
  // point sur un événement ou un lieu
  const R=search(S,t,pl);
  if(R.length&&(R[0].s>=3||pl)){const x=R[0];if(x.k==="actu"){reply(actuPoint(S,x.a));return true}if(x.k==="dir"){reply(dirPoint(S,x.d));return true}if(x.k==="mail"){reply(x.m.t+". "+x.m.b.split("\n")[0]);return true}}
  if(pl&&S.mood&&S.mood[pl.reg]){const M=S.mood[pl.reg];const c=(M.c||[]).slice(0,3).map(x=>x.t).join(" ; ");reply((pl.v?pl.v+", région ":"Région ")+CM.REG[pl.reg].n+" : humeur à "+Math.round(M.v)+" sur 100."+(c?" Derniers faits : "+c+".":" Rien de marquant récemment."));return true}
  // point national (seulement sans lieu ni sujet précis)
  if(/(situation|bilan|comment va le pays|point general|point sur le pays|fais (moi )?le point$|le point$)/.test(t)&&toks(t).length<=2)return false;
  if(!opt.final)return false;
  // question libre : Claude si disponible
  if(QA.isQuestion(raw)&&sample&&!refused){reply("Je regarde…");sample("Tu es le chef de cabinet du joueur dans « Chemin d'Etoudi », simulation politique réaliste du Cameroun. Réponds en 1 à 3 phrases, en français, uniquement à partir des données ci-dessous ; si l'information n'y est pas, dis-le simplement.\n\nDONNÉES DE LA PARTIE :\n"+digest(S)+"\n\nQUESTION : "+raw,{modelTier:"quick",cache:false}).then(j=>reply(String(j.text||"").trim())).catch(e=>{if(e&&e.code==="not_granted")refused=true;reply("Je n'ai pas trouvé d'information sur ce point dans votre partie.")});return true}
  if(QA.isQuestion(raw)){reply("Je n'ai pas trouvé d'information sur ce point dans votre partie. Vous pouvez me demander : où suis-je, le point sur un événement ou une ville (« le point sur l'accident de Limbé »), vos directives, votre agenda, vos engagements, les finances, ou qui dirige une institution.");return true}
  return false};
function digest(S){const h=window.VOY?VOY.here(S):{};const L=[];L.push("Date : "+G.dayLabel(S.day)+" 2026. Profil : "+S.mode+". Lieu : "+(h.v||"?")+".");
  if(S.st)L.push("Jauges : "+Object.entries(S.st).map(([k,v])=>k+" "+Math.round(v)).join(", "));
  if(S.mood)L.push("Humeur des régions : "+CM.REGIONS.map(r=>r.n+" "+Math.round(S.mood[r.id].v)).join(", "));
  if(window.ACTU)L.push("Actualités réelles : "+ACTU.all().slice(0,8).map(a=>a.titre+" ["+((S.actuFait||{})[a.id]||[]).join("/")+"]").join(" | "));
  L.push("Directives : "+(S.directives||[]).map(d=>d.titre+" ("+(d.done?"terminée":"échéance "+G.dayLabel(d.due))+")").join(" | "));
  L.push("Agenda : "+(S.agenda||[]).filter(a=>!a.done).map(a=>a.lab+" "+G.dayLabel(a.at)).join(" | "));
  L.push("Courrier récent : "+(S.inbox||[]).slice(0,10).map(m=>m.t).join(" | "));return L.join("\n").slice(0,6000)}
})();
