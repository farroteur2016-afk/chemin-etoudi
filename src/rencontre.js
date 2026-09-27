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
function qcm(P){const k=K[P.kind]||K.habitant;const T=[
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

/* ---------- réponses libres ---------- */
function fallback(P,t){t=norm(t);const T=qcm(P);
  const m=[[/(au revoir|merci|bonne journee|a bientot|termin)/,"fin"],[/(promet|engage|je vais|nous allons|d ici|dans (deux|2|trois|3) mois)/,"promesse"],[/(aide|argent|fonds|financ|debloqu|subvention|don)/,"aide"],
   [/(probleme|difficult|souci|comment ca va|parlez|racontez|qu est ce qui)/,"ecoute"],[/(attend|besoin|voulez|souhaitez|que faut)/,"attente"],[/(gouvernement|programme|deja|effort|plan)/,"efforts"],[/(conseil|devriez|essayez|cooperative|regroup)/,"conseil"],
   [/(enquete|justice|coupable)/,"justice"],[/(calendrier|echeancier)/,"calendrier"]];
  for(const [re,id] of m)if(re.test(t)){const o=T.find(x=>x.id===id);if(o)return o}
  return {id:"libre",fx:{m:.2},r:()=>pick(["Je vous entends. Mais ici, le vrai problème reste "+pb(P)+".","C'est intéressant. Vous savez, ce qui nous préoccupe le plus, c'est "+pb(P)+".","Hmm… Et pour "+pb(P)+", qu'est-ce que vous comptez faire ?"])}}
function ctx(S,P){const r=P.reg&&S.mood&&S.mood[P.reg]?Math.round(S.mood[P.reg].v):null;
  const me=S.mode==="pres"?"le président de la République":S.mode==="min"?"le ministre "+(S.minis?S.minis.n:""):S.profil==="maire"?"le maire":S.opp?"un responsable de l'opposition":S.mode==="pro"?"un professionnel ("+((window.PRO&&PRO.LIST[S.pro.id])||{n:"professionnel"}).n+")":S.mode==="ing"?"un chef d'entreprise":"un visiteur";
  return {me,humeur:r,date:G.dayLabel(S.day)+" 2026"}}
async function ask(S,P,turns,text){const k=K[P.kind]||K.habitant;const c=ctx(S,P);
  const prompt="Tu joues "+P.n+", "+(P.lab||k.lab)+" à "+(P.ville||"")+" ("+(P.reg?CM.REG[P.reg].n:"Cameroun")+"), dans un jeu de simulation réaliste de la vie politique au Cameroun. "+
   "Tu reçois "+c.me+" ("+(S.name||S.nom||"le joueur")+") à "+(P.lieu||k.lieu)+", le "+c.date+". Objet de la rencontre : "+(P.sujet||"visite de terrain")+"."+(P.contexte?" Contexte réel : "+P.contexte:"")+
   " Tes préoccupations : "+k.pb.join(", ")+". Tu attends : "+k.att+"."+(c.humeur!=null?" L'humeur de ta région envers les autorités est de "+c.humeur+"/100.":"")+
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

/* ---------- micro ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,listening=false;
function listen(onFinal,onState){if(!SR){onState("off");return}try{A.stop()}catch(e){}if(listening){try{rec.stop()}catch(e){}return}
  rec=new SR();rec.lang="fr-FR";rec.interimResults=true;listening=true;onState("on");
  rec.onresult=e=>{let fin="",tmp="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript;else tmp+=r[0].transcript}if(tmp)onState("tmp",tmp);if(fin){try{rec.stop()}catch(x){}onFinal(fin)}};
  rec.onerror=e=>{listening=false;onState(e.error==="not-allowed"||e.error==="service-not-allowed"?"blocked":"err",e.error)};rec.onend=()=>{listening=false;onState("end")};try{rec.start()}catch(e){listening=false;onState("err")}}

/* ---------- l'entretien ---------- */
RENC.open=function(S,o){if(!S||S.phase!=="play")return;const k=K[o.kind]||K.habitant;
  const reg=o.reg||(window.VOY?VOY.here(S).reg:"CE");const ville=o.ville||(window.VOY?VOY.here(S).v:CM.REG[reg].chef);
  const sexe=o.sexe||(o.kind==="commercant"?"f":Math.random()<.35?"f":"m");
  const P={kind:o.kind||"habitant",n:o.n||window.SYS.nom(reg),lab:o.lab||(sexe==="f"&&o.kind!=="commercant"?fem(k.lab):k.lab),lieu:o.lieu||k.lieu,reg,ville,sujet:o.sujet||"",contexte:o.contexte||"",sexe};
  const turns=[];let mood=0,eng=null,cost=false,ended=false,busy=false;
  let mode="choix";try{mode=localStorage.getItem("etoudi-renc-mode")||"choix"}catch(e){}
  const vp=$("vxPanel");if(vp)vp.remove();
  G.setView&&G.setView({overlay:"conseil"},ville,"Rencontre");
  G.sheet('<span class="eyebrow">Rencontre · '+esc(ville)+' · '+esc(G.dayLabel(S.day))+'</span><h3 class="h2">'+esc(P.n)+'</h3><p class="small muted">'+esc(P.lab.charAt(0).toUpperCase()+P.lab.slice(1))+' · '+esc(P.lieu)+(P.sujet?' · Objet : '+esc(P.sujet):"")+'</p>'+
   '<div class="row" role="tablist" style="gap:6px"><button class="btn small" data-rm="voix">🎙 Voix</button><button class="btn small" data-rm="texte">⌨ Texte</button><button class="btn small" data-rm="choix">☑ Choix</button></div>'+
   '<div class="vxlog" id="rnLog" style="flex:none;min-height:140px;max-height:38vh;margin:8px 0"></div><div id="rnIn"></div><p class="small muted" id="rnHint"></p>'+
   '<div class="row"><button class="btn ghost" id="rnEnd">Terminer l\'entretien</button></div>',el=>{
    const log=(t,me)=>{const d=document.createElement("div");d.className=me?"me":"it";d.textContent=(me?"Vous : ":P.n+" : ")+t;$("rnLog").appendChild(d);$("rnLog").scrollTop=1e6;turns.push({me,t})};
    const hint=t=>{const h=$("rnHint");if(h)h.textContent=t||""};
    const speak=t=>{try{A.speak(t,{voix:P.sexe,rate:1,pitch:P.sexe==="f"?1.05:.9})}catch(e){}};
    const npc=(t,d)=>{log(t,false);speak(t);if(d)mood+=d};
    const apply=(o,said)=>{if(o.fx.m)mood+=o.fx.m;if(o.fx.eng)eng=eng||(o.id==="promesse"?"Action concrète promise à "+(P.kind==="famille"?"la famille":"un "+P.lab)+" de "+P.ville:o.id==="justice"?"Faire aboutir l'enquête ("+P.ville+")":o.id==="calendrier"?"Calendrier écrit de paiement des primes":said);if(o.fx.cost)cost=true;const r=o.r();npc(r);if(o.id==="fin")finish()};
    const saySome=async text=>{if(ended||busy||!text.trim())return;log(text,true);
      if(sample&&!refused){busy=true;hint("…");const box=$("rnIn");box&&box.querySelectorAll("button,input").forEach(x=>x.disabled=true);
        try{const j=await ask(S,P,turns.slice(0,-1),text);npc(String(j.reponse||"…"),clamp(+j.humeur||0,-2,2));if(j.engagement&&String(j.engagement).trim())eng=String(j.engagement).trim();hint("");if(j.fin)finish()}
        catch(e){if(e&&e.code==="not_granted")refused=true;hint(e&&e.code==="rate_limited"?"Trop de demandes : réponse simplifiée.":"");apply(fallback(P,text),text)}
        busy=false;box&&box.querySelectorAll("button,input").forEach(x=>x.disabled=false);return}
      apply(fallback(P,text),text)};
    const draw=()=>{el.querySelectorAll("[data-rm]").forEach(b=>{b.classList.toggle("primary",b.dataset.rm===mode);b.setAttribute("aria-pressed",b.dataset.rm===mode)});const box=$("rnIn");if(!box||ended)return;
      if(mode==="choix"){const T=qcm(P);box.innerHTML='<div class="choices">'+T.map(o=>'<button class="choice" data-rq="'+o.id+'"><span class="t">'+esc(o.q)+'</span></button>').join("")+'</div>';
        box.querySelectorAll("[data-rq]").forEach(b=>b.onclick=()=>{const o=T.find(x=>x.id===b.dataset.rq);log(o.q,true);apply(o,o.q)});hint("")}
      else if(mode==="texte"){box.innerHTML='<div class="row" style="gap:6px"><input type="text" id="rnTxt" placeholder="Écrivez ce que vous lui dites…" style="flex:1;min-width:0"><button class="btn primary" id="rnGo">Dire</button></div>';
        const go=()=>{const v=$("rnTxt").value;$("rnTxt").value="";saySome(v)};$("rnGo").onclick=go;$("rnTxt").onkeydown=e=>{if(e.key==="Enter")go()};setTimeout(()=>{const i=$("rnTxt");i&&i.focus()},50);hint(sample&&!refused?"":"Réponses du moteur intégré (les réponses rédigées par l'IA sont disponibles sur la version en ligne).")}
      else{box.innerHTML='<button class="btn primary" id="rnMic" style="width:100%">🎙 Appuyez et parlez</button>';
        $("rnMic").onclick=()=>listen(t=>saySome(t),(st,x)=>{const b=$("rnMic");if(!b)return;if(st==="on"){b.textContent="⏹ J'écoute…";hint("")}else if(st==="tmp")hint(x);else{b.textContent="🎙 Appuyez et parlez";
          if(st==="off"||st==="blocked"){hint(st==="off"?"La reconnaissance vocale n'existe pas dans ce navigateur (utilisez Chrome). Passez en mode Texte ou Choix.":"Le micro est bloqué ici (l'application Claude ne donne pas le micro aux jeux). Ouvrez la version hors ligne dans Chrome, ou utilisez Texte / Choix.")}}});
        hint(SR?"Votre interlocuteur vous répondra à voix haute.":"La reconnaissance vocale n'existe pas dans ce navigateur : utilisez Texte ou Choix.")}};
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
    const hello=o.bonjour||pick(["Bonjour, soyez le bienvenu à "+ville+".","Bienvenue ! On ne s'attendait pas à vous voir ici.","Bonjour. Merci d'être venu jusqu'à nous."]);npc(hello);draw()});
};
function fem(l){return l.replace(/^producteur/,"productrice").replace(/^planteur/,"planteuse").replace(/^cultivateur/,"cultivatrice").replace(/^pêcheur/,"pêcheuse").replace(/^enseignant/,"enseignante").replace(/^étudiant/,"étudiante").replace(/^habitant/,"habitante").replace(/^supporter/,"supportrice").replace(/^responsable syndical/,"responsable syndicale").replace(/^chef traditionnel/,"reine-mère")}

/* boutons « S'entretenir » dans les fiches d'organisations */
RENC.orgBtn=function(){return '<button class="btn" data-renc="1">💬 S\'entretenir (voix, texte ou choix)</button>'};
RENC.bindOrg=function(S,el,k,o){const b=el.querySelector("[data-renc]");if(!b)return;b.onclick=()=>{el.remove();
  const lab=k==="hop"?"directeur de "+o.n:k==="ent"?"directeur général de "+o.n:k==="police"?"commissaire central":k==="prefet"?"préfet":k==="gouverneur"?"gouverneur de la région":"commandant de légion";
  RENC.open(S,{kind:k==="hop"?"medecin":"officiel",n:k==="hop"?o.dir:k==="ent"?o.dg:o.n,lab,reg:o.reg,ville:o.ville||(o.reg?CM.REG[o.reg].chef:null),lieu:k==="hop"?"son bureau à l'hôpital":"son bureau",sujet:"point sur "+(k==="hop"?"l'hôpital":k==="ent"?"l'entreprise":"la situation")})}};
})();
