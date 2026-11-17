# Revisión general y corrección del historial — v26.101.1

## Causa comprobada

La consulta descendente utilizada al abrir un chat devolvía `FAILED_PRECONDITION: no matching index found` en Firestore. Los índices existentes aparecían preparados, pero faltaban variantes que incluyen el desempate ascendente por documento. La consulta ascendente sí podía planificarse.

Se añadieron tres índices para historial, filtro de remitente y filtro de tipo, conservando los anteriores. Tras su creación se comprobaron siete planes de consulta utilizados por la aplicación: historial ascendente/descendente, filtros de remitente y tipo en ambos sentidos, y conservados en orden descendente. Todos responden correctamente. Se utilizó `explainOptions.analyze:false` sobre una ruta de diagnóstico: no se leyeron conversaciones ni se modificaron mensajes.

## Correcciones de carga

- Dos solicitudes simultáneas de mensajes anteriores comparten un bloqueo inmediato y abren una única página.
- Una página que falla conserva los mensajes ya cargados, termina la espera y detiene nuevas páginas hasta reintentar.
- Los errores al construir la consulta o procesar una respuesta asíncrona se convierten en un estado recuperable.
- Las respuestas tardías de otro chat o sesión se descartan; al cambiar de chat se vacía inmediatamente el historial anterior.
- Los resultados locales vencidos se excluyen de la salida. Se mantiene la protección de Firebase que deniega su lectura.

Las comprobaciones de paginación incluyen 175 mensajes sintéticos con marcas de tiempo repetidas, sin pérdidas ni duplicados. Un listener permanece abierto y recibe un nuevo mensaje después de una espera superior al margen temporal de la consulta.

## Alcance de la revisión

| Área | Verificación realizada |
| --- | --- |
| Historial y chats | Hook real, errores, reintentos, cambio de chat, caducidad, SDK en emulador y planes reales del servidor. |
| Ajustes | 25 pantallas, temas claro/oscuro y tres tamaños: 150 comprobaciones de contenido, ejecución y desbordamiento. |
| Voz y emojis | Grabar, pausar, reanudar, enviar bytes, liberar pistas del micrófono, seleccionar emoji y comprobar el fondo y borde inferior, en ambos temas y tres tamaños. |
| Contactos | Crear/editar, cuenta y preferencia persistentes, renovación del acceso, desactivar, recuperar desde Firestore simulado, invitado y cancelación: 37 casos. |
| Dashboard | Cuatro tamaños y seis recorridos de mantenimiento: confirmación, ejecución interrumpida, bloqueo vigente/caducado, desconexión, permisos y limpieza local. Limpieza real del código probada en emuladores. |
| Seguridad y datos | Perfiles, roles, propietario del dashboard, acceso de Assistant, bloqueo, canales, encuestas, caducidad y limpieza mediante suites de emuladores. |
| Otras funciones | Batería unitaria de multimedia, cámara, portapapeles, llamadas, notificaciones, voz, cuentas, contactos, referencias y país. |

Los servicios de las pruebas de interfaz son simulados. La cámara y el micrófono de Chromium usan dispositivos sintéticos. No se ejecutaron limpiezas ni escrituras en las cuentas o agendas reales del propietario. El propietario confirmó por separado un guardado real en Google Contacts desde Samsung Internet.

## Resultados por tamaño

- Celular a 390 px: 80/80 casos completados, 100 % de este conjunto.
- Tablet a 820 px: 73/73, 100 % de este conjunto.
- Computadora a 1440 px: 73/73, 100 % de este conjunto.
- Comprobación adicional del dashboard a 320 px: 1/1.

Son 227 casos de navegador. No representan el porcentaje de terminación global de Nexus ni una prueba física de Android, iPhone o Samsung Internet.

TypeScript, enlaces de documentación, 236 pruebas unitarias y compilación de Hosting comprobados. La auditoría de dependencias de producción no reportó vulnerabilidades conocidas en esta ejecución. Se incorporan las pruebas del historial y la suite actualizada de contactos a la validación de GitHub. La prueba de contactos del emulador se actualizó para enviar `expiresAt:0`, requerido por el esquema vigente; no se relajaron las reglas para aceptar el mensaje sintético antiguo.

## Reglas de Firebase

Se descargaron únicamente las reglas publicadas para compararlas con el repositorio: coinciden en Firestore y Realtime Database. No se modifican las reglas ni se amplían permisos para resolver el historial.

La batería de seguridad verifica rechazos a usuarios sin sesión, acceso ajeno, asignación de roles, cambios de campos sensibles, mensajes vencidos y operaciones fuera del ámbito del propietario. La [evaluación acotada de reglas](AUDITORIA-REGLAS-26.101.1.json) deja como mejora menor la validación individual del esquema de varios documentos de preferencias privadas del propio usuario; no se ha demostrado una escalada de permisos por esa vía. Su endurecimiento necesita inventariar los formatos existentes para no romper ajustes guardados.

El entorno Cloud heredaba variables de proxy en minúscula que interferían con las conexiones locales del emulador. Se identificó y retiró ese proxy únicamente de los procesos de prueba. La suite completa de invitados verificó sus quince casos; no se atribuye este fallo del arnés a producción. En conjunto se completaron dieciocho suites de emuladores, incluida la regresión nueva del historial.

## Pendiente de comprobar en equipos reales

Abrir el chat que mostró el aviso, carga lenta y recuperación de conexión; consumo de memoria; llamadas y selección de salida de audio; notificaciones y audio con pantalla bloqueada; biometría; y el consentimiento de Google Contacts en Chrome con dos cuentas. Ninguna batería automática garantiza la ausencia de todos los errores futuros.

## Fuentes oficiales

- [Firestore: índices](https://firebase.google.com/docs/firestore/query-data/indexing).
- [Firestore: varios filtros de rango](https://firebase.google.com/docs/firestore/query-data/multiple-range-fields).
- [Firestore: Query Explain](https://firebase.google.com/docs/firestore/query-data/explain-query-performance).
- [Firestore: paginación con cursores](https://firebase.google.com/docs/firestore/query-data/query-cursors).
- [Firestore: reglas y consultas](https://firebase.google.com/docs/firestore/security/rules-query).
- [Firestore: errores de listeners](https://firebase.google.com/docs/firestore/query-data/listen#handle_listen_errors).
