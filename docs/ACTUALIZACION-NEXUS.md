> Revisión posterior: consulta ACTUALIZACION-MESSENGER.md para los cambios de mensajería y la publicación vigente de reglas.

# Nexus Chat · configuración y compatibilidad · 26 de octubre de 2026

Esta es la descripción vigente del proyecto. Sustituye las indicaciones anteriores sobre configuración, privacidad de estados, perfiles y notificaciones. Las pruebas de interfaz utilizan cuentas y conversaciones ficticias locales; las pruebas de Firebase utilizan emuladores y no modificaron datos reales.

## Error al acceder desde otros dispositivos

Se sustituyeron todas las llamadas directas a crypto.randomUUID del cliente por una función común. Utiliza randomUUID cuando existe y getRandomValues para crear UUID v4 cuando se accede por HTTP desde la red local. No utiliza Math.random. Se comprobaron 5.000 identificadores válidos y distintos en http://192.168.0.104:3000, donde randomUUID no está disponible. Se añadió una pantalla de recuperación ante errores inesperados de React.

Si el proyecto remoto conserva las reglas anteriores, se mantiene un ingreso compatible con perfiles privados y una presencia básica. Las audiencias restringidas de presencia se ocultan por completo en ese modo, en vez de publicarse sin protección. Las opciones nuevas siguen requiriendo publicar las reglas actualizadas.

Este arreglo permite abrir la página mediante HTTP en la red local; no elimina la exigencia de HTTPS que los navegadores aplican a cámara, micrófono, grabación y Web Push fuera de localhost.

## Una configuración compartida

Hay una sola implementación para computadora, móvil y tablet. Desde un apartado, la flecha vuelve a la lista o al apartado anterior. La lista y los apartados largos tienen desplazamiento propio. Video y voz aparece únicamente en la distribución de escritorio; no hay nombres de dispositivos codificados.

- Perfil: nombre, foto subida por fragmentos (hasta 5 MB), información y nombre de usuario. Los nombres de usuario se reservan con una transacción y las reglas impiden usar uno reservado por otra cuenta.
- Cuenta: información de seguridad veraz, avisos de nuevos accesos por navegador, descarga de un informe JSON y eliminación con confirmación y autenticación reciente. El informe excluye contraseñas, claves, tokens y contenido de mensajes.
- Privacidad: última vez, En línea, foto e información con las audiencias solicitadas; excepciones por contacto; estados para contactos, excepto seleccionados o solo seleccionados. Incluye contactos bloqueados, confirmaciones recíprocas, silenciamiento de llamadas desconocidas y llamadas exclusivamente por TURN para proteger la dirección IP.
- Chats: claro, oscuro o sistema; estilos con vista previa; dibujos de Nexus; fondo y burbujas; calidad de fotos estándar/HD; descarga automática por categoría; corrección ortográfica, reemplazo de texto por emojis y Enter para enviar.
- Video y voz: detección de cámaras, micrófonos y altavoces reales; preferencias de captura, eco y ruido; prueba de cámara/micrófono. La selección de altavoz solo se ofrece si el navegador permite cambiar la salida.
- Notificaciones: banner y conteo; mensajes, grupos, estados y llamadas; reacciones; selección entre diez tonos por categoría; vista previa; sonido de mensajes salientes; activación de notificaciones del sistema.
- Ayuda: comentario y diagnóstico descargable, sin envío automático. Cerrar sesión aparece al final.

Los ajustes de chat se sincronizan en la cuenta. Los avisos se configuran por navegador/dispositivo. El tema, los estilos de chat y los dispositivos de audio/video se conservan localmente.

## Privacidad aplicada a los datos

El directorio público conserva el nombre y el usuario; al migrar una cuenta, la foto, la información y las fechas dejan de publicarse en ese documento. El perfil completo se guarda en documentos privados. Foto e información se consultan por separado y sus reglas comprueban audiencia y bloqueos. La URL de una foto subida también comprueba el permiso vigente y que sea la foto actual.

La presencia usa sesiones independientes en Realtime Database, con limpieza por desconexión y fecha del servidor. Ya no se consulta la raíz pública de todas las sesiones. Cada lectura comprueba la audiencia, las excepciones, los bloqueos y la reciprocidad. Cerrar una pestaña mantiene conectadas las otras pestañas visibles.

