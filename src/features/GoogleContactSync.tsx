import {auth} from '../firebase';
import {visibleAccountEmail,isGuestIdentity} from './guestIdentity';
import {ChevronDown,RefreshCw} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import {connectGoogleContacts,googleContactsAccount,syncContactToGoogle,cancelGoogleContacts,type GoogleNexusContact} from './googleContacts';
import {cachedContactsPreference,loadContactsPreference,saveContactsPreference} from './googleContactsPreference';
export function useGoogleContactSync(uid:string,onError:(message:string)=>void){
 const initial=cachedContactsPreference(uid),[enabled,setEnabled]=useState(initial?.enabled||false),[email,setEmail]=useState(initial?.email||''),[connecting,setConnecting]=useState(false),[saving,setSaving]=useState(false),[hydrating,setHydrating]=useState(!initial),[slow,setSlow]=useState(false);
 const mounted=useRef(true),dirty=useRef(false),attempt=useRef(0),busy=useRef(false);
 const report=(message:string)=>{if(mounted.current&&auth.currentUser?.uid===uid)onError(message);};

 useEffect(()=>{
  mounted.current=true;const generation=++attempt.current;dirty.current=false;busy.current=false;setConnecting(false);setSaving(false);setSlow(false);
  const cached=cachedContactsPreference(uid);setEnabled(cached?.enabled||false);setEmail(cached?.email||'');setHydrating(!cached);
  if(visibleAccountEmail(auth.currentUser)&&!isGuestIdentity(auth.currentUser)){
   void loadContactsPreference(uid).then(value=>{if(mounted.current&&generation===attempt.current&&!dirty.current&&auth.currentUser?.uid===uid){setEnabled(value.enabled);setEmail(value.email);}}).catch(()=>{if(!cached&&generation===attempt.current)report('No se pudo cargar la opción guardada. Puedes elegir si sincronizar este contacto.');}).finally(()=>{if(mounted.current&&generation===attempt.current)setHydrating(false);});
  }else setHydrating(false);
  return()=>{mounted.current=false;attempt.current++;cancelGoogleContacts(uid);};
 },[uid]);
 useEffect(()=>{setSlow(false);if(!connecting)return;const timer=setTimeout(()=>setSlow(true),12000);return()=>clearTimeout(timer);},[connecting,saving]);
 function persist(value:boolean){void saveContactsPreference(uid,value).catch(error=>report(error instanceof Error?error.message:'No se pudo guardar la opción de sincronización.'));}
 async function authorize(){
  const id=++attempt.current;busy.current=true;setConnecting(true);setSaving(false);
  try{const account=await connectGoogleContacts(uid);if(mounted.current&&id===attempt.current){setEmail(account);return account;}throw Error('La sesión cambió.');}
  finally{if(id===attempt.current){busy.current=false;if(mounted.current)setConnecting(false);}}
 }
 async function toggle(){
  if(busy.current)return;dirty.current=true;
  if(enabled){setEnabled(false);persist(false);return;}
  try{await authorize();if(mounted.current){setEnabled(true);persist(true);}}catch(error){report(error instanceof Error?error.message:'No se pudo conectar la cuenta de Google.');}
 }
 return {enabled,email,connecting,saving,slow,loading:hydrating,toggle,cancel:()=>cancelGoogleContacts(uid),
  reserve:async()=>{dirty.current=true;if(hydrating)throw Error('Espera a que termine de cargar tu configuración de contactos.');if(enabled){if(!googleContactsAccount(uid))await authorize();}},
  release:()=>{},
  sync:async(contact:GoogleNexusContact)=>{if(!enabled)return;setConnecting(true);setSaving(true);try{await syncContactToGoogle(uid,contact);}finally{if(mounted.current){setConnecting(false);setSaving(false);}}}
 };
}
export default function GoogleContactSync({sync,disabled=false}:{sync:ReturnType<typeof useGoogleContactSync>;disabled?:boolean}){
 const account=auth.currentUser,email=visibleAccountEmail(account);if(!email||isGuestIdentity(account))return null;
 return <div className="pcm-google-sync"><label><RefreshCw aria-hidden="true"/><span>Sincronizar con Google<small>Guarda este contacto en tu cuenta de Google.</small></span><input type="checkbox" role="switch" aria-label="Sincronizar con Google" checked={sync.enabled} disabled={disabled||sync.connecting||sync.loading} onChange={()=>void sync.toggle()}/></label>
 {sync.loading&&!sync.connecting&&<p role="status">Preparando tus contactos…</p>}
 {sync.connecting&&<div className="google-contact-status" role="status"><strong>{sync.saving?'Guardando en Google':'Conectando tu cuenta'}</strong><p>{sync.saving?'Estamos guardando los datos del contacto.':'Si Google lo solicita, selecciona la cuenta que usas en Nexus Chat.'}</p>{sync.slow&&<p>La respuesta está tardando. Puedes cancelar la espera y volver a intentarlo.</p>}<button type="button" onClick={sync.cancel}>Cancelar espera</button></div>}
 {sync.enabled&&<label className="pcm-sync-account"><small>Sincronizar con</small><span className="pcm-sync-account-value"><select aria-label="Sincronizar con" value={sync.email||email} disabled={disabled||sync.connecting} onChange={()=>{}}><option value={sync.email||email}>{sync.email||email}</option></select><ChevronDown size={18} aria-hidden="true"/></span></label>}</div>;
}
