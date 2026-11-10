> Estado vigente, 31/10/2026: se retiró el cifrado de extremo a extremo para mensajes y archivos nuevos por decisión del propietario. No se generan claves ni se requieren para conversar. Las referencias posteriores al cifrado automático describen versiones anteriores. Se conserva únicamente la lectura y la importación de copias del historial anterior, sin borrar datos. Consulta CIFRADO-Y-LLAMADAS.md.

# Nexus Chat: funciones incorporadas y diferencias pendientes

## Prioridades del 9 de noviembre de 2026

Este bloque registra trabajo pendiente solicitado después de v26.79.4. No describe mejoras visuales ya aplicadas. Las secciones posteriores conservan el inventario histórico de funciones y diferencias.

| Orden | Trabajo pendiente | Comprobación para darlo por terminado | Estado |
| --- | --- | --- | --- |
| 1 | Mejorar el favicon y los iconos de marca, con fondo transparente. | Sustituir favicon.ico, el icono SVG y las variantes PNG de marca; comprobar transparencia real fuera del símbolo, bordes limpios, silueta legible a 16/32 píxeles, consistencia de color y contraste sobre fondos claros y oscuros. Revisar las referencias en la portada, dashboard y pantalla de carga. | Pendiente; inventario inicial realizado. |
| 2 | Ajustar la pestaña de Ajustes. | Revisar distribución, tamaños, navegación, búsqueda y estados; comprobar que cada opción funciona, guarda sus cambios y vuelve al apartado correcto. | En curso: fondo y desvanecimiento móvil en v26.80.3; Cuenta y alineación compartida en v26.81.0. Revisión completa de los demás subapartados pendiente. |
| 3 | Reorganizar categorías y subapartados de Ajustes. | Revisar nombres, orden y accesos, eliminar duplicados o entradas sin función y conservar las preferencias existentes. | Pendiente. |
| 4 | Continuar la información de contacto y de grupos. | Revisar cabecera, datos, multimedia y acciones; comprobar que cada acción actúa sobre el contacto o grupo correcto, respeta permisos y conserva la navegación. | Pendiente. |
| 5 | Completar la revisión visual y funcional del bloque. | Probar Android, iPhone, tablet y computadora; revisar claridad, coherencia, legibilidad, accesibilidad y regresiones de los recorridos anteriores. | Pendiente. |

### Inventario del favicon y los iconos

La inspección del 9 de noviembre confirma que los recursos actuales todavía tienen fondo opaco:

- `public/favicon.ico`: cuatro representaciones de 16, 32, 48 y 64 píxeles; todas con alfa 255 en toda la imagen.
- `public/icons/nexus-32.png`, `nexus-48.png`, `nexus-180.png`, `nexus-192.png`, `nexus-256.png` y `nexus-512.png`: las seis variantes son opacas.
- `public/nexus-icon.svg`: contiene una imagen PNG incrustada que también es opaca.

La tarea requiere sustituir los recursos y verificar sus píxeles; cambiar únicamente el color de fondo del contenedor no la completa. El fondo exterior del símbolo debe ser transparente, sin placa cuadrada incorporada al archivo.

### Seguimiento de este bloque

Avance inicial de implementación terminada y verificada: **celular 0/5 (0 %), tablet 0/5 (0 %) y computadora 0/5 (0 %)**. El inventario no cuenta como un rediseño completado. En v26.80.0 se completó el fondo de la cabecera móvil, una parte del punto 2; ese punto amplio todavía no está cerrado. Se actualizarán los resultados por dispositivo al cerrar los trabajos de la tabla.

El objetivo del 100 % se medirá sobre un alcance de funciones y pantallas definido y comprobado. Las limitaciones externas verificadas del navegador o sistema operativo se anotarán por separado y no entrarán en ese denominador. Los errores de Nexus, las funciones aún no implementadas y las conexiones o permisos pendientes seguirán figurando como pendientes; no se reclasificarán como limitaciones para dar el bloque por terminado.


