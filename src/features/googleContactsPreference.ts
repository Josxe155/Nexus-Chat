import {doc,getDoc,setDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {isGuestIdentity} from './guestIdentity';
export type GoogleContactsPreference={schema:1;enabled:boolean;email:string};
const key=(uid:string)=>'nexus-google-contacts-preference:'+uid;
function emailFor(uid:string){const user=auth.currentUser;if(user?.uid!==uid||!user.emailVerified||!user.email||isGuestIdentity(user))throw Error('Vuelve a iniciar sesión con tu correo verificado.');return user.email.toLowerCase();}
export function parseContactsPreference(value:unknown,email:string):GoogleContactsPreference|undefined{
 if(!value||typeof value!=='object'||Array.isArray(value))return;
 const p=value as Partial<GoogleContactsPreference>;
 if(p.schema!==1||typeof p.enabled!=='boolean'||typeof p.email!=='string'||p.email.toLowerCase()!==email.toLowerCase())return;
 return {schema:1,enabled:p.enabled,email:email.toLowerCase()};
}
export function cachedContactsPreference(uid:string){try{return parseContactsPreference(JSON.parse(localStorage.getItem(key(uid))||'null'),emailFor(uid));}catch{return undefined;}}
function cache(uid:string,value:GoogleContactsPreference){try{localStorage.setItem(key(uid),JSON.stringify(value));}catch{/* Firestore remains authoritative; no credentials stored locally. */}}
async function bounded<T>(promise:Promise<T>){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('No se pudo comprobar la configuración guardada.')),5000);})]);}finally{clearTimeout(timer);}}
export async function loadContactsPreference(uid:string){
 const email=emailFor(uid),snapshot=await bounded(getDoc(doc(db,'users',uid,'private','google-contacts')));
 if(emailFor(uid)!==email)throw Error('La cuenta cambió.');
 const value=parseContactsPreference(snapshot.data(),email)||{schema:1 as const,enabled:false,email};cache(uid,value);return value;
}
export async function saveContactsPreference(uid:string,enabled:boolean){
 const email=emailFor(uid),value:GoogleContactsPreference={schema:1,enabled,email};cache(uid,value);
 try{await bounded(setDoc(doc(db,'users',uid,'private','google-contacts'),value));}catch{throw Error('La opción se guardó en este navegador. No se pudo sincronizar la configuración de tu cuenta.');}
 if(emailFor(uid)!==email)throw Error('La cuenta cambió.');
}
