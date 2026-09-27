/* Chemin d'Etoudi — contrats : rien n'est acheté ni signé d'un clic.
   1) ACHATS : on consulte les fournisseurs (pays, prix unitaire, délai de livraison, garantie, formation, paiement),
      on compare les prix du marché, on fixe la quantité, on fait une contre-proposition sur le prix, le délai et les
      options ; le fournisseur accepte, contre-propose ou refuse ; la commande n'est passée qu'après confirmation.
      La livraison arrive au bout du délai, et c'est alors que l'équipement produit ses effets.
   2) CONTRATS DE PARTENAIRES (or, fer, pétrole, forêt…) : chaque clause proposée par le partenaire (part de l'État,
      redevance, durée, emplois locaux, transformation, investissement, environnement, communautés…) peut être
      modifiée, avec un champ de contre-proposition sous chaque clause. Prix et partenaires : indicatifs. */
(function(){
"use strict";
const CM=window.CM,E=window.ETAT,G=window.GAME;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CTR={};window.CTR=CTR;
const say=m=>{try{window.Audio2.speak(m,{voix:"m"})}catch(e){}};
const f0=n=>Math.round(n).toLocaleString("fr-FR").replace(/ | /g," ");
const fM=m=>m>=1000?String(Math.round(m/100)/10).replace(".",",")+" milliard"+(m>=2000?"s":"")+" de FCFA":f0(m)+" millions de FCFA";
const lc=s=>s.charAt(0).toLowerCase()+s.slice(1);

/* ---------- catalogue des achats (prix unitaires indicatifs en millions de FCFA, délais en mois) ---------- */
const CAT={
 drones:{n:"Drones de surveillance",u:"drone",def:6,sec:4,f:[
   {n:"Baykar (Turquie) — Bayraktar TB2",pu:3200,d:10,g:"2 ans",form:"incluse (30 opérateurs)",pay:"échelonné possible",q:82},
   {n:"Elbit Systems (Israël) — Hermes 450",pu:6000,d:14,g:"3 ans",form:"en option (+8 %)",pay:"comptant",q:90},
   {n:"CASC (Chine) — CH-4",pu:2600,d:8,g:"1 an",form:"incluse",pay:"crédit export chinois",q:72}]},
 blindes:{n:"Véhicules blindés",u:"véhicule",def:100,sec:4,f:[
   {n:"Otokar (Turquie) — Cobra II",pu:480,d:9,g:"2 ans",form:"incluse",pay:"échelonné possible",q:80},
   {n:"Paramount (Afrique du Sud) — Mbombe 4",pu:620,d:12,g:"2 ans",form:"incluse",pay:"comptant",q:85},
   {n:"Norinco (Chine) — VN-22",pu:330,d:7,g:"1 an",form:"en option (+5 %)",pay:"crédit export chinois",q:70}]},
 helico:{n:"Hélicoptères de transport",u:"hélicoptère",def:6,sec:5,f:[
   {n:"Airbus Helicopters (France) — H225M",pu:18000,d:24,g:"3 ans",form:"incluse",pay:"échelonné",q:92},
   {n:"Russian Helicopters (Russie) — Mi-171",pu:9000,d:18,g:"2 ans",form:"incluse",pay:"crédit d'État",q:78},
   {n:"AVIC (Chine) — Z-8",pu:7500,d:14,g:"1 an",form:"en option (+6 %)",pay:"crédit export chinois",q:68}]},
 patrouilleurs:{n:"Patrouilleurs côtiers",u:"patrouilleur",def:5,sec:3,reg:"LT",f:[
   {n:"Piriou-OCEA (France) — patrouilleur de 35 m",pu:12000,d:20,g:"2 ans",form:"incluse",pay:"échelonné",q:88},
   {n:"Damen (Pays-Bas) — Stan Patrol 4207",pu:14500,d:18,g:"3 ans",form:"incluse",pay:"comptant",q:90},
   {n:"Poly Technologies (Chine) — patrouilleur de 32 m",pu:8000,d:14,g:"1 an",form:"en option (+5 %)",pay:"crédit export chinois",q:70}]}};
CTR.CAT=CAT;
function drafts(S){return S.achats||(S.achats={})}
function orders(S){return S.cmds||(S.cmds=[])}
const OPT=[["form","Formation des équipes",.06],["maint","Maintenance et pièces détachées sur 3 ans",.12],["local","Assemblage ou entretien au Cameroun (transfert de compétences)",.1]];
/* prix exigé par le fournisseur pour la configuration demandée */
function need(it,f,dr){let p=f.pu;for(const [k,,x] of OPT)if(dr.opt[k])p*=1+x;const minD=Math.ceil(f.d*.5);if(dr.del<f.d)p*=1+(f.d-dr.del)/f.d*.35;if(dr.qty>=it.def*2)p*=.95;else if(dr.qty<it.def/2)p*=1.05;if(dr.pay==="comptant")p*=.97;return{p,minD}}
CTR.achat=function(S,id){const it=CAT[id];if(!it)return;const D=drafts(S);let dr=D[id];if(!dr||dr.done){dr=D[id]={f:null,qty:it.def,pu:null,del:null,opt:{form:true,maint:false,local:false},pay:"echelonne",pat:3,floor:.84+Math.random()*.1,log:[],ok:false}}
  const lo=Math.min(...it.f.map(x=>x.pu)),hi=Math.max(...it.f.map(x=>x.pu));
  G.sheet('<span class="eyebrow">Achat · consultation des fournisseurs</span><h3 class="h2">'+esc(it.n)+'</h3>'+
   '<p class="small">Prix constatés sur le marché : de <b>'+fM(lo)+'</b> à <b>'+fM(hi)+'</b> par '+esc(it.u)+'. Quantité recommandée par l\'état-major : '+it.def+'. Rien n\'est commandé tant que vous n\'avez pas confirmé.</p>'+
   '<div class="choices">'+it.f.map((f,i)=>'<button class="choice" data-cf="'+i+'" aria-pressed="'+(dr.f===i)+'" style="'+(dr.f===i?"outline:2px solid var(--accent,#f5c542)":"")+'"><span class="t">'+(dr.f===i?"✔ ":"")+esc(f.n)+'</span><span class="d">'+fM(f.pu)+' par '+esc(it.u)+' · livraison '+f.d+' mois · garantie '+esc(f.g)+' · formation '+esc(f.form)+' · paiement '+esc(f.pay)+' · qualité '+f.q+'/100</span></button>').join("")+'</div>'+
   (dr.f!=null?form(S,it,dr):'<p class="small muted">Choisissez un fournisseur pour négocier les détails.</p>'),el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-cf]").forEach(b=>b.onclick=()=>{const i=+b.dataset.cf;if(dr.f!==i){dr.f=i;const f=it.f[i];dr.pu=f.pu;dr.del=f.d;dr.pat=3;dr.ok=false;dr.log=[]}el.remove();CTR.achat(S,id)});
    if(dr.f==null)return;const f=it.f[dr.f];
    const rd=()=>{dr.qty=Math.max(1,Math.round(+el.querySelector("#caQ").value||1));dr.pu=Math.max(1,+el.querySelector("#caP").value||f.pu);dr.del=Math.max(1,Math.round(+el.querySelector("#caD").value||f.d));dr.pay=el.querySelector("#caPay").value;for(const [k] of OPT)dr.opt[k]=el.querySelector("#co_"+k).checked;dr.note=el.querySelector("#caN").value.trim()};
    const upd=()=>{rd();el.querySelector("#caTot").textContent=fM(dr.qty*dr.pu)};el.querySelectorAll("#caQ,#caP,#caD,#caPay,[id^=co_]").forEach(x=>x.oninput=x.onchange=()=>{dr.ok=false;upd()});
    el.querySelector("#caGo").onclick=()=>{rd();propose(S,it,f,dr);el.remove();CTR.achat(S,id)};
    const cf=el.querySelector("#caOk");if(cf)cf.onclick=()=>{rd();el.remove();confirm(S,id,it,f,dr)};
    el.querySelector("#caNo").onclick=()=>{el.remove();delete D[id];G.toast("Consultation abandonnée : rien n'a été commandé.")}})};
