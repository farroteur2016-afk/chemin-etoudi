/* Chemin d'Etoudi — mode « Entre amis » : 2 à 6 joueurs, sur un seul appareil ou en ligne (room). */
(function(){
"use strict";
const CM=window.CM,A=window.Audio2,G=window.GAME;
const $=id=>document.getElementById(id);
const esc=G.esc,fmt=G.fmt,pick=G.pick,rnd=G.rnd,clamp=G.clamp;
const COLORS=["#f6c945","#3b82d6","#e5473f","#9b59b6","#17a3a3","#e0762b"];
const ACTS=[
 {id:"meeting",n:"Meeting",d:"Grand rassemblement. Fort impact local.",cout:15,gain:7,noto:4,scene:"meeting"},
 {id:"marche",n:"Marchés",d:"Tournée des marchés du chef-lieu.",cout:5,gain:3.6,noto:2,scene:"marche"},
 {id:"village",n:"Villages",d:"Tournée des villages et des chefferies.",cout:5,gain:4,noto:1,scene:"village"},
 {id:"medias",n:"Médias",d:"Radio, télé, réseaux sociaux : tout le pays.",cout:8,gain:1.5,noto:5,national:1},
 {id:"fonds",n:"Collecte",d:"Remplir les caisses (+25 M FCFA).",cout:0,gain:0,noto:0,fonds:25},
 {id:"debat",n:"Débat télévisé",d:"Face au favori. Quitte ou double.",cout:0,gain:0,noto:3,debat:1}
];
const EVM=[["La diaspora finance votre campagne",{f:15}],["Un chanteur populaire vous soutient",{o:6}],["Polémique sur un de vos propos",{o:-4}],["Vos affiches arrachées dans la nuit",{o:-1}],["Un chef traditionnel vous reçoit",{o:3}]];
let M=null,room=null,groom=null,me=null,lastSt=null,draft={};
const MULTI={};window.MULTI=MULTI;

G.colorOf=p=>{if(!M)return"#888";if(p==="RDPC")return CM.PARTIS.RDPC.c;const pl=M.players.find(x=>x.id===p);return pl?pl.c:"#888"};
const pname=p=>p==="RDPC"?"RDPC (pouvoir)":(M.players.find(x=>x.id===p)||{n:p}).n;
const psig=p=>p==="RDPC"?"RDPC":(M.players.find(x=>x.id===p)||{s:p}).s;

/* ---------- état et résolution (commun aux deux modes) ---------- */
function initState(players,type,turns,ai){
  const sup={};
  for(const r of CM.REGIONS){const o={};let used=0;
    if(ai){o.RDPC=CM.SOUTIEN[r.id][0]*.45;used+=o.RDPC}
    for(const p of players){o[p.id]=(ai?4:6)+(p.h===r.id?8:0);used+=o[p.id]}
    o.IND=Math.max(5,100-used);G.norm(o);for(const k in o)o[k]=Math.round(o[k]*10)/10;sup[r.id]=o}
  return{type,turns,t:1,ai,players:players.map(p=>Object.assign({f:60,o:20},p)),sup,last:[],phase:"play",res:null};
}
function take(o,p,gain){ // prend d'abord aux indécis, puis aux autres
  const fromInd=Math.min(o.IND||0,gain*.65);o.IND=(o.IND||0)-fromInd;o[p]=(o[p]||0)+fromInd;
  const rest=gain-fromInd;const others=Object.keys(o).filter(k=>k!==p&&k!=="IND"&&o[k]>0);const tot=others.reduce((a,k)=>a+o[k],0)||1;
  let t=0;for(const k of others){const x=Math.min(o[k],rest*o[k]/tot);o[k]-=x;t+=x}o[p]+=t;
}
function natShare(st,p){let v=0,t=0;for(const r of CM.REGIONS){const w=r.pop*r.turn;v+=(st.sup[r.id][p]||0)*w;t+=w}return v/t}
function resolve(st,moves){
  const lines=[];let best=null;
  for(const pl of st.players){
    const mv=moves[pl.id];if(!mv){lines.push(pl.n+" n'a rien fait ce tour-ci.");continue}
    const a=ACTS.find(x=>x.id===mv.a)||ACTS[4],R=CM.REG[mv.r]||CM.REG[pl.h];
    if(pl.f<a.cout){lines.push(pl.n+" n'a pas les moyens d'un "+a.n.toLowerCase()+".");continue}
    pl.f-=a.cout;pl.o=clamp(pl.o+a.noto,0,100);
    const tm=mv.th?(R.enjeux.includes(mv.th)?1.6:.8):1;
    let gain=a.gain*tm*(.7+pl.o/100)*rnd(.75,1.25);
    if(a.national){for(const r of CM.REGIONS){const cur=st.sup[r.id][pl.id]||0;take(st.sup[r.id],pl.id,gain*Math.max(.3,1-cur/60)*(r.enjeux.includes(mv.th)?1.3:.9))}lines.push(pl.n+" fait campagne dans les médias sur « "+CM.THEMES[mv.th].n.toLowerCase()+" ».")}
    else if(a.fonds){pl.f+=a.fonds+rnd(0,8);lines.push(pl.n+" remplit ses caisses.")}
    else if(a.debat){const fav=st.players.concat(st.ai?[{id:"RDPC",n:"le RDPC"}]:[]).filter(x=>x.id!==pl.id).sort((x,y)=>natShare(st,y.id)-natShare(st,x.id))[0];const win=Math.random()<.5+(pl.o-50)/200;
      for(const r of CM.REGIONS){const o=st.sup[r.id];const s=win?1.2:-1;const amt=Math.min(o[win?fav.id:pl.id]||0,1.2);if(win){o[fav.id]-=amt;o[pl.id]+=amt}else{o[pl.id]-=amt;o[fav.id]=(o[fav.id]||0)+amt}}
      lines.push(pl.n+(win?" remporte":" perd")+" le débat face à "+(fav.id==="RDPC"?"le RDPC":fav.n)+".")}
    else{const cur=st.sup[R.id][pl.id]||0;gain*=Math.max(.3,1-cur/60);take(st.sup[R.id],pl.id,gain);
      lines.push(pl.n+" · "+a.n.toLowerCase()+" à "+R.chef+" : +"+fmt(gain,1)+" pt"+(tm>1?" (thème porteur)":""));
      if(a.scene&&(!best||gain>best.g))best={g:gain,pl,a,R,th:mv.th}}
    if(Math.random()<.25){const e=pick(EVM);if(e[1].f)pl.f+=e[1].f;if(e[1].o)pl.o=clamp(pl.o+e[1].o,0,100);lines.push("   "+pl.n+" : "+e[0].toLowerCase()+".")}
  }
  if(st.ai){for(let i=0;i<2;i++){const r=pick(CM.REGIONS);take(st.sup[r.id],"RDPC",rnd(.5,1.4))}lines.push("Le RDPC mobilise ses réseaux dans les régions.")}
  for(const r of CM.REGIONS){const o=st.sup[r.id];for(const k in o)o[k]=Math.round(Math.max(0,o[k])*10)/10}
  st.last=lines.slice(0,12);st.best=best?{p:best.pl.id,a:best.a.id,r:best.R.id,th:best.th}:null;
  st.t++;
  if(st.t>st.turns)finish(st);
}
function finish(st){
  const cands=st.players.map(p=>p.id).concat(st.ai?["RDPC"]:[]);
  if(st.type==="pres"){const r=G.ELEC.presidentielle(st.sup,cands);st.res={type:"pres",nat:r.nat.map(x=>[x.p,Math.round(x.pct*10)/10]),reg:Object.fromEntries(Object.entries(r.byReg).map(([k,v])=>[k,v.winner])),turn:Math.round(r.turnout),w:r.winner}}
  else{const l=G.ELEC.legislatives(st.sup,cands);const w=Object.keys(l.seats).sort((a,b)=>l.seats[b]-l.seats[a])[0];st.res={type:"leg",seats:l.seats,reg:Object.fromEntries(Object.entries(l.byReg).map(([k,v])=>[k,v.winner])),w}}
  st.phase="end";
}

/* ---------- écrans ---------- */
function shell(){$("gauges").innerHTML="";$("tabs").innerHTML="";$("hudDate").innerHTML="Entre amis · <b>"+(M?"semaine "+Math.min(M.t,M.turns)+"/"+M.turns:"préparation")+"</b>"}
MULTI.setup=function(){
  M=null;shell();G.setView({land:"ville",overlay:"meeting",color:"#f6c945",banner:"ENTRE AMIS",sub:"Qui ira à Etoudi ?"},"Yaoundé","Entre amis");
  $("panel").innerHTML='<div><span class="eyebrow">Entre amis · 2 à 6 joueurs</span><h2 class="h2">Qui gagnera l\'élection ?</h2></div><p>Chaque joueur dirige un parti. À chaque tour, choisissez une action de campagne et une région. À la fin, les Camerounais votent selon les règles du Code électoral.</p>'+
   '<div class="grid2"><button class="opt" id="mLocal"><b>Sur ce téléphone</b><span>On se passe l\'appareil à tour de rôle. Marche partout, même hors ligne.</span></button><button class="opt" id="mOnline"><b>En ligne</b><span>Chacun sur son téléphone, avec un code de partie.</span></button></div>'+
   '<button class="btn ghost" id="back">Retour</button>';
  $("back").onclick=G.home;$("mLocal").onclick=localSetup;$("mOnline").onclick=onlineSetup;
};
function playerForm(i,p){
  return'<div class="card"><div class="row" style="justify-content:space-between"><b>Joueur '+(i+1)+'</b>'+(i>1?'<button class="btn small ghost" data-del="'+i+'">Retirer</button>':"")+'</div>'+
   '<div class="grid2"><label class="f" for="n'+i+'">Nom<input type="text" id="n'+i+'" maxlength="14" value="'+esc(p.n)+'"></label><label class="f" for="a'+i+'">Âge<input type="number" id="a'+i+'" min="16" max="95" value="'+(p.a||45)+'"></label></div><label class="f" for="s'+i+'">Sigle du parti<input type="text" id="s'+i+'" maxlength="6" value="'+esc(p.s)+'"></label>'+
   '<div class="row" style="align-items:flex-end"><label class="f" for="h'+i+'" style="flex:1">Région d\'origine<select id="h'+i+'">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===p.h?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label><label class="f" for="c'+i+'">Couleur<input type="color" id="c'+i+'" value="'+p.c+'"></label></div></div>';
}
function readPlayers(list){list.forEach((p,i)=>{if(!$("n"+i))return;p.n=$("n"+i).value.trim()||("Joueur "+(i+1));p.s=($("s"+i).value.trim()||("P"+(i+1))).toUpperCase().slice(0,6);p.h=$("h"+i).value;p.c=$("c"+i).value;if($("a"+i))p.a=+$("a"+i).value||45})}
/* âge minimum : 35 ans pour la présidentielle (art. 6), 23 ans pour les législatives (Code électoral) */
function ageOk(list,type){const min=type==="leg"?23:35;const bad=list.filter(p=>!p.a||p.a<min);if(bad.length){G.toast(bad.map(p=>p.n+" ("+(p.a||"?")+" ans)").join(", ")+" : il faut au moins "+min+" ans pour être candidat "+(type==="leg"?"aux législatives":"à la présidentielle")+".");return false}return true}
function localSetup(){
  const regs=["OU","EN","LT","CE","NW","NO"];
  draft.players=draft.players||[0,1].map(i=>({n:"Joueur "+(i+1),s:"P"+(i+1),h:regs[i],c:COLORS[i]}));draft.type=draft.type||"pres";draft.turns=draft.turns||8;if(draft.ai==null)draft.ai=false;
  const d=draft;
  $("panel").innerHTML='<div><span class="eyebrow">Sur ce téléphone</span><h2 class="h2">Les candidats</h2></div>'+d.players.map((p,i)=>playerForm(i,p)).join("")+
   (d.players.length<6?'<button class="btn" id="add">Ajouter un joueur</button>':"")+
   '<span class="eyebrow">Élection</span><div class="grid2"><button class="opt" data-ty="pres" aria-pressed="'+(d.type==="pres")+'"><b>Présidentielle</b><span>Un tour, le premier gagne.</span></button><button class="opt" data-ty="leg" aria-pressed="'+(d.type==="leg")+'"><b>Législatives</b><span>180 sièges à conquérir.</span></button></div>'+
   '<label class="f" for="tu">Nombre de semaines de campagne<select id="tu">'+[6,8,10,12].map(n=>'<option'+(n===d.turns?" selected":"")+'>'+n+'</option>').join("")+'</select></label>'+
   '<label class="row small" for="ai" style="gap:10px"><input type="checkbox" id="ai"'+(d.ai?" checked":"")+'> Le parti au pouvoir (RDPC) est dans la course, avec ses soutiens actuels</label>'+
   '<div class="row"><button class="btn primary" id="go">Commencer la campagne</button><button class="btn ghost" id="back">Retour</button></div>';
  const keep=()=>{readPlayers(d.players);d.turns=+$("tu").value;d.ai=$("ai").checked};
  const add=$("add");if(add)add.onclick=()=>{keep();const i=d.players.length;d.players.push({n:"Joueur "+(i+1),s:"P"+(i+1),h:regs[i%6],c:COLORS[i%6]});localSetup()};
  $("panel").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{keep();d.players.splice(+b.dataset.del,1);localSetup()});
  $("panel").querySelectorAll("[data-ty]").forEach(b=>b.onclick=()=>{keep();d.type=b.dataset.ty;localSetup()});
  $("back").onclick=MULTI.setup;
  $("go").onclick=()=>{keep();const sigs=new Set(d.players.map(p=>p.s));if(sigs.size<d.players.length||sigs.has("RDPC")){G.toast("Chaque parti doit avoir un sigle différent (et pas RDPC).");return}if(!ageOk(d.players,d.type))return;
    M=initState(d.players.map((p,i)=>Object.assign({id:"P"+i},p)),d.type,d.turns,d.ai);M.mode="local";M.moves={};M.cur=0;saveLocal();localTurn()};
}
function saveLocal(){try{localStorage.setItem("etoudi-multi",JSON.stringify(M))}catch(e){}}
function standings(st){
  const ids=st.players.map(p=>p.id).concat(st.ai?["RDPC"]:[]);
  const rows=ids.map(id=>[pname(id),natShare(st,id),G.colorOf(id)]).sort((a,b)=>b[1]-a[1]);
  const und=natShare(st,"IND");
  return'<div class="card"><span class="eyebrow">Sondage national · semaine '+Math.min(st.t,st.turns)+'/'+st.turns+'</span>'+G.barsHTML(rows.map(r=>[r[0],r[1],100,r[2]])," %")+'<span class="small muted">Indécis : '+fmt(und,1)+' %</span>'+
   G.mapSVG(id=>{const o=st.sup[id];let w=null;for(const k in o)if(k!=="IND"&&(!w||o[k]>o[w]))w=k;return G.colorOf(w)},null,r=>r.n)+'</div>';
}
function localTurn(){
  shell();
  if(M.phase==="end")return results(M);
  const pl=M.players[M.cur];
  G.setView({land:CM.REG[pl.h].land},CM.REG[pl.h].n,"À "+pl.n+" de jouer");
  $("panel").innerHTML='<div class="card" style="align-items:flex-start"><span class="eyebrow">Semaine '+M.t+' sur '+M.turns+' · le temps n\'avance que lorsque tous les joueurs ont validé</span><h2 class="h2"><span class="dot" style="background:'+pl.c+'"></span> Passe le téléphone à '+esc(pl.n)+'</h2><p class="small muted">Les autres joueurs ne regardent pas.</p><button class="btn primary" id="ready">Je suis '+esc(pl.n)+', je joue</button></div>'+standings(M)+
   '<button class="btn ghost small" id="quit" style="align-self:flex-start">Quitter la partie</button>';
  $("ready").onclick=()=>actionForm(M,pl,mv=>{M.moves[pl.id]=mv;M.cur++;if(M.cur>=M.players.length){resolve(M,M.moves);M.moves={};M.cur=0;saveLocal();turnSummary(M,localTurn)}else{saveLocal();localTurn()}});
  $("quit").onclick=()=>{try{localStorage.removeItem("etoudi-multi")}catch(e){}G.home()};
}
function actionForm(st,pl,done){
  let sel={a:null,r:pl.h,th:CM.REG[pl.h].enjeux[0]};
  const drawF=()=>{
    const a=sel.a&&ACTS.find(x=>x.id===sel.a);
    $("panel").innerHTML='<div class="row" style="justify-content:space-between"><span class="eyebrow"><span class="dot" style="background:'+pl.c+'"></span> '+esc(pl.n)+' · '+esc(pl.s)+'</span><span class="pill ok">'+fmt(pl.f)+' M FCFA · notoriété '+Math.round(pl.o)+'</span></div>'+
     '<div class="grid2">'+ACTS.map(x=>'<button class="opt" data-a="'+x.id+'" aria-pressed="'+(x.id===sel.a)+'"'+(pl.f<x.cout?" disabled":"")+'><b>'+esc(x.n)+'</b><span>'+esc(x.d)+(x.cout?" · "+x.cout+" M":"")+'</span></button>').join("")+'</div>'+
     (a&&!a.national&&!a.fonds&&!a.debat?'<label class="f" for="fr">Région<select id="fr">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===sel.r?" selected":"")+'>'+esc(r.n)+' · '+esc(r.chef)+' ('+fmt(st.sup[r.id][pl.id]||0,1)+' %)</option>').join("")+'</select></label><p class="small muted">Enjeux : '+CM.REG[sel.r].enjeux.map(e=>CM.THEMES[e].n).join(", ")+'</p>':"")+
     (a&&(a.scene||a.national)?'<label class="f" for="ft">Thème<select id="ft">'+Object.entries(CM.THEMES).map(([k,t])=>'<option value="'+k+'"'+(k===sel.th?" selected":"")+'>'+esc(t.n)+'</option>').join("")+'</select></label>':"")+
     '<button class="btn primary" id="ok"'+(a?"":" disabled")+'>Valider mon action et la semaine</button>';
    $("panel").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{sel.a=b.dataset.a;drawF()});
    const fr=$("fr");if(fr)fr.onchange=()=>{sel.r=fr.value;sel.th=CM.REG[sel.r].enjeux[0];G.viewRegion(sel.r);drawF()};
    const ft=$("ft");if(ft)ft.onchange=()=>sel.th=ft.value;
    $("ok").onclick=()=>{A.click();done({a:sel.a,r:sel.r,th:sel.th})};
  };
  drawF();
}
function turnSummary(st,next){
  shell();
  const b=st.best;
  if(b){const pl=st.players.find(p=>p.id===b.p),R=CM.REG[b.r];G.viewRegion(b.r,b.a,{color:pl.c,banner:pl.s,sub:pl.n.toUpperCase()});
    if(b.a==="meeting")setTimeout(()=>G.subs(pl.n+" · "+R.chef,"Peuple de "+R.chef+" ! Je suis "+pl.n+", candidat du "+pl.s+". "+CM.THEMES[b.th||"emploi"].m+". Le "+(/^[AEÉIOU]/.test(R.n)?"l'":"")+R.n+" mérite mieux. Le jour du vote, souvenez-vous de nous !"),500)}
  $("panel").innerHTML='<div class="card"><span class="eyebrow">Ce qui s\'est passé</span><div class="log">'+st.last.map(l=>'<div>'+esc(l)+'</div>').join("")+'</div></div>'+standings(st)+'<button class="btn primary" id="nx">'+(st.phase==="end"?"Voir les résultats de l'élection":"Semaine suivante")+'</button>';
  $("nx").onclick=()=>{A.stop();next()};
}
function results(st){
  shell();const r=st.res,w=r.w;
  G.setView({land:"ville",overlay:"meeting",color:G.colorOf(w),banner:psig(w),sub:"VICTOIRE"},"Conseil constitutionnel","Résultats");
  A.fanfare();
  let html='<span class="eyebrow">Proclamation des résultats</span><h1 class="title">'+esc(pname(w))+' l\'emporte</h1>';
  let speech;
  if(r.type==="pres"){html+=G.barsHTML(r.nat.map(([p,v])=>[pname(p),v,100,G.colorOf(p)])," %")+'<p class="small muted">Participation : '+r.turn+' %. Scrutin majoritaire à un tour.</p>';
    speech="Le Conseil constitutionnel proclame les résultats de l'élection présidentielle. Est élu président de la République : "+pname(w)+", avec "+fmt(r.nat[0][1],1)+" pour cent des suffrages exprimés."}
  else{const ps=Object.keys(r.seats).sort((a,b)=>r.seats[b]-r.seats[a]);html+='<div class="seats">'+ps.map(p=>'<i style="width:'+(r.seats[p]/1.8)+'%;background:'+G.colorOf(p)+'"></i>').join("")+'</div><div class="legend">'+ps.map(p=>'<span><i style="background:'+G.colorOf(p)+'"></i>'+esc(pname(p))+' '+r.seats[p]+'</span>').join("")+'</div><p class="small muted">'+(r.seats[w]>=91?"Majorité absolue (91 sièges).":"Pas de majorité absolue : il faudra une coalition.")+'</p>';
    speech="Résultats des élections législatives. "+ps.map(p=>pname(p)+" : "+r.seats[p]+" sièges").join(". ")+"."}
  html+=G.mapSVG(id=>G.colorOf(r.reg[id]),null,x=>x.n)+'<div class="row"><button class="btn primary" id="again">Nouvelle partie entre amis</button><button class="btn" id="home">Accueil</button></div>';
  $("panel").innerHTML=html;$("panel").scrollTop=0;
  setTimeout(()=>G.subs("Conseil constitutionnel",speech),700);
  $("again").onclick=()=>{leaveRoom();try{localStorage.removeItem("etoudi-multi")}catch(e){}MULTI.setup()};
  $("home").onclick=()=>{leaveRoom();try{localStorage.removeItem("etoudi-multi")}catch(e){}G.home()};
}

/* ---------- en ligne (capacité room) ---------- */
function leaveRoom(){try{groom&&groom.leave()}catch(e){}groom=null;lastSt=null}
const ARTIFACT_URL="https://claude.ai/artifact/UH4N1hdM1u88qBjMyG6UVX";
let netKind="";
async function getRoom(){
  if(room)return room;
  if(window.claude&&window.claude.use){try{room=await window.claude.use("room")}catch(e){room=null}if(room){netKind="claude";return room}}
  if(window.NET&&window.WebSocket&&!(window.claude&&window.claude.use)){room={join:n=>window.NET.join(n)};netKind="public";return room}
  return null;
}
function inviteLink(code){
  if(window.claude&&window.claude.use)return ARTIFACT_URL+"#join-"+code;
  if(/^https?:/.test(location.protocol))return location.href.split("#")[0]+"#join-"+code;
  return "";
}
function copyText(t){try{navigator.clipboard.writeText(t).then(()=>G.toast("Copié !"),()=>G.toast("Copie impossible : sélectionnez le texte."))}catch(e){G.toast("Copie impossible : sélectionnez le texte.")}}
MULTI.joinWithCode=function(code){draft.joinCode=code;M=null;shell();onlineSetup(true)};
function onlineSetup(joinFirst){
  const p=draft.me||{n:"",s:"",h:"CE",c:COLORS[Math.floor(Math.random()*6)]};draft.me=p;
  $("panel").innerHTML='<div><span class="eyebrow">En ligne</span><h2 class="h2">Votre candidat</h2></div>'+
   '<div class="grid2"><label class="f" for="n0">Nom<input type="text" id="n0" maxlength="14" value="'+esc(p.n)+'"></label><label class="f" for="a0">Votre âge<input type="number" id="a0" min="16" max="95" value="'+(p.a||45)+'"></label></div><label class="f" for="s0">Sigle du parti<input type="text" id="s0" maxlength="6" value="'+esc(p.s)+'"></label>'+
   '<div class="row" style="align-items:flex-end"><label class="f" for="h0" style="flex:1">Région d\'origine<select id="h0">'+CM.REGIONS.map(r=>'<option value="'+r.id+'"'+(r.id===p.h?" selected":"")+'>'+esc(r.n)+'</option>').join("")+'</select></label><label class="f" for="c0">Couleur<input type="color" id="c0" value="'+p.c+'"></label></div>'+
   '<div class="card"><b>Créer une partie</b><div class="grid2"><button class="opt" data-ty="pres" aria-pressed="'+((draft.type||"pres")==="pres")+'"><b>Présidentielle</b></button><button class="opt" data-ty="leg" aria-pressed="'+(draft.type==="leg")+'"><b>Législatives</b></button></div>'+
   '<label class="f" for="tu">Tours<select id="tu">'+[6,8,10].map(n=>'<option'+(n===(draft.turns||8)?" selected":"")+'>'+n+'</option>').join("")+'</select></label><label class="row small" for="ai" style="gap:10px"><input type="checkbox" id="ai"'+(draft.ai?" checked":"")+'> Le RDPC est dans la course</label><button class="btn primary" id="create">Créer et obtenir un code</button></div>'+
   '<div class="card"'+(joinFirst?' style="border-color:var(--y)"':"")+'><b>Rejoindre une partie</b><label class="f" for="code">Code donné par l\'hôte<input type="text" id="code" maxlength="4" placeholder="Ex. KRBI" autocomplete="off" style="text-transform:uppercase" value="'+esc(draft.joinCode||"")+'"></label><button class="btn'+(joinFirst?" primary":"")+'" id="join">Rejoindre</button></div>'+
   '<div class="card small"><b>Comment inviter un ami à distance</b>'+(window.claude&&window.claude.use?'<span>1. Dans le menu <b>Partager</b> de cette page, invitez votre ami par son e-mail.<br>2. Créez la partie ci-dessus et envoyez-lui le <b>lien d\'invitation</b> (code inclus).<br>3. Il ouvre le lien connecté à son compte Claude (gratuit) : l\'écran « Rejoindre » s\'affiche avec le code.</span><span class="muted">Sans compte Claude : envoyez-lui le fichier « chemin-etoudi-hors-ligne.html » ; il l\'ouvre dans Chrome et tape le code. Les deux joueurs doivent alors utiliser ce fichier.</span>':'<span>Chacun ouvre ce fichier dans son navigateur, connecté à Internet. Le créateur donne le code à 4 lettres, les autres le tapent dans « Rejoindre ». Aucun compte n\'est nécessaire : la partie passe par un serveur public.</span>')+'</div><p class="small" id="oerr" style="color:var(--bad)" hidden></p>'+
   '<button class="btn ghost" id="back">Retour</button>';
  const keep=()=>{const q=[p];readPlayers(q);draft.type=draft.type||"pres";draft.turns=+$("tu").value;draft.ai=$("ai").checked};
  $("panel").querySelectorAll("[data-ty]").forEach(b=>b.onclick=()=>{keep();draft.type=b.dataset.ty;onlineSetup()});
  $("back").onclick=MULTI.setup;
  const err=m=>{const e=$("oerr");e.textContent=m;e.hidden=false};
  $("create").onclick=async()=>{keep();if(!ageOk([p],draft.type))return;const r=await getRoom();if(!r)return err("Le mode en ligne n'est pas disponible sur cet appareil ou dans cette version du jeu. Jouez sur un seul téléphone.");
    const code=Array.from({length:4},()=>"ABCDEFGHJKLMNPRSTUVWXYZ"[Math.floor(Math.random()*23)]).join("");
    try{groom=await r.join("etoudi-"+code.toLowerCase())}catch(e){return err("Connexion impossible ("+(e&&e.code||"erreur")+"). Réessayez ou jouez sur un seul téléphone.")}
    me={host:true,code,p:Object.assign({},p)};
    const st={type:draft.type,turns:draft.turns,ai:draft.ai,phase:"lobby",code};
    await groom.presence({role:"host",me:{n:p.n,s:p.s,h:p.h,c:p.c},st});
    lastSt=st;listen();lobby()};
  $("join").onclick=async()=>{keep();if(!p.a||p.a<23)return err("Il faut au moins 23 ans pour être candidat (35 ans pour la présidentielle).");const code=($("code").value||"").trim().toUpperCase();if(code.length!==4)return err("Le code fait 4 lettres.");const r=await getRoom();if(!r)return err("Le mode en ligne n'est pas disponible ici. Jouez sur un seul téléphone.");
    try{groom=await r.join("etoudi-"+code.toLowerCase())}catch(e){return err("Impossible de rejoindre ("+(e&&e.code||"erreur")+").")}
    me={host:false,code,p:Object.assign({},p)};await groom.presence({role:"player",me:{n:p.n,s:p.s,h:p.h,c:p.c}});listen();lobby()};
}
function hostPeer(){return groom.peers().find(x=>x.presence&&x.presence.role==="host")}
function myPeer(){return groom.peers().find(x=>x.sameTab)}
function listen(){
  groom.onPeers(()=>{
    if(me.host)hostLogic();
    const h=hostPeer();const st=me.host?lastSt:(h&&h.presence.st);
    if(!st){renderOnline(null);return}
    if(JSON.stringify(st)!==JSON.stringify(M&&M._raw)){M=expand(st);M._raw=st;renderOnline(M)}
    else if(M&&M.phase==="lobby")renderOnline(M);
  },e=>{G.toast("Connexion perdue ("+e.code+").")});
}
/* format compact pour tenir dans 4 Ko de présence */
function compact(st){const o={type:st.type,turns:st.turns,ai:st.ai,t:st.t,phase:st.phase,code:st.code,last:st.last||[],best:st.best||null,res:st.res||null,
  pl:st.players?st.players.map(p=>[p.id,p.n,p.s,p.c,p.h,Math.round(p.f),Math.round(p.o),p.pe||""]):[]};
  if(st.sup){o.sup={};for(const r in st.sup)o.sup[r]=st.sup[r]}return o}
function expand(c){const st={type:c.type,turns:c.turns,ai:c.ai,t:c.t,phase:c.phase,code:c.code,last:c.last||[],best:c.best,res:c.res,players:(c.pl||[]).map(a=>({id:a[0],n:a[1],s:a[2],c:a[3],h:a[4],f:a[5],o:a[6],pe:a[7]})),sup:c.sup||null,lobby:c.lobby||[]};return st}
async function publish(st){lastSt=compact(st);try{await groom.presence({st:lastSt})}catch(e){G.toast("Envoi impossible : "+(e.code||"erreur"))}}
function hostLogic(){
  const st=expand(lastSt),peers=groom.peers();
  if(st.phase==="lobby"){const lob=peers.filter(x=>x.presence&&(x.presence.role==="player"||x.presence.role==="host")&&x.presence.me).map(x=>({peer:x.peer,me:x.presence.me,host:x.presence.role==="host"}));
    const key=JSON.stringify(lob.map(l=>l.peer+l.me.n+l.me.s));if(key!==MULTI._lobKey){MULTI._lobKey=key;lastSt=Object.assign({},lastSt,{lobby:lob.map(l=>[l.peer,l.me.n,l.me.s,l.me.c])});groom.presence({st:lastSt})}
    return}
  if(st.phase!=="play")return;
  const moves={};let all=true;
  for(const pl of st.players){const pe=peers.find(x=>x.peer===pl.pe);const mv=pe&&pe.presence&&pe.presence.mv;if(mv&&mv.t===st.t)moves[pl.id]=mv;else if(pe)all=false}
  if(all&&Object.keys(moves).length){resolve(st,moves);publish(st)}
}
async function hostStart(){
  const peers=groom.peers();
  const lob=peers.filter(x=>x.presence&&x.presence.me&&(x.presence.role==="player"||x.presence.role==="host")).slice(0,6);
  if(lob.length<2){G.toast("Il faut au moins 2 joueurs.");return}
  const used=new Set();const players=lob.map((x,i)=>{let s=(x.presence.me.s||("P"+(i+1))).toUpperCase().slice(0,6);if(used.has(s)||s==="RDPC")s=s.slice(0,4)+(i+1);used.add(s);return{id:"P"+i,pe:x.peer,n:String(x.presence.me.n||("Joueur "+(i+1))).slice(0,14),s,c:x.presence.me.c||COLORS[i],h:CM.REG[x.presence.me.h]?x.presence.me.h:"CE"}});
  const st=initState(players,lastSt.type,lastSt.turns,lastSt.ai);st.code=lastSt.code;
  await publish(st);hostLogic();
  const h=expand(lastSt);M=h;M._raw=lastSt;renderOnline(M);
}
function lobby(){renderOnline(M)}
function renderOnline(st){
  shell();
  if(!st){$("panel").innerHTML='<div class="card"><span class="eyebrow">Partie '+esc(me.code)+'</span><p>Connexion à l\'hôte…</p><p class="small muted">Si rien ne se passe, vérifiez le code et que l\'hôte a bien créé la partie.</p><button class="btn ghost" id="lv">Quitter</button></div>';$("lv").onclick=()=>{leaveRoom();MULTI.setup()};return}
  if(st.phase==="lobby"){
    const lob=(me.host?(expand(lastSt).lobby):(st.lobby))||[];
    const link=inviteLink(st.code||me.code);
    $("panel").innerHTML='<div class="card" style="align-items:center;text-align:center"><span class="eyebrow">Code de la partie</span><span class="big-num" style="letter-spacing:.2em">'+esc(st.code||me.code)+'</span>'+(me.host?'<div class="row" style="justify-content:center"><button class="btn small" id="cpCode">Copier le code</button>'+(link?'<button class="btn small primary" id="cpLink">Copier le lien d\'invitation</button>':"")+'</div>'+(link?'<span class="small" style="overflow-wrap:anywhere;user-select:all">'+esc(link)+'</span>':""):"")+'<span class="small muted">Réseau : '+(netKind==="claude"?"Claude":"serveur public")+'. Donnez ce code à vos amis. '+(st.type==="leg"?"Législatives":"Présidentielle")+' · '+st.turns+' tours'+(st.ai?" · avec le RDPC":"")+'</span></div>'+
     '<div class="players">'+lob.map(l=>'<div class="player"><span class="dot" style="background:'+esc(l[3])+'"></span><span>'+esc(l[1])+' · '+esc(l[2])+'</span><span class="small muted">'+(l[0]===(myPeer()||{}).peer?"vous":"")+'</span></div>').join("")+'</div>'+
     (me.host?'<button class="btn primary" id="startO"'+(lob.length<2?" disabled":"")+'>Lancer la partie ('+lob.length+' joueurs)</button>':'<p class="small muted">En attente du lancement par l\'hôte…</p>')+'<button class="btn ghost" id="lv">Quitter</button>';
    const so=$("startO");if(so)so.onclick=hostStart;
    const cc=$("cpCode");if(cc)cc.onclick=()=>copyText(st.code||me.code);
    const cl=$("cpLink");if(cl)cl.onclick=()=>copyText("Rejoins ma partie de Chemin d'Etoudi : "+link+" (code "+(st.code||me.code)+")");$("lv").onclick=()=>{leaveRoom();MULTI.setup()};return}
  if(st.phase==="end")return results(st);
  const mine=st.players.find(p=>p.pe===(myPeer()||{}).peer);
  const myMv=(myPeer()||{presence:{}}).presence.mv;
  if(st.t>1&&st.last&&st.last.length&&MULTI._shown!==st.t){MULTI._shown=st.t;return turnSummary(st,()=>renderOnline(M))}
  if(!mine){$("panel").innerHTML='<div class="card"><p>La partie a commencé sans vous. Vous pouvez suivre les résultats.</p></div>'+standings(st);return}
  if(myMv&&myMv.t===st.t){const waiting=st.players.filter(p=>{const pe=groom.peers().find(x=>x.peer===p.pe);return!(pe&&pe.presence.mv&&pe.presence.mv.t===st.t)}).map(p=>p.n);
    $("panel").innerHTML='<div class="card"><span class="eyebrow">Semaine '+st.t+'/'+st.turns+'</span><p><b>'+(st.players.length-waiting.length)+'/'+st.players.length+'</b> joueurs ont validé le passage à la semaine suivante. Personne ne peut avancer le temps seul.</p><p class="small muted">En attente de : '+esc(waiting.join(", ")||"l'hôte")+'.</p></div>'+standings(st);return}
  G.viewRegion(mine.h);
  actionForm(st,mine,async mv=>{try{await groom.presence({mv:Object.assign({t:st.t},mv)})}catch(e){G.toast("Envoi impossible.")}if(me.host)hostLogic();renderOnline(M)});
}
})();

(function(){
  function check(){const m=/^#join-([A-Za-z]{4})$/.exec(location.hash||"");if(m&&window.GAME&&window.GAME.home){setTimeout(()=>MULTI.joinWithCode(m[1].toUpperCase()),300)}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(check,100));else setTimeout(check,100);
  window.addEventListener("hashchange",check);
})();
