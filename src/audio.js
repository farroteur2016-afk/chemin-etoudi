/* Voix (synthèse vocale du navigateur) et ambiances sonores générées (Web Audio). */
(function(){
"use strict";
const A={voiceOn:true,ambOn:true,auto:true,speaking:false};
window.Audio2=A;
const synth=window.speechSynthesis||null;
let voices=[],ctx=null,master=null,ambNodes=[],ambType=null,queue=[],onEnd=null;

function loadVoices(){if(!synth)return;voices=synth.getVoices().filter(v=>/^fr/i.test(v.lang))}
if(synth){loadVoices();synth.onvoiceschanged=loadVoices}
A.hasVoice=()=>!!synth;
function voiceFor(kind){
  if(!voices.length)loadVoices();
  if(!voices.length)return null;
  const male=/thomas|paul|henri|nicolas|daniel|mathieu|male|homme|guillaume|antoine|jacques/i,female=/amelie|amélie|audrey|marie|julie|virginie|hortense|female|femme|aurelie|céline|celine|denise|sylvie|claire/i;
  const pref=voices.filter(v=>/fr[-_]FR/i.test(v.lang));
  const list=pref.length?pref:voices;
  if(kind==="f"){return list.find(v=>female.test(v.name))||list[1%list.length]}
  return list.find(v=>male.test(v.name))||list[0];
}
function chunks(text){
  const parts=text.replace(/\s+/g," ").match(/[^.!?;:]+[.!?;:]*/g)||[text];
  const out=[];let cur="";for(const p of parts){if((cur+p).length>180&&cur){out.push(cur);cur=p}else cur+=p}if(cur.trim())out.push(cur);return out;
}
/* speak(text, {voix:"m"|"f", rate, pitch, onend}) */
A.speak=function(text,o){
  o=o||{};A.stop();
  if(!synth||!A.voiceOn){if(o.onend)o.onend();return false}
  const v=voiceFor(o.voix);
  const list=chunks(text);A.speaking=true;
  list.forEach((c,i)=>{const u=new SpeechSynthesisUtterance(c);u.lang="fr-FR";if(v)u.voice=v;u.rate=o.rate||1;u.pitch=o.pitch||1;
    if(i===list.length-1)u.onend=()=>{A.speaking=false;if(A.onchange)A.onchange();if(o.onend)o.onend()};
    u.onerror=()=>{A.speaking=false;if(A.onchange)A.onchange()};synth.speak(u)});
  if(A.onchange)A.onchange();
  // certains navigateurs mobiles mettent la voix en pause après ~15 s
  clearInterval(A._keep);A._keep=setInterval(()=>{if(!synth.speaking){clearInterval(A._keep);return}synth.pause();synth.resume()},10000);
  return true;
};
A.stop=function(){if(synth){synth.cancel()}A.speaking=false;clearInterval(A._keep);if(A.onchange)A.onchange()};

/* ---------- Web Audio ---------- */
function ensure(){
  if(ctx)return ctx;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  ctx=new C();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);return ctx;
}
A.unlock=function(){const c=ensure();if(c&&c.state==="suspended")c.resume()};
function noiseBuf(){const len=ctx.sampleRate*2,b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=w*.6+last*3}return b}
function noiseSrc(){const s=ctx.createBufferSource();s.buffer=noiseBuf();s.loop=true;return s}
function track(n){ambNodes.push(n);return n}
function stopAmb(){for(const n of ambNodes){try{n.stop&&n.stop()}catch(e){}try{n.disconnect()}catch(e){}}ambNodes=[];clearInterval(A._amb);clearTimeout(A._amb2)}
function lfo(param,rate,depth,base){const o=track(ctx.createOscillator()),g=track(ctx.createGain());o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(param);param.value=base;o.start()}
function bed(type,freq,q,gain){const s=track(noiseSrc()),f=track(ctx.createBiquadFilter()),g=track(ctx.createGain());f.type=type;f.frequency.value=freq;f.Q.value=q||.7;g.gain.value=gain;s.connect(f);f.connect(g);g.connect(master);s.start();return{f,g}}
function chirp(){const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();const f0=2000+Math.random()*2500;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*(Math.random()<.5?1.5:.6),t+.12);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(master);o.start(t);o.stop(t+.2)}
function drum(t,f,v){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.45,t+.18);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(master);o.start(t);o.stop(t+.4)}
function horn(){const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=380+Math.random()*120;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.02);g.gain.setValueAtTime(.025,t+.25);g.gain.linearRampToValueAtTime(0,t+.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+.32)}
function cheer(){const s=noiseSrc(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;f.type="bandpass";f.frequency.value=1400;f.Q.value=.6;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.4);g.gain.linearRampToValueAtTime(0,t+2.4);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+2.5)}

/* type : foule | meeting | marche | foret | vent | mer | ville | conseil | null */
A.ambient=function(type){
  if(type===ambType)return;ambType=type;
  if(!ensure())return;stopAmb();if(!type||!A.ambOn)return;
  if(ctx.state==="suspended")ctx.resume();
  if(type==="meeting"||type==="foule"){const c=bed("bandpass",700,.5,.18);lfo(c.g.gain,.25,.06,.18);
    let beat=0;A._amb=setInterval(()=>{const t=ctx.currentTime;const pat=[1,0,.6,0,1,.6,0,.6];for(let i=0;i<8;i++)if(pat[i])drum(t+i*.16,i%4===0?110:170,.28*pat[i]);beat++;if(beat%4===0&&Math.random()<.6)cheer()},1300)}
  else if(type==="marche"){const c=bed("bandpass",900,.4,.16);lfo(c.g.gain,.4,.05,.16);bed("lowpass",200,.7,.08);A._amb=setInterval(()=>{if(Math.random()<.35)horn()},1500)}
  else if(type==="foret"){bed("highpass",5500,.7,.03);A._amb=setInterval(()=>{if(Math.random()<.7)chirp();if(Math.random()<.3)setTimeout(chirp,120)},700)}
  else if(type==="vent"){const c=bed("lowpass",500,1,.22);lfo(c.f.frequency,.08,260,500);lfo(c.g.gain,.05,.1,.2)}
  else if(type==="mer"){const c=bed("lowpass",700,.7,.25);lfo(c.g.gain,.12,.18,.2);A._amb=setInterval(()=>{if(Math.random()<.3)chirp()},2500)}
  else if(type==="ville"){bed("lowpass",180,.7,.2);const c=bed("bandpass",1200,.5,.05);lfo(c.g.gain,.3,.03,.05);A._amb=setInterval(()=>{if(Math.random()<.45)horn()},1800)}
  else if(type==="conseil"){bed("lowpass",300,.7,.05);A._amb=setInterval(()=>{},10000)}
};
A.setAmb=function(on){A.ambOn=on;const t=ambType;ambType=null;if(on)A.ambient(t);else stopAmb();ambType=t};
A.fanfare=function(){if(!ensure())return;const t=ctx.currentTime;[523,659,784,1046].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.18);g.gain.linearRampToValueAtTime(.12,t+i*.18+.03);g.gain.exponentialRampToValueAtTime(.001,t+i*.18+.6);o.connect(g);g.connect(master);o.start(t+i*.18);o.stop(t+i*.18+.7)});cheer()};
A.click=function(){if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);o.connect(g);g.connect(master);o.start(t);o.stop(t+.1)};
})();