function form(S,it,dr){const f=it.f[dr.f];const tot=dr.qty*dr.pu;
  return '<span class="eyebrow">Vos conditions à '+esc(f.n.split(" — ")[0])+'</span>'+
   '<div class="row" style="gap:8px;flex-wrap:wrap"><label class="small">Quantité<input id="caQ" type="number" min="1" value="'+dr.qty+'" style="width:90px"></label><label class="small">Prix unitaire proposé (M FCFA)<input id="caP" type="number" min="1" step="10" value="'+Math.round(dr.pu)+'" style="width:130px"></label><label class="small">Délai de livraison (mois)<input id="caD" type="number" min="1" value="'+dr.del+'" style="width:90px"></label>'+
   '<label class="small">Paiement<select id="caPay"><option value="comptant"'+(dr.pay==="comptant"?" selected":"")+'>Comptant (−3 %)</option><option value="echelonne"'+(dr.pay==="echelonne"?" selected":"")+'>30 % à la commande, 70 % à la livraison</option><option value="credit"'+(dr.pay==="credit"?" selected":"")+'>Crédit fournisseur (15 % + intérêts)</option></select></label></div>'+
   OPT.map(([k,l,x])=>'<label class="small row" style="gap:6px"><input type="checkbox" id="co_'+k+'"'+(dr.opt[k]?" checked":"")+'> '+esc(l)+' (+'+Math.round(x*100)+' %)</label>').join("")+
   '<label class="f small" for="caN">Autres exigences ou contre-proposition (texte libre)<textarea id="caN" data-grow rows="2" placeholder="Ex. : livraison en deux lots, pénalités de retard de 1 % par mois, pièces détachées stockées à Yaoundé">'+esc(dr.note||"")+'</textarea></label>'+
   '<div class="card" style="gap:4px;background:var(--panel3)"><span class="small"><b>Montant total de votre offre :</b> <span id="caTot">'+fM(tot)+'</span> · prix catalogue '+fM(f.pu)+' / '+esc(it.u)+' · patience du fournisseur '+"●".repeat(dr.pat)+"○".repeat(3-dr.pat)+'</span>'+
   (dr.log.length?'<div class="vxlog" style="max-height:24vh;margin-top:6px">'+dr.log.map(l=>'<div class="'+(l.me?"me":"it")+'">'+esc(l.t)+'</div>').join("")+'</div>':"")+'</div>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn" id="caGo">📨 Envoyer ma contre-proposition</button>'+(dr.ok?'<button class="btn primary" id="caOk">✅ Confirmer la commande ('+fM(tot)+')</button>':"")+'<button class="btn ghost" id="caNo">Abandonner</button></div>'+
   (dr.ok?"":'<p class="small muted">Le bouton « Confirmer la commande » apparaît quand le fournisseur a accepté vos conditions.</p>')}
