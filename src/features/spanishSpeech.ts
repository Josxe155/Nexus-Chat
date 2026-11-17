import {googleSpeechChunks,googleSpeechURL} from './googleSpeech';
import {retireKokoroStorage} from './retireKokoro';
let stopCurrent:(()=>void)|undefined;
const lifecycle=new WeakSet<object>();
export function releaseSpanishVoice(){stopCurrent?.();}

/** HTMLAudio can play the remote MP3 without a cross-origin fetch or local model. */
export function playSpanish(text:string,onState:(state:'preparing'|'playing'|'idle')=>void,onError:()=>void){
 stopCurrent?.();
 const chunks=googleSpeechChunks(text);
 let audio:HTMLAudioElement|undefined,stopped=false,index=0;
 let timeout:ReturnType<typeof setTimeout>|undefined;
 const stop=()=>{
  if(stopped)return;stopped=true;clearTimeout(timeout);
  if(stopCurrent===stop)stopCurrent=undefined;
  if(audio){audio.onplaying=audio.onended=audio.onerror=audio.onwaiting=audio.onstalled=null;audio.pause();audio.removeAttribute('src');audio.load();}
  onState('idle');
 };
 const fail=()=>{if(stopped)return;stop();onError();};
 const waiting=()=>{if(stopped)return;onState('preparing');if(!timeout)timeout=setTimeout(fail,20000);};
 const next=()=>{
  if(stopped)return;
  if(index>=chunks.length){stop();return;}
  waiting();
  try{audio!.src=googleSpeechURL(chunks[index++]);void audio!.play().catch(fail);}catch{fail();}
 };
 if(!chunks.length){queueMicrotask(stop);return stop;}
 stopCurrent=stop;
 if(!lifecycle.has(window)){lifecycle.add(window);window.addEventListener('pagehide',releaseSpanishVoice);window.addEventListener('nexus:stop-assistant-speech',releaseSpanishVoice);}
 void retireKokoroStorage();
 try{
  audio=new Audio();audio.preload='auto';
  audio.onplaying=()=>{if(stopped)return;clearTimeout(timeout);timeout=undefined;onState('playing');};
  audio.onended=next;audio.onerror=fail;audio.onwaiting=waiting;audio.onstalled=waiting;
  next();
 }catch{queueMicrotask(fail);}
 return stop;
}
