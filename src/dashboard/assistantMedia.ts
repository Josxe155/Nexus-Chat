import {doc,getDocFromServer,type Firestore} from 'firebase/firestore';
import {get,ref,type Database} from 'firebase/database';
import type {User} from 'firebase/auth';
import {verifyDashboardAccess} from './session';
import {ASSISTANT_MEDIA_LIMIT,decodeAssistantMedia,mediaMetadata,mediaBase64,validateMediaForAnalysis,type AssistantMediaResult} from './assistantMediaCore';
export const mediaDeclarations=[{name:'inspect_media',description:'Consulta metadatos de un archivo de Nexus por su ID en mediaFiles. Si el propietario pide analizar su contenido, includeContent=true adjunta al modelo la imagen, audio, video corto o PDF real. Hasta 8 MB acumulados por consulta. No analiza archivos de visualización única, caducados, incompletos, formatos no admitidos ni cifrado sin acceso. Nunca devuelve claves ni fragmentos como texto. Busca antes el ID con search_media o leyendo el mensaje.',parameters:{type:'OBJECT',properties:{mediaId:{type:'STRING'},includeContent:{type:'BOOLEAN'}},required:['mediaId']}}];
export function createAssistantMediaReader(db:Firestore,rtdb:Database,user:User){
 let consumed=0;const sent=new Set<string>();
 return async(args:Record<string,unknown>,signal:AbortSignal):Promise<AssistantMediaResult>=>{
  const authorized=async()=>{signal.throwIfAborted();if(!await verifyDashboardAccess(user,db))throw Error('Tu acceso de administración ya no está disponible.');signal.throwIfAborted();};
  await authorized();const id=String(args.mediaId||'');if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Indica el identificador del archivo de Nexus.');
  const snapshot=await getDocFromServer(doc(db,'mediaFiles',id));signal.throwIfAborted();
  if(!snapshot.exists())throw Error('El archivo ya no está disponible.');
  const d=snapshot.data(),result=mediaMetadata(id,d);
  if(args.includeContent!==true)return {kind:'nexus-media',result,parts:[]};
  const mimeType=validateMediaForAnalysis(d);
  if(sent.has(id))return {kind:'nexus-media',result:{...result,analysis:'content_already_attached'},parts:[]};
  if(consumed+d.size>ASSISTANT_MEDIA_LIMIT)throw Error('Se alcanzó el límite de 8 MB de archivos para esta consulta. Analiza el siguiente archivo en otro mensaje.');
  consumed+=d.size;
  const bytes=await decodeAssistantMedia(d,async index=>{await authorized();return (await get(ref(rtdb,'clientMedia/'+id+'/chunks/'+index))).val();},signal);
  await authorized();const latest=await getDocFromServer(doc(db,'mediaFiles',id));signal.throwIfAborted();
  if(!latest.exists()||JSON.stringify(latest.data())!==JSON.stringify(d))throw Error('El archivo cambió mientras se leía. Vuelve a consultarlo.');
  sent.add(id);return {kind:'nexus-media',result:{...result,analysis:'content_attached',analyzedBytes:bytes.length},parts:[{inlineData:{mimeType,data:mediaBase64(bytes)}}]};
 };
}
