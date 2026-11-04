> Estado vigente, 31/10/2026: se retiró el cifrado de extremo a extremo para mensajes y archivos nuevos por decisión del propietario. No se generan claves ni se requieren para conversar. Las referencias posteriores al cifrado automático describen versiones anteriores. Se conserva únicamente la lectura y la importación de copias del historial anterior, sin borrar datos. Consulta CIFRADO-Y-LLAMADAS.md.

# Estado de la entrega sin servidor propio

## Integrado

- Acceso y registro directo con Firebase Authentication; verificación por correo y asignación transaccional de un número interno de Nexus.
- Interfaz adaptable, menús diferenciados para móvil y escritorio, copia y pegado, contactos, conversaciones, grupos, canales, estados y preferencias existentes.
- Mensajes y permisos en Firestore; presencia y señalización de llamadas WebRTC en Realtime Database. Metered proporciona las conexiones de retransmisión.
- Transferencia de archivos en fragmentos cifrados de 1 MB, hasta 20 MB por archivo; el reenvío crea una copia independiente.
- Nexus AI solicita directamente Groq y usa OpenRouter gratuito como alternativa. Un fallo de ambos presenta un mensaje neutral de servicio ocupado.
- Avisos locales con permiso del navegador mientras la web está abierta. Reportes guardados en Firebase para revisión manual.

## Fuera de esta versión

No se promete equivalencia total con WhatsApp, cifrado de extremo a extremo auditado, llamadas a teléfonos reales, verificación SMS, moderación administrativa automática, eliminación programada de invitados, notificaciones fiables con la web cerrada ni archivos de 2 GB. Las cuotas gratuitas de Firebase y de los proveedores siguen aplicándose.

Las claves compartidas de los tres proveedores se incluyen en el navegador con autorización expresa; no son secretos en esta arquitectura. Ninguna credencial administrativa se incluye en la entrega.

Los cinco adjuntos conservados del servidor anterior permanecen solo en el equipo por decisión del propietario y no se incluyen en el ZIP ni se trasladan a Firebase. Para volver a compartirlos deben cargarse de nuevo.

## Revisión de interacción móvil y audio

Se retiraron la cámara del encabezado móvil y los tres puntos de las filas de chats. Las acciones se abren con clic derecho en escritorio o pulsación larga en móvil. Los grupos ofrecen Salir del grupo; los contactos ofrecen Bloquear y Eliminar chat. Los submenús se ajustan a la pantalla.

Las notas de voz se graban al pulsar una vez el micrófono, con pausa, reanudación, escucha previa, descarte y envío. El reproductor usa forma de onda, duración, búsqueda y velocidades 1x, 1.5x y 2x. Los permisos del navegador se solicitan solo cuando se usa el micrófono o la cámara. Las llamadas y la grabación en móviles necesitan abrir la dirección segura que proporciona Firebase Hosting.

El propietario autorizó reiniciar Firestore: se borraron sus datos manteniendo reglas e índices. Authentication se conservó; al entrar se reconstruyen los perfiles y números internos, y se pueden crear nuevas conversaciones. Los archivos antiguos del equipo no se restauraron.

## Publicación

Publicado en Firebase Hosting el 28 de octubre de 2026: https://nexus-chat-nc.web.app. Hosting proporciona la conexión segura necesaria para cámara, micrófono y archivos en móviles. No se añadió un servidor propio.

La dirección principal es https://nexus-chat-nc.web.app. Las llamadas muestran el nombre del contacto; el tiempo comienza al establecer la conexión. Incluyen pantalla móvil completa, vista previa de video, confirmación para activar cámara, cambio de cámara, silencio, reacciones, minimizar y añadir participantes. Se corrigió la salida prematura al aceptar una llamada. En navegadores móviles, compartir pantalla o elegir una salida física de sonido puede no estar disponible; se utiliza la salida del sistema y se ofrece compartir el enlace.

## Historial de llamadas y visor de archivos

