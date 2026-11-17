# Llamadas y segundo plano — v26.95.0

## Controles de audio

Las tres imágenes facilitadas para esta entrega son la referencia del estado de llamada de voz en celular: botón Altavoz, Video, Silenciar, Más, Compartir y Finalizar; panel de dos filas; salida activa blanca para altavoz o audífonos y oscura para el auricular del teléfono. Se ajustan posición del avatar, botón de minimizar, panel, menú y colores. El fondo conserva los dibujos de Nexus. Esta entrega no afirma identidad píxel por píxel con WhatsApp ni rediseña los demás menús de la aplicación.

El antiguo botón cambiaba `muted` del audio recibido. Se elimina esa asociación: elegir salida no modifica el volumen, el micrófono ni el silencio individual de otros participantes. Silenciar sigue controlando el micrófono. El menú presenta las salidas realmente enumeradas y autorizadas, ordenadas como Altavoz, Teléfono y nombre del accesorio. «Visor» es el nombre del dispositivo de la referencia, no un nombre que se imponga a todos los audífonos.

Si solo se exponen Altavoz y Teléfono, el botón alterna directamente. Con un accesorio u otras salidas, muestra el menú con la selección actual. Se admiten teclado, Escape, cierre exterior y retroceso de celular. Los errores se muestran durante tres segundos. Al fallar el cambio se intenta restaurar cada salida anterior; al retirar un accesorio se solicita la salida predeterminada del sistema. Se sincroniza también la selección de Dispositivos y la de participantes que se incorporen después.

El botón Compartir conserva su lugar en la llamada de voz. La documentación de WhatsApp exige videollamada para compartir pantalla. Si el navegador no ofrece captura de pantalla o falta activar video, se informa sin iniciar una captura ficticia. No se añaden opciones exclusivas de Meta.

### Límites de salida de audio

`setSinkId` solo permite seleccionar dispositivos que el navegador expone y autoriza. Algunos navegadores móviles no exponen el auricular interno, o no permiten cambiar ninguna salida. En ese caso Nexus mantiene el sonido y remite a los controles de audio del dispositivo mediante un aviso breve; no inventa un identificador de «Teléfono», no simula la ruta cambiando volumen y no muestra éxito sin completar la operación.

La interfaz y los recorridos de selección están implementados para las capacidades disponibles. El cambio físico entre altavoz, auricular interno y Bluetooth en Android/iPhone queda pendiente de comprobación real. Reproducir la apariencia de una aplicación nativa no concede sus permisos al navegador.

## Service worker y notificaciones

Se centraliza en `/sw.js` la presentación de notificaciones de mensajes, estados, grupos y llamadas que la pestaña recibe mientras sigue ejecutándose. La página conserva sus comprobaciones de permisos, preferencias, chats silenciados/restringidos y vista previa; entrega al worker solo el aviso ya preparado. `event.waitUntil` permite completar esa tarea breve. La confirmación por MessageChannel evita esperar indefinidamente si el worker no responde y espera la activación de una actualización del worker.

El worker valida el origen del cliente y la URL interna, limita los textos, ordena avisos y evita duplicados inmediatos. El clic enfoca la pestaña de origen y transmite la navegación existente. Se cierran los avisos al terminar la llamada y los de la pestaña al salir de la cuenta o desactivar notificaciones. No se añaden botones para aceptar llamadas desde una notificación ni nuevas pantallas sin referencia.

Las notas de voz continúan usando un elemento HTML de audio en la pestaña. Media Session aporta reproducción, pausa, búsqueda y cierre desde los controles que el sistema admita, y se libera al cerrar la sesión, terminar la nota o comenzar una llamada. Los metadatos del sistema muestran «Nota de voz» y «Nexus Chat», sin nombres, mensajes, fotos ni direcciones privadas. El sistema operativo decide si mantiene el audio y la captura de micrófono cuando la web queda en segundo plano.

No se instala ningún servidor, función de Firebase, tarea de pago ni plan Blaze. No cambian reglas, datos ni credenciales de Firebase.

### Lo que no hace un service worker

