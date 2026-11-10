import type {Chat} from '../types';
export const CHANNEL_PRESET_REACTIONS=['👍','❤️','😂','😮','😢','🙏'] as const;
export type ChannelReactionMode='all'|'preset'|'none';
export function channelOwner(chat:Chat){return chat.createdBy||chat.admins?.[0]||'';}
export function channelFollowers(chat:Chat){return chat.channelVersion===2?Math.max(0,chat.followerCount||0):chat.participants.filter(uid=>!chat.admins?.includes(uid)).length;}
export function canChannelReact(chat:Chat,emoji:string){return chat.kind!=='channel'||!chat.channelDeletedAt&&(!emoji||chat.channelReactionMode!=='none'&&(chat.channelReactionMode!=='preset'||(CHANNEL_PRESET_REACTIONS as readonly string[]).includes(emoji)));}
export function channelLink(id:string){if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id))throw Error('El enlace del canal no está disponible.');return new URL('/?channel='+encodeURIComponent(id),location.origin).href;}
export function validateChannelInfo(title:string,description:string){const name=title.trim(),info=description.trim();if(!name||name.length>100)throw Error('Escribe un nombre de hasta 100 caracteres.');if(info.length>1000)throw Error('La descripción admite hasta 1000 caracteres.');return {title:name,description:info};}
export function channelKey(channelId:string,uid:string){if(!/^[a-zA-Z0-9_-]{1,128}$/.test(channelId)||!uid||uid.includes('/')||uid.length>128)throw Error('No se pudo comprobar el canal.');return channelId+'~'+uid;}
