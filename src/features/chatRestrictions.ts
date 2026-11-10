import {useEffect,useState} from 'react';
import {createLocalLock,verifyLocalLock} from './AppLock';
export type RestrictionSettings={hidden:boolean;code?:{salt:string;hash:string}};
const key=(uid:string)=>'nexus-chat-restrictions:'+uid;
export const chatRestrictionKey=(uid:string,id:string)=>'nexus-lock-'+uid+':chat:'+id;
export function isChatRestricted(uid:string,id:string){try{const value=JSON.parse(localStorage.getItem(chatRestrictionKey(uid,id))||'null');return !!value&&typeof value.salt==='string'&&/^[a-f0-9]{64}$/.test(value.hash);}catch{return false;}}
export function restrictionSettings(uid:string):RestrictionSettings{try{const value=JSON.parse(localStorage.getItem(key(uid))||'{}'),code=value.code&&typeof value.code.salt==='string'&&/^[a-f0-9]{64}$/.test(value.code.hash)?value.code:undefined;return {hidden:!!value.hidden&&!!code,...(code?{code}:{})};}catch{return {hidden:false};}}
function save(uid:string,value:RestrictionSettings){localStorage.setItem(key(uid),JSON.stringify(value));window.dispatchEvent(new Event('nexus:chat-locks'));}
export async function saveSecretCode(uid:string,password:string,hidden:boolean){const clean=password;if(!clean.trim()||clean.length>64)throw Error('Usa una palabra o emoji de hasta 64 caracteres.');const code=await createLocalLock(clean);save(uid,{hidden,code});}
export async function matchesSecretCode(uid:string,value:string){const code=restrictionSettings(uid).code;return !!code&&value.length<=64&&await verifyLocalLock(value,JSON.stringify(code));}
export function hideRestrictedChats(uid:string,hidden:boolean){const settings=restrictionSettings(uid);if(hidden&&!settings.code)throw Error('Crea un código secreto antes de ocultar los chats.');save(uid,{...settings,hidden});}
export function disableSecretCode(uid:string){save(uid,{hidden:false});}
export function useRestrictionRevision(){const [revision,setRevision]=useState(0);useEffect(()=>{const update=()=>setRevision(old=>old+1);window.addEventListener('nexus:chat-locks',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('nexus:chat-locks',update);window.removeEventListener('storage',update);};},[]);return revision;}
export function useSecretMatch(uid:string,value:string){const revision=useRestrictionRevision(),[matched,setMatched]=useState(false);useEffect(()=>{let live=true;setMatched(false);if(!value||!restrictionSettings(uid).hidden)return;const timer=setTimeout(()=>{void matchesSecretCode(uid,value).then(result=>{if(live)setMatched(result);}).catch(()=>{});},300);return()=>{live=false;clearTimeout(timer);};},[uid,value,revision]);return matched;}