Las llamadas consecutivas del mismo contacto, tipo, dirección y día se agrupan con un contador. La ficha muestra cada intento, hora y resultado; las llamadas nuevas guardan el inicio real de conexión para calcular su duración. El botón lateral devuelve una llamada del mismo tipo. La ficha permite abrir el chat, información, voz o video, quitar solo esos registros, reportar y bloquear. No se añadieron personas ni historiales de las referencias.

Las imágenes, videos y documentos se presentan mediante tarjetas sin direcciones visibles. El visor compartido entre chat, información y biblioteca permite ampliar, ajustar, navegar, descargar y copiar imágenes donde el navegador lo permite. Incluye reproducción de video, PDF cuando el navegador lo admite y texto; los formatos sin previsualización ofrecen guardar el archivo. En móvil admite doble toque, pellizco y desplazamiento entre imágenes. Los errores de carga se muestran con reintento.

El reproductor de voz usa onda real, avance accesible, tiempo y velocidades 1x, 1.5x y 2x. Al reproducir otro audio se pausa el anterior. Se conservaron las funciones de grabar, pausar, reanudar, escuchar, descartar y enviar. Las pruebas usan datos sintéticos locales, nunca contactos de las capturas.

## Revisión para producción: 28 de octubre de 2026

Firestore y Realtime Database usan reglas permanentes con acceso autenticado, restricciones por propietario o participante y denegación de rutas no autorizadas. No existe una fecha global de cierre a los 30 días. La caducidad de estados, invitaciones y llamadas se conserva como parte de cada función; no caduca la base. Se reforzó RTDB para denegar cuentas de correo pendientes de verificación y cuentas retiradas, incluidos los fragmentos de archivos. No se borraron datos.

La recuperación tiene un formulario independiente: solicita a Firebase Authentication el correo de cambio de contraseña en español y vuelve al dominio autorizado de Nexus. Se comprobó con Authentication Emulator el envío, el cambio efectivo de contraseña y el rechazo al reutilizar el enlace. La entrega real a la bandeja de cada persona depende de Firebase y de su proveedor de correo; el ensayo no envió mensajes a personas reales. Google mantiene su acceso habitual; invitados no disponen de recuperación por correo.

El favicon y el logotipo de inicio se sustituyeron por un SVG propio. Se quitó la frase de la pantalla de carga. A partir de 40 conversaciones se muestra el porcentaje de documentos procesados y el total; para menos se conserva un indicador sin porcentaje. No se simula progreso con un temporizador. La carga inicial espera también los chats, contactos y preferencias personales para evitar una lista aparentemente vacía durante la preparación.

Se revisaron pantallas de 360, 390, 768, 820, 1024 y 1366 píxeles en recorridos de interfaz: recuperación, chats, ajustes, listas, privacidad, almacenamiento, estados, IA, llamadas, canales y archivados. Se verificaron las paletas claras y oscuras y la ausencia de desbordamientos en esos recorridos. Esto no equivale a garantizar compatibilidad absoluta con todos los navegadores y dispositivos.

## Revisión general adicional

Se corrigieron las descargas simultáneas duplicadas: varias vistas que necesitan el mismo archivo comparten una sola solicitud por cuenta. Las imágenes resueltas se vinculan a la dirección y a la cuenta correctas, evitando mostrar una foto antigua al cambiar su referencia. Una descarga que termina después de cambiar o cerrar sesión no vuelve a introducir su URL en la caché.

Las descargas validan el esquema de la dirección y rechazan direcciones ejecutables, archivos locales y conexiones HTTP externas. Los archivos externos compatibles se abren sin sustituir la pestaña de Nexus si el navegador no admite descargarlos directamente.

Pasaron 25 comprobaciones de escritorio y 9 de distribución, menús y manejo de archivos. Incluyen pantallas de 360 a 1366 píxeles, nombres largos, contadores extensos, pegado y copiado de imágenes, listas, mensajes temporales, llamadas programadas y biblioteca. Se verificó que seis solicitudes simultáneas de la misma imagen generan una sola descarga y que cambiar la referencia elimina inmediatamente la imagen anterior. No se modificaron las reglas de producción ni los datos de las cuentas durante esta revisión.

