/* Chemin d'Etoudi — le jeu se joue connecté : actualités du jour, réponses de l'IA et parties partagées
   passent par Internet. Sans connexion, un écran bloque la partie (mise en pause) jusqu'au retour du réseau. */
(function(){
"use strict";
const ONL={ok:true};window.ONL=ONL;
if(window.__ETOUDI_TEST)return;
const inClaude=!!(window.claude&&window.claude.use);
const PING="https://raw.githubusercontent.com/farroteur2016-afk/chemin-etoudi/main/actus.json";
let el=null,wasPaused=null;
function block(why){ONL.ok=false;const S=window.GAME&&GAME.S;if(S&&wasPaused===null){wasPaused=!!S.paused;S.paused=true}
  if(el){el.querySelector("[data-why]").textContent=why;return}
  el=document.createElement("div");el.id="onlGate";el.setAttribute("role","alertdialog");el.setAttribute("aria-modal","true");
  el.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(8,14,12,.96);display:grid;place-items:center;padding:16px";
  el.innerHTML='<div style="max-width:440px;background:var(--panel,#16201c);border:1px solid var(--line,#2c3a34);border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:12px;color:var(--ink,#eee)"><b style="font-size:20px">📶 Connexion Internet requise</b><p style="margin:0">Chemin d\'Etoudi se joue connecté : actualités réelles du jour, réponses de vos interlocuteurs et parties partagées passent par Internet.</p><p class="small muted" data-why style="margin:0">'+why+'</p><button class="btn primary" data-retry>Réessayer</button></div>';
  document.body.appendChild(el);el.querySelector("[data-retry]").onclick=()=>check(true)}
function unblock(){ONL.ok=true;if(el){el.remove();el=null}const S=window.GAME&&GAME.S;if(S&&wasPaused!==null){S.paused=wasPaused;wasPaused=null}}
async function check(manual){if(!navigator.onLine){block("Votre appareil n'est pas connecté. Activez le Wi-Fi ou les données mobiles.");return}
  if(inClaude){unblock();return}
  try{const c=new AbortController();const t=setTimeout(()=>c.abort(),7000);const r=await fetch(PING+"?ping="+Date.now(),{cache:"no-store",signal:c.signal});clearTimeout(t);if(!r.ok)throw new Error(r.status);unblock()}
  catch(e){block(manual?"Toujours pas de connexion. Vérifiez votre réseau puis réessayez.":"Le jeu n'arrive pas à joindre Internet. Vérifiez votre réseau.")}}
window.addEventListener("offline",()=>block("La connexion vient d'être perdue : la partie est en pause."));
window.addEventListener("online",()=>check());
const start=()=>check();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
setInterval(()=>{if(!ONL.ok||document.visibilityState==="visible")check()},60000);
})();
