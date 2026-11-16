import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGuestCredentials,isManagedGuestEmail,isGuestIdentity,needsEmailVerification,visibleAccountEmail} from '../src/features/guestIdentity.ts';
import {accountReportData} from '../src/features/accountReportModel.ts';
import {redactAssistantData} from '../src/dashboard/assistantData.ts';
import {actionPath} from '../src/dashboard/assistantActionCore.ts';
const uid='GuestUid12345678';
test('genera credenciales únicas, fuertes y asociadas al UID, sin datos personales',()=>{
 const first=newGuestCredentials(uid),second=newGuestCredentials(uid);
 assert.ok(isManagedGuestEmail(uid,first.email));assert.equal(first.email,second.email);assert.notEqual(first.email,newGuestCredentials('OtherGuestUid').email);assert.notEqual(first.password,second.password);assert.match(first.password,/^Nc9![A-Za-z0-9_-]{43}$/);assert.ok(first.email.split('@')[0].length<=64);
});
test('otro UID o un dominio parecido no se consideran invitados técnicos',()=>{
 const {email}=newGuestCredentials(uid);assert.ok(!isManagedGuestEmail('OtherUid',email));assert.ok(!isManagedGuestEmail(uid,email+'.attacker.test'));assert.ok(!isManagedGuestEmail(uid,'guest.test@example.test'));assert.throws(()=>newGuestCredentials('../bad'));
});
test('se mantiene la verificación de correo real y no se confunde un invitado con Google',()=>{
 const email=newGuestCredentials(uid).email,base={uid,email,emailVerified:false,isAnonymous:false,providerData:[{providerId:'password'}]} as any;
 assert.ok(isGuestIdentity(base));assert.equal(needsEmailVerification(base),false);assert.equal(visibleAccountEmail(base),null);
 assert.equal(needsEmailVerification({...base,email:'person@example.test'}),true);assert.equal(needsEmailVerification({...base,email:'person@example.test',emailVerified:true}),false);assert.equal(isGuestIdentity({...base,email:'person@example.test'}),false);assert.equal(visibleAccountEmail({...base,email:'person@example.test'}),'person@example.test');assert.equal(isGuestIdentity({...base,email:null,isAnonymous:true}),true);
});
test('informes de cuenta e información para la IA no revelan las credenciales',()=>{
 const credentials=newGuestCredentials(uid);assert.equal(accountReportData(uid,credentials.email,false,{}, {},[]).account.email,null);
 assert.equal(redactAssistantData({...credentials,version:1}),'[Credenciales protegidas]');assert.equal(redactAssistantData({email:credentials.email}).email,'[Correo técnico protegido]');assert.equal(redactAssistantData({password:credentials.password}).password,'[Dato protegido]');
});

test('las herramientas de escritura no pueden modificar el registro de credenciales',()=>{assert.throws(()=>actionPath('guestAccountCredentials/'+uid,'firestore'),/no modifica/);assert.throws(()=>actionPath('guestAccountCredentials/'+uid,'realtime'),/no modifica/);});
