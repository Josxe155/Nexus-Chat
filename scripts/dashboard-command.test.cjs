const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {setDoc,doc,getDoc}=require('firebase/firestore');
const {build}=require('esbuild');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const output=path.join(__dirname,'../work/edit-command-check.cjs');fs.mkdirSync(path.dirname(output),{recursive:true});
 const session=path.join(__dirname,'../work/edit-session-check.ts');
 fs.writeFileSync(session,"import {doc,getDocFromServer} from 'firebase/firestore';export async function verifyDashboardAccess(user,db){return (await getDocFromServer(doc(db,'dashboardAdmins',user.uid))).data()?.enabled===true}");
 await build({entryPoints:[path.join(__dirname,'../src/dashboard/editMessage.ts')],outfile:output,bundle:true,platform:'node',format:'cjs',external:['firebase/firestore','firebase/auth'],plugins:[{name:'test-session',setup(b){b.onResolve({filter:/^\.\/session$/},()=>({path:session}));}}]});
 const {editMessageByCommand}=require(output);
 const env=await initializeTestEnvironment({projectId:'demo-nexus',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.firestore();await setDoc(doc(db,'dashboardAdmins/admin'),{enabled:true});await setDoc(doc(db,'dashboardSecurity/owner'),{uid:'admin',email:'owner@example.org',enabled:true});
   await setDoc(doc(db,'users/command-author'),{nombre:'Alexander Alvarado',username:'alex-command'});
   await setDoc(doc(db,'chats/command-chat'),{title:'Aula de prueba',participants:['command-author'],lastMessage:{id:'target',senderId:'command-author',timestamp:1000,content:'Mañana no hay clases'}});
   await setDoc(doc(db,'chats/command-chat/messages/target'),{type:'text',senderId:'command-author',content:'Mañana no hay clases',timestamp:1000,expiresAt:0});
  });
  const db=env.authenticatedContext('admin',{email:'owner@example.org',email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
  const command={author:'Alexander Alvarado',before:'Mañana no hay clases',after:'Mañana si hay clase',chat:'command-chat'};
  const result=await editMessageByCommand(db,{uid:'admin'},command,new AbortController().signal);
  assert.match(result,/actualizado/);
  const row=(await getDoc(doc(db,'chats/command-chat/messages/target'))).data();assert.equal(row.content,command.after);assert.equal(row.senderId,'command-author');assert.equal(row.timestamp,1000);
  assert.equal((await getDoc(doc(db,'chats/command-chat'))).data().lastMessage.content,command.after);
  const audit=(await getDoc(doc(db,'dashboardEdits',row.adminEditId))).data();assert.equal(audit.before,command.before);assert.equal(audit.after,command.after);
  assert.match(await editMessageByCommand(db,{uid:'admin'},command,new AbortController().signal),/No encontré un mensaje/);
  await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'chats/command-chat/messages/duplicate'),{...row,content:command.after});});
  assert.match(await editMessageByCommand(db,{uid:'admin'},{...command,before:command.after,after:'No debe aplicarse'},new AbortController().signal),/varias coincidencias/);
  assert.equal((await getDoc(doc(db,'chats/command-chat/messages/target'))).data().content,command.after);
  await assert.rejects(editMessageByCommand(db,{uid:'admin'},command,AbortSignal.abort()));
  console.log('Comando: edición exacta, resumen, auditoría, duplicados, reintentos y cancelación OK. Solo datos ficticios.');
 }finally{await env.cleanup();fs.rmSync(output,{force:true});fs.rmSync(session,{force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
