> Revisión posterior: consulta REVISION-GRUPOS-LLAMADAS.md. Ya se añadieron permisos de miembros, invitaciones con aprobación, fichas ampliadas y sonidos de llamada.

# Nexus Chat y WhatsApp: estado comprobable

Revisión del 27 de octubre de 2026. Se compara la implementación del proyecto con las funciones públicas de WhatsApp, excluyendo expresamente la vinculación y gestión multidispositivo. No existe una métrica que certifique un porcentaje de equivalencia visual o funcional; esta revisión no afirma un 100 %.

## Cambios de esta entrega

- Inicio: una pantalla de marca, una sola animación discreta, texto «Preparando tus conversaciones», respeto por movimiento reducido, espera sin conexión y reintento si tarda. La misma presentación aparece antes de cargar React, evitando el fondo vacío inicial. La barra indica actividad, no un porcentaje inventado.
- Ubicación: el clip permite obtener la posición con permiso o introducir coordenadas, revisar el punto en un mapa y enviar un enlace como mensaje. No obtiene la ubicación al abrir el diálogo, no hace seguimiento y no la envía sin confirmación. Usa OpenStreetMap, sin claves ni API de pago. Abrir el mapa externo comunica la visita al proveedor del mapa.
- Multimedia: se puede añadir un comentario independiente a cada foto o video en la revisión de archivos. Se conserva en el mensaje y se muestra junto al archivo. El envío multimedia también conserva la respuesta citada seleccionada.
- Búsqueda: filtro por fecha junto con palabra y tipo, cantidad de resultados del historial cargado y un acceso para cargar páginas anteriores. Al cerrar la búsqueda se restablece la conversación completa. No se presenta como un índice completo del servidor.
- Formato: listas numeradas y citas con `> `, además de negrita, cursiva, tachado, listas con viñetas y código. Ctrl/Cmd+B, Ctrl/Cmd+I y Ctrl/Cmd+Shift+S aplican formato al texto seleccionado del editor. Copiar y pegar siguen siendo atajos del navegador.
- Se retiró la pantalla residual «Acceso desde otros dispositivos». No se añadió vinculación por QR, gestión de dispositivos ni transferencia de llamadas entre dispositivos. El inicio de sesión ordinario y la protección de la cuenta se conservan.

## Funciones que ya existen en el proyecto

