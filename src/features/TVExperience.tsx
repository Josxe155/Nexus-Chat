import {useEffect,useState} from 'react';
import {Monitor,Tv} from 'lucide-react';

const key='nexus-display-mode';
type Mode='auto'|'tv';
function preference():Mode {try{return localStorage.getItem(key)==='tv'?'tv':'auto';}catch{return 'auto';}}
export function isTVDisplay(){return preference()==='tv'||/SmartTV|Tizen|Web0S|WebOS|HbbTV|NetCast|Viera|BRAVIA|GoogleTV|Android TV/i.test(navigator.userAgent);}
export function DisplayModeSetting(){
 const [mode,setMode]=useState(preference);
 return <label className="display-mode-setting"><span><Tv size={22}/><strong>Pantalla de televisión</strong><small>Controles amplios y navegación con las flechas del mando o teclado.</small></span><select aria-label="Tipo de pantalla" value={mode} onChange={event=>{const value=event.target.value as Mode;try{localStorage.setItem(key,value);}catch{}setMode(value);window.dispatchEvent(new Event('nexus:display-mode'));}}><option value="auto">Automática</option><option value="tv">Televisor</option></select></label>;
}

export default function TVExperience(){
 const [tv,setTV]=useState(isTVDisplay);
 useEffect(()=>{const update=()=>{const value=isTVDisplay();document.documentElement.dataset.nexusDisplay=value?'tv':'standard';setTV(value);};update();window.addEventListener('nexus:display-mode',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('nexus:display-mode',update);window.removeEventListener('storage',update);delete document.documentElement.dataset.nexusDisplay;};},[]);
 useEffect(()=>{if(!tv)return;const keydown=(event:KeyboardEvent)=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
   const active=document.activeElement as HTMLElement;
   if(active?.closest('input,textarea,select,[contenteditable=true],audio,video,[role=menu],[role=dialog],.expression-picker,.desktop-message-popover'))return;
   const controls=Array.from(document.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(element=>{const rect=element.getBoundingClientRect();return !element.closest('[inert],[aria-hidden=true],[hidden]')&&getComputedStyle(element).visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;});
   const origin=active?.getBoundingClientRect();if(!origin||!controls.includes(active)){if(controls[0]){event.preventDefault();controls[0].focus();}return;}
   const horizontal=event.key==='ArrowLeft'||event.key==='ArrowRight',sign=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1,cx=origin.x+origin.width/2,cy=origin.y+origin.height/2;
   const candidates=controls.filter(element=>element!==active).map(element=>{const rect=element.getBoundingClientRect(),dx=rect.x+rect.width/2-cx,dy=rect.y+rect.height/2-cy,forward=(horizontal?dx:dy)*sign,cross=Math.abs(horizontal?dy:dx);return {element,forward,score:forward+cross*3};}).filter(value=>value.forward>4).sort((a,b)=>a.score-b.score);
   if(candidates[0]){event.preventDefault();candidates[0].element.focus({preventScroll:true});candidates[0].element.scrollIntoView({block:'nearest',inline:'nearest'});}
 };document.addEventListener('keydown',keydown);return()=>document.removeEventListener('keydown',keydown);},[tv]);
 return tv?<div className="tv-navigation-hint"><Monitor size={17}/> Usa las flechas para moverte y Enter para abrir</div>:null;
}
