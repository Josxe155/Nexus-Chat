import {filterMessagePage} from './assistantMessageTools';
import {mediaMetadata} from './assistantMediaCore';
import {redactAssistantData} from './assistantData';
import {collection,doc,documentId,getDocFromServer,getDocsFromServer,getCountFromServer,query,orderBy,startAfter,limit,where,type Firestore,type QueryConstraint} from 'firebase/firestore';
import {get,ref,query as realtimeQuery,orderByKey,startAfter as afterKey,limitToFirst,type Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {verifyDashboardAccess} from './session';

const string={type:'STRING'};
export const readDeclarations=[
 {name:'search_messages',description:'Busca mensajes en un chat concreto, por fragmento de texto, authorId o type opcionales. Examina una página de 50 registros ordenados por ID. Sigue after aunque records esté vacío: los filtros se aplican a cada página, no representan el total. Devuelve identificadores para preparar cambios precisos.',parameters:{type:'OBJECT',properties:{chatId:string,text:string,authorId:string,type:string,after:string},required:['chatId']}},
 {name:'search_media',description:'Busca archivos del catálogo por nombre, chatId, ownerId o prefijo MIME opcionales. Pagina 50 por ID; sigue after aunque no haya coincidencias. Devuelve metadatos sin claves. Usa inspect_media para analizar el contenido real.',parameters:{type:'OBJECT',properties:{text:string,chatId:string,ownerId:string,mimeType:string,after:string}}},
 {name:'read_document',description:'Lee cualquier documento de Firestore por su ruta completa.',parameters:{type:'OBJECT',properties:{path:string},required:['path']}},
 {name:'read_collection',description:'Consulta cualquier colección o subcolección. Devuelve páginas de 50 registros y un cursor after. Puede filtrar por campo y valor exacto. Sigue el cursor para leer más.',parameters:{type:'OBJECT',properties:{path:string,after:string,field:string,value:string},required:['path']}},
 {name:'count_collection',description:'Cuenta todos los documentos de una colección, opcionalmente por campo y valor exacto.',parameters:{type:'OBJECT',properties:{path:string,field:string,value:string},required:['path']}},
 {name:'read_realtime',description:'Lee datos de Realtime Database por ruta; devuelve páginas de 50 claves. Sigue after para continuar.',parameters:{type:'OBJECT',properties:{path:string,after:string},required:['path']}},
];
export const dataMap={
 firestore:['users','chats','communities','statuses','mediaFiles','callRooms','messageReports','communityReports','officialNotices','publicConfig','dashboardVisits','nexusNumbers','nexusNumberReservations','contactCodes','dashboardAdmins','usernames','dashboardActions','dashboardEdits'],
 subcollections:['users/{uid}/private (profile, privacy, settings, contacts, phone-contacts, contactQr)','users/{uid}/details','users/{uid}/conversations','chats/{chatId}/messages','statuses/{id}/reactions'],
 realtime:['presence','calls','clientMedia','dashboardAdmins','moderatedUsers'],
 schemas:{officialNotices:{fields:{category:'Novedad | Aviso | Seguridad',title:'texto no vacío, hasta 100 caracteres',body:'texto no vacío, hasta 2000 caracteres',publishedAt:{$serverTimestamp:true}}},availability:{path:'publicConfig/availability',fields:{maintenance:'boolean',updatedAt:{$serverTimestamp:true}}},messages:'Conservar id, chatId, senderId y fecha original; para texto cambiar content y edited=true. Para archivos consultar mediaFiles antes que fragmentos clientMedia.'},
 instructions:'Las rutas de lectura son orientativas, no una lista cerrada. La escritura se limita a datos operativos y excluye cuentas, perfiles, identidad, moderación y seguridad. Consulta cualquier ruta necesaria. Los recuentos usan count_collection; las listas se paginan. No interpretes una página como el total. No se dispone de contraseñas de Authentication ni se pueden descifrar datos sin sus claves originales.',
};
export function createDashboardReader(db:Firestore,rtdb:Database,user:User){
 return async(name:string,args:Record<string,unknown>,signal:AbortSignal)=>{
  signal.throwIfAborted();
  if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');
  if(name==='search_messages'){if(typeof args.chatId!=='string'||!/^[^/\s]{1,128}$/.test(args.chatId))throw Error('Indica el chat exacto.');args={...args,path:'chats/'+args.chatId+'/messages'};}
  if(name==='search_media')args={...args,path:'mediaFiles'};
  const path=typeof args.path==='string'?args.path.replace(/^\/+|\/+$/g,''):'';
  if(path.split('/')[0]==='guestAccountCredentials')throw Error('Las credenciales de acceso no están disponibles para el asistente.');
  if(name==='read_realtime'&&path.split('/')[0]==='clientMedia')throw Error('Consulta el catálogo de archivos para analizar su información; los fragmentos binarios quedan protegidos.');
  if(!path)throw Error('Indica una ruta para consultar.');
  const constraints:QueryConstraint[]=[];
  if(typeof args.field==='string'&&args.field){let value:unknown=args.value;try{value=JSON.parse(String(value));}catch{}constraints.push(where(args.field,'==',value));}
  let result:unknown;
  if(name==='read_document'){
   const snapshot=await getDocFromServer(doc(db,path));result={path,exists:snapshot.exists(),data:snapshot.data()??null};
  }else if(name==='count_collection'){
   result={path,count:(await getCountFromServer(query(collection(db,path),...constraints))).data().count};
  }else if(['read_collection','search_messages','search_media'].includes(name)){
   const rows=await getDocsFromServer(query(collection(db,path),...constraints,orderBy(documentId()),...(typeof args.after==='string'&&args.after?[startAfter(args.after)]:[]),limit(51)));
   const page=rows.docs.slice(0,50),records=page.map(row=>({id:row.id,data:row.data()}));
   const filtered=name==='search_messages'?filterMessagePage(records,args):name==='search_media'?records.filter(({data:d})=>(!args.chatId||d.chatId===args.chatId)&&(!args.ownerId||d.owner===args.ownerId)&&(!args.mimeType||String(d.type||'').startsWith(String(args.mimeType)))&&(!args.text||String(d.name||'').toLocaleLowerCase().includes(String(args.text).toLocaleLowerCase().slice(0,1000)))).map(({id,data})=>mediaMetadata(id,data)):records;
   result={path,records:filtered,scanned:page.length,after:rows.size>50?page.at(-1)?.id:null,complete:rows.size<=50};
  }else if(name==='read_realtime'){
   const snapshot=await get(realtimeQuery(ref(rtdb,path),orderByKey(),...(typeof args.after==='string'&&args.after?[afterKey(args.after)]:[]),limitToFirst(51)));
   const entries:{id:string;data:unknown}[]=[];snapshot.forEach(child=>{entries.push({id:child.key!,data:child.val()});});
   result={path,records:entries.slice(0,50),value:entries.length?undefined:snapshot.val(),after:entries.length>50?entries[49].id:null,complete:entries.length<=50};
  }else throw Error('Solo están disponibles operaciones de consulta.');
  signal.throwIfAborted();return redactAssistantData(result);
 };
}