Revisión: 31 de octubre de 2026. Esta lista describe el código y las pruebas disponibles. No certifica equivalencia ni un porcentaje de similitud con WhatsApp. La vinculación multidispositivo y la instalación como aplicación quedan excluidas por decisión del propietario.

## Incorporado en esta entrega

### Llamadas

- Respuesta de ocupado cuando llega otra llamada durante una conexión activa; el emisor recibe el resultado y deja de timbrar.
- Coordinación de la bandeja de llamadas entre pestañas de una misma cuenta. Se usa el bloqueo compartido del navegador cuando está disponible, con una alternativa local de mejor esfuerzo en otros navegadores. Esto no vincula dispositivos.
- Recuperación automática de conexión: hasta tres intentos de reinicio ICE por incidencia y nuevos intentos al recuperar la conexión a internet. Se conserva un único iniciador de ofertas para reducir conflictos.
- Indicador y panel con latencia y pérdida de paquetes medidas mediante WebRTC. Las estimaciones necesitan tráfico suficiente; se muestra «Sin datos» cuando no se ha obtenido una medición.
- Levantar y bajar la mano, con aviso visible a los participantes tanto en voz como en video.
- Lista de participantes conectados, invitados, rechazos y personas ocupadas. Quien inició la llamada puede volver a llamar a un invitado ausente, con una espera mínima de quince segundos.
- Silenciar a una persona únicamente en la escucha propia. No se apaga a distancia el micrófono de otra persona.
- Cambio de micrófono, cámara activa y salida de audio durante la llamada, según las capacidades del navegador. Durante la pantalla compartida se solicita detenerla antes de cambiar los dispositivos de captura.
- Opción de reincorporación desde el detalle del historial de llamadas grupales que continúen abiertas. Se comprueban pertenencia, cierre y caducidad antes de conectar.
- Se mantienen la tarjeta de llamada entrante, notificación del sistema con permiso y pestaña oculta, barra verde movible, reacciones, video, cambio de cámara, pantalla compartida, programación y enlaces.

### Mensajes y encuestas

- Deshacer «Eliminar para mí» durante cinco segundos. La restauración conserva las marcas personales y no sobrescribe una modificación posterior del mismo registro. Los mensajes pendientes descartados del dispositivo no se recuperan con esta opción.
- Edición de la pregunta de una encuesta propia dentro de quince minutos. La actualización conserva las opciones y los votos que lleguen mientras se edita; también funciona con el contenido cifrado.
- Fecha de cierre opcional de encuestas, hasta treinta y un días, y cierre manual por el autor. Firebase impide modificar los votos después del cierre. Los resultados permanecen visibles.
- Reenvío a un máximo de cinco conversaciones; un mensaje previamente reenviado admite como máximo un grupo por envío. Los marcados como reenviados muchas veces se limitan a una conversación. El contador de la cadena y la etiqueta se conservan en los reenvíos de Nexus.
- Una encuesta reenviada se crea sin los votos ni el cierre de la anterior. No se reenvía un seguimiento de ubicación activo como si fuera uno nuevo.
- Se refuerza la regla que impide volver a editar un mensaje ya eliminado.

### Fotos y estados

- Editor de fotos antes de enviarlas: giro, recorte centrado original/cuadrado/16:9/9:16/4:3, brillo, dibujo, deshacer trazos y texto.
- La copia editada se exporta como JPG con un lado máximo de 2048 píxeles. El archivo original no se modifica. Los cambios de giro o recorte eliminan los dibujos de esa vista.
- El editor también está disponible para fotos de estados.
- Collages de dos a cuatro fotos propias desde Diseño de estado, con revisión antes de publicar.
- Se pueden quitar archivos individuales de la selección previa al envío sin descartar los demás.

### Audio y ubicación

