# Historial de interfaz

[Volver al README](../README.md)

Estas notas describen revisiones anteriores; el README resume el estado vigente.

## Audio y apariencia

| Apartado | Comportamiento |
| --- | --- |
| Audio en el chat | Ondas y control de posición alineados; contador de tiempo transcurrido durante la reproducción. |
| Reproductor superior | Se muestra al salir del chat de origen, con pausa, progreso y cierre; sin selector de velocidad. |
| Transcripciones | Ajustes → Chats permite activar la transcripción automática de audios visibles mediante Groq. Desactivada por defecto; consentimiento en el ajuste, caché temporal y sin almacenar el texto en Firebase. |
| Colores | Paleta predeterminada con fondo, barras y burbujas diferenciados; se conservan las paletas elegidas por el usuario. |

Actualización móvil: aviso persistente de versión pendiente sobre la navegación y acceso adicional desde Ajustes → Chats. Vista previa de audio con control de posición limitado a las ondas, compositor redondeado y recuperación del dispositivo predeterminado si una selección guardada ya no existe. La revisión inicial aparece una sola vez por navegador y muestra únicamente cámara, micrófono, notificaciones y ubicación. Cada permiso lo decide el navegador; denegarlo no bloquea los mensajes de texto. Los archivos se eligen al compartirlos, sin un permiso de almacenamiento ni un selector de fotos en esta revisión.

## Referencias móviles de noviembre

Estados disponibles en Novedades, sin barra ni gesto de despliegue dentro de Chats. Anillos centrados por actualización, indicador de novedades, respuestas a estados con texto/emojis/stickers guardados y Me gusta persistente. Grabación móvil con mantener pulsado, cancelar al deslizar, bloqueo hacia arriba, pausa/reanudación y envío al soltar. La velocidad ocupa la foto al seleccionar un audio. El compositor y estos estilos se aplican solo a Messenger.

Audio de una sola escucha: la apertura se registra mediante una transacción en el registro privado del destinatario. Al abrir se consume, incluso si después se interrumpe la reproducción. La interfaz excluye estos audios de reproducción automática, biblioteca, descarga y reenvío. Es un control de la aplicación: no impide grabaciones externas ni extracción de datos por un cliente modificado; no borra automáticamente el archivo del almacenamiento. Los últimos seis stickers enviados se conservan localmente para responder a estados.

Corrección de voz móvil: captura del gesto sobre el pie del chat que permanece montado, candado a la derecha y panel independiente con dos filas. La vista previa se genera como WAV PCM mono a 22,05 kHz para evitar fragmentos de contenedor incompletos al pausar; también se utiliza para enviar cuando hay muestras disponibles. Se comprueban toque nativo, señal de audio decodificable y avance de reproducción, además de las pruebas de interfaz.

## Nexus AI renovado

Interfaz propia con propuestas, conversación, búsqueda, emojis y creación de imágenes mediante órdenes en español. Visor y descarga de imágenes, historial local y acciones de detener o borrar. No se muestran marcas de los servicios de IA en su interfaz ni en el ajuste de transcripciones. La configuración local incorpora `pollinationsKey` y, opcionalmente, `pollinationsModel`; la plantilla publicada está vacía.

### Ajustes de conversación y voz

| Apartado | Comportamiento |
| --- | --- |
| Menú del chat | Iconos en opciones y submenús móviles; posición ajustada al espacio disponible. |
| Presencia | Fechas de Firebase, reloj sincronizado y reconexión al recuperar la pestaña. Se respetan los ajustes de privacidad. |
| Audios | Controles integrados en el color de la conversación, sin un segundo fondo. |
| Nexus AI | Una barra de información, búsqueda, exportación y vaciado; entrada por voz, sin selector de emojis. |
| Entrada por voz de IA | Graba con permiso de micrófono, procesa la voz y envía la consulta transcrita. La grabación no se guarda como archivo de chat. |
| Canales | Categoría retirada de la navegación de escritorio y móvil; no se borran los datos existentes. |
| Llamadas | Accesos a nueva llamada, programación y creación de enlace. |

### Pantalla completa en móviles y tablets

En **Configuración → Pantalla completa** se puede ocultar la interfaz del navegador cuando su API lo permite. El control refleja el estado real y permite salir. No aparece en computadora, no instala una aplicación y no se activa sin una pulsación. Los navegadores que no admiten pantalla completa de páginas muestran la opción como no disponible.

El indicador de mensajes temporales conserva su diseño circular anterior en la lista de chats.

La documentación complementaria está organizada en [docs/INDICE.md](INDICE.md); el README principal describe el estado vigente del proyecto.

### Barras de audio y escritura

| Interfaz | Comportamiento |
| --- | --- |
| Reproductor fuera del chat | Pausa o reproducción a la izquierda, foto y nombre del remitente en el centro, cierre a la derecha y progreso real del audio en el borde inferior. Tocar el remitente vuelve a la conversación. |
| Barra móvil de mensajes | Campo en forma de cápsula con expresiones, adjuntos y cámara; botón de micrófono o envío separado. Conserva el tema de Nexus y los gestos de grabación. |

### Revisión de escritorio y herramientas · 5 de noviembre de 2026