function propose(S,it,f,dr){const n=need(it,f,dr);const who=f.n.split(" — ")[0];
  dr.log.push({me:1,t:"Vous : "+dr.qty+" "+it.u+(dr.qty>1?"s":"")+" à "+fM(dr.pu)+" l'unité, livraison en "+dr.del+" mois"+(OPT.filter(o=>dr.opt[o[0]]).length?", avec "+OPT.filter(o=>dr.opt[o[0]]).map(o=>lc(o[1])).join(", "):"")+"."+(dr.note?" "+dr.note:"")});
  if(dr.del<n.minD){dr.ok=false;dr.log.push({t:who+" : impossible de livrer en "+dr.del+" mois, notre délai minimum est de "+n.minD+" mois pour cette quantité."});return}
  if(dr.pu>=n.p*.995){dr.ok=true;dr.log.push({t:who+" : nous acceptons vos conditions. Vous pouvez confirmer la commande."});say("Le fournisseur accepte vos conditions.");return}
  const floor=n.p*dr.floor;
  if(dr.pu>=floor){const mid=Math.round((dr.pu+n.p)/2);if(Math.random()<.45||dr.pu>=floor*1.04){dr.ok=true;dr.pu=Math.round(dr.pu);dr.log.push({t:who+" : c'est serré, mais nous acceptons pour garder le client camerounais."});return}
    dr.ok=false;dr.pu=mid;dr.log.push({t:who+" : nous pouvons descendre à "+fM(mid)+" l'unité, pas moins. (Le prix proposé a été mis à jour ; renvoyez pour accepter.)"});return}
  dr.pat=Math.max(0,dr.pat-1);dr.ok=false;const c=Math.round(Math.max(floor*1.02,n.p*.93));
  if(dr.pat<=0){dr.log.push({t:who+" : vos conditions sont trop éloignées des nôtres. Nous retirons notre offre ; consultez un autre fournisseur."});dr.pat=0;dr.f=null;return}
  dr.log.push({t:who+" : ce prix est en dessous de nos coûts. Notre meilleure offre : "+fM(c)+" l'unité pour ces conditions."});dr.pu=c}
