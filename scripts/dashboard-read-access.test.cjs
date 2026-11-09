const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,writeBatch,serverTimestamp}=require('firebase/firestore');
const assert=require('node:assert/strict');
const {createMockUserToken}=require('@firebase/util');
async function rt(path,token,method='GET',data){const r=await fetch('http://127.0.0.1:9015/'+path+'.json?ns=demo-nexus'+(token==='owner'?'':'&auth='+encodeURIComponent(token)),{method,...(token==='owner'?{headers:{Authorization:'Bearer owner'}}:{}),...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(10000)});return r.status;}
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-nexus',firestore:{host:'127.0.0.1',port:8085,rules:require('node:fs').readFileSync(require('node:path').join(__dirname,'../firestore.rules'),'utf8')},database:{host:'127.0.0.1',port:9015,rules:require('node:fs').readFileSync(require('node:path').join(__dirname,'../database.rules.json'),'utf8')}});try{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'dashboardAdmins/admin'),{enabled:true});await setDoc(doc(c.firestore(),'dashboardAdmins/unverified'),{enabled:true});await setDoc(doc(c.firestore(),'dashboardAdmins/disabled'),{enabled:false});await setDoc(doc(c.firestore(),'internalData/probe'),{value:'synthetic'});assert.equal(await rt('dashboardAdmins','owner','PUT',{admin:true,unverified:true}),200);assert.equal(await rt('internalData/probe','owner','PUT',{value:'synthetic'}),200);});
 for(const [uid,verified,expected,provider] of [['admin',true,true,'google.com'],['admin',true,true,'password'],['ordinary',true,false,'google.com'],['unverified',false,false,'google.com'],['disabled',true,false,'google.com'],['admin',true,false,'anonymous']]){
  const c=env.authenticatedContext(uid,{email_verified:verified,firebase:{sign_in_provider:provider}}),check=expected?assertSucceeds:assertFails;
  await check(getDoc(doc(c.firestore(),'internalData/probe')));const token=createMockUserToken({sub:uid,user_id:uid,email_verified:verified,firebase:{sign_in_provider:provider}},'demo-nexus');assert.equal(await rt('internalData/probe',token),expected?200:401);
  await assertFails(setDoc(doc(c.firestore(),'internalData/probe'),{value:'modified'}));assert.equal(await rt('internalData/probe',token,'PUT',{value:'modified'}),401);console.log(uid+': read '+expected+', writes denied');
 }
 await env.withSecurityRulesDisabled(async c=>{
  await setDoc(doc(c.firestore(),'chats/edit-test'),{id:'edit-test',participants:['author','recipient'],lastMessage:{id:'m1',senderId:'author',timestamp:1000,content:'Mañana no hay clases'}});
  await setDoc(doc(c.firestore(),'chats/edit-test/messages/m1'),{id:'m1',chatId:'edit-test',senderId:'author',type:'text',content:'Mañana no hay clases',timestamp:1000});
 });
 const admin=env.authenticatedContext('admin',{email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
 const target=doc(admin,'chats/edit-test/messages/m1');
 await assertFails(setDoc(target,{content:'No audit',edited:true},{merge:true}));
 const edit=writeBatch(admin);
 edit.update(target,{content:'Mañana si hay clase',edited:true,adminEditedBy:'admin',adminEditedAt:serverTimestamp(),adminEditId:'edit-1'});
 edit.set(doc(admin,'dashboardEdits/edit-1'),{actor:'admin',chatId:'edit-test',messageId:'m1',senderId:'author',before:'Mañana no hay clases',after:'Mañana si hay clase',at:serverTimestamp()});
 await assertSucceeds(edit.commit());
 assert.equal((await getDoc(target)).data().content,'Mañana si hay clase');
 assert.equal((await getDoc(target)).data().senderId,'author');
 assert.equal((await getDoc(doc(admin,'dashboardEdits/edit-1'))).data().before,'Mañana no hay clases');
 await assertFails(setDoc(doc(admin,'dashboardEdits/edit-1'),{after:'Changed audit'},{merge:true}));
 const ordinary=env.authenticatedContext('ordinary',{email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
 await assertFails(setDoc(doc(ordinary,'chats/edit-test/messages/m1'),{content:'Unauthorized',edited:true},{merge:true}));
 console.log('Audited administrative edit: allowed; missing audit, ordinary user and audit modification: denied');
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'chats/edit-test/messages/own'),{id:'own',chatId:'edit-test',senderId:'author',type:'text',content:'Original',timestamp:Date.now()});});
 const author=env.authenticatedContext('author',{email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
 await assertSucceeds(setDoc(doc(author,'chats/edit-test/messages/own'),{content:'Edición propia',edited:true},{merge:true}));
 console.log('Own-message edit still allowed for the author.');
 const anon=env.unauthenticatedContext();await assertFails(getDoc(doc(anon.firestore(),'internalData/probe')));assert.equal(await rt('internalData/probe',''),401);console.log('unauthenticated: denied');
}finally{await env.cleanup()}})().catch(e=>{console.error(e);process.exit(1)});
