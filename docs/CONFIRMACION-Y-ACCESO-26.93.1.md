# Confirmación simple y recuperación de acceso — v26.93.1

## Confirmar sin códigos

Nexus Assistant acepta **CONFIRMAR** como mensaje independiente, sin distinguir mayúsculas. Se aplica a la última respuesta que contiene una propuesta pendiente, incluida la limpieza manual. Los identificadores se conservan internamente para la auditoría, pero no se piden al administrador.

Si esa respuesta contiene varias propuestas pendientes, no se elige una al azar: se pide preparar un único cambio. Si la última ya se ejecutó, repetir CONFIRMAR no vuelve a ejecutarla ni recupera una propuesta anterior. Se conservan la verificación del propietario, la caducidad de veinticuatro horas y los controles de concurrencia de cada operación.

Las respuestas antiguas que incluían un código tras CONFIRMAR o LIMPIAR AHORA se muestran y se leen en voz alta sin ese código cuando son instrucciones de confirmación. Las vistas previas JSON, el código y el contenido citado de mensajes se conservan. No se modifican los identificadores internos ni los mensajes escritos por el usuario. Copiar una orden antigua con código muestra una indicación para usar únicamente CONFIRMAR, sin ejecutar una propuesta distinta silenciosamente.

## Acceso al dashboard

La comprobación de producción, de solo lectura, confirmó que la identidad propietaria, su correo verificado y su rol estaban habilitados y coincidían en ambas bases. No se modificó esa configuración ni se concedieron permisos nuevos.

El cliente confundía las denegaciones de permisos con fallos de transporte bajo un mismo mensaje. Ahora distingue una cuenta sin acceso de una comprobación que falló por conexión. Los errores temporales provocan hasta tres reintentos, separados por uno, dos y cuatro segundos. También se vuelve a comprobar al recuperar la conexión o volver a la pestaña.

**Volver a comprobar acceso** renueva ahora los tokens de las sesiones antes de revalidar los permisos. Un fallo de red al verificar la sesión alternativa por contraseña ya no la cierra ni se presenta como una contraseña incorrecta; se conserva sin conceder acceso hasta que se verifique. Una denegación real sí cierra esa sesión. Esa renovación tiene un límite de diez segundos para evitar una pantalla de espera indefinida. La verificación conserva su límite de doce segundos. Los listeners y los temporizadores se cancelan cuando cambia la sesión o se desmonta el controlador.

Si falla la sesión alternativa mientras existe otra cuenta de Nexus abierta, el mensaje y las acciones de acceso corresponden a la sesión que falló. Se espera a completar ambas comprobaciones iniciales antes de mostrar una denegación. Los listeners verifican la identidad con las afirmaciones del token, sin rechazar una sesión válida por un valor local antiguo de correo verificado. La revocación del rol sigue cerrando el acceso; los reintentos nunca sustituyen la comprobación del UID, correo verificado y rol habilitado.

No se afirma haber reproducido la conexión concreta del dispositivo del propietario ni haber iniciado una sesión de producción como él. Las verificaciones de fallos y recuperación se realizaron con adaptadores de prueba y emuladores.

## Validación

Diez pruebas unitarias nuevas cubren confirmación, propuestas múltiples, repetición, caducidad, propietario y clasificación de errores. El navegador recorre cinco casos en claro y oscuro a 390, 820 y 1440 píxeles: propuesta sin código, edición confirmada, rechazo de repetición, limpieza simulada con confirmación y protección ante su repetición. Son diez de diez casos por tamaño; no pruebas en dispositivos físicos ni un porcentaje de avance global.

Nueve escenarios del controlador real de acceso comprueban autorización y revocación, datos locales de perfil desactualizados, denegación real, recuperación temporal, desconexión con reintentos limitados y retorno de conexión, renovación manual, sesión alternativa, fallo de conexión después del acceso por contraseña y renovación que agota el tiempo. Los emuladores mantienen la protección frente a otro UID aunque tenga el mismo correo y un rol activado. No se modificaron usuarios ni contenido de producción durante las pruebas.
