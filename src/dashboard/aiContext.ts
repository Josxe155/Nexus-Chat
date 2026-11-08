import {collection,doc,getDocFromServer,getDocsFromServer,limit,orderBy,query,startAfter,where,type Firestore,type QueryDocumentSnapshot} from 'firebase/firestore';
import {metricRows,type OverviewSnapshot} from './Overview';
import {version} from '../webVersion.json';

export const sources=['Actividad','Chats','Ajustes','Reportes','Avisos oficiales','Mantenimiento'] as const;
export type Source=typeof sources[number];
export type Person={id:string;label:string};
export type ChatChoice={id:string;label:string;kind:string};

function string(value:unknown){return typeof value==='string'?value:'';}
function date(value:unknown){
 const ms=typeof value==='number'?value:(value as {toMillis?:()=>number}|null)?.toMillis?.();
 return typeof ms==='number'&&Number.isFinite(ms)&&Math.abs(ms)<=8.64e15?new Date(ms).toISOString():null;
}

export async function findPeople(db:Firestore,search:string){
 const normalize=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
 const term=normalize(search);
 const rows=await getDocsFromServer(collection(db,'users'));
 return rows.docs.flatMap(row=>{
  const {nombre,username}=row.data(),name=string(nombre),handle=string(username);
  if(!normalize(name+' '+handle).includes(term))return [];
  return [{id:row.id,label:[name,handle&&'@'+handle].filter(Boolean).join(' · ')||'Cuenta de Nexus'}];
 }).sort((a,b)=>a.label.localeCompare(b.label,'es'));
}

export async function findChats(db:Firestore,person:Person):Promise<ChatChoice[]>{
 const rows=await getDocsFromServer(query(collection(db,'chats'),where('participants','array-contains',person.id)));
 const options=rows.docs.map(async row=>{
  const data=row.data(),kind=string(data.kind)||'direct';
  const other=kind==='direct'&&Array.isArray(data.participants)?data.participants.find(uid=>typeof uid==='string'&&uid!==person.id):null;
  const contact=other?await getDocFromServer(doc(db,'users',other)).then(s=>string(s.data()?.nombre)||string(s.data()?.username)).catch(()=>''):'';
  return {id:row.id,label:string(data.title)||contact||(kind==='group'?'Grupo':kind==='channel'?'Canal':'Conversación directa'),kind};
 });
 return (await Promise.all(options)).sort((a,b)=>a.label.localeCompare(b.label,'es'));
}

export async function readChat(db:Firestore,chat:ChatChoice,person:Person,after?:QueryDocumentSnapshot){
 const rows=await getDocsFromServer(query(collection(db,'chats',chat.id,'messages'),orderBy('timestamp','desc'),...(after?[startAfter(after)]:[]),limit(21)));
 const snapshotTime=Date.now(),page=rows.docs.slice(0,20);
 const records=page.flatMap(row=>{
  const value=row.data();
  if(value.viewOnce||value.sealed||value.deletedAt||value.expiresAt&&value.expiresAt<=snapshotTime)return [];
  const text=value.type==='text'?string(value.content).slice(0,1200):'';
  return [{fecha:date(value.timestamp),tipo:string(value.type)||'mensaje',autor:value.senderId===person.id?'Persona seleccionada':'Otro participante',...(text&&{texto:text})}];
 }).reverse();
 return {payload:{fuente:'Chat',tipo:chat.kind,alcance:'Página de hasta 20 registros. Se excluyen mensajes eliminados, caducados, de vista única y cifrados antiguos. Se incluye únicamente texto y tipo; los adjuntos no se envían.',registros:records},
  next:rows.size>20?page.at(-1):undefined};
}

export async function readSection(db:Firestore,source:Exclude<Source,'Chats'>,snapshot?:OverviewSnapshot,uid?:string){
 if(source==='Actividad'){
  if(!snapshot)throw Error('Abre Resumen y espera a que terminen de cargar las cifras.');
  return {fuente:source,lectura:date(snapshot.updatedAt),metricas:Object.fromEntries(metricRows(snapshot.metrics)),dias:snapshot.metrics.days,tipos:snapshot.metrics.types};
 }
 if(source==='Reportes'){
  const read=async(name:string)=>{
   const rows=await getDocsFromServer(query(collection(db,name),orderBy('at','desc'),limit(20)));
   return rows.docs.map(row=>({tipo:string(row.data().type)||string(row.data().kind),fecha:date(row.data().at)}));
  };
  const [mensajes,conversaciones]=await Promise.all([read('messageReports'),read('communityReports')]);
  return {fuente:source,alcance:'Hasta 20 reportes recientes de cada tipo, sin motivos ni identidades.',mensajes,conversaciones};
 }
 if(source==='Avisos oficiales'){
  const rows=await getDocsFromServer(query(collection(db,'officialNotices'),orderBy('publishedAt','desc'),limit(10)));
  return {fuente:source,alcance:'10 avisos recientes',avisos:rows.docs.map(row=>({titulo:string(row.data().title),categoria:string(row.data().category),fecha:date(row.data().publishedAt)}))};
 }
 const [availability,cleanup]=await Promise.all(['availability','cleanup'].map(name=>getDocFromServer(doc(db,'publicConfig',name))));
 const mantenimiento=availability.data()?.maintenance===true,plan=cleanup.data();
 if(source==='Ajustes'){
  const preferences=uid?(await getDocFromServer(doc(db,'users',uid,'private','settings'))).data()?.chat:undefined;
  const chat=preferences?{
   calidad:preferences.uploadQuality==='hd'?'HD':'Estándar',
   enviarConEnter:preferences.enterSend===true,
   ortografia:preferences.spellcheck===true,
   mensajesTemporalesMs:typeof preferences.defaultDurationMs==='number'?preferences.defaultDurationMs:null,
  }:null;
  return {fuente:source,version:'v'+version,ajustesDisponibles:['Cuenta','Privacidad','Chats','Notificaciones','Almacenamiento y datos','Accesibilidad','Apariencia','Ayuda y comentarios','Acerca de la web'],configuracionPublicada:{mantenimiento,limpiezaMensual:plan?.enabled===true},ajustesDeChatDeEstaCuenta:chat};
 }
 return {fuente:source,mantenimiento,limpieza:{activa:plan?.enabled===true,estado:plan?.status??null,proxima:date(plan?.nextDueAt),ultima:date(plan?.lastCompletedAt)}};
}
