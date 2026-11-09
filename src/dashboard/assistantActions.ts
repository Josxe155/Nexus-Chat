import {doc,getDocFromServer,runTransaction,serverTimestamp,deleteField,type Firestore} from 'firebase/firestore';
import {ref,get,update,serverTimestamp as realtimeTimestamp,type Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {verifyDashboardAccess} from './session';
import {createActions} from './actions';
import {actionPath,normalizeRecord,sameRecord,validateActionData,applyActionPatch,type AssistantAction} from './assistantActionCore';
export type {AssistantAction} from './assistantActionCore';
const string={type:'STRING'};
export const actionDeclarations=[
 {name:'prepare_firestore_action',description:'Prepara la creación, actualización o eliminación de cualquier documento operativo de Nexus. Las órdenes directas pueden ejecutarse al preparar; una petición de preparación devuelve una propuesta pendiente. Comprueba executed en la respuesta. Para update usa campos con puntos y JSON; {$serverTimestamp:true} asigna fecha del servidor y {$delete:true} elimina un campo. No guarda conversaciones del asistente en Firebase.',parameters:{type:'OBJECT',properties:{path:string,operation:{type:'STRING',enum:['create','update','delete']},dataJson:string},required:['path','operation']}},
 {name:'prepare_realtime_action',description:'Prepara creación, actualización o eliminación de datos operativos de Realtime Database, Las órdenes directas pueden ejecutarse; comprueba executed. dataJson es JSON; update modifica las claves indicadas. No gestiona permisos administrativos.',parameters:{type:'OBJECT',properties:{path:string,operation:{type:'STRING',enum:['create','update','delete']},dataJson:string},required:['path','operation']}},
 {name:'prepare_cleanup_schedule',description:'Prepara activar, pausar o reprogramar la limpieza mensual de Firebase. Cuando enabled=true usa una fecha futura nextDueAt en milisegundos. Conserva cuentas y perfiles; la ejecución periódica sigue necesitando el dashboard abierto.',parameters:{type:'OBJECT',properties:{enabled:{type:'BOOLEAN'},nextDueAt:{type:'NUMBER'}},required:['enabled']}},
 {name:'prepare_manual_cleanup',description:'Prepara una limpieza de contenido conservando cuentas, perfiles y medios protegidos. Solo se ejecuta tras recibir LIMPIAR AHORA y el identificador de confirmación.',parameters:{type:'OBJECT',properties:{}}},
 {name:'navigate_dashboard',description:'Abre una pantalla del dashboard. No modifica datos.',parameters:{type:'OBJECT',properties:{page:{type:'STRING',enum:['resumen','reportes','avisos','mantenimiento','informes','modo-ia']}},required:['page']}},
];
function materialize(value:any,realtime=false):any{
 if(value&&typeof value==='object'){
  if(!Array.isArray(value)&&Object.getPrototypeOf(value)!==Object.prototype)return value;
  if(value.$serverTimestamp===true)return realtime?realtimeTimestamp():serverTimestamp();
  if(value.$delete===true)return realtime?null:deleteField();
  if(Array.isArray(value))return value.map(item=>materialize(item,realtime));
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,materialize(item,realtime)]));
 }
 return value;
}
export function createAssistantActions(db:Firestore,rtdb:Database,user:User,onPlan:(plan:AssistantAction)=>void){
 const authorized=async(signal:AbortSignal)=>{signal.throwIfAborted();if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');signal.throwIfAborted();};
 const prepare=async(name:string,args:Record<string,unknown>,signal:AbortSignal)=>{
  await authorized(signal);
  if(name==='navigate_dashboard'){const page=String(args.page);if(!['resumen','reportes','avisos','mantenimiento','informes','modo-ia'].includes(page))throw Error('Esa pantalla no existe.');location.hash=page;return {opened:page};}
  if(name==='prepare_cleanup_schedule'){
   const path='publicConfig/cleanup',before=(await getDocFromServer(doc(db,path))).data()??null;
   if(before?.leaseUntil>Date.now())throw Error('Hay una limpieza en curso. Espera a que termine.');
   const enabled=args.enabled===true,nextDueAt=typeof args.nextDueAt==='number'?args.nextDueAt:before?.nextDueAt||createActions({db,rtdb}).nextMonth(Date.now());
   if(enabled&&(!Number.isFinite(nextDueAt)||nextDueAt<=Date.now()))throw Error('La fecha de limpieza debe ser futura.');
   const data={enabled,execution:'browser',nextDueAt,warningDays:3,status:'scheduled',leaseUntil:0};
   const plan:AssistantAction={id:crypto.randomUUID(),actor:user.uid,createdAt:Date.now(),kind:'schedule',path,operation:before?'update':'create',data,before:normalizeRecord(before)};onPlan(plan);return {prepared:true,id:plan.id,path,data,confirmation:'CONFIRMAR '+plan.id};
  }
  const kind=name==='prepare_firestore_action'?'firestore':name==='prepare_realtime_action'?'realtime':name==='prepare_manual_cleanup'?'cleanup':null;
  if(!kind)throw Error('Acción desconocida.');
  const operation=kind==='cleanup'?'cleanup':String(args.operation);
  if(!['create','update','delete','cleanup'].includes(operation)||kind!=='cleanup'&&operation==='cleanup')throw Error('La operación no es válida.');
  const path=kind==='cleanup'?'publicConfig/cleanup':actionPath(args.path,kind);
  let data:Record<string,any>={};if(operation!=='delete'&&kind!=='cleanup')data=validateActionData(JSON.parse(String(args.dataJson||'{}')));
  const before=kind==='firestore'?(await getDocFromServer(doc(db,path))).data()??null:kind==='realtime'?(await get(ref(rtdb,path))).val():null;
  if(kind==='firestore'&&/^chats\/[^/]+\/messages\/[^/]+$/.test(path)&&operation==='update'){
   if('content' in data){if(before?.type!=='text'||before?.sealed||before?.deletedAt||before?.expiresAt&&before.expiresAt<=Date.now()||typeof data.content!=='string'||!data.content.trim()||data.content.length>20000)throw Error('Ese mensaje no se puede editar como texto.');data.edited=true;}
   for(const field of ['id','chatId','senderId','timestamp','serverSentAt'])if(field in data&&!sameRecord(data[field],before?.[field]))throw Error('La edición debe conservar el autor, la fecha y los identificadores originales.');
  }
  if(kind==='firestore'&&path==='publicConfig/availability'&&operation!=='delete'){
   if(typeof data.maintenance!=='boolean')throw Error('Indica si quieres activar o desactivar el mantenimiento.');data.updatedAt={$serverTimestamp:true};
  }
  if(kind==='firestore'&&path.startsWith('officialNotices/')&&operation!=='delete'){
   const next=operation==='update'?applyActionPatch(before,data):data;
   if(!['Novedad','Aviso','Seguridad'].includes(next.category)||typeof next.title!=='string'||!next.title.trim()||next.title.length>100||typeof next.body!=='string'||!next.body.trim()||next.body.length>2000)throw Error('El aviso necesita categoría, título y mensaje válidos.');
   if(operation==='create')data.publishedAt={$serverTimestamp:true};
  }
  if(operation==='create'&&before!==null)throw Error('El destino ya existe. Prepara una actualización.');
  if(operation==='update'&&before===null)throw Error('El destino no existe. Prepara una creación.');
  if(operation==='delete'&&before===null)throw Error('El destino ya está eliminado.');
  signal.throwIfAborted();const plan:AssistantAction={id:crypto.randomUUID(),actor:user.uid,createdAt:Date.now(),kind,path,operation:operation as AssistantAction['operation'],data,before:normalizeRecord(before)};onPlan(plan);
  return {prepared:true,id:plan.id,path,operation,data,before:plan.before,confirmation:kind==='cleanup'?'LIMPIAR AHORA '+plan.id:'CONFIRMAR '+plan.id};
 };
 const execute=async(plan:AssistantAction,signal:AbortSignal,onCommit:()=>void)=>{
  await authorized(signal);
  if(plan.actor!==user.uid||Date.now()-plan.createdAt>86400000)throw Error('La propuesta ya no está vigente. Solicita otra.');
  if(plan.kind==='cleanup'){const latest=(await getDocFromServer(doc(db,'publicConfig','cleanup'))).data();if(latest?.lastCompletedAt>=plan.createdAt)return 'Ya se completó una limpieza después de esta propuesta. Solicita otra si necesitas una nueva.';onCommit();const counts=await createActions({db,rtdb}).executeDue(()=>{},true);return 'Limpieza completada: '+JSON.stringify(counts);}
  const path=plan.kind==='schedule'?'publicConfig/cleanup':actionPath(plan.path,plan.kind);validateActionData(plan.data);
  if(plan.kind==='schedule'&&(plan.data.execution!=='browser'||plan.data.warningDays!==3||plan.data.enabled&&plan.data.nextDueAt<=Date.now()))throw Error('La planificación ya no es válida. Solicita una nueva.');
  if(!['create','update','delete'].includes(plan.operation))throw Error('La operación no es válida.');
  onCommit();
  if(plan.kind==='firestore'||plan.kind==='schedule'){
   const target=doc(db,path),audit=doc(db,'dashboardActions',plan.id),pointer=doc(db,'assistantOperations/'+path+'/latest');
   await runTransaction(db,async tx=>{
    const messagePath=/^chats\/([^/]+)\/messages\/([^/]+)$/.exec(path),chat=messagePath?doc(db,'chats',messagePath[1]):null;
    const [snapshot,already,chatSnapshot]=await Promise.all([tx.get(target),tx.get(audit),chat?tx.get(chat):Promise.resolve(null)]);
    if(already.exists())return;
    const before=snapshot.data()??null;if(!sameRecord(before,plan.before))throw Error('Los datos cambiaron desde la propuesta. Solicita otra antes de confirmar.');
    let after:any=null;
    if(plan.operation==='delete')tx.delete(target);
    else if(plan.operation==='create'){after=materialize(plan.data);tx.set(target,after);}
    else{after=materialize(applyActionPatch(before,plan.data));tx.update(target,materialize(plan.data));}
    const last=chatSnapshot?.data()?.lastMessage;
    if(chat&&last&&(last.id===messagePath![2]||last.senderId===before?.senderId&&last.timestamp===before?.timestamp&&last.content===before?.content)){if(plan.operation==='delete')tx.update(chat,{lastMessage:deleteField()});else if(plan.operation==='update'&&typeof plan.data.content==='string')tx.update(chat,{'lastMessage.content':plan.data.content,'lastMessage.edited':true});}
    tx.set(audit,{actor:user.uid,target,operation:plan.operation,before,after,at:serverTimestamp()});
    tx.set(pointer,{actor:user.uid,id:plan.id,at:serverTimestamp()});
   });
  }else{
   const before=(await get(ref(rtdb,path))).val();
   if(!sameRecord(before,plan.before))throw Error('Los datos cambiaron desde la propuesta. Solicita otra.');
   const patch=Object.fromEntries(Object.entries(plan.data).map(([key,value])=>[key.replace(/\//g,'.'),value]));
   const after=plan.operation==='delete'?null:plan.operation==='update'?materialize(applyActionPatch(before,patch),true):materialize(plan.data,true);
   const changes=plan.operation==='update'?Object.fromEntries(Object.entries(plan.data).map(([key,value])=>[path+'/'+key.replace(/\./g,'/'),materialize(value,true)])):{[path]:after};
   await update(ref(rtdb),{...changes,['dashboardActions/'+plan.id]:{actor:user.uid,path,operation:plan.operation,before,after,at:realtimeTimestamp()},assistantLastAction:{id:plan.id,at:realtimeTimestamp()}});
  }
  return 'Se completó la '+({create:'creación',update:'actualización',delete:'eliminación'}[plan.operation]||'acción')+' en '+path+'.';
 };
 return {prepare,execute};
}
