export function playSpanish(text:string,onState:(state:'preparing'|'playing'|'idle')=>void,onError:()=>void){
 const clean=text.replace(/https?:\/\/\S+/g,'enlace').replace(/[\p{Extended_Pictographic}#*`_]/gu,'').replace(/\s+/g,' ').trim();
 const chunks=clean.match(/.{1,1000}(?:\s|$)|.{1,1000}/g)?.map(value=>value.trim()).filter(Boolean)||[];
 let context:AudioContext|undefined,worker:Worker|undefined,stopped=false,index=0;
 const stop=()=>{if(stopped)return;stopped=true;worker?.terminate();void context?.close().catch(()=>{});onState('idle');};
 const fail=()=>{if(stopped)return;stop();onError();};
 if(!chunks.length)return stop;
 onState('preparing');
 try{
  context=new AudioContext();const audio=context;
  worker=new Worker(new URL('../dashboard/reportVoice.worker.ts',import.meta.url),{type:'module'});
  const generator=worker;generator.onerror=fail;
  generator.onmessage=async(event:MessageEvent<ArrayBuffer|null>)=>{
   if(stopped)return;if(!event.data){fail();return;}
   try{
    const buffer=await audio.decodeAudioData(event.data);if(stopped)return;
    const source=audio.createBufferSource();source.buffer=buffer;source.connect(audio.destination);
    source.onended=()=>{if(stopped)return;if(index<chunks.length){onState('preparing');generator.postMessage(chunks[index++]);}else stop();};
    source.start();onState('playing');
   }catch{fail();}
  };
  void audio.resume().then(()=>{if(!stopped)generator.postMessage(chunks[index++]);}).catch(fail);
 }catch{queueMicrotask(fail);}
 return stop;
}
