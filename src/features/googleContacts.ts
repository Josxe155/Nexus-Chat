import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../firebase';
import config from '../drive-client.json';

export const GOOGLE_CONTACTS_SCOPE='https://www.googleapis.com/auth/contacts';
const PEOPLE='https://people.googleapis.com/v1/';
const FIELDS='names,metadata,clientData,userDefined';
const LINK_KEY='nexusChat.contact.v1';
const NUMBER_KEY='Nexus Chat · número';
const USERNAME_KEY='Nexus Chat · usuario';
type TokenResponse={access_token?:string;expires_in?:number;scope?:string;error?:string};
type Identity={accounts:{oauth2:{initTokenClient:(options:{client_id:string;scope:string;hint?:string;include_granted_scopes:boolean;callback:(response:TokenResponse)=>void;error_callback:()=>void})=>{requestAccessToken:(options:{prompt:string})=>void}}}};
type Connection={uid:string;subject:string;email:string;value:string;expires:number};
type Person={resourceName?:string;etag?:string;metadata?:{deleted?:boolean;sources?:{type:string;id?:string;etag?:string}[]};names?:{givenName?:string;familyName?:string}[];clientData?:{key:string;value:string}[];userDefined?:{key:string;value:string}[]};
export type GoogleNexusContact={uid:string;first:string;last:string;username?:string;phone?:string};
let identity:Promise<Identity>|undefined,connection:Connection|undefined,epoch=0;
let queue:Promise<unknown>=Promise.resolve();
onAuthStateChanged(auth,()=>{epoch++;connection=undefined;});
function active(uid:string){if(auth.currentUser?.uid!==uid)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');}
function connected(uid:string){active(uid);if(!connection||connection.uid!==uid||connection.expires<=Date.now()+10000)throw Error('Vuelve a conectar tus contactos de Google antes de guardar.');return connection;}
export function googleContactsAccount(uid:string){try{return connected(uid).email;}catch{return undefined;}}
export function prepareGoogleContacts(){
 if(identity)return identity;
 identity=new Promise<Identity>((resolve,reject)=>{
  const google=(window as Window&{google?:Identity}).google;if(google?.accounts?.oauth2){resolve(google);return;}
  const element=document.createElement('script');element.src='https://accounts.google.com/gsi/client';element.async=true;
  const fail=()=>{element.remove();identity=undefined;reject(Error('No se pudo preparar la conexión con Google. Revisa tu conexión.'));};
  const timer=setTimeout(fail,20000);
  element.onload=()=>{clearTimeout(timer);const loaded=(window as Window&{google?:Identity}).google;if(loaded?.accounts?.oauth2)resolve(loaded);else fail();};
  element.onerror=()=>{clearTimeout(timer);fail();};document.head.append(element);
 });return identity;
}
async function jsonResponse(response:Response){
 if(!response.ok){
  if(response.status===401)connection=undefined;
  if(response.status===401)throw Error('Vuelve a conectar tus contactos de Google antes de guardar.');
  if(response.status===403)throw Error('Google no permitió acceder a los contactos. Revisa el permiso concedido y la configuración de la aplicación.');
  if(response.status===409||response.status===412||response.status===400)throw Error('No se pudo actualizar el contacto de Google. Revisa sus datos y vuelve a intentarlo.');
  if(response.status===429)throw Error('Se alcanzó el límite temporal de contactos. Espera unos minutos antes de intentarlo.');
  throw Error('No se pudo sincronizar el contacto. Comprueba tu conexión e inténtalo de nuevo.');
 }
 return response.json();
}
export async function connectGoogleContacts(uid:string){
 active(uid);const user=auth.currentUser!;
 if(!user.email||!user.emailVerified)throw Error('Verifica el correo de tu cuenta Nexus antes de conectar los contactos.');
 if(googleContactsAccount(uid))return connection!.email;
 const capturedEpoch=epoch,google=await prepareGoogleContacts();active(uid);
 if(epoch!==capturedEpoch)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
 const candidate=await new Promise<Connection>((resolve,reject)=>{
  let settled=false;
  const fail=(error:Error)=>{if(settled)return;settled=true;clearTimeout(timer);reject(error);};
  const timer=setTimeout(()=>fail(Error('La conexión de contactos caducó. Vuelve a intentarlo.')),120000);
  try{const client=google.accounts.oauth2.initTokenClient({client_id:config.clientId,scope:GOOGLE_CONTACTS_SCOPE+' openid email',hint:user.email!,include_granted_scopes:false,
   callback:async response=>{try{
    active(uid);if(epoch!==capturedEpoch)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
    if(response.error||!response.access_token||!response.scope?.split(' ').includes(GOOGLE_CONTACTS_SCOPE)||!(Number(response.expires_in)>60))throw Error('Autoriza el acceso a tus contactos de Google para sincronizar.');
    const profile=await jsonResponse(await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+response.access_token},redirect:'error',signal:AbortSignal.timeout(30000)}));
    active(uid);if(epoch!==capturedEpoch)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
    const googleId=user.providerData.find(provider=>provider.providerId==='google.com')?.uid;
    if(!profile.sub||!profile.email_verified||typeof profile.email!=='string'||(googleId?profile.sub!==googleId:profile.email.toLowerCase()!==user.email!.toLowerCase()))throw Error('Elige la cuenta de Google asociada al correo de tu sesión de Nexus.');
    if(settled)return;settled=true;clearTimeout(timer);
    resolve({uid,subject:profile.sub,email:profile.email,value:response.access_token!,expires:Date.now()+Math.min(Number(response.expires_in),3600)*1000});
   }catch(error){fail(error instanceof TypeError||error?.name==='TimeoutError'?Error('No se pudo conectar la cuenta de Google. Revisa tu conexión.'):error instanceof Error?error:Error('No se pudo conectar la cuenta de Google.'));}},
   error_callback:()=>fail(Error('Se cerró la conexión de contactos o el navegador bloqueó la ventana. Vuelve a intentarlo.'))});
  client.requestAccessToken({prompt:'consent'});}catch{fail(Error('No se pudo abrir la conexión de contactos de Google.'));}
 });
 active(uid);if(epoch!==capturedEpoch)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
 connection=candidate;
 try{await jsonResponse(await request(uid,'people/me/connections?personFields=metadata&pageSize=1'));}catch(error){if(connection===candidate)connection=undefined;throw error;}
 return candidate.email;
}
async function request(uid:string,path:string,init:RequestInit={}){
 const token=connected(uid),capturedEpoch=epoch;
 if(!/^(people\/me\/connections\?|people:createContact\?|people\/[a-zA-Z0-9_-]+(?:\?|:updateContact\?))/.test(path))throw Error('No se pudo comprobar el destino del contacto.');
 const response=await fetch(PEOPLE+path,{...init,headers:{'Content-Type':'application/json',...init.headers,Authorization:'Bearer '+token.value},redirect:'error',signal:AbortSignal.timeout(30000)});
 active(uid);if(epoch!==capturedEpoch||connection!==token)throw Error('La sesión cambió. Vuelve a conectar tus contactos.');
 return response;
}
function link(person:Person,owner:string,uid:string){return !person.metadata?.deleted&&person.clientData?.some(field=>{try{const value=JSON.parse(field.value);return field.key===LINK_KEY&&value.owner===owner&&value.uid===uid;}catch{return false;}});}
async function findContact(owner:string,uid:string){
 let page='',seen=new Set<string>(),found:Person|undefined;
 do{
  const params=new URLSearchParams({personFields:FIELDS,pageSize:'1000',sources:'READ_SOURCE_TYPE_CONTACT'});if(page)params.set('pageToken',page);
  const data=await jsonResponse(await request(owner,'people/me/connections?'+params));
  if(data.connections!==undefined&&!Array.isArray(data.connections))throw Error('No se pudo leer la agenda completa. No se ha creado otro contacto.');
  for(const person of data.connections||[])if(link(person,owner,uid)){
   if(found&&found.resourceName!==person.resourceName)throw Error('Hay más de un contacto de Google vinculado a esta persona. Revisa los duplicados antes de sincronizar.');found=person;
  }
  page=data.nextPageToken||'';
  if(typeof page!=='string'||seen.has(page)||seen.size>=1000)throw Error('No se pudo leer la agenda completa. Vuelve a intentarlo.');seen.add(page);
 }while(page);
 return found;
}
function resource(person:Person){if(!person.resourceName||!/^people\/[a-zA-Z0-9_-]+$/.test(person.resourceName))throw Error('No se pudo confirmar el contacto guardado en Google.');return person.resourceName;}
function receiptKey(owner:string,uid:string){return 'nexus-google-contact:'+owner+':'+connected(owner).subject+':'+uid;}
function getReceipt(key:string){try{return localStorage.getItem(key);}catch{throw Error('Activa el almacenamiento del navegador para sincronizar contactos sin duplicados.');}}
function setReceipt(key:string,value:string){try{localStorage.setItem(key,value);}catch{throw Error('No se pudo guardar el vínculo de sincronización en este navegador.');}}
async function synchronize(owner:string,contact:GoogleNexusContact){
 active(owner);connected(owner);
 if(!contact.uid||contact.uid.includes('/')||contact.uid.length>128||!contact.first.trim()||contact.first.length>80||contact.last.length>80||[contact.first,contact.last].filter(Boolean).join(' ').length>128)throw Error('Revisa el nombre del contacto antes de sincronizar.');
 if(contact.phone&&!/^\+[1-9]\d{6,14}$/.test(contact.phone))throw Error('Revisa el número de Nexus del contacto.');
 const key=receiptKey(owner,contact.uid),receipt=getReceipt(key);
 if(receipt&&receipt!=='pending'&&!/^people\/[a-zA-Z0-9_-]+$/.test(receipt))throw Error('No se pudo comprobar el vínculo con Google.');
 let person:Person|undefined;
 if(receipt?.startsWith('people/')){
  if(!/^people\/[a-zA-Z0-9_-]+$/.test(receipt))throw Error('No se pudo comprobar el vínculo con Google.');
  const response=await request(owner,receipt+'?personFields='+FIELDS);
  if(response.status!==404){person=await jsonResponse(response);if(!link(person!,owner,contact.uid))throw Error('El contacto de Google ya no tiene el vínculo de Nexus. Revisa su información antes de sincronizar.');}
 }
 if(!person)person=await findContact(owner,contact.uid);
 if(!person&&receipt)throw Error('No se pudo confirmar el guardado anterior en Google. Revisa la agenda y vuelve a intentar más tarde; no se creará otro contacto.');
 const custom=(person?.userDefined||[]).filter(field=>field.key!==NUMBER_KEY&&field.key!==USERNAME_KEY);
 if(contact.phone)custom.push({key:NUMBER_KEY,value:contact.phone});
 if(contact.username)custom.push({key:USERNAME_KEY,value:'@'+contact.username.replace(/^@/,'')});
 const clientData=[...(person?.clientData||[]).filter(field=>field.key!==LINK_KEY),{key:LINK_KEY,value:JSON.stringify({owner,uid:contact.uid})}];
 const body:Person={names:[{givenName:contact.first.trim(),familyName:contact.last.trim()}],userDefined:custom,clientData};
 let response:Response;
 if(person){
  const name=resource(person);if(!person.metadata?.sources?.some(source=>source.type==='CONTACT'&&source.etag))throw Error('No se pudo comprobar la versión del contacto. Vuelve a conectarlo antes de actualizar.');
  body.etag=person.etag;body.metadata=person.metadata;
  response=await request(owner,name+':updateContact?updatePersonFields=names,userDefined,clientData&personFields='+FIELDS,{method:'PATCH',body:JSON.stringify(body)});
 }else{
  // A lost create response must never trigger an automatic second POST.
  setReceipt(key,'pending');
  response=await request(owner,'people:createContact?personFields='+FIELDS,{method:'POST',body:JSON.stringify(body)});
  if(!response.ok&&response.status<500&&response.status!==408){try{localStorage.removeItem(key);}catch{}}
 }
 const result=await jsonResponse(response),name=resource(result);setReceipt(key,name);
 return {resourceName:name,created:!person,email:connected(owner).email};
}
export function syncContactToGoogle(owner:string,contact:GoogleNexusContact){
 const run=async()=>{
  if(navigator.locks)return navigator.locks.request('nexus-google-contacts:'+owner,()=>synchronize(owner,contact));
  throw Error('Actualiza tu navegador para sincronizar contactos de forma segura.');
 };
 const pending=queue.then(run,run).catch(error=>{if(error instanceof TypeError||error?.name==='TimeoutError'||error?.name==='AbortError')throw Error('No se pudo confirmar la sincronización. Revisa tu conexión y vuelve a intentarlo.');throw error;});queue=pending.catch(()=>undefined);return pending;
}
