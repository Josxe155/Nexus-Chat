export type StoredTurn={question:string;answer:string;at?:number;actions?:unknown[]};
export const historyKey=(uid:string)=>'nexus-dashboard-assistant:v1:'+uid;
const cookieName='nexus_assistant_local',cacheName='nexus-assistant-local-anchor-v1';
const marker=()=>new URL('/__nexus_assistant_local_anchor__',location.origin).href;
export async function loadAssistantHistory(uid:string):Promise<StoredTurn[]>{
 let anchor=document.cookie.split('; ').find(value=>value.startsWith(cookieName+'='))?.split('=')[1];
 let cache:Cache|undefined,valid=false;
 try{cache=await caches.open(cacheName);valid=!!anchor&&(await (await cache.match(marker()))?.text())===anchor;}catch{valid=!!anchor;}
 if(!valid){for(const key of Object.keys(localStorage))if(key.startsWith('nexus-dashboard-assistant:'))localStorage.removeItem(key);anchor=crypto.randomUUID();document.cookie=cookieName+'='+anchor+'; Path=/; Max-Age=31536000; SameSite=Strict'+(location.protocol==='https:'?'; Secure':'');if(cache)await cache.put(marker(),new Response(anchor));}
 const raw=localStorage.getItem(historyKey(uid));if(!raw)return [];
 let saved:any;try{saved=JSON.parse(raw);}catch{localStorage.removeItem(historyKey(uid));return [];}
 if(saved.anchor!==anchor||!Array.isArray(saved.turns)){localStorage.removeItem(historyKey(uid));return [];}
 return saved.turns.filter((turn:any)=>typeof turn?.question==='string'&&typeof turn?.answer==='string').map((turn:StoredTurn)=>({...turn,actions:Array.isArray(turn.actions)?turn.actions.filter((plan:any)=>plan&&typeof plan.id==='string'&&typeof plan.actor==='string'&&typeof plan.path==='string'&&['firestore','realtime','cleanup','schedule'].includes(plan.kind)&&['create','update','delete','cleanup'].includes(plan.operation)&&Number.isFinite(plan.createdAt)&&plan.data&&typeof plan.data==='object'):[]}));
}
export function saveAssistantHistory(uid:string,turns:StoredTurn[]){
 const anchor=document.cookie.split('; ').find(value=>value.startsWith(cookieName+'='))?.split('=')[1];
 if(!anchor)throw Error('Este navegador no permite conservar el historial local.');
 localStorage.setItem(historyKey(uid),JSON.stringify({anchor,turns}));
}
export async function clearAssistantHistories(){
 for(const key of Object.keys(localStorage))if(key.startsWith('nexus-dashboard-assistant:'))localStorage.removeItem(key);
 document.cookie=cookieName+'=; Path=/; Max-Age=0; SameSite=Strict';
 if('caches' in window)await caches.delete(cacheName).catch(()=>{});window.dispatchEvent(new Event('nexus:assistant-history-cleared'));
}
export function assistantContextHistory(turns:StoredTurn[]){
 const selected:StoredTurn[]=[];let size=0;
 for(let index=turns.length-1;index>=0;index--){const turn={question:turns[index].question,answer:turns[index].answer,at:turns[index].at};const bytes=JSON.stringify(turn).length;if(size+bytes>70000)break;selected.unshift(turn);size+=bytes;}
 return selected;
}

export const localHistoryDeclaration={name:'search_local_history',description:'Busca en todo el historial local de Nexus Assistant de este navegador. Devuelve hasta 20 coincidencias por página; usa after para continuar. No consulta Firebase.',parameters:{type:'OBJECT',properties:{query:{type:'STRING'},after:{type:'INTEGER'}}}};
export function searchAssistantHistory(turns:StoredTurn[],args:Record<string,unknown>){
 const term=String(args.query||'').toLocaleLowerCase(),after=typeof args.after==='number'?Math.max(-1,Math.floor(args.after)):-1;
 const matches=turns.map((turn,index)=>({index,question:turn.question,answer:turn.answer,at:turn.at??null})).filter(turn=>turn.index>after&&(turn.question+' '+turn.answer).toLocaleLowerCase().includes(term));
 return {records:matches.slice(0,20),after:matches.length>20?matches[19].index:null,complete:matches.length<=20};
}

export async function assistantAnchorValid(){
 const anchor=document.cookie.split('; ').find(value=>value.startsWith(cookieName+'='))?.split('=')[1];if(!anchor)return false;
 try{if(!await caches.has(cacheName))return false;return await (await (await caches.open(cacheName)).match(marker()))?.text()===anchor;}catch{return true;}
}

export function clearAssistantHistory(uid:string){localStorage.removeItem(historyKey(uid));window.dispatchEvent(new Event('nexus:assistant-history-cleared'));}
