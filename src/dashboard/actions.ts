import {cleanupLease,cleanupMillis,nextCleanupMonth,CLEANUP_LEASE_MS,CLEANUP_HEARTBEAT_MS} from './cleanupState';
import {collection,doc,getDocFromServer,getDocsFromServer,query,where,orderBy,limit,startAfter,writeBatch,runTransaction,deleteField,serverTimestamp} from 'firebase/firestore';
import {get,ref,remove} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {db as defaultDb,rtdb as defaultRtdb} from '../firebase';
export function createActions({db,rtdb}:{db:typeof defaultDb;rtdb:typeof defaultRtdb}){
const planRef=doc(db,'publicConfig','cleanup');
const nextMonth=nextCleanupMonth;
function protect(records:unknown[]){const ids=new Set<string>();const walk=(value:any)=>{if(typeof value==='string')for(const m of value.matchAll(/\/api\/media\/([a-zA-Z0-9_-]+)/g))ids.add(m[1]);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};records.forEach(walk);return ids;}
async function inspect(cutoff:number,execute=false,onProgress=(text:string)=>{},heartbeat=async()=>{}){
 if(!Number.isFinite(cutoff)||cutoff<=0)throw Error('El plan no tiene una fecha de limpieza válida.');
 const counts={messages:0,statuses:0,files:0,bytes:0,protectedFiles:0,realtimeFiles:0,protectedMessages:0};await heartbeat();onProgress('Comprobando contenido protegido…');const users=await getDocsFromServer(collection(db,'users')),chats=await getDocsFromServer(collection(db,'chats')),communities=await getDocsFromServer(collection(db,'communities'));
 const profiles=[];for(const user of users.docs){await heartbeat();const snapshot=await getDocFromServer(doc(db,'users',user.id,'private','profile'));if(snapshot.exists())profiles.push(snapshot.data());}
 const protectedIds=protect([...users.docs,...chats.docs,...communities.docs].map(d=>d.data()).concat(profiles));
 for(const chat of chats.docs){let cursor;for(;;){
  await heartbeat();let q=query(collection(db,'chats',chat.id,'messages'),where('timestamp','<',cutoff),orderBy('timestamp'),limit(200));if(cursor)q=query(q,startAfter(cursor));
  const rows=await getDocsFromServer(q);if(rows.empty)break;
  const retained=(records:typeof rows.docs)=>{const kept=records.filter(d=>!!d.data().keptBy);for(const id of protect(kept.map(d=>d.data())))protectedIds.add(id);return kept.length;};
  if(execute){
   await heartbeat();
   const result=await runTransaction(db,async tx=>{
    const fresh=await Promise.all(rows.docs.map(d=>tx.get(d.ref)));
    const present=fresh.filter(d=>d.exists());
    const kept=present.filter(d=>!!d.data().keptBy),eligible=present.filter(d=>!d.data().keptBy&&cleanupMillis(d.data().timestamp)<cutoff);
    eligible.forEach(d=>tx.delete(d.ref));return {kept,deleted:eligible.length};
   });
   counts.protectedMessages+=retained(result.kept as typeof rows.docs);counts.messages+=result.deleted;
  }else{counts.protectedMessages+=retained(rows.docs);counts.messages+=rows.docs.filter(d=>!d.data().keptBy).length;}
  cursor=rows.docs.at(-1);onProgress(counts.messages+' mensajes '+(execute?'eliminados':'elegibles'));if(rows.size<200)break;
 }
  if(execute){let voteCursor;for(;;){await heartbeat();let votes=query(collection(db,'chats',chat.id,'pollVotes'),where('messageTimestamp','<',cutoff),orderBy('messageTimestamp'),limit(100));if(voteCursor)votes=query(votes,startAfter(voteCursor));const rows=await getDocsFromServer(votes);if(rows.empty)break;await runTransaction(db,async tx=>{const parents=await Promise.all(rows.docs.map(vote=>tx.get(doc(db,'chats',chat.id,'messages',vote.data().messageId))));rows.docs.forEach((vote,index)=>{if(!parents[index].exists())tx.delete(vote.ref);});});voteCursor=rows.docs.at(-1);if(rows.size<100)break;}}
  if(execute){await heartbeat();await runTransaction(db,async tx=>{
   const fresh=await tx.get(chat.ref);if(!fresh.exists())return;
   const data=fresh.data(),last=data.lastMessage,pins=data.messagePins||{},pinIds=Object.keys(pins).filter(id=>id&&!id.includes('/'));
   const existingPins=await Promise.all(pinIds.map(id=>tx.get(doc(db,'chats',chat.id,'messages',id))));
   const keptPins=Object.fromEntries(pinIds.filter((_,index)=>existingPins[index].exists()).map(id=>[id,pins[id]])),patch:Record<string,unknown>={};
   if(Object.keys(keptPins).length!==Object.keys(pins).length)patch.messagePins=keptPins;
   if(last&&cleanupMillis(last.timestamp)<cutoff){const message=typeof last.id==='string'&&last.id&&!last.id.includes('/')?await tx.get(doc(db,'chats',chat.id,'messages',last.id)):null;if(!message?.exists())Object.assign(patch,{lastMessage:deleteField(),unreadCount:{}});}
   if(Object.keys(patch).length)tx.update(chat.ref,patch);
  });}
 }
 let cursor;for(;;){await heartbeat();let q=query(collection(db,'statuses'),where('createdAt','<',cutoff),orderBy('createdAt'),limit(100));if(cursor)q=query(q,startAfter(cursor));const rows=await getDocsFromServer(q);if(rows.empty)break;for(const status of rows.docs){if(execute){await heartbeat();const reactions=await getDocsFromServer(collection(db,'statuses',status.id,'reactions'));for(let offset=0;offset<reactions.docs.length;offset+=400){await heartbeat();const batch=writeBatch(db);reactions.docs.slice(offset,offset+400).forEach(d=>batch.delete(d.ref));await batch.commit();}await heartbeat();const deletion=writeBatch(db);deletion.delete(status.ref);await deletion.commit();}counts.statuses++;}if(!execute)cursor=rows.docs.at(-1);if(rows.size<100)break;}
 let fileCursor;for(;;){await heartbeat();let q=query(collection(db,'mediaFiles'),where('createdAt','<',cutoff),orderBy('createdAt'),limit(100));if(fileCursor)q=query(q,startAfter(fileCursor));const rows=await getDocsFromServer(q);if(rows.empty)break;for(const file of rows.docs){const data=file.data();if(!['chat','status'].includes(data.scope)||protectedIds.has(file.id)||(!data.complete&&data.createdAt>cutoff-3600000)){counts.protectedFiles++;continue;}if(execute){await heartbeat();const target='clientMedia/'+file.id;const existed=(await get(ref(rtdb,target+'/owner'))).exists();await remove(ref(rtdb,target));if(existed)counts.realtimeFiles++;const batch=writeBatch(db);batch.delete(file.ref);await batch.commit();}counts.files++;counts.bytes+=Number(data.size)||0;onProgress(counts.files+' archivos procesados');}fileCursor=rows.docs.at(-1);if(rows.size<100)break;}
 return counts;
}
async function executeDue(onProgress:(text:string)=>void,manual=false){
 const uid=getAuth(rtdb.app).currentUser?.uid;
 if(!uid||(await get(ref(rtdb,'dashboardAdmins/'+uid))).val()!==true)throw Error('Esta cuenta no tiene permiso de limpieza en Realtime Database. No se inició el borrado.');
 const rawOffset=(await get(ref(rtdb,'.info/serverTimeOffset'))).val();
 const offset=typeof rawOffset==='number'&&Number.isFinite(rawOffset)?rawOffset:0;
 const nowServer=()=>Date.now()+offset;
 const runId=crypto.randomUUID();
 let cutoff=await runTransaction(db,async tx=>{
  const snapshot=await tx.get(planRef),plan=snapshot.data(),now=nowServer();
  if(cleanupLease(plan,now).active)throw Error('Hay una limpieza en curso. Espera a que termine o a que caduque su bloqueo.');
  const valid=Number.isFinite(plan?.nextDueAt)&&plan.nextDueAt>0;
  if(!manual&&(!valid||!plan?.enabled||plan.execution!=='browser'||plan.nextDueAt>now))
   throw Error('La fecha de limpieza todavía no ha llegado.');
  const lease={runId,status:'running',leaseUntil:now+CLEANUP_LEASE_MS};
  if(manual){
   const schedule=valid?plan.nextDueAt:nextMonth(now);
   tx.set(planRef,{
    ...lease,enabled:valid&&plan.enabled===true,execution:'browser',warningDays:3,nextDueAt:schedule,manualCutoff:serverTimestamp(),
   },{merge:true});
  }else{
   tx.update(planRef,{...lease,manualCutoff:deleteField()});
  }
  return manual?0:plan!.nextDueAt as number;
 });
 const cutoffValue=(plan:Record<string,any>)=>cleanupMillis(plan.manualCutoff);
 function verify(plan:Record<string,any>|undefined){
  if(plan?.runId!==runId||plan.execution!=='browser'||plan.status!=='running')throw Error('La limpieza ya no está asignada a esta pestaña.');
  if(manual?cutoffValue(plan)!==cutoff:!plan.enabled||plan.nextDueAt!==cutoff)
   throw Error('La configuración cambió. La limpieza se detuvo antes del siguiente lote.');
 }
 let renewed=nowServer(),failure:unknown,flight=Promise.resolve();
 const assertSession=()=>{if(getAuth(rtdb.app).currentUser?.uid!==uid)throw Error('La sesión cambió. La limpieza se detuvo.');};
 const heartbeat=(force=false)=>{
  const next=flight.then(async()=>{
   if(failure)throw failure;assertSession();let refreshed=false;
   await runTransaction(db,async tx=>{
    verify((await tx.get(planRef)).data());assertSession();
    if(force||nowServer()-renewed>=CLEANUP_HEARTBEAT_MS){tx.update(planRef,{leaseUntil:nowServer()+CLEANUP_LEASE_MS});refreshed=true;}
   });
   if(refreshed)renewed=nowServer();
  });flight=next.catch(()=>{});return next;
 };
 const timer=setInterval(()=>{void heartbeat(true).catch(error=>{failure=error;});},CLEANUP_HEARTBEAT_MS);
 try{
  if(manual){const plan=(await getDocFromServer(planRef)).data();if(plan?.runId!==runId)throw Error('La limpieza cambió antes de empezar.');cutoff=cutoffValue(plan);}
  const counts=await inspect(cutoff,true,onProgress,heartbeat);
  await heartbeat();assertSession();
  await runTransaction(db,async tx=>{
   verify((await tx.get(planRef)).data());
   tx.update(planRef,{status:'scheduled',lastCompletedAt:nowServer(),leaseUntil:0,runId:deleteField(),counts,manualCutoff:deleteField(),...(!manual&&{nextDueAt:nextMonth(cutoff)})});
  });
  return counts;
 }catch(error){
  await runTransaction(db,async tx=>{
   const plan=(await tx.get(planRef)).data();
   if(plan?.runId===runId&&plan.status==='running')tx.update(planRef,{status:'error',leaseUntil:0,runId:deleteField(),manualCutoff:deleteField()});
  }).catch(()=>{});
  throw error;
 }finally{clearInterval(timer);await flight;}
}

return {planRef,nextMonth,inspect,executeDue};}
export const {planRef,nextMonth,inspect,executeDue}=createActions({db:defaultDb,rtdb:defaultRtdb});
