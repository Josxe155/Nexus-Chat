self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('nexus-chat-'))await caches.delete(key);
  await self.clients.claim();
})()));
// No offline shell, navigation interception, manifest or installation workflow.
let unread=0;
self.addEventListener('message',event=>{if(event.data?.type==='NEXUS_BADGE')unread=Math.max(0,Number(event.data.count)||0);});
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let payload;try{payload=event.data.json();}catch{return;}
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of windows)client.postMessage({type:'NEXUS_PUSH',payload});
 // A user-visible notification is required by the Web Push protocol.
 const visible=windows.some(client=>client.visibilityState==='visible');
 const silent=payload.silent||payload.banner==='unfocused'&&visible;
 const url=new URL(payload.path||'/',self.location.origin);
 await self.registration.showNotification(payload.title||'Nexus Chat',{body:payload.body||'Tienes una nueva notificación.',icon:'/nexus-icon.svg',badge:'/nexus-icon.svg',tag:payload.tag||'nexus',silent:!!silent,renotify:false,data:{url:url.href},...(payload.kind==='call'?{requireInteraction:true}:{} )});
 if(payload.badge!=='never'&&!(payload.badge==='unfocused'&&visible)&&self.navigator.setAppBadge)await self.navigator.setAppBadge(++unread).catch(()=>{});
})()));
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
 const url=new URL(event.notification.data?.url||'/',self.location.origin);if(url.origin!==self.location.origin)return;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 if(windows.length){windows[0].postMessage({type:'NEXUS_NAVIGATE',url:url.href});await windows[0].focus();}else await self.clients.openWindow(url.href);
 })());
});
