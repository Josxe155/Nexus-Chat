import {collection,doc,getDocFromServer,getDocsFromServer,query,where,orderBy,limit,startAfter,writeBatch,runTransaction,deleteField,serverTimestamp,Timestamp} from 'firebase/firestore';
import {get,ref,remove} from 'firebase/database';
import {getAuth} from 'firebase/auth';
import {db as defaultDb,rtdb as defaultRtdb} from '../firebase';
export function createActions({db,rtdb}:{db:typeof defaultDb;rtdb:typeof defaultRtdb}){
const planRef=doc(db,'publicConfig','cleanup');
function nextMonth(time:number){const d=new Date(time),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.getTime();}
function protect(records:unknown[]){const ids=new Set<string>();const walk=(value:any)=>{if(typeof value==='string')for(const m of value.matchAll(/\/api\/media\/([a-zA-Z0-9_-]+)/g))ids.add(m[1]);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};records.forEach(walk);return ids;}
async function inspect(cutoff:number,execute=false,onProgress=(text:string)=>{},heartbeat=async()=>{}){
 if(!Number.isFinite(cutoff)||cutoff<=0)throw Error('El plan no tiene una fecha de limpieza válida.');
 const counts={messages:0,statuses:0,files:0,bytes:0,protectedFiles:0,realtimeFiles:0};const users=await getDocsFromServer(collection(db,'users')),chats=await getDocsFromServer(collection(db,'chats')),communities=await getDocsFromServer(collection(db,'communities'));
 const profiles=[];for(const user of users.docs){const snapshot=await getDocFromServer(doc(db,'users',user.id,'private','profile'));if(snapshot.exists())profiles.push(snapshot.data());}
 const protectedIds=protect([...users.docs,...chats.docs,...communities.docs].map(d=>d.data()).concat(profiles));
 for(const chat of chats.docs){let cursor;for(;;){await heartbeat();let q=query(collection(db,'chats',chat.id,'messages'),where('timestamp','<',cutoff),orderBy('timestamp'),limit(200));if(cursor)q=query(q,startAfter(cursor));const rows=await getDocsFromServer(q);if(rows.empty)break;if(execute){await heartbeat();const batch=writeBatch(db);rows.docs.forEach(d=>batch.delete(d.ref));await batch.commit();}else cursor=rows.docs.at(-1);counts.messages+=rows.size;onProgress(counts.messages+' mensajes revisados');if(rows.size<200)break;}
  if(execute){await heartbeat();await runTransaction(db,async tx=>{const fresh=await tx.get(chat.ref);if((fresh.data()?.lastMessage?.timestamp||Infinity)<cutoff)tx.update(chat.ref,{lastMessage:deleteField(),messagePins:{},unreadCount:{}});});}
 }
 let cursor;for(;;){await heartbeat();let q=query(collection(db,'statuses'),where('createdAt','<',cutoff),orderBy('createdAt'),limit(100));if(cursor)q=query(q,startAfter(cursor));const rows=await getDocsFromServer(q);if(rows.empty)break;for(const status of rows.docs){if(execute){await heartbeat();const reactions=await getDocsFromServer(collection(db,'statuses',status.id,'reactions'));for(let offset=0;offset<reactions.docs.length;offset+=400){await heartbeat();const batch=writeBatch(db);reactions.docs.slice(offset,offset+400).forEach(d=>batch.delete(d.ref));await batch.commit();}await heartbeat();const deletion=writeBatch(db);deletion.delete(status.ref);await deletion.commit();}counts.statuses++;}if(!execute)cursor=rows.docs.at(-1);if(rows.size<100)break;}
 let fileCursor;for(;;){await heartbeat();let q=query(collection(db,'mediaFiles'),where('createdAt','<',cutoff),orderBy('createdAt'),limit(100));if(fileCursor)q=query(q,startAfter(fileCursor));const rows=await getDocsFromServer(q);if(rows.empty)break;for(const file of rows.docs){const data=file.data();if(!['chat','status'].includes(data.scope)||protectedIds.has(file.id)||(!data.complete&&data.createdAt>cutoff-3600000)){counts.protectedFiles++;continue;}if(execute){await heartbeat();const target='clientMedia/'+file.id;const existed=(await get(ref(rtdb,target+'/owner'))).exists();await remove(ref(rtdb,target));if(existed)counts.realtimeFiles++;const batch=writeBatch(db);batch.delete(file.ref);await batch.commit();}counts.files++;counts.bytes+=Number(data.size)||0;onProgress(counts.files+' archivos procesados');}fileCursor=rows.docs.at(-1);if(rows.size<100)break;}
 return counts;
}
async function executeDue(onProgress:(text:string)=>void,manual=false){
 const uid=getAuth(rtdb.app).currentUser?.uid;
 if(!uid||(await get(ref(rtdb,'dashboardAdmins/'+uid))).val()!==true)throw Error('Esta cuenta no tiene permiso de limpieza en Realtime Database. No se inició el borrado.');
 const offset=Number((await get(ref(rtdb,'.info/serverTimeOffset')).catch(()=>null))?.val())||0;
 const nowServer=()=>Date.now()+offset;
 const runId=crypto.randomUUID();
 let cutoff=await runTransaction(db,async tx=>{
  const snapshot=await tx.get(planRef),plan=snapshot.data(),now=nowServer();
  if(plan?.leaseUntil>now)throw Error('Hay una limpieza en curso en otra pestaña.');
  const valid=Number.isFinite(plan?.nextDueAt)&&plan.nextDueAt>0;
  if(!manual&&(!valid||!plan?.enabled||plan.execution!=='browser'||plan.nextDueAt>now))
   throw Error('La fecha de limpieza todavía no ha llegado.');
  const lease={runId,status:'running',leaseUntil:now+300000};
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
 const cutoffValue=(plan:Record<string,any>)=>plan.manualCutoff instanceof Timestamp?plan.manualCutoff.toMillis():plan.manualCutoff;
 function verify(plan:Record<string,any>|undefined){
  if(plan?.runId!==runId||plan.execution!=='browser'||plan.status!=='running')throw Error('La limpieza ya no está asignada a esta pestaña.');
  if(manual?cutoffValue(plan)!==cutoff:!plan.enabled||plan.nextDueAt!==cutoff)
   throw Error('La configuración cambió. La limpieza se detuvo antes del siguiente lote.');
 }
 let renewed=Date.now();
 const heartbeat=async()=>{
  await runTransaction(db,async tx=>{
   verify((await tx.get(planRef)).data());
   if(Date.now()-renewed>=60000)tx.update(planRef,{leaseUntil:nowServer()+300000});
  });
  if(Date.now()-renewed>=60000)renewed=Date.now();
 };
 try{
  if(manual){const plan=(await getDocFromServer(planRef)).data();if(plan?.runId!==runId)throw Error('La limpieza cambió antes de empezar.');cutoff=cutoffValue(plan);}
  const counts=await inspect(cutoff,true,onProgress,heartbeat);
  await runTransaction(db,async tx=>{
   verify((await tx.get(planRef)).data());
   tx.update(planRef,{status:'scheduled',lastCompletedAt:Date.now(),leaseUntil:0,counts,manualCutoff:deleteField(),...(!manual&&{nextDueAt:nextMonth(cutoff)})});
  });
  return counts;
 }catch(error){
  await runTransaction(db,async tx=>{
   const plan=(await tx.get(planRef)).data();
   if(plan?.runId===runId&&plan.status==='running')tx.update(planRef,{status:'error',leaseUntil:0,manualCutoff:deleteField()});
  }).catch(()=>{});
  throw error;
 }
}

return {planRef,nextMonth,inspect,executeDue};}
export const {planRef,nextMonth,inspect,executeDue}=createActions({db:defaultDb,rtdb:defaultRtdb});
