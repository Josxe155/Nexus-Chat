# Actualización masiva — v26.97.0

## Mensajes temporales

Se conservan las duraciones de 24 horas, 7 días y 90 días. La fecha se fija al enviar el mensaje y no se recalcula al cambiar o desactivar la duración del chat. Los mensajes nuevos de un chat sin temporales guardan `expiresAt: 0`. Los conservados también utilizan cero y mantienen su vencimiento original para cuando se deje de conservarlos.

Las reglas de Firestore rechazan la lectura de mensajes vencidos por participantes, tanto por documento como por consultas sin el filtro correspondiente. Historial paginado, búsqueda, exportación, copias, recibos y contenido multimedia utilizan consultas compatibles. Los índices incluyen ambas ramas de mensajes permanentes y temporales. La consulta deja un margen de cinco segundos para no enviar una petición que venza durante el traslado; la interfaz además comprueba la fecha del mensaje.

El archivo de un mensaje se vincula al enviarlo. Su clave no se entrega después del vencimiento del mensaje; tampoco mediante una lista de archivos propios. La conservación actualiza la fecha del mensaje y del archivo en una misma operación. La vista única mantiene su propio límite, sin convertirlo en permanente cuando el chat está desactivado. Las vistas previas de temporales guardadas en el documento del chat usan «Mensaje temporal» para no conservar una copia legible del texto vencido.

El propietario mantiene la lectura administrativa necesaria para el mantenimiento. El dashboard elimina los mensajes vencidos y limpia archivos vinculados sin mensaje padre, fragmentos en Realtime Database y votos huérfanos. Una conversación abierta también elimina las referencias cargadas cuando vencen. Estas operaciones no borran mensajes permanentes ni conservados por caducidad. La limpieza mensual y la manual confirmada siguen siendo procesos separados con su funcionamiento anterior.

**Límite de ejecución:** sin un cliente activo no hay un proceso que borre físicamente documentos a una hora exacta. Las reglas protegen las peticiones nuevas al servidor y la limpieza se completa al volver a ejecutarse la web o el dashboard. Un service worker no garantiza ejecución permanente. No se activan TTL de pago, Blaze, servidores ni tareas programadas externas. Ninguna regla puede retirar una copia ya descargada o una captura.

## Invitados tras treinta días de inactividad

La actividad de invitados se actualiza durante el uso. Firestore impide reactivar mediante una escritura ordinaria un perfil que ya superó treinta días de inactividad. Las sesiones nuevas también registran actividad en Realtime Database, donde las reglas impiden renovar un registro ya vencido.

El dashboard del propietario revisa y revoca las cuentas vencidas antes de borrar datos. El proceso puede reanudarse tras un corte: elimina perfil, ajustes privados, credenciales recuperables, números y reservas, mensajes publicados, estados, archivos propios y presencia. Conserva una marca mínima de revocación para impedir el reingreso. No elimina mensajes de otras personas ni conversaciones compartidas por contener una referencia a ese usuario.

**Pendiente con la restricción actual:** eliminar el registro de otra persona en Firebase Authentication requiere una identidad privilegiada fuera del navegador. Esta entrega revoca el acceso y elimina los datos descritos, pero no presenta ese registro de Authentication como eliminado. Los registros administrativos, reportes y referencias compartidas tienen una conservación distinta; no se promete borrar cualquier aparición del UID en datos de otras cuentas.

## Descarga de voz

El control de voz del informe y de Nexus Assistant muestra un indicador circular debajo del botón. Utiliza bytes recibidos y confirmados: porcentaje, MB descargados, MB totales y pendientes. Al reanudar incluye los bloques locales válidos. Si el servidor reinicia la transferencia, el indicador también vuelve a cero.

El modelo principal tiene 92 361 116 bytes. Alcanzar el 100 % de ese archivo no se presenta como voz lista: aparece «Descarga completa · Preparando voz». Los preparativos y recursos sin un tamaño verificable se muestran sin un porcentaje inventado. Se conservan la cancelación, el plazo máximo y la reanudación de la entrega anterior. Descargar y ejecutar el modelo aún requiere red, memoria y tiempo en el dispositivo.

## Identidad y contactos

Las cuentas nuevas empiezan con el nombre de usuario vacío, tanto para Google como para correo y para invitados. La pantalla de registro pide el nombre de la persona; no lo convierte en un usuario reservado. Se elige el usuario desde el perfil, con la reserva única y el plazo de treinta días entre cambios. Nombre, foto e información pueden editarse sin exigir que primero se elija un usuario. Los usuarios ya elegidos de cuentas existentes se conservan.

La etiqueta es «Nombre de usuario», sin «reservado», y no se muestra un símbolo @ aislado cuando está vacío. Se conserva la sincronización opcional con Google de la entrega anterior y se oculta a invitados; esta actualización no certifica una autorización real de People API en un dispositivo físico.

Los números Nexus nuevos usan generación criptográfica, validación completa del plan móvil, longitud internacional y reserva única. Se comprueban más de 200 países con un ejemplo móvil disponible. Los territorios que comparten plan conservan su prefijo internacional compartido. No se cambian números existentes ni se atribuye titularidad de líneas reales, operadoras o distritos; para planes sin información móvil no se inventan números.

## Compatibilidad y comprobaciones

`maintenance/prepare-message-expiry.cjs` permite preparar metadatos de historiales existentes antes de publicar las consultas: normaliza fechas ausentes, protege las vistas previas y vincula archivos de referencia única. Solo selecciona metadatos; usa precondiciones de versión para no sobrescribir cambios concurrentes. Los archivos compartidos por varias referencias antiguas no se reasignan de manera arbitraria.

Se verifican TypeScript, compilación de Hosting, las 167 pruebas anteriores y ocho pruebas nuevas de políticas, números, descarga y migración. Las 110 comprobaciones con emuladores prueban lecturas y borrados autorizados/denegados, inactividad, envío multimedia, conservación y las regresiones de edición y encuestas. No realizan escrituras de producción.

La matriz visual de esta entrega reúne 64 casos nuevos de perfil y descarga, y 78 de regresión de las referencias anteriores: celular 74/74, tablet 36/36 y computadora 32/32. Son tamaños simulados, en claro y oscuro; no equivalen a pruebas físicas ni a un porcentaje global de finalización de Nexus.

Fuentes: [WhatsApp: mensajes temporales](https://faq.whatsapp.com/673193694148537/), [WhatsApp: duraciones](https://blog.whatsapp.com/more-control-and-privacy-with-default-disappearing-messages-and-multiple-durations), [Firebase: reglas y consultas](https://firebase.google.com/docs/firestore/security/rules-query), [Firebase: condiciones de seguridad](https://firebase.google.com/docs/firestore/security/rules-conditions), [Firebase: límites](https://firebase.google.com/docs/firestore/quotas).

Copias y restauración, pantallas sin referencia, pruebas físicas y mejoras posteriores de llamadas/comunidades mantienen sus pendientes. Los retoques de logo y la eliminación de la dependencia del dashboard para la limpieza mensual siguen fuera del alcance, conforme a la decisión del propietario.