function confirm(S,id,it,f,dr){const tot=dr.qty*dr.pu;const cr=dr.pay==="credit";const now=dr.pay==="comptant"?1:dr.pay==="echelonne"?.3:.15;
  if(S.nums)S.nums.dette+=tot/1000*now;const o={id:"c"+Date.now().toString(36),item:id,n:it.n,f:f.n,qty:dr.qty,pu:dr.pu,tot,pay:dr.pay,rest:tot*(1-now)*(cr?1.12:1),arr:S.day+dr.del*30,opt:Object.assign({},dr.opt),note:dr.note||"",q:f.q+(dr.opt.maint?5:0)+(dr.opt.local?3:0),st:"commandé",day:S.day};
  orders(S).push(o);dr.done=true;
  window.SYS.inbox(S,{from:"Ministère délégué à la Défense",t:"Commande passée : "+dr.qty+" × "+it.n.toLowerCase(),b:"Fournisseur : "+f.n+".\nQuantité : "+dr.qty+" · prix unitaire négocié : "+fM(dr.pu)+" (catalogue : "+fM(f.pu)+").\nMontant total : "+fM(tot)+". Paiement : "+{comptant:"comptant",echelonne:"30 % à la commande, 70 % à la livraison",credit:"crédit fournisseur, 15 % à la commande"}[dr.pay]+".\nLivraison prévue le "+G.dayLabel(o.arr)+" ("+dr.del+" mois)."+(o.note?"\nConditions particulières : "+o.note:""),k:"info"});
  G.toast("Commande confirmée : livraison le "+G.dayLabel(o.arr));G.render()}
CTR.tick=function(S){for(const o of (S&&S.cmds)||[]){if(o.st!=="commandé"||S.day<o.arr)continue;o.st="livré";const it=CAT[o.item];if(S.nums)S.nums.dette+=o.rest/1000;
  const k=Math.min(2,o.qty/it.def)*(o.q/85);if(S.st)S.st.sec=Math.min(100,S.st.sec+it.sec*k);if(S.regs){if(it.reg)S.regs[it.reg].sec=Math.min(100,S.regs[it.reg].sec+8*k);else for(const r of ["EN","NW","SW"])S.regs[r].sec=Math.min(100,S.regs[r].sec+3.5*k)}
  if(S.def)S.def.equip.push(o.item);
  window.SYS.inbox(S,{from:"État-major des armées",t:"Livraison reçue : "+o.qty+" × "+o.n.toLowerCase(),b:"Le matériel commandé à "+o.f+" est arrivé et entre en service."+(o.rest?" Solde réglé : "+fM(o.rest)+".":""),k:"bonne"});G.toast("Livraison reçue : "+o.n)}};
CTR.ordersHTML=function(S){const L=((S&&S.cmds)||[]).filter(o=>o.st==="commandé");if(!L.length)return"";return'<div class="card"><span class="eyebrow">Commandes en cours</span>'+L.map(o=>'<div class="small">• '+o.qty+' × '+esc(o.n.toLowerCase())+' — '+esc(o.f.split(" — ")[0])+' · '+fM(o.tot)+' · livraison le '+esc(G.dayLabel(o.arr))+'</div>').join("")+'</div>'};

