import type {DownloadProgress} from './resumableVoice';
import {spanishSpeechChunks} from './speechChunks';
let idleWorker:Worker|undefined,idleTimeout:ReturnType<typeof setTimeout>|undefined;
let stopCurrent:(()=>void)|undefined;

export function playSpanish(text:string,onState:(state:'preparing'|'playing'|'idle')=>void,onError:()=>void,onProgress?:(percent:number|undefined)=>void,onBytes?:(bytes:DownloadProgress|undefined)=>void){
 stopCurrent?.();
 const chunks=spanishSpeechChunks(text);
 let context:AudioContext|undefined,worker:Worker|undefined,stopped=false,index=0,busy=false,retries=0,nextStart=0;
 let timeout:ReturnType<typeof setTimeout>|undefined,firstAudioDeadline:ReturnType<typeof setTimeout>|undefined;
 const sources=new Set<AudioBufferSourceNode>();
 const resume=()=>{if(!stopped&&context&&context.state!=='closed')void context.resume().catch(()=>{});};
 const stop=(keepModel=false)=>{
  if(stopped){if(!keepModel&&idleWorker===worker){idleWorker?.terminate();idleWorker=undefined;clearTimeout(idleTimeout);}return;}stopped=true;clearTimeout(timeout);clearTimeout(firstAudioDeadline);
  if(stopCurrent===stop)stopCurrent=undefined;
  if(keepModel&&worker&&!busy){const parked=worker;idleWorker?.terminate();clearTimeout(idleTimeout);idleWorker=parked;parked.onmessage=null;parked.onerror=()=>{if(idleWorker===parked){parked.terminate();idleWorker=undefined;}};idleTimeout=setTimeout(()=>{if(idleWorker===parked){parked.terminate();idleWorker=undefined;}},60000);}
  else worker?.terminate();
  document.removeEventListener('visibilitychange',resume);window.removeEventListener('pointerdown',resume);
  for(const source of sources){source.onended=null;try{source.stop();}catch{/* already ended */}source.disconnect();}sources.clear();
  void context?.close().catch(()=>{});onState('idle');
 };
 const fail=()=>{if(stopped)return;stop();onError();};
 if(!chunks.length){queueMicrotask(stop);return stop;}
 const pump=()=>{
  if(stopped||busy||sources.size>=2)return;
  if(index>=chunks.length){if(!sources.size)stop(true);return;}
  if(!sources.size)onState('preparing');
  busy=true;clearTimeout(timeout);timeout=setTimeout(retry,180000);
  worker!.postMessage(chunks[index]);
 };
 const retry=()=>{
  if(stopped)return;clearTimeout(timeout);
  if(retries++>=1){fail();return;}
  worker?.terminate();busy=false;
  try{createWorker();pump();}catch{fail();}
 };
 const createWorker=()=>{
  const generator=idleWorker??new Worker(new URL('../dashboard/reportVoice.worker.ts',import.meta.url),{type:'module'});idleWorker=undefined;clearTimeout(idleTimeout);worker=generator;
  generator.onerror=event=>{event.preventDefault();if(worker===generator)retry();};
  generator.onmessage=async(event:MessageEvent<ArrayBuffer|null|{type:'progress';percent?:number;bytes?:DownloadProgress}>)=>{
   if(stopped||worker!==generator)return;
   const wav=event.data;
   if(!wav){retry();return;}
   if(!(wav instanceof ArrayBuffer)){onProgress?.(wav.percent);onBytes?.(wav.bytes);clearTimeout(timeout);timeout=setTimeout(retry,180000);return;}
   clearTimeout(timeout);
   try{
    const audio=context!;const buffer=await audio.decodeAudioData(wav);
    if(stopped||worker!==generator)return;
    await audio.resume();if(stopped||worker!==generator)return;
    const source=audio.createBufferSource();source.buffer=buffer;source.connect(audio.destination);sources.add(source);
    source.onended=()=>{source.disconnect();sources.delete(source);if(!stopped)pump();};
    // Prepare one job ahead and schedule it against the audio clock to avoid gaps.
    const start=Math.max(audio.currentTime+0.025,nextStart);source.start(start);clearTimeout(firstAudioDeadline);nextStart=start+buffer.duration;
    index++;busy=false;retries=0;onState('playing');pump();
   }catch{retry();}
  };
 };
 stopCurrent=stop;onState('preparing');
 // A fixed ceiling cannot be extended by progress events or an automatic retry.
 firstAudioDeadline=setTimeout(fail,120000);
 try{
  context=new AudioContext();createWorker();
  document.addEventListener('visibilitychange',resume);window.addEventListener('pointerdown',resume);
  void context.resume().then(pump).catch(fail);
 }catch{queueMicrotask(fail);}
 return stop;
}
