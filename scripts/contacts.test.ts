import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {runInNewContext} from 'node:vm';
import {normalizeContactNumber,prepareContactDraft,submitContactDraft} from '../src/features/contactDraft.ts';
const draft={first:' Carlos ',last:' Tío ',username:'',country:'MX',number:'55 (1234)-5678'};
test('E.164 normaliza México, prefijos internacionales, Ecuador e Italia sin perder el cero italiano',()=>{
 assert.equal(normalizeContactNumber('MX',draft.number),'+525512345678');
 assert.equal(normalizeContactNumber('MX','+52 55 1234 5678'),'+525512345678');
 assert.equal(normalizeContactNumber('OTHER','0052 55 1234 5678'),'+525512345678');
 assert.equal(normalizeContactNumber('EC','099 123 4567'),'+593991234567');
 assert.equal(normalizeContactNumber('IT','06 6988 3229'),'+390669883229');
});
test('datos inválidos se detienen localmente antes de cualquier consulta',async()=>{
 for(const number of ['abc','+52 55 1234 5678 ext 9','12','+12345678901234567']){let calls=0;await assert.rejects(submitContactDraft({...draft,number},{assertActive(){},resolve:async()=>{calls++;return {found:false}},save:async()=>{},open:async()=>{}}));assert.equal(calls,0);}
 assert.throws(()=>prepareContactDraft({...draft,first:' '}));assert.throws(()=>prepareContactDraft({...draft,number:'',username:'ab'}));
 assert.equal(prepareContactDraft({...draft,number:'',username:'@Carlos_1'}).username,'carlos_1');
});
test('un número no registrado no escribe ni abre chat y usa el aviso solicitado',async()=>{
 const calls:string[]=[];await assert.rejects(submitContactDraft(draft,{assertActive(){},resolve:async input=>{calls.push('resolve');assert.deepEqual(input,{phone:'+525512345678',username:''});return {found:false}},save:async()=>{calls.push('save')},open:async()=>{calls.push('open')}}),/^UnregisteredContactError: Este número no está registrado en Nexus Chat$/);assert.deepEqual(calls,['resolve']);
});
test('el alias elegido prevalece sobre el nombre registrado y se guarda antes de abrir',async()=>{
 const calls:string[]=[];await submitContactDraft(draft,{assertActive(){},resolve:async()=>{calls.push('resolve');return {found:true,uid:'target',nombre:'Carlos real'}},save:async(person,input)=>{calls.push('save');assert.equal(input.first+' '+input.last,'Carlos Tío');assert.equal(person.nombre,'Carlos real')},open:async uid=>{calls.push('open');assert.equal(uid,'target')}});assert.deepEqual(calls,['resolve','save','open']);
});
test('un fallo al guardar o un cambio de sesión impide abrir el chat',async()=>{
 let opened=false;await assert.rejects(submitContactDraft(draft,{assertActive(){},resolve:async()=>({found:true,uid:'target'}),save:async()=>{throw Error('sin conexión')},open:async()=>{opened=true}}));assert.equal(opened,false);
 let active=true,saved=false;await assert.rejects(submitContactDraft(draft,{assertActive(){if(!active)throw Error('sesión')},resolve:async()=>{active=false;return {found:true,uid:'target'}},save:async()=>{saved=true},open:async()=>{opened=true}}));assert.equal(saved,false);assert.equal(opened,false);
});
const bundle=build({entryPoints:['src/features/contactResolution.ts','src/features/contacts.ts','src/features/directContactChat.ts'],bundle:true,write:false,outdir:'fixture',format:'cjs',platform:'browser',plugins:[{name:'mock-db',setup(builder){builder.onResolve({filter:/^(firebase\/firestore|\.\.\/firebase|\.\/privacy|react)$/},args=>({path:args.path,namespace:'fixture'}));builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='firebase/firestore'?'export const {doc,getDoc,runTransaction,getDocs,collection,query,where,writeBatch}=globalThis.__db; export function setDoc(...args){return globalThis.__db.setDoc(...args)}; export function onSnapshot(){}':args.path==='../firebase'?'export const auth=globalThis.__auth; export const db={};':args.path==='react'?'export function useEffect(){};export function useState(){};':'export const normalizePrivacy=p=>({contactIds:[],blockedIds:[],...p});export const statusAudience=p=>p.contactIds.filter(uid=>!p.blockedIds.includes(uid));',loader:'js'}));}}]});
async function fixture(file:string,records:Record<string,any>={}){
 const writes:any[]=[],reads:string[]=[],context:any={__auth:{currentUser:{uid:'owner'}},Date,console,module:{exports:{}},exports:{}};
 const read=async(path:string)=>{reads.push(path);const data=records[path];if(data instanceof Error)throw data;return {exists:()=>data!==undefined,data:()=>data};};
 const tx={get:read,set:(path:string,data:any,options:any)=>writes.push({path,data,options}),update:(path:string,data:any)=>writes.push({path,data})};
 context.__db={doc:(_:any,...parts:string[])=>parts.join('/'),getDoc:read,setDoc:async(path:string,data:any)=>writes.push({path,data}),runTransaction:async(_:any,callback:any)=>callback(tx),getDocs:async()=>({docs:[]}),collection:(_:any,...parts:string[])=>parts.join('/'),query:()=>null,where:()=>null,writeBatch:()=>({update(){},commit:async()=>{}})};
 // setDoc is exported separately to keep the fixture close to the real SDK surface.
 const output=(await bundle).outputFiles.find(output=>output.path.endsWith('/'+file+'.js'))!;
 runInNewContext(output.text,context);return {api:context.module.exports,context,reads,writes};
}
test('el resolver exige número canónico y no usa usuario como alternativa a un número inexistente',async()=>{
 const {api,reads}=await fixture('contactResolution',{'usernames/carlos':{uid:'target'}});await assert.rejects(api.resolveRegisteredContact({phone:'+52 55 1234 5678'}));assert.equal(reads.length,0);assert.equal((await api.resolveRegisteredContact({phone:'+525512345678',username:'carlos'})).found,false);assert.deepEqual(reads,['nexusNumberReservations/525512345678']);
});
test('el resolver rechaza usuario contradictorio y no expone detalles sin permiso',async()=>{
 const denied=Object.assign(Error('denied'),{code:'permission-denied'}),records={'nexusNumberReservations/525512345678':{uid:'target'},'usernames/other':{uid:'other'},'users/target':{nombre:'Carlos',username:'carlos',foto:'private'},'users/target/details/photo':denied,'users/target/details/info':denied};
 const {api,writes}=await fixture('contactResolution',records);await assert.rejects(api.resolveRegisteredContact({phone:'+525512345678',username:'other'}),/no corresponde/);const result=await api.resolveRegisteredContact({phone:'+525512345678'});assert.equal(result.uid,'target');assert.equal(result.foto,'');assert.equal(result.bio,'');assert.equal(writes.length,0);
});
test('el resolver descarta cuentas eliminadas y perfiles moderados',async()=>{
 for(const profile of [undefined,{moderationRemoved:true}]){const {api}=await fixture('contactResolution',{'nexusNumberReservations/525512345678':{uid:'target'},'users/target':profile});assert.equal((await api.resolveRegisteredContact({phone:'+525512345678'})).found,false);}
});
test('el guardado es atómico, conserva la privacidad actual y escribe solo la agenda del propietario',async()=>{
 const {api,writes}=await fixture('contacts',{'users/target':{nombre:'Carlos'},'users/owner/private/privacy':{contactIds:['existing'],blockedIds:['blocked'],photoAudience:'nobody'}});
 const result=await api.saveContact({uid:'owner',privacy:{contactIds:[],photoAudience:'everyone'}},{uid:'target'},{first:'Carlos',last:'Tío'},'+525512345678');
 assert.deepEqual(Array.from(result.privacy.contactIds),['existing','target']);assert.equal(result.privacy.photoAudience,'nobody');assert.equal(writes.length,4);assert.ok(writes.every(write=>write.path.startsWith('users/owner')));assert.equal(writes.find(write=>write.path.endsWith('/contacts')).data.names.target.last,'Tío');assert.equal(writes.find(write=>write.path.endsWith('/phone-contacts')).data.contacts['525512345678'].uid,'target');
});
test('la sesión incorrecta y un perfil inexistente impiden escribir la agenda',async()=>{
 const {api,writes,context}=await fixture('contacts');await assert.rejects(api.saveContact({uid:'owner'},{uid:'target'},{first:'Carlos',last:''}));assert.equal(writes.length,0);context.__auth.currentUser={uid:'other'};await assert.rejects(api.saveContact({uid:'owner'},{uid:'target'},{first:'Carlos',last:''}));assert.equal(writes.length,0);
});
test('reabrir un chat determinista no lo sobrescribe y rechaza participantes ajenos',async()=>{
 const chat={id:'direct',participants:['owner','target']};const {api,writes}=await fixture('directContactChat',{'chats/direct':{...chat,createdAt:1}});await api.ensureDirectContactChat('owner',chat);assert.equal(writes.length,0);
 const other=await fixture('directContactChat',{'chats/direct':{participants:['owner','other']}});await assert.rejects(other.api.ensureDirectContactChat('owner',chat));assert.equal(other.writes.length,0);
});
test('crear un chat inexistente escribe una sola vez y una carrera reutiliza la conversación',async()=>{
 const chat={id:'new',participants:['owner','target'],createdAt:22};const first=await fixture('directContactChat');await first.api.ensureDirectContactChat('owner',chat);assert.equal(first.writes.length,1);assert.equal(first.writes[0].data.createdAt,22);
 const records:Record<string,any>={};const race=await fixture('directContactChat',records);race.context.__db.setDoc=async()=>{records['chats/new']={...chat,createdAt:11};throw Object.assign(Error('already created'),{code:'permission-denied'})};await race.api.ensureDirectContactChat('owner',chat);assert.equal(race.writes.length,0);assert.equal(records['chats/new'].createdAt,11);
});
