export const ASSISTANT_MEDIA_LIMIT=8*1024*1024;
const CHUNK=1024*1024;
export type InlineMediaPart={inlineData:{mimeType:string;data:string}};
export type AssistantMediaResult={kind:'nexus-media';result:Record<string,unknown>;parts:InlineMediaPart[]};
export function mediaMetadata(id:string,d:Record<string,any>){
 const fields=['owner','scope','chatId','referenceId','name','type','size','createdAt','expiresAt','complete','viewOnce'];
 return {id,...Object.fromEntries(fields.filter(key=>['string','number','boolean'].includes(typeof d[key])).map(key=>[key,typeof d[key]==='string'?d[key].slice(0,512):d[key]])),analysis:'metadata'};
}
export function mediaMime(type:unknown){
 const mime=typeof type==='string'?type.split(';')[0].trim().toLowerCase():'';
 if(!/^(?:image\/(?:jpeg|png|webp|heic|heif)|audio\/(?:wav|x-wav|mpeg|mp3|mp4|aac|ogg|flac|webm)|video\/(?:mp4|webm|quicktime|mpeg)|application\/pdf)$/.test(mime))throw Error('Puedo consultar la información de este archivo, pero su formato todavía no admite análisis de contenido.');
 return mime;
}
export function validateMediaForAnalysis(d:Record<string,any>,now=Date.now()){
 if(d.viewOnce===true)throw Error('Los archivos de visualización única no se envían al asistente.');
 if(d.complete!==true)throw Error('El archivo todavía no está completo.');
 if(d.expiresAt&&(!Number.isFinite(d.expiresAt)||d.expiresAt<=now))throw Error('El archivo ha caducado.');
 if(d.sealedKey||typeof d.key!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(d.key))throw Error('No se dispone de acceso al contenido de este archivo. Solo puedo consultar su información.');
 if(!Number.isInteger(d.size)||d.size<=0||d.size>ASSISTANT_MEDIA_LIMIT)throw Error('El análisis admite hasta 8 MB por consulta. Puedo revisar la información de archivos mayores.');
 if(!Number.isInteger(d.chunks)||d.chunks!==Math.ceil(d.size/CHUNK))throw Error('La estructura del archivo está incompleta.');
 return mediaMime(d.type);
}
const decode=(value:string)=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export function mediaBase64(bytes:Uint8Array){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export async function decodeAssistantMedia(d:Record<string,any>,readChunk:(index:number)=>Promise<any>,signal:AbortSignal){
 signal.throwIfAborted();validateMediaForAnalysis(d);
 const key=await crypto.subtle.importKey('raw',decode(d.key),{name:'AES-GCM'},false,['decrypt']);
 const bytes=new Uint8Array(d.size);let offset=0;
 for(let index=0;index<d.chunks;index++){
  signal.throwIfAborted();const part=await readChunk(index);signal.throwIfAborted();
  if(!part||typeof part.iv!=='string'||part.iv.length!==16||typeof part.cipher!=='string'||part.cipher.length>1400000)throw Error('Falta un fragmento válido del archivo.');
  let plain:ArrayBuffer;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(part.iv)},key,decode(part.cipher));}catch{throw Error('No se pudo verificar el contenido del archivo.');}
  const expected=Math.min(CHUNK,d.size-offset);if(plain.byteLength!==expected)throw Error('El tamaño del archivo no coincide con su información.');
  bytes.set(new Uint8Array(plain),offset);offset+=plain.byteLength;
 }
 signal.throwIfAborted();return bytes;
}
