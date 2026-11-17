const {createMockUserToken}=require('@firebase/util'),fs=require('fs'),assert=require('assert/strict');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-nexus',database:{host:'127.0.0.1',port:9015,rules:fs.readFileSync('database.rules.json','utf8')}});let checks=0;const token=(uid,verified=true)=>createMockUserToken({sub:uid,email:uid+'@example.test',email_verified:verified,firebase:{sign_in_provider:'google.com'}},'demo-nexus');
const request=(path,method,body,credential)=>fetch('http://127.0.0.1:9015/'+path+'.json?ns=demo-nexus&auth='+encodeURIComponent(credential),{method,headers:{'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
try{await fetch('http://127.0.0.1:9015/.json?ns=demo-nexus',{method:'PUT',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({dashboardAdmins:{owner:true},dashboardSecurity:{owner:{uid:'owner',email:'owner@example.test',enabled:true}},presence:{old:{online:false,lastSeen:1}},clientMedia:{file:{owner:'old',chunks:{0:{iv:'A'.repeat(16),cipher:'A'.repeat(32)}}}}})});
for(const credential of [token('alice'),token('owner',false)]){assert.equal((await request('moderatedUsers/old','PUT',true,credential)).status,401);checks++;}
assert.equal((await request('presence/old','DELETE',undefined,token('owner'))).status,401);checks++;
assert.equal((await request('moderatedUsers/old','PUT',true,token('owner'))).status,200);checks++;
assert.equal((await request('presence/old','DELETE',undefined,token('owner'))).status,200);checks++;
assert.equal((await request('clientMedia/file','DELETE',undefined,token('alice'))).status,401);checks++;
assert.equal((await request('clientMedia/file','DELETE',undefined,token('owner'))).status,200);checks++;
assert.equal((await request('moderatedUsers/old','PUT',false,token('owner'))).status,401);checks++;
const guest=createMockUserToken({sub:'expiredGuest',firebase:{sign_in_provider:'anonymous'}},'demo-nexus');await fetch('http://127.0.0.1:9015/guestActivity/expiredGuest.json?ns=demo-nexus',{method:'PUT',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify(Date.now()-31*86400000)});assert.equal((await request('guestActivity/expiredGuest','PUT',Date.now(),guest)).status,401);checks++;
const freshGuest=createMockUserToken({sub:'freshGuest',firebase:{sign_in_provider:'anonymous'}},'demo-nexus');assert.equal((await request('guestActivity/freshGuest','PUT',Date.now(),freshGuest)).status,200);checks++;
console.log(JSON.stringify({realtimeRetention:checks,failed:0,productionWrites:0}));}finally{await env.cleanup()}})().catch(e=>{console.error(e);process.exit(1)});