/* ---------- contrats proposés par des partenaires ---------- */
/* clause : [id, libellé, options (de la plus favorable au partenaire à la plus favorable à l'État), index proposé par le partenaire] */
const OFFRES=[
 {id:"or_bo",min:"MINMIDT",reg:"ES",t:"Exploitation d'or semi-mécanisée à Bétaré-Oya",p:"Kambélé Gold Mining SA (consortium privé)",d:"Le consortium demande un permis d'exploitation de 15 km² de gisements aurifères alluvionnaires et primaires dans le Lom-et-Djérem.",rec:[6,22],cl:[
   ["part","Part de l'État dans la société",["5 %","10 % gratuits","15 %","20 %","25 %"],1],
   ["red","Redevance sur l'or extrait",["3 %","5 %","7 %","8 %"],0],
   ["duree","Durée du permis",["25 ans","15 ans","10 ans renouvelable"],0],
   ["vente","Or vendu à",["Libre export","50 % à la BEAC","100 % à la BEAC au prix du marché"],0],
   ["emp","Emplois camerounais",["40 %","60 %","80 %","90 % dont cadres"],1],
   ["env","Réhabilitation des sites",["Aucune garantie","Fonds de 1 milliard","Fonds de 3 milliards bloqué"],0],
   ["com","Contribution aux communautés riveraines",["0,5 % du chiffre d'affaires","1 %","2 % et forages d'eau"],0],
   ["inv","Investissement minimal",["10 milliards","20 milliards","35 milliards"],0]]},
 {id:"petrole",min:"MINMIDT",reg:"SW",t:"Bloc pétrolier offshore du Rio del Rey",p:"Atlantic Offshore Petroleum (compagnie privée)",d:"La compagnie propose un contrat de partage de production pour explorer puis exploiter un bloc en mer.",rec:[20,70],cl:[
   ["pp","Part de la production revenant à l'État",["35 %","45 %","55 %","65 %"],0],
   ["snh","Participation de la SNH",["10 %","20 %","25 %"],0],
   ["bonus","Bonus de signature",["2 milliards","5 milliards","10 milliards"],0],
   ["duree","Durée du contrat",["30 ans","25 ans","20 ans"],0],
   ["local","Sous-traitance camerounaise",["10 %","25 %","40 %"],0],
   ["gaz","Gaz associé",["Brûlé en torchère","Réinjecté","Livré au marché local"],0]]},
 {id:"foret",min:"MINFOF",reg:"ES",t:"Concession forestière dans le Haut-Nyong",p:"Timber Kribi SA (exploitant forestier)",d:"L'exploitant demande une unité forestière d'aménagement de 80 000 hectares.",rec:[3,12],cl:[
   ["rfa","Redevance forestière annuelle",["1 500 FCFA/ha","2 500 FCFA/ha","4 000 FCFA/ha"],0],
   ["tr","Bois transformé au Cameroun",["30 %","60 %","100 %"],0],
   ["duree","Durée de la convention",["30 ans","15 ans renouvelable"],0],
   ["cert","Certification (gestion durable)",["Aucune","Sous 5 ans","Sous 2 ans"],0],
   ["baka","Droits des communautés Baka et riveraines",["Consultation simple","Consentement et 10 % de la RFA","Consentement, 20 % de la RFA et zones réservées"],0]]}];
CTR.OFFRES=OFFRES;
function cst(S){return S.ctr||(S.ctr={next:(S.day||0)+9,seen:{},deals:{}})}
CTR.offerTick=function(S){if(!S||S.phase!=="play"||(S.mode!=="pres"&&S.mode!=="min"))return;const C=cst(S);if(S.day<C.next)return;C.next=S.day+14+Math.random()*10;
  const o=OFFRES.find(x=>!C.seen[x.id]&&(S.mode==="pres"||x.min===(S.minis&&S.minis.id)));if(!o)return;C.seen[o.id]=S.day;
  window.SYS.inbox(S,{from:o.p,t:"📄 Offre de contrat : "+o.t,b:o.d+"\nConditions proposées par le partenaire :\n"+o.cl.map(c=>"• "+c[1]+" : "+c[2][c[3]]).join("\n")+"\nChaque clause peut être négociée.",k:"rapport",ctr:o.id});
  G.toast("📄 Nouvelle offre de contrat : "+o.t,()=>CTR.contrat(S,o.id))};
