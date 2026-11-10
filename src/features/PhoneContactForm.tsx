import React,{useContext,useEffect,useRef,useState} from 'react';
import {auth} from '../firebase';
import PhoneField from './PhoneField';
import {apiFetch} from './api';
import {saveContact} from './contacts';
import {ContactChatContext} from './ContactChatContext';
import {submitContactDraft,UnregisteredContactError} from './contactDraft';
import {useMobileBack} from './useMobileBack';
import type {UserProfile} from '../types';
export default function PhoneContactForm({user,onClose,contact}:{user:UserProfile;onClose:()=>void;contact?:{phone:string;first:string;last:string}}){
 const [country,setCountry]=useState(contact?'OTHER':'EC'),[number,setNumber]=useState(contact?.phone||''),[first,setFirst]=useState(contact?.first||''),[last,setLast]=useState(contact?.last||''),[username,setUsername]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[invite,setInvite]=useState(false);
 const open=useContext(ContactChatContext),lock=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 const close=()=>{if(!lock.current)onClose();};useMobileBack(true,close,85);
 const assertActive=()=>{if(!mounted.current||auth.currentUser?.uid!==user.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');};
 return <div className="feature-backdrop"><form className="feature-dialog contact-editor new-contact-form" role="dialog" aria-modal="true" aria-label="Nuevo contacto" onSubmit={async event=>{
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setInvite(false);
  try{
   if(!open)throw Error('Abre Contactos desde la página principal para iniciar una conversación.');
   await submitContactDraft({first,last,username,country,number},{assertActive,
    resolve:async input=>{const token=await auth.currentUser?.getIdToken();assertActive();if(!token)throw Error('Vuelve a iniciar sesión.');const response=await apiFetch('/api/contacts/resolve',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(input)});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo comprobar el contacto.');return result;},
    save:async (person,input)=>{const updated=await saveContact(user,{uid:person.uid,nombre:person.nombre,username:person.username} as UserProfile,{first:input.first,last:input.last},input.phone);assertActive();window.dispatchEvent(new CustomEvent('nexus:profile-update',{detail:updated}));},
    open:uid=>open(uid),
   });if(mounted.current)onClose();
  }catch(cause){if(mounted.current){setError(cause instanceof Error?cause.message:'No se pudo guardar el contacto.');setInvite(cause instanceof UnregisteredContactError);}}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }}><header><h2>Nuevo contacto</h2><button type="button" aria-label="Cerrar nuevo contacto" disabled={busy} onClick={close}>Cerrar</button></header>
 <label>Nombre<input required autoFocus autoComplete="given-name" maxLength={80} value={first} onChange={e=>setFirst(e.target.value)} disabled={busy}/></label>
 <label>Apellido<input autoComplete="family-name" maxLength={40} value={last} onChange={e=>setLast(e.target.value)} disabled={busy}/></label>
 <label>Nombre de usuario<input autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={33} placeholder="@usuario" value={username} onChange={e=>setUsername(e.target.value)} disabled={busy}/></label>
 <PhoneField country={country} number={number} onCountry={setCountry} onNumber={setNumber} disabled={busy}/>
 <p>Usa el número de Nexus que aparece en su perfil o su nombre de usuario. El nombre y apellido que guardes solo los verás tú.</p>
 <label className="contact-phone-sync"><input type="checkbox" disabled checked={false} readOnly/>Sincronizar contacto con el teléfono</label>
 <small>Los números de Nexus son internos. La sincronización con la agenda del teléfono está pendiente de números reales verificados.</small>
 <p>Sincronizar con {auth.currentUser?.email||'tu cuenta de Nexus'}</p>
 {error&&<p role="alert">{error}</p>}
 {invite&&<button type="button" disabled={busy} onClick={async()=>{try{const text='Te invito a Nexus Chat: '+location.origin;if(navigator.share)await navigator.share({title:'Nexus Chat',text});else await navigator.clipboard.writeText(text);}catch(cause){if(!(cause instanceof DOMException&&cause.name==='AbortError'))setError('No se pudo compartir la invitación.');}}}>Invitar a Nexus Chat</button>}
 <button disabled={busy}>{busy?'Guardando…':'Guardar contacto'}</button></form></div>;
}
