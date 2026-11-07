type Action='lock'|'cancel'|'send';
type Gesture={active:boolean;locked:boolean;action?:Action};
let current:Gesture={active:false,locked:false},dispose:(()=>void)|undefined;
export const mobileVoiceState=()=>current;
export function resetMobileVoice(){dispose?.();dispose=undefined;current={active:false,locked:false};}
export function beginMobileVoice(event:PointerEvent,open:()=>void){
 if(current.active||event.button!==0)return;
 resetMobileVoice();current={active:true,locked:false};
 const host=(event.target as HTMLElement)?.closest<HTMLElement>('.chat-composer')||event.target as HTMLElement;
 const x=event.clientX,y=event.clientY,id=event.pointerId,pressedAt=performance.now();
 const clean=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);window.removeEventListener('blur',blur);try{if(host.hasPointerCapture?.(id))host.releasePointerCapture(id);}catch{}};
 const finish=(action:Action)=>{clean();dispose=undefined;current={active:false,locked:action==='lock',action};window.dispatchEvent(new CustomEvent('nexus:voice-gesture',{detail:action}));};
 const move=(e:PointerEvent)=>{if(e.pointerId!==id)return;e.preventDefault();const left=Math.max(0,x-e.clientX),up=Math.max(0,y-e.clientY);window.dispatchEvent(new CustomEvent('nexus:voice-drag',{detail:{up,left}}));if(left>90)finish('cancel');else if(up>75)finish('lock');};
 const up=(e:PointerEvent)=>{if(e.pointerId===id)finish(performance.now()-pressedAt<300?'lock':'send');};
 const cancel=(e:PointerEvent)=>{if(e.pointerId===id)finish('cancel');};
 const blur=()=>finish('cancel');
 dispose=clean;try{host.setPointerCapture?.(id);}catch{}
 window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);window.addEventListener('blur',blur);open();
}
