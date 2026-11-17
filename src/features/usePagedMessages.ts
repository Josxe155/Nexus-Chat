import {purgeLoadedExpired} from './messageRetention';
import {liveMessages} from './liveMessages';
import {readableMessages} from './encryption';
import {dataErrorMessage} from './dataErrors';
import {useEffect,useRef,useState,useMemo} from 'react';
import {collection,onSnapshot,where,orderBy,limit,startAfter,endAt,type QueryConstraint,type QueryDocumentSnapshot} from 'firebase/firestore';
import {db} from '../firebase';
import type {Message} from '../types';
const PAGE=80;
type Boundary={start?:QueryDocumentSnapshot;end?:QueryDocumentSnapshot};
export default function usePagedMessages(uid:string|undefined,chatId:string|null,cutoff:number){
 const [bounds,setBounds]=useState<Boundary[]>([{}]),[pages,setPages]=useState<Record<number,Message[]>>({}),[hasMore,setHasMore]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const cursor=useRef<QueryDocumentSnapshot|undefined>(undefined),generation=useRef(''),pending=useRef(false);
 const key=uid+':'+chatId+':'+cutoff,[scope,setScope]=useState(key),[attempt,setAttempt]=useState(0);
 useEffect(()=>{generation.current=key;setScope(key);setBounds([{}]);setPages({});setHasMore(false);setError('');cursor.current=undefined;pending.current=!!uid&&!!chatId;setLoading(pending.current);},[key]);
 useEffect(()=>{
  if(!uid||!chatId||scope!==key)return;
  let active=true,lastResolved=false,lastSize=0,lastCursor:QueryDocumentSnapshot|undefined;
  const failures=new Map<number,string>(),stops:(()=>void)[]=[];
  pending.current=true;cursor.current=undefined;setLoading(true);setHasMore(false);setError('');
  const current=()=>active&&generation.current===key;
  function status(){
   if(!current())return;
   setError(failures.values().next().value||'');
   if(failures.size){pending.current=false;cursor.current=undefined;setHasMore(false);setLoading(false);}
   else if(lastResolved){pending.current=false;cursor.current=lastCursor;setHasMore(lastSize===PAGE);setLoading(false);}
  }
  bounds.forEach((bound,index)=>{
   let revision=0;
   const fail=(cause:unknown)=>{if(!current())return;revision++;failures.set(index,dataErrorMessage(cause,'No se pudo cargar este tramo del historial.'));status();};
   try{
    const constraints:QueryConstraint[]=[where('timestamp','>=',cutoff),orderBy('timestamp','desc')];
    if(bound.start)constraints.push(startAfter(bound.start));
    if(bound.end)constraints.push(endAt(bound.end));else constraints.push(limit(PAGE));
    stops.push(onSnapshot(liveMessages(collection(db,'chats',chatId,'messages'),...constraints),async snapshot=>{
     if(!current())return;const turn=++revision;
     try{
      const values=await readableMessages(snapshot.docs.map(document=>({...document.data(),id:document.id}) as Message),uid);
      if(!current()||turn!==revision)return;
      failures.delete(index);setPages(previous=>({...previous,[index]:values}));
      if(index===bounds.length-1){lastResolved=true;lastCursor=snapshot.docs.at(-1);lastSize=snapshot.docs.length;}
      status();
     }catch(cause){if(current()&&turn===revision)fail(cause);}
    },fail));
   }catch(cause){fail(cause);}
  });
  return()=>{active=false;stops.forEach(stop=>stop());};
 },[uid,chatId,cutoff,bounds,key,scope,attempt]);
 useEffect(()=>{const refresh=()=>setAttempt(value=>value+1);window.addEventListener('nexus:keys-ready',refresh);return()=>window.removeEventListener('nexus:keys-ready',refresh);},[]);
 useEffect(()=>{
  const loaded=Object.values(pages).flat(),sweep=()=>{if(uid&&chatId)void purgeLoadedExpired(uid,chatId,loaded).catch(()=>{});};sweep();
  const next=Math.min(...loaded.map(m=>m.expiresAt||Infinity).filter(at=>at>Date.now()));
  const timer=Number.isFinite(next)?setTimeout(()=>{sweep();setAttempt(n=>n+1);},Math.min(2147483647,Math.max(1,next-Date.now()+20))):undefined;
  const visible=()=>{if(document.visibilityState==='visible'){sweep();setAttempt(n=>n+1);}};
  document.addEventListener('visibilitychange',visible);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visible);};
 },[pages,uid,chatId]);
 const loadMore=()=>{if(pending.current||error||!hasMore||!cursor.current)return;const anchor=cursor.current;pending.current=true;setLoading(true);setBounds(previous=>[...previous.slice(0,-1),{...previous.at(-1),end:anchor},{start:anchor}]);};
 const messages=useMemo(()=>{const unique=new Map<string,Message>();for(const page of Object.values(pages))for(const message of page)if(!message.expiresAt||message.expiresAt>Date.now())unique.set(message.id,message);return [...unique.values()].sort((a,b)=>a.timestamp-b.timestamp||a.id.localeCompare(b.id));},[pages,attempt]);
 return {messages:scope===key?messages:[],hasMore:scope===key&&hasMore,loading:scope!==key||loading,loadMore,error:scope===key?error:'',retry:()=>setAttempt(value=>value+1)};
}