| Área | Implementación actual | Diferencia o límite relevante |
|---|---|---|
| Texto | Envío, respuestas citadas, emoji, edición de 15 minutos y aviso de edición | No es el protocolo de WhatsApp ni se conecta a sus usuarios |
| Mensajes | Reenvío, información de entrega y lectura, selección múltiple, eliminar para mí/para todos | Las fechas detalladas requieren mensajes de la versión que registra recibos |
| Organización | Archivar, tres chats fijados, favoritos, destacados privados, mensajes fijados, filtros y listas | Parte de las preferencias y borradores se guarda en el navegador |
| Conexión | Cola local persistente, reintento con identificador estable y páginas de historial | La búsqueda por fecha filtra las páginas cargadas; hay que cargar más para ampliar resultados |
| Voz y video corto | Grabar, pausar, revisar, descartar, notas de voz y videos circulares; reproducción 1x/1.5x/2x | Sin transcripción de notas ni edición avanzada de video |
| Archivos | Fotos, videos, audio, documentos, revisión, comentarios, copiar/pegar, arrastrar y soltar | Transferencia por fragmentos y URLs autenticadas; máximo configurado de 2 GB, no certificado en producción con archivos de ese tamaño |
| Biblioteca | Multimedia, documentos, enlaces, búsqueda, orden, selección, descarga y borrado personal | Depende del historial accesible y de los archivos conservados en el backend |
| Expresión | Catálogo de emojis, GIF y stickers incluidos, creación de stickers, fondos y tonos propios | No tiene el catálogo comercial de WhatsApp ni búsqueda de GIF en un catálogo mundial |
| Encuestas | Opciones únicas o múltiples y votos de participantes | No equivale al sistema completo de eventos y asistencia |
| Ubicación | Punto estático compartido por enlace y con permiso | Sin ubicación en tiempo real ni búsqueda de establecimientos |
| Grupos | Creación, foto, descripción, participantes, administradores, permisos, invitaciones aprobadas, etiquetas y registro de cambios | Requiere ampliar administración y privacidad para equivalencia con grupos grandes |
| Comunidades | Creación, grupos temáticos y avisos según los permisos existentes | No se ha validado equivalencia completa de moderación, invitaciones y gran escala |
| Estados | Texto, foto, video, audio, color/fuente, visor, recientes/vistos/ocultos, reacciones y privacidad | Sin música licenciada, menciones privadas, collage ni editor gráfico completo |
| Canales | Crear, buscar, seguir y publicar con permisos | Límite actual de 100 miembros; no garantiza anonimato equivalente ni seguidores ilimitados |
| Difusiones | Listas y distribución del mensaje mediante el flujo implementado | No es la infraestructura de difusión ni la moderación de WhatsApp |
| Llamadas | Voz, video, grupos, favoritos, historial, pantalla, enlaces y programación | Máximo actual de seis participantes; programación dentro de la vigencia de enlaces, no llamada automática |
| Privacidad | Audiencias, contactos, bloqueos, presencia, confirmaciones, silenciamiento y temporales | Temporales oculta al caducar; no garantiza borrado físico inmediato ni revoca copias |
| Ajustes | Perfil, cuenta, privacidad, apariencia, notificaciones, almacenamiento y accesibilidad | Algunas opciones dependen del navegador y no son ajustes nativos del teléfono |
| Nexus AI | Chat, borradores, historial local, detener respuesta, traducción y ayuda de escritura | Depende de disponibilidad y cuota gratuita de los proveedores configurados; no es Meta AI |
| Notificaciones | Avisos de la web y del sistema mediante permisos y servicio push existente | No garantiza ejecución con el navegador o sistema suspendido |

Las funciones existentes fueron verificadas en entregas anteriores. Las pruebas de esta entrega se registran por separado en `verificacion-inicio-funciones.json`; los informes no deben confundirse con pruebas en todos los teléfonos físicos o con una auditoría independiente.

## Lo que falta para aproximarse a toda la experiencia de WhatsApp

1. **Cifrado de extremo a extremo real** de mensajes y archivos: gestión de claves exclusivas de participantes, identidad, renovación de claves, verificación, recuperación y auditoría especializada. Las reglas de Firebase y los permisos del backend son controles de acceso. El administrador autorizado de esos servicios puede acceder a contenido; no son E2EE. Las llamadas usan el cifrado de transporte del navegador, sin certificación equivalente de identidad de participantes.
2. **Eventos dentro del chat** con asistencia, cambios, cancelaciones, recordatorios y permisos. Por ahora se comparte un archivo `.ics`; no hay RSVP ni agenda compartida persistente.
3. **Llamadas de mayor capacidad y calidad**: arquitectura de conferencia para aproximarse a 32 participantes, sala de espera/admisión, reacciones, levantar la mano, mejor adaptación de calidad y pruebas en redes móviles reales. Aumentar un número en la interfaz no resuelve esa capacidad.
4. **Ubicación en tiempo real** con caducidad y revocación, menciones con avisos y navegación, conservación autorizada de temporales, y apertura única con permisos y ciclo de vida propios. Una web no puede garantizar el bloqueo de capturas de pantalla.
5. **Editor de medios completo**: recorte, giro, dibujo, texto, desenfoque, recorte de video y anotaciones; catálogo ampliado y búsqueda externa de GIF y stickers. No se puede copiar un catálogo comercial o música licenciada sin sus permisos.
6. **Estados más completos**: menciones privadas, composiciones/collages, compartir de nuevo con autorización y herramientas de edición. Música comercial requiere un servicio y derechos adecuados.
7. **Grupos, comunidades y canales a mayor escala**: moderación con atención real y gestión a gran escala, privacidad de integrantes/seguidores garantizada por el diseño de datos, administración de invitaciones y mecanismos de reporte y abuso con atención real.
8. **Seguridad de acceso adicional**: llaves de acceso, verificación en dos pasos y bloqueo local con un diseño de recuperación. No debe añadirse un interruptor de biometría que no proteja realmente el contenido. Queda fuera la vinculación multidispositivo por decisión del usuario.
9. **Copia de seguridad y recuperación**: exportación/restauración de mensajes y archivos con integridad, versiones, gestión de espacio y cifrado. La exportación actual a texto no sustituye una copia recuperable completa.
10. **Funciones nativas y accesibilidad avanzada**: llamadas y avisos persistentes con el sistema suspendido, integración profunda de galería y contactos, accesibilidad auditada con lectores de pantalla y transcripción de audio. Algunas requieren capacidades de aplicación instalada o servicios adicionales.
11. **Producción**: backend HTTPS permanente con disco persistente, dominio, entrega push en dispositivos reales, métricas, recuperación ante fallos, pruebas de carga, límites y moderación. Firebase Hosting por sí solo no ejecuta el servidor privado Node. La configuración está preparada; falta definir su alojamiento público y comprobar todo el recorrido antes de publicar.

