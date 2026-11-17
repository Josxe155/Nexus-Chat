self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('nexus-chat-'))await caches.delete(key);
 await self.clients.claim();
})()));
// No continuous runtime, Firebase listeners or audio capture runs in this worker.
let unread=0,noticeWork=Promise.resolve();
function siteURL(path='/'){
 try{const url=new URL(path,self.location.origin);return url.origin===self.location.origin&&['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
function normalizeNotice(payload){
 if(!payload||typeof payload!=='object'||typeof payload.title!=='string'||typeof payload.body!=='string')return null;
 const url=siteURL(typeof payload.path==='string'?payload.path:'/');
 if(!url||payload.expiresAt!==undefined&&(!Number.isFinite(payload.expiresAt)||payload.expiresAt<=Date.now()))return null;
 return {title:payload.title.slice(0,200)||'Nexus Chat',body:payload.body.slice(0,2000),url,tag:typeof payload.tag==='string'?payload.tag.slice(0,200):'nexus',category:payload.category,requireInteraction:payload.requireInteraction===true};
}
async function displayNotice(payload,clientId){
 const notice=normalizeNotice(payload);if(!notice)return false;
 // A page already back in the foreground uses its existing in-page notices.
 const source=clientId?await self.clients.get(clientId):null;
 if(source?.visibilityState==='visible')return true;
 const current=await self.registration.getNotifications({tag:notice.tag});
 if(current.some(item=>item.title===notice.title&&item.body===notice.body&&Date.now()-(item.data?.shownAt||0)<1000))return true;
 await self.registration.showNotification(notice.title,{body:notice.body,icon:'/nexus-icon.svg',badge:'/nexus-icon.svg',tag:notice.tag,silent:true,renotify:false,requireInteraction:notice.requireInteraction,data:{url:notice.url,clientId,shownAt:Date.now(),category:notice.category}});
 return true;
}
function fromSite(event){try{return !!event.source?.id&&new URL(event.source.url).origin===self.location.origin;}catch{return false;}}
self.addEventListener('message',event=>{
 if(!fromSite(event))return;
 const type=event.data?.type;
 if(type==='NEXUS_BADGE')unread=Math.max(0,Number(event.data.count)||0);
 if(type==='NEXUS_CLIENT_ID')event.ports[0]?.postMessage(event.source.id);
 if(!['NEXUS_NOTIFY','NEXUS_CLOSE_NOTICE','NEXUS_CLEAR_NOTICES'].includes(type))return;
 const run=async()=>{
  let ok=false;
  try{
   if(type==='NEXUS_NOTIFY')ok=await displayNotice(event.data.payload,event.source.id);
   else{const items=await self.registration.getNotifications();for(const item of items){if(type==='NEXUS_CLOSE_NOTICE'?item.tag===event.data.payload?.tag:item.data?.clientId===event.source.id)item.close();}ok=true;}
  }catch{/* A denied permission or unsupported notification must not break the page. */}
  event.ports[0]?.postMessage({ok});
 };
 // Serialize duplicate notices arriving from multiple open tabs.
 noticeWork=noticeWork.catch(()=>{}).then(run);event.waitUntil(noticeWork);
});
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let payload;try{payload=event.data.json();}catch{return;}
 const url=siteURL(payload?.path||'/');if(!url)return;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of windows)client.postMessage({type:'NEXUS_PUSH',payload});
 const visible=windows.some(client=>client.visibilityState==='visible');
 // Web Push needs a configured sender; registering this handler does not create one.
 await self.registration.showNotification(String(payload.title||'Nexus Chat').slice(0,200),{body:String(payload.body||'Tienes una nueva notificación.').slice(0,2000),icon:'/nexus-icon.svg',badge:'/nexus-icon.svg',tag:payload.tag||'nexus',silent:!!(payload.silent||payload.banner==='unfocused'&&visible),renotify:false,data:{url,shownAt:Date.now()},...(payload.kind==='call'?{requireInteraction:true}:{})});
 if(payload.badge!=='never'&&!(payload.badge==='unfocused'&&visible)&&self.navigator.setAppBadge)await self.navigator.setAppBadge(++unread).catch(()=>{});
})()));
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  const url=siteURL(event.notification.data?.url||'/');if(!url)return;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const preferred=windows.find(client=>client.id===event.notification.data?.clientId);
  const target=preferred||windows.find(client=>client.focused)||windows[0];
  if(target){target.postMessage({type:'NEXUS_NAVIGATE',url});await target.focus();}else await self.clients.openWindow(url);
 })());
});
