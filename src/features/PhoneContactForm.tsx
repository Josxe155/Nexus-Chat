import GoogleContactSync,{useGoogleContactSync} from './GoogleContactSync';
import ContactQrOverlay from './ContactQrOverlay';
import {ArrowLeft,AtSign,Phone,QrCode,User} from 'lucide-react';
import {usePhoneExpressions} from './PhoneExpressionSheet';
import React,{useContext,useEffect,useRef,useState} from 'react';
import {auth} from '../firebase';
import PhoneField from './PhoneField';
import {apiFetch} from './api';
import {saveContact} from './contacts';
import {ContactChatContext} from './ContactChatContext';
import {submitContactDraft,UnregisteredContactError,prepareContactDraft} from './contactDraft';
import {useMobileBack} from './useMobileBack';
import type {UserProfile} from '../types';
export default function PhoneContactForm({user,onClose,contact}:{user:UserProfile;onClose:()=>void;contact?:{phone:string;first:string;last:string}}){
 const [country,setCountry]=useState(contact?'OTHER':'EC'),[number,setNumber]=useState(contact?.phone||''),[first,setFirst]=useState(contact?.first||''),[last,setLast]=useState(contact?.last||''),[username,setUsername]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[invite,setInvite]=useState(false);
 const googleSync=useGoogleContactSync(user.uid,setError);
 const phone=usePhoneExpressions();const [qrOpen,setQrOpen]=useState(false);
 const valid=(()=>{try{prepareContactDraft({first,last,username,country,number});return true;}catch{return false;}})();
 const open=useContext(ContactChatContext),lock=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(!error)return;const timer=setTimeout(()=>setError(''),3000);return()=>clearTimeout(timer);},[error]);
 const close=()=>{if(!lock.current&&!googleSync.connecting)onClose();};useMobileBack(!qrOpen,close,85);
 const assertActive=()=>{if(!mounted.current||auth.currentUser?.uid!==user.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');};
 return <div className="feature-backdrop"><form className={"feature-dialog contact-editor new-contact-form"+(phone?" pcm-new-contact":"")} role="dialog" aria-modal="true" aria-label="Nuevo contacto" onSubmit={async event=>{
  event.preventDefault();if(lock.current||googleSync.connecting)return;lock.current=true;setBusy(true);setError('');setInvite(false);
  try{
   if(!open)throw Error('Abre Contactos desde la página principal para iniciar una conversación.');
   await submitContactDraft({first,last,username,country,number},{assertActive,
    resolve:async input=>{const token=await auth.currentUser?.getIdToken();assertActive();if(!token)throw Error('Vuelve a iniciar sesión.');const response=await apiFetch('/api/contacts/resolve',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(input)});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo comprobar el contacto.');return result;},
    save:async (person,input)=>{const updated=await saveContact(user,{uid:person.uid,nombre:person.nombre,username:person.username} as UserProfile,{first:input.first,last:input.last},input.phone);assertActive();window.dispatchEvent(new CustomEvent('nexus:profile-update',{detail:updated}));try{await googleSync.sync({uid:person.uid!,first:input.first,last:input.last,username:person.username,phone:input.phone});}catch(cause){throw Error('El contacto se guardó en Nexus. Falta sincronizarlo con Google: '+(cause instanceof Error?cause.message:'Vuelve a intentarlo.'));}assertActive();},
    open:uid=>open(uid),
   });if(mounted.current)onClose();
  }catch(cause){if(mounted.current){setError(cause instanceof Error?cause.message:'No se pudo guardar el contacto.');setInvite(cause instanceof UnregisteredContactError);}}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }}><header>{phone&&<button type="button" aria-label="Volver" disabled={busy||googleSync.connecting} onClick={close}><ArrowLeft/></button>}<h2>Nuevo contacto</h2>{phone&&<button type="button" className="pcm-form-qr" aria-label="Escanear código QR" disabled={busy||googleSync.connecting} onClick={()=>setQrOpen(true)}><QrCode/></button>}{!phone&&<button type="button" aria-label="Cerrar nuevo contacto" disabled={busy||googleSync.connecting} onClick={close}>Cerrar</button>}</header>
 <label className="pcm-contact-field pcm-first">{phone&&<User/>}<span>Nombre</span><input placeholder={phone?"Nombre":undefined} required autoFocus={!phone} autoComplete="given-name" maxLength={80} value={first} onChange={e=>setFirst(e.target.value)} disabled={busy||googleSync.connecting}/></label>
 <label className="pcm-contact-field pcm-last"><span>Apellido</span><input placeholder={phone?"Apellido":undefined} autoComplete="family-name" maxLength={40} value={last} onChange={e=>setLast(e.target.value)} disabled={busy||googleSync.connecting}/></label>
 <label className="pcm-contact-field pcm-handle">{phone&&<AtSign/>}<span>Nombre de usuario</span><input autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={33} placeholder={phone?"Nombre de usuario":"@usuario"} value={username} onChange={e=>setUsername(e.target.value)} disabled={busy||googleSync.connecting}/></label>
 <div className="pcm-contact-number">{phone&&<Phone/>}<PhoneField compact={phone} country={country} number={number} onCountry={setCountry} onNumber={setNumber} disabled={busy||googleSync.connecting}/></div>
 <p className="pcm-number-help">Usa el número de Nexus que aparece en su perfil o su nombre de usuario. El nombre y apellido que guardes solo los verás tú.</p>
 <GoogleContactSync sync={googleSync} disabled={busy||googleSync.connecting}/><p className="pcm-sync-account"><small>Guardar en tu cuenta de Nexus Chat</small><span>{auth.currentUser?.email||'Tu cuenta de Nexus Chat'}</span></p>
 {error&&<p role="alert">{error}</p>}
 {invite&&<button type="button" disabled={busy||googleSync.connecting} onClick={async()=>{try{const text='Te invito a Nexus Chat: '+location.origin;if(navigator.share)await navigator.share({title:'Nexus Chat',text});else await navigator.clipboard.writeText(text);}catch(cause){if(!(cause instanceof DOMException&&cause.name==='AbortError'))setError('No se pudo compartir la invitación.');}}}>Invitar a Nexus Chat</button>}
 <button className="pcm-save-contact" disabled={busy||googleSync.connecting||!valid}>{busy?'Guardando…':phone?'Guardar':'Guardar contacto'}</button></form>{qrOpen&&open&&<ContactQrOverlay user={user} onClose={()=>setQrOpen(false)} onContact={async uid=>{await open(uid,false);setQrOpen(false);onClose();}}/>}</div>;
}
