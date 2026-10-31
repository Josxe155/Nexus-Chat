import {soundPreferences} from './Sounds';import {getPreferences} from './preferences';
let dialing:HTMLAudioElement|undefined,unlock:(()=>void)|undefined;
function enabled(){return soundPreferences().enabled&&getPreferences().notifications.calls.sound;}
function sound(name:string,loop=false){const audio=new Audio('/tones/call-'+name+'.wav');audio.loop=loop;audio.volume=Math.max(0,Math.min(1,Number(soundPreferences().volume)||0));try{const speaker=JSON.parse(localStorage.getItem('nexus-call-devices')||'{}').speaker;if(speaker&&'setSinkId'in audio)(audio as any).setSinkId(speaker).catch(()=>{});}catch{}audio.play().catch(()=>{});return audio;}
export function stopDialing(){if(unlock)window.removeEventListener('pointerdown',unlock);unlock=undefined;if(dialing){dialing.pause();dialing.src='';dialing=undefined;}}
export function startDialing(){stopDialing();if(!enabled())return;const current=sound('dialing',true);dialing=current;unlock=()=>{if(dialing===current)current.play().catch(()=>{});};window.addEventListener('pointerdown',unlock,{once:true});}
export function playCallConnected(){stopDialing();if(enabled())sound('connected');}
export function playCallEnded(){stopDialing();if(enabled())sound('ended');}