CTR.contrat=function(S,oid){const o=OFFRES.find(x=>x.id===oid);if(!o)return;const C=cst(S);let dl=C.deals[oid];if(!dl||dl.fin){if(dl&&dl.fin==="signé")return G.toast("Ce contrat est déjà signé.");dl=C.deals[oid]={sel:o.cl.map(c=>c[3]),notes:{},pat:3,lim:.42+Math.random()*.25,log:[],ok:false}}
  const gain=()=>o.cl.reduce((a,c,i)=>a+(c[2].length>1?dl.sel[i]/(c[2].length-1):0),0)/o.cl.length;
  G.sheet('<span class="eyebrow">Contrat · '+esc(o.p)+'</span><h3 class="h2">'+esc(o.t)+'</h3><p class="small muted">'+esc(o.d)+'</p>'+
   o.cl.map((c,i)=>'<div class="card" style="gap:4px;background:var(--panel3)"><label class="small" for="ct'+i+'"><b>'+esc(c[1])+'</b> — proposition du partenaire : <i>'+esc(c[2][c[3]])+'</i></label><select id="ct'+i+'" data-ct="'+i+'">'+c[2].map((x,j)=>'<option value="'+j+'"'+(dl.sel[i]===j?" selected":"")+'>'+(j===c[3]?"(partenaire) ":"")+esc(x)+'</option>').join("")+'</select><input data-ctn="'+c[0]+'" placeholder="Votre contre-proposition sur ce point (facultatif)" value="'+esc(dl.notes[c[0]]||"")+'" style="width:100%"></div>').join("")+
   '<div class="card" style="gap:4px"><span class="small"><b>Intérêt pour l\'État :</b> <span id="ctG">'+Math.round(gain()*100)+'</span>/100 · <b>Patience du partenaire :</b> '+"●".repeat(dl.pat)+"○".repeat(3-dl.pat)+'</span>'+
   (dl.log.length?'<div class="vxlog" style="max-height:24vh;margin-top:6px">'+dl.log.map(l=>'<div class="'+(l.me?"me":"it")+'">'+esc(l.t)+'</div>').join("")+'</div>':"")+'</div>'+
   '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn" id="ctGo">📨 Envoyer ma contre-proposition</button>'+(dl.ok?'<button class="btn primary" id="ctSign">✍️ Signer le contrat</button>':"")+'<button class="btn" id="ctAv">📋 Avis du ministre</button><button class="btn ghost" id="ctNo">Refuser l\'offre</button></div>',el=>{el.setAttribute("data-noinstr","");
    el.querySelectorAll("[data-ct]").forEach(s=>s.onchange=()=>{dl.sel[+s.dataset.ct]=+s.value;dl.ok=false;el.querySelector("#ctG").textContent=Math.round(gain()*100)});
    const rn=()=>el.querySelectorAll("[data-ctn]").forEach(x=>{dl.notes[x.dataset.ctn]=x.value.trim()});
    el.querySelector("#ctGo").onclick=()=>{rn();const g=gain();const notes=Object.entries(dl.notes).filter(([k,v])=>v);
      dl.log.push({me:1,t:"Vous : "+o.cl.map((c,i)=>lc(c[1])+" : "+c[2][dl.sel[i]]).join(" ; ")+"."+(notes.length?" Contre-propositions : "+notes.map(([k,v])=>v).join(" ; ")+".":"")});
      const over=g-dl.lim-(notes.length?.03:0);
      if(over<=0){dl.ok=true;dl.log.push({t:o.p+" : nous acceptons ces conditions"+(notes.length?", y compris vos demandes particulières":"")+". Nous sommes prêts à signer."})}
      else{dl.pat=Math.max(0,dl.pat-(over>.2?2:1));dl.ok=false;
        if(dl.pat<=0){dl.fin="retiré";dl.log.push({t:o.p+" : nous retirons notre offre."});window.SYS.inbox(S,{from:o.p,t:"Offre retirée : "+o.t,b:"Le partenaire a jugé vos conditions trop éloignées des siennes.",k:"alerte"})}
        else{let bi=0,bv=-1;o.cl.forEach((c,i)=>{const v=(dl.sel[i]-c[3])/(c[2].length-1||1);if(v>bv){bv=v;bi=i}});const c=o.cl[bi];const nv=Math.max(c[3],dl.sel[bi]-1);
          dl.log.push({t:o.p+" : "+(over>.2?"c'est loin de ce que nous pouvons accepter. ":"nous nous rapprochons. ")+"Sur « "+lc(c[1])+" », nous pourrions aller jusqu'à « "+c[2][nv]+" »."+(notes.length?" Vos autres demandes sont à l'étude.":"")});dl.sel[bi]=nv}}
      el.remove();CTR.contrat(S,oid)};
    el.querySelector("#ctAv").onclick=()=>{const g=gain();dl.log.push({t:"Ministre : "+(g>dl.lim+.15?"nous exigeons beaucoup, ils risquent de partir ; lâchons du lest sur un ou deux points.":g<dl.lim-.15?"nous pouvons obtenir davantage, en particulier sur "+lc(o.cl[1][1])+".":"nous sommes proches d'un accord équilibré.")});el.remove();CTR.contrat(S,oid)};
    const sg=el.querySelector("#ctSign");if(sg)sg.onclick=()=>{rn();el.remove();const g=gain();dl.fin="signé";const v=Math.round(o.rec[0]+(o.rec[1]-o.rec[0])*g);
      if(S.rec)S.rec.on.push({id:"ctr_"+oid,t:"Contrat : "+o.t,v,since:S.day});if(o.reg)window.SYS.cause(S,o.reg,"Contrat signé : "+o.t,1+g*2,"emploi");if(S.st)S.st.eco=Math.min(100,S.st.eco+1+g*2);
      window.SYS.inbox(S,{from:"Secrétariat général de la Présidence",t:"Contrat signé : "+o.t,b:"Partenaire : "+o.p+".\nClauses : "+o.cl.map((c,i)=>c[1]+" : "+c[2][dl.sel[i]]+(dl.notes[c[0]]?" ("+dl.notes[c[0]]+")":"")).join(" ; ")+".\nRecettes attendues pour l'État : environ "+v+" milliards de FCFA par an. Intérêt de l'accord pour l'État : "+Math.round(g*100)+"/100.",k:"bonne"});G.toast("Contrat signé : "+o.t);G.render()};
    el.querySelector("#ctNo").onclick=()=>{dl.fin="refusé";el.remove();G.toast("Offre refusée.")}})};