| Apartado | Mejoras |
| --- | --- |
| Actualizaciones móviles | Aviso independiente de los paneles de la aplicación, recuperación del pendiente al volver, comprobación al restaurar una pestaña y reintento si falla la red. La descarga sigue siendo manual, con bytes medidos y pausa/reanudación. |
| Escritorio | Submenús con flechas, Inicio/Fin y Escape; retorno al control de origen sin quitar el foco a un diálogo nuevo. La posición se adapta al redimensionar o desplazar. |
| Pantalla completa | Solo móvil/tablet. Botón de salida accesible desde cualquier apartado, adaptable al teclado y separado del aviso de actualización. Distingue pantalla completa de la página y de un video. |
| Estadísticas del dashboard | CSV de recuentos, fecha de lectura y opción para detener el escaneo. No exporta el contenido de los mensajes. |
| Acciones del dashboard | Protección contra doble clic y ciclos automáticos repetidos; validación de fechas y detención si otra pestaña pausa o reprograma el plan. |

Una sesión que ya ha cargado la versión vigente no muestra una actualización pendiente ficticia. Una sesión antigua detecta la publicación al volver a primer plano o durante la comprobación periódica. La pantalla completa depende de la API del navegador y no instala una aplicación. No se ejecutó ninguna limpieza de producción durante esta revisión.

### Correcciones de recuadros y emojis

- Selectores de emojis: nueve categorías, búsqueda por varias palabras, reintento de carga, historial tolerante a almacenamiento lleno o corrupto y botones que no envían formularios al seleccionar.
- Encuestas, eventos, perfiles, contactos y adjuntos: límites de altura, desplazamiento y controles adaptados a ventanas pequeñas y orientación horizontal.
- Llamadas e historial: paneles excluyentes, prevención de acciones duplicadas, errores visibles y copia de enlaces con alternativa compatible.
- Estados: los medios privados esperan su URL antes de intentar reproducirse.
- Nexus AI: visor con cierre por Escape o retroceso móvil, foco controlado y referencias de imagen actualizadas.

Las comprobaciones emplean datos simulados y varios tamaños de navegador; no sustituyen una prueba de llamadas entre dispositivos físicos ni garantizan ausencia de todo error en cualquier navegador.

### Acciones de mensajes y pantallas de televisión

| Apartado | Comportamiento |
| --- | --- |
| Mensajes de escritorio | Flecha dentro de la burbuja y reacción fuera: a la derecha en mensajes recibidos y a la izquierda en propios. Menús diferenciados con iconos, divisores, cierre exterior y Escape. |
| Reacciones | Barra rápida y selector ampliado con categorías, búsqueda e historial reciente. Errores de guardado permiten reintentar. |
| Consulta a Nexus AI | El mensaje recibido se cita con su remitente encima del campo de escritura. Puedes quitarlo o escribir tu consulta antes de enviarla. |
| Televisores | Detección de navegadores de TV y opción en Ajustes → Chats → Pantalla de televisión. Controles amplios y navegación por flechas con foco visible. |

Las interfaces móviles mantienen sus controles propios. En pantallas de TV menores de 1024 píxeles se usa la distribución compacta. Cámara, micrófono, compartir archivos y otras capacidades dependen del navegador. No se ha probado un televisor físico.

**Límites de las acciones:** Conservar guarda el mensaje en tus destacados personales; no evita la caducidad ni la limpieza mensual. Guardar como, Compartir y Abrir con aparecen en mensajes multimedia compatibles, sin permitir exportar notas de una sola escucha. Abrir con abre el archivo en una pestaña para que el navegador lo gestione; no puede elegir una aplicación del sistema. Reportar utiliza el informe de la conversación existente.

### Burbujas, reacciones y avisos

| Apartado | Actualización |
| --- | --- |
| Mensajes de escritorio | Burbujas ajustadas al texto, hora compacta y reacciones sin ensanchar el mensaje. |
| Reacciones | Panel anclado con recuentos, filtros y retirada de tu reacción; menús y selectores con animación que respeta el movimiento reducido. |
| Sonidos | Tono original de envío separado del aviso de recepción. Los mensajes del chat abierto también pueden sonar; se respetan silencios y preferencias existentes. |
| Avisos | Tarjetas apiladas, abrir conversación, cierre, pausa al leer, privacidad de vista previa y prevención de duplicados. Diseño y duración mantenidos en notificationDesign.ts y su hoja de estilos. |

Los avisos nativos requieren autorización del navegador. El sistema actual detecta mensajes mientras la página sigue ejecutándose; no existe un servicio conectado que garantice entrega push con el navegador cerrado. Los sonidos dependen del permiso de reproducción del navegador. No se añade un editor de diseño para usuarios.

### Menús, selección y grabación de escritorio

| Interfaz | Comportamiento |
| --- | --- |
| Clic derecho en el fondo del historial | Solo Seleccionar mensajes y Cerrar chat. No se extiende al encabezado ni al resto de la aplicación. |
| Clic derecho en una burbuja | Opciones del mensaje concreto: información para propios, reporte para recibidos y consulta a Nexus AI para ambos. |
| Selección | Casillas por mensaje, contador y barra inferior con copiar, conservar en destacados, eliminar, reenviar y descargar medios compatibles. Eliminar mantiene su confirmación. |
| Escritura | Cápsula única de escritorio con adjuntos, expresiones, texto y micrófono o envío. |
| Grabación | Cápsula de ancho completo; nivel del micrófono, contador, pausa, preescucha con posición real, reanudación, eliminación y envío. La interfaz móvil se conserva separada. |

Referencia funcional para seleccionar y reenviar varios mensajes: [Centro de ayuda oficial de WhatsApp](https://faq.whatsapp.com/887468535575482/?cms_platform=web). Las pruebas de grabación utilizaron micrófono simulado; la captura real depende del permiso y dispositivo del navegador.
