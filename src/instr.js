/* Chemin d'Etoudi — « Autre instruction » : sous chaque fenêtre de décision, on peut écrire ou dicter sa propre consigne
   au lieu de choisir un bouton. Le jeu choisit l'action correspondante, exécute une commande (convoquer, se déplacer…)
   ou transmet la consigne à vos services. En ligne, Claude interprète les consignes libres ; ailleurs, un moteur intégré. */
(function(){
"use strict";
const G=window.GAME,A=window.Audio2;
const esc=G.esc;
const INSTR={};window.INSTR=INSTR;
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'\-]/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const STOP=new Set("les des une pour avec dans sur par que qui mon mes son ses leur vous nous tout tous toute toutes plus faire fais faites veux voudrais aller donner donne mettre cette ceci cela etre avoir voir dossier dossiers options option affaire affaires apres avant depuis entre sans chez leurs ces cet autre autres".split(" "));
const toks=t=>norm(t).split(" ").filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.slice(0,5));
const SYN=[["urgence","aide","secours","debloq","fonds","argent","financ"],["enquet","investig","justice","parquet","poursuiv"],["place","rendre","terrain","deplac","visite","aller"],["ministr","depech","envoy"],["convoq","recevo","audien"],["messag","condol","nation","discou","communi","declar"],["region","carte"],["ecout","lire"],["sanct","limog","revoq","suspen","renvoy"],["nomme","remplac"],["felic","bravo","encour"]];
const syn=w=>{for(const g of SYN)if(g.some(x=>w.startsWith(x)||x.startsWith(w)))return g[0];return w};
let sample=null;(async()=>{try{if(window.claude&&claude.use)sample=await claude.use("sample")}catch(e){}})();let refused=false;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const say=t=>{try{A.speak(t,{voix:"f"})}catch(e){}};

function options(el){return [...el.querySelectorAll("button.choice,button.btn")].filter(b=>!b.hasAttribute("data-close")&&!b.closest(".instr")&&b.id!=="mRead"&&!b.disabled&&b.offsetParent!==null&&b.textContent.trim().length>1)}
function label(b){return b.textContent.replace(/\s+/g," ").trim()}
function best(el,text){const T=toks(text).map(syn);let top=null,sc=0,second=0;
  for(const b of options(el)){const L=toks(label(b)).map(syn);let s=0;for(const w of T)if(L.includes(w))s+=1;if(s>sc){second=sc;sc=s;top=b}else if(s>second)second=s}
  const need=T.length<=4?1:2;return sc>=need&&sc>second?top:null}
const CMD=/(convoqu|recevoir|recois|audience|aller a|va a|vais a|visite|visiter|rencontr|rendre visite|avance|video|montre|ouvre|marcher|parler avec|discuter avec|quelle heure|quel jour|situation|qui est)/;

INSTR.attach=function(el){if(!el||el.querySelector("#rnLog,.instr")||el.hasAttribute("data-noinstr"))return;if(!G.S||G.S.phase!=="play")return;
  if(!options(el).length)return;const box=el.querySelector(".in")||el;const close=box.querySelector("[data-close]");
  const d=document.createElement("div");d.className="instr";
  d.innerHTML='<span class="eyebrow">Autre instruction</span><div class="row" style="gap:6px;flex-wrap:nowrap;align-items:flex-end"><textarea data-grow rows="1" placeholder="Écrivez votre propre consigne…" aria-label="Autre instruction" style="flex:1;min-width:0"></textarea>'+
   (SR?'<button class="btn" data-imic aria-label="Dicter la consigne" title="Dicter la consigne">🎙</button>':'')+'<button class="btn primary" data-igo>OK</button></div><p class="small muted" data-ihint></p>';
  box.appendChild(d);
  const inp=d.querySelector("textarea"),hint=t=>{d.querySelector("[data-ihint]").textContent=t||""};
  if(window.VOY&&VOY.driving){inp.disabled=true;inp.placeholder="Au volant : dictez votre consigne avec 🎙";const g=d.querySelector("[data-igo]");if(g)g.disabled=true}
  const go=async()=>{const v=inp.value.trim();if(!v)return;inp.value="";inp.style.height="";await INSTR.run(el,v,hint)};
  d.querySelector("[data-igo]").onclick=go;inp.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();go()}};
  const mic=d.querySelector("[data-imic]");if(mic)mic.onclick=()=>{try{A.stop()}catch(e){}const r=new SR();r.lang="fr-FR";r.interimResults=true;mic.textContent="⏹";hint("J'écoute…");
    r.onresult=e=>{let f="",t="";for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal)f+=x[0].transcript;else t+=x[0].transcript}if(t)hint(t);if(f){inp.value=f;try{r.stop()}catch(x){}go()}};
    r.onerror=e=>{hint(e.error==="not-allowed"||e.error==="service-not-allowed"?"Micro bloqué ici : autorisez-le dans Chrome, ou écrivez la consigne.":"Micro : "+e.error)};r.onend=()=>{mic.textContent="🎙"};try{r.start()}catch(e){mic.textContent="🎙"}}};

