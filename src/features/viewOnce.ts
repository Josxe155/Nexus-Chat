import type {Message} from '../types';

export const isViewOnceVisual=(message?:Message)=>message?.viewOnce===true&&['image','video'].includes(message.type);
export const isOneTimeMedia=(message?:Message)=>isViewOnceVisual(message)||message?.type==='audio'&&!!message.fileName?.startsWith('nota-unica-');