Se han mantenido servicios y bibliotecas gratuitos en esta entrega. Una función técnicamente implementable no garantiza que su operación a gran escala sea gratuita o que un navegador permita todas las capacidades nativas. No se añadieron pagos ni nuevos servicios facturados.

## Referencias oficiales consultadas

- [Mensajería](https://www.whatsapp.com/messaging?lang=es) y [grupos, encuestas y eventos](https://www.whatsapp.com/groups).
- [Llamadas y pantalla compartida](https://www.whatsapp.com/calling); [nuevas funciones web, sala de espera y llamadas](https://about.fb.com/news/2026/07/whatsapp-web-calling-new-features/).
- [Formato de mensajes](https://faq.whatsapp.com/539178204879377/) y [edición durante quince minutos](https://about.fb.com/news/2023/05/edit-whatsapp-messages/).
- [Estados](https://www.whatsapp.com/status) y [música, diseños y stickers](https://about.fb.com/news/2025/05/new-music-layout-sticker-options-whatsapp-status/).
- [Canales](https://faq.whatsapp.com/265055289421317) y [privacidad](https://www.whatsapp.com/privacy).

La comparación es una revisión del código de Nexus y de estas descripciones públicas, no una certificación de WhatsApp ni una copia de su servicio.

## Verificación de esta entrega

- 13 comprobaciones nuevas: inicio a 360, 768 y 1366 px, movimiento reducido, desconexión y recuperación, revisión y envío de ubicación, atajos, comentario de archivo, listas y citas, búsqueda por fecha y cierre de la búsqueda en móvil y tablet.
- 25 comprobaciones funcionales de regresión de escritorio y 40 de móvil y tablet; sin errores del navegador en sus informes. La limpieza de un archivo de prueba en Windows necesitó reintento; se comprobaron y retiraron los archivos temporales antes de empaquetar.
- Comprobación de tipos y compilación final de producción correctas. La compilación conserva un aviso sobre el tamaño del paquete JavaScript principal; queda margen para dividir más la carga inicial.
- Web local y backend disponibles; el servidor rechaza el acceso a su archivo privado de configuración. Los ensayos usan datos ficticios locales y no publican conversaciones ni consumen cuotas de IA.
- Las reglas y el backend no cambiaron en esta entrega; no se volvieron a desplegar reglas ni se publicó Hosting. Las pruebas anteriores de esos servicios no se presentan como nuevas pruebas de esta revisión.