INSTR.run=async function(el,text,hint){if(window.DICO)text=DICO.fix(text);hint=hint||(()=>{});const S=G.S;
  const n=norm(text);if(window.VOIX&&/(convoqu|recevoir|audience|rendez vous|aller a|visiter|rencontrer)/.test(n)&&/(\d{1,2} ?h|heure|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|semaine|en avion|en train|en voiture|sans cortege)/.test(n)){el.remove();VOIX.handle(text);return}
  if(window.NOTE&&NOTE.matches(text)){const ctx=((el.querySelector(".h2")||{}).textContent||"").trim();el.remove();NOTE.handle(S,text,m=>{say(m);G.toast(m.slice(0,110))},{ctx});return}
  const b=best(el,text);if(b){const l=label(b);hint("→ « "+l+" »");say("Très bien : "+l+".");setTimeout(()=>b.click(),250);return}
  if(window.GENRE&&GENRE.matches(text)){el.remove();GENRE.handle(S,text,m=>{say(m);G.toast(m.slice(0,110))});return}
  if(window.DIR&&DIR.matches(text)){const ctx=((el.querySelector(".h2")||{}).textContent||"").trim();el.remove();await DIR.handle(S,text,m=>{say(m);G.toast(m.slice(0,110))},{ctx});return}
  if(sample&&!refused){const opts=options(el).map(label);const title=(el.querySelector(".h2")||{}).textContent||"";const body=((el.querySelector(".in")||el).innerText||"").slice(0,1200);hint("…");
    try{const j=await sample.json("Tu es le chef de cabinet du joueur dans un jeu de simulation politique réaliste au Cameroun. Situation affichée : « "+title+" ».\n"+body+"\n\nActions disponibles (index : libellé) :\n"+opts.map((o,i)=>i+" : "+o).join("\n")+
      "\n\nConsigne du joueur : « "+text+" ».\nSi une action disponible correspond à la consigne, choisis-la. Sinon, choix = -1 et résume en une phrase ce que tes services vont faire. Réponds uniquement en JSON : {\"choix\": nombre, \"reponse\": \"une phrase en français, à la 2e personne du pluriel\"}",{modelTier:"quick",cache:false});
      const i=+j.choix;const L=options(el);if(i>=0&&L[i]){hint("→ « "+label(L[i])+" »");say(String(j.reponse||("Très bien : "+label(L[i]))));setTimeout(()=>L[i].click(),250);return}
      return custom(el,text,String(j.reponse||""),hint)}catch(e){if(e&&e.code==="not_granted")refused=true}}
  if(CMD.test(norm(text))&&window.VOIX){el.remove();VOIX.handle(text);return}
  custom(el,text,"",hint)};
function custom(el,text,rep,hint){const S=G.S;const title=(el.querySelector(".h2")||{}).textContent||"Dossier";
  const msg=rep||"Consigne transmise à vos services : « "+text+" ». Un compte rendu vous sera adressé.";
  hint(msg);say(msg);window.SYS.inbox(S,{from:"Cabinet",t:"Instruction : "+title.slice(0,70),b:"Votre consigne : « "+text+" »\n"+msg,k:"info",read:true});
  S.consignes=S.consignes||[];S.consignes.push({t:text,sur:title.slice(0,80),day:S.day});S.consignes=S.consignes.slice(-50);G.toast("Instruction enregistrée")}
})();
