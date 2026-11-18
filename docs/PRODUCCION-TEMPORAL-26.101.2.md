# Revisión para producción temporal — v26.101.2

Revisión del 18 de noviembre de 2026, iniciada a las 01:14:55 UTC. Se revisaron recorridos de entrada, chats, Ajustes, multimedia, contactos, recuperación, dashboard, consultas y reglas. La comprobación automática no sustituye una prueba física de cada dispositivo ni una revisión manual exhaustiva de todas las combinaciones posibles.

## Resultado y condición para una apertura pública

La entrega corrige fallos reproducidos y permite continuar con pruebas temporales. **La apertura pública sin restricciones queda pendiente por el tratamiento de claves de servicios de IA en el cliente.** La configuración local mantiene claves fuera de Git, pero la compilación incluye valores de Gemini, Groq y OpenRouter, verificables en los archivos JavaScript. El informe no reproduce ningún valor. Esta limitación de la arquitectura ya figuraba en el README; no hay evidencia en esta revisión de abuso ni de una lectura ajena de Firebase.

Antes de una apertura pública deben retirarse del cliente las claves que deban ser secretas y rotarse las que se hayan distribuido. Mantener los servicios compartidos con claves ocultas requiere un componente confiable; la restricción vigente impide añadir un servidor propio o Blaze. La alternativa de pausar las funciones afectadas o usar autorizaciones individuales cambia su alcance y necesita definición; esta revisión no las desactiva ni introduce nuevos menús. No se certifica la página para una apertura pública irrestricta.

## Fallos reproducidos y corregidos

1. El bloqueo del almacenamiento local llevaba la entrada a la pantalla de error en los tres tamaños. Los ajustes visuales y los borradores ahora recuperan su estado en memoria durante la sesión cuando el almacenamiento está bloqueado o lleno. Este reemplazo no se utiliza para bloqueos de seguridad, credenciales ni recibos de sincronización que requieren persistencia real.
2. Preferencias guardadas con tipos incorrectos podían propagarse a los menús. Se normalizan campos, redes, horarios, tonos y duración; se conservan las opciones válidas y se descartan campos ajenos. La duración conserva 24 horas, 7 días y 90 días.
3. «Volver a intentar» en el error de la aplicación recargaba solo el marco de error. Ahora recarga la página principal; «Ir al inicio» también sale del marco. Se utiliza el icono oficial transparente.
4. El dashboard carecía de la protección de errores de renderizado que ya tenía la aplicación. Se incorpora la misma recuperación, sin modificar los permisos del administrador.
5. La caché de archivos no cerraba algunas conexiones al fallar y no manejaba todos los abortos. Ahora rechaza esas operaciones, libera las conexiones y termina las aperturas bloqueadas o sin respuesta; una conexión tardía se cierra. Se descartan entradas de caché que no sean archivos.
6. Los lectores de contactos toleran registros privados incompletos y normalizan números con espacios o paréntesis. Los nombres y números válidos se conservan; los objetos malformados no llegan a los menús como nombres o teléfonos.

La recuperación en memoria de preferencias y borradores dura solo hasta cerrar o recargar la página; cuando el navegador permite almacenamiento, sigue utilizándose el almacenamiento habitual. No se trasladan los chats de Nexus Assistant a Firebase.

## Comprobaciones

- TypeScript, documentación, compilación de Hosting y 251 pruebas unitarias, incluidas nuevas regresiones de preferencias, caché, recuperación y contactos.
- Dieciocho suites sobre emuladores: historial, reglas, propietario del dashboard, lectura/escritura de Assistant, limpieza, comunidades, bloqueo, canales, encuestas, invitados y retención. Datos sintéticos; sin limpiezas reales ni escrituras en las agendas del propietario.
- 450 pantallas de Ajustes: 25 apartados, ambos temas, tres tamaños y almacenamiento normal, bloqueado o con preferencias malformadas. Se utiliza el código real de preferencias y Ajustes; servicios y apartados ajenos al recorrido se simulan.
- Entrada con almacenamiento bloqueado: tres tamaños; antes no aparecía el acceso y después aparece sin error.
- Recuperación de aplicación y dashboard: reintento, salida del marco, logo y distribución en los tres tamaños.
- Historial: apertura, paginación, fallo, reintento, cambio de conversación y caducidad, 24 casos.
- Voz/emojis: grabar, pausar, reanudar, enviar, liberar micrófono, elegir emoji y revisar la superficie inferior, con dispositivos sintéticos y ambos temas.
- Contactos: 37 casos de creación/edición, persistencia, renovación, cancelación e invitado. El guardado real en Samsung Internet fue confirmado por el propietario en la conversación anterior.
- Dashboard: cuatro tamaños y seis recorridos de mantenimiento, incluidos confirmación, ejecución interrumpida, desconexión y errores de permisos.
- Las reglas publicadas de Firestore y Realtime Database coinciden con el repositorio. Los siete planes de consulta comprobados responden correctamente; se usa planificación sin leer conversaciones. No se modifican reglas en esta entrega.

Son **542 casos de navegador**: celular a 390 px, **185/185**; tablet a 820 px, **178/178**; computadora a 1440 px, **178/178**. Cada tamaño completa el 100 % de ese conjunto. Hay además una comprobación del dashboard a 320 px. Estos porcentajes no miden la terminación global del producto. GitHub valida de nuevo la entrega al subir el commit; Hosting se contrasta con la compilación local después de publicarlo.

## Límites que siguen vigentes

- Pruebas físicas en Android, iPhone, Samsung Internet, equipos con poca memoria, biometría, altavoz/auricular, pantalla bloqueada y Chrome con dos cuentas.
- Notificaciones y llamadas mientras una pestaña sigue ejecutándose. El service worker no garantiza ejecución continua ni sustituye un emisor Push remoto con todas las pestañas cerradas.
- Copias/restauración, menús y pantallas que siguen pendientes de referencias; se conservan como pendientes.
- La regla genérica de varios documentos privados del propio usuario admite formatos sin validación individual. Los lectores revisados son más resistentes, pero esto no sustituye el endurecimiento completo por esquema descrito en la auditoría anterior.
- Dependencia de la conexión, cuotas y disponibilidad de servicios externos. No se afirma que la revisión elimine todos los fallos futuros.

## Referencias contrastadas

- [WhatsApp: mensajes temporales](https://faq.whatsapp.com/673193694148537/).
- [WhatsApp: llamadas y permisos de cámara/micrófono](https://faq.whatsapp.com/1862285217468140/).
- [Firebase: reglas y consultas](https://firebase.google.com/docs/firestore/security/rules-query).
- [IndexedDB: transacciones](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction).
- [Almacenamiento web y sus límites](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).
