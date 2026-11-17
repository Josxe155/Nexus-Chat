import {auth} from '../firebase';
import {visibleAccountEmail,isGuestIdentity} from './guestIdentity';
import {ChevronDown} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {connectGoogleContacts,prepareGoogleContacts,syncContactToGoogle,type GoogleNexusContact} from './googleContacts';
export function useGoogleContactSync(uid:string,onError:(message:string)=>void){
 const [enabled,setEnabled]=useState(false),[connecting,setConnecting]=useState(false),[email,setEmail]=useState('');
 const mounted=useRef(true),pending=useRef(false);
 useEffect(()=>{mounted.current=true;if(visibleAccountEmail(auth.currentUser)&&!isGuestIdentity(auth.currentUser))void prepareGoogleContacts().catch(()=>{});return()=>{mounted.current=false;};},[]);
 async function toggle(){
  if(pending.current)return;
  if(enabled){setEnabled(false);return;}
  pending.current=true;setConnecting(true);
  try{const account=await connectGoogleContacts(uid);if(mounted.current){setEmail(account);setEnabled(true);}}
  catch(error){if(mounted.current)onError(error instanceof Error?error.message:'No se pudo conectar tu agenda de Google.');}
  finally{pending.current=false;if(mounted.current)setConnecting(false);}
 }
 return {enabled,connecting,email,toggle,sync:async(contact:GoogleNexusContact)=>{if(enabled)await syncContactToGoogle(uid,contact);}};
}
export default function GoogleContactSync({sync,disabled=false}:{sync:ReturnType<typeof useGoogleContactSync>;disabled?:boolean}){
 const account=auth.currentUser,email=visibleAccountEmail(account);
 if(!email||isGuestIdentity(account))return null;
 return <div className="pcm-google-sync"><label><RefreshCw aria-hidden="true"/><span>Sincronizar con Google<small>Guarda este contacto en tu cuenta de Google.</small></span><input type="checkbox" role="switch" aria-label="Sincronizar con Google" checked={sync.enabled} disabled={disabled||sync.connecting} onChange={()=>void sync.toggle()}/></label>{sync.connecting&&<p role="status">Conectando con Google…</p>}{sync.enabled&&<label className="pcm-sync-account"><small>Sincronizar con</small><span className="pcm-sync-account-value"><select aria-label="Sincronizar con" value={sync.email||email} disabled={disabled||sync.connecting} onChange={()=>{}}><option value={sync.email||email}>{sync.email||email}</option></select><ChevronDown size={18} aria-hidden="true"/></span></label>}</div>;
}
