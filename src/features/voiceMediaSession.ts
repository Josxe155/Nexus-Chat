type Controls={play:()=>void;pause:()=>void;stop:()=>void;seek:(time:number)=>void;time:()=>number};
let active=false;
const actions:MediaSessionAction[]=['play','pause','stop','seekto','seekbackward','seekforward'];
export function activateVoiceMediaSession(controls:Controls){
 if(typeof navigator==='undefined'||!navigator.mediaSession)return;
 const session=navigator.mediaSession;
 active=true;
 // Keep names, message text, photos and private media URLs off the lock screen.
 try{if(typeof MediaMetadata!=='undefined')session.metadata=new MediaMetadata({title:'Nota de voz',artist:'Nexus Chat'});}catch{}
 const handlers:Partial<Record<MediaSessionAction,MediaSessionActionHandler>>={play:controls.play,pause:controls.pause,stop:controls.stop,seekto:event=>{if(Number.isFinite(event.seekTime))controls.seek(event.seekTime!);},seekbackward:event=>controls.seek(controls.time()-(event.seekOffset||10)),seekforward:event=>controls.seek(controls.time()+(event.seekOffset||10))};
 for(const action of actions)try{session.setActionHandler(action,handlers[action]!);}catch{/* Unsupported system controls leave the page controls working. */}
}
export function updateVoiceMediaSession(playing:boolean,time:number,duration:number,speed:number){
 if(!active||typeof navigator==='undefined'||!navigator.mediaSession)return;
 try{navigator.mediaSession.playbackState=playing?'playing':'paused';}catch{}
 if(Number.isFinite(duration)&&duration>0)try{navigator.mediaSession.setPositionState?.({duration,playbackRate:speed,position:Math.max(0,Math.min(duration,time))});}catch{}
}
export function releaseVoiceMediaSession(){
 if(!active||typeof navigator==='undefined'||!navigator.mediaSession)return;active=false;
 try{navigator.mediaSession.metadata=null;navigator.mediaSession.playbackState='none';navigator.mediaSession.setPositionState?.();}catch{}
 for(const action of actions)try{navigator.mediaSession.setActionHandler(action,null);}catch{}
}
