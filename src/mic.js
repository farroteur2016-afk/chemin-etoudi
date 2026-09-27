/* Chemin d'Etoudi — micro permanent : une fois activé, le micro reste ouvert jusqu'à ce que le joueur le coupe lui-même.
   Il se met en pause pendant que le jeu ou l'interlocuteur parle (pour ne pas s'écouter), puis reprend tout seul.
   Un seul micro pour tout le jeu : ce qui est dit va à la fenêtre active (entretien, appel, « Autre instruction »),
   sinon à l'assistant vocal. */
(function(){
"use strict";
const A=window.Audio2;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const MIC={ok:!!SR,want:false,state:"off"};window.MIC=MIC;
let rec=null,running=false,targets=[],errs=0,timer=null,lastErr="";
const listeners=new Set();
function emit(st,x){MIC.state=st;listeners.forEach(f=>{try{f(st,x)}catch(e){}});const t=cur();if(t&&t.onState)try{t.onState(st,x)}catch(e){}
  const b=document.getElementById("bVox");if(b){b.classList.toggle("micon",MIC.want);b.setAttribute("aria-pressed",MIC.want?"true":"false")}}
function cur(){targets=targets.filter(t=>!t.alive||t.alive());return targets[targets.length-1]||null}
const speaking=()=>window.speechSynthesis?!!speechSynthesis.speaking:!!(A&&A.speaking);
function make(){rec=new SR();rec.lang="fr-FR";rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
  rec.onstart=()=>{running=true;emit("on")};
  rec.onresult=e=>{let fin="",tmp="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript;else tmp+=r[0].transcript}
    if(tmp)emit("tmp",tmp);if(fin&&fin.trim()){errs=0;const t=cur();if(t)t.onText(fin.trim());else if(window.VOIX)VOIX.fromMic(fin.trim())}};
  rec.onerror=e=>{lastErr=e.error;if(e.error==="not-allowed"||e.error==="service-not-allowed"){MIC.want=false;emit("blocked",e.error)}else if(e.error!=="no-speech"&&e.error!=="aborted"){errs++;if(errs>6){MIC.want=false;emit("err",e.error)}}};
  rec.onend=()=>{running=false;if(!MIC.want){emit("off");return}if(MIC.state!=="pause")emit("wait");schedule(lastErr==="network"?1500:250)};}
function schedule(ms){clearTimeout(timer);timer=setTimeout(resume,ms)}
function resume(){if(!MIC.want||running)return;if(speaking()){emit("pause");schedule(300);return}lastErr="";try{if(!rec)make();rec.start()}catch(e){schedule(600)}}
/* pause pendant que la voix du jeu parle */
setInterval(()=>{if(MIC.want&&running&&speaking()){emit("pause");try{rec.abort()}catch(e){}}},250);
MIC.start=function(){if(!SR){emit("off");return false}if(MIC.want)return true;MIC.want=true;errs=0;if(!rec)make();resume();emit(speaking()?"pause":"wait");return true};
MIC.stop=function(){MIC.want=false;clearTimeout(timer);try{rec&&rec.abort()}catch(e){}running=false;emit("off")};
MIC.toggle=function(){return MIC.want?(MIC.stop(),false):MIC.start()};
/* une fenêtre qui veut recevoir la parole : {onText, onState, alive} ; renvoie une fonction pour se retirer */
MIC.bind=function(t){targets.push(t);if(t.onState)try{t.onState(MIC.want?(running?"on":"wait"):"off")}catch(e){}return()=>{targets=targets.filter(x=>x!==t)}};
MIC.on=f=>{listeners.add(f);return()=>listeners.delete(f)};
MIC.label=st=>st==="on"||st==="tmp"?"⏹ Micro activé — j'écoute":st==="pause"?"⏹ Micro activé — en pause pendant qu'on vous répond":st==="wait"?"⏹ Micro activé":"🎙 Activer le micro";
MIC.msg=st=>st==="blocked"?"Le micro est bloqué ici : autorisez-le dans Chrome (icône du cadenas), ou utilisez le texte.":st==="err"?"Le micro ne répond pas (connexion ?). Réactivez-le ou utilisez le texte.":!SR?"La reconnaissance vocale n'existe pas dans ce navigateur (utilisez Chrome).":"";
})();
