import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
const SCOPE='https://www.googleapis.com/auth/contacts';
const draft={uid:'peer',first:'Alias',last:'Personal',username:'peer',phone:'+593991234567'};
const bundle=build({entryPoints:['src/features/googleContacts.ts'],bundle:true,write:false,format:'cjs',platform:'browser',plugins:[{name:'isolated-auth',setup(builder){builder.onResolve({filter:/^(firebase\/auth|\.\.\/firebase|\.\.\/drive-client\.json)$/},args=>({path:args.path,namespace:'fixture'}));builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='firebase/auth'?'export function onAuthStateChanged(auth,cb){globalThis.__authChanged=cb;}':args.path==='../firebase'?'export const auth=globalThis.__auth;':'export default {clientId:"public-test-client"};',loader:'js'}));}}]});
async function fixture(options:any={}){
 const records:any[]=options.records||[],calls:any[]=[],storage=options.storage||new Map(),state={time:Date.now(),subject:'google-owner',email:'owner@example.test',scope:SCOPE,...options.state};
 const context:any={__auth:{currentUser:{uid:'owner',email:'owner@example.test',emailVerified:true,providerData:[{providerId:'google.com',uid:'google-owner'}]}},URL,URLSearchParams,Blob,AbortSignal,Response,setTimeout,clearTimeout,console,module:{exports:{}},exports:{},navigator:{locks:{request:async(name:string,action:()=>Promise<unknown>)=>action()}},localStorage:{getItem:(key:string)=>storage.get(key)||null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)},Date:class extends Date{static now(){return state.time;}}};
 context.window={google:{accounts:{oauth2:{initTokenClient:(settings:any)=>{context.__oauth=settings;return {requestAccessToken:()=>settings.callback({access_token:'temporary-access-token',expires_in:3600,scope:state.scope})};}}}}};
 context.fetch=async(url:string,init:RequestInit={})=>{
  calls.push({url,init});
  if(options.fetch){const overridden=await options.fetch(url,init,records,context);if(overridden)return overridden;}
  if(url==='https://openidconnect.googleapis.com/v1/userinfo')return Response.json({sub:state.subject,email:state.email,email_verified:true});
  assert.ok(url.startsWith('https://people.googleapis.com/v1/'));assert.equal(init.redirect,'error');
  if(url.includes('/connections?'))return Response.json({connections:records});
  if(init.method==='POST'){const body=JSON.parse(String(init.body)),person={...body,resourceName:'people/c'+(records.length+1),etag:'etag',metadata:{sources:[{type:'CONTACT',id:'source',etag:'etag'}]}};records.push(person);return Response.json(person);}
  const name=new URL(url).pathname.slice(4).split(':')[0],person=records.find(p=>p.resourceName===name);
  if(!person)return new Response('{}',{status:404});
  if(init.method==='PATCH'){Object.assign(person,JSON.parse(String(init.body)));return Response.json(person);}
  return Response.json(person);
 };
 runInNewContext((await bundle).outputFiles[0].text,context);return {api:context.module.exports,context,records,calls,storage,state};
}
const writes=(f:any)=>f.calls.filter((call:any)=>['POST','PATCH'].includes(call.init.method));
test('Google exige consentimiento, correo verificado y la cuenta vinculada a Nexus',async()=>{
 const wrong=await fixture({state:{subject:'other-google'}});await assert.rejects(wrong.api.connectGoogleContacts('owner'),/cuenta de Google asociada/);assert.equal(writes(wrong).length,0);assert.equal(wrong.calls.length,1);
 const unverified=await fixture();unverified.context.__auth.currentUser.emailVerified=false;await assert.rejects(unverified.api.connectGoogleContacts('owner'),/Verifica el correo/);assert.equal(unverified.calls.length,0);
 const denied=await fixture({state:{scope:'openid email'}});await assert.rejects(denied.api.connectGoogleContacts('owner'),/Autoriza/);assert.equal(denied.calls.length,0);
});
test('la conexión comprueba People API sin escribir y no guarda el token en almacenamiento',async()=>{
 const f=await fixture();assert.equal(await f.api.connectGoogleContacts('owner'),'owner@example.test');assert.equal(f.api.googleContactsAccount('owner'),'owner@example.test');assert.equal(writes(f).length,0);assert.equal(f.storage.size,0);assert.equal(f.context.__oauth.include_granted_scopes,false);
});
test('un error de configuración no se presenta como conexión completada',async()=>{
 const f=await fixture({fetch:async(url:string)=>url.includes('/connections?')?new Response('{}',{status:403}):undefined});await assert.rejects(f.api.connectGoogleContacts('owner'),/Google no permitió/);assert.equal(f.api.googleContactsAccount('owner'),undefined);assert.equal(writes(f).length,0);
});
test('crea el alias privado con campos Nexus, sin inventar teléfonos reales ni compartir otros datos',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');await f.api.syncContactToGoogle('owner',draft);
 const body=JSON.parse(writes(f)[0].init.body);assert.deepEqual(body.names,[{givenName:'Alias',familyName:'Personal'}]);assert.equal(body.phoneNumbers,undefined);assert.ok(body.userDefined.some((x:any)=>x.key==='Nexus Chat · número'&&x.value===draft.phone));assert.equal(body.emailAddresses,undefined);assert.equal(f.records.length,1);assert.ok(!JSON.stringify([...f.storage.values()]).includes('temporary-access-token'));
});
test('actualiza el vínculo sin duplicar, conserva campos ajenos y envía la versión actual',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');await f.api.syncContactToGoogle('owner',draft);f.records[0].userDefined.push({key:'Aniversario',value:'personal'});f.records[0].emailAddresses=[{value:'private@example.test'}];f.records[0].metadata.sources[0].etag='new-etag';
 await f.api.syncContactToGoogle('owner',{...draft,first:'Nuevo alias'});assert.equal(f.records.length,1);const call=writes(f)[1],body=JSON.parse(call.init.body);assert.equal(call.init.method,'PATCH');assert.equal(body.metadata.sources[0].etag,'new-etag');assert.ok(body.userDefined.some((x:any)=>x.key==='Aniversario'));assert.deepEqual(f.records[0].emailAddresses,[{value:'private@example.test'}]);assert.ok(!new URL(call.url).searchParams.get('updatePersonFields')?.includes('emailAddresses'));
});
test('lee todas las páginas antes de decidir que no hay contacto vinculado',async()=>{
 let pages=0;const f=await fixture({fetch:async(url:string,init:any,records:any[])=>{if(url.includes('pageSize=1000')){pages++;return pages===1?Response.json({connections:[],nextPageToken:'next'}):Response.json({connections:records});}}});await f.api.connectGoogleContacts('owner');await f.api.syncContactToGoogle('owner',draft);assert.equal(pages,2);assert.equal(f.records.length,1);
});
test('una lectura incompleta o permisos vencidos impiden nuevas escrituras',async()=>{
 const f=await fixture({fetch:async(url:string)=>url.includes('pageSize=1000')?new Response('{}',{status:401}):undefined});await f.api.connectGoogleContacts('owner');await assert.rejects(f.api.syncContactToGoogle('owner',draft),/Vuelve a conectar/);await assert.rejects(f.api.syncContactToGoogle('owner',draft),/Vuelve a conectar/);assert.equal(writes(f).length,0);
});
test('una respuesta perdida al crear bloquea otro POST incluso tras recargar',async()=>{
 const f=await fixture({fetch:async(url:string,init:any)=>{if(init.method==='POST')throw Error('connection lost');}});await f.api.connectGoogleContacts('owner');await assert.rejects(f.api.syncContactToGoogle('owner',draft),/connection lost/);await assert.rejects(f.api.syncContactToGoogle('owner',draft),/guardado anterior/);assert.equal(writes(f).length,1);
 const reload=await fixture({storage:f.storage});await reload.api.connectGoogleContacts('owner');await assert.rejects(reload.api.syncContactToGoogle('owner',draft),/guardado anterior/);assert.equal(writes(reload).length,0);
});
test('recupera un contacto creado cuando se perdió la respuesta sin crear otro',async()=>{
 let lost=true;const f=await fixture({fetch:async(url:string,init:any,records:any[])=>{if(init.method==='POST'&&lost){lost=false;records.push({...JSON.parse(init.body),resourceName:'people/recovered',metadata:{sources:[{type:'CONTACT',etag:'v1'}]}});throw Error('lost');}}});await f.api.connectGoogleContacts('owner');await assert.rejects(f.api.syncContactToGoogle('owner',draft));await f.api.syncContactToGoogle('owner',draft);assert.equal(f.records.length,1);assert.deepEqual(writes(f).map((c:any)=>c.init.method),['POST','PATCH']);
});
test('serializa guardados simultáneos de la misma persona',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');await Promise.all([f.api.syncContactToGoogle('owner',draft),f.api.syncContactToGoogle('owner',draft)]);assert.equal(f.records.length,1);assert.deepEqual(writes(f).map((c:any)=>c.init.method),['POST','PATCH']);
});
test('cambio de sesión o token caducado detiene el siguiente acceso',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');f.state.time+=3600001;await assert.rejects(f.api.syncContactToGoogle('owner',draft),/Vuelve a conectar/);assert.equal(writes(f).length,0);
 f.context.__auth.currentUser={uid:'other'};f.context.__authChanged();await assert.rejects(f.api.syncContactToGoogle('owner',draft),/sesión cambió/);assert.equal(f.api.googleContactsAccount('owner'),undefined);
});
test('un vínculo alterado no recibe credenciales ni sobrescribe otra persona',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');f.storage.set('nexus-google-contact:owner:google-owner:peer','https://example.test/steal');const before=f.calls.length;await assert.rejects(f.api.syncContactToGoogle('owner',draft),/vínculo/);assert.equal(f.calls.length,before);assert.equal(writes(f).length,0);
});

