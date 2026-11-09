const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,writeBatch,serverTimestamp}=require('firebase/firestore');
const {createMockUserToken}=require('@firebase/util');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const rt=async(destination,token,method='GET',body)=>fetch('http://127.0.0.1:9015/'+destination+'.json?ns=demo-nexus&auth='+encodeURIComponent(token),{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-nexus',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')},database:{host:'127.0.0.1',port:9015,rules:fs.readFileSync(path.join(__dirname,'../database.rules.json'),'utf8')}});try{
 await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await setDoc(doc(db,'dashboardSecurity/owner'),{uid:'owner',email:'owner@example.org',enabled:true});for(const uid of ['owner','other'])await setDoc(doc(db,'dashboardAdmins',uid),{enabled:true});await setDoc(doc(db,'internalData/check'),{value:'synthetic'});});
 const seeded=await fetch('http://127.0.0.1:9015/.json?ns=demo-nexus',{method:'PUT',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({dashboardSecurity:{owner:{uid:'owner',email:'owner@example.org',enabled:true}},dashboardAdmins:{owner:true,other:true},internalData:{check:{value:'synthetic'}}})});assert.equal(seeded.status,200);
 for(const [uid,email,verified,provider,allowed]of [
  ['owner','owner@example.org',true,'google.com',true],['owner','owner@example.org',true,'password',true],
  ['other','other@example.org',true,'google.com',false],['other','owner@example.org',true,'password',false],
  ['owner','different@example.org',true,'google.com',false],['owner','owner@example.org',false,'password',false],['owner','owner@example.org',true,'anonymous',false],
 ]){
  const claims={email,email_verified:verified,firebase:{sign_in_provider:provider}},db=env.authenticatedContext(uid,claims).firestore(),check=allowed?assertSucceeds:assertFails;
  await check(getDoc(doc(db,'internalData/check')));const token=createMockUserToken({sub:uid,...claims},'demo-nexus');assert.equal((await rt('internalData/check',token)).status,allowed?200:401);
  const id=uid+'-'+provider+'-'+verified+'-'+email.replace(/[^a-z]/g,''),target=doc(db,'internalData',id),batch=writeBatch(db);batch.set(target,{value:'changed'});batch.set(doc(db,'dashboardActions',id),{actor:uid,target,operation:'create',before:null,after:{value:'changed'},at:serverTimestamp()});batch.set(doc(db,'assistantOperations/internalData/'+id+'/latest'),{actor:uid,id,at:serverTimestamp()});await check(batch.commit());
  await assertFails(setDoc(doc(db,'dashboardSecurity/owner'),{uid,email,enabled:true}));assert.equal((await rt('dashboardSecurity/owner',token,'PUT',{uid,email,enabled:true})).status,401);
 }
 const ownerDb=env.authenticatedContext('owner',{email:'owner@example.org',email_verified:true,firebase:{sign_in_provider:'google.com'}}).firestore();
 const audit=writeBatch(ownerDb),target=doc(ownerDb,'dashboardSecurity/owner'),id='tamper-owner';audit.update(target,{email:'changed@example.org'});audit.set(doc(ownerDb,'dashboardActions',id),{actor:'owner',target,operation:'update',before:{uid:'owner',email:'owner@example.org',enabled:true},after:{uid:'owner',email:'changed@example.org',enabled:true},at:serverTimestamp()});audit.set(doc(ownerDb,'assistantOperations/dashboardSecurity/owner/latest'),{actor:'owner',id,at:serverTimestamp()});await assertFails(audit.commit());
 const token=createMockUserToken({sub:'owner',email:'owner@example.org',email_verified:true,firebase:{sign_in_provider:'google.com'}},'demo-nexus');
 const attack=await rt('',token,'PATCH',{'dashboardSecurity/owner/email':'changed@example.org','dashboardActions/tamper-owner':{actor:'owner',path:'dashboardSecurity/owner/email',operation:'update',at:{'.sv':'timestamp'}},assistantLastAction:{id:'tamper-owner',at:{'.sv':'timestamp'}}});assert.equal(attack.status,401);
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'dashboardSecurity/owner'),{uid:'owner',email:'owner@example.org',enabled:false});});await assertFails(getDoc(doc(ownerDb,'internalData/check')));
 console.log('Owner identity: UID + verified email + provider enforced in Firestore and Realtime. Other enabled administrators, email changes, impersonation and policy tampering denied. Synthetic data only.');
}finally{await env.cleanup();}})().catch(e=>{console.error(e);process.exit(1)});
