export async function openMediaDB(uid:string):Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('nexus-media-'+uid,1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result);});}
export async function storeMedia(uid:string,id:string,blob:Blob){if(blob.size>100*1024**2)return;const database=await openMediaDB(uid);await new Promise<void>((resolve,reject)=>{const tx=database.transaction('files','readwrite');tx.objectStore('files').put(blob,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});database.close();}
export async function readMedia(uid:string):Promise<{id:string;blob:Blob}[]>{const database=await openMediaDB(uid);const results:{id:string;blob:Blob}[]=[];await new Promise<void>((resolve,reject)=>{const request=database.transaction('files').objectStore('files').openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return;}results.push({id:String(cursor.key),blob:cursor.value});cursor.continue();};request.onerror=()=>reject(request.error);});database.close();return results;}

/** Remove only this conversation's known downloaded media; never touch the device gallery. */
export async function removeLoadedChatMedia(uid:string,messages:{fileUrl?:string;transferId?:string}[]){
 const ids=new Set<string>();for(const message of messages){const id=message.transferId||/^\/api\/media\/([a-zA-Z0-9_-]+)$/.exec(message.fileUrl||'')?.[1];if(id){ids.add(id);ids.add('cached:'+id);}}
 if(!ids.size)return;
 const database=await openMediaDB(uid);try{await new Promise<void>((resolve,reject)=>{const tx=database.transaction('files','readwrite');for(const id of ids)tx.objectStore('files').delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{database.close();}
}