test('un contacto vinculado temporalmente ausente no provoca otra creación',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');await f.api.syncContactToGoogle('owner',draft);f.records.length=0;await assert.rejects(f.api.syncContactToGoogle('owner',draft),/guardado anterior/);assert.equal(writes(f).filter((c:any)=>c.init.method==='POST').length,1);
});
test('vínculos duplicados, páginas repetidas y versiones ausentes bloquean escrituras',async()=>{
 const f=await fixture();await f.api.connectGoogleContacts('owner');await f.api.syncContactToGoogle('owner',draft);f.storage.clear();f.records.push({...f.records[0],resourceName:'people/duplicate'});await assert.rejects(f.api.syncContactToGoogle('owner',draft),/duplicados/);assert.equal(writes(f).length,1);f.records.pop();delete f.records[0].metadata.sources[0].etag;await assert.rejects(f.api.syncContactToGoogle('owner',draft),/versión/);assert.equal(writes(f).length,1);
 const repeated=await fixture({fetch:async(url:string)=>url.includes('pageSize=1000')?Response.json({connections:[],nextPageToken:'same'}):undefined});await repeated.api.connectGoogleContacts('owner');await assert.rejects(repeated.api.syncContactToGoogle('owner',draft),/agenda completa/);assert.equal(writes(repeated).length,0);
});
test('un cambio de sesión durante la consulta impide crear el contacto',async()=>{
 const f=await fixture({fetch:async(url:string,init:any,records:any[],context:any)=>{if(url.includes('pageSize=1000')){context.__auth.currentUser={uid:'other'};context.__authChanged();return Response.json({connections:[]});}}});await f.api.connectGoogleContacts('owner');await assert.rejects(f.api.syncContactToGoogle('owner',draft),/sesión cambió/);assert.equal(writes(f).length,0);
});
