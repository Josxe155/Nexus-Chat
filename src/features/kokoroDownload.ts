import {downloadVoice,type DownloadInfo,type VoiceDownloadStore,type DownloadProgress} from './resumableVoice';
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
async function assetStore(){try{return typeof caches==='undefined'?undefined:await caches.open('transformers-cache');}catch{return undefined;}}
let pending:Promise<Response|undefined>|undefined;
export function prepareKokoroDownload(onProgress:(percent:number,bytes?:DownloadProgress)=>void):Promise<Response|undefined>{
 if(pending)return pending;
 const load=async()=>{
  const cache=await assetStore();
  const cached=await cache?.match(cacheURL);
  if(cached){const blob=await cached.blob();if(blob.size===size)return new Response(blob,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(size)}});await cache?.delete(cacheURL);}
  if(typeof indexedDB==='undefined')return;
  const {store,close}=await openStore();
  try{const existing=await store.info(),report=existing?.bytes===size?()=>{}:onProgress;const blob=await downloadVoice(sourceURL,size,store,report);
   // The completed blocks remain canonical. The SDK consumes this response directly;
   // it must not start another fetch or discard a verified download after cache eviction.
   return new Response(blob,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(size)}});
  }finally{close();}
 };
 pending=(navigator.locks?navigator.locks.request('nexus-kokoro-model-download',load):load()).catch(error=>{pending=undefined;throw error;});
 return pending;
}
export async function kokoroAssetCache(model:Response|undefined){
 const cache=await assetStore();
 return {releaseModel:()=>{model=undefined;pending=undefined;},match:async(key:string|Request)=>{const url=typeof key==='string'?key:key.url;if(url===cacheURL&&model)return model.clone();return cache?.match(key);},put:async(key:string|Request,response:Response)=>{const url=typeof key==='string'?key:key.url;if(url!==cacheURL)await cache?.put(key,response);}};
}
