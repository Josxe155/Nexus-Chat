import {useEffect,useRef} from 'react';
import {collection,doc,onSnapshot,orderBy,query,limit} from 'firebase/firestore';
import {db} from '../firebase';
import type {Chat} from '../types';
import type {ConversationState} from './PersonalState';
import {notifyLocal} from './Notifications';
export function useChannelNotifications(uid:string|undefined,chats:Chat[],conversations:Record<string,ConversationState>){
 const preferences=useRef(conversations);preferences.current=conversations;
 const adminChannels=chats.filter(chat=>chat.kind==='channel'&&chat.channelVersion===2&&!chat.channelDeletedAt&&!!uid&&chat.admins?.includes(uid)),ids=adminChannels.map(chat=>chat.id).sort().join('|');
 useEffect(()=>{if(!uid)return;const stops:(()=>void)[]=[];for(const chat of adminChannels){let followerCount:number|undefined;const seen=new Map<string,number>();const notify=(body:string,tag:string)=>{const state=preferences.current[chat.id]||{};if((state.mutedUntil||0)>Date.now()||(state.channelFollowerMutedUntil||0)>Date.now())return;notifyLocal({kind:'channel-activity',category:'messages',reaction:true,title:chat.title||'Canal de Nexus Chat',body,tag,path:'/?chat='+encodeURIComponent(chat.id)});};
 stops.push(onSnapshot(doc(db,'channelDirectory',chat.id),snap=>{const count=snap.data()?.followerCount;if(typeof count==='number'){if(followerCount!==undefined&&count>followerCount)notify('Tu canal tiene nuevos seguidores.','channel-followers:'+chat.id);followerCount=count;}},()=>{}));
 stops.push(onSnapshot(query(collection(db,'chats',chat.id,'messages'),orderBy('timestamp','desc'),limit(50)),snap=>{const available=new Set(snap.docs.map(row=>row.id));for(const id of seen.keys())if(!available.has(id))seen.delete(id);for(const row of snap.docs){const count=Object.values(row.data().reactionCounts||{}).reduce<number>((sum,value)=>sum+(Number(value)||0),0),old=seen.get(row.id);seen.set(row.id,count);if(!snap.metadata.hasPendingWrites&&old!==undefined&&count>old)notify('Hay nuevas reacciones en tu canal.','channel-reactions:'+chat.id+':'+row.id);}},()=>{}));
 }return()=>stops.forEach(stop=>stop());},[uid,ids]);
}
