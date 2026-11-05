# Nexus Chat · contactos, grupos y llamadas

Revisión del 27 de octubre de 2026. Las siete imágenes se usaron como referencia de apartados y navegación. No se copiaron nombres, fotos, números, conversaciones ni archivos. Los ensayos de interfaz utilizan datos ficticios locales.

## Menús

El menú de conversación distingue contactos, grupos y canales. En grupos ofrece añadir miembros cuando se tiene permiso, información del grupo, búsqueda, selección de mensajes, silenciamiento, temporales según permisos, estilo, favoritos, listas, exportación, cerrar, vaciar, salir y preparar un reporte. En conversaciones individuales añade bloqueo o desbloqueo de la persona y eliminación personal del chat. Las operaciones de vaciar, borrar, bloquear y salir piden confirmación.

Se retiraron Ayuda de escritura, Video circular y Formato de texto del menú principal del chat. El formato mediante comandos y atajos se conserva. El video instantáneo se encuentra en Cámara, donde puede iniciarse y revisarse antes de enviarlo. Nexus AI conserva su propio acceso; no se añade un botón de escritura de IA dentro del menú general de conversación.

Seleccionar mensajes ahora entra en modo de selección con cero elementos. Las operaciones permanecen desactivadas hasta elegir uno, y se puede cancelar. Silenciar ofrece ocho horas, una semana o siempre; cuando ya está silenciado el menú permite desactivar el silencio. Los temporales ofrecen desactivados, 24 horas, 7 días y 90 días.

## Información de contactos y grupos

- Foto, nombre y usuario de contactos. En grupos: foto, nombre y «Grupo · número de miembros», acciones de llamada, video, añadir y buscar.
- Descripción del grupo y edición autorizada de nombre, foto y descripción. La foto admite JPG, PNG y WebP de hasta 5 MB, almacenados mediante el flujo privado de archivos de Nexus.
- Archivos, enlaces y documentos del historial cargado, con miniaturas disponibles, descargas y destacados de esa conversación. No se anuncia un conteo de todo el historial si solo hay una parte cargada.
- Notificaciones, estilo, favoritos, listas, exportación y acciones de limpieza o salida. La exportación y el vaciado respetan el historial personal.
- Todos los miembros actuales, sus etiquetas y la identificación «Admin. del grupo». Búsqueda de miembros y edición de la etiqueta propia.
- Fecha de creación y creador cuando están registrados. Los grupos antiguos sin creador no reciben un nombre inventado.
- Una sección de cifrado y seguridad explica los controles reales. No afirma E2EE ni muestra un código de verificación ficticio.

Las fichas tienen encabezado fijo y desplazamiento interno. Los nombres, archivos y enlaces largos se ajustan al ancho. Los formularios de grupo y contacto se limitan al tamaño visible y permiten desplazamiento en móvil y tablet.

## Contactos

Se añadió un editor de contactos de Nexus desde Contactos, desde la ficha de una persona y desde Añadir miembros. Permite buscar personas registradas, guardar nombre y apellido privados y quitar personas de la lista personal. No modifica el perfil de la otra cuenta ni simula una sincronización con la agenda del teléfono. El nombre completo se limita para conservar la compatibilidad de las respuestas citadas.

Los nombres privados se aplican a la lista y los chats de esa cuenta. Añadir miembros utiliza los contactos guardados en Nexus. Las personas siguen pudiendo encontrarse en el directorio de usuarios registrados.

## Administración e invitaciones

- Los administradores pueden añadir o retirar miembros, designar administradores, elegir si los miembros editan la información y si pueden añadir personas, y limitar el envío de mensajes a administradores.
- Al añadir directamente, un administrador puede compartir solo mensajes nuevos o hasta 25, 50, 75 o 100 mensajes anteriores a los que él tenga acceso. Un miembro autorizado a añadir personas comparte únicamente mensajes nuevos y añade hasta diez personas por operación. Se conserva el límite de 100 integrantes del grupo.
- Las invitaciones tienen identificadores seguros, duran siete días y pueden restablecerse. El enlace anterior deja de aceptar solicitudes. Una persona debe iniciar sesión y pedir acceso; no puede leer el grupo antes de ser aprobada.
- Los enlaces siempre requieren aprobación. Se eligió esta política fija en lugar de ofrecer un interruptor que admita entradas sin supervisión. Los administradores pueden aprobar o rechazar solicitudes. Al aprobar no se concede historial anterior.
- La invitación por correo prepara un borrador mediante la aplicación de correo del usuario. No envía mensajes automáticamente; copiar el enlace ofrece otra forma de compartirlo.
- Crear un grupo similar permite seleccionar miembros y un nombre. No copia mensajes, archivos, administradores ni el historial del grupo original.
- Salir elimina el acceso al grupo. Si sale el único administrador y quedan miembros, debe elegir un sucesor. Si era el último miembro se elimina el documento del grupo. Se registran altas, bajas y cambios de administradores realizados mediante el nuevo flujo; no se reconstruye un historial anterior inexistente.

