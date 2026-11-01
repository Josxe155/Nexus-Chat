export type SavedSticker={id:string;url:string;name:string};
const key=(uid:string)=>'nexus-sticker-favorites:'+uid;
export function savedStickers(uid:string):SavedSticker[]{try{const value=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(value)?value.filter(item=>typeof item.id==='string'&&typeof item.url==='string'&&typeof item.name==='string').slice(0,80):[];}catch{return [];}}
export function saveSticker(uid:string,sticker:SavedSticker){const existing=savedStickers(uid),has=existing.some(item=>item.id===sticker.id);localStorage.setItem(key(uid),JSON.stringify(has?existing.filter(item=>item.id!==sticker.id):[sticker,...existing].slice(0,80)));window.dispatchEvent(new Event('nexus:sticker-favorites'));return !has;}
