const key=(uid:string)=>'nexus-search-recents:'+uid;
export function recentSearchContacts(uid:string):string[]{try{const data=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(data)?[...new Set(data.filter(value=>typeof value==='string'&&value.length<=128&&!value.includes('/')))].slice(0,8):[];}catch{return [];}}
export function rememberSearchContact(uid:string,person:string){localStorage.setItem(key(uid),JSON.stringify([person,...recentSearchContacts(uid).filter(id=>id!==person)].slice(0,8)));}
export function clearSearchHistory(uid:string){localStorage.removeItem(key(uid));}
