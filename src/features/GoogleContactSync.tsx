import {auth} from '../firebase';
import {visibleAccountEmail,isGuestIdentity} from './guestIdentity';
import {ChevronDown} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {connectGoogleContacts,syncContactToGoogle,reserveGoogleContactSave,closeGoogleContactWindow,cancelGoogleContactRequest,type ContactWindow,type GoogleNexusContact} from './googleContactsAppsScript';
export function useGoogleContactSync(uid:string,onError:(message:string)=>void){
 const [enabled,setEnabled]=useState(false),[connecting,setConnecting]=useState(false),[email,setEmail]=useState('');
 const mounted=useRef(true),pending=useRef(false),reservation=useRef<ContactWindow|undefined>(undefined);
 useEffect(()=>{mounted.current=true;setEnabled(false);setEmail('');return()=>{mounted.current=false;cancelGoogleContactRequest(uid);closeGoogleContactWindow(reservation.current);};},[uid]);
 async function toggle(){
  if(pending.current)return;
  if(enabled){setEnabled(false);return;}
  pending.current=true;setConnecting(true);
  try{const account=await connectGoogleContacts(uid);if(mounted.current){setEmail(account);setEnabled(true);}}
  catch(error){if(mounted.current)onError(error instanceof Error?error.message:'No se pudo conectar tu agenda de Google.');}
  finally{pending.current=false;if(mounted.current)setConnecting(false);}
 }
 return {enabled,connecting,email,toggle,cancel:()=>cancelGoogleContactRequest(uid),reserve:()=>{if(enabled)reservation.current=reserveGoogleContactSave(uid);},release:()=>{closeGoogleContactWindow(reservation.current);reservation.current=undefined;},sync:async(contact:GoogleNexusContact)=>{if(!enabled)return;setConnecting(true);try{await syncContactToGoogle(uid,contact,reservation.current);}finally{reservation.current=undefined;if(mounted.current)setConnecting(false);}}};
}
export default function GoogleContactSync({sync,disabled=false}:{sync:ReturnType<typeof useGoogleContactSync>;disabled?:boolean}){
 const account=auth.currentUser,email=visibleAccountEmail(account);
 if(!email||isGuestIdentity(account))return null;
 return <div className="pcm-google-sync"><label><RefreshCw aria-hidden="true"/><span>Sincronizar con Google<small>Guarda este contacto en tu cuenta de Google.</small></span><input type="checkbox" role="switch" aria-label="Sincronizar con Google" checked={sync.enabled} disabled={disabled||sync.connecting} onChange={()=>void sync.toggle()}/></label>{sync.connecting&&<p role="status">Completa la confirmación en la ventana de Google. <button type="button" onClick={sync.cancel}>Cancelar</button></p>}{sync.enabled&&<label className="pcm-sync-account"><small>Sincronizar con</small><span className="pcm-sync-account-value"><select aria-label="Sincronizar con" value={sync.email||email} disabled={disabled||sync.connecting} onChange={()=>{}}><option value={sync.email||email}>{sync.email||email}</option></select><ChevronDown size={18} aria-hidden="true"/></span></label>}</div>;
}
