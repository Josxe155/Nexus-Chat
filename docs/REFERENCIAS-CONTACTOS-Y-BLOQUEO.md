# Contactos y bloqueo — v26.87.0

## Alcance y correspondencia

Se revisaron las 15 imágenes del ZIP «Referencias Menú de Contactos y Bloqueo de usuarios». Las pantallas nuevas se aplican a celular, según la detección móvil vigente de Nexus. Tablet y computadora conservan sus pantallas de agenda, grupo y evento. La corrección funcional del estado bloqueado también se aplica al chat de esos dispositivos.

Los nombres, fotos, correos y cantidades de las capturas no se incorporan a la página ni al repositorio. Se muestran datos de la cuenta actual y sus contactos privados. Las ilustraciones de comunidad y evento se representan en SVG, basándose en las referencias. No se afirma identidad de píxeles: las ilustraciones, la tipografía del sistema, los temas, los datos reales y los controles nativos pueden diferir.

| Captura | Correspondencia en Nexus | Estado |
| --- | --- | --- |
| 222922 | Contactos: cabecera, cantidad real, búsqueda, acciones, cuenta propia y agenda personal ordenada | Implementado |
| 222928 | Menú: ajustes de contactos, invitar amigos, contactos, actualizar y ayuda | Implementado; abrir la agenda nativa queda pendiente |
| 222932 | Ajustes de contactos: cuentas bloqueadas y almacenamiento en la cuenta Nexus | Implementado; desactivar la agenda de cuenta queda pendiente del recorrido de confirmación |
| 222940 | Compartir la invitación mediante el selector del sistema | Web Share cuando está disponible; en otros navegadores se copia el enlace |
| 223011 | Selector de miembros: frecuentes reales, búsqueda, selección, teclado de números/texto y avance | Implementado |
| 223020 | Grupo: foto opcional, nombre, duración, permisos y miembros con Añadir | Implementado; el interior de Permisos está pendiente de referencia |
| 223026 | Validación del nombre del grupo y confirmación Aceptar | Implementado |
| 223048 | Nuevo contacto: alias, apellido, usuario, país, número y cuenta de destino | Implementado con resolución de números Nexus; sincronización telefónica sustituida por sincronización opcional con Google, autorizada posteriormente por el propietario |
| 223055 | Lector QR de contacto | Disponible en Ajustes, junto a Nuevo contacto y en la cabecera del formulario; los dos accesos nuevos abren el escáner, conforme a la corrección del propietario |
| 223103 | Introducción de comunidad y Comenzar | Implementado; ejemplos de comunidades pendientes de referencia |
| 223108 | Foto, nombre de 100 caracteres, descripción de 2048, contadores y creación de comunidad | Implementado |
| 223118 | Evento: portada, nombre, descripción, inicio, fin opcional, lugar, recordatorio y organizador | Implementado como calendario; edición de portada, enlace de llamada y gestión de invitados pendientes |
| 223208 | Chat bloqueado: aviso privado, Eliminar chat y Desbloquear | Implementado |
| 223220 | Confirmación: eliminar, archivar, cancelar y retirar copias locales | Implementado para el navegador; no modifica la galería del dispositivo |
| 223233 | Aviso de desbloqueo y recuperación de la escritura | Implementado |

El QR conserva su acceso de Ajustes y añade los dos accesos de las capturas, siguiendo la indicación actual del propietario. Las opciones sin recorrido de referencia se presentan desactivadas cuando la captura incluye su acceso. No se inventan sus submenús.

## Funciones y conservación

