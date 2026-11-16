# Bloqueo, Assistant y marca — v26.93.0

## Pantalla de cuenta bloqueada

La cuenta sancionada ve el logo oficial transparente, «Esta cuenta ha sido bloqueada», una explicación y Cerrar sesión. Respeta el tema claro u oscuro, tamaños pequeños y áreas seguras. Si falla el cierre, el error desaparece a los tres segundos y permite reintentarlo.

La pantalla se activa por un marcador existente en `deletedAccounts/{uid}` con `reason` igual a `reports`, `blocked` o `moderation`, o cuando Authentication devuelve explícitamente `auth/user-disabled` al acceder por correo o Google. No se activa por un reporte aislado, un contador de reportes ni el bloqueo personal de un contacto. En el acceso rechazado permite volver al formulario y limpia la contraseña escrita.

No se añade un mecanismo automático de sanciones ni un menú para suspender cuentas. El marcador conserva el bloqueo de acceso de Firestore que ya existía. No sustituye la deshabilitación de Authentication, la revocación de sesiones ni la señal de moderación de Realtime Database (`moderatedUsers/{uid}`); no se afirma que modificar un marcador de Firestore revoque todos los tokens o suspenda ambos servicios automáticamente.

La documentación oficial diferencia [reportar o bloquear un contacto](https://faq.whatsapp.com/414631957536067) de una [suspensión de cuenta](https://faq.whatsapp.com/465883178708358/). Se conserva esa diferencia con identidad Nexus, sin añadir opciones exclusivas de Meta ni un recurso de apelación que no esté implementado.

## Búsqueda y cambios del Assistant

- `search_messages`: busca dentro de un chat concreto por texto, autor o tipo; examina páginas de cincuenta documentos. Puede devolver una página sin coincidencias y un cursor para seguir buscando. Una página no equivale al total.
- `search_media`: localiza archivos del catálogo por nombre, chat, propietario o tipo. Omite claves y contenido binario.
- `prepare_message_change`: prepara o ejecuta la edición o eliminación de un mensaje de texto identificado por chat, ID y contenido actual. Rechaza mensajes caducados, ya eliminados, de una sola vista o cifrados sin acceso. Si hay cambios concurrentes, no los sobrescribe.

La edición conserva autor, fecha e identificadores, actualiza la vista previa cuando corresponde y crea los registros de `dashboardEdits` y `dashboardActions` en la misma transacción. Se corrigió la ruta genérica que intentaba editar sin el registro exigido por el permiso específico. La eliminación actúa solo sobre el documento indicado, registra auditoría y retira su vista previa si era la última; no elimina recursivamente archivos o subcolecciones.

Se mantienen las operaciones anteriores sobre avisos, contenido, reportes, mantenimiento y planificación de limpieza. Una petición de análisis o lectura no autoriza una escritura sugerida por el modelo. Las solicitudes de preparar, simular o no guardar conservan las propuestas locales; la limpieza manual exige su confirmación específica.

No se amplían permisos ni reglas. El acceso sigue ligado al UID y correo verificado del propietario registrado en Firebase y al rol habilitado. No se modifican cuentas de Authentication, perfiles, contraseñas, permisos, miembros, propiedad, reglas, código o despliegues. Las credenciales de invitados permanecen fuera de las consultas del Assistant.

## Lectura multimedia real

`inspect_media` recibe un ID del catálogo de Nexus, sin aceptar direcciones externas. Sin `includeContent` devuelve únicamente metadatos. Cuando se solicita analizar el contenido, lee los fragmentos, verifica y descifra el formato AES-GCM actual y adjunta el archivo al modelo. Las claves nunca se incluyen en el resultado de la herramienta ni se envían al modelo.

Admite las imágenes JPEG, PNG, WebP, HEIC y HEIF, audio WAV, MPEG/MP3, MP4, AAC, OGG, FLAC y WebM, video MP4, WebM, QuickTime y MPEG, y PDF. Se aplica un máximo acumulado de **8 MB de archivos por consulta**, para limitar memoria y tamaño de la petición en el navegador. El catálogo puede consultarse aunque el contenido no sea compatible. No se analizan archivos de una sola vista, caducados, incompletos, corruptos o protegidos con claves antiguas no disponibles. El análisis de formatos de documentos adicionales y archivos mayores queda pendiente.

El contenido se usa durante la petición. No se guarda una copia descifrada, claves o adjuntos binarios en el historial local del Assistant ni se crea una copia adicional en Firebase. El historial conserva las preguntas, respuestas y propuestas como antes; las acciones sobre datos conservan sus auditorías en Firebase. El análisis envía al servicio de IA configurado el archivo solicitado por el administrador: no se promete procesamiento exclusivamente local ni almacenamiento local de ese servicio externo.

Se comprueba el acceso administrativo antes de leer y durante la descarga. Se vuelve a consultar el catálogo al terminar para detectar cambios. Los metadatos no equivalen a haber visto el archivo; la instrucción distingue `metadata` de `content_attached`. Los textos y las instrucciones encontradas dentro de archivos se tratan como datos y no como autorización para escribir.

Fuentes oficiales: [entradas de archivos](https://ai.google.dev/gemini-api/docs/file-input-methods), [documentos](https://ai.google.dev/gemini-api/docs/document-processing), [video](https://ai.google.dev/gemini-api/docs/video-understanding), [Firestore Web SDK](https://firebase.google.com/docs/firestore/query-data/get-data).

## Logo e iconos

Se verificaron el logo, las seis variantes PNG y los cuatro tamaños de `public/favicon.ico`: canal alfa y esquinas transparentes. El favicon de la raíz del repositorio difería del publicado y ahora coincide con él. Se actualizaron los enlaces de caché de portada, dashboard y guía.

Las variantes de color de Ajustes usaban otro símbolo sobre un cuadrado redondeado. Ahora reutilizan los píxeles de la silueta oficial como fuente alfa mediante un filtro SVG; se conserva la selección de colores y se elimina el fondo cuadrado. El logo multicolor principal no se ha rediseñado. El refinamiento artístico de bordes y legibilidad a muy baja resolución sigue siendo una revisión distinta; no se promete una copia certificada píxel por píxel de la imagen original.

## Verificación

Se usaron únicamente identidades, cuentas y archivos sintéticos en los emuladores. Se probaron descifrado real, corrupción, cancelación, límites, archivos protegidos, búsquedas paginadas, edición y eliminación auditadas, concurrencia y comprobación de identidad. Las consultas reales al modelo usaron el logo público, un PDF, un video y un audio de prueba; no se enviaron datos de usuarios.

La matriz visual incluye bloqueo y logo, recuperación del cierre de sesión, búsqueda, propuesta y confirmación de edición, lectura de imagen con historial local, transparencia de variantes y acceso rechazado por Authentication. Se revisan tamaños de 390, 820 y 1440 píxeles en claro y oscuro. Son recorridos de Chromium, no pruebas en Android o iPhone físicos. Los porcentajes se limitan a esta matriz y no describen la finalización de Nexus Chat.

Resultado: 126 pruebas unitarias aprobadas y once casos de integración nuevos, además de las regresiones de edición por comandos, acciones y permisos. Se completaron catorce recorridos por tamaño de pantalla (siete casos en cada tema) y veinticuatro regresiones visuales del acceso de invitados. También se verificaron quince representaciones de logo e iconos, incluidos los ICO de raíz y public. Las consultas reales de imagen, PDF, video y audio usaron únicamente material público o sintético; el PDF se leyó correctamente, se identificó el rojo del video y se reconoció que el audio no contenía voz hablada.
