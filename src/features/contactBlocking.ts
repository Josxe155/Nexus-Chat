import {useEffect,useState} from 'react';
import {collection,doc,getDocFromServer,getDocs,onSnapshot,query,runTransaction,where,arrayUnion,arrayRemove} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {UserProfile,Message} from '../types';
import {normalizePrivacy,statusAudience} from './privacy';
export type ContactBlockEvent={at:number;blocked:boolean};
export function useContactBlockHistory(uid:string,chatId:string){
 const [value,setValue]=useState<ContactBlockEvent[]>([]);useEffect(()=>{setValue([]);return onSnapshot(doc(db,'users',uid,'private','contact-block-events'),snapshot=>{const events=snapshot.data()?.chats?.[chatId];setValue(Array.isArray(events)?events.filter(event=>typeof event?.at==='number'&&Number.isFinite(event.at)&&typeof event.blocked==='boolean'):[]);},()=>{});},[uid,chatId]);return value;
}
export async function setContactBlocked(user:UserProfile,target:string,blocked:boolean,chatId?:string){
 if(!target||target===user.uid||target.includes('/'))throw Error('Elige otra persona.');
 const active=()=>{if(auth.currentUser?.uid!==user.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');};active();
 const result=await runTransaction(db,async tx=>{
  const settings=doc(db,'users',user.uid,'private','privacy'),history=doc(db,'users',user.uid,'private','contact-block-events');
  const [snapshot,events]=await Promise.all([tx.get(settings),chatId?tx.get(history):Promise.resolve(null)]);active();
  const before=normalizePrivacy(snapshot.exists()?snapshot.data():user.privacy),already=before.blockedIds.includes(target),options={...before,blockedIds:blocked?[...new Set([...before.blockedIds,target])]:before.blockedIds.filter(uid=>uid!==target)},updatedAt=Date.now();
  tx.set(settings,snapshot.exists()?{blockedIds:options.blockedIds}:options,{merge:true});tx.update(doc(db,'users',user.uid),{'privacy.updatedAt':updatedAt});
  if(chatId&&already!==blocked){const old=events?.data()?.chats?.[chatId],list=Array.isArray(old)?old.filter(event=>typeof event?.at==='number'&&typeof event.blocked==='boolean').slice(-29):[];tx.set(history,{chats:{[chatId]:[...list,{at:updatedAt,blocked}]}},{merge:true});}
  return {options,updatedAt};
 });active();
 const rows=await getDocs(query(collection(db,'statuses'),where('owner','==',user.uid)));
 // Re-read policy inside each transaction so simultaneous blocks cannot restore stale audiences.
 for(let offset=0;offset<rows.docs.length;offset+=100){active();await runTransaction(db,async tx=>{
  const settings=await tx.get(doc(db,'users',user.uid,'private','privacy'));
  const policy=normalizePrivacy(settings.data()),include=statusAudience(policy).includes(target),statuses=await Promise.all(rows.docs.slice(offset,offset+100).map(row=>tx.get(row.ref)));active();
  for(const status of statuses)if(status.exists()&&status.data().owner===user.uid&&status.data().expiresAt>Date.now())tx.update(status.ref,{audienceIds:include?arrayUnion(target):arrayRemove(target)});
 });}
 const latest=await getDocFromServer(doc(db,'users',user.uid,'private','privacy'));active();return {...user,privacy:{...user.privacy,...normalizePrivacy(latest.data()||result.options),updatedAt:result.updatedAt}};

}
export function contactBlockTimeline(messages:Message[],events:ContactBlockEvent[],uid:string,chatId:string,clearedAt=0){
 const notices=events.filter(event=>event.at>clearedAt).map((event,index)=>({id:'private-block:'+event.at+':'+index,chatId,senderId:uid,content:'',type:'text' as const,timestamp:event.at,status:'sent' as const,privateBlockNotice:event}));
 return [...messages,...notices].sort((a,b)=>a.timestamp-b.timestamp) as (Message&{privateBlockNotice?:ContactBlockEvent})[];
}
