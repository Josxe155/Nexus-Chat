export function isQuotaError(error:unknown){const value=error as any;return value?.code===8||/resource-exhausted|quota[-_ ]exceeded/i.test(String(value?.code||'')+' '+String(value?.message||''));}
export function dataErrorMessage(error:unknown,fallback='No se pudo completar la sincronización.'){
 if(isQuotaError(error))return 'El almacenamiento de Nexus alcanzó su límite temporal de uso. Tus datos se conservan y no necesitas volver a registrarte. Inténtalo más tarde.';
 const code=String((error as any)?.code||'');
 if(/unavailable|deadline-exceeded/.test(code))return 'No se pudo conectar con tus conversaciones. Comprueba tu conexión y vuelve a intentarlo.';
 if(/permission-denied|unauthenticated/.test(code))return 'No se pudo confirmar el acceso a tu cuenta. Vuelve a iniciar sesión para renovar el acceso.';
 return fallback;
}
