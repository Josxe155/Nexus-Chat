import type {Chat} from '../types';
import {useEffect,useState} from 'react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {db} from '../firebase';
import {SettingsDialog} from './MobileSettingsControls';
import {followChannel,readChannel,respondChannelInvite} from './channels';
export default function ChannelAccess({uid,onSelect,chats}:{uid:string;chats:Chat[];onSelect:(id:string)=>void}){
 const [link,setLink]=useState(()=>new URLSearchParams(location.search).get('channel')),[channel,setChannel]=useState<Awaited<ReturnType<typeof readChannel>>>(),[invites,setInvites]=useState<any[]>([]),[hidden,setHidden]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const open=(event:Event)=>{const id=(event as CustomEvent).detail;if(typeof id==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(id)){setChannel(undefined);setError('');setLink(id);}};window.addEventListener('nexus:channel-open',open);return()=>window.removeEventListener('nexus:channel-open',open);},[]);
 useEffect(()=>{if(!link||!/^[a-zA-Z0-9_-]{1,128}$/.test(link))return;let live=true;readChannel(link).then(data=>{if(live)setChannel(data);}).catch(()=>{if(live)setError('Este canal ya no está disponible.');});const url=new URL(location.href);url.searchParams.delete('channel');history.replaceState(history.state,'',url);return()=>{live=false;};},[link]);
 useEffect(()=>onSnapshot(query(collection(db,'channelAdminInvites'),where('target','==',uid)),snap=>setInvites(snap.docs.map(row=>({id:row.id,...row.data()})).filter((data:any)=>data.status==='pending'&&data.expiresAt>Date.now())),()=>{}),[uid]);
 const invite=invites.find(item=>!hidden.includes(item.id));
 async function act(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await action();}catch(cause){setError(cause instanceof Error?cause.message:'No se pudo abrir el canal.');}finally{setBusy(false);}}
 if(link&&/^[a-zA-Z0-9_-]{1,128}$/.test(link))return <SettingsDialog title={channel?.title||'Canal de Nexus Chat'} onClose={()=>{if(!busy){setLink(null);setError('');}}} actions={<><button disabled={busy} onClick={()=>{setLink(null);setError('');}}>Cerrar</button>{channel&&<button disabled={busy} onClick={()=>void act(async()=>{if(!chats.some(chat=>chat.id===channel.id))await followChannel(uid,channel.id);onSelect(channel.id);setLink(null);})}>{busy?'Abriendo…':chats.some(chat=>chat.id===channel.id)?'Abrir canal':'Seguir canal'}</button>}</>}><p>{channel?.description||(!error?'Consultando canal…':'')}</p>{error&&<p role="alert">{error}</p>}</SettingsDialog>;
 if(!invite)return null;
 return <SettingsDialog title={'Administrar '+invite.title} onClose={()=>{if(!busy)setHidden(old=>[...old,invite.id]);}} actions={<><button disabled={busy} onClick={()=>void act(()=>respondChannelInvite(uid,invite.channelId,false))}>Rechazar</button><button disabled={busy} onClick={()=>void act(async()=>{await respondChannelInvite(uid,invite.channelId,true);onSelect(invite.channelId);})}>{busy?'Abriendo…':'Aceptar'}</button></>}><p>Te invitaron a administrar este canal. Al aceptar podrás publicar actualizaciones y editar su información.</p>{error&&<p role="alert">{error}</p>}</SettingsDialog>;
}
