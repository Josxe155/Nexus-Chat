import {useEffect,useState} from 'react';
import {Fingerprint,LockKeyhole} from 'lucide-react';
import {EmailAuthProvider,GoogleAuthProvider,reauthenticateWithCredential,reauthenticateWithPopup,signOut} from 'firebase/auth';
import {auth} from '../firebase';
import {verifyLocalLock} from './AppLock';
import './application-lock.css';

const changeEvent='nexus:application-lock-changed';
const key=(uid:string)=>'nexus-app-lock-'+uid;
const oldKey=(uid:string)=>'nexus-lock-'+uid;
const random=()=>crypto.getRandomValues(new Uint8Array(32));

export function readApplicationLock(uid:string){
 if(!uid)return null;
 try{
  const credential=localStorage.getItem(key(uid));
  if(credential)return {type:'biometric' as const,credential};
  const legacy=localStorage.getItem(oldKey(uid));
  return legacy?{type:'password' as const,legacy}:null;
 }catch{return null;}
}
function clearLock(uid:string){
 localStorage.removeItem(key(uid));localStorage.removeItem(oldKey(uid));
 window.dispatchEvent(new CustomEvent(changeEvent,{detail:{uid,enabled:false}}));
}
async function enroll(uid:string){
 if(!window.PublicKeyCredential||!navigator.credentials?.create)throw Error('Este navegador no admite el bloqueo biométrico.');
 const user=auth.currentUser;
 if(user?.uid!==uid)throw Error('Vuelve a iniciar sesión.');
 const credential=await navigator.credentials.create({publicKey:{
  challenge:random(),rp:{name:'Nexus Chat'},user:{id:random(),name:user.email||uid,displayName:user.displayName||'Nexus Chat'},
  pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
  authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'discouraged',userVerification:'required'},
  timeout:60000,attestation:'none',
 }}) as PublicKeyCredential|null;
 if(!credential||auth.currentUser?.uid!==uid)throw Error('No se pudo guardar el bloqueo.');
 const encoded=btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
 localStorage.setItem(key(uid),encoded);
 localStorage.removeItem(oldKey(uid));
 window.dispatchEvent(new CustomEvent(changeEvent,{detail:{uid,enabled:true}}));
}
async function verifyBiometric(id:string){
 if(!window.PublicKeyCredential||!navigator.credentials?.get)throw Error('Este navegador no admite el desbloqueo biométrico.');
 const credential=await navigator.credentials.get({publicKey:{
  challenge:random(),allowCredentials:[{type:'public-key',id:Uint8Array.from(atob(id),char=>char.charCodeAt(0))}],
  userVerification:'required',timeout:60000,
 }}) as PublicKeyCredential|null;
 if(!credential)throw Error('No se pudo desbloquear.');
 const response=credential.response as AuthenticatorAssertionResponse;
 const flags=new Uint8Array(response.authenticatorData)[32];
 if(!(flags&4)||btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))!==id)throw Error('El dispositivo no verificó tu identidad.');
}

export function ApplicationLockSettings({uid}:{uid:string}){
 const [lock,setLock]=useState(()=>readApplicationLock(uid)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  const refresh=()=>setLock(readApplicationLock(uid));
  refresh();window.addEventListener(changeEvent,refresh);window.addEventListener('storage',refresh);
  return()=>{window.removeEventListener(changeEvent,refresh);window.removeEventListener('storage',refresh);};
 },[uid]);
 async function change(enabled:boolean){
  if(busy)return;
  setBusy(true);setError('');
  try{if(enabled)await enroll(uid);else clearLock(uid);}
  catch(error){setError(error instanceof DOMException&&error.name==='NotAllowedError'?'No se completó la verificación del dispositivo.':error instanceof Error?error.message:'No se pudo cambiar el bloqueo.');}
  finally{setBusy(false);}
 }
 return <div className="application-lock-setting">
  <label className="phone-setting-toggle">
   <span><strong>{lock?.type==='password'?'Bloqueo anterior con contraseña':'Desbloquear con rasgos biométricos'}</strong>
    <small>Al activarlo, usa tu huella, tu rostro o el método de verificación del dispositivo para abrir Nexus Chat. Puedes contestar llamadas mientras esté bloqueado.</small>
   </span>
   <input type="checkbox" role="switch" checked={!!lock} disabled={busy} onChange={event=>void change(event.target.checked)}/>
  </label>
  {lock?.type==='password'&&<p className="phone-setting-note">Desactiva el bloqueo anterior aquí para configurar el bloqueo biométrico.</p>}
  {busy&&<p role="status">Comprobando el dispositivo…</p>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}