## Estados móviles e instalación

La barra de estados aparece encima de la búsqueda solo en la lista móvil de Chats y vuelve a verse al regresar al inicio de su desplazamiento. Comparte los mismos datos y preferencias con Novedades: agrupa por persona, ordena las actualizaciones, dibuja segmentos para cada estado, registra vistos y mantiene los ocultos fuera de la lista principal. La tarjeta Ocultos se muestra únicamente cuando existen actualizaciones ocultas vigentes y abre una pantalla propia para verlas o restaurarlas. El escritorio conserva su lista de estados.

El creador móvil usa una hoja con Texto, Música, Diseño, Audio y Fotos y videos; incluye cámara, selección de archivos del dispositivo y recientes locales por cuenta. Los archivos elegidos se previsualizan y pueden llevar comentario antes de publicarse. El audio permite grabar, pausar, escuchar y pasar a la previsualización. El límite es de 20 MB y los estados duran 24 horas. El índice owner/expiresAt permite consultar los estados propios vigentes sin cargar todo el historial caducado. Las cargas fallidas se limpian y el envío está protegido contra pulsaciones repetidas.

Los recientes muestran archivos seleccionados dentro de Nexus, no acceso automático a toda la galería del teléfono. Se conservan hasta 18 elementos, 40 MB y 7 días en el dispositivo por cuenta. Música permite seleccionar un archivo de audio propio; no ofrece un catálogo comercial. La opción de imágenes generadas por IA de la referencia se sustituyó por Fotos y videos; no se añadió un botón sin un generador implementado.

La instalación tiene acceso desde Ajustes, usa la solicitud nativa cuando el navegador la proporciona y ofrece instrucciones cuando no. Se añadieron iconos PNG de 180, 192 y 512 píxeles, icono de Apple, ámbito propio, accesos rápidos a Novedades y estado de texto, márgenes seguros para pantalla completa y caché del armazón público. Mensajes, estados y llamadas siguen requiriendo internet; instalar la web no añade permisos nativos ni notificaciones fiables con la aplicación cerrada.

Pasaron 12 comprobaciones específicas de estados e instalación y 44 de regresión móvil y tablet. Se revisaron ocultos, lectura, búsqueda, publicación de texto y audio, recientes, pantallas reducidas, contraste, desplazamiento y separación del escritorio. El índice nuevo se verificó en estado READY antes de publicar.

## Corrección de actualización, sonido de entrada y controles

Se comprobó que la dirección principal respondía con Cache-Control: max-age=3600 aunque el archivo /index.html tuviera otra cabecera. Se corrigieron la raíz, release.json y sw.js para evitar esa retención de una hora. El worker v8 obtiene las navegaciones y los recursos públicos sin nombre versionado desde la red, conservando una copia para cuando no haya conexión. Los paquetes con nombre hash mantienen su caché eficiente.

Cada compilación añade un identificador público de versión. La página lo comprueba al abrir, al volver a ella y periódicamente si está visible. Una versión nueva se aplica cuando no hay llamadas, grabaciones, ventanas de edición ni texto pendiente. No se elimina localStorage, IndexedDB ni la sesión para actualizar. Los clientes de una versión antigua que aún no tenga este mecanismo necesitan recargar una vez para incorporarlo.

Los mensajes, estados y reacciones anteriores al inicio de la sesión de avisos no reproducen sonidos al incorporarse desde la caché o el historial. Se conservan los sonidos de los mensajes nuevos y de las llamadas reales. El controlador de mensajes espera también a que estén cargadas las preferencias personales.

Se normalizaron las áreas de los botones de cierre, su centrado y los indicadores numéricos de chats, archivados y barra lateral. Pasaron 12 comprobaciones que incluyen distribución de contadores en cinco tamaños, cierre centrado, historial silencioso, notificación nueva y actualización aplazada hasta terminar una llamada.

