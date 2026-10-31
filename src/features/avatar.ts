import {isPrivateMedia,cachedMediaURL} from './mediaTransfer';
export const DEFAULT_AVATAR='/default-avatar.svg';
export function avatar(value?:string){return !value||/dicebear\.com/i.test(value)?DEFAULT_AVATAR:isPrivateMedia(value)?cachedMediaURL(value)||DEFAULT_AVATAR:value;}
