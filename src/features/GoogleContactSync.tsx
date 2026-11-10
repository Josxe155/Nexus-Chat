import {useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import {connectGoogleContacts,prepareGoogleContacts,syncContactToGoogle,type GoogleNexusContact} from './googleContacts';
export function useGoogleContactSync(uid:string,onError:(message:string)=>void){
 const [enabled,setEnabled]=useState(false),[connecting,setConnecting]=useState(false),[email,setEmail]=useState('');
 const mounted=useRef(true),pending=useRef(false);
 useEffect(()=>{mounted.current=true;void prepareGoogleContacts().catch(()=>{});return()=>{mounted.current=false;};},[]);
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
 return <div className="pcm-google-sync"><label><RefreshCw aria-hidden="true"/><span>Sincronizar con Google<small>Guarda este contacto en tu cuenta de Google. El número de Nexus se guardará como información de Nexus Chat.</small></span><input type="checkbox" role="switch" aria-label="Sincronizar con Google" checked={sync.enabled} disabled={disabled||sync.connecting} onChange={()=>void sync.toggle()}/></label>{sync.connecting&&<p role="status">Conectando con Google…</p>}{sync.enabled&&<p><small>Sincronizar con</small><span>{sync.email}</span></p>}</div>;
}
