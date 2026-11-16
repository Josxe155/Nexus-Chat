export type DownloadInfo={bytes:number;chunks:number};
export type VoiceDownloadStore={info:()=>Promise<DownloadInfo|undefined>;reset:()=>Promise<void>;append:(index:number,data:ArrayBuffer,info:DownloadInfo)=>Promise<void>;parts:()=>Promise<ArrayBuffer[]>};
/** Persist complete blocks before reporting progress; a terminated worker retains committed blocks. */
export async function downloadVoice(url:string,size:number,store:VoiceDownloadStore,onProgress:(percent:number)=>void,fetcher:typeof fetch=fetch){
 let info=await store.info()||{bytes:0,chunks:0};
 if(!Number.isSafeInteger(info.bytes)||info.bytes<0||info.bytes>size||!Number.isSafeInteger(info.chunks)||info.chunks<0){await store.reset();info={bytes:0,chunks:0};}
 onProgress(Math.floor(info.bytes/size*100));
 if(info.bytes<size){
  const response=await fetcher(url,{headers:info.bytes?{Range:'bytes='+info.bytes+'-'}:{}});
  if(!response.ok||!response.body)throw Error('No se pudo continuar la descarga de voz.');
  if(info.bytes&&response.status===200){await store.reset();info={bytes:0,chunks:0};}
  if(response.status!==200&&response.status!==206)throw Error('La descarga de voz no es válida.');
  const range=response.headers.get('content-range');
  if(range){const match=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(range);if(!match||Number(match[1])!==info.bytes||Number(match[3])!==size||Number(match[2])!==size-1)throw Error('El rango de voz recibido no coincide.');}
  const length=response.headers.get('content-length');if(length!==null&&Number(length)!==size-info.bytes)throw Error('El tamaño de descarga no coincide.');
  const reader=response.body.getReader();let pending:Uint8Array[]=[],pendingBytes=0;
  const save=async()=>{if(!pendingBytes)return;const data=new Uint8Array(pendingBytes);let position=0;for(const part of pending){data.set(part,position);position+=part.length;}const next={bytes:info.bytes+pendingBytes,chunks:info.chunks+1};await store.append(info.chunks,data.buffer,next);info=next;pending=[];pendingBytes=0;onProgress(Math.floor(info.bytes/size*100));};
  try{for(;;){const result=await reader.read();if(result.done)break;if(info.bytes+pendingBytes+result.value.length>size){pending=[];pendingBytes=0;await store.reset();throw Error('El archivo de voz supera su tamaño esperado.');}pending.push(result.value);pendingBytes+=result.value.length;if(pendingBytes>=1048576)await save();}await save();}
  catch(error){await save();throw error;}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  if(info.bytes!==size)throw Error('La descarga se interrumpió. El avance está guardado.');
 }
 const parts=await store.parts(),blob=new Blob(parts);if(parts.length!==info.chunks||blob.size!==size){await store.reset();throw Error('No se pudo verificar la descarga guardada.');}
 return blob;
}
