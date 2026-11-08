import {useCallback,useEffect,useState} from 'react';
import {BadgeCheck,Megaphone} from 'lucide-react';
import {doc,runTransaction,Timestamp} from 'firebase/firestore';
import {db} from '../firebase';
import {subscribeToOfficialNotices,type OfficialNotice} from './officialNotices';
import './official-chat.css';

export function useOfficialChat(enabled:boolean,uid:string,open:boolean){
 const [notices,setNotices]=useState<OfficialNotice[]|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{
  setNotices(null);setFailed(false);
  if(enabled)return subscribeToOfficialNotices(db,setNotices,()=>setFailed(true));
 },[enabled,uid,retry]);
 const latest=notices?.[0]?.publishedAt;
 const seconds=latest?.seconds,nanoseconds=latest?.nanoseconds;
 const markRead=useCallback(async()=>{
  if(!enabled||seconds===undefined||nanoseconds===undefined)return;
  const marker=doc(db,'users',uid,'private','official-chat'),seenThrough=new Timestamp(seconds,nanoseconds);
  await runTransaction(db,async transaction=>{
   const previous=(await transaction.get(marker)).data()?.seenThrough;
   if(!(previous instanceof Timestamp)||previous<seenThrough)transaction.set(marker,{seenThrough});
  });
 },[enabled,uid,seconds,nanoseconds]);
 useEffect(()=>{if(open)void markRead().catch(()=>{});},[open,markRead]);
 return {notices,failed,markRead,retry:()=>setRetry(value=>value+1)};
}

export function OfficialBadge(){return <BadgeCheck className="official-verified" size={17} aria-label="Cuenta oficial de Nexus"/>;}

export function OfficialChatRow({latest,unread,onOpen}:{latest?:OfficialNotice;unread:number;onOpen:()=>void}){
 return <article className="mobile-chat-row official-chat-row"><button type="button" className="mobile-chat-open" onClick={onOpen}>
  <span className="chat-list-avatar"><img src="/nexus-icon.svg" alt=""/></span>
  <span><strong>Nexus Chat Oficial <OfficialBadge/></strong><small>{latest?.title||'Novedades y avisos de Nexus'}</small></span>
  {latest&&<aside><time dateTime={latest.publishedAt.toDate().toISOString()}>{latest.publishedAt.toDate().toLocaleDateString('es',{day:'numeric',month:'short'})}</time>{unread>0&&<span className="chat-row-meta"><b aria-label={`${unread} avisos sin leer`}>{unread}</b></span>}</aside>}
 </button></article>;
}

export default function OfficialChat({notices,failed,retry}:{notices:OfficialNotice[]|null;failed:boolean;retry:()=>void}){
 return <section className="official-chat" aria-label="Mensajes oficiales">
  <header><Megaphone size={21} aria-hidden="true"/><div><strong>Mensajes del equipo de Nexus</strong><p>Aquí llegan novedades, avisos del servicio y recomendaciones de seguridad. Este chat es de solo lectura.</p></div></header>
  {failed?<p role="alert">No se pudieron cargar los avisos. <button type="button" onClick={retry}>Reintentar</button></p>:notices===null?<p role="status">Cargando avisos…</p>:!notices.length?<p>Todavía no hay avisos publicados.</p>:<ol>{notices.map(notice=><li key={notice.id}>
   <small>{notice.category}</small><h2>{notice.title}</h2><p>{notice.body}</p>
   <time dateTime={notice.publishedAt.toDate().toISOString()}>{notice.publishedAt.toDate().toLocaleString('es',{dateStyle:'medium',timeStyle:'short'})}</time>
  </li>)}</ol>}
 </section>;
}
