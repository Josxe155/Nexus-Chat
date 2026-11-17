import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../firebase';
import {isGuestIdentity} from './guestIdentity';
import type {GoogleNexusContact} from './googleContacts';
export type {GoogleNexusContact};
export const CONTACTS_SCRIPT_URL='https://script.google.com/macros/s/AKfycbxWlEBOLpct55599Ucn1VCy4e5OP_YXdvZrw2lIiHWdfjvhHpodIHnlP7rgWqYzRvuvcQ/exec';
const PROTOCOL='nexus-contacts-bridge-v1';
const PREFIX='nexus-contact-request:',RESULT='nexus-contact-result:';
type Result={protocol:string;state:string;operation:'connect'|'save';ok:boolean;email?:string;created?:boolean};
export type ContactWindow={popup:Window;name:string;owner:string};
let connection:{uid:string;email:string}|undefined;
let pending:{owner:string;cancel:()=>void}|undefined;
function account(uid:string){
 const user=auth.currentUser;
 if(user?.uid!==uid||!user.email||!user.emailVerified||isGuestIdentity(user))throw Error('Inicia sesión con tu correo verificado antes de sincronizar contactos.');
 return user.email.toLowerCase();
}
onAuthStateChanged(auth,()=>{connection=undefined;pending?.cancel();});
export function cancelGoogleContactRequest(owner:string){if(pending?.owner===owner)pending.cancel();}
export function clearExpiredContactRequests(){
 try{
  for(let i=localStorage.length-1;i>=0;i--){
   const key=localStorage.key(i);if(!key)continue;
   if(key.startsWith(PREFIX)){
    let valid=false;try{const request=JSON.parse(localStorage.getItem(key)||'null');valid=request&&Number.isFinite(request.expires)&&request.expires>Date.now()&&request.expires<=Date.now()+301000;}catch{/* Invalid request. */}
    if(!valid){localStorage.removeItem(RESULT+key.slice(PREFIX.length));localStorage.removeItem(key);}
   }else if(key.startsWith(RESULT)&&!localStorage.getItem(PREFIX+key.slice(RESULT.length)))localStorage.removeItem(key);
  }
 }catch{/* Storage availability is checked before starting an operation. */}
}
window.addEventListener('pagehide',()=>pending?.cancel());
clearExpiredContactRequests();
export function reserveGoogleContactWindow(owner:string):ContactWindow{
 account(owner);clearExpiredContactRequests();
 if(location.origin!=='https://nexus-chat-nc.web.app')throw Error('Abre Nexus Chat desde su dirección principal para sincronizar contactos.');
 const name='nexus-contacts-'+crypto.randomUUID();
 const popup=window.open('about:blank',name,'popup,width=480,height=720');
 if(!popup)throw Error('Permite las ventanas emergentes de Nexus Chat para conectar tus contactos.');
 // The return uses same-origin storage; no opener access or credentials are needed.
 popup.opener=null;
 popup.document.title='Contactos · Nexus Chat';
 popup.document.body.textContent='Preparando la conexión con Google…';
 return {popup,name,owner};
}
export function closeGoogleContactWindow(reservation?:ContactWindow){try{reservation?.popup.close();}catch{/* Already closed or isolated by Google sign-in. */}}
function exchange(owner:string,operation:'connect'|'save',reservation:ContactWindow,contact?:GoogleNexusContact){
 const email=account(owner);
 if(reservation.popup.closed)throw Error('Se cerró la ventana de Google. Vuelve a pulsar Guardar.');
 if(pending||reservation.owner!==owner){closeGoogleContactWindow(reservation);throw Error('Termina la conexión de contactos anterior antes de continuar.');}
 const state=crypto.randomUUID(),requestKey=PREFIX+state,resultKey=RESULT+state;
 const duration=operation==='connect'?120000:300000,expires=Date.now()+duration;
 try{localStorage.setItem(requestKey,JSON.stringify({operation,expires}));}catch{closeGoogleContactWindow(reservation);throw Error('Permite el almacenamiento del sitio para conectar tus contactos.');}
 return new Promise<Result>((resolve,reject)=>{
  let finished=false;let poll:ReturnType<typeof setInterval>|undefined,timeout:ReturnType<typeof setTimeout>|undefined;
  const finish=(result?:Result,error?:Error)=>{
   if(finished)return;finished=true;clearInterval(poll);clearTimeout(timeout);window.removeEventListener('storage',check);
   if(pending?.cancel===cancel)pending=undefined;
   try{localStorage.removeItem(requestKey);localStorage.removeItem(resultKey);}catch{/* No credentials stored. */}
   closeGoogleContactWindow(reservation);
   if(error)reject(error);else resolve(result!);
  };
  const cancel=()=>finish(undefined,Error('Se canceló la conexión con Google. El contacto de Nexus se conserva si ya lo guardaste.'));
  const check=()=>{
   if(finished)return;
   try{
    if(account(owner)!==email)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
    const raw=localStorage.getItem(resultKey);if(!raw)return;
    if(raw.length>2048)throw Error('No se pudo comprobar la respuesta de Google.');
    const data=JSON.parse(raw) as Result;
    if(data.protocol!==PROTOCOL||data.state!==state||data.operation!==operation||typeof data.ok!=='boolean')throw Error('No se pudo comprobar la respuesta de Google.');
    if(!data.ok)throw Error('Google no confirmó la operación. Revisa tu cuenta y el permiso de contactos.');
    if(typeof data.email!=='string'||data.email.toLowerCase()!==email)throw Error('Elige la cuenta de Google que corresponde al correo de tu sesión de Nexus.');
    if(operation==='save'&&typeof data.created!=='boolean')throw Error('No se pudo confirmar el guardado del contacto.');
    finish(data);
   }catch(error){finish(undefined,error instanceof Error?error:Error('No se pudo comprobar la conexión con Google.'));}
  };
  pending={owner,cancel};window.addEventListener('storage',check);poll=setInterval(check,500);
  timeout=setTimeout(()=>finish(undefined,Error('La conexión caducó. Vuelve a intentarlo y completa la confirmación en la ventana de Google.')),duration);
  try{
   if(operation==='connect'){
    const url=new URL(CONTACTS_SCRIPT_URL);url.search=new URLSearchParams({mode:'connect',state,origin:location.origin}).toString();
    reservation.popup.location.replace(url.href);
   }else{
    // A normal POST navigation works without cross-origin fetch/cookies or JSONP.
    const form=document.createElement('form');form.method='POST';form.action=CONTACTS_SCRIPT_URL;form.target=reservation.name;form.hidden=true;
    for(const [name,value] of Object.entries({contact:JSON.stringify({...contact,owner,email}),state,origin:location.origin})){
     const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.append(input);
    }
    document.body.append(form);try{form.submit();}finally{form.remove();}
   }
  }catch{finish(undefined,Error('No se pudo abrir la conexión de Google. Vuelve a intentarlo.'));}
 });
}
export async function connectGoogleContacts(owner:string){
 const reservation=reserveGoogleContactWindow(owner);
 const result=await exchange(owner,'connect',reservation);
 account(owner);connection={uid:owner,email:result.email!.toLowerCase()};return connection.email;
}
export function reserveGoogleContactSave(owner:string){
 if(!connection||connection.uid!==owner||connection.email!==account(owner))throw Error('Vuelve a conectar tus contactos de Google antes de guardar.');
 return reserveGoogleContactWindow(owner);
}
export async function syncContactToGoogle(owner:string,contact:GoogleNexusContact,reservation?:ContactWindow){
 if(!reservation)throw Error('Vuelve a pulsar Guardar para abrir la confirmación de Google.');
 if(!connection||connection.uid!==owner||connection.email!==account(owner)){closeGoogleContactWindow(reservation);throw Error('Vuelve a conectar tus contactos de Google antes de guardar.');}
 try{
  if(!contact.uid||!contact.first?.trim()||contact.first.length>80||contact.last.length>80||[contact.first,contact.last].filter(Boolean).join(' ').length>128)throw Error('Revisa el nombre del contacto antes de sincronizar.');
  if(contact.phone&&!/^\+[1-9]\d{6,14}$/.test(contact.phone))throw Error('Revisa el número de Nexus del contacto.');
  const result=await exchange(owner,'save',reservation,contact);return {created:result.created,email:result.email};
 }catch(error){closeGoogleContactWindow(reservation);throw error;}
}
