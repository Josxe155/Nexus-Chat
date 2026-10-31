import {apiFetch} from './api';
import {auth} from '../firebase';
let cached:{servers:RTCIceServer[];until:number}|undefined;
export async function connectionServers():Promise<{servers:RTCIceServer[];warning?:string}>{
 if(cached&&cached.until>Date.now())return {servers:cached.servers};
 try{
  const token=await auth.currentUser?.getIdToken();
  const res=await apiFetch('/api/turn',{headers:token?{Authorization:'Bearer '+token}:{},signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw Error();
  const data=await res.json(),servers=data.iceServers;
  if(!Array.isArray(servers)||!servers.length||servers.length>32||servers.some((server:any)=>{const urls=Array.isArray(server.urls)?server.urls:[server.urls];return !urls.length||urls.some((url:any)=>typeof url!=='string'||!/^turns?:|^stuns?:/.test(url));})||!servers.some((server:any)=>(Array.isArray(server.urls)?server.urls:[server.urls]).some((url:string)=>/^turns?:/.test(url))))throw Error();
  cached={servers,until:Date.now()+60000};return {servers};
 }catch{throw Error('No se pudo preparar la conexión de llamada. Inténtalo de nuevo en unos momentos.');}
}