export function ApplicationLockGate({uid,onLock}:{uid:string;onLock:(locked:boolean)=>void}){
 const [locked,setLocked]=useState(()=>readApplicationLock(uid));
 const [password,setPassword]=useState(''),[recover,setRecover]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const current=readApplicationLock(uid);
  setLocked(current);onLock(!!current);
  const changed=(event:Event)=>{
   const detail=(event as CustomEvent<{uid:string;enabled:boolean}>).detail;
   if(detail.uid===uid&&!detail.enabled){setLocked(null);onLock(false);}
  };
  const refresh=(event:StorageEvent)=>{
   if(event.key!==key(uid)&&event.key!==oldKey(uid))return;
   const current=readApplicationLock(uid);
   setLocked(current);onLock(!!current);
  };
  window.addEventListener(changeEvent,changed);window.addEventListener('storage',refresh);
  return()=>{window.removeEventListener(changeEvent,changed);window.removeEventListener('storage',refresh);};
 },[uid,onLock]);
 if(!locked)return null;
 const user=auth.currentUser;
 const google=user?.providerData.some(provider=>provider.providerId==='google.com');
 const email=user?.providerData.some(provider=>provider.providerId==='password')?user.email:null;

 async function run(action:()=>Promise<void>){
  if(busy)return;
  setBusy(true);setError('');
  try{await action();}
  catch{setError(recover?'No se pudo verificar tu cuenta. Revisa la sesión y vuelve a intentarlo.':'No se pudo desbloquear. Intenta otra vez o verifica tu cuenta para restablecer el bloqueo.');}
  finally{setBusy(false);setPassword('');}
 }
 async function unlock(){
  const current=readApplicationLock(uid);
  if(current?.type==='biometric')await verifyBiometric(current.credential);
  if(current?.type==='password'&&!await verifyLocalLock(password,current.legacy))throw Error('Contraseña incorrecta');
  setLocked(null);onLock(false);
  setTimeout(()=>window.dispatchEvent(new Event('nexus:app-unlocked')),0);
 }
 async function restore(method:'google'|'password'){
  if(!user||user.uid!==uid)throw Error('La sesión cambió');
  const credential=method==='google'
   ?await reauthenticateWithPopup(user,new GoogleAuthProvider())
   :await reauthenticateWithCredential(user,EmailAuthProvider.credential(email||'',password));
  if(credential.user.uid!==uid||auth.currentUser?.uid!==uid)throw Error('La sesión cambió');
  clearLock(uid);
  setTimeout(()=>window.dispatchEvent(new Event('nexus:app-unlocked')),0);
 }
 return <div className="feature-backdrop app-lock-backdrop application-lock-gate">
  <section className="feature-dialog contact-editor" role="dialog" aria-modal="true" aria-label="Bloqueo de aplicación">
   <span className="application-lock-mark"><LockKeyhole size={25}/></span><h2>Nexus Chat está bloqueado</h2>
   {recover?<p>Verifica tu cuenta de Nexus para quitar el bloqueo de este navegador.</p>:<p>{locked.type==='biometric'?'Verifica tu identidad con el dispositivo.':'Introduce la contraseña local del bloqueo anterior.'}</p>}
   <form onSubmit={event=>{event.preventDefault();void run(recover?()=>restore('password'):unlock);}}>
    {((!recover&&locked.type==='password')||(recover&&email))&&<label>{recover?'Contraseña de tu cuenta':'Contraseña de bloqueo'}<input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required disabled={busy}/></label>}
    {(!recover||email)&&<button type="submit" disabled={busy}>{!recover&&locked.type==='biometric'&&<Fingerprint size={18}/>} {recover?'Verificar con contraseña':'Desbloquear'}</button>}
   </form>
   {recover&&google&&<button type="button" disabled={busy} onClick={()=>void run(()=>restore('google'))}>Verificar con Google</button>}
   {(google||email)&&<button type="button" className="application-lock-secondary" disabled={busy} onClick={()=>{setRecover(value=>!value);setPassword('');setError('');}}>{recover?'Volver al desbloqueo':'Restablecer con mi cuenta'}</button>}
   {error&&<p role="alert">{error}</p>}
   {busy&&<p role="status">Verificando…</p>}
   <button type="button" className="application-lock-secondary" disabled={busy} onClick={()=>void run(()=>signOut(auth))}>Cerrar sesión</button>
  </section>
 </div>;
}
