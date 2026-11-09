export type AssistantAction={id:string;kind:'firestore'|'realtime'|'cleanup'|'schedule';path:string;operation:'create'|'update'|'delete'|'cleanup';data:Record<string,any>;before:unknown;createdAt:number;actor:string;executedAt?:number};
const protectedRoots=new Set(['dashboardAdmins','dashboardActions','dashboardEdits','assistantOperations','assistantLastAction','dashboardSecurity']);
export function actionPath(raw:unknown,kind:'firestore'|'realtime'){
 if(typeof raw!=='string')throw Error('Falta el destino de la acción.');
 const path=raw.replace(/^\/+|\/+$/g,''),parts=path.split('/');
 if(!path||parts.some(p=>!p||['__proto__','prototype','constructor'].includes(p))||protectedRoots.has(parts[0]))throw Error('No se puede cambiar la autorización administrativa ni los registros de auditoría desde el asistente.');
 if(kind==='firestore'&&parts.length%2!==0)throw Error('El destino debe ser un documento concreto.');
 if(kind==='realtime'&&/[.#$\[\]]/.test(path))throw Error('La ruta no es válida.');
 if(path==='publicConfig/cleanup')throw Error('Usa las herramientas de planificación o limpieza confirmada.');
 return path;
}
export function normalizeRecord(value:any):any{
 if(value===undefined)return null;if(value===null||typeof value!=='object')return value;
 if(typeof value.toMillis==='function')return {$timestamp:value.toMillis()};
 if(typeof value.path==='string'&&value.firestore)return {$reference:value.path};
 if(typeof value.toBase64==='function')return {$bytes:value.toBase64()};
 if(Array.isArray(value))return value.map(normalizeRecord);
 return Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalizeRecord(value[key])]));
}
export const sameRecord=(left:unknown,right:unknown)=>JSON.stringify(normalizeRecord(left))===JSON.stringify(normalizeRecord(right));
export function validateActionData(value:unknown):Record<string,any>{
 if(!value||Array.isArray(value)||typeof value!=='object')throw Error('Los datos del cambio deben ser un objeto.');
 const check=(object:any)=>{if(object&&typeof object==='object')for(const key of Object.keys(object)){if(key.split('.').some(part=>['__proto__','constructor','prototype'].includes(part)))throw Error('Un campo del cambio no es válido.');check(object[key]);}};check(value);return value as Record<string,any>;
}
export function applyActionPatch(before:any,patch:Record<string,any>){
 const result={...(before??{})};
 for(const [field,value] of Object.entries(patch)){
  const parts=field.split('.');let target=result;
  for(const key of parts.slice(0,-1)){target[key]=target[key]&&typeof target[key]==='object'&&!Array.isArray(target[key])?{...target[key]}:{};target=target[key];}
  const key=parts.at(-1)!;if(value&&typeof value==='object'&&value.$delete===true)delete target[key];else target[key]=value;
 }
 return result;
}
export function requestsImmediateAction(prompt:string,plan:AssistantAction){
 if(plan.kind==='cleanup')return false;
 return /^(?:por\s+favor[,\s]+)?(?:crea|a[nñ]ade|agrega|actualiza|modifica|edita|cambia|publica|activa|desactiva|pausa|reprograma|elimina|borra|quita|escribe|envía|manda|guarda|restaura|archiva|fija|silencia|bloquea|desbloquea|retira|mueve)\b/iu.test(prompt.trim());
}
