import {doc,getDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {normalizeContactNumber,type ResolvedContact} from './contactDraft';
export async function resolveRegisteredContact(input:{phone?:unknown;username?:unknown}):Promise<ResolvedContact>{
 const owner=auth.currentUser?.uid;if(!owner)throw Error('Vuelve a iniciar sesión.');
 const raw=typeof input.phone==='string'?input.phone:'',username=typeof input.username==='string'?input.username.trim().replace(/^@/,'').toLowerCase():'';
 if(username&&!/^[a-z0-9_.]{3,32}$/.test(username))throw Error('Revisa el nombre de usuario.');
 if(!raw&&!username)throw Error('Escribe el número de Nexus o el nombre de usuario.');
 let uid='';
 if(raw){const phone=normalizeContactNumber('OTHER',raw);if(phone!==raw)throw Error('El número debe enviarse en formato internacional.');const reservation=await getDoc(doc(db,'nexusNumberReservations',phone.slice(1)));if(!reservation.exists())return {found:false};uid=reservation.data().uid;}
 if(username){const handle=await getDoc(doc(db,'usernames',username));if(!handle.exists()){if(raw)throw Error('El nombre de usuario no corresponde al número indicado.');return {found:false};}if(uid&&uid!==handle.data().uid)throw Error('El nombre de usuario no corresponde al número indicado.');uid=handle.data().uid;}
 if(typeof uid!=='string'||!uid||uid.includes('/'))return {found:false};
 const snapshot=await getDoc(doc(db,'users',uid));if(!snapshot.exists()||snapshot.data().moderationRemoved)return {found:false};
 // Private details stay subject to the contact's visibility rules.
 const [photo,info]=await Promise.all([getDoc(doc(db,'users',uid,'details','photo')).catch(()=>null),getDoc(doc(db,'users',uid,'details','info')).catch(()=>null)]);
 if(auth.currentUser?.uid!==owner)throw Error('La sesión cambió. Vuelve a iniciar sesión.');
 const person=snapshot.data(),bio=info?.data();return {found:true,uid,nombre:person.nombre,username:person.username,foto:typeof photo?.data()?.foto==='string'?photo.data()!.foto:'',bio:bio&&(!bio.expiresAt||bio.expiresAt>Date.now())&&typeof bio.bio==='string'?bio.bio:''};
}
