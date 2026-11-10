import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanupLease,cleanupMillis,nextCleanupMonth,dashboardErrorMessage,CLEANUP_LEASE_MS,CLEANUP_HEARTBEAT_MS} from '../src/dashboard/cleanupState.ts';
const now=Date.parse('2026-11-09T18:00:00-05:00');
test('un bloqueo residual en un plan fallido o finalizado no bloquea una nueva ejecución',()=>{
 for(const status of ['error','scheduled',undefined])assert.equal(cleanupLease({status,leaseUntil:now+300000},now).active,false);
});
test('una limpieza en curso conserva exclusión mutua y muestra el plazo restante',()=>{
 assert.deepEqual(cleanupLease({status:'running',leaseUntil:now+90000},now),{active:true,remaining:90000,recoverable:false});
 assert.ok(CLEANUP_HEARTBEAT_MS<CLEANUP_LEASE_MS);
});
test('una ejecución caducada, sin fecha o con una fecha imposible se puede recuperar',()=>{
 for(const leaseUntil of [now-1,0,undefined,NaN,Infinity,now+360001]){const result=cleanupLease({status:'running',leaseUntil},now);assert.equal(result.active,false);assert.equal(result.recoverable,true);}
});
test('acepta marcas de tiempo resueltas sin depender de instanceof entre módulos',()=>{
 assert.equal(cleanupMillis({toMillis:()=>now}),now);for(const value of [null,'123',{},Infinity,NaN])assert.equal(cleanupMillis(value),0);
});
test('el calendario mensual usa Ecuador y limita los días de febrero',()=>{
 assert.equal(new Date(nextCleanupMonth(Date.parse('2026-01-31T23:30:00-05:00'))).toISOString(),'2026-03-01T04:30:00.000Z');
 assert.equal(new Date(nextCleanupMonth(Date.parse('2028-01-31T12:30:00-05:00'))).toISOString(),'2028-02-29T17:30:00.000Z');
 assert.equal(new Date(nextCleanupMonth(Date.parse('2026-12-09T12:30:00-05:00'))).toISOString(),'2027-01-09T17:30:00.000Z');
});
test('los fallos del servicio tienen mensajes comprensibles y no muestran términos internos',()=>{
 for(const code of ['permission-denied','database/permission-denied','unavailable','failed-precondition']){const text=dashboardErrorMessage(Object.assign(Error('internal-provider-detail'),{code}));assert.ok(text&&!text.includes('internal-provider-detail'));}
 assert.equal(dashboardErrorMessage(Error('La sesión cambió.')),'La sesión cambió.');
});
