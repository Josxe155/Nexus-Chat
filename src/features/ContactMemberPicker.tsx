import {useMemo,useState,useRef} from 'react';
import {ArrowLeft,ArrowRight,Grid3X3,Check} from 'lucide-react';
import type {Chat,UserProfile} from '../types';
import {useContactNames,useContactNumbers} from './contacts';
import {personalContacts,frequentContacts} from './contactMenuModel';
import {avatar} from './avatar';
import {useMobileBack} from './useMobileBack';
export default function ContactMemberPicker({user,users,chats,value,onDone,onBack}:{user:UserProfile;users:UserProfile[];chats:Chat[];value:string[];onDone:(ids:string[])=>void;onBack:()=>void}){
 const names=useContactNames(user.uid),numbers=useContactNumbers(user.uid),[query,setQuery]=useState(''),[selected,setSelected]=useState(value),[numeric,setNumeric]=useState(false);const input=useRef<HTMLInputElement>(null);
 const people=useMemo(()=>personalContacts(user,users,names,query,numbers).filter(person=>!user.privacy?.blockedIds?.includes(person.uid)),[user,users,names,query,numbers]),frequent=frequentContacts(people,chats,user.uid),frequentIds=new Set(frequent.map(p=>p.uid));useMobileBack(true,onBack,95);
 const rows=(items:UserProfile[])=>items.map(person=><button type="button" className="pcm-member" key={person.uid} aria-pressed={selected.includes(person.uid)} onClick={()=>setSelected(old=>old.includes(person.uid)?old.filter(id=>id!==person.uid):old.length<99?[...old,person.uid]:old)}><img src={avatar(person.foto)} alt=""/><span>{person.nombre}</span><i className={selected.includes(person.uid)?'selected':''}>{selected.includes(person.uid)&&<Check size={15}/>}</i></button>);
 return <section className="pcm-page pcm-member-picker" role="dialog" aria-modal="true" aria-label="Elegir miembros"><header className="pcm-search-header"><button aria-label="Volver" onClick={onBack}><ArrowLeft/></button><input ref={input} inputMode={numeric?'tel':'text'} autoFocus aria-label="Buscar miembros" placeholder="Nombre, número o nombre de usuario" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" aria-label={numeric?'Usar teclado de texto':'Usar teclado numérico'} onClick={()=>{setNumeric(!numeric);input.current?.focus();}}><Grid3X3 size={22}/></button></header><main>{!!frequent.length&&<><h3>Contactos frecuentes</h3>{rows(frequent)}</>}<h3>Contactos en Nexus Chat</h3>{rows(people.filter(p=>!frequentIds.has(p.uid)))}{!people.length&&<p className="pcm-empty">No hay contactos que coincidan.</p>}</main><button className="pcm-fab" aria-label="Confirmar miembros" onClick={()=>onDone(selected)}><ArrowRight/></button></section>;
}
