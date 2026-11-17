export type BackgroundNotice={title:string;body:string;path?:string;tag?:string;category?:string;requireInteraction?:boolean;expiresAt?:number};
let registration:Promise<ServiceWorkerRegistration>|undefined;
export function backgroundRegistration(){
 if(!isSecureContext||!('serviceWorker'in navigator))return Promise.reject(Error('background-unavailable'));
 return registration??=navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(error=>{registration=undefined;throw error;});
}
async function workerMessage(type:string,payload?:unknown){
 const registered=await backgroundRegistration();
 const candidate=registered.installing||registered.waiting||registered.active;
 if(!candidate)throw Error('background-unavailable');
 const active=await new Promise<ServiceWorker>((resolve,reject)=>{
  let timer:ReturnType<typeof setTimeout>;
  const finish=(error?:Error)=>{clearTimeout(timer);candidate.removeEventListener('statechange',changed);error?reject(error):resolve(candidate);};
  const changed=()=>{if(candidate.state==='activated')finish();else if(candidate.state==='redundant')finish(Error('background-unavailable'));};
  timer=setTimeout(()=>finish(Error('background-timeout')),4000);candidate.addEventListener('statechange',changed);changed();
 });
 return new Promise<boolean>((resolve,reject)=>{
  const channel=new MessageChannel();let settled=false;
  const finish=(error?:Error,value=false)=>{if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();channel.port2.close();error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(Error('background-timeout')),4000);
  channel.port1.onmessage=event=>event.data?.ok?finish(undefined,true):finish(Error('background-notice-failed'));
  try{active.postMessage({type,payload},[channel.port2]);}catch{finish(Error('background-unavailable'));}
 });
}
export async function showBackgroundNotice(notice:BackgroundNotice){await workerMessage('NEXUS_NOTIFY',notice);}
export async function closeBackgroundNotice(tag:string){await workerMessage('NEXUS_CLOSE_NOTICE',{tag});}
export async function clearBackgroundNotices(){await workerMessage('NEXUS_CLEAR_NOTICES');}
