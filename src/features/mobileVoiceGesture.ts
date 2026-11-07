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
 let axis:'left'|'up'|undefined;
 const clean=()=>{window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);window.removeEventListener('blur',blur);try{if(host.hasPointerCapture?.(id))host.releasePointerCapture(id);}catch{}};
 const finish=(action:Action)=>{clean();dispose=undefined;current={active:false,locked:action==='lock',action};window.dispatchEvent(new CustomEvent('nexus:voice-gesture',{detail:action}));};
 const move=(e:PointerEvent)=>{
  if(e.pointerId!==id)return;
  e.preventDefault();
  const dx=x-e.clientX,dy=y-e.clientY;
  if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){
   if(dx>0&&dx>=Math.abs(dy))axis='left';
   else if(dy>0&&dy>=Math.abs(dx))axis='up';
  }
  const left=axis==='left'?Math.max(0,Math.min(discardDistance,dx)):0;
  const up=axis==='up'?Math.max(0,Math.min(voiceLockDistance,dy)):0;
  window.dispatchEvent(new CustomEvent('nexus:voice-drag',{detail:{up,left}}));
  if(left===discardDistance)finish('discard');
  else if(up===voiceLockDistance)finish('lock');
 };
 const up=(e:PointerEvent)=>{if(e.pointerId===id)finish(performance.now()-pressedAt<300?'lock':'send');};
 const cancel=(e:PointerEvent)=>{if(e.pointerId===id)finish('cancel');};
 const blur=()=>finish('cancel');
 dispose=clean;try{host.setPointerCapture?.(id);}catch{}
 window.addEventListener('pointermove',move,{capture:true,passive:false});window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);window.addEventListener('blur',blur);open();
}
