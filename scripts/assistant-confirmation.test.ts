import {test} from 'node:test';import assert from 'node:assert/strict';
import {isAssistantConfirmation,latestAssistantProposal,simpleConfirmationText,confirmationProposals} from '../src/dashboard/assistantConfirmation.ts';
import type {AssistantAction} from '../src/dashboard/assistantActionCore.ts';
const now=1800000000000;
const action=(id:string,patch:Partial<AssistantAction>={}):AssistantAction=>({id,actor:'owner',createdAt:now-1000,kind:'firestore',path:'officialNotices/notice',operation:'update',before:{title:'Antes'},data:{title:'Después'},...patch});
test('CONFIRMAR es un mensaje completo y no una palabra dentro de otro texto',()=>{for(const text of ['CONFIRMAR','confirmar','  Confirmar  '])assert.ok(isAssistantConfirmation(text));for(const text of ['no confirmar','puedes confirmar','CONFIRMAR otro','el archivo dice CONFIRMAR'])assert.ok(!isAssistantConfirmation(text));});
test('confirma la última propuesta, aunque existan propuestas antiguas y mensajes de consulta posteriores',()=>{const old=action('old'),latest=action('latest');assert.equal(latestAssistantProposal([{actions:[old]},{actions:[latest]},{}],'owner',now).id,'latest');});
test('repetir CONFIRMAR no vuelve a ejecutar ni recupera una propuesta anterior',()=>{assert.throws(()=>latestAssistantProposal([{actions:[action('old')]},{actions:[action('latest',{executedAt:now})]}],'owner',now),/ya se ejecutó/);});
test('no elige arbitrariamente entre varios cambios de una misma respuesta',()=>{assert.throws(()=>latestAssistantProposal([{actions:[action('a'),action('b')]}],'owner',now),/varios cambios/);});
test('deduplica una propuesta y permite la única pendiente junto a acciones completadas',()=>{const pending=action('pending');assert.equal(latestAssistantProposal([{actions:[action('done',{executedAt:now}),pending,pending]}],'owner',now).id,'pending');});
test('rechaza propuestas ausentes, de otra cuenta, caducadas o fechadas en el futuro',()=>{assert.throws(()=>latestAssistantProposal([],'owner',now),/No hay/);for(const patch of [{actor:'other'},{createdAt:now-86400001},{createdAt:now+60001}])assert.throws(()=>latestAssistantProposal([{actions:[action('a',patch)]}],'owner',now));});
test('la limpieza usa CONFIRMAR conservando una propuesta explícita y vigente',()=>{const cleanup=action('cleanup',{kind:'cleanup',operation:'cleanup',path:'publicConfig/cleanup',data:{}});assert.equal(latestAssistantProposal([{actions:[cleanup]}],'owner',now).kind,'cleanup');const text=confirmationProposals([cleanup]);assert.match(text,/\*\*CONFIRMAR\*\*/);assert.ok(!text.includes('LIMPIAR AHORA'));assert.ok(!text.includes('cleanup**'));});
test('la interfaz y las respuestas antiguas no exigen un identificador de confirmación',()=>{const id='12345678-1234-4234-8234-123456789abc',plan=action(id);assert.ok(!confirmationProposals([plan]).includes(id));assert.equal(simpleConfirmationText('Escribe **CONFIRMAR '+id+'**.'),'Escribe **CONFIRMAR**.');assert.equal(simpleConfirmationText('LIMPIAR AHORA '+id),'CONFIRMAR');assert.equal(simpleConfirmationText('El mensaje contiene un identificador '+id),'El mensaje contiene un identificador '+id);});

test('la denegación real de acceso no se confunde con un problema de conexión',async()=>{
 const {isDashboardAccessDenied}=await import('../src/dashboard/accessErrors.ts');
 for(const code of ['permission-denied','firestore/permission-denied','auth/user-disabled','auth/user-token-expired'])assert.equal(isDashboardAccessDenied({code}),true);
 for(const code of ['unavailable','deadline-exceeded','auth/network-request-failed'])assert.equal(isDashboardAccessDenied({code}),false);
 assert.equal(isDashboardAccessDenied(Error('network')),false);
});

test('acortar instrucciones no altera el contenido de mensajes ni las vistas previas JSON',()=>{
 const id='12345678-1234-4234-8234-123456789abc';
 for(const text of ['```json\n'+JSON.stringify({content:'Escribe CONFIRMAR '+id})+'\n```','«Escribe CONFIRMAR '+id+'»','`CONFIRMAR '+id+'`'])assert.equal(simpleConfirmationText(text),text);
});
