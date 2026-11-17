import {downloadVoice,type DownloadInfo,type VoiceDownloadStore,type DownloadProgress,byteProgress} from './resumableVoice';
import {KOKORO_MODEL} from './kokoroSpanish';
// Immutable official revision: never combine ranges from different model versions.
const revision='1939ad2a8e416c0acfeecc08a694d14ef25f2231',size=92361116;
const cacheURL='https://huggingface.co/'+KOKORO_MODEL+'/resolve/main/onnx/model_quantized.onnx';
const sourceURL=cacheURL.replace('/resolve/main/','/resolve/'+revision+'/');
async function openStore(){
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('nexus-kokoro-download-'+revision,1);request.onupgradeneeded=()=>{request.result.createObjectStore('meta');request.result.createObjectStore('chunks');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 const read=<T>(store:string,all=false)=>new Promise<T>((resolve,reject)=>{const tx=db.transaction(store),request=all?tx.objectStore(store).getAll():tx.objectStore(store).get('download');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 const write=(operation:(tx:IDBTransaction)=>void)=>new Promise<void>((resolve,reject)=>{const tx=db.transaction(['meta','chunks'],'readwrite');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Descarga cancelada'));operation(tx);});
 const store:VoiceDownloadStore={info:()=>read<DownloadInfo|undefined>('meta'),parts:()=>read<ArrayBuffer[]>('chunks',true),reset:()=>write(tx=>{tx.objectStore('meta').clear();tx.objectStore('chunks').clear();}),append:(index,data,info)=>write(tx=>{tx.objectStore('chunks').put(data,index);tx.objectStore('meta').put(info,'download');})};
 return {store,close:()=>db.close()};
}
export async function prepareKokoroDownload(onProgress:(percent:number,bytes?:DownloadProgress)=>void){
 // Missing storage/locking APIs retain the SDK's complete-file download behavior.
 if(typeof caches==='undefined'||typeof indexedDB==='undefined'||!navigator.locks)return;
 await navigator.locks.request('nexus-kokoro-model-download',async()=>{
  const cache=await caches.open('transformers-cache');if(await cache.match(cacheURL)){onProgress(100,byteProgress(size,size));return;}
  const {store,close}=await openStore();
  try{const blob=await downloadVoice(sourceURL,size,store,onProgress);await cache.put(cacheURL,new Response(blob,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(size)}}));await store.reset();}
  finally{close();}
 });
}
