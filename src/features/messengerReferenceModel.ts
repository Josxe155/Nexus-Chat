import type {Chat} from '../types';
// WhatsApp Help Center 1426887324388733: the badge counts chats, not messages.
export function archiveBadgeCount(chats:Chat[],uid:string,keepArchived=true,manuallyUnreadIds:string[]=[]){return keepArchived?chats.filter(chat=>(chat.unreadCount?.[uid]||0)>0||manuallyUnreadIds.includes(chat.id)).length:chats.length;}
export function statusUpdateTime(stamp:number,now=Date.now()){const value=new Date(stamp),today=new Date(now),yesterday=new Date(now);yesterday.setDate(today.getDate()-1);const time=value.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit',hour12:false});return value.toDateString()===today.toDateString()?'Hoy, '+time:value.toDateString()===yesterday.toDateString()?'Ayer, '+time:value.toLocaleDateString('es')+', '+time;}

export function statusListTime(stamp:number,now=Date.now()){const age=Math.max(0,now-stamp);if(age<60000)return 'hace un momento';if(age<3600000){const minutes=Math.floor(age/60000);return 'hace '+minutes+(minutes===1?' minuto':' minutos');}return new Date(stamp).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit',hour12:false});}
