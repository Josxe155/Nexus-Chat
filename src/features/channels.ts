import {useEffect,useState} from 'react';
import {collection,doc,getDocFromServer,getDocs,onSnapshot,query,runTransaction,serverTimestamp,where,writeBatch} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {Chat} from '../types';
import {canChannelReact,channelKey,channelOwner,validateChannelInfo,type ChannelReactionMode} from './channelModel';
function active(uid:string){if(auth.currentUser?.uid!==uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');}
export async function createChannel(uid:string,id:string,title:string,description:string){
 active(uid);channelKey(id,uid);const info=validateChannelInfo(title,description),createdAt=Date.now();
 await runTransaction(db,async tx=>{const own=await tx.get(doc(db,'users',uid,'private','channel-drafts'));const ids=own.data()?.ids||[];if(ids.includes(id))return;
  tx.set(doc(db,'chats',id),{id,...info,kind:'channel',createdBy:uid,channelVersion:2,channelReactionMode:'all',participants:[uid],admins:[uid],sendPolicy:'admins',createdAt,unreadCount:{}});
  tx.set(doc(db,'channelDirectory',id),{...info,owner:uid,createdAt,channelVersion:2,followerCount:0});
  tx.set(doc(db,'users',uid,'private','channel-drafts'),{ids:[...ids.slice(-99),id]},{merge:true});
 });active(uid);return id;
}
export async function upgradeChannel(uid:string,id:string){
 active(uid);await runTransaction(db,async tx=>{const roomRef=doc(db,'chats',id),dirRef=doc(db,'channelDirectory',id),room=await tx.get(roomRef),directory=await tx.get(dirRef);const chat=room.data() as Chat|undefined;if(!chat||chat.kind!=='channel')throw Error('Este canal ya no está disponible.');if(chat.channelVersion===2)return;if(directory.data()?.owner!==uid||channelOwner(chat)!==uid)throw Error('Solo el propietario puede actualizar este canal.');
  const admins=chat.admins||[uid],followers=chat.participants.filter(person=>!admins.includes(person));
  for(const person of followers)tx.set(doc(db,'channelFollowers',channelKey(id,person)),{channelId:id,uid:person,joinedAt:Date.now()});
  tx.update(roomRef,{channelVersion:2,participants:admins});tx.set(dirRef,{...directory.data(),title:chat.title,description:chat.description||'',photoURL:chat.photoURL||'',channelVersion:2,followerCount:followers.length});
 });active(uid);
}
export async function followChannel(uid:string,id:string){
 active(uid);channelKey(id,uid);
 await runTransaction(db,async tx=>{const dir=doc(db,'channelDirectory',id),follow=doc(db,'channelFollowers',channelKey(id,uid));const directory=await tx.get(dir),following=await tx.get(follow),preferencesRef=doc(db,'users',uid,'conversations',id),preferences=await tx.get(preferencesRef);const data=directory.data();if(!data)throw Error('Este canal ya no está disponible.');
  if(data.channelVersion!==2)throw Error('El propietario debe actualizar este canal antes de aceptar nuevos seguidores.');
  if(data.owner===uid||following.exists())return;active(uid);tx.set(follow,{channelId:id,uid,joinedAt:Date.now()});tx.update(dir,{followerCount:(data.followerCount||0)+1});if(preferences.data()?.channelAdminMutedUntil===undefined)tx.set(preferencesRef,{channelAdminMutedUntil:Date.now()+100*365*86400000},{merge:true});
 });active(uid);
}
export async function unfollowChannel(uid:string,id:string){
 active(uid);await runTransaction(db,async tx=>{const dirRef=doc(db,'channelDirectory',id),follower=doc(db,'channelFollowers',channelKey(id,uid));const dir=await tx.get(dirRef),current=await tx.get(follower);if(!current.exists())return;tx.delete(follower);if(dir.exists())tx.update(dirRef,{followerCount:Math.max(0,(dir.data()?.followerCount||0)-1)});});active(uid);
}
export async function editChannel(uid:string,id:string,title:string,description:string,photoURL?:string){active(uid);const info=validateChannelInfo(title,description);const batch=writeBatch(db),patch={...info,...(photoURL!==undefined?{photoURL}:{})};batch.update(doc(db,'chats',id),patch);batch.update(doc(db,'channelDirectory',id),patch);await batch.commit();active(uid);}
export async function setChannelReactions(uid:string,id:string,mode:ChannelReactionMode){active(uid);if(!['all','preset','none'].includes(mode))throw Error('Revisa las reacciones del canal.');await runTransaction(db,async tx=>{const ref=doc(db,'chats',id),room=await tx.get(ref);if(room.data()?.channelDeletedAt)throw Error('El canal fue eliminado.');tx.update(ref,{channelReactionMode:mode});});}
export async function transferChannel(uid:string,id:string,target:string){
 active(uid);if(uid===target)throw Error('Elige otro administrador.');await runTransaction(db,async tx=>{const roomRef=doc(db,'chats',id),directory=doc(db,'channelDirectory',id);const room=await tx.get(roomRef),dir=await tx.get(directory);const chat=room.data() as Chat|undefined;if(!chat||channelOwner(chat)!==uid||dir.data()?.owner!==uid)throw Error('Solo el propietario puede transferir este canal.');if(!chat.admins?.includes(target))throw Error('La persona debe aceptar primero la invitación para ser administradora.');tx.update(roomRef,{createdBy:target});tx.update(directory,{owner:target});});active(uid);
}
export async function deleteChannel(uid:string,id:string){active(uid);await runTransaction(db,async tx=>{const ref=doc(db,'chats',id),directory=doc(db,'channelDirectory',id),room=await tx.get(ref);if(!room.exists()||channelOwner(room.data() as Chat)!==uid)throw Error('Solo el propietario puede eliminar este canal.');if(room.data().channelDeletedAt)return;tx.update(ref,{channelDeletedAt:Date.now()});tx.delete(directory);});active(uid);}
export async function inviteChannelAdmins(uid:string,id:string,targets:string[]){
 active(uid);const ids=[...new Set(targets)];if(!ids.length||ids.length>16||ids.includes(uid))throw Error('Elige entre 1 y 16 contactos.');
 await runTransaction(db,async tx=>{const room=await tx.get(doc(db,'chats',id));const chat=room.data() as Chat|undefined;if(!chat||channelOwner(chat)!==uid||chat.channelDeletedAt)throw Error('Solo el propietario puede invitar administradores.');if((chat.admins?.length||1)+ids.length>17)throw Error('El canal admite hasta 16 administradores además del propietario.');
  const refs=ids.map(target=>doc(db,'channelAdminInvites',channelKey(id,target))),old=await Promise.all(refs.map(ref=>tx.get(ref)));
  ids.forEach((target,index)=>{channelKey(id,target);if(chat.admins?.includes(target))return;if(old[index].data()?.status==='pending'&&old[index].data()?.expiresAt>Date.now())return;tx.set(refs[index],{channelId:id,target,actor:uid,title:chat.title||'Canal',createdAt:Date.now(),expiresAt:Date.now()+7*86400000,status:'pending'});});
 });active(uid);
}
export async function respondChannelInvite(uid:string,id:string,accept:boolean){
 active(uid);await runTransaction(db,async tx=>{const inviteRef=doc(db,'channelAdminInvites',channelKey(id,uid)),invite=await tx.get(inviteRef),roomRef=doc(db,'chats',id),room=await tx.get(roomRef);const data=invite.data(),chat=room.data() as Chat|undefined;if(!data||data.target!==uid||data.status!=='pending'||data.expiresAt<=Date.now()||!chat||chat.channelDeletedAt||channelOwner(chat)!==data.actor)throw Error('La invitación ya no está disponible.');if(accept){if((chat.admins?.length||0)>=17)throw Error('El canal ya tiene todos sus administradores.');tx.update(roomRef,{participants:[...new Set([...chat.participants,uid])],admins:[...new Set([...(chat.admins||[]),uid])]});}tx.update(inviteRef,{status:accept?'accepted':'declined'});});active(uid);
}
export function useFollowedChannels(uid?:string){
 const [state,setState]=useState<{uid?:string;rooms:Record<string,Chat>;counts:Record<string,number>}>({rooms:{},counts:{}});
 useEffect(()=>{if(!uid){setState({rooms:{},counts:{}});return;}let live=true;const rooms=new Map<string,()=>void>(),counts=new Map<string,()=>void>();
  const stop=onSnapshot(query(collection(db,'channelFollowers'),where('uid','==',uid)),snapshot=>{const ids=new Set(snapshot.docs.map(doc=>String(doc.data().channelId)));for(const [id,close] of rooms)if(!ids.has(id)){close();rooms.delete(id);counts.get(id)?.();counts.delete(id);setState(old=>({...old,rooms:Object.fromEntries(Object.entries(old.rooms).filter(([key])=>key!==id))}));}
   for(const id of ids)if(!rooms.has(id)){rooms.set(id,onSnapshot(doc(db,'chats',id),snap=>{if(live&&snap.exists())setState(old=>({uid,rooms:{...(old.uid===uid?old.rooms:{}),[id]:{...snap.data(),id} as Chat},counts:old.uid===uid?old.counts:{}}));},()=>{}));counts.set(id,onSnapshot(doc(db,'channelDirectory',id),snap=>{if(live)setState(old=>({...old,counts:{...old.counts,[id]:snap.data()?.followerCount||0}}));},()=>{}));}
  },()=>{});return()=>{live=false;stop();rooms.forEach(close=>close());counts.forEach(close=>close());};
 },[uid]);
 return state.uid===uid?Object.values(state.rooms).map(chat=>({...chat,followerCount:state.counts[chat.id]||0})):[];
}
export async function readChannel(id:string){channelKey(id,'read');const snap=await getDocFromServer(doc(db,'channelDirectory',id));if(!snap.exists())throw Error('Este canal ya no está disponible.');return {id,...snap.data()} as {id:string;title:string;owner:string;description?:string;photoURL?:string;followerCount?:number;channelVersion?:number};}
export async function setChannelReaction(uid:string,id:string,messageId:string,emoji:string){
 active(uid);if(!messageId||messageId.includes('/')||!emoji||emoji.length>32)throw Error('Elige una reacción válida.');
 await runTransaction(db,async tx=>{const roomRef=doc(db,'chats',id),message=doc(db,'chats',id,'messages',messageId),own=doc(db,'chats',id,'channelReactions',uid,'messages',messageId);const [room,content,previous]=await Promise.all([tx.get(roomRef),tx.get(message),tx.get(own)]);const chat=room.data() as Chat|undefined;if(!chat||chat.channelVersion!==2||chat.channelDeletedAt||!content.exists())throw Error('La actualización ya no está disponible.');const before=previous.data()?.emoji||'',next=before===emoji?'':emoji;if(!canChannelReact(chat,next))throw Error('Esta reacción no está permitida en el canal.');const counts={...(content.data()?.reactionCounts||{})};if(before){counts[before]=Math.max(0,(counts[before]||0)-1);if(!counts[before])delete counts[before];}if(next)counts[next]=(counts[next]||0)+1;active(uid);tx.set(own,{emoji:next,at:serverTimestamp()});tx.update(message,{reactionCounts:counts});
 });active(uid);
}
export function useChannelReactions(uid:string,id:string,enabled:boolean){const [value,setValue]=useState<Record<string,string>>({});useEffect(()=>{setValue({});if(!enabled)return;return onSnapshot(collection(db,'chats',id,'channelReactions',uid,'messages'),snap=>setValue(Object.fromEntries(snap.docs.map(row=>[row.id,row.data().emoji||'']))),()=>{});},[uid,id,enabled]);return value;}
export function useChannelFollowerCount(chat:Chat){const [state,setState]=useState<{id:string;count:number}>();useEffect(()=>{if(chat.kind!=='channel')return;return onSnapshot(doc(db,'channelDirectory',chat.id),snap=>{if(snap.exists())setState({id:chat.id,count:snap.data().followerCount??chat.participants.filter(uid=>!chat.admins?.includes(uid)).length});},()=>{});},[chat.id,chat.kind]);return state?.id===chat.id?state.count:chat.followerCount??chat.participants.filter(uid=>!chat.admins?.includes(uid)).length;}
export async function dismissChannelAdmin(uid:string,id:string,target:string){active(uid);await runTransaction(db,async tx=>{const roomRef=doc(db,'chats',id),directory=doc(db,'channelDirectory',id),follow=doc(db,'channelFollowers',channelKey(id,target)),[room,dir,following]=await Promise.all([tx.get(roomRef),tx.get(directory),tx.get(follow)]),chat=room.data() as Chat|undefined;if(!chat||chat.channelDeletedAt||chat.channelVersion!==2||!chat.admins?.includes(target)||channelOwner(chat)===target||uid!==target&&channelOwner(chat)!==uid)throw Error('No puedes descartar a esta persona como administradora.');active(uid);tx.update(roomRef,{admins:chat.admins.filter(person=>person!==target),participants:chat.participants.filter(person=>person!==target)});if(!following.exists()){tx.set(follow,{channelId:id,uid:target,joinedAt:Date.now()});tx.update(directory,{followerCount:(dir.data()?.followerCount||0)+1});}});active(uid);}
export async function revokeChannelInvite(uid:string,id:string,target:string){active(uid);await runTransaction(db,async tx=>{const room=await tx.get(doc(db,'chats',id)),inviteRef=doc(db,'channelAdminInvites',channelKey(id,target)),invite=await tx.get(inviteRef);if(!room.exists()||channelOwner(room.data() as Chat)!==uid||invite.data()?.status!=='pending')throw Error('La invitación ya no está disponible.');tx.update(inviteRef,{status:'cancelled'});});active(uid);}