- Transcripción automática opcional de audios visibles desde Ajustes → Chats. Activarla autoriza enviar esos audios a Groq; la caché es temporal y el texto no se guarda en Firebase. No equivale a transcripción local de WhatsApp.
- Ubicación en tiempo real durante quince minutos, una hora u ocho horas. Se solicita permiso al elegir compartir, se limitan las actualizaciones aproximadamente a una cada quince segundos y aparece un aviso con opción de detenerlas.
- Las coordenadas se cifran para los participantes antes de almacenarlas. Firebase impide que un destinatario modifique la ubicación del remitente, extienda su duración o reanude un registro detenido.
- El seguimiento necesita que el navegador mantenga Nexus funcionando y conceda acceso a la ubicación. Al salir de la página se detiene el seguimiento local y se intenta confirmar la detención. Al llegar a la duración máxima deja de actualizarse y de mostrarse como activo aunque no se pueda confirmar la escritura final.
- El mapa externo solo se abre al elegir «Ver ubicación». Los registros caducados o detenidos pueden conservar su último punto cifrado; caducar no implica borrado físico de Firebase.

## Lo que sigue pendiente o es parcial

### 1. Llamadas y notificaciones

- Espera nativa de llamadas, contestar desde la pantalla bloqueada y ventanas por encima de otras aplicaciones.
- Cambiar entre dos llamadas retenidas sin finalizar ninguna.
- Desenfoque y efectos de cámara con rendimiento uniforme, control avanzado Bluetooth y salida por auricular/altavoz de teléfono.
- Entrega push garantizada con el navegador cerrado o suspendido. Los avisos actuales requieren que el navegador mantenga Nexus en ejecución.
- Recuperación de toda interrupción posible de red, suspensión o hardware. Los intentos automáticos tienen un límite; no garantizan reconexión en todas las redes.
- Pruebas físicas en Android, iPhone, tablets, Bluetooth y redes distintas.

### 2. Mensajes y encuestas

- Conservar mensajes temporales con solicitud, consentimiento y veto del remitente en todos los recorridos.
- Encuestas con fotos, anonimato de voto real y cuestionarios. El modelo actual mantiene votos asociados a participantes; no se anuncia anonimato sin cambiarlo.
- Resolución más completa de conflictos de edición y entrega tras desconexiones muy largas.
- Los límites de reenvío de la interfaz no son una medida completa contra clientes modificados o abuso.

### 3. Multimedia y audio

- Visualización única con control de apertura completo. La web no puede impedir capturas o grabaciones de pantalla del destinatario.
- Recorte libre desplazable, edición de video, recorte temporal, capas movibles, filtros avanzados y exportación HD de video uniforme.
- Música con catálogo licenciado, mezcla de audio y video, efectos, menciones y stickers integrados en un editor de estados completo.
- Transcripción íntegramente local, disponible de manera uniforme en todos los navegadores, sin enviar el audio a un proveedor.
- Mayor validación de videos circulares, códecs, interrupciones por llamadas telefónicas y suspensión de grabaciones.
- Los GIF animados no se ofrecen al editor JPG para conservar su animación.

### 4. Grupos, comunidades y canales

- Administración a mayor escala, avisos y moderación más avanzada de comunidades.
- Gestión ampliada de administradores de canales, métricas verificadas, programación de publicaciones y enlaces/QR de seguimiento completos.
- Anonimato de seguidores: no se garantiza con el modelo actual de participantes.
- Los canales, contactos, GIF y stickers de Nexus no acceden a directorios ni paquetes propietarios de WhatsApp.

### 5. Privacidad, recuperación y operación

