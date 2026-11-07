import {useEffect,useRef,useState} from 'react';
export function VoiceLock({closing=false}:{closing?:boolean}){
 return <svg className="voice-lock-icon" data-closing={closing} viewBox="0 0 24 28" fill="none" aria-hidden="true"><path className="voice-lock-shackle" d="M8 13V7a4 4 0 0 1 8 0v6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><rect x="4" y="12" width="16" height="13" rx="3" fill="currentColor"/><circle cx="12" cy="17" r="1.3" fill="#11191e"/><path d="M12 18v2.5" stroke="#11191e" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
export function VoiceDiscardMotion(){
 return <div className="voice-discard-motion" aria-hidden="true"><svg viewBox="0 0 110 120" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><g className="voice-discard-mic"><rect x="9" y="40" width="10" height="18" rx="5"/><path d="M5 51v3a9 9 0 0 0 18 0v-3M14 63v7M10 70h8"/></g><g className="voice-discard-bin"><path d="m40 88 2 23h21l2-23M49 94v12M57 94v12"/><g className="voice-discard-lid"><path d="M38 85h29M47 84v-4h12v4"/></g></g></svg></div>;
}
export function MobileVoiceDiscardHost(){
 const host=useRef<HTMLSpanElement>(null),sequence=useRef(0),[motion,setMotion]=useState<{id:number;source:string}|null>(null);
 useEffect(()=>{const footer=host.current?.closest('.chat-composer');if(!footer)return;const discard=(event:Event)=>{event.preventDefault();setMotion({id:++sequence.current,source:(event as CustomEvent).detail?.source||'held'});};footer.addEventListener('nexus:voice-discard',discard);return()=>footer.removeEventListener('nexus:voice-discard',discard);},[]);
 useEffect(()=>{if(!motion)return;const timer=setTimeout(()=>setMotion(null),900);return()=>clearTimeout(timer);},[motion]);
 return <span ref={host} className="voice-discard-host" data-source={motion?.source} onAnimationEnd={event=>{if((event.target as Element).classList.contains('voice-discard-mic'))setMotion(null);}}>{motion&&<VoiceDiscardMotion key={motion.id}/>}</span>;
}