Las reglas de Firestore hacen cumplir los permisos, protegen las solicitudes y verifican que los registros de cambios correspondan a una modificación real. El registro no debe describirse como una auditoría forense completa de clientes antiguos o de acciones administrativas realizadas directamente fuera de la aplicación.

## Sonidos y correcciones de llamada

Se generaron tres sonidos originales: espera al llamar, conexión y finalización. La espera se repite hasta establecer la conexión o terminar la llamada. Al colgar se detiene la espera y suena una sola finalización; no se reproducen estos sonidos por completar una transferencia de archivos. Se respetan los ajustes de sonido y volumen, y el altavoz seleccionado cuando el navegador lo permite.

La conexión se registra cuando el navegador establece el enlace, en lugar de marcarla conectada al entrar en la sala. El temporizador de 60 segundos también termina una llamada que tiene otro participante en señalización pero nunca consigue conectarse. Se evita que esa situación deje el tono de espera indefinidamente. El historial distingue una conexión fallida de una llamada que nadie respondió. Los tres sonidos se precargan en el servicio de la web para poder finalizar con sonido aunque se pierda la conexión, cuando la caché pudo prepararse.

El navegador puede bloquear reproducción automática, cámara o micrófono según permisos y conexión segura. Estas pruebas comprueban los eventos y la parada de los sonidos con medios simulados, sin llamar a personas reales. No certifican la calidad de audio en todos los teléfonos físicos.

## Alternativas y opciones omitidas

Reportar prepara un archivo JSON descargable con motivo y, si el usuario lo elige, los últimos veinte mensajes cargados. No adjunta archivos, credenciales ni direcciones de descarga y no lo envía automáticamente. Es una alternativa explícita mientras Nexus no tenga un servicio de moderación con atención real.

No se añadieron «Restringir chat», «Chat limitado» o «Mensajes conservados» como si protegieran el contenido sin su implementación completa. Tampoco se fingieron cifrado de extremo a extremo, bloqueo de capturas o protección contra copias. El estado general del proyecto permanece en COMPARACION-WHATSAPP.md.

## Verificación y publicación

- 21 comprobaciones nuevas de interfaz en 390, 768 y 1366 px: menús, fichas, proporciones, seguridad, selección, permisos, invitación por correo, aprobación, cambios de miembros, grupo similar, reporte, contacto privado y sonidos.
- Seis comprobaciones adicionales de solicitud de acceso, apertura del grupo aprobado y cierre de URL, y de una llamada con participante en señalización que debe expirar y detener el sonido una sola vez.
- Regresión: 40 comprobaciones de móvil y tablet, 25 de escritorio y 23 de mensajería, sin errores del navegador en los informes.
- 164 comprobaciones de reglas en emuladores: 94 existentes, 23 de mensajería y 47 nuevas de grupos e invitaciones. Incluyen denegaciones de acceso y operaciones no autorizadas; los avisos de permiso denegado esperados no representan fallos.
- Comprobación de tipos y compilación de producción. Se conserva el aviso sobre el tamaño del JavaScript principal.
- Dos comprobaciones adicionales verifican los WAV originales y la precarga de los tres sonidos en el servicio de la web.
- Reglas de Firestore publicadas en el proyecto autorizado nexus-chat-56d9d y verificadas por contenido. Realtime Database e índices anteriores se conservan; el índice de estados sigue READY. Se guardó una copia previa en el área de trabajo privada.

No se publicó Firebase Hosting en esta entrega. Las pruebas de interfaz y emuladores no añadieron conversaciones de ejemplo al proyecto real ni contactaron a otras personas. El ZIP excluye las claves privadas y los archivos temporales de prueba.