- No mantiene ejecutándose toda la página de manera continua, ni sustituye a una conexión activa de Firestore/Realtime Database.
- No puede capturar micrófono, reproducir audio ni mantener una llamada WebRTC por sí solo con la pestaña cerrada.
- Si el sistema suspende o descarta la pestaña, la recepción en tiempo real puede detenerse. El código de recuperación existente actúa cuando la página vuelve a ejecutarse; no se promete una llamada ininterrumpida con pantalla bloqueada.
- Con la pestaña cerrada, un evento Push necesita un envío externo. El receptor `push` existente se conserva, pero esta entrega no configura ni simula un emisor automático. Firebase Cloud Messaging puede utilizarse sin Blaze para mensajería, pero el envío automático por cada mensaje necesita un entorno de confianza; no se incluyen credenciales de envío en la web. Esa entrega automática permanece pendiente bajo la restricción de no usar servidor.
- En iPhone/iPad, las notificaciones Web Push requieren una web añadida a la pantalla de inicio y permiso solicitado mediante una acción del usuario. Esta entrega no añade instalación ni un nuevo menú sin referencia.

## Verificación

Ocho pruebas unitarias cubren clasificación de salidas, ausencia de dispositivos, cambio para todos los participantes, restauración ante fallos, regreso al dispositivo predeterminado y errores seguros. Siete pruebas del worker cubren entrega, duplicados, primer plano, validación de origen/destinos/caducidad, límites, limpieza y clic. Dos pruebas adicionales cubren controles y privacidad de Media Session y ausencia de soporte.

La vista real de llamada pasa cinco recorridos a 390, 820 y 1440 px, más el caso móvil sin API: menú/selección, cambio sin silenciar recepción, fallo y aviso transitorio, desconexión y separación del micrófono/compartir/sin desbordamiento. Las salidas físicas se simulan; el componente de llamada y el flujo de audio son reales.

La integración del worker y la API de notificaciones se prueba en Chromium real a esos tres tamaños: protocolo y aviso, deduplicación/cierre, limpieza y reproducción HTML con Media Session. Chromium sin ventana mantiene sus pestañas como visibles; se simula únicamente la visibilidad del cliente en el worker para recorrer la rama de segundo plano. Esto no verifica bloqueo de pantalla, Android/iPhone, recepción desde Firebase con la pestaña suspendida ni entrega Push remota. Las pruebas no escriben datos de producción.

Los porcentajes por tamaño describen los recorridos comprobados de esta entrega, no la finalización global del proyecto ni una equivalencia del 100% con WhatsApp.

## Fuentes oficiales

- [WhatsApp: llamadas](https://www.whatsapp.com/calling): funciones y referencias oficiales de llamadas y compartir pantalla.
- [WhatsApp: llamada de voz individual](https://faq.whatsapp.com/1153602608602452/?cms_platform=android&locale=es_LA).
- [WhatsApp: problemas de audio](https://faq.whatsapp.com/359678593009102/): distingue auricular, altavoz y auriculares.
- [WhatsApp: mejores llamadas en escritorio y celular](https://blog.whatsapp.com/better-calling-across-desktop-and-mobile).
- [MDN: seleccionar salida de audio](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId) y [autorización de salida](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/selectAudioOutput).
- [MDN: service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) y [Media Session](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API).
- [Firebase: recepción web](https://firebase.google.com/docs/cloud-messaging/web/receive-messages) y [arquitectura y entorno de envío](https://firebase.google.com/docs/cloud-messaging/fcm-architecture).
- [WebKit: Web Push en iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Algunos artículos del Centro de ayuda bloquearon su apertura automatizada; se consultaron sus resultados indexados oficiales y la página pública de llamadas. Las imágenes proporcionadas determinan la disposición concreta del selector, que esos artículos no especifican al detalle.

Resultado de la entrega: 167 pruebas unitarias aprobadas, TypeScript y compilación de Hosting correctos; 16 recorridos del componente de llamada y 12 de notificaciones/audio en Chromium. Por tamaño, pasaron 5/5 casos de llamada y 4/4 de notificaciones/audio, con las simulaciones y límites descritos arriba. La prueba adicional comprueba el botón móvil cuando falta `setSinkId`.
