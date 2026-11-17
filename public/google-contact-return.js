(()=>{
 'use strict';
 const status=document.getElementById('contact-result');
 document.getElementById('contact-close').onclick=()=>window.close();
 const fragment=location.hash.slice(1);
 history.replaceState(null,'',location.pathname);
 try{
  if(!fragment||fragment.length>4096)throw Error();
  const value=JSON.parse(decodeURIComponent(fragment));
  if(value.protocol!=='nexus-contacts-bridge-v1'||typeof value.state!=='string'||! /^[a-f0-9-]{36}$/i.test(value.state)||!['connect','save'].includes(value.operation)||typeof value.ok!=='boolean')throw Error();
  const requestKey='nexus-contact-request:'+value.state,raw=localStorage.getItem(requestKey);
  if(!raw)throw Error();
  const request=JSON.parse(raw);
  if(!Number.isFinite(request.expires)||request.expires<=Date.now()||request.expires>Date.now()+301000||request.operation!==value.operation)throw Error();
  const result={protocol:value.protocol,state:value.state,operation:value.operation,ok:value.ok};
  if(value.ok){
   if(typeof value.email!=='string'||value.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))throw Error();
   result.email=value.email;
   if(value.operation==='save'){if(typeof value.created!=='boolean')throw Error();result.created=value.created;}
  }
  localStorage.setItem('nexus-contact-result:'+value.state,JSON.stringify(result));
  status.textContent=value.ok?'Confirmación enviada. Regresa a la pestaña de Nexus Chat.':'Google no confirmó la operación. Regresa a Nexus Chat para volver a intentarlo.';
  window.close();
 }catch{status.textContent='Esta solicitud no está activa o no se pudo comprobar. Regresa a Nexus Chat y vuelve a intentarlo.';}
})();
