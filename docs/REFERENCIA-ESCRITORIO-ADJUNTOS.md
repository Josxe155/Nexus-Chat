# Nexus Web: referencias de escritorio

Actualización: 31/10/2026. Se utilizan las capturas aportadas por el propietario para Nexus Web de computadora. No se copian los contactos, chats ni archivos privados de las referencias.

## Separación de dispositivos

La nueva capa necesita una pantalla de al menos 1024 px, puntero fino y capacidad de hover. Se excluyen Android, iPad y tabletas identificables, incluido iPadOS con agente de escritorio. Los componentes móviles originales de emojis, contactos, adjuntos, cámara, evento y encuesta se conservan. Las pruebas cubren escritorio de 1366 px, teléfono de 390 px y tablet táctil de 1280 px. Esto no sustituye pruebas físicas en todos los dispositivos.

## Cambios

- Panel vacío de escritorio: fondo oscuro neutro, cuatro acciones con iconos sobre cápsulas grises y etiquetas debajo; sin tarjetas verdes.
- Emojis, GIF y stickers: categorías con iconos SVG, búsqueda, pestañas inferiores, emojis recientes, carga progresiva y acceso a crear stickers. Los recursos enviados guardan su historial local. El clic derecho sobre un GIF o sticker lo guarda o quita de destacados; no se inventa un historial del usuario.
- Revisión de archivos dentro del panel del chat: visor de foto y video, audio con controles, documentos sin vista previa, selección de miniaturas, comentarios por archivo, agregar archivos, descargar copia y enviar. Se conservan los límites existentes del almacenamiento (20 MB por archivo, hasta diez archivos por revisión).
- Edición de imágenes y stickers: acceso a recorte, giro, dibujo, texto y brillo usando el editor existente. Los stickers se preparan antes de enviarse.
- Contactos: selección múltiple de la cuenta propia y de los contactos de Nexus guardados; búsqueda y envío. No se publica la libreta privada ni se inventan números.
- Cámara de escritorio: captura real de foto, permiso de cámara sin solicitar micrófono, visor, botón circular y revisión antes de enviar. Las pistas de cámara se cierran al salir.
- Audio adjunto: auriculares amarillos y progreso sencillo. Las notas de voz conservan su forma de onda y la reproducción coordinada.
- Encuestas de escritorio: campos subrayados, emojis, orden de opciones, varios votos, ocultación de nombres en la interfaz, cierre programado y botón circular de envío. La opción de ocultar nombres no anonimiza las identidades de voto almacenadas en Firebase.
- Eventos de escritorio: nombre, descripción, emojis, inicio, finalización opcional y ubicación. Se envían como archivo de calendario ICS, no como un sistema nativo de eventos de WhatsApp. Se respeta la duración de mensajes temporales. Los grupos pueden incorporar un enlace de llamada de Nexus, sujeto a las restricciones reales de 23 horas para programar y 24 horas de vigencia.

## Límites que se conservan

Los GIFs y stickers del selector pertenecen al paquete Nexus. No se anuncia una integración de GIPHY ni de la tienda de WhatsApp. No se añaden botones ficticios de filtros, HD o herramientas no implementadas. Los permisos y restricciones del navegador siguen siendo necesarios. Los mensajes nuevos continúan sin cifrado de extremo a extremo.

GitHub y Firebase Hosting se actualizan por separado. No se suben claves de proveedores, datos de usuarios ni credenciales administrativas al repositorio.
