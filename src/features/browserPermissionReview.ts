export type ReviewedPermissionState='granted'|'denied'|'unavailable'|'waiting';
export const browserPermissionIds=['microphone','camera','notifications','location'] as const;
export function reviewBrowserPermissions(update:(key:string,state:ReviewedPermissionState)=>void,signal:AbortSignal,timeoutMs=12000){
 return new Promise<{timedOut:boolean;cancelled:boolean}>(resolve=>{
  const remaining=new Set<string>(browserPermissionIds);let active=true;let timer:ReturnType<typeof setTimeout>|undefined;
  const finish=(timedOut=false,cancelled=false)=>{if(!active)return;active=false;clearTimeout(timer);signal.removeEventListener('abort',cancel);if(timedOut)for(const key of remaining)update(key,'waiting');resolve({timedOut,cancelled});};
  const cancel=()=>finish(false,true);
  const publish=(key:string,state:ReviewedPermissionState)=>{if(!active)return;remaining.delete(key);update(key,state);if(!remaining.size)finish();};
  if(signal.aborted){finish(false,true);return;}
  signal.addEventListener('abort',cancel,{once:true});timer=setTimeout(()=>finish(true),timeoutMs);
  const capture=async(kind:'audio'|'video',key:string)=>{
   if(!navigator.mediaDevices?.getUserMedia){publish(key,'unavailable');return;}
   try{const stream=await navigator.mediaDevices.getUserMedia({audio:kind==='audio',video:kind==='video'});stream.getTracks().forEach(track=>track.stop());publish(key,'granted');}catch(error){publish(key,error?.name==='NotAllowedError'||error?.name==='SecurityError'?'denied':'unavailable');}
  };
  void capture('audio','microphone');void capture('video','camera');
  if(typeof Notification==='undefined')publish('notifications','unavailable');
  else try{void Promise.resolve(Notification.requestPermission()).then(value=>publish('notifications',value==='granted'?'granted':value==='denied'?'denied':'waiting'),()=>publish('notifications','denied'));}catch{publish('notifications','denied');}
  if(!navigator.geolocation)publish('location','unavailable');
  else try{navigator.geolocation.getCurrentPosition(()=>publish('location','granted'),error=>publish('location',error?.code===1?'denied':error?.code===3?'waiting':'unavailable'),{timeout:10000,maximumAge:60000});}catch{publish('location','unavailable');}
 });
}