## Ajustes de gestos, perfiles y retroceso móvil (28 de octubre de 2026)
- Vigente: se retiran la barra y el gesto de estados dentro de Chats. Los estados se consultan en Novedades; escritorio conserva su sección independiente.
- Corregido el respaldo de fotos en StatusRing: un contacto sin foto muestra el avatar gris, nunca la foto del usuario conectado. Las fotos públicas de grupo también se conservan en sus paneles.
- Vista rápida del perfil desde la foto de la lista: imagen ampliable, nombre y acciones reales de mensaje, voz, video e información de contacto/grupo. En la cabecera del chat, foto y nombre abren directamente la información. El indicador de mensajes temporales se limita a la lista.
- Atrás del navegador/sistema en móvil vuelve dentro de la interfaz: primero cierra superposiciones, luego subpáginas de configuración y finalmente el chat. Las pantallas raíz permiten salir normalmente. No cambia las cuentas ni sus datos.
- Quitado el resaltado táctil azul; se conserva el foco visible para accesibilidad con teclado.
- Retirados Traducir, Elegir otro emoji y Pregúntale a Nexus AI del menú contextual de mensajes móvil. No se ha añadido todavía una nueva barra superior de acciones.
- Eliminados botones HTML anidados de las miniaturas de información de contacto.
- Verificación en navegador con datos ficticios: 17 comprobaciones aprobadas, sin errores de ejecución. Incluye estados ocultos, ampliación de foto, información de grupos, mensaje al contacto correcto, retroceso en varios niveles y separación de escritorio/móvil. El gesto real y el botón físico Atrás deben contrastarse también en el teléfono del usuario; la prueba automatizada utiliza eventos táctiles y el historial del navegador.


## Revisión con referencias de WhatsApp y consumo de Firestore
- Diagnóstico confirmado el 28 de octubre de 2026: Firestore devuelve RESOURCE_EXHAUSTED (Quota exceeded) incluso en lectura administrativa. La recuperación depende de que el servicio vuelva a admitir operaciones; no se borra información ni se abre la base. La lectura administrativa final ya respondió correctamente y comprobó nueve perfiles sin anomalías.
- Corregido el tratamiento del fallo de perfil: aviso específico, reintento sin borrar datos locales y errores de carga de preferencias visibles en lugar de dejar el inicio esperando indefinidamente.
- Eliminadas las dos escrituras por minuto de actividad y la escritura de presencia de inicio en Firestore. Invitados: actividad como máximo cada seis horas. Presencia: Realtime Database. Perfiles ya migrados: sin reescritura completa de privacidad al entrar.
- Estados: consultas estables con caducidad comprobada localmente, sin reconstrucción cada 30 segundos.
- Flujo de creación de grupo en dos pasos, con selección, búsqueda, foto opcional y navegación Atrás.
- Silenciar: 8 horas, 1 semana, Siempre, con confirmación.
- Encuestas: hasta 12 opciones separadas, selección única o múltiple, Ver votos y retirada del voto.
- Mensajes fijados: diálogo 24 horas/7 días/30 días, máximo tres validado en reglas, permisos de grupo y lectura de fijados fuera de la página actual de historial.
- Corregida la generación de números internos para los 245 países de la biblioteca, incluidos los que no tienen ejemplo móvil y las regiones con números cortos. No son números celulares verificados.
- Verificaciones: 220 comprobaciones de reglas locales; 12 de los nuevos flujos de interfaz; 25 de escritorio; 17 de gestos, perfiles y Atrás; 3 del inicio ante cuota; 245 países. Las pruebas de interfaz y reglas usan datos ficticios y no consumen la base de producción.
- Comparación detallada, fuentes consultadas y límites pendientes: REVISION-REFERENCIAS-WHATSAPP.md. No se afirma equivalencia del 99,9 % ni cifrado de extremo a extremo de los textos de Firestore.

