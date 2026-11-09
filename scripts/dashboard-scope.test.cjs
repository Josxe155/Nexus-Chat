const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,writeBatch,serverTimestamp}=require('firebase/firestore');
const {createMockUserToken}=require('@firebase/util');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-nexus',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')},database:{host:'127.0.0.1',port:9015,rules:fs.readFileSync(path.join(__dirname,'../database.rules.json'),'utf8')}});try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'dashboardAdmins/owner'),{enabled:true});await setDoc(doc(c.firestore(),'dashboardSecurity/owner'),{uid:'owner',email:'owner@example.org',enabled:true});await setDoc(doc(c.firestore(),'users/person'),{uid:'person',nombre:'Original'});});
 const db=env.authenticatedContext('owner',{email:'owner@example.org',email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
 for(const destination of ['users/person','users/person/private/profile','usernames/protected','nexusNumbers/protected','contactCodes/protected','mediaFiles/protected','publicConfig/assistantAdmin']){
  const target=doc(db,destination),previous=await getDoc(target),id='scope-'+destination.replaceAll('/','-'),data={uid:'person',nombre:'Changed'},batch=writeBatch(db);batch.set(target,data);batch.set(doc(db,'dashboardActions',id),{actor:'owner',target,operation:previous.exists()?'update':'create',before:previous.data()??null,after:data,at:serverTimestamp()});batch.set(doc(db,'assistantOperations/'+destination+'/latest'),{actor:'owner',id,at:serverTimestamp()});await assertFails(batch.commit());
 }
 assert.equal((await getDoc(doc(db,'users/person'))).data().nombre,'Original');
 const seeded=await fetch('http://127.0.0.1:9015/.json?ns=demo-nexus',{method:'PUT',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({dashboardAdmins:{owner:true},dashboardSecurity:{owner:{uid:'owner',email:'owner@example.org',enabled:true}}})});assert.equal(seeded.status,200);
 const token=createMockUserToken({sub:'owner',email:'owner@example.org',email_verified:true,firebase:{sign_in_provider:'google.com'}},'demo-nexus');
 for(const destination of ['users/person','moderatedUsers/person','moderatedChats/chat','clientMedia/file','calls/call','signals/offer','assistantAdminJobs/job']){
  const id='scope-'+destination.replaceAll('/','-'),changes={[destination]:{value:true},['dashboardActions/'+id]:{actor:'owner',path:destination,operation:'create',at:{'.sv':'timestamp'}},assistantLastAction:{id,at:{'.sv':'timestamp'}}};const response=await fetch('http://127.0.0.1:9015/.json?ns=demo-nexus&auth='+token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(changes)});assert.equal(response.status,401,destination);
 }
 console.log('Operational scope: audited writes cannot modify other user profiles, identity mappings, media, calls, moderation or retired administrative jobs. Synthetic data only.');
}finally{await env.cleanup();}})().catch(e=>{console.error(e);process.exit(1)});
