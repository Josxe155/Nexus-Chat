type Action='lock'|'cancel'|'discard'|'send';
export const voiceLockDistance=75;
const discardDistance=90;
type Gesture={active:boolean;locked:boolean;action?:Action};
let current:Gesture={active:false,locked:false},dispose:(()=>void)|undefined;
export const mobileVoiceState=()=>current;
export function resetMobileVoice(){dispose?.();dispose=undefined;current={active:false,locked:false};}
export function beginMobileVoice(event:PointerEvent,open:()=>void){
 if(current.active||event.button!==0)return;
 resetMobileVoice();current={active:true,locked:false};
 const host=(event.target as HTMLElement)?.closest<HTMLElement>('.chat-composer')||event.target as HTMLElement;
 const x=event.clientX,y=event.clientY,id=event.pointerId,pressedAt=performance.now();
 let direction:'left'|'up'|undefined;
 const clean=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);window.removeEventListener('blur',blur);try{if(host.hasPointerCapture?.(id))host.releasePointerCapture(id);}catch{}};
 const finish=(action:Action)=>{clean();dispose=undefined;current={active:false,locked:action==='lock',action};window.dispatchEvent(new CustomEvent('nexus:voice-gesture',{detail:action}));};
 const move=(e:PointerEvent)=>{
  if(e.pointerId!==id)return;
  e.preventDefault();
  const dx=x-e.clientX,dy=y-e.clientY;
  const leftTravel=dx>4?dx:0,upTravel=dy>4?dy:0;
  // Keep the current direction near the diagonal, then switch once the other direction leads.
  if(!leftTravel&&!upTravel)direction=undefined;
  else if(!direction)direction=upTravel>=leftTravel?'up':'left';
  else if(upTravel>leftTravel+6)direction='up';
  else if(leftTravel>upTravel+6)direction='left';
  const left=direction==='left'?Math.min(discardDistance,leftTravel):0;
  const up=direction==='up'?Math.min(voiceLockDistance,upTravel):0;
  window.dispatchEvent(new CustomEvent('nexus:voice-drag',{detail:{up,left}}));
  if(up===voiceLockDistance)finish('lock');
  else if(left===discardDistance)finish('discard');
 };
 const up=(e:PointerEvent)=>{if(e.pointerId===id)finish(performance.now()-pressedAt<300?'lock':'send');};
 const cancel=(e:PointerEvent)=>{if(e.pointerId===id)finish('cancel');};
 const blur=()=>finish('cancel');
 dispose=clean;try{host.setPointerCapture?.(id);}catch{}
 window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);window.addEventListener('blur',blur);open();
}
