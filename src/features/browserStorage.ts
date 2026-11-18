// Session-only recovery for non-security preferences when browser storage is denied or full.
// Callers requiring durable records (locks, credentials, synchronization receipts) use their own storage checks.
const temporary=new Map<string,string|null>();
export function readBrowserValue(key:string):string|null{
 if(temporary.has(key))return temporary.get(key)??null;
 try{return localStorage.getItem(key);}catch{return null;}
}
export function writeBrowserValue(key:string,value:string):boolean{
 try{localStorage.setItem(key,value);temporary.delete(key);return true;}
 catch{temporary.set(key,value);return false;}
}
export function removeBrowserValue(key:string):boolean{
 try{localStorage.removeItem(key);temporary.delete(key);return true;}
 catch{temporary.set(key,null);return false;}
}