- El protocolo propio de cifrado de Nexus no tiene auditoría independiente ni todas las propiedades del protocolo de WhatsApp, como secreto hacia adelante. No oculta participantes, horas y otros metadatos.
- Copias completas automatizadas, restauración integral probada, supervisión operativa y limpieza programada fiable de registros y fragmentos caducados.
- No se garantiza borrado administrativo automático de cuentas ni moderación permanente sin tareas privilegiadas adicionales.
- Agenda nativa completa, líneas telefónicas reales verificadas, biometría nativa universal y llaves de acceso equivalentes.
- Resúmenes, escritura, generación visual y organización de paquetes con una integración y disponibilidad equivalentes a Meta AI y WhatsApp.
- Auditoría de accesibilidad completa, historiales muy grandes y consumo de memoria en teléfonos modestos.

## Límites que se conservan

- Seis participantes por llamada, cien por grupo/canal y veinte MB por archivo en el almacenamiento actual.
- Firebase, Metered, Groq y OpenRouter conservan sus cuotas y condiciones. No se habilita facturación nueva ni un proveedor adicional para cubrir las diferencias.
- Las credenciales de proveedores del frontend siguen siendo públicas según la autorización previa del propietario. No se ocultan mediante bloqueo de F12.
- Los permisos del navegador y del sistema operativo siguen siendo obligatorios. La web no puede garantizar micrófono, cámara, ubicación, sonido o avisos cuando el sistema los bloquea.
- Las reglas de Firebase siguen sin fecha global de caducidad de prueba. Los permisos por cuenta, pertenencia y contenido continúan aplicándose; no se abren las bases para incorporar estas funciones.

## Referencias oficiales utilizadas

- [Llamadas y participación](https://www.whatsapp.com/calling).
- [Llamadas grupales](https://faq.whatsapp.com/829612741557179/?cms_platform=web).
- [Mejoras de llamadas: participantes y enlaces](https://blog.whatsapp.com/improved-calling-on-whatsapp).
- [Planificación, mano levantada y reacciones](https://blog.whatsapp.com/calling-on-whatsapp-new-ways-to-plan-ahead-and-take-part).
- [Encuestas](https://faq.whatsapp.com/796470361614974/?cms_platform=web).
- [Nuevas opciones de encuestas](https://blog.whatsapp.com/your-group-chats-upgraded-introducing-better-polls-all-and-more).
- [Límites de reenvío](https://faq.whatsapp.com/1053543185312573).
- [Eliminar y deshacer](https://faq.whatsapp.com/1370476507114859/?cms_platform=iphone&locale=en_US).
- [Transcripciones de voz de WhatsApp](https://blog.whatsapp.com/introducing-voice-message-transcripts).
- [Servicio de transcripción utilizado por Nexus](https://console.groq.com/docs/speech-to-text).
- [Estadísticas de conexión del navegador](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/getStats).

Las pruebas de interfaz usan datos aislados, cámaras simuladas y varias resoluciones. Las de permisos usan emuladores Firebase, con criptografía real para los casos cifrados. No sustituyen pruebas físicas en todos los dispositivos. Los resultados exactos de esta entrega se guardan en los informes de verificación que acompañan al proyecto.

## Referencias de Cuenta y Drive recibidas el 9 de noviembre

La [correspondencia de las 15 capturas y la imagen de informes](REFERENCIAS-CUENTA-DRIVE.md) recoge las pantallas incorporadas y los recorridos pendientes. Drive dispone de módulos preparados con pruebas simuladas; su API sigue deshabilitada y no existe una acción de copia activa. Faltan referencias de copia/restauración, consentimiento y verificación real. También permanecen pendientes llaves de acceso, segundo factor, dispositivos de confianza, cambio de teléfono, formularios de cambio de correo/usuario, eliminación de usuario y clave de contacto.

## Info. de contacto — v26.84.0

Consulta [las funciones y recorridos pendientes](INFO-CONTACTO-REFERENCIAS.md). Siguen pendientes eliminación de caché con confirmación referenciada, tonos/vibraciones por contacto, visibilidad multimedia, ocultación y restricciones completas, traducción y formularios de grupos. La verificación del cifrado depende de un sistema real; no se simula.
