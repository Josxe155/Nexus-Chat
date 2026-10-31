// A single designated offerer avoids two simultaneous ICE restart offers.
export function attachCallRecovery(pc:RTCPeerConnection,offerer:boolean,restart:()=>Promise<void>,active:()=>boolean){
 let timer:ReturnType<typeof setTimeout>|undefined,attempts=0,closed=false;
 const clear=()=>{clearTimeout(timer);timer=undefined;};
 const schedule=()=>{if(closed||!active()||timer||pc.connectionState==='closed')return;if(pc.connectionState==='connected'){attempts=0;return;}if(attempts>=3)return;timer=setTimeout(async()=>{timer=undefined;if(closed||!active()||pc.connectionState==='connected')return;attempts++;try{await restart();}catch{}schedule();},attempts===0?2500:8000);};
 const changed=()=>{if(pc.connectionState==='connected'){clear();attempts=0;}else if(['disconnected','failed'].includes(pc.connectionState))schedule();};
 const online=()=>{if(!active())return;attempts=0;clear();schedule();};
 pc.addEventListener('connectionstatechange',changed);window.addEventListener('online',online);
 return()=>{closed=true;clear();pc.removeEventListener('connectionstatechange',changed);window.removeEventListener('online',online);};
}
