import {dataErrorMessage} from './dataErrors';
import React,{createContext,useContext,useEffect,useState} from 'react';
import {collection,doc,onSnapshot,setDoc,writeBatch,runTransaction} from 'firebase/firestore';
import {db} from '../firebase';import type {Chat,Message} from '../types';
export type ConversationState={clearedAt?:number;deletedAt?:number;mutedUntil?:number;channelAdminMutedUntil?:number;channelFollowerMutedUntil?:number;unread?:boolean;favorite?:boolean};
export type MessageFlag={chatId:string;messageId:string;hidden?:boolean;starred?:boolean;updatedAt:number};
export const flagId=(chatId:string,messageId:string)=>chatId+'~'+messageId;
type Personal={conversations:Record<string,ConversationState>;flags:Record<string,MessageFlag>;loaded:boolean;error?:string};
export const PersonalContext=createContext<Personal>({conversations:{},flags:{},loaded:false});
export const usePersonal=()=>useContext(PersonalContext);
export function usePersonalState(uid?:string){
 const [state,setState]=useState<Personal&{owner?:string}>({conversations:{},flags:{},loaded:false});
 useEffect(()=>{let active=true;setState({owner:uid,conversations:{},flags:{},loaded:false});if(!uid)return;let conversationsReady=false,flagsReady=false;const fail=(error:unknown)=>{if(active)setState(previous=>({...previous,error:dataErrorMessage(error)}));};
 const stops=[onSnapshot(collection(db,'users',uid,'conversations'),snapshot=>{if(!active)return;conversationsReady=true;setState(previous=>({...previous,owner:uid,loaded:flagsReady,conversations:Object.fromEntries(snapshot.docs.map(item=>[item.id,item.data()]))}));},fail),onSnapshot(collection(db,'users',uid,'messageFlags'),snapshot=>{if(!active)return;flagsReady=true;setState(previous=>({...previous,owner:uid,loaded:conversationsReady,flags:Object.fromEntries(snapshot.docs.map(item=>[item.id,item.data()as MessageFlag]))}));},fail)];return()=>{active=false;stops.forEach(stop=>stop());};},[uid]);return state.owner===uid?state:{conversations:{},flags:{},loaded:false};
}
export function PersonalProvider({uid,children}:{uid:string;children:React.ReactNode}){return <PersonalContext.Provider value={usePersonalState(uid)}>{children}</PersonalContext.Provider>;}
export function visibleMessage(message:Message,state:ConversationState={},flags:Personal['flags']={}){return message.timestamp>(state.clearedAt||0)&&!flags[flagId(message.chatId,message.id)]?.hidden&&(!message.expiresAt||message.expiresAt>Date.now());}
export function visibleChat(chat:Chat,state:ConversationState={}){return !state.deletedAt||(chat.lastMessage?.timestamp||0)>state.deletedAt;}
export async function clearForMe(uid:string,chat:Chat,remove=false){const stamp=Date.now();await runTransaction(db,async transaction=>{const room=doc(db,'chats',chat.id),snapshot=await transaction.get(room);transaction.set(doc(db,'users',uid,'conversations',chat.id),{clearedAt:stamp,...(remove?{deletedAt:stamp}:{}),unread:false},{merge:true});if((snapshot.data()?.lastMessage?.timestamp||0)<=stamp)transaction.update(room,{['unreadCount.'+uid]:0});});}
export async function restoreConversation(uid:string,chatId:string){await setDoc(doc(db,'users',uid,'conversations',chatId),{deletedAt:0},{merge:true});}
export async function changeConversation(uid:string,chatId:string,patch:ConversationState){await setDoc(doc(db,'users',uid,'conversations',chatId),patch,{merge:true});}
export async function setMessageFlag(uid:string,message:Pick<Message,'id'|'chatId'>,patch:Partial<MessageFlag>){await setDoc(doc(db,'users',uid,'messageFlags',flagId(message.chatId,message.id)),{chatId:message.chatId,messageId:message.id,...patch,updatedAt:Date.now()},{merge:true});}
export type HiddenTicket={at:number;messages:Pick<Message,'id'|'chatId'>[]};
export async function restoreHiddenMessages(uid:string,ticket:HiddenTicket){for(let offset=0;offset<ticket.messages.length;offset+=100)await runTransaction(db,async tx=>{const refs=ticket.messages.slice(offset,offset+100).map(message=>doc(db,'users',uid,'messageFlags',flagId(message.chatId,message.id))),snapshots=await Promise.all(refs.map(target=>tx.get(target)));snapshots.forEach((snapshot,index)=>{if(snapshot.data()?.hidden&&snapshot.data()?.updatedAt===ticket.at)tx.update(refs[index],{hidden:false,updatedAt:Date.now()});});});}
export async function hideMessages(uid:string,messages:Message[]){const at=Date.now();for(let offset=0;offset<messages.length;offset+=400){const batch=writeBatch(db);messages.slice(offset,offset+400).forEach(message=>batch.set(doc(db,'users',uid,'messageFlags',flagId(message.chatId,message.id)),{chatId:message.chatId,messageId:message.id,hidden:true,updatedAt:at},{merge:true}));await batch.commit();}return {at,messages:messages.filter(message=>!message.localState).map(({id,chatId})=>({id,chatId}))};}
export function draftKey(uid:string,chatId:string){return 'nexus-draft:'+uid+':'+chatId;}
export function readDraft(uid:string,chatId:string){return localStorage.getItem(draftKey(uid,chatId))||'';}
export function writeDraft(uid:string,chatId:string,text:string){const key=draftKey(uid,chatId);if(text)localStorage.setItem(key,text.slice(0,20000));else localStorage.removeItem(key);window.dispatchEvent(new CustomEvent('nexus:draft',{detail:{uid,chatId}}));}