«Mis contactos» es una lista de tu cuenta, administrable desde Privacidad. Iniciar un chat nuevo añade esa persona a tu lista. El directorio de Personas en Nexus sigue mostrando cuentas registradas vigentes; no importa la agenda telefónica ni la agenda de Google.

Los estados incluyen una lista de destinatarios y se consultan mediante esa audiencia. Cambiar su privacidad actualiza los estados activos. Los estados admiten reacciones y duran hasta 24 horas. «Ocultos» sigue siendo una opción para silenciar estados en tu lista.

Desactivar confirmaciones impide enviarlas y recibirlas en conversaciones individuales; en grupos se mantienen. Los bloqueos también deniegan mensajes directos nuevos mediante las reglas.

La duración predeterminada (desactivada, 24 horas, 7 días o 90 días) se aplica a mensajes nuevos de chats nuevos. Para conversaciones existentes hay una selección explícita. Los mensajes caducados dejan de mostrarse y los archivos temporales caducan en el backend; no se garantiza borrado físico inmediato de todo el historial de Firestore ni se impiden copias o capturas.

## Archivos y aspecto

Los archivos habituales se suben en fragmentos de 1 MiB y quedan en disco privado del backend con URL autenticada. Los documentos y grupos funcionan aunque el receptor esté desconectado. Se mantienen reintentos, rangos de descarga, comprobación de pertenencia y restricciones de historial.

El máximo programado es 2 GiB por archivo; las vistas previas se limitan a 100 MiB. Para descargas grandes se utiliza escritura directa en disco donde el navegador lo permite. Las fotos estándar se preparan hasta 1600 píxeles y las HD hasta 4096; documentos, GIF, audio y video conservan el original. Enviar una foto como documento conserva el archivo sin cambios.

La descarga automática distingue fotos, audio, videos y documentos. Las notas de voz se cargan automáticamente; los demás archivos se pueden cargar o descargar manualmente. Las preferencias no eliminan las copias que el usuario ya descargó.

Se conservan 15 fondos originales, importación de fondos propios, colores y formas de burbujas y del botón de voz, 10 GIF originales, 12 stickers originales, 10 melodías y 10 avisos breves. El selector contiene 3.963 secuencias de Unicode Emoji 18.0. La representación de los emojis recientes depende de las fuentes del dispositivo; no son recursos propietarios de WhatsApp.

## Notificaciones fuera de la página

Se incorporó Web Push con la biblioteca gratuita web-push, claves VAPID privadas y un service worker. Funciona con proveedores de navegador compatibles (Chrome, Edge, Firefox y Safari), sujeto a sus permisos y al sistema. En iPhone/iPad se necesita usar la web instalada en la pantalla de inicio. El receptor no necesita mantener abierta la pestaña, pero el sistema debe permitir notificaciones y actividad del navegador.

El backend verifica el chat, el remitente, el mensaje o el estado antes de generar un aviso. Respeta las categorías, las reacciones, las vistas previas, los bloqueos y los avisos de seguridad. Los accesos nuevos avisan a los demás navegadores registrados cuando lo tienen activado. Cerrar sesión retira la suscripción de ese navegador.

Los tonos originales se reproducen con Nexus abierto. Con la web cerrada el sonido lo decide el sistema operativo; Web Push no permite elegir arbitrariamente un archivo de audio para ese aviso. El conteo en la barra de tareas depende del soporte del navegador y, normalmente, de que la web esté instalada.

Las claves VAPID se generan y guardan automáticamente en server/data/push/vapid.json. Mantén ese archivo y los registros de suscripciones en disco privado persistente. Nunca los copies a public ni dist. El ZIP excluye esos archivos, las claves de IA/TURN, los medios subidos y las credenciales.

## Activación en el proyecto real