## Revisión integral adicional — 29 de octubre de 2026
- Historial aislado por usuario, conversación y fecha de acceso: al cambiar de chat no se muestra durante un instante el historial anterior. Los errores del historial tienen explicación y botón de reintento.
- Fotos e información privadas aisladas por sesión y versión de privacidad. Cambiar el perfil de una persona no vuelve a suscribir todo el directorio. Las fotos de la cuenta anterior no permanecen visibles mientras llega una respuesta nueva.
- Guardar preferencias ajenas a la audiencia de estados ya no reescribe todos los estados del usuario.
- Grabador protegido frente a doble pulsación de envío y llamadas repetidas a detener; permite reintentar un envío fallido sin duplicarlo. Atrás móvil cierra el grabador y mantiene abierto el chat.
- Navegación Atrás añadida a reenvío, información y eliminación de mensajes; al submenú Más del chat; a los pasos de creación de canales y a acceso, registro y recuperación de cuenta.
- Los mensajes fijados eliminados o vencidos ya no ocupan el límite de tres fijados. Se retiran también cuando desaparece su documento.
- Ajustadas las opciones de fijado según permisos del grupo o canal y textos de contacto en español. Los mensajes de permisos de cámara y micrófono evitan detalles internos innecesarios.
- Comprobaciones de esta revisión: ajustes en cuatro tamaños (32), flujos de referencia (12), escritorio (25), gestos y perfiles móviles (17), grupos y contactos (21), llamadas WebRTC locales (10), archivos y geometría de filas (9), recuperación de contraseña (12) y aislamiento de historial, privacidad y envío de audio (5). Son 143 comprobaciones con datos simulados; no equivalen a probar cada teléfono ni cada condición de red real.
- La comprobación administrativa del 29 de octubre leyó nueve perfiles: sin perfiles públicos inválidos ni documentos privados o identidades ausentes. No se borró información. Las reglas no se abrieron ni se modificaron en esta revisión.

## Revisión ampliada con referencias oficiales — 29 de octubre de 2026

Se contrastaron los recorridos con la documentación oficial de mensajería, notas de voz, búsqueda, reacciones y destacados de WhatsApp. Se conserva Nexus Chat como identidad del producto y se mantienen los menús diferenciados de escritorio y móvil definidos por las capturas del propietario. No se importan datos de las capturas ni se afirma una equivalencia exacta con las aplicaciones nativas.

| Apartado | Cambios comprobados |
| --- | --- |
| Notas de voz | Reproductor persistente al cambiar de conversación, pausa y continuación, posición recordada durante la sesión, velocidades 1x/1,5x/2x y reproducción de notas consecutivas disponibles. Barra para volver al chat, controlar el avance y cerrar el audio. |
| Privacidad del reproductor | Se detiene al cambiar de cuenta, perder acceso al chat, ocultar el mensaje o llegar a su caducidad. No se detiene por la simple paginación del historial. Llamadas, grabaciones y videos interrumpen la nota para evitar sonidos superpuestos. |
| Actualizaciones de la web | Se aplaza la recarga automática mientras permanezca abierto el reproductor de voz. El cálculo de ondas de audio utiliza decodificación sin salida de sonido. |
| Visor de imágenes y documentos | Miniaturas para navegar, pie de foto, selección del archivo, zoom, gestos, teclado, descarga, copia de imágenes y documento de texto. Se restablece el zoom al cambiar de archivo; las teclas del visor no interceptan los controles del video. Mejora del botón de cierre en celular y tablet. |
| Estado del visor | Recursos y texto de documentos asociados al usuario y archivo actuales para evitar reutilizar una vista anterior. Reintento para archivos que no pudieron abrirse. Se rechazan direcciones con credenciales incrustadas. |
| Reacciones | Resumen de emojis distintos, recuento, panel de participantes, filtro por emoji y retirada de la reacción propia. |
| Búsqueda | Acceso explícito a encuestas, stickers y contactos; el filtro de video incluye videos circulares. Se mantienen palabras, fecha y acceso al historial anterior, indicando el alcance cargado. |
| Pulsación prolongada | Corregida la selección que podía deshacerse con el clic generado al levantar el dedo. Desplazarse verticalmente no selecciona un mensaje. |
| Destacados | Actualización en tiempo real al editar o eliminar el mensaje. Se oculta su contenido cuando se retira el acceso al chat; se mantienen separados de los mensajes fijados. |
| Cambios de cuenta | Aislamiento inmediato de preferencias, destacados, últimos mensajes y pendientes de envío; las respuestas de suscripciones anteriores se ignoran. Una conversación vacía no conserva el último mensaje de una respuesta anterior. |
| Grabación circular | Protección de las pulsaciones repetidas al iniciar o enviar, cierre con Atrás y mensajes de permisos adaptados a la interfaz. |

