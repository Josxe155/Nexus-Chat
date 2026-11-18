export async function openMediaDB(uid:string):Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  let settled=false;const request=indexedDB.open('nexus-media-'+uid,1);
  const fail=()=>{if(settled)return;settled=true;clearTimeout(timer);reject(Error('No se pudo abrir el almacenamiento de archivos en este navegador.'));};
  const timer=setTimeout(fail,10000);
  request.onupgradeneeded=()=>request.result.createObjectStore('files');
  request.onerror=fail;request.onblocked=fail;
  request.onsuccess=()=>{if(settled){request.result.close();return;}settled=true;clearTimeout(timer);resolve(request.result);};
 });
}
export async function storeMedia(uid:string,id:string,blob:Blob){
 if(blob.size>100*1024**2)return;const database=await openMediaDB(uid);
 try{await new Promise<void>((resolve,reject)=>{const tx=database.transaction('files','readwrite');tx.oncomplete=()=>resolve();const fail=()=>reject(Error('No se pudo guardar la copia local del archivo.'));tx.onerror=fail;tx.onabort=fail;tx.objectStore('files').put(blob,id);});}
 finally{database.close();}
}
export async function readMedia(uid:string):Promise<{id:string;blob:Blob}[]>{
 const database=await openMediaDB(uid),results:{id:string;blob:Blob}[]=[];
 try{await new Promise<void>((resolve,reject)=>{
  const tx=database.transaction('files'),request=tx.objectStore('files').openCursor(),fail=()=>reject(Error('No se pudieron consultar los archivos locales.'));
  tx.oncomplete=()=>resolve();tx.onerror=fail;tx.onabort=fail;request.onerror=fail;
  request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(cursor.value instanceof Blob)results.push({id:String(cursor.key),blob:cursor.value});cursor.continue();};
 });return results;}finally{database.close();}
}

/** Remove only this conversation's known downloaded media; never touch the device gallery. */
export async function removeLoadedChatMedia(uid:string,messages:{fileUrl?:string;transferId?:string}[]){
 const ids=new Set<string>();for(const message of messages){const id=message.transferId||/^\/api\/media\/([a-zA-Z0-9_-]+)$/.exec(message.fileUrl||'')?.[1];if(id){ids.add(id);ids.add('cached:'+id);}}
 if(!ids.size)return;
 const database=await openMediaDB(uid);try{await new Promise<void>((resolve,reject)=>{const tx=database.transaction('files','readwrite');for(const id of ids)tx.objectStore('files').delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{database.close();}
}