/* ---------- missions de renseignement : réglées et confirmées avant lancement, annulables en cours ---------- */
const MOY=[["reduits","Réduits",-.15,.5],["normaux","Normaux",0,1],["renforces","Renforcés",.1,2]];
const DUR=[[15,-.05],[30,0],[60,.07]];
CTR.mission=function(S,id){const x=E.ESPIONNAGE.find(y=>y.id===id);if(!x||!S.def)return;const D=S.def;if(D.esp)return G.toast("Une mission est déjà en cours : rappelez les agents avant d'en lancer une autre.");if(D.espUsed===S.m)return G.toast("La mission du mois a déjà été lancée.");
  const st={m:1,disc:0,dur:1,ok:false};
  const calc=()=>{const p=Math.max(.05,Math.min(.95,x.ok+MOY[st.m][2]+DUR[st.dur][1]-(st.disc?.05:0)));const expo=(x.scandale?.6:.5)*(st.disc?.5:1)*(st.m===2?1.2:st.m===0?.8:1);return{p,expo,cout:MOY[st.m][3]}};
  const draw=()=>{const c=calc();return '<span class="eyebrow">Mission de renseignement · DGRE</span><h3 class="h2">'+esc(x.n)+'</h3><p>'+esc(x.d)+'</p>'+
   (x.scandale?'<div class="card" style="background:var(--panel3);border-color:#c42b1c"><b>⚠️ Mission illégale</b><span class="small">Écouter des dirigeants politiques sans décision de justice viole la Constitution et la loi. Si c\'est révélé : scandale national, perte de crédibilité, plaintes. Alternative légale : demander au ministre de l\'Administration territoriale un point sur les activités des partis, ou saisir la justice si un délit est suspecté.</span><label class="small row" style="gap:6px"><input type="checkbox" id="msOk"'+(st.ok?" checked":"")+'> Je mesure ce risque et je décide quand même</label></div>':"")+
   '<label class="f small">Moyens engagés<select id="msM">'+MOY.map((m,i)=>'<option value="'+i+'"'+(st.m===i?" selected":"")+'>'+m[1]+' ('+(m[2]?(m[2]>0?"+":"")+Math.round(m[2]*100)+' % de chances':"chances inchangées")+', '+String(m[3]).replace(".",",")+' milliard'+(m[3]>=2?"s":"")+')</option>').join("")+'</select></label>'+
   '<label class="f small">Discrétion<select id="msD"><option value="0"'+(!st.disc?" selected":"")+'>Standard</option><option value="1"'+(st.disc?" selected":"")+'>Maximale (−5 % de chances, risque d\'être découvert divisé par deux)</option></select></label>'+
   '<label class="f small">Durée<select id="msT">'+DUR.map((d,i)=>'<option value="'+i+'"'+(st.dur===i?" selected":"")+'>'+d[0]+' jours'+(d[1]?' ('+(d[1]>0?"+":"")+Math.round(d[1]*100)+' % de chances)':"")+'</option>').join("")+'</select></label>'+
   '<div class="card" style="gap:4px;background:var(--panel3)"><span class="small"><b>Chances de succès :</b> '+Math.round(c.p*100)+' % · <b>Risque d\'être découvert en cas d\'échec :</b> '+Math.round(c.expo*100)+' % · <b>Coût :</b> '+String(c.cout).replace(".",",")+' milliard'+(c.cout>=2?"s":"")+'</span></div>'+
   '<div class="row" style="gap:6px"><button class="btn primary" id="msGo"'+(x.scandale&&!st.ok?" disabled":"")+'>🕵️ Lancer la mission</button><button class="btn ghost" id="msNo">Ne pas lancer</button></div>'};
  G.sheet(draw(),el=>{el.setAttribute("data-noinstr","");const bind=()=>{const inn=el.querySelector(".in")||el;
      const rd=()=>{st.m=+inn.querySelector("#msM").value;st.disc=+inn.querySelector("#msD").value;st.dur=+inn.querySelector("#msT").value;const k=inn.querySelector("#msOk");st.ok=k?k.checked:true;const x0=inn.querySelector(".sheet-x");inn.innerHTML="";if(x0)inn.appendChild(x0);inn.insertAdjacentHTML("beforeend",draw());bind()};
      inn.querySelectorAll("#msM,#msD,#msT,#msOk").forEach(s=>s.onchange=rd);
      inn.querySelector("#msNo").onclick=()=>{el.remove();G.toast("Mission non lancée.")};
      inn.querySelector("#msGo").onclick=()=>{const c=calc();el.remove();S.nums.dette+=c.cout;D.espUsed=S.m;D.esp={id,p:c.p,expo:c.expo,start:S.day,fin:S.day+DUR[st.dur][0],cout:c.cout};
        window.SYS.inbox(S,{from:"Direction générale de la recherche extérieure",t:"Mission lancée : "+x.n,b:"Moyens "+MOY[st.m][1].toLowerCase()+", discrétion "+(st.disc?"maximale":"standard")+", durée "+DUR[st.dur][0]+" jours. Compte rendu attendu le "+G.dayLabel(D.esp.fin)+". Vous pouvez rappeler les agents à tout moment depuis l'onglet Défense.",k:"info",read:true});G.toast("Mission lancée : fin le "+G.dayLabel(D.esp.fin));G.render()}};bind()})};