Validación ampliada: 176 casos funcionales y de interfaz con datos ficticios, incluidas notas de audio reales generadas para las pruebas y llamadas WebRTC locales. Se recorrieron menús, contactos, grupos, filtros, archivos, ajustes, estados, canales, comunidades, recuperación y navegación en anchos de celular, tablet y escritorio. No se crearon cuentas reales ni se enviaron correos durante estas pruebas. La comprobación de tipos y la compilación de producción se registran por separado.

Las reglas y la estructura de Firestore y Realtime Database no se abren ni se sustituyen en esta entrega. Las mejoras reutilizan los servicios actuales, sin incorporar un servidor propio ni un proveedor de pago.

### Alcance y límites que permanecen

- Reproducción continua mientras la web o aplicación instalada siga ejecutándose. La suspensión del navegador o las restricciones del sistema móvil pueden detenerla; no se garantiza reproducción con la aplicación cerrada.
- La búsqueda distingue el historial cargado y permite cargar mensajes anteriores. No se anuncia una búsqueda instantánea de todo el contenido de una base grande.
- No se afirma cifrado de extremo a extremo de los textos ni equivalencia con el protocolo de WhatsApp. Tampoco se garantiza impedir capturas de pantalla ni recibir llamadas con la web cerrada.
- Se conservan los límites de tamaño de archivo, miembros y participantes existentes y documentados. No se agregan controles que simulen pagos, verificación SMS, paquetes propietarios, acceso ilimitado a la galería ni servicios internos de WhatsApp.
- Las pruebas automáticas no garantizan ausencia absoluta de errores ni reemplazan una llamada entre teléfonos reales en redes distintas.

### Referencias consultadas en esta revisión

