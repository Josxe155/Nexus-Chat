export const callReconnectGrace=18000;

export function attachCallRecovery(pc:RTCPeerConnection,restart:()=>Promise<void>,active:()=>boolean){
 let timer:ReturnType<typeof setTimeout>|undefined,attempts=0,closed=false,running=false;
 const healthy=()=>pc.connectionState==='connected'&&!['failed','disconnected'].includes(pc.iceConnectionState);
 const interrupted=()=>['failed','disconnected'].includes(pc.connectionState)||['failed','disconnected'].includes(pc.iceConnectionState);
 const clear=()=>{clearTimeout(timer);timer=undefined;};
 const schedule=()=>{
  if(closed||!active()||timer||running||!navigator.onLine||pc.connectionState==='closed'||healthy()||attempts>=3)return;
  timer=setTimeout(async()=>{
   timer=undefined;
   if(closed||!active()||!navigator.onLine||healthy()||pc.connectionState==='closed')return;
   attempts++;running=true;
   try{await restart();}catch{}finally{running=false;}
   schedule();
  },attempts===0?2500:8000);
 };
 const changed=()=>{if(healthy()){clear();attempts=0;}else if(interrupted())schedule();};
 const resume=()=>{if(!active())return;attempts=0;clear();if(interrupted())schedule();};
 const visible=()=>{if(document.visibilityState==='visible')changed();};
 pc.addEventListener('connectionstatechange',changed);pc.addEventListener('iceconnectionstatechange',changed);
 window.addEventListener('online',resume);window.addEventListener('offline',clear);document.addEventListener('visibilitychange',visible);
 return()=>{closed=true;clear();pc.removeEventListener('connectionstatechange',changed);pc.removeEventListener('iceconnectionstatechange',changed);window.removeEventListener('online',resume);window.removeEventListener('offline',clear);document.removeEventListener('visibilitychange',visible);};
}