CTR.missionHTML=function(S){const m=S.def&&S.def.esp;if(!m)return"";const x=E.ESPIONNAGE.find(y=>y.id===m.id);return'<div class="card" style="gap:6px;background:var(--panel3)"><b>🕵️ Mission en cours : '+esc(x?x.n:"")+'</b><span class="small muted">Lancée le '+esc(G.dayLabel(m.start))+' · compte rendu le '+esc(G.dayLabel(m.fin))+' · chances '+Math.round(m.p*100)+' %</span><button class="btn small" data-esprec>↩️ Rappeler les agents (annuler la mission)</button></div>'};
CTR.recall=function(S){const D=S.def;if(!D||!D.esp)return;const x=E.ESPIONNAGE.find(y=>y.id===D.esp.id);const early=(S.day-D.esp.start)/(D.esp.fin-D.esp.start||1);
  const leak=x&&x.scandale&&Math.random()<.1*early;D.esp=null;if(leak){for(const k in x.risk)S.st[k]=Math.max(0,S.st[k]+x.risk[k]/2)}
  window.SYS.inbox(S,{from:"Direction générale de la recherche extérieure",t:"Mission annulée : "+(x?x.n:""),b:"Les agents ont été rappelés. "+(leak?"Des fuites ont eu lieu : quelques journaux évoquent des écoutes.":"Aucune trace n'a été laissée.")+" Les moyens engagés ne sont pas récupérables.",k:leak?"alerte":"info"});G.toast("Mission annulée : les agents sont rappelés.");G.render()};
const _tick=CTR.tick;CTR.tick=function(S){_tick(S);const D=S&&S.def;if(!D||!D.esp||S.day<D.esp.fin)return;const m=D.esp;D.esp=null;const x=E.ESPIONNAGE.find(y=>y.id===m.id);if(!x)return;const ok=Math.random()<m.p;
  if(ok){for(const k in x.gain)S.st[k]=Math.min(100,S.st[k]+x.gain[k]);if(x.reg)for(const r in x.reg)S.regs[r].sec=Math.min(100,S.regs[r].sec+x.reg[r])}
  else if(Math.random()<m.expo){for(const k in x.risk)S.st[k]=Math.max(0,S.st[k]+x.risk[k])}
  const txt=ok?"Mission réussie : "+lc(x.n)+". Informations exploitables transmises aux forces.":"Mission sans résultat"+(x.scandale?" ; des rumeurs d'écoutes circulent.":".");
  window.SYS.inbox(S,{from:"Direction générale de la recherche extérieure",t:"Compte rendu de mission",b:txt,k:ok?"bonne":"alerte"});G.toast(ok?"Mission réussie":"Mission sans résultat")};

CTR.mailActs=it=>it.ctr?'<button class="btn primary" data-ctx>📄 Examiner et négocier le contrat</button>':"";
CTR.mailBind=(S,it,el)=>{const b=el.querySelector("[data-ctx]");if(b)b.onclick=()=>{el.remove();CTR.contrat(S,it.ctr)}};
})();