- La lista contiene la agenda personal y su alias, no un catálogo de todos los usuarios. Las búsquedas aceptan nombre sin distinción de acentos, usuario y números Nexus guardados en la agenda privada. Los frecuentes se calculan con conversaciones directas existentes.
- Nuevo contacto conserva la validación E.164 y las dos ramas registrado/no registrado de v26.85.0. Un número inexistente no guarda contacto ni abre chat. Los números Nexus no son líneas telefónicas verificadas; el navegador tampoco puede escribir una agenda nativa general. El correo de destino procede de la sesión actual.
- Los grupos se pueden iniciar con el propietario y añadir contactos disponibles después. Admiten hasta 100 integrantes con el modelo vigente de Nexus. La creación comprueba la agenda actual, excluye bloqueados, valida perfiles y guarda duración. Los reintentos recuperan el mismo grupo sin sobrescribir su información. La foto se puede reintentar si falla tras crear el grupo.
- La comunidad y su grupo de avisos se crean en un lote atómico. Se conserva el identificador en reintentos, se limita el título de avisos y se admiten descripciones de 2048 caracteres en las reglas. No se cambian los límites de descripción de grupos.
- Los eventos continúan usando archivos de calendario. Desde un chat se envían por su recorrido actual; desde Contactos se comparten por el sistema o se descargan. Incluyen recordatorio de una hora y nombre del organizador, sin publicar automáticamente su correo. Se escapan saltos de línea y se pliegan líneas UTF-8 a 75 bytes. El formulario avisa que los receptores del archivo pueden ver los detalles incluidos. No se presenta esto como confirmación de asistencia o recordatorio emitido por Nexus.
- Bloquear/desbloquear modifica solo la lista de bloqueados a partir de la privacidad actual, conserva contactos y nombres privados, actualiza audiencias de estados y registra hasta 30 cambios privados por chat. No crea mensajes públicos ni notifica el bloqueo a la otra persona. Los avisos se intercalan en el historial local visible y respetan el vaciado del usuario.
- Los mensajes directos bloqueados se rechazan por las reglas existentes. Los grupos compartidos siguen funcionando. Las reglas de Realtime Database rechazan nuevas invitaciones de llamada cuando las políticas de presencia indican bloqueo en cualquiera de los dos sentidos; retirar una invitación propia sigue permitido. Una invitación no autorizada no cancela las otras invitaciones de una llamada.
- Eliminar chat afecta al historial personal; archivar conserva el historial y cambia solo la cuenta actual. La casilla elimina únicamente las copias locales identificables de los mensajes cargados, no archivos de otras conversaciones ni la galería del teléfono. Las otras personas conservan sus mensajes.

## Fuentes oficiales consultadas

- [WhatsApp: bloquear y reportar](https://faq.whatsapp.com/1142481766359885/?cms_platform=android&locale=es_ES).
- [WhatsApp: información sobre reportar y bloquear](https://faq.whatsapp.com/414631957536067).
- [WhatsApp: añadir, editar o eliminar contactos](https://faq.whatsapp.com/5472030609512325/).
- [WhatsApp: administración privada de contactos](https://blog.whatsapp.com/making-it-easier-to-add-and-manage-contacts).
- [WhatsApp: crear grupos](https://faq.whatsapp.com/3242937609289432/?cms_platform=android&locale=es_LA).
- [WhatsApp: crear comunidades](https://faq.whatsapp.com/438859978317289/?cms_platform=iphone&locale=es_LA).
- [WhatsApp: eventos](https://faq.whatsapp.com/3313983622238973/?cms_platform=web).

Las referencias orientan el diseño y el comportamiento. Nexus conserva sus datos, capacidades, permisos y límites propios; se omiten opciones exclusivas de Meta.

## Verificación y pendientes

- 8 pruebas nuevas de agenda privada, alias, búsqueda, frecuentes, grupos, calendario, caracteres y errores. Con las regresiones previas: 56 pruebas automatizadas.
- 11 recorridos en Firestore y Realtime Database emulados: creación y recuperación de grupos/comunidades, contactos válidos, bloqueo conservando ajustes existentes y bloqueos simultáneos sin audiencias obsoletas, conservación, privacidad del historial, mensajes rechazados/permitidos, grupos compartidos, desbloqueo, sesión e invitaciones. Solo usuarios sintéticos.
- Chromium: 45 comprobaciones de estructura y desbordamiento: diez vistas en 320/390 px y claro/oscuro (40), eliminación bloqueada (1), y agenda/formulario anteriores en tablet y computadora (4). También se verifican guardado y rechazo de contactos, invitación, actualización, búsqueda, teclado, dobles pulsaciones, creación de grupos/comunidades, calendario y retirada selectiva de caché.
- Seis escenarios adicionales con el ChatWindow real y servicios simulados: bloqueo, desbloqueo, confirmación/cancelación y eliminación en cuatro anchos, más escritura en grupo y canal con otro contacto bloqueado.
- Regresión de los 15 recorridos de limpieza en ambos emuladores: bloqueos, conservación, reintentos, calendario y renovación durante esperas.
- Tipos, documentación y compilación de Hosting. Las pruebas no envían invitaciones ni avisos reales, no realizan llamadas reales y no crean contactos ni grupos en producción.

Avance de **esta comprobación visual en navegador**: celular 40/40 configuraciones de vistas (100%); tablet 2/2 vistas anteriores (100%); computadora 2/2 vistas anteriores (100%). No es un porcentaje de finalización de todos los controles del ZIP, de identidad gráfica ni del proyecto completo. Siguen pendientes los recorridos enumerados en la tabla y la validación física en Android, iPhone y tablet.
