import {spanishSpeechChunks} from './speechChunks';

export function playSpanish(text:string,onState:(state:'preparing'|'playing'|'idle')=>void,onError:()=>void){
 const chunks=spanishSpeechChunks(text);
 let context:AudioContext|undefined,worker:Worker|undefined,stopped=false,index=0,busy=false,retries=0,nextStart=0;
 let timeout:ReturnType<typeof setTimeout>|undefined;
 const sources=new Set<AudioBufferSourceNode>();
 const resume=()=>{if(!stopped&&context&&context.state!=='closed')void context.resume().catch(()=>{});};
 const stop=()=>{
  if(stopped)return;stopped=true;clearTimeout(timeout);worker?.terminate();
  document.removeEventListener('visibilitychange',resume);window.removeEventListener('pointerdown',resume);
  for(const source of sources){source.onended=null;try{source.stop();}catch{/* already ended */}source.disconnect();}sources.clear();
  void context?.close().catch(()=>{});onState('idle');
 };
 const fail=()=>{if(stopped)return;stop();onError();};
 if(!chunks.length){queueMicrotask(stop);return stop;}
 const pump=()=>{
  if(stopped||busy||sources.size>=2)return;
  if(index>=chunks.length){if(!sources.size)stop();return;}
  if(!sources.size)onState('preparing');
  busy=true;clearTimeout(timeout);timeout=setTimeout(retry,30000);
  worker!.postMessage(chunks[index]);
 };
 const retry=()=>{
  if(stopped)return;clearTimeout(timeout);
  if(retries++>=1){fail();return;}
  worker?.terminate();busy=false;
  try{createWorker();pump();}catch{fail();}
 };
 const createWorker=()=>{
  const generator=new Worker(new URL('../dashboard/reportVoice.worker.ts',import.meta.url),{type:'module'});worker=generator;
  generator.onerror=event=>{event.preventDefault();if(worker===generator)retry();};
  generator.onmessage=async(event:MessageEvent<ArrayBuffer|null>)=>{
   if(stopped||worker!==generator)return;
   clearTimeout(timeout);
   if(!event.data){retry();return;}
   try{
    const audio=context!;const buffer=await audio.decodeAudioData(event.data);
    if(stopped||worker!==generator)return;
    await audio.resume();if(stopped||worker!==generator)return;
    const source=audio.createBufferSource();source.buffer=buffer;source.connect(audio.destination);sources.add(source);
    source.onended=()=>{source.disconnect();sources.delete(source);if(!stopped)pump();};
    // Prepare one job ahead and schedule it against the audio clock to avoid gaps.
    const start=Math.max(audio.currentTime+0.025,nextStart);source.start(start);nextStart=start+buffer.duration;
    index++;busy=false;retries=0;onState('playing');pump();
   }catch{retry();}
  };
 };
 onState('preparing');
 try{
  context=new AudioContext();createWorker();
  document.addEventListener('visibilitychange',resume);window.addEventListener('pointerdown',resume);
  void context.resume().then(pump).catch(fail);
 }catch{queueMicrotask(fail);}
 return stop;
}
