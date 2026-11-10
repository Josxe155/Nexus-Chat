import {useEffect,useState} from 'react';
import {collection,doc,getDocs,onSnapshot,query,runTransaction,where,writeBatch} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {UserProfile} from '../types';
import {normalizePrivacy,statusAudience} from './privacy';
import {normalizeContactNumber} from './contactDraft';
export type ContactName={first:string;last:string};
export function useContactNames(uid?:string){const [names,setNames]=useState<Record<string,ContactName>>({});useEffect(()=>{setNames({});if(!uid)return;return onSnapshot(doc(db,'users',uid,'private','contacts'),snapshot=>setNames(snapshot.data()?.names||{}),()=>{});},[uid]);return names;}
export async function saveContact(user:UserProfile,person:UserProfile,name:ContactName,phone=''){
 if(!person.uid||person.uid.includes('/')||person.uid.length>128)throw Error('No se pudo comprobar el contacto.');
 const first=name.first.trim(),last=name.last.trim();
 if(!first)throw Error('Escribe un nombre para el contacto.');
 if(first.length>80||last.length>80||[first,last].filter(Boolean).join(' ').length>128)throw Error('El nombre completo admite hasta 128 caracteres.');
 if(phone&&normalizeContactNumber('OTHER',phone)!==phone)throw Error('Revisa el número de Nexus.');
 const active=()=>{if(auth.currentUser?.uid!==user.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');};active();
 const result=await runTransaction(db,async tx=>{
  active();
  const privacyRef=doc(db,'users',user.uid,'private','privacy');
  const [settings,target]=await Promise.all([tx.get(privacyRef),tx.get(doc(db,'users',person.uid))]);
  if(!target.exists()||target.data().moderationRemoved)throw Error('Este contacto ya no está registrado en Nexus Chat.');
  const previous=normalizePrivacy(settings.exists()?settings.data():user.privacy);
  const options={...previous,contactIds:[...new Set([...previous.contactIds,person.uid])]},updatedAt=Date.now();active();
  tx.set(doc(db,'users',user.uid,'private','contacts'),{names:{[person.uid]:{first,last}}},{merge:true});
  if(phone)tx.set(doc(db,'users',user.uid,'private','phone-contacts'),{contacts:{[phone.slice(1)]:{first,last,phone,uid:person.uid,createdAt:updatedAt}}},{merge:true});
  tx.set(privacyRef,settings.exists()?{contactIds:options.contactIds}:options,{merge:true});
  tx.update(doc(db,'users',user.uid),{'privacy.updatedAt':updatedAt});
  return {previous,options,updatedAt};
 });active();
 const audience=statusAudience(result.options);
 if(JSON.stringify(statusAudience(result.previous).sort())!==JSON.stringify([...audience].sort())){
  const statuses=await getDocs(query(collection(db,'statuses'),where('owner','==',user.uid)));
  const activeStatuses=statuses.docs.filter(status=>status.data().expiresAt>Date.now());
  for(let offset=0;offset<activeStatuses.length;offset+=400){active();const batch=writeBatch(db);activeStatuses.slice(offset,offset+400).forEach(status=>batch.update(status.ref,{audienceIds:audience}));await batch.commit();}
 }
 active();return {...user,privacy:{...user.privacy,...result.options,updatedAt:result.updatedAt}};
}

export function useContactNumbers(uid:string){const [numbers,setNumbers]=useState<Record<string,string>>({});useEffect(()=>{setNumbers({});return onSnapshot(doc(db,'users',uid,'private','phone-contacts'),snapshot=>setNumbers(Object.fromEntries(Object.values(snapshot.data()?.contacts||{}).filter((value:any)=>typeof value.uid==='string'&&value.uid&&typeof value.phone==='string').map((value:any)=>[value.uid,value.phone]))),()=>{});},[uid]);return numbers;}
