import {useState} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
import type {Message,UserProfile} from '../types';
import {avatar} from './avatar';
import {useMobileBack} from './useMobileBack';
export default function ReactionDetails({message,user,users,onRemove,onClose}:{message:Message;user:UserProfile;users:UserProfile[];onRemove:(emoji:string)=>Promise<void>;onClose:()=>void}){
 const [filter,setFilter]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');useMobileBack(true,onClose,85);
 const entries=Object.entries(message.reactions||{}),counts=new Map<string,number>();for(const [,emoji]of entries)counts.set(emoji,(counts.get(emoji)||0)+1);
 return createPortal(<div className="feature-backdrop"><section className="feature-dialog reaction-details" role="dialog" aria-modal="true" aria-label="Reacciones del mensaje"><header><h2>Reacciones</h2><button aria-label="Cerrar reacciones" onClick={onClose}><X/></button></header><nav aria-label="Filtrar reacciones"><button aria-pressed={!filter} onClick={()=>setFilter('')}>Todas · {entries.length}</button>{[...counts].map(([emoji,count])=><button key={emoji} aria-pressed={filter===emoji} onClick={()=>setFilter(emoji)}>{emoji} {count}</button>)}</nav><div className="reaction-people">{entries.filter(([,emoji])=>!filter||emoji===filter).map(([uid,emoji])=>{const person=users.find(person=>person.uid===uid);return <button disabled={uid!==user.uid||busy} key={uid} onClick={async()=>{if(uid!==user.uid||busy)return;setBusy(true);try{await onRemove(emoji);onClose();}catch{setError('No se pudo quitar la reacción. Inténtalo de nuevo.');}finally{setBusy(false);}}}><img src={avatar(uid===user.uid?user.foto:person?.foto)} alt=""/><span><strong>{uid===user.uid?'Tú':person?.nombre||'Participante'}</strong>{uid===user.uid&&<small>Toca para eliminar</small>}</span><b>{emoji}</b></button>;})}</div>{!entries.length&&<p>Este mensaje ya no tiene reacciones.</p>}{error&&<p role="alert">{error}</p>}</section></div>,document.body);
}
