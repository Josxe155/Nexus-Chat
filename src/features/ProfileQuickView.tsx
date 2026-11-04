import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {MessageCircle,Phone,Video,Info,X,ArrowLeft} from 'lucide-react';
import type {Chat,UserProfile} from '../types';
import {avatar,DEFAULT_AVATAR} from './avatar';
import {useMediaURLs} from './mediaTransfer';
import {useRealtime} from './RealtimeProvider';
import {useMobileBack} from './useMobileBack';

export default function ProfileQuickView({chat,user,person,onMessage,onInfo,onClose}:{chat:Chat;user:UserProfile;person?:Partial<UserProfile>;onMessage:()=>void;onInfo:()=>void;onClose:()=>void}){
 const group=chat.kind==='group'||chat.kind==='channel',name=group?chat.title||'Grupo Nexus':person?.nombre||'Usuario Nexus',photo=group?chat.photoURL:person?.foto;
 const urls=useMediaURLs([{id:chat.id,fileUrl:photo,force:true,fileSize:1}],user.uid),source=urls[chat.id]||avatar(photo),rt=useRealtime();
 const [expanded,setExpanded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const dialog=useRef<HTMLElement>(null);
 const workspace=document.querySelector('.nexus-workspace'),palette=workspace?getComputedStyle(workspace):null;
 const colors={'--nx-panel':palette?.getPropertyValue('--nx-panel')||'#171d22','--nx-text':palette?.color||'#e9edef','--nx-accent':palette?.getPropertyValue('--nx-accent')||'#24c776'} as CSSProperties;
 const back=()=>expanded?setExpanded(false):onClose();useMobileBack(true,back);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();back();}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[expanded]);
 const call=async(video:boolean)=>{if(!rt||busy)return;setBusy(true);setError('');try{await rt.start(chat,video?'video':'audio');onClose();}catch(error){setError(error instanceof Error?error.message:'No se pudo iniciar la llamada.');}finally{setBusy(false);}};
 return createPortal(<div style={colors} className={'profile-quick-overlay'+(expanded?' profile-photo-expanded':'')} onClick={event=>{if(event.target===event.currentTarget)back();}}><section ref={dialog} className="profile-quick-card" role="dialog" aria-modal="true" aria-label={'Perfil de '+name} onKeyDown={event=>{if(event.key!=='Tab')return;const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}>
 <header><button aria-label={expanded?'Volver a vista rápida':'Cerrar vista rápida'} onClick={back}>{expanded?<ArrowLeft/>:<X/>}</button>{expanded&&<h2>{name}</h2>}</header>
 <div className="profile-quick-media"><button className="profile-quick-photo" aria-label={expanded?'Reducir foto de perfil':'Ampliar foto de perfil'} onClick={()=>setExpanded(!expanded)}><img src={source} alt={'Foto de '+name} referrerPolicy="no-referrer" onError={event=>{if(event.currentTarget.getAttribute('src')!==DEFAULT_AVATAR)event.currentTarget.src=DEFAULT_AVATAR;}}/></button>
 {!expanded&&<div className="profile-quick-caption"><h2>{name}</h2>{group&&<small>{chat.participants.length} miembros</small>}</div>}</div>
 {!expanded&&<nav aria-label="Acciones del perfil"><button aria-label="Enviar mensaje" onClick={onMessage}><MessageCircle/><span>Mensaje</span></button>{chat.kind!=='channel'&&<><button aria-label="Llamada de voz" disabled={busy||!rt} onClick={()=>call(false)}><Phone/><span>Llamar</span></button><button aria-label="Videollamada" disabled={busy||!rt} onClick={()=>call(true)}><Video/><span>Video</span></button></>}<button aria-label={group?'Información del grupo':'Información del contacto'} onClick={onInfo}><Info/><span>Información</span></button></nav>}
 {error&&<p role="alert">{error}</p>}
 </section></div>,document.body);
}
