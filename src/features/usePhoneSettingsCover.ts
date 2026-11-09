import {useLayoutEffect,type RefObject} from 'react';

/** Keep the decoration behind the toolbar and exactly the upper half of the avatar. */
export function usePhoneSettingsCover(active:boolean,scrollRef:RefObject<HTMLElement|null>){
 useLayoutEffect(()=>{
  if(!active)return;
  const scroll=scrollRef.current,root=scroll?.closest<HTMLElement>('.settings-center');
  const avatar=root?.querySelector<HTMLImageElement>('.phone-settings-identity-profile img');
  if(!scroll||!root||!avatar)return;
  let frame=0;
  const update=()=>{
   frame=0;const top=root.getBoundingClientRect().top,photo=avatar.getBoundingClientRect();
   const bottom=Math.max(0,Math.round(photo.top+photo.height/2-top));
   root.style.setProperty('--phone-settings-cover-bottom',bottom+'px');
   root.style.setProperty('--phone-settings-cover-scroll',-scroll.scrollTop+'px');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):undefined;
  for(const element of [root,scroll,avatar,root.querySelector('.phone-settings-identity'),root.querySelector('.settings-heading')])if(element)observer?.observe(element);
  scroll.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);avatar.addEventListener('load',schedule);
  update();
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();scroll.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);avatar.removeEventListener('load',schedule);root.style.removeProperty('--phone-settings-cover-bottom');root.style.removeProperty('--phone-settings-cover-scroll');};
 },[active,scrollRef]);
}
