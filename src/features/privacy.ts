import {useEffect,useState,useRef} from 'react';import {doc,onSnapshot,writeBatch,getDoc,getDocs,collection,query,where} from 'firebase/firestore';import {db} from '../firebase';import type {UserProfile,Chat} from '../types';
import {arrayRemove,arrayUnion,setDoc} from 'firebase/firestore';
export type Audience='everyone'|'contacts'|'except'|'nobody';
export type PrivacyOptions={lastSeenAudience:Audience;onlineAudience:'everyone'|'lastSeen';photoAudience:Audience;infoAudience:Audience;statusAudience:'contacts'|'except'|'only';contactIds:string[];lastSeenExcluded:string[];photoExcluded:string[];infoExcluded:string[];statusExcluded:string[];statusIncluded:string[];blockedIds:string[];groupAudience:Audience;groupExcluded:string[];silenceUnknown:boolean;readReceipts:boolean;relayCalls:boolean;disableLinkPreviews:boolean};
export const PRIVACY_DEFAULTS:PrivacyOptions={lastSeenAudience:'everyone',onlineAudience:'everyone',photoAudience:'everyone',infoAudience:'everyone',statusAudience:'contacts',contactIds:[],lastSeenExcluded:[],photoExcluded:[],infoExcluded:[],statusExcluded:[],statusIncluded:[],blockedIds:[],groupAudience:'everyone',groupExcluded:[],silenceUnknown:false,readReceipts:true,relayCalls:false,disableLinkPreviews:true};
export function normalizePrivacy(value:any={},chats:Chat[]=[],uid=''):PrivacyOptions{value=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return {...PRIVACY_DEFAULTS,...(value.hideLastSeen?{lastSeenAudience:'nobody'}:{}),...(value.hideOnline?{onlineAudience:'lastSeen',lastSeenAudience:'nobody'}:{}),...(value.hidePhoto?{photoAudience:'nobody'}:{}),...(value.hideBio?{infoAudience:'nobody'}:{}),...value,contactIds:Array.isArray(value.contactIds)?value.contactIds:[...new Set(chats.filter(chat=>!chat.kind||chat.kind==='direct').flatMap(chat=>chat.participants.filter(person=>person!==uid)))]};}
export function audienceContains(mode:Audience|'only',owner:string,viewer:string,contacts:string[],excluded:string[]=[],included:string[]=[]){if(owner===viewer)return true;return mode==='everyone'||mode==='only'&&included.includes(viewer)||(mode==='contacts'||mode==='except')&&contacts.includes(viewer)&&!(mode==='except'&&excluded.includes(viewer));}
export function presencePolicy(value:any){const p=normalizePrivacy(value);return {lastSeenAudience:p.lastSeenAudience,onlineAudience:p.onlineAudience,contacts:Object.fromEntries(p.contactIds.map(uid=>[uid,true])),blocked:Object.fromEntries(p.blockedIds.map(uid=>[uid,true])),lastSeenExcluded:Object.fromEntries(p.lastSeenExcluded.map(uid=>[uid,true])),hideOnline:p.onlineAudience==='lastSeen'&&p.lastSeenAudience==='nobody',hideLastSeen:p.lastSeenAudience==='nobody'};}
export async function savePrivacy(user:UserProfile,options:PrivacyOptions){const batch=writeBatch(db),updatedAt=Date.now();batch.set(doc(db,'users',user.uid,'private','profile'),{nombre:user.nombre,username:user.username,foto:user.foto,bio:user.bio,bioExpiresAt:user.bioExpiresAt||0},{merge:true});batch.set(doc(db,'users',user.uid,'private','privacy'),options,{merge:true});batch.set(doc(db,'users',user.uid,'details','photo'),{foto:user.foto});batch.set(doc(db,'users',user.uid,'details','info'),{bio:user.bio,expiresAt:user.bioExpiresAt||0});batch.update(doc(db,'users',user.uid),{foto:'',bio:'',online:false,lastSeen:0,privacy:{schemaVersion:2,hideOnline:false,hideLastSeen:false,hidePhoto:false,hideBio:false,readReceipts:options.readReceipts,silenceUnknown:options.silenceUnknown,updatedAt}});await batch.commit();if(user.privacy?.schemaVersion!==2||JSON.stringify(statusAudience(normalizePrivacy(user.privacy)).sort())!==JSON.stringify(statusAudience(options).sort())){const statuses=await getDocs(query(collection(db,'statuses'),where('owner','==',user.uid)));for(let offset=0;offset<statuses.docs.length;offset+=400){const next=writeBatch(db);statuses.docs.slice(offset,offset+400).filter(status=>status.data().expiresAt>Date.now()).forEach(status=>next.update(status.ref,{audienceIds:statusAudience(options)}));await next.commit();}}return {...user,privacy:{...options,schemaVersion:2,updatedAt}};}
export async function migrateOwnProfile(user:UserProfile,alreadyMigrated=false){if(alreadyMigrated)return user;const ref=doc(db,'users',user.uid,'private','privacy'),snapshot=await getDoc(ref);const options=normalizePrivacy(snapshot.exists()?snapshot.data():user.privacy);if(user.privacy?.schemaVersion===2&&snapshot.exists())return {...user,privacy:{...options,schemaVersion:2}};return savePrivacy(user,options);}
export async function blockContact(uid:string,contactId:string){
 await setDoc(doc(db,'users',uid,'private','privacy'),{blockedIds:arrayUnion(contactId)},{merge:true});
 const statuses=await getDocs(query(collection(db,'statuses'),where('owner','==',uid)));
 const shared=statuses.docs.filter(status=>status.data().expiresAt>Date.now()&&status.data().audienceIds?.includes(contactId));
 for(let offset=0;offset<shared.length;offset+=400){
  const batch=writeBatch(db);
  for(const status of shared.slice(offset,offset+400))batch.update(status.ref,{audienceIds:arrayRemove(contactId)});
  await batch.commit();
 }
}
export function useAccessibleProfiles(users:UserProfile[],uid:string,ownPrivacy?:any){
 type Detail={scope:string;value:string;expiresAt?:number};
 const [details,setDetails]=useState<Record<string,{photo?:Detail;info?:Detail}>>({}),subscriptions=useRef(new Map<string,{scope:string;stop:()=>void}>());
 const revision=users.map(user=>user.uid+':'+(user.privacy?.updatedAt||0)).join('|'),viewer=uid+':'+JSON.stringify(ownPrivacy?.blockedIds||[]);
 const signature=(user:UserProfile,kind:string)=>viewer+':'+user.uid+':'+(user.privacy?.updatedAt||0)+':'+kind;
 useEffect(()=>()=>{subscriptions.current.forEach(entry=>entry.stop());subscriptions.current.clear();},[]);
 useEffect(()=>{const wanted=new Set<string>();for(const user of users)for(const [kind,field]of [['photo','foto'],['info','bio']]){const key=user.uid+':'+kind,scope=signature(user,kind);wanted.add(key);const existing=subscriptions.current.get(key);if(existing?.scope===scope)continue;existing?.stop();const store=(value:string,expiresAt?:number)=>setDetails(previous=>({...previous,[user.uid]:{...previous[user.uid],[kind]:{scope,value,expiresAt}}}));const stop=onSnapshot(doc(db,'users',user.uid,'details',kind),snapshot=>{const data=snapshot.data(),value=data?.[field];store(typeof value==='string'?value:'',kind==='info'?Number(data?.expiresAt)||0:0);},()=>store(''));subscriptions.current.set(key,{scope,stop});}for(const [key,entry]of subscriptions.current)if(!wanted.has(key)){entry.stop();subscriptions.current.delete(key);}},[viewer,revision]);
 const now=Date.now(),[,refresh]=useState(0);
 useEffect(()=>{
  const expires=Object.values(details).reduce((next,value)=>{
   const time=value.info?.expiresAt||0;
   return time>now?Math.min(time,next):next;
  },Infinity);
  if(!Number.isFinite(expires))return;
  const timer=setTimeout(()=>refresh(previous=>previous+1),Math.max(0,Math.min(2147483647,expires-Date.now())));
  return()=>clearTimeout(timer);
 },[details,now]);
 return users.map(user=>{
  const value=details[user.uid],info=value?.info;
  return {...user,...(value?.photo?.scope===signature(user,'photo')?{foto:value.photo.value}:{}),
   ...(info?.scope===signature(user,'info')?{bio:!info.expiresAt||info.expiresAt>now?info.value:''}:{})};
 });
}

export function statusAudience(p:PrivacyOptions){return p.contactIds.filter(uid=>!p.blockedIds.includes(uid)&&(p.statusAudience!=='except'||!p.statusExcluded.includes(uid))&&(p.statusAudience!=='only'||p.statusIncluded.includes(uid))).slice(0,500);}
