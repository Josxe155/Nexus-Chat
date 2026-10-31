export const transferKey=(uid:string)=>'nexus-transfer-usage:'+uid;
export function fileUsage(uid:string){try{return {sent:0,received:0,since:Date.now(),...JSON.parse(localStorage.getItem(transferKey(uid))||'{}')};}catch{return {sent:0,received:0,since:Date.now()};}}
export function trackTransfer(uid:string,direction:'sent'|'received',bytes:number){if(!uid||bytes<=0)return;const value=fileUsage(uid);value[direction]+=bytes;localStorage.setItem(transferKey(uid),JSON.stringify(value));window.dispatchEvent(new Event('nexus:transfer-usage'));}
