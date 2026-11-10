import {isQuotaError,dataErrorMessage} from './dataErrors';
export function authErrorMessage(error:unknown,fallback='No se pudo iniciar sesión. Inténtalo de nuevo.'){
 if(isQuotaError(error))return dataErrorMessage(error);
 const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';
 const messages:Record<string,string>={
  'auth/credential-already-in-use':'Este número ya pertenece a otra cuenta. No se han fusionado las cuentas.',
  'auth/provider-already-linked':'Ya tienes un teléfono vinculado. Para cambiarlo se necesita verificar el número nuevo desde tu cuenta.',
  'auth/requires-recent-login':'Vuelve a iniciar sesión antes de cambiar el teléfono.',
  'auth/invalid-phone-number':'Escribe un número válido con + y el código de país.',
  'auth/invalid-verification-code':'El código no es correcto. Revisa los seis dígitos.',
  'auth/code-expired':'El código venció. Solicita uno nuevo.',
  'auth/session-expired':'El código venció. Solicita uno nuevo.',
  'auth/invalid-app-credential':'No se pudo verificar la seguridad del acceso. Recarga la página e inténtalo de nuevo.',
  'auth/quota-exceeded':'El envío de códigos no está disponible por el momento. Usa otro método de acceso.',
  'auth/billing-not-enabled':'El envío de SMS no está disponible en este momento. Puedes entrar con Google o correo.',
  'auth/operation-not-supported-in-this-environment':'Abre Nexus Chat desde su dirección HTTPS para verificar tu teléfono.',
  'auth/invalid-credential':'El correo o la contraseña no son correctos.',
  'auth/wrong-password':'El correo o la contraseña no son correctos.',
  'auth/user-not-found':'El correo o la contraseña no son correctos.',
  'auth/invalid-email':'Escribe un correo electrónico válido.',
  'auth/email-already-in-use':'Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
  'auth/weak-password':'Usa una contraseña de al menos 12 caracteres, con letras y números.',
  'auth/user-disabled':'Esta cuenta está desactivada.',
  'auth/too-many-requests':'Se han realizado demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'auth/network-request-failed':'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.',
  'auth/popup-closed-by-user':'Se cerró la ventana de acceso. Puedes intentarlo de nuevo.',
  'auth/cancelled-popup-request':'Hay otra ventana de acceso abierta. Continúa desde ella.',
  'auth/popup-blocked':'Permite abrir la ventana de acceso en tu navegador.',
  'auth/unauthorized-domain':'El acceso desde esta dirección todavía no está habilitado.',
  'auth/operation-not-allowed':'Este método de acceso todavía no está habilitado.',
  'permission-denied':'No se pudo acceder a tu perfil. Intenta iniciar sesión de nuevo.',
  'unavailable':'No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.'
 };
 return messages[code]||fallback;
}
