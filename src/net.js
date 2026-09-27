/* Réseau de secours pour jouer en ligne sans compte : présence partagée via un serveur MQTT public
   (WebSocket). Même interface que la « room » de la plateforme : presence(), peers(), onPeers(), leave().
   Utilisé par la version hors ligne ou hébergée ; dans la page Claude, la room de la plateforme est prioritaire. */
(function(){
"use strict";
const BROKERS=["wss://broker.emqx.io:8084/mqtt","wss://broker.hivemq.com:8884/mqtt","wss://test.mosquitto.org:8081/mqtt"];
const PREFIX="chemin-etoudi/v1/";
const enc=new TextEncoder(),dec=new TextDecoder();
const NET={brokers:BROKERS};window.NET=NET;

function str(s){const b=enc.encode(s);return[b.length>>8,b.length&255,...b]}
function varLen(n){const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d)}while(n>0);return o}
function packet(type,body){return new Uint8Array([type,...varLen(body.length),...body])}
function connectPkt(id,willTopic){
  const flags=0x02|0x04|0x20; // session propre, testament, testament conservé
  const body=[...str("MQTT"),4,flags,0,30,...str(id),...str(willTopic),0,0];
  return packet(0x10,body);
}
function publishPkt(topic,payload,retain){const p=typeof payload==="string"?enc.encode(payload):payload;return packet(0x30|(retain?1:0),[...str(topic),...p])}
function subscribePkt(pid,topic){return packet(0x82,[pid>>8,pid&255,...str(topic),0])}

function openSocket(url,id,will,timeout){
  return new Promise((res,rej)=>{
    let ws;try{ws=new WebSocket(url,"mqtt")}catch(e){return rej(e)}
    ws.binaryType="arraybuffer";let done=false;
    const t=setTimeout(()=>{if(!done){done=true;try{ws.close()}catch(e){}rej(new Error("timeout"))}},timeout);
    ws.onopen=()=>ws.send(connectPkt(id,will));
    ws.onerror=()=>{if(!done){done=true;clearTimeout(t);rej(new Error("socket"))}};
    let acc=[];
    ws.onmessage=ev=>{if(done)return;acc=acc.concat(Array.from(new Uint8Array(ev.data)));if(acc.length<4)return;if(acc[0]===0x20){done=true;clearTimeout(t);ws._rest=new Uint8Array(acc.slice(4));if(acc[3]===0)res(ws);else{ws.close();rej(new Error("refus "+acc[3]))}}};
  });
}

NET.join=async function(name){
  const me=Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>x.toString(16).padStart(2,"0")).join("");
  const base=PREFIX+name+"/p/",mine=base+me;
  let ws=null,err=null;
  for(const u of NET.brokers){try{ws=await openSocket(u,"ce-"+me,mine,7000);NET.url=u;break}catch(e){err=e}}
  if(!ws){const e=new Error("Aucun serveur joignable");e.code="upstream_error";throw e}
  const peers=new Map(),listeners=[];let myPres={},buf=ws._rest||new Uint8Array(0),closed=false,snapshot=[];
  const stamp=()=>Date.now();
  function rebuild(){snapshot=Object.freeze([...peers.values()].map(p=>Object.freeze(Object.assign({},p))));return snapshot}
  function emit(){rebuild();const ch={peers:snapshot,joined:[],left:[],updated:[]};for(const f of listeners){try{f(ch)}catch(e){console.error(e)}}}
  let pend=false;const fire=()=>{if(pend)return;pend=true;setTimeout(()=>{pend=false;emit()},0)};
  peers.set(me,{peer:me,by:null,isMe:true,sameTab:true,kind:"viewer",guest:false,presence:{},updatedAt:stamp()});
  function onPublish(topic,payload){
    if(!topic.startsWith(base))return;const id=topic.slice(base.length);if(id===me)return;
    if(!payload.length){if(peers.delete(id))fire();return}
    try{const o=JSON.parse(dec.decode(payload));if(Date.now()-(o.ts||0)>120000&&!peers.has(id))return;
      peers.set(id,{peer:id,by:null,isMe:false,sameTab:false,kind:"viewer",guest:false,presence:Object.freeze(o.p||{}),updatedAt:stamp(),ts:o.ts});fire()}catch(e){}
  }
  ws.onmessage=ev=>{
    const n=new Uint8Array(ev.data);const b=new Uint8Array(buf.length+n.length);b.set(buf);b.set(n,buf.length);buf=b;
    while(buf.length>=2){let mul=1,len=0,i=1,byte;do{if(i>=buf.length)return;byte=buf[i++];len+=(byte&127)*mul;mul*=128}while(byte&128);
      if(buf.length<i+len)return;const type=buf[0]>>4,body=buf.subarray(i,i+len);
      if(type===3){const tl=(body[0]<<8)|body[1];const topic=dec.decode(body.subarray(2,2+tl));const qos=(buf[0]>>1)&3;const off=2+tl+(qos?2:0);onPublish(topic,body.slice(off))}
      buf=buf.slice(i+len);
    }
  };
  ws.onclose=()=>{closed=true;const e={code:"upstream_error",message:"Connexion perdue"};for(const f of errL)try{f(e)}catch(_){}};
  const errL=[];
  ws.send(subscribePkt(1,base+"+"));
  const send=()=>{if(!closed&&ws.readyState===1)ws.send(publishPkt(mine,JSON.stringify({ts:Date.now(),p:myPres}),true))};
  const hb=setInterval(()=>{if(closed)return clearInterval(hb);try{ws.send(new Uint8Array([0xC0,0]))}catch(e){}send();
    let ch=false;for(const [id,p] of peers)if(!p.isMe&&Date.now()-p.updatedAt>75000){peers.delete(id);ch=true}if(ch)fire()},20000);
  const room={
    name,
    presence(patch){for(const k in patch){if(patch[k]===null)delete myPres[k];else myPres[k]=patch[k]}
      const self=peers.get(me);self.presence=Object.freeze(JSON.parse(JSON.stringify(myPres)));self.updatedAt=stamp();send();fire();return Promise.resolve()},
    peers(){return rebuild()},
    onPeers(fn,onErr){listeners.push(fn);if(onErr)errL.push(onErr);setTimeout(()=>{rebuild();try{fn({peers:snapshot,joined:snapshot,left:[],updated:[]})}catch(e){}},0);return()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1)}},
    connected(){return!closed&&ws.readyState===1},
    leave(){if(closed)return Promise.resolve();try{ws.send(publishPkt(mine,new Uint8Array(0),true));ws.send(new Uint8Array([0xE0,0]))}catch(e){}closed=true;clearInterval(hb);setTimeout(()=>{try{ws.close()}catch(e){}},200);return Promise.resolve()}
  };
  window.addEventListener("pagehide",()=>room.leave());
  return room;
};
})();
