export type VoiceTrack={key:string;uid:string;chatId:string;messageId:string;src:string;label:string;photo?:string;expiresAt?:number};
type Playback={track:VoiceTrack|null;playing:boolean;time:number;duration:number;speed:number;error:string};
let state:Playback={track:null,playing:false,time:0,duration:0,speed:1,error:''},audio:HTMLAudioElement|undefined,session='',queue:VoiceTrack[]=[],revision=0;
const listeners=new Set<()=>void>(),positions=new Map<string,number>();
const emit=(patch:Partial<Playback>)=>{state={...state,...patch};listeners.forEach(listener=>listener());};
export const voiceSnapshot=()=>state;
let idle:Playback={...state};export function voiceTrackSnapshot(key:string){if(state.track?.key===key)return state;if(idle.speed!==state.speed)idle={track:null,playing:false,time:0,duration:0,speed:state.speed,error:''};return idle;}
export const subscribeVoice=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
const remember=()=>{if(state.track&&state.time>0){positions.delete(state.track.key);positions.set(state.track.key,state.time);if(positions.size>100)positions.delete(positions.keys().next().value!);}};
function player(){if(audio)return audio;audio=new Audio();audio.preload='metadata';audio.setAttribute('playsinline','');audio.style.display='none';document.body.appendChild(audio);
 audio.ontimeupdate=()=>{emit({time:Number.isFinite(audio!.currentTime)?audio!.currentTime:0});remember();};
 audio.onloadedmetadata=()=>{const duration=Number.isFinite(audio!.duration)?audio!.duration:0,position=state.track?positions.get(state.track.key)||0:0;emit({duration:duration||state.duration});if(position>0&&(!duration||position<duration-.2))audio!.currentTime=position;};
 audio.ondurationchange=()=>{if(Number.isFinite(audio!.duration)&&audio!.duration>0)emit({duration:audio!.duration});};
 audio.onplay=()=>{emit({playing:true,error:''});window.dispatchEvent(new CustomEvent('nexus:audio-start',{detail:'global-voice'}));};
 audio.onpause=()=>{if(audio!.paused){remember();emit({playing:false});}};
 audio.onerror=()=>emit({playing:false,error:'No se pudo reproducir el audio. Vuelve a intentarlo.'});
 audio.onended=()=>{if(state.track)positions.delete(state.track.key);const next=queue.shift();if(next&&next.uid===session&&(!next.expiresAt||next.expiresAt>Date.now()))void playVoice(next,queue);else{queue=[];emit({track:null,playing:false,time:0,duration:0,error:''});}};
 window.addEventListener('nexus:audio-start',event=>{if((event as CustomEvent).detail!=='global-voice')pauseVoice();});
 return audio;
}
export function setVoiceSession(uid:string){if(uid!==session){resetVoicePlayback();session=uid;}}
export function pauseVoice(){audio?.pause();}
export function resetVoicePlayback(){revision++;queue=[];positions.clear();audio?.pause();if(audio){audio.removeAttribute('src');audio.load();}session='';emit({track:null,playing:false,time:0,duration:0,speed:1,error:''});}
export function closeVoice(){revision++;remember();queue=[];audio?.pause();if(audio){audio.removeAttribute('src');audio.load();}emit({track:null,playing:false,time:0,duration:0,error:''});}
export async function playVoice(track:VoiceTrack,following:VoiceTrack[]=[]){
 if(!track.src||!track.uid||track.expiresAt&&track.expiresAt<=Date.now())return;
 if(!session)session=track.uid;if(session!==track.uid)return;
 const node=player();queue=following.filter(value=>value.uid===session);const current=++revision;
 if(state.track?.key!==track.key||state.track.src!==track.src){remember();node.pause();emit({track,playing:false,time:positions.get(track.key)||0,duration:0,error:''});node.src=track.src;}else emit({error:''});
 node.playbackRate=state.speed;try{await node.play();}catch{if(current===revision)emit({playing:false,error:'No se pudo iniciar el audio. Pulsa reproducir para reintentarlo.'});}
}
export function reportVoiceDuration(key:string,duration:number){const nativeDuration=audio&&Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:0,value=nativeDuration||duration;if(state.track?.key===key&&Number.isFinite(value)&&value>0&&state.duration!==value)emit({duration:value});}
export function seekVoice(time:number){if(audio&&Number.isFinite(time)&&state.duration>0){audio.currentTime=Math.max(0,Math.min(state.duration,time));emit({time:audio.currentTime});remember();}}
export function speedVoice(){const speed=state.speed===1?1.5:state.speed===1.5?2:1;if(audio)audio.playbackRate=speed;emit({speed});}
export async function toggleVoice(){if(!state.track)return;if(state.playing)pauseVoice();else await playVoice(state.track,queue);}
export function excludeVoice(chatId:string,ids:Set<string>){queue=queue.filter(track=>track.chatId!==chatId||!ids.has(track.messageId));if(state.track?.chatId===chatId&&ids.has(state.track.messageId))closeVoice();}
export function invalidateVoice(chatId:string,visible:Set<string>,observed:Set<string>){excludeVoice(chatId,new Set([...observed].filter(id=>!visible.has(id))));}
export function voiceAllowedChats(uid:string,ids:Set<string>){if(state.track?.uid!==uid)return;queue=queue.filter(track=>ids.has(track.chatId));if(state.track&&!ids.has(state.track.chatId))closeVoice();}
