import type {Chat,UserProfile} from '../types';
import type {ContactName} from './contacts';
export function personalContacts(user:UserProfile,users:UserProfile[],names:Record<string,ContactName>,query='',numbers:Record<string,string>={}){
 const saved=new Set([...(user.privacy?.contactIds||[]),...Object.keys(names)]),text=query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es'),digits=query.replace(/\D/g,'');
 return users.filter(person=>person.uid!==user.uid&&saved.has(person.uid)&&!person.moderationRemoved).map(person=>({...person,nombre:names[person.uid]?[names[person.uid].first,names[person.uid].last].filter(Boolean).join(' '):person.nombre})).filter(person=>(person.nombre+' '+person.username).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').includes(text)||!!digits&&/^\+?[\d\s().-]+$/.test(query)&&numbers[person.uid]?.replace(/\D/g,'').includes(digits)).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es',{numeric:true,sensitivity:'base'}));
}
export function frequentContacts(contacts:UserProfile[],chats:Chat[],owner:string){
 const times=new Map<string,number>();for(const chat of chats){if(chat.kind&&chat.kind!=='direct'||!chat.participants.includes(owner))continue;const other=chat.participants.find(uid=>uid!==owner);if(other&&chat.lastMessage&&Number.isFinite(chat.lastMessage.timestamp))times.set(other,Math.max(times.get(other)||0,chat.lastMessage.timestamp));}
 return contacts.filter(person=>times.has(person.uid)).sort((a,b)=>(times.get(b.uid)||0)-(times.get(a.uid)||0)).slice(0,8);
}
export function validateGroupDraft(title:string,members:string[],owner:string){
 const clean=title.trim(),unique=[...new Set(members)].filter(uid=>uid!==owner);if(!clean||clean.length>100)throw Error('Proporciona el nombre del grupo y una imagen (opcional).');
 if(unique.length>99||unique.some(uid=>!uid||uid.includes('/')))throw Error('El grupo admite hasta 100 miembros.');return {title:clean,members:unique};
}
export function contactActionError(cause:unknown,fallback:string){
 if(cause&&typeof cause==='object'&&('code'in cause||'name'in cause&&['TypeError','NotAllowedError','SecurityError','QuotaExceededError'].includes(String(cause.name))))return fallback;
 return cause instanceof Error?cause.message:fallback;
}