- [Funciones de mensajería](https://www.whatsapp.com/messaging?lang=en).
- [Pausa, previsualización, reproducción fuera del chat y recuerdo de posición de voz](https://blog.whatsapp.com/making-voice-messages-better).
- [Reproducción consecutiva y velocidades de notas de voz](https://faq.whatsapp.com/1165411581043811/?cms_platform=web).
- [Búsqueda por palabras, tipos y fecha](https://faq.whatsapp.com/1131773267485499/?cms_platform=web).
- [Reacciones a mensajes](https://faq.whatsapp.com/424198503229937/?cms_platform=web).
- [Mensajes destacados en Web](https://faq.whatsapp.com/1221996151866148/?cms_platform=web&locale=en_US).

## Renovación visual y grabación — 29 de octubre de 2026
- Identidad vectorial nueva: favicon ICO con tres tamaños, icono SVG de carga e iconos PNG de instalación. La pantalla inicial y la pantalla React usan la misma versión del icono.
- Grabación ajustada a las capturas: controles alineados a la derecha en escritorio, onda temporal que avanza de derecha a izquierda, pausa con preescucha y micrófono para reanudar; se elimina el botón cuadrado de detener y el texto visible de envío. La preescucha incluye desplazamiento por el audio. Gesto táctil hacia la izquierda sobre la onda para descartar.
- Estilo del chat separado en estilos, burbuja y fondo, con tarjetas de ejemplo y vista previa de escritorio. Retirados los controles de forma de burbuja y forma/color del micrófono de este apartado.
- Fuente local Noto Emoji bajo licencia abierta, servida desde Firebase, para mejorar la cobertura de emojis en navegadores compatibles. Se conserva la licencia; los navegadores antiguos pueden seguir dependiendo de sus fuentes del sistema. Se retiran del selector los archivos gráficos que fallen al cargar.
- Cierre al tocar fuera de emojis y menús de adjuntos/chat; se conserva el cierre exterior del visor rápido de perfiles y se añade a los formularios de encuesta, evento y ubicación cuando no están enviando.
- Validación: 8 recorridos de grabación/interacciones, 25 de escritorio y adjuntos, 32 de ajustes y 13 de fuente, cierre exterior, formularios y decodificación de GIFs, stickers y fondos. Total: 78 casos. No se enviaron mensajes reales en esas pruebas.
- Referencias: https://faq.whatsapp.com/657157755756612/?cms_platform=web y https://blog.whatsapp.com/chat-themes-to-reflect-your-style . Fuente y licencia: https://github.com/googlefonts/noto-emoji .

## Cifrado y sala Mumble — 29 de octubre de 2026

Se incorporó cifrado de extremo a extremo activable para mensajes y adjuntos nuevos en conversaciones privadas y grupos. Requiere claves de cada participante y una frase de recuperación; no migra mensajes antiguos ni cubre canales, estados o metadatos. Usa Web Crypto, AES-GCM, ECDH/HKDF y firmas ECDSA. Las reglas rechazan texto sin cifrar tras la activación. No es un protocolo auditado ni ofrece secreto hacia adelante. Instrucciones y límites completos: [CIFRADO-Y-MUMBLE.md](CIFRADO-Y-MUMBLE.md).

El conector Node.js de voz es un servicio opcional separado para Hidencloud, solicitado posteriormente. No forma parte de Firebase Hosting. La conexión de prueba a jacob.hidencloud.com:24684, canal Root, fue satisfactoria fijando la huella del certificado observado. La sala del navegador necesita la URL WebSocket pública del conector desplegado; no se ha inventado esa dirección ni publicado un proceso Node sin acceso al alojamiento.


## Actualización: cifrado automático y solo web
La guía vigente para claves automáticas, recuperación y conexión de voz es CIFRADO-Y-MUMBLE.md. Se retiraron los flujos de instalación y el manifiesto instalable. La web conserva adaptación a dispositivos y notificaciones. Voz requiere publicar el conector de Hidencloud; video mantiene WebRTC/Metered.

Voz y salas: WebRTC/Firebase/Metered por defecto, sin dominio ni WebSocket externo. El acceso público independiente a Mumble queda oculto hasta configurarse expresamente.


## Limpieza de proveedores y menús vigente
Se eliminó la integración externa de voz y su código. Las llamadas usan WebRTC/Firebase/Metered. Cifrado y seguridad se encuentra en información de contacto/grupo, sin aviso superior permanente. Se retiraron Traducir y Elegir otro emoji del menú de mensajes; las reacciones mantienen su selector propio. El menú de conversación incorpora Restringir chat mediante el bloqueo existente.

## Revisión basada en documentación oficial — 30 de octubre de 2026

Se compararon las plataformas con el Centro de ayuda oficial de WhatsApp. Se sustituyeron los recorridos de perfil, temas, listas, difusiones, notificaciones, almacenamiento, ayuda y creación de comunidades; se corrigieron búsqueda, encuestas e imágenes de comunidades/canales. Las difusiones se retiraron posteriormente por decisión del propietario; las reglas rechazan nuevas escrituras de sus listas privadas. Los eventos se crean desde las conversaciones.

La comparación completa, las fuentes oficiales y las diferencias pendientes están en REVISION-REFERENCIAS-WHATSAPP.md. La revisión no usa las capturas del propietario como referencia y no afirma equivalencia del 100 %.
