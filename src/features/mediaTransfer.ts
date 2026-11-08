import {storeMedia} from './mediaCache';
import {apiFetch} from './api';
import {trackTransfer} from './transferUsage';
import {shouldDownload,usePreferences} from './preferences';
import {browserConnection} from './mobileSettingsModel';
import {useEffect,useState} from 'react';
import {auth} from '../firebase';
const CHUNK=1024*1024;
async function headers(extra:Record<string,string>={}){const token=await auth.currentUser?.getIdToken();if(!token)throw Error('Inicia sesión para compartir archivos.');return {Authorization:'Bearer '+token,...extra};}
async function result(response:Response){const data=await response.json();if(!response.ok)throw Error(data.error||'No se pudo completar la transferencia.');return data;}
export async function uploadMedia(file:File,context:{chatId?:string;scope?:'chat'|'status'|'community'|'profile'|'group';referenceId?:string;viewOnce?:boolean},progress?:(percent:number)=>void){
 const init=await result(await apiFetch('/api/media',{method:'POST',headers:await headers({'Content-Type':'application/json'}),body:JSON.stringify({name:file.name,size:file.size,type:file.type||'application/octet-stream',...context})}));
 try{for(let offset=0,index=0;offset<file.size;offset+=CHUNK,index++){let sent=false;for(let attempt=0;attempt<3&&!sent;attempt++){try{await result(await apiFetch(`/api/media/${init.id}/chunks/${index}`,{method:'PUT',headers:await headers({'Content-Type':'application/octet-stream'}),body:file.slice(offset,offset+CHUNK)}));sent=true;}catch(error){if(attempt===2)throw error;}}trackTransfer(auth.currentUser?.uid||'','sent',Math.min(CHUNK,file.size-offset));progress?.(Math.round(Math.min(file.size,offset+CHUNK)/file.size*100));}return await result(await apiFetch(`/api/media/${init.id}/complete`,{method:'POST',headers:await headers()}));}catch(error){apiFetch(`/api/media/${init.id}`,{method:'DELETE',headers:await headers()}).catch(()=>{});throw error;}
}
export function isPrivateMedia(url?:string){return !!url&&/^\/api\/media\/[a-f0-9-]{36}$/.test(url);}
export async function loadSingleMedia(url:string,signal:AbortSignal){
 if(!isPrivateMedia(url))throw Error('El archivo no está disponible.');
 const response=await apiFetch(url,{headers:await headers(),cache:'no-store',signal});
 if(!response.ok)throw Error('No se pudo cargar el archivo.');
 return response.blob();
}
const cache=new Map<string,string>();
const pending=new Map<string,Promise<string>>();let cacheGeneration=0;
async function resolveMedia(url:string,uid:string){
 if(!uid||auth.currentUser?.uid!==uid)throw Error('Inicia sesión de nuevo para abrir el archivo.');
 const key=uid+':'+url;if(cache.has(key))return cache.get(key)!;if(pending.has(key))return pending.get(key)!;const generation=cacheGeneration;
 const loading=(async()=>{const response=await apiFetch(url,{headers:await headers()});if(!response.ok)throw Error('El archivo no está disponible o no tienes acceso.');const blob=await response.blob();if(generation!==cacheGeneration||auth.currentUser?.uid!==uid)throw Error('La sesión cambió. Vuelve a abrir el archivo.');trackTransfer(uid,'received',blob.size);await storeMedia(uid,'cached:'+url.split('/').at(-1),blob).catch(()=>{});if(generation!==cacheGeneration||auth.currentUser?.uid!==uid)throw Error('La sesión cambió. Vuelve a abrir el archivo.');const objectURL=URL.createObjectURL(blob);cache.set(key,objectURL);window.dispatchEvent(new Event('nexus:media-resolved'));return objectURL;})();
 pending.set(key,loading);try{return await loading;}finally{if(pending.get(key)===loading)pending.delete(key);}
}
export function useMediaURLs(items:{id:string;fileUrl?:string;fileSize?:number;type?:string;voiceNote?:boolean;fileName?:string;force?:boolean}[],uid:string){
 const preferences=usePreferences(uid),[entries,setEntries]=useState<Record<string,{source:string;url:string;uid:string}>>({});
 useEffect(()=>{const clear=()=>setEntries({});window.addEventListener('nexus:cache-cleared',clear);return()=>window.removeEventListener('nexus:cache-cleared',clear);},[]);
 const [networkRevision,setNetworkRevision]=useState(0);
 useEffect(()=>{const connection=browserConnection(),refresh=()=>setNetworkRevision(value=>value+1);connection?.addEventListener?.('change',refresh);return()=>connection?.removeEventListener?.('change',refresh);},[]);
 const revision=JSON.stringify(items.map(item=>[item.id,item.fileUrl,item.force,item.type,item.voiceNote,item.fileSize]));
 useEffect(()=>{let alive=true;for(const item of items)if(shouldDownload(item,uid)&&isPrivateMedia(item.fileUrl)&&(item.fileSize||0)<=100*1024**2)resolveMedia(item.fileUrl!,uid).then(url=>{if(alive)setEntries(previous=>({...previous,[item.id]:{source:item.fileUrl!,url,uid}}));}).catch(()=>{});return()=>{alive=false;};},[revision,uid,JSON.stringify(preferences.chat.downloads),JSON.stringify(preferences.chat.networkDownloads),networkRevision]);
 return Object.fromEntries(items.filter(item=>entries[item.id]?.source===item.fileUrl&&entries[item.id]?.uid===uid).map(item=>[item.id,entries[item.id].url]));
}
export function safeDownloadURL(value:string){try{const url=new URL(value,location.origin);if(url.protocol==='https:'||url.protocol==='http:'&&url.origin===location.origin||url.protocol==='blob:'&&url.origin===location.origin)return url.href;}catch{}throw Error('La dirección del archivo no es válida.');}
export async function downloadMedia(url:string,name:string,size=0){if(!isPrivateMedia(url)){const target=safeDownloadURL(url),anchor=document.createElement('a');anchor.href=target;anchor.download=name;anchor.rel='noopener noreferrer';if(new URL(target).origin!==location.origin)anchor.target='_blank';document.body.append(anchor);anchor.click();anchor.remove();return;}const picker=(window as any).showSaveFilePicker;let handle:any;if(picker)handle=await picker({suggestedName:name});else if(size>100*1024**2)throw Error('Para descargar más de 100 MB usa un navegador que permita guardar directamente en disco.');const response=await apiFetch(url,{headers:await headers()});if(!response.ok||!response.body)throw Error('No se pudo descargar el archivo.');if(handle){const writer=await handle.createWritable();try{let received=0;const stream=response.body.pipeThrough(new TransformStream({transform(chunk,controller){received+=chunk.byteLength;controller.enqueue(chunk);}}));await stream.pipeTo(writer);trackTransfer(auth.currentUser?.uid||'','received',received);}catch(error){await writer.abort();throw error;}}else{const blob=await response.blob();trackTransfer(auth.currentUser?.uid||'','received',blob.size);const objectURL=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=objectURL;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(objectURL),60000);}}
export function clearMediaURLs(){cacheGeneration++;pending.clear();for(const url of cache.values())URL.revokeObjectURL(url);cache.clear();window.dispatchEvent(new Event('nexus:cache-cleared'));}
export async function queueMediaDeletion(url?:string){if(!isPrivateMedia(url)||!auth.currentUser)return;const key='nexus-pending-media-delete-'+auth.currentUser.uid;let pending:string[];try{pending=JSON.parse(localStorage.getItem(key)||'[]');}catch{pending=[];}localStorage.setItem(key,JSON.stringify([...new Set([...pending,url!])]));await flushMediaDeletions();}
export async function flushMediaDeletions(){if(!auth.currentUser)return;const key='nexus-pending-media-delete-'+auth.currentUser.uid;let pending:string[];try{pending=JSON.parse(localStorage.getItem(key)||'[]');}catch{return;}const completed=new Set<string>();for(const url of pending){if(!isPrivateMedia(url)){completed.add(url);continue;}try{const response=await apiFetch(url,{method:'DELETE',headers:await headers(),signal:AbortSignal.timeout(15000)});if(response.ok||response.status===404)completed.add(url);}catch{}}const latest:string[]=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify(latest.filter(url=>!completed.has(url))));}

export function cachedMediaURL(url:string,uid=auth.currentUser?.uid||''){return cache.get(uid+':'+url);}
export async function previewMedia(url:string,uid:string){const result=await resolveMedia(url,uid);window.dispatchEvent(new Event('nexus:media-resolved'));return result;}
