let cleanup:Promise<void>|undefined;
/** Retire only generated voice assets; never delete conversations or user storage. */
export function retireKokoroStorage(){
 return cleanup??=(async()=>{
  if(typeof caches!=='undefined'){
   await caches.delete('kokoro-voices').catch(()=>false);
   if(await caches.has('transformers-cache').catch(()=>false)){
    const cache=await caches.open('transformers-cache');
    for(const request of await cache.keys()){
     if(/^https:\/\/huggingface\.co\/onnx-community\/Kokoro-82M(?:-v1\.0-ONNX)?\//i.test(request.url))await cache.delete(request);
    }
   }
  }
  if(typeof indexedDB!=='undefined'&&typeof indexedDB.databases==='function'){
   for(const db of await indexedDB.databases()){
    if(db.name?.startsWith('nexus-kokoro-download-'))await new Promise<void>(resolve=>{
     const request=indexedDB.deleteDatabase(db.name!);request.onsuccess=request.onerror=request.onblocked=()=>resolve();
    });
   }
  }
 })().catch(()=>{});
}
