import {useMobileBack} from './useMobileBack';
import React,{useLayoutEffect,useRef,useState,useEffect} from 'react';
import {createPortal} from 'react-dom';
export default function FloatingMenu({at,onClose,children,label='Acciones del mensaje',className=''}:{at:{x:number;y:number};onClose:()=>void;children:React.ReactNode;label?:string;className?:string}){
 useMobileBack(true,onClose,100);
 const ref=useRef<HTMLDivElement>(null),opener=useRef(document.activeElement as HTMLElement|null),[position,setPosition]=useState(at);
 useLayoutEffect(()=>{
  const element=ref.current;if(!element)return;
  const fit=()=>{const rect=element.getBoundingClientRect();setPosition({x:Math.max(8,Math.min(at.x,innerWidth-rect.width-8)),y:Math.max(8,Math.min(at.y,innerHeight-rect.height-8))});};
  fit();(element.querySelector<HTMLButtonElement>('button:not(:disabled)')||element).focus();
  const observer=new ResizeObserver(fit);observer.observe(element);window.addEventListener('resize',fit);
  return()=>{observer.disconnect();window.removeEventListener('resize',fit);};
 },[at.x,at.y]);
 useEffect(()=>{const element=ref.current,prior=opener.current;return()=>{queueMicrotask(()=>{const focused=document.activeElement;if(prior?.isConnected&&(!focused||focused===document.body||focused===document.documentElement||element?.contains(focused)))prior.focus({preventScroll:true});});};},[]);
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[onClose]);
 return createPortal(<><button className="floating-menu-scrim" aria-label={'Cerrar '+label.toLocaleLowerCase('es')} onClick={onClose}/><div ref={ref} tabIndex={-1} className={'message-menu floating-message-menu '+className} role="menu" aria-label={label} style={{left:position.x,top:position.y}} onKeyDown={event=>{
  // A submenu rendered through a portal has its own keyboard navigation.
  if(!event.currentTarget.contains(event.target as Node)||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const items=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));if(!items.length)return;
  const current=items.indexOf(document.activeElement as HTMLButtonElement),next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();
 }}>{children}</div></>,document.body);
}
