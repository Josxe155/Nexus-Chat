export function VoiceLock({closing=false}:{closing?:boolean}){
 return <svg className="voice-lock-icon" data-closing={closing} viewBox="0 0 24 28" fill="none" aria-hidden="true"><path className="voice-lock-shackle" d="M8 13V7a4 4 0 0 1 8 0v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><rect x="4" y="12" width="16" height="13" rx="3" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="#11191e"/><path d="M12 18v3" stroke="#11191e" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
export function VoiceDiscardMotion(){
 return <div className="voice-discard-motion" aria-hidden="true"><svg viewBox="0 0 110 120" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><g className="voice-discard-mic"><rect x="9" y="40" width="10" height="18" rx="5"/><path d="M5 51v3a9 9 0 0 0 18 0v-3M14 63v7M10 70h8"/></g><g className="voice-discard-bin"><path d="m40 88 2 23h21l2-23M49 94v12M57 94v12"/><g className="voice-discard-lid"><path d="M38 85h29M47 84v-4h12v4"/></g></g></svg></div>;
}