1. Instala las dependencias con npm ci y npm --prefix server ci. Node.js debe admitir process.loadEnvFile.
2. En otra copia del proyecto, completa server/.env desde server/.env.example. Este espacio de trabajo conserva su archivo privado configurado; el ZIP lo excluye.
3. Con una sesión autorizada de Firebase, publica las reglas y el índice: firebase deploy --only firestore:rules,firestore:indexes,database --project nexus-chat-56d9d. Archivos: firestore.rules, firestore.indexes.json y database.rules.json. Publicadas y verificadas el 2026-10-26T23:20:32.062Z: ambas reglas coinciden con los archivos probados y el índice de estados está READY. Se conservó una copia de las reglas anteriores fuera del ZIP, en work/firebase-release/before-deployment.json.
4. Ejecuta npm run dev para localhost:3000, con backend 127.0.0.1:3001 detrás de /api. Para otros dispositivos y producción, sirve la página y /api en el mismo origen mediante HTTPS; el hosting estático solo no ejecuta el backend. No publiques server/.env ni server/data.
5. Mantén server/data y el directorio de medios en un disco privado persistente. El límite reservado de medios es 10 GiB, configurable. No se activó facturación ni Firebase Storage.
6. Activa las notificaciones desde Configuración → Notificaciones en cada navegador. Las reglas de este proyecto ya están publicadas. Usar HTTPS y conceder permisos sigue siendo necesario para probar la entrega real entre dispositivos. Las pruebas locales no enviaron avisos a contactos reales.

La limpieza automática de invitados tras 30 días de inactividad requiere una credencial administrativa de Firebase que sigue pendiente. La eliminación voluntaria usa la sesión del propio usuario y no requiere esa credencial. El contenido compartido puede permanecer en conversaciones de otras personas al eliminar una cuenta.

## Seguridad y límites explícitos

No se implementó un protocolo de cifrado de extremo a extremo de mensajes/archivos, códigos de seguridad de contactos, bloqueo biométrico, prevención de capturas o passkeys. La pantalla de seguridad explica el estado real en vez de afirmar que el servidor no puede leer los datos. Las llamadas WebRTC están cifradas durante la transmisión.

Las opciones de las capturas para bloqueo biométrico de aplicación, restricciones avanzadas de grupos y bloqueo por volumen de cuentas desconocidas no se añadieron como interruptores decorativos. Los enlaces se muestran sin cargar vistas previas externas. No se añadieron servicios de pago.

## Comprobaciones de esta actualización

- TypeScript sin errores y compilación de producción.
- 34 comprobaciones de interfaz y comportamiento en 390, 768, 1024 y 1366 px; sin desbordamientos ni errores de JavaScript en esas pruebas.
- 94 pruebas de reglas con emuladores Firestore/RTDB: audiencias, excepciones, reciprocidad, bloqueos, mensajes, estados, nombres reservados y eliminación de datos propios.
- 32 pruebas del backend: cuentas, VAPID, filtrado y reintentos de avisos, informe sin secretos, eliminación simulada, transferencias, cuotas, TURN y proveedores de IA.
- Prueba adicional de caducidad del texto en la vista previa de la lista de chats.
- Ingreso de un invitado y 7 casos de presencia con las reglas anteriores, comprobados mediante servicios locales/simulados.
- 7 pruebas del hook real de presencia y SDK RTDB en navegador, con dos pestañas, desconexión, reconexión y privacidad.
- 5.000 UUID v4 únicos en HTTP de red local, sin randomUUID nativo.
- Push simulado mediante Chrome DevTools Protocol: el service worker recibió el evento y pidió mostrar el aviso con el enlace correcto. La entrega externa con una suscripción real y el navegador cerrado sigue pendiente de HTTPS y permisos reales.

No se eliminaron cuentas reales durante las pruebas. Después de recibir autorización se publicaron y verificaron las reglas y el índice del proyecto remoto. Las pruebas de archivos usan unos pocos MiB; el límite de 2 GiB está programado, pero no se realizó una carga real de ese tamaño.

Referencias: [Crypto.getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues), [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [Web Push](https://github.com/web-push-libs/web-push), [notificaciones y ejecución en segundo plano](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), [Firestore REST con sesión del usuario](https://firebase.google.com/docs/firestore/use-rest-api).

## Publicación de Firebase completada

Proyecto: nexus-chat-56d9d. Reglas de Firestore y Realtime Database verificadas contra los archivos locales; índice de estados READY. No se publicaron archivos de Hosting ni se activó facturación. Para aplicar la nueva privacidad en cuentas que tenían abierta la versión anterior, recarga la página y deja que se sincronice el perfil. La entrega real de notificaciones con la web cerrada sigue pendiente de servir la aplicación mediante HTTPS.
