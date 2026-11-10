export const CLEANUP_LEASE_MS=90000;
export const CLEANUP_HEARTBEAT_MS=15000;
export function cleanupMillis(value:unknown):number{
 if(value&&typeof value==='object'&&'toMillis'in value&&typeof value.toMillis==='function')value=value.toMillis();
 return typeof value==='number'&&Number.isFinite(value)?value:0;
}
export function cleanupLease(plan:Record<string,any>|undefined,now:number){
 const until=cleanupMillis(plan?.leaseUntil);
 // A failed/completed run does not own a lock; reject impossible legacy expiry dates.
 const active=plan?.status==='running'&&until>now&&until<=now+360000;
 return {active,remaining:active?until-now:0,recoverable:!!plan&&!active&&(plan.status==='running'||plan.status==='error'||until>0)};
}
export function nextCleanupMonth(time:number){
 if(!Number.isFinite(time)||time<=0)throw Error('La fecha de limpieza no es válida.');
 // Calendar months in Ecuador, independently of the browser's time zone or DST.
 const offset=5*3600000,date=new Date(time-offset),day=date.getUTCDate();
 date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+1);
 const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));
 return date.getTime()+offset;
}

export function dashboardErrorMessage(error:unknown){
 const code=error&&typeof error==='object'&&'code'in error?String(error.code):'';
 if(/permission.denied|unauthenticated/i.test(code))return 'Tu sesión no tiene permiso para completar esta acción. Vuelve a comprobar el acceso al panel.';
 if(/unavailable|network|disconnected|deadline/i.test(code))return 'Se interrumpió la conexión. Compruébala y vuelve a intentarlo; la operación puede haber avanzado parcialmente.';
 if(code==='failed-precondition')return 'No se pudo consultar el contenido con la configuración actual. La limpieza se detuvo; vuelve a revisar el plan.';
 return error instanceof Error?error.message:'No se pudo completar la acción.';
}
