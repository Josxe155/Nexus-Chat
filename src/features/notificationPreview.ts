export function noticePreview(title:string,body:string,enabled:boolean){
 return enabled?{title,body}:{title:'Nexus Chat',body:'Tienes una nueva notificación.'};
}

export function notificationClientId(worker:ServiceWorker|null){
 if(!worker||typeof MessageChannel==='undefined')return Promise.resolve(undefined);
 return new Promise<string|undefined>(resolve=>{
  const channel=new MessageChannel();
  const finish=(id?:string)=>{clearTimeout(timeout);channel.port1.close();resolve(id);};
  const timeout=setTimeout(()=>finish(),500);
  channel.port1.onmessage=event=>finish(typeof event.data==='string'?event.data:undefined);
  try{worker.postMessage({type:'NEXUS_CLIENT_ID'},[channel.port2]);}catch{channel.port2.close();finish();}
 });
}
